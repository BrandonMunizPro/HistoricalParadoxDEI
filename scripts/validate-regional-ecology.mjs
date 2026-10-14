import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { PNG } from 'pngjs';
import assert from 'node:assert/strict';
import process from 'node:process';

const root = 'public/data/regional-ecology',
  manifest = JSON.parse(await readFile(`${root}/manifest.json`, 'utf8'));
const surfaceBytes = await readFile(`public${manifest.outputs.surface.url}`),
  classBytes = await readFile(`public${manifest.outputs.climate.url}`);
assert.equal(
  createHash('sha256').update(surfaceBytes).digest('hex'),
  manifest.outputs.surface.sha256,
);
assert.equal(
  createHash('sha256').update(classBytes).digest('hex'),
  manifest.outputs.climate.sha256,
);
const surface = PNG.sync.read(surfaceBytes),
  climate = PNG.sync.read(classBytes);
assert.equal(surface.width, manifest.width);
assert.equal(surface.height, manifest.height);
assert.equal(climate.width, manifest.width);
assert.equal(climate.height, manifest.height);
const pixel = (lon, lat) => {
  const b = manifest.bounds;
  return (
    (Math.round(
      ((b.north - lat) / (b.north - b.south)) * (manifest.height - 1),
    ) *
      manifest.width +
      Math.round(((lon - b.west) / (b.east - b.west)) * (manifest.width - 1))) *
    4
  );
};
const counts = {};
for (let i = 0; i < climate.data.length; i += 4) {
  const code = climate.data[i];
  assert.ok(code <= 30);
  assert.equal(climate.data[i + 3], 255);
  assert.equal(surface.data[i + 3], 255);
  counts[code] = (counts[code] ?? 0) + 1;
}
assert.deepEqual(counts, manifest.climate.counts);
for (const p of manifest.probes) {
  const i = pixel(p.lon, p.lat);
  assert.equal(climate.data[i], p.climateCode, p.name);
  assert.deepEqual(
    Array.from(surface.data.slice(i, i + 3)),
    p.materialRgb,
    p.name,
  );
}
const p = (name) => manifest.probes.find((p) => p.name === name);
assert.equal(p('Sahara').climateCode, 4);
assert.equal(p('Arabian interior').climateCode, 4);
assert.equal(p('Steppe').climateCode, 7);
assert.equal(p('Temperate central Europe').climateCode, 15);
assert.equal(p('Greece').climateCode, 8);
const greenness = (rgb) => rgb[1] - rgb[0];
assert.ok(
  greenness(p('Nile valley').materialRgb) >
    greenness(p('Western desert near Nile').materialRgb) + 5,
  'Nile source corridor must remain distinct from neighbouring desert',
);
const world = JSON.parse(
  await readFile('public/data/world-terrain/context.json', 'utf8'),
);
const missing = [],
  worldLandCells = world.land.filter(Boolean).length;
for (let r = 0; r < world.height; r++)
  for (let c = 0; c < world.width; c++)
    if (world.land[r * world.width + c]) {
      const b = world.bounds,
        lon = b.west + (c / (world.width - 1)) * (b.east - b.west),
        lat = b.north - (r / (world.height - 1)) * (b.north - b.south);
      if (climate.data[pixel(lon, lat)] === 0) missing.push({ lon, lat });
    }
// Enumerate rather than painting an invented fallback classification over water,
// mismatched shorelines, small lakes or unresolved source no-data.
const result = {
  sourceManifestHash: createHash('sha256')
    .update(await readFile(`${root}/manifest.json`))
    .digest('hex'),
  pixels: manifest.width * manifest.height,
  counts,
  probes: manifest.probes,
  sourceCoverage: {
    worldLandCells,
    unclassifiedLandMaskCells: missing.length,
    unclassifiedCoordinates: missing,
    interpretation:
      'GSHHG continental land mask includes inland water; class zero means no climate classification. These points include lakes and coast generalization differences, not necessarily source holes.',
  },
  assertions: [
    'Output hashes, dimensions and every climate code validated',
    'Complete material lattice; no transparent/missing output pixels',
    'Published climate families verified at broad reference coordinates',
    'Sahara and Arabian interior desert classes; Mediterranean Greece and temperate central Europe',
    'Source-derived Nile corridor visually distinguishable from adjacent desert',
    'All unclassified continental-mask samples explicitly enumerated, without fabricated classes',
  ],
  limitations: [
    'Full pixel coverage is not proof of source thematic accuracy',
    'Generalized cartographic RGB is an ecological presentation reference, not a categorical observation',
    'No ancient ecological or agricultural reconstruction is claimed',
  ],
};
await mkdir('data/geography', { recursive: true });
await writeFile(
  'data/geography/regional-ecology-validation.json',
  JSON.stringify(result, null, 2),
);
process.stdout.write(
  JSON.stringify({
    pixels: result.pixels,
    worldLandCells,
    unclassifiedLandMaskCells: missing.length,
    probes: manifest.probes.length,
  }) + '\n',
);
