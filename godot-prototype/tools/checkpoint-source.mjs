import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const project=path.resolve(fileURLToPath(new URL('..',import.meta.url))),repo=path.dirname(project);
const hash=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
const json=p=>JSON.parse(fs.readFileSync(p));
const relative=p=>path.relative(repo,p).replaceAll('\\','/');
const target=path.resolve(process.argv[3]??path.join(project,'evidence/repair-20261026/final/source.json'));
const mode=process.argv[2]??'snapshot';
if(mode==='verify'){
 const manifest=json(target),changed=manifest.files.filter(f=>hash(fs.readFileSync(path.join(repo,f.path)))!==f.sha256);
 if(changed.length)throw Error('Evidence source revision changed: '+changed.map(f=>f.path).join(', '));
 console.log(JSON.stringify({sourceRevision:manifest.sourceRevision,filesVerified:manifest.files.length,changed:0}));
}else{
 if(fs.existsSync(target))throw Error('Refusing to overwrite a source revision: '+target);
 const files=new Map();
 function add(p,kind){files.set(relative(p),{path:relative(p),kind,sha256:hash(fs.readFileSync(p))});}
 function walk(p,kind){for(const entry of fs.readdirSync(p,{withFileTypes:true})){const child=path.join(p,entry.name);if(entry.isDirectory())walk(child,kind);else if(!entry.name.endsWith('.import'))add(child,kind);}}
 for(const entry of fs.readdirSync(project,{withFileTypes:true}))if(entry.isFile()&&/\.(gd|gdshader|gdshaderinc|tscn|godot|ps1)$/.test(entry.name))add(path.join(project,entry.name),'code');
 walk(path.join(project,'tools'),'code');walk(path.join(repo,'tests'),'code');
 for(const name of ['eslint.config.js','package.json','package-lock.json','tsconfig.json','tsconfig.build.json','vitest.config.ts'])add(path.join(repo,name),'code');
 for(const name of ['data','assets','materials'])walk(path.join(project,name),'asset');
 for(const name of ['visual-settings.json','production-views.json','global-views.json','visual-views.json','navigation-expectations.json'])add(path.join(project,'data',name),'code');
 add(path.join(project,'evidence/protected-before.json'),'code');
 for(const name of ['terrain.gdshader','water.gdshader'])add(path.join(project,'evidence/repair-20261026/reference',name),'asset');
 for(const f of json(path.join(project,'evidence/protected-before.json'))){
  const p=path.join(repo,f.path);if(hash(fs.readFileSync(p))!==f.sha256)throw Error('Protected source changed: '+f.path);add(p,'protected');
 }
 const ordered=[...files.values()].sort((a,b)=>a.path.localeCompare(b.path));
 const sourceRevision=hash(JSON.stringify(ordered));
 const baseCommit=execFileSync('git',['-c','safe.directory='+repo.replaceAll('\\','/'),'rev-parse','HEAD'],{encoding:'utf8'}).trim();
 fs.mkdirSync(path.dirname(target),{recursive:true});
 fs.writeFileSync(target,JSON.stringify({sourceRevision,createdAtUtc:new Date().toISOString(),baseCommit,files:ordered},null,2)+'\n');
 console.log(JSON.stringify({sourceRevision,files:ordered.length,path:relative(target)}));
}
