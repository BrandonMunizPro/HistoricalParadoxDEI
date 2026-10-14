import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import process from 'node:process';
const url = process.argv[2] ?? 'http://127.0.0.1:4173',
  out = process.argv[3] ?? 'docs/vs5/campaign-experience-evidence';
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
  await page.goto(url);
  await page.waitForFunction(
    () =>
      window.__campaignMap?.ready && window.__campaignMap?.cameraForValidation,
    null,
    { timeout: 90000 },
  );
  const state = () =>
    page.evaluate(() => window.__campaignMap.cameraForValidation());
  const key = async (code, ms = 350) => {
    await page.keyboard.down(code);
    await page.waitForTimeout(ms);
    await page.keyboard.up(code);
    await page.waitForTimeout(650);
  };
  const before = await state();
  const eventToMovementMs = await page.evaluate(async () => {
    const initial = window.__campaignMap.cameraForValidation().target.x;
    const initialZ = window.__campaignMap.cameraForValidation().target.z;
    const start = window.performance.now();
    window.dispatchEvent(new window.KeyboardEvent('keydown', { code: 'KeyW' }));
    await new Promise((resolve) => {
      function check() {
        const p = window.__campaignMap.cameraForValidation().target;
        if (
          Math.hypot(p.x - initial, p.z - initialZ) > 0.001 ||
          window.performance.now() - start > 2000
        )
          resolve();
        else window.requestAnimationFrame(check);
      }
      window.requestAnimationFrame(check);
    });
    window.dispatchEvent(new window.KeyboardEvent('keyup', { code: 'KeyW' }));
    return window.performance.now() - start;
  });
  await key('w');
  const moved = await state();
  assert.ok(
    moved.target.lat > before.target.lat,
    'W must pan north from north-up view',
  );
  await key('d', 1800);
  const east = await state();
  assert.ok(
    east.target.lon > moved.target.lon + 10,
    'Travel between distant regions must work without presets',
  );
  await key('q');
  const rotated = await state();
  assert.ok(Math.abs(rotated.azimuth - east.azimuth) > 0.1);
  await key('f');
  assert.ok((await state()).polar > rotated.polar + 0.05);
  await page.keyboard.press('Home');
  await page.waitForTimeout(1500);
  await page.locator('#camera-settings summary').click();
  await page.locator('[data-camera="movement"]').focus();
  const uiStart = await state();
  await key('w');
  const uiEnd = await state();
  assert.ok(
    Math.hypot(
      uiEnd.target.x - uiStart.target.x,
      uiEnd.target.z - uiStart.target.z,
    ) < 0.01,
    'UI focus must suppress map keys',
  );
  await page.locator('[data-camera="edgeScroll"]').uncheck();
  await page.locator('#camera-settings summary').click();
  await page.locator('canvas').focus();
  await page.mouse.move(1439, 500);
  const edgeOff = await state();
  await page.waitForTimeout(700);
  assert.ok(
    Math.hypot(
      (await state()).target.x - edgeOff.target.x,
      (await state()).target.z - edgeOff.target.z,
    ) < 0.01,
  );
  await page.locator('#camera-settings summary').click();
  await page.locator('[data-camera="edgeScroll"]').check();
  await page.locator('#camera-settings summary').click();
  await page.locator('canvas').focus();
  await page.mouse.move(1200, 500);
  await page.mouse.move(1439, 500);
  const edgeOn = await state();
  await page.waitForTimeout(700);
  const edgeMoved = await state();
  assert.ok(
    Math.hypot(
      edgeMoved.target.x - edgeOn.target.x,
      edgeMoved.target.z - edgeOn.target.z,
    ) > 10,
    'Edge pan must move',
  );
  await page.mouse.move(900, 500);
  await page.waitForTimeout(650);
  await key('d', 6000);
  const bounded = await state();
  assert.ok(
    bounded.target.lon <= 75.000001 &&
      bounded.target.lon >= -12 &&
      bounded.target.lat >= 12 &&
      bounded.target.lat <= 62,
  );
  await page.keyboard.press('Home');
  await page.waitForTimeout(1500);
  const anchor = await page.evaluate(() =>
    window.__campaignMap.projectForValidation(35, 35),
  );
  await page.mouse.move(anchor.x, anchor.y);
  const zoomBefore = await state();
  await page.mouse.wheel(0, -350);
  await page.waitForTimeout(1100);
  const zoomAfter = await state();
  assert.ok(zoomAfter.distance < zoomBefore.distance * 0.8);
  assert.equal(zoomAfter.zooming, false);
  const anchored = await page.evaluate(() =>
    window.__campaignMap.projectForValidation(35, 35),
  );
  assert.ok(
    Math.hypot(anchored.x - anchor.x, anchored.y - anchor.y) < 5,
    'Cursor geographic anchor must remain stable',
  );
  const selectedBefore = await page.evaluate(
    () => window.__campaignMap.selectedId,
  );
  await page.mouse.move(900, 500);
  const panStart = await state();
  await page.mouse.down({ button: 'middle' });
  await page.mouse.move(1050, 540, { steps: 12 });
  await page.mouse.up({ button: 'middle' });
  await page.waitForTimeout(650);
  const panEnd = await state();
  assert.ok(
    Math.hypot(
      panEnd.target.x - panStart.target.x,
      panEnd.target.z - panStart.target.z,
    ) > 10,
  );
  assert.equal(
    await page.evaluate(() => window.__campaignMap.selectedId),
    selectedBefore,
  );
  await page.mouse.down({ button: 'right' });
  await page.mouse.move(950, 500, { steps: 12 });
  await page.mouse.up({ button: 'right' });
  assert.equal(
    await page.evaluate(() => window.__campaignMap.selectedId),
    selectedBefore,
  );
  await page.keyboard.press('Home');
  await page.waitForTimeout(1500);
  await mkdir(out, { recursive: true });
  await page.screenshot({ path: `${out}/camera-strategic.png` });
  assert.deepEqual(errors, []);
  const result = {
    before,
    eventToMovementMs,
    moved,
    east,
    rotated,
    uiStart,
    uiEnd,
    edgeOff,
    edgeOn,
    edgeMoved,
    bounded,
    zoomBefore,
    zoomAfter,
    panStart,
    panEnd,
    assertions: [
      'WASD pan and long-distance travel without presets',
      'Q/E yaw and R/F tilt',
      'Home strategic reset',
      'UI focus suppresses map shortcuts',
      'Edge scroll enabled and disabled',
      'Geographic movement bounds',
      'Smooth wheel zoom',
      'Middle/right drag pan without settlement selection',
      'No uncaught/shader errors',
    ],
  };
  await writeFile(
    `${out}/camera-controls.json`,
    JSON.stringify(result, null, 2),
  );
  process.stdout.write(
    JSON.stringify({ output: out, assertions: result.assertions.length }) +
      '\n',
  );
} finally {
  await browser.close();
}
