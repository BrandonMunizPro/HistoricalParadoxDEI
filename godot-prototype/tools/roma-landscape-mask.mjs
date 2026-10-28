// Original terrain-paint mask, using the existing illustrative Roma street layout.
import fs from 'node:fs';import {PNG} from 'pngjs';
const root='godot-prototype',settings=JSON.parse(fs.readFileSync(`${root}/data/roma-presentation.json`)).landscape;
const layout=JSON.parse(fs.readFileSync(`${root}/data/roma-landscape-layout.json`));
const routes=[...layout.roads,...settings.approaches.map(points=>({points,width:settings.road_width_km}))];
const segments=routes.flatMap(r=>r.points.slice(1).map((b,i)=>({a:r.points[i],b,width:r.width})));
const smooth=(a,b,x)=>{let t=Math.max(0,Math.min(1,(x-a)/(b-a)));return t*t*(3-2*t);};
const n=1024,span=3.3,image=new PNG({width:n,height:n});
for(let y=0;y<n;y++)for(let x=0;x<n;x++){
 const px=(x/(n-1)-.5)*span,pz=(y/(n-1)-.5)*span,i=(y*n+x)*4;let crop=0,fallow=0,road=0,yard=0;
 for(const f of settings.fields){const dx=px-f[0],dz=pz-f[1],c=Math.cos(f[4]),s=Math.sin(f[4]),u=dx*c+dz*s,v=-dx*s+dz*c;
  const edge=Math.min(.5-Math.abs(u/f[2]),.5-Math.abs(v/f[3]));const irregular=Math.sin(px*37+Math.sin(pz*23))*Math.sin(pz*31)*.025;
  const amount=smooth(-.015,.10,edge+irregular)*.62;
  if(f[5]===1)crop=Math.max(crop,amount);else fallow=Math.max(fallow,amount);
 }
 for(const r of segments){const dx=r.b[0]-r.a[0],dz=r.b[1]-r.a[1],t=Math.max(0,Math.min(1,((px-r.a[0])*dx+(pz-r.a[1])*dz)/(dx*dx+dz*dz))),distance=Math.hypot(px-r.a[0]-dx*t,pz-r.a[1]-dz*t);road=Math.max(road,1-smooth(r.width*.32,r.width*.68,distance));}
 if(Math.abs(px)<.05&&pz>-.03&&pz<.05)road=1;
 if(Math.abs(px)<.38&&Math.abs(pz)<.38)for(const h of layout.houses){const d=Math.hypot(px-h.x,pz-h.z);yard=Math.max(yard,(1-smooth(.009,.024*h.size,d))*.45);}
 image.data.set([Math.round(crop*255),Math.round(fallow*255),Math.round(road*255),Math.round(yard*255)],i);
}
fs.writeFileSync(`${root}/data/roma-landscape-mask.png`,PNG.sync.write(image));
console.log('ROMA_LANDSCAPE_MASK_OK 1024² original interpretive surface paint; source geography unchanged');
