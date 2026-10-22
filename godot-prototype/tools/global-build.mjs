// Read existing geographic sources. Write disposable Godot presentation derivatives only.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {PNG} from 'pngjs';
import {projectLocalMapMetres} from '../../src/infrastructure/world-geography.ts';
const root=path.resolve(fileURLToPath(new URL('..',import.meta.url))),repo=path.dirname(root),out=path.join(root,'data/global');
fs.mkdirSync(out,{recursive:true});fs.writeFileSync(path.join(out,'.gdignore'),'');
const read=p=>JSON.parse(fs.readFileSync(path.join(root,p)));
const manifest=read('data/world.json'),context=JSON.parse(fs.readFileSync(path.join(repo,'public/data/world-terrain/context.json')));
const descriptors=manifest.tiles.filter(t=>t.kind==='world');
const environments=read('data/global-environments.json');
const sources=new Map(descriptors.map(t=>[t.id,JSON.parse(fs.readFileSync(path.join(repo,`public/data/world-terrain/${t.id}.json`)))]));
const smooth=(a,b,x)=>{const t=Math.max(0,Math.min(1,(x-a)/(b-a)));return t*t*(3-2*t);};
const hash=(x,y)=>{const n=Math.sin(x*127.1+y*311.7)*43758.5453;return n-Math.floor(n);};
function noise(x,y){const i=Math.floor(x),j=Math.floor(y),a=smooth(0,1,x-i),b=smooth(0,1,y-j);return (hash(i,j)*(1-a)+hash(i+1,j)*a)*(1-b)+(hash(i,j+1)*(1-a)+hash(i+1,j+1)*a)*b;}
function sample(t,lon,lat){const b=t.bounds,x=Math.max(0,Math.min(t.width-1,(lon-b.west)/(b.east-b.west)*(t.width-1))),y=Math.max(0,Math.min(t.height-1,(b.north-lat)/(b.north-b.south)*(t.height-1))),i=Math.floor(x),j=Math.floor(y),a=x-i,c=y-j,at=(p,q)=>t.elevations[Math.min(t.height-1,q)*t.width+Math.min(t.width-1,p)];return (at(i,j)*(1-a)+at(i+1,j)*a)*(1-c)+(at(i,j+1)*(1-a)+at(i+1,j+1)*a)*c;}
function source(lon,lat){const x=-12+Math.floor(Math.min(86.999999,Math.max(0,lon+12))/5)*5,y=12+Math.floor(Math.min(49.999999,Math.max(0,lat-12))/5)*5;return sources.get(`world-${y}-${x}`)??context;}
const project=(lon,lat)=>{const p=projectLocalMapMetres({lon,lat},{lon:13.5,lat:41.5});return [p.east*.001,-p.north*.001];};
// Match the existing rendered context's triangles, rather than its bilinear source grid.
function parent(lon,lat){const x=Math.max(0,Math.min(511.999999,(lon+12)/87*512)),y=Math.max(0,Math.min(511.999999,(62-lat)/50*512)),i=Math.floor(x),j=Math.floor(y),a=x-i,b=y-j,at=(p,q)=>Math.max(.001,sample(context,-12+p/512*87,62-q/512*50)*.0015),h0=at(i,j),h1=at(i+1,j),h2=at(i,j+1),h3=at(i+1,j+1);return a+b<1?h0+(h1-h0)*a+(h2-h0)*b:h3+(h2-h3)*(1-a)+(h1-h3)*(1-b);}
const globalTiles=[];let samples=0,maxEdgeDeltaMetres=0;
const contextMesh=fs.readFileSync(path.join(root,'data/tiles/context-512.bin')),contextNormalOffset=8+contextMesh.readUInt32LE()*12;
function parentNormal(lon,lat){const x=Math.max(0,Math.min(511.999999,(lon+12)/87*512)),y=Math.max(0,Math.min(511.999999,(62-lat)/50*512)),i=Math.floor(x),j=Math.floor(y),fx=x-i,fy=y-j,at=(p,q,k)=>contextMesh.readFloatLE(contextNormalOffset+((q*513+p)*3+k)*4);return [0,1,2].map(k=>{const a=at(i,j,k),b=at(i+1,j,k),c=at(i,j+1,k),d=at(i+1,j+1,k);return fx+fy<1?a+(b-a)*fx+(c-a)*fy:d+(c-d)*(1-fx)+(b-d)*(1-fy);});}
for(const d of descriptors){
 const t=sources.get(d.id),n=t.width-1,w=n+1,count=w*w,b=t.bounds;
 const pos=new Float32Array(count*3),norm=new Float32Array(count*3),uv=new Float32Array(count*2),uv2=new Float32Array(count*2),colors=new Float32Array(count*4);
 const parentHeights=new Float32Array(count),parentNormals=new Float32Array(count*3);
 for(let y=0;y<w;y++)for(let x=0;x<w;x++){
  const i=y*w+x,lon=b.west+x/n*(b.east-b.west),lat=b.north-y/n*(b.north-b.south),p=project(lon,lat),h=t.elevations[i];
  pos.set([p[0],Math.max(.001,h*.0015),p[1]],i*3);uv.set([(lon+12)/87,(62-lat)/50],i*2);uv2.set([x/n,y/n],i*2);parentHeights[i]=parent(lon,lat);colors.set([parentHeights[i],0,0,1],i*4);parentNormals.set(parentNormal(lon,lat),i*3);samples++;
 }
 for(let y=0;y<w;y++)for(let x=0;x<w;x++){const i=y*w+x,l=y*w+Math.max(0,x-1),r=y*w+Math.min(n,x+1),u=Math.max(0,y-1)*w+x,v=Math.min(n,y+1)*w+x,hx=(pos[r*3+1]-pos[l*3+1])/(pos[r*3]-pos[l*3]),hz=(pos[v*3+1]-pos[u*3+1])/(pos[v*3+2]-pos[u*3+2]),len=Math.hypot(hx,1,hz);norm.set([-hx/len,1/len,-hz/len],i*3);}
 // Shared edge normals sample both neighbouring source grids rather than a one-sided derivative.
 for(let y=0;y<w;y++)for(let x=0;x<w;x++){if(x!==0&&x!==n&&y!==0&&y!==n)continue;const lon=b.west+x/n*(b.east-b.west),lat=b.north-y/n*(b.north-b.south),dx=(b.east-b.west)/n,dy=(b.north-b.south)/n,L=project(lon-dx,lat),R=project(lon+dx,lat),U=project(lon,lat+dy),D=project(lon,lat-dy),h=(a,c)=>Math.max(.001,sample(source(a,c),a,c)*.0015),hx=(h(lon+dx,lat)-h(lon-dx,lat))/(R[0]-L[0]),hz=(h(lon,lat-dy)-h(lon,lat+dy))/(D[1]-U[1]),len=Math.hypot(hx,1,hz);norm.set([-hx/len,1/len,-hz/len],(y*w+x)*3);}
 for(const [suffix,a] of [['parent',parentHeights],['normal',norm],['pnormal',parentNormals]])fs.writeFileSync(path.join(out,`${d.id}.${suffix}`),Buffer.from(a.buffer));
 const indices=new Uint32Array(n*n*6);for(let y=0,k=0;y<n;y++)for(let x=0;x<n;x++){const a=y*w+x;indices.set([a,a+1,a+w,a+1,a+w+1,a+w],k);k+=6;}
 const header=Buffer.alloc(8);header.writeUInt32LE(count);header.writeUInt32LE(indices.length,4);
 fs.writeFileSync(path.join(out,`${d.id}.bin`),Buffer.concat([header,...[pos,norm,uv,uv2,colors,indices].map(a=>Buffer.from(a.buffer))]));
 globalTiles.push({...d,grid:n,mesh:`data/global/${d.id}.bin`});
 const adjacent=source(b.east+1e-5,b.south+.5*(b.north-b.south));if(adjacent!==t&&Math.abs(adjacent.bounds.west-b.east)<1e-5)for(let y=0;y<w;y++)maxEdgeDeltaMetres=Math.max(maxEdgeDeltaMetres,Math.abs(t.elevations[y*w+n]-sample(adjacent,b.east,b.north-y/n*(b.north-b.south))));
}
// A shared global mask extends consistent land/sea rendering. Native Italy mask stays authoritative there.
const coastRate=128,cw=87*coastRate+1,ch=50*coastRate+1,land=new Uint8Array(cw*ch),ocean=new Uint8Array(cw*ch);
for(const d of descriptors){const png=PNG.sync.read(fs.readFileSync(path.join(root,d.coast))),b=d.bounds,x0=Math.round((b.west+12)*coastRate),x1=Math.round((b.east+12)*coastRate),y0=Math.round((62-b.north)*coastRate),y1=Math.round((62-b.south)*coastRate);
 for(let y=y0;y<=y1;y++){const sy=Math.round((y-y0)/(y1-y0)*(png.height-1));for(let x=x0;x<=x1;x++){const sx=Math.round((x-x0)/(x1-x0)*(png.width-1));land[y*cw+x]=png.data[(sy*png.width+sx)*4];}}
}
ocean.set(land);
const hydrology=read('data/hydrology.json');
// Fill inland-water exclusions using existing rings, without changing river/coast coordinates.
for(const lake of hydrology.lakes){const rings=lake.rings.map(r=>r.map(([x,y])=>[(x+12)*coastRate,(62-y)*coastRate])),ys=rings.flat().map(p=>p[1]),lo=Math.max(0,Math.ceil(Math.min(...ys))),hi=Math.min(ch-1,Math.floor(Math.max(...ys)));
 for(let y=lo;y<=hi;y++){const xs=[];for(const ring of rings)for(let i=0,j=ring.length-1;i<ring.length;j=i++){const a=ring[j],b=ring[i];if((a[1]>y)!==(b[1]>y))xs.push(a[0]+(y-a[1])/(b[1]-a[1])*(b[0]-a[0]));}xs.sort((a,b)=>a-b);for(let i=0;i+1<xs.length;i+=2)ocean.fill(255,y*cw+Math.max(0,Math.ceil(xs[i])),y*cw+Math.min(cw,Math.floor(xs[i+1])+1));}
}
function grey(file,width,height,bytes){const p=new PNG({width,height});for(let i=0;i<bytes.length;i++)p.data.set([bytes[i],bytes[i],bytes[i],255],i*4);fs.writeFileSync(path.join(out,file),PNG.sync.write(p,{colorType:0}));}
grey('land.png',cw,ch,land);grey('ocean.png',cw,ch,ocean);
// Lower-resolution shore-distance colour field; clipping uses the higher-resolution masks above.
const sr=32,sw=87*sr+1,sh=50*sr+1,dist=new Float32Array(sw*sh);
for(let y=0;y<sh;y++)for(let x=0;x<sw;x++)dist[y*sw+x]=ocean[(y*4)*cw+x*4]>127?0:1000;
const dx=111.2/sr,diag=Math.SQRT2*dx;
for(let y=0;y<sh;y++)for(let x=0;x<sw;x++){const i=y*sw+x;let v=dist[i];if(x)v=Math.min(v,dist[i-1]+dx);if(y)v=Math.min(v,dist[i-sw]+dx);if(x&&y)v=Math.min(v,dist[i-sw-1]+diag);dist[i]=v;}
for(let y=sh-1;y>=0;y--)for(let x=sw-1;x>=0;x--){const i=y*sw+x;let v=dist[i];if(x+1<sw)v=Math.min(v,dist[i+1]+dx);if(y+1<sh)v=Math.min(v,dist[i+sw]+dx);if(x+1<sw&&y+1<sh)v=Math.min(v,dist[i+sw+1]+diag);dist[i]=v;}
grey('shore.png',sw,sh,Uint8Array.from(dist,d=>Math.min(255,Math.round(d*4))));
// Ecological suitability: contemporary colour/latitude/elevation cues, not an ancient land-cover claim.
const rate=16,ew=87*rate+1,eh=50*rate+1,eco=new PNG({width:ew,height:eh}),river=new Uint8Array(ew*eh),surface=PNG.sync.read(fs.readFileSync(path.join(root,'data/surface.png')));
for(const f of hydrology.rivers){const lines=f.geometry.type==='MultiLineString'?f.geometry.coordinates:[f.geometry.coordinates];for(const line of lines)for(let i=1;i<line.length;i++){
 const a=line[i-1],b=line[i],steps=Math.max(1,Math.ceil(Math.hypot(b[0]-a[0],b[1]-a[1])*rate*2));
 for(let j=0;j<=steps;j++){const t=j/steps,lon=a[0]+(b[0]-a[0])*t,lat=a[1]+(b[1]-a[1])*t,cx=Math.round((lon+12)*rate),cy=Math.round((62-lat)*rate);
  for(let yy=-3;yy<=3;yy++)for(let xx=-3;xx<=3;xx++){const x=cx+xx,y=cy+yy;if(x<0||x>=ew||y<0||y>=eh)continue;const km=Math.hypot(xx*Math.cos(lat*Math.PI/180),yy)*111.2/rate,v=Math.round(Math.exp(-km*km/48)*255);river[y*ew+x]=Math.max(river[y*ew+x],v);}
 }
}}
for(let y=0;y<eh;y++)for(let x=0;x<ew;x++){
 const lon=-12+x/rate,lat=62-y/rate,t=source(lon,lat),h=sample(t,lon,lat)*.001,p=project(lon,lat),sx=Math.round(x/(ew-1)*(surface.width-1)),sy=Math.round(y/(eh-1)*(surface.height-1)),i=(sy*surface.width+sx)*4,r=surface.data[i]/255,g=surface.data[i+1]/255,b=surface.data[i+2]/255;
 const green=smooth(-.015,.13,g-r*.91),desert=smooth(.04,.18,r-b)*smooth(.30,.62,r)*(1-green*.9),south=1-smooth(32,43,lat);
 let dry=Math.max(desert,south*.62*(1-green));
 for(const field of environments.drynessFields){const d=((lon-field.center[0])/field.radiusDegrees[0])**2+((lat-field.center[1])/field.radiusDegrees[1])**2,high=field.minimumElevationKm===0?1:smooth(field.minimumElevationKm,field.minimumElevationKm+.6,h);dry=Math.max(dry,Math.exp(-d)*field.strength*high*(1-green*.25));}
 const patch=noise(p[0]*.065,p[1]*.065)*.65+noise(p[0]*.24,p[1]*.24)*.35,wet=river[y*ew+x]/255;
 const forest=Math.max(smooth(.40,.72,patch)*(1-dry*.95)*(.22+green*.78),wet*dry*.20)*(1-smooth(2.3,3.5,h))*smooth(.005,.09,h);
 eco.data.set([Math.round(forest*255),Math.round(Math.max(green,wet*.8)*255),Math.round(dry*255),Math.round(wet*255)],(y*ew+x)*4);
}
fs.writeFileSync(path.join(out,'ecology.png'),PNG.sync.write(eco));
const result={version:1,bounds:manifest.bounds,tiles:globalTiles,coast:{width:cw,height:ch,samplesPerDegree:coastRate},shore:{width:sw,height:sh,notice:'Approximate geometric shore distance for colour, not bathymetry'},ecology:{width:ew,height:eh,samplesPerDegree:rate,channels:'R forest suitability, G moisture/colour cue, B aridity cue, A source-river corridor influence; interpretive, not ancient ecology'},source:'Existing 176 Mapzen world grids and original coast masks, existing macro colour and river centrelines. No downloads or synthesized elevations.',elevationSamples:samples,maxSourceEastWestEdgeDeltaMetres:maxEdgeDeltaMetres};
fs.writeFileSync(path.join(out,'manifest.json'),JSON.stringify(result,null,2));
fs.writeFileSync(path.join(out,'source-hashes.json'),JSON.stringify(descriptors.map(d=>({id:d.id,sha256:crypto.createHash('sha256').update(fs.readFileSync(path.join(repo,`public/data/world-terrain/${d.id}.json`))).digest('hex')})),null,2));
console.log('GLOBAL_DERIVED_READY',JSON.stringify({tiles:globalTiles.length,samples,maxEdgeDeltaMetres,coast:[cw,ch],ecology:[ew,eh]}));
