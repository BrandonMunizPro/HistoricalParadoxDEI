// Unedited original renders remain authoritative; sheets are labelled half-size previews.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {PNG} from 'pngjs';
const root=new URL('../repair-20261026/',import.meta.url),read=p=>JSON.parse(fs.readFileSync(p));
const baseline=read(new URL('before-source.json',import.meta.url)),final=read(new URL('tour-source.json',import.meta.url));
const names=fs.readdirSync(new URL('environment-before/',root)).filter(n=>n.startsWith('godot-')&&n.endsWith('.json')).sort();
assert.equal(names.length,48);
const rows=[],groups=new Map();
let html='<!doctype html><meta charset="utf-8"><title>Global environmental expansion review</title><style>body{background:#13212a;color:#eee;font:16px system-ui;margin:24px}a{color:#bdf}.pair{display:flex;gap:12px}figure{margin:0;width:50%}img{width:100%}section{margin-bottom:38px}figcaption{padding:8px}nav a{margin-right:12px}details{margin:24px 0}</style><h1>Global environmental expansion</h1><p>48 matched before/final pairs across 16 regions, plus three supplementary Nile-centred views. Original 1920×1080 engine renders; click any image for full resolution. Strategic uses the documented regional framing; regional and inspection use 35% and 4% of that distance. These capture profiles do not override production navigation.</p><nav>';
function assertFinal(b){
 assert.equal(b.evidence.sourceRevision,final.sourceRevision);
 assert.equal(b.sceneryReadiness.ready,true);assert.equal(b.sites,35);assert.equal(b.research,687);
 assert.ok(b.residentTiles.length<=13);
 assert.ok(b.regionalTerrain.localVegetationCells<=9 && b.regionalTerrain.vegetationTiles<=12);
 const cells=b.regionalTerrain.localVegetationCells+b.regionalTerrain.vegetationTiles;
 assert.ok(b.sceneryReadiness.instances<=cells*1800);
 assert.equal(b.sceneryComposition.plants+b.sceneryComposition.rocks,b.sceneryReadiness.instances);
}
for(const name of names){
 const a=read(new URL('environment-before/'+name,root)),b=read(new URL('environment-final3/'+name,root));
 assert.equal(a.evidence.sourceRevision,baseline.sourceRevision);assertFinal(b);
 assert.deepEqual(a.camera,b.camera,name+' camera changed');
 const label=b.view.replace('profile-',''),split=label.lastIndexOf('-'),region=label.slice(0,split),zoom=label.slice(split+1);
 const process=read(new URL('environment-final3/process-'+b.view+'.json',root));
 const row={region,zoom,distanceKm:b.camera.distance,beforeFps:1000/a.settledFrameStats.meanMs,afterFps:1000/b.settledFrameStats.meanMs,beforeGpuMs:a.settledGpuStats.meanMs,afterGpuMs:b.settledGpuStats.meanMs,tiles:b.residentTiles.length,plants:b.sceneryComposition.plants,rocks:b.sceneryComposition.rocks,sceneryWork:b.sceneryWork,loadingMaxMs:b.startupAndStreamingMaxFrameMs,startupMs:b.startupMs,peakProcessMiB:process.sampledPeakWorkingSetBytes/1048576,videoMemoryMiB:b.renderVideoMemoryBytes/1048576,environment:b.environmentAtFocus,recordedAtUtc:b.evidence.recordedAtUtc};
 rows.push(row);if(!groups.has(region))groups.set(region,[]);groups.get(region).push({name,row});
}
for(const region of groups.keys())html+='<a href="#'+region+'">'+region+'</a>';
html+='</nav>';
const order=['strategic','regional','inspection'];
const sheets=new URL('sheets/',import.meta.url);fs.mkdirSync(sheets,{recursive:true});
for(const [region,items] of groups){
 items.sort((a,b)=>order.indexOf(a.row.zoom)-order.indexOf(b.row.zoom));
 const sheet=new PNG({width:1920,height:1620});
 html+='<details open id="'+region+'"><summary><b>'+region+'</b></summary>';
 for(let index=0;index<items.length;index++){
  const {name,row}=items[index],image=name.replace('.json','.png');
  html+='<section><h3>'+row.zoom+' · '+row.distanceKm.toFixed(1)+' km</h3><div class="pair">';
  for(const [column,stage] of ['before','final3'].entries()){
   const src='../repair-20261026/environment-'+stage+'/'+image;
   html+='<figure><a href="'+src+'"><img loading="lazy" src="'+src+'"></a><figcaption>'+stage+'</figcaption></figure>';
   const png=PNG.sync.read(fs.readFileSync(new URL('environment-'+stage+'/'+image,root)));
   assert.equal(png.width,1920);assert.equal(png.height,1080);
   for(let y=0;y<540;y++)for(let x=0;x<960;x++)for(let c=0;c<4;c++){
    const a=((y*2)*1920+x*2)*4+c;
    sheet.data[((index*540+y)*1920+column*960+x)*4+c]=Math.round((png.data[a]+png.data[a+4]+png.data[a+1920*4]+png.data[a+1920*4+4])*.25);
   }
  }
  html+='</div></section>';
 }
 fs.writeFileSync(new URL(region+'.png',sheets),PNG.sync.write(sheet));
 html+='</details>';
}
html+='<h2>Nile supplement — source-river-centred, no matching old close baseline</h2>';
for(const zoom of order){
 const name='godot-profile-nile-'+zoom;
 const b=read(new URL('environment-final3/'+name+'.json',root));assertFinal(b);
 html+='<h3>'+zoom+' · '+b.camera.distance.toFixed(1)+' km</h3><a href="../repair-20261026/environment-final3/'+name+'.png"><img style="width:75%" loading="lazy" src="../repair-20261026/environment-final3/'+name+'.png"></a>';
}
fs.writeFileSync(new URL('comparison.html',import.meta.url),html);
fs.writeFileSync(new URL('comparison.json',import.meta.url),JSON.stringify({beforeRevision:baseline.sourceRevision,afterRevision:final.sourceRevision,method:'Consecutive settled-frame samples. Short desktop runs, not a statistical throughput benchmark.',rows},null,2));
console.log(JSON.stringify({pairs:rows.length,regions:groups.size,nileSupplement:3,fpsRange:[Math.min(...rows.map(r=>r.afterFps)),Math.max(...rows.map(r=>r.afterFps))]}));
