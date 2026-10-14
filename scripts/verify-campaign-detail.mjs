import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import process from 'node:process';
const url = process.argv[2] ?? 'http://127.0.0.1:4173';
const out = process.argv[3] ?? 'docs/vs5/campaign-experience-evidence';
process.argv[2] = url;
process.argv[3] = out;
if (!process.argv.includes('--detail-only'))
  await import('./verify-regional-terrain.mjs');
const browser = await chromium.launch({ channel: 'chrome', headless: true });
try {
  const page = await browser.newPage({
      viewport: { width: 1440, height: 1000 },
    }),
    errors = [];
  page.on('pageerror', (e) => errors.push(e.stack));
  page.on('response', (r) => {
    if (r.status() >= 400 && r.url().includes('/data/'))
      errors.push(`${r.status()} ${r.url()}`);
  });
  await page.goto(url);
  await page.waitForFunction(() => window.__campaignMap?.ready, null, {
    timeout: 90000,
  });
  const identity = await page.evaluate(() => ({
    scene: window.__campaignMap.sceneIdentity,
    settlements: window.__campaignMap.settlements,
    control: window.__campaignMap.controlForValidation(),
  }));
  const views = [];
  for (const name of [
    'greece',
    'greeceRegional',
    'greeceDetail',
    'egypt',
    'egyptRegional',
    'egyptDetail',
  ]) {
    await page.evaluate(() => {
      window.__campaignMap.frames.length = 0;
    });
    const start = Date.now();
    await page.selectOption('#world-view', name.replace('Regional', ''));
    if (name.endsWith('Regional')) {
      await page.waitForTimeout(1600);
      await page.evaluate(() => window.__campaignMap.zoomForValidation(300));
    }
    await page.waitForFunction(
      () =>
        window.__campaignMap.tiles.resident.length === 12 &&
        window.__campaignMap.tiles.pending.length === 0 &&
        window.__campaignMap.tiles.transitions.minimumReveal === 1,
      null,
      { timeout: 60000 },
    );
    await page.waitForTimeout(1200);
    const loading = await page.evaluate(() => ({
      maxFrameMs: Math.max(...window.__campaignMap.frames),
      tiles: window.__campaignMap.tiles,
    }));
    const readyMs = Date.now() - start;
    await page.evaluate(() => {
      window.__campaignMap.frames.length = 0;
    });
    await page.waitForTimeout(3000);
    const result = await page.evaluate(() => {
      const m = window.__campaignMap,
        f = [...m.frames].sort((a, b) => a - b);
      return {
        ...m.metrics,
        meanFps: 1000 / (f.reduce((a, b) => a + b, 0) / f.length),
        p95FrameMs: f[Math.floor(f.length * 0.95)],
        maxFrameMs: f.at(-1),
        tiles: m.tiles,
        camera: m.cameraForValidation(),
      };
    });
    assert.deepEqual(result.tiles.failed, []);
    assert.ok(result.tiles.resident.length <= 12);
    assert.ok(result.tiles.pending.length <= 3);
    if (name.endsWith('Detail'))
      assert.ok(
        JSON.stringify(result.tiles.resident).includes(
          name === 'greeceDetail' ? 'argolid' : 'nile',
        ),
      );
    await page.screenshot({ path: `${out}/${name}.png` });
    views.push({ name, readyMs, loading, ...result });
  }
  const final = await page.evaluate(() => ({
    scene: window.__campaignMap.sceneIdentity,
    settlements: window.__campaignMap.settlements,
    control: window.__campaignMap.controlForValidation(),
  }));
  assert.deepEqual(final, identity);
  assert.equal(final.settlements.length, 23);
  assert.deepEqual(errors, []);
  await mkdir(out, { recursive: true });
  await writeFile(
    `${out}/detail-validation.json`,
    JSON.stringify(
      {
        views,
        errors,
        settlements: final.settlements.length,
        limitations: [
          'Browser JS heap is not GPU memory',
          'Ready time includes preset transition and 1.2 second settling period',
          'Modern DSM and coastlines are not ancient reconstructions',
        ],
      },
      null,
      2,
    ),
  );
  process.stdout.write(
    JSON.stringify(
      views.map((v) => ({
        name: v.name,
        fps: v.meanFps,
        draws: v.drawCalls,
        heapMB: v.heapBytes / 1048576,
        readyMs: v.readyMs,
        maxLoadingFrame: v.loading.maxFrameMs,
      })),
    ) + '\n',
  );
} finally {
  await browser.close();
}
