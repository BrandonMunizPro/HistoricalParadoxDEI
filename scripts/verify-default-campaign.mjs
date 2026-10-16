import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { URL } from 'node:url';
import { PNG } from 'pngjs';
import process from 'node:process';

const url = process.argv[2] ?? 'http://127.0.0.1:4173';
const out = process.argv[3] ?? 'docs/living-world/default-view';
await mkdir(out,{recursive:true});
const browser = await chromium.launch({channel:'chrome',headless:true});
const report = {url, browser:browser.version(), errors:[], assertions:[]};
try {
  const page = await browser.newPage({viewport:{width:1440,height:1000}});
  page.on('pageerror',e=>report.errors.push(e.message));
  page.on('console',m=>{if(m.type()==='error') report.errors.push(m.text());});
  page.on('response',r=>{if(r.status()>=400) report.errors.push(`${r.status()} ${r.url()}`);});
  await page.goto(url);
  await page.waitForFunction(()=>window.__campaignMap?.ready,null,{timeout:90000});
  await page.waitForFunction(()=>{
    const t=window.__campaignMap.tiles;
    return t.resident.length===12&&!t.pending.length&&!t.preparationJobs&&!t.transitions.revealing;
  },null,{timeout:90000});
  await page.waitForTimeout(1000);
  const state = () => page.evaluate(()=>({
    camera:window.__campaignMap.cameraForValidation(),
    preset:window.__campaignMap.viewPreset,
    research:window.__campaignMap.researchForValidation(),
    atmosphere:window.__campaignMap.livingWorldForValidation(),
    sites:window.__campaignMap.settlements,
    control:window.__campaignMap.controlForValidation(),
    scripts:[...document.scripts].map(s=>s.src),
    pathPoints:(document.querySelector('.research-points path').getAttribute('d').match(/M/g)??[]).length,
    buttons:[...document.querySelectorAll('.research-reference:not([hidden])')].map(n=>({count:Number(n.dataset.count),ids:n.dataset.ids})),
    names:document.querySelectorAll('.research-name').length,
    metrics:window.__campaignMap.metrics,
  }));
  const initial=await state();
  report.initial=initial;
  assert.equal(initial.preset,'mediterranean');
  assert.equal(initial.sites.length,35);
  assert.equal(initial.research.enabled,true);
  assert.equal(initial.research.available,660);
  assert.equal(initial.research.instantiated,660);
  assert.ok(initial.research.visiblePoints>=300);
  assert.equal(initial.pathPoints,initial.research.visiblePoints);
  assert.equal(initial.buttons.reduce((n,b)=>n+b.count,0),initial.pathPoints,'Every visible reference is reachable through a map button');
  assert.ok(initial.names>=20);
  assert.ok(initial.buttons.length<=180);
  assert.ok(initial.atmosphere.cloudsVisible>=4);
  assert.ok(initial.atmosphere.birdCount>=4);
  assert.ok(initial.atmosphere.birdSpanPixels<=8);
  assert.equal(await page.locator('#settlement-search').inputValue(),'');
  report.assertions.push('Fresh launch, no navigation or search: hundreds of plotted references, named map groups, clouds and small birds');

  // Prove the preview serves the current build, not a stale compiled entry.
  const bundle=initial.scripts.find(s=>s.includes('/assets/index-'));
  if (bundle) {
    const pathname=new URL(bundle).pathname;
    const local=await readFile(`dist-map${pathname}`);
    const served=await (await page.request.get(bundle)).body();
    const hash=b=>createHash('sha256').update(b).digest('hex');
    assert.equal(hash(served),hash(local));
    report.loadedBundle={path:pathname,sha256:hash(served),matchesLocalBuild:true};
  }
  await page.screenshot({path:`${out}/default-after.png`});
  await page.waitForTimeout(5000);
  await page.screenshot({path:`${out}/default-motion.png`});
  assert.ok((await state()).atmosphere.time>initial.atmosphere.time+3);
  report.performance=[];
  for(const enabled of [true,false]) {
    await page.locator('#living-world').setChecked(enabled);
    await page.evaluate(()=>{window.__campaignMap.frames.length=0;});
    await page.waitForTimeout(4000);
    report.performance.push(await page.evaluate(()=>{
      const m=window.__campaignMap,f=[...m.frames].sort((a,b)=>a-b);
      return {atmosphere:m.livingWorldForValidation(),meanFps:1000/(f.reduce((a,b)=>a+b,0)/f.length),p95FrameMs:f[Math.floor(f.length*.95)],metrics:m.metrics};
    }));
  }
  await page.screenshot({path:`${out}/default-atmosphere-off.png`});
  assert.equal((await state()).atmosphere.birdCount,0);
  assert.equal((await state()).atmosphere.cloudsVisible,0);
  const on=PNG.sync.read(await readFile(`${out}/default-after.png`));
  const off=PNG.sync.read(await readFile(`${out}/default-atmosphere-off.png`));
  let changed=0,pixels=0;
  for(let y=150;y<910;y++) for(let x=330;x<1400;x++) {
    const i=(y*on.width+x)*4;
    if(Math.max(...[0,1,2].map(c=>Math.abs(on.data[i+c]-off.data[i+c])))>=12) changed++;
    pixels++;
  }
  report.atmospherePixelDifference={region:'unobstructed map, x330..1400 y150..910',threshold:12,changed,pixels,fraction:changed/pixels};
  assert.ok(changed/pixels>0.005,'Atmosphere must change visible map pixels, not just a diagnostic flag');
  await page.locator('#living-world').check();

  // Select through the map without ever entering a search query.
  await page.locator('.research-reference.cluster:visible').first().click();
  assert.ok(await page.locator('.research-cluster-list button').count()>2);
  await page.screenshot({path:`${out}/default-map-location-list.png`});
  const chosen=await page.locator('.research-cluster-list button').nth(1).textContent();
  await page.locator('.research-cluster-list button').nth(1).click();
  assert.match(await page.locator('#description').textContent(),/not verified/);
  assert.ok(chosen.startsWith(await page.locator('#place-name').textContent()));
  assert.deepEqual((await state()).control,initial.control);
  assert.deepEqual((await state()).sites,initial.sites);
  report.assertions.push('Map group opens a list; choosing a reference inspects it without search or simulation mutation');
  await page.locator('#research-markers').uncheck();
  await page.waitForTimeout(250);
  assert.equal(await page.locator('.research-reference:visible').count(),0);
  await page.locator('#research-markers').check();
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.waitForTimeout(300);
  const stopped=(await state()).atmosphere;
  await page.waitForTimeout(300);
  assert.equal((await state()).atmosphere.time,stopped.time);
  assert.equal(stopped.cloudsVisible,0);
  assert.equal(stopped.birdCount,0);
  report.assertions.push('Both layers toggle; reduced motion stops the shared clock and atmospheric effects');
  assert.deepEqual(report.errors,[]);
} finally {
  await writeFile(`${out}/validation.json`,JSON.stringify(report,null,2)+'\n');
  await browser.close();
}
