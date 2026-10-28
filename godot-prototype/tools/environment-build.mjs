// Only a new Godot presentation derivative is written; source hydrology stays exact.
import fs from 'node:fs';
import crypto from 'node:crypto';
import {PNG} from 'pngjs';
const root=new URL('../',import.meta.url),read=p=>JSON.parse(fs.readFileSync(new URL(p,root)));
const rules=read('data/environment-presentation.json').river_field;
const hydrologyBytes=fs.readFileSync(new URL('data/hydrology.json',root));
const hydrology=JSON.parse(hydrologyBytes),rate=rules.pixels_per_degree;
const width=87*rate+1,height=50*rate+1,values=new Uint8Array(width*height);
let segments=0;
for(const river of hydrology.rivers){
 const lines=river.geometry.type==='MultiLineString'?river.geometry.coordinates:[river.geometry.coordinates];
 for(const line of lines)for(let i=1;i<line.length;i++){
  const a=line[i-1],b=line[i],steps=Math.max(1,Math.ceil(Math.hypot(b[0]-a[0],b[1]-a[1])*rate*2));segments++;
  for(let j=0;j<=steps;j++){
   const t=j/steps,lon=a[0]+(b[0]-a[0])*t,lat=a[1]+(b[1]-a[1])*t;
   const fx=(lon+12)*rate,fy=(62-lat)*rate,rx=111.195/rate*Math.max(.3,Math.cos(lat*Math.PI/180)),ry=111.195/rate;
   const nx=Math.ceil(3*rules.influence_km/rx),ny=Math.ceil(3*rules.influence_km/ry),cx=Math.round(fx),cy=Math.round(fy);
   for(let y=cy-ny;y<=cy+ny;y++)for(let x=cx-nx;x<=cx+nx;x++){
    if(x<0||x>=width||y<0||y>=height)continue;
    const distance2=((x-fx)*rx)**2+((y-fy)*ry)**2;
    const v=Math.round(255*Math.exp(-distance2/(2*rules.influence_km**2)));
    values[y*width+x]=Math.max(values[y*width+x],v);
   }
  }
 }
}
const out=new URL('data/environment/',root);fs.mkdirSync(out,{recursive:true});
fs.writeFileSync(new URL('.gdignore',out),'');
const png=new PNG({width,height});
for(let i=0;i<values.length;i++)png.data.set([values[i],values[i],values[i],255],i*4);
const encoded=PNG.sync.write(png,{colorType:0});
fs.writeFileSync(new URL('river-corridors.png',out),encoded);
fs.writeFileSync(new URL('provenance.json',out),JSON.stringify({notice:rules.notice,width,height,segments,source:'godot-prototype/data/hydrology.json',sourceSha256:crypto.createHash('sha256').update(hydrologyBytes).digest('hex'),outputSha256:crypto.createHash('sha256').update(encoded).digest('hex'),rules},null,2));
console.log(JSON.stringify({width,height,segments,bytes:encoded.length}));
