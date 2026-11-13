import fs from 'node:fs';
import assert from 'node:assert/strict';
import {PNG} from 'pngjs';
import {frontier,frontierMaskWeight,establishedWeight} from './regional-scopes.mjs';
const root='godot-prototype/evidence/world-completion',read=p=>JSON.parse(fs.readFileSync(p)),rows=[];
for(const region of frontier.order){
 const dir='godot-prototype/data/'+region,m=read(dir+'/manifest.json');
 if(!m.details.length){rows.push({region,fullyCoveredByEarlierSections:true});continue;}
 const bytes=fs.readFileSync(dir+'/source-metres.bin'),h=new Float32Array(bytes.buffer,bytes.byteOffset,bytes.length/4);assert.equal(h.length,m.width*m.height);assert(h.every(Number.isFinite));
 for(const name of ['land','ocean']){const image=PNG.sync.read(fs.readFileSync(dir+'/'+name+'.png'));assert(image.width<=16384&&image.height<=16384);assert(image.width===1||image.width===(m.bounds.east-m.bounds.west)*128+1);}
 for(const d of m.details)assert(fs.existsSync('godot-prototype/'+d.mesh));
 rows.push({region,descriptors:m.details.length,sourceEntries:m.sources.length,missingSources:m.sources.filter(s=>s.missing).length,finiteHeights:true,coastMasksAtTerrainSamplingDensity:true});
}
const land=PNG.sync.read(fs.readFileSync('godot-prototype/data/global/land.png')),uncovered=[];let landSamples=0;
for(let lat=12.5;lat<62;lat++)for(let lon=-11.5;lon<75;lon++){
 const x=Math.round((lon+12)/87*(land.width-1)),y=Math.round((62-lat)/50*(land.height-1));if(land.data[(y*land.width+x)*4]<127)continue;landSamples++;
 if(establishedWeight(lon,lat)<.001&&!frontier.order.some(r=>frontierMaskWeight(r,lon,lat)>.001))uncovered.push([lon,lat]);
}
assert.equal(uncovered.length,0,'Uncovered campaign land: '+JSON.stringify(uncovered));
const gaul=read('godot-prototype/data/gaul/manifest.json'),bytes=fs.readFileSync('godot-prototype/data/gaul/source-metres.bin'),h=new Float32Array(bytes.buffer,bytes.byteOffset,bytes.length/4);let montBlanc=0;
for(let lat=45.7;lat<=46;lat+=1/128)for(let lon=6.7;lon<=7;lon+=1/128)montBlanc=Math.max(montBlanc,h[Math.round((gaul.bounds.north-lat)*128)*gaul.width+Math.round((lon-gaul.bounds.west)*128)]);
assert(montBlanc>4200,'High Alpine relief lost');
const continuity=[];
const sections=[...Object.keys(read('godot-prototype/data/eastern-regions.json').regions),...read('godot-prototype/data/africa-regions.json').order,'hispania',...read('godot-prototype/data/northern-regions.json').order,...frontier.order];
for(const region of sections){
 const dir='godot-prototype/data/'+region,m=read(dir+'/manifest.json'),source=fs.readFileSync(dir+'/source-metres.bin'),far=fs.readFileSync(dir+'/far-heights.bin'),mesh=fs.readFileSync(dir+'/far.bin'),width=(m.bounds.east-m.bounds.west)*32+1;
 assert(m.continuousSourceHeight,region+' has no continuity correction');assert.equal(mesh.readUInt32LE(0),far.length/4);
 let samples=0;
 for(let i=0;i<far.length/4;i++){
  const x=i%width,y=Math.floor(i/width);if(x!==0&&x!==width-1&&y!==0&&i<far.length/4-width&&i%97!==0)continue;
  const expected=source.readFloatLE((y*4*m.width+x*4)*4)*.0015,actual=far.readFloatLE(i*4);
  assert(Math.abs(actual-expected)<.00001,region+' source backdrop mismatch at '+i);
  assert.equal(mesh.readFloatLE(8+i*12+4),actual,region+' mesh backdrop mismatch');samples++;
 }
 continuity.push({region,checkedBackdropVertices:samples,sourceAndMeshAgree:true});
}
const result={passed:true,regions:rows,heightContinuity:continuity,landCoverageSamples:landSamples,uncoveredLandSamples:0,sampledMontBlancPeakMetres:montBlanc,notice:'One-degree land sampling validates coverage, not every small island or ancient shore. Missing/ocean source samples use the prior world fallback.'};
fs.writeFileSync(root+'/data-validation.json',JSON.stringify(result,null,2));console.log('WORLD_COMPLETION_DATA_OK',JSON.stringify(result));
