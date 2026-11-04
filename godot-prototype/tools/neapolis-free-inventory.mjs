import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {unzipSync} from 'fflate';
const source='source-cache/neapolis-free/kenney_fantasy-town-kit_2.0.zip';
const entries=unzipSync(fs.readFileSync(source));
const selected=['wall','wall-doorway-square','wall-window-small','roof','roof-gable','roof-gable-end','pillar-wood'];
const folder='godot-prototype/assets/neapolis-free/source';
fs.mkdirSync(folder,{recursive:true});
let report=[];
for(const name of selected){
 const file='Models/GLB format/'+name+'.glb',b=Buffer.from(entries[file]);
 if(b.readUInt32LE()!==0x46546c67)throw Error('Not GLB');
 const json=JSON.parse(b.subarray(20,20+b.readUInt32LE(12)).toString().trim());
 let tris=0;for(const mesh of json.meshes)for(const p of mesh.primitives)tris+=(p.indices===undefined?json.accessors[p.attributes.POSITION].count:json.accessors[p.indices].count)/3;
 fs.writeFileSync(folder+'/'+name+'.glb',b);
 report.push({name,sha256:crypto.createHash('sha256').update(b).digest('hex'),triangles:tris,nodes:json.nodes,positions:json.meshes.flatMap(m=>m.primitives.map(p=>json.accessors[p.attributes.POSITION])),materials:json.materials,images:json.images});
}
fs.mkdirSync(folder+'/Textures',{recursive:true});
fs.writeFileSync(folder+'/Textures/colormap.png',entries['Models/GLB format/Textures/colormap.png']);
fs.writeFileSync(folder+'/LICENSE.txt',entries['License.txt']);
fs.writeFileSync('source-cache/neapolis-free/Sample.png',entries['Sample.png']);
for(const name of selected)fs.writeFileSync('source-cache/neapolis-free/'+name+'.png',entries['Previews/'+name+'.png']);
fs.writeFileSync('source-cache/neapolis-free/inventory.json',JSON.stringify({archiveSha256:crypto.createHash('sha256').update(fs.readFileSync(source)).digest('hex'),entries:Object.keys(entries).length,selected:report},null,2));
console.log(JSON.stringify(report.map(r=>({name:r.name,triangles:r.triangles,nodes:r.nodes,positions:r.positions,materials:r.materials.map(m=>m.name),images:r.images})),null,2));
