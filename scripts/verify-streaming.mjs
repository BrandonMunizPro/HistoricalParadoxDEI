import process from 'node:process';
import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
const out = 'docs/vs5/streaming-evidence';
await mkdir(out, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome', headless: true });
try {
  const page = await browser.newPage({
      viewport: { width: 1440, height: 1000 },
    }),
    errors = [];
  page.on('pageerror', (e) => errors.push(e.stack));
  await page.goto('http://127.0.0.1:4173');
  await page.waitForFunction(() => window.__campaignMap?.ready, null, {
    timeout: 90000,
  });
  const baseline = await page.evaluate(() => ({
    settlements: window.__campaignMap.settlements,
    control: window.__campaignMap.controlForValidation(),
    scene: window.__campaignMap.sceneIdentity,
  }));
  const results = [];
  for (const region of ['greece', 'egypt', 'italy']) {
    await page.selectOption('#world-view', region);
    await page.waitForTimeout(1400);
    await page.evaluate(() => window.__campaignMap.zoomForValidation(300));
    await page.waitForFunction(
      () => window.__campaignMap.tiles.pending.length > 0,
      null,
      { timeout: 15000 },
    );
    await page.locator('canvas').focus();
    await page.evaluate(() => {
      window.__moving = [];
      window.__movingActive = true;
      function sample(t) {
        if (!window.__movingActive) return;
        const m = window.__campaignMap;
        window.__moving.push({
          t,
          camera: m.cameraForValidation(),
          tiles: m.tiles,
        });
        window.requestAnimationFrame(sample);
      }
      window.requestAnimationFrame(sample);
    });
    const before = await page.evaluate(() =>
      window.__campaignMap.cameraForValidation(),
    );
    await page.keyboard.down('w');
    await page.waitForTimeout(1000);
    await page.keyboard.up('w');
    const after = await page.evaluate(() =>
      window.__campaignMap.cameraForValidation(),
    );
    const moving = await page.evaluate(() => {
      window.__movingActive = false;
      return window.__moving;
    });
    assert.ok(
      Math.hypot(
        after.target.x - before.target.x,
        after.target.z - before.target.z,
      ) > 10,
      'Camera must move while tiles prepare',
    );
    assert.ok(
      moving.filter((f) => f.tiles.pending.length > 0).length > 5,
      'Camera frames continue with pending terrain',
    );
    for (const f of moving) {
      assert.ok(f.tiles.resident.length <= 12);
      assert.ok(f.tiles.pending.length <= 3);
      assert.ok((f.tiles.cached ?? []).length <= 4);
      assert.deepEqual(f.tiles.failed, []);
    }
    const during = moving
      .slice(1)
      .map((f, i) => ({
        ms: f.t - moving[i].t,
        distance: Math.hypot(
          f.camera.target.x - moving[i].camera.target.x,
          f.camera.target.z - moving[i].camera.target.z,
        ),
      }));
    assert.ok(
      during.every((f) => f.distance < 5),
      'No arrival-induced horizontal camera jump at 300 km zoom',
    );
    results.push({
      region,
      frames: moving.length,
      framesWithPending: moving.filter((f) => f.tiles.pending.length).length,
      worstFrameMs: Math.max(...during.map((f) => f.ms)),
      maxMovementStepKm: Math.max(...during.map((f) => f.distance)),
      before,
      after,
    });
  }
  const resources = await page.evaluate(() =>
    window.performance
      .getEntriesByType('resource')
      .filter((r) => r.name.includes('/data/') && r.name.includes('terrain'))
      .map((r) => ({
        name: r.name,
        durationMs: r.duration,
        transferBytes: r.transferSize,
        bodyBytes: r.decodedBodySize,
        responseMs: r.responseEnd - r.responseStart,
      })),
  );
  const final = await page.evaluate(() => ({
    settlements: window.__campaignMap.settlements,
    control: window.__campaignMap.controlForValidation(),
    scene: window.__campaignMap.sceneIdentity,
  }));
  assert.deepEqual(final, baseline);
  assert.equal(final.settlements.length, 23);
  assert.deepEqual(errors, []);
  await writeFile(
    `${out}/responsiveness.json`,
    JSON.stringify({ results, resources, errors, settlements: 23 }, null, 2),
  );
  process.stdout.write(
    JSON.stringify(
      results.map((r) => ({
        region: r.region,
        frames: r.frames,
        pending: r.framesWithPending,
        worst: r.worstFrameMs,
      })),
    ) + '\n',
  );
} finally {
  await browser.close();
}
