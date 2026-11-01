// Original material controls; interpretation, never historical land-use evidence.
import fs from 'node:fs';import {PNG} from 'pngjs';import {projectLocalMapMetres} from '../../dist/infrastructure/world-geography.js';
const root='godot-prototype',origin={lon:13.5,lat:41.5},p=(lon,lat)=>{let a=projectLocalMapMetres({lon,lat},origin);return[a.east*.001,-a.north*.001];};
const lo=p(12.27,42.04),hi=p(12.86,41.60),w=1024,image=new PNG({width:w,height:w});
const hydro=JSON.parse(fs.readFileSync(root+'/data/hydrology.json'));
const line=hydro.rivers[629].geometry.coordinates.map(c=>p(...c));
const hash=(x,y)=>{let n=Math.imul(x,374761393)+Math.imul(y,668265263);n=Math.imul(n^(n>>>13),1274126177);return((n^(n>>>16))>>>0)/4294967295;};
function noise(x,y){const a=Math.floor(x),b=Math.floor(y);let u=x-a,v=y-b;u=u*u*(3-2*u);v=v*v*(3-2*v);return (hash(a,b)*(1-u)+hash(a+1,b)*u)*(1-v)+(hash(a,b+1)*(1-u)+hash(a+1,b+1)*u)*v;}
for(let y=0;y<w;y++)for(let x=0;x<w;x++){
 const px=lo[0]+x/(w-1)*(hi[0]-lo[0]),pz=lo[1]+y/(w-1)*(hi[1]-lo[1]);let d=100;
 for(let i=1;i<line.length;i++){const a=line[i-1],b=line[i],dx=b[0]-a[0],dz=b[1]-a[1],t=Math.max(0,Math.min(1,((px-a[0])*dx+(pz-a[1])*dz)/(dx*dx+dz*dz)));d=Math.min(d,Math.hypot(px-a[0]-dx*t,pz-a[1]-dz*t));}
 const f=.55*noise(px*1.7,pz*1.7)+.30*noise(px*4.7,pz*4.7)+.15*noise(px*13,pz*13),i=(y*w+x)*4;
 image.data[i]=Math.round(f*255);image.data[i+1]=Math.round(Math.min(1,d/.15)*255);image.data[i+2]=Math.round(noise(px*.35,pz*.35)*255);image.data[i+3]=255;
}
fs.writeFileSync(root+'/assets/landscape-quality/control.png',PNG.sync.write(image));fs.writeFileSync(root+'/assets/landscape-quality/control.json',JSON.stringify({rect:[...lo,...hi],resolution:w,channels:{r:'Original coherent soil blend',g:'Distance to existing Tiber source line, 0..150 metres',b:'Original broad surface variation'},source:'data/hydrology.json',notice:'No height or source coordinates changed. Material interpretation only.'},null,2));
