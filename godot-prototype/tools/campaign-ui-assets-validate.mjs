import fs from 'node:fs';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {PNG} from 'pngjs';

const root='godot-prototype/ui/assets/';
const files=['marble-command-frame.png','burgundy-damask.png','antique-icons.png','pyrrhus-cutout.png','source/pyrrhus-marie-lan-nguyen.jpg','source/suovetaurilia-marie-lan-nguyen.jpg'];
const records=files.map(file=>{
 const bytes=fs.readFileSync(root+file);
 const result={file,bytes:bytes.length,sha256:crypto.createHash('sha256').update(bytes).digest('hex')};
 if(file.endsWith('.png')){
  const image=PNG.sync.read(bytes);result.width=image.width;result.height=image.height;
  assert(image.width>=1000&&image.height>=500,'Insufficient source resolution: '+file);
  let clear=0,solid=0;
  for(let i=3;i<image.data.length;i+=4){if(image.data[i]===0)clear++;if(image.data[i]>220)solid++;}
  result.transparentFraction=clear/(image.width*image.height);
  if(file==='pyrrhus-cutout.png'||file==='antique-icons.png'){
   assert(result.transparentFraction>.1,'Background not extracted: '+file);
   assert(solid>image.width*image.height*.2,'Subject pixels missing: '+file);
  }
 }
 return result;
});
// Compare the unmodified download with the checksum published by Wikimedia.
assert.equal(crypto.createHash('sha1').update(fs.readFileSync(root+'source/pyrrhus-marie-lan-nguyen.jpg')).digest('hex'),'eea0afe9c6622e2bb5e5d71b5f59d0464a643bac');
const credits=fs.readFileSync(root+'ATTRIBUTION.md','utf8');
for(const text of ['Marie-Lan Nguyen','CC BY 2.5','https://creativecommons.org/licenses/by/2.5/','Changes:'])assert(credits.includes(text));
assert(fs.existsSync(root+'GENERATION-PROMPTS.md'));
fs.writeFileSync(root+'asset-manifest.json',JSON.stringify({passed:true,originalBustChecksumVerified:true,files:records,credits:'ATTRIBUTION.md',prompts:'GENERATION-PROMPTS.md'},null,2)+'\n');
console.log('CAMPAIGN_UI_ASSETS_OK',JSON.stringify({files:records.length,originalBustChecksumVerified:true,cutoutsHaveRealAlpha:true}));
