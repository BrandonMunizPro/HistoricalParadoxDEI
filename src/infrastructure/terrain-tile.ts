import type { ImportedGeographicDataset } from './geographic-dataset.js';

/** External physical data adapter. No faction, campaign state, or demographic fields. */
export interface ImportedTerrainTile {
  readonly id: string;
  readonly kind?: 'regional' | 'city' | 'world-regional';
  readonly bounds: ImportedGeographicDataset['bounds'];
  readonly width: number;
  readonly height: number;
  readonly elevations: readonly number[];
  readonly land: readonly boolean[];
  readonly source: string;
  readonly coastMask: { readonly size: number; readonly bits: string };
}

export function validateTerrainTile(tile: ImportedTerrainTile): void {
  const b = tile.bounds,
    count = tile.width * tile.height;
  if (
    !tile.id ||
    !Number.isSafeInteger(tile.width) ||
    tile.width !== tile.height ||
    tile.width < 3 ||
    tile.width > 513 ||
    ![b.west, b.east, b.south, b.north].every(Number.isFinite) ||
    b.west >= b.east ||
    b.south >= b.north ||
    b.west < -180 ||
    b.east > 180 ||
    b.south < -90 ||
    b.north > 90 ||
    tile.elevations.length !== count ||
    tile.land.length !== count ||
    !tile.elevations.every(
      (e) =>
        Number.isFinite(e) &&
        e >= (tile.kind === 'world-regional' ? -12000 : -500) &&
        e <= 9000,
    ) ||
    !tile.land.every((v) => typeof v === 'boolean') ||
    tile.coastMask.size !== 513 ||
    tile.coastMask.bits.length !== Math.ceil(Math.ceil(513 ** 2 / 8) / 3) * 4 ||
    !/^[A-Za-z0-9+/]+={0,2}$/.test(tile.coastMask.bits) ||
    !(
      tile.source.startsWith('https://copernicus-dem-30m.s3.amazonaws.com/') ||
      (tile.kind === 'world-regional' &&
        tile.source ===
          'https://s3.amazonaws.com/elevation-tiles-prod/terrarium/6/')
    )
  ) {
    throw new RangeError('Invalid imported terrain tile');
  }
}
