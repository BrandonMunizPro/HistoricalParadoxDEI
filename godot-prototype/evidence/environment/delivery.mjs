import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {execFileSync} from 'node:child_process';
const folder=fileURLToPath(new URL('./',import.meta.url));
const repo=path.resolve(folder,'../../..'),project=path.join(repo,'godot-prototype');
const read=p=>JSON.parse(fs.readFileSync(path.join(folder,p)));
const source=read('tour-source.json'),before=read('before-source.json');
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const checks=read('checks.json'),npm=read('npm-result.json');
assert.equal(checks.length,8);assert.ok(checks.every(c=>c.passed));assert.equal(npm.exitCode,0);
for(const f of source.files)assert.equal(sha(fs.readFileSync(path.join(repo,f.path))),f.sha256,f.path);
const protectedResult=JSON.parse(fs.readFileSync(path.join(project,'evidence/final-integrity.json')));
assert.equal(protectedResult.protectedFiles,460);assert.equal(protectedResult.changed.length,0);
fs.writeFileSync(path.join(folder,'integrity.json'),JSON.stringify({...protectedResult,sourceRevision:source.sourceRevision,verifiedAtUtc:new Date().toISOString()},null,2));
const files=new Map();
function add(p){const data=fs.readFileSync(p);files.set(path.relative(repo,p).replaceAll('\\','/'),{bytes:data.length,sha256:sha(data)});}
function walk(p){for(const e of fs.readdirSync(p,{withFileTypes:true})){const child=path.join(p,e.name);if(e.isDirectory())walk(child);else add(child);}}
for(const f of read('implementation-files.json').files)add(path.join(repo,f.path));
for(const p of ['README.md','ENVIRONMENT-EXPANSION.md','tools/visual-capture.gd','evidence/final-integrity.json'])add(path.join(project,p));
for(const p of ['before-source.json','tour-source.json','implementation-files.json','comparison.html','comparison.json','MEASUREMENTS.md','measurements.json','performance-repeat.json','derived-field-validation.json','integrity.json','checks.json','npm-result.json','npm-validate.log','gpu-repeat-live.csv','gpu-telemetry-after-captures.txt','compare.mjs','measurements.mjs','run-checks.ps1','delivery.mjs','navigation-repaired.log','git-diff-check.log'])add(path.join(folder,p));
for(const name of fs.readdirSync(folder))if(name.endsWith('.stdout.log')||name.endsWith('.stderr.log')){
 if(checks.some(c=>name===c.name+'.stdout.log'||name===c.name+'.stderr.log'))add(path.join(folder,name));
}
for(const name of ['sheets','navigation-repaired','check-water','check-global','check-regional','check-timeout-negative'])walk(path.join(folder,name));
for(const name of ['environment-before','environment-final3','environment-performance-repeat']){
 const stage=path.join(project,'evidence/repair-20261026',name);walk(stage);
 const count=fs.readdirSync(stage).filter(n=>n.startsWith('godot-')&&n.endsWith('.png')).length;
 assert.equal(count,name==='environment-before'?48:name==='environment-final3'?51:10);
}
const head=execFileSync('git',['rev-parse','HEAD'],{cwd:repo,encoding:'utf8'}).trim();
assert.equal(head,source.baseCommit);
const diff=execFileSync('git',['diff','--name-only'],{cwd:repo,encoding:'utf8',stdio:['ignore','pipe','ignore']}).trim().split(/\r?\n/).filter(Boolean);
assert.ok(diff.every(p=>p.startsWith('godot-prototype/')),'Unexpected tracked change outside Godot');
const result={createdAtUtc:new Date().toISOString(),baseCommit:head,beforeSourceRevision:before.sourceRevision,finalSourceRevision:source.sourceRevision,
 status:'Implementation and checks complete; independent visual/technical acceptance pending. Performance outliers and startup cost unresolved.',
 authoritativeStages:['environment-before','environment-final3','environment-performance-repeat'],matchedPairs:48,nileSupplement:3,performanceRepeat:10,
 checks:{npmValidate:npm,engineChecks:checks.map(c=>({name:c.name,passed:c.passed,exitCode:c.exitCode,expectedExit:c.expectedExit})),protected:protectedResult,sourceFilesVerified:source.files.length},
 trackedGitDiff:diff,files:[...files].sort((a,b)=>a[0].localeCompare(b[0])).map(([path,data])=>({path,...data}))};
fs.writeFileSync(path.join(folder,'delivery-manifest.json'),JSON.stringify(result,null,2));
console.log(JSON.stringify({files:files.size,totalBytes:[...files.values()].reduce((n,x)=>n+x.bytes,0),sourceRevision:source.sourceRevision,allChecksPassed:true,independentAcceptance:false}));
