import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import {
  REGION_VIEWS,
  WORLD_RENDER_BOUNDS,
  GeographicMarkerIndex,
  syntheticMarkerFixture,
  containsCoordinate,
  terrainDetailFamily,
} from '../src/presentation/world-navigation.js';
import {
  projectLocalMapMetres,
  unprojectLocalMapMetres,
} from '../src/infrastructure/world-geography.js';
import {
  sampleElevation,
  validateGeographicDataset,
} from '../src/infrastructure/geographic-dataset.js';
import type { ImportedGeographicDataset } from '../src/infrastructure/geographic-dataset.js';
import { validateTerrainTile } from '../src/infrastructure/terrain-tile.js';
import type { ImportedTerrainTile } from '../src/infrastructure/terrain-tile.js';

const context = JSON.parse(
  readFileSync('public/data/world-terrain/context.json', 'utf8'),
) as ImportedGeographicDataset & { land: boolean[] };
const manifest = JSON.parse(
  readFileSync('public/data/world-terrain/manifest.json', 'utf8'),
) as {
  bounds: typeof WORLD_RENDER_BOUNDS;
  tiles: { id: string; kind: string; url: string; sha256: string }[];
  detailAreas: {
    bounds: typeof WORLD_RENDER_BOUNDS;
    maximumCameraDistanceKm: number;
  }[];
};
const tiles = manifest.tiles
  .filter((t) => t.kind === 'world-regional')
  .map((t) => {
    const bytes = readFileSync(`public${t.url}`);
    return {
      descriptor: t,
      bytes,
      tile: JSON.parse(bytes.toString()) as ImportedTerrainTile,
    };
  });

describe('continuous campaign geography', () => {
  it('passes the independent modern coastline audit without hiding coastline mismatches', () => {
    const audit = JSON.parse(
      readFileSync(
        'docs/vs5/world-evidence/independent-geography.json',
        'utf8',
      ),
    ) as {
      contextSha256: string;
      samples: { referenceLand: boolean; renderedLand: boolean }[];
      grid: {
        stableCompared: number;
        coastalExcluded: number;
        inlandWaterExcluded: unknown[];
        mismatches: unknown[];
      };
    };
    expect(audit.samples.length).toBeGreaterThanOrEqual(26);
    expect(audit.contextSha256).toBe(
      createHash('sha256')
        .update(readFileSync('public/data/world-terrain/context.json'))
        .digest('hex'),
    );
    expect(audit.samples.every((s) => s.referenceLand === s.renderedLand)).toBe(
      true,
    );
    expect(audit.grid.stableCompared).toBeGreaterThan(1000);
    expect(audit.grid.mismatches).toEqual([]);
    expect(
      audit.grid.coastalExcluded +
        audit.grid.inlandWaterExcluded.length +
        audit.grid.stableCompared,
    ).toBe(1075);
  });
  it('covers the technical envelope and preserves all existing place coordinates', () => {
    validateGeographicDataset(context);
    expect(context.bounds).toEqual(WORLD_RENDER_BOUNDS);
    expect(manifest.bounds).toEqual(WORLD_RENDER_BOUNDS);
    const italy = JSON.parse(
      readFileSync('public/data/italy-terrain/context.json', 'utf8'),
    ) as ImportedGeographicDataset;
    expect(context.settlements).toEqual(italy.settlements);
    expect(context.settlements).toHaveLength(23);
    for (const view of Object.values(REGION_VIEWS))
      expect(containsCoordinate(context.bounds, view.lon, view.lat)).toBe(true);
    // Every grid cell has actual sampled elevation, including ocean bathymetry.
    expect(context.elevations).toHaveLength(513 ** 2);
    expect(Math.min(...context.elevations.slice(0, 50000))).toBeLessThan(-1000);
  });
  it('validates every regional tile, source and checksum', () => {
    expect(tiles.length).toBeGreaterThan(150);
    for (const { descriptor, bytes, tile } of tiles) {
      validateTerrainTile(tile);
      expect(createHash('sha256').update(bytes).digest('hex')).toBe(
        descriptor.sha256,
      );
      expect(tile.bounds.west).toBeGreaterThanOrEqual(context.bounds.west);
      expect(tile.bounds.east).toBeLessThanOrEqual(context.bounds.east);
    }
  });
  it('has exact shared heights and shore masks across adjacent world tiles', () => {
    let edges = 0;
    for (const { tile: a } of tiles)
      for (const { tile: b } of tiles) {
        const east =
          a.bounds.east === b.bounds.west && a.bounds.north === b.bounds.north;
        const south =
          a.bounds.south === b.bounds.north && a.bounds.west === b.bounds.west;
        if (!east && !south) continue;
        const ma = Buffer.from(a.coastMask.bits, 'base64'),
          mb = Buffer.from(b.coastMask.bits, 'base64');
        const bit = (m: Buffer, i: number): boolean =>
          !!(m[i >> 3]! & (1 << (i % 8)));
        for (let i = 0; i < 129; i++)
          expect(a.elevations[east ? i * 129 + 128 : 128 * 129 + i]).toBe(
            b.elevations[east ? i * 129 : i],
          );
        for (let i = 0; i < 513; i++)
          expect(bit(ma, east ? i * 513 + 512 : 512 * 513 + i)).toBe(
            bit(mb, east ? i * 513 : i),
          );
        edges++;
      }
    expect(edges).toBeGreaterThan(250);
  });
  it.each(Object.entries(REGION_VIEWS))(
    'round-trips %s in the same geographic projection',
    (_name, v) => {
      const origin = { lon: 13.5, lat: 41.5 },
        p = projectLocalMapMetres(v, origin);
      const result = unprojectLocalMapMetres(p.east, p.north, origin);
      expect(result.lon).toBeCloseTo(v.lon, 9);
      expect(result.lat).toBeCloseTo(v.lat, 9);
    },
  );
  it.each([
    ['Iberian interior', -4, 40, 300, 1800],
    ['Alps', 10.8, 46.8, 1200, 4000],
    ['Mesopotamian lowlands', 44.4, 33.3, -20, 300],
    ['Hindu Kush', 70, 36, 1500, 6000],
    ['central Mediterranean', 18, 34, -6000, -500],
  ] as const)(
    'checks independently identifiable broad landforms: %s',
    (_name, lon, lat, min, max) => {
      const e = sampleElevation(context, lon, lat);
      expect(e).toBeGreaterThan(min);
      expect(e).toBeLessThan(max);
    },
  );
  it('selects one regional family and unloads detail at world scale', () => {
    expect(terrainDetailFamily(13, 42, 500, manifest.detailAreas)).toBe(
      'italy',
    );
    expect(terrainDetailFamily(44, 33, 1400, manifest.detailAreas)).toBe(
      'world',
    );
    expect(terrainDetailFamily(13, 42, 12000, manifest.detailAreas)).toBe(
      'context',
    );
  });
});

describe('non-authoritative settlement-density headroom', () => {
  it.each([700, 1000])(
    'indexes and culls %i synthetic entities without changing historical records',
    (count) => {
      const fixtures = syntheticMarkerFixture(count),
        index = new GeographicMarkerIndex(fixtures);
      expect(new Set(fixtures.map((f) => f.id)).size).toBe(count);
      expect(
        fixtures.every(
          (f) => f.synthetic && f.id.startsWith('synthetic-only:'),
        ),
      ).toBe(true);
      expect(index.query(WORLD_RENDER_BOUNDS)).toHaveLength(count);
      for (const b of [
        WORLD_RENDER_BOUNDS,
        { west: 10, east: 20, south: 35, north: 46 },
        { west: -5, east: 0, south: 40, north: 45 },
      ]) {
        expect(
          index
            .query(b)
            .map((m) => m.id)
            .sort(),
        ).toEqual(
          fixtures
            .filter((m) => containsCoordinate(b, m.lon, m.lat))
            .map((m) => m.id)
            .sort(),
        );
      }
      expect(syntheticMarkerFixture(count)).toEqual(fixtures);
      expect(context.settlements).toHaveLength(23);
    },
  );
  it('rejects invalid fixture sizes and marker coordinates', () => {
    expect(() => syntheticMarkerFixture(-1)).toThrow();
    expect(() => new GeographicMarkerIndex([{ lon: NaN, lat: 0 }])).toThrow();
    expect(() => new GeographicMarkerIndex([], 0)).toThrow();
  });
});
