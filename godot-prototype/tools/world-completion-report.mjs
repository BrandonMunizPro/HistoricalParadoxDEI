import fs from 'node:fs';
import assert from 'node:assert/strict';
import {PNG} from 'pngjs';
const root='godot-prototype/evidence/world-completion',docs='docs/world-completion',read=p=>JSON.parse(fs.readFileSync(p));
const after=read(root+'/final/views.json').views,before=read(root+'/before/views.json').views;
assert.equal(after.length,Object.keys(read('godot-prototype/data/world-completion-views.json')).length);
fs.mkdirSync(docs,{recursive:true});
const rows=[];
for(let start=0;start<after.length;start+=6){
 const group=after.slice(start,start+6),sheet=new PNG({width:1280,height:Math.ceil(group.length/2)*360});
 for(let j=0;j<group.length;j++){
  const v=group[j],p=PNG.sync.read(fs.readFileSync(root+'/final/'+v.name+'.png'));
  for(let y=0;y<360;y++)for(let x=0;x<640;x++){const src=(Math.floor(y*p.height/360)*p.width+Math.floor(x*p.width/640))*4,dst=((Math.floor(j/2)*360+y)*1280+(j%2)*640+x)*4;p.data.copy(sheet.data,dst,src,src+4);}
  const old=before.find(x=>x.name===v.name);let comparison=null;
  if(old){
   const equal=(a,b)=>Array.isArray(a)?a.every((x,i)=>Math.abs(x-b[i])<.00001):Math.abs(a-b)<.00001;
   const matchingPose=equal(v.camera.position,old.camera.position)&&equal(v.camera.basis,old.camera.basis)&&equal(v.camera.fov,old.camera.fov);assert(matchingPose,v.name+' camera pose changed');
   const b=PNG.sync.read(fs.readFileSync(root+'/before/'+v.name+'.png'));let count=0,sum=0;
   for(let i=0;i<p.data.length;i+=4){let max=0;for(let c=0;c<3;c++){const d=Math.abs(p.data[i+c]-b.data[i+c]);sum+=d;max=Math.max(max,d);}if(max>1)count++;}
   comparison={matchingPositionOrientationFov:true,matchingClippingPlanes:equal(v.camera.near,old.camera.near)&&equal(v.camera.far,old.camera.far),changedPixelsAboveOneChannelLevel:count,meanAbsoluteChannelDifference:sum/(p.width*p.height*3)};
  }
  rows.push({name:v.name,comparison,staticMiB:v.staticMemoryBytes/1048576,videoMiB:v.videoMemoryBytes/1048576,gpu:v.gpu,submittedIntervals:v.steady});
 }
 fs.writeFileSync(root+`/sheet-${start/6}.png`,PNG.sync.write(sheet));
}
fs.writeFileSync(root+'/review.json',JSON.stringify({views:rows,method:'Actual Godot captures. Only views with frozen earlier poses have comparisons. Short hidden-window timings are not sustained interactive FPS.'},null,2));
const audit=read('godot-prototype/data/world-border-review/audit.json');
fs.writeFileSync(docs+'/BORDER-AUDIT.md',`# Border audit — 278 BCE\n\nAll 128 territorial records retain their order, identities and initial controllers. Three Galatian groups remain presence markers without territory. The 30 source-reconstruction shapes are retained; 85 provisional shapes have terrain/river-guided generalization. Italian core associations remain unchanged.\n\nGeometry validity, labels, source-subset dates and raster identities are checked. This does not certify exact ancient sovereignty. A smoother line is not stronger historical evidence.\n\n| Territory | Evidence class | Geometry | 278 BCE assessment |\n| --- | --- | --- | --- |\n${audit.territories.map(t=>`| ${t.owner} | ${t.classification.replaceAll('_',' ')} | ${t.geometryChanged?'Revised provisional drawing':'Retained'} | ${t.temporalStatus} |`).join('\n')}\n\nThe original dated Cliopatria subset and its license remain in godot-prototype/data/factions/. The derived review layer is in data/world-border-review/; it changes no initial controller or approved settlement/research coordinate.\n`);
const prefix='../../'+root;
fs.writeFileSync(docs+'/REVIEW.html',`<!doctype html><meta charset="utf-8"><title>World terrain and border review</title><style>body{background:#172127;color:#e9e6dc;font:16px system-ui;margin:2rem auto;max-width:1500px}header{position:sticky;top:0;padding:1rem;background:#172127f5;z-index:1}h1{font-size:1.7rem}h2{text-transform:capitalize}img{width:100%;display:block}.pair{display:grid;grid-template-columns:1fr 1fr;gap:.6rem}section{margin:2rem 0;scroll-margin-top:12rem}a{color:#9bd7cc}label{margin-right:1.5rem}select{padding:.4rem}.viewport{overflow:auto}</style><header><h1>World terrain and border review</h1><p><a href="REPORT.md">Changes and limits</a> · <a href="BORDER-AUDIT.md">All 128 territorial records</a></p><label>Show <select id="filter"><option value="all">All views</option><option value="repairs">Alps, Gaul and Hispania</option><option value="terrain">Remaining terrain</option><option value="controls">Completed-region controls</option></select></label><label>Image scale <input id="scale" type="range" min="100" max="200" value="100"></label></header>${after.map(v=>{const old=before.some(b=>b.name===v.name),category=['alps-seam','gaul-overview','hispania-overview','iberian-interior'].includes(v.name)?'repairs':v.name.endsWith('-control')?'controls':'terrain';return `<section data-category="${category}"><h2>${v.name.replaceAll('-',' ')}</h2><div class="viewport"><div class="images ${old?'pair':''}">${old?`<div>Earlier checkpoint<img loading="lazy" alt="Earlier ${v.name}" src="${prefix}/before/${v.name}.png"></div>`:''}<div>Final<img loading="lazy" alt="Final ${v.name}" src="${prefix}/final/${v.name}.png"></div></div></div></section>`;}).join('')}<script>document.querySelector('#filter').onchange=e=>document.querySelectorAll('section').forEach(s=>s.hidden=e.target.value!=='all'&&s.dataset.category!==e.target.value);document.querySelector('#scale').oninput=e=>document.querySelectorAll('.images').forEach(p=>p.style.width=e.target.value+'%')</script>`);
console.log('WORLD_COMPLETION_REVIEW_OK',rows.length,'views',rows.filter(r=>r.comparison).length,'matched earlier poses');
