import { readFile, writeFile, mkdir, copyFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { Buffer } from 'node:buffer';
import process from 'node:process';
import { fromUrl } from 'geotiff';
import { unzipSync } from 'fflate';
import { read as readShape } from 'shapefile';

const out = 'public/data/regional-details',
  cache = 'data/geography/source-cache';
await mkdir(out, { recursive: true });
await mkdir(cache, { recursive: true });
const scope = JSON.parse(
    await readFile('data/geography/regional-detail-scope.json', 'utf8'),
  ),
  world = JSON.parse(
    await readFile('public/data/world-terrain/context.json', 'utf8'),
  );
let hydroArchive;
try {
  hydroArchive = await readFile(`${cache}/gshhg.zip`);
} catch {
  const response = await fetch(
    'https://www.soest.hawaii.edu/pwessel/gshhg/gshhg-shp-2.3.7.zip',
  );
  if (!response.ok) throw Error('Regional hydrology source unavailable');
  hydroArchive = Buffer.from(await response.arrayBuffer());
  await writeFile(`${cache}/gshhg.zip`, hydroArchive);
}
const fullCoast = unzipSync(hydroArchive, {
  filter: (f) => /GSHHS_f_L1\.(shp|dbf)$/.test(f.name),
});
const fullLand = await readShape(
  fullCoast['GSHHS_shp/f/GSHHS_f_L1.shp'].buffer,
  fullCoast['GSHHS_shp/f/GSHHS_f_L1.dbf'].buffer,
);
const refinedLand = [];
for (const region of scope.regions) {
  const b = {
    west: region.bounds.west - 0.01,
    east: region.bounds.east + 0.01,
    south: region.bounds.south - 0.01,
    north: region.bounds.north + 0.01,
  };
  for (const f of fullLand.features)
    for (const p of f.geometry.type === 'MultiPolygon'
      ? f.geometry.coordinates
      : [f.geometry.coordinates]) {
      const rings = p.map((r) => clip(r, b)).filter((r) => r.length);
      if (rings.length)
        refinedLand.push({ geometry: { type: 'Polygon', coordinates: rings } });
    }
}
world.features.land = refinedLand;
const hash = (b) => createHash('sha256').update(b).digest('hex'),
  inside = (b, x, y) =>
    x >= b.west && x <= b.east && y >= b.south && y <= b.north;
function clip(ring, b) {
  let p = ring.slice(0, -1);
  for (const [axis, v, sign] of [
    [0, b.west, 1],
    [0, b.east, -1],
    [1, b.south, 1],
    [1, b.north, -1],
  ]) {
    const q = [];
    for (let i = 0; i < p.length; i++) {
      const a = p[i],
        c = p[(i + 1) % p.length],
        ai = (a[axis] - v) * sign >= 0,
        ci = (c[axis] - v) * sign >= 0;
      if (ai) q.push(a);
      if (ai !== ci) {
        const t = (v - a[axis]) / (c[axis] - a[axis]);
        q.push([a[0] + t * (c[0] - a[0]), a[1] + t * (c[1] - a[1])]);
      }
    }
    p = q;
  }
  return p.length > 2 ? [...p, p[0]] : [];
}
function masks(b) {
  const padded = {
    west: b.west - 1e-8,
    east: b.east + 1e-8,
    south: b.south - 1e-8,
    north: b.north + 1e-8,
  };
  const rings = world.features.land.flatMap((f) =>
    (f.geometry.type === 'MultiPolygon'
      ? f.geometry.coordinates
      : [f.geometry.coordinates]
    ).flatMap((p) => p.map((r) => clip(r, padded)).filter((r) => r.length)),
  );
  const mask = (size) => {
    const land = new Array(size * size).fill(false);
    for (let row = 0; row < size; row++) {
      const y = b.north - (row / (size - 1)) * (b.north - b.south),
        cross = [];
      for (const ring of rings)
        for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
          const a = ring[i],
            c = ring[j];
          if (a[1] > y !== c[1] > y)
            cross.push(((c[0] - a[0]) * (y - a[1])) / (c[1] - a[1]) + a[0]);
        }
      cross.sort((a, b) => a - b);
      for (let i = 0; i + 1 < cross.length; i += 2) {
        const start = Math.max(
            0,
            Math.ceil(((cross[i] - b.west) / (b.east - b.west)) * (size - 1)),
          ),
          end = Math.min(
            size - 1,
            Math.floor(
              ((cross[i + 1] - b.west) / (b.east - b.west)) * (size - 1),
            ),
          );
        for (let c = start; c <= end; c++) land[row * size + c] = true;
      }
    }
    return land;
  };
  const land = mask(129),
    shore = mask(513),
    bits = new Uint8Array(Math.ceil(shore.length / 8));
  for (let i = 0; i < shore.length; i++)
    if (shore[i]) bits[i >> 3] |= 1 << (i % 8);
  return {
    land,
    coastMask: { size: 513, bits: Buffer.from(bits).toString('base64') },
  };
}
const sources = [],
  tiles = [],
  gaps = [];
function sourceUrl(lon, lat) {
  return `https://copernicus-dem-30m.s3.amazonaws.com/Copernicus_DSM_COG_10_N${lat}_00_${lon < 0 ? 'W' : 'E'}${String(Math.abs(lon)).padStart(3, '0')}_00_DEM/Copernicus_DSM_COG_10_N${lat}_00_${lon < 0 ? 'W' : 'E'}${String(Math.abs(lon)).padStart(3, '0')}_00_DEM.tif`;
}
async function sample(id, b, source) {
  const path = `${cache}/detail-${id}.json`;
  let raw;
  try {
    raw = JSON.parse(await readFile(path, 'utf8'));
  } catch {
    const tif = await fromUrl(source),
      r = await tif.readRasters({
        bbox: [b.west, b.south, b.east, b.north],
        width: 129,
        height: 129,
        interleave: true,
        resampleMethod: 'bilinear',
      });
    raw = Array.from(r, (v) => Math.round(v * 10) / 10);
    if (
      raw.length !== 129 ** 2 ||
      !raw.every((v) => Number.isFinite(v) && v >= -500 && v <= 9000)
    )
      throw Error('Invalid source raster ' + id);
    await writeFile(path, JSON.stringify(raw));
  }
  sources.push({
    id,
    url: source,
    sampledWindowSha256: hash(JSON.stringify(raw)),
  });
  const at = (x, y) =>
    raw[Math.max(0, Math.min(128, y)) * 129 + Math.max(0, Math.min(128, x))];
  return raw.map((_, i) => {
    const x = ((i % 129) / 128) * 129 - 0.5,
      y = (Math.floor(i / 129) / 128) * 129 - 0.5,
      c = Math.floor(x),
      r = Math.floor(y),
      fx = x - c,
      fy = y - r;
    return (
      Math.round(
        ((at(c, r) * (1 - fx) + at(c + 1, r) * fx) * (1 - fy) +
          (at(c, r + 1) * (1 - fx) + at(c + 1, r + 1) * fx) * fy) *
          10,
      ) / 10
    );
  });
}
const jobs = [];
for (const region of scope.regions)
  for (let lat = region.bounds.south; lat < region.bounds.north; lat++)
    for (let lon = region.bounds.west; lon < region.bounds.east; lon++) {
      const b = { west: lon, east: lon + 1, south: lat, north: lat + 1 },
        m = masks(b);
      if (
        !m.land.some(Boolean) &&
        !Buffer.from(m.coastMask.bits, 'base64').some((v) => v !== 0)
      )
        continue;
      jobs.push({
        region,
        b,
        m,
        id: `detail-${region.id}-N${lat}E${lon}`,
        source: sourceUrl(lon, lat),
      });
    }
let cursor = 0;
await Promise.all(
  Array.from({ length: 3 }, async () => {
    while (cursor < jobs.length) {
      const j = jobs[cursor++];
      try {
        const elevations = await sample(j.id, j.b, j.source);
        tiles.push({
          id: j.id,
          kind: 'regional',
          detailArea: j.region.id,
          bounds: j.b,
          width: 129,
          height: 129,
          elevations,
          ...j.m,
          source: j.source,
        });
      } catch (e) {
        gaps.push({ id: j.id, bounds: j.b, reason: String(e) });
      }
    }
  }),
);
// Deterministic shared-coordinate averaging, independent of concurrent fetch order.
tiles.sort((a, b) => a.id.localeCompare(b.id));
const edges = new Map();
for (const t of tiles)
  for (let r = 0; r < 129; r++)
    for (let c = 0; c < 129; c++)
      if (r === 0 || r === 128 || c === 0 || c === 128) {
        const key = `${t.bounds.west * 128 + c}/${t.bounds.north * 128 - r}`,
          i = r * 129 + c;
        const e = edges.get(key) ?? [];
        e.push([t, i, t.elevations[i]]);
        edges.set(key, e);
      }
for (const e of edges.values()) {
  const mean =
    Math.round((e.reduce((s, a) => s + a[2], 0) / e.length) * 10) / 10;
  for (const [t, i] of e) t.elevations[i] = mean;
}
function value(t, lon, lat) {
  const x = Math.max(
      0,
      Math.min(
        128,
        ((lon - t.bounds.west) / (t.bounds.east - t.bounds.west)) * 128,
      ),
    ),
    y = Math.max(
      0,
      Math.min(
        128,
        ((t.bounds.north - lat) / (t.bounds.north - t.bounds.south)) * 128,
      ),
    ),
    c = Math.floor(x),
    r = Math.floor(y),
    fx = x - c,
    fy = y - r,
    at = (c, r) => t.elevations[Math.min(128, r) * 129 + Math.min(128, c)];
  return (
    (at(c, r) * (1 - fx) + at(c + 1, r) * fx) * (1 - fy) +
    (at(c, r + 1) * (1 - fx) + at(c + 1, r + 1) * fx) * fy
  );
}
for (const region of scope.regions)
  for (const w of region.windows) {
    const b = {
        west: w.lon - w.span / 2,
        east: w.lon + w.span / 2,
        south: w.lat - w.span / 2,
        north: w.lat + w.span / 2,
      },
      id = `window-${region.id}-${w.id}`,
      source = sourceUrl(Math.floor(w.lon), Math.floor(w.lat));
    const elevations = await sample(id, b, source),
      parent = tiles.find(
        (t) => t.detailArea === region.id && inside(t.bounds, w.lon, w.lat),
      );
    if (!parent) throw Error('Missing local parent ' + id);
    for (let r = 0; r < 129; r++)
      for (let c = 0; c < 129; c++) {
        const edge = Math.min(c, r, 128 - c, 128 - r),
          t = Math.min(1, edge / 16),
          blend = t * t * (3 - 2 * t),
          lon = b.west + (c / 128) * w.span,
          lat = b.north - (r / 128) * w.span,
          i = r * 129 + c;
        elevations[i] =
          value(parent, lon, lat) * (1 - blend) + elevations[i] * blend;
      }
    tiles.push({
      id,
      kind: 'city',
      purpose: 'Physical terrain window, no settlement identity',
      detailArea: region.id,
      bounds: b,
      width: 129,
      height: 129,
      elevations,
      ...masks(b),
      source,
    });
  }
const catalog = [];
for (const t of tiles) {
  const bytes = JSON.stringify(t);
  await writeFile(`${out}/${t.id}.json`, bytes);
  catalog.push({
    id: t.id,
    kind: t.kind,
    detailArea: t.detailArea,
    bounds: t.bounds,
    url: `/data/regional-details/${t.id}.json`,
    sha256: hash(bytes),
  });
}
const zip = unzipSync(hydroArchive, {
    filter: (f) => /river_h_L0[345]\.(shp|dbf)$/.test(f.name),
  }),
  features = [];
for (let level = 3; level <= 5; level++) {
  const name = `WDBII_shp/h/WDBII_river_h_L0${level}`,
    collection = await readShape(
      zip[`${name}.shp`].buffer,
      zip[`${name}.dbf`].buffer,
    );
  for (const region of scope.regions)
    for (const f of collection.features)
      for (const coords of f.geometry.type === 'MultiLineString'
        ? f.geometry.coordinates
        : [f.geometry.coordinates]) {
        let run = [];
        const flush = () => {
          if (run.length > 1)
            features.push({
              type: 'Feature',
              properties: {
                detailArea: region.id,
                level,
                source: 'GSHHG WDBII high-resolution modern hydrography',
              },
              geometry: { type: 'LineString', coordinates: run },
            });
          run = [];
        };
        for (const p of coords) {
          if (inside(region.bounds, ...p)) run.push(p);
          else flush();
        }
        flush();
      }
}
await writeFile(
  `${out}/hydrology.json`,
  JSON.stringify({ type: 'FeatureCollection', features }),
);
const hydro = {
  rivers: world.features.rivers_lake_centerlines.filter((f) =>
    [3, 4, 5].includes(f.properties.level),
  ),
};
// Retain world L1/L2 hydrology and source regional L3-L5 geometry separately.
// Runtime excludes intermittent L5 channels; no roads or ancient alignments are invented.
await writeFile(
  `${out}/manifest.json`,
  JSON.stringify(
    {
      version: 1,
      coordinateReference: 'WGS84 degrees; Copernicus DSM metres EGM2008',
      scope:
        'Modern physical detail only; not ancient settlements or administrative geography',
      areas: scope.regions.map((r) => ({
        id: r.id,
        bounds: r.bounds,
        maximumCameraDistanceKm: r.maximumCameraDistanceKm,
      })),
      regionalSpacingMetres: [650, 870],
      windowSpacingMetres: [42, 55],
      coastlineSource:
        'GSHHG 2.3.7 full-resolution L1 coastline; same source archive/license as world, finer generalization',
      coastSampling:
        '513 bits per edge; vector generalization/accuracy is not improved by fine rasterization',
      tiles: catalog,
      sources: sources.sort((a, b) => a.id.localeCompare(b.id)),
      gaps,
      hydrology: {
        url: '/data/regional-details/hydrology.json',
        segments: features.length,
        sourceArchive:
          'https://www.soest.hawaii.edu/pwessel/gshhg/gshhg-shp-2.3.7.zip',
        sourceSha256: hash(hydroArchive),
        historicalReconstruction: false,
      },
      existingFineHydrologySegments: hydro.rivers.length,
      limitations: [
        'Modern DSM includes modern surface features; not a 278 BCE reconstruction',
        'Ecological material resolution remains about 2.47km latitude',
        'Existing world rivers plus GSHHG WDBII classes 3-5; ancient courses and water engineering remain research dependent',
        'Only listed bounds and local windows have this new sampling; other regions remain coarse until imported',
      ],
    },
    null,
    2,
  ),
);
for (const name of [
  'ATTRIBUTION.txt',
  'GSHHG-LICENSE.txt',
  'COPYING.LESSERv3',
  'COPYINGv3',
])
  await copyFile(`public/data/italy-terrain/${name}`, `${out}/${name}`);
process.stdout.write(
  JSON.stringify({
    regionalTiles: tiles.filter((t) => t.kind === 'regional').length,
    windows: tiles.filter((t) => t.kind === 'city').length,
    gaps,
  }) + '\n',
);
if (gaps.length) process.exitCode = 1;
