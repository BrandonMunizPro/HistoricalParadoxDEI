/** Imported WGS84 metadata, not a decision about canonical campaign coordinates. */
export interface ImportedGeographicDataset {
  readonly bounds: {
    readonly west: number;
    readonly east: number;
    readonly south: number;
    readonly north: number;
  };
  readonly width: number;
  readonly height: number;
  readonly elevations: readonly number[];
  readonly settlements: readonly {
    readonly key: string;
    readonly name: string;
    readonly lon: number;
    readonly lat: number;
    readonly source: string;
  }[];
}

export function validateGeographicDataset(
  data: ImportedGeographicDataset,
): void {
  const { bounds: b, width, height, elevations, settlements } = data;
  if (
    ![b.west, b.east, b.south, b.north].every(Number.isFinite) ||
    b.west >= b.east ||
    b.south >= b.north ||
    b.west < -180 ||
    b.east > 180 ||
    b.south < -90 ||
    b.north > 90 ||
    !Number.isSafeInteger(width) ||
    !Number.isSafeInteger(height) ||
    width < 2 ||
    height < 2 ||
    width * height !== elevations.length ||
    !elevations.every(Number.isFinite)
  ) {
    throw new RangeError('Invalid elevation grid or geographic bounds');
  }
  const keys = new Set<string>();
  for (const settlement of settlements) {
    if (
      keys.has(settlement.key) ||
      !settlement.key ||
      !settlement.name ||
      !Number.isFinite(settlement.lon) ||
      !Number.isFinite(settlement.lat) ||
      settlement.lon < b.west ||
      settlement.lon > b.east ||
      settlement.lat < b.south ||
      settlement.lat > b.north ||
      !settlement.source.startsWith('https://pleiades.stoa.org/places/')
    ) {
      throw new RangeError('Invalid imported settlement');
    }
    keys.add(settlement.key);
  }
}

/** Reject out-of-coverage queries rather than silently borrowing an edge sample. */
export function sampleElevation(
  data: ImportedGeographicDataset,
  lon: number,
  lat: number,
): number {
  const { bounds: b, width: w, height: h, elevations: values } = data;
  if (
    !Number.isFinite(lon) ||
    !Number.isFinite(lat) ||
    lon < b.west ||
    lon > b.east ||
    lat < b.south ||
    lat > b.north
  ) {
    throw new RangeError('Elevation query outside dataset coverage');
  }
  const x = ((lon - b.west) / (b.east - b.west)) * (w - 1);
  const y = ((b.north - lat) / (b.north - b.south)) * (h - 1);
  const x0 = Math.floor(x),
    y0 = Math.floor(y),
    x1 = Math.min(w - 1, x0 + 1),
    y1 = Math.min(h - 1, y0 + 1);
  const a = values[y0 * w + x0],
    c = values[y0 * w + x1],
    d = values[y1 * w + x0],
    e = values[y1 * w + x1];
  if (a === undefined || c === undefined || d === undefined || e === undefined)
    throw new RangeError('Incomplete elevation grid');
  const top = a + (c - a) * (x - x0),
    bottom = d + (e - d) * (x - x0);
  return top + (bottom - top) * (y - y0);
}
