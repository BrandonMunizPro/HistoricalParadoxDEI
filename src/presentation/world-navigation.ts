import type { ImportedGeographicDataset } from '../infrastructure/geographic-dataset.js';

type Bounds = ImportedGeographicDataset['bounds'];
/** Rendering coverage only; does not resolve campaign scope or political boundaries. */
export const WORLD_RENDER_BOUNDS: Bounds = {
  west: -12,
  east: 75,
  south: 12,
  north: 62,
};
export const REGION_VIEWS = {
  mediterranean: { lon: 13, lat: 37, distance: 5200 },
  greeceDetail: { lon: 22.8, lat: 37.56, distance: 8, local: true },
  egyptDetail: { lon: 32.57, lat: 25.74, distance: 9, local: true },
  northAfrica: { lon: 12, lat: 28, distance: 2600 },
  iberia: { lon: -4, lat: 40, distance: 1500 },
  italy: { lon: 13.5, lat: 41.5, distance: 1350 },
  greece: { lon: 23, lat: 38, distance: 1100 },
  egypt: { lon: 30.5, lat: 28, distance: 1800 },
  anatolia: { lon: 33.5, lat: 39, distance: 1400 },
  mesopotamia: { lon: 44, lat: 33, distance: 1400 },
  east: { lon: 70, lat: 35, distance: 1650 },
} as const;

export function containsCoordinate(
  b: Bounds,
  lon: number,
  lat: number,
): boolean {
  return lon >= b.west && lon <= b.east && lat >= b.south && lat <= b.north;
}

/** Choose a detail family, never layer two incompatible regional grids together. */
export function terrainDetailFamily(
  lon: number,
  lat: number,
  distance: number,
  detailAreas: readonly {
    id?: string;
    bounds: Bounds;
    maximumCameraDistanceKm: number;
  }[],
): string {
  if (distance > 6000) return 'context';
  const area = detailAreas.find(
    (a) =>
      containsCoordinate(a.bounds, lon, lat) &&
      distance < a.maximumCameraDistanceKm,
  );
  return area ? (area.id ?? 'italy') : 'world';
}

export interface SyntheticMarker {
  readonly id: string;
  readonly lon: number;
  readonly lat: number;
  readonly synthetic: true;
}
/** Deliberately artificial, separate from the atlas and simulation. */
export function syntheticMarkerFixture(
  count: number,
  b: Bounds = WORLD_RENDER_BOUNDS,
): readonly SyntheticMarker[] {
  if (!Number.isSafeInteger(count) || count < 0 || count > 100_000)
    throw new RangeError('Invalid fixture size');
  const radical = (value: number, base: number): number => {
    let result = 0,
      f = 1 / base;
    while (value > 0) {
      result += f * (value % base);
      value = Math.floor(value / base);
      f /= base;
    }
    return result;
  };
  return Array.from({ length: count }, (_, i) => ({
    id: `synthetic-only:${i}`,
    synthetic: true as const,
    lon: b.west + radical(i + 1, 2) * (b.east - b.west),
    lat: b.south + radical(i + 1, 3) * (b.north - b.south),
  }));
}

/** Geographic buckets independent of GPU coordinates and political state. */
export class GeographicMarkerIndex<
  T extends { readonly lon: number; readonly lat: number },
> {
  private readonly buckets = new Map<string, T[]>();
  constructor(
    markers: readonly T[],
    private readonly degrees = 5,
  ) {
    if (!Number.isFinite(degrees) || degrees <= 0)
      throw new RangeError('Invalid cell size');
    for (const m of markers) {
      if (
        !Number.isFinite(m.lon) ||
        !Number.isFinite(m.lat) ||
        Math.abs(m.lon) > 180 ||
        Math.abs(m.lat) > 90
      )
        throw new RangeError('Invalid marker');
      const key = `${Math.floor(m.lon / degrees)}:${Math.floor(m.lat / degrees)}`;
      const bucket = this.buckets.get(key) ?? [];
      bucket.push(m);
      this.buckets.set(key, bucket);
    }
  }
  query(bounds: Bounds): readonly T[] {
    const result: T[] = [];
    for (
      let x = Math.floor(bounds.west / this.degrees);
      x <= Math.floor(bounds.east / this.degrees);
      x++
    )
      for (
        let y = Math.floor(bounds.south / this.degrees);
        y <= Math.floor(bounds.north / this.degrees);
        y++
      )
        for (const m of this.buckets.get(`${x}:${y}`) ?? [])
          if (containsCoordinate(bounds, m.lon, m.lat)) result.push(m);
    return result;
  }
}
