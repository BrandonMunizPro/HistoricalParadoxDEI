import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import {
  approvedMapSites,
  remainingResearchReferences,
} from '../src/presentation/approved-map-sites.js';
import type { PromotedSettlement } from '../src/infrastructure/settlement-promotion.js';
import type { SettlementAtlasRecord } from '../src/infrastructure/settlement-atlas.js';
const registry = (
  JSON.parse(readFileSync('public/data/approved-settlements.json', 'utf8')) as {
    records: PromotedSettlement[];
  }
).records;
const existing = (
  JSON.parse(readFileSync('public/data/settlement-atlas.json', 'utf8')) as {
    records: SettlementAtlasRecord[];
  }
).records;
describe('Approved geographic registry presentation adapter', () => {
  it('loads all published sites without region membership, ownership, or development defaults', () => {
    const before = JSON.stringify(registry),
      sites = approvedMapSites(registry, existing);
    expect(sites).toHaveLength(12);
    for (const [i, s] of sites.entries()) {
      expect(s.id).toBe(registry[i]!.atlas.id);
      expect(s.locationId).toBe(registry[i]!.atlas.locationId);
      expect({ lon: s.lon, lat: s.lat }).toEqual(
        registry[i]!.atlas.coordinates,
      );
      for (const k of [
        'regionId',
        'owner',
        'population',
        'governor',
        'development',
        'structures',
      ])
        expect(s).not.toHaveProperty(k);
    }
    expect(JSON.stringify(registry)).toBe(before);
  });
  it('is registry-driven and supports an empty registry and future subsets', () => {
    expect(approvedMapSites([], existing)).toEqual([]);
    expect(approvedMapSites(registry.slice(0, 1), existing)).toHaveLength(1);
  });
  it('rejects duplicate canonical identities and existing atlas collisions', () => {
    expect(() =>
      approvedMapSites([registry[0]!, registry[0]!], existing),
    ).toThrow();
    expect(() =>
      approvedMapSites(registry, [...existing, registry[0]!.atlas]),
    ).toThrow();
  });
  it('rejects control, demographics and dangling settlement/location identities', () => {
    const r = registry[0]!;
    expect(() =>
      approvedMapSites(
        [
          {
            ...r,
            initialControl: existing[0]!.id,
          } as unknown as PromotedSettlement,
        ],
        existing,
      ),
    ).toThrow();
    expect(() =>
      approvedMapSites(
        [
          {
            ...r,
            geographicDefinition: {
              ...r.geographicDefinition,
              populationReference: existing[0]!.id,
            },
          },
        ],
        existing,
      ),
    ).toThrow();
    expect(() =>
      approvedMapSites(
        [
          {
            ...r,
            geographicDefinition: {
              ...r.geographicDefinition,
              locationId: existing[0]!.locationId,
            },
          },
        ],
        existing,
      ),
    ).toThrow();
  });
  it('rejects out-of-coverage coordinates and missing approval provenance', () => {
    const r = registry[0]!;
    expect(() =>
      approvedMapSites(
        [{ ...r, atlas: { ...r.atlas, coordinates: { lon: 100, lat: 40 } } }],
        existing,
      ),
    ).toThrow();
    expect(() =>
      approvedMapSites(
        [{ ...r, provenance: { ...r.provenance, approvalReference: '' } }],
        existing,
      ),
    ).toThrow();
  });
  it('suppresses promoted research handles without deleting or mutating research', () => {
    const source = [
        { proposedId: registry[0]!.provenance.candidateId },
        { proposedId: 'unapproved-test-reference' },
      ],
      before = JSON.stringify(source);
    expect(
      remainingResearchReferences(
        source,
        new Set(registry.map((r) => r.provenance.candidateId)),
      ),
    ).toEqual([source[1]]);
    expect(JSON.stringify(source)).toBe(before);
  });
});
