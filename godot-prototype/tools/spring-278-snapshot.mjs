import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
const root='godot-prototype',out=root+'/data/spring-278/baseline';
if(fs.existsSync(out+'/manifest.json'))throw Error('Baseline already captured; refusing to replace it');
const files=['data/world-border-review/scenario-278.json','data/world-border-review/definitions.json','data/geographic-regions/initial-owners.json','data/world-border-review/label-placements.json','data/faction-browser-groups.json','data/factions/presentation.json','assets/factions/emblems.res','assets/factions/emblems.png',...['territory-ids','local-ids','balkans-ids','sicily-ids'].map(n=>'data/world-border-review/'+n+'.png'),'data/anatolia/territory-ids.png'];
const sha=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
fs.mkdirSync(out,{recursive:true});fs.writeFileSync(root+'/data/spring-278/.gdignore','');
const snapshots={};for(const p of files){const target=out+'/'+p;fs.mkdirSync(path.dirname(target),{recursive:true});fs.copyFileSync(root+'/'+p,target);snapshots[p]=sha(root+'/'+p);}
const protectedFiles={};
function scan(dir){for(const e of fs.readdirSync(dir,{withFileTypes:true})){const p=dir+'/'+e.name;if(e.isDirectory()){if(p!==root+'/data/spring-278')scan(p);}else if(!files.some(f=>p===root+'/'+f))protectedFiles[p]=sha(p);}}
scan(root+'/data');scan('public/data');scan('docs/research');
for(const p of ['world.gd','regional_scenery.gd','environment_rules.gd','vegetation_quality.gd','coast_catalog.gd','world_coast.gd'])protectedFiles[root+'/'+p]=sha(root+'/'+p);
fs.writeFileSync(out+'/manifest.json',JSON.stringify({snapshots,protectedFiles},null,2));
console.log('SPRING_BASELINE_CAPTURED',Object.keys(protectedFiles).length,'protected files');
