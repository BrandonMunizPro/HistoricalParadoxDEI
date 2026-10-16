import {
  assertMapSettlementCatalog,
  expectedMapSettlementCount,
} from './map-validation-contract.mjs';
import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import process from 'node:process';
const out = process.argv[2] ?? 'docs/vs6/evidence/presentation';
await mkdir(out, { recursive: true });
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
    if (r.status() >= 400 && !r.url().endsWith('/favicon.ico'))
      errors.push(r.status() + ' ' + r.url());
  });
  await page.goto('http://127.0.0.1:4173');
  await page.waitForFunction(() => window.__campaignMap?.ready, null, {
    timeout: 90000,
  });
  const captures = [];
  for (const name of ['world', 'greeceDetail', 'egyptDetail', 'rome']) {
    if (name === 'rome') await page.locator('#focus-roma').click();
    else await page.selectOption('#world-view', name);
    await page.waitForTimeout(1500);
    if (name === 'world') await page.waitForTimeout(200);
    else
      await page.waitForFunction(
        () =>
          window.__campaignMap.tiles.resident.length === 12 &&
          window.__campaignMap.tiles.pending.length === 0 &&
          window.__campaignMap.tiles.transitions.minimumReveal === 1,
        null,
        { timeout: 60000 },
      );
    await page.waitForTimeout(900);
    const m = await page.evaluate(() => ({
      camera: window.__campaignMap.cameraForValidation(),
      tiles: window.__campaignMap.tiles,
      presentation: window.__campaignMap.presentationForValidation(),
      metrics: window.__campaignMap.metrics,
      settlements: window.__campaignMap.settlements.length,
    }));
    assert.equal(m.settlements, expectedMapSettlementCount);
    await assertMapSettlementCatalog(page);
    assert.deepEqual(m.tiles.failed, []);
    assert.ok(m.tiles.cached.length <= 4);
    assert.ok(m.tiles.resident.length <= 12);
    assert.equal(m.presentation.coverageLineVisible, false);
    if (name === 'world') assert.equal(m.presentation.canopyVisible, false);
    if (name === 'greeceDetail' || name === 'egyptDetail') {
      const w = m.tiles.revealParents.find((p) => p.id.startsWith('window-'));
      assert.ok(w.parentId.startsWith('detail-'));
      assert.ok(
        Math.abs(w.diagnostic.appliedCenterHeight - w.diagnostic.parentHeight) <
          0.00001,
        'Fine reveal must begin on actual regional parent surface',
      );
    }
    captures.push({ name, ...m });
    await page.screenshot({ path: `${out}/${name}.png` });
    if (name === 'greeceDetail') {
      await page.locator('canvas').focus();
      await page.keyboard.down('f');
      await page.waitForTimeout(1200);
      await page.keyboard.up('f');
      await page.waitForTimeout(400);
      const p = await page.evaluate(() =>
        window.__campaignMap.presentationForValidation(),
      );
      assert.ok(p.horizonFade > 0.5);
      assert.equal(p.boundaryHazeApplied, false);
      await page.screenshot({ path: `${out}/greece-low-angle.png` });
    }
  }
  await page.locator('#political').click();
  await page.waitForTimeout(1200);
  assert.equal(
    await page.evaluate(() => window.__campaignMap.mode),
    'political',
  );
  await page.screenshot({ path: out + '/rome-political.png' });
  await page.locator('#geographic').click();
  await page.waitForTimeout(600);
  const approved = JSON.parse(
    await readFile('public/data/approved-settlements.json', 'utf8'),
  );
  assert.equal(
    approved.records.length + 23,
    expectedMapSettlementCount,
    'Map count must match the published registry',
  );
  assert.deepEqual(errors, []);
  await writeFile(
    `${out}/validation.json`,
    JSON.stringify(
      {
        captures,
        errors,
        approvedPilot: approved.records.length,
        assertions: [
          'Source-parent reveal equality',
          'Bounded residency/cache',
          'No strategic vegetation dots',
          'Low-angle capture without extra geographic boundary recoloring',
          'Envelope diagnostic opt-in',
          '23 original settlements retained',
          'Only published registry additions; original fixtures unchanged',
        ],
      },
      null,
      2,
    ),
  );
  process.stdout.write(
    JSON.stringify({ views: captures.map((c) => c.name), errors }) + '\n',
  );
} finally {
  await browser.close();
}
