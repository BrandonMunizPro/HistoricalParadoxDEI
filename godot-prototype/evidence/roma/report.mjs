import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
const project=path.resolve('godot-prototype'),folder=path.join(project,'evidence/roma');
const read=p=>JSON.parse(fs.readFileSync(p));
const source=read(path.join(folder,'final3-source.json'));
const baseline=read(path.join(folder,'before-source.json'));
const base=path.join(project,'evidence/repair-20261026');
const cases=[
 ['Strategic — 45 km','roma','strategic','roma-baseline-serial','roma-final3'],
 ['Intermediate — 7.2 km','roma','close','roma-baseline-serial','roma-final3'],
 ['Close east — 1.2 km','roma-east','strategic','roma-baseline-detail-serial','roma-final3-detail'],
 ['Close west — 1.2 km','roma-west','strategic','roma-baseline-detail-serial','roma-final3-detail'],
 ['Layout overview — 1.8 km','roma-layout','strategic','roma-baseline-detail-serial','roma-final3-detail']
];
const relative=p=>path.relative(folder,p).replaceAll('\\','/');
const hash=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const metrics=[];
const png=(dir,name)=>path.join(base,dir,`godot-profile-${name}.png`);
const pairHtml=cases.map(([title,region,scale,before,after])=>{
 const name=`${region}-${scale}`,a=read(path.join(base,before,`godot-profile-${name}.json`)),b=read(path.join(base,after,`godot-profile-${name}.json`));
 assert.deepEqual(a.camera,b.camera,'Camera mismatch '+name);
 assert.equal(a.evidence.sourceRevision,baseline.sourceRevision);assert.equal(b.evidence.sourceRevision,source.sourceRevision);
 assert.equal(b.sites,35);assert.equal(b.research,687);assert.equal(b.sceneryReadiness.ready,true);
 assert.ok(b.residentTiles.length<=13);assert.ok(b.settlementPresentation.romaPrototypeEnabled);
 for(const dir of [before,after])assert.equal(fs.statSync(path.join(base,dir,`profile-${name}-errors.log`)).size,0);
 const files=[png(before,name),png(after,name)];
 const memory=[before,after].map(dir=>read(path.join(base,dir,`process-profile-${name}.json`)).sampledPeakWorkingSetBytes);
 metrics.push({title,camera:b.camera,before:a,after:b,sampledWorkingSetBytes:memory,screenshots:files.map(p=>({file:relative(p),sha256:hash(p)}))});
 return `<section><h2>${title}</h2><p>Yaw ${b.camera.yaw}°, pitch ${b.camera.pitch}°. Left: baseline ${a.evidence.recordedAtUtc}. Right: final ${b.evidence.recordedAtUtc}. Click an original for full resolution.</p><div class="pair">${files.map((p,i)=>`<figure><figcaption>${i?'AFTER':'BEFORE'}</figcaption><a href="${relative(p)}"><img loading="lazy" src="${relative(p)}"></a></figure>`).join('')}</div></section>`;
}).join('');
const extraHtml=['roma-east','roma-west'].map(region=>{
 const name=`${region}-regional`,p=png('roma-final3-architecture',name);
 const data=read(path.join(base,'roma-final3-architecture',`godot-profile-${name}.json`));assert.equal(data.evidence.sourceRevision,source.sourceRevision);
 assert.equal(fs.statSync(path.join(base,'roma-final3-architecture',`profile-${name}-errors.log`)).size,0);
 return `<h2>Additional architecture view: ${region}, 0.42 km</h2><p>After-only detail inspection; not a matched comparison.</p><a href="${relative(p)}"><img src="${relative(p)}"></a>`;
}).join('');
const nav=['neutral','prototype'].map(mode=>{
 const p=path.join(folder,`navigation3-${mode}`),data=read(path.join(p,'navigation.json'));
 assert.equal(data.evidence.sourceRevision,source.sourceRevision);assert.equal(data.passed,true);
 assert.equal(fs.statSync(path.join(p,'errors.log')).size,0);
 const frames=data.stages.flatMap(s=>s.frames).sort((a,b)=>a-b);
 data.warmStatistics.maxMs=Math.max(...frames);
 data.firstReadiness.statistics.maxMs=Math.max(...data.firstReadiness.frames);
 const percentile=q=>frames[Math.min(frames.length-1,Math.floor(frames.length*q))];
 return {mode,...data,p50Ms:percentile(.5),p95Ms:percentile(.95),p99Ms:percentile(.99),memory:read(path.join(p,'process.json'))};
});
assert.equal(nav[0].romaPrototypeEnabled,false);assert.equal(nav[1].romaPrototypeEnabled,true);
for(let i=0;i<nav[0].stages.length;i++)assert.ok(Math.abs(nav[0].stages[i].distance-nav[1].stages[i].distance)<.00011,'Navigation target differs');
const checks=read(path.join(folder,'checks3.json'));assert.ok(checks.every(c=>c.passed));assert.equal(checks.length,12);
const changed=source.files.filter(f=>baseline.files.find(x=>x.path===f.path)?.sha256!==f.sha256);
const rows=metrics.map(m=>`| ${m.title} | ${(1000/m.before.settledFrameStats.meanMs).toFixed(1)} | ${(1000/m.after.settledFrameStats.meanMs).toFixed(1)} | ${m.before.settledFrameStats.p95Ms.toFixed(2)} / ${m.after.settledFrameStats.p95Ms.toFixed(2)} | ${m.before.drawCalls} / ${m.after.drawCalls} | ${(m.before.renderVideoMemoryBytes/1048576).toFixed(0)} / ${(m.after.renderVideoMemoryBytes/1048576).toFixed(0)} | ${(m.sampledWorkingSetBytes[0]/1048576).toFixed(0)} / ${(m.sampledWorkingSetBytes[1]/1048576).toFixed(0)} |`).join('\n');
const navRows=nav.map(n=>`| ${n.mode} | ${(1000/n.warmStatistics.meanMs).toFixed(1)} | ${n.p95Ms.toFixed(2)} | ${n.p99Ms.toFixed(2)} | ${n.onePercentLowFps.toFixed(1)} | ${n.warmStatistics.maxMs.toFixed(2)} | ${n.initializationMs.toFixed(0)} | ${n.firstReadiness.statistics.maxMs.toFixed(2)} | ${(n.memory.sampledPeakWorkingSetBytes/1048576).toFixed(0)} |`).join('\n');
fs.writeFileSync(path.join(folder,'comparison.json'),JSON.stringify({sourceRevision:source.sourceRevision,baselineRevision:baseline.sourceRevision,matchedPairs:metrics,nav,checks,sourceChanges:changed},null,2)+'\n');
fs.writeFileSync(path.join(folder,'comparison.html'),`<!doctype html><meta charset="utf-8"><title>Roma visual prototype — independent review</title><style>body{font:16px system-ui;background:#151b1a;color:#eee;margin:2vw;max-width:2400px}h1,h2{color:#dec295}p{max-width:1100px;line-height:1.5}a{color:#bcd5de}img{width:100%;height:auto}.pair{display:grid;grid-template-columns:1fr 1fr;gap:12px}figure{margin:0}figcaption{padding:8px}section{margin:40px 0}code{overflow-wrap:anywhere}@media(max-width:800px){.pair{grid-template-columns:1fr}}</style><h1>Roma — original Republican architecture prototype</h1><p>Independent review candidate; artistic approval is pending. Seven original archetypes, 121 illustrative structures, connected streets, public space and restrained temple/defence references. This is not a surveyed reconstruction or a claim of Rome II quality. Existing low-detail terrain, stylized vegetation, visible repetition, broad dirt edges and campaign-scale strategic representation remain weaknesses.</p><p>Final source <code>${source.sourceRevision}</code>. Baseline <code>${baseline.sourceRevision}</code>. All images are unretouched captures from actual running Godot at 1920×1080. Weather/water animation phase is not locked. <a href="MEASUREMENTS.md">Measurements and caveats</a> · <a href="../../ROMA-VISUAL.md">Implementation and historical limitations</a></p>${pairHtml}${extraHtml}`);
fs.writeFileSync(path.join(folder,'MEASUREMENTS.md'),`# Roma measured evidence\n\nFinal source: ${source.sourceRevision}. Baseline source: ${baseline.sourceRevision}. HEAD ${source.baseCommit}. RTX 3060 Laptop, Godot 4.7.2 Forward+, 1920×1080, 120 FPS cap / mailbox policy unchanged.\n\n## Matched images\n\nFPS is the reciprocal of mean frame duration, from the final 180 settled frames. Before and after production render settings are unchanged except the documented local Roma art/lighting treatment. Geometry, camera settings and art naturally differ. CPU scheduling, driver, thermals and caches are not controlled; do not attribute baseline strategic FPS differences solely to the new architecture.\n\n| View | Before FPS | After FPS | p95 ms before / after | Draw calls before / after | Godot video MiB before / after | Sampled RAM MiB before / after |\n|---|---:|---:|---:|---:|---:|---:|\n${rows}\n\n## Same-source repeatable navigation control\n\nBoth runs use the final source. Neutral control uses --roma-neutral-baseline to restore Roma's old neutral cluster and original local lighting. All other world presentation is unchanged. Warm-up: 45→7.2→1.2→45 km. Measured: 45→7.2→1.2→7.2→45 km, then the same small pan/orbit. 1% low = reciprocal of the mean slowest 1% of measured process-frame intervals. Frame percentiles include motion, LOD updates and readiness waits, not just settled images.\n\n| Mode | Navigation mean FPS | p95 ms | p99 ms | 1% low FPS | Warm maximum ms | Synchronous startup ms | First readiness maximum frame ms | Sampled peak RAM MiB |\n|---|---:|---:|---:|---:|---:|---:|---:|---:|\n${navRows}\n\nFull raw frame lists, stage readiness, first readiness and video-memory totals are in navigation3-*/navigation.json. Process memory is a sampled working set (wrapper and direct child), a lower bound on true peak. RenderingServer video memory counts allocations and is not a complete board-wide VRAM measurement. Endpoint nvidia-smi telemetry does not rule out mid-run thermal changes. Startup is measured separately; these are warm-cache launches, not a cache-cleared cold-start benchmark. The older 4.10-second cold-start issue is not certified fixed.\n\n## Validation\n\nTwelve Godot checks passed, including Roma, all accepted settlement anchors, actual production global/regional navigation and expected failure of the timeout-negative case. npm run validate log records lint, typecheck, 475 tests and build/smoke. Protected data integrity is separately recorded in integrity.json. No asset rollout outside Roma and no commits/pushes.\n\n## Evidence exclusions\n\nEarly roma-before / roma-before-detail launches overlapped and are not the primary benchmark. The serial baseline directories are primary. roma-preview* / roma-review / roma-light-review* / roma-shadow-review and the first roma-final* are diagnostic/superseded. The first navigation-neutral run failed because the new benchmark harness assigned integers to float camera goals; the harness was corrected, a new source snapshot taken and all primary final images recaptured. This was a harness failure, not a production navigation defect.\n`);
console.log(JSON.stringify({matchedPairs:metrics.length,additionalCloseViews:2,checks:checks.length,sourceRevision:source.sourceRevision,changedInputs:changed.length,nav:nav.map(n=>({mode:n.mode,fps:1000/n.warmStatistics.meanMs,onePercentLow:n.onePercentLowFps,max:n.warmStatistics.maxMs}))}));

