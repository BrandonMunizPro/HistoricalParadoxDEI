import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { deriveAuthoredCanonicalId } from '../src/domain/identity/canonical-id.js';
import {
  leastCostRoute,
  validateGeographicGraph,
} from '../src/domain/geography/geography.js';
import { transferSettlementControl } from '../src/simulation/campaign-map-state.js';
import { createPrototypeMapState } from '../src/simulation/central-italy-map-scenario.js';
import {
  sampleElevation,
  validateGeographicDataset,
} from '../src/infrastructure/geographic-dataset.js';
import { createGeographicSpatialIndex } from '../src/domain/geography/spatial-index.js';

const id = (key: string): ReturnType<typeof deriveAuthoredCanonicalId> =>
  deriveAuthoredCanonicalId({ sourceNamespace: 'vs5-test', sourceKey: key });
describe('VS5 geographic foundation', () => {
  it('samples elevations with bilinear interpolation and rejects invalid coverage', () => {
    const grid = {
      bounds: { west: 0, east: 1, south: 0, north: 1 },
      width: 2,
      height: 2,
      elevations: [0, 20, 40, 60],
      settlements: [],
    };
    validateGeographicDataset(grid);
    expect(sampleElevation(grid, 0.5, 0.5)).toBe(30);
    expect(sampleElevation(grid, 1, 0)).toBe(60);
    expect(() => sampleElevation(grid, 2, 0)).toThrow();
    expect(() =>
      validateGeographicDataset({ ...grid, elevations: [0, NaN, 0, 0] }),
    ).toThrow();
    expect(() => validateGeographicDataset({ ...grid, width: 3 })).toThrow();
  });
  it('chooses traversal cost over hop count and handles disconnected locations', () => {
    const locations = ['a', 'b', 'c', 'isolated'].map((key) => ({
      id: id(key),
      name: key,
      regionId: id('region'),
      terrain: 'hill' as const,
    }));
    const connections = [
      { from: id('a'), to: id('c'), kind: 'pass' as const, traversalCost: 10 },
      { from: id('a'), to: id('b'), kind: 'route' as const, traversalCost: 2 },
      {
        from: id('b'),
        to: id('c'),
        kind: 'river-crossing' as const,
        traversalCost: 3,
      },
    ];
    expect(leastCostRoute(locations, connections, id('a'), id('c'))).toEqual({
      locationIds: [id('a'), id('b'), id('c')],
      cost: 5,
    });
    expect(leastCostRoute(locations, connections, id('c'), id('a'))?.cost).toBe(
      5,
    );
    expect(
      leastCostRoute(locations, connections, id('a'), id('isolated')),
    ).toBeUndefined();
    expect(
      leastCostRoute(
        [...locations].reverse(),
        [...connections].reverse(),
        id('a'),
        id('c'),
      ),
    ).toEqual(leastCostRoute(locations, connections, id('a'), id('c')));
    expect(
      leastCostRoute(locations, connections, id('a'), id('c'), {
        plain: 1,
        hill: 2,
        mountain: 3,
        coast: 1,
      })?.cost,
    ).toBe(10);
    const index = createGeographicSpatialIndex(locations, connections);
    expect(index.neighbors(id('isolated'))).toEqual([]);
    expect(index.withinHops(id('a'), 1)).toEqual([id('b'), id('c')].sort());
    expect(index.withinHops(id('a'), 0)).toEqual([]);
    expect(() => index.withinHops(id('a'), -1)).toThrow();
  });
  it('rejects orphan edges, duplicate identity, and invalid traversal costs', () => {
    const a = {
      id: id('a'),
      name: 'A',
      regionId: id('region'),
      terrain: 'plain' as const,
    };
    const b = { ...a, id: id('b') };
    validateGeographicGraph(
      [a, b],
      [{ from: a.id, to: b.id, kind: 'route', traversalCost: 2 }],
    );
    expect(() => validateGeographicGraph([a, a], [])).toThrow();
    for (const cost of [0, -1, NaN, Infinity]) {
      expect(() =>
        validateGeographicGraph(
          [a, b],
          [{ from: a.id, to: b.id, kind: 'route', traversalCost: cost }],
        ),
      ).toThrow();
    }
    expect(() =>
      validateGeographicGraph(
        [a],
        [{ from: a.id, to: b.id, kind: 'route', traversalCost: 1 }],
      ),
    ).toThrow();
  });
  it('control transfer preserves settlement identity and leaves the previous snapshot intact', () => {
    const settlement = { id: id('roma'), key: 'roma' };
    const state = createPrototypeMapState(
      [settlement],
      id('roman'),
      id('allied'),
    );
    const updated = transferSettlementControl(
      state,
      settlement.id,
      id('allied'),
    );
    expect(updated.settlementControl.get(settlement.id)).toBe(id('allied'));
    expect(state.settlementControl.get(settlement.id)).toBe(id('roman'));
    expect(() =>
      transferSettlementControl(state, id('missing'), id('roman')),
    ).toThrow();
    expect(() =>
      transferSettlementControl(state, settlement.id, id('missing')),
    ).toThrow();
  });
  it('import contains real finite relief and the correct ancient Capua and Tarracina', () => {
    const data = JSON.parse(
      readFileSync('public/data/central-italy.json', 'utf8'),
    ) as {
      width: number;
      height: number;
      elevations: number[];
      settlements: {
        key: string;
        name: string;
        lon: number;
        lat: number;
        source: string;
      }[];
    };
    expect(data.elevations).toHaveLength(data.width * data.height);
    expect(data.elevations.every(Number.isFinite)).toBe(true);
    expect(
      data.elevations.reduce((max, value) => Math.max(max, value), -Infinity),
    ).toBeGreaterThan(2000);
    expect(new Set(data.settlements.map((s) => s.source)).size).toBe(23);
    const capua = data.settlements.find((s) => s.key === 'capua');
    expect(capua?.lon).toBeCloseTo(14.25, 1);
    expect(capua?.lat).toBeCloseTo(41.086, 2);
    expect(data.settlements.find((s) => s.key === 'tarracina')?.name).toContain(
      'Tarracina',
    );
  });
});
