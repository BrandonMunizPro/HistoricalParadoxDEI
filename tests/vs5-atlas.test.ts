import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  settlementAtlasIdentity,
  validateSettlementAtlas,
} from '../src/infrastructure/settlement-atlas.js';
import type { SettlementAtlasRecord } from '../src/infrastructure/settlement-atlas.js';
import {
  containsCoordinate,
  geographicDistanceMetres,
  projectLocalMapMetres,
  unprojectLocalMapMetres,
  toLocalTangentMetres,
} from '../src/infrastructure/world-geography.js';
import {
  layoutSettlementLabels,
  settlementDetailBand,
} from '../src/presentation/settlement-label-layout.js';

const atlas = JSON.parse(
  readFileSync('public/data/settlement-atlas.json', 'utf8'),
) as { records: SettlementAtlasRecord[] };
const scope = JSON.parse(
  readFileSync('public/data/world-scope.json', 'utf8'),
) as {
  bounds: { west: number; east: number; south: number; north: number };
  anchors: { name: string; lon: number; lat: number }[];
};

describe('world scope and Italian atlas', () => {
  it('preserves seven identities and holds uncertain/absent candidates outside the active map', () => {
    validateSettlementAtlas(atlas.records);
    expect(atlas.records).toHaveLength(36);
    const original = [
      '423025',
      '432754',
      '423081',
      '423013',
      '422987',
      '433143',
      '422995',
    ];
    for (const pid of original) {
      const identity = settlementAtlasIdentity(pid);
      const record = atlas.records.find((r) => r.id === identity.id);
      expect(record?.locationId).toBe(identity.locationId);
      expect(record?.selection).toBe('existing');
    }
    expect(
      atlas.records.filter((r) => r.selection === 'expansion'),
    ).toHaveLength(16);
    expect(atlas.records.find((r) => r.key === 'cosa')?.presence278Bce).toBe(
      'absent',
    );
    expect(
      atlas.records.find((r) => r.key === 'taurasia')?.coordinates,
    ).toBeNull();
    expect(
      atlas.records.find((r) => r.key === 'poseidonia')?.historicalName,
    ).toBe('Poseidonia');
    expect(
      atlas.records.find((r) => r.key === 'maleventum')?.historicalName,
    ).toBe('Maleventum');
    const record = atlas.records[0];
    if (!record) throw new Error('Missing fixture');
    expect(() =>
      validateSettlementAtlas([record, { ...record, key: 'duplicate' }]),
    ).toThrow();
    expect(() =>
      validateSettlementAtlas([
        { ...record, selection: 'expansion', presence278Bce: 'absent' },
      ]),
    ).toThrow();
  });
  it('contains geographic coverage anchors and stays independent of local terrain bounds', () => {
    for (const anchor of scope.anchors)
      expect(containsCoordinate(scope.bounds, anchor), anchor.name).toBe(true);
    for (const record of atlas.records)
      if (record.coordinates)
        expect(containsCoordinate(scope.bounds, record.coordinates)).toBe(true);
    expect(scope.bounds.west).toBeLessThan(-9);
    expect(scope.bounds.east).toBeGreaterThan(69);
    const roma = atlas.records.find((r) => r.key === 'roma')?.coordinates,
      capua = atlas.records.find((r) => r.key === 'capua')?.coordinates;
    if (!roma || !capua) throw new Error('Missing cities');
    expect(geographicDistanceMetres(roma, capua)).toBeGreaterThan(165000);
    expect(geographicDistanceMetres(roma, capua)).toBeLessThan(220000);
  });
  it('rebases and round trips geographic coordinates without deriving identity from render units', () => {
    const origin = { lon: 13.4, lat: 41.7 },
      point = { lon: 15.005, lat: 40.42 };
    const projected = projectLocalMapMetres(point, origin),
      restored = unprojectLocalMapMetres(
        projected.east,
        projected.north,
        origin,
      );
    expect(restored.lon).toBeCloseTo(point.lon, 8);
    expect(restored.lat).toBeCloseTo(point.lat, 8);
    expect(Math.hypot(projected.east, projected.north)).toBeCloseTo(
      geographicDistanceMetres(point, origin),
      5,
    );
    const ecef = toLocalTangentMetres(origin, origin);
    expect(ecef).toEqual({ east: 0, north: 0, up: 0 });
    expect(() =>
      geographicDistanceMetres({ lon: NaN, lat: 0 }, origin),
    ).toThrow();
  });
});

describe('settlement label hierarchy', () => {
  const viewport = { x: 0, y: 0, width: 1000, height: 800 };
  const major = {
    id: 'major',
    x: 300,
    y: 300,
    width: 80,
    height: 25,
    tier: 1,
    selected: false,
  };
  const town = { ...major, id: 'town', x: 320, tier: 3 };
  it('uses stable priorities, respects panel occlusion, and shows minor sites only at local zoom', () => {
    expect(
      layoutSettlementLabels([town, major], viewport, [], 'local'),
    ).toEqual(['major']);
    expect(
      layoutSettlementLabels([major, town], viewport, [], 'local'),
    ).toEqual(['major']);
    expect(
      layoutSettlementLabels(
        [major, { ...town, selected: true }],
        viewport,
        [],
        'far',
      ),
    ).toEqual(['town']);
    expect(
      layoutSettlementLabels([{ ...town, x: 500 }], viewport, [], 'regional'),
    ).toEqual([]);
    expect(
      layoutSettlementLabels([{ ...town, x: 500 }], viewport, [], 'local'),
    ).toEqual(['town']);
    expect(
      layoutSettlementLabels(
        [major],
        viewport,
        [{ x: 280, y: 280, width: 140, height: 90 }],
        'local',
      ),
    ).toEqual([]);
    expect(settlementDetailBand(500)).toBe('far');
    expect(settlementDetailBand(350)).toBe('regional');
    expect(settlementDetailBand(150)).toBe('local');
  });
});
