import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { unzipSync } from 'fflate';
import { read as readShape } from 'shapefile';
// Existing geographic source cache only. Never edits terrain or settlement datasets.
const context = JSON.parse(
  await readFile('public/data/world-terrain/context.json', 'utf8'),
);
const archive = await readFile('data/geography/source-cache/gshhg.zip');
const zip = unzipSync(archive, {
  filter: (f) => /GSHHS_h_L3\.(shp|dbf)$/.test(f.name),
});
const base = 'GSHHS_shp/h/GSHHS_h_L3';
const source = await readShape(
  zip[base + '.shp'].buffer,
  zip[base + '.dbf'].buffer,
);
const hash = (bytes) => createHash('sha256').update(bytes).digest('hex');
const contains = (x, y, ring) => {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const a = ring[i],
      b = ring[j];
    if (
      a[1] > y !== b[1] > y &&
      x < ((b[0] - a[0]) * (y - a[1])) / (b[1] - a[1]) + a[0]
    )
      inside = !inside;
  }
  return inside;
};
const records = context.features.lakes.flatMap((f, index) =>
  (f.geometry.type === 'MultiPolygon'
    ? f.geometry.coordinates
    : [f.geometry.coordinates]
  ).map((rings, part) => ({
    id: `source-lake-${index}-${part}`,
    rings: globalThis.structuredClone(rings),
    sourceIndex: index,
  })),
);
let holes = 0;
for (const f of source.features)
  for (const p of f.geometry.type === 'MultiPolygon'
    ? f.geometry.coordinates
    : [f.geometry.coordinates]) {
    const ring = p[0],
      point = ring[0];
    if (
      point[0] < context.bounds.west ||
      point[0] > context.bounds.east ||
      point[1] < context.bounds.south ||
      point[1] > context.bounds.north
    )
      continue;
    for (const lake of records) {
      if (contains(...point, lake.rings[0])) {
        lake.rings.push(ring);
        holes++;
      }
    }
  }
await mkdir('public/data/inland-water', { recursive: true });
await writeFile(
  'public/data/inland-water/polygons.json',
  JSON.stringify({
    version: 1,
    source:
      'Existing GSHHG 2.3.7 high-resolution L2 lake polygons plus source L3 island holes; existing Italy lake supplements retained',
    archiveSha256: hash(archive),
    sourceLakesSha256: hash(JSON.stringify(context.features.lakes)),
    islandHoles: holes,
    limitations: [
      'Modern physical geography; not reconstructed 278 BCE shores',
      'Existing modern reservoirs remain source approximations; no historical water-level claim',
    ],
    records,
  }) + '\n',
);
