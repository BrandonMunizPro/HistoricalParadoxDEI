import { chromium } from '@playwright/test';
import process from 'node:process';
import { mkdir, writeFile } from 'node:fs/promises';
import { cpus, totalmem } from 'node:os';
import assert from 'node:assert/strict';
const out = process.argv[2] ?? 'docs/vs6-1/evidence/research';
await mkdir(out, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome', headless: true });
try {
  const page = await browser.newPage({
      viewport: { width: 1440, height: 1000 },
    }),
    errors = [],
    results = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('http://127.0.0.1:4173');
  await page.waitForFunction(() => window.__campaignMap?.ready, null, {
    timeout: 90000,
  });
  const baseline = await page.evaluate(() => ({
    settlements: window.__campaignMap.settlements,
    control: window.__campaignMap.controlForValidation(),
  }));
  for (const region of ['world', 'greece', 'egypt', 'rome']) {
    if (region === 'rome') await page.locator('#focus-roma').click();
    else await page.selectOption('#world-view', region);
    await page.waitForTimeout(2500);
    await page.waitForFunction(
      () => window.__campaignMap.tiles.pending.length === 0,
      null,
      { timeout: 60000 },
    );
    for (const enabled of [false, true]) {
      if (region === 'rome') await page.locator('#focus-roma').click();
      else await page.selectOption('#world-view', region);
      await page.waitForTimeout(2500);
      await page.waitForFunction(
        () => window.__campaignMap.tiles.pending.length === 0,
        null,
        { timeout: 60000 },
      );
      await page.locator('#research-markers').setChecked(enabled);
      await page.mouse.move(900, 500);
      await page.waitForTimeout(2000);
      await page.evaluate(() => {
        window.__campaignMap.frames.length = 0;
      });
      await page.locator('canvas').focus();
      await page.keyboard.down('w');
      await page.waitForTimeout(450);
      await page.keyboard.up('w');
      await page.waitForTimeout(4000);
      const r = await page.evaluate(() => ({
        research: window.__campaignMap.researchForValidation(),
        metrics: window.__campaignMap.metrics,
        tiles: window.__campaignMap.tiles,
        frames: [...window.__campaignMap.frames],
        camera: window.__campaignMap.cameraForValidation(),
      }));
      const sorted = r.frames.sort((a, b) => a - b),
        q = (p) => sorted[Math.floor((sorted.length - 1) * p)];
      delete r.frames;
      results.push({
        region,
        enabled,
        ...r,
        p50: q(0.5),
        p95: q(0.95),
        p99: q(0.99),
        worst: sorted.at(-1),
      });
      assert.equal(r.research.enabled, enabled);
      assert.equal(r.research.authoritative, false);
      assert.ok(r.research.visible <= 180);
      assert.ok(r.tiles.resident.length <= 12);
      assert.deepEqual(r.tiles.failed, []);
      if (enabled) await page.screenshot({ path: `${out}/${region}.png` });
    }
  }
  await page.locator('#authoritative-settlements').uncheck();
  await page.waitForTimeout(300);
  assert.equal(
    await page.locator('#labels .label:not(.diagnostic):visible').count(),
    0,
  );
  await page.locator('#authoritative-settlements').check();
  await page.locator('#research-markers').uncheck();
  await page.waitForTimeout(300);
  assert.equal(await page.locator('.research-reference:visible').count(), 0);
  const final = await page.evaluate(() => ({
    settlements: window.__campaignMap.settlements,
    control: window.__campaignMap.controlForValidation(),
  }));
  assert.deepEqual(final, baseline);
  assert.deepEqual(errors, []);
  await writeFile(
    `${out}/validation.json`,
    JSON.stringify(
      {
        environment: {
          cpu: cpus()[0].model,
          ram: totalmem(),
          browser: browser.version(),
          viewport: '1440x1000',
          gpuMemory: 'Not measurable with this API; heap is JS only',
        },
        results,
        errors,
        assertions: [
          'Independent layer toggles',
          'Research does not mutate authoritative settlements or control',
          'Bounded clusters and tile residency',
          'WASD while references enabled',
          'No browser errors',
        ],
      },
      null,
      2,
    ),
  );
} finally {
  await browser.close();
}
