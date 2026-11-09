// Suppress a known twentieth-century reservoir, without inventing pre-dam relief.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {PNG} from 'pngjs';
const dir='godot-prototype/data/hispania',read=p=>JSON.parse(fs.readFileSync(p));
const manifest=read(dir+'/manifest.json'),hydrology=read('godot-prototype/data/hydrology.json');
const entries=read('godot-prototype/data/hispania-region.json').modernReservoirs;
const lakes=entries.map(e=>{const l=hydrology.lakes.find(l=>l.id===e.id);assert(l);return l;});
const bounds=manifest.bounds;
function fill(image,b,value,lake){
 const rings=lake.rings.map(r=>r.map(([x,y])=>[(x-b.west)*512,(b.north-y)*512]));
 let lo=image.height-1,hi=0;for(const r of rings)for(const p of r){lo=Math.min(lo,p[1]);hi=Math.max(hi,p[1]);}
 for(let y=Math.max(0,Math.ceil(lo));y<=Math.min(image.height-1,Math.floor(hi));y++){
  const xs=[];for(const r of rings)for(let i=0,j=r.length-1;i<r.length;j=i++){const a=r[i],c=r[j];if((a[1]>y)!==(c[1]>y))xs.push(a[0]+(y-a[1])*(c[0]-a[0])/(c[1]-a[1]));}xs.sort((a,b)=>a-b);
  for(let i=0;i+1<xs.length;i+=2)for(let x=Math.max(0,Math.ceil(xs[i]));x<=Math.min(image.width-1,Math.floor(xs[i+1]));x++)image.data.set([value,value,value,255],(y*image.width+x)*4);
 }
}
const land=PNG.sync.read(fs.readFileSync(dir+'/land.png'));for(const lake of lakes)fill(land,manifest.bounds,255,lake);fs.writeFileSync(dir+'/land.png',PNG.sync.write(land,{colorType:0}));
const mask=new PNG({width:(bounds.east-bounds.west)*512+1,height:(bounds.north-bounds.south)*512+1});for(let i=3;i<mask.data.length;i+=4)mask.data[i]=255;for(const lake of lakes)fill(mask,bounds,255,lake);
fs.writeFileSync(dir+'/reservoir-mask.png',PNG.sync.write(mask,{colorType:0}));
const hash=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
fs.writeFileSync(dir+'/historical-water.json',JSON.stringify({suppressedReservoirs:entries,bounds,sourceGeometry:'godot-prototype/data/hydrology.json',geometrySha256:hash('godot-prototype/data/hydrology.json'),notice:'Confirmed modern reservoirs suppressed. Existing source river lines retained. Pre-dam elevations and banks are missing; modern DEM remains a surface proxy.'},null,2));
console.log('HISPANIA_HISTORICAL_WATER_OK',entries.length);
