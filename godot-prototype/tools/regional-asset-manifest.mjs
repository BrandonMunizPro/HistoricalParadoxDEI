import fs from 'node:fs';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
const root='godot-prototype/assets/regional-vegetation';
const entries=JSON.parse(fs.readFileSync(root+'/impostors.json'));
assert.equal(entries.length,16);
assert.equal(new Set(entries.map(e=>e.index)).size,16);
const files=fs.readdirSync(root).filter(name=>!name.startsWith('.')&&name!=='manifest.json').map(file=>{const bytes=fs.readFileSync(root+'/'+file);return {file,bytes:bytes.length,sha256:crypto.createHash('sha256').update(bytes).digest('hex')};});
for(const name of ['olive.glb','scots-pine.glb'])assert.equal(fs.readFileSync(root+'/'+name).toString('ascii',0,4),'glTF');
for(const entry of entries){assert(entry.widthKm>0&&entry.center.length===3);assert(fs.existsSync(root+'/'+entry.name+'-atlas.res'));assert(fs.existsSync(root+'/'+entry.name+'-atlas.png'));}
fs.writeFileSync(root+'/manifest.json',JSON.stringify({format:1,baker:'godot-prototype/tools/regional-vegetation-bake.gd',atlas:{azimuths:8,elevations:[15,50,85],framePixels:384},entries:entries.length,files},null,2)+'\n');
console.log('REGIONAL_ASSET_MANIFEST_OK entries='+entries.length+' files='+files.length);
