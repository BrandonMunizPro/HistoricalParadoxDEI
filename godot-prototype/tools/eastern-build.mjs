// Bounded physical derivatives. No historical/political inputs are written.
import fs from 'node:fs';
import crypto from 'node:crypto';
import {fromUrl} from 'geotiff';
import {PNG} from 'pngjs';
import {unzipSync} from 'fflate';
import {read as readShape} from 'shapefile';
import {projectLocalMapMetres} from '../../src/infrastructure/world-geography.ts';
const region=process.argv[2]??'levant';
if(!['levant','egypt'].includes(region))throw Error('Expected levant or egypt');
const settings=JSON.parse(fs.readFileSync('godot-prototype/data/eastern-regions.json'));
const bounds=settings.regions[region].bounds;
const {west:W,east:E,south:S,north:N}=bounds,R=128,width=(E-W)*R+1,height=(N-S)*R+1;
const out=`godot-prototype/data/${region}`,cache=`data/geography/source-cache/${region}`;
fs.mkdirSync(out,{recursive:true});fs.mkdirSync(cache,{recursive:true});fs.writeFileSync(out+'/.gdignore','');
const read=p=>JSON.parse(fs.readFileSync(p)),hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const smooth=(a,b,x)=>{const t=Math.max(0,Math.min(1,(x-a)/(b-a)));return t*t*(3-2*t);};
// Leave the completed Anatolian footprint untouched; feather towards its southern edge.
function anatolia(x,y){const south=35.8+1.5*smooth(35.8,39.5,x),north=40.4+1.5*smooth(28.6,29.2,x);return smooth(25.8,26.2,x)*(1-smooth(42.2,42.6,x))*smooth(south-.2,south+.2,y)*(1-smooth(north-.2,north+.2,y));}
function levantWeight(x,y){return smooth(33,33.25,x)*(1-smooth(41.75,42,x))*smooth(30,30.25,y)*(1-smooth(37.75,38,y))*(1-smooth(.001,.01,anatolia(x,y)))*smooth(34.+.6*smooth(32.,33.,y),34.25+.6*smooth(32.,33.,y),x);}
function weight(x,y){if(region==='levant')return levantWeight(x,y);return smooth(W,W+(settings.regions[region].westFeatherDegrees??.25),x)*(1-smooth(E-.25,E,x))*smooth(S,S+.25,y)*(1-smooth(N-.25,N,y))*(1-smooth(.001,.01,levantWeight(x,y)));}
const world=read('godot-prototype/data/world.json').tiles.filter(t=>t.kind==='world'&&t.bounds.west<E&&t.bounds.east>W&&t.bounds.south<N&&t.bounds.north>S).map(t=>read('public/data/world-terrain/'+t.id+'.json'));
function sample(t,x,y){const b=t.bounds,px=Math.max(0,Math.min(t.width-1,(x-b.west)/(b.east-b.west)*(t.width-1))),py=Math.max(0,Math.min(t.height-1,(b.north-y)/(b.north-b.south)*(t.height-1))),i=Math.min(t.width-2,Math.floor(px)),j=Math.min(t.height-2,Math.floor(py)),u=px-i,v=py-j,a=t.elevations[j*t.width+i],bb=t.elevations[j*t.width+i+1],c=t.elevations[(j+1)*t.width+i],d=t.elevations[(j+1)*t.width+i+1];return (a*(1-u)+bb*u)*(1-v)+(c*(1-u)+d*u)*v;}
const fallback=(x,y)=>sample(world.find(t=>x>=t.bounds.west&&x<=t.bounds.east&&y>=t.bounds.south&&y<=t.bounds.north),x,y);
const tiles=new Map(),sources=[],jobs=[];
for(let lat=S;lat<N;lat++)for(let lon=W;lon<E;lon++)if([0,.5,1].some(dx=>[0,.5,1].some(dy=>weight(lon+dx,lat+dy)>.001)))jobs.push({lon,lat});
async function get({lon,lat}){
 const id=`N${lat}E${lon}`,file=`${cache}/${id}.json`,paths=[`public/data/regional-details/detail-egypt-${id}.json`,`data/geography/source-cache/anatolia/${id}.json`,file];
 if(fs.existsSync(`${cache}/${id}.missing.json`)){sources.push(read(`${cache}/${id}.missing.json`));return;}
 let path=paths.find(p=>fs.existsSync(p)),raw;
 if(path)raw=read(path);else{
  const name=`Copernicus_DSM_COG_10_N${lat}_00_E${String(lon).padStart(3,'0')}_00_DEM`,url=`https://copernicus-dem-30m.s3.amazonaws.com/${name}/${name}.tif`;
  console.log('SOURCE_FETCH',id);const response=await globalThis.fetch(url,{method:'HEAD'});
  if(response.status===404){const note={id,url,missing:true,notice:'No DSM tile; existing terrain retained.'};sources.push(note);fs.writeFileSync(`${cache}/${id}.missing.json`,JSON.stringify(note));return;}
  if(!response.ok)throw Error(`${id} HTTP ${response.status}`);
  const t=await fromUrl(url),r=await t.readRasters({bbox:[lon,lat,lon+1,lat+1],width:129,height:129,interleave:true,resampleMethod:'bilinear'});
  raw={bounds:{west:lon,east:lon+1,south:lat,north:lat+1},width:129,height:129,elevations:Array.from(r,v=>Math.round(v*10)/10),source:url};
  if(raw.elevations.length!==16641||raw.elevations.some(v=>!Number.isFinite(v)||v< -500||v>9000))throw Error('Invalid DEM '+id);
  path=file;fs.writeFileSync(file,JSON.stringify(raw));
 }
 const at=(x,y)=>raw.elevations[Math.max(0,Math.min(128,y))*129+Math.max(0,Math.min(128,x))];
 const elevations=path.includes('public/data')?Float32Array.from(raw.elevations):Float32Array.from(raw.elevations,(_,i)=>{const x=(i%129)/128*129-.5,y=Math.floor(i/129)/128*129-.5,a=Math.floor(x),b=Math.floor(y),u=x-a,v=y-b;return (at(a,b)*(1-u)+at(a+1,b)*u)*(1-v)+(at(a,b+1)*(1-u)+at(a+1,b+1)*u)*v;});
 tiles.set(`${lon},${lat}`,{...raw,elevations});sources.push({id,path,sha256:hash(fs.readFileSync(path)),url:raw.source});
}
for(let i=0;i<jobs.length;i+=4)await Promise.all(jobs.slice(i,i+4).map(get));
const edges=new Map();let maxRawEdgeDifferenceMetres=0;
for(const t of tiles.values())for(let y=0;y<129;y++)for(let x=0;x<129;x++)if(x===0||x===128||y===0||y===128){const key=`${t.bounds.west*128+x}/${t.bounds.north*128-y}`,e=edges.get(key)??[];e.push({t,i:y*129+x});edges.set(key,e);}
for(const e of edges.values())if(e.length>1){const v=e.map(p=>p.t.elevations[p.i]);maxRawEdgeDifferenceMetres=Math.max(maxRawEdgeDifferenceMetres,Math.max(...v)-Math.min(...v));const mean=v.reduce((a,b)=>a+b,0)/v.length;for(const p of e)p.t.elevations[p.i]=mean;}
function source(x,y){const t=tiles.get(`${Math.min(E-1,Math.floor(x))},${Math.min(N-1,Math.floor(y))}`);return t?sample(t,x,y):fallback(x,y);}
const heights=new Float32Array(width*height);
for(let y=0;y<height;y++)for(let x=0;x<width;x++)heights[y*width+x]=source(W+x/R,N-y/R);
fs.writeFileSync(out+'/source-metres.bin',Buffer.from(heights.buffer));
if(region==='egypt'){
 // A soft landform corridor, not a modern crop/irrigation classification.
 const features=read('data/geography/source-cache/rivers_lake_centerlines.json').features.filter(f=>['Nile','Rosetta Branch','Damietta Branch'].includes(f.properties.name));
 const distance=new Float32Array(width*height).fill(1e6),level=new Float32Array(width*height);
 for(const f of features)for(const line of f.geometry.coordinates)for(let i=1;i<line.length;i++){
  const a=line[i-1],b=line[i],steps=Math.max(1,Math.ceil(Math.hypot(b[0]-a[0],b[1]-a[1])*R*2));
  for(let j=0;j<=steps;j++){const t=j/steps,x=Math.round((a[0]+(b[0]-a[0])*t-W)*R),y=Math.round((N-a[1]-(b[1]-a[1])*t)*R);if(x<0||x>=width||y<0||y>=height)continue;const k=y*width+x;distance[k]=0;level[k]=heights[k];}
 }
 function relax(i,j,d){if(distance[j]+d<distance[i]){distance[i]=distance[j]+d;level[i]=level[j];}}
 const dy=111.195/R,dx=dy*Math.cos(28*Math.PI/180),diag=Math.hypot(dx,dy);
 for(let y=0;y<height;y++)for(let x=0;x<width;x++){const i=y*width+x;if(x)relax(i,i-1,dx);if(y)relax(i,i-width,dy);if(x&&y)relax(i,i-width-1,diag);if(x+1<width&&y)relax(i,i-width+1,diag);}
 for(let y=height-1;y>=0;y--)for(let x=width-1;x>=0;x--){const i=y*width+x;if(x+1<width)relax(i,i+1,dx);if(y+1<height)relax(i,i+width,dy);if(x+1<width&&y+1<height)relax(i,i+width+1,diag);if(x&&y+1<height)relax(i,i+width-1,diag);}
 const p=new PNG({width,height});
 const tuning=settings.floodplain,research=read('godot-prototype/data/research-locations.json').records;
 const oases=tuning.oases.map(o=>{const record=research.find(r=>r.proposedId===o.researchId);if(!record||record.presence278Bce!=='attested')throw Error('Unattested oasis '+o.researchId);return {...o,...record.coordinates};});
 for(let y=0;y<height;y++)for(let x=0;x<width;x++){
  const i=y*width+x,lon=W+x/R,lat=N-y/R,h=heights[i];
  const valley=(1-smooth(...tuning.valleyHeightMetres,Math.max(0,h-level[i])))*(1-smooth(...tuning.valleyDistanceKm,distance[i]));
  const delta=smooth(29.65,30.2,lat)*(1-smooth(...tuning.deltaHeightMetres,h))*(1-smooth(...tuning.deltaDistanceKm,distance[i]))*smooth(29.3,29.7,lon)*(1-smooth(32.2,32.6,lon));
  let wet=Math.max(valley,delta);for(const o of oases){const d=Math.hypot((lon-o.lon)*111.195*Math.cos(lat*Math.PI/180),(lat-o.lat)*111.195);wet=Math.max(wet,(1-smooth(o.radiusKm*.3,o.radiusKm,d))*(1-smooth(o.maxHeightMetres*.7,o.maxHeightMetres,h))*o.strength);}
  const v=Math.round(wet*255);p.data.set([v,v,v,255],i*4);
 }
 fs.writeFileSync(out+'/alluvium.png',PNG.sync.write(p,{colorType:0}));
 fs.writeFileSync(out+'/alluvium-rules.json',JSON.stringify({notice:'Interpretive potential floodplain/oasis habitat, not actual 278 BCE cultivation. No modern parcel or crop mask. No invented ancient distributaries or settlement anchors.',source:'data/geography/source-cache/rivers_lake_centerlines.json',sha256:hash(fs.readFileSync('data/geography/source-cache/rivers_lake_centerlines.json')),tuning,oases},null,2));
}
function project(x,y){const p=projectLocalMapMetres({lon:x,lat:y},{lon:13.5,lat:41.5});return [p.east*.001,-p.north*.001];}
function normal(x,y){const dx=1/R,l=project(x-dx,y),r=project(x+dx,y),u=project(x,y+dx),d=project(x,y-dx),hx=(source(Math.min(E,x+dx),y)-source(Math.max(W,x-dx),y))*.0015/(r[0]-l[0]),hz=(source(x,Math.max(S,y-dx))-source(x,Math.min(N,y+dx)))*.0015/(d[1]-u[1]),n=Math.hypot(hx,1,hz);return [-hx/n,1/n,-hz/n];}
const normals=new PNG({width,height});for(let y=0;y<height;y++)for(let x=0;x<width;x++)normals.data.set([...normal(W+x/R,N-y/R).map(v=>Math.round((v*.5+.5)*255)),255],(y*width+x)*4);
fs.writeFileSync(out+'/normals.png',PNG.sync.write(normals));
function originalHeight(x,y){const t=world.find(t=>x>=t.bounds.west&&x<=t.bounds.east&&y>=t.bounds.south&&y<=t.bounds.north),b=t.bounds,px=(x-b.west)/(b.east-b.west)*128,py=(b.north-y)/(b.north-b.south)*128,i=Math.min(127,Math.max(0,Math.floor(px))),j=Math.min(127,Math.max(0,Math.floor(py))),u=px-i,v=py-j,at=(a,c)=>Math.max(.001,t.elevations[c*129+a]*.0015),a=at(i,j),bb=at(i+1,j),c=at(i,j+1),d=at(i+1,j+1);return u+v<1?a+(bb-a)*u+(c-a)*v:d+(c-d)*(1-u)+(bb-d)*(1-v);}
const fw=(E-W)*32+1,fh=(N-S)*32+1,farHeights=new Float32Array(fw*fh);
for(let y=0;y<fh;y++)for(let x=0;x<fw;x++){const lon=W+x/32,lat=N-y/32,old=originalHeight(lon,lat);farHeights[y*fw+x]=old+(source(lon,lat)*.0015-old)*weight(lon,lat);}
fs.writeFileSync(out+'/far-heights.bin',Buffer.from(farHeights.buffer));
function parent(x,y){const px=(x-W)*32,py=(N-y)*32,i=Math.min(fw-2,Math.max(0,Math.floor(px))),j=Math.min(fh-2,Math.max(0,Math.floor(py))),u=px-i,v=py-j,a=farHeights[j*fw+i],b=farHeights[j*fw+i+1],c=farHeights[(j+1)*fw+i],d=farHeights[(j+1)*fw+i+1];return u+v<1?a+(b-a)*u+(c-a)*v:d+(c-d)*(1-u)+(b-d)*(1-v);}
function mesh(b,rate,file,near=false){const w=(b.east-b.west)*rate+1,h=(b.north-b.south)*rate+1,count=w*h,pos=new Float32Array(count*3),norm=new Float32Array(count*3),uv=new Float32Array(count*2),uv2=new Float32Array(count*2),colors=new Float32Array(count*4);
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){const i=y*w+x,lon=b.west+x/rate,lat=b.north-y/rate,p=project(lon,lat),edge=near?smooth(0,.08,Math.min(lon-b.west,b.east-lon,lat-b.south,b.north-lat))*weight(lon,lat):1,base=parent(lon,lat),z=near?base+(source(lon,lat)*.0015-base)*edge:base;const n=normal(lon,lat);pos.set([p[0],z,p[1]],i*3);norm.set(n,i*3);uv.set([(lon+12)/87,(62-lat)/50],i*2);uv2.set([base,0],i*2);colors.set([base,0,0,1],i*4);}
 const ix=new Uint32Array((w-1)*(h-1)*6);for(let y=0,k=0;y<h-1;y++)for(let x=0;x<w-1;x++){const a=y*w+x;ix.set([a,a+1,a+w,a+1,a+w+1,a+w],k);k+=6;}
 const header=Buffer.alloc(8);header.writeUInt32LE(count);header.writeUInt32LE(ix.length,4);fs.writeFileSync(out+'/'+file,Buffer.concat([header,...[pos,norm,uv,uv2,colors,ix].map(a=>Buffer.from(a.buffer))]));return {vertices:count,triangles:ix.length/3};}
const far=mesh(bounds,32,'far.bin'),details=[];
for(const {lon,lat} of jobs){const b={west:lon,east:lon+1,south:lat,north:lat+1},file=`near-${lat}-${lon}.bin`;details.push({id:`${lat}-${lon}`,bounds:b,mesh:`data/${region}/${file}`,...mesh(b,128,file,true)});}
const supplement={rivers:[],lakes:[],renderLakes:[],notice:'Existing local Natural Earth source. Modern physical proxies, not dated ancient water geometry.'};
if(region==='levant'){
 const rivers=read('data/geography/source-cache/rivers_lake_centerlines.json');
 supplement.rivers=rivers.features.filter(f=>f.properties.name==='Jordan'&&f.properties.featurecla==='River');
 const lake=read('data/geography/source-cache/lakes.json').features.find(f=>f.properties.name==='Sea of Galilee');
 if(lake){
  const rings=lake.geometry.coordinates;const values=rings[0].map(p=>source(p[0],p[1])).sort((a,b)=>a-b),metres=values[Math.floor(values.length/2)];
  supplement.lakes.push({id:'levant-galilee',rings});
  // Ear clipping uses the same triangulator as the existing geography adapter.
  const {ShapeUtils,Vector2}=await import('three');const ring=rings[0].slice(0,-1).map(p=>new Vector2(...project(...p)));
  supplement.renderLakes.push({id:'levant-galilee',metres,vertices:ring.map(p=>[p.x,metres*.0015+.002,p.y]),indices:ShapeUtils.triangulateShape(ring,[]).flat()});
 }
}
fs.writeFileSync(out+'/hydrology-supplement.json',JSON.stringify(supplement));
const archive=fs.readFileSync('data/geography/source-cache/gshhg.zip'),zip=unzipSync(archive,{filter:f=>/GSHHS_f_L1\.(shp|dbf)$|^(LICENSE.TXT|COPYINGv3|COPYING.LESSERv3)$/.test(f.name)});
for(const name of ['LICENSE.TXT','COPYINGv3','COPYING.LESSERv3'])if(zip[name])fs.writeFileSync(out+'/GSHHG-'+name,zip[name]);
const land=await readShape(zip['GSHHS_shp/f/GSHHS_f_L1.shp'].buffer,zip['GSHHS_shp/f/GSHHS_f_L1.dbf'].buffer),mw=(E-W)*512+1,mh=(N-S)*512+1,mask=new Uint8Array(mw*mh);
function clip(ring){let p=ring;for(const [axis,v,sign] of [[0,W,1],[0,E,-1],[1,S,1],[1,N,-1]]){const q=[];for(let i=0;i<p.length;i++){const a=p[i],b=p[(i+1)%p.length],ai=(a[axis]-v)*sign>=0,bi=(b[axis]-v)*sign>=0;if(ai)q.push(a);if(ai!==bi){const t=(v-a[axis])/(b[axis]-a[axis]);q.push([a[0]+t*(b[0]-a[0]),a[1]+t*(b[1]-a[1])]);}}p=q;}return p;}
function fill(rings,buffer,value){const rr=rings.map(clip).filter(r=>r.length>2).map(r=>r.map(([x,y])=>[(x-W)*512,(N-y)*512]));if(!rr.length)return;let lo=mh-1,hi=0;for(const r of rr)for(const p of r){lo=Math.min(lo,p[1]);hi=Math.max(hi,p[1]);}for(let y=Math.max(0,Math.ceil(lo));y<=Math.min(mh-1,Math.floor(hi));y++){const xs=[];for(const r of rr)for(let i=0,j=r.length-1;i<r.length;j=i++){const a=r[i],b=r[j];if((a[1]>y)!==(b[1]>y))xs.push(a[0]+(y-a[1])*(b[0]-a[0])/(b[1]-a[1]));}xs.sort((a,b)=>a-b);for(let i=0;i+1<xs.length;i+=2)buffer.fill(value,y*mw+Math.max(0,Math.ceil(xs[i])),y*mw+Math.min(mw,Math.floor(xs[i+1])+1));}}
for(const f of land.features)for(const p of f.geometry.type==='MultiPolygon'?f.geometry.coordinates:[f.geometry.coordinates])fill(p,mask,255);
const ocean=mask.slice();for(const lake of [...read('godot-prototype/data/hydrology.json').lakes,...supplement.lakes]){fill(lake.rings,mask,0);fill(lake.rings,ocean,255);}
function grey(file,bytes,w=mw,h=mh){const p=new PNG({width:w,height:h});for(let i=0;i<bytes.length;i++)p.data.set([bytes[i],bytes[i],bytes[i],255],i*4);fs.writeFileSync(out+'/'+file,PNG.sync.write(p,{colorType:0}));}
grey('land.png',mask);grey('ocean.png',ocean);
const dist=new Float32Array(width*height),d=111.195/R,di=Math.SQRT2*d;
for(let y=0;y<height;y++)for(let x=0;x<width;x++)dist[y*width+x]=ocean[y*4*mw+x*4]>127?0:64;
for(let y=0;y<height;y++)for(let x=0;x<width;x++){const i=y*width+x;let v=dist[i];if(x)v=Math.min(v,dist[i-1]+d);if(y)v=Math.min(v,dist[i-width]+d);if(x&&y)v=Math.min(v,dist[i-width-1]+di);dist[i]=v;}
for(let y=height-1;y>=0;y--)for(let x=width-1;x>=0;x--){const i=y*width+x;let v=dist[i];if(x+1<width)v=Math.min(v,dist[i+1]+d);if(y+1<height)v=Math.min(v,dist[i+width]+d);if(x+1<width&&y+1<height)v=Math.min(v,dist[i+width+1]+di);dist[i]=v;}
grey('shore.png',Uint8Array.from(dist,v=>Math.min(255,Math.round(v*4))),width,height);
fs.writeFileSync(out+'/manifest.json',JSON.stringify({region,bounds,width,height,heightScale:1.5,far,details,sharedEdges:{reconciled:true,maxRawEdgeDifferenceMetres},sources:sources.sort((a,b)=>a.id.localeCompare(b.id)),coast:{archive:'data/geography/source-cache/gshhg.zip',sha256:hash(archive)},notice:'Modern physical source proxy; no ancient shoreline, land-cover, river or settlement reconstruction. Source negatives preserved.'},null,2));
console.log('EASTERN_BUILD_OK',region,sources.length,details.length);
