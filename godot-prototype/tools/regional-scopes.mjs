/* eslint-disable @typescript-eslint/explicit-module-boundary-types -- These are runtime JavaScript geographic helpers, not TypeScript API declarations. */
import fs from 'node:fs';
import {PNG} from 'pngjs';
const read=p=>JSON.parse(fs.readFileSync('godot-prototype/data/'+p));
export const frontier=read('frontier-regions.json');
const northern=read('northern-regions.json'),iberia=read('hispania-region.json'),africa=read('africa-regions.json'),east=read('eastern-regions.json'),rollout=read('cartographic-rollout.json');
export const smooth=(a,b,x)=>{const t=Math.max(0,Math.min(1,(x-a)/(b-a)));return t*t*(3-2*t);};
const limit=(p,x)=>{for(let i=1;i<p.length;i++)if(x<=p[i][0])return p[i-1][1]+(p[i][1]-p[i-1][1])*Math.max(0,Math.min(1,(x-p[i-1][0])/(p[i][0]-p[i-1][0])));return p.at(-1)[1];};
export const rect=(b,x,y,feather=.25)=>smooth(b.west,b.west+feather,x)*(1-smooth(b.east-.25,b.east,x))*smooth(b.south,b.south+.25,y)*(1-smooth(b.north-.25,b.north,y));
const band=(c,x,y)=>x<=c.bounds.west||x>=c.bounds.east||y<=c.bounds.south||y>=c.bounds.north?0:rect(c.bounds,x,y)*(1-smooth(limit(c.northLimit,x)-.15,limit(c.northLimit,x)+.15,y))*smooth(limit(c.southLimit,x)-.05,limit(c.southLimit,x)+.05,y);
export function referenceWeight(x,y){
 if(x>7.9&&x<10.2&&y>38.5&&y<43.3)return 0; // Sardinia/Corsica, not the Italian mainland.
 let w=0;
 for(const r of rollout.referenceRects){if(x<r[0]-.2||x>r[2]+.2||y<r[1]-.2||y>r[3]+.2)continue;w=Math.max(w,smooth(r[0]-.2,r[0]+.2,x)*(1-smooth(r[2]-.2,r[2]+.2,x))*smooth(r[1]-.2,r[1]+.2,y)*(1-smooth(r[3]-.2,r[3]+.2,y)));}
 for(const c of rollout.referenceCorridors){if(x<Math.min(c[0],c[2])-(c[4]+.2)/.75||x>Math.max(c[0],c[2])+(c[4]+.2)/.75||y<Math.min(c[1],c[3])-c[4]-.2||y>Math.max(c[1],c[3])+c[4]+.2)continue;const ax=c[0]*.75,ay=c[1],dx=(c[2]-c[0])*.75,dy=c[3]-c[1],t=Math.max(0,Math.min(1,((x*.75-ax)*dx+(y-ay)*dy)/(dx*dx+dy*dy)));w=Math.max(w,1-smooth(c[4]-.15,c[4]+.15,Math.hypot(x*.75-ax-dx*t,y-ay-dy*t)));}
 return w;
}
export function establishedWeight(x,y){
 let w=referenceWeight(x,y);
 const anSouth=35.8+1.5*smooth(35.8,39.5,x),anNorth=40.4+1.5*smooth(28.6,29.2,x);
 const anatolia=smooth(25.8,26.2,x)*(1-smooth(42.2,42.6,x))*smooth(anSouth-.2,anSouth+.2,y)*(1-smooth(anNorth-.2,anNorth+.2,y));w=Math.max(w,anatolia);
 const levant=rect(east.regions.levant.bounds,x,y)*(1-smooth(.001,.01,anatolia))*smooth(34+.6*smooth(32,33,y),34.25+.6*smooth(32,33,y),x);
 const egypt=rect(east.regions.egypt.bounds,x,y,1.3)*(1-smooth(.001,.01,levant));w=Math.max(w,levant,egypt);
 for(const r of africa.order){const b=africa.regions[r].bounds;if(x<=b.west||x>=b.east||y<=b.south||y>=b.north)continue;w=Math.max(w,rect(b,x,y)*(1-smooth(limit(africa.northMarineLimit,x)-.05,limit(africa.northMarineLimit,x)+.05,y))*(1-smooth(limit(africa.eastMarineLimit,y)-.05,limit(africa.eastMarineLimit,y)+.05,x)));}
 return Math.max(w,band(iberia,x,y),...Object.values(northern.regions).map(c=>band(c,x,y)));
}
export function frontierWeight(region,x,y){
 let w=rect(frontier.regions[region].bounds,x,y);
 if(w<=.001)return 0;
 for(const earlier of frontier.order){if(earlier===region)break;w*=1-smooth(.001,.01,rect(frontier.regions[earlier].bounds,x,y));if(w<=.001)return 0;}
 w*=1-smooth(.001,.01,establishedWeight(x,y));
 return w;
}
const maskCache=new Map();
export function frontierMaskWeight(region,x,y){
 const b=frontier.regions[region].bounds;if(x<=b.west||x>=b.east||y<=b.south||y>=b.north)return 0;
 const path='godot-prototype/data/'+region+'/coverage.png';
 if(!maskCache.has(region))maskCache.set(region,fs.existsSync(path)?PNG.sync.read(fs.readFileSync(path)):null);
 const m=maskCache.get(region);if(!m)return frontierWeight(region,x,y);if(m.width===1)return m.data[0]/255;
 const px=(x-b.west)/(b.east-b.west)*(m.width-1),py=(b.north-y)/(b.north-b.south)*(m.height-1),i=Math.min(m.width-2,Math.floor(px)),j=Math.min(m.height-2,Math.floor(py)),u=px-i,v=py-j,at=(x,y)=>m.data[(y*m.width+x)*4]/255;
 return (at(i,j)*(1-u)+at(i+1,j)*u)*(1-v)+(at(i,j+1)*(1-u)+at(i+1,j+1)*u)*v;
}
