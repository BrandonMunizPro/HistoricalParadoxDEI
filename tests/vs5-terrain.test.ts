import { readFileSync } from 'node:fs';
import { describe, it, expect } from 'vitest';
import { terrainTopology } from '../src/presentation/terrain-topology.js';
import { sampleElevation } from '../src/infrastructure/geographic-dataset.js';
import type { ImportedGeographicDataset } from '../src/infrastructure/geographic-dataset.js';
import { validateTerrainTile } from '../src/infrastructure/terrain-tile.js';
import type { ImportedTerrainTile } from '../src/infrastructure/terrain-tile.js';

interface Tile extends ImportedGeographicDataset {
  readonly id: string;
  readonly land: readonly boolean[];
}
const manifest = JSON.parse(
  readFileSync('public/data/italy-terrain/manifest.json', 'utf8'),
) as { tiles: { id: string; bounds: Tile['bounds'] }[] };
const tile = (id: string): Tile =>
  JSON.parse(
    readFileSync(`public/data/italy-terrain/${id}.json`, 'utf8'),
  ) as Tile;

describe('bounded Italian terrain and mixed LOD', () => {
  it.each([1, 2, 4])(
    'retains every perimeter sample and exactly tessellates at stride %i',
    (stride) => {
      const t = terrainTopology(129, stride);
      const edges = t.vertices.filter(
        ([x, y]) => x === 0 || y === 0 || x === 128 || y === 128,
      );
      expect(edges).toHaveLength(512);
      let area = 0;
      for (let i = 0; i < t.indices.length; i += 3) {
        const a = t.vertices[t.indices[i]!]!,
          b = t.vertices[t.indices[i + 1]!]!,
          c = t.vertices[t.indices[i + 2]!]!;
        const signed =
          (b[1] - a[1]) * (c[0] - a[0]) - (b[0] - a[0]) * (c[1] - a[1]);
        expect(signed).toBeGreaterThan(0);
        area += signed / 2;
      }
      expect(area).toBe(128 ** 2);
    },
  );
  it('has identical shared elevations and land masks across every adjacent degree', () => {
    const all = new Map(manifest.tiles.map((t) => [t.id, tile(t.id)]));
    let checked = 0;
    for (const a of all.values())
      for (const b of all.values()) {
        if (
          a.bounds.north === b.bounds.north &&
          a.bounds.east === b.bounds.west
        ) {
          for (let r = 0; r < 129; r++) {
            expect(a.elevations[r * 129 + 128]).toBe(b.elevations[r * 129]);
            expect(a.land[r * 129 + 128]).toBe(b.land[r * 129]);
          }
          checked++;
        }
        if (
          a.bounds.east === b.bounds.east &&
          a.bounds.south === b.bounds.north
        ) {
          for (let c = 0; c < 129; c++) {
            expect(a.elevations[128 * 129 + c]).toBe(b.elevations[c]);
            expect(a.land[128 * 129 + c]).toBe(b.land[c]);
          }
          checked++;
        }
      }
    expect(checked).toBeGreaterThan(100);
  });
  it('validates the external-data adapter and rejects corrupted grids', () => {
    const t = tile('N41E12') as unknown as ImportedTerrainTile;
    validateTerrainTile(t);
    expect(() =>
      validateTerrainTile({ ...t, elevations: [Number.NaN] }),
    ).toThrow(RangeError);
    expect(() =>
      validateTerrainTile({
        ...t,
        bounds: { ...t.bounds, east: t.bounds.west },
      }),
    ).toThrow(RangeError);
    for (const entry of manifest.tiles)
      validateTerrainTile(tile(entry.id) as unknown as ImportedTerrainTile);
  });
  it('records independent locality and elevation checks without claiming ancient footprints', () => {
    const qa = JSON.parse(
      readFileSync('data/geography/italy-validation.json', 'utf8'),
    ) as {
      coordinates: { offsetMetres: number; toleranceMetres: number }[];
      elevation: { differenceMetres: number; toleranceMetres: number }[];
    };
    expect(qa.coordinates).toHaveLength(3);
    expect(qa.elevation).toHaveLength(3);
    for (const c of qa.coordinates)
      expect(c.offsetMetres).toBeLessThan(c.toleranceMetres);
    for (const e of qa.elevation)
      expect(Math.abs(e.differenceMetres)).toBeLessThan(e.toleranceMetres);
  });
  it('retains a mountain spine inland and low Campanian plain rather than an invented ridge', () => {
    const mountains = tile('N42E13'),
      plain = tile('N41E14');
    expect(sampleElevation(mountains, 13.565, 42.469)).toBeGreaterThan(2000);
    expect(sampleElevation(plain, 14.25, 41.086)).toBeLessThan(150);
    expect(manifest.tiles.some((t) => t.id === 'N40E12')).toBe(false);
  });
  it('keeps the original atlas coordinates and settlement IDs out of mesh topology', () => {
    const context = JSON.parse(
      readFileSync('public/data/italy-terrain/context.json', 'utf8'),
    ) as ImportedGeographicDataset;
    const old = JSON.parse(
      readFileSync('public/data/central-italy.json', 'utf8'),
    ) as ImportedGeographicDataset;
    expect(context.settlements).toEqual(old.settlements);
    expect(manifest.tiles.length).toBeLessThan(120);
    expect(() => terrainTopology(129, 3)).toThrow(RangeError);
  });
});
