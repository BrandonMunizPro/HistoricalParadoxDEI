import { readFile, writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
import { Buffer } from 'node:buffer';
import {
  projectLocalMapMetres,
  unprojectLocalMapMetres,
  geographicDistanceMetres,
} from '../dist/infrastructure/world-geography.js';
const data = JSON.parse(
    await readFile('public/data/italy-terrain/context.json', 'utf8'),
  ),
  atlas = JSON.parse(
    await readFile('public/data/settlement-atlas.json', 'utf8'),
  ),
  refs = JSON.parse(
    await readFile('public/data/geographic-diagnostics.json', 'utf8'),
  );
const origin = { lon: 13.5, lat: 41.5 },
  mask = Buffer.from(data.coastMask.bits, 'base64');
const checks = refs.landmarks.map((ref) => {
  const record = atlas.records.find((r) => r.key === ref.key),
    p = record?.coordinates ?? ref,
    q = projectLocalMapMetres(p, origin),
    r = unprojectLocalMapMetres(q.east, q.north, origin),
    errorMetres = geographicDistanceMetres(p, r);
  assert.ok(errorMetres < 0.001);
  const c = Math.round(
      ((p.lon - data.bounds.west) / (data.bounds.east - data.bounds.west)) *
        (data.coastMask.size - 1),
    ),
    row = Math.round(
      ((data.bounds.north - p.lat) / (data.bounds.north - data.bounds.south)) *
        (data.coastMask.size - 1),
    ),
    i = row * data.coastMask.size + c;
  return {
    name: ref.name,
    lon: p.lon,
    lat: p.lat,
    source: record?.coordinateEvidence?.source ?? ref.source,
    roundtripErrorMetres: errorMetres,
    projectedEastMetres: q.east,
    projectedNorthMetres: q.north,
    contextMaskLand: Boolean(mask[i >> 3] & (1 << (i % 8))),
    precision:
      ref.precision ?? 'Pleiades representative point, not urban boundary',
  };
});
const unchanged = JSON.parse(
  await readFile('public/data/central-italy.json', 'utf8'),
).settlements;
assert.deepEqual(data.settlements, unchanged);
await writeFile(
  'data/geography/campaign-geography-audit.json',
  JSON.stringify(
    {
      origin,
      sourceBounds: data.bounds,
      projection: 'Spherical azimuthal equidistant; GPU X=east km, Z=-north km',
      checks,
      settlementCoordinatesUnchanged: true,
      causes: {
        perspective:
          'Previous oblique camera foreshortens north/south distances; overhead diagnostic removes that effect',
        projection:
          'Roundtrip verified; distances from the origin are preserved; transverse distortion remains at large distances',
        terrain:
          'Coarse backdrop and 650-870 m regional samples smooth peaks; DSM includes modern vegetation and buildings',
        water:
          'GSHHG masks describe modern shoreline; no ancient shoreline reconstruction',
        placement:
          'Atlas coordinates retained. Neapolis presentation anchor is separately recorded, not a replacement coordinate',
      },
      limitations: [
        'Mask lookup is a coarse diagnostic, especially at coastal localities',
        'Tiber corridor is not a surveyed channel control point',
        'No exact Rome II envelope calibration without georeferenced campaign reference',
      ],
    },
    null,
    2,
  ),
);
