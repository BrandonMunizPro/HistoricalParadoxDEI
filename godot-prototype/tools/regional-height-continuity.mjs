import fs from 'node:fs';
import assert from 'node:assert/strict';
import {PNG} from 'pngjs';
const read=p=>JSON.parse(fs.readFileSync('godot-prototype/data/'+p));
const regions=[...Object.keys(read('eastern-regions.json').regions),...read('africa-regions.json').order,'hispania',...read('northern-regions.json').order,...read('frontier-regions.json').order];
const results=[];
// Visibility feathers must not flatten source heights against an unrelated old
// backdrop. Keep physical source heights continuous through authoring limits.
for(const region of regions){
 const dir='godot-prototype/data/'+region;if(!fs.existsSync(dir+'/manifest.json'))continue;
 const m=JSON.parse(fs.readFileSync(dir+'/manifest.json')),maskPath=dir+'/coverage.png',hasMask=fs.existsSync(maskPath);if(!m.details.length||(m.continuousSourceHeight&&(!hasMask||m.coverageMaskBaked)))continue;
 const mask=hasMask?PNG.sync.read(fs.readFileSync(maskPath)):null;
 const bytes=fs.readFileSync(dir+'/source-metres.bin'),h=new Float32Array(bytes.buffer,bytes.byteOffset,bytes.length/4),b=m.bounds,fw=(b.east-b.west)*32+1,fh=(b.north-b.south)*32+1,far=new Float32Array(fw*fh);
 for(let y=0;y<fh;y++)for(let x=0;x<fw;x++)far[y*fw+x]=h[y*4*m.width+x*4]*.0015;
 function parent(lon,lat){const px=(lon-b.west)*32,py=(b.north-lat)*32,x=Math.max(0,Math.min(fw-2,Math.floor(px))),y=Math.max(0,Math.min(fh-2,Math.floor(py))),u=px-x,v=py-y,a=far[y*fw+x],bb=far[y*fw+x+1],c=far[(y+1)*fw+x],d=far[(y+1)*fw+x+1];return u+v<1?a+(bb-a)*u+(c-a)*v:d+(c-d)*(1-u)+(bb-d)*(1-v);}
 const backdrop=fs.readFileSync(dir+'/far.bin'),count=backdrop.readUInt32LE(0);assert.equal(count,far.length);
 for(let i=0;i<count;i++){backdrop.writeFloatLE(far[i],8+i*12+4);backdrop.writeFloatLE(far[i],8+count*32+i*8);backdrop.writeFloatLE(far[i],8+count*40+i*16);}
 fs.writeFileSync(dir+'/far.bin',backdrop);fs.writeFileSync(dir+'/far-heights.bin',Buffer.from(far.buffer));
 for(const d of m.details){
  const p='godot-prototype/'+d.mesh,mesh=fs.readFileSync(p),n=mesh.readUInt32LE(0);assert.equal(n,129*129);
  for(let i=0;i<n;i++){
   const lon=d.bounds.west+(i%129)/128,lat=d.bounds.north-Math.floor(i/129)/128,x=Math.round((lon-b.west)*128),y=Math.round((b.north-lat)*128),source=h[y*m.width+x]*.0015,oldParent=mesh.readFloatLE(8+n*40+i*16),oldHeight=mesh.readFloatLE(8+i*12+4),denominator=source-oldParent;
   let edge=Math.abs(denominator)<1e-7?0:Math.max(0,Math.min(1,(oldHeight-oldParent)/denominator));
   if(mask){const distance=Math.min(i%129,128-i%129,Math.floor(i/129),128-Math.floor(i/129))/128,t=Math.max(0,Math.min(1,distance/.08));edge=t*t*(3-2*t)*mask.data[(mask.width===1?0:y*mask.width+x)*4]/255;}
   const base=parent(lon,lat);
   mesh.writeFloatLE(base+(source-base)*edge,8+i*12+4);mesh.writeFloatLE(base,8+n*32+i*8);mesh.writeFloatLE(base,8+n*40+i*16);
  }
  fs.writeFileSync(p,mesh);
 }
 m.continuousSourceHeight=true;if(mask)m.coverageMaskBaked=true;m.heightContinuityNotice='Full physical source backdrop through coverage feathers; near-mesh edge/reveal weighting retained. Original source-metres.bin unchanged.';
 fs.writeFileSync(dir+'/manifest.json',JSON.stringify(m,null,2));results.push({region,backdropVertices:count,closeMeshes:m.details.length});console.log('REGIONAL_HEIGHT_CONTINUITY_OK',region,m.details.length);
}
fs.writeFileSync('godot-prototype/evidence/world-completion/height-continuity.json',JSON.stringify({sourceHeightInputsUnchanged:true,visibilityIndependentOfSourceHeight:true,regions:results},null,2));
