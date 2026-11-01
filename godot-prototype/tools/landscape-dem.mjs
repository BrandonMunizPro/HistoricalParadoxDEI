// Bounded HTTP-range acquisition of the SAME Copernicus tile used by the project.
// Additive presentation derivative only. Never rewrites original terrain or geography.
import fs from 'node:fs';import cp from 'node:child_process';import crypto from 'node:crypto';
import {fromCustomClient} from 'geotiff';
import {projectLocalMapMetres} from '../../dist/infrastructure/world-geography.js';
const root='godot-prototype',dir=root+'/data/landscape-quality';fs.mkdirSync(dir,{recursive:true});
const url='https://copernicus-dem-30m.s3.amazonaws.com/Copernicus_DSM_COG_10_N41_00_E012_00_DEM/Copernicus_DSM_COG_10_N41_00_E012_00_DEM.tif';
const bounds={west:12.65,east:12.735,south:41.695,north:41.78},w=257,n=w-1;
let downloaded=0;
const cache=dir+'/aricia-source.json';let source;
if(fs.existsSync(cache))source=JSON.parse(fs.readFileSync(cache));
else{
 const client={url,async request(options){
  const header=dir+'/range-header.txt',body=dir+'/range-body.bin';
  cp.execFileSync('curl.exe',['-L','--fail','--silent','--show-error','--retry-all-errors','--retry','3','-H','Range: '+options.headers.Range,'-D',header,'-o',body,url]);
  const text=fs.readFileSync(header,'utf8'),buffer=fs.readFileSync(body);downloaded+=buffer.length;
  if(downloaded>15_000_000)throw Error('Bounded acquisition exceeded 15 MB');
  const headers=Object.fromEntries(text.split(/\r?\n/).filter(l=>l.includes(':')).map(l=>{const i=l.indexOf(':');return[l.slice(0,i).toLowerCase(),l.slice(i+1).trim()];}));
  return{ok:true,status:206,getHeader:k=>headers[k.toLowerCase()],getData:async()=>buffer.buffer.slice(buffer.byteOffset,buffer.byteOffset+buffer.byteLength)};
 }};
 const tif=await fromCustomClient(client,{blockSize:65536,cacheSize:100,maxRanges:0,allowFullFile:false});
 const elevations=await tif.readRasters({bbox:[bounds.west,bounds.south,bounds.east,bounds.north],width:w,height:w,resampleMethod:'bilinear',interleave:true});
 source={url,bounds,width:w,height:w,elevations:Array.from(elevations),downloadedBytes:downloaded,license:'Copernicus DEM licence; see https://registry.opendata.aws/copernicus-dem/',attribution:'© DLR e.V. 2010-2014 and © Airbus Defence and Space GmbH 2014-2018 provided under COPERNICUS by the European Union and ESA; all rights reserved.'};
 fs.writeFileSync(cache,JSON.stringify(source));
}
const count=w*w,filtered=new Float32Array(count);
for(let y=0;y<w;y++)for(let x=0;x<w;x++){let sum=0,weight=0;for(let dy=-2;dy<=2;dy++)for(let dx=-2;dx<=2;dx++){const k=Math.exp(-(dx*dx+dy*dy)/2.88);sum+=source.elevations[Math.max(0,Math.min(n,y+dy))*w+Math.max(0,Math.min(n,x+dx))]*k;weight+=k;}filtered[y*w+x]=sum/weight;}
const bytes=fs.readFileSync(root+'/data/tiles/N41E12.height'),pvalues=new Float32Array(bytes.buffer,bytes.byteOffset,bytes.length/4);
function sample(lon,lat){const x=(lon-12)*128,y=(42-lat)*128,i=Math.floor(x),j=Math.floor(y),a=x-i,b=y-j,at=(x,y)=>Math.max(.001,pvalues[y*129+x]*.0015),h0=at(i,j),h1=at(i+1,j),h2=at(i,j+1),h3=at(i+1,j+1);return a+b<1?h0+(h1-h0)*a+(h2-h0)*b:h3+(h2-h3)*(1-a)+(h1-h3)*(1-b);}
const vertices=new Float32Array(count*3),normals=new Float32Array(count*3),uv=new Float32Array(count*2),uv2=new Float32Array(count*2),colors=new Float32Array(count*4),ph=new Float32Array(count),pn=new Float32Array(count*3);
for(let y=0;y<w;y++)for(let x=0;x<w;x++){
 const i=y*w+x,lon=bounds.west+x/n*(bounds.east-bounds.west),lat=bounds.north-y/n*(bounds.north-bounds.south),p=projectLocalMapMetres({lon,lat},{lon:13.5,lat:41.5});
 vertices.set([p.east*.001,Math.max(.001,filtered[i]*.0015),-p.north*.001],i*3);uv.set([(lon+12)/87,(62-lat)/50],i*2);ph[i]=sample(lon,lat);
 const d=.0001,gx=(sample(lon+d,lat)-sample(lon-d,lat))/(2*d*111.195*Math.cos(lat*Math.PI/180)),gz=(sample(lon,lat-d)-sample(lon,lat+d))/(2*d*111.195),length=Math.hypot(gx,1,gz);
 pn.set([-gx/length,1/length,-gz/length],i*3);colors.set([ph[i],0,0,1],i*4);
}
for(let y=0;y<w;y++)for(let x=0;x<w;x++){
 const i=y*w+x,l=y*w+Math.max(0,x-1),r=y*w+Math.min(n,x+1),u=Math.max(0,y-1)*w+x,d=Math.min(n,y+1)*w+x,dx=(vertices[r*3+1]-vertices[l*3+1])/(vertices[r*3]-vertices[l*3]),dz=(vertices[d*3+1]-vertices[u*3+1])/(vertices[d*3+2]-vertices[u*3+2]),length=Math.hypot(dx,1,dz);normals.set([-dx/length,1/length,-dz/length],i*3);
}
const indices=new Uint32Array(n*n*6);for(let y=0,k=0;y<n;y++)for(let x=0;x<n;x++){const a=y*w+x;indices.set([a,a+1,a+w,a+1,a+w+1,a+w],k);k+=6;}
const header=Buffer.alloc(8);header.writeUInt32LE(count);header.writeUInt32LE(indices.length,4);
fs.writeFileSync(dir+'/aricia.bin',Buffer.concat([header,...[vertices,normals,uv,uv2,colors,indices].map(a=>Buffer.from(a.buffer))]));fs.writeFileSync(dir+'/aricia.height',Buffer.from(filtered.buffer));
for(const [suffix,a] of [['parent',ph],['normal',normals],['pnormal',pn]])fs.writeFileSync(root+'/data/regional/aricia-landscape.'+suffix,Buffer.from(a.buffer));
fs.writeFileSync(dir+'/aricia.json',JSON.stringify({id:'aricia-landscape',kind:'regional',romaDetail:true,parentId:'N41E12',bounds,width:w,height:w,grid:n,mesh:'data/landscape-quality/aricia.bin',heights:'data/landscape-quality/aricia.height',source:url,inputSha256:crypto.createHash('sha256').update(fs.readFileSync(cache)).digest('hex'),spacingMetres:[27.6,36.9],filter:'5x5 Gaussian sigma 1.2; existing 1.5x height presentation retained',notice:'Modern DSM; no claim of ancient terrain or metre accurate bare earth.'},null,2)+'\n');console.log({vertices:count,downloadedBytes:source.downloadedBytes});
