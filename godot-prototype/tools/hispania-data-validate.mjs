import fs from 'node:fs';
import assert from 'node:assert/strict';
import {PNG} from 'pngjs';
const dir='godot-prototype/data/hispania';
const manifest=JSON.parse(fs.readFileSync(dir+'/manifest.json'));
const b=manifest.bounds,bytes=fs.readFileSync(dir+'/source-metres.bin');
const heights=new Float32Array(bytes.buffer,bytes.byteOffset,bytes.length/4);
function peak(lon,lat,radius){
 let maximum=-Infinity;
 for(let y=Math.floor((b.north-lat-radius)*128);y<=Math.ceil((b.north-lat+radius)*128);y++)
  for(let x=Math.floor((lon-radius-b.west)*128);x<=Math.ceil((lon+radius-b.west)*128);x++)maximum=Math.max(maximum,heights[y*manifest.width+x]);
 return maximum;
}
const landmarks=[['Meseta',-4.5,41,.1,600],['Picos',-4.85,43.15,.2,1800],['Pyrenees',.1,42.65,.2,2500],['Gredos',-5.25,40.25,.2,1800],['Sierra Nevada',-3.35,37.05,.2,2700]];
const results=landmarks.map(([name,lon,lat,radius,minimum])=>{const maximumMetres=peak(lon,lat,radius);assert(maximumMetres>=minimum,name+' source relief missing');return {name,maximumMetres};});
const mask=PNG.sync.read(fs.readFileSync(dir+'/land.png'));
function land(lon,lat){const x=Math.round((lon-b.west)/(b.east-b.west)*(mask.width-1)),y=Math.round((b.north-lat)/(b.north-b.south)*(mask.height-1));return mask.data[(y*mask.width+x)*4]>127;}
for(const p of [[-4.5,41],[-8,42.5],[-8,39],[.1,42.65],[2.9,39.7]])assert(land(...p),'Missing mainland/island land');
assert(!land(-5.5,35.95),'Strait filled with land');
const water=JSON.parse(fs.readFileSync(dir+'/historical-water.json'));
assert.equal(water.suppressedReservoirs.length,4);
const reservoir=PNG.sync.read(fs.readFileSync(dir+'/reservoir-mask.png'));
assert.equal(reservoir.width,mask.width);assert.equal(reservoir.height,mask.height);
let suppressedWaterPixels=0;
for(let i=0;i<reservoir.data.length;i+=4)if(reservoir.data[i]>127){assert(mask.data[i]>127,'Reservoir still cuts a hole in terrain');suppressedWaterPixels++;}
assert(suppressedWaterPixels>1000,'Reservoir suppression raster is empty');
assert.equal(heights.length,manifest.width*manifest.height);
assert(heights.every(Number.isFinite));
const result={passed:true,landmarks:results,straitOpen:true,mainlandAndMallorcaLand:true,reservoirsExcluded:4,suppressedWaterPixels,descriptors:manifest.details.length,sourceEntries:manifest.sources.length,missingEntries:manifest.sources.filter(s=>s.missing).length};
fs.writeFileSync('godot-prototype/evidence/hispania-expansion/data-validation.json',JSON.stringify(result,null,2));
console.log(JSON.stringify(result,null,2));
