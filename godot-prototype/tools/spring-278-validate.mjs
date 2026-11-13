import fs from 'node:fs';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {PNG} from 'pngjs';
const root='godot-prototype',base=root+'/data/spring-278/baseline';
const read=p=>JSON.parse(fs.readFileSync(p));
const data=read(root+'/data/world-border-review/scenario-278.json');
const old=read(base+'/data/world-border-review/scenario-278.json');
const spec=read(root+'/data/spring-278/corrections.json');
const manifest=read(base+'/manifest.json');
const hash=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
let checks=0;const check=(v,label)=>{checks++;assert(v,label);};
function ringContains([x,y],r){let hit=false;for(let i=0,j=r.length-1;i<r.length;j=i++){const a=r[i],b=r[j];if((a[1]>y)!==(b[1]>y)&&x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0])hit=!hit;}return hit;}
const contains=(p,g)=>(g.type==='MultiPolygon'?g.coordinates:[g.coordinates]).some(r=>ringContains(p,r[0])&&!r.slice(1).some(h=>ringContains(p,h)));
const defs=read(root+'/data/world-border-review/definitions.json').regions;
const owners=read(root+'/data/world-border-review/initial-owners.json').owners;
const factions=new Map(data.factions.map(f=>[f.id,f]));
const cultures=new Set(data.cultures.map(c=>c.id));
check(data.factions.length===132&&factions.size===132,'132 unique faction IDs');
assert.deepEqual(data.factions.slice(0,131).map(f=>f.id),old.factions.map(f=>f.id));checks++;
for(const f of data.factions){
  check(f.playerSelectable===null,'No finalized playability: '+f.id);
  check(cultures.has(f.culture),'Valid culture '+f.id);
  for(const source of f.sources)check(data.sources[source]!=null,'Source '+source);
}
const groups=read(root+'/data/faction-browser-groups.json');
check(new Set(groups.groups.map(g=>g.id)).size===groups.groups.length,'Unique presentation group IDs');
check(new Set(groups.groups.filter(g=>g.cultureId).map(g=>g.cultureId)).size===groups.groups.filter(g=>g.cultureId).length,'Deterministic cultural grouping');
check(factions.get('mamertines').culture==='campanian','Campanian Mamertines');
check(factions.get('hibernian-polities').culture==='irish','Irish communities distinct from Brittonic');
check(defs.length===143&&data.territories.length===143&&Object.keys(owners).length===143,'143 consistent territorial records');
check(new Set(defs.map(r=>r.id)).size===143,'Unique region UUIDs');
for(let i=0;i<data.territories.length;i++){
  const t=data.territories[i],d=defs.find(r=>r.legacyTerritoryId===t.id);
  check(d&&d.rasterIndex===i+2&&owners[d.id]===t.initialController,'Ownership, index and definition agree '+t.id);
  check(t.initialController===''||factions.has(t.initialController),'Known controller '+t.id);
  if(i<128){assert.deepEqual(t.geometry,old.territories[i].geometry);check(t.id===old.territories[i].id,'Original territory ID/order/geometry preserved');}
  else check(d.definitionStatus==='scenario_district'&&!d.settlementIds.length&&d.controlCentre===null,'No invented permanent administrative geography');
}
const sites=read(root+'/data/sites.json'),research=read(root+'/data/research-locations.json').records;
const profiles=read(root+'/data/spring-278/cultural-profiles.json').profiles;
const relations=read(root+'/data/spring-278/settlement-relations.json').records;
for(const r of relations){
  check(r.controllerFactionId===null||factions.has(r.controllerFactionId),'Relationship faction FK '+r.id);
  check(profiles.some(c=>c.id===r.settlementCultureId),'Independent settlement culture '+r.id);
  if(r.settlementId)check(sites.some(s=>s.id===r.settlementId),'Canonical settlement FK '+r.id);
  if(r.researchId)check(research.some(s=>s.proposedId===r.researchId),'Research FK '+r.id);
}
check(relations.find(r=>r.researchId==='r16-ita-messana').controllerFactionId==='mamertines','Messana never Carthage');
check(relations.find(r=>r.researchId==='r16-ita-messana').settlementCultureId==='hellenic','Greek city context independent of Campanian controller');
const targets=[['territory-ids',[-12,12,75,62]],['local-ids',[6,43,14,47]],['balkans-ids',[14,36,25,46]],['sicily-ids',[6,35,20,49]],['anatolia',[25,35,43,43]]];
const allowed=data.territories.filter(t=>spec.patches.some(p=>p.id===t.id)||t.initialController==='kartli');
const yuezhi=old.territories.findIndex(t=>t.initialController==='yuezhi')+2;
const rasterResults=[];
for(const [name,b]of targets){
  const file=name==='anatolia'?'data/anatolia/territory-ids.png':'data/world-border-review/'+name+'.png';
  const im=PNG.sync.read(fs.readFileSync(root+'/'+file)),before=PNG.sync.read(fs.readFileSync(base+'/'+file));
  check(im.width===before.width&&im.height===before.height,'Raster dimensions preserved '+name);
  let changed=0;const indexAt=p=>{const x=Math.floor((p[0]-b[0])/(b[2]-b[0])*im.width),y=Math.floor((b[3]-p[1])/(b[3]-b[1])*im.height);if(x<0||x>=im.width||y<0||y>=im.height)return null;const at=(y*im.width+x)*4;return im.data[at]+256*im.data[at+1];};
  for(let at=0;at<im.data.length;at+=4){
    const id=im.data[at]+256*im.data[at+1];assert(id<145,'Out-of-range raster region');
    if(im.data[at]===before.data[at]&&im.data[at+1]===before.data[at+1]&&im.data[at+2]===before.data[at+2]&&im.data[at+3]===before.data[at+3])continue;
    changed++;const pixel=at/4,x=pixel%im.width,y=Math.floor(pixel/im.width);
    const p=[b[0]+(x+.5)/im.width*(b[2]-b[0]),b[3]-(y+.5)/im.height*(b[3]-b[1])];
    assert(before.data[at]+256*before.data[at+1]===yuezhi||allowed.some(t=>contains(p,t.geometry)),'Pixel changed outside approved political correction');
    if(id>=2&&data.territories[id-2].initialController==='kartli')assert(old.territories[before.data[at]+256*before.data[at+1]-2]?.initialController==='colchis','Kartli correction changed an unrelated territory');
    assert(id!==yuezhi,'Withdrawn western Yuezhi control still present');
  }
  for(const patch of spec.patches){
    const s=patch.siteKey?sites.find(s=>s.key===patch.siteKey):null,r=patch.researchId?research.find(r=>r.proposedId===patch.researchId):null;
    for(const p of [s&&[s.lon,s.lat],r&&[r.coordinates.lon,r.coordinates.lat]].filter(Boolean)){
      const id=indexAt(p);if(id===null)continue;
      check(id>=2&&data.territories[id-2].initialController===patch.owner,'Correct settlement raster owner '+name+' '+patch.id);
    }
  }
  const rhegion=indexAt([15.65,38.11]);if(rhegion!==null&&rhegion>=2)check(data.territories[rhegion-2].initialController!=='mamertines','Messana district does not cross to Rhegion');
  rasterResults.push({file,width:im.width,height:im.height,changedPixels:changed});
}
const originalAtlas=PNG.sync.read(fs.readFileSync(base+'/assets/factions/emblems.png')),atlas=PNG.sync.read(fs.readFileSync(root+'/assets/factions/emblems.png'));
for(let i=0;i<131;i++)for(let y=0;y<64;y++){
  const at=(((i>>4)*64+y)*atlas.width+(i%16)*64)*4;
  assert(atlas.data.subarray(at,at+256).equals(originalAtlas.data.subarray(at,at+256)),'Existing emblem changed');
}
checks++;
for(const [file,sha]of Object.entries(manifest.protectedFiles))check(hash(file)===sha,'Protected input unchanged '+file);
check(hash(root+'/data/geographic-regions/initial-owners.json')===manifest.snapshots['data/geographic-regions/initial-owners.json'],'Legacy baseline owners preserved');
const anchors=read(root+'/data/world-border-review/label-placements.json');
for(const [id,p]of Object.entries(read(base+'/data/world-border-review/label-placements.json')))assert.deepEqual(anchors[id],p);
checks++;
const result={passed:true,checks,factions:132,territories:143,settlementRelationships:relations.length,protectedFiles:Object.keys(manifest.protectedFiles).length,rasters:rasterResults};
fs.mkdirSync(root+'/evidence/spring-278',{recursive:true});fs.writeFileSync(root+'/evidence/spring-278/data-validation.json',JSON.stringify(result,null,2)+'\n');
console.log('SPRING_278_VALIDATION',JSON.stringify(result));
