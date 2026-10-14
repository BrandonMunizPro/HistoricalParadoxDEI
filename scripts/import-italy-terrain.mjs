import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { unzipSync } from 'fflate';
import { read as readShape } from 'shapefile';
import { fromUrl } from 'geotiff';
import { PNG } from 'pngjs';
import { Buffer } from 'node:buffer';

// Modern physical geography only. Raw upstream files stay outside the shipped build.
const cache = 'data/geography/source-cache';
const out = 'public/data/italy-terrain';
await mkdir(cache, { recursive: true });
await mkdir(out, { recursive: true });
const bounds = { west: -5, east: 30, south: 30, north: 55 };
const within = ([x, y], b = bounds) =>
  x >= b.west && x <= b.east && y >= b.south && y <= b.north;
const hash = (bytes) => createHash('sha256').update(bytes).digest('hex');
function clip(ring) {
  let p = ring.slice(0, -1);
  for (const [axis, value, sign] of [
    [0, bounds.west, 1],
    [0, bounds.east, -1],
    [1, bounds.south, 1],
    [1, bounds.north, -1],
  ]) {
    const next = [];
    for (let i = 0; i < p.length; i++) {
      const a = p[i],
        c = p[(i + 1) % p.length],
        ai = (a[axis] - value) * sign >= 0,
        ci = (c[axis] - value) * sign >= 0;
      if (ai) next.push(a);
      if (ai !== ci) {
        const t = (value - a[axis]) / (c[axis] - a[axis]);
        next.push([a[0] + t * (c[0] - a[0]), a[1] + t * (c[1] - a[1])]);
      }
    }
    p = next;
  }
  return p.length > 2 ? [...p, p[0]] : [];
}
let coastBytes;
try {
  coastBytes = await readFile(`${cache}/gshhg.zip`);
} catch {
  const response = await fetch(
    'https://www.soest.hawaii.edu/pwessel/gshhg/gshhg-shp-2.3.7.zip',
  );
  if (!response.ok) throw Error('GSHHG archive unavailable');
  coastBytes = Buffer.from(await response.arrayBuffer());
  await writeFile(`${cache}/gshhg.zip`, coastBytes);
}
const coastZip = unzipSync(coastBytes, {
  filter: (f) =>
    /GSHHS_h_L[12]\.(shp|dbf)$|river_h_L0[1-5]\.(shp|dbf)$|^LICENSE.TXT$|^COPYING(v3|.LESSERv3)$/.test(
      f.name,
    ),
});
const features = { land: [], lakes: [], rivers_lake_centerlines: [] };
for (const [level, theme] of [
  [1, 'land'],
  [2, 'lakes'],
]) {
  const path = `GSHHS_shp/h/GSHHS_h_L${level}`;
  const collection = await readShape(
    coastZip[`${path}.shp`].buffer,
    coastZip[`${path}.dbf`].buffer,
  );
  for (const f of collection.features) {
    const ps =
      f.geometry.type === 'MultiPolygon'
        ? f.geometry.coordinates
        : [f.geometry.coordinates];
    const polygons = ps
      .map((p) => p.map(clip).filter((r) => r.length))
      .filter((p) => p.length);
    if (polygons.length)
      features[theme].push({
        type: 'Feature',
        properties: { source: 'GSHHG 2.3.7' },
        geometry: { type: 'MultiPolygon', coordinates: polygons },
      });
  }
}
await writeFile(`${out}/GSHHG-LICENSE.txt`, coastZip['LICENSE.TXT']);
await writeFile(`${out}/COPYING.LESSERv3`, coastZip['COPYING.LESSERv3']);
let gpl;
try {
  gpl = await readFile(`${cache}/GPL-3.0.txt`);
} catch {
  const r = await fetch(
    'https://raw.githubusercontent.com/gcc-mirror/gcc/master/COPYING3',
  );
  if (!r.ok) throw Error('GPL notice unavailable');
  gpl = Buffer.from(await r.arrayBuffer());
  await writeFile(`${cache}/GPL-3.0.txt`, gpl);
}
await writeFile(`${out}/COPYINGv3`, gpl);
const italy = { west: 9, east: 20, south: 36, north: 46 };
for (let level = 1; level <= 5; level++) {
  const hp = `WDBII_shp/h/WDBII_river_h_L0${level}`;
  const collection = await readShape(
    coastZip[`${hp}.shp`].buffer,
    coastZip[`${hp}.dbf`].buffer,
  );
  for (const f of collection.features) {
    const lines =
      f.geometry.type === 'MultiLineString'
        ? f.geometry.coordinates
        : [f.geometry.coordinates];
    for (const line of lines) {
      let segment = [];
      for (const p of line) {
        if (within(p, italy)) segment.push(p);
        else {
          if (segment.length > 1)
            features.rivers_lake_centerlines.push({
              type: 'Feature',
              properties: { source: 'GSHHG WDBII', level },
              geometry: { type: 'LineString', coordinates: segment },
            });
          segment = [];
        }
      }
      if (segment.length > 1)
        features.rivers_lake_centerlines.push({
          type: 'Feature',
          properties: { source: 'GSHHG WDBII', level },
          geometry: { type: 'LineString', coordinates: segment },
        });
    }
  }
}
function inside(x, y, r) {
  let yes = false;
  for (let i = 0, j = r.length - 1; i < r.length; j = i++) {
    const a = r[i],
      c = r[j];
    if (
      a[1] > y !== c[1] > y &&
      x < ((c[0] - a[0]) * (y - a[1])) / (c[1] - a[1]) + a[0]
    )
      yes = !yes;
  }
  return yes;
}
const rings = features.land
  .flatMap((f) => f.geometry.coordinates)
  .map((p) => ({
    p,
    b: {
      west: Math.min(...p[0].map((c) => c[0])),
      east: Math.max(...p[0].map((c) => c[0])),
      south: Math.min(...p[0].map((c) => c[1])),
      north: Math.max(...p[0].map((c) => c[1])),
    },
  }));
const dry = (x, y) =>
  rings.some(
    ({ p, b }) =>
      within([x, y], b) &&
      inside(x, y, p[0]) &&
      !p.slice(1).some((r) => inside(x, y, r)),
  );
function landMask(b, size) {
  const mask = new Array(size * size).fill(false);
  for (let row = 0; row < size; row++) {
    const y = b.north - (row / (size - 1)) * (b.north - b.south),
      crossings = [];
    for (const { p, b: rb } of rings) {
      if (y < rb.south || y > rb.north || rb.east < b.west || rb.west > b.east)
        continue;
      for (const ring of p)
        for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
          const a = ring[i],
            c = ring[j];
          if (a[1] > y !== c[1] > y)
            crossings.push(((c[0] - a[0]) * (y - a[1])) / (c[1] - a[1]) + a[0]);
        }
    }
    crossings.sort((a, b) => a - b);
    for (let i = 0; i + 1 < crossings.length; i += 2) {
      const start = Math.max(
          0,
          Math.ceil(((crossings[i] - b.west) / (b.east - b.west)) * (size - 1)),
        ),
        end = Math.min(
          size - 1,
          Math.floor(
            ((crossings[i + 1] - b.west) / (b.east - b.west)) * (size - 1),
          ),
        );
      for (let c = start; c <= end; c++) mask[row * size + c] = true;
    }
  }
  return mask;
}
// Small context surface: no maximum-resolution Mediterranean generation.
const z = 5,
  imgs = new Map(),
  sources = [];
const merc = (x, y) => [
  ((x + 180) / 360) * 2 ** z,
  ((1 - Math.asinh(Math.tan((y * Math.PI) / 180)) / Math.PI) / 2) * 2 ** z,
];
const nw = merc(bounds.west, bounds.north),
  se = merc(bounds.east, bounds.south);
for (let y = Math.floor(nw[1]); y <= Math.floor(se[1]); y++)
  for (let x = Math.floor(nw[0]); x <= Math.floor(se[0]); x++) {
    const url = `https://s3.amazonaws.com/elevation-tiles-prod/terrarium/${z}/${x}/${y}.png`,
      file = `${cache}/terrain-${z}-${x}-${y}.png`;
    let bytes;
    try {
      bytes = await readFile(file);
    } catch {
      const r = await fetch(url);
      if (!r.ok) throw Error(url);
      bytes = Buffer.from(await r.arrayBuffer());
      await writeFile(file, bytes);
    }
    imgs.set(`${x}/${y}`, PNG.sync.read(bytes));
    sources.push({ url, sha256: hash(bytes) });
  }
const width = 513,
  height = 513,
  elevations = [];
for (let row = 0; row < height; row++)
  for (let col = 0; col < width; col++) {
    const lon = bounds.west + (col / 512) * (bounds.east - bounds.west),
      lat = bounds.north - (row / 512) * (bounds.north - bounds.south),
      [tx, ty] = merc(lon, lat),
      im = imgs.get(`${Math.floor(tx)}/${Math.floor(ty)}`),
      i =
        (Math.min(255, Math.floor((ty % 1) * 256)) * 256 +
          Math.min(255, Math.floor((tx % 1) * 256))) *
        4;
    elevations.push(
      Math.round(
        im.data[i] * 256 + im.data[i + 1] + im.data[i + 2] / 256 - 32768,
      ),
    );
  }
const bathymetry = elevations.slice();
const tiles = [];
// Each degree is independently cacheable. Overview requests are bounded, not full 30m downloads.
for (let lat = 36; lat < 46; lat++)
  for (let lon = 9; lon < 20; lon++) {
    if (
      !Array.from({ length: 25 }, (_, i) =>
        dry(lon + (i % 5) / 4, lat + Math.floor(i / 5) / 4),
      ).some(Boolean)
    )
      continue;
    const id = `N${lat}E${lon}`,
      file = `${cache}/cop-${id}.json`,
      url = `https://copernicus-dem-30m.s3.amazonaws.com/Copernicus_DSM_COG_10_N${lat}_00_E${String(lon).padStart(3, '0')}_00_DEM/Copernicus_DSM_COG_10_N${lat}_00_E${String(lon).padStart(3, '0')}_00_DEM.tif`;
    let tile;
    try {
      tile = JSON.parse(await readFile(file, 'utf8'));
    } catch {
      const tif = await fromUrl(url),
        raster = await tif.readRasters({
          bbox: [lon, lat, lon + 1, lat + 1],
          width: 129,
          height: 129,
          resampleMethod: 'bilinear',
          interleave: true,
        });
      tile = {
        id,
        bounds: { west: lon, east: lon + 1, south: lat, north: lat + 1 },
        width: 129,
        height: 129,
        elevations: Array.from(raster, (v) => Math.round(v * 10) / 10),
        source: url,
      };
      await writeFile(file, JSON.stringify(tile));
    }
    tiles.push(tile);
  }
// readRasters returns pixel centers. Reconstruct the geographic vertex lattice explicitly,
// rather than mislabeling those centers as tile corners (a half-output-pixel shift).
for (const t of tiles) {
  const raw = t.elevations;
  const at = (c, r) =>
    raw[Math.max(0, Math.min(128, r)) * 129 + Math.max(0, Math.min(128, c))];
  t.elevations = raw.map((_, i) => {
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
// Canonical ownership of a shared coordinate prevents independently sampled COG edges cracking.
const edge = new Map();
for (const t of tiles)
  for (let r = 0; r < 129; r++)
    for (let c = 0; c < 129; c++)
      if (r === 0 || r === 128 || c === 0 || c === 128) {
        const k = `${t.bounds.west * 128 + c}/${t.bounds.north * 128 - r}`,
          i = r * 129 + c;
        if (!edge.has(k)) edge.set(k, []);
        edge.get(k).push([t, i, t.elevations[i]]);
      }
for (const values of edge.values()) {
  const mean =
    Math.round(
      (values.reduce((sum, v) => sum + v[2], 0) / values.length) * 10,
    ) / 10;
  for (const [t, i] of values) t.elevations[i] = mean;
}
// Bounded city windows, about 40–50 m output spacing, not a high-resolution world.
for (const [id, lon, lat, sourceId] of [
  ['roma', 12.491258, 41.889977, 'N41E12'],
  ['capua', 14.25, 41.086, 'N41E14'],
  ['neapolis', 14.257, 40.852, 'N40E14'],
  ['norba', 12.960234822672941, 41.59160734144302, 'N41E12'],
]) {
  const b = {
    west: lon - 0.03,
    east: lon + 0.03,
    south: lat - 0.025,
    north: lat + 0.025,
  };
  const source = tiles.find((t) => t.id === sourceId).source,
    file = `${cache}/cop-local-${id}.json`;
  let local;
  try {
    local = JSON.parse(await readFile(file, 'utf8'));
  } catch {
    const tif = await fromUrl(source),
      raster = await tif.readRasters({
        bbox: [b.west, b.south, b.east, b.north],
        width: 129,
        height: 129,
        resampleMethod: 'bilinear',
        interleave: true,
      });
    local = {
      id: `local-${id}`,
      kind: 'city',
      bounds: b,
      width: 129,
      height: 129,
      elevations: Array.from(raster, (v) => Math.round(v * 10) / 10),
      source,
    };
    await writeFile(file, JSON.stringify(local));
  }
  const raw = local.elevations,
    at = (c, r) =>
      raw[Math.max(0, Math.min(128, r)) * 129 + Math.max(0, Math.min(128, c))];
  local.elevations = raw.map((_, i) => {
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
  // Transition the outer ~600 m to the same regional height surface, with exact matching edges.
  const regional = tiles.find((t) => t.id === sourceId);
  local.elevations = local.elevations.map((e, i) => {
    const c = i % 129,
      r = Math.floor(i / 129),
      lon = b.west + (c / 128) * (b.east - b.west),
      lat = b.north - (r / 128) * (b.north - b.south),
      v = Math.min(1, Math.min(c, r, 128 - c, 128 - r) / 16),
      blend = v * v * (3 - 2 * v);
    return (
      Math.round((sample(regional, lon, lat) * (1 - blend) + e * blend) * 10) /
      10
    );
  });
  tiles.push(local);
}
for (const t of tiles) {
  t.land = landMask(t.bounds, 129);
  const mask = landMask(t.bounds, 513),
    packed = new Uint8Array(Math.ceil(mask.length / 8));
  for (let i = 0; i < mask.length; i++)
    if (mask[i]) packed[i >> 3] |= 1 << (i % 8);
  t.coastMask = { size: 513, bits: Buffer.from(packed).toString('base64') };
  await writeFile(`${out}/${t.id}.json`, JSON.stringify(t));
  sources.push({
    url: t.source,
    derivedSha256: hash(JSON.stringify(t)),
    samples: 129 ** 2,
  });
}
// Give the context the same Italian elevations; this is also the CPU sampler used by labels/assets.
function sample(t, x, y) {
  const c = Math.max(0, Math.min(128, (x - t.bounds.west) * 128)),
    r = Math.max(0, Math.min(128, (t.bounds.north - y) * 128)),
    ci = Math.floor(c),
    ri = Math.floor(r),
    at = (a, b) => t.elevations[Math.min(128, b) * 129 + Math.min(128, a)],
    fx = c - ci,
    fy = r - ri;
  return (
    (at(ci, ri) * (1 - fx) + at(ci + 1, ri) * fx) * (1 - fy) +
    (at(ci, ri + 1) * (1 - fx) + at(ci + 1, ri + 1) * fx) * fy
  );
}
for (let r = 0; r < 513; r++)
  for (let c = 0; c < 513; c++) {
    const x = bounds.west + (c / 512) * 35,
      y = bounds.north - (r / 512) * 25,
      t = tiles.find((t) => t.kind !== 'city' && within([x, y], t.bounds));
    if (t) elevations[r * 513 + c] = Math.round(sample(t, x, y));
  }
const legacy = JSON.parse(
  await readFile('public/data/central-italy.json', 'utf8'),
);
const contextMask = landMask(bounds, 2049),
  contextBits = new Uint8Array(Math.ceil(contextMask.length / 8));
for (let i = 0; i < contextMask.length; i++)
  if (contextMask[i]) contextBits[i >> 3] |= 1 << (i % 8);
await writeFile(
  `${out}/context.json`,
  JSON.stringify({
    ...legacy,
    bounds,
    width,
    height,
    elevations,
    bathymetry,
    features,
    land: landMask(bounds, 513),
    coastMask: {
      size: 2049,
      bits: Buffer.from(contextBits).toString('base64'),
    },
  }),
);
await writeFile(
  `${out}/manifest.json`,
  JSON.stringify(
    {
      version: 2,
      coordinateReference:
        'WGS84 longitude/latitude degrees; Copernicus elevations in metres above EGM2008',
      sampling:
        'Pixel-center raster resampled to geographic vertex lattice; shared degree edges averaged; city windows blend to regional samples in the outer 16 cells',
      regionalSpacingMetres: [650, 870],
      citySpacingMetres: [39, 52],
      coastMaskSpacing:
        '513 samples per degree; 2049 samples across context extent',
      verticalExaggeration: 3,
      contextBounds: bounds,
      tileBounds: italy,
      samplesPerEdge: 129,
      bathymetry:{source:'Mapzen Terrarium z5; preserved separately before land-only Copernicus sampling',usage:'Stylized water color only; not ancient navigation depth'},
      tiles: tiles.map((t) => ({
        id: t.id,
        kind: t.kind ?? 'regional',
        bounds: t.bounds,
        url: `/data/italy-terrain/${t.id}.json`,
      })),
      sources,
      coastline: {
        url: 'https://www.soest.hawaii.edu/pwessel/gshhg/',
        version: '2.3.7',
        resolution: 'high',
        sha256: hash(coastBytes),
        license:
          'LGPL-3.0-or-later; bundled notices; source archive URL in report',
      },
      rivers: {
        url: 'https://www.soest.hawaii.edu/pwessel/gshhg/',
        resolution: 'WDBII high-resolution classes 1-5; modern, incomplete',
      },
      limitations: [
        'Modern DSM and shorelines, not reconstructed 278 BCE topography',
        '129 samples per degree (~650–870 m); context ~4–7 km',
        'World envelope remains provisional',
      ],
    },
    null,
    2,
  ),
);
await writeFile(
  `${out}/ATTRIBUTION.txt`,
  'Produced using Copernicus WorldDEM-30 © DLR e.V. 2010-2014 and © Airbus Defence and Space GmbH 2014-2018 provided under COPERNICUS by the European Union and ESA; all rights reserved.\nGSHHG 2.3.7: Paul Wessel and Walter H. F. Smith; LGPL v3 or later.\nRivers: GSHHG WDBII, LGPL v3 or later.\nMapzen Terrain Tiles: attribution and underlying source licenses: https://github.com/tilezen/joerd/blob/master/docs/attribution.md\n',
);
