import fs from 'node:fs';
import assert from 'node:assert/strict';
const root='godot-prototype';
const read=p=>JSON.parse(fs.readFileSync(root+'/'+p,'utf8'));
const composition=read('data/roma-showcase-district.json'),overlay=read('data/roma-development-composition.json');
const starts=read('data/settlement-development-starts.json').settlements[0];
const base=read('assets/roma-showcase/geometry-manifest.json').meshes;
const native=read('assets/settlement-development/geometry-manifest.json');
const buildings=[];
function rectangle(id,position,bounds){
 const [px,pz,angle,scale]=position,c=Math.cos(angle*Math.PI/180),s=Math.sin(angle*Math.PI/180),[x,z,w,l]=bounds;
 return {id,points:[[x,z],[x+w,z],[x+w,z+l],[x,z+l]].map(([xx,zz])=>[px+(c*xx+s*zz)*scale,pz+(-s*xx+c*zz)*scale])};
}
for(const group of composition.groups)for(const placement of group.placements){
 if(overlay.replace.some(r=>r.kind===group.kind&&r.anchorM[0]===placement[0]&&r.anchorM[1]===placement[1]))continue;
 const p=[...placement],move=overlay.relocate.find(r=>r.kind===group.kind&&r.fromM[0]===p[0]&&r.fromM[1]===p[1]);
 if(move){p[0]=move.toM[0];p[1]=move.toM[1];}
 buildings.push(rectangle(group.kind+'@'+p.slice(0,2).join(','),p,base.find(m=>m.name===group.kind).boundsKm.map(x=>x*1000)));
}
function overlap(a,b){let minimum=Infinity;
 for(const poly of [a,b])for(let i=0;i<2;i++){
  const d=[poly[(i+1)%4][0]-poly[i][0],poly[(i+1)%4][1]-poly[i][1]],length=Math.hypot(...d),axis=[-d[1]/length,d[0]/length];
  const aa=a.map(p=>p[0]*axis[0]+p[1]*axis[1]),bb=b.map(p=>p[0]*axis[0]+p[1]*axis[1]);
  const depth=Math.min(Math.max(...aa),Math.max(...bb))-Math.max(Math.min(...aa),Math.min(...bb));if(depth<=0)return 0;minimum=Math.min(minimum,depth);
 }return minimum;
}
const results=[];
for(let civic=1;civic<=3;civic++)for(let grain=1;grain<=3;grain++){
 const all=[...buildings];
 for(const [i,kind,level] of [[0,'forum',civic],[1,'granary',grain]]){const slot=starts.slots[i];all.push(rectangle(slot.id,[...slot.anchorM,slot.yawDegrees,1],native.find(m=>m.name===kind+'-'+level).boundsM));}
 const conflicts=[];
 for(let i=0;i<all.length;i++)for(let j=i+1;j<all.length;j++){const depth=overlap(all[i].points,all[j].points);if(depth>.15)conflicts.push({a:all[i].id,b:all[j].id,depthM:depth});}
 results.push({civic,grain,conflicts});
}
const result={method:'Conservative oriented native mesh bounds, tolerance 0.15m; all nine combinations. Not navigation or reconstructed historical plans.',surroundingStructures:buildings.length,results};
fs.writeFileSync(root+'/evidence/settlement-development-20261028/layout-validation.json',JSON.stringify(result,null,2)+'\n');
assert.ok(results.every(r=>!r.conflicts.length),JSON.stringify(results.filter(r=>r.conflicts.length)));
console.log({combinations:9,conflicts:0});
