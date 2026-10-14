import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { Buffer } from 'node:buffer';
import process from 'node:process';
import { unzipSync } from 'fflate';
import { fromArrayBuffer } from 'geotiff';
import { PNG } from 'pngjs';

const out = 'public/data/regional-ecology',
  cache = 'data/geography/source-cache';
await mkdir(out, { recursive: true });
await mkdir(cache, { recursive: true });
const bounds = { west: -12, east: 75, south: 12, north: 62 };
const sources = [
  {
    name: 'NE1_LR_LC.zip',
    url: 'https://naturalearth.s3.amazonaws.com/10m_raster/NE1_LR_LC.zip',
    license: 'Public domain',
    reference:
      'https://www.naturalearthdata.com/downloads/10m-raster-data/10m-natural-earth-1/',
  },
  {
    name: 'beck-2023-v1.zip',
    url: 'https://ndownloader.figshare.com/files/45057352',
    license: 'CC BY 4.0',
    reference: 'https://doi.org/10.1038/s41597-023-02549-6',
  },
];
const hash = (b) => createHash('sha256').update(b).digest('hex');
async function get(s) {
  let bytes;
  try {
    bytes = await readFile(`${cache}/${s.name}`);
  } catch {
    const r = await fetch(s.url);
    if (!r.ok) throw Error(`${r.status} ${s.url}`);
    bytes = Buffer.from(await r.arrayBuffer());
    await writeFile(`${cache}/${s.name}`, bytes);
  }
  s.sha256 = hash(bytes);
  return bytes;
}
const ne = unzipSync(await get(sources[0]), {
  filter: (f) => /\.tif$|README|VERSION|\.tfw$/.test(f.name),
});
const kg = unzipSync(await get(sources[1]), {
  filter: (f) =>
    /^1991_2020\/koppen_geiger_0p00833333.tif$|^legend.txt$/.test(f.name),
});
const neImage = await (
  await fromArrayBuffer(ne['NE1_LR_LC.tif'].buffer)
).getImage();
const climateImage = await (
  await fromArrayBuffer(kg['1991_2020/koppen_geiger_0p00833333.tif'].buffer)
).getImage();
async function crop(im) {
  const [west, , , north] = im.getBoundingBox(),
    [dx, dy] = im.getResolution();
  const window = [
    Math.floor((bounds.west - west) / dx) - 1,
    Math.floor((bounds.north - north) / dy) - 1,
    Math.ceil((bounds.east - west) / dx) + 1,
    Math.ceil((bounds.south - north) / dy) + 1,
  ];
  const data = await im.readRasters({ window, interleave: true });
  return {
    data,
    width: window[2] - window[0],
    height: window[3] - window[1],
    west: west + window[0] * dx,
    north: north + window[1] * dy,
    dx,
    dy,
    bands: im.getSamplesPerPixel(),
  };
}
const cover = await crop(neImage),
  climate = await crop(climateImage);
// Native NE1 pixel spacing, plus one outer vertex; no claimed upsampled precision.
const width = 3916,
  height = 2251,
  surface = new PNG({ width, height }),
  classes = new PNG({ width, height });
function rgb(lon, lat) {
  const x = (lon - cover.west) / cover.dx - 0.5,
    y = (lat - cover.north) / cover.dy - 0.5,
    c = Math.floor(x),
    r = Math.floor(y),
    fx = x - c,
    fy = y - r;
  const at = (c, r, k) =>
    cover.data[
      (Math.max(0, Math.min(cover.height - 1, r)) * cover.width +
        Math.max(0, Math.min(cover.width - 1, c))) *
        cover.bands +
        k
    ];
  return [0, 1, 2].map(
    (k) =>
      (at(c, r, k) * (1 - fx) + at(c + 1, r, k) * fx) * (1 - fy) +
      (at(c, r + 1, k) * (1 - fx) + at(c + 1, r + 1, k) * fx) * fy,
  );
}
function code(lon, lat) {
  const c = Math.floor((lon - climate.west) / climate.dx),
    r = Math.floor((lat - climate.north) / climate.dy);
  return climate.data[r * climate.width + c];
}
const counts = {};
for (let r = 0; r < height; r++)
  for (let c = 0; c < width; c++) {
    const lon = bounds.west + (c / (width - 1)) * (bounds.east - bounds.west),
      lat = bounds.north - (r / (height - 1)) * (bounds.north - bounds.south),
      i = (r * width + c) * 4;
    const color = rgb(lon, lat),
      cl = code(lon, lat);
    if (!Number.isInteger(cl) || cl < 0 || cl > 30)
      throw Error(`Invalid climate code ${cl}`);
    // The geographic raster supplies color. Grade is global, never a hand-drawn biome mask.
    // NE's vegetation tint is a material signal, never a measured canopy/crop fraction.
    // One global transfer function is used throughout the entire geographic envelope.
    const signal =
      (color[1] - color[2] - Math.max(0, color[0] - color[1]) * 1.7 - 12) / 52;
    const t = Math.max(0, Math.min(1, (signal - 0.1) / 0.55)),
      vegetated = t * t * (3 - 2 * t),
      plant = [86, 112, 61];
    for (let k = 0; k < 3; k++) {
      const graded = 255 * Math.pow(color[k] / 255, 1.24) * 0.85;
      surface.data[i + k] = Math.max(
        0,
        Math.min(
          255,
          Math.round(
            graded * (1 - vegetated * 0.55) + plant[k] * vegetated * 0.55,
          ),
        ),
      );
    }
    surface.data[i + 3] = 255;
    classes.data[i] = cl;
    classes.data[i + 1] = classes.data[i + 2] = 0;
    classes.data[i + 3] = 255;
    counts[cl] = (counts[cl] ?? 0) + 1;
  }
const surfaceBytes = PNG.sync.write(surface),
  classBytes = PNG.sync.write(classes);
await writeFile(`${out}/surface.png`, surfaceBytes);
await writeFile(`${out}/climate.png`, classBytes);
await writeFile(`${out}/climate-legend.txt`, kg['legend.txt']);
await writeFile(
  `${out}/Natural-Earth-README.html`,
  ne['NE1_LR_LC.README.html'],
);
const metadata = {
  version: 1,
  bounds,
  width,
  height,
  pixelConvention:
    'North-up WGS84 lattice; first and last texel centers are envelope corners; texture shader applies half-texel correction',
  sources,
  landCover: {
    product: 'Natural Earth I unshaded land-cover coloring, 3.2.0',
    sourceWidth: neImage.getWidth(),
    sourceHeight: neImage.getHeight(),
    sourcePixelDegrees: cover.dx,
    interpretation:
      'Satellite-derived cartographic RGB, not categorical land-cover observations or ancient vegetation',
    materialTransfer:
      'Global gamma 1.24, exposure 0.85; source yellow/green chroma interpreted as a vegetation-tint signal and blended at most 55% toward an olive material. No latitude bands, river buffers or hand-drawn biome masks. This artistic signal is not a measured vegetation fraction.',
  },
  climate: {
    product: 'Beck et al. (2023) Koppen-Geiger, 1991-2020',
    archiveEntry: '1991_2020/koppen_geiger_0p00833333.tif',
    sourcePixelDegrees: climate.dx,
    resampling: 'Nearest categorical sample to the shared material lattice',
    zero: 'Ocean/no classification; never silently classified as desert',
    counts,
  },
  outputs: {
    surface: {
      url: '/data/regional-ecology/surface.png',
      sha256: hash(surfaceBytes),
    },
    climate: {
      url: '/data/regional-ecology/climate.png',
      sha256: hash(classBytes),
    },
  },
  probes: [
    ['Sahara', 20, 25],
    ['Arabian interior', 45, 24],
    ['Nile valley', 31.15, 27.2],
    ['Western desert near Nile', 29.5, 27.2],
    ['Iberian interior', -4, 40],
    ['Greece', 22, 39],
    ['Anatolia', 33.5, 39],
    ['Temperate central Europe', 9, 48.5],
    ['Steppe', 49, 49],
    ['Alps', 10.8, 46.8],
  ].map(([name, lon, lat]) => {
    const c = Math.round(
        ((lon - bounds.west) / (bounds.east - bounds.west)) * (width - 1),
      ),
      r = Math.round(
        ((bounds.north - lat) / (bounds.north - bounds.south)) * (height - 1),
      ),
      i = (r * width + c) * 4;
    return {
      name,
      lon,
      lat,
      sourceRgb: rgb(lon, lat).map(Math.round),
      climateCode: code(lon, lat),
      materialRgb: Array.from(surface.data.slice(i, i + 3)),
      historicalReconstruction: false,
    };
  }),
  limitations: [
    'Modern geographic approximation, not a reconstruction of 278 BCE',
    'Natural Earth is generalized cartography derived from modern satellite vegetation; not measured ancient forest, crop or soil boundaries',
    'Modern irrigation, agriculture, dams and reservoirs can influence Nile and other valley coloration',
    'No artificial green buffers around rivers; visible fertile corridors must be present in the source raster',
    'A ~2.47km latitude material lattice cannot resolve individual fields or narrow riparian strips',
    'Climate classification is not equivalent to actual forest cover or a simulation biome; uncertainty is not a gameplay modifier',
  ],
};
await writeFile(`${out}/manifest.json`, JSON.stringify(metadata, null, 2));
await writeFile(
  `${out}/ATTRIBUTION.txt`,
  'Made with Natural Earth. Natural Earth I unshaded land-cover coloring, v3.2.0, public domain. https://www.naturalearthdata.com/about/terms-of-use/\nClimate: Beck, H.E., McVicar, T.R., Vergopolan, N. et al. High-resolution (1 km) Koppen-Geiger maps for 1901-2099 based on constrained CMIP6 projections. Scientific Data 10, 724 (2023). https://doi.org/10.1038/s41597-023-02549-6 ; CC BY 4.0 https://creativecommons.org/licenses/by/4.0/ . Selected period 1991-2020. Cropped/resampled, not an ancient reconstruction.\n',
);
process.stdout.write(
  JSON.stringify({
    width,
    height,
    counts,
    bytes: surfaceBytes.length + classBytes.length,
    sources: sources.map((s) => ({ url: s.url, sha256: s.sha256 })),
  }) + '\n',
);
