import fs from 'node:fs';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
const read=p=>JSON.parse(fs.readFileSync(p));
const root='godot-prototype/evidence/italy-rollout';
const before=read(root+'/before/views.json').views,after=read(root+'/final/views.json').views;
assert.equal(before.length,10);assert.equal(after.length,10);
const cameras=before.map((v,i)=>{assert.equal(v.name,after[i].name);assert.deepEqual(v.camera,after[i].camera);assert.deepEqual(v.preset,after[i].preset);return {name:v.name,exactMatch:true,beforeMeanMs:v.steady.meanMs,afterMeanMs:after[i].steady.meanMs};});
const protectedHashes=read('godot-prototype/data/northern-italy-reference/manifest.json').protectedHashes;
for(const [p,digest] of Object.entries(protectedHashes))assert.equal(crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex'),digest,p);
const scenario=read('godot-prototype/data/northern-italy-reference/scenario-278.json');
const definitions=read('godot-prototype/data/geographic-regions/definitions.json').regions;
const initial=read('godot-prototype/data/geographic-regions/initial-owners.json').owners;
for(const [i,r] of definitions.entries()){
 assert.equal(r.geometryDigest,crypto.createHash('sha256').update(JSON.stringify(scenario.territories[i].geometry)).digest('hex'));
 assert.equal(initial[r.id],scenario.territories[i].initialController);
 assert.equal(r.controlCentre,null);assert.deepEqual(r.settlementIds,[]);
}
const runtime=read(root+'/final/foundation-verification.json');assert(runtime.geometryUnchanged&&runtime.sharedOwnerNeighborPreserved&&runtime.changedPaletteEntries.length===1&&runtime.neighborPixelDelta<.001);
assert(fs.statSync(root+'/final/foundation-verification.json').mtimeMs>fs.statSync(root+'/final/views.json').mtimeMs,'Ownership evidence must follow the final capture');
assert(!/SCRIPT ERROR|SHADER ERROR|^ERROR:/m.test(fs.readFileSync(root+'/final/errors.log','utf8')),'Latest native validation must have no script/shader errors');
const report={protectedSourcesUnchanged:true,existingGeometryAndOwnersPreserved:true,approvedNewRegions:0,cameras,runtime};
fs.writeFileSync('docs/map-rollout/verification.json',JSON.stringify(report,null,2)+'\n');
const pairs=before.map(v=>`<h2>${v.name}</h2><section>${['before','final'].map(stage=>`<figure><figcaption>${stage==='before'?'Before':'After'}</figcaption><a href="../../${root}/${stage}/${v.name}.png"><img loading="lazy" src="../../${root}/${stage}/${v.name}.png" alt="${v.name} ${stage}"></a></figure>`).join('')}</section>`).join('');
fs.writeFileSync('docs/map-rollout/REVIEW.html',`<!doctype html><html lang="en"><meta charset="utf-8"><title>Italy and Sicily rollout review</title><style>body{background:#192127;color:#eee;font:16px system-ui;margin:24px}p{max-width:1000px}section{display:grid;grid-template-columns:1fr 1fr;gap:12px}figure{margin:0}img{width:100%}a{color:#bdd8ea}h2{margin-top:36px}</style><h1>Italy and Sicily — Wave 01</h1><p>Changes load in the regular Godot instance and are geographically scoped. Ten exact matched cameras. Source boundary coordinates and starting owners are preserved. No new regional boundaries, capitals or gameplay have been activated.</p><p><a href="ITALY-SICILY.md">Architecture, validation and remaining problems</a> Â· <a href="../geographic-foundation/REGION-REVIEW.md">Pending regional research groupings</a> Â· <a href="verification.json">Camera and ownership evidence</a></p>${pairs}<h2>Ownership locality diagnostic</h2><p>These two images deliberately use nonhistorical temporary assignments to verify isolation. The target and neighboring region initially share an owner; only the target changes afterward. Original owners are restored. This is not a proposed campaign setup.</p><section>${['before','after'].map(stage=>`<figure><figcaption>${stage}</figcaption><img src="../../${root}/final/ownership-diagnostic-${stage}.png" alt="Nonhistorical ownership diagnostic ${stage}"></figure>`).join('')}</section><p>Inspection limits: coarse source polygons and uncertain ownership still need historical review; low-angle relief and vegetation remain coarse; global fallback seams persist. This is a staged improvement, not final cartographic acceptance.</p></html>`);
console.log(JSON.stringify(report,null,2));


