import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { cpus, totalmem, platform } from 'node:os';
import { spawnSync } from 'node:child_process';
import process from 'node:process';

const url = process.argv[2] ?? 'http://127.0.0.1:4173',
  out = process.argv[3] ?? 'docs/vs5/visual-fidelity-evidence';
const browser = await chromium.launch({ channel: 'chrome', headless: true });
try {
  const page = await browser.newPage({
      viewport: { width: 1440, height: 1000 },
    }),
    errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => {
    if (m.type() === 'error' && !m.text().includes('404'))
      errors.push(m.text());
  });
  page.on('response', (r) => {
    if (r.status() >= 400 && r.url().includes('/data/'))
      errors.push(`${r.status()} ${r.url()}`);
  });
  await mkdir(out, { recursive: true });
  const start = Date.now();
  await page.goto(url);
  await page.waitForFunction(() => window.__campaignMap?.ready, null, {
    timeout: 60000,
  });
  const readyMs = Date.now() - start;
  const settle = async () => {
    await page.waitForFunction(
      () =>
        window.__campaignMap.tiles?.resident.length === 12 &&
        window.__campaignMap.tiles.pending.length === 0,
      null,
      { timeout: 45000 },
    );
    await page.waitForTimeout(700);
  };
  await page.locator('#reset').click();
  await settle();
  assert.equal(
    await page.evaluate(() => window.__campaignMap.settlements.length),
    23,
  );
  const sample = async () => {
    await page.evaluate(() => {
      window.__campaignMap.frames.length = 0;
    });
    await page.waitForTimeout(3500);
    return page.evaluate(() => {
      const m = window.__campaignMap,
        f = [...m.frames].sort((a, b) => a - b);
      return {
        ...m.metrics,
        meanFps: 1000 / (f.reduce((a, b) => a + b, 0) / f.length),
        p95FrameMs: f[Math.floor(f.length * 0.95)],
        sampleFrames: f.length,
        tiles: m.tiles,
      };
    });
  };
  const metrics = { central: await sample() };
  await page.screenshot({ path: `${out}/central-italy-geographic.png` });
  const initial = await page.evaluate(
    () => window.__campaignMap.tiles.resident,
  );
  await page.locator('#wide').click();
  await settle();
  metrics.wide = await sample();
  assert.ok(metrics.wide.tiles.lods.some((t) => t.level > 0));
  await page.screenshot({ path: `${out}/peninsula-connected-tiles.png` });
  await page.locator('#overhead').click();
  await settle();
  metrics.overhead = await sample();
  assert.equal(
    await page.evaluate(() => window.__campaignMap.diagnostic),
    true,
  );
  await page.screenshot({ path: out + '/overhead-diagnostic.png' });
  await writeFile(
    out + '/coordinate-diagnostics.json',
    JSON.stringify(
      await page.evaluate(() => window.__campaignMap.diagnosticLandmarks),
      null,
      2,
    ),
  );
  await page.evaluate(() => window.__campaignMap.setDiagnostic(false));
  await page.screenshot({ path: out + '/overhead-geographic.png' });
  await page.locator('#focus-roma').click();
  await settle();
  metrics.rome = await sample();
  assert.equal(await page.locator('#place-name').textContent(), 'Roma');
  await page.screenshot({ path: `${out}/rome-intermediate.png` });
  await page.evaluate(() =>
    window.__campaignMap.focusForValidation('roma', 2.1),
  );
  await settle();
  await page.screenshot({ path: `${out}/rome-close.png` });
  await page.locator('#focus-capua').click();
  await settle();
  await page.screenshot({ path: `${out}/capua-intermediate.png` });
  await page.locator('#focus-neapolis').click();
  await settle();
  metrics.neapolis = await sample();
  const point = await page.evaluate(() =>
    window.__campaignMap.projectForValidation(14.257, 40.852),
  );
  await page.mouse.click(point.x, point.y);
  assert.equal(await page.locator('#place-name').textContent(), 'Neapolis');
  await page.screenshot({ path: `${out}/neapolis-close.png` });
  await page.locator('#focus-norba').click();
  await settle();
  metrics.norba = await sample();
  await page.screenshot({ path: out + '/norba-close.png' });
  const before = await page.evaluate(() => ({
    id: window.__campaignMap.selectedId,
    coordinates: window.__campaignMap.settlements,
    control: window.__campaignMap.controlForValidation(),
    selections: window.__campaignMap.architecturalSelections,
  }));
  await page.locator('#development-demo').click();
  await page.waitForTimeout(300);
  const after = await page.evaluate(() => ({
    id: window.__campaignMap.selectedId,
    coordinates: window.__campaignMap.settlements,
    control: window.__campaignMap.controlForValidation(),
    selections: window.__campaignMap.architecturalSelections,
  }));
  assert.equal(after.id, before.id);
  assert.deepEqual(after.coordinates, before.coordinates);
  assert.deepEqual(after.control, before.control);
  assert.ok(
    after.selections
      .find((s) => s.id === after.id)
      .assets.some((a) => a.category === 'military'),
  );
  await page.screenshot({ path: out + '/norba-external-development.png' });
  await writeFile(
    out + '/development-proof.json',
    JSON.stringify({ before, after }, null, 2),
  );
  await page.locator('#focus-neapolis').click();
  await settle();
  const finalResidents = await page.evaluate(
    () => window.__campaignMap.tiles.resident,
  );
  assert.ok(
    initial.some((id) => !finalResidents.includes(id)),
    'Pan must evict some original tiles',
  );
  await page.locator('#reset').click();
  await settle();
  await page.locator('#political').click();
  assert.equal(
    await page.evaluate(() => window.__campaignMap.mode),
    'political',
  );
  await page.screenshot({ path: `${out}/central-italy-political.png` });
  const capuaId = await page.evaluate(
    () => window.__campaignMap.settlements.find((s) => s.key === 'capua').id,
  );
  const priorColor = await page.evaluate(
    () => window.__campaignMap.tiles.controlColor,
  );
  const transfer = await page.evaluate(() =>
    window.__campaignMap.transferForValidation('capua'),
  );
  assert.equal(transfer.id, capuaId);
  assert.equal(transfer.owner, 'Roman Republic');
  await page.waitForFunction(
    (prior) =>
      JSON.stringify(window.__campaignMap.tiles.controlColor) !==
      JSON.stringify(prior),
    priorColor,
  );
  await page.screenshot({ path: `${out}/political-control-transfer.png` });
  await page.locator('#geographic').click();
  assert.equal(
    await page.evaluate(() => window.__campaignMap.mode),
    'geographic',
  );
  const labels = await page.evaluate(() => window.__campaignMap.visibleLabels);
  for (let i = 0; i < labels.length; i++)
    for (let j = i + 1; j < labels.length; j++) {
      const a = labels[i],
        b = labels[j];
      assert.ok(
        !(
          a.x < b.x + b.width &&
          a.x + a.width > b.x &&
          a.y < b.y + b.height &&
          a.y + a.height > b.y
        ),
        'Label collision',
      );
    }
  assert.deepEqual(
    await page.evaluate(() => window.__campaignMap.tiles.failed),
    [],
  );
  assert.equal(await page.evaluate(() => window.__terrainError ?? null), null);
  const gl = await page.evaluate(() => {
    const g = document.querySelector('canvas').getContext('webgl2'),
      ext = g.getExtension('WEBGL_debug_renderer_info');
    return ext ? g.getParameter(ext.UNMASKED_RENDERER_WEBGL) : 'unavailable';
  });
  let browserProcessMemory = null;
  if (platform() === 'win32') {
    const cdp = await browser.newBrowserCDPSession(),
      { processInfo } = await cdp.send('SystemInfo.getProcessInfo');
    const ids = processInfo
      .map((p) => Number(p.id))
      .filter((id) => Number.isSafeInteger(id) && id > 0);
    const p = spawnSync(
      'powershell.exe',
      [
        '-NoProfile',
        '-Command',
        `Get-Process -Id ${ids.join(',')} -ErrorAction SilentlyContinue | Select-Object WorkingSet64,PrivateMemorySize64 | ConvertTo-Json -Compress`,
      ],
      { encoding: 'utf8', windowsHide: true },
    );
    if (p.status === 0 && p.stdout.trim()) {
      const r = JSON.parse(p.stdout),
        rows = Array.isArray(r) ? r : [r];
      browserProcessMemory = {
        privateBytes: rows.reduce((s, r) => s + r.PrivateMemorySize64, 0),
        workingSetBytes: rows.reduce((s, r) => s + r.WorkingSet64, 0),
        processCount: rows.length,
      };
    }
  }
  assert.deepEqual(errors, []);
  const result = {
    environment: {
      platform: platform(),
      cpu: cpus()[0].model,
      ramBytes: totalmem(),
      browser: browser.version(),
      viewport: '1440x1000',
      headless: true,
      url,
      gpu: gl,
    },
    readyMs,
    metrics,
    browserProcessMemory,
    assertions: [
      '23 stable atlas identities',
      '12 resident tiles maximum including four city windows',
      'Tile loading and eviction after pan',
      'Mixed terrain LOD in peninsula view',
      'Rome, Capua and Neapolis focus controls',
      'Neapolis selected by canvas raycast',
      'Geographic and political modes',
      'Simulation control transfer preserves Capua identity',
      'No label collisions',
      'Overhead coordinate diagnostic and Norba close view',
      'External development snapshot changes visible asset selection and preserves identity',
      'No missing geographic assets or uncaught browser errors',
    ],
    limitations: [
      'Short headless idle-view samples, not a campaign stress test',
      'JS heap excludes GPU memory; process working sets may double-count shared pages',
      'Original concept artwork and georeferenced Rome II extent were not available for direct image matching',
    ],
  };
  await writeFile(`${out}/metrics.json`, JSON.stringify(result, null, 2));
  process.stdout.write(JSON.stringify(result, null, 2) + '\n');
} finally {
  await browser.close();
}
