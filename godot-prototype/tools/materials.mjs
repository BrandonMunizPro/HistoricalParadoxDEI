// Original seamless procedural bitmap materials; no external asset download.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {PNG} from 'pngjs';
const output=path.resolve(fileURLToPath(new URL('../materials/',import.meta.url)));
fs.mkdirSync(output,{recursive:true});
const size=256;
function hash(x,y){const n=Math.sin(x*127.1+y*311.7)*43758.5453;return n-Math.floor(n);}
function noise(x,y,f){x=((x+size)%size)/size*f;y=((y+size)%size)/size*f;const ix=Math.floor(x),iy=Math.floor(y);let a=x-ix,b=y-iy;a=a*a*(3-2*a);b=b*b*(3-2*b);const h=(i,j)=>hash((i+f)%f,(j+f)%f);return (h(ix,iy)*(1-a)+h(ix+1,iy)*a)*(1-b)+(h(ix,iy+1)*(1-a)+h(ix+1,iy+1)*a)*b;}
function height(x,y){return noise(x,y,8)*.48+noise(x,y,16)*.26+noise(x,y,32)*.16+noise(x,y,64)*.10;}
for(const [name,base] of Object.entries({rock:[108,103,92],grass:[105,117,70],soil:[126,104,74],lava:[73,75,72],sand:[175,162,131]})){
 const diffuse=new PNG({width:size,height:size}),normal=new PNG({width:size,height:size});
 for(let y=0;y<size;y++)for(let x=0;x<size;x++){
  const h=height(x,y),k=.56+h*.82;
  const strength=name==='grass'?.8:2.5;
  const dx=(height(x+1,y)-height(x-1,y))*strength,dy=(height(x,y+1)-height(x,y-1))*strength,len=Math.hypot(dx,dy,1);
  const i=(y*size+x)*4;
  diffuse.data.set([...base.map(v=>Math.round(v*k)),255],i);
  normal.data.set([Math.round(128-dx/len*127),Math.round(128-dy/len*127),Math.round(128+127/len),255],i);
 }
 fs.writeFileSync(path.join(output,`${name}.png`),PNG.sync.write(diffuse));
 fs.writeFileSync(path.join(output,`${name}-normal.png`),PNG.sync.write(normal));
}
console.log('Original seamless materials prepared.');
