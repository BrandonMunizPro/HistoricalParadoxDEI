import { assertMapSettlementCatalog } from './map-validation-contract.mjs';
import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { cpus, totalmem, platform } from 'node:os';
import { spawnSync } from 'node:child_process';
import process from 'node:process';

const url = process.argv[2] ?? 'http://127.0.0.1:4173';
const out = process.argv[3] ?? 'docs/vs5/world-evidence';
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
  await mkdir(out, { recursive: true });
  const started = Date.now();
  await page.goto(url);
  await page.waitForFunction(() => window.__campaignMap?.ready, null, {
    timeout: 90000,
  });
  const readyMs = Date.now() - started;
  const initial = await page.evaluate(() => ({
    settlements: window.__campaignMap.settlements,
    control: window.__campaignMap.controlForValidation(),
    scene: window.__campaignMap.sceneIdentity,
  }));
  await assertMapSettlementCatalog(page);
  const settle = async (expected) => {
    await page.waitForFunction(
      (n) =>
        window.__campaignMap.tiles?.pending.length === 0 &&
        window.__campaignMap.tiles.resident.length === n,
      expected,
      { timeout: 45000 },
    );
    await page.waitForTimeout(650);
    assert.deepEqual(
      await page.evaluate(() => window.__campaignMap.tiles.failed),
      [],
    );
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
        sampleFrames: f.length,
        tiles: m.tiles,
        synthetic: m.synthetic,
      };
    });
  };
  const metrics = {},
    navigation = [];
  // The launch now frames the Mediterranean; this suite tests full-envelope navigation.
  await page.selectOption('#world-view', 'world');
  await page.waitForTimeout(1600);
  await settle(0);
  metrics.world = await sample();
  // Check all four edges, not just a recognizable center behind the UI.
  const edgeProjection = await page.evaluate(() => {
    const m = window.__campaignMap,
      b = m.bounds,
      result = [];
    for (let i = 0; i <= 20; i++) {
      const t = i / 20;
      for (const [lon, lat] of [
        [b.west + t * (b.east - b.west), b.south],
        [b.west + t * (b.east - b.west), b.north],
        [b.west, b.south + t * (b.north - b.south)],
        [b.east, b.south + t * (b.north - b.south)],
      ])
        result.push({ ...m.projectForValidation(lon, lat), lon, lat });
    }
    return result;
  });
  for (const p of edgeProjection) {
    assert.ok(
      p.x > 320 && p.x < 1440,
      `World edge outside unobstructed viewport: ${JSON.stringify(p)}`,
    );
    assert.ok(
      p.y > 135 && p.y < 920,
      `World edge clipped vertically: ${JSON.stringify(p)}`,
    );
  }
  await page.screenshot({ path: `${out}/world-overhead.png` });
  for (const key of [
    'iberia',
    'italy',
    'greece',
    'egypt',
    'anatolia',
    'mesopotamia',
    'east',
  ]) {
    await page.selectOption('#world-view', key); // animated travel through one scene
    await page.waitForTimeout(1450);
    await settle(12);
    const state = await page.evaluate(() => ({
      scene: window.__campaignMap.sceneIdentity,
      preset: window.__campaignMap.viewPreset,
      tiles: window.__campaignMap.tiles,
    }));
    assert.equal(state.scene, initial.scene);
    assert.equal(state.preset, key);
    assert.ok(state.tiles.resident.length <= 12);
    navigation.push({ key, ...state });
    metrics[key] = await sample();
    await page.screenshot({ path: `${out}/${key}.png` });
  }
  // Revisit Greece to prove that western/eastern residency is evicted, not retained.
  await page.evaluate(() =>
    window.__campaignMap.navigateForValidation('greece', true),
  );
  await page.waitForTimeout(1450);
  await settle(12);
  const revisited = await page.evaluate(
    () => window.__campaignMap.tiles.resident,
  );
  assert.ok(
    navigation.at(-1).tiles.resident.every((id) => !revisited.includes(id)),
  );
  await page.evaluate(() =>
    window.__campaignMap.navigateForValidation('world', true),
  );
  await page.waitForTimeout(1450);
  await settle(0);
  for (const count of [700, 1000]) {
    await page.evaluate(
      (n) => window.__campaignMap.setSyntheticForValidation(true, n),
      count,
    );
    metrics[`synthetic${count}`] = await sample();
    assert.equal(metrics[`synthetic${count}`].synthetic.visible, count);
    assert.ok(
      metrics[`synthetic${count}`].drawCalls <= metrics.world.drawCalls + 1,
      'Instancing must add only one draw call',
    );
    await page.screenshot({ path: `${out}/synthetic-${count}.png` });
  }
  await page.evaluate(() =>
    window.__campaignMap.setSyntheticForValidation(false),
  );
  await page.evaluate(() => window.__campaignMap.focusForValidation('roma', 6));
  await settle(12);
  metrics.local = await sample();
  await page.screenshot({ path: `${out}/rome-local.png` });
  const final = await page.evaluate(() => ({
    settlements: window.__campaignMap.settlements,
    control: window.__campaignMap.controlForValidation(),
    scene: window.__campaignMap.sceneIdentity,
  }));
  assert.deepEqual(final, initial);
  await page.locator('#political').click();
  await page.waitForTimeout(500);
  assert.equal(
    await page.evaluate(() => window.__campaignMap.mode),
    'political',
  );
  await page.screenshot({ path: `${out}/italy-political-local.png` });
  const gpu = await page.evaluate(() => {
    const gl = document.querySelector('canvas').getContext('webgl2'),
      debug = gl.getExtension('WEBGL_debug_renderer_info');
    return debug
      ? gl.getParameter(debug.UNMASKED_RENDERER_WEBGL)
      : 'unavailable';
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
      gpu,
    },
    readyMs,
    metrics,
    navigation,
    edgeProjection,
    browserProcessMemory,
    assertions: [
      'Entire envelope fits unobstructed overhead viewport',
      'Seven animated regional presets in one scene',
      'At most twelve resident tiles and no failed geographic requests',
      'Eastern tiles evicted on return west; detail unloaded at world scale',
      '23 settlement identities, coordinates, development integration and simulation control preserved',
      '700 synthetic markers plus 1000 growth headroom; one instanced draw; no authoritative data added',
      'Existing local settlement visualization and political mode render',
      'No uncaught errors or missing geographic assets',
    ],
    limitations: [
      'Three-second idle headless samples, not long-duration camera or gameplay benchmark',
      'JS heap and process memory exclude a reliable measurement of GPU VRAM',
      'Synthetic evenly distributed entities include water; they are performance fixtures, never historical sites',
      'Only Italy has fine regional and city terrain; remaining world is coarse real-source relief',
      'Modern coasts and rivers are not reconstructed 278 BCE geography',
    ],
  };
  await writeFile(`${out}/metrics.json`, JSON.stringify(result, null, 2));
  process.stdout.write(
    JSON.stringify({
      readyMs,
      views: Object.keys(metrics),
      errors,
      output: out,
    }) + '\n',
  );
} finally {
  await browser.close();
}
