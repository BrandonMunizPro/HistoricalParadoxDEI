import fs from 'node:fs';
import {PNG}from'pngjs';
const root='godot-prototype/data/factions',data=JSON.parse(fs.readFileSync(root+'/scenario-278.json'));
const width=4096,height=Math.round(width*50/87),ids=new Uint16Array(width*height),rank=new Uint8Array(ids.length);
function fill(rings,id,priority){
 const projected=rings.map(r=>r.map(([x,y])=>[(x+12)/87*width,(62-y)/50*height]));
 const ys=projected.flat().map(p=>p[1]),low=Math.max(0,Math.ceil(Math.min(...ys)-.5)),high=Math.min(height-1,Math.floor(Math.max(...ys)-.5));
 for(let y=low;y<=high;y++){
  const xs=[];
  for(const ring of projected)for(let i=0,j=ring.length-1;i<ring.length;j=i++){
   const a=ring[i],b=ring[j];if((a[1]>y+.5)!==(b[1]>y+.5))xs.push(a[0]+(y+.5-a[1])*(b[0]-a[0])/(b[1]-a[1]));
  }
  xs.sort((a,b)=>a-b);
  for(let i=0;i+1<xs.length;i+=2){const first=Math.max(0,Math.ceil(xs[i]-.5)),last=Math.min(width-1,Math.floor(xs[i+1]-.5));for(let x=first;x<=last;x++){
   const at=y*width+x;
   if(rank[at]>priority)continue;
   // Equal-priority overlapping scholarly reconstructions stay disputed rather
   // than silently granting the area to the last polygon in a file.
   if(rank[at]===priority&&priority>=100&&ids[at]!==0&&ids[at]!==id){ids[at]=1;continue;}
   rank[at]=priority;ids[at]=id;
  }}
 }
}
const ordering=data.territories.map((t,i)=>({t,id:i+2})).sort((a,b)=>a.t.priority-b.t.priority);
for(const {t,id} of ordering)for(const rings of t.geometry.type==='MultiPolygon'?t.geometry.coordinates:[t.geometry.coordinates])fill(rings,id,t.priority);
const image=new PNG({width,height});
const counts={};
for(let i=0;i<ids.length;i++){const id=ids[i];image.data.set([id&255,id>>8,rank[i]>=100?255:96,255],i*4);counts[id]=(counts[id]??0)+1;}
fs.writeFileSync(root+'/territory-ids.png',PNG.sync.write(image));
fs.writeFileSync(root+'/raster.json',JSON.stringify({width,height,scope:data.scope,encoding:'R low byte + 256*G high byte; B confidence. ID0=unassigned, ID1=overlapping source reconstructions/disputed; IDs 2+ follow territories array. Nearest sampled. No settlement-derived regions.',counts},null,2)+'\n');
// These are display label positions, not settlements/capitals or region seeds.
// Keep each territorial label on its OWN visible land, even where a scholarly
// polygon overlaps a provisional zone or differs from the existing coast mask.
const land=PNG.sync.read(fs.readFileSync('godot-prototype/data/global/land.png'));
const best=new Map(),placements={};
for(let y=0;y<height;y++)for(let x=0;x<width;x++){
 const id=ids[y*width+x];if(id<2)continue;
 const territory=data.territories[id-2],faction=data.factions.find(f=>f.id===territory.initialController);
 const lx=Math.min(land.width-1,Math.floor((x+.5)/width*land.width)),ly=Math.min(land.height-1,Math.floor((y+.5)/height*land.height));
 if(land.data[(ly*land.width+lx)*4]<250)continue;
 const lon=(x+.5)/width*87-12,lat=62-(y+.5)/height*50;
 const score=((lon-faction.label[0])*Math.cos(lat*Math.PI/180))**2+(lat-faction.label[1])**2;
 if(!best.has(id)||score<best.get(id).score)best.set(id,{score,point:[lon,lat]});
}
for(const [id,entry]of best)placements[data.territories[id-2].initialController]=entry.point;
fs.writeFileSync(root+'/label-placements.json',JSON.stringify(placements,null,2)+'\n');
console.log({width,height,territories:data.territories.length,disputedPixels:counts[1]??0});
