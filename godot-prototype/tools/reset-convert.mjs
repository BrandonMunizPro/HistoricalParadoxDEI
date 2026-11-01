// Limited static COLLADA evaluation adapter. Does not claim a general DAE importer.
// Derivative geometry remains CC-BY-SA-3.0, Wildfire Games and contributors.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {Matrix4,Vector3} from 'three';
const dir='godot-prototype/evidence/visual-reset-20261028/source-evaluation';
const attrs=s=>Object.fromEntries([...s.matchAll(/([\w:]+)="([^"]*)"/g)].map(m=>[m[1],m[2]]));
const elements=(s,name)=>[...s.matchAll(new RegExp('<'+name+'\\b([^>]*)>([\\s\\S]*?)</'+name+'>','g'))].map(m=>({a:attrs(m[1]),text:m[2]}));
const nums=s=>s.trim().split(/\s+/).map(Number);
const models=[];
for(const variant of ['a','b','c','d']){
 const xml=fs.readFileSync(`${dir}/roman_house_${variant}.dae`,'utf8');
 const scene=elements(xml,'visual_scene')[0].text;assert(!/<matrix/.test(scene));
 const transform=new Matrix4();
 for(const m of scene.matchAll(/<(translate|rotate|scale)\b[^>]*>([^<]+)</g)){
  const v=nums(m[2]);const mat=new Matrix4();
  if(m[1]==='translate')mat.makeTranslation(...v);
  if(m[1]==='scale')mat.makeScale(...v);
  if(m[1]==='rotate')mat.makeRotationAxis(new Vector3(...v.slice(0,3)),v[3]*Math.PI/180);
  transform.multiply(mat);
 }
 const sources=new Map(elements(xml,'source').map(s=>{const accessor=/<accessor\b([^>]+)>/.exec(s.text);return [s.a.id,{values:nums(elements(s.text,'float_array')[0].text),stride:Number(attrs(accessor[1]).stride)}];}));
 const vertices=new Map(elements(xml,'vertices').map(v=>[v.a.id,attrs(/<input\b([^>]+)\/>/.exec(v.text)[1]).source.slice(1)]));
 const pos=[],normal=[],uv=[],uv2=[];
 const meshes=[...elements(xml,'polylist'),...elements(xml,'triangles')];
 assert(meshes.length>0);
 for(const mesh of meshes){
  const inputs=[...mesh.text.matchAll(/<input\b([^>]+)\/>/g)].map(m=>attrs(m[1]));const stride=Math.max(...inputs.map(i=>Number(i.offset)))+1;
  const p=nums(elements(mesh.text,'p')[0].text);const vc=elements(mesh.text,'vcount');const counts=vc.length?nums(vc[0].text):Array(Number(mesh.a.count)).fill(3);
  let cursor=0;
  function emit(index){
   for(const input of inputs){let id=input.source.slice(1);if(input.semantic==='VERTEX')id=vertices.get(id);const source=sources.get(id);const j=p[index*stride+Number(input.offset)]*source.stride;const v=source.values.slice(j,j+source.stride);
    if(input.semantic==='VERTEX'){const q=new Vector3(...v).applyMatrix4(transform);pos.push(q.x,q.z,-q.y);}
    if(input.semantic==='NORMAL'){const q=new Vector3(...v).transformDirection(transform);normal.push(q.x,q.z,-q.y);}
    if(input.semantic==='TEXCOORD')(Number(input.set)===1?uv2:uv).push(v[0],1-v[1]);
   }
  }
  for(const count of counts){for(let j=1;j<count-1;j++){emit(cursor);emit(cursor+j+1);emit(cursor+j);}cursor+=count;}
  assert.equal(cursor*stride,p.length);
 }
 assert.equal(pos.length,normal.length);assert.equal(pos.length/3,uv.length/2);
 const bounds=[0,1,2].map(axis=>{const a=pos.filter((_,i)=>i%3===axis);return [Math.min(...a),Math.max(...a)];});
 const model={variant,positions:pos,normals:normal,uv,uv2,bounds,triangles:pos.length/9,sourceUnit:'DAE inch metadata retained in original; evaluation uses authoring coordinates, not claimed physical dimensions',license:'CC-BY-SA-3.0'};
 fs.writeFileSync(`${dir}/house-${variant}.json`,JSON.stringify(model));models.push({variant,triangles:model.triangles,bounds});
}
fs.writeFileSync(`${dir}/conversion.json`,JSON.stringify({status:'Evaluation only',models,limitations:['Static geometry only; no props or gameplay content','Authoring scale is not an archaeological dimensional claim','Specular maps are not physically calibrated roughness maps']},null,2));
console.log(models);
