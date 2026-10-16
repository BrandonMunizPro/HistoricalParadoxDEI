import { chromium } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
import process from 'node:process';
import { cpus } from 'node:os';
import { assertMapSettlementCatalog } from './map-validation-contract.mjs';
const out = process.argv[2] ?? 'docs/living-world/evidence/after';
await mkdir(out, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const report = { views: [], errors: [], assertions: [] };
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  page.on('pageerror', e => report.errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error' && !m.text().includes('favicon'))
    report.errors.push(m.text()); });
  page.on('response', r => { if (r.status() >= 400 && r.url().includes('/data/'))
    report.errors.push(`${r.status()} ${r.url()}`); });
  await page.goto('http://127.0.0.1:4173');
  await page.waitForFunction(() => window.__campaignMap?.ready, null, { timeout: 90000 });
  await assertMapSettlementCatalog(page);
  const baseline = await page.evaluate(() => window.__campaignMap.controlForValidation());
  for (const [name, lon, lat, distance] of [
    ['mediterranean', 19, 37, 6500], ['egypt', 30.5, 28, 1800],
    ['nile-delta', 31, 30.7, 500], ['red-sea', 33.9, 27.7, 500],
    ['armenia', 44.6, 40, 750], ['caspian', 51, 41, 1800],
    ['black-sea', 34, 43, 2100], ['sicily', 14, 37.5, 600],
    ['greece-aegean', 24, 38, 1000], ['cyprus', 33.2, 35, 370],
    ['nile-local', 32.57, 25.74, 9],
  ]) {
    await page.evaluate(([lon, lat, distance]) => window.__campaignMap.focusGeographicForValidation(lon, lat, distance, false), [lon, lat, distance]);
    await page.waitForTimeout(600);
    await page.waitForFunction(expected => window.__campaignMap.tiles.resident.length === expected && window.__campaignMap.tiles.pending.length === 0 && window.__campaignMap.tiles.preparationJobs === 0, distance > 6000 ? 0 : 12, { timeout: 60000 });
    await page.waitForTimeout(1100);
    const state = await page.evaluate(() => ({ camera: window.__campaignMap.cameraForValidation(), tiles: window.__campaignMap.tiles, metrics: window.__campaignMap.metrics }));
    assert.deepEqual(state.tiles.failed, []);
    assert.ok(state.tiles.resident.length <= 12);
    assert.ok(Math.abs(state.camera.target.lon - lon) < 0.001);
    assert.ok(Math.abs(state.camera.target.lat - lat) < 0.001);
    await page.screenshot({ path: `${out}/${name}.png` });
    report.views.push({ name, ...state });
  }
  const search = page.locator('#settlement-search');
  for (const name of ['Syracuse', 'Messana', 'Alexandria', 'Antioch on the Orontes', 'Seleucia Pieria', 'Apamea', 'Tarsus', 'Tingis', 'Paphos', 'Kition', 'Amathus', 'Salamis', 'Olbia']) {
    await search.fill(name);
    assert.ok(await page.locator('#settlement-search-results button').count() > 0, name);
  }
  await search.fill('Syracuse');
  await search.press('Enter');
  await page.waitForTimeout(1600);
  await page.waitForFunction(() => window.__campaignMap.tiles.resident.length === 12 && window.__campaignMap.tiles.pending.length === 0 && window.__campaignMap.tiles.preparationJobs === 0, null, {timeout:60000});
  await page.waitForTimeout(700);
  assert.equal(await page.locator('#place-name').textContent(), 'Syracuse');
  assert.match(await page.locator('#description').textContent(), /not verified/);
  const research = await page.evaluate(() => window.__campaignMap.researchForValidation());
  assert.equal(research.available, 660);
  assert.equal(research.authoritative, false);
  assert.ok(research.visible <= 180);
  assert.deepEqual(await page.evaluate(() => window.__campaignMap.controlForValidation()), baseline);
  await page.screenshot({ path: `${out}/syracuse-research.png` });
  await search.fill('Roma');
  await search.press('Enter');
  await page.waitForTimeout(1600);
  assert.equal(await page.locator('#place-name').textContent(), 'Roma');
  await page.locator('#research-markers').uncheck();
  await page.waitForTimeout(250);
  assert.equal(await page.locator('.research-reference:visible').count(), 0);
  report.research = research;
  report.environment={cpu:cpus()[0]?.model,browser:browser.version(),viewport:'1440x1000',memory:'JavaScript heap only; GPU memory not measured'};
  report.performance=[];
  for(const [name,lon,lat,distance] of [['registry-world',19,37,6500],['registry-greece',24,38,1000]]) {
    await page.evaluate(([lon,lat,distance])=>window.__campaignMap.focusGeographicForValidation(lon,lat,distance,false),[lon,lat,distance]);
    await page.locator('#research-markers').check();
    await page.mouse.move(900,500);
    await page.waitForTimeout(700);
    await page.waitForFunction(expected=>window.__campaignMap.tiles.resident.length===expected&&window.__campaignMap.tiles.pending.length===0&&window.__campaignMap.tiles.preparationJobs===0,distance>6000?0:12,{timeout:60000});
    await page.waitForTimeout(700);
    for(const enabled of [false,true]) {
      await page.locator('#living-world').setChecked(enabled);
      await page.evaluate(()=>{window.__campaignMap.frames.length=0;});
      await page.waitForTimeout(3000);
      const sample=await page.evaluate(()=>{
        const m=window.__campaignMap, frames=[...m.frames].sort((a,b)=>a-b);
        return {metrics:m.metrics,research:m.researchForValidation(),atmosphere:m.livingWorldForValidation(),p95FrameMs:frames[Math.floor(frames.length*.95)],meanFps:1000/(frames.reduce((a,b)=>a+b,0)/frames.length)};
      });
      assert.ok(sample.research.visible<=180);
      assert.equal(sample.atmosphere.enabled,enabled);
      report.performance.push({name,enabled,...sample});
    }
    await page.screenshot({path:`${out}/${name}.png`});
  }
  await page.evaluate(()=>window.__campaignMap.focusGeographicForValidation(12.49,41.89,2,false));
  await page.waitForTimeout(500);
  await page.waitForFunction(()=>window.__campaignMap.tiles.resident.length===12&&window.__campaignMap.tiles.pending.length===0,null,{timeout:60000});
  await page.waitForTimeout(1000);
  const birds=await page.evaluate(()=>window.__campaignMap.livingWorldForValidation());
  assert.equal(birds.birdCount,12);
  await page.screenshot({path:`${out}/local-atmosphere.png`});
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.waitForTimeout(300);
  const stopped=await page.evaluate(()=>window.__campaignMap.livingWorldForValidation());
  await page.waitForTimeout(300);
  const stoppedAgain=await page.evaluate(()=>window.__campaignMap.livingWorldForValidation());
  assert.equal(stopped.birdsVisible,false);
  assert.equal(stopped.cloudShadowStrength,0);
  assert.equal(stopped.time,stoppedAgain.time);
  report.atmosphere={birds,stopped};
  report.assertions.push('35 selectable sites and 23 original control records preserved', 'All 13 priority names searchable', 'Research inspection is explicitly provisional and never changes control', 'Research markers and streaming remain bounded', 'All requested geographic views load without asset failures');
  assert.deepEqual(report.errors, []);
}
finally {
  await writeFile(`${out}/validation.json`, JSON.stringify(report, null, 2) + '\n');
  await browser.close();
}
