import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {PNG} from 'pngjs';
const root=path.resolve(fileURLToPath(new URL('..',import.meta.url)));
const before=process.argv[2]??'baseline',after=process.argv[3]??'after';
const out=path.join(root,'evidence','visual-comparison');
fs.mkdirSync(out,{recursive:true});fs.writeFileSync(path.join(out,'.gdignore'),'');
const views=JSON.parse(fs.readFileSync(path.join(root,'data/visual-views.json'))),rows=[];
for(const region of Object.keys(views))for(const scale of ['overview','strategic','close']){
 const name=`${region}-${scale}`,files=[before,after].map(s=>path.join(root,`evidence/visual-${s}/godot-${name}`));
 // Supplementary camera presets may have after-only evidence in another folder.
 if(!files.every(p=>fs.existsSync(p+'.json'))){assert.equal(region,'high-atlas',`Missing comparison: ${name}`);continue;}
 const [a,b]=files.map(p=>JSON.parse(fs.readFileSync(p+'.json')));
 assert.deepEqual(a.camera,b.camera,`Camera changed: ${name}`);
 const [pa,pb]=files.map(p=>PNG.sync.read(fs.readFileSync(p+'.png')));
 assert.equal(pa.width,pb.width);assert.equal(pa.height,pb.height);
 assert.ok(b.residentTiles.length<=13);assert.equal(b.sites,35);assert.equal(b.research,687);
 const metrics=m=>({fps:1000/m.settledFrameStats.meanMs,p95Ms:m.settledFrameStats.p95Ms,maxFrameMs:m.startupAndStreamingMaxFrameMs,tiles:m.residentTiles.length,drawCalls:m.drawCalls,vramMiB:m.renderVideoMemoryBytes/1048576});
 rows.push({name,camera:b.camera,before:metrics(a),after:metrics(b)});
}
assert.ok(rows.length>=30,'Expected all 30 original region/scale pairs');
fs.writeFileSync(path.join(out,'measurements.json'),JSON.stringify({notice:'Short sequential desktop samples, not cold-cache or sustained traversal guarantees. FPS uses consecutive settled frames. Identical camera objects and image dimensions asserted.',rows},null,2));
const html=`<!doctype html><meta charset="utf-8"><title>Godot visual review</title><style>body{margin:24px;background:#152022;color:#ece6d6;font:16px system-ui}section{margin:32px 0}figure{margin:0}img{width:100%}.pair{display:grid;grid-template-columns:1fr 1fr;gap:10px}button{margin:8px}small{color:#b7cbc8}</style><h1>Godot water and strategic relief review</h1><p>30 identical camera pairs. All imagery uses existing modern geographic inputs; scenery is interpretive. Review all three scales, including remaining seams. Measurements are short desktop samples.</p>${rows.map(r=>`<section><h2>${r.name}</h2><small>Settled FPS ${r.before.fps.toFixed(1)} → ${r.after.fps.toFixed(1)} · p95 ${r.before.p95Ms.toFixed(2)} → ${r.after.p95Ms.toFixed(2)} ms · resident tiles ${r.after.tiles}</small><div class="pair"><figure><figcaption>Before</figcaption><a href="../visual-${before}/godot-${r.name}.png"><img loading="lazy" src="../visual-${before}/godot-${r.name}.png"></a></figure><figure><figcaption>After</figcaption><a href="../visual-${after}/godot-${r.name}.png"><img loading="lazy" src="../visual-${after}/godot-${r.name}.png"></a></figure></div></section>`).join('')}`;
fs.writeFileSync(path.join(out,'index.html'),html);
console.log('VISUAL_COMPARISON_OK',rows.length,'camera pairs');
