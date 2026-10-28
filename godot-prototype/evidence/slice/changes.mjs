import fs from 'node:fs';
const read=p=>JSON.parse(fs.readFileSync(new URL(p,import.meta.url)));
const before=read('before-source.json'),after=read('final2-source.json');
const old=new Map(before.files.map(f=>[f.path,f.sha256]));
const changed=after.files.filter(f=>old.get(f.path)!==f.sha256).map(f=>({...f,status:old.has(f.path)?'modified':'added'}));
fs.writeFileSync(new URL('implementation-changes.json',import.meta.url),JSON.stringify({beforeRevision:before.sourceRevision,afterRevision:after.sourceRevision,files:changed},null,2));
console.log(changed.map(f=>f.status+' '+f.path).join('\n'));
