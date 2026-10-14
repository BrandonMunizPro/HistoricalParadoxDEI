import { chromium } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import { cpus, totalmem } from 'node:os';
import process from 'node:process';
const out = process.argv[2] ?? 'docs/vs5/streaming-evidence/before';
await mkdir(out, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome', headless: true });
try {
  const page = await browser.newPage({
      viewport: { width: 1440, height: 1000 },
    }),
    errors = [];
  page.on('pageerror', (e) => errors.push(e.stack));
  await page.addInitScript(() => {
    window.__longTasks = [];
    new window.PerformanceObserver((list) => {
      for (const e of list.getEntries())
        window.__longTasks.push({ at: e.startTime, ms: e.duration });
    }).observe({ type: 'longtask', buffered: true });
  });
  await page.goto('http://127.0.0.1:4173');
  await page.waitForFunction(() => window.__campaignMap?.ready, null, {
    timeout: 90000,
  });
  await page.evaluate(() => {
    window.__streamProfile.enabled = true;
  });
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('Profiler.enable');
  await cdp.send('Profiler.start');
  const results = [];
  for (const region of ['greece', 'egypt', 'italy']) {
    await page.selectOption('#world-view', region);
    await page.waitForTimeout(1800);
    await page.evaluate(() => {
      window.__pathFrames = [];
      window.__pathActive = true;
      function frame(t) {
        if (!window.__pathActive) return;
        window.__pathFrames.push({
          t,
          camera: window.__campaignMap.cameraForValidation(),
          tiles: window.__campaignMap.tiles,
        });
        window.requestAnimationFrame(frame);
      }
      window.requestAnimationFrame(frame);
      window.__streamProfile.events.length = 0;
      window.__streamProfile.totals = {};
      window.__longTasks.length = 0;
    });
    const start = await page.evaluate(() => window.performance.now());
    for (const d of [800, 600, 400, 200, 80, 20, 8, 80, 400, 800, 400, 80, 8]) {
      await page.evaluate((d) => window.__campaignMap.zoomForValidation(d), d);
      await page.waitForTimeout(650);
    }
    if (region === 'italy') await page.locator('#focus-roma').click();
    else await page.selectOption('#world-view', region + 'Detail');
    await page.waitForTimeout(2300);
    await page.locator('canvas').focus();
    await page.keyboard.down('w');
    await page.waitForTimeout(600);
    await page.keyboard.up('w');
    await page.mouse.wheel(0, -200);
    await page.waitForTimeout(1800);
    const state = await page.evaluate(() => {
      window.__pathActive = false;
      return {
        frames: window.__pathFrames,
        events: window.__streamProfile.events,
        totals: window.__streamProfile.totals,
        longTasks: window.__longTasks,
        metrics: window.__campaignMap.metrics,
        tiles: window.__campaignMap.tiles,
      };
    });
    const f = state.frames
        .slice(1)
        .map((v, i) => v.t - state.frames[i].t)
        .sort((a, b) => a - b),
      q = (p) => f[Math.min(f.length - 1, Math.floor(f.length * p))];
    results.push({
      region,
      start,
      frameTimes: { p50: q(0.5), p95: q(0.95), p99: q(0.99), worst: q(1) },
      ...state,
    });
    await page.screenshot({ path: `${out}/${region}.png` });
  }
  const { profile } = await cdp.send('Profiler.stop');
  await writeFile(`${out}/cpu-profile.json`, JSON.stringify(profile));
  await page.keyboard.press('Home');
  await page.waitForTimeout(1600);
  await page.screenshot({ path: `${out}/world.png` });
  const environment = {
    cpu: cpus()[0].model,
    ram: totalmem(),
    browser: browser.version(),
    viewport: '1440x1000',
    headless: true,
  };
  await writeFile(
    `${out}/profile.json`,
    JSON.stringify({ environment, errors, results }, null, 2),
  );
  process.stdout.write(
    JSON.stringify(
      results.map((r) => ({
        region: r.region,
        ...r.frameTimes,
        stages: r.totals,
      })),
    ) + '\n',
  );
  if (errors.length) throw Error(errors.join('\n'));
} finally {
  await browser.close();
}
