// Identity migration only: reads existing geometry; never generates polygons.
import fs from 'node:fs';
import crypto from 'node:crypto';
import {PNG} from 'pngjs';
const read=p=>JSON.parse(fs.readFileSync(p));
const data=read('godot-prototype/data/northern-italy-reference/scenario-278.json');
const namespace=Buffer.from('dd41d616e1f45b47ad6df77507a42532','hex');
function uuid(key){const b=crypto.createHash('sha1').update(namespace).update(key).digest().subarray(0,16);b[6]=(b[6]&15)|80;b[8]=(b[8]&63)|128;return b.toString('hex').replace(/(.{8})(.{4})(.{4})(.{4})(.{12})/,'$1-$2-$3-$4-$5');}
const hash=x=>crypto.createHash('sha256').update(JSON.stringify(x)).digest('hex');
const regions=data.territories.map((t,i)=>({id:uuid('legacy-cartographic-unit/'+t.id),rasterIndex:i+2,legacyTerritoryId:t.id,geometryDigest:hash(t.geometry),definitionStatus:'legacy_envelope',settlementIds:[],controlCentre:null,geographicGroupId:null,notice:'Stable migration identity only; existing envelope is not an approved permanent conquest region.'}));
const owners=Object.fromEntries(regions.map((r,i)=>[r.id,data.territories[i].initialController]));
const research=read('godot-prototype/data/research-locations.json').records;
const proposals=[['Mediolanum',['Mediolanum'],'Insubrian plain'],['Brixia',['Brixia','Verona'],'Brescian plain'],['Patavium',['Patavium','Altinum'],'Western Venetia'],['Syracuse',['Syracuse','Leontini','Camarina'],'Southeastern Sicily'],['Lilybaeum',['Lilybaeum'],'Western Sicily'],['Panormus',['Panormus','Thermae Himeraeae'],'Northwestern Sicily']].map(([centre,names,label])=>({proposalId:uuid('proposal/'+label),label,status:'requires_approval',boundary:null,controlCentreCandidate:centre,membershipCandidates:research.filter(r=>names.includes(r.historicalName)).map(r=>({researchId:r.proposedId,name:r.historicalName,sources:r.sources})),notice:'Candidate grouping only. Centre authority, dependency and boundaries require review; no ownership is assigned.'}));
const out='godot-prototype/data/geographic-regions';fs.mkdirSync(out,{recursive:true});
fs.writeFileSync(out+'/definitions.json',JSON.stringify({version:1,regions},null,2)+'\n');
fs.writeFileSync(out+'/initial-owners.json',JSON.stringify({version:1,owners},null,2)+'\n');
fs.writeFileSync(out+'/proposals.json',JSON.stringify({version:1,proposals},null,2)+'\n');
// Higher resolution of EXISTING polygons only; no boundary coordinates change.
function rasterize(width,height,west,north,spanX,spanY,file){
const ids=new Uint16Array(width*height),rank=new Uint8Array(ids.length);
for(const {t,id} of data.territories.map((t,i)=>({t,id:i+2})).sort((a,b)=>a.t.priority-b.t.priority))for(const rings of t.geometry.type==='Polygon'?[t.geometry.coordinates]:t.geometry.coordinates){
 const p=rings.map(r=>r.map(([x,y])=>[(x-west)/spanX*width,(north-y)/spanY*height]));const ys=p.flat().map(v=>v[1]);
 for(let y=Math.max(0,Math.ceil(Math.min(...ys)-.5));y<=Math.min(height-1,Math.floor(Math.max(...ys)-.5));y++){
  const xs=[];for(const r of p)for(let i=0,j=r.length-1;i<r.length;j=i++){const a=r[i],b=r[j];if((a[1]>y+.5)!==(b[1]>y+.5))xs.push(a[0]+(y+.5-a[1])*(b[0]-a[0])/(b[1]-a[1]));}xs.sort((a,b)=>a-b);
  for(let k=0;k+1<xs.length;k+=2)for(let x=Math.max(0,Math.ceil(xs[k]-.5));x<=Math.min(width-1,Math.floor(xs[k+1]-.5));x++){const i=y*width+x;if(rank[i]>t.priority)continue;if(rank[i]===t.priority&&t.priority>=100&&ids[i]&&ids[i]!==id){ids[i]=1;continue;}rank[i]=t.priority;ids[i]=id;}
 }
}
const raster=new PNG({width,height});for(let i=0;i<ids.length;i++)raster.data.set([ids[i]&255,ids[i]>>8,rank[i]>=100?255:96,255],i*4);
fs.writeFileSync(out+'/'+file,PNG.sync.write(raster));
}
rasterize(2048,1536,12,39,4,3,'sicily-ids.png');
rasterize(7168,7168,6,49,14,14,'italy-ids.png');
fs.writeFileSync('docs/geographic-foundation/REGION-REVIEW.md',`# Geographic region review\n\nNo new boundaries or capitals have been activated. The 128 existing envelopes retain their exact geometry and starting owners. Their opaque migration IDs are not a claim that they are valid conquest regions.\n\n${proposals.map(p=>`## ${p.label}\n\nProposed centre: ${p.controlCentreCandidate}. Proposed members to investigate: ${p.membershipCandidates.map(s=>s.name).join(', ')}.\n\nBoundary: unresolved. Approval required for centre, membership and eventual boundary dossier. Existing records provide settlement presence and regional associations, not proof of an administrative dependency.\n`).join('\n')}\nThe Boian control centre and central/northeastern Sicily remain unresolved. All research handles remain research handles; no settlement identities or coordinates are changed.\n`);
console.log({legacyMigrationUnits:regions.length,approvedNewRegions:0,proposals:proposals.length});
