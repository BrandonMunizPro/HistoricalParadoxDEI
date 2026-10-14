import { readFile, writeFile, mkdir, copyFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { Buffer } from 'node:buffer';
import process from 'node:process';
import { PNG } from 'pngjs';
import { unzipSync } from 'fflate';
import { read as readShape } from 'shapefile';

// A physical coverage catalog, never settlement, faction or administrative authority.
const bounds = { west: -12, east: 75, south: 12, north: 62 },
  out = 'public/data/world-terrain',
  cache = 'data/geography/source-cache';
await mkdir(out, { recursive: true });
await mkdir(cache, { recursive: true });
const sources = [],
  hash = (b) => createHash('sha256').update(b).digest('hex');
async function get(url, key) {
  let bytes;
  try {
    bytes = await readFile(`${cache}/${key}`);
  } catch {
    const r = await fetch(url);
    if (!r.ok) throw Error(`${r.status} ${url}`);
    bytes = Buffer.from(await r.arrayBuffer());
    await writeFile(`${cache}/${key}`, bytes);
  }
  sources.push({ url, sha256: hash(bytes) });
  return bytes;
}
const archive = await get(
  'https://www.soest.hawaii.edu/pwessel/gshhg/gshhg-shp-2.3.7.zip',
  'gshhg.zip',
);
const zip = unzipSync(archive, {
  filter: (f) =>
    /GSHHS_h_L[12]\.(shp|dbf)$|river_h_L0[12]\.(shp|dbf)$/.test(f.name),
});
function clip(ring, b = bounds) {
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
function extent(ring) {
  const b = {
    west: Infinity,
    east: -Infinity,
    south: Infinity,
    north: -Infinity,
  };
  for (const [x, y] of ring) {
    b.west = Math.min(b.west, x);
    b.east = Math.max(b.east, x);
    b.south = Math.min(b.south, y);
    b.north = Math.max(b.north, y);
  }
  return b;
}
const features = { land: [], lakes: [], rivers_lake_centerlines: [] };
for (const [level, theme] of [
  [1, 'land'],
  [2, 'lakes'],
]) {
  const name = `GSHHS_shp/h/GSHHS_h_L${level}`,
    collection = await readShape(
      zip[`${name}.shp`].buffer,
      zip[`${name}.dbf`].buffer,
    );
  for (const f of collection.features) {
    const ps =
      f.geometry.type === 'MultiPolygon'
        ? f.geometry.coordinates
        : [f.geometry.coordinates];
    for (const p of ps) {
      const rings = p.map((r) => clip(r)).filter((r) => r.length);
      if (!rings.length) continue;
      const b = extent(rings[0]);
      if (theme === 'lakes' && (b.east - b.west) * (b.north - b.south) < 0.08)
        continue;
      features[theme].push({
        type: 'Feature',
        properties: { source: 'GSHHG 2.3.7 modern physical feature' },
        geometry: { type: 'Polygon', coordinates: rings },
      });
    }
  }
}
const rings = features.land.map((f) => ({
  p: f.geometry.coordinates,
  b: extent(f.geometry.coordinates[0]),
}));
function landMask(b, size) {
  const mask = new Array(size * size).fill(false);
  for (let r = 0; r < size; r++) {
    const y = b.north - (r / (size - 1)) * (b.north - b.south),
      cross = [];
    for (const { p, b: rb } of rings) {
      if (y < rb.south || y > rb.north || rb.east < b.west || rb.west > b.east)
        continue;
      for (const ring of p)
        for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
          const a = ring[i],
            c = ring[j];
          if (a[1] > y !== c[1] > y)
            cross.push(((c[0] - a[0]) * (y - a[1])) / (c[1] - a[1]) + a[0]);
        }
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
      for (let c = start; c <= end; c++) mask[r * size + c] = true;
    }
  }
  return mask;
}
function packedMask(b, size) {
  const mask = landMask(b, size),
    bits = new Uint8Array(Math.ceil(mask.length / 8));
  for (let i = 0; i < mask.length; i++)
    if (mask[i]) bits[i >> 3] |= 1 << (i % 8);
  return { size, bits: Buffer.from(bits).toString('base64') };
}
for (let level = 1; level <= 2; level++) {
  const name = `WDBII_shp/h/WDBII_river_h_L0${level}`,
    collection = await readShape(
      zip[`${name}.shp`].buffer,
      zip[`${name}.dbf`].buffer,
    );
  for (const f of collection.features) {
    const lines =
      f.geometry.type === 'MultiLineString'
        ? f.geometry.coordinates
        : [f.geometry.coordinates];
    for (const line of lines) {
      let segment = [];
      const flush = () => {
        if (segment.length > 1)
          features.rivers_lake_centerlines.push({
            type: 'Feature',
            properties: { source: 'GSHHG WDBII', level },
            geometry: { type: 'LineString', coordinates: segment },
          });
        segment = [];
      };
      for (const p of line) {
        if (
          p[0] >= bounds.west &&
          p[0] <= bounds.east &&
          p[1] >= bounds.south &&
          p[1] <= bounds.north
        )
          segment.push(p);
        else flush();
      }
      flush();
    }
  }
}
const z = 6,
  merc = (lon, lat) => [
    ((lon + 180) / 360) * 2 ** z,
    ((1 - Math.asinh(Math.tan((lat * Math.PI) / 180)) / Math.PI) / 2) * 2 ** z,
  ];
const nw = merc(bounds.west, bounds.north),
  se = merc(bounds.east, bounds.south),
  jobs = [];
for (let y = Math.floor(nw[1]); y <= Math.floor(se[1]); y++)
  for (let x = Math.floor(nw[0]); x <= Math.floor(se[0]); x++)
    jobs.push([x, y]);
const images = new Map();
let cursor = 0;
await Promise.all(
  Array.from({ length: 4 }, async () => {
    while (cursor < jobs.length) {
      const [x, y] = jobs[cursor++],
        url = `https://s3.amazonaws.com/elevation-tiles-prod/terrarium/${z}/${x}/${y}.png`,
        bytes = await get(url, `terrain-${z}-${x}-${y}.png`);
      images.set(`${x}/${y}`, PNG.sync.read(bytes));
    }
  }),
);
function elevation(lon, lat) {
  const [tx, ty] = merc(lon, lat),
    px = tx * 256 - 0.5,
    py = ty * 256 - 0.5,
    x0 = Math.floor(px),
    y0 = Math.floor(py),
    fx = px - x0,
    fy = py - y0;
  const at = (x, y) => {
    const image = images.get(`${Math.floor(x / 256)}/${Math.floor(y / 256)}`);
    if (!image) {
      const im = images.get(`${Math.floor(tx)}/${Math.floor(ty)}`);
      const i =
        (Math.max(0, Math.min(255, y - Math.floor(ty) * 256)) * 256 +
          Math.max(0, Math.min(255, x - Math.floor(tx) * 256))) *
        4;
      return im.data[i] * 256 + im.data[i + 1] + im.data[i + 2] / 256 - 32768;
    }
    const i = ((((y % 256) + 256) % 256) * 256 + (((x % 256) + 256) % 256)) * 4;
    return (
      image.data[i] * 256 + image.data[i + 1] + image.data[i + 2] / 256 - 32768
    );
  };
  return Math.round(
    (at(x0, y0) * (1 - fx) + at(x0 + 1, y0) * fx) * (1 - fy) +
      (at(x0, y0 + 1) * (1 - fx) + at(x0 + 1, y0 + 1) * fx) * fy,
  );
}
const width = 513,
  height = 513,
  elevations = [];
for (let r = 0; r < height; r++)
  for (let c = 0; c < width; c++)
    elevations.push(
      elevation(bounds.west + (c / 512) * 87, bounds.north - (r / 512) * 50),
    );
const italy = JSON.parse(
  await readFile('public/data/italy-terrain/context.json', 'utf8'),
);
// Retain the finer Italian hydrography already validated in the local prototype.
// World L1/L2 are the major-river selection, not a replacement for its L3-L5 rivers.
features.rivers_lake_centerlines.push(
  ...italy.features.rivers_lake_centerlines.filter(
    (f) => f.properties.level >= 3,
  ),
);
for (const f of italy.features.lakes) {
  const polygons =
    f.geometry.type === 'MultiPolygon'
      ? f.geometry.coordinates
      : [f.geometry.coordinates];
  for (const coordinates of polygons) {
    const b = extent(coordinates[0]);
    if (
      (b.east - b.west) * (b.north - b.south) < 0.08 &&
      b.west >= 9 &&
      b.east <= 20 &&
      b.south >= 36 &&
      b.north <= 46
    )
      features.lakes.push({ ...f, geometry: { type: 'Polygon', coordinates } });
  }
}
await writeFile(
  `${out}/Mapzen-ATTRIBUTION.md`,
  await get(
    'https://raw.githubusercontent.com/tilezen/joerd/master/docs/attribution.md',
    'mapzen-attribution.md',
  ),
);
const catalog = [];
for (let lat = 12; lat < 62; lat += 5)
  for (let lon = -12; lon < 75; lon += 5) {
    const b = {
        west: lon,
        east: Math.min(75, lon + 5),
        south: lat,
        north: Math.min(62, lat + 5),
      },
      land = landMask(b, 129);
    if (!land.some(Boolean)) continue;
    const id = `world-${lat}-${lon}`,
      values = [];
    for (let r = 0; r < 129; r++)
      for (let c = 0; c < 129; c++)
        values.push(
          elevation(
            b.west + (c / 128) * (b.east - b.west),
            b.north - (r / 128) * (b.north - b.south),
          ),
        );
    const tile = {
      id,
      kind: 'world-regional',
      bounds: b,
      width: 129,
      height: 129,
      elevations: values,
      land,
      source: 'https://s3.amazonaws.com/elevation-tiles-prod/terrarium/6/',
      coastMask: packedMask(b, 513),
    };
    const bytes = JSON.stringify(tile);
    await writeFile(`${out}/${id}.json`, bytes);
    catalog.push({
      id,
      kind: tile.kind,
      bounds: b,
      url: `/data/world-terrain/${id}.json`,
      sha256: hash(bytes),
    });
  }
await writeFile(
  `${out}/context.json`,
  JSON.stringify({
    ...italy,
    bounds,
    width,
    height,
    elevations,
    bathymetry: elevations.slice(),
    features,
    land: landMask(bounds, 513),
    coastMask: packedMask(bounds, 4097),
  }),
);
const detail = JSON.parse(
  await readFile('public/data/italy-terrain/manifest.json', 'utf8'),
);
await writeFile(
  `${out}/manifest.json`,
  JSON.stringify(
    {
      version: 1,
      status:
        'Implemented rendering coverage, not an approved historical campaign boundary',
      bounds,
      contextBounds: bounds,
      samplesPerEdge: 129,
      coordinateReference:
        'WGS84 geographic degrees; sampled elevation metres from the Mapzen mosaic; Italy source metadata remains in its own manifest',
      verticalExaggeration: 3,
      detailManifest: '/data/italy-terrain/manifest.json',
      detailAreas: [
        { bounds: detail.tileBounds, maximumCameraDistanceKm: 1400 },
      ],
      tiles: [...catalog, ...detail.tiles],
      sources: sources.sort((a, b) => a.url.localeCompare(b.url)),
      coverage: {
        context: 'Entire envelope; no invented source gaps',
        regionalTiles: catalog.length,
        regionalSpacingMetres: [2000, 4400],
        contextSpacingMetres: [9000, 19000],
        shoreMask: '4097 context samples; 513 samples per 5-degree region',
      },
      limitations: [
        'Modern physical geography; no reconstruction of ancient shorelines or river migration',
        'Eastern campaign boundary requires historical scope agreement',
        'Italy remains the only fine Copernicus/settlement detail area',
        'Regional terrain is resampled Mapzen z6; not native-resolution full-world DEM',
      ],
      sourceArchives: {
        gshhg: 'https://www.soest.hawaii.edu/pwessel/gshhg/gshhg-shp-2.3.7.zip',
        attribution:
          'https://github.com/tilezen/joerd/blob/master/docs/attribution.md',
      },
    },
    null,
    2,
  ),
);
for (const name of [
  'GSHHG-LICENSE.txt',
  'COPYING.LESSERv3',
  'COPYINGv3',
  'ATTRIBUTION.txt',
])
  await copyFile(`public/data/italy-terrain/${name}`, `${out}/${name}`);
process.stdout.write(
  JSON.stringify({
    bounds,
    sourceTiles: images.size,
    regionalTiles: catalog.length,
    rivers: features.rivers_lake_centerlines.length,
    lakes: features.lakes.length,
  }) + '\n',
);
