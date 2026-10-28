import fs from 'node:fs';
import assert from 'node:assert/strict';
const root=new URL('../repair-20261026/',import.meta.url);
const read=p=>JSON.parse(fs.readFileSync(p));
const before=read(new URL('before-source.json',import.meta.url));
const after=read(new URL('final-source.json',import.meta.url));
const names=fs.readdirSync(new URL('coast-v2-before/',root)).filter(n=>n.startsWith('godot-')&&n.endsWith('.json'));
assert.equal(names.length,13);
const rows=[];
let html='<!doctype html><meta charset="utf-8"><title>Mediterranean coast and sea review</title><style>body{background:#15212a;color:#eee;font:16px system-ui;margin:24px}.pair{display:flex;gap:12px}figure{margin:0;width:50%}img{width:100%}section{margin:32px 0}figcaption{padding:8px}a{color:#bdf}</style><h1>Mediterranean coast and sea: before / final</h1><p>Matched 1920×1080 Godot renders. Click for full resolution. Capture profiles are isolated from production navigation. The first pair is an actual production preset.</p>';
for(const name of names){
 const a=read(new URL('coast-v2-before/'+name,root)),b=read(new URL('coast-v2-final/'+name,root));
 assert.deepEqual(a.camera,b.camera,name+' camera changed');
 assert.equal(a.evidence.sourceRevision,before.sourceRevision);
 assert.equal(b.evidence.sourceRevision,after.sourceRevision);
 assert.equal(b.sites,35);assert.equal(b.sceneryReadiness.ready,true);
 assert.equal(b.residentTiles.length,13);
 assert.equal(a.cameraPath,b.cameraPath);
 const image=name.replace('.json','.png');
 const fps=x=>+(1000/x.settledFrameStats.meanMs).toFixed(1);
 rows.push({view:a.view,distanceKm:a.camera.distance,beforeFps:fps(a),afterFps:fps(b),beforeGpuMs:a.settledGpuStats.meanMs,afterGpuMs:b.settledGpuStats.meanMs,tiles:b.residentTiles.length,beforeLoadingMaxMs:a.startupAndStreamingMaxFrameMs,afterLoadingMaxMs:b.startupAndStreamingMaxFrameMs,recordedAtUtc:b.evidence.recordedAtUtc});
 html+='<section><h2>'+a.view+' · '+a.camera.distance+' km</h2><div class="pair">'+['before','final'].map(stage=>'<figure><a href="../repair-20261026/coast-v2-'+stage+'/'+image+'"><img loading="lazy" src="../repair-20261026/coast-v2-'+stage+'/'+image+'"></a><figcaption>'+stage+'</figcaption></figure>').join('')+'</div></section>';
}
fs.writeFileSync(new URL('comparison.html',import.meta.url),html);
fs.writeFileSync(new URL('comparison.json',import.meta.url),JSON.stringify({beforeRevision:before.sourceRevision,afterRevision:after.sourceRevision,fpsSource:'Consecutive settled frame sample (settledFrameStats.meanMs), after scenery completion',rows},null,2));
console.table(rows);
