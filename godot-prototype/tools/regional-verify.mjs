import fs from 'node:fs';
import assert from 'node:assert/strict';
import {PNG} from 'pngjs';
const root=new URL('../',import.meta.url),repo=new URL('../../',import.meta.url);
const read=p=>JSON.parse(fs.readFileSync(new URL(p,root)));
const manifest=read('data/world.json'),atlas=PNG.sync.read(fs.readFileSync(new URL('data/regional/land.png',root)));
let coastProbes=0,heightSamples=0;
for(const d of manifest.tiles.filter(t=>t.kind==='regional')){
 const source=JSON.parse(fs.readFileSync(new URL(`public/data/italy-terrain/${d.id}.json`,repo)));
 const bytes=fs.readFileSync(new URL(d.heights,root));
 assert.equal(bytes.length,source.elevations.length*4);
 for(let i=0;i<source.elevations.length;i++){assert.equal(bytes.readFloatLE(i*4),Math.fround(source.elevations[i]));heightSamples++;}
 const mask=PNG.sync.read(fs.readFileSync(new URL(d.coast,root)));
 for(let y=16;y<512;y+=48)for(let x=16;x<512;x+=48){
  const ax=Math.round((d.bounds.west-6)*512+x),ay=Math.round((49-d.bounds.north)*512+y);
  assert.equal(atlas.data[(ay*atlas.width+ax)*4],mask.data[(y*mask.width+x)*4],`Coastline alignment ${d.id} ${x},${y}`);coastProbes++;
 }
 for(const suffix of ['parent','normal','pnormal']){
  const data=fs.readFileSync(new URL(`data/regional/${d.id}.${suffix}`,root));
  assert.equal(data.length,(d.grid+1)**2*4*(suffix==='parent'?1:3));
  for(let i=0;i<data.length;i+=4)assert.ok(Number.isFinite(data.readFloatLE(i)));
 }
}
const result={passed:true,regionalTiles:85,elevationSamplesPreserved:heightSamples,coastlineProbes:coastProbes,coastlineLattice:atlas.width,finiteParentHeightsAndNormals:true,sourceDataWritten:false};
fs.writeFileSync(new URL('evidence/regional-geography-validation.json',root),JSON.stringify(result,null,2));console.log(result);
