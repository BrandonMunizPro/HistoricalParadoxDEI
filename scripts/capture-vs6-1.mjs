import { chromium } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import process from 'node:process';
const out = process.argv[2];
if (!out) throw Error('Evidence directory required');
await mkdir(out, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome', headless: true });
try {
  const page = await browser.newPage({
      viewport: { width: 1440, height: 1000 },
    }),
    errors = [],
    captures = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('http://127.0.0.1:4173');
  await page.waitForFunction(() => window.__campaignMap?.ready, null, {
    timeout: 90000,
  });
  for (const [name, preset, tilt] of [
    ['world-overhead', 'world', 0],
    ['world-oblique', 'world', 1200],
    ['italy-oblique', 'italy', 850],
    ['italy-close', 'rome', 0],
    ['greece-oblique', 'greece', 850],
    ['egypt-oblique', 'egypt', 850],
  ]) {
    if (preset === 'rome') await page.locator('#focus-roma').click();
    else await page.selectOption('#world-view', preset);
    await page.waitForTimeout(2500);
    if (tilt) {
      await page.locator('canvas').focus();
      await page.keyboard.down('f');
      await page.waitForTimeout(tilt);
      await page.keyboard.up('f');
    }
    await page.waitForFunction(
      () => window.__campaignMap.tiles.pending.length === 0,
      null,
      { timeout: 60000 },
    );
    await page.waitForTimeout(1800);
    captures.push({
      name,
      ...(await page.evaluate(() => ({
        camera: window.__campaignMap.cameraForValidation(),
        metrics: window.__campaignMap.metrics,
        tiles: window.__campaignMap.tiles,
        frames: window.__campaignMap.frames,
      }))),
    });
    await page.screenshot({ path: `${out}/${name}.png` });
  }
  await writeFile(
    `${out}/views.json`,
    JSON.stringify({ captures, errors }, null, 2),
  );
  if (errors.length) throw Error(errors.join('\n'));
} finally {
  await browser.close();
}
