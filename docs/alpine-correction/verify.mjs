import fs from 'node:fs';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {PNG} from 'pngjs';
const read=p=>JSON.parse(fs.readFileSync(p));const root='godot-prototype/evidence/alpine-correction';
const a=read(root+'/before/views.json').views,b=read(root+'/after/views.json').views;assert.equal(a.length,5);assert.equal(b.length,5);
const views=a.map((v,i)=>{assert.equal(v.name,b[i].name);assert.deepEqual(v.preset,b[i].preset);assert.deepEqual(v.camera,b[i].camera);return {name:v.name,exactCamera:true,beforeMeanMs:v.steady.meanMs,afterMeanMs:b[i].steady.meanMs};});
const protectedFiles=read('godot-prototype/data/northern-italy-reference/manifest.json').protectedHashes;
for(const [p,h] of Object.entries(protectedFiles))assert.equal(crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex'),h,p);
const sicilyBefore=PNG.sync.read(fs.readFileSync(root+'/before/sicily-control.png')),sicilyAfter=PNG.sync.read(fs.readFileSync(root+'/after/sicily-control.png'));
let changed=0,sum=0;for(let i=0;i<sicilyBefore.data.length;i++){const d=Math.abs(sicilyBefore.data[i]-sicilyAfter.data[i]);if(d)changed++;sum+=d;}
const sicilyMeanChannelDelta=sum/sicilyBefore.data.length/255;assert(sicilyMeanChannelDelta<.001,'Sicily regression');
assert(!/SCRIPT ERROR|SHADER ERROR|^ERROR:/m.test(fs.readFileSync(root+'/after/errors.log','utf8')));
const ownership=read(root+'/after/foundation-verification.json');assert(ownership.geometryUnchanged&&ownership.sharedOwnerNeighborPreserved&&ownership.changedPaletteEntries.length===1&&ownership.neighborPixelDelta<.001);
const report={views,protectedSourcesUnchanged:true,sicilyMeanChannelDelta,sicilyChangedBytes:changed,ownership,sources:read('godot-prototype/data/alpine/manifest.json').sources.length};
fs.writeFileSync('docs/alpine-correction/verification.json',JSON.stringify(report,null,2)+'\n');
fs.writeFileSync('docs/alpine-correction/REVIEW.html',`<!doctype html><html lang="en"><meta charset="utf-8"><title>Alpine terrain correction</title><style>body{background:#192127;color:#eee;font:16px system-ui;margin:24px}p{max-width:1000px}section{display:grid;grid-template-columns:1fr 1fr;gap:12px}figure{margin:0}img{width:100%}a{color:#bdd8ea}h2{margin-top:32px}</style><h1>Alpine terrain and high-elevation snow</h1><p>Measured Copernicus heights fill the crest coverage gap. Denser near terrain, bare high rock and altitude/aspect snow improve the Alpine arc while retaining green valleys. No procedural peaks, ownership edits or settlement-coordinate changes. Snow/firn is an illustrative static high-elevation surface, not a mapped 278 BCE glacier extent or seasonal simulation.</p><p><a href="REPORT.md">Findings, evidence and limitations</a> · <a href="verification.json">Camera and source-preservation checks</a></p>${a.map(v=>`<h2>${v.name}</h2><section>${['before','after'].map(stage=>`<figure><figcaption>${stage}</figcaption><a href="../../${root}/${stage}/${v.name}.png"><img loading="lazy" src="../../${root}/${stage}/${v.name}.png" alt="${v.name} ${stage}"></a></figure>`).join('')}</section>`).join('')}<p>Remaining: approximately 650–870 m output still smooths individual summits and rock faces; inherited political envelope seams remain; glacier outlines and 278 BCE snowline are not established by this physical dataset.</p></html>`);
console.log(report);
