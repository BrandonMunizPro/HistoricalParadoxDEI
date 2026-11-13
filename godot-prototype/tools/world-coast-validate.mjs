import fs from 'node:fs';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {projectLocalMapMetres,unprojectLocalMapMetres} from '../../src/infrastructure/world-geography.ts';
const root='godot-prototype/data/world-coasts/',manifest=JSON.parse(fs.readFileSync(root+'manifest.json'));
const archiveHash=crypto.createHash('sha256').update(fs.readFileSync('data/geography/source-cache/gshhg.zip')).digest('hex');
assert.equal(archiveHash,manifest.archiveSha256,'Original GSHHG archive differs from the catalog source');
const asInt=p=>{const b=fs.readFileSync(root+p);return new Int32Array(b.buffer,b.byteOffset,b.length/4);};
const headers=asInt('cells.bin'),ids=asInt('indices.bin'),cells=new Map(),chunks=new Map();
for(let i=0;i<headers.length;i+=4){assert(headers[i+2]>=0&&headers[i+2]+headers[i+3]<=ids.length);cells.set(headers[i]+','+headers[i+1],[headers[i+2],headers[i+3]]);}
assert(ids.every(id=>id>=0&&id<manifest.segments));
const indexed=new Uint8Array(manifest.segments);
for(const id of ids)indexed[id]=1;
assert(indexed.every(value=>value===1),'A source coastline segment is missing from the streaming index');
const digest=crypto.createHash('sha256');let count=0,maxChunkBytes=0;
for(const chunk of manifest.chunks){const bytes=fs.readFileSync(root+chunk.file),h=new Float32Array(bytes.buffer,bytes.byteOffset,bytes.length/4);assert.equal(h.length,chunk.count*12);assert(h.every(Number.isFinite));maxChunkBytes=Math.max(maxChunkBytes,bytes.length);assert(bytes.length<100*1024*1024);digest.update(bytes);for(let i=0;i<h.length;i+=12){assert(Math.abs(Math.hypot(h[i+4],h[i+5])-1)<.0001);assert(h[i+7]>0);assert(h[i+8]>=0&&h[i+8]<=1&&h[i+9]>=0&&h[i+9]<=1);count++;}}
assert.equal(count,manifest.segments);assert.equal(digest.digest('hex'),manifest.segmentsSha256);
const segment=id=>{const k=Math.floor(id/manifest.chunkSize);if(!chunks.has(k)){const b=fs.readFileSync(root+manifest.chunks[k].file);chunks.set(k,new Float32Array(b.buffer,b.byteOffset,b.length/4));}return chunks.get(k).subarray((id-manifest.chunks[k].start)*12,(id-manifest.chunks[k].start+1)*12);};
const project=p=>{const q=projectLocalMapMetres({lon:p[0],lat:p[1]},{lon:13.5,lat:41.5});return [q.east/1000,-q.north/1000];};
function nearest(p,radius=25,bankOnly=false){let best=Infinity,result=null;const seen=new Set();for(let y=Math.floor(p[1]-radius);y<=Math.ceil(p[1]+radius);y++)for(let x=Math.floor(p[0]-radius);x<=Math.ceil(p[0]+radius);x++){const c=cells.get(x+','+y);if(!c)continue;for(let j=c[0];j<c[0]+c[1];j++){const id=ids[j];if(seen.has(id))continue;seen.add(id);const s=segment(id);if(bankOnly&&1-s[8]-s[9]<.5)continue;const dx=s[2]-s[0],dy=s[3]-s[1],t=Math.max(0,Math.min(1,((p[0]-s[0])*dx+(p[1]-s[1])*dy)/(dx*dx+dy*dy))),point=[s[0]+dx*t,s[1]+dy*t],distance=Math.hypot(p[0]-point[0],p[1]-point[1]);if(distance<best){best=distance;result={point,distance,normal:[s[4],s[5]],beach:s[8],rock:s[9]};}}}return result;}
function nearestBank(p){let best=Infinity,result=null;for(const chunk of manifest.chunks){const b=fs.readFileSync(root+chunk.file),h=new Float32Array(b.buffer,b.byteOffset,b.length/4);for(let i=0;i<h.length;i+=12){if(1-h[i+8]-h[i+9]<.5)continue;const point=[(h[i]+h[i+2])/2,(h[i+1]+h[i+3])/2],distance=Math.hypot(point[0]-p[0],point[1]-p[1]);if(distance<best){best=distance;result={point,distance,normal:[h[i+4],h[i+5]],beach:h[i+8],rock:h[i+9]};}}}return result;}
const pellaro=JSON.parse(fs.readFileSync('godot-prototype/data/coastal-focus/pellaro.json'));let normalChecks=0;
for(const s of pellaro.segments.filter((_,i)=>i%8===0)){const p=[(s.a[0]+s.b[0])/2,(s.a[1]+s.b[1])/2],n=nearest(p,1);assert(n&&n.distance<.1);assert(n.normal[0]*s.n[0]+n.normal[1]*s.n[1]>.65,'Sea/land orientation disagrees with approved Pellaro source');normalChecks++;}
const viewsPath='godot-prototype/data/world-coast-views.json',views=JSON.parse(fs.readFileSync(viewsPath)),probes=[];
for(const [name,v] of Object.entries(views)){if(name==='pellaro')continue;const nearestShore=(name==='estuary'?nearestBank(project(v)):nearest(project(v)));assert(nearestShore,name+' source shore not found');const geo=unprojectLocalMapMetres(nearestShore.point[0]*1000,-nearestShore.point[1]*1000,{lon:13.5,lat:41.5});assert(nearestShore.distance<(name==='estuary'?10000:25),name+' has no nearby shore');probes.push({name,seedDistanceKm:nearestShore.distance,beach:nearestShore.beach,rock:nearestShore.rock});if(process.argv.includes('--snap-views')){v[0]=geo.lon;v[1]=geo.lat;v[4]=Math.atan2(-nearestShore.normal[0],-nearestShore.normal[1])*180/Math.PI;}}
if(process.argv.includes('--snap-views'))fs.writeFileSync(viewsPath,JSON.stringify(views,null,2));
const result={passed:true,segments:count,coastCells:cells.size,normalChecks,maxChunkBytes,sourceHashVerified:true,originalArchiveHashVerified:true,allSegmentsIndexed:true,probes,notice:'Checks source-derived geometry, orientation, binary index and sampling locations. Shore sediment classes are illustrative.'};
fs.mkdirSync('godot-prototype/evidence/world-coasts',{recursive:true});fs.writeFileSync('godot-prototype/evidence/world-coasts/data-validation.json',JSON.stringify(result,null,2));console.log('WORLD_COAST_DATA_OK',JSON.stringify(result));
