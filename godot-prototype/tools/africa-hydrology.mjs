// Suppress a known twentieth-century reservoir, without inventing pre-dam relief.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {PNG} from 'pngjs';
const dir='godot-prototype/data/africa_nubia',read=p=>JSON.parse(fs.readFileSync(p));
const manifest=read(dir+'/manifest.json'),hydrology=read('godot-prototype/data/hydrology.json');
assert.ok(read('data/geography/source-cache/lakes.json').features.some(f=>f.properties.name==='Lake Nasser'));
const lake=hydrology.lakes.find(l=>l.id==='source-lake-15-0');assert.ok(lake);
const points=lake.rings.flat(),bounds={west:Math.floor(Math.min(...points.map(p=>p[0]))),east:Math.ceil(Math.max(...points.map(p=>p[0]))),south:Math.floor(Math.min(...points.map(p=>p[1]))),north:Math.ceil(Math.max(...points.map(p=>p[1])))};
assert.ok(bounds.west>=30&&bounds.east<=34&&bounds.south>=20&&bounds.north<=25,'Unexpected reservoir identity');
function fill(image,b,value){
 const rings=lake.rings.map(r=>r.map(([x,y])=>[(x-b.west)*512,(b.north-y)*512]));
 let lo=image.height-1,hi=0;for(const r of rings)for(const p of r){lo=Math.min(lo,p[1]);hi=Math.max(hi,p[1]);}
 for(let y=Math.max(0,Math.ceil(lo));y<=Math.min(image.height-1,Math.floor(hi));y++){
  const xs=[];for(const r of rings)for(let i=0,j=r.length-1;i<r.length;j=i++){const a=r[i],c=r[j];if((a[1]>y)!==(c[1]>y))xs.push(a[0]+(y-a[1])*(c[0]-a[0])/(c[1]-a[1]));}xs.sort((a,b)=>a-b);
  for(let i=0;i+1<xs.length;i+=2)for(let x=Math.max(0,Math.ceil(xs[i]));x<=Math.min(image.width-1,Math.floor(xs[i+1]));x++)image.data.set([value,value,value,255],(y*image.width+x)*4);
 }
}
const land=PNG.sync.read(fs.readFileSync(dir+'/land.png'));fill(land,manifest.bounds,255);fs.writeFileSync(dir+'/land.png',PNG.sync.write(land,{colorType:0}));
const mask=new PNG({width:(bounds.east-bounds.west)*512+1,height:(bounds.north-bounds.south)*512+1});for(let i=3;i<mask.data.length;i+=4)mask.data[i]=255;fill(mask,bounds,255);
fs.writeFileSync(dir+'/reservoir-mask.png',PNG.sync.write(mask,{colorType:0}));
const hash=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
fs.writeFileSync(dir+'/historical-water.json',JSON.stringify({suppressedLakeId:lake.id,identifiedModernName:'Lake Nasser',bounds,sourceGeometry:'godot-prototype/data/hydrology.json',geometrySha256:hash('godot-prototype/data/hydrology.json'),dateEvidence:'https://science.nasa.gov/earth/earth-observatory/aswan-high-dam-85992/',notice:'Modern reservoir surface suppressed; existing Nile vectors retained. No invented ancient banks, bathymetry, pre-dam elevations or settlements. DEM beneath the reservoir remains a modern surface proxy.'},null,2));
console.log('AFRICA_NASSER_PROXY_OK',bounds);
