import { readFileSync } from 'node:fs';
import { describe, it, expect } from 'vitest';
import { validateFactionScenario, validateFactionPresentation, factionCanonicalId, factionReadModel } from '../src/presentation/faction-cartography.js';
import type { FactionScenario } from '../src/presentation/faction-cartography.js';
const read = (): unknown => JSON.parse(readFileSync('godot-prototype/data/factions/scenario-278.json', 'utf8'));
function scenario(): FactionScenario { const data = read();validateFactionScenario(data);return data; }
describe('278 BCE faction cartography', () => {
  it('validates the full roster, culture references, evidence and polygon rings', () => {
    const data=scenario();expect(data.factions.length).toBeGreaterThan(100);expect(data.territories.length).toBeGreaterThan(100);
    for (const id of ['rome','carthage','massylii','masaesyli','ptolemaic-egypt','seleucids','arverni','epirus']) expect(data.factions.some(f=>f.id===id)).toBe(true);
  });
  it('keeps later Galatian settlement and independent Bactria/Parthia out of initial ownership', () => {
    const data=scenario();for (const id of ['tectosages','trocmi','tolistobogii']) expect(data.territories.some(t=>t.initialController===id)).toBe(false);
    expect(data.factions.some(f=>f.id==='bactria'||f.id==='parthia')).toBe(false);
  });
  it('rejects duplicate identity, unknown controller/culture/source, invalid colors and bad geometry', () => {
    for (const mutate of [
      (d: FactionScenario)=>{(d.factions as unknown[]).push(d.factions[0]);},
      (d: FactionScenario)=>{Object.assign(d.territories[0]!,{initialController:'unknown'});},
      (d: FactionScenario)=>{Object.assign(d.factions[0]!,{culture:'unknown'});},
      (d: FactionScenario)=>{Object.assign(d.factions[0]!,{sources:['unknown']});},
      (d: FactionScenario)=>{Object.assign(d.factions[0]!,{color:'red'});},
      (d: FactionScenario)=>{Object.assign(d.territories[0]!,{geometry:{type:'Point',coordinates:[12,42]}});},
    ]) { const data=scenario();mutate(data);expect(()=>validateFactionScenario(data)).toThrow(RangeError); }
  });
  it('derives canonical identity from stable authored keys rather than display name or color', () => {
    const data=scenario();const original=factionReadModel(data)[0]!;Object.assign(data.factions[0]!,{name:'Localized name',color:'#123456'});
    expect(factionReadModel(data)[0]!.id).toBe(original.id);expect(factionCanonicalId('rome')).not.toBe(factionCanonicalId('carthage'));
  });
});

describe('faction presentation and emblem evidence', () => {
  const readPresentation=(): unknown=>JSON.parse(readFileSync('godot-prototype/data/factions/presentation.json','utf8'));
  it('covers the entire roster with supported motifs and valid evidence relationships', () => {
    validateFactionPresentation(readPresentation(),scenario());
  });
  it('separates documented motifs, later regional adaptations and original devices', () => {
    const p=readPresentation();validateFactionPresentation(p,scenario());
    expect(p.factions['seleucids']!.emblem.motif).toBe('anchor');
    expect(p.factions['ptolemaic-egypt']!.emblem.motif).toBe('eagle');
    expect(p.factions['athens']!.emblem.basis).toBe('attested_motif');
    expect(p.factions['rome']!.emblem.basis).toBe('later_regional_motif');
    expect(p.factions['massylii']!.emblem.basis).toBe('later_regional_motif');
  });
  it('rejects unsupported art, missing evidence, incomplete rosters and non-presentation edits', () => {
    for(const change of [
      (p: Record<string, unknown>)=>{delete (p['factions'] as Record<string, unknown>)['rome'];},
      (p: Record<string, unknown>)=>{Object.assign((p['factions'] as Record<string, unknown>)['rome'] as object,{geometry:{}});},
      (p: Record<string, unknown>)=>{Object.assign(((p['factions'] as Record<string, unknown>)['seleucids'] as Record<string,unknown>)['emblem'] as object,{sourceKeys:[]});},
      (p: Record<string, unknown>)=>{Object.assign(((p['factions'] as Record<string, unknown>)['seleucids'] as Record<string,unknown>)['emblem'] as object,{motif:'unsupported'});},
    ]) { const p=readPresentation() as Record<string,unknown>;change(p);expect(()=>validateFactionPresentation(p,scenario())).toThrow(RangeError); }
  });
  it('changes the map palette without altering canonical identity, labels or territory data', () => {
    const s=scenario(),saved=JSON.stringify(s),p=readPresentation();validateFactionPresentation(p,s);
    const old=factionReadModel(s),updated=factionReadModel(s,p);
    expect(updated.map(f=>f.id)).toEqual(old.map(f=>f.id));expect(updated.map(f=>f.name)).toEqual(old.map(f=>f.name));
    expect(updated[0]!.color).toBe(p.factions[s.factions[0]!.id]!.color);expect(JSON.stringify(s)).toBe(saved);
  });
});
