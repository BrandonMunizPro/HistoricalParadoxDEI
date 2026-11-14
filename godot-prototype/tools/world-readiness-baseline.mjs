// Frozen committed renderer for reproducible comparisons. Only evidence is
// written; source geography and the active renderer are never swapped.
import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {unzipSync} from 'fflate';
const revision='b1368004aceeb5a0d439538bb966943edcb6bc62';
const names=execFileSync('git',['ls-tree','-r','--name-only',revision],{encoding:'utf8',maxBuffer:8000000}).trim().split(/\r?\n/).filter(p=>p.startsWith('godot-prototype/')&&!p.includes('/tools/')&&!p.includes('/evidence/')&&/\.(gd|gdshader|gdshaderinc|tscn)$/.test(p));
const archive=execFileSync('git',['archive','--format=zip',revision,'--',...names],{maxBuffer:20000000});
const relative=new Set(names.map(p=>p.slice('godot-prototype/'.length))),destination='godot-prototype/evidence/world-readiness/baseline-source',prefix='res://evidence/world-readiness/baseline-source/';
fs.mkdirSync(destination,{recursive:true});fs.writeFileSync(destination+'/.gdignore','');
for(const [name,bytes] of Object.entries(unzipSync(archive))){
 if(name.endsWith('/'))continue;
 const local=name.slice('godot-prototype/'.length);let content=Buffer.from(bytes).toString('utf8').replace(/^\uFEFF/,'').replace(/\r\n/g,'\n');
 content=content.replace(/res:\/\/([^\s"'\\)]+)/g,(all,p)=>relative.has(p)?prefix+p:all);
 if(local.endsWith('.tscn'))content=content.replace(/ uid="uid:\/\/[^"]+"/g,'');
 const target=destination+'/'+local;fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,content);
}
fs.writeFileSync(destination+'/REVISION.txt',revision+'\n');
console.log('FROZEN_RENDERER',names.length,revision);
