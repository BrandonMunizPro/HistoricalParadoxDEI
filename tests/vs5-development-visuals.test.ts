import { describe, it, expect } from 'vitest';
import {
  selectArchitecturalAssets,
  architecturalCatalog,
} from '../src/presentation/settlement-development.js';
import type {
  ArchitecturalContext,
  DevelopmentSnapshot,
} from '../src/presentation/settlement-development.js';
import {
  terrainAlbedo,
  barycentricWeights,
} from '../src/presentation/terrain-style.js';
import {
  projectLocalMapMetres,
  unprojectLocalMapMetres,
  geographicDistanceMetres,
} from '../src/infrastructure/world-geography.js';
import { readFileSync } from 'node:fs';
const context: ArchitecturalContext = {
  settlementId: 'stable-city',
  culture: 'greek',
  yearBce: 278,
  tier: 1,
  geography: ['coastal', 'cultivable'],
};
const snapshot: DevelopmentSnapshot = {
  settlementId: 'stable-city',
  revision: 'external-1',
  structures: [
    { id: 'temple', category: 'religious', level: 1, condition: 'active' },
    { id: 'wharf-store', category: 'maritime', level: 1, condition: 'active' },
  ],
};
describe('external architectural presentation adapter', () => {
  it('renders only supplied structures and is independent of input ordering/revision', () => {
    expect(
      selectArchitecturalAssets(context, { ...snapshot, structures: [] }),
    ).toEqual([]);
    expect(selectArchitecturalAssets(context, snapshot)).toEqual(
      selectArchitecturalAssets(context, {
        ...snapshot,
        revision: 'external-2',
        structures: [...snapshot.structures].reverse(),
      }),
    );
    expect(
      selectArchitecturalAssets(context, snapshot).map((s) => s.assetId),
    ).toEqual(['greek.religious.republican', 'greek.maritime.republican']);
  });
  it('filters culture, era, tier, level and geographic eligibility without inventing construction', () => {
    expect(
      selectArchitecturalAssets({ ...context, yearBce: 100 }, snapshot),
    ).toEqual([]);
    expect(
      selectArchitecturalAssets({ ...context, culture: 'italic' }, snapshot)[0]
        ?.assetId,
    ).toBe('italic.religious.republican');
    expect(
      selectArchitecturalAssets({ ...context, geography: [] }, snapshot),
    ).toHaveLength(1);
    expect(
      selectArchitecturalAssets(
        { ...context, tier: 4 },
        snapshot,
        architecturalCatalog.map((a) => ({ ...a, maximumTier: 2 })),
      ),
    ).toEqual([]);
    expect(
      selectArchitecturalAssets(
        context,
        snapshot,
        architecturalCatalog.map((a) => ({ ...a, minimumLevel: 2 })),
      ),
    ).toEqual([]);
  });
  it('preserves ruined structures and stable variants, rejects wrong identities and duplicates', () => {
    const result = selectArchitecturalAssets(context, {
      ...snapshot,
      structures: [{ ...snapshot.structures[0]!, condition: 'ruined' }],
    });
    expect(result[0]?.condition).toBe('ruined');
    expect(() =>
      selectArchitecturalAssets(context, {
        ...snapshot,
        settlementId: 'other',
      }),
    ).toThrow(RangeError);
    expect(() =>
      selectArchitecturalAssets(context, {
        ...snapshot,
        structures: [snapshot.structures[0]!, snapshot.structures[0]!],
      }),
    ).toThrow(RangeError);
    expect(snapshot.structures[0]?.condition).toBe('active');
  });
  it('supports all six development categories using original period-limited archetypes', () => {
    const categories = new Set(architecturalCatalog.map((a) => a.category));
    expect(categories.size).toBe(6);
    expect(
      architecturalCatalog.every((a) => a.fromBce >= 278 && a.toBce <= 278),
    ).toBe(true);
  });
});
describe('geographic diagnostic view and shared physical style', () => {
  it('samples the actual rendered context triangle rather than a different-resolution height raster', () => {
    expect(
      barycentricWeights(
        [0, 0],
        [
          [0, 0],
          [0, 1],
          [1, 0],
        ],
      ),
    ).toEqual([1, 0, 0]);
    const weights = barycentricWeights(
      [0.25, 0.25],
      [
        [0, 0],
        [0, 1],
        [1, 0],
      ],
    );
    expect(weights).toEqual([0.5, 0.25, 0.25]);
    expect(weights.reduce((sum, w, i) => sum + w * [10, 20, 30][i]!, 0)).toBe(
      17.5,
    );
    expect(() =>
      barycentricWeights(
        [0, 0],
        [
          [0, 0],
          [0, 0],
          [0, 0],
        ],
      ),
    ).toThrow(RangeError);
  });
  it('retains separate negative seabed samples beneath land-only regional DEM coverage', () => {
    const data = JSON.parse(
      readFileSync('public/data/italy-terrain/context.json', 'utf8'),
    ) as {
      bounds: { west: number; east: number; south: number; north: number };
      width: number;
      height: number;
      elevations: number[];
      bathymetry: number[];
    };
    expect(data.bathymetry).toHaveLength(data.elevations.length);
    // Tyrrhenian sea, safely away from modern/ancient shoreline uncertainty.
    for (const [lon, lat] of [
      [12.5, 40.5],
      [13.5, 39.5],
      [10.5, 39.5],
    ]) {
      const c = Math.round(
          ((lon! - data.bounds.west) / (data.bounds.east - data.bounds.west)) *
            (data.width - 1),
        ),
        r = Math.round(
          ((data.bounds.north - lat!) /
            (data.bounds.north - data.bounds.south)) *
            (data.height - 1),
        );
      expect(data.bathymetry[r * data.width + c]).toBeLessThan(-100);
    }
  });
  it('roundtrips Italy, the islands, and future campaign areas with correct geographic orientation', () => {
    const origin = { lon: 13.5, lat: 41.5 };
    for (const p of [
      { lon: 12.49, lat: 41.89 },
      { lon: 9, lat: 40 },
      { lon: 8.6, lat: 42.13 },
      { lon: 13.93, lat: 37.62 },
      { lon: -5, lat: 38 },
      { lon: 32, lat: 30 },
      { lon: 44, lat: 33 },
    ]) {
      const q = projectLocalMapMetres(p, origin),
        r = unprojectLocalMapMetres(q.east, q.north, origin);
      expect(r.lon).toBeCloseTo(p.lon, 9);
      expect(r.lat).toBeCloseTo(p.lat, 9);
      expect(Math.hypot(q.east, q.north)).toBeCloseTo(
        geographicDistanceMetres(origin, p),
        5,
      );
    }
    expect(
      projectLocalMapMetres({ lon: 13.5, lat: 42.5 }, origin).north,
    ).toBeGreaterThan(0);
    expect(
      projectLocalMapMetres({ lon: 14.5, lat: 41.5 }, origin).east,
    ).toBeGreaterThan(0);
  });
  it('uses a continuous shared ramp instead of per-tile threshold color jumps', () => {
    for (const e of [180, 650, 1200, 1900]) {
      const a = terrainAlbedo(e - 0.01),
        b = terrainAlbedo(e + 0.01);
      expect(Math.max(...a.map((v, i) => Math.abs(v - b[i]!)))).toBeLessThan(
        0.0001,
      );
    }
    expect(() => terrainAlbedo(Number.NaN)).toThrow(RangeError);
  });
  it('does not alter the original 23 settlement coordinates in the expanded terrain context', () => {
    const a = JSON.parse(
      readFileSync('public/data/central-italy.json', 'utf8'),
    ) as { settlements: unknown[] };
    const b = JSON.parse(
      readFileSync('public/data/italy-terrain/context.json', 'utf8'),
    ) as { settlements: unknown[] };
    expect(b.settlements).toEqual(a.settlements);
  });
});
