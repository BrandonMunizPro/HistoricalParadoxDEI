import fs from 'node:fs';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {PNG} from 'pngjs';
const root='godot-prototype/evidence/northern-expansion';
fs.mkdirSync(root,{recursive:true});
const read=p=>JSON.parse(fs.readFileSync(p));
const results=[];
for(const region of ['gaul','britannia']){
 const dir=`godot-prototype/data/${region}`,m=read(dir+'/manifest.json'),b=m.bounds,bytes=fs.readFileSync(dir+'/source-metres.bin');
 const h=new Float32Array(bytes.buffer,bytes.byteOffset,bytes.length/4);
 assert.equal(h.length,m.width*m.height);assert(h.every(Number.isFinite));
 // These are lower bounds for sampled upland relief, not exact summit tests.
 const landmarks=region==='gaul'?[['Puy de Sancy',2.81,45.53,.14,1600],['Cevennes',3.74,44.43,.14,1400],['Vosges',7.1,47.9,.14,1200]]:[['Ben Nevis',-5.003,56.797,.14,1000],['Snowdon',-4.077,53.069,.14,900],['Scafell Pike',-3.21,54.454,.14,800],['Cross Fell',-2.487,54.702,.14,750],['Carrauntoohil',-9.742,51.999,.14,850]];
 const peaks=landmarks.map(([name,lon,lat,radius,minimum])=>{
  let maximum=-Infinity;
  for(let y=Math.floor((b.north-lat-radius)*128);y<=Math.ceil((b.north-lat+radius)*128);y++)for(let x=Math.floor((lon-radius-b.west)*128);x<=Math.ceil((lon+radius-b.west)*128);x++)maximum=Math.max(maximum,h[y*m.width+x]);
  assert(maximum>=minimum,`${name} relief missing: ${maximum}`);return {name,maximumMetres:maximum};
 });
 const mask=PNG.sync.read(fs.readFileSync(dir+'/land.png'));
 const land=(lon,lat)=>mask.data[(Math.round((b.north-lat)/(b.north-b.south)*(mask.height-1))*mask.width+Math.round((lon-b.west)/(b.east-b.west)*(mask.width-1)))*4]>127;
 const points=region==='gaul'?[[2.8,45.2],[-3.5,48.2],[1,47.3]]:[[-3.8,52.8],[-4.8,57.2],[-8,53.4],[-1.2,60.2]];
 for(const p of points)assert(land(...p),`${region}: mainland/island missing ${p}`);
 assert(!land(-2,49.9),'English Channel filled with land');
 for(const d of m.details){assert(fs.existsSync('godot-prototype/'+d.mesh));const mesh=fs.readFileSync('godot-prototype/'+d.mesh);assert.equal(mesh.readUInt32LE(0),129*129);}
 results.push({region,peaks,descriptors:m.details.length,sourceEntries:m.sources.length,missingSources:m.sources.filter(s=>s.missing).length,channelOpen:true,sourceSha256:crypto.createHash('sha256').update(bytes).digest('hex')});
}
fs.writeFileSync(root+'/data-validation.json',JSON.stringify({passed:true,regions:results},null,2));
console.log('NORTHERN_DATA_OK',JSON.stringify(results));
