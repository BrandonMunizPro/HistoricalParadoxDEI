import fs from 'node:fs';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {PNG} from 'pngjs';
// The approved overlay has different roster/ownership expectations. Its
// validator also proves the original geometry and all unrelated pixels survive.
if(JSON.parse(fs.readFileSync('godot-prototype/data/world-border-review/scenario-278.json')).opening?.convention==='before-pyrrhus-sicilian-expedition'){
 await import('./spring-278-validate.mjs');
 process.exit(0);
}
const read=p=>JSON.parse(fs.readFileSync(p)),dir='godot-prototype/data/world-border-review';
const baseline=read('godot-prototype/data/northern-italy-reference/scenario-278.json'),data=read(dir+'/scenario-278.json'),placements=read(dir+'/label-placements.json');
const hash=x=>crypto.createHash('sha256').update(JSON.stringify(x)).digest('hex');
assert.equal(data.dateBce,278);assert.equal(data.factions.length,131);assert.equal(data.territories.length,128);
assert.deepEqual(data.factions,baseline.factions,'Faction identity, culture, dates and canonical labels changed');
const cross=(a,b,c)=>(b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]);
function inRing([x,y],r){let inside=false;for(let i=0,j=r.length-1;i<r.length;j=i++){const a=r[i],b=r[j];if((a[1]>y)!==(b[1]>y)&&x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0])inside=!inside;}return inside;}
function contains(point,g){return (g.type==='MultiPolygon'?g.coordinates:[g.coordinates]).some(p=>inRing(point,p[0])&&!p.slice(1).some(r=>inRing(point,r)));}
let preserved=0,changed=0,segments=0;
for(let index=0;index<data.territories.length;index++){
 const t=data.territories[index],old=baseline.territories[index];assert.equal(t.id,old.id);assert.equal(t.initialController,old.initialController);assert.equal(t.priority,old.priority);assert.equal(t.confidence,old.confidence);
 if(t.confidence==='source_reconstruction'){assert.deepEqual(t.geometry,old.geometry);preserved++;}
 if(hash(t.geometry)!==hash(old.geometry)){
  changed++;
  for(const polygon of t.geometry.type==='MultiPolygon'?t.geometry.coordinates:[t.geometry.coordinates])for(const ring of polygon){
   assert.deepEqual(ring[0],ring.at(-1));assert(ring.every(p=>p.every(Number.isFinite)));assert(ring.every(p=>p[0]>=-180&&p[0]<=180&&p[1]>=-90&&p[1]<=90));
   let area=0;for(let i=1;i<ring.length;i++)area+=ring[i-1][0]*ring[i][1]-ring[i][0]*ring[i-1][1];assert(Math.abs(area)>.00001);segments+=ring.length-1;
   for(let i=0;i<ring.length-1;i++)for(let j=i+2;j<ring.length-1;j++){if(i===0&&j===ring.length-2)continue;assert(!(cross(ring[i],ring[i+1],ring[j])*cross(ring[i],ring[i+1],ring[j+1])< -1e-14&&cross(ring[j],ring[j+1],ring[i])*cross(ring[j],ring[j+1],ring[i+1])< -1e-14),'Self-intersection '+t.id);}
  }
 }
 const point=placements[t.initialController];assert(point&&contains(point,t.geometry),'Display anchor outside its territory '+t.id);
}
for(const id of ['boii','insubres','cenomani','veneti-italy','rome'])assert.deepEqual(data.territories.find(t=>t.initialController===id).geometry,baseline.territories.find(t=>t.initialController===id).geometry);
assert(contains([2.35,48.85],data.territories.find(t=>t.initialController==='parisii').geometry),'Parisii association excludes Lutetia');
const source=read('godot-prototype/data/factions/cliopatria-278-scope.geojson');
for(const f of source.features)assert(f.properties.FromYear<=-278&&f.properties.ToYear>=-278,'Wrong date in source subset');
const defs=read(dir+'/definitions.json');
for(const r of defs.regions){const t=data.territories.find(t=>t.id===r.legacyTerritoryId);assert.equal(r.geometryDigest,hash(t.geometry));assert.equal(data.territories[r.rasterIndex-2].id,t.id);}
const image=PNG.sync.read(fs.readFileSync(dir+'/territory-ids.png'));
for(let i=0;i<image.data.length;i+=4)assert(image.data[i]+256*image.data[i+1]<=data.territories.length+1,'Unknown raster identity');
const result={passed:true,territories:128,factions:131,preservedSourceReconstructionShapes:preserved,revisedProvisionalShapes:changed,checkedChangedSegments:segments,datedSourceFeatures:source.features.length,allTerritorialLabelsInsideOwnShape:true,stableControllersAndTerritoryOrder:true,stableGeographicRegionIds:true,lutetiaWithinParisiiAssociation:true,exact278BceTribalFrontiersConfirmed:false};
fs.writeFileSync('godot-prototype/evidence/world-completion/border-validation.json',JSON.stringify(result,null,2));console.log('WORLD_BORDERS_OK',JSON.stringify(result));
