import fs from 'node:fs';
import path from 'node:path';
import {spawn} from 'node:child_process';
const project=path.resolve('godot-prototype'),root=path.join(project,'evidence/world-coasts');fs.mkdirSync(root,{recursive:true});fs.writeFileSync(root+'/.gdignore','');
const names=process.argv.find(a=>a.startsWith('--views='))?.slice(8).split(',')??['tarquinii'];const complete=process.argv.includes('--complete');
const executable=process.env.GODOT_BINARY??'C:/Users/brand/tools/godot/4.7.2-stable/Godot_v4.7.2-stable_win64.exe';
const resultFile=path.join(root,complete?'final-views.json':'iteration-views.json');
const records=process.argv.includes('--resume')&&fs.existsSync(resultFile)?JSON.parse(fs.readFileSync(resultFile)).views:[];
for(const name of names){
 if(!/^[a-z]+$/.test(name))throw Error('Invalid view name');
 const dir=path.join(root,complete?'final':'iteration',name);fs.mkdirSync(dir,{recursive:true});const out=fs.openSync(dir+'/stdout.log','w'),err=fs.openSync(dir+'/stderr.log','w');
 const args=['--path',project,'--resolution','1920x1080','--script','res://tools/world-coast-capture.gd','--','--only='+name,'--output=res://evidence/world-coasts/'+(complete?'final':'iteration')+'/'+name];if(complete)args.push('--complete');
 try{
  const code=await new Promise((resolve,reject)=>{const child=spawn(executable,args,{windowsHide:true,stdio:['ignore',out,err]});const timeout=globalThis.setTimeout(()=>child.kill(),600000);child.once('error',reject);child.once('close',c=>{globalThis.clearTimeout(timeout);resolve(c);});});
  const errors=fs.readFileSync(dir+'/stderr.log','utf8');if(code!==0||/SCRIPT ERROR|ERROR:/.test(errors))throw Error(name+' capture failed: '+errors.slice(-7000));
  for(const v of JSON.parse(fs.readFileSync(dir+'/views.json')).views){const i=records.findIndex(old=>old.name===v.name);if(i<0)records.push(v);else records[i]=v;}
  fs.writeFileSync(resultFile,JSON.stringify({completeReadinessRequired:complete,views:records},null,2));console.log('WORLD_COAST_VIEW_OK',name,'total='+records.length);
 }finally{fs.closeSync(out);fs.closeSync(err);}
}
