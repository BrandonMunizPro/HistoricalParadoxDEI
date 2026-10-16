import { chromium } from '@playwright/test';
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { researchLocations } from '../dist/presentation/research-markers.js';
import assert from 'node:assert/strict';
import process from 'node:process';
import {
  assertMapSettlementCatalog,
  approved,
} from './map-validation-contract.mjs';
const out = process.argv[2] ?? 'docs/vs6-1/geographic-integration/evidence';
await mkdir(out, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome', headless: true });
try {
  const page = await browser.newPage({
      viewport: { width: 1440, height: 1000 },
    }),
    errors = [],
    selections = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => {
    if (m.type() === 'error' && !m.text().includes('404'))
      errors.push(m.text());
  });
  await page.goto('http://127.0.0.1:4173');
  await page.waitForFunction(() => window.__campaignMap?.ready, null, {
    timeout: 90000,
  });
  await assertMapSettlementCatalog(page);
  const before = await page.evaluate(() => ({
    control: window.__campaignMap.controlForValidation(),
    architecture: window.__campaignMap.architecturalSelections,
    buildingCount: window.__campaignMap.buildingCount,
  }));
  assert.equal(approved.length, 12);
  await page.screenshot({ path: `${out}/world-geographic.png` });
  const all = await page.evaluate(() => window.__campaignMap.settlements);
  for (const s of all) {
    await page.evaluate(
      (key) => window.__campaignMap.focusForValidation(key, 25),
      s.key,
    );
    await page.waitForTimeout(600);
    // Change selection without changing the camera, then select the actual map symbol/model.
    await page
      .locator(
        `#settlements [data-key="${s.key === 'roma' ? 'capua' : 'roma'}"]`,
      )
      .click();
    const xy = await page.evaluate(
      (key) => window.__campaignMap.screenPositions[key],
      s.key,
    );
    assert.ok(
      xy.x > 320 && xy.x < 1440 && xy.y > 130 && xy.y < 920,
      s.key + ' outside unobstructed viewport',
    );
    await page.mouse.click(xy.x, xy.y);
    await page.waitForTimeout(100);
    assert.equal(
      await page.evaluate(() => window.__campaignMap.selectedId),
      s.id,
      s.key + ' map selection',
    );
    assert.equal(
      await page.locator('#place-name').textContent(),
      s.key === 'roma'
        ? 'Roma'
        : s.key === 'neapolis'
          ? 'Neapolis'
          : await page
              .locator(`#settlements [data-key="${s.key}"]`)
              .textContent(),
    );
    const record = approved.find((r) => r.atlas.id === s.id);
    if (record) {
      assert.match(
        await page.locator('#details').textContent(),
        /Not assigned/,
      );
      assert.ok(await page.locator('#development-demo').isDisabled());
      assert.equal(
        await page.locator('#description').textContent(),
        record.atlas.evidence,
      );
      assert.ok(
        (await page.locator('#details').textContent()).includes(
          record.atlas.coordinateEvidence.precision,
        ),
      );
    }
    selections.push({
      key: s.key,
      id: s.id,
      screen: xy,
      registryLoaded: !!record,
    });
  }
  for (const key of ['tarquinii', 'arretium', 'akragas', 'catana', 'roma']) {
    await page.evaluate(
      (key) =>
        window.__campaignMap.focusForValidation(key, key === 'roma' ? 6 : 45),
      key,
    );
    await page.waitForTimeout(1600);
    await page.waitForFunction(
      () => window.__campaignMap.tiles.pending.length === 0,
      null,
      { timeout: 60000 },
    );
    await page.waitForTimeout(700);
    await page.screenshot({ path: `${out}/${key}-geographic.png` });
    if (key === 'akragas') {
      await page.locator('#political').click();
      await page.waitForTimeout(400);
      const id = approved.find((r) => r.atlas.key === key).atlas.id;
      assert.equal(
        await page.evaluate(() => window.__campaignMap.selectedId),
        id,
      );
      assert.match(
        await page.locator('#details').textContent(),
        /Not assigned/,
      );
      await page.screenshot({ path: `${out}/${key}-political.png` });
      await page.locator('#geographic').click();
    }
  }
  await page.locator('#settlements [data-key="catana"]').click();
  await page.waitForTimeout(500);
  assert.equal(
    await page.evaluate(() => window.__campaignMap.selectedId),
    approved.find((r) => r.atlas.key === 'catana').atlas.id,
  );
  await page.selectOption('#world-view', 'italy');
  await page.waitForTimeout(2000);
  await page.screenshot({ path: `${out}/italy-registry-sites.png` });
  await page.locator('#research-markers').check();
  await page.waitForTimeout(350);
  const research = await page.evaluate(() =>
    window.__campaignMap.researchForValidation(),
  );
  assert.equal(research.suppressedPromoted, 12);
  const sourceResearch=JSON.parse(await readFile('public/data/research-locations.json','utf8')).records;
  const promotedIds=new Set(approved.map(r=>r.provenance.candidateId));
  assert.equal(research.available,researchLocations(sourceResearch.filter(r=>!promotedIds.has(r.proposedId))).locations.length);
  assert.equal(research.excluded.length, 13);
  await page.locator('#authoritative-settlements').uncheck();
  await page.waitForTimeout(250);
  assert.equal(
    await page.locator('#labels .label:not(.diagnostic):visible').count(),
    0,
  );
  await page.locator('#authoritative-settlements').check();
  await page.locator('#research-markers').uncheck();
  const after = await page.evaluate(() => ({
    control: window.__campaignMap.controlForValidation(),
    architecture: window.__campaignMap.architecturalSelections,
    buildingCount: window.__campaignMap.buildingCount,
  }));
  assert.deepEqual(after, before);
  const neutralTransfer = await page.evaluate(() => {
    try {
      window.__campaignMap.transferForValidation('catana');
      return 'unexpected transfer';
    } catch (error) {
      return error.message;
    }
  });
  assert.match(neutralTransfer, /No political control state/);
  const metrics = await page.evaluate(() => ({
    metrics: window.__campaignMap.metrics,
    tiles: window.__campaignMap.tiles,
  }));
  assert.deepEqual(metrics.tiles.failed, []);
  assert.ok(metrics.tiles.resident.length <= 12);
  assert.deepEqual(errors, []);
  // Prove source-driven rendering without editing any published file.
  const isolated = await browser.newPage({
    viewport: { width: 1440, height: 1000 },
  });
  await isolated.route('**/data/approved-settlements.json', (route) =>
    route.fulfill({ json: { schemaVersion: 1, records: [] } }),
  );
  await isolated.goto('http://127.0.0.1:4173');
  await isolated.waitForFunction(() => window.__campaignMap?.ready, null, {
    timeout: 90000,
  });
  assert.equal(
    await isolated.evaluate(() => window.__campaignMap.settlements.length),
    23,
  );
  assert.equal(
    await isolated.locator('#settlements [data-key="catana"]').count(),
    0,
  );
  await isolated.close();
  await writeFile(
    `${out}/validation.json`,
    JSON.stringify(
      {
        renderedSites: all.length,
        originalSites: 23,
        registrySites: approved.length,
        selections,
        research,
        metrics,
        errors,
        assertions: [
          'All 35 physically selected',
          'Registry response controls additions: empty registry renders original 23',
          'No political control, architecture or building count mutations',
          'Research duplicate suppression',
          'Neutral markers remain in political mode',
          'Layer toggle and sidebar camera focus',
        ],
      },
      null,
      2,
    ),
  );
} finally {
  await browser.close();
}
