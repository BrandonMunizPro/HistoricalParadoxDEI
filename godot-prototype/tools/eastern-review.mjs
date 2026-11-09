import fs from 'node:fs';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {PNG} from 'pngjs';
const root='godot-prototype/evidence/eastern-expansion';
const read=p=>JSON.parse(fs.readFileSync(p));
const stage=process.argv[2]??'levant-validated';
const names=read(`${root}/${stage}/views.json`).views.map(v=>v.name);
const sheet=new PNG({width:1280,height:Math.ceil(names.length/2)*360});
for(let k=0;k<names.length;k++){
 const p=PNG.sync.read(fs.readFileSync(`${root}/${stage}/${names[k]}.png`));assert.equal(p.width,1920);assert.equal(p.height,1080);
 for(let y=0;y<360;y++)for(let x=0;x<640;x++){const source=(y*3*p.width+x*3)*4,target=((Math.floor(k/2)*360+y)*sheet.width+(k%2)*640+x)*4;sheet.data.set(p.data.subarray(source,source+4),target);}
}
fs.writeFileSync(`${root}/${stage}/contact.png`,PNG.sync.write(sheet));
console.log(stage,names);
if(process.argv.includes('--report')){
 const before=read(`${root}/before/views.json`).views;
 const after=[...read(`${root}/levant-validated/views.json`).views,...read(`${root}/egypt-final/views.json`).views];
 const egyptBefore=read(`${root}/egypt-before/views.json`).views;before.push(...egyptBefore,...read(`${root}/terrain-before/views.json`).views);
 const comparisons=[];
 for(const v of after){const b=before.find(x=>x.name===v.name);assert.ok(b,`Missing baseline ${v.name}`);assert.deepEqual(v.camera,b.camera,`Unmatched camera ${v.name}`);const folder=v.name.endsWith('-terrain')?'terrain-before':(v.name.startsWith('egypt')||['delta','desert','africa-coast'].includes(v.name)?'egypt-before':'before');const final=folder!=='before'?'egypt-final':(v.name.includes('control')?'egypt-final':'levant-validated');
  const a=PNG.sync.read(fs.readFileSync(`${root}/${folder}/${v.name}.png`)),c=PNG.sync.read(fs.readFileSync(`${root}/${final}/${v.name}.png`));let sum=0,max=0,changed=0;
  // Central terrain crop excludes the counter/UI and screen-edge label collisions.
  for(let y=120;y<960;y++)for(let x=250;x<1650;x++){let different=false;for(let ch=0;ch<3;ch++){const d=Math.abs(a.data[(y*a.width+x)*4+ch]-c.data[(y*c.width+x)*4+ch]);sum+=d;max=Math.max(max,d);different ||= d>1;}if(different)changed++;}
  comparisons.push({name:v.name,before:folder,after:final,cameraExact:true,meanChannelDifference:sum/(840*1400*3),maxChannelDifference:max,pixelsOverOne:changed,beforeMeanMs:b.steady.meanMs,afterMeanMs:v.steady.meanMs,beforeGpuMs:b.gpu.meanMs,afterGpuMs:v.gpu.meanMs});
 }
 const hashes=read(`${root}/audit-hashes.json`),changed=[];
 for(const [p,h] of Object.entries(hashes))if(crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex')!==h)changed.push(p);
 const originalLevant=PNG.sync.read(fs.readFileSync(`${root}/levant-validated/levant-strategic.png`)),integratedLevant=PNG.sync.read(fs.readFileSync(`${root}/egypt-final/levant-control.png`));let total=0,largest=0,channelsOverOne=0;
 for(let i=0;i<originalLevant.data.length;i++)if(i%4!==3){const d=Math.abs(originalLevant.data[i]-integratedLevant.data[i]);total+=d;largest=Math.max(largest,d);if(d>1)channelsOverOne++;}
 const postEgyptLevant={meanChannelDifference:total/(originalLevant.width*originalLevant.height*3),maxChannelDifference:largest,channelsOverOne};
 fs.writeFileSync(`${root}/verification.json`,JSON.stringify({comparisons,changedSnapshotFiles:changed,postEgyptLevant},null,2));
 const rows=comparisons.map(v=>`<section><h2>${v.name}</h2><div class="pair"><figure><img src="../../godot-prototype/evidence/eastern-expansion/${v.before}/${v.name}.png"><figcaption>Before</figcaption></figure><figure><img src="../../godot-prototype/evidence/eastern-expansion/${v.after}/${v.name}.png"><figcaption>After</figcaption></figure></div><p>Exact recorded camera. Submitted mean ${v.beforeMeanMs.toFixed(2)} → ${v.afterMeanMs.toFixed(2)} ms; GPU ${v.beforeGpuMs.toFixed(2)} → ${v.afterGpuMs.toFixed(2)} ms.</p></section>`).join('\n');
 fs.writeFileSync('docs/eastern-expansion/REVIEW.html',`<!doctype html><meta charset="utf-8"><title>Levant then Egypt — matched Godot review</title><style>body{background:#172123;color:#eadfc6;font:16px system-ui;margin:30px}h1,h2{font-weight:500}.pair{display:flex;gap:12px}figure{margin:0;width:50%}img{width:100%}section{margin:35px 0}a{color:#d8bd79}</style><h1>Levant, then Egypt</h1><p>Actual 1920×1080 Godot captures. Open images for full resolution. Modern physical proxies; no claim of surveyed 278 BCE landscapes. <a href="REPORT.md">Report and limitations</a>.</p>${rows}`);
 console.log('REPORT_OK',comparisons.length,'exact cameras; existing changed files',changed);
}
