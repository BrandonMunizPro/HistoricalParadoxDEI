import { describe, expect, it } from 'vitest';
import { projectedTriangleHeight, terrainCoverageInset } from '../src/presentation/terrain-surface.js';
describe('Rendered surface and tile coverage', () => {
  it('anchors to the drawn triangle, which can differ from bilinear DEM interpolation', () => {
    const vertices = [[0, 0, 0], [2, 0, 0], [2, 10, 2], [0, 0, 2]] as const;
    expect(projectedTriangleHeight([1, 1], [[0, 2, 1], [0, 3, 2]], i => vertices[i]!)).toBe(5);
    expect(projectedTriangleHeight([3, 1], [[0, 2, 1], [0, 3, 2]], i => vertices[i]!)).toBeUndefined();
  });
  it('follows supplied animated vertices rather than an old height snapshot', () => {
    let height = 2;
    const vertex = (i: number): readonly [
      number,
      number,
      number
    ] => i === 0 ? [0, height, 0] : i === 1 ? [2, height, 0] : [0, height, 2];
    expect(projectedTriangleHeight([0.5, 0.5], [[0, 1, 2]], vertex)).toBe(2);
    height = -0.042;
    expect(projectedTriangleHeight([0.5, 0.5], [[0, 1, 2]], vertex)).toBeCloseTo(-0.042);
  });
  it('scales overlap to the tile resolution instead of using a global geographic epsilon', () => {
    const b = { west: 29, east: 30, south: 30, north: 31 }, origin = { lon: 13.5, lat: 41.5 };
    const coarse = terrainCoverageInset(b, 129, origin), fine = terrainCoverageInset(b, 513, origin);
    expect(coarse[0]).toBeGreaterThan(fine[0]);
    expect(coarse[1]).toBeGreaterThan(fine[1]);
    expect(coarse[0]).toBeLessThan(0.01);
    expect(coarse[1]).toBeLessThan(0.01);
  });
});
