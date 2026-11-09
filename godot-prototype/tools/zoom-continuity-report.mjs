import fs from 'node:fs';
import assert from 'node:assert/strict';
import {PNG} from 'pngjs';
const root='godot-prototype/evidence/zoom-continuity';
const before=JSON.parse(fs.readFileSync(root+'/before/views.json')).views;
const after=JSON.parse(fs.readFileSync(root+'/after/views.json')).views;
const results=[];
const sheet=new PNG({width:1280,height:after.length*360});
for(let row=0;row<after.length;row++){
 const view=after[row];assert.deepEqual(view.camera,before.find(v=>v.name===view.name).camera);
 const pair=['before','after'].map(stage=>PNG.sync.read(fs.readFileSync(`${root}/${stage}/${view.name}.png`)));
 for(let side=0;side<2;side++)for(let y=0;y<360;y++)for(let x=0;x<640;x++){const p=pair[side],i=(y*3*p.width+x*3)*4,j=((row*360+y)*1280+side*640+x)*4;sheet.data.set(p.data.subarray(i,i+4),j);}
 if(view.name.includes('near-control')){
  let total=0,max=0,pixelsOverOne=0;
  for(let y=120;y<960;y++)for(let x=250;x<1650;x++){let changed=false;for(let c=0;c<3;c++){const i=(y*1920+x)*4+c,d=Math.abs(pair[0].data[i]-pair[1].data[i]);total+=d;max=Math.max(max,d);changed ||=d>1;}if(changed)pixelsOverOne++;}
  results.push({name:view.name,meanChannelDifference:total/(840*1400*3),maxChannelDifference:max,pixelsOverOne});
 }
}
fs.writeFileSync(root+'/comparison.png',PNG.sync.write(sheet));
fs.writeFileSync(root+'/close-controls.json',JSON.stringify(results,null,2));
fs.mkdirSync('docs/zoom-continuity',{recursive:true});
const rows=after.map(v=>`<section><h2>${v.name} — ${v.preset[2]} km</h2><div>${['before','after'].map(stage=>`<figure><a href="../../${root}/${stage}/${v.name}.png"><img loading="lazy" src="../../${root}/${stage}/${v.name}.png"></a><figcaption>${stage}</figcaption></figure>`).join('')}</div></section>`).join('\n');
fs.writeFileSync('docs/zoom-continuity/REVIEW.html',`<!doctype html><meta charset="utf-8"><title>Regional appearance across zoom levels</title><style>body{background:#172123;color:#eadfc6;font:16px system-ui;margin:30px}h1,h2{font-weight:500}section{margin:36px 0}section div{display:flex;gap:12px}figure{margin:0;width:50%}img{width:100%}a{color:#d8bd79}</style><h1>Regional appearance across zoom levels</h1><p>Actual matched-camera Godot images. Click for full resolution. <a href="REPORT.md">Change and WS2 isolation report</a>.</p>${rows}`);
console.log('ZOOM_REVIEW_OK',after.length,'matched views',results);
