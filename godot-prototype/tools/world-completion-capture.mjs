import fs from 'node:fs';
import path from 'node:path';
import {spawn} from 'node:child_process';
const project=path.resolve('godot-prototype'),root=path.join(project,'evidence/world-completion'),final=path.join(root,'final');
const views=JSON.parse(fs.readFileSync(path.join(project,'data/world-completion-views.json')));
const requested=process.argv.find(a=>a.startsWith('--views='))?.slice(8).split(',')??Object.keys(views);
for(const name of requested)if(!Object.hasOwn(views,name))throw Error('Unknown capture view '+name);
const executable=process.env.GODOT_BINARY??'C:/Users/brand/tools/godot/4.7.2-stable/Godot_v4.7.2-stable_win64.exe';
fs.mkdirSync(final,{recursive:true});fs.writeFileSync(path.join(root,'.gdignore'),'');
const records=process.argv.includes('--resume')&&fs.existsSync(path.join(final,'views.json'))?JSON.parse(fs.readFileSync(path.join(final,'views.json'))).views:[];
for(let offset=0;offset<requested.length;offset+=4){
 const group=requested.slice(offset,offset+4),name=group.join(',');
 const dir=path.join(root,'runs',name);fs.mkdirSync(dir,{recursive:true});
 const out=fs.openSync(path.join(dir,'stdout.log'),'w'),err=fs.openSync(path.join(dir,'stderr.log'),'w');
 const args=['--path',project,'--resolution','1920x1080','--script','res://tools/world-completion-capture.gd','--','--only='+name,'--output=res://evidence/world-completion/runs/'+name,'--reference=res://evidence/world-completion/before/views.json'];
 const start=Date.now();let timedOut=false;
 try{
  const code=await new Promise((resolve,reject)=>{
   const child=spawn(executable,args,{windowsHide:true,stdio:['ignore',out,err]});
   const timeout=globalThis.setTimeout(()=>{timedOut=true;child.kill();},180000+group.length*240000);
   child.once('error',error=>{globalThis.clearTimeout(timeout);reject(error);});
   child.once('close',code=>{globalThis.clearTimeout(timeout);resolve(code);});
  });
  const errors=fs.readFileSync(path.join(dir,'stderr.log'),'utf8');
  if(timedOut||code!==0||/SCRIPT ERROR|ERROR:/.test(errors))throw Error(`${name} capture failed (exit ${code}, timeout ${timedOut}): ${errors.slice(-3000)}`);
  const result=JSON.parse(fs.readFileSync(path.join(dir,'views.json')));if(result.views.length!==group.length||result.views.some((v,i)=>v.name!==group[i]))throw Error('Unexpected capture result '+name);
  for(const v of result.views){const index=records.findIndex(old=>old.name===v.name);if(index<0)records.push(v);else records[index]=v;fs.copyFileSync(path.join(dir,v.name+'.png'),path.join(final,v.name+'.png'));}
  records.sort((a,b)=>Object.keys(views).indexOf(a.name)-Object.keys(views).indexOf(b.name));
  fs.copyFileSync(path.join(dir,'terrain-shader.txt'),path.join(final,'terrain-shader.txt'));
  fs.writeFileSync(path.join(final,'views.json'),JSON.stringify({views:records,processIsolation:true,method:'Fresh hidden Godot process per group of up to four views; normal production readiness, VSync off, 30 submitted intervals. Not a sustained interactive benchmark.'},null,2));
  console.log('WORLD_CAPTURE_OK',name,records.length+'/'+Object.keys(views).length,'elapsedMs='+String(Date.now()-start));
 }finally{fs.closeSync(out);fs.closeSync(err);}
}
