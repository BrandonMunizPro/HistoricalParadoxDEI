import fs from 'node:fs';
import assert from 'node:assert/strict';
import {PNG} from 'pngjs';
const root='godot-prototype/evidence/northern-expansion',docs='docs/northern-expansion';
const read=p=>JSON.parse(fs.readFileSync(p));
const finalCapture=read(root+'/final/views.json');
if(fs.existsSync(root+'/alpine-edge-final/views.json')){
 for(const v of read(root+'/alpine-edge-final/views.json').views){
  const index=finalCapture.views.findIndex(x=>x.name===v.name);assert(index>=0);
  finalCapture.views[index]=v;
  fs.copyFileSync(`${root}/alpine-edge-final/${v.name}.png`,`${root}/final/${v.name}.png`);
 }
 finalCapture.correctedViewsFrom='alpine-edge-final';
 fs.copyFileSync(root+'/alpine-edge-final/terrain-shader.txt',root+'/final/terrain-shader.txt');
 fs.writeFileSync(root+'/final/views.json',JSON.stringify(finalCapture,null,2));
}
const before=read(root+'/before/views.json').views,after=finalCapture.views;
assert.equal(before.length,after.length);
const comparisons=[];
for(let start=0;start<after.length;start+=5){
 const group=after.slice(start,start+5),sheet=new PNG({width:1280,height:group.length*360});
 for(let row=0;row<group.length;row++){
  const v=group[row],b=before.find(x=>x.name===v.name);assert.deepEqual(v.camera,b.camera,v.name+' camera changed');
  const pair=['before','final'].map(s=>PNG.sync.read(fs.readFileSync(`${root}/${s}/${v.name}.png`)));
  let changed=0,sum=0;for(let i=0;i<pair[0].data.length;i+=4){let maximum=0;for(let c=0;c<3;c++){const d=Math.abs(pair[0].data[i+c]-pair[1].data[i+c]);maximum=Math.max(maximum,d);sum+=d;}if(maximum>1)changed++;}
  comparisons.push({name:v.name,matchingCamera:true,changedPixelsAboveOneChannelLevel:changed,changedPercent:100*changed/(pair[0].width*pair[0].height),meanAbsoluteChannelDifference:sum/(pair[0].width*pair[0].height*3),beforeGpu:b.gpu,afterGpu:v.gpu,beforeWall:b.steady,afterWall:v.steady});
  for(let side=0;side<2;side++)for(let y=0;y<360;y++)for(let x=0;x<640;x++){
   const src=(Math.floor(y*pair[side].height/360)*pair[side].width+Math.floor(x*pair[side].width/640))*4,dst=((row*360+y)*1280+side*640+x)*4;
   pair[side].data.copy(sheet.data,dst,src,src+4);
  }
 }
 fs.writeFileSync(root+`/comparison-${start/5}.png`,PNG.sync.write(sheet));
}
fs.writeFileSync(root+'/comparison.json',JSON.stringify({matchingCameras:true,views:comparisons},null,2));
fs.mkdirSync(docs,{recursive:true});
const prefix='../../'+root;
fs.writeFileSync(docs+'/REVIEW.html',`<!doctype html><meta charset="utf-8"><title>Gaul and Britannia terrain review</title><style>body{background:#172127;color:#e9e6dc;font:16px system-ui;margin:2rem auto;max-width:1500px}header{position:sticky;top:0;padding:1rem;background:#172127ee}figure{margin:2rem 0}main{display:grid;gap:2rem}section{scroll-margin-top:5rem}.pair{display:grid;grid-template-columns:1fr 1fr;gap:.5rem}img{width:100%}a{color:#9bd7cc}h2{text-transform:capitalize}label{margin-right:1rem}</style><header><h1>Gaul and Britannia</h1>Matched Godot cameras · Before / After · <a href="REPORT.md">Report and limits</a><p><label>Image scale <input id="scale" type="range" min="100" max="200" value="100"></label><span>Scroll horizontally at larger scales.</span></p></header><main>${after.map(v=>`<section><h2>${v.name.replaceAll('-',' ')}</h2><div style="overflow:auto"><div class="pair"><div>Before<img loading="lazy" src="${prefix}/before/${v.name}.png"></div><div>After<img loading="lazy" src="${prefix}/final/${v.name}.png"></div></div></div></section>`).join('')}</main><script>document.querySelector('#scale').oninput=e=>document.querySelectorAll('.pair').forEach(p=>p.style.width=e.target.value+'%')</script>`);
console.log('NORTHERN_REVIEW_OK',comparisons.length,JSON.stringify(comparisons.filter(v=>v.name.endsWith('control')).map(v=>({name:v.name,changedPercent:v.changedPercent}))));
