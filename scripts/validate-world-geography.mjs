import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { Buffer } from 'node:buffer';
import { unzipSync } from 'fflate';
import { read as readShape } from 'shapefile';
import assert from 'node:assert/strict';
import process from 'node:process';

// Independent modern coastline sanity check; never a historical settlement gazetteer.
const source =
  'https://naturalearth.s3.amazonaws.com/10m_physical/ne_10m_land.zip';
const cache = 'data/geography/source-cache/ne_10m_land.zip';
let bytes;
try {
  bytes = await readFile(cache);
} catch {
  const r = await fetch(source);
  if (!r.ok) throw Error(`${r.status} ${source}`);
  bytes = Buffer.from(await r.arrayBuffer());
  await mkdir('data/geography/source-cache', { recursive: true });
  await writeFile(cache, bytes);
}
const zip = unzipSync(bytes),
  reference = await readShape(
    zip['ne_10m_land.shp'].buffer,
    zip['ne_10m_land.dbf'].buffer,
  );
const rings = [];
for (const f of reference.features) {
  for (const p of f.geometry.type === 'MultiPolygon'
    ? f.geometry.coordinates
    : [f.geometry.coordinates]) {
    const b = {
      west: Infinity,
      east: -Infinity,
      south: Infinity,
      north: -Infinity,
    };
    for (const [x, y] of p[0]) {
      b.west = Math.min(b.west, x);
      b.east = Math.max(b.east, x);
      b.south = Math.min(b.south, y);
      b.north = Math.max(b.north, y);
    }
    rings.push({ p, b });
  }
}
function inRing(x, y, ring) {
  let yes = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const a = ring[i],
      c = ring[j];
    if (
      a[1] > y !== c[1] > y &&
      x < ((c[0] - a[0]) * (y - a[1])) / (c[1] - a[1]) + a[0]
    )
      yes = !yes;
  }
  return yes;
}
function referenceLand(x, y) {
  return rings.some(
    ({ p, b }) =>
      x >= b.west &&
      x <= b.east &&
      y >= b.south &&
      y <= b.north &&
      inRing(x, y, p[0]) &&
      !p.slice(1).some((r) => inRing(x, y, r)),
  );
}
const contextBytes = await readFile('public/data/world-terrain/context.json');
const data = JSON.parse(contextBytes.toString()),
  mask = Buffer.from(data.coastMask.bits, 'base64');
function renderedLake(lon, lat) {
  return data.features.lakes.some((f) => {
    const ps =
      f.geometry.type === 'MultiPolygon'
        ? f.geometry.coordinates
        : [f.geometry.coordinates];
    return ps.some(
      (p) =>
        inRing(lon, lat, p[0]) && !p.slice(1).some((r) => inRing(lon, lat, r)),
    );
  });
}
function renderedLand(lon, lat) {
  const b = data.bounds,
    n = data.coastMask.size,
    c = Math.round(((lon - b.west) / (b.east - b.west)) * (n - 1)),
    r = Math.round(((b.north - lat) / (b.north - b.south)) * (n - 1)),
    i = r * n + c;
  const covered = !!(mask[i >> 3] & (1 << (i % 8)));
  // The renderer overlays GSHHG lake polygons; notably the Caspian is L2 inland water.
  return covered && !renderedLake(lon, lat);
}
const landmarks = [
  ['Iberian interior', -4, 40],
  ['Britain', -2, 54],
  ['Ireland', -8, 53],
  ['Gaul', 2, 47],
  ['Germania', 10, 52],
  ['Italy', 13, 42],
  ['Sicily', 14, 37.5],
  ['Sardinia', 9, 40],
  ['Corsica', 9, 42],
  ['Balkans', 21, 43],
  ['Greece', 22, 39],
  ['North Africa', 10, 33],
  ['Egypt', 30, 27],
  ['Anatolia', 33, 39],
  ['Levant', 36, 33],
  ['Mesopotamia', 44, 33],
  ['Bactrian vicinity', 67, 37],
  ['Eastern extent', 74, 32],
  ['Atlantic', -11, 45],
  ['Bay of Biscay', -6, 45],
  ['Tyrrhenian Sea', 11, 39],
  ['Ionian Sea', 18, 36],
  ['Aegean Sea', 25, 38],
  ['Black Sea', 33, 43],
  ['Red Sea', 37, 22],
  ['Persian Gulf', 51, 27],
];
const samples = landmarks.map(([name, lon, lat]) => ({
  name,
  lon,
  lat,
  referenceLand: referenceLand(lon, lat),
  renderedLand: renderedLand(lon, lat),
}));
for (const p of samples)
  assert.equal(p.renderedLand, p.referenceLand, JSON.stringify(p));
// A regular world-spanning grid, with a 0.08-degree neighbourhood excluded around shores.
// Different cartographic generalization and the 4097-sample render mask are not ancient coastline evidence.
let stableCompared = 0,
  coastalExcluded = 0;
const mismatches = [],
  inlandWaterExcluded = [];
for (let lat = 13; lat < 62; lat += 2)
  for (let lon = -11; lon < 75; lon += 2) {
    const expected = referenceLand(lon, lat);
    const stable = [
      [-0.08, 0],
      [0.08, 0],
      [0, -0.08],
      [0, 0.08],
    ].every(([x, y]) => referenceLand(lon + x, lat + y) === expected);
    if (!stable) {
      coastalExcluded++;
      continue;
    }
    if (expected && renderedLake(lon, lat)) {
      inlandWaterExcluded.push({
        lon,
        lat,
        reason:
          'Natural Earth land includes inland water cut out by the separate GSHHG lake layer',
      });
      continue;
    }
    stableCompared++;
    if (renderedLand(lon, lat) !== expected)
      mismatches.push({
        lon,
        lat,
        referenceLand: expected,
        renderedLand: renderedLand(lon, lat),
      });
  }
// Inland lakes may differ: Natural Earth land polygons intentionally do not cut all inland water.
const result = {
  source,
  sourceSha256: createHash('sha256').update(bytes).digest('hex'),
  contextSha256: createHash('sha256').update(contextBytes).digest('hex'),
  referenceVersion: 'Natural Earth 5.1.1, 1:10 million land polygons',
  license:
    'Public domain: https://www.naturalearthdata.com/about/terms-of-use/',
  samples,
  grid: { stableCompared, coastalExcluded, inlandWaterExcluded, mismatches },
  limitations: [
    'Modern independent cartographic check, not a 278 BCE shoreline reconstruction',
    'Sparse grid and broad landmarks do not establish sub-kilometre coordinate accuracy',
    'Natural Earth land and GSHHG lake semantics differ; inland-water exclusions are enumerated explicitly',
  ],
};
await mkdir('docs/vs5/world-evidence', { recursive: true });
await writeFile(
  'docs/vs5/world-evidence/independent-geography.json',
  JSON.stringify(result, null, 2),
);
assert.equal(
  mismatches.length,
  0,
  'Independent stable-grid mismatches require investigation',
);
process.stdout.write(
  JSON.stringify({
    landmarks: samples.length,
    stableCompared,
    coastalExcluded,
    mismatches,
  }) + '\n',
);
