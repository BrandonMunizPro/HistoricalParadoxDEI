import fs from 'node:fs';
import assert from 'node:assert/strict';
const root=new URL('../repair-20261026/',import.meta.url);
const read=p=>JSON.parse(fs.readFileSync(p));
const before=read(new URL('before-source.json',import.meta.url)),after=read(new URL('final2-source.json',import.meta.url));
const names=fs.readdirSync(new URL('slice-before/',root)).filter(n=>n.startsWith('godot-')&&n.endsWith('.json'));
assert.equal(names.length,7);
let html='<!doctype html><meta charset="utf-8"><title>Sicily / southern Italy regional slice</title><style>body{background:#142027;color:#eee;font:16px system-ui;margin:24px}section{margin:32px 0}.pair{display:flex;gap:12px}figure{margin:0;width:50%}img{width:100%}figcaption{padding:8px}a{color:#bdf}</style><h1>Sicily and southern Italy: before / final</h1><p>Matched, unedited 1920×1080 Godot screenshots. Click to inspect full resolution. City model and scenery remain interpretive; geographic inputs are preserved.</p>';
const rows=[];
for(const name of names){
 const a=read(new URL('slice-before/'+name,root)),b=read(new URL('slice-final2/'+name,root));
 assert.deepEqual(a.camera,b.camera,name+' camera changed');
 assert.equal(a.evidence.sourceRevision,before.sourceRevision);assert.equal(b.evidence.sourceRevision,after.sourceRevision);
 assert.equal(b.sceneryReadiness.ready,true);assert.equal(b.sites,35);assert.equal(b.residentTiles.length,13);
 rows.push({view:b.view,distanceKm:b.camera.distance,beforeFps:1000/a.settledFrameStats.meanMs,afterFps:1000/b.settledFrameStats.meanMs,beforeGpuMs:a.settledGpuStats.meanMs,afterGpuMs:b.settledGpuStats.meanMs,beforeProps:a.sceneryReadiness.instances,afterProps:b.sceneryReadiness.instances,tiles:b.residentTiles.length,beforeLoadingMaxMs:a.startupAndStreamingMaxFrameMs,afterLoadingMaxMs:b.startupAndStreamingMaxFrameMs,bootStages:b.frameStages.bootMs,materialLoads:b.materialLoads,recordedAtUtc:b.evidence.recordedAtUtc});
 const image=name.replace('.json','.png');
 html+='<section><h2>'+b.view+' · '+b.camera.distance+' km</h2><div class="pair">'+['before','final2'].map(stage=>'<figure><a href="../repair-20261026/slice-'+stage+'/'+image+'"><img loading="lazy" src="../repair-20261026/slice-'+stage+'/'+image+'"></a><figcaption>'+stage+'</figcaption></figure>').join('')+'</div></section>';
}
html+='<h2>Production navigation regression views</h2>';
for(const name of ['greece','anatolia','egypt'])html+='<p>'+name+'</p><a href="../repair-20261026/slice-regression2/godot-production-'+name+'.png"><img style="width:70%" loading="lazy" src="../repair-20261026/slice-regression2/godot-production-'+name+'.png"></a>';
fs.writeFileSync(new URL('comparison.html',import.meta.url),html);
fs.writeFileSync(new URL('comparison.json',import.meta.url),JSON.stringify({beforeRevision:before.sourceRevision,afterRevision:after.sourceRevision,fpsSource:'Consecutive settled frames after scenery completion',rows},null,2));
console.table(rows.map(({view,distanceKm,beforeFps,afterFps,beforeGpuMs,afterGpuMs,tiles})=>({view,distanceKm,beforeFps,afterFps,beforeGpuMs,afterGpuMs,tiles})));
