// Derived render buffers only. Every catalog segment survives, in source order.
// No source masks, heights, history, or settlements are rewritten.
import fs from 'node:fs';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {unprojectLocalMapMetres} from '../../src/infrastructure/world-geography.ts';
const root='godot-prototype/data/',out=root+'world-coast-baseline';
fs.mkdirSync(out,{recursive:true});fs.writeFileSync(out+'/.gdignore','');
const read=p=>JSON.parse(fs.readFileSync(root+p));
const catalog=read('world-coasts/manifest.json'),hash=crypto.createHash('sha256');
const source=new Float32Array(catalog.segments*12);
for(const c of catalog.chunks){const b=fs.readFileSync(root+'world-coasts/'+c.file);hash.update(b);source.set(new Float32Array(b.buffer,b.byteOffset,b.length/4),c.start*12);}
assert.equal(hash.digest('hex'),catalog.segmentsSha256);
const names=['balkans','anatolia',...Object.keys(read('eastern-regions.json').regions),...read('africa-regions.json').order,'hispania',...read('northern-regions.json').order,...read('frontier-regions.json').order];
const grids=[...new Set(names)].map(name=>{const m=read(name+'/manifest.json'),b=fs.readFileSync(root+name+'/source-metres.bin');return {...m,h:new Float32Array(b.buffer,b.byteOffset,b.length/4),scale:.0015};});
const regional=read('regional/manifest.json'),regionalBytes=fs.readFileSync('godot-prototype/'+regional.heights);
grids.unshift({...regional,h:new Float32Array(regionalBytes.buffer,regionalBytes.byteOffset,regionalBytes.length/4),scale:1});
// Higher coverage sections precede the broad Italy backdrop where they overlap.
const italy=grids.shift();grids.push(italy);
function height(x,z){
 const g=unprojectLocalMapMetres(x*1000,-z*1000,{lon:13.5,lat:41.5});
 const m=grids.find(m=>g.lon>m.bounds.west&&g.lon<m.bounds.east&&g.lat>m.bounds.south&&g.lat<m.bounds.north);
 if(!m)return 0;const b=m.bounds,w=m.width,h=m.height;
 const xx=Math.max(0,Math.min(w-1.00001,(g.lon-b.west)/(b.east-b.west)*(w-1))),yy=Math.max(0,Math.min(h-1.00001,(b.north-g.lat)/(b.north-b.south)*(h-1)));
 const i=Math.floor(xx),j=Math.floor(yy),u=xx-i,v=yy-j,a=m.h[j*w+i],bb=m.h[j*w+i+1],c=m.h[(j+1)*w+i],d=m.h[(j+1)*w+i+1];
 return Math.max(.001,(u+v<1?a+(bb-a)*u+(c-a)*v:d+(c-d)*(1-u)+(bb-d)*(1-v))*m.scale)+.0005;
}
const tiles=new Map(),joins=new Float32Array(catalog.segments*8);let maximumHeight=0;
function joint(id,side){
 const i=id*12,j=(id+(side===0?-1:1))*12;
 let nx=source[i+4],nz=source[i+5],beach=source[i+8],rock=source[i+9];
 if(j>=0&&j<source.length){
  const ax=source[i+(side===0?0:2)],az=source[i+(side===0?1:3)],bx=source[j+(side===0?2:0)],bz=source[j+(side===0?3:1)];
  if(Math.hypot(ax-bx,az-bz)<.001&&nx*source[j+4]+nz*source[j+5]>0){
   const xx=nx+source[j+4],zz=nz+source[j+5],len=Math.hypot(xx,zz),dot=(xx*nx+zz*nz)/len;
   nx=xx/len/Math.max(.5,dot);nz=zz/len/Math.max(.5,dot);beach=(beach+source[j+8])*.5;rock=(rock+source[j+9])*.5;
  }
 }
 return [nx,nz,beach,rock];
}
for(let id=0;id<catalog.segments;id++){
 const i=id*12,a=joint(id,0),b=joint(id,1);joins.set([...a,...b],id*8);
 const ac=.008+.092*a[2]+.020,bc=.008+.092*b[2]+.020;
 source[i+10]=height(source[i]+a[0]*ac,source[i+1]+a[1]*ac);
 source[i+11]=height(source[i+2]+b[0]*bc,source[i+3]+b[1]*bc);
 maximumHeight=Math.max(maximumHeight,source[i+10],source[i+11]);
 const key=Math.floor((source[i]+source[i+2])*.5/64)+','+Math.floor((source[i+1]+source[i+3])*.5/64);
 if(!tiles.has(key))tiles.set(key,[]);tiles.get(key).push(id);
}
const textures={};const width=2048;
function texture(name,values,channels,fixedWidth=width){
 const h=Math.ceil(values.length/channels/fixedWidth),padded=new Float32Array(fixedWidth*h*channels);padded.set(values);
 const bytes=Buffer.from(padded.buffer),parts=[];
 for(let start=0;start<bytes.length;start+=32*1024*1024){const part=bytes.subarray(start,Math.min(bytes.length,start+32*1024*1024)),file=name+'-'+parts.length+'.bin';fs.writeFileSync(out+'/'+file,part);parts.push({file,bytes:part.length,sha256:crypto.createHash('sha256').update(part).digest('hex')});}
 textures[name]={width:fixedWidth,height:h,channels,bytes:padded.byteLength,parts};
 // Remove only the superseded file produced by this builder's earlier layout.
 if(fs.existsSync(out+'/'+name+'.bin'))fs.unlinkSync(out+'/'+name+'.bin');
}
texture('segments',source,4);
// A half-kilometre GPU index cuts per-fragment candidates without changing a
// single source segment. The existing CPU catalog/index remains untouched.
const spatialScale=2,fineCells=new Map();
for(let id=0;id<catalog.segments;id++){
 const i=id*12;
 for(let y=Math.floor((Math.min(source[i+1],source[i+3])-.25)*spatialScale);y<=Math.floor((Math.max(source[i+1],source[i+3])+.25)*spatialScale);y++)for(let x=Math.floor((Math.min(source[i],source[i+2])-.25)*spatialScale);x<=Math.floor((Math.max(source[i],source[i+2])+.25)*spatialScale);x++){
  const key=x+','+y;if(!fineCells.has(key))fineCells.set(key,[]);fineCells.get(key).push(id);
 }
}
const headers=new Int32Array(fineCells.size*4),packedIds=[];let row=0;
for(const [key,ids] of fineCells){const [x,y]=key.split(',').map(Number);headers.set([x,y,packedIds.length,ids.length],row*4);for(const id of ids)packedIds.push(id);row++;}
const indices=Int32Array.from(packedIds);
assert(indices.length<16777216,'Float texture indices must remain exactly representable');
const pages=new Map();let minX=Infinity,minY=Infinity,maxX=-Infinity,maxY=-Infinity,maxCandidates=0;
for(let i=0;i<headers.length;i+=4){
 const x=Math.floor(headers[i]/32),y=Math.floor(headers[i+1]/32),key=x+','+y;
 if(!pages.has(key))pages.set(key,pages.size);
 minX=Math.min(minX,x);minY=Math.min(minY,y);maxX=Math.max(maxX,x);maxY=Math.max(maxY,y);maxCandidates=Math.max(maxCandidates,headers[i+3]);
}
const pageWidth=maxX-minX+1,pageHeight=maxY-minY+1,pageTable=new Float32Array(pageWidth*pageHeight),sparse=new Float32Array(pages.size*1024*2);
for(const [key,id] of pages){const [x,y]=key.split(',').map(Number);pageTable[(y-minY)*pageWidth+x-minX]=id+1;}
for(let i=0;i<headers.length;i+=4){const x=headers[i],y=headers[i+1],page=pages.get(Math.floor(x/32)+','+Math.floor(y/32)),cell=page*1024+((y%32+32)%32)*32+(x%32+32)%32;sparse[cell*2]=headers[i+2];sparse[cell*2+1]=headers[i+3];}
texture('pages',pageTable,1,pageWidth);texture('cells',sparse,2);texture('indices',Float32Array.from(indices),1);
const chunks=[];let instances=0;
for(const [key,ids] of tiles){
 const data=new Float32Array(ids.length*20),bounds=[Infinity,Infinity,-Infinity,-Infinity];
 ids.forEach((id,j)=>{const i=id*12,q=id*8;data.set(source.subarray(i,i+12),j*20);data.set([joins[q]/4+.5,joins[q+1]/4+.5,joins[q+4]/4+.5,joins[q+5]/4+.5,joins[q+2],joins[q+3],joins[q+6],joins[q+7]],j*20+12);bounds[0]=Math.min(bounds[0],source[i],source[i+2]);bounds[1]=Math.min(bounds[1],source[i+1],source[i+3]);bounds[2]=Math.max(bounds[2],source[i],source[i+2]);bounds[3]=Math.max(bounds[3],source[i+1],source[i+3]);});
 const file='instances-'+key.replace(',','_')+'.bin';fs.writeFileSync(out+'/'+file,Buffer.from(data.buffer));chunks.push({file,count:ids.length,bounds});instances+=ids.length;
}
assert.equal(instances,catalog.segments);
const manifest={version:3,strideFloats:20,spatialScale,spatialCells:fineCells.size,candidateIndices:indices.length,sourceSha256:catalog.segmentsSha256,segments:catalog.segments,instances,pageOrigin:[minX,minY],pageSize:32,pages:pages.size,maxCandidates,textures,chunks,maximumHeight,textureBytes:Object.values(textures).reduce((n,t)=>n+t.bytes,0),instanceBytes:instances*80,notice:'Derived GPU lookup and instanced baseline. All existing source segments retained without simplification. Shared miter normals and endpoint styles close source joins. Endpoint join heights sampled from existing DEMs. The detailed coast mesh/compute pass remains an optional refinement.'};
fs.writeFileSync(out+'/manifest.json',JSON.stringify(manifest,null,2));
console.log('COAST_BASELINE_BUILT',JSON.stringify({...manifest,chunks:chunks.length}));
