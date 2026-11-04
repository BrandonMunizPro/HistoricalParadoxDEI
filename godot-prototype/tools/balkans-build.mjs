// Presentation derivatives only. Political geometry, research and settlement coordinates are read-only.
import fs from 'node:fs';
import crypto from 'node:crypto';
import {fromUrl} from 'geotiff';
import {PNG} from 'pngjs';
import {unzipSync} from 'fflate';
import {read as readShape} from 'shapefile';
import {projectLocalMapMetres} from '../../src/infrastructure/world-geography.ts';
const out='godot-prototype/data/balkans',cache='data/geography/source-cache/balkans';
fs.mkdirSync(out,{recursive:true});fs.mkdirSync(cache,{recursive:true});fs.writeFileSync(out+'/.gdignore','');
const read=p=>JSON.parse(fs.readFileSync(p)),digest=b=>crypto.createHash('sha256').update(b).digest('hex');
const settings=read('godot-prototype/data/cartographic-rollout.json');
const smooth=(a,b,x)=>{const t=Math.max(0,Math.min(1,(x-a)/(b-a)));return t*t*(3-2*t);};
function weight(x,y){let w=0;for(const r of settings.extensionRects)w=Math.max(w,smooth(r[0]-.2,r[0]+.2,x)*(1-smooth(r[2]-.2,r[2]+.2,x))*smooth(r[1]-.2,r[1]+.2,y)*(1-smooth(r[3]-.2,r[3]+.2,y)));for(const c of settings.extensionCorridors){const ax=c[0]*.75,ay=c[1],dx=(c[2]-c[0])*.75,dy=c[3]-c[1],t=Math.max(0,Math.min(1,((x*.75-ax)*dx+(y-ay)*dy)/(dx*dx+dy*dy)));w=Math.max(w,1-smooth(c[4]-.15,c[4]+.15,Math.hypot(x*.75-ax-dx*t,y-ay-dy*t)));}return w;}
const bounds={west:14,east:25,south:36,north:46},tiles=new Map(),sources=[];
const world=read('godot-prototype/data/world.json').tiles.filter(t=>t.kind==='world'&&t.bounds.west<25&&t.bounds.east>14&&t.bounds.south<46&&t.bounds.north>36).map(t=>read('public/data/world-terrain/'+t.id+'.json'));
function sample(t,x,y){const b=t.bounds,px=Math.max(0,Math.min(t.width-1,(x-b.west)/(b.east-b.west)*(t.width-1))),py=Math.max(0,Math.min(t.height-1,(b.north-y)/(b.north-b.south)*(t.height-1))),i=Math.min(t.width-2,Math.floor(px)),j=Math.min(t.height-2,Math.floor(py)),u=px-i,v=py-j,a=t.elevations[j*t.width+i],c=t.elevations[(j+1)*t.width+i],b1=t.elevations[j*t.width+i+1],d=t.elevations[(j+1)*t.width+i+1];return (a*(1-u)+b1*u)*(1-v)+(c*(1-u)+d*u)*v;}
function fallback(x,y){return sample(world.find(t=>x>=t.bounds.west&&x<=t.bounds.east&&y>=t.bounds.south&&y<=t.bounds.north),x,y);}
const tasks=[];for(let lat=36;lat<46;lat++)for(let lon=14;lon<25;lon++)if([0,.5,1].some(dx=>[0,.5,1].some(dy=>weight(lon+dx,lat+dy)>0)))tasks.push({lon,lat});
async function get({lon,lat}){
 const id=`N${lat}E${lon}`,greek=`public/data/regional-details/detail-greece-${id}.json`,old=`data/geography/source-cache/cop-${id}.json`,file=`${cache}/${id}.json`;
 let raw,path=[greek,old,file].find(p=>fs.existsSync(p));
 if(path)raw=read(path);else{
  const name=`Copernicus_DSM_COG_10_N${lat}_00_E${String(lon).padStart(3,'0')}_00_DEM`,url=`https://copernicus-dem-30m.s3.amazonaws.com/${name}/${name}.tif`;
  console.log('BALKANS_FETCH',id);
  const response=await fetch(url,{method:'HEAD'});
  if(response.status===404){sources.push({id,url,notice:'No Copernicus land tile at this coordinate; existing world source retained.'});return;}
  if(!response.ok)throw Error('DEM '+id+' HTTP '+response.status);
  const tif=await fromUrl(url),r=await tif.readRasters({bbox:[lon,lat,lon+1,lat+1],width:129,height:129,resampleMethod:'bilinear',interleave:true});
  raw={bounds:{west:lon,east:lon+1,south:lat,north:lat+1},width:129,height:129,elevations:Array.from(r,v=>Math.round(v*10)/10),source:url};
  if(raw.elevations.some(v=>!Number.isFinite(v)||v< -500||v>9000))throw Error('Invalid DEM '+id);
  fs.writeFileSync(file,JSON.stringify(raw));path=file;
 }
 // Published Greek detail tiles already have vertex alignment and shared-edge repair.
 // Only raw cached/downloaded DSM samples need pixel-centre reconstruction.
 const at=(x,y)=>raw.elevations[Math.max(0,Math.min(128,y))*129+Math.max(0,Math.min(128,x))];
 const elevations=path===greek?Float32Array.from(raw.elevations):Float32Array.from(raw.elevations,(_,i)=>{const x=i%129/128*129-.5,y=Math.floor(i/129)/128*129-.5,a=Math.floor(x),b=Math.floor(y),u=x-a,v=y-b;return (at(a,b)*(1-u)+at(a+1,b)*u)*(1-v)+(at(a,b+1)*(1-u)+at(a+1,b+1)*u)*v;});
 tiles.set(`${lon},${lat}`,{...raw,elevations});sources.push({id,path,sha256:digest(fs.readFileSync(path)),url:raw.source});console.log('BALKANS_SOURCE',id);
}
for(let i=0;i<tasks.length;i+=3)await Promise.all(tasks.slice(i,i+3).map(get));
function source(x,y){const t=tiles.get(`${Math.min(24,Math.floor(x))},${Math.min(45,Math.floor(y))}`);return t?sample(t,x,y):fallback(x,y);}
const old=fs.readFileSync('godot-prototype/data/regional/backdrop.height'),oldH=new Float32Array(old.buffer,old.byteOffset,old.length/4);
function parent(x,y){if(x<=20){const px=Math.min(447.999999,(x-6)*32),py=(49-y)*32,i=Math.floor(px),j=Math.floor(py),u=px-i,v=py-j,a=oldH[j*449+i],b=oldH[j*449+i+1],c=oldH[(j+1)*449+i],d=oldH[(j+1)*449+i+1];return u+v<1?a+(b-a)*u+(c-a)*v:d+(c-d)*(1-u)+(b-d)*(1-v);}return Math.max(.001,fallback(x,y)*.0015);}
const width=11*128+1,height=10*128+1,heights=new Float32Array(width*height);
for(let y=0;y<height;y++)for(let x=0;x<width;x++)heights[y*width+x]=source(14+x/128,46-y/128);
fs.writeFileSync(out+'/source-metres.bin',Buffer.from(heights.buffer));
function mesh(rate,name){
 const w=11*rate+1,h=10*rate+1,count=w*h,pos=new Float32Array(count*3),norm=new Float32Array(count*3),uv=new Float32Array(count*2),uv2=new Float32Array(count*2),colors=new Float32Array(count*4);
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){const i=y*w+x,lon=14+x/rate,lat=46-y/rate,p=projectLocalMapMetres({lon,lat},{lon:13.5,lat:41.5}),base=parent(lon,lat);pos.set([p.east*.001,base+(Math.max(.001,source(lon,lat)*.0015)-base)*weight(lon,lat),-p.north*.001],i*3);uv.set([(lon+12)/87,(62-lat)/50],i*2);colors.set([base,0,0,1],i*4);}
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){const i=y*w+x,l=y*w+Math.max(0,x-1),r=y*w+Math.min(w-1,x+1),u=Math.max(0,y-1)*w+x,d=Math.min(h-1,y+1)*w+x,dx=(pos[r*3+1]-pos[l*3+1])/(pos[r*3]-pos[l*3]),dz=(pos[d*3+1]-pos[u*3+1])/(pos[d*3+2]-pos[u*3+2]),n=Math.hypot(dx,1,dz);norm.set([-dx/n,1/n,-dz/n],i*3);}
 const indices=new Uint32Array((w-1)*(h-1)*6);for(let y=0,k=0;y<h-1;y++)for(let x=0;x<w-1;x++){const a=y*w+x;indices.set([a,a+1,a+w,a+1,a+w+1,a+w],k);k+=6;}
 if(rate===128){
  // Two <=80 MB assets retain the exact shared edge vertices/normals.
  for(const [part,start] of [['north',0],['south',5*rate]]){
   const rows=5*rate+1,cnt=w*rows,ix=new Uint32Array((rows-1)*(w-1)*6);
   for(let y=0,k=0;y<rows-1;y++)for(let x=0;x<w-1;x++){const a=y*w+x;ix.set([a,a+1,a+w,a+1,a+w+1,a+w],k);k+=6;}
   const header=Buffer.alloc(8);header.writeUInt32LE(cnt);header.writeUInt32LE(ix.length,4);
   const fields=[[pos,3],[norm,3],[uv,2],[uv2,2],[colors,4]].map(([a,stride])=>Buffer.from(a.buffer,a.byteOffset+start*w*stride*4,cnt*stride*4));
   fs.writeFileSync(out+'/near-'+part+'.bin',Buffer.concat([header,...fields,Buffer.from(ix.buffer)]));
  }
 }else{const header=Buffer.alloc(8);header.writeUInt32LE(count);header.writeUInt32LE(indices.length,4);fs.writeFileSync(out+'/'+name+'.bin',Buffer.concat([header,...[pos,norm,uv,uv2,colors,indices].map(a=>Buffer.from(a.buffer))]));}
 if(rate===128){const image=new PNG({width:w,height:h});for(let i=0;i<count;i++)image.data.set([Math.round((norm[i*3]*.5+.5)*255),Math.round((norm[i*3+1]*.5+.5)*255),Math.round((norm[i*3+2]*.5+.5)*255),255],i*4);fs.writeFileSync(out+'/normals.png',PNG.sync.write(image));}
 return {vertices:count,triangles:indices.length/3};
}
const near=mesh(128,'near'),far=mesh(32,'far');
// The existing scanline political rasterizer, without rewriting definitions or owners.
const build=fs.readFileSync('godot-prototype/tools/region-foundation-build.mjs','utf8'),fn=build.slice(build.indexOf('function rasterize('),build.indexOf('rasterize(2048'));
const data=read('godot-prototype/data/northern-italy-reference/scenario-278.json');
new Function('fs','PNG','data','out',fn+"rasterize(5632,5120,14,46,11,10,'territory-ids.png');")(fs,PNG,data,out);
// Full-resolution GSHHG coastline, same archived source used by the existing detail importer.
const archive=fs.readFileSync('data/geography/source-cache/gshhg.zip'),zip=unzipSync(archive,{filter:f=>/GSHHS_f_L1\.(shp|dbf)$/.test(f.name)});
const land=await readShape(zip['GSHHS_shp/f/GSHHS_f_L1.shp'].buffer,zip['GSHHS_shp/f/GSHHS_f_L1.dbf'].buffer);
function clip(ring){let p=ring;for(const [axis,v,sign] of [[0,14,1],[0,25,-1],[1,36,1],[1,46,-1]]){const q=[];for(let i=0;i<p.length;i++){const a=p[i],b=p[(i+1)%p.length],ai=(a[axis]-v)*sign>=0,bi=(b[axis]-v)*sign>=0;if(ai)q.push(a);if(ai!==bi){const t=(v-a[axis])/(b[axis]-a[axis]);q.push([a[0]+t*(b[0]-a[0]),a[1]+t*(b[1]-a[1])]);}}p=q;}return p;}
const mw=5633,mh=5121,mask=new Uint8Array(mw*mh);
function fill(rings,buffer,value){const rr=rings.map(clip).filter(r=>r.length>2).map(r=>r.map(([x,y])=>[(x-14)*512,(46-y)*512]));if(!rr.length)return;const ys=rr.flat().map(p=>p[1]);for(let y=Math.max(0,Math.ceil(Math.min(...ys)));y<=Math.min(mh-1,Math.floor(Math.max(...ys)));y++){const xs=[];for(const r of rr)for(let i=0,j=r.length-1;i<r.length;j=i++){const a=r[i],b=r[j];if((a[1]>y)!==(b[1]>y))xs.push(a[0]+(y-a[1])*(b[0]-a[0])/(b[1]-a[1]));}xs.sort((a,b)=>a-b);for(let i=0;i+1<xs.length;i+=2)buffer.fill(value,y*mw+Math.max(0,Math.ceil(xs[i])),y*mw+Math.min(mw,Math.floor(xs[i+1])+1));}}
for(const f of land.features)for(const p of f.geometry.type==='MultiPolygon'?f.geometry.coordinates:[f.geometry.coordinates])fill(p,mask,255);
const ocean=mask.slice();for(const lake of read('godot-prototype/data/hydrology.json').lakes){fill(lake.rings,mask,0);fill(lake.rings,ocean,255);}
function grey(file,bytes,w=mw,h=mh){const image=new PNG({width:w,height:h});for(let i=0;i<bytes.length;i++)image.data.set([bytes[i],bytes[i],bytes[i],255],i*4);fs.writeFileSync(out+'/'+file,PNG.sync.write(image,{colorType:0}));}
grey('land.png',mask);grey('ocean.png',ocean);
// Shared shore distance in km, display colour only; no invented bathymetry.
const sw=11*128+1,sh=10*128+1,dist=new Float32Array(sw*sh),dx=111.195/128,diag=Math.SQRT2*dx;
for(let y=0;y<sh;y++)for(let x=0;x<sw;x++)dist[y*sw+x]=ocean[y*4*mw+x*4]>127?0:64;
for(let y=0;y<sh;y++)for(let x=0;x<sw;x++){const i=y*sw+x;let v=dist[i];if(x)v=Math.min(v,dist[i-1]+dx);if(y)v=Math.min(v,dist[i-sw]+dx);if(x&&y)v=Math.min(v,dist[i-sw-1]+diag);dist[i]=v;}
for(let y=sh-1;y>=0;y--)for(let x=sw-1;x>=0;x--){const i=y*sw+x;let v=dist[i];if(x+1<sw)v=Math.min(v,dist[i+1]+dx);if(y+1<sh)v=Math.min(v,dist[i+sw]+dx);if(x+1<sw&&y+1<sh)v=Math.min(v,dist[i+sw+1]+diag);dist[i]=v;}
grey('shore.png',Uint8Array.from(dist,d=>Math.min(255,Math.round(d*4))),sw,sh);
fs.writeFileSync(out+'/manifest.json',JSON.stringify({bounds,width,height,heightScale:1.5,near,far,sources:sources.sort((a,b)=>a.id.localeCompare(b.id)),coast:{archive:'data/geography/source-cache/gshhg.zip',sha256:digest(archive),source:'GSHHG 2.3.7 full-resolution L1'},notice:'Modern Copernicus DSM and GSHHG physical presentation only; not reconstructed ancient coastlines. Existing political polygons rerasterized without geometry or ownership edits.'},null,2));
if(fs.existsSync(out+'/near.bin'))fs.unlinkSync(out+'/near.bin');
console.log('BALKANS_BUILD_OK',near,far,sources.length);
