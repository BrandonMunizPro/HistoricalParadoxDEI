/** Presentation evidence only. These are modern climate families, never simulated yields. */
export type ClimateFamily =
  | 'unclassified'
  | 'tropical'
  | 'desert'
  | 'steppe'
  | 'mediterranean'
  | 'temperate'
  | 'continental'
  | 'polar';
export function climateFamily(code: number): ClimateFamily {
  if (!Number.isInteger(code) || code < 0 || code > 30)
    throw new RangeError('Invalid Koppen-Geiger class');
  if (code === 0) return 'unclassified';
  if (code <= 3) return 'tropical';
  if (code <= 5) return 'desert';
  if (code <= 7) return 'steppe';
  if (code <= 10) return 'mediterranean';
  if (code <= 16) return 'temperate';
  if (code <= 28) return 'continental';
  return 'polar';
}

export interface EcologyGrid {
  readonly bounds: {
    readonly west: number;
    readonly east: number;
    readonly south: number;
    readonly north: number;
  };
  readonly width: number;
  readonly height: number;
}
/** Shared CPU/GPU convention; out-of-coverage evidence is never borrowed from a map edge. */
export function ecologyGridPoint(
  grid: EcologyGrid,
  lon: number,
  lat: number,
): readonly [number, number] {
  const b = grid.bounds;
  if (
    !Number.isFinite(lon) ||
    !Number.isFinite(lat) ||
    lon < b.west ||
    lon > b.east ||
    lat < b.south ||
    lat > b.north
  )
    throw new RangeError('Outside ecological evidence coverage');
  return [
    ((lon - b.west) / (b.east - b.west)) * (grid.width - 1),
    ((b.north - lat) / (b.north - b.south)) * (grid.height - 1),
  ];
}
export function ecologyTextureUv(
  grid: EcologyGrid,
  lon: number,
  lat: number,
): readonly [number, number] {
  const [x, y] = ecologyGridPoint(grid, lon, lat);
  return [(x + 0.5) / grid.width, 1 - (y + 0.5) / grid.height];
}

export function smoothTerrainReveal(
  elapsedMs: number,
  durationMs = 650,
): number {
  if (
    !Number.isFinite(elapsedMs) ||
    !Number.isFinite(durationMs) ||
    durationMs <= 0
  )
    throw new RangeError('Invalid terrain transition');
  const t = Math.max(0, Math.min(1, elapsedMs / durationMs));
  return t * t * (3 - 2 * t);
}
