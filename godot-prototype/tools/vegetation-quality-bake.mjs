import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {Tree} from './vendor/ez-tree/lib/tree.js';

const out='godot-prototype/assets/vegetation-quality';
const lods=[{}, {sectionStride:2,segmentFactor:.65,leafStride:2,leafScale:1.25,billboard:'single'}, {sectionStride:4,segmentFactor:.5,leafStride:6,leafScale:1.8,billboard:'single'}];
const kits=[['oak','Oak Medium',.024],['pine','Pine Medium',.032],['cypress','Pine Small',.032],['ash','Ash Medium',.024],['scrub','Bush 2',.008]];
const records=[];
function u32(value){const b=Buffer.alloc(4);b.writeUInt32LE(value);return b;}
function pack(levels){
 const chunks=[u32(0x31544756),u32(2),u32(levels.length)];
 for(const part of ['branches','leaves']){
  const positions=[],normals=[],uvs=[],indices=[];let offset=0;
  for(const level of levels){const g=level[part];positions.push(...g.getAttribute('position').array);normals.push(...g.getAttribute('normal').array);uvs.push(...g.getAttribute('uv').array);indices.push(Uint32Array.from(g.index.array,i=>i+offset));offset+=g.getAttribute('position').count;}
  chunks.push(u32(offset),Buffer.from(new Float32Array(positions).buffer),Buffer.from(new Float32Array(normals).buffer),Buffer.from(new Float32Array(uvs).buffer));
  for(const index of indices)chunks.push(u32(index.length),Buffer.from(index.buffer));
 }
 return Buffer.concat(chunks);
}
function transform(g,scale,translation=[0,0,0]){const p=g.getAttribute('position');for(let i=0;i<p.count;i++){p.setXYZ(i,p.getX(i)*scale+translation[0],p.getY(i)*scale+translation[1],p.getZ(i)*scale+translation[2]);}return g;}
function concatenate(list,part){const base=list[0][part].clone();const p=[],n=[],uv=[],indices=[];let count=0;for(const item of list){const g=item[part];p.push(...g.attributes.position.array);n.push(...g.attributes.normal.array);uv.push(...g.attributes.uv.array);indices.push(...Array.from(g.index.array,i=>i+count));count+=g.attributes.position.count;}for(const [name,arr,size] of [['position',p,3],['normal',n,3],['uv',uv,2]])base.setAttribute(name,new list[0][part].attributes[name].constructor(new Float32Array(arr),size));base.setIndex(indices);return base;}
for(const [kit,preset,height] of kits)for(let variant=0;variant<4;variant++){
 const tree=new Tree();tree.loadPreset(preset);tree.options.seed=278000+variant*7919+kits.findIndex(k=>k[0]===kit)*107;
 tree.options.leaves.size*=1.8;
 if(kit==='cypress'){for(const key of Object.keys(tree.options.branch.length))if(key!=='0')tree.options.branch.length[key]*=.36;tree.options.leaves.size*=.65;}
 tree.generate();const all=lods.map(detail=>tree.createGeometry(detail));
 let maximum=0;for(const part of ['branches','leaves']){const p=all[0][part].attributes.position;for(let i=0;i<p.count;i++)maximum=Math.max(maximum,p.getY(i));}
 const scale=height/maximum;for(const level of all)for(const part of ['branches','leaves'])transform(level[part],scale);
 const file=`${kit}-${variant}.bin`,bytes=pack(all);fs.writeFileSync(path.join(out,file),bytes);
 records.push({kit,variant,preset,file,sha256:crypto.createHash('sha256').update(bytes).digest('hex'),heightKm:height,triangles:all.map(g=>(g.branches.index.count+g.leaves.index.count)/3)});
 console.log(kit,variant,records.at(-1).triangles);
}
fs.writeFileSync(path.join(out,'catalog.json'),JSON.stringify({format:'VGT1',units:'kilometres',records},null,2));
