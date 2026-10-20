/** Offline, read-only adapter. All writes are confined to godot-prototype. */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { PNG } from 'pngjs';
import {ShapeUtils,Vector2} from 'three';
import { projectLocalMapMetres } from '../../src/infrastructure/world-geography.ts';

const out=path.resolve(fileURLToPath(new URL('..',import.meta.url)));
const repo=path.resolve(out,'..');
const read=p=>JSON.parse(fs.readFileSync(path.join(repo,p),'utf8'));
const hash=p=>crypto.createHash('sha256').update(fs.readFileSync(path.join(repo,p))).digest('hex');
const ensure=p=>fs.mkdirSync(path.join(out,p),{recursive:true});
['data','data/tiles','materials','evidence','licenses'].forEach(ensure);
const json=(p,v)=>fs.writeFileSync(path.join(out,p),JSON.stringify(v));
const tracked=[];
function protect(dir){for(const e of fs.readdirSync(path.join(repo,dir),{withFileTypes:true})){const p=dir+'/'+e.name;if(e.isDirectory())protect(p);else tracked.push({path:p,sha256:hash(p)});}}
protect('public/data');protect('data/settlement-integration');
for(let i=1;i<=10;i++){const p=`docs/research/r16-settlement-roster.batch${i}.json`;tracked.push({path:p,sha256:hash(p)});}
for(const dir of ['src/domain','src/simulation','src/persistence','map'])protect(dir);
const baseline=path.join(out,'evidence/protected-before.json');
if(fs.existsSync(baseline)){
 const original=JSON.parse(fs.readFileSync(baseline,'utf8'));
 const changed=original.filter(x=>hash(x.path)!==x.sha256);
 if(changed.length)throw Error('Protected source changed since initial checkpoint: '+JSON.stringify(changed));
}else json('evidence/protected-before.json',tracked);
const origin={lon:13.5,lat:41.5}, bounds={west:-12,east:75,south:12,north:62};
const project=(lon,lat)=>{const p=projectLocalMapMetres({lon,lat},origin);return [p.east/1000,-p.north/1000];};
const context=read('public/data/world-terrain/context.json');
const world=read('public/data/world-terrain/manifest.json');
const italy=read('public/data/italy-terrain/manifest.json');
const water=read('public/data/inland-water/polygons.json');
function sample(t,lon,lat){const b=t.bounds,x=Math.max(0,Math.min(t.width-1,(lon-b.west)/(b.east-b.west)*(t.width-1))),y=Math.max(0,Math.min(t.height-1,(b.north-lat)/(b.north-b.south)*(t.height-1)));const c=Math.floor(x),r=Math.floor(y),fx=x-c,fy=y-r;const at=(i,j)=>t.elevations[Math.min(t.height-1,j)*t.width+Math.min(t.width-1,i)];return (at(c,r)*(1-fx)+at(c+1,r)*fx)*(1-fy)+(at(c,r+1)*(1-fx)+at(c+1,r+1)*fx)*fy;}
function inside(x,y,ring){let hit=false;for(let i=0,j=ring.length-1;i<ring.length;j=i++){const a=ring[i],b=ring[j];if((a[1]>y)!==(b[1]>y)&&x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0])hit=!hit;}return hit;}
const lakePolys=water.records.map(r=>({...r,b:[Math.min(...r.rings[0].map(p=>p[0])),Math.min(...r.rings[0].map(p=>p[1])),Math.max(...r.rings[0].map(p=>p[0])),Math.max(...r.rings[0].map(p=>p[1]))]}));
function lakeAt(lon,lat){return lakePolys.some(p=>lon>=p.b[0]&&lon<=p.b[2]&&lat>=p.b[1]&&lat<=p.b[3]&&p.rings.reduce((v,r)=>v!==inside(lon,lat,r),false));}
function mask(t,id){const {size,bits}=t.coastMask,packed=Buffer.from(bits,'base64'),png=new PNG({width:size,height:size});const b=t.bounds;for(let i=0;i<size*size;i++){const c=packed[i>>3]&(1<<(i%8))?255:0;png.data.set([c,c,c,255],i*4);}for(const p of lakePolys){if(p.b[0]>b.east||p.b[2]<b.west||p.b[1]>b.north||p.b[3]<b.south)continue;const x0=Math.max(0,Math.floor((p.b[0]-b.west)/(b.east-b.west)*(size-1))),x1=Math.min(size-1,Math.ceil((p.b[2]-b.west)/(b.east-b.west)*(size-1))),y0=Math.max(0,Math.floor((b.north-p.b[3])/(b.north-b.south)*(size-1))),y1=Math.min(size-1,Math.ceil((b.north-p.b[1])/(b.north-b.south)*(size-1)));for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++){const lon=b.west+x/(size-1)*(b.east-b.west),lat=b.north-y/(size-1)*(b.north-b.south);if(p.rings.reduce((v,r)=>v!==inside(lon,lat,r),false))png.data.set([0,0,0,255],(y*size+x)*4);}}fs.writeFileSync(path.join(out,`data/tiles/${id}-coast.png`),PNG.sync.write(png));}
function mesh(t,id,n,parent){const count=(n+1)**2,pos=new Float32Array(count*3),normal=new Float32Array(count*3),uv=new Float32Array(count*2),uv2=new Float32Array(count*2),colors=new Float32Array(count*4),b=t.bounds;for(let y=0;y<=n;y++)for(let x=0;x<=n;x++){const i=y*(n+1)+x,lon=b.west+x/n*(b.east-b.west),lat=b.north-y/n*(b.north-b.south),p=project(lon,lat);let h=Math.max(0.001,sample(t,lon,lat)/1000*1.5),ph=parent?Math.max(.001,sample(parent,lon,lat)/1000*1.5):h;pos.set([p[0],h,p[1]],i*3);uv.set([(lon+12)/87,(62-lat)/50],i*2);uv2.set([x/n,y/n],i*2);colors.set([ph,0,0,1],i*4);}
for(let y=0;y<=n;y++)for(let x=0;x<=n;x++){const i=y*(n+1)+x,l=y*(n+1)+Math.max(0,x-1),r=y*(n+1)+Math.min(n,x+1),u=Math.max(0,y-1)*(n+1)+x,d=Math.min(n,y+1)*(n+1)+x;const dx=pos[r*3]-pos[l*3],dz=pos[d*3+2]-pos[u*3+2],hx=(pos[r*3+1]-pos[l*3+1])/Math.max(.00001,dx),hz=(pos[d*3+1]-pos[u*3+1])/Math.max(.00001,dz),len=Math.hypot(hx,1,hz);normal.set([-hx/len,1/len,-hz/len],i*3);}
const indices=new Uint32Array(n*n*6);for(let y=0,k=0;y<n;y++)for(let x=0;x<n;x++){const a=y*(n+1)+x;indices.set([a,a+1,a+n+1,a+1,a+n+2,a+n+1],k);k+=6;}
const header=Buffer.alloc(8);header.writeUInt32LE(count);header.writeUInt32LE(indices.length,4);const file=`data/tiles/${id}-${n}.bin`;fs.writeFileSync(path.join(out,file),Buffer.concat([header,...[pos,normal,uv,uv2,colors,indices].map(v=>Buffer.from(v.buffer))]));return file;}
const descriptors=[];
function exportTile(t,id,kind,n){if(!process.argv.includes('--meshes-only'))mask(t,id);const file=mesh(t,id,n,kind==='context'?null:context);const heights=`data/tiles/${id}.height`;fs.writeFileSync(path.join(out,heights),Buffer.from(new Float32Array(t.elevations).buffer));descriptors.push({id,kind,bounds:t.bounds,width:t.width,height:t.height,heights,mesh:file,coast:`data/tiles/${id}-coast.png`,grid:n,sourceSpacing:kind==='regional'?'650–870 m':'2–19 km'});}
exportTile(context,'context','context',512);
for(const d of world.tiles.filter(t=>t.kind==='world-regional')){exportTile(read('public'+d.url),d.id,'world',48);}
for(const d of italy.tiles.filter(t=>t.kind==='regional')){exportTile(read('public'+d.url),d.id,'regional',128);}
const atlas=read('public/data/settlement-atlas.json').records,approved=read('public/data/approved-settlements.json').records;
const sites=[...atlas.filter(s=>['existing','expansion'].includes(s.selection)),...approved.map(p=>p.atlas)].map(s=>{const [x,z]=project(s.coordinates.lon,s.coordinates.lat);return {id:s.id,locationId:s.locationId,key:s.key,name:s.historicalName,lon:s.coordinates.lon,lat:s.coordinates.lat,x,z,sources:s.sources};});
if(sites.length!==35||new Set(sites.map(x=>x.id)).size!==35)throw Error('Settlement identity count mismatch');
const catana=sites.find(s=>s.key==='catana');if(catana.lon!==15.088142||catana.lat!==37.502959)throw Error('Catana changed');
json('data/sites.json',sites);
json('data/settlement-provenance.json',{atlas:read('public/data/settlement-atlas.json'),approved:read('public/data/approved-settlements.json'),purpose:'Full source metadata retained alongside derived display sites. Canonical files remain unchanged.'});
fs.copyFileSync(path.join(repo,'public/data/research-locations.json'),path.join(out,'data/research-locations.json'));
fs.copyFileSync(path.join(repo,'public/data/regional-ecology/surface.png'),path.join(out,'data/surface.png'));
json('data/hydrology.json',{rivers:context.features.rivers_lake_centerlines,lakes:water.records});
// Lake geometry is derived from existing polygons. Level estimates follow the viewer's
// recurring-height/shore-median approach; estimates are not historical observations.
const lakes=[];
for(const p of lakePolys){const vals=[];const b=context.bounds;
 for(let y=Math.max(0,Math.floor((b.north-p.b[3])/(b.north-b.south)*(context.height-1)));y<=Math.min(context.height-1,Math.ceil((b.north-p.b[1])/(b.north-b.south)*(context.height-1)));y++)for(let x=Math.max(0,Math.floor((p.b[0]-b.west)/(b.east-b.west)*(context.width-1)));x<=Math.min(context.width-1,Math.ceil((p.b[2]-b.west)/(b.east-b.west)*(context.width-1)));x++){const lon=b.west+x/(context.width-1)*(b.east-b.west),lat=b.north-y/(context.height-1)*(b.north-b.south);if(p.rings.reduce((v,r)=>v!==inside(lon,lat,r),false))vals.push(Math.round(sample(context,lon,lat)));}
 let metres;if(vals.length){const hist=new Map();for(const v of vals)hist.set(v,(hist.get(v)??0)+1);metres=[...hist].sort((a,b)=>b[1]-a[1]||a[0]-b[0])[0][0];}else{const shore=p.rings[0].map(([lon,lat])=>sample(context,lon,lat)).sort((a,b)=>a-b);metres=shore[Math.floor(shore.length/2)];}
 const rings=p.rings.map(r=>r.slice(0,-1).map(([lon,lat])=>new Vector2(...project(lon,lat))));if(rings[0].length<3)continue;const vertices=rings.flat().map(v=>[v.x,metres*.0015+.002,v.y]);const faces=ShapeUtils.triangulateShape(rings[0],rings.slice(1));lakes.push({id:p.id,metres,vertices,indices:faces.flat()});
}
json('data/lakes.json',lakes);
const ocean=PNG.sync.read(fs.readFileSync(path.join(out,'data/tiles/context-coast.png')));
for(const p of lakePolys){const size=ocean.width,b=context.bounds,x0=Math.max(0,Math.floor((p.b[0]-b.west)/(b.east-b.west)*(size-1))),x1=Math.min(size-1,Math.ceil((p.b[2]-b.west)/(b.east-b.west)*(size-1))),y0=Math.max(0,Math.floor((b.north-p.b[3])/(b.north-b.south)*(size-1))),y1=Math.min(size-1,Math.ceil((b.north-p.b[1])/(b.north-b.south)*(size-1)));for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++){const lon=b.west+x/(size-1)*(b.east-b.west),lat=b.north-y/(size-1)*(b.north-b.south);if(inside(lon,lat,p.rings[0]))ocean.data.set([255,255,255,255],(y*size+x)*4);}}
fs.writeFileSync(path.join(out,'data/ocean-exclusion.png'),PNG.sync.write(ocean));
json('data/world.json',{bounds,origin,units:'kilometres; Y up; Z south',heightScale:1.5,tiles:descriptors,sites:35,research:687,sourceResolution:'Existing local geographic data only; no new datasets or fictional elevations',terrainChoice:'Original bounded meshes reuse project projection and DEM grids; Terrain3D evaluated but no addon download authorized or required for this checkpoint.'});
await import('./materials.mjs');
for(const p of ['public/data/italy-terrain/ATTRIBUTION.txt','public/data/italy-terrain/GSHHG-LICENSE.txt','public/data/italy-terrain/COPYINGv3','public/data/italy-terrain/COPYING.LESSERv3','public/data/world-terrain/Mapzen-ATTRIBUTION.md'])fs.copyFileSync(path.join(repo,p),path.join(out,'licenses',path.basename(p)));
const changed=tracked.filter(x=>hash(x.path)!==x.sha256);if(changed.length)throw Error('Protected data changed: '+JSON.stringify(changed));
json('evidence/geographic-integrity.json',{protectedFiles:tracked.length,changed,sites:sites.length,research:read('public/data/research-locations.json').records.length,catana,akragas:sites.find(s=>s.key==='akragas'),projectionChecks:sites.map(s=>({id:s.id,lon:s.lon,lat:s.lat,x:s.x,z:s.z})),adapter:'Reuses original projectLocalMapMetres directly; source elevations and coordinates untouched.'});
console.log(JSON.stringify({tiles:descriptors.length,sites:sites.length,research:687,protectedFiles:tracked.length,changed:changed.length}));
