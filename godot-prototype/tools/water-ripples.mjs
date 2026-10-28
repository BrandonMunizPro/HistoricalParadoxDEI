// Original periodic normal field, synthesized from deterministic wave spectra.
// No reference-game assets or geographic inputs are read or changed.
import fs from 'node:fs';
import {PNG} from 'pngjs';
const size=256,waves=[];
let seed=0x4d4544;
const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
for(let i=0;i<32;i++){
 const angle=random()*Math.PI*2,frequency=3+random()*27;
 const x=Math.round(Math.cos(angle)*frequency),y=Math.round(Math.sin(angle)*frequency);
 waves.push({x,y,phase:random()*Math.PI*2,weight:1/Math.sqrt(frequency)});
}
const energy=Math.sqrt(waves.reduce((n,w)=>n+w.weight*w.weight,0));
const png=new PNG({width:size,height:size});
for(let y=0;y<size;y++)for(let x=0;x<size;x++){
 let dx=0,dy=0;
 for(const w of waves){const k=Math.hypot(w.x,w.y),v=Math.cos((x*w.x+y*w.y)*Math.PI*2/size+w.phase)*w.weight;dx+=v*w.x/k;dy+=v*w.y/k;}
 dx/=energy;dy/=energy;
 const n=Math.hypot(dx,dy,1),i=(y*size+x)*4;
 png.data.set([Math.round((dx/n*.5+.5)*255),Math.round((dy/n*.5+.5)*255),Math.round(255/n),255],i);
}
const output=new URL('../data/visual/water-ripples.png',import.meta.url);
fs.writeFileSync(output,PNG.sync.write(png));
console.log('Original seamless water normal field: 256x256, seed 0x4d4544');
