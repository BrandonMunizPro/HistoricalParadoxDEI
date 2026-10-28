import fs from 'node:fs';
import assert from 'node:assert/strict';
import {PNG} from 'pngjs';
const here=new URL('./',import.meta.url),root=new URL('../repair-20261026/',here);
const read=p=>JSON.parse(fs.readFileSync(p));
const before=read(new URL('before-source.json',here)),final=read(new URL('final2-source.json',here));
const names=fs.readdirSync(new URL('art-before/',root)).filter(n=>n.startsWith('godot-')&&n.endsWith('.json')).sort();
assert.equal(names.length,15);
let html='<!doctype html><meta charset="utf-8"><title>Campaign art direction review</title><style>body{background:#14232a;color:#eee;font:16px system-ui;margin:24px}a{color:#bdf}.pair{display:flex;gap:12px}figure{margin:0;width:50%}img{width:100%}section{margin-bottom:36px}figcaption{padding:8px}nav a{margin-right:18px}</style><h1>Campaign art direction review</h1><p>15 exactly matched camera pairs: Italy, Greece, Egypt/Nile, Anatolia, Alps. Original 1920 x 1080 Godot renders; click for full resolution. Strategic/regional/inspection are capture framing (100%/35%/4% of the profile distance), separate from production presets. Reference images were inspected locally, not imported as project assets.</p><p>Before: '+before.sourceRevision+'<br>After: '+final.sourceRevision+'</p>';
const groups=new Map(),rows=[];
for(const name of names){
 const a=read(new URL('art-before/'+name,root)),b=read(new URL('art-final2/'+name,root));
 assert.equal(a.evidence.sourceRevision,before.sourceRevision);assert.equal(b.evidence.sourceRevision,final.sourceRevision);
 assert.deepEqual(a.camera,b.camera,'Camera mismatch '+name);
 for(const v of [a,b]){
  assert.equal(v.sites,35);assert.equal(v.research,687);assert.equal(v.sceneryReadiness.ready,true);
  assert.equal(v.cameraPath,'capture-profile');assert.ok(v.residentTiles.length<=13);
  assert.ok(v.regionalTerrain.localVegetationCells<=9&&v.regionalTerrain.vegetationTiles<=12);
 }
 assert.equal(b.sceneryReadiness.instances,b.sceneryComposition.plants+b.sceneryComposition.rocks);
 const label=b.view.replace('profile-',''),split=label.lastIndexOf('-'),region=label.slice(0,split),zoom=label.slice(split+1);
 const process=read(new URL('art-final2/process-'+b.view+'.json',root));
 const row={region,zoom,distanceKm:b.camera.distance,beforeFps:1000/a.settledFrameStats.meanMs,afterFps:1000/b.settledFrameStats.meanMs,beforeGpuMs:a.settledGpuStats.meanMs,afterGpuMs:b.settledGpuStats.meanMs,beforeDrawCalls:a.drawCalls,afterDrawCalls:b.drawCalls,tiles:b.residentTiles.length,localCells:b.regionalTerrain.localVegetationCells,coarseCells:b.regionalTerrain.vegetationTiles,composition:b.sceneryComposition,work:b.sceneryWork,loadingMaxMs:b.startupAndStreamingMaxFrameMs,startupMs:b.startupMs,materialBootMs:b.frameStages.bootMs.materials,peakProcessMiB:process.sampledPeakWorkingSetBytes/1048576,videoMemoryMiB:b.renderVideoMemoryBytes/1048576,recordedAtUtc:b.evidence.recordedAtUtc};
 rows.push(row);if(!groups.has(region))groups.set(region,[]);groups.get(region).push({name,row});
}
const order=['strategic','regional','inspection'];
html+='<nav>'+[...groups.keys()].map(k=>'<a href="#'+k+'">'+k+'</a>').join('')+'</nav>';
fs.mkdirSync(new URL('sheets/',here),{recursive:true});
for(const [region,items] of groups){
 items.sort((a,b)=>order.indexOf(a.row.zoom)-order.indexOf(b.row.zoom));
 html+='<h2 id="'+region+'">'+region+'</h2>';
 const sheet=new PNG({width:1920,height:1620});
 for(let index=0;index<items.length;index++){
  const {name,row}=items[index],pngName=name.replace('.json','.png');
  html+='<section><h3>'+row.zoom+' / '+row.distanceKm.toFixed(1)+' km</h3><div class="pair">';
  for(const [column,stage] of ['art-before','art-final2'].entries()){
   const src='../repair-20261026/'+stage+'/'+pngName;
   html+='<figure><a href="'+src+'"><img loading="lazy" src="'+src+'"></a><figcaption>'+['Before','After'][column]+' / '+[row.beforeFps,row.afterFps][column].toFixed(1)+' settled FPS</figcaption></figure>';
   const png=PNG.sync.read(fs.readFileSync(new URL(stage+'/'+pngName,root)));
   assert.equal(png.width,1920);assert.equal(png.height,1080);
   for(let y=0;y<540;y++)for(let x=0;x<960;x++)for(let c=0;c<4;c++){
    const k=((y*2)*1920+x*2)*4+c;
    sheet.data[((index*540+y)*1920+column*960+x)*4+c]=Math.round((png.data[k]+png.data[k+4]+png.data[k+1920*4]+png.data[k+1920*4+4])*.25);
   }
  }
  html+='</div></section>';
 }
 fs.writeFileSync(new URL('sheets/'+region+'.png',here),PNG.sync.write(sheet));
}
html+='<p>Contact sheets use half-size previews, before left / after right, three zoom rows. Full original PNGs are authoritative and unretouched. Counts are instance records; a coarse woodland instance represents a stand, not one measured tree.</p>';
fs.writeFileSync(new URL('comparison.html',here),html);
const range=a=>[Math.min(...a),Math.max(...a)];
const summary={beforeRevision:before.sourceRevision,afterRevision:final.sourceRevision,pairs:rows.length,regions:groups.size,rows,fps:range(rows.map(r=>r.afterFps)),gpuMeanMs:range(rows.map(r=>r.afterGpuMs)),startupMs:range(rows.map(r=>r.startupMs)),loadingFrameMs:range(rows.map(r=>r.loadingMaxMs)),materialBootMs:range(rows.map(r=>r.materialBootMs)),processMiB:range(rows.map(r=>r.peakProcessMiB)),videoMemoryMiB:range(rows.map(r=>r.videoMemoryMiB)),maxChunkMs:Math.max(...rows.map(r=>r.work.maxChunkMs)),maxUploadMs:Math.max(...rows.map(r=>r.work.maxUploadMs))};
fs.writeFileSync(new URL('comparison.json',here),JSON.stringify(summary,null,2));
let md='# Matched art-direction performance\n\nGodot 4.7.2 Forward+, RTX 3060 Laptop GPU, 1920 x 1080. Unchanged driver/shader/native caches. Short desktop samples of at least 180 consecutive settled frames, not a controlled hardware benchmark. No concurrent validation/build ran during the review captures or navigation tour.\n\nSource `'+final.sourceRevision+'`. Full JSON includes timestamps, GPU time, counts, CPU generation/upload work and process memory.\n\n| Region | Zoom / km | Before FPS | After FPS | Before GPU ms | After GPU ms | Before / after draw calls |\n| --- | --- | --- | --- | --- | --- | --- |\n';
for(const r of rows)md+='| '+[r.region,r.zoom+' / '+r.distanceKm.toFixed(1),r.beforeFps.toFixed(1),r.afterFps.toFixed(1),r.beforeGpuMs.toFixed(1),r.afterGpuMs.toFixed(1),r.beforeDrawCalls+' / '+r.afterDrawCalls].join(' | ')+' |\n';
md+='\nSettled FPS '+summary.fps.map(x=>x.toFixed(1)).join('–')+'; mean GPU '+summary.gpuMeanMs.map(x=>x.toFixed(1)).join('–')+' ms. Startup '+summary.startupMs.join('–')+' ms; measured startup/streaming maximum frames '+summary.loadingFrameMs.map(x=>x.toFixed(1)).join('–')+' ms. Material initialization '+summary.materialBootMs.map(x=>x.toFixed(1)).join('–')+' ms remains a synchronous boot cost. Generation chunk maximum '+summary.maxChunkMs.toFixed(1)+' ms, upload chunk maximum '+summary.maxUploadMs.toFixed(1)+' ms.\n\nSampled console-wrapper + direct-child process memory '+summary.processMiB.map(x=>x.toFixed(1)).join('–')+' MiB (250 ms polling); reported renderer video memory '+summary.videoMemoryMiB.map(x=>x.toFixed(1)).join('–')+' MiB. All captures stayed at 13 terrain tiles, at most 12 coarse groups and nine close cells, 1,800 instance records per cell. Coarse stands contain 24 small tree forms and are not botanical density measurements.\n';
fs.writeFileSync(new URL('MEASUREMENTS.md',here),md);
const nav=read(new URL('navigation-final2/navigation.json',here));
assert.equal(nav.evidence.sourceRevision,final.sourceRevision);assert.equal(nav.passed,true);
let extra='\n## Actual production navigation and zoom approach\n\n| Stage | Settled FPS | GPU ms | Max transition frame ms | Complete readiness ms |\n| --- | --- | --- | --- | --- |\n';
for(const s of nav.samples)extra+='| '+[s.view,(1000/s.settled.meanMs).toFixed(1),s.gpu.meanMs.toFixed(1),s.transition.maxFrameMs.toFixed(1),s.transition.elapsedMs].join(' | ')+' |\n';
extra+='\nAll nine stages passed complete readiness, bounded terrain/scenery residency and relative zoom step <=0.08. Production stages use the real resolver; Zagros distances are explicitly diagnostics. River-bank checks and interrupted-generation recovery passed. Final tour maximum transition frame 24.0 ms versus 39.2 ms in the pre-budget review tour. The same review capture suite had generation chunks up to 19.0 ms; final chunks max 6.1 ms. These are separate measured samples, not a controlled statistical benchmark. Complete readiness can take longer because smaller CPU slices span more frames (Greece 7.0 -> 9.0 seconds).\n\n## Remaining regressions and caveats\n\nThe added canopy geometry and shading have real GPU cost. Read the entire paired table: some views improve while others regress. In particular, Greek strategic GPU time rises from about 3.9 ms to the final value listed above. Lower total FPS with similar/lower GPU time also occurs, so frame pacing and laptop hardware variability are not isolated. No generic performance-pass threshold is inferred from these measurements. No cache-cleared startup benchmark was performed; the prior 1.69-second cold hitch is not declared solved.\n';
fs.appendFileSync(new URL('MEASUREMENTS.md',here),extra);
console.log(JSON.stringify({...summary,rows:summary.rows.length}));
