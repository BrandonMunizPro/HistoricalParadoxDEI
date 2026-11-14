import fs from 'node:fs';
import assert from 'node:assert/strict';
import {PNG} from 'pngjs';
const root='godot-prototype/evidence/world-readiness/';
function audit(file){
 const p=PNG.sync.read(fs.readFileSync(file));assert.equal(p.width,1280);assert.equal(p.height,720);
 const mask=new Uint8Array(p.width*p.height);let pixels=0,largest=0;
 // The observed background gap colour, excluding the campaign interface.
 // This is a targeted regression, not a general image-quality classifier.
 for(let y=110;y<620;y++)for(let x=80;x<1250;x++){
  const i=y*p.width+x,j=i*4,r=p.data[j],g=p.data[j+1],b=p.data[j+2];
  if(r>=143&&r<=150&&g>=169&&g<=174&&b>=188&&b<=193){mask[i]=1;pixels++;}
 }
 for(let i=0;i<mask.length;i++){
  if(!mask[i])continue;const queue=[i];mask[i]=0;let size=0;
  for(let head=0;head<queue.length;head++){const q=queue[head];size++;for(const n of [q-1,q+1,q-p.width,q+p.width])if(n>=0&&n<mask.length&&mask[n]){mask[n]=0;queue.push(n);}}
  largest=Math.max(largest,size);
 }
 return {file,pixels,largestBackgroundColouredComponent:largest};
}
const before=audit(root+'iteration-gaps/fjord-arrival.png');assert(before.largestBackgroundColouredComponent>400,'Regression fixture must contain the observed gap');
const after=['delta','aegean','fjord','india','arabia','pellaro'].map(n=>audit(root+'immediate/'+n+'-arrival.png'));
for(const row of after)assert(row.largestBackgroundColouredComponent<400,'Background gap remains: '+row.file);
const result={passed:true,before,after,notice:'Detects the specific background-coloured coastal gaps found during visual inspection, under the tested lighting and viewports. Does not establish coastline accuracy or absence of every visual defect.'};
fs.writeFileSync(root+'image-validation.json',JSON.stringify(result,null,2)+'\n');console.log('WORLD_READINESS_IMAGE_VALIDATION',JSON.stringify(result));
