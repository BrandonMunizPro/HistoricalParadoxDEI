import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { PNG } from 'pngjs';
import { Buffer } from 'node:buffer';
import process from 'node:process';

// Bounded import, no invented elevation. Cache upstream bytes for reproducibility.
const bounds = { west: 11.6, east: 15.2, south: 40.3, north: 43.1 };
const cache = 'data/geography/source-cache';
await mkdir(cache, { recursive: true });
await mkdir('public/data', { recursive: true });
const sources = [];
let expected = new Map();
try {
  const manifest = JSON.parse(
    await readFile('data/geography/manifest.json', 'utf8'),
  );
  expected = new Map(
    manifest.sources.map((source) => [source.url, source.sha256]),
  );
} catch (error) {
  if (error.code !== 'ENOENT') throw error;
}
async function get(url, key) {
  let bytes;
  try {
    bytes = await readFile(`${cache}/${key}`);
  } catch {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`${response.status}: ${url}`);
    bytes = Buffer.from(await response.arrayBuffer());
    await writeFile(`${cache}/${key}`, bytes);
  }
  const sha256 = createHash('sha256').update(bytes).digest('hex');
  if (expected.has(url) && expected.get(url) !== sha256)
    throw new Error(
      `Upstream checksum changed: ${url}; review and version the dataset before updating its manifest.`,
    );
  sources.push({ url, sha256 });
  return bytes;
}
const z = 8;
function tile(lon, lat) {
  const r = (lat * Math.PI) / 180;
  return [
    ((lon + 180) / 360) * 2 ** z,
    ((1 - Math.asinh(Math.tan(r)) / Math.PI) / 2) * 2 ** z,
  ];
}
const nw = tile(bounds.west, bounds.north),
  se = tile(bounds.east, bounds.south);
const tiles = new Map();
for (let y = Math.floor(nw[1]); y <= Math.floor(se[1]); y++) {
  for (let x = Math.floor(nw[0]); x <= Math.floor(se[0]); x++) {
    const bytes = await get(
      `https://s3.amazonaws.com/elevation-tiles-prod/terrarium/${z}/${x}/${y}.png`,
      `terrain-${z}-${x}-${y}.png`,
    );
    tiles.set(`${x}/${y}`, PNG.sync.read(bytes));
  }
}
const width = 513,
  height = 513,
  elevations = [];
for (let row = 0; row < height; row++)
  for (let col = 0; col < width; col++) {
    const lon = bounds.west + (col / (width - 1)) * (bounds.east - bounds.west);
    const lat =
      bounds.north - (row / (height - 1)) * (bounds.north - bounds.south);
    const [tx, ty] = tile(lon, lat),
      image = tiles.get(`${Math.floor(tx)}/${Math.floor(ty)}`);
    const index =
      (Math.min(255, Math.floor((ty % 1) * 256)) * 256 +
        Math.min(255, Math.floor((tx % 1) * 256))) *
      4;
    elevations.push(
      Math.round(
        image.data[index] * 256 +
          image.data[index + 1] +
          image.data[index + 2] / 256 -
          32768,
      ),
    );
  }
const features = {};
for (const theme of ['land', 'rivers_lake_centerlines', 'lakes']) {
  const bytes = await get(
    `https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_10m_${theme}.geojson`,
    `${theme}.json`,
  );
  const collection = JSON.parse(bytes);
  function inBounds(coords) {
    if (typeof coords[0] === 'number')
      return (
        coords[0] >= bounds.west &&
        coords[0] <= bounds.east &&
        coords[1] >= bounds.south &&
        coords[1] <= bounds.north
      );
    return coords.some(inBounds);
  }
  const selected = collection.features.filter((f) =>
    inBounds(f.geometry.coordinates),
  );
  // Clip rings to the prototype rectangle; never ship entire continental polygons.
  function clipRing(ring) {
    let points = ring.slice(0, -1);
    for (const [axis, value, sign] of [
      [0, bounds.west, 1],
      [0, bounds.east, -1],
      [1, bounds.south, 1],
      [1, bounds.north, -1],
    ]) {
      const output = [];
      for (let i = 0; i < points.length; i++) {
        const a = points[i],
          c = points[(i + 1) % points.length];
        const ai = (a[axis] - value) * sign >= 0,
          ci = (c[axis] - value) * sign >= 0;
        if (ai) output.push(a);
        if (ai !== ci) {
          const t = (value - a[axis]) / (c[axis] - a[axis]);
          output.push([a[0] + t * (c[0] - a[0]), a[1] + t * (c[1] - a[1])]);
        }
      }
      points = output;
    }
    return points.length >= 3 ? [...points, points[0]] : [];
  }
  features[theme] = selected.map((f) => {
    if (f.geometry.type === 'Polygon')
      return {
        ...f,
        geometry: {
          type: 'Polygon',
          coordinates: f.geometry.coordinates
            .map(clipRing)
            .filter((r) => r.length),
        },
      };
    if (f.geometry.type === 'MultiPolygon')
      return {
        ...f,
        geometry: {
          type: 'MultiPolygon',
          coordinates: f.geometry.coordinates
            .map((p) => p.map(clipRing).filter((r) => r.length))
            .filter((p) => p.length),
        },
      };
    return f;
  });
}
const atlas = JSON.parse(
  await readFile('public/data/settlement-atlas.json', 'utf8'),
);
const places = atlas.records.filter((record) =>
  ['existing', 'expansion'].includes(record.selection),
);
const settlements = [];
for (const record of places) {
  const key = record.key,
    pid = record.coordinateEvidence.source.split('/').at(-1);
  const bytes = await get(
    `https://pleiades.stoa.org/places/${pid}/json`,
    `pleiades-${pid}.json`,
  );
  const place = JSON.parse(bytes);
  if (place.uri !== record.coordinateEvidence.source)
    throw new Error(`Place identity mismatch: ${key}: ${place.uri}`);
  const [lon, lat] = place.reprPoint;
  if (
    lon < bounds.west ||
    lon > bounds.east ||
    lat < bounds.south ||
    lat > bounds.north
  )
    throw new Error(`Out of bounds ${place.title}`);
  settlements.push({
    key,
    name: record.historicalName,
    id: record.id,
    locationId: record.locationId,
    tier: record.suggestedTier,
    category: record.category,
    presence: record.presence278Bce,
    lon,
    lat,
    source: place.uri,
    description: place.description,
    contributors: [...(place.creators ?? []), ...(place.contributors ?? [])],
    license: 'https://creativecommons.org/licenses/by/3.0/',
    precision:
      'gazetteer representative point; period suitability reviewed separately',
  });
}
await writeFile(
  'public/data/central-italy.json',
  JSON.stringify({ bounds, width, height, elevations, features, settlements }),
);
await writeFile(
  'data/geography/manifest.json',
  JSON.stringify(
    {
      sources,
      grid: { width, height },
      attribution: [
        'Made with Natural Earth (public domain).',
        'Mapzen. Europe terrain data produced using Copernicus data and information funded by the European Union - EU-DEM layers.',
        'Global GMTED2010 and SRTM terrain data courtesy of the U.S. Geological Survey. Global ETOPO1 terrain data U.S. National Oceanic and Atmospheric Administration.',
        'Ancient places: Pleiades creators and contributors (listed in settlement records), CC BY 3.0.',
      ],
      historicalCaveat:
        'Modern physical geography; vegetation, route alignment and political influence extents are provisional.',
    },
    null,
    2,
  ),
);
process.stdout.write(
  `Imported ${settlements.length} settlements and ${elevations.length} elevation samples.\n`,
);
