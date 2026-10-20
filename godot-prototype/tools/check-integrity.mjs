import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
const project=path.resolve(fileURLToPath(new URL('..',import.meta.url))),repo=path.resolve(project,'..');
const json=p=>JSON.parse(fs.readFileSync(p));
const before=json(path.join(project,'evidence/protected-before.json'));
const changed=before.filter(x=>crypto.createHash('sha256').update(fs.readFileSync(path.join(repo,x.path))).digest('hex')!==x.sha256);
assert.deepEqual(changed,[],'Protected source files must remain byte-identical');
const sourceAtlas=json(path.join(repo,'public/data/settlement-atlas.json')).records;
const sourceApproved=json(path.join(repo,'public/data/approved-settlements.json')).records.map(x=>x.atlas);
const expected=[...sourceAtlas.filter(x=>['existing','expansion'].includes(x.selection)),...sourceApproved];
const sites=json(path.join(project,'data/sites.json'));assert.equal(sites.length,35);
for(const e of expected){const s=sites.find(x=>x.id===e.id);assert.ok(s);assert.equal(s.locationId,e.locationId);assert.equal(s.lon,e.coordinates.lon);assert.equal(s.lat,e.coordinates.lat);}
const research=json(path.join(project,'data/research-locations.json'));assert.equal(research.records.length,687);
assert.equal(fs.readFileSync(path.join(project,'data/research-locations.json'),'utf8'),fs.readFileSync(path.join(repo,'public/data/research-locations.json'),'utf8'));
const result={protectedFiles:before.length,changed:[],approvedSites:35,researchRecords:687,canonicalCoordinatesExact:true,researchCopyByteIdentical:true};
fs.writeFileSync(path.join(project,'evidence/final-integrity.json'),JSON.stringify(result,null,2));console.log(result);
