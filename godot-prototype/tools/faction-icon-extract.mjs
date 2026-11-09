#!/usr/bin/env node
// Crops the 131 faction banners from the user-provided contact sheet into
// transparent PNGs. The grid mapping is checked into data/factions/icon-sheet-map.json.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PNG } from 'pngjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const map = JSON.parse(fs.readFileSync(path.join(root, 'data/factions/icon-sheet-map.json'), 'utf8'));
const scenario = JSON.parse(fs.readFileSync(path.join(root, 'data/factions/scenario-278.json'), 'utf8'));
const presentation = JSON.parse(fs.readFileSync(path.join(root, 'data/factions/presentation.json'), 'utf8'));

function arg(name, fallback) {
  const i = process.argv.indexOf(name);
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
}

const sheetPath = process.argv[2] && !process.argv[2].startsWith('--')
  ? process.argv[2]
  : arg('--sheet', path.join(os.homedir(), 'Downloads', map.source.file));
const outDir = path.resolve(arg('--out', path.join(root, 'assets/factions/icons')));
const reviewPath = path.resolve(arg('--review', path.join(root, 'assets/factions/icons-review.html')));
const bboxThreshold = Number(arg('--bbox-threshold', 28));
const keyTolerance = Number(arg('--key-tolerance', 12));

if (!fs.existsSync(sheetPath)) {
  console.error(`Contact sheet not found: ${sheetPath}`);
  console.error('Usage: node tools/faction-icon-extract.mjs <contact-sheet.png> [--out dir] [--review file]');
  process.exit(1);
}

const sheet = PNG.sync.read(fs.readFileSync(sheetPath));
const { width: W, height: H, data: D } = sheet;
const [bgR, bgG, bgB] = map.layout.background;
const distance = (i) => Math.abs(D[i] - bgR) + Math.abs(D[i + 1] - bgG) + Math.abs(D[i + 2] - bgB);
const foreground = (x, y) => distance((y * W + x) * 4) > bboxThreshold;

function bounds(x0, x1, y0, y1) {
  let minX = Infinity, minY = Infinity, maxX = -1, maxY = -1;
  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) {
      if (!foreground(x, y)) continue;
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
  }
  return maxX < minX ? null : { x: minX, y: minY, w: maxX - minX + 1, h: maxY - minY + 1 };
}

function crop(source, box) {
  const image = new PNG({ width: box.w, height: box.h });
  for (let y = 0; y < box.h; y++) {
    for (let x = 0; x < box.w; x++) {
      const s = ((box.y + y) * W + (box.x + x)) * 4;
      const d = (y * box.w + x) * 4;
      image.data[d] = D[s];
      image.data[d + 1] = D[s + 1];
      image.data[d + 2] = D[s + 2];
      image.data[d + 3] = 255;
    }
  }
  return image;
}

function keyBackground(image) {
  const { width: w, height: h, data } = image;
  const transparent = new Uint8Array(w * h);
  const queue = [];
  const push = (x, y) => {
    if (x < 0 || y < 0 || x >= w || y >= h) return;
    const p = y * w + x;
    if (transparent[p]) return;
    const i = p * 4;
    if (Math.abs(data[i] - bgR) + Math.abs(data[i + 1] - bgG) + Math.abs(data[i + 2] - bgB) > keyTolerance) return;
    transparent[p] = 1;
    queue.push(p);
  };
  for (let x = 0; x < w; x++) { push(x, 0); push(x, h - 1); }
  for (let y = 0; y < h; y++) { push(0, y); push(w - 1, y); }
  for (let q = 0; q < queue.length; q++) {
    const p = queue[q], x = p % w, y = (p - x) / w;
    push(x - 1, y); push(x + 1, y); push(x, y - 1); push(x, y + 1);
  }
  for (let p = 0; p < w * h; p++) {
    if (transparent[p]) image.data[p * 4 + 3] = 0;
  }
  return transparent.reduce((n, v) => n + v, 0);
}

fs.mkdirSync(outDir, { recursive: true });
const manifest = [];
const seen = new Set();
let errors = 0;
for (let row = 0; row < map.rows.length; row++) {
  const idRow = map.layout.idLabelRowsY[row];
  for (let col = 0; col < map.layout.columns; col++) {
    const id = map.rows[row][col];
    if (!id) continue;
    if (seen.has(id)) { console.error(`Duplicate grid id: ${id}`); errors++; continue; }
    seen.add(id);
    const centerX = map.layout.cellCentersX[col];
    const half = map.layout.cellHalfWidth;
    const x0 = Math.max(0, centerX - half);
    const x1 = Math.min(W - 1, centerX + half);
    const y0 = Math.max(0, idRow + map.layout.artSearchTopOffset);
    const y1 = Math.min(H - 1, idRow + map.layout.artSearchBottomOffset);
    const box = bounds(x0, x1, y0, y1);
    if (!box) { console.error(`No art found for ${id} at row ${row}, column ${col}`); errors++; continue; }
    const padded = {
      x: Math.max(x0, box.x - 2),
      y: Math.max(y0, box.y - 2),
      w: Math.min(x1, box.x + box.w + 1) - Math.max(x0, box.x - 2) + 1,
      h: Math.min(y1, box.y + box.h + 1) - Math.max(y0, box.y - 2) + 1,
    };
    const image = crop(sheet, padded);
    const keyed = keyBackground(image);
    const file = path.join(outDir, `${id}.png`);
    fs.writeFileSync(file, PNG.sync.write(image));
    manifest.push({ id, row, column: col, sourceBox: padded, keyedPixels: keyed, file: path.basename(file) });
  }
}

const rosterIds = scenario.factions.map(f => f.id);
const missing = rosterIds.filter(id => !seen.has(id));
const unexpected = [...seen].filter(id => !rosterIds.includes(id));
if (missing.length || unexpected.length || errors) {
  console.error({ errors, missing, unexpected });
  process.exit(1);
}

const rows = Math.ceil(rosterIds.length / 16);
const cell = 128;
const preview = new PNG({ width: 16 * cell, height: rows * cell });
preview.data.fill(0);
const manifestById = new Map(manifest.map(m => [m.id, m]));
for (let index = 0; index < rosterIds.length; index++) {
  const id = rosterIds[index];
  const entry = manifestById.get(id);
  const icon = PNG.sync.read(fs.readFileSync(path.join(outDir, entry.file)));
  const scale = Math.min(cell / icon.width, cell / icon.height);
  const w = Math.max(1, Math.round(icon.width * scale));
  const h = Math.max(1, Math.round(icon.height * scale));
  const ox = (index % 16) * cell + Math.floor((cell - w) / 2);
  const oy = Math.floor(index / 16) * cell + Math.floor((cell - h) / 2);
  for (let y = 0; y < h; y++) {
    const sy = Math.min(icon.height - 1, Math.floor(y / scale));
    for (let x = 0; x < w; x++) {
      const sx = Math.min(icon.width - 1, Math.floor(x / scale));
      const s = (sy * icon.width + sx) * 4;
      const d = ((oy + y) * preview.width + (ox + x)) * 4;
      const a = icon.data[s + 3];
      if (a === 0) continue;
      preview.data[d] = icon.data[s];
      preview.data[d + 1] = icon.data[s + 1];
      preview.data[d + 2] = icon.data[s + 2];
      preview.data[d + 3] = a;
    }
  }
}
fs.writeFileSync(path.join(outDir, 'preview.png'), PNG.sync.write(preview));

const names = new Map(scenario.factions.map(f => [f.id, f.name]));
const cards = rosterIds.map(id => {
  const entry = manifestById.get(id);
  const emblem = presentation.factions[id].emblem;
  return `<article><img src="icons/${id}.png" alt="${names.get(id)}"><h2>${names.get(id)}</h2><code>${id}</code><p>${emblem.basis.replaceAll('_', ' ')} · ${emblem.motif}</p><p class="box">${entry.sourceBox.w}×${entry.sourceBox.h}</p></article>`;
}).join('\n');
fs.writeFileSync(reviewPath, `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Faction icon extraction review</title><style>body{background:#14151a;color:#e9ddc4;font:14px system-ui;margin:24px}h1{font-size:22px}main{display:grid;grid-template-columns:repeat(auto-fill,minmax(190px,1fr));gap:12px}article{background:#20242b;border:1px solid #3b4149;border-radius:10px;padding:12px;text-align:center}img{max-width:100%;max-height:150px;image-rendering:auto}h2{font-size:15px;margin:8px 0 2px}code{color:#9fc7d8}p{margin:4px 0;color:#a9a18f;font-size:12px}.box{color:#6f7f8a}</style><h1>Faction icon extraction review</h1><p>${rosterIds.length} transparent PNGs cropped from the contact sheet. Source boxes are in pixels. The execution-order preview is <a href="icons/preview.png">icons/preview.png</a>.</p><main>${cards}</main></html>`);

fs.writeFileSync(path.join(outDir, 'manifest.json'), JSON.stringify({ version: 1, source: map.source, entries: manifest }, null, 2) + '\n');
console.log(`Extracted ${manifest.length} faction icons to ${outDir}`);
console.log(`Preview: ${path.join(outDir, 'preview.png')}`);
console.log(`Review: ${reviewPath}`);
