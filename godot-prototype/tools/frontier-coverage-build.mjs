import fs from 'node:fs';
import {PNG} from 'pngjs';
import {frontier,frontierWeight} from './regional-scopes.mjs';
for(const region of frontier.order){
 const b=frontier.regions[region].bounds,width=(b.east-b.west)*128+1,height=(b.north-b.south)*128+1,image=new PNG({width,height});
 for(let y=0;y<height;y++)for(let x=0;x<width;x++){const v=Math.round(frontierWeight(region,b.west+x/128,b.north-y/128)*255);image.data.set([v,v,v,255],(y*width+x)*4);}
 fs.writeFileSync('godot-prototype/data/'+region+'/coverage.png',PNG.sync.write(image,{colorType:0}));console.log('FRONTIER_COVERAGE_OK',region,width,height);
 globalThis.gc?.();
}
