import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import crypto from 'node:crypto';
import {
  validateCatalog, validateSettlement, eligibility, resolveVisual, nextLevel, previewEffectReferences,
} from '../src/presentation/settlement-development-system.js';
import type { DevelopmentCatalog, SettlementDevelopment, BuildingLevel } from '../src/presentation/settlement-development-system.js';
const read = (p: string): unknown => JSON.parse(fs.readFileSync(p, 'utf8')) as unknown;
const catalog = read('godot-prototype/data/settlement-development-catalog.json') as DevelopmentCatalog;
const starts = read('godot-prototype/data/settlement-development-starts.json') as {settlements: SettlementDevelopment[]};
const roma = starts.settlements[0]!;
const sites = read('godot-prototype/data/sites.json') as {id: string; key: string; lon: number; lat: number}[];
const ids = new Set(sites.map(x => x.id));
const exists = (p: string): boolean => fs.existsSync(p.replace('res://', 'godot-prototype/'));
const copy = (): SettlementDevelopment => structuredClone(roma);
describe('settlement development prototype contract', () => {
  it('validates the catalog and all explicit starts', () => {
    validateCatalog(catalog);
    for (const s of starts.settlements) validateSettlement(catalog, s, ids);
    expect(catalog.chains).toHaveLength(20);
    expect(catalog.cultures).toHaveLength(9);
  });
  it('starts Roma with Forum III, grain II and four empty configurable slots', () => {
    expect(roma.settlementId).toBe(sites.find(s => s.key === 'roma')!.id);
    expect(roma.slots.map(s => s.building?.startingLevel ?? null)).toEqual([3,2,null,null,null,null]);
    expect(roma.slots.every(s => !s.allowedCategories.length)).toBe(true);
  });
  it.each([3,5,7])('rejects a major city with %i slots', count => {
    const s = copy(); s.slots = Array.from({length:count}, (_, i) => ({...s.slots[0]!, id:String(i)}));
    expect(() => validateSettlement(catalog,s,ids)).toThrow('capacity');
  });
  it('supports a four-slot minor with one developed building, without assigning categories', () => {
    const s=copy();s.class='minor';s.slots=s.slots.slice(1,5);
    validateSettlement(catalog,s,ids);
    s.slots.push({...s.slots[0]!,id:'extra'});
    expect(() => validateSettlement(catalog,s,ids)).toThrow('capacity');
  });
  it('separates progression maximum from initial development and rejects skipped definitions', () => {
    expect([nextLevel(1),nextLevel(2),nextLevel(3)]).toEqual([2,3,null]);
    const c=structuredClone(catalog);c.chains[0]!.levels[1].level=3;
    expect(() => validateCatalog(c)).toThrow('progression');
    const s=copy();s.slots[0]!.building!.startingLevel=4 as BuildingLevel;
    expect(() => validateSettlement(catalog,s,ids)).toThrow('level');
  });
  it('requires distinct level visual keys and valid effect references', () => {
    const c=structuredClone(catalog);c.chains[0]!.levels[1].visualKey=c.chains[0]!.levels[0].visualKey;
    expect(() => validateCatalog(c)).toThrow('visual keys');
    c.chains[0]!.levels[1].effects=['nonexistent'];
    expect(() => validateCatalog(c)).toThrow('progression');
  });
  it('resolves all six Roma visuals to real distinct near/far resources', () => {
    const paths=[];
    for(const id of ['civic-forum','grain-storage']) for(const level of [1,2,3] as const) {
      const r=resolveVisual(catalog,roma,id,level,exists);expect(r.status).toBe('ready');
      if(r.status==='ready'){paths.push(r.asset.near);expect(r.asset.near).not.toBe(r.asset.far);}
    }
    expect(new Set(paths).size).toBe(6);
  });
  it('reports missing art without substituting another culture or changing occupied slots', () => {
    const s=copy();s.architectureCulture='punic';s.regionalStyle='carthage';const snapshot=JSON.stringify(s);
    expect(resolveVisual(catalog,s,'grain-storage',2,exists).status).toBe('missing');
    expect(resolveVisual(catalog,roma,'civic-forum',3,()=>false).status).toBe('missing');
    expect(JSON.stringify(s)).toBe(snapshot);
  });
  it('uses a default regional asset only within the same architectural culture', () => {
    const c=structuredClone(catalog);c.visuals[0]!.regionalStyle='default';const s=copy();s.regionalStyle='other-latium';
    expect(resolveVisual(c,s,'civic-forum',1,exists).status).toBe('ready');
    c.visuals[0]!.culture='punic';expect(resolveVisual(c,s,'civic-forum',1,exists).status).toBe('missing');
  });
  it('restricts the Forum landmark to Roma and its qualified starting level', () => {
    const s=copy();s.settlementId=sites[1]!.id;
    expect(() => validateSettlement(catalog,s,ids)).toThrow('landmark');
    s.settlementId=roma.settlementId;s.slots[0]!.building!.startingLevel=2;
    expect(() => validateSettlement(catalog,s,ids)).toThrow('landmark');
    expect(catalog.landmarks[0]!.modifiers).not.toEqual(catalog.chains[0]!.levels[2].effects);
    expect(previewEffectReferences(catalog,roma,roma.slots[0]!.id,3)).toEqual({buildingEffects:['civic.potential'],landmarkModifiers:['forum.historical-significance']});
    expect(previewEffectReferences(catalog,roma,roma.slots[0]!.id,2).landmarkModifiers).toEqual([]);
    expect(previewEffectReferences(catalog,s,s.slots[0]!.id,2).buildingEffects).toEqual(['civic.potential']);
  });
  it.each(['iron','gold','copper','tin'] as const)('requires an evidenced %s deposit and rocky terrain', mineral => {
    const s=copy();expect(eligibility(catalog,s,mineral+'-extraction')).toContain('Evidenced resource deposit');
    s.deposits=[{id:'survey',mineral,evidence:['fixture:geological-survey']}];
    expect(eligibility(catalog,s,mineral+'-extraction')).toContain('Terrain prerequisites');
    s.terrain.push('rocky');expect(eligibility(catalog,s,mineral+'-extraction')).toEqual([]);
    s.deposits[0]!.evidence=[];expect(eligibility(catalog,s,mineral+'-extraction')).not.toEqual([]);
  });
  it('requires a downhill source-evidenced route for irrigation and conduits', () => {
    const s=copy();expect(eligibility(catalog,s,'aqueduct-conduit')).toContain('Surveyed downhill water route');
    s.waterRoutes=[{mode:'subterranean-conduit',sourceEvidence:['fixture:survey'],pointsM:[[0,12,0],[100,11,0]]}];
    expect(eligibility(catalog,s,'aqueduct-conduit')).toEqual([]);
    s.waterRoutes[0]!.pointsM[1]![1]=13;
    expect(eligibility(catalog,s,'irrigation')).toContain('Surveyed downhill water route');
    s.waterRoutes[0]!.pointsM[1]![1]=11;s.technologies=[];
    expect(eligibility(catalog,s,'aqueduct-conduit')).toContain('Attested technology');
  });
  it('excludes Roman thermae and unqualified ports at Roma', () => {
    expect(eligibility(catalog,roma,'greek-bath')).toContain('Architectural culture');
    expect(eligibility(catalog,roma,'port')).toContain('Terrain prerequisites');
    expect(catalog.chains.some(x => /imperial|thermae|legion/.test(x.id))).toBe(false);
  });
  it('rejects duplicate slots, culture inheritance cycles, and forbidden slot categories', () => {
    const s=copy();s.slots[1]!.id=s.slots[0]!.id;expect(()=>validateSettlement(catalog,s,ids)).toThrow('slot IDs');
    s.slots[1]!.id='unique';s.slots[0]!.allowedCategories=['military'];expect(()=>validateSettlement(catalog,s,ids)).toThrow('category');
    const c=structuredClone(catalog);c.cultures[0]!.parent=c.cultures[0]!.id;expect(()=>validateCatalog(c)).toThrow('cycle');
  });
  it('can validate 700 independent read models without generating scenes or uniform starts', () => {
    const many=new Set(Array.from({length:700},(_,i)=>'fixture-'+i));
    for(const id of many){const s=copy();s.settlementId=id;s.slots[0]!.building=null;validateSettlement(catalog,s,many);}
    expect(starts.settlements).toHaveLength(1);
  });
  it('preserves all protected source bytes, active identities and the 687-record research copy', () => {
    const protectedFiles=read('godot-prototype/evidence/protected-before.json') as {path:string;sha256:string}[];
    expect(protectedFiles).toHaveLength(460);
    for(const file of protectedFiles)expect(crypto.createHash('sha256').update(fs.readFileSync(file.path)).digest('hex'),file.path).toBe(file.sha256);
    expect(sites).toHaveLength(35);
    expect(fs.readFileSync('godot-prototype/data/research-locations.json','utf8')).toBe(fs.readFileSync('public/data/research-locations.json','utf8'));
    const research=read('public/data/research-locations.json') as {records:unknown[]};expect(research.records).toHaveLength(687);
  });
});
