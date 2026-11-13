import fs from 'node:fs';
import crypto from 'node:crypto';
import {unzipSync} from 'fflate';
import {read as readShape} from 'shapefile';
import {projectLocalMapMetres,unprojectLocalMapMetres} from '../../src/infrastructure/world-geography.ts';
const archive=fs.readFileSync('data/geography/source-cache/gshhg.zip');
const zip=unzipSync(archive,{filter:f=>/GSHHS_f_L1\.(shp|dbf)$|^(LICENSE.TXT|COPYINGv3|COPYING.LESSERv3)$/.test(f.name)});
const coast=await readShape(zip['GSHHS_shp/f/GSHHS_f_L1.shp'].buffer,zip['GSHHS_shp/f/GSHHS_f_L1.dbf'].buffer);
const project=p=>{const q=projectLocalMapMetres({lon:p[0],lat:p[1]},{lon:13.5,lat:41.5});return [q.east/1000,-q.north/1000];};
const groups=[];
for(const f of coast.features)for(const poly of f.geometry.type==='MultiPolygon'?f.geometry.coordinates:[f.geometry.coordinates])for(const ring of poly){
 let group=[];
 for(const p of ring){if(p[0]>15.60&&p[0]<15.69&&p[1]>38.012&&p[1]<38.04){group.push(p);}else if(group.length){groups.push({points:group,ring});group=[];}}
 if(group.length)groups.push({points:group,ring});
}
const selected=groups.sort((a,b)=>b.points.length-a.points.length)[0],geographic=selected?.points;if(!geographic||geographic.length<5)throw Error('Pellaro coastline missing');
let line=geographic.map(project);
// A local presentation curve rounds the source's stair steps within its source
// precision. Preserve original coordinates above for provenance and comparison.
for(let pass=0;pass<2;pass++){const next=[line[0]];for(let i=1;i<line.length;i++){const a=line[i-1],b=line[i];next.push(a.map((v,j)=>v*.75+b[j]*.25),a.map((v,j)=>v*.25+b[j]*.75));}next.push(line.at(-1));line=next;}
const xs=line.map(p=>p[0]),ys=line.map(p=>p[1]);
const bounds=[Math.min(...xs)-.6,Math.min(...ys)-.6,Math.max(...xs)+.6,Math.max(...ys)+.6];
// Orient each land normal using the source polygon, not the coarse raster.
const inside=p=>{let result=false;const ring=selected.ring;for(let i=0,j=ring.length-1;i<ring.length;j=i++){const a=ring[i],b=ring[j];if((a[1]>p.lat)!==(b[1]>p.lat)&&p.lon<(b[0]-a[0])*(p.lat-a[1])/(b[1]-a[1])+a[0])result=!result;}return result;};
const segments=line.slice(1).map((b,i)=>{const a=line[i],dx=b[0]-a[0],dy=b[1]-a[1],len=Math.hypot(dx,dy);let n=[-dy/len,dx/len];const probe=unprojectLocalMapMetres(((a[0]+b[0])/2+n[0]*.1)*1000,-((a[1]+b[1])/2+n[1]*.1)*1000,{lon:13.5,lat:41.5});if(!inside(probe))n=n.map(v=>-v);return {a,b,n,len};}).filter(s=>s.len>0);
const total=segments.reduce((n,s)=>n+s.len,0);let cumulative=0;for(const s of segments){s.along=cumulative;cumulative+=s.len;}
const size=1024,field=Buffer.alloc(size*size*4),coverage=Buffer.alloc(size*size*4);
for(let y=0;y<size;y++)for(let x=0;x<size;x++){
 const p=[bounds[0]+x/(size-1)*(bounds[2]-bounds[0]),bounds[1]+y/(size-1)*(bounds[3]-bounds[1])];let best=Infinity,signed=0,along=0;
 for(const s of segments){const dx=s.b[0]-s.a[0],dy=s.b[1]-s.a[1],t=Math.max(0,Math.min(1,((p[0]-s.a[0])*dx+(p[1]-s.a[1])*dy)/(s.len*s.len))),rx=p[0]-s.a[0]-dx*t,ry=p[1]-s.a[1]-dy*t,d=Math.hypot(rx,ry);if(d<best){best=d;signed=d*(rx*s.n[0]+ry*s.n[1]>=0?1:-1);along=s.along+t*s.len;}}
 field.writeFloatLE(signed,(y*size+x)*4);
 coverage.writeFloatLE(Math.max(0,Math.min(1,Math.min(along,total-along)/.25)),(y*size+x)*4);
}
const dir='godot-prototype/data/coastal-focus';fs.mkdirSync(dir,{recursive:true});fs.writeFileSync(dir+'/.gdignore','');fs.writeFileSync(dir+'/distance.bin',field);
for(const name of ['LICENSE.TXT','COPYINGv3','COPYING.LESSERv3'])if(zip[name])fs.writeFileSync(dir+'/GSHHG-'+name,zip[name]);
fs.writeFileSync(dir+'/coverage.bin',coverage);
fs.writeFileSync(dir+'/pellaro.json',JSON.stringify({name:'Pellaro — southern Calabria',source:'GSHHG 2.3.7 full-resolution modern shoreline, existing project archive; not a reconstructed ancient beach.',archiveSha256:crypto.createHash('sha256').update(archive).digest('hex'),size,bounds,geographic,line,segments,beachWidthKm:.10,surfWidthKm:.18,notice:'Local visual shoreline and illustrative sediment profile. No surveyed bathymetry, tides, or change to canonical geography.'},null,2));
console.log('COASTAL_FOCUS_BUILT',geographic.length,'source vertices',segments.reduce((n,s)=>n+s.len,0).toFixed(2),'km',bounds);
