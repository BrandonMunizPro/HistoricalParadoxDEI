// Original offline adapter: existing Roma DEM -> existing native tile format.
// Reads canonical sources, writes only named Godot presentation derivatives.
import fs from 'node:fs';import crypto from 'node:crypto';
import {projectLocalMapMetres} from '../../dist/infrastructure/world-geography.js';
const root='godot-prototype',dir=`${root}/data/roma-terrain`;
fs.mkdirSync(dir,{recursive:true});
const input='public/data/italy-terrain/local-roma.json',raw=fs.readFileSync(input),t=JSON.parse(raw),n=t.width-1,w=t.width,count=w*w;
// Surface reconstruction suppresses modern DSM roof-scale spikes; original source
// bytes remain intact. Broad hills are retained; this is not ancient topography.
const filtered=new Float32Array(count);
for(let y=0;y<w;y++)for(let x=0;x<w;x++){
 let sum=0,weight=0;
 for(let dy=-2;dy<=2;dy++)for(let dx=-2;dx<=2;dx++){const k=Math.exp(-(dx*dx+dy*dy)/2.88);sum+=t.elevations[Math.max(0,Math.min(n,y+dy))*w+Math.max(0,Math.min(n,x+dx))]*k;weight+=k;}
 filtered[y*w+x]=sum/weight;
}
const parent=JSON.parse(fs.readFileSync(`${root}/data/world.json`)).tiles.find(d=>d.id==='N41E12');
const bytes=fs.readFileSync(`${root}/${parent.heights}`),pvalues=new Float32Array(bytes.buffer,bytes.byteOffset,bytes.length/4);
function sample(lon,lat){const x=(lon-12)*128,y=(42-lat)*128,i=Math.floor(x),j=Math.floor(y),a=x-i,b=y-j,at=(x,y)=>Math.max(.001,pvalues[y*129+x]*.0015),h0=at(i,j),h1=at(i+1,j),h2=at(i,j+1),h3=at(i+1,j+1);return a+b<1?h0+(h1-h0)*a+(h2-h0)*b:h3+(h2-h3)*(1-a)+(h1-h3)*(1-b);}
const vertices=new Float32Array(count*3),normals=new Float32Array(count*3),uv=new Float32Array(count*2),uv2=new Float32Array(count*2),colors=new Float32Array(count*4),ph=new Float32Array(count),pn=new Float32Array(count*3);
for(let y=0;y<w;y++)for(let x=0;x<w;x++){
 const i=y*w+x,lon=t.bounds.west+x/n*(t.bounds.east-t.bounds.west),lat=t.bounds.north-y/n*(t.bounds.north-t.bounds.south),p=projectLocalMapMetres({lon,lat},{lon:13.5,lat:41.5});
 vertices.set([p.east*.001,Math.max(.001,filtered[i]*.0015),-p.north*.001],i*3);
 uv.set([(lon+12)/87,(62-lat)/50],i*2);ph[i]=sample(lon,lat);
 const d=.0001,gx=(sample(lon+d,lat)-sample(lon-d,lat))/(2*d*111.195*Math.cos(lat*Math.PI/180)),gz=(sample(lon,lat-d)-sample(lon,lat+d))/(2*d*111.195),length=Math.hypot(gx,1,gz);
 pn.set([-gx/length,1/length,-gz/length],i*3);colors.set([ph[i],0,0,1],i*4);
}
for(let y=0;y<w;y++)for(let x=0;x<w;x++){
 const i=y*w+x,l=y*w+Math.max(0,x-1),r=y*w+Math.min(n,x+1),u=Math.max(0,y-1)*w+x,d=Math.min(n,y+1)*w+x;
 const dx=(vertices[r*3+1]-vertices[l*3+1])/(vertices[r*3]-vertices[l*3]),dz=(vertices[d*3+1]-vertices[u*3+1])/(vertices[d*3+2]-vertices[u*3+2]),length=Math.hypot(dx,1,dz);normals.set([-dx/length,1/length,-dz/length],i*3);
}
const indices=new Uint32Array(n*n*6);for(let y=0,k=0;y<n;y++)for(let x=0;x<n;x++){const a=y*w+x;indices.set([a,a+1,a+w,a+1,a+w+1,a+w],k);k+=6;}
const header=Buffer.alloc(8);header.writeUInt32LE(count);header.writeUInt32LE(indices.length,4);
fs.writeFileSync(`${dir}/roma.bin`,Buffer.concat([header,...[vertices,normals,uv,uv2,colors,indices].map(a=>Buffer.from(a.buffer))]));
fs.writeFileSync(`${dir}/roma.height`,Buffer.from(filtered.buffer));
for(const [suffix,data] of [['parent',ph],['normal',normals],['pnormal',pn]])fs.writeFileSync(`${root}/data/regional/roma-local.${suffix}`,Buffer.from(data.buffer));
fs.writeFileSync(`${root}/data/roma-terrain.json`,JSON.stringify({id:'roma-local',kind:'regional',romaDetail:true,parentId:'N41E12',bounds:t.bounds,width:w,height:w,grid:n,mesh:'data/roma-terrain/roma.bin',heights:'data/roma-terrain/roma.height',sourceSpacing:'approximately 39–43 m resampled existing source',surfaceFilter:'5x5 Gaussian, sigma 1.2 samples, renderer derivative only',source:t.source,input,inputSha256:crypto.createHash('sha256').update(raw).digest('hex'),notice:'Modern DSM, not an ancient seven-hill reconstruction; canonical source bytes unchanged; broad source relief retained with roof-scale surface filtering; existing 1.5x height presentation and 5.5% parent seam morph retained.'},null,2)+'\n');
console.log(`ROMA_TERRAIN_DERIVED ${count} source heights; canonical source unchanged`);
