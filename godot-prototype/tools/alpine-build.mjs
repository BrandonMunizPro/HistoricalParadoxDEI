// Bounded Alpine physical terrain. Existing settlement/research/political files are read-only.
import fs from 'node:fs';
import crypto from 'node:crypto';
import {fromUrl} from 'geotiff';
import {PNG} from 'pngjs';
import {projectLocalMapMetres} from '../../src/infrastructure/world-geography.ts';
const out='godot-prototype/data/alpine',cache='data/geography/source-cache/alpine';
fs.mkdirSync(out,{recursive:true});fs.mkdirSync(cache,{recursive:true});
const bounds={west:6,east:16,south:44,north:48};const tiles=new Map(),sources=[];
const tasks=[];for(let lat=44;lat<48;lat++)for(let lon=6;lon<16;lon++)tasks.push({lat,lon});
async function get({lat,lon}){
 const id=`N${lat}E${lon}`,existing=`data/geography/source-cache/cop-${id}.json`,file=`${cache}/${id}.json`;
 let raw;
 if(fs.existsSync(existing))raw=JSON.parse(fs.readFileSync(existing));
 else if(fs.existsSync(file))raw=JSON.parse(fs.readFileSync(file));
 else{
  const name=`Copernicus_DSM_COG_10_N${lat}_00_E${String(lon).padStart(3,'0')}_00_DEM`;
  const url=`https://copernicus-dem-30m.s3.amazonaws.com/${name}/${name}.tif`;
  const tif=await fromUrl(url);const r=await tif.readRasters({bbox:[lon,lat,lon+1,lat+1],width:129,height:129,resampleMethod:'bilinear',interleave:true});
  raw={id,bounds:{west:lon,east:lon+1,south:lat,north:lat+1},width:129,height:129,elevations:Array.from(r,v=>Math.round(v*10)/10),source:url};
  if(raw.elevations.some(v=>!Number.isFinite(v)||v< -500||v>9000))throw Error('Invalid DEM '+id);
  fs.writeFileSync(file,JSON.stringify(raw));
 }
 // Same pixel-centre to geographic-vertex correction as the existing importer.
 const at=(x,y)=>raw.elevations[Math.max(0,Math.min(128,y))*129+Math.max(0,Math.min(128,x))];
 const grid=Float32Array.from(raw.elevations,(_,i)=>{const x=(i%129)/128*129-.5,y=Math.floor(i/129)/128*129-.5,a=Math.floor(x),b=Math.floor(y),fx=x-a,fy=y-b;return (at(a,b)*(1-fx)+at(a+1,b)*fx)*(1-fy)+(at(a,b+1)*(1-fx)+at(a+1,b+1)*fx)*fy;});
 tiles.set(`${lon},${lat}`,grid);sources.push({id,url:raw.source,sha256:crypto.createHash('sha256').update(JSON.stringify(raw)).digest('hex')});
 console.log('ALPINE_SOURCE',id);
}
for(let i=0;i<tasks.length;i+=3)await Promise.all(tasks.slice(i,i+3).map(get));
function source(lon,lat){const x=Math.min(15,Math.max(6,Math.floor(lon))),y=Math.min(47,Math.max(44,Math.floor(lat))),g=tiles.get(`${x},${y}`),px=(lon-x)*128,py=(y+1-lat)*128,a=Math.min(127,Math.max(0,Math.floor(px))),b=Math.min(127,Math.max(0,Math.floor(py))),u=px-a,v=py-b;return (g[b*129+a]*(1-u)+g[b*129+a+1]*u)*(1-v)+(g[(b+1)*129+a]*(1-u)+g[(b+1)*129+a+1]*u)*v;}
const old=fs.readFileSync('godot-prototype/data/regional/backdrop.height');const oldH=new Float32Array(old.buffer,old.byteOffset,old.length/4),oldW=449;
function parent(lon,lat){const x=(lon-6)*32,y=(49-lat)*32,i=Math.floor(x),j=Math.floor(y),a=x-i,b=y-j,A=oldH[j*oldW+i],B=oldH[j*oldW+i+1],C=oldH[(j+1)*oldW+i],D=oldH[(j+1)*oldW+i+1];return a+b<1?A+(B-A)*a+(C-A)*b:D+(C-D)*(1-a)+(B-D)*(1-b);}
const smooth=(a,b,x)=>{const t=Math.max(0,Math.min(1,(x-a)/(b-a)));return t*t*(3-2*t);};
const weight=(lon,lat)=>smooth(0,.15,Math.min(lon-6,16-lon,lat-44,48-lat));
const width=1281,height=513,heights=new Float32Array(width*height);
for(let y=0;y<height;y++)for(let x=0;x<width;x++)heights[y*width+x]=source(6+x/128,48-y/128);
fs.writeFileSync(out+'/source-metres.bin',Buffer.from(heights.buffer));
function mesh(rate,name){
 const w=10*rate+1,h=4*rate+1,count=w*h,pos=new Float32Array(count*3),norm=new Float32Array(count*3),uv=new Float32Array(count*2),uv2=new Float32Array(count*2),colors=new Float32Array(count*4);
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){const i=y*w+x,lon=6+x/rate,lat=48-y/rate,p=projectLocalMapMetres({lon,lat},{lon:13.5,lat:41.5}),base=parent(lon,lat),z=source(lon,lat)*.0015;pos.set([p.east*.001,base+(z-base)*weight(lon,lat),-p.north*.001],i*3);uv.set([(lon+12)/87,(62-lat)/50],i*2);colors.set([base,0,0,1],i*4);}
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){const i=y*w+x,l=y*w+Math.max(0,x-1),r=y*w+Math.min(w-1,x+1),u=Math.max(0,y-1)*w+x,d=Math.min(h-1,y+1)*w+x,dx=(pos[r*3+1]-pos[l*3+1])/(pos[r*3]-pos[l*3]),dz=(pos[d*3+1]-pos[u*3+1])/(pos[d*3+2]-pos[u*3+2]),n=Math.hypot(dx,1,dz);norm.set([-dx/n,1/n,-dz/n],i*3);}
 const indices=new Uint32Array((w-1)*(h-1)*6);for(let y=0,k=0;y<h-1;y++)for(let x=0;x<w-1;x++){const a=y*w+x;indices.set([a,a+1,a+w,a+1,a+w+1,a+w],k);k+=6;}
 const header=Buffer.alloc(8);header.writeUInt32LE(count);header.writeUInt32LE(indices.length,4);fs.writeFileSync(out+'/'+name+'.bin',Buffer.concat([header,...[pos,norm,uv,uv2,colors,indices].map(a=>Buffer.from(a.buffer))]));
 if(rate===128){const image=new PNG({width:w,height:h});for(let i=0;i<count;i++)image.data.set([Math.round((norm[i*3]*.5+.5)*255),Math.round((norm[i*3+1]*.5+.5)*255),Math.round((norm[i*3+2]*.5+.5)*255),255],i*4);fs.writeFileSync(out+'/normals.png',PNG.sync.write(image));}
 return {vertices:count,triangles:indices.length/3};
}
const near=mesh(128,'near'),far=mesh(32,'far');
fs.writeFileSync(out+'/manifest.json',JSON.stringify({bounds,width,height,heightScale:1.5,near,far,sources:sources.sort((a,b)=>a.id.localeCompare(b.id)),notice:'Modern Copernicus GLO-30 DSM resampled to ~650-870 m output. Not a 278 BCE glacier reconstruction. Source heights and existing vertical scale retained; no procedural peaks.'},null,2));
console.log('ALPINE_BUILD_OK',near,far);
