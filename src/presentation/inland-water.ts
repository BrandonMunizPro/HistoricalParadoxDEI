import type { ImportedGeographicDataset } from '../infrastructure/geographic-dataset.js';
import { TERRAIN_HEIGHT_SCALE } from './terrain-presentation.js';
export type WaterRing = readonly (readonly [number, number])[];
export interface InlandWaterPolygon {
  readonly rings: readonly WaterRing[];
  readonly bounds: ImportedGeographicDataset['bounds'];
}
export function waterPolygon(rings: readonly WaterRing[]): InlandWaterPolygon {
  const outer = rings[0];
  if (!outer || outer.length < 4) throw new RangeError('Invalid water polygon');
  return {
    rings,
    bounds: {
      west: Math.min(...outer.map((p) => p[0])),
      east: Math.max(...outer.map((p) => p[0])),
      south: Math.min(...outer.map((p) => p[1])),
      north: Math.max(...outer.map((p) => p[1])),
    },
  };
}
export function insideWaterRing(
  lon: number,
  lat: number,
  ring: WaterRing,
): boolean {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const a = ring[i]!,
      b = ring[j]!;
    if (
      a[1] > lat !== b[1] > lat &&
      lon < ((b[0] - a[0]) * (lat - a[1])) / (b[1] - a[1]) + a[0]
    )
      inside = !inside;
  }
  return inside;
}
export function insideWater(
  lon: number,
  lat: number,
  p: InlandWaterPolygon,
): boolean {
  return (
    insideWaterRing(lon, lat, p.rings[0]!) &&
    !p.rings.slice(1).some((r) => insideWaterRing(lon, lat, r))
  );
}
/** Same endpoint-aligned samples as the existing coast masks; holes remain dry islands. */
export function inlandWaterMask(
  bounds: ImportedGeographicDataset['bounds'],
  size: number,
  polygons: readonly InlandWaterPolygon[],
): Uint8Array {
  if (!Number.isSafeInteger(size) || size < 2 || size > 4097)
    throw new RangeError('Invalid water mask size');
  const result = new Uint8Array(size * size),
    sx = (size - 1) / (bounds.east - bounds.west),
    sy = (size - 1) / (bounds.north - bounds.south);
  for (const p of polygons) {
    if (
      p.bounds.east < bounds.west ||
      p.bounds.west > bounds.east ||
      p.bounds.north < bounds.south ||
      p.bounds.south > bounds.north
    )
      continue;
    const first = Math.max(0, Math.ceil((bounds.north - p.bounds.north) * sy)),
      last = Math.min(
        size - 1,
        Math.floor((bounds.north - p.bounds.south) * sy),
      );
    // Build one feature at a time so holes never erase another water polygon.
    for (let row = first; row <= last; row++) {
      const lat = bounds.north - row / sy,
        cross: number[] = [];
      for (const ring of p.rings)
        for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
          const a = ring[i]!,
            b = ring[j]!;
          if (a[1] > lat !== b[1] > lat)
            cross.push(a[0] + ((b[0] - a[0]) * (lat - a[1])) / (b[1] - a[1]));
        }
      cross.sort((a, b) => a - b);
      for (let i = 0; i + 1 < cross.length; i += 2) {
        const start = Math.max(0, Math.ceil((cross[i]! - bounds.west) * sx)),
          end = Math.min(
            size - 1,
            Math.floor((cross[i + 1]! - bounds.west) * sx),
          );
        // A concave polygon can intersect this tile overall while this span is
        // entirely to its west. TypedArray.fill interprets negative indices
        // relative to the WHOLE array, flooding unrelated rows in that case.
        if (start <= end)
          result.fill(255, row * size + start, row * size + end + 1);
      }
    }
  }
  return result;
}
export function subtractInlandWater(land: Uint8Array, water: Uint8Array): void {
  if (land.length !== water.length)
    throw new RangeError('Mismatched shore masks');
  for (let i = 0; i < land.length; i++) if (water[i]) land[i] = 0;
}
/** Signed source metres remain signed; retain existing 2 m positive ground display minimum. */
export function sourceTerrainHeight(metres: number): number {
  if (!Number.isFinite(metres)) throw new RangeError('Invalid elevation');
  return metres < 0
    ? (metres / 1000) * TERRAIN_HEIGHT_SCALE
    : Math.max(0.002, (metres / 1000) * TERRAIN_HEIGHT_SCALE);
}
/** Bathymetry is not a surface datum: prefer recurring flat samples, not the lake-bed median. */
export function estimateWaterLevel(
  p: InlandWaterPolygon,
  grid: ImportedGeographicDataset,
): { metres: number; samples: number; support: number; method: string } {
  const counts = new Map<number, number>();
  let samples = 0;
  const b = grid.bounds,
    xs = (grid.width - 1) / (b.east - b.west),
    ys = (grid.height - 1) / (b.north - b.south);
  for (
    let row = Math.max(0, Math.ceil((b.north - p.bounds.north) * ys));
    row <=
    Math.min(grid.height - 1, Math.floor((b.north - p.bounds.south) * ys));
    row++
  )
    for (
      let col = Math.max(0, Math.ceil((p.bounds.west - b.west) * xs));
      col <=
      Math.min(grid.width - 1, Math.floor((p.bounds.east - b.west) * xs));
      col++
    ) {
      if (!insideWater(b.west + col / xs, b.north - row / ys, p)) continue;
      const v = Math.round(grid.elevations[row * grid.width + col]!);
      counts.set(v, (counts.get(v) ?? 0) + 1);
      samples++;
    }
  const sorted = [...counts].sort((a, b) => b[1] - a[1] || a[0] - b[0]);
  if (sorted.length)
    return {
      metres: sorted[0]![0],
      samples,
      support: sorted[0]![1] / samples,
      method: 'modal-source-grid-estimate; not a verified historical datum',
    };
  // No invented datum for unresolved tiny bodies; caller can use an explicitly provisional shore estimate.
  return {
    metres: 0,
    samples: 0,
    support: 0,
    method: 'no-interior-grid-samples',
  };
}
