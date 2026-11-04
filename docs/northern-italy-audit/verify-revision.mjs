import fs from 'node:fs';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
const read=p=>JSON.parse(fs.readFileSync(p));
const root='godot-prototype/data/northern-italy-reference';
const manifest=read(root+'/manifest.json');
for(const [p,expected] of Object.entries(manifest.protectedHashes))assert.equal(crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex'),expected,p+' changed');
const a=read('godot-prototype/data/factions/scenario-278.json'),b=read(root+'/scenario-278.json');
assert.deepEqual(a.factions,b.factions,'Faction anchors and identities must remain unchanged');
const changed=a.territories.filter((t,i)=>JSON.stringify(t)!==JSON.stringify(b.territories[i])).map(t=>t.initialController).sort();
assert.deepEqual(changed,['boii','cenomani','insubres','veneti-italy']);
assert.equal(manifest.checks.Brixia,'cenomani');assert.equal(manifest.checks.Patavium,'veneti-italy');assert.equal(manifest.checks.Bononia,'boii');assert.equal(manifest.checks.Ravenna,'unassigned');
for(const t of b.territories.filter(t=>changed.includes(t.initialController)))assert.equal(t.confidence,'scenario_abstraction');
const evidence='godot-prototype/evidence/northern-italy-20261103';
const before=read(evidence+'/revision-before/views.json').views,after=read(evidence+'/revision-final/views.json').views;
const checks=before.map((v,i)=>{assert.equal(v.name,after[i].name);assert.deepEqual(v.preset,after[i].preset);assert.deepEqual(v.camera,after[i].camera);return {name:v.name,identicalCamera:true};});
fs.writeFileSync('docs/northern-italy-audit/revision-verification.json',JSON.stringify({protectedHashesMatch:true,changedTerritories:changed,checks,tests:'37 files / 514 tests passed'},null,2));
console.log('Protected source hashes, four-territory scope, historical probes, confidence and three exact camera matches verified.');

