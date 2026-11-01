import fs from 'node:fs';
import cp from 'node:child_process';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
const root='godot-prototype', dir=root+'/assets/landscape-quality';
fs.mkdirSync(dir,{recursive:true});
function download(url,file){cp.execFileSync('curl.exe',['-L','--fail','--retry-all-errors','--retry','3','--silent','--show-error',url,'-o',file]);}
const manifest=[];
for(const [asset,stem] of [['rocky_terrain_02','rock'],['sparse_grass','grass']]){
const metadata=root+'/evidence/terrain-water-20261028/references/'+stem+'.json';
if(stem==="grass")download('https://api.polyhaven.com/files/'+asset,metadata);
const data=JSON.parse(fs.readFileSync(metadata));
for(const [channel,suffix] of [['Diffuse','color'],['nor_gl','normal'],['Rough','roughness']]){
 const source=data[channel]['2k'].jpg,file=dir+'/'+stem+'-'+suffix+'.jpg';
 if(!fs.existsSync(file))download(source.url,file);
 const bytes=fs.readFileSync(file);assert.equal(crypto.createHash('md5').update(bytes).digest('hex'),source.md5);
 manifest.push({file:file.replace(root+'/',''),asset:'https://polyhaven.com/a/'+asset,url:source.url,license:'CC0-1.0',licenseUrl:'https://polyhaven.com/license',resolution:'2k',bytes:bytes.length,sha256:crypto.createHash('sha256').update(bytes).digest('hex')});
}
}
fs.writeFileSync(dir+'/sources.json',JSON.stringify(manifest,null,2)+'\n');
console.log({downloadBytes:manifest.reduce((s,m)=>s+m.bytes,0),files:manifest.length});
