import { chromium } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import process from 'node:process';
const out = process.argv[2];
if (!out) throw Error('Output directory required');
await mkdir(out, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome', headless: true });
try {
  const page = await browser.newPage({
      viewport: { width: 1440, height: 1000 },
    }),
    errors = [],
    captures = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => {
    if (m.type() === 'error' && !m.text().includes('404'))
      errors.push(m.text());
  });
  await page.goto('http://127.0.0.1:4173');
  await page.waitForFunction(() => window.__campaignMap?.ready, null, {
    timeout: 90000,
  });
  for (const view of [
    ['caspian-wide', 51, 41, 1800, 700],
    ['caspian-regional', 51, 41, 650, 700],
    ['caspian-coast', 49.8, 40.4, 120, 700],
    ['egypt-wide', 30.5, 28, 1800, 700],
    ['nile-delta-regional', 31, 30.7, 500, 700],
    ['nile-delta-close', 31, 30.7, 100, 700],
    ['red-sea-regional', 33.9, 27.7, 500, 700],
    ['red-sea-close', 33.9, 27.7, 100, 700],
    ['nile-local', 32.57, 25.74, 9, 700],
  ]) {
    const [name, lon, lat, distance, tilt] = view;
    await page.selectOption(
      '#world-view',
      name.startsWith('caspian') ? 'mesopotamia' : 'egypt',
    );
    await page.waitForTimeout(1500);
    await page.evaluate(() => window.__campaignMap.zoomForValidation(4000));
    await page.waitForTimeout(150);
    const points = await page.evaluate(
      ([lon, lat]) => {
        const m = window.__campaignMap,
          t = m.cameraForValidation().target;
        return {
          from: m.projectForValidation(lon, lat),
          to: m.projectForValidation(t.lon, t.lat),
        };
      },
      [lon, lat],
    );
    await page.mouse.move(points.from.x, points.from.y);
    await page.mouse.down({ button: 'right' });
    await page.mouse.move(points.to.x, points.to.y, { steps: 12 });
    await page.mouse.up({ button: 'right' });
    await page.waitForTimeout(500);
    await page.evaluate(
      (d) => window.__campaignMap.zoomForValidation(d),
      distance,
    );
    await page.locator('canvas').focus();
    await page.keyboard.down('f');
    await page.waitForTimeout(tilt);
    await page.keyboard.up('f');
    await page.waitForTimeout(1300);
    await page.waitForFunction(
      () => window.__campaignMap.tiles.pending.length === 0,
      null,
      { timeout: 60000 },
    );
    await page.waitForTimeout(700);
    captures.push({
      name,
      requested: { lon, lat, distance },
      ...(await page.evaluate(() => ({
        camera: window.__campaignMap.cameraForValidation(),
        tiles: window.__campaignMap.tiles,
        metrics: window.__campaignMap.metrics,
        water: window.__campaignMap.waterForValidation?.(),
      }))),
    });
    await page.screenshot({ path: `${out}/${name}.png` });
  }
  await writeFile(
    `${out}/captures.json`,
    JSON.stringify({ captures, errors }, null, 2),
  );
  if (errors.length) throw Error(errors.join('\n'));
} finally {
  await browser.close();
}
