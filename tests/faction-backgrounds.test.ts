import {readFileSync} from 'node:fs';
import {describe,it,expect} from 'vitest';
const read=(p:string)=>JSON.parse(readFileSync('godot-prototype/'+p,'utf8'));
const catalog=read('data/faction-backgrounds.json') as {
  opening:{yearBce:number;season:string;convention:string};
  records:Record<string,{text:string;homeland:string;politicalForm:string;articleVersion:number;wordCount:number;readingMinutes:number;sections:{id:string;title:string;text:string;sourceKeys:string[]}[];sourceKeys:string[];evidenceScope:string;scopeNote?:string;researchFile?:string}>;
  sources:Record<string,{url:string}>;
};
const scenario=read('data/world-border-review/scenario-278.json') as {factions:{id:string}[]};
describe('faction opening backgrounds',()=>{
  it('covers exactly the active roster with sourced reading material',()=>{
    expect(Object.keys(catalog.records).sort()).toEqual(scenario.factions.map(f=>f.id).sort());
    for(const record of Object.values(catalog.records)){
      expect(record.text.trim().length).toBeGreaterThan(35);
      expect(record.articleVersion).toBe(2);
      expect(record.homeland.length).toBeGreaterThan(10);
      expect(record.politicalForm.length).toBeGreaterThan(10);
      expect(record.sections.map(s=>s.id).sort()).toEqual(['external','homeland','internal','opening','origins']);
      const count=[record.text,...record.sections.map(s=>s.text)].join(' ').trim().split(/\s+/).length;
      expect(count).toBe(record.wordCount);
      expect(count).toBeGreaterThanOrEqual(240);
      expect(record.readingMinutes).toBe(Math.ceil(count/200));
      for(const section of record.sections){
        expect(section.title.length).toBeGreaterThan(3);
        expect(section.text.trim().split(/\s+/).length).toBeGreaterThanOrEqual(30);
        expect(section.sourceKeys.length).toBeGreaterThan(0);
        for(const key of section.sourceKeys)expect(record.sourceKeys).toContain(key);
      }
      expect(record.sourceKeys.length).toBeGreaterThan(0);
      for(const key of record.sourceKeys)expect(catalog.sources[key]?.url).toMatch(/^https:\/\//);
    }
  });
  it('keeps the approved opening and later tribal evidence distinct',()=>{
    expect(catalog.opening).toEqual({yearBce:278,season:'spring',convention:'before-pyrrhus-sicilian-expedition'});
    for(const id of ['catuvellauni','caledonian-polities','chatti','carnutes']){
      expect(catalog.records[id]?.evidenceScope).toBe('later-regional-association');
      expect(catalog.records[id]?.scopeNote).toContain('later sources');
    }
    expect(catalog.records['hibernian-polities']?.evidenceScope).toBe('archaeological-context');
    expect(catalog.records['epirus']?.sections.find(s=>s.id==='opening')?.text).toContain('before Pyrrhus assumes command in Sicily');
  });
  it('preserves links to the nine original research sheets',()=>{
    const excerpts=read('data/faction-browser-research.json') as {records:Record<string,{sourceFile:string}>};
    expect(Object.keys(excerpts.records)).toHaveLength(9);
    for(const [id,record]of Object.entries(excerpts.records))expect(catalog.records[id]?.researchFile).toBe(record.sourceFile);
  });
});
