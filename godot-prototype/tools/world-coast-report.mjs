import fs from 'node:fs';
import assert from 'node:assert/strict';
import {PNG} from 'pngjs';
const root='godot-prototype/evidence/world-coasts',docs='docs/world-coasts';
const report=JSON.parse(fs.readFileSync(root+'/final-views.json')),expected=['tarquinii','dover','corsica','estuary','fjord','india','pellaro','anatolia'];
assert(report.completeReadinessRequired);assert.equal(report.views.length,expected.length);
for(const name of expected){
 const view=report.views.find(v=>v.name===name);assert(view&&view.settled);assert(view.coast.maxVertices<=180000);
 if(name!=='pellaro'){assert.equal(view.contactChecks.length,2);for(const p of view.contactChecks)assert(Math.sign(p.gpuSignedDistanceKm)===Math.sign(p.cpuSignedDistanceKm));}
 const log=fs.readFileSync(root+'/final/'+name+'/stdout.log','utf8');assert(log.includes('WORLD_COAST_RELEASE_OK'));
 assert(!/SCRIPT ERROR|ERROR:/.test(fs.readFileSync(root+'/final/'+name+'/stderr.log','utf8')));
}
fs.mkdirSync(docs,{recursive:true});
const prefix='../../'+root+'/final';
const labels={tarquinii:'Italian beach',dover:'English Channel cliffs',corsica:'Corsican island coast',estuary:'Low river-influenced bank',fjord:'Norwegian fjord',india:'Western Indian coast',pellaro:'Approved Pellaro control',anatolia:'Anatolian coast'};
const sheet=new PNG({width:1280,height:expected.length/2*360});
for(let i=0;i<expected.length;i++){const name=expected[i],p=PNG.sync.read(fs.readFileSync(root+'/final/'+name+'/'+name+'-0.0.png'));for(let y=0;y<360;y++)for(let x=0;x<640;x++){const src=(Math.floor(y*p.height/360)*p.width+Math.floor(x*p.width/640))*4,dst=((Math.floor(i/2)*360+y)*1280+i%2*640+x)*4;p.data.copy(sheet.data,dst,src,src+4);}}
fs.writeFileSync(root+'/contact-sheet.png',PNG.sync.write(sheet));
fs.writeFileSync(docs+'/REVIEW.html',`<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>World shoreline review</title><style>body{background:#102028;color:#e4ebe8;font:16px system-ui;margin:0}main{max-width:1500px;margin:auto;padding:24px}header{position:sticky;top:0;background:#102028f2;padding:14px 0;z-index:1}h1{font-size:28px}p{line-height:1.6;color:#bccdca}a{color:#9cdad3}button{padding:10px 18px;border:0;border-radius:4px;cursor:pointer;margin-right:12px;background:#cfdfd6;color:#142b2c}img{width:100%;display:block}section{margin:35px 0;scroll-margin-top:130px}</style><main><header><h1>World shoreline review</h1><button data-time="0.0">Time 0 s</button><button data-time="2.5">Time 2.5 s</button><a href="REPORT.md">Scope and validation</a></header><p>Actual settled production-game renders. Compare two time samples to inspect moving contact; launch the live preview for continuous motion. Beach, rock and bank styles are inferred rendering treatments.</p>${expected.map(name=>`<section><h2>${labels[name]}</h2><img data-name="${name}" loading="lazy" alt="${labels[name]}" src="${prefix}/${name}/${name}-0.0.png"></section>`).join('')}<p>Interactive preview: <code>.\\godot-prototype\\world-coast-preview.ps1 -Coast dover</code>. Use any reviewed coast name: ${expected.join(', ')}.</p></main><script>document.querySelectorAll('button').forEach(button=>button.onclick=()=>document.querySelectorAll('img').forEach(img=>img.src='${prefix}/'+img.dataset.name+'/'+img.dataset.name+'-'+button.dataset.time+'.png'));</script></html>`);
const result={passed:true,settledViews:report.views.length,source:JSON.parse(fs.readFileSync('godot-prototype/data/world-coasts/manifest.json')).segments,gpuContactProbes:report.views.reduce((n,v)=>n+v.contactChecks.length,0),geometryReleaseChecks:expected.length,maxVertices:Math.max(...report.views.map(v=>v.coast.maxVertices)),notice:'Representative production views and numeric source audit; no claim that every coastline pixel or ancient shoreline has been certified.'};
fs.writeFileSync(root+'/review.json',JSON.stringify(result,null,2));console.log('WORLD_COAST_REVIEW_OK',JSON.stringify(result));
