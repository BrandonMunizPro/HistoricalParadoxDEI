// Reproduce the paired evidence table/gallery without altering source or captures.
import fs from 'node:fs';
import assert from 'node:assert/strict';
const root=new URL('../repair-20261026/',import.meta.url);
const read=p=>JSON.parse(fs.readFileSync(p));
const before=read(new URL('before-source.json',import.meta.url));
const after=read(new URL('final-source.json',import.meta.url));
const names=fs.readdirSync(new URL('coast-before/',root)).filter(n=>n.startsWith('godot-')&&n.endsWith('.json'));
assert.equal(names.length,13);
let html='<!doctype html><meta charset="utf-8"><title>Coast polish comparison</title><style>body{background:#151b20;color:#eee;font:16px system-ui;margin:24px}section{margin-bottom:40px}.pair{display:flex;gap:12px}figure{margin:0;width:50%}img{width:100%}figcaption{padding:8px}</style><h1>Coast polish: matched cameras</h1><p>Left: before. Right: after. Click an image for full resolution. Capture profiles are isolated from production navigation.</p>';
const rows=[];
for(const name of names){
 const a=read(new URL('coast-before/'+name,root)),b=read(new URL('coast-final/'+name,root));
 assert.deepEqual(a.camera,b.camera,name+' camera changed');
 assert.equal(a.evidence.sourceRevision,before.sourceRevision);
 assert.equal(b.evidence.sourceRevision,after.sourceRevision);
 assert.equal(b.sites,35);assert.equal(b.sceneryReadiness.ready,true);
 const image=name.replace('.json','.png');
 const fps=x=>(1000/x.meanFrameMs).toFixed(1);
 rows.push({view:a.view,distanceKm:a.camera.distance,beforeFps:+fps(a),afterFps:+fps(b),beforeGpuMs:a.settledGpuStats.meanMs,afterGpuMs:b.settledGpuStats.meanMs,tiles:b.residentTiles.length,startupAndStreamingMaxFrameMs:b.startupAndStreamingMaxFrameMs,recordedAtUtc:b.evidence.recordedAtUtc});
 html+='<section><h2>'+a.view+' · '+a.camera.distance+' km</h2><div class="pair">'+['before','final'].map(stage=>'<figure><a href="../repair-20261026/coast-'+stage+'/'+image+'"><img src="../repair-20261026/coast-'+stage+'/'+image+'"></a><figcaption>'+stage+'</figcaption></figure>').join('')+'</div></section>';
}
fs.writeFileSync(new URL('comparison.html',import.meta.url),html);
fs.writeFileSync(new URL('comparison.json',import.meta.url),JSON.stringify({beforeRevision:before.sourceRevision,afterRevision:after.sourceRevision,rows},null,2));
console.log(JSON.stringify(rows,null,2));
