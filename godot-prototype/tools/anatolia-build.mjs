// Bounded physical/rendering derivatives. Never writes research, owners or political polygons.
import fs from 'node:fs';
import crypto from 'node:crypto';
import {fromUrl} from 'geotiff';
import {PNG} from 'pngjs';
import {unzipSync} from 'fflate';
import {read as readShape} from 'shapefile';
import {projectLocalMapMetres} from '../../src/infrastructure/world-geography.ts';
const out='godot-prototype/data/anatolia',cache='data/geography/source-cache/anatolia';
fs.mkdirSync(out,{recursive:true});fs.mkdirSync(cache,{recursive:true});fs.writeFileSync(out+'/.gdignore','');
const read=p=>JSON.parse(fs.readFileSync(p)),hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const bounds={west:25,east:43,south:35,north:43};
const smooth=(a,b,x)=>{let t=Math.max(0,Math.min(1,(x-a)/(b-a)));return t*t*(3-2*t);};
// Visual coverage only: feather away from Thrace, Caucasus and northern Syria.
function weight(x,y){const south=35.8+1.5*smooth(35.8,39.5,x),north=40.4+1.5*smooth(28.6,29.2,x);return smooth(25.8,26.2,x)*(1-smooth(42.2,42.6,x))*smooth(south-.2,south+.2,y)*(1-smooth(north-.2,north+.2,y));}
const tiles=new Map(),sources=[],jobs=[];
for(let lat=35;lat<43;lat++)for(let lon=25;lon<43;lon++)if([0,.5,1].some(dx=>[0,.5,1].some(dy=>weight(lon+dx,lat+dy)>.001)))jobs.push({lon,lat});
async function get({lon,lat}){
 const id=`N${lat}E${lon}`,file=`${cache}/${id}.json`,missing=`${cache}/${id}.missing.json`,published=`public/data/regional-details/detail-greece-${id}.json`;
 if(fs.existsSync(missing)){sources.push(read(missing));return;}
 let raw,path=[published,file].find(p=>fs.existsSync(p));
 if(path)raw=read(path);else{
  const n=`Copernicus_DSM_COG_10_N${lat}_00_E${String(lon).padStart(3,'0')}_00_DEM`,url=`https://copernicus-dem-30m.s3.amazonaws.com/${n}/${n}.tif`;
  const head=await fetch(url,{method:'HEAD'});
  if(head.status===404){const note={id,url,notice:'No land DSM tile; retained existing world terrain fallback.'};fs.writeFileSync(missing,JSON.stringify(note));sources.push(note);return;}
  if(!head.ok)throw Error(`${id} HTTP ${head.status}`);
  const t=await fromUrl(url),r=await t.readRasters({bbox:[lon,lat,lon+1,lat+1],width:129,height:129,interleave:true,resampleMethod:'bilinear'});
  raw={bounds:{west:lon,east:lon+1,south:lat,north:lat+1},width:129,height:129,elevations:Array.from(r,v=>Math.round(v*10)/10),source:url};
  if(raw.elevations.length!==16641||raw.elevations.some(v=>!Number.isFinite(v)||v< -500||v>9000))throw Error('Invalid DEM '+id);
  path=file;fs.writeFileSync(file,JSON.stringify(raw));
 }
 const at=(x,y)=>raw.elevations[Math.max(0,Math.min(128,y))*129+Math.max(0,Math.min(128,x))];
 const elevations=path===published?Float32Array.from(raw.elevations):Float32Array.from(raw.elevations,(_,i)=>{const x=(i%129)/128*129-.5,y=Math.floor(i/129)/128*129-.5,a=Math.floor(x),b=Math.floor(y),u=x-a,v=y-b;return (at(a,b)*(1-u)+at(a+1,b)*u)*(1-v)+(at(a,b+1)*(1-u)+at(a+1,b+1)*u)*v;});
 tiles.set(`${lon},${lat}`,{...raw,elevations});sources.push({id,path,sha256:hash(fs.readFileSync(path)),url:raw.source});console.log('ANATOLIA_SOURCE',id);
}
for(let i=0;i<jobs.length;i+=4)await Promise.all(jobs.slice(i,i+4).map(get));
// Raw overview sampling clamps each tile edge independently. Reconcile shared
// geographic vertices just as the existing published Greek importer does.
const edges=new Map();let maxRawEdgeDifferenceMetres=0;
for(const t of tiles.values())for(let y=0;y<129;y++)for(let x=0;x<129;x++)if(x===0||x===128||y===0||y===128){const key=`${t.bounds.west*128+x}/${t.bounds.north*128-y}`,e=edges.get(key)??[];e.push({t,i:y*129+x});edges.set(key,e);}
for(const e of edges.values())if(e.length>1){const values=e.map(p=>p.t.elevations[p.i]);maxRawEdgeDifferenceMetres=Math.max(maxRawEdgeDifferenceMetres,Math.max(...values)-Math.min(...values));const mean=values.reduce((a,b)=>a+b,0)/values.length;for(const p of e)p.t.elevations[p.i]=mean;}
const world=read('godot-prototype/data/world.json').tiles.filter(t=>t.kind==='world'&&t.bounds.west<43&&t.bounds.east>25&&t.bounds.south<43&&t.bounds.north>35).map(t=>read('public/data/world-terrain/'+t.id+'.json'));
function sample(t,x,y){const b=t.bounds,px=Math.max(0,Math.min(t.width-1,(x-b.west)/(b.east-b.west)*(t.width-1))),py=Math.max(0,Math.min(t.height-1,(b.north-y)/(b.north-b.south)*(t.height-1))),i=Math.min(t.width-2,Math.floor(px)),j=Math.min(t.height-2,Math.floor(py)),u=px-i,v=py-j,a=t.elevations[j*t.width+i],b1=t.elevations[j*t.width+i+1],c=t.elevations[(j+1)*t.width+i],d=t.elevations[(j+1)*t.width+i+1];return (a*(1-u)+b1*u)*(1-v)+(c*(1-u)+d*u)*v;}
function fallback(x,y){return sample(world.find(t=>x>=t.bounds.west&&x<=t.bounds.east&&y>=t.bounds.south&&y<=t.bounds.north),x,y);}
function source(x,y){const t=tiles.get(`${Math.min(42,Math.floor(x))},${Math.min(42,Math.floor(y))}`);return t?sample(t,x,y):fallback(x,y);}
const width=2305,height=1025,heights=new Float32Array(width*height);
for(let y=0;y<height;y++)for(let x=0;x<width;x++)heights[y*width+x]=source(25+x/128,43-y/128);
fs.writeFileSync(out+'/source-metres.bin',Buffer.from(heights.buffer));
const normals=new PNG({width,height});
function project(x,y){const p=projectLocalMapMetres({lon:x,lat:y},{lon:13.5,lat:41.5});return [p.east*.001,-p.north*.001];}
function normal(x,y){const dx=1/128,dy=1/128,l=project(x-dx,y),r=project(x+dx,y),u=project(x,y+dy),d=project(x,y-dy),hx=(source(Math.min(43,x+dx),y)-source(Math.max(25,x-dx),y))*.0015/(r[0]-l[0]),hz=(source(x,Math.max(35,y-dy))-source(x,Math.min(43,y+dy)))*.0015/(d[1]-u[1]),n=Math.hypot(hx,1,hz);return [-hx/n,1/n,-hz/n];}
for(let y=0;y<height;y++)for(let x=0;x<width;x++){const n=normal(25+x/128,43-y/128),i=y*width+x;normals.data.set([...n.map(v=>Math.round((v*.5+.5)*255)),255],i*4);}
fs.writeFileSync(out+'/normals.png',PNG.sync.write(normals));
function originalHeight(x,y){const t=world.find(t=>x>=t.bounds.west&&x<=t.bounds.east&&y>=t.bounds.south&&y<=t.bounds.north),b=t.bounds,px=(x-b.west)/(b.east-b.west)*128,py=(b.north-y)/(b.north-b.south)*128,i=Math.min(127,Math.max(0,Math.floor(px))),j=Math.min(127,Math.max(0,Math.floor(py))),u=px-i,v=py-j,at=(a,c)=>Math.max(.001,t.elevations[c*129+a]*.0015),a=at(i,j),bb=at(i+1,j),c=at(i,j+1),d=at(i+1,j+1);return u+v<1?a+(bb-a)*u+(c-a)*v:d+(c-d)*(1-u)+(bb-d)*(1-v);}
const farHeights=new Float32Array(577*257);
for(let y=0;y<257;y++)for(let x=0;x<577;x++){const lon=25+x/32,lat=43-y/32,old=originalHeight(lon,lat);farHeights[y*577+x]=old+(Math.max(.001,source(lon,lat)*.0015)-old)*weight(lon,lat);}
fs.writeFileSync(out+'/far-heights.bin',Buffer.from(farHeights.buffer));
function farHeight(x,y){const px=(x-25)*32,py=(43-y)*32,i=Math.min(575,Math.max(0,Math.floor(px))),j=Math.min(255,Math.max(0,Math.floor(py))),u=px-i,v=py-j,a=farHeights[j*577+i],b=farHeights[j*577+i+1],c=farHeights[(j+1)*577+i],d=farHeights[(j+1)*577+i+1];return u+v<1?a+(b-a)*u+(c-a)*v:d+(c-d)*(1-u)+(b-d)*(1-v);}
function mesh(b,rate,file,near=false){const w=(b.east-b.west)*rate+1,h=(b.north-b.south)*rate+1,count=w*h,pos=new Float32Array(count*3),norm=new Float32Array(count*3),uv=new Float32Array(count*2),uv2=new Float32Array(count*2),colors=new Float32Array(count*4);
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){const i=y*w+x,lon=b.west+x/rate,lat=b.north-y/rate,p=project(lon,lat),edge=near?smooth(0,.08,Math.min(lon-b.west,b.east-lon,lat-b.south,b.north-lat))*weight(lon,lat):1,base=farHeight(lon,lat),z=near?base+(Math.max(.001,source(lon,lat)*.0015)-base)*edge:base;pos.set([p[0],z,p[1]],i*3);norm.set(normal(lon,lat),i*3);uv.set([(lon+12)/87,(62-lat)/50],i*2);colors.set([z,0,0,1],i*4);}
 const ix=new Uint32Array((w-1)*(h-1)*6);for(let y=0,k=0;y<h-1;y++)for(let x=0;x<w-1;x++){const a=y*w+x;ix.set([a,a+1,a+w,a+1,a+w+1,a+w],k);k+=6;}
 const header=Buffer.alloc(8);header.writeUInt32LE(count);header.writeUInt32LE(ix.length,4);fs.writeFileSync(out+'/'+file,Buffer.concat([header,...[pos,norm,uv,uv2,colors,ix].map(a=>Buffer.from(a.buffer))]));return {vertices:count,triangles:ix.length/3};}
const far=mesh(bounds,32,'far.bin'),details=[];
for(const {lon,lat} of jobs){const b={west:lon,east:lon+1,south:lat,north:lat+1},file=`near-${lat}-${lon}.bin`;details.push({id:`${lat}-${lon}`,bounds:b,mesh:'data/anatolia/'+file,...mesh(b,128,file,true)});}
// Reuse precisely the existing scanline precedence and ID assignment, not new polygons.
const build=fs.readFileSync('godot-prototype/tools/region-foundation-build.mjs','utf8'),fn=build.slice(build.indexOf('function rasterize('),build.indexOf('rasterize(2048')),data=read('godot-prototype/data/northern-italy-reference/scenario-278.json');
new Function('fs','PNG','data','out',fn+"rasterize(4608,2048,25,43,18,8,'territory-ids.png');")(fs,PNG,data,out);
const archive=fs.readFileSync('data/geography/source-cache/gshhg.zip'),zip=unzipSync(archive,{filter:f=>/GSHHS_f_L1\.(shp|dbf)$|^(LICENSE.TXT|COPYINGv3|COPYING.LESSERv3)$/.test(f.name)});
for(const name of ['LICENSE.TXT','COPYINGv3','COPYING.LESSERv3'])if(zip[name])fs.writeFileSync(out+'/GSHHG-'+name,zip[name]);
const land=await readShape(zip['GSHHS_shp/f/GSHHS_f_L1.shp'].buffer,zip['GSHHS_shp/f/GSHHS_f_L1.dbf'].buffer);
function clip(ring){let p=ring;for(const [axis,v,sign] of [[0,25,1],[0,43,-1],[1,35,1],[1,43,-1]]){const q=[];for(let i=0;i<p.length;i++){const a=p[i],b=p[(i+1)%p.length],ai=(a[axis]-v)*sign>=0,bi=(b[axis]-v)*sign>=0;if(ai)q.push(a);if(ai!==bi){const t=(v-a[axis])/(b[axis]-a[axis]);q.push([a[0]+t*(b[0]-a[0]),a[1]+t*(b[1]-a[1])]);}}p=q;}return p;}
const mw=9217,mh=4097,mask=new Uint8Array(mw*mh);
function fill(rings,buffer,value){const rr=rings.map(clip).filter(r=>r.length>2).map(r=>r.map(([x,y])=>[(x-25)*512,(43-y)*512]));if(!rr.length)return;let lo=mh-1,hi=0;for(const r of rr)for(const p of r){lo=Math.min(lo,p[1]);hi=Math.max(hi,p[1]);}for(let y=Math.max(0,Math.ceil(lo));y<=Math.min(mh-1,Math.floor(hi));y++){const xs=[];for(const r of rr)for(let i=0,j=r.length-1;i<r.length;j=i++){const a=r[i],b=r[j];if((a[1]>y)!==(b[1]>y))xs.push(a[0]+(y-a[1])*(b[0]-a[0])/(b[1]-a[1]));}xs.sort((a,b)=>a-b);for(let i=0;i+1<xs.length;i+=2)buffer.fill(value,y*mw+Math.max(0,Math.ceil(xs[i])),y*mw+Math.min(mw,Math.floor(xs[i+1])+1));}}
for(const f of land.features)for(const p of f.geometry.type==='MultiPolygon'?f.geometry.coordinates:[f.geometry.coordinates])fill(p,mask,255);
const ocean=mask.slice();for(const lake of read('godot-prototype/data/hydrology.json').lakes){fill(lake.rings,mask,0);fill(lake.rings,ocean,255);}
function grey(file,bytes,w=mw,h=mh){const p=new PNG({width:w,height:h});for(let i=0;i<bytes.length;i++)p.data.set([bytes[i],bytes[i],bytes[i],255],i*4);fs.writeFileSync(out+'/'+file,PNG.sync.write(p,{colorType:0}));}
grey('land.png',mask);grey('ocean.png',ocean);
const sw=2305,sh=1025,dist=new Float32Array(sw*sh),d=111.195/128,di=Math.SQRT2*d;
for(let y=0;y<sh;y++)for(let x=0;x<sw;x++)dist[y*sw+x]=ocean[y*4*mw+x*4]>127?0:64;
for(let y=0;y<sh;y++)for(let x=0;x<sw;x++){const i=y*sw+x;let v=dist[i];if(x)v=Math.min(v,dist[i-1]+d);if(y)v=Math.min(v,dist[i-sw]+d);if(x&&y)v=Math.min(v,dist[i-sw-1]+di);dist[i]=v;}
for(let y=sh-1;y>=0;y--)for(let x=sw-1;x>=0;x--){const i=y*sw+x;let v=dist[i];if(x+1<sw)v=Math.min(v,dist[i+1]+d);if(y+1<sh)v=Math.min(v,dist[i+sw]+d);if(x+1<sw&&y+1<sh)v=Math.min(v,dist[i+sw+1]+di);dist[i]=v;}
grey('shore.png',Uint8Array.from(dist,v=>Math.min(255,Math.round(v*4))),sw,sh);
fs.writeFileSync(out+'/manifest.json',JSON.stringify({bounds,width,height,heightScale:1.5,far,details,sharedEdges:{reconciled:true,maxRawEdgeDifferenceMetres},sources:sources.sort((a,b)=>a.id.localeCompare(b.id)),coast:{archive:'data/geography/source-cache/gshhg.zip',sha256:hash(archive)},notice:'Modern physical presentation, not reconstructed ancient coasts. Static source polygons and initial owners unchanged. Close geometry streamed by geographic tile.'},null,2));
console.log('ANATOLIA_BUILD_OK',sources.length,far,details.length);
