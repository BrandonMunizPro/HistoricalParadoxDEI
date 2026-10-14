import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { describe, it, expect } from 'vitest';
import {
  climateFamily,
  ecologyGridPoint,
  ecologyTextureUv,
  smoothTerrainReveal,
} from '../src/presentation/regional-ecology.js';
import type { EcologyGrid } from '../src/presentation/regional-ecology.js';
import {
  parentTerrainSamples,
  regularParentSample,
  terrainMorphWeight,
} from '../src/presentation/terrain-transition.js';

const metadata = JSON.parse(
  readFileSync('public/data/regional-ecology/manifest.json', 'utf8'),
) as EcologyGrid & {
  sources: { url: string; sha256: string }[];
  outputs: Record<'surface' | 'climate', { url: string; sha256: string }>;
  climate: { counts: Record<string, number>; zero: string };
};
describe('sourced modern ecological presentation', () => {
  it('covers the existing envelope and records source/output integrity', () => {
    expect(metadata.bounds).toEqual({
      west: -12,
      east: 75,
      south: 12,
      north: 62,
    });
    expect(metadata.sources).toHaveLength(2);
    for (const s of metadata.sources) {
      expect(s.url.startsWith('https://')).toBe(true);
      expect(s.sha256).toMatch(/^[0-9a-f]{64}$/);
    }
    for (const o of Object.values(metadata.outputs))
      expect(
        createHash('sha256')
          .update(readFileSync(`public${o.url}`))
          .digest('hex'),
      ).toBe(o.sha256);
    expect(
      Object.values(metadata.climate.counts).reduce((a, b) => a + b, 0),
    ).toBe(metadata.width * metadata.height);
    expect(metadata.climate.zero).toContain('no classification');
  });
  it.each([
    [0, 'unclassified'],
    [2, 'tropical'],
    [4, 'desert'],
    [5, 'desert'],
    [6, 'steppe'],
    [7, 'steppe'],
    [8, 'mediterranean'],
    [10, 'mediterranean'],
    [15, 'temperate'],
    [26, 'continental'],
    [29, 'polar'],
    [30, 'polar'],
  ] as const)(
    'classifies published numeric code %i without latitude rules',
    (code, family) => expect(climateFamily(code)).toBe(family),
  );
  it('rejects invalid codes and out-of-coverage queries', () => {
    for (const code of [-1, 31, 1.5, NaN])
      expect(() => climateFamily(code)).toThrow();
    for (const [lon, lat] of [
      [-13, 40],
      [76, 40],
      [20, 63],
      [20, 11],
      [NaN, 40],
    ])
      expect(() => ecologyGridPoint(metadata, lon!, lat!)).toThrow();
  });
  it('maps the full coverage to texel centers, including partial edge tiles', () => {
    expect(ecologyGridPoint(metadata, -12, 62)).toEqual([0, 0]);
    expect(ecologyGridPoint(metadata, 75, 12)).toEqual([
      metadata.width - 1,
      metadata.height - 1,
    ]);
    expect(ecologyTextureUv(metadata, -12, 62)).toEqual([
      0.5 / metadata.width,
      1 - 0.5 / metadata.height,
    ]);
    const [u, v] = ecologyTextureUv(metadata, 75, 12);
    expect(u).toBeCloseTo(1 - 0.5 / metadata.width, 12);
    expect(v).toBeCloseTo(0.5 / metadata.height, 12);
  });
});

describe('continuous terrain transitions', () => {
  it.each([2, 4])(
    'retains shared edge samples in parent surface at stride %i',
    (stride) => {
      const n = 129,
        map = parentTerrainSamples(n, stride);
      for (let y = 0; y < n; y++)
        for (let x = 0; x < n; x++)
          if (x === 0 || y === 0 || x === n - 1 || y === n - 1) {
            const p = map[y * n + x]!,
              field = (id: number): number => Math.sin(id * 0.137) * 1000;
            expect(
              p.ids.reduce((v, id, i) => v + field(id) * p.weights[i]!, 0),
            ).toBeCloseTo(field(y * n + x), 8);
          }
    },
  );
  it('reproduces planes and bounded interpolation through full-border fan triangles', () => {
    const n = 17,
      field = (id: number): number => (id % n) * 3 + Math.floor(id / n) * 7,
      map = parentTerrainSamples(n, 4);
    for (let y = 0; y < n; y++)
      for (let x = 0; x < n; x++) {
        const s = map[y * n + x]!;
        expect(s.weights.reduce((a, b) => a + b, 0)).toBeCloseTo(1, 12);
        expect(s.weights.every((w) => w >= -1e-9 && w <= 1 + 1e-9)).toBe(true);
        expect(
          s.ids.reduce((v, id, i) => v + field(id) * s.weights[i]!, 0),
        ).toBeCloseTo(field(y * n + x), 8);
      }
  });
  it('matches regular overview topology and both sides of its diagonal', () => {
    const a = regularParentSample(9, 4, 1, 1),
      b = regularParentSample(9, 4, 3, 3);
    expect(a.ids).toEqual([0, 3, 1]);
    expect(b.ids).toEqual([3, 4, 1]);
    expect(a.weights).toEqual([0.5, 0.25, 0.25]);
    expect(b.weights).toEqual([0.25, 0.5, 0.25]);
    expect(regularParentSample(9, 4, 8, 8).weights).toEqual([0, 1, 0]);
    expect(() => regularParentSample(1, 1, 0, 0)).toThrow();
  });
  it('morphs continuously and completes before both hysteretic LOD switches', () => {
    expect(terrainMorphWeight(100, 260)).toBe(0);
    expect(terrainMorphWeight(260 * 0.92, 260)).toBe(1);
    let last = 0;
    for (let distance = 150; distance < 300; distance++) {
      const v = terrainMorphWeight(distance, 260);
      expect(v).toBeGreaterThanOrEqual(last);
      expect(v - last).toBeLessThan(0.05);
      last = v;
    }
    expect(() => terrainMorphWeight(NaN, 260)).toThrow();
  });
  it('reveals new terrain gradually with bounded endpoints', () => {
    expect(smoothTerrainReveal(-10)).toBe(0);
    expect(smoothTerrainReveal(0)).toBe(0);
    expect(smoothTerrainReveal(325)).toBe(0.5);
    expect(smoothTerrainReveal(650)).toBe(1);
    expect(smoothTerrainReveal(10000)).toBe(1);
    expect(() => smoothTerrainReveal(0, 0)).toThrow();
  });
});
