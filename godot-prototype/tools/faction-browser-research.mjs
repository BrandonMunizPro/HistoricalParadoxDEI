import fs from 'node:fs';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
const config=JSON.parse(fs.readFileSync('godot-prototype/data/faction-browser-groups.json'));
const scenario=JSON.parse(fs.readFileSync('godot-prototype/data/factions/scenario-278.json'));
const records={};
for(const [id,file] of Object.entries(config.researchSheets)){
 assert(scenario.factions.some(f=>f.id===id));
 const bytes=fs.readFileSync(file),text=bytes.toString('utf8');
 const header=text.split(/^## A\./m)[1]?.split(/^## B\./m)[0];
 assert(header,'Missing research header: '+file);
 const parts=header.split(/\r?\n(?=- \*\*)/).filter(p=>/^\s*- \*\*(Polity|Date of record|Scope at the date|Evidence base)/i.test(p));
 assert(parts.length>=2,'No researched overview: '+file);
 const overview=parts.map(p=>p.replace(/^\s*- /,'').replace(/\r?\n\s*/g,' ').replace(/\*\*/g,'').replace(/\*/g,'').trim()).join('\n\n');
 const sourceStatus=text.match(/\*\*Status:\s*([^*]+)\*\*/)?.[1]??'See original research sheet';
 records[id]={sourceFile:file,sha256:crypto.createHash('sha256').update(bytes).digest('hex'),sourceStatus,overview,notice:'Excerpt from existing R-16 research; historical evidence, not simulation state. Original chronology and uncertainty caveats remain in the source sheet.'};
}
fs.writeFileSync('godot-prototype/data/faction-browser-research.json',JSON.stringify({version:1,records},null,2)+'\n');
console.log('FACTION_BROWSER_RESEARCH_OK',Object.keys(records).length);
