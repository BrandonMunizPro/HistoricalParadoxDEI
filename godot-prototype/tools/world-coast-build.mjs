// Source-derived sea coast catalog. Terrain classes are visual suitability,
// never sediment surveys or reconstructed ancient beaches.
import fs from 'node:fs';
import crypto from 'node:crypto';
import {unzipSync} from 'fflate';
import {read as readShape} from 'shapefile';
import {PNG} from 'pngjs';
import {projectLocalMapMetres,unprojectLocalMapMetres} from '../../src/infrastructure/world-geography.ts';
const root='godot-prototype/data/',out=root+'world-coasts';fs.mkdirSync(out,{recursive:true});fs.writeFileSync(out+'/.gdignore','');
const read=p=>JSON.parse(fs.readFileSync(root+p)),project=p=>{const q=projectLocalMapMetres({lon:p[0],lat:p[1]},{lon:13.5,lat:41.5});return [q.east/1000,-q.north/1000];};
const regions=[...Object.keys(read('eastern-regions.json').regions),...read('africa-regions.json').order,'hispania',...read('northern-regions.json').order,...read('frontier-regions.json').order];
const grids=regions.map(r=>{const m=read(r+'/manifest.json'),bytes=fs.readFileSync(root+r+'/source-metres.bin');return {...m,h:new Float32Array(bytes.buffer,bytes.byteOffset,bytes.length/4)};});
const worldTiles=read('world.json').tiles.filter(t=>t.kind==='world'),worldCache=new Map();
function elevation(lon,lat){
 let g=grids.find(g=>lon>=g.bounds.west&&lon<=g.bounds.east&&lat>=g.bounds.south&&lat<=g.bounds.north);
 if(!g){const t=worldTiles.find(t=>lon>=t.bounds.west&&lon<=t.bounds.east&&lat>=t.bounds.south&&lat<=t.bounds.north);if(!t)return 0;if(!worldCache.has(t.id))worldCache.set(t.id,JSON.parse(fs.readFileSync('public/data/world-terrain/'+t.id+'.json')));g=worldCache.get(t.id);}
 const b=g.bounds,x=Math.max(0,Math.min(g.width-1.00001,(lon-b.west)/(b.east-b.west)*(g.width-1))),y=Math.max(0,Math.min(g.height-1.00001,(b.north-lat)/(b.north-b.south)*(g.height-1))),i=Math.floor(x),j=Math.floor(y),u=x-i,v=y-j,h=g.h??g.elevations;
 return Math.max(0,(h[j*g.width+i]*(1-u)+h[j*g.width+i+1]*u)*(1-v)+(h[(j+1)*g.width+i]*(1-u)+h[(j+1)*g.width+i+1]*u)*v);
}
const eco=PNG.sync.read(fs.readFileSync(root+'environment/river-corridors.png'));
const wetness=(lon,lat)=>{const x=Math.max(0,Math.min(eco.width-1,Math.round((lon+12)/87*(eco.width-1)))),y=Math.max(0,Math.min(eco.height-1,Math.round((62-lat)/50*(eco.height-1))));return eco.data[(y*eco.width+x)*4]/255;};
function simplify(p,t=.018){if(p.length<3)return p;const a=p[0],b=p.at(-1),dx=b[0]-a[0],dy=b[1]-a[1];let best=0,k=0;for(let i=1;i<p.length-1;i++){const u=Math.max(0,Math.min(1,((p[i][0]-a[0])*dx+(p[i][1]-a[1])*dy)/(dx*dx+dy*dy||1))),d=Math.hypot(p[i][0]-a[0]-u*dx,p[i][1]-a[1]-u*dy);if(d>best){best=d;k=i;}}return best>t?[...simplify(p.slice(0,k+1),t).slice(0,-1),...simplify(p.slice(k),t)]:[a,b];}
const smooth=(a,b,x)=>{const t=Math.max(0,Math.min(1,(x-a)/(b-a)));return t*t*(3-2*t);};
const archive=fs.readFileSync('data/geography/source-cache/gshhg.zip'),zip=unzipSync(archive,{filter:f=>/GSHHS_f_L1\.(shp|dbf)$|^(LICENSE.TXT|COPYINGv3|COPYING.LESSERv3)$/.test(f.name)});
const features=await readShape(zip['GSHHS_shp/f/GSHHS_f_L1.shp'].buffer,zip['GSHHS_shp/f/GSHHS_f_L1.dbf'].buffer);
const rows=[],cells={},counts={beach:0,rock:0,bank:0};let runs=0,totalKm=0;
function emit(source,orientation){
 if(source.length<2)return;
 let p=simplify(source.map(project));if(p.length<2)return;
 const rounded=[p[0]];for(let i=1;i<p.length;i++){const a=p[i-1],b=p[i];rounded.push(a.map((v,j)=>v*.75+b[j]*.25),a.map((v,j)=>v*.25+b[j]*.75));}rounded.push(p.at(-1));p=rounded;
 let along=0;
 for(let i=1;i<p.length;i++){
  const a=p[i-1],b=p[i],dx=b[0]-a[0],dz=b[1]-a[1],len=Math.hypot(dx,dz);if(len<.001)continue;
  const nx=dz/len*orientation,nz=-dx/len*orientation,c=[(a[0]+b[0])/2,(a[1]+b[1])/2];
  const probe=unprojectLocalMapMetres((c[0]+nx*.18)*1000,-(c[1]+nz*.18)*1000,{lon:13.5,lat:41.5});
  const h=elevation(probe.lon,probe.lat),wet=wetness(probe.lon,probe.lat);const rock=smooth(7,24,h),bank=(1-rock)*(1-smooth(2,5,h))*smooth(.15,.6,wet),beach=(1-rock)*(1-bank);
  const id=rows.length;rows.push([a[0],a[1],b[0],b[1],nx,nz,along,len,beach,rock,0,0]);along+=len;totalKm+=len;counts[rock>.5?'rock':bank>.5?'bank':'beach']++;
  for(let y=Math.floor(Math.min(a[1],b[1])-.25);y<=Math.floor(Math.max(a[1],b[1])+.25);y++)for(let x=Math.floor(Math.min(a[0],b[0])-.25);x<=Math.floor(Math.max(a[0],b[0])+.25);x++){const key=x+','+y;(cells[key]??=[]).push(id);}
 }
 runs++;
}
for(const feature of features.features)for(const poly of feature.geometry.type==='MultiPolygon'?feature.geometry.coordinates:[feature.geometry.coordinates])for(const ring of poly){
 let area=0;for(let i=1;i<ring.length;i++)area+=ring[i-1][0]*ring[i][1]-ring[i][0]*ring[i-1][1];const orientation=area>=0?1:-1;let run=[];
 for(let i=1;i<ring.length;i++){const a=ring[i-1],b=ring[i];const valid=Math.max(a[0],b[0])>=-12&&Math.min(a[0],b[0])<=75&&Math.max(a[1],b[1])>=12&&Math.min(a[1],b[1])<=62&&Math.abs(a[0]-b[0])<2&&Math.abs(a[1]-b[1])<2;if(valid){if(!run.length)run.push(a);run.push(b);}else if(run.length){emit(run,orientation);run=[];}}
 if(run.length)emit(run,orientation);
}
const chunkSize=200000,chunks=[];const digest=crypto.createHash('sha256');
for(let start=0;start<rows.length;start+=chunkSize){const count=Math.min(chunkSize,rows.length-start),floats=new Float32Array(count*12);for(let i=0;i<count;i++)floats.set(rows[start+i],i*12);const bytes=Buffer.from(floats.buffer),file='segments-'+chunks.length+'.bin';fs.writeFileSync(out+'/'+file,bytes);digest.update(bytes);chunks.push({file,start,count});}
const headers=new Int32Array(Object.keys(cells).length*4),ids=[];let cell=0;
for(const [key,list] of Object.entries(cells)){const [x,y]=key.split(',').map(Number);headers.set([x,y,ids.length,list.length],cell*4);ids.push(...list);cell++;}
fs.writeFileSync(out+'/cells.bin',Buffer.from(headers.buffer));fs.writeFileSync(out+'/indices.bin',Buffer.from(Int32Array.from(ids).buffer));
for(const old of ['segments.bin','index.json'])if(fs.existsSync(out+'/'+old))fs.unlinkSync(out+'/'+old);
for(const name of ['LICENSE.TXT','COPYINGv3','COPYING.LESSERv3'])if(zip[name])fs.writeFileSync(out+'/GSHHG-'+name,zip[name]);
const manifest={version:1,strideFloats:12,chunkSize,chunks,segments:rows.length,runs,totalKm,counts,cells:Object.keys(cells).length,extent:[-12,12,75,62],source:'GSHHG 2.3.7 full-resolution L1 sea coasts; source DEM and existing river corridors guide illustrative shore suitability.',archiveSha256:crypto.createHash('sha256').update(archive).digest('hex'),segmentsSha256:digest.digest('hex'),notice:'No invented campaign-edge coasts. No lake or river polygons are relabeled as sea. Simplified within 18 metres before one corner-rounding pass. Beach/rock/bank classes are rendering proxies, not surveyed sediment or ancient coastline evidence.'};
fs.writeFileSync(out+'/manifest.json',JSON.stringify(manifest,null,2));console.log('WORLD_COAST_BUILT',JSON.stringify(manifest));
