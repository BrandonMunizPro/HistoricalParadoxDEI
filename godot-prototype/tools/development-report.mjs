import fs from 'node:fs';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
const root='godot-prototype/evidence/settlement-development-20261028';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8').replace(/^\uFEFF/,''));
const write=(p,v)=>fs.writeFileSync(root+'/'+p,JSON.stringify(v,null,2)+'\n');
const sha=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const finalStage='after-final';
const before=read(root+'/before/performance.json'),after=read(root+'/'+finalStage+'/performance.json');
const catalog=read('godot-prototype/data/settlement-development-catalog.json');
const starts=read('godot-prototype/data/settlement-development-starts.json');
const runtime=read(root+'/'+finalStage+'/runtime-validation.json');assert.equal(runtime.passed,true);
const pairs=[['city','city'],['strategic','strategic-3']].map(([b,a])=>{
 const previous=before.views.find(v=>v.view.name===b),current=after.views.find(v=>v.view.name===a);
 assert.deepEqual(previous.camera,current.camera);
 return {before:b,after:a,exactCameraMatch:true,camera:current.camera,beforePerformance:previous.steady,afterPerformance:current.steady};
});
for(const chain of ['civic','grain']){
 const views=after.views.filter(v=>v.view.name.startsWith(chain+'-'));assert.equal(views.length,3);
 for(const v of views)assert.deepEqual(v.camera,views[0].camera);
}
for(const v of after.views){assert.equal(v.steady.samples,600);assert.equal(Object.keys(v.renderedSlots).length,2);for(const slot of Object.values(v.renderedSlots))assert.equal(slot.missing,false);}
const sources=['src/presentation/settlement-development-system.ts','tests/settlement-development-system.test.ts',
 ...['settlement_development.gd','settlement_development_kit.gd','settlement_development_view.gd','settlement_development_ui.gd','roma_showcase.gd','roma_settlement.gd'].map(x=>'godot-prototype/'+x),
 ...['settlement-development-catalog.json','settlement-development-starts.json','settlement-development.schema.json','roma-development-composition.json'].map(x=>'godot-prototype/data/'+x),
 ...['development-bake.gd','development-validate.gd','development-profile.gd','development-capture.ps1','development-layout-check.mjs','development-report.mjs'].map(x=>'godot-prototype/tools/'+x)];
const inherited=read('godot-prototype/evidence/roma-showcase-20261028/asset-manifest.json');
for(const asset of inherited)assert.equal(sha('godot-prototype/assets/roma-showcase/'+asset.file),asset.sha256);
const assets=catalog.visuals.flatMap(v=>[v.near,v.far]).map(resource=>({resource,sha256:sha(resource.replace('res://','godot-prototype/')),license:'Original project geometry; referenced maps retain their source licenses',source:'settlement_development_kit.gd'}));
write('asset-license-manifest.json',{newDownloads:0,originalMeshes:assets,inheritedTextureSources:inherited,provenance:'../../assets/settlement-development/PROVENANCE.md',gaps:catalog.cultures.filter(c=>!catalog.visuals.some(v=>v.culture===c.id)).map(c=>({culture:c.id,status:'Design specification only; finished meshes unavailable. No cross-culture substitutions.'}))});
const images=[...before.views.map(v=>'before/'+v.view.name+'.png'),...after.views.map(v=>finalStage+'/'+v.view.name+'.png')];
for(const image of images)assert.ok(fs.existsSync(root+'/'+image));
write('source-manifest.json',{files:sources.map(p=>({path:p,sha256:sha(p)})),screenshots:images.map(p=>({path:p,sha256:sha(root+'/'+p)})),initialConfiguration:starts,protectedSnapshotSha256:sha('godot-prototype/evidence/protected-before.json')});
write('integrity.json',read('godot-prototype/evidence/final-integrity.json'));
const processes={before:read(root+'/before/process.json'),after:read(root+'/'+finalStage+'/process.json')};
const summary={method:after.method,hardware:after.adapter,sceneInstantiationMs:{before:before.sceneInstantiationMs,after:after.sceneInstantiationMs},pairs,views:after.views.map(v=>({name:v.view.name,...v.steady,readinessMs:v.readyMs,firstFrameWorstMs:v.firstFrames.maxMs,gpuMeanMs:v.gpu.meanMs,videoMemoryBytes:v.videoMemoryBytes,drawCalls:v.drawCalls})),peakWorkingSetBytes:{before:processes.before.peakWorkingSetBytes,after:processes.after.peakWorkingSetBytes},allAverage60:after.views.every(v=>v.steady.averageFps>=60),allOnePercentLow60:after.views.every(v=>v.steady.onePercentLowFps>=60),runtimeValidation:runtime};
write('performance-summary.json',summary);
const f=n=>n.toFixed(1),rows=summary.views.map(v=>`| ${v.name} | ${f(v.averageFps)} | ${f(v.onePercentLowFps)} | ${f(v.maxMs)} | ${f(v.firstFrameWorstMs)} |`).join('\n');
fs.writeFileSync(root+'/performance-table.md','| View | Avg FPS | 1% low FPS | Worst settled ms | Worst readiness ms |\n|---|---:|---:|---:|---:|\n'+rows+'\n');
const figure=(file,title)=>`<figure><a href="${file}"><img loading="lazy" src="${file}" alt="${title}"></a><figcaption>${title}</figcaption></figure>`;
const gallery=(names)=>names.map(name=>figure(finalStage+'/'+name+'.png',name)).join('');
const html=`<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Roma settlement development — actual Godot evidence</title><style>body{margin:0;background:#111a1d;color:#e6e3d9;font:16px/1.5 system-ui}main{max-width:1500px;margin:auto;padding:32px}h1,h2{color:#e7c994}a{color:#b6dadd}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(380px,1fr));gap:16px}figure{margin:0;background:#1c282d;padding:8px}img{display:block;width:100%}figcaption{padding:8px}table{border-collapse:collapse;width:100%}td,th{padding:8px;border-bottom:1px solid #465456;text-align:left}.notice{border-left:3px solid #c5a969;padding:15px;background:#202c2d}code{color:#e7c994}</style><main><h1>Roma / 278 BCE — settlement development</h1><p class="notice">Working Roma-only vertical slice. Starts: Forum III, grain storage II, four empty slots. Original geometry, inherited CC0 materials. All images below are real Godot renders. Artistic parity with a modern commercial game is not claimed.</p><p><a href="REVIEW.md">Implementation, audit, historical qualifications and limitations</a> · <a href="performance-summary.json">Measured performance</a> · <a href="asset-license-manifest.json">Licenses</a> · <a href="after-final/runtime-validation.json">Real UI/renderer checks</a></p><h2>Matched city view: prior Roma / starting configuration</h2><div class="grid">${figure('before/city.png','Before — existing Roma showcase')}${figure('after-final/city.png','After — data-defined Forum III and grain II')}</div><h2>Civic chain — three levels, identical camera</h2><p>Only III is Roma’s starting classification. I/II are transient development previews, not literal historical construction phases.</p><div class="grid">${gallery(['civic-1','civic-2','civic-3'])}</div><h2>Grain storage — three levels, identical camera</h2><p>Starting level II is interpretive provisioning. Expanded footprints include storage, ventilation, loading ramps, threshing floors and working yards.</p><div class="grid">${gallery(['grain-1','grain-2','grain-3'])}</div><h2>Strategic map — both chains at I / II / III</h2><p>These are level comparisons, not starting configurations. Strategic map-symbol scale is exaggerated; close views retain metre scale. Background geography remains the previous prototype.</p><div class="grid">${gallery(['strategic-1','strategic-2','strategic-3'])}</div><details><summary>Prior Roma at the matched strategic camera</summary>${figure('before/strategic.png','Before — strategic')}</details><h2>RTX 3060 Laptop measurements</h2><p>${after.method} All runs use 1920×1080. First-readiness intervals are reported separately; no clean-cache benchmark was performed.</p><table><tr><th>View</th><th>Avg FPS</th><th>1% low</th><th>Worst settled ms</th><th>Worst readiness ms</th></tr>${summary.views.map(v=>`<tr><td>${v.name}</td><td>${f(v.averageFps)}</td><td>${f(v.onePercentLowFps)}</td><td>${f(v.maxMs)}</td><td>${f(v.firstFrameWorstMs)}</td></tr>`).join('')}</table><p class="notice">Averages and low-frame tails are separate: ${summary.allAverage60?'all settled averages exceed 60 FPS':'some averages miss 60 FPS'}; ${summary.allOnePercentLow60?'all recorded 1% lows exceed 60':'some recorded 1% lows remain below 60'}. Tests establish behavior and integrity, not artistic success.</p><p>Launch: <code>.\\godot-prototype\\settlement-development.ps1</code>. Add <code>-Baseline</code> for the previous showcase. No campaign state is persisted.</p></main></html>`;
fs.writeFileSync(root+'/index.html',html);
console.log({cameraPairs:pairs.length,levelCamerasMatched:true,images:images.length,nativeAssets:assets.length,allAverage60:summary.allAverage60,allOnePercentLow60:summary.allOnePercentLow60});

