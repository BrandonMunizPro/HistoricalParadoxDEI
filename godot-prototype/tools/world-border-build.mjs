// Deterministic cartographic generalization of explicitly provisional envelopes.
// Terrain/river routing is an inference, never proof of a political frontier.
import fs from 'node:fs';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {PNG} from 'pngjs';
const out='godot-prototype/data/world-border-review';
fs.mkdirSync(out,{recursive:true});fs.writeFileSync(out+'/.gdignore','');
const read=p=>JSON.parse(fs.readFileSync(p)),hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const baseline=read('godot-prototype/data/northern-italy-reference/scenario-278.json'),data=globalThis.structuredClone(baseline);
const placements=read('godot-prototype/data/factions/label-placements.json');
const fixed=new Set(['boii','insubres','cenomani','veneti-italy','rome','etruscan-polities','ligurian-polities','samnites','lucanians','bruttians','messapians','daunians','tarentum','rhegion','croton','syracuse']);
const pointKey=p=>p.map(v=>v.toFixed(6)).join(','),edgeKey=(a,b)=>[pointKey(a),pointKey(b)].sort().join('|');
const moves=new Map([
 ['1.400000,49.200000',[1.9,48.68]],['2.600000,49.100000',[2.6,48.65]],
 ['-8.800000,41.200000',[-8.7,41.15]],['-7.100000,41.500000',[-7.1,41.1]],
 ['4.400000,45.800000',[4.82,45.76]]
]);
const canEdit=t=>t.confidence==='scenario_abstraction'&&!fixed.has(t.initialController);
const polygons=t=>t.geometry.type==='MultiPolygon'?t.geometry.coordinates:[t.geometry.coordinates];
for(const t of data.territories)if(canEdit(t))for(const poly of polygons(t))for(const ring of poly)for(let i=0;i<ring.length;i++)ring[i]=moves.get(pointKey(ring[i]))??ring[i];
const protectedEdges=new Set();
for(const t of data.territories)if(!canEdit(t))for(const poly of polygons(t))for(const ring of poly)for(let i=1;i<ring.length;i++)protectedEdges.add(edgeKey(ring[i-1],ring[i]));
const terrain=[];
for(const region of ['hispania','gaul','britannia']){const dir='godot-prototype/data/'+region,m=read(dir+'/manifest.json'),b=fs.readFileSync(dir+'/source-metres.bin');terrain.push({bounds:m.bounds,width:m.width,height:m.height,elevations:new Float32Array(b.buffer,b.byteOffset,b.length/4)});}
const tiles=read('godot-prototype/data/world.json').tiles.filter(t=>t.kind==='world'),worldCache=new Map();
function elevation(x,y){
 let t=terrain.find(t=>x>=t.bounds.west&&x<=t.bounds.east&&y>=t.bounds.south&&y<=t.bounds.north);
 if(!t){const d=tiles.find(t=>x>=t.bounds.west&&x<=t.bounds.east&&y>=t.bounds.south&&y<=t.bounds.north);if(!d)return 0;if(!worldCache.has(d.id))worldCache.set(d.id,read('public/data/world-terrain/'+d.id+'.json'));t=worldCache.get(d.id);}
 const b=t.bounds,px=Math.max(0,Math.min(t.width-1.00001,(x-b.west)/(b.east-b.west)*(t.width-1))),py=Math.max(0,Math.min(t.height-1.00001,(b.north-y)/(b.north-b.south)*(t.height-1))),i=Math.floor(px),j=Math.floor(py),u=px-i,v=py-j,h=t.elevations;
 return (h[j*t.width+i]*(1-u)+h[j*t.width+i+1]*u)*(1-v)+(h[(j+1)*t.width+i]*(1-u)+h[(j+1)*t.width+i+1]*u)*v;
}
const riverCells=new Map();
for(const f of read('godot-prototype/data/hydrology.json').rivers)for(const line of f.geometry.type==='MultiLineString'?f.geometry.coordinates:[f.geometry.coordinates])for(let i=1;i<line.length;i++){
 const a=line[i-1],b=line[i];for(let y=Math.floor(Math.min(a[1],b[1])*2);y<=Math.floor(Math.max(a[1],b[1])*2);y++)for(let x=Math.floor(Math.min(a[0],b[0])*2);x<=Math.floor(Math.max(a[0],b[0])*2);x++){const key=x+','+y;if(!riverCells.has(key))riverCells.set(key,[]);riverCells.get(key).push([a,b]);}
}
function riverDistance(x,y){
 const c=Math.cos(y*Math.PI/180);let best=40;
 for(let j=-1;j<=1;j++)for(let i=-1;i<=1;i++)for(const [a,b] of riverCells.get((Math.floor(x*2)+i)+','+(Math.floor(y*2)+j))??[]){const dx=(b[0]-a[0])*c,dy=b[1]-a[1],u=(x-a[0])*c,v=y-a[1],t=Math.max(0,Math.min(1,(u*dx+v*dy)/(dx*dx+dy*dy||1)));best=Math.min(best,Math.hypot(u-dx*t,v-dy*t)*111.195);}
 return best;
}
function simplify(p,tolerance=.0075){
 if(p.length<3)return p;const a=p[0],b=p.at(-1),dx=b[0]-a[0],dy=b[1]-a[1];let maximum=0,index=0;
 for(let i=1;i<p.length-1;i++){const t=Math.max(0,Math.min(1,((p[i][0]-a[0])*dx+(p[i][1]-a[1])*dy)/(dx*dx+dy*dy||1))),d=Math.hypot(p[i][0]-a[0]-t*dx,p[i][1]-a[1]-t*dy);if(d>maximum){maximum=d;index=i;}}
 return maximum>tolerance?[...simplify(p.slice(0,index+1),tolerance).slice(0,-1),...simplify(p.slice(index),tolerance)]:[a,b];
}
const paths=new Map(),routes=[];
function route(start,end){
 const reversed=pointKey(start)>pointKey(end),a=reversed?end:start,b=reversed?start:end,key=edgeKey(a,b);
 if(!paths.has(key)){
  const c=Math.cos((a[1]+b[1])*.5*Math.PI/180),dx=(b[0]-a[0])*c,dy=b[1]-a[1],len=Math.hypot(dx,dy),km=len*111.195;
  if(km<60||protectedEdges.has(key)||len===0)paths.set(key,[a,b]);
  else{
   const steps=Math.min(240,Math.max(8,Math.ceil(km/4))),half=10,columns=21,width=Math.min(30,km*.12)/111.195,previous=new Float64Array(columns),parents=[];
   previous.fill(Infinity);previous[half]=0;
   const coordinate=(i,j)=>{const t=i/steps,q=(j-half)/half*width*Math.sin(Math.PI*t);return [a[0]+(b[0]-a[0])*t-dy/len*q/c,a[1]+(b[1]-a[1])*t+dx/len*q];};
   for(let i=1;i<=steps;i++){
    const next=new Float64Array(columns);next.fill(Infinity);const parent=new Int16Array(columns);
    for(let j=0;j<columns;j++){
     const [x,y]=coordinate(i,j),h=Math.max(0,elevation(x,y)),river=riverDistance(x,y);
     const feature=Math.min(.65+2*Math.exp(-h/450),.45+river/10)+.015*Math.abs(j-half)/half;
     for(let k=Math.max(0,j-1);k<=Math.min(columns-1,j+1);k++){const cost=previous[k]+feature+.015*(j-k)**2;if(cost<next[j]){next[j]=cost;parent[j]=k;}}
    }
    previous.set(next);parents.push(parent);
   }
   let j=Array.from(previous).indexOf(Math.min(...previous));const raw=[];
   for(let i=steps;i>=1;i--){raw.push(coordinate(i,j));j=parents[i-1][j];}raw.push(a);raw.reverse();raw[raw.length-1]=b;
   const path=simplify(raw);paths.set(key,path);routes.push({endpoints:[a,b],lengthKm:km,vertices:path.length,maxCorridorKm:width*111.195,method:'Deterministic terrain/river cost within a bounded original association corridor; inferred, not an attested frontier.'});
  }
 }
 const p=paths.get(key);return reversed?p.toReversed():p;
}
for(const t of data.territories)if(canEdit(t)){
 for(const poly of polygons(t))for(let r=0;r<poly.length;r++){const ring=poly[r],result=[];for(let i=1;i<ring.length;i++)result.push(...route(ring[i-1],ring[i]).slice(0,-1));result.push(result[0]);poly[r]=result;}
 t.sources=[...new Set([...t.sources,'terrain-border-review'])];t.notes+=' Terrain-guided cartographic generalization replaces straight association-envelope segments. This is not a verified 278 BCE frontier.';
}
data.sources['terrain-border-review']={url:'https://dataspace.copernicus.eu/explore-data/data-collections/copernicus-contributing-missions/collections-description/COP-DEM',role:'Physical terrain and existing GSHHG WDBII river corridors guide bounded provisional-border drawing. Later ancient associations inform only broad placement; no claim of surveyed or confirmed 278 BCE borders.'};
fs.writeFileSync(out+'/scenario-278.json',JSON.stringify(data,null,2));
const definitions=read('godot-prototype/data/geographic-regions/definitions.json');
for(const r of definitions.regions){const t=data.territories.find(t=>t.id===r.legacyTerritoryId);assert(t);r.geometryDigest=hash(JSON.stringify(t.geometry));}
fs.writeFileSync(out+'/definitions.json',JSON.stringify(definitions,null,2));
function raster(bounds,width,name,labels=false){
 const height=Math.round(width*(bounds.north-bounds.south)/(bounds.east-bounds.west)),ids=new Uint16Array(width*height),rank=new Uint8Array(ids.length);
 for(const {t,id} of data.territories.map((t,i)=>({t,id:i+2})).sort((a,b)=>a.t.priority-b.t.priority))for(const poly of polygons(t)){
  const rr=poly.map(r=>r.map(([x,y])=>[(x-bounds.west)/(bounds.east-bounds.west)*width,(bounds.north-y)/(bounds.north-bounds.south)*height]));const ys=rr.flat().map(p=>p[1]);
  for(let y=Math.max(0,Math.ceil(Math.min(...ys)-.5));y<=Math.min(height-1,Math.floor(Math.max(...ys)-.5));y++){
   const xs=[];for(const ring of rr)for(let i=0,j=ring.length-1;i<ring.length;j=i++){const a=ring[i],b=ring[j];if((a[1]>y+.5)!==(b[1]>y+.5))xs.push(a[0]+(y+.5-a[1])*(b[0]-a[0])/(b[1]-a[1]));}xs.sort((a,b)=>a-b);
   for(let k=0;k+1<xs.length;k+=2)for(let x=Math.max(0,Math.ceil(xs[k]-.5));x<=Math.min(width-1,Math.floor(xs[k+1]-.5));x++){const at=y*width+x;if(rank[at]>t.priority)continue;if(rank[at]===t.priority&&t.priority>=100&&ids[at]&&ids[at]!==id){ids[at]=1;continue;}ids[at]=id;rank[at]=t.priority;}
  }
 }
 const image=new PNG({width,height});for(let i=0;i<ids.length;i++)image.data.set([ids[i]&255,ids[i]>>8,rank[i]>=100?255:96,255],i*4);fs.writeFileSync(out+'/'+name+'.png',PNG.sync.write(image));
 if(labels){
  const land=PNG.sync.read(fs.readFileSync('godot-prototype/data/global/land.png')),best=new Map();
  for(let y=0;y<height;y++)for(let x=0;x<width;x++){const id=ids[y*width+x];if(id<2)continue;const lx=Math.min(land.width-1,Math.floor(x/width*land.width)),ly=Math.min(land.height-1,Math.floor(y/height*land.height));if(land.data[(ly*land.width+lx)*4]<250)continue;const f=data.factions.find(f=>f.id===data.territories[id-2].initialController),p=placements[f.id]??f.label,lon=bounds.west+(x+.5)/width*(bounds.east-bounds.west),lat=bounds.north-(y+.5)/height*(bounds.north-bounds.south),score=((lon-p[0])*Math.cos(lat*Math.PI/180))**2+(lat-p[1])**2;if(!best.has(f.id)||score<best.get(f.id).score)best.set(f.id,{score,point:[lon,lat]});}
  fs.writeFileSync(out+'/label-placements.json',JSON.stringify(Object.fromEntries([...best].map(([id,v])=>[id,v.point])),null,2));
 }
 return {name,width,height};
}
const rasters=[raster(data.scope,8192,'territory-ids',true),raster({west:6,east:14,south:43,north:47},4096,'local-ids'),raster({west:14,east:25,south:36,north:46},4096,'balkans-ids'),raster({west:6,east:20,south:35,north:49},4096,'sicily-ids')];
const audit=data.territories.map((t,i)=>({id:t.id,owner:t.initialController,classification:t.confidence,geometryChanged:JSON.stringify(t.geometry)!==JSON.stringify(baseline.territories[i].geometry),temporalStatus:t.confidence==='source_reconstruction'?'Dated scholarly model; not exact sovereignty':'Provisional regional association; exact 278 BCE extent unverified',vertices:polygons(t).reduce((n,p)=>n+p.reduce((n,r)=>n+r.length,0),0)}));
fs.writeFileSync(out+'/audit.json',JSON.stringify({dateBce:278,baselineSha256:hash(JSON.stringify(baseline)),stableTerritoryOrder:true,unchangedInitialControllers:true,rasters,adjustments:['Parisii association includes Lutetia; this remains a later-attested association, not a dated 278 BCE boundary.','Lusitanian/Gallaecian junction follows the broad Douro transition; later descriptions are explicitly not treated as exact 278 BCE evidence.','Rhone confluence replaces an offset Allobrogian/Aeduan junction.'],territories:audit,routes},null,2));
console.log('WORLD_BORDER_BUILD_OK',JSON.stringify({territories:audit.length,changed:audit.filter(r=>r.geometryChanged).length,routedEdges:routes.length,rasters}));
// The approved opening is a deterministic overlay on the pinned reviewed baseline.
if(fs.existsSync('godot-prototype/data/spring-278/corrections.json'))await import('./spring-278-build.mjs');
