import fs from 'node:fs';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {PNG} from 'pngjs';
const root='godot-prototype/evidence/hispania-expansion';
const read=p=>JSON.parse(fs.readFileSync(p));
const before=read(root+'/before/views.json').views, after=read(root+'/final/views.json').views;
const results=[];
for(let start=0;start<after.length;start+=7){
 const group=after.slice(start,start+7),sheet=new PNG({width:1280,height:group.length*360});
 for(let row=0;row<group.length;row++){
  const view=group[row];assert.deepEqual(view.camera,before.find(v=>v.name===view.name).camera);
  const pair=['before','final'].map(stage=>PNG.sync.read(fs.readFileSync(`${root}/${stage}/${view.name}.png`)));
  for(let side=0;side<2;side++)for(let y=0;y<360;y++)for(let x=0;x<640;x++){
   const p=pair[side],i=(Math.floor(y*p.height/360)*p.width+Math.floor(x*p.width/640))*4,j=((row*360+y)*1280+side*640+x)*4;
   sheet.data.set(p.data.subarray(i,i+4),j);
  }
  if(view.name.includes('control')){
   let total=0,max=0,pixelsOverOne=0;
   for(let y=120;y<960;y++)for(let x=250;x<1650;x++){let changed=false;for(let c=0;c<3;c++){const i=(y*1920+x)*4+c,d=Math.abs(pair[0].data[i]-pair[1].data[i]);total+=d;max=Math.max(max,d);changed ||=d>1;}if(changed)pixelsOverOne++;}
   results.push({name:view.name,meanChannelDifference:total/(840*1400*3),maxChannelDifference:max,pixelsOverOne});
  }
 }
 fs.writeFileSync(`${root}/comparison-${1+start/7}.png`,PNG.sync.write(sheet));
}
fs.writeFileSync(root+'/controls.json',JSON.stringify(results,null,2));
const hash=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const ws2=Object.entries(read(root+'/ws2-before.json')).map(([file,sha256])=>({file,unchanged:hash('godot-prototype/'+file)===sha256}));
const protectedFiles=read('godot-prototype/evidence/protected-before.json');
assert(protectedFiles.every(x=>hash(x.path)===x.sha256));
const sites=read('godot-prototype/data/sites.json'),atlas=read('public/data/settlement-atlas.json').records;
const expected=[...atlas.filter(x=>['existing','expansion'].includes(x.selection)),...read('public/data/approved-settlements.json').records.map(x=>x.atlas)];
assert.equal(sites.length,35);
for(const e of expected){const s=sites.find(x=>x.id===e.id);assert(s);assert.equal(s.lon,e.coordinates.lon);assert.equal(s.lat,e.coordinates.lat);assert.equal(s.locationId,e.locationId);}
assert.equal(read('godot-prototype/data/research-locations.json').records.length,687);
assert.equal(hash('godot-prototype/data/research-locations.json'),hash('public/data/research-locations.json'));
fs.writeFileSync(root+'/integrity.json',JSON.stringify({protectedFiles:protectedFiles.length,canonicalCoordinatesExact:true,researchRecords:687,ws2},null,2));
fs.mkdirSync('docs/hispania-expansion',{recursive:true});
const rows=after.map(v=>`<section><h2>${v.name} — ${v.preset[2]} km</h2><div>${['before','final'].map(stage=>`<figure><a href="../../${root}/${stage}/${v.name}.png"><img loading="lazy" src="../../${root}/${stage}/${v.name}.png"></a><figcaption>${stage}</figcaption></figure>`).join('')}</div></section>`).join('\n');
fs.writeFileSync('docs/hispania-expansion/REVIEW.html',`<!doctype html><meta charset="utf-8"><title>Hispania campaign geography</title><style>body{background:#172123;color:#eadfc6;font:16px system-ui;margin:30px}h1,h2{font-weight:500}section{margin:36px 0}section div{display:flex;gap:12px}figure{margin:0;width:50%}img{width:100%}a{color:#d8bd79}</style><h1>Hispania campaign geography</h1><p>Actual matched-camera Godot captures within existing campaign bounds. Click for full resolution. <a href="REPORT.md">Implementation, sources and limitations</a>.</p>${rows}`);
console.log(JSON.stringify({matchedViews:after.length,controls:results,ws2},null,2));
