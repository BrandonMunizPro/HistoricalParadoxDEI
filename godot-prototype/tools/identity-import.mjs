import fs from 'node:fs';
const dir='godot-prototype/assets/settlement-identities';let count=0;
for(const file of fs.readdirSync(dir))if(file.endsWith('.jpg.import')){
 const p=dir+'/'+file;let s=fs.readFileSync(p,'utf8');
 s=s.replace(/compress\/mode=\d+/,'compress/mode=2').replace('compress/high_quality=false','compress/high_quality=true').replace('mipmaps/generate=false','mipmaps/generate=true');
 if(file.includes('-normal.'))s=s.replace(/compress\/normal_map=\d+/,'compress/normal_map=1');
 fs.writeFileSync(p,s);count++;
}console.log({configured3DMaps:count});
