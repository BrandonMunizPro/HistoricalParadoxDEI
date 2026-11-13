import fs from 'node:fs';
import path from 'node:path';
import {spawn} from 'node:child_process';
const stage=process.argv.includes('--baseline')?'before':process.argv.includes('--complete')?'final':'iteration';
const project=path.resolve('godot-prototype'),dir=path.join(project,'evidence/coastal-focus',stage);fs.mkdirSync(dir,{recursive:true});fs.writeFileSync(path.dirname(dir)+'/.gdignore','');
const out=fs.openSync(dir+'/stdout.log','w'),err=fs.openSync(dir+'/stderr.log','w');
const args=['--path',project,'--resolution','1920x1080','--script','res://tools/coastal-focus-capture.gd','--','--output=res://evidence/coastal-focus/'+stage];
if(stage==='before')args.push('--coast-baseline');if(process.argv.includes('--complete'))args.push('--complete');
const executable=process.env.GODOT_BINARY??'C:/Users/brand/tools/godot/4.7.2-stable/Godot_v4.7.2-stable_win64.exe';
try{
 const code=await new Promise((resolve,reject)=>{const child=spawn(executable,args,{windowsHide:true,stdio:['ignore',out,err]});const timeout=globalThis.setTimeout(()=>child.kill(),720000);child.once('error',reject);child.once('close',c=>{globalThis.clearTimeout(timeout);resolve(c);});});
 const errors=fs.readFileSync(dir+'/stderr.log','utf8');if(code!==0||/SCRIPT ERROR|ERROR:/.test(errors))throw Error('Coast capture failed: '+errors.slice(-5500));
 console.log('COAST_CAPTURE_OK',stage,fs.readFileSync(dir+'/capture.json','utf8'));
}finally{fs.closeSync(out);fs.closeSync(err);}
