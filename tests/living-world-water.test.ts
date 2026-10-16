import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { inlandWaterMask, insideWater, waterPolygon, sourceTerrainHeight } from '../src/presentation/inland-water.js';
import type { WaterRing } from '../src/presentation/inland-water.js';
import { projectLocalMapMetres, unprojectLocalMapMetres } from '../src/infrastructure/world-geography.js';
describe('Living world geographic regressions', () => {
  it('never wraps an off-tile scanline into unrelated land rows', () => {
    // Upper lobe west of the tile; lower lobe intersects. The previous fill
    // used end=-3 on row zero and erased almost the entire tile.
    const p = waterPolygon([[[-6, 6], [-3, 6], [-3, 2], [3, 2], [3, -1], [-6, -1], [-6, 6]]]);
    const b = { west: 0, east: 4, south: 0, north: 4 };
    const mask = inlandWaterMask(b, 5, [p]);
    expect([...mask.slice(0, 10)]).toEqual(new Array(10).fill(0));
    expect(mask[20]).toBe(255);
    expect(mask[24]).toBe(0);
  });
  it('preserves island holes and does not let holes erase overlapping water features', () => {
    const outer: WaterRing = [[-1, -1], [5, -1], [5, 5], [-1, 5], [-1, -1]];
    const hole: WaterRing = [[1, 1], [3, 1], [3, 3], [1, 3], [1, 1]];
    const p = waterPolygon([outer, hole]);
    const b = { west: 0, east: 4, south: 0, north: 4 };
    expect(inlandWaterMask(b, 5, [p])[12]).toBe(0);
    expect(inlandWaterMask(b, 5, [p, waterPolygon([hole])])[12]).toBe(255);
  });
  const source = JSON.parse(readFileSync('public/data/inland-water/polygons.json', 'utf8')) as {
    records: {
      rings: WaterRing[];
    }[];
  };
  const polygons = source.records.map(r => waterPolygon(r.rings));
  for (const [name, west, south, east, north] of [
    ['Egypt', 29, 24, 34, 32], ['Armenia', 43, 37, 48, 42],
    ['Caspian', 48, 37, 53, 42], ['Black Sea', 28, 40, 42, 46],
  ] as const) {
    it(`${name}: clipped raster agrees with independent point-in-polygon queries`, () => {
      const b = { west, south, east, north }, size = 65;
      const mask = inlandWaterMask(b, size, polygons);
      for (let y = 0; y < size; y++)
        for (let x = 0; x < size; x++) {
          const lon = west + x / (size - 1) * (east - west), lat = north - y / (size - 1) * (north - south);
          expect(mask[y * size + x] !== 0, `${name} ${lon},${lat}`).toBe(polygons.some(p => insideWater(lon, lat, p)));
        }
    });
  }
  it('keeps below-sea dry depressions signed instead of identifying water by elevation', () => {
    expect(sourceTerrainHeight(-133)).toBeCloseTo(-0.1995);
    expect(sourceTerrainHeight(-28)).toBeCloseTo(-0.042);
  });
  it('round trips terrain and settlement coordinates throughout the campaign envelope', () => {
    const origin = { lon: 13.5, lat: 41.5 };
    for (const [lon, lat] of [[-12, 12], [75, 62], [31.2, 30.1], [44.5, 40.2], [51, 41], [33.9, 27.7], [15.3, 37.1], [33.9, 35.2]]) {
      const p = projectLocalMapMetres({ lon: lon!, lat: lat! }, origin);
      const q = unprojectLocalMapMetres(p.east, p.north, origin);
      expect(q.lon).toBeCloseTo(lon!, 8);
      expect(q.lat).toBeCloseTo(lat!, 8);
    }
  });
});
