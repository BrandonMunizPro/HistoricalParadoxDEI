// Presentation derivative only. No source heights, geometry, or canonical files change.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {PNG} from 'pngjs';
import {projectLocalMapMetres} from '../../src/infrastructure/world-geography.ts';
const root=path.resolve(fileURLToPath(new URL('..',import.meta.url))),repo=path.dirname(root);
const read=p=>JSON.parse(fs.readFileSync(path.join(root,p)));
const descriptors=read('data/world.json').tiles;
const context=JSON.parse(fs.readFileSync(path.join(repo,'public/data/world-terrain/context.json')));
const world=new Map(),fine=new Map(),sources=[];
for(const d of descriptors){
 if(d.kind==='context')continue;
 const relative=`public/data/${d.kind==='regional'?'italy-terrain':'world-terrain'}/${d.id}.json`;
 const bytes=fs.readFileSync(path.join(repo,relative)),t=JSON.parse(bytes);
 (d.kind==='regional'?fine:world).set(`${t.bounds.west},${t.bounds.south}`,t);
 sources.push({path:relative,sha256:crypto.createHash('sha256').update(bytes).digest('hex')});
}
function sample(t,lon,lat){
 const b=t.bounds,x=Math.max(0,Math.min(t.width-1,(lon-b.west)/(b.east-b.west)*(t.width-1))),y=Math.max(0,Math.min(t.height-1,(b.north-lat)/(b.north-b.south)*(t.height-1))),i=Math.floor(x),j=Math.floor(y),a=x-i,c=y-j;
 const at=(p,q)=>t.elevations[Math.min(t.height-1,q)*t.width+Math.min(t.width-1,p)];
 return (at(i,j)*(1-a)+at(i+1,j)*a)*(1-c)+(at(i,j+1)*(1-a)+at(i+1,j+1)*a)*c;
}
function height(lon,lat){
 const x=Math.max(-12,Math.min(74.999999,lon)),y=Math.max(12,Math.min(61.999999,lat));
 const t=world.get(`${-12+Math.floor((x+12)/5)*5},${12+Math.floor((y-12)/5)*5}`)??context;
 let metres=sample(t,x,y);
 const f=fine.get(`${Math.floor(x)},${Math.floor(y)}`);
 if(f){
  // Blend at the outer coverage boundary, not at every fine tile edge.
  const west=fine.has(`${f.bounds.west-1},${f.bounds.south}`)?1:(x-f.bounds.west)/.15;
  const east=fine.has(`${f.bounds.west+1},${f.bounds.south}`)?1:(f.bounds.east-x)/.15;
  const south=fine.has(`${f.bounds.west},${f.bounds.south-1}`)?1:(y-f.bounds.south)/.15;
  const north=fine.has(`${f.bounds.west},${f.bounds.south+1}`)?1:(f.bounds.north-y)/.15;
  const a=Math.max(0,Math.min(1,west,east,south,north)),blend=a*a*(3-2*a);
  metres+=(sample(f,x,y)-metres)*blend;
 }
 return Math.max(.001,metres*.0015);
}
const rate=32,w=87*rate+1,h=50*rate+1,png=new PNG({width:w,height:h}),step=1/rate;
function point(lon,lat){const p=projectLocalMapMetres({lon,lat},{lon:13.5,lat:41.5});return [p.east*.001,height(lon,lat),-p.north*.001];}
for(let y=0;y<h;y++)for(let x=0;x<w;x++){
 const lon=-12+x/rate,lat=62-y/rate,L=point(lon-step,lat),R=point(lon+step,lat),U=point(lon,lat+step),D=point(lon,lat-step);
 const a=R.map((v,i)=>v-L[i]),b=D.map((v,i)=>v-U[i]);
 const n=[b[1]*a[2]-b[2]*a[1],b[2]*a[0]-b[0]*a[2],b[0]*a[1]-b[1]*a[0]],length=Math.hypot(...n);
 png.data.set([...n.map(v=>Math.round((v/length*.5+.5)*255)),255],(y*w+x)*4);
}
fs.mkdirSync(path.join(root,'data/visual'),{recursive:true});
fs.writeFileSync(path.join(root,'data/visual/relief.png'),PNG.sync.write(png));
fs.writeFileSync(path.join(root,'data/visual/relief-provenance.json'),JSON.stringify({width:w,height:h,samplesPerDegree:rate,sourceHeightScale:1.5,notice:'World-space lighting normals from existing DEMs. No displacement, invented ridges, or new source elevations. Fine Italy edges blend over 0.15 degrees for shading only.',sources},null,2));
console.log('STRATEGIC_RELIEF_READY',w,h,sources.length);
