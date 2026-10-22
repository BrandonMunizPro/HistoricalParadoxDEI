// Offline presentation adapter. Reads existing geographic files; writes only this prototype.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {PNG} from 'pngjs';
import {projectLocalMapMetres} from '../../src/infrastructure/world-geography.ts';
const root=path.resolve(fileURLToPath(new URL('..',import.meta.url))),repo=path.dirname(root),out=path.join(root,'data/regional');
fs.mkdirSync(out,{recursive:true});fs.writeFileSync(path.join(out,'.gdignore'),'');
const json=p=>JSON.parse(fs.readFileSync(path.join(repo,p)));
const manifest=json('godot-prototype/data/world.json');
const bounds={west:6,east:20,south:35,north:49},span=14,n=span*32,w=n+1;
const fine=manifest.tiles.filter(t=>t.kind==='regional').map(d=>({...json(`public/data/italy-terrain/${d.id}.json`),descriptor:d}));
const world=manifest.tiles.filter(t=>t.kind==='world'&&t.bounds.west<20&&t.bounds.east>6&&t.bounds.south<49&&t.bounds.north>35).map(d=>json(`public/data/world-terrain/${d.id}.json`));
const context=json('public/data/world-terrain/context.json');
const map=new Map(fine.map(t=>[`${t.bounds.west},${t.bounds.south}`,t]));
function has(t,x,y){return x>=t.bounds.west&&x<=t.bounds.east&&y>=t.bounds.south&&y<=t.bounds.north;}
function tile(x,y){const f=map.get(`${Math.floor(Math.min(x,19.999999))},${Math.floor(Math.min(y,45.999999))}`);return f&&has(f,x,y)?f:world.find(t=>has(t,x,y))??context;}
function sample(t,x,y){const b=t.bounds,u=Math.max(0,Math.min(t.width-1,(x-b.west)/(b.east-b.west)*(t.width-1))),v=Math.max(0,Math.min(t.height-1,(b.north-y)/(b.north-b.south)*(t.height-1))),i=Math.floor(u),j=Math.floor(v),a=u-i,c=v-j,at=(p,q)=>t.elevations[Math.min(t.height-1,q)*t.width+Math.min(t.width-1,p)];return (at(i,j)*(1-a)+at(i+1,j)*a)*(1-c)+(at(i,j+1)*(1-a)+at(i+1,j+1)*a)*c;}
function height(x,y){return Math.max(.001,sample(tile(x,y),x,y)*.0015);}
const project=(x,y)=>{const p=projectLocalMapMetres({lon:x,lat:y},{lon:13.5,lat:41.5});return [p.east*.001,-p.north*.001];};
function pack(vertices,normals,uv,uv2,colors,indices){const header=Buffer.alloc(8);header.writeUInt32LE(vertices.length/3);header.writeUInt32LE(indices.length,4);return Buffer.concat([header,...[vertices,normals,uv,uv2,colors,indices].map(a=>Buffer.from(a.buffer))]);}
const count=w*w,pos=new Float32Array(count*3),norm=new Float32Array(count*3),uv=new Float32Array(count*2),uv2=new Float32Array(count*2),colors=new Float32Array(count*4),heights=new Float32Array(count);
for(let y=0;y<w;y++)for(let x=0;x<w;x++){const i=y*w+x,lon=bounds.west+x/32,lat=bounds.north-y/32,p=project(lon,lat),h=height(lon,lat);heights[i]=h;pos.set([p[0],h,p[1]],i*3);uv.set([(lon+12)/87,(62-lat)/50],i*2);uv2.set([x/n,y/n],i*2);colors.set([Math.max(.001,sample(context,lon,lat)*.0015),0,0,1],i*4);}
for(let y=0;y<w;y++)for(let x=0;x<w;x++){const i=y*w+x,l=y*w+Math.max(0,x-1),r=y*w+Math.min(n,x+1),u=Math.max(0,y-1)*w+x,d=Math.min(n,y+1)*w+x,hx=(pos[r*3+1]-pos[l*3+1])/(pos[r*3]-pos[l*3]),hz=(pos[d*3+1]-pos[u*3+1])/(pos[d*3+2]-pos[u*3+2]),len=Math.hypot(hx,1,hz);norm.set([-hx/len,1/len,-hz/len],i*3);}
const indices=new Uint32Array(n*n*6);for(let y=0,k=0;y<n;y++)for(let x=0;x<n;x++){const a=y*w+x;indices.set([a,a+1,a+w,a+1,a+w+1,a+w],k);k+=6;}
fs.writeFileSync(path.join(out,'backdrop.bin'),pack(pos,norm,uv,uv2,colors,indices));
fs.writeFileSync(path.join(out,'backdrop.height'),Buffer.from(heights.buffer));
function parent(lon,lat){const x=Math.max(0,Math.min(n-.000001,(lon-6)*32)),y=Math.max(0,Math.min(n-.000001,(49-lat)*32)),i=Math.floor(x),j=Math.floor(y),fx=x-i,fy=y-j,a=heights[j*w+i],b=heights[j*w+i+1],c=heights[(j+1)*w+i],d=heights[(j+1)*w+i+1];return fx+fy<1?a+(b-a)*fx+(c-a)*fy:d+(c-d)*(1-fx)+(b-d)*(1-fy);}
function baseNormal(lon,lat){const x=Math.max(0,Math.min(n-.000001,(lon-6)*32)),y=Math.max(0,Math.min(n-.000001,(49-lat)*32)),i=Math.floor(x),j=Math.floor(y),a=x-i,b=y-j;return [0,1,2].map(k=>(norm[(j*w+i)*3+k]*(1-a)+norm[(j*w+i+1)*3+k]*a)*(1-b)+(norm[((j+1)*w+i)*3+k]*(1-a)+norm[((j+1)*w+i+1)*3+k]*a)*b);}
for(const t of fine){const d=t.descriptor,f=fs.readFileSync(path.join(root,d.mesh)),cnt=f.readUInt32LE(),p=new Float32Array(cnt),pn=new Float32Array(cnt*3),fn=new Float32Array(cnt*3),g=d.grid;for(let y=0;y<=g;y++)for(let x=0;x<=g;x++){const i=y*(g+1)+x,lon=t.bounds.west+x/g,lat=t.bounds.north-y/g;p[i]=parent(lon,lat);pn.set(baseNormal(lon,lat),i*3);const step=1/128,l=project(lon-step,lat),r=project(lon+step,lat),u=project(lon,lat+step),v=project(lon,lat-step),hx=(height(lon+step,lat)-height(lon-step,lat))/(r[0]-l[0]),hz=(height(lon,lat-step)-height(lon,lat+step))/(v[1]-u[1]),len=Math.hypot(hx,1,hz);fn.set([-hx/len,1/len,-hz/len],i*3);}for(const [suffix,a] of [['parent',p],['pnormal',pn],['normal',fn]])fs.writeFileSync(path.join(out,`${d.id}.${suffix}`),Buffer.from(a.buffer));}
const lakeLevels={};
function inside(x,y,ring){let v=false;for(let i=0,j=ring.length-1;i<ring.length;j=i++){const a=ring[i],b=ring[j];if((a[1]>y)!==(b[1]>y)&&x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0])v=!v;}return v;}
for(const lake of json('godot-prototype/data/hydrology.json').lakes){const ring=lake.rings[0],xs=ring.map(p=>p[0]),ys=ring.map(p=>p[1]),bx=[Math.min(...xs),Math.max(...xs),Math.min(...ys),Math.max(...ys)];if(bx[0]<9||bx[1]>20||bx[2]<36||bx[3]>46)continue;const hist=new Map();for(let y=Math.ceil(bx[2]*128);y<=Math.floor(bx[3]*128);y++)for(let x=Math.ceil(bx[0]*128);x<=Math.floor(bx[1]*128);x++){const lon=x/128,lat=y/128;if(!inside(lon,lat,ring)||!fine.some(t=>has(t,lon,lat)))continue;const h=Math.round(sample(tile(lon,lat),lon,lat)/2)*2;hist.set(h,(hist.get(h)??0)+1);}if(hist.size)lakeLevels[lake.id]=[...hist].sort((a,b)=>b[1]-a[1])[0][0]*.0015+.002;}
fs.writeFileSync(path.join(out,'lake-levels.json'),JSON.stringify(lakeLevels));
if(!process.argv.includes('--terrain-only')){
// One shared, original-resolution shoreline lattice for both land and water. No geographic redraw.
const size=span*512+1,land=new Uint8Array(size*size),ocean=new Uint8Array(size*size);
for(const t of [...fine,...world,context]){if(t.descriptor){const png=PNG.sync.read(fs.readFileSync(path.join(root,t.descriptor.coast)));t.mask={size:png.width,rgba:png.data};}else t.mask={size:t.coastMask.size,bits:Buffer.from(t.coastMask.bits,'base64')};}
function mask(t,x,y){const b=t.bounds,s=t.mask.size,c=Math.max(0,Math.min(s-1,Math.round((x-b.west)/(b.east-b.west)*(s-1)))),r=Math.max(0,Math.min(s-1,Math.round((b.north-y)/(b.north-b.south)*(s-1)))),i=r*s+c;return t.mask.rgba?t.mask.rgba[i*4]:((t.mask.bits[i>>3]>>(i%8))&1)*255;}
for(let y=0;y<size;y++){const lat=49-y/512;for(let x=0;x<size;x++){const lon=6+x/512,t=tile(lon,lat);land[y*size+x]=mask(t,lon,lat);}}
ocean.set(land);
// Scanline polygon fill keeps inland-water exclusion independent of sea shoreline distance.
for(const lake of json('godot-prototype/data/hydrology.json').lakes){const rings=lake.rings.map(r=>r.map(([x,y])=>[(x-6)*512,(49-y)*512]));const ys=rings.flat().map(p=>p[1]),lo=Math.max(0,Math.ceil(Math.min(...ys))),hi=Math.min(size-1,Math.floor(Math.max(...ys)));for(let y=lo;y<=hi;y++){const xs=[];for(const ring of rings)for(let i=0,j=ring.length-1;i<ring.length;j=i++){const a=ring[j],b=ring[i];if((a[1]>y)!==(b[1]>y))xs.push(a[0]+(y-a[1])/(b[1]-a[1])*(b[0]-a[0]));}xs.sort((a,b)=>a-b);for(let i=0;i+1<xs.length;i+=2)ocean.fill(255,y*size+Math.max(0,Math.ceil(xs[i])),y*size+Math.min(size,Math.floor(xs[i+1])+1));}}
function png(name,bytes){const p=new PNG({width:size,height:size});for(let i=0;i<bytes.length;i++)p.data.set([bytes[i],bytes[i],bytes[i],255],i*4);fs.writeFileSync(path.join(out,name),PNG.sync.write(p,{colorType:0}));}
png('land.png',land);png('ocean.png',ocean);
// Two-pass shoreline distance in source pixels: presentation colour only, never bathymetry.
const distance=new Uint16Array(size*size);for(let i=0;i<distance.length;i++)distance[i]=ocean[i]?0:255;
for(let y=0;y<size;y++)for(let x=0;x<size;x++){const i=y*size+x;if(x)distance[i]=Math.min(distance[i],distance[i-1]+1);if(y)distance[i]=Math.min(distance[i],distance[i-size]+1);}
for(let y=size-1;y>=0;y--)for(let x=size-1;x>=0;x--){const i=y*size+x;if(x<size-1)distance[i]=Math.min(distance[i],distance[i+1]+1);if(y<size-1)distance[i]=Math.min(distance[i],distance[i+size]+1);}
png('shore.png',Uint8Array.from(distance,v=>Math.min(255,v*4)));
}
// Ecology is an artistic suitability field from the existing elevation and regional colour.
const macro=PNG.sync.read(fs.readFileSync(path.join(root,'data/surface.png'))),eco=new PNG({width:w,height:w});
const smooth=(a,b,v)=>{const t=Math.max(0,Math.min(1,(v-a)/(b-a)));return t*t*(3-2*t);};
function noise(x,y){const i=Math.floor(x),j=Math.floor(y),a=smooth(0,1,x-i),b=smooth(0,1,y-j),h=(u,v)=>{const z=Math.sin(u*127.1+v*311.7)*43758.5453;return z-Math.floor(z);};return (h(i,j)*(1-a)+h(i+1,j)*a)*(1-b)+(h(i,j+1)*(1-a)+h(i+1,j+1)*a)*b;}
for(let y=0;y<w;y++)for(let x=0;x<w;x++){const i=y*w+x,lon=6+x/32,lat=49-y/32,h=heights[i]/1.5,ny=norm[i*3+1],p=project(lon,lat),mi=(Math.round((62-lat)/50*(macro.height-1))*macro.width+Math.round((lon+12)/87*(macro.width-1)))*4,green=Math.max(0,Math.min(1,(macro.data[mi+1]-macro.data[mi+2])/60)),patch=noise(p[0]*.08,p[1]*.08)*.65+noise(p[0]*.24,p[1]*.24)*.35;
 const forest=smooth(.38,.68,patch)*smooth(.005,.12,h)*(1-smooth(1.8,2.5,h))*smooth(.55,.92,ny)*(.5+green*.5)*(1-smooth(.72,.98,noise(p[0]*.025+30,p[1]*.025)));
 eco.data.set([Math.round(forest*255),Math.round(green*255),Math.round((1-smooth(42,46,lat))*255),255],i*4);}
fs.writeFileSync(path.join(out,'ecology.png'),PNG.sync.write(eco));
const result={bounds,width:w,height:w,grid:n,coastWidth:span*512+1,mesh:'data/regional/backdrop.bin',heights:'data/regional/backdrop.height',fineTiles:fine.length,source:'Existing 85 Copernicus regional grids; existing world tiles outside their coverage. No downloads or elevation synthesis.',sourceLimit:'Copernicus regional sampling ends at 46 N and begins at 9 E; remaining Alpine arc uses existing ~3–4 km world samples.',heightScale:1.5};
fs.writeFileSync(path.join(out,'manifest.json'),JSON.stringify(result,null,2));
console.log('REGIONAL_DERIVED_READY',result);
