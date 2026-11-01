import fs from 'node:fs';
const base='godot-prototype';
const layout=JSON.parse(fs.readFileSync(base+'/data/roma-showcase-district.json'));
const meshes=JSON.parse(fs.readFileSync(base+'/assets/roma-showcase/geometry-manifest.json')).meshes;
const buildings=layout.groups.flatMap(g=>g.placements.map((p,i)=>{
 const mesh=meshes.find(m=>m.name===g.kind),b=mesh.boundsKm;
 if(!b)throw Error('Rebake meshes to include bounds');
 const c=Math.cos(p[2]*Math.PI/180),s=Math.sin(p[2]*Math.PI/180);
 const points=[[b[0],b[1]],[b[0]+b[2],b[1]],[b[0]+b[2],b[1]+b[3]],[b[0],b[1]+b[3]]].map(([x,z])=>[p[0]+(c*x+s*z)*1000*p[3],p[1]+(-s*x+c*z)*1000*p[3]]);
 return {id:g.kind+'-'+i,position:p,points};
}));
function overlap(a,b){let minimum=Infinity;
 for(const poly of [a,b])for(let i=0;i<2;i++){
  const d=[poly[(i+1)%4][0]-poly[i][0],poly[(i+1)%4][1]-poly[i][1]],length=Math.hypot(...d),axis=[-d[1]/length,d[0]/length];
  const aa=a.map(p=>p[0]*axis[0]+p[1]*axis[1]),bb=b.map(p=>p[0]*axis[0]+p[1]*axis[1]);
  const depth=Math.min(Math.max(...aa),Math.max(...bb))-Math.max(Math.min(...aa),Math.min(...bb));if(depth<=0)return 0;minimum=Math.min(minimum,depth);
 }
 return minimum;
}
const conflicts=[];
for(let i=0;i<buildings.length;i++)for(let j=i+1;j<buildings.length;j++){
 const depth=overlap(buildings[i].points,buildings[j].points);
 if(depth>.15)conflicts.push({a:buildings[i].id,b:buildings[j].id,conservativeBoundsOverlapMetres:depth});
}
fs.writeFileSync(base+'/evidence/roma-showcase-20261028/layout-check.json',JSON.stringify({structures:buildings.length,conservativeBoundsOnly:true,conflicts},null,2)+'\n');
console.log({structures:buildings.length,conflicts});
