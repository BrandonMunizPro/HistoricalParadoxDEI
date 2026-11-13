// Compile the authored encyclopedia. No generated prose or live-state inputs.
import fs from 'node:fs';
import assert from 'node:assert/strict';
const root='godot-prototype',folder=root+'/data/faction-articles';
const read=p=>JSON.parse(fs.readFileSync(p));
const manifest=read(folder+'/manifest.json'),metadata=read(folder+'/metadata.json');
const scenario=read(root+'/data/world-border-review/scenario-278.json');
const records={},sources=structuredClone(metadata.sources),batches=[];
const missing=manifest.batches.filter(file=>!fs.existsSync(folder+'/'+file));
const words=s=>s.trim().split(/\s+/).filter(Boolean).length;
for(const file of manifest.batches){
  if(missing.includes(file))continue;
  const batch=read(folder+'/'+file);Object.assign(sources,batch.sources??{});
  for(const [id,entry]of Object.entries(batch.records)){
    assert(!records[id],'Duplicate article '+id);assert(metadata.records[id],'Unknown faction '+id);
    assert(typeof entry.text==='string'&&words(entry.text)>=35,'Missing substantive introduction '+id);
    assert(entry.homeland&&entry.politicalForm,'Missing article facts '+id);
    assert(entry.sections?.length>=5,'Missing article structure '+id);
    for(const section of ['origins','homeland','internal','external','opening'])assert(entry.sections.some(s=>s.id===section),'Missing '+section+' '+id);
    assert(new Set(entry.sections.map(s=>s.id)).size===entry.sections.length,'Duplicate section '+id);
    for(const s of entry.sections)assert(s.title&&words(s.text)>=30&&s.sourceKeys?.length,'Thin or unsourced section '+id+'/'+s.id);
    const wordCount=words(entry.text)+entry.sections.reduce((sum,s)=>sum+words(s.text),0);
    assert(wordCount>=240,'Article too short '+id+' '+wordCount);
    records[id]={...metadata.records[id],...entry,sourceKeys:[...new Set(entry.sections.flatMap(s=>s.sourceKeys))],wordCount,readingMinutes:Math.max(1,Math.ceil(wordCount/200)),articleVersion:2};
  }
  batches.push({file,factions:Object.keys(batch.records).length});
}
for(const [id,entry]of Object.entries(records))for(const key of entry.sourceKeys)assert(sources[key]?.url?.startsWith('https://'),'Missing source '+id+' '+key);
const progress={completed:Object.keys(records).length,total:scenario.factions.length,missing,batches};
if(process.argv.includes('--check-progress')){console.log(JSON.stringify(progress,null,2));process.exit(0);}
assert(!missing.length,'Unfinished cultural batches: '+missing.join(', '));
assert.deepEqual(Object.keys(records).sort(),scenario.factions.map(f=>f.id).sort(),'Article roster differs from active factions');
const output={version:2,opening:{yearBce:278,season:'spring',convention:'before-pyrrhus-sicilian-expedition'},notice:'Authored historical encyclopedia. Runtime state never rewrites this material.',sources,records};
fs.writeFileSync(root+'/data/faction-backgrounds.json',JSON.stringify(output,null,2)+'\n');
console.log('FACTION_ARTICLES_COMPILED',JSON.stringify({...progress,totalWords:Object.values(records).reduce((sum,r)=>sum+r.wordCount,0),minimumWords:Math.min(...Object.values(records).map(r=>r.wordCount))}));
