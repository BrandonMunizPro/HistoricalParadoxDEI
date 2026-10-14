import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { unzipSync } from 'fflate';
import { PNG } from 'pngjs';
import assert from 'node:assert/strict';
import { TextDecoder } from 'node:util';

let bytes;
try {
  bytes = await readFile('data/geography/source-cache/geonames-IT.zip');
} catch {
  const response = await fetch(
    'https://download.geonames.org/export/dump/IT.zip',
  );
  if (!response.ok) throw Error('GeoNames reference unavailable');
  bytes = new Uint8Array(await response.arrayBuffer());
  await writeFile('data/geography/source-cache/geonames-IT.zip', bytes);
}
const places = new TextDecoder()
  .decode(unzipSync(bytes)['IT.txt'])
  .split('\n')
  .map((l) => l.split('\t'));
const atlas = JSON.parse(
  await readFile('public/data/settlement-atlas.json', 'utf8'),
);
const distance = (a, b) => {
  const r = Math.PI / 180,
    p = (b.lat - a.lat) * r,
    q = (b.lon - a.lon) * r;
  return (
    12742000 *
    Math.asin(
      Math.sqrt(
        Math.sin(p / 2) ** 2 +
          Math.cos(a.lat * r) * Math.cos(b.lat * r) * Math.sin(q / 2) ** 2,
      ),
    )
  );
};
const coordinates = [];
for (const [key, id, maxOffset] of [
  ['roma', '3169070', 2500],
  ['capua', '3167561', 1500],
  ['neapolis', '3172394', 3500],
]) {
  const p = places.find((p) => p[0] === id);
  assert.ok(p);
  const modern = { name: p[1], lat: Number(p[4]), lon: Number(p[5]) };
  const record = atlas.records.find((p) => p.key === key);
  const coordinate = record.coordinates ?? record.coordinate;
  // Atlas records use latitude/longitude; inspect only geographic fields, never population.
  const a = coordinate
    ? {
        lat: coordinate.lat ?? coordinate.latitude,
        lon: coordinate.lon ?? coordinate.longitude,
      }
    : { lat: record.lat, lon: record.lon };
  assert.ok(Number.isFinite(a.lat) && Number.isFinite(a.lon));
  const offsetMetres = Math.round(distance(a, modern));
  assert.ok(offsetMetres < maxOffset);
  coordinates.push({
    key,
    atlas: a,
    reference: { ...modern, url: `https://www.geonames.org/${id}/` },
    offsetMetres,
    toleranceMetres: maxOffset,
    interpretation:
      'Independent modern locality check only; not validation of the 278 BCE urban footprint.',
  });
}
const elevation = [];
for (const [name, lon, lat, id] of [
  ['Gran Sasso', 13.565, 42.469, 'N42E13'],
  ['Campanian plain', 14.25, 41.086, 'N41E14'],
  ['Alban hills', 12.71, 41.73, 'N41E12'],
]) {
  const t = JSON.parse(
    await readFile(`public/data/italy-terrain/${id}.json`, 'utf8'),
  );
  const c = Math.round((lon - t.bounds.west) * 128),
    r = Math.round((t.bounds.north - lat) * 128),
    copernicusMetres = t.elevations[r * 129 + c];
  const z = 8,
    tx = ((lon + 180) / 360) * 2 ** z,
    ty =
      ((1 - Math.asinh(Math.tan((lat * Math.PI) / 180)) / Math.PI) / 2) *
      2 ** z;
  const filename = `data/geography/source-cache/terrain-${z}-${Math.floor(tx)}-${Math.floor(ty)}.png`;
  let png;
  try {
    png = await readFile(filename);
  } catch {
    const response = await fetch(
      `https://s3.amazonaws.com/elevation-tiles-prod/terrarium/${z}/${Math.floor(tx)}/${Math.floor(ty)}.png`,
    );
    if (!response.ok) throw Error('Reference elevation unavailable');
    png = new Uint8Array(await response.arrayBuffer());
    await writeFile(filename, png);
  }
  const im = PNG.sync.read(png),
    i = (Math.floor((ty % 1) * 256) * 256 + Math.floor((tx % 1) * 256)) * 4;
  const mapzenMetres = Math.round(
      im.data[i] * 256 + im.data[i + 1] + im.data[i + 2] / 256 - 32768,
    ),
    differenceMetres = Math.round(copernicusMetres - mapzenMetres);
  assert.ok(Math.abs(differenceMetres) < 600);
  elevation.push({
    name,
    lon,
    lat,
    copernicusMetres,
    mapzenMetres,
    differenceMetres,
    toleranceMetres: 600,
    referenceSha256: createHash('sha256').update(png).digest('hex'),
    interpretation:
      'Separate elevation product at different sampling resolution; shared source lineage possible. Not a surveyed spot-height comparison.',
  });
}
await writeFile(
  'data/geography/italy-validation.json',
  JSON.stringify(
    {
      coordinates,
      elevation,
      reference: {
        url: 'https://download.geonames.org/export/dump/IT.zip',
        sha256: createHash('sha256').update(bytes).digest('hex'),
        license: 'GeoNames CC BY 4.0',
        checked: '2026-10-14',
      },
      limitations: [
        'No precise Rome II boundary calibration possible without georeferenced reference',
        'Ancient town footprints, river migrations and shorelines remain research-dependent',
      ],
    },
    null,
    2,
  ),
);
