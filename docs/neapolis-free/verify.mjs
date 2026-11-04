import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { PNG } from 'pngjs';
const base=path.resolve(import.meta.dirname,'../..');
const evidence=path.join(base,'godot-prototype/evidence/neapolis-free');
const json=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const before=json(path.join(evidence,'before/views.json'));
const afterPath=path.join(evidence,'final/views.json');
const after=fs.existsSync(afterPath)?json(afterPath):{views:[]};
const rows=[];
for(const a of before.views){
 const b=after.views.find(v=>v.name===a.name);if(!b)continue;
 const sameCamera=JSON.stringify(a.camera)===JSON.stringify(b.camera);
 if(!sameCamera)throw Error(`Camera mismatch: ${a.name}`);
 const p=PNG.sync.read(fs.readFileSync(path.join(evidence,'before',a.name+'.png'))),q=PNG.sync.read(fs.readFileSync(path.join(evidence,'final',a.name+'.png')));
 if(p.width!==q.width||p.height!==q.height)throw Error('Resolution mismatch');
 let changed=0,sum=0,max=0;
 for(let i=0;i<p.data.length;i+=4){let d=0;for(let c=0;c<3;c++){const x=Math.abs(p.data[i+c]-q.data[i+c]);sum+=x;d=Math.max(d,x);max=Math.max(max,x)}if(d>0)changed++}
 rows.push({view:a.name,sameCamera,resolution:[p.width,p.height],changedPixels:changed,meanChannelDifference:sum/(p.width*p.height*3),maxChannelDifference:max,baselineGpu:a.gpu,candidateGpu:b.gpu,baselineRenderCpu:a.renderCpu,candidateRenderCpu:b.renderCpu,baselineSubmitted:a.submitted,candidateSubmitted:b.submitted,baselineDrawCalls:a.drawCalls,candidateDrawCalls:b.drawCalls,baselineTextureBytes:a.textureMemoryBytes,candidateTextureBytes:b.textureMemoryBytes,candidateTarget:b.target});
}
const motionPath=path.join(evidence,'final/motion.json');
let motion=null;
if(fs.existsSync(motionPath)){
 const all=json(motionPath).frames,b=all.filter(f=>!f.candidate),a=all.filter(f=>f.candidate);
 if(b.length!==a.length)throw Error('Motion sample mismatch');
 for(let i=0;i<a.length;i++)if(JSON.stringify(a[i].camera)!==JSON.stringify(b[i].camera))throw Error('Motion camera mismatch');
 const stats=values=>{values.sort((a,b)=>a-b);return {meanMs:values.reduce((a,b)=>a+b,0)/values.length,p95Ms:values[Math.floor(values.length*.95)],maxMs:values.at(-1)}};
 motion={framesPerMode:a.length,sameCamera:true,baselineSubmitted:stats(b.map(v=>v.intervalMs)),candidateSubmitted:stats(a.map(v=>v.intervalMs)),baselineGpu:stats(b.map(v=>v.gpuMs)),candidateGpu:stats(a.map(v=>v.gpuMs)),candidateUnsettledFrames:a.filter(v=>!v.settled).length,notice:'Scripted submitted intervals, including streaming and two explicit draw requests. Not sustained gameplay FPS.'};
}
const hash=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const report={status:rows.length===6&&motion?'captures-complete-manual-review-required':'capture-incomplete',matchedViews:rows.length,views:rows,motion,native:json(path.join(evidence,'native-verification.json')),assets:json(path.join(evidence,'asset-verification.json')),baselineRendererSha256:hash(path.join(evidence,'before/settlement_population.gd.txt')),candidateRendererSha256:hash(path.join(base,'godot-prototype/settlement_population.gd')),candidateAdapterSha256:hash(path.join(base,'godot-prototype/neapolis_housing_assets.gd')),notice:'Pixel equality is reported, not assumed; native correctness and test passes do not establish visual approval.'};
fs.writeFileSync(path.join(import.meta.dirname,'verification.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({status:report.status,matchedViews:rows.length,motion:motion?.framesPerMode,passedNative:report.native.passed}));
