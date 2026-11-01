import fs from 'node:fs';
const root='godot-prototype',read=p=>JSON.parse(fs.readFileSync(root+'/'+p));
const layouts=read('data/settlement-identity-layouts.json'),starts=read('data/settlement-identity-starts.json').settlements;
const catalog=read('data/settlement-identity-overlay.json'),meshes=read('assets/settlement-identities/geometry-manifest.json');
function rectangle(id,p,bounds){const [px,pz,angle,scale]=p,[x,z,w,l]=bounds,c=Math.cos(angle*Math.PI/180),s=Math.sin(angle*Math.PI/180);return {id,points:[[x,z],[x+w,z],[x+w,z+l],[x,z+l]].map(([a,b])=>[px+(c*a+s*b)*scale,pz+(-s*a+c*b)*scale])};}
function overlap(a,b){let minimum=Infinity;for(const poly of [a,b])for(let i=0;i<2;i++){const d=[poly[(i+1)%4][0]-poly[i][0],poly[(i+1)%4][1]-poly[i][1]],length=Math.hypot(...d),axis=[-d[1]/length,d[0]/length];const aa=a.map(p=>p[0]*axis[0]+p[1]*axis[1]),bb=b.map(p=>p[0]*axis[0]+p[1]*axis[1]);const depth=Math.min(Math.max(...aa),Math.max(...bb))-Math.max(Math.min(...aa),Math.min(...bb));if(depth<=0)return 0;minimum=Math.min(minimum,depth);}return minimum;}
const sites=read('data/sites.json'),results=[];
for(const state of starts){
 const site=sites.find(s=>s.id===state.settlementId),layout=layouts[site.key];
 const background=layout.groups.flatMap(g=>g.placements.map((p,i)=>rectangle(g.kind+'-'+i,p,meshes.find(m=>m.name===g.kind).boundsM)));
 const occupied=state.slots.filter(s=>s.building),max=3**occupied.length;const conflicts=new Map(),fieldConflicts=new Map();
 for(let combination=0;combination<max;combination++){
  const all=[...background];let n=combination;const fields=[];
  for(const slot of occupied){const level=n%3+1;n=Math.floor(n/3);const asset=catalog.visuals.find(v=>v.visualKey===slot.building.chain+'.'+level);const kind=asset.near.split('/').at(-1).replace('.res','');all.push(rectangle(slot.id+'-'+level,[...slot.anchorM,slot.yawDegrees,1],meshes.find(m=>m.name===kind).boundsM));
   for(const [i,f] of asset.environment.fields.entries()){const a=slot.yawDegrees*Math.PI/180,c=Math.cos(a),s=Math.sin(a),p=[slot.anchorM[0]+c*f.centerM[0]+s*f.centerM[1],slot.anchorM[1]-s*f.centerM[0]+c*f.centerM[1],slot.yawDegrees+f.rotationDegrees,1];fields.push(rectangle(slot.id+'-field-'+level+'-'+i,p,[-f.sizeM[0]/2,-f.sizeM[1]/2,...f.sizeM]));}
  }
  for(let i=0;i<all.length;i++)for(let j=i+1;j<all.length;j++){const depth=overlap(all[i].points,all[j].points);if(depth>.15)conflicts.set(all[i].id+'/'+all[j].id,{a:all[i].id,b:all[j].id,depthM:depth});}
  for(const field of fields)for(const building of all){const depth=overlap(field.points,building.points);if(depth>.15)fieldConflicts.set(field.id+'/'+building.id,{field:field.id,building:building.id,depthM:depth});}
 }
 results.push({site:site.key,combinations:max,backgroundBlocks:background.length,conflicts:[...conflicts.values()],fieldConflicts:[...fieldConflicts.values()]});
}
fs.writeFileSync(root+'/evidence/settlement-identities-20261028/layout-validation.json',JSON.stringify({method:'Conservative oriented native bounds; all primary stage combinations and farm rectangles, tolerance 0.15m. Does not prove walkability or historical plans.',results},null,2)+'\n');
console.log(JSON.stringify(results,null,2));
if(results.some(r=>r.conflicts.length||r.fieldConflicts.length))process.exitCode=1;
