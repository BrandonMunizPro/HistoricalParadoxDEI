import fs from 'node:fs';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
const root='godot-prototype/data/',out=root+'world-coast-baseline/',read=p=>JSON.parse(fs.readFileSync(root+p));
const catalog=read('world-coasts/manifest.json'),manifest=read('world-coast-baseline/manifest.json');
assert.equal(manifest.sourceSha256,catalog.segmentsSha256);
const hash=crypto.createHash('sha256'),source=new Float32Array(catalog.segments*12);
for(const c of catalog.chunks){const b=fs.readFileSync(root+'world-coasts/'+c.file);hash.update(b);source.set(new Float32Array(b.buffer,b.byteOffset,b.length/4),c.start*12);}
assert.equal(hash.digest('hex'),manifest.sourceSha256);
const textures={};for(const [key,spec] of Object.entries(manifest.textures)){const b=spec.parts?Buffer.concat(spec.parts.map(part=>{const data=fs.readFileSync(out+part.file);assert.equal(data.length,part.bytes);assert.equal(crypto.createHash('sha256').update(data).digest('hex'),part.sha256);return data;})):fs.readFileSync(out+key+'.bin');assert.equal(b.length,spec.bytes);textures[key]=new Float32Array(b.buffer,b.byteOffset,b.length/4);}
const tiles=new Map();
for(let id=0;id<catalog.segments;id++){
 const i=id*12;for(let j=0;j<10;j++)assert.equal(textures.segments[i+j],source[i+j]);
 for(let j=10;j<12;j++)assert(Number.isFinite(textures.segments[i+j])&&textures.segments[i+j]>=0);
 const key=Math.floor((source[i]+source[i+2])*.5/64)+','+Math.floor((source[i+1]+source[i+3])*.5/64);
 if(!tiles.has(key))tiles.set(key,[]);tiles.get(key).push(id);
}
let instances=0;
for(const c of manifest.chunks){
 const match=/instances-(-?\d+)_(-?\d+)\.bin/.exec(c.file),ids=tiles.get(match[1]+','+match[2]);assert.equal(ids.length,c.count);
 const b=fs.readFileSync(out+c.file),v=new Float32Array(b.buffer,b.byteOffset,b.length/4);assert.equal(v.length,c.count*20);
 ids.forEach((id,j)=>{for(let k=0;k<12;k++)assert.equal(v[j*20+k],textures.segments[id*12+k]);for(let k=12;k<20;k++)assert(Number.isFinite(v[j*20+k]));});instances+=c.count;
}
assert.equal(instances,catalog.segments);
const expected=new Map(),scale=manifest.spatialScale;
for(let id=0;id<catalog.segments;id++){
 const i=id*12;
 for(let y=Math.floor((Math.min(source[i+1],source[i+3])-.25)*scale);y<=Math.floor((Math.max(source[i+1],source[i+3])+.25)*scale);y++)for(let x=Math.floor((Math.min(source[i],source[i+2])-.25)*scale);x<=Math.floor((Math.max(source[i],source[i+2])+.25)*scale);x++){
  const key=x+','+y;if(!expected.has(key))expected.set(key,[]);expected.get(key).push(id);
 }
}
let candidateCount=0;
for(const [key,ids] of expected){
 const [x,y]=key.split(',').map(Number),px=Math.floor(x/32)-manifest.pageOrigin[0],py=Math.floor(y/32)-manifest.pageOrigin[1],page=textures.pages[py*manifest.textures.pages.width+px]-1;assert(page>=0);
 const cell=page*1024+((y%32+32)%32)*32+(x%32+32)%32,offset=textures.cells[cell*2];assert.equal(textures.cells[cell*2+1],ids.length);
 ids.forEach((id,j)=>assert.equal(textures.indices[offset+j],id));candidateCount+=ids.length;
}
assert.equal(candidateCount,manifest.candidateIndices);assert.equal(expected.size,manifest.spatialCells);
const result={passed:true,sourceHashVerified:true,unalteredSourceSegments:catalog.segments,persistentInstances:instances,exactSpatialCells:expected.size,exactCandidateIndices:candidateCount,lookupBytes:manifest.textureBytes,instanceBytes:manifest.instanceBytes,notice:'Structural source equivalence; visual alignment and frame timing require native GPU checks.'};
fs.mkdirSync('godot-prototype/evidence/world-readiness',{recursive:true});fs.writeFileSync('godot-prototype/evidence/world-readiness/data-validation.json',JSON.stringify(result,null,2)+'\n');
console.log('COAST_BASELINE_VALIDATION',JSON.stringify(result));
