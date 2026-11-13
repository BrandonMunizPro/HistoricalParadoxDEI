// Approved, bounded starting-world corrections. Reads an immutable political
// baseline; never writes physical geography, research, or settlement records.
import fs from 'node:fs';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {PNG} from 'pngjs';
const root='godot-prototype',base=root+'/data/spring-278/baseline';
const read=p=>JSON.parse(fs.readFileSync(p));
const original=p=>read(base+'/'+p);
const write=(p,value)=>fs.writeFileSync(root+'/'+p,JSON.stringify(value,null,2)+'\n');
const spec=read(root+'/data/spring-278/corrections.json');
const data=original('data/world-border-review/scenario-278.json');
const defs=original('data/world-border-review/definitions.json');
const owners=original('data/geographic-regions/initial-owners.json');
const groups=original('data/faction-browser-groups.json');
const presentation=original('data/factions/presentation.json');
const placements=original('data/world-border-review/label-placements.json');
const research=read(root+'/data/research-locations.json').records;
const sites=read(root+'/data/sites.json');
const byId=new Map(data.factions.map(f=>[f.id,f]));
const sha=x=>crypto.createHash('sha256').update(JSON.stringify(x)).digest('hex');
const namespace=Buffer.from('dd41d616e1f45b47ad6df77507a42532','hex');
function uuid(key){const b=crypto.createHash('sha1').update(namespace).update(key).digest().subarray(0,16);b[6]=(b[6]&15)|80;b[8]=(b[8]&63)|128;return b.toString('hex').replace(/(.{8})(.{4})(.{4})(.{4})(.{12})/,'$1-$2-$3-$4-$5');}
export function inRing([x,y],ring){let inside=false;for(let i=0,j=ring.length-1;i<ring.length;j=i++){const a=ring[i],b=ring[j];if((a[1]>y)!==(b[1]>y)&&x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0])inside=!inside;}return inside;}
function contains(point,geometry){return (geometry.type==='MultiPolygon'?geometry.coordinates:[geometry.coordinates]).some(p=>inRing(point,p[0])&&!p.slice(1).some(r=>inRing(point,r)));}
data.opening={yearBce:278,season:'spring',convention:'before-pyrrhus-sicilian-expedition',exactDate:null};
Object.assign(data.sources,spec.sources);
for(const f of data.factions)f.playerSelectable=null; // Undecided for EVERY faction, independently of role or starting ownership.
for(const c of spec.cultureChanges){
  if(!data.cultures.some(x=>x.id===c.id))data.cultures.push({id:c.id,family:c.family,motif:'wreath'});
  if(c.id!=='unclassified')groups.groups.push({id:'culture:'+c.id,cultureId:c.id,name:c.name});
  for(const id of c.factions){assert(byId.has(id));byId.get(id).culture=c.id;delete groups.classificationReview[id];}
}
data.cultures.find(c=>c.id==='etruscan').family='Etruscan';
groups.classificationReview.yuezhi={note:'Cultural identification remains under review. This background identity has no asserted western starting possession.',source:spec.sources['iranica-yuezhi'].url};
const overview={
  epirus:'Spring 278 BCE opens before Pyrrhus\' Sicilian expedition. Epirus remains his home kingdom; his intervention in Italy does not annex allied Greek cities. The exact seasonal timing is a scenario convention.',
  syracuse:'Syracuse remains a Greek political centre amid internal divisions and Carthaginian pressure. Pyrrhus has not yet taken command in Sicily. Akragas is grouped with Syracuse for the approved starting-map abstraction while retaining its distinct local context.',
  'macedonian-claimants':'Macedonian authority is contested after the Gallic invasion. Sosthenes\' leadership and the succession chronology remain qualified; no secure kingdom-wide Antigonid consolidation is assumed.',
  'antigonid-holdings':'Antigonid strongpoints and military influence are distinct from secure kingship over Macedonia. Piraeus and pre-accession Aegium use bounded garrison reconstructions.',
  'achaean-league':'The renewed Achaean League retains its early core. Aegium is represented before its subsequent accession; later federal expansion is not applied at the opening.',
  carthage:'Carthage retains its North African and western Mediterranean core and pressure in Sicily. Messana is held by the Mamertines, while Akragas uses the approved Greek regional aggregation. No First Punic War is automatically initiated.',
  pergamon:'Pergamon is represented as Philetairos\' domain, before the later Attalid royal kingdom.',
  rhegion:'A Greek civic community with a Roman-sent Campanian garrison. The exact seasonal status of the garrison\'s seizure is unresolved; the existing local faction remains the starting abstraction.'
};
for(const [id,text]of Object.entries(overview))byId.get(id).openingOverview=text;
byId.get('hibernian-polities').notes='Indigenous Irish regional communities represented as a campaign grouping. No unrelated foreign state or documented island-wide kingdom is implied.';
for(const id of ['tectosages','trocmi','tolistobogii']){byId.get(id).startPresence='pending_arrival';byId.get(id).notes='Galatian migration identity retained. Arrival is pending in the pre-expedition spring opening convention; no settled Anatolian territory is assigned.';}
byId.get('yuezhi').startPresence='background';
byId.get('yuezhi').notes='Historical background identity retained without asserted western possession at this opening. The inherited western geographic anchor is not a capital or a starting ownership claim.';
const withdrawn=data.territories.find(t=>t.initialController==='yuezhi');
withdrawn.initialController='';withdrawn.active=false;
withdrawn.notes+=' Western starting ownership withdrawn by the approved spring correction; the stable region ID is retained.';
const kartli=data.territories.find(t=>t.initialController==='kartli');
kartli.notes+=' Existing eastern Iberian envelope resolves overlap with Colchis only; Armenian coverage and researched coordinates are preserved.';
for(const group of groups.groups){if(group.cultureId==='etruscan')group.name='Etruscan';}
const mamertines={id:'mamertines',name:'Mamertines',culture:'campanian',label:[15.556634,38.192251],color:'#7c5344',emblem:{motif:'shield',monogram:'MA'},priority:90,viewDistanceKm:180,aliases:['Mamertini','Campanian community of Messana'],status:'reconstruction',kind:'polity',playerSelectable:null,sources:['polybius-1','spring-sicily'],notes:'A Campanian mercenary community controlling Messana at the opening. Messana retains its Greek civic and urban context. External cooperation does not make it a Carthaginian possession.',openingOverview:'The Mamertines hold Messana after the seizure of the Greek city by Campanian mercenaries. Their position on the Strait of Messana places them between Sicily and southern Italy. The controlling community and the city\'s Greek civic setting remain distinct.'};
data.cultures.push({id:'campanian',family:'Italic',motif:'shield'});
groups.groups.push({id:'culture:campanian',cultureId:'campanian',name:'Campanian · Italic'});
data.factions.push(mamertines);byId.set(mamertines.id,mamertines);
presentation.factions.mamertines={color:mamertines.color,emblem:{...mamertines.emblem,basis:'original_design',sourceKeys:[],note:'Original shield device for map readability; not an asserted ancient state flag.'}};
placements.mamertines=mamertines.label;
const relations={version:1,opening:data.opening,records:[]};
const patchTerritories=[];
for(const patch of spec.patches){
  assert(byId.has(patch.owner));
  const t={id:patch.id,initialController:patch.owner,geometry:{type:'Polygon',coordinates:[patch.ring]},confidence:'scenario_abstraction',priority:220,sources:patch.sources,notes:patch.note+' Bounded campaign district, not a surveyed ancient frontier.'};
  assert(!data.territories.some(x=>x.id===t.id));
  const site=patch.siteKey?sites.find(s=>s.key===patch.siteKey):null;
  const record=patch.researchId?research.find(r=>r.proposedId===patch.researchId):null;
  assert(site||record,'Missing existing settlement reference '+patch.id);
  for(const p of [site&&[site.lon,site.lat],record&&[record.coordinates.lon,record.coordinates.lat]].filter(Boolean))assert(contains(p,t.geometry),'District misses existing point: '+patch.id);
  data.territories.push(t);patchTerritories.push(t);
  relations.records.push({id:patch.id.replace('territory:','relation:'),...(site?{settlementId:site.id,siteKey:site.key}:{}),...(record?{researchId:record.proposedId}:{}),controllerFactionId:patch.owner,settlementCultureId:patch.culture,relationship:patch.relation,note:patch.note,sources:patch.sources});
}
for(const [id,culture,note]of [
  ['r16-ibe-emporiae','hellenic','Greek Emporitan community within the broader Indigete regional reconstruction; exact civic control is not inferred.'],
  ['r16-ibe-rhode','hellenic','Greek community; colonial connection does not prove Massaliote ownership.'],
  ['r16-gal-nikaia','hellenic','Greek colonial community in a Ligurian regional setting; ownership remains qualified.'],
  ['r16-gal-antipolis','hellenic','Greek colonial community in a Ligurian regional setting; ownership remains qualified.'],
  ['r16-bal-issa','hellenic','Greek island community; tribal envelope coverage does not establish direct civic ownership.'],
  ['r16-bal-pharos','hellenic','Greek island community; regional control remains qualified.'],
  ['r16-cas-koi-krylgan-kala','chorasmian','Chorasmian urban context is distinct from the broader Massagetaean starting-map reconstruction.'],
  ['r16-cas-akchakhan-kala','chorasmian','Chorasmian settlement culture does not follow the regional faction palette.']
]){assert(research.some(r=>r.proposedId===id));relations.records.push({id:'context:'+id,researchId:id,controllerFactionId:null,settlementCultureId:culture,relationship:'cultural_association',note,sources:[]});}
relations.records.push({id:'relation:harmozica',researchId:'r16-cau-harmozica',controllerFactionId:'kartli',settlementCultureId:'kartlian',relationship:'regional_gameplay_aggregation',note:'Eastern Iberian regional starting allocation; no precisely bounded early dynasty is asserted.',sources:['iranica-colchis']});
for(let i=0;i<data.territories.length;i++){
  const t=data.territories[i];let d=defs.regions.find(r=>r.legacyTerritoryId===t.id);
  if(!d){d={id:uuid('legacy-cartographic-unit/'+t.id),rasterIndex:i+2,legacyTerritoryId:t.id,definitionStatus:'scenario_district',settlementIds:[],controlCentre:null,geographicGroupId:null,notice:'Approved starting-map district only; no permanent administrative membership or capital is inferred.'};defs.regions.push(d);}
  d.geometryDigest=sha(t.geometry);owners.owners[d.id]=t.initialController;
}
// Preserve every existing geographic/banner anchor. Only the new faction gets one.
write('data/world-border-review/scenario-278.json',data);
write('data/world-border-review/definitions.json',defs);
write('data/world-border-review/initial-owners.json',owners);
write('data/world-border-review/label-placements.json',placements);
write('data/factions/presentation.json',presentation);
write('data/faction-browser-groups.json',groups);
write('data/spring-278/settlement-relations.json',relations);
write('data/spring-278/cultural-profiles.json',{version:1,notice:'Independent cultural lookup for future settlement presentation. It is not derived from political ownership.',profiles:[...data.cultures.map(c=>({id:c.id,name:spec.cultureChanges.find(x=>x.id===c.id)?.name??c.id,family:c.family})),{id:'chorasmian',name:'Chorasmian',family:'Iranian regional'}]});

// Political images are patched from their immutable baseline. Pixels outside
// approved districts / the withdrawn western claim are byte-preserved.
const targets=[['data/world-border-review/territory-ids.png',[-12,12,75,62]],['data/world-border-review/local-ids.png',[6,43,14,47]],['data/world-border-review/balkans-ids.png',[14,36,25,46]],['data/world-border-review/sicily-ids.png',[6,35,20,49]],['data/anatolia/territory-ids.png',[25,35,43,43]]];
const withdrawnIndex=data.territories.indexOf(withdrawn)+2;
const activeOriginal=data.territories.slice(0,128).filter(t=>t.initialController).sort((a,b)=>b.priority-a.priority);
const changes=[];
for(const [file,b]of targets){
  const im=PNG.sync.read(fs.readFileSync(base+'/'+file));let changed=0;
  for(let y=0;y<im.height;y++)for(let x=0;x<im.width;x++){
    const at=(y*im.width+x)*4;if(im.data[at]+256*im.data[at+1]!==withdrawnIndex)continue;
    const p=[b[0]+(x+.5)/im.width*(b[2]-b[0]),b[3]-(y+.5)/im.height*(b[3]-b[1])];
    const underlying=activeOriginal.filter(t=>contains(p,t.geometry));let id=0;
    if(underlying.length){id=data.territories.indexOf(underlying[0])+2;if(underlying.length>1&&underlying[0].priority>=100&&underlying[0].priority===underlying[1].priority)id=1;}
    im.data[at]=id&255;im.data[at+1]=id>>8;im.data[at+2]=96;changed++;
  }
  for(const t of [kartli,...patchTerritories]){
    const ring=t.geometry.coordinates[0],xs=ring.map(p=>p[0]),ys=ring.map(p=>p[1]);
    const x0=Math.max(0,Math.floor((Math.min(...xs)-b[0])/(b[2]-b[0])*im.width)),x1=Math.min(im.width-1,Math.ceil((Math.max(...xs)-b[0])/(b[2]-b[0])*im.width));
    const y0=Math.max(0,Math.floor((b[3]-Math.max(...ys))/(b[3]-b[1])*im.height)),y1=Math.min(im.height-1,Math.ceil((b[3]-Math.min(...ys))/(b[3]-b[1])*im.height)),id=data.territories.indexOf(t)+2;
    for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++){
      const p=[b[0]+(x+.5)/im.width*(b[2]-b[0]),b[3]-(y+.5)/im.height*(b[3]-b[1])];if(!contains(p,t.geometry))continue;
      const at=(y*im.width+x)*4;
      // Correct only the documented Colchis overlap; do not annex Armenia or
      // silently fill unrelated gaps with the entire provisional Kartli box.
      if(t===kartli){const oldId=im.data[at]+256*im.data[at+1];if(oldId<2||data.territories[oldId-2].initialController!=='colchis')continue;}
      if(im.data[at]+256*im.data[at+1]!==id)changed++;
      im.data[at]=id&255;im.data[at+1]=id>>8;im.data[at+2]=96;
    }
  }
  fs.writeFileSync(root+'/'+file,PNG.sync.write(im));changes.push({file,changedPixels:changed,width:im.width,height:im.height});
}
write('data/spring-278/build.json',{factions:data.factions.length,territories:data.territories.length,existingFactionIdsPreserved:data.factions.slice(0,131).map(f=>f.id),playability:'undecided for all factions',changes});
console.log('SPRING_278_BUILT',JSON.stringify({factions:data.factions.length,territories:data.territories.length,changes}));
