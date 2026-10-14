import { chromium } from '@playwright/test';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
import process from 'node:process';

const url = process.argv[2] ?? 'http://127.0.0.1:4173',
  out = process.argv[3] ?? 'docs/vs5/regional-terrain-evidence';
process.argv[2] = url;
process.argv[3] = out;
// Preserve and exercise the complete existing world/700-marker benchmark first.
await import('./verify-world-map.mjs');
const browser = await chromium.launch({ channel: 'chrome', headless: true });
try {
  const page = await browser.newPage({
      viewport: { width: 1440, height: 1000 },
    }),
    errors = [];
  page.on('pageerror', (e) => errors.push(e.stack));
  page.on('console', (m) => {
    if (m.type() === 'error' && !m.text().includes('404'))
      errors.push(m.text());
  });
  page.on('response', (r) => {
    if (r.status() >= 400 && r.url().includes('/data/'))
      errors.push(`${r.status()} ${r.url()}`);
  });
  await page.goto(url);
  await page.waitForFunction(() => window.__campaignMap?.ready, null, {
    timeout: 90000,
  });
  const metadata = JSON.parse(
    await readFile('public/data/regional-ecology/manifest.json', 'utf8'),
  );
  const probes = [];
  for (const p of metadata.probes) {
    const rendered = await page.evaluate(
      (p) => window.__campaignMap.ecologyForValidation(p.lon, p.lat),
      p,
    );
    assert.equal(rendered.code, p.climateCode, p.name);
    assert.equal(rendered.historicalReconstruction, false);
    probes.push({ ...p, rendered });
  }
  const stable = async () => {
    await page.waitForFunction(
      () =>
        window.__campaignMap.tiles?.resident.length === 12 &&
        window.__campaignMap.tiles.pending.length === 0 &&
        window.__campaignMap.tiles.transitions.minimumReveal === 1,
      null,
      { timeout: 45000 },
    );
    await page.waitForTimeout(400);
  };
  const sample = async () => {
    await page.evaluate(() => {
      window.__campaignMap.frames.length = 0;
    });
    await page.waitForTimeout(3000);
    return page.evaluate(() => {
      const m = window.__campaignMap,
        f = [...m.frames].sort((a, b) => a - b);
      return {
        ...m.metrics,
        meanFps: 1000 / (f.reduce((a, b) => a + b, 0) / f.length),
        p95FrameMs: f[Math.floor(f.length * 0.95)],
        maxFrameMs: f.at(-1),
        tiles: m.tiles,
      };
    });
  };
  await mkdir(out, { recursive: true });
  await page.selectOption('#world-view', 'northAfrica');
  await stable();
  const northAfrica = await sample();
  await page.screenshot({ path: `${out}/north-africa.png` });
  await page.selectOption('#world-view', 'egypt');
  await stable();
  await page.screenshot({ path: `${out}/nile-corridor.png` });
  const identity = await page.evaluate(() => ({
    scene: window.__campaignMap.sceneIdentity,
    settlements: window.__campaignMap.settlements,
    control: window.__campaignMap.controlForValidation(),
  }));
  const zoom = [];
  // Cross world residency, regional LOD and the local overview LOD without another scene.
  for (const distance of [6500, 5800, 2600, 2050, 1950, 1000, 500, 430, 390]) {
    await page.evaluate(
      (d) => window.__campaignMap.zoomForValidation(d),
      distance,
    );
    await page.waitForTimeout(1800);
    const state = await page.evaluate(() => ({
      distance: window.__campaignMap.cameraDistance,
      tiles: window.__campaignMap.tiles,
      scene: window.__campaignMap.sceneIdentity,
    }));
    assert.equal(state.scene, identity.scene);
    assert.ok(state.tiles.resident.length <= 12);
    assert.ok(state.tiles.pending.length <= 3);
    assert.deepEqual(state.tiles.failed, []);
    zoom.push(state);
  }
  await page.locator('#focus-roma').click();
  await stable();
  const rome = await sample();
  await page.screenshot({ path: `${out}/rome-intermediate.png` });
  const final = await page.evaluate(() => ({
    scene: window.__campaignMap.sceneIdentity,
    settlements: window.__campaignMap.settlements,
    control: window.__campaignMap.controlForValidation(),
  }));
  assert.deepEqual(final, identity);
  assert.deepEqual(errors, []);
  const result = {
    sourceManifest: metadata,
    probes,
    northAfrica,
    rome,
    zoom,
    assertions: [
      'Source climate probes match resampled runtime classes',
      'Modern evidence is explicitly not historical reconstruction',
      'North Africa, Nile and Rome captured in the same geographic world',
      'World-to-regional-to-local zoom stays in one scene with bounded streaming',
      'GPU morph/reveal attributes render without shader errors',
      'All 23 settlement coordinates, identities and political read models unchanged',
    ],
    limitations: [
      'LOD mathematics and browser continuity are validated; residual source-resolution differences and family eviction pops remain',
      'Synthetic marker performance does not measure hundreds of detailed cities',
      'Natural Earth RGB is generalized cartography; vegetation tint is an artistic transfer, not a crop or canopy fraction',
    ],
  };
  await writeFile(
    `${out}/regional-validation.json`,
    JSON.stringify(result, null, 2),
  );
  process.stdout.write(
    JSON.stringify({
      probes: probes.length,
      northAfricaFps: northAfrica.meanFps,
      romeFps: rome.meanFps,
      errors,
      output: out,
    }) + '\n',
  );
} finally {
  await browser.close();
}
