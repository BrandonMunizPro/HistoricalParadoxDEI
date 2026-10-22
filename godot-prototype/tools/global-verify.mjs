import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {PNG} from 'pngjs';
const root=path.resolve(fileURLToPath(new URL('..',import.meta.url))),repo=path.dirname(root);
const read=p=>JSON.parse(fs.readFileSync(path.join(root,p)));
const global=read('data/global/manifest.json'),hashes=read('data/global/source-hashes.json');let samples=0,probes=0;
const land=PNG.sync.read(fs.readFileSync(path.join(root,'data/global/land.png')));
for(const d of global.tiles){
 const bytes=fs.readFileSync(path.join(repo,`public/data/world-terrain/${d.id}.json`));assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),hashes.find(x=>x.id===d.id).sha256);
 const t=JSON.parse(bytes),mesh=fs.readFileSync(path.join(root,d.mesh));assert.equal(d.grid,t.width-1);assert.equal(mesh.readUInt32LE(),t.width*t.height);
 for(let i=0;i<t.elevations.length;i++){assert.equal(mesh.readFloatLE(8+i*12+4),Math.fround(Math.max(.001,t.elevations[i]*.0015)));samples++;}
 const native=PNG.sync.read(fs.readFileSync(path.join(root,d.coast)));
 for(let i=1;i<=17;i++){const b=d.bounds,x=Math.round((b.west+12)*128)+i*13%Math.round((b.east-b.west)*128),y=Math.round((62-b.north)*128)+i*19%Math.round((b.north-b.south)*128),lon=-12+x/128,lat=62-y/128,sx=Math.round((lon-b.west)/(b.east-b.west)*(native.width-1)),sy=Math.round((b.north-lat)/(b.north-b.south)*(native.height-1));assert.equal(land.data[(y*land.width+x)*4],native.data[(sy*native.width+sx)*4]);probes++;}
}
assert.equal(global.maxSourceEastWestEdgeDeltaMetres,0);
const eco=PNG.sync.read(fs.readFileSync(path.join(root,'data/global/ecology.png')));
const water=read('data/hydrology.json');let nileSamples=0,lowestNileInfluence=255;
for(const f of water.rivers){const lines=f.geometry.type==='MultiLineString'?f.geometry.coordinates:[f.geometry.coordinates];for(const line of lines)for(const [lon,lat] of line){if(lon<30||lon>33||lat<24||lat>31)continue;const x=Math.round((lon+12)*16),y=Math.round((62-lat)*16),v=eco.data[(y*eco.width+x)*4+3];lowestNileInfluence=Math.min(lowestNileInfluence,v);nileSamples++;}}
assert.ok(nileSamples>0);assert.ok(lowestNileInfluence>=240,'Nile vegetation corridor must align with its source centreline');
console.log('NILE_CORRIDOR', {nileSamples,lowestNileInfluence});
const result={passed:true,tiles:global.tiles.length,elevationSamplesPreserved:samples,coastlineSourceProbes:probes,nileSourceVerticesChecked:nileSamples,minimumNileCorridorInfluence:lowestNileInfluence,sourceFilesUnchanged:true,sourceEastWestEdgeDeltaMetres:0,notice:'Shared global coast is nearest-sample resampled at 128 pixels/degree (~0.4–0.9 km); native Italy lattice is retained at 512 pixels/degree. No canonical coastline or elevation files were edited.'};
fs.writeFileSync(path.join(root,'evidence/global-geography-validation.json'),JSON.stringify(result,null,2));console.log(result);
