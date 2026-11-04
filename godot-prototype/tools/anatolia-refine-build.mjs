// Refine presentation derivatives only; approved geometry/research are read-only.
import fs from 'node:fs';
import {PNG} from 'pngjs';
const out='godot-prototype/data/anatolia',m=JSON.parse(fs.readFileSync(out+'/manifest.json'));
const bytes=fs.readFileSync(out+'/source-metres.bin'),h=new Float32Array(bytes.buffer,bytes.byteOffset,bytes.length/4),w=m.width,hh=m.height,p=new PNG({width:w,height:hh});
let min=1,max=0;
for(let y=0;y<hh;y++)for(let x=0;x<w;x++){
 const here=h[y*w+x],kmx=111.195*Math.cos((43-y/128)*Math.PI/180)/128,kmy=111.195/128;
 let occlusion=0;
 for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[-1,1],[1,-1],[-1,-1]]){
  let horizon=0;for(const step of [1,2,4,8]){const xx=Math.max(0,Math.min(w-1,x+dx*step)),yy=Math.max(0,Math.min(hh-1,y+dy*step)),distance=Math.hypot(dx*kmx*step,dy*kmy*step);horizon=Math.max(horizon,Math.atan2((h[yy*w+xx]-here)*.001,distance));}
  occlusion+=Math.min(.8,horizon)/8;
 }
 const sky=Math.max(.68,1-occlusion*.85);min=Math.min(min,sky);max=Math.max(max,sky);const v=Math.round(sky*255);p.data.set([v,v,v,255],(y*w+x)*4);
}
fs.writeFileSync(out+'/relief-visibility.png',PNG.sync.write(p,{colorType:0}));
// Supply the exact shared backdrop height as the near mesh's morph parent.
const fb=fs.readFileSync(out+'/far-heights.bin'),far=new Float32Array(fb.buffer,fb.byteOffset,fb.length/4);
function parent(lon,lat){const xx=(lon-25)*32,yy=(43-lat)*32,x=Math.min(575,Math.max(0,Math.floor(xx))),y=Math.min(255,Math.max(0,Math.floor(yy))),u=xx-x,v=yy-y,a=far[y*577+x],b=far[y*577+x+1],c=far[(y+1)*577+x],d=far[(y+1)*577+x+1];return u+v<1?a+(b-a)*u+(c-a)*v:d+(c-d)*(1-u)+(b-d)*(1-v);}
for(const tile of m.details){const file='godot-prototype/'+tile.mesh,b=fs.readFileSync(file),count=b.readUInt32LE();for(let y=0;y<129;y++)for(let x=0;x<129;x++)b.writeFloatLE(parent(tile.bounds.west+x/128,tile.bounds.north-y/128),8+count*40+(y*129+x)*16);fs.writeFileSync(file,b);}
const build=fs.readFileSync('godot-prototype/tools/region-foundation-build.mjs','utf8'),fn=build.slice(build.indexOf('function rasterize('),build.indexOf('rasterize(2048')),data=JSON.parse(fs.readFileSync('godot-prototype/data/northern-italy-reference/scenario-278.json'));
new Function('fs','PNG','data','out',fn+"rasterize(9216,4096,25,43,18,8,'territory-ids.png');")(fs,PNG,data,out);
fs.writeFileSync(out+'/refinement.json',JSON.stringify({politicalSamplesPerDegree:512,sourceHeightWidth:w,sourceHeightHeight:hh,skyVisibilityRange:[min,max],notice:'Eight-direction source-DEM horizon visibility, not generated erosion or extra elevation. Political geometry and ownership unchanged.'},null,2));
console.log('ANATOLIA_REFINE_BUILD_OK',min,max);
