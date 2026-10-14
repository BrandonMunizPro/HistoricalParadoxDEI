import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { describe, it, expect } from 'vitest';
import { validateTerrainTile } from '../src/infrastructure/terrain-tile.js';
import type { ImportedTerrainTile } from '../src/infrastructure/terrain-tile.js';
import { terrainDetailFamily } from '../src/presentation/world-navigation.js';
const manifest = JSON.parse(
  readFileSync('public/data/regional-details/manifest.json', 'utf8'),
) as {
  areas: {
    id: string;
    bounds: ImportedTerrainTile['bounds'];
    maximumCameraDistanceKm: number;
  }[];
  tiles: { id: string; detailArea: string; url: string; sha256: string }[];
  gaps: unknown[];
  hydrology: { segments: number; historicalReconstruction: boolean };
};
const all = manifest.tiles.map((d) => {
  const bytes = readFileSync(`public${d.url}`);
  return { d, bytes, t: JSON.parse(bytes.toString()) as ImportedTerrainTile };
});
describe('reusable non-Italian terrain detail', () => {
  it('validates every source tile and output hash, with no fabricated gaps', () => {
    expect(all.filter((a) => a.t.kind === 'regional')).toHaveLength(80);
    expect(manifest.gaps).toEqual([]);
    for (const { d, bytes, t } of all) {
      validateTerrainTile(t);
      expect(createHash('sha256').update(bytes).digest('hex')).toBe(d.sha256);
    }
    expect(manifest.hydrology.segments).toBeGreaterThan(0);
    expect(manifest.hydrology.historicalReconstruction).toBe(false);
  });
  it('shares heights and coastline bits at every adjoining one-degree boundary', () => {
    let edges = 0;
    const regional = all.map((a) => a.t).filter((t) => t.kind === 'regional');
    for (const a of regional)
      for (const b of regional) {
        const east =
            a.bounds.east === b.bounds.west &&
            a.bounds.north === b.bounds.north,
          south =
            a.bounds.south === b.bounds.north &&
            a.bounds.west === b.bounds.west;
        if (!east && !south) continue;
        for (let i = 0; i < 129; i++)
          expect(a.elevations[east ? i * 129 + 128 : 128 * 129 + i]).toBe(
            b.elevations[east ? i * 129 : i],
          );
        const ma = Buffer.from(a.coastMask.bits, 'base64'),
          mb = Buffer.from(b.coastMask.bits, 'base64'),
          bit = (m: Buffer, i: number): boolean =>
            !!(m[i >> 3]! & (1 << (i % 8)));
        for (let i = 0; i < 513; i++)
          expect(bit(ma, east ? i * 513 + 512 : 512 * 513 + i)).toBe(
            bit(mb, east ? i * 513 : i),
          );
        edges++;
      }
    expect(edges).toBeGreaterThan(100);
  });
  it('selects geographic detail by data, while retaining world/context fallback', () => {
    expect(terrainDetailFamily(22.8, 37.56, 100, manifest.areas)).toBe(
      'greece',
    );
    expect(terrainDetailFamily(32.57, 25.74, 100, manifest.areas)).toBe(
      'egypt',
    );
    expect(terrainDetailFamily(22.8, 37.56, 900, manifest.areas)).toBe('world');
    expect(terrainDetailFamily(22.8, 37.56, 9000, manifest.areas)).toBe(
      'context',
    );
  });
  it('provides approximately 50m local windows with relief, without settlement entities', () => {
    for (const { t } of all.filter((a) => a.t.kind === 'city')) {
      expect(t.bounds.east - t.bounds.west).toBe(0.0625);
      expect(((t.bounds.north - t.bounds.south) * 111000) / 128).toBeLessThan(
        55,
      );
      expect(
        Math.max(...t.elevations) - Math.min(...t.elevations),
      ).toBeGreaterThan(100);
    }
    const atlas = JSON.parse(
      readFileSync('public/data/central-italy.json', 'utf8'),
    ) as { settlements: unknown[] };
    expect(atlas.settlements).toHaveLength(23);
  });
});
