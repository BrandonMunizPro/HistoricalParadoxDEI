import fs from 'node:fs';
import {PNG} from 'pngjs';
import {frontier} from './regional-scopes.mjs';
// Match coast-mask density to the 128-interval terrain sampling for large new
// sections. Preserve the 512-interval masks of earlier reviewed regions.
for(const region of frontier.order){
 const dir='godot-prototype/data/'+region;
 if(!fs.existsSync(dir+'/manifest.json'))continue;
 const manifest=JSON.parse(fs.readFileSync(dir+'/manifest.json')),b=manifest.bounds;
 for(const name of ['land','ocean']){
  const p=dir+'/'+name+'.png',source=PNG.sync.read(fs.readFileSync(p)),width=(b.east-b.west)*128+1,height=(b.north-b.south)*128+1;
  if(source.width===1||source.width===width)continue;
  const image=new PNG({width,height});
  for(let y=0;y<height;y++)for(let x=0;x<width;x++){const sx=Math.round(x/(width-1)*(source.width-1)),sy=Math.round(y/(height-1)*(source.height-1)),v=source.data[(sy*source.width+sx)*4];image.data.set([v,v,v,255],(y*width+x)*4);}
  fs.writeFileSync(p,PNG.sync.write(image,{colorType:0}));
  console.log('FRONTIER_MASK_BUDGET_OK',region,name,source.width,source.height,'to',width,height);
 }
 manifest.coast.maskIntervalsPerDegree=128;fs.writeFileSync(dir+'/manifest.json',JSON.stringify(manifest,null,2));
 globalThis.gc?.();
}
