import fs from 'node:fs';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
const root='godot-prototype/assets/settlement-identities';
fs.mkdirSync(root,{recursive:true});
const manifest=[];let bytes=0;
for(const [id,stem,resolution] of [['white_plaster_02','lime','2k'],['brown_mud','soil','1k']]){
 const info=await(await globalThis.fetch('https://api.polyhaven.com/info/'+id)).json();
 const files=await(await globalThis.fetch('https://api.polyhaven.com/files/'+id)).json();
 for(const [channel,suffix] of [['Diffuse','color'],['nor_gl','normal'],['Rough','roughness']]){
  const selected=files[channel][resolution].jpg;bytes+=selected.size;assert.ok(bytes<25_000_000,'Download budget exceeded');
  const file=stem+'-'+suffix+'.jpg',buffer=fs.existsSync(root+'/'+file)?fs.readFileSync(root+'/'+file):Buffer.from(await(await globalThis.fetch(selected.url)).arrayBuffer());
  assert.equal(crypto.createHash('md5').update(buffer).digest('hex'),selected.md5);fs.writeFileSync(root+'/'+file,buffer);
  manifest.push({file,asset:'https://polyhaven.com/a/'+id,url:selected.url,authors:info.authors,license:'CC0-1.0',licenseSource:'https://polyhaven.com/license',resolution,bytes:buffer.length,sha256:crypto.createHash('sha256').update(buffer).digest('hex')});
 }
}
fs.writeFileSync(root+'/texture-manifest.json',JSON.stringify(manifest,null,2)+'\n');console.log({files:manifest.length,bytes});
