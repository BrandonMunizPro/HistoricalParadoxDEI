import fs from 'node:fs';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {PNG} from 'pngjs';
const read=p=>JSON.parse(fs.readFileSync(p)),hash=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const root='godot-prototype/evidence/balkans-rollout',out='docs/balkans-rollout';
const before=read(root+'/before/views.json').views,after=read(root+'/final/views.json').views;
assert.equal(before.length,10);assert.equal(after.length,10);
const cameras=before.map((v,i)=>{const a=after[i];assert.equal(v.name,a.name);assert.deepEqual(v.camera,a.camera);assert.deepEqual(v.preset,a.preset);return {name:v.name,exactCameraMatch:true,beforeSubmittedMeanMs:v.steady.meanMs,afterSubmittedMeanMs:a.steady.meanMs,afterDrawCalls:a.drawCalls};});
for(const [p,digest] of Object.entries(read('godot-prototype/data/northern-italy-reference/manifest.json').protectedHashes))assert.equal(hash(p),digest,p);
const scenario=read('godot-prototype/data/northern-italy-reference/scenario-278.json'),definitions=read('godot-prototype/data/geographic-regions/definitions.json').regions,initial=read('godot-prototype/data/geographic-regions/initial-owners.json').owners;
assert.equal(definitions.length,128);
for(const [i,r] of definitions.entries()){
 assert.equal(r.geometryDigest,crypto.createHash('sha256').update(JSON.stringify(scenario.territories[i].geometry)).digest('hex'));
 assert.equal(initial[r.id],scenario.territories[i].initialController);assert.equal(r.controlCentre,null);assert.deepEqual(r.settlementIds,[]);
}
const manifest=read('godot-prototype/data/balkans/manifest.json');
const heightBytes=fs.readFileSync('godot-prototype/data/balkans/source-metres.bin');
const greek=read('public/data/regional-details/detail-greece-N38E23.json');
// Independent known source samples catch applying pixel-centre conversion twice.
for(const [x,y] of [[32,32],[96,32],[32,96],[96,96]]){
 const gx=(23-14)*128+x,gy=(46-39)*128+y;
 assert(Math.abs(heightBytes.readFloatLE((gy*manifest.width+gx)*4)-greek.elevations[y*129+x])<.001,'Published geographic sample shifted');
}
const north=fs.readFileSync('godot-prototype/data/balkans/near-north.bin'),south=fs.readFileSync('godot-prototype/data/balkans/near-south.bin');
const row=1409,northCount=north.readUInt32LE(),southCount=south.readUInt32LE();
for(const offset of [0,1]){const a=8+offset*northCount*12+(northCount-row)*12,b=8+offset*southCount*12;assert(north.subarray(a,a+row*12).equals(south.subarray(b,b+row*12)),'Split terrain edge positions/normals diverged');}
for(const s of manifest.sources)if(s.path)assert.equal(hash(s.path),s.sha256,s.path);
assert.equal(hash(manifest.coast.archive),manifest.coast.sha256);
for(const p of ['near-north.bin','near-south.bin'])assert(fs.statSync('godot-prototype/data/balkans/'+p).size<90000000);
const runtime=read(root+'/final/foundation-verification.json');
const aetolia=definitions.find(r=>r.legacyTerritoryId==='territory:aetolian-league');
assert.deepEqual(runtime.changedPaletteEntries,[aetolia.rasterIndex]);
assert(runtime.geometryUnchanged&&runtime.sharedOwnerNeighborPreserved&&runtime.invalidStateRejectedAtomically&&runtime.insidePixelDelta>.005&&runtime.neighborPixelDelta<.001);
assert(fs.statSync(root+'/final/foundation-verification.json').mtimeMs>fs.statSync(root+'/final/views.json').mtimeMs,'Ownership evidence must follow the final capture');
const logs=[root+'/final/errors.log',root+'/scope-native.log',root+'/foundation-native.log',root+'/startup-native.log'];
for(const p of logs)assert(!/SCRIPT ERROR|SHADER ERROR|^ERROR:/m.test(fs.readFileSync(p,'utf8')),p);
assert(fs.readFileSync(root+'/scope-native.log','utf8').includes('ROLLOUT_SCOPE_OK'));
assert(fs.readFileSync(root+'/foundation-native.log','utf8').includes('REGION_FOUNDATION_OK'));
assert(fs.readFileSync(root+'/startup-native.log','utf8').includes('GEOGRAPHY_READY'));
assert(/514 passed/.test(fs.readFileSync(out+'/tests.log','utf8')));
// These cameras can see newly treated coastlines at their distant right edge.
// Compare the full frame and a fixed central crop containing the completed area.
const controls=['italy-control','sicily-control'].map(name=>{
 const a=PNG.sync.read(fs.readFileSync(root+'/before/'+name+'.png')),b=PNG.sync.read(fs.readFileSync(root+'/final/'+name+'.png'));
 let sum=0,changed=0,cropSum=0,cropCount=0,cropMax=0,cropChanged=0;
 for(let y=0;y<a.height;y++)for(let x=0;x<a.width;x++){const i=(y*a.width+x)*4,channels=[0,1,2].map(c=>Math.abs(a.data[i+c]-b.data[i+c])),d=channels.reduce((a,b)=>a+b,0);sum+=d;if(d)changed++;if(x>=200&&x<1200&&y>=150&&y<950){cropSum+=d;cropCount++;cropMax=Math.max(cropMax,...channels);if(d)cropChanged++;}}
 // Recompiled water shader changes nine/eight isolated channels by one 8-bit
 // level in these 800,000-pixel controls. Retain this measured rounding allowance.
 assert(cropMax<=1&&cropChanged<=20&&cropSum/(cropCount*3)<.00001,name+' completed-area crop changed beyond measured quantization');
 return {name,fullFrameMeanAbsoluteChannelDelta:sum/(a.width*a.height*3),changedFraction:changed/(a.width*a.height),completedAreaCrop:[200,150,1200,950],completedAreaCropMeanAbsoluteChannelDelta:cropSum/(cropCount*3),completedAreaCropMaximumChannelDelta:cropMax,completedAreaCropChangedPixels:cropChanged,notice:'Full frame includes newly treated neighbouring geography at the distant right edge. Completed-area crop differs only at isolated one-level 8-bit channels.'};
});
const report={protectedSourcesUnchanged:true,existingGeometryAndOwnersPreserved:true,publishedGreekSampleAlignmentVerified:true,splitMeshEdgePositionsAndNormalsIdentical:true,approvedNewRegions:0,testFiles:37,tests:514,nativeScopeAndFoundationPassed:true,normalStartupPassed:true,cameras,controls,runtime,performanceNotice:'Uncapped hidden-window submitted timings, not sustained interactive frame rates. Driver/power/thermal conditions are not normalized; increased rendering cost remains unresolved.'};
fs.writeFileSync(out+'/verification.json',JSON.stringify(report,null,2)+'\n');
const pairs=before.map(v=>`<h2>${v.name}</h2><section>${['before','final'].map(stage=>`<figure><figcaption>${stage==='before'?'Before':'After'}</figcaption><a href="../../${root}/${stage}/${v.name}.png"><img loading="lazy" src="../../${root}/${stage}/${v.name}.png" alt="${v.name} ${stage}"></a></figure>`).join('')}</section>`).join('');
fs.writeFileSync(out+'/REVIEW.html',`<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Illyria and Greece regional review</title><style>body{background:#192127;color:#eee;font:16px system-ui;margin:24px}p{max-width:1100px;line-height:1.5}section{display:grid;grid-template-columns:1fr 1fr;gap:12px}figure{margin:0}img{width:100%}a{color:#bdd8ea}h2{margin-top:36px}@media(max-width:800px){section{grid-template-columns:1fr}}</style><h1>Illyria and mainland Greece</h1><p>Available in the regular Godot campaign. Ten cameras use identical position, orientation, FOV, clipping planes and zoom. Click images for full resolution. Alpine snow is deferred. Political source polygons, owners and approved settlement coordinates remain unchanged.</p><p><a href="REPORT.md">Changes, sources and unresolved issues</a> · <a href="verification.json">Verification and capture timings</a> · <a href="../map-rollout/ROLLOUT-PLAN.md">Regional rollout plan</a></p><p>The new coastline and relief are modern physical source derivatives, not an ancient border reconstruction. Straight faction envelope edges and historical gaps remain visible. Treat this as a regional visual review, not a claim of historical or visual completion.</p>${pairs}<h2>Ownership isolation diagnostic — deliberately nonhistorical</h2><p>Aetolian territory temporarily shares the Antigonid neighbour's owner, then only Aetolia changes to Rome. Geometry and rasters stay fixed; one palette entry changes; the neighbouring pixels stay unchanged. Original owners are restored. These images are test evidence, not a proposed campaign setup.</p><section>${['before','after'].map(stage=>`<figure><figcaption>${stage}</figcaption><img src="../../${root}/final/ownership-diagnostic-${stage}.png" alt="Temporary ownership diagnostic ${stage}"></figure>`).join('')}</section><p>Inspection still required: source boundary credibility, coastline/terrain contacts, close vegetation noise, zoom transitions, label density and interactive performance. The Italy/Sicily controls have visually unchanged completed-area crops (nine and eight pixels differ by one 8-bit channel level); their full frames also see newly treated neighbouring geography near the right horizon. Rendering cost remains higher: the eight new-area captures average roughly 24–38 ms versus 4–12 ms before. These are submitted timings, not accepted interactive FPS. Performance needs profiling before this becomes the template for later regions. No global rollout is included.</p></html>`);
console.log(JSON.stringify(report,null,2));
