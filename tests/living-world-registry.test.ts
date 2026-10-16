import { readFileSync, readdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { researchLocations } from '../src/presentation/research-markers.js';
import type { ResearchInput } from '../src/presentation/research-markers.js';
const runtime = JSON.parse(readFileSync('public/data/research-locations.json', 'utf8')) as {
  records: ResearchInput[];
  sources: {
    path: string;
    sha256: string;
  }[];
};
describe('Complete research export', () => {
  it('includes every numbered batch, verifies source hashes, and preserves all handles and coordinates', () => {
    const paths = readdirSync('docs/research').filter(f => /^r16-settlement-roster\.batch\d+\.json$/.test(f));
    expect(runtime.sources.map(s => s.path.split('/').at(-1)).sort()).toEqual(paths.sort());
    const original: ResearchInput[] = [];
    for (const source of runtime.sources) {
      const bytes = readFileSync(source.path);
      expect(createHash('sha256').update(bytes).digest('hex')).toBe(source.sha256);
      original.push(...(JSON.parse(bytes.toString()) as {
        records: ResearchInput[];
      }).records);
    }
    expect(runtime.records.map(r => ({ id: r.proposedId, coordinates: r.coordinates, name: r.historicalName })))
      .toEqual(original.map(r => ({ id: r.proposedId, coordinates: r.coordinates, name: r.historicalName })));
  });
  it('includes all priority places from the existing gap-fill batch', () => {
    const names = researchLocations(runtime.records).locations.map(r => r.name);
    for (const name of ['Syracuse', 'Messana', 'Alexandria', 'Antioch on the Orontes', 'Seleucia Pieria', 'Apamea', 'Tarsus', 'Olbia', 'Tingis', 'Nea Paphos', 'Salamis', 'Kition', 'Amathus'])
      expect(names).toContain(name);
  });
  it('retains provenance and the most cautious confidence for identical references', () => {
    const a: ResearchInput = { proposedId: 'a', historicalName: 'Test', coordinates: { lon: 22, lat: 38 }, sources: ['Source A'] };
    const b = { ...a, proposedId: 'b', locationConfidence: 'uncertain', sources: ['Source B'] };
    const result = researchLocations([a, b]);
    expect(result.locations).toHaveLength(1);
    expect(result.locations[0]?.referenceIds).toEqual(['a', 'b']);
    expect(result.locations[0]?.sources).toEqual(['Source A', 'Source B']);
    expect(result.locations[0]?.uncertainty).toBe('disputed');
    expect(result.duplicates).toHaveLength(1);
  });
  it('keeps different co-located identities and reports their uncertainty instead of merging them', () => {
    const a: ResearchInput = { proposedId: 'a', historicalName: 'Town', coordinates: { lon: 22, lat: 38 }, sources: ['Source'] };
    const result = researchLocations([a, { ...a, proposedId: 'b', historicalName: 'Sanctuary' }]);
    expect(result.locations).toHaveLength(2);
    expect(result.possibleDuplicates).toHaveLength(1);
    expect(result.duplicates).toEqual([]);
  });
  it('never exports political or demographic research as geographic authority', () => {
    for (const r of runtime.records)
      for (const key of ['politicalAuthority', 'owner', 'population', 'government', 'initialControl'])
        expect(r).not.toHaveProperty(key);
  });
});
