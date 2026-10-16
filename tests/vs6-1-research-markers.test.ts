import { describe, it, expect } from 'vitest';
import {
  researchLocations,
  clusterResearchLocations,
} from '../src/presentation/research-markers.js';
import type { ResearchInput } from '../src/presentation/research-markers.js';
import { TERRAIN_HEIGHT_SCALE } from '../src/presentation/terrain-presentation.js';
const record = (id = 'fixture'): ResearchInput => ({
  proposedId: id,
  historicalName: 'Synthetic test reference',
  coordinates: { lon: 23, lat: 38, precision: 'Approximate' },
  locationConfidence: 'attested',
  presence278Bce: 'attested',
});
describe('Non-authoritative research reference layer', () => {
  it('excludes coordinate objects with null components instead of treating null as zero', () => {
    const r = researchLocations([
      { ...record(), coordinates: { lon: null, lat: null } },
    ]);
    expect(r.locations).toEqual([]);
    expect(r.excluded[0]?.reason).toBe('Missing coordinate components');
  });
  it('excludes null, invalid and uncovered coordinates with reasons', () => {
    const r = researchLocations([
      { ...record('null'), coordinates: null },
      { ...record('nan'), coordinates: { lon: NaN, lat: 38 } },
      { ...record('outside'), coordinates: { lon: 100, lat: 38 } },
      record(),
    ]);
    expect(r.locations).toHaveLength(1);
    expect(r.excluded.map((x) => x.reason)).toEqual([
      'No coordinates',
      'Invalid coordinates',
      'Outside current rendering coverage',
    ]);
  });
  it('does not turn draft confidence into approved precision or simulation fields', () => {
    const input = record(),
      before = JSON.stringify(input),
      r = researchLocations([input]).locations[0]!;
    expect(r.id).toBe('research:fixture');
    expect(r.uncertainty).toBe('approximate');
    expect(r.note).toContain('not verified for 278 BCE');
    expect(r).not.toHaveProperty('owner');
    expect(r).not.toHaveProperty('population');
    expect(r).not.toHaveProperty('development');
    expect(JSON.stringify(input)).toBe(before);
  });
  it('marks uncertain or unlocated-but-coarsely-positioned references as disputed', () => {
    expect(
      researchLocations([{ ...record(), locationConfidence: 'uncertain' }])
        .locations[0]?.uncertainty,
    ).toBe('disputed');
    expect(
      researchLocations([{ ...record(), presence278Bce: 'unlocated' }])
        .locations[0]?.uncertainty,
    ).toBe('disputed');
  });
  it('rejects duplicate handles without merging geographic entities', () => {
    expect(
      researchLocations([record(), record()]).excluded[0]?.reason,
    ).toContain('Duplicate');
  });
  it('layer toggle suppresses all markers', () => {
    const location = researchLocations([record()]).locations[0]!;
    expect(
      clusterResearchLocations([{ location, x: 20, y: 20 }], 100, 100, false),
    ).toEqual([]);
  });
  it('clusters screen neighbors deterministically and splits them after zoom', () => {
    const locations = researchLocations([record('a'), record('b')]).locations;
    const points = locations.map((location) => ({ location, x: 20, y: 20 }));
    const clusters = clusterResearchLocations(points, 500, 500, true);
    expect(clusters).toHaveLength(1);
    expect(clusters[0]?.members).toHaveLength(2);
    expect(
      clusterResearchLocations([...points].reverse(), 500, 500, true),
    ).toEqual(clusters);
    expect(
      clusterResearchLocations(
        [points[0]!, { ...points[1]!, x: 200 }],
        500,
        500,
        true,
      ),
    ).toHaveLength(2);
  });
  it('bounds density and removes offscreen references', () => {
    const locations = researchLocations(
      Array.from({ length: 1000 }, (_, i) => record(String(i))),
    ).locations;
    const points = locations.map((location, i) => ({
      location,
      x: i * 2,
      y: 20,
    }));
    expect(
      clusterResearchLocations(points, 2000, 500, true, 10, 40),
    ).toHaveLength(40);
    expect(
      clusterResearchLocations([{ ...points[0]!, x: -1 }], 2000, 500, true),
    ).toEqual([]);
    expect(() => clusterResearchLocations(points, 2000, 500, true, 0)).toThrow(
      RangeError,
    );
  });
  it('keeps relief exaggeration modest and shared', () => {
    expect(TERRAIN_HEIGHT_SCALE).toBe(1.5);
  });
});
