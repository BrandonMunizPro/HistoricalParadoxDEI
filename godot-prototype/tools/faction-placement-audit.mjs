import fs from 'node:fs';
import crypto from 'node:crypto';
const dir='godot-prototype/data/factions';
// northern_italy_world.read_json redirects the campaign to this reviewed copy.
const scenarioPath='godot-prototype/data/northern-italy-reference/scenario-278.json';
const scenario=JSON.parse(fs.readFileSync(scenarioPath));
const labels=JSON.parse(fs.readFileSync(dir+'/label-placements.json'));
function inRing([x,y],ring){let inside=false;for(let i=0,j=ring.length-1;i<ring.length;j=i++){const a=ring[i],b=ring[j];if((a[1]>y)!==(b[1]>y)&&x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0])inside=!inside;}return inside;}
function contains(p,g){return (g.type==='MultiPolygon'?g.coordinates:[g.coordinates]).some(poly=>inRing(p,poly[0])&&!poly.slice(1).some(r=>inRing(p,r)));}
const rows=scenario.factions.map(f=>{
 const territories=scenario.territories.filter(t=>t.initialController===f.id),p=labels[f.id]??f.label;
 return {id:f.id,name:f.name,scenarioLabel:f.label,renderedLabel:p,status:f.status,territories:territories.length,renderedLabelInsideOwnTerritory:territories.length?territories.some(t=>contains(p,t.geometry)):null,sourceKeys:f.sources,notice:'Geometric consistency is not historical verification of 278 BCE borders.'};
});
const result={dateBce:scenario.dateBce,scenarioPath,scenarioSha256:crypto.createHash('sha256').update(fs.readFileSync(scenarioPath)).digest('hex'),factions:rows.length,outsideOwnTerritory:rows.filter(r=>r.renderedLabelInsideOwnTerritory===false).map(r=>r.id),rows};
fs.writeFileSync('godot-prototype/evidence/northern-expansion/faction-placement-audit.json',JSON.stringify(result,null,2));
console.log(JSON.stringify({factions:result.factions,outsideOwnTerritory:result.outsideOwnTerritory,italianBoii:rows.find(r=>r.id==='boii')},null,2));
