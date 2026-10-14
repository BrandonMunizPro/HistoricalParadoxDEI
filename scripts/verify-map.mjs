import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { cpus, totalmem, platform } from 'node:os';
import process from 'node:process';
import { spawnSync } from 'node:child_process';

const browser = await chromium.launch({ channel: 'chrome', headless: true });
const evidenceDirectory = process.argv[3] ?? 'docs/vs5/atlas-evidence';
try {
  const page = await browser.newPage({
    viewport: { width: 1440, height: 1000 },
  });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (message) => {
    if (message.type() === 'error' && !message.text().includes('404'))
      errors.push(message.text());
  });
  const url = process.argv[2] ?? 'http://127.0.0.1:5173';
  await page.goto(url);
  await page.waitForFunction(() => window.__campaignMap?.ready, null, {
    timeout: 60000,
  });
  await page.locator('#reset').click();
  await mkdir(evidenceDirectory, { recursive: true });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: `${evidenceDirectory}/geographic.png` });
  await page.locator('#settlements [data-key="capua"]').click();
  assert.equal(await page.locator('#place-name').textContent(), 'Capua');
  await page.locator('#political').click();
  assert.equal(
    await page.locator('#political').getAttribute('aria-pressed'),
    'true',
  );
  await page.waitForTimeout(1000);
  await page.screenshot({
    path: `${evidenceDirectory}/political-selection.png`,
  });
  const capuaId = await page.evaluate(() => window.__campaignMap.selectedId);
  const transfer = await page.evaluate(() =>
    window.__campaignMap.transferForValidation('capua'),
  );
  assert.equal(transfer.id, capuaId);
  assert.equal(transfer.owner, 'Roman Republic');
  await page.screenshot({ path: `${evidenceDirectory}/control-transfer.png` });
  await page.locator('#geographic').click();
  const roma = await page.evaluate(() => {
    const s = window.__campaignMap.settlements.find((s) => s.key === 'roma');
    return window.__campaignMap.projectForValidation(s.lon, s.lat);
  });
  await page.mouse.click(roma.x, roma.y);
  assert.equal(await page.locator('#place-name').textContent(), 'Roma');
  await page.screenshot({ path: `${evidenceDirectory}/rome-raycast.png` });
  const region = await page.evaluate(() =>
    window.__campaignMap.projectForValidation(13.4, 42.2),
  );
  await page.mouse.click(region.x, region.y);
  assert.equal(
    await page.locator('#place-name').textContent(),
    'Central Italy',
  );
  assert.ok(await page.evaluate(() => window.__campaignMap.selectedRegionId));
  await page.screenshot({ path: `${evidenceDirectory}/region-selection.png` });
  const initialDistance = await page.evaluate(
    () => window.__campaignMap.cameraDistance,
  );
  await page.mouse.move(900, 500);
  await page.mouse.wheel(0, -450);
  await page.waitForTimeout(1000);
  assert.ok(
    (await page.evaluate(() => window.__campaignMap.cameraDistance)) <
      initialDistance,
  );
  await page.screenshot({ path: `${evidenceDirectory}/zoom.png` });
  await page.locator('#reset').click();
  await page.waitForTimeout(3000);
  assert.ok(
    Math.abs(
      (await page.evaluate(() => window.__campaignMap.cameraDistance)) -
        initialDistance,
    ) < 1,
  );
  await page.mouse.move(900, 500);
  await page.mouse.wheel(0, 1800);
  await page.waitForTimeout(1000);
  const farTriangles = await page.evaluate(
    () => window.__campaignMap.metrics.triangles,
  );
  assert.equal(
    await page.evaluate(() => window.__campaignMap.metrics.terrainLod),
    1,
  );
  await page.locator('#reset').click();
  await page.waitForTimeout(1200);
  const nearTriangles = await page.evaluate(
    () => window.__campaignMap.metrics.triangles,
  );
  assert.ok(farTriangles < nearTriangles);
  assert.equal(
    await page.evaluate(() => window.__campaignMap.settlements.length),
    23,
  );
  const regionalCount = await page.locator('.label:visible').count();
  const newMarker = await page.evaluate(() => {
    const s = window.__campaignMap.settlements.find(
      (s) => s.key === 'neapolis',
    );
    const p = s.renderAnchor ?? s;
    return window.__campaignMap.projectForValidation(p.lon, p.lat);
  });
  await page.mouse.click(newMarker.x, newMarker.y);
  assert.equal(await page.locator('#place-name').textContent(), 'Neapolis');
  await page.evaluate(() =>
    window.__campaignMap.focusForValidation('neapolis', 95),
  );
  await page.waitForTimeout(1000);
  assert.equal(await page.locator('#place-name').textContent(), 'Neapolis');
  assert.equal(
    await page.evaluate(() => window.__campaignMap.detailBand),
    'local',
  );
  assert.ok(
    (await page.locator('.label[data-tier="3"]:visible').count()) > 0,
    'Local zoom should reveal unselected tier-three town labels',
  );
  await page.screenshot({ path: `${evidenceDirectory}/neapolis-close.png` });
  await page.evaluate(() =>
    window.__campaignMap.focusForValidation('diana-nemi', 90),
  );
  await page.waitForTimeout(800);
  assert.equal(
    await page.locator('#place-name').textContent(),
    'Diana at Nemi',
  );
  await page.screenshot({ path: `${evidenceDirectory}/sanctuary-close.png` });
  const labelBoxes = await page
    .locator('.label:visible')
    .evaluateAll((elements) =>
      elements.map((e) => {
        const b = e.getBoundingClientRect();
        return { x: b.x, y: b.y, width: b.width, height: b.height };
      }),
    );
  for (let i = 0; i < labelBoxes.length; i++)
    for (let j = i + 1; j < labelBoxes.length; j++) {
      const a = labelBoxes[i],
        b = labelBoxes[j];
      assert.ok(
        !(
          a.x < b.x + b.width &&
          a.x + a.width > b.x &&
          a.y < b.y + b.height &&
          a.y + a.height > b.y
        ),
        'Visible labels overlap',
      );
    }
  await page.locator('#reset').click();
  await page.waitForTimeout(1200);
  const metrics = await page.evaluate(() => {
    const map = window.__campaignMap;
    const frames = map.frames.slice(120).sort((a, b) => a - b);
    const gl = document.querySelector('canvas').getContext('webgl2');
    const debug = gl.getExtension('WEBGL_debug_renderer_info');
    return {
      ...map.metrics,
      p95FrameMs: frames[Math.floor(frames.length * 0.95)],
      sampleFrames: frames.length,
      gpu: debug
        ? gl.getParameter(debug.UNMASKED_RENDERER_WEBGL)
        : 'unavailable',
      mode: map.mode,
      selectedId: map.selectedId,
      samples: map.samples,
      trees: map.treeCount,
      settlements: map.settlements.length,
      atlasCandidates: map.atlasCount,
      buildings: map.buildingCount,
    };
  });
  let browserProcessMemory = null;
  if (platform() === 'win32') {
    const session = await browser.newBrowserCDPSession();
    const { processInfo } = await session.send('SystemInfo.getProcessInfo');
    const ids = processInfo
      .map((info) => Number(info.id))
      .filter((id) => Number.isSafeInteger(id) && id > 0);
    const result = spawnSync(
      'powershell.exe',
      [
        '-NoProfile',
        '-Command',
        `Get-Process -Id ${ids.join(',')} -ErrorAction SilentlyContinue | Select-Object Id,WorkingSet64,PrivateMemorySize64 | ConvertTo-Json -Compress`,
      ],
      { encoding: 'utf8', windowsHide: true },
    );
    if (result.status === 0 && result.stdout.trim()) {
      const rows = JSON.parse(result.stdout);
      const records = Array.isArray(rows) ? rows : [rows];
      browserProcessMemory = {
        processCount: records.length,
        privateBytes: records.reduce(
          (sum, row) => sum + row.PrivateMemorySize64,
          0,
        ),
        workingSetBytes: records.reduce(
          (sum, row) => sum + row.WorkingSet64,
          0,
        ),
        method:
          'CDP-owned Chrome process IDs; Windows Get-Process PrivateMemorySize64 and WorkingSet64. Working-set sum can double-count shared pages; GPU VRAM is excluded.',
      };
    }
  }
  assert.deepEqual(errors, []);
  const evidence = {
    environment: {
      platform: platform(),
      cpu: cpus()[0].model,
      ramBytes: totalmem(),
      browser: browser.version(),
      viewport: '1440x1000',
      headless: true,
      url,
    },
    metrics,
    browserProcessMemory,
    assertions: [
      'map loaded',
      'Capua panel selection',
      'political mode active',
      'simulation ownership transfer updated overlay and preserved Capua identity',
      'geographic mode restored',
      'Roma selected by terrain marker raycast',
      'region selected by terrain raycast',
      'zoom changed camera distance and reset restored it',
      'distant terrain LOD reduces triangle count',
      `regional labels: ${regionalCount}; local zoom exposes smaller sites`,
      'Neapolis selected by marker raycast; probable Nemi sanctuary inspected at local zoom',
      'visible label rectangles do not overlap',
      'no uncaught browser errors',
    ],
    limitations:
      'JS heap is not total process/GPU memory; headless FPS is not a production hardware benchmark.',
  };
  await writeFile(
    `${evidenceDirectory}/metrics.json`,
    JSON.stringify(evidence, null, 2),
  );
  process.stdout.write(JSON.stringify(evidence, null, 2) + '\n');
} finally {
  await browser.close();
}
