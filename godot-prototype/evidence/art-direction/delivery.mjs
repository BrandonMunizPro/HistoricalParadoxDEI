import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {execFileSync} from 'node:child_process';
const folder=fileURLToPath(new URL('./',import.meta.url)),repo=path.resolve(folder,'../../..'),project=path.join(repo,'godot-prototype');
const read=p=>JSON.parse(fs.readFileSync(path.join(folder,p))),hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const source=read('final2-source.json'),before=read('before-source.json'),checks=read('checks.json'),npm=read('npm-final-result.json');
assert.equal(checks.length,9);assert.ok(checks.every(c=>c.passed));assert.equal(npm.exitCode,0);
for(const f of source.files)assert.equal(hash(fs.readFileSync(path.join(repo,f.path))),f.sha256,f.path);
const integrity=JSON.parse(fs.readFileSync(path.join(project,'evidence/final-integrity.json')));
assert.equal(integrity.protectedFiles,460);assert.equal(integrity.approvedSites,35);assert.equal(integrity.researchRecords,687);assert.deepEqual(integrity.changed,[]);
fs.writeFileSync(path.join(folder,'integrity.json'),JSON.stringify({...integrity,sourceRevision:source.sourceRevision,verifiedAtUtc:new Date().toISOString()},null,2));
const files=new Map();
function add(p,kind='delivery'){const bytes=fs.readFileSync(p);files.set(path.relative(repo,p).replaceAll('\\','/'),{kind,bytes:bytes.length,sha256:hash(bytes)});}
function walk(p){for(const e of fs.readdirSync(p,{withFileTypes:true})){const c=path.join(p,e.name);if(e.isDirectory())walk(c);else add(c);}}
for(const f of read('implementation-files.json').files)add(path.join(repo,f.path),'implementation');
for(const p of ['data/art-direction-views.json','ART-DIRECTION.md','README.md','evidence/final-integrity.json'])add(path.join(project,p));
for(const p of ['before-source.json','final2-source.json','implementation-files.json','integrity.json','references.json','comparison.html','comparison.json','MEASUREMENTS.md','checks.json','npm-final-result.json','npm-final.log','navigation-final2.log','compare.mjs','run-checks.ps1','delivery.mjs','git-diff-check.log'])add(path.join(folder,p));
for(const c of checks)for(const suffix of ['stdout','stderr'])add(path.join(folder,'final-'+c.name+'.'+suffix+'.log'));
for(const p of ['sheets','navigation-final2','final-check-water','final-check-global','final-check-regional','final-check-timeout-negative'])walk(path.join(folder,p));
for(const stage of ['art-before','art-final2']){
 const p=path.join(project,'evidence/repair-20261026',stage);walk(p);
 assert.equal(fs.readdirSync(p).filter(n=>n.startsWith('godot-')&&n.endsWith('.png')).length,15);
}
for(const stage of ['art-preview','art-shadow-diagnostic'])for(const ext of ['png','json'])add(path.join(project,'evidence/repair-20261026',stage,'godot-profile-alps-regional.'+ext),'shadow-diagnostic-predecessor');
const git=args=>execFileSync('git',args,{cwd:repo,encoding:'utf8',stdio:['ignore','pipe','ignore']}).trim();
assert.equal(git(['rev-parse','HEAD']),source.baseCommit);
const changed=git(['diff','--name-only']).split(/\r?\n/).filter(Boolean);
assert.ok(changed.every(p=>p.startsWith('godot-prototype/')));
const result={createdAtUtc:new Date().toISOString(),baseCommit:source.baseCommit,beforeSourceRevision:before.sourceRevision,finalSourceRevision:source.sourceRevision,
 status:'Implementation and validation complete. Independent visual acceptance pending; artistic gaps and performance regressions documented.',
 authoritativeStages:['art-before','art-final2'],matchedPairs:15,regions:['italy','greece','egypt','anatolia','alps'],
 checks:{npm,engine:checks.map(c=>({name:c.name,passed:c.passed,exitCode:c.exitCode,expectedExit:c.expectedExit})),integrity,sourceFilesVerified:source.files.length},
 trackedGitDiffIncludingPreservedWork:changed,files:[...files].sort((a,b)=>a[0].localeCompare(b[0])).map(([path,data])=>({path,...data}))};
fs.writeFileSync(path.join(folder,'delivery-manifest.json'),JSON.stringify(result,null,2));
console.log(JSON.stringify({files:files.size,bytes:[...files.values()].reduce((n,f)=>n+f.bytes,0),sourceRevision:source.sourceRevision,allChecksPassed:true,independentVisualAcceptance:false}));
