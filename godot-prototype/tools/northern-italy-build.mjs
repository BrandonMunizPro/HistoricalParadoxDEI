import fs from 'node:fs';
import crypto from 'node:crypto';
import {PNG} from 'pngjs';
const out='godot-prototype/data/northern-italy-reference';
fs.mkdirSync(out,{recursive:true});
const read=p=>JSON.parse(fs.readFileSync(p));
const original=read('godot-prototype/data/factions/scenario-278.json');
const data=structuredClone(original);
// Conservative association envelopes, not reconstructed administrative borders.
// Shared corridors avoid granting the same transition to two factions.
const rings={
 insubres:[[8.1,45.05],[8.7,45.08],[9.25,45.15],[9.7,45.13],[9.88,45.4],[9.98,45.7],[9.8,46.05],[8.4,46.05]],
 cenomani:[[9.7,45.13],[10.05,45.02],[10.5,45.03],[10.85,45.08],[11.15,45.0],[11.32,45.15],[11.35,45.65],[11.15,46.05],[9.8,46.05],[9.98,45.7],[9.88,45.4]],
 'veneti-italy':[[11.32,45.15],[11.55,44.98],[12.25,44.95],[13.8,45.4],[13.7,46.5],[12.5,46.3],[11.15,46.05],[11.35,45.65]],
 boii:[[10.05,44.86],[10.3,44.94],[10.65,44.94],[11.0,44.95],[11.35,44.91],[11.75,44.88],[11.95,44.65],[11.85,44.35],[11.55,44.12],[11.15,44.15],[10.75,44.3],[10.35,44.5]]
};
for(const [id,ring] of Object.entries(rings)){
 const t=data.territories.find(t=>t.initialController===id);
 t.geometry={type:'Polygon',coordinates:[[...ring,ring[0]]]};
 t.notes='Northern Italy regional review: provisional core association only. Polybius 2.17; Livy 5.35; Patavium/OCD. Exact 278 BCE corridors are uncertain. Unassigned margins are unknown, not empty.';
 t.sources=[...new Set([...t.sources,'northern-italy-audit'])];
}
data.sources['northern-italy-audit']={role:'Provisional correction; see docs/northern-italy-audit/REPORT.md',url:'https://penelope.uchicago.edu/Thayer/E/Roman/Texts/Polybius/2%2A.html'};
fs.writeFileSync(out+'/scenario-278.json',JSON.stringify(data,null,2));
const w=4096,h=2048,west=6,north=47,sx=w/8,sy=h/4;
const ids=new Uint16Array(w*h),rank=new Uint8Array(w*h);
function scan(rings,visit){
 const p=rings.map(r=>r.map(([x,y])=>[(x-west)*sx,(north-y)*sy]));
 const ys=p.flat().map(v=>v[1]);
 for(let y=Math.max(0,Math.ceil(Math.min(...ys)-.5));y<=Math.min(h-1,Math.floor(Math.max(...ys)-.5));y++){
  const xs=[];for(const r of p)for(let i=0,j=r.length-1;i<r.length;j=i++){
   const a=r[i],b=r[j];if((a[1]>y+.5)!==(b[1]>y+.5))xs.push(a[0]+(y+.5-a[1])*(b[0]-a[0])/(b[1]-a[1]));
  }xs.sort((a,b)=>a-b);
  for(let i=0;i+1<xs.length;i+=2)for(let x=Math.max(0,Math.ceil(xs[i]-.5));x<=Math.min(w-1,Math.floor(xs[i+1]-.5));x++)visit(y*w+x);
 }
}
for(const {t,id} of data.territories.map((t,i)=>({t,id:i+2})).sort((a,b)=>a.t.priority-b.t.priority))
 for(const r of t.geometry.type==='Polygon'?[t.geometry.coordinates]:t.geometry.coordinates)scan(r,i=>{if(rank[i]>t.priority)return;if(rank[i]===t.priority&&ids[i]&&ids[i]!==id){ids[i]=1;return;}rank[i]=t.priority;ids[i]=id;});
const png=new PNG({width:w,height:h});for(let i=0;i<ids.length;i++)png.data.set([ids[i]&255,ids[i]>>8,rank[i]>=100?255:96,255],i*4);
fs.writeFileSync(out+'/territory-ids.png',PNG.sync.write(png));
// Restore original source vertices lost where a raised terrain surface occludes water.
const hydro=read('public/data/inland-water/polygons.json');
const lakes=hydro.records.filter(r=>r.rings[0].every(p=>p[0]>8&&p[0]<12&&p[1]>45&&p[1]<47));
// Bounded corner reconstruction, shared by water triangles and the terrain mask.
// At most 60 m along either edge; no displacement of long shore segments.
for(const lake of lakes)lake.rings=lake.rings.map(r=>{
 const ring=r.slice(0,-1),result=[];
 for(let i=0;i<ring.length;i++){
  const a=ring[(i+ring.length-1)%ring.length],b=ring[i],c=ring[(i+1)%ring.length];
  const approach=p=>{const metres=Math.hypot((p[0]-b[0])*78000,(p[1]-b[1])*111195),t=Math.min(.2,60/Math.max(1,metres));return [b[0]+(p[0]-b[0])*t,b[1]+(p[1]-b[1])*t];};
  const start=approach(a),end=approach(c);
  for(let j=0;j<=4;j++){const t=j/4;result.push([0,1].map(k=>(1-t)**2*start[k]+2*(1-t)*t*b[k]+t*t*end[k]));}
 }return [...result,result[0]];
});
fs.writeFileSync(out+'/lake-rings.json',JSON.stringify(lakes));
const levels=read('godot-prototype/data/regional/lake-levels.json'),old=read('godot-prototype/data/lakes.json');
const bed=new PNG({width:w,height:h});
for(const lake of lakes){const level=levels[lake.id]??old.find(l=>l.id===lake.id).vertices[0][1];scan(lake.rings,i=>bed.data.set([255,Math.round(level/4*255),0,255],i*4));}
fs.writeFileSync(out+'/lake-bed.png',PNG.sync.write(bed));
const protectedFiles=['godot-prototype/data/sites.json','godot-prototype/data/research-locations.json','godot-prototype/data/factions/scenario-278.json','godot-prototype/data/lakes.json'];
const hashes=Object.fromEntries(protectedFiles.map(p=>[p,crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex')]));
const probe=(x,y)=>{const id=ids[Math.floor((north-y)*sy)*w+Math.floor((x-west)*sx)];return id<2?['unassigned','disputed'][id]:data.territories[id-2].initialController;};
const checks={Brixia:probe(10.21,45.54),Patavium:probe(11.88,45.41),Bononia:probe(11.34,44.5),Mediolanum:probe(9.19,45.46),Ravenna:probe(12.2,44.42),Parma:probe(10.33,44.8)};
if(checks.Brixia!=='cenomani'||checks.Patavium!=='veneti-italy'||checks.Bononia!=='boii'||checks.Mediolanum!=='insubres'||checks.Ravenna==='boii')throw Error(JSON.stringify(checks));
fs.writeFileSync(out+'/manifest.json',JSON.stringify({bounds:[6,43,8,4],width:w,height:h,checks,protectedHashes:hashes,lakes:lakes.map(l=>({id:l.id,sourceVertices:l.rings[0].length})),notice:'Isolated reference only. No canonical faction data, DEM or research edits.'},null,2));
console.log(checks);
