import {readFileSync,existsSync} from 'node:fs';
import {describe,it,expect} from 'vitest';
import {resolveSettlementVisual,rankProfile,visualSeed,changedVisualLayers,visualLayerKeys,validateAssetManifest,resolveVisualAsset,serializeVisualState,deserializeVisualState,developmentVisualInput} from '../src/presentation/settlement-visual-state.js';
import type {VisualPolicy,AssetManifest,VisualInput,SettlementRank} from '../src/presentation/settlement-visual-state.js';
import type {DevelopmentCatalog,SettlementDevelopment} from '../src/presentation/settlement-development-system.js';
const root='godot-prototype/data/settlement-visuals/';
const policy=JSON.parse(readFileSync(root+'profiles.json','utf8')) as VisualPolicy;
const manifest=JSON.parse(readFileSync(root+'roman-assets.json','utf8')) as AssetManifest;
const fixtures=JSON.parse(readFileSync(root+'roman-fixtures.json','utf8')) as {scenarioKind:string;cases:{caseId:string;input:VisualInput}[]};
const input=():VisualInput=>structuredClone(fixtures.cases[0]!.input);
const exists=(path:string):boolean=>existsSync(path.replace('res://','godot-prototype/'));
describe('settlement visual read model',()=>{
  it.each(fixtures.cases)('resolves $caseId deterministically without mesh paths or invented demographics',fixture=>{
    const a=resolveSettlementVisual(fixture.input,policy),b=resolveSettlementVisual(structuredClone(fixture.input),policy);
    expect(a).toEqual(b);expect(a.populationBand).toBeNull();expect(a.prosperityBand).toBeNull();
    expect(a.seed).toBe(visualSeed(fixture.input.settlementId));expect(JSON.stringify(a)).not.toContain('res://');
    expect(deserializeVisualState(serializeVisualState(a))).toEqual(a);
  });
  it('declares fixture assumptions separately from historical state',()=>expect(fixtures.scenarioKind).toBe('visual-test-only'));
  it('has five increasing footprint/count tiers with fixed architectural scale',()=>{
    const ranks:SettlementRank[]=['rural','town','city','major','capital'];let radius=0,count=0;
    for(const rank of ranks){const s=resolveSettlementVisual({...input(),rank},policy),p=rankProfile(s,policy)!;expect(p.radiusM).toBeGreaterThan(radius);expect(p.residentialClusters).toBeGreaterThan(count);expect(p).not.toHaveProperty('meshScale');radius=p.radiusM;count=p.residentialClusters;}
  });
  it('uses architectural culture, never controller ownership',()=>{
    const context={...input(),architectureCulture:'greek-hellenistic',controllerCulture:'roman_italic'};
    const state=resolveSettlementVisual(context,policy);expect(state.graphicalCultureId).toBe('hellenistic');expect(rankProfile(state,policy)).toBeNull();
    expect(resolveSettlementVisual({...context,graphicalCultureOverride:'roman_italic'},policy).graphicalCultureId).toBe('roman_italic');
  });
  it.each([[0,0],[999,0],[1000,1],[4999,1],[5000,2],[20000,3],[75000,4]])('maps population %i to band %i',(population,band)=>expect(resolveSettlementVisual({...input(),population},policy).populationBand).toBe(band));
  it('weights active investment and omits ruined or unmapped anachronistic spectacle',()=>{
    const state=resolveSettlementVisual({...input(),buildings:[{chain:'market',level:3,condition:'active'},{chain:'training-yard',level:2,condition:'active'},{chain:'sanctuary',level:3,condition:'ruined'},{chain:'roman-spectacle',level:3,condition:'active'}]},policy);
    expect(state.weights).toEqual({commercial:3,military:2,religious:0,civic:0,agricultural:0});
  });
  it('invalidates housing and dependent access without rebuilding walls for a population band change',()=>{
    const a=resolveSettlementVisual(input(),policy),b=resolveSettlementVisual({...input(),population:6000},policy);
    expect(changedVisualLayers(a,b)).toEqual(['residential','roads','lod']);
    expect(changedVisualLayers(a,{...a,damage:'damaged'})).toEqual(['condition']);
    expect(changedVisualLayers(a,{...a,rank:'city'})).toContain('layout');
    expect(changedVisualLayers(a,structuredClone(a))).toEqual([]);
  });
  it('refreshes specialization-dependent districts, housing and access, retaining walls/harbor',()=>{
    const a=resolveSettlementVisual(input(),policy),b=resolveSettlementVisual({...input(),buildings:[{chain:'market',level:3,condition:'active'}]},policy);
    expect(changedVisualLayers(a,b)).toEqual(['residential','districts','roads','lod']);
    expect(visualLayerKeys(a).fortifications).toBe(visualLayerKeys(b).fortifications);
  });
  it('adapts actual development levels without adding asset references to gameplay',()=>{
    const catalog=JSON.parse(readFileSync('godot-prototype/data/settlement-development-catalog.json','utf8')) as DevelopmentCatalog;
    const starts=JSON.parse(readFileSync('godot-prototype/data/settlement-development-starts.json','utf8')) as {settlements:SettlementDevelopment[]};
    const start=starts.settlements[0]!;const context=input();const levels={[start.slots[0]!.id]:1};
    const adapted=developmentVisualInput(context,start,catalog,levels);expect(adapted.buildings[0]?.level).toBe(1);
    expect(adapted.settlementId).toBe(start.settlementId);expect(start.slots[0]!.building?.startingLevel).toBe(3);
  });
  it.each([-1,NaN,Infinity])('rejects invalid demographics %s',population=>expect(()=>resolveSettlementVisual({...input(),population},policy)).toThrow(RangeError));
  it('rejects inland ports, fractional infrastructure, different IDs and malformed visual saves',()=>{
    expect(()=>resolveSettlementVisual({...input(),coastal:false,portLevel:1},policy)).toThrow(RangeError);
    expect(()=>resolveSettlementVisual({...input(),fortificationLevel:1.2},policy)).toThrow(RangeError);
    const a=resolveSettlementVisual(input(),policy);expect(()=>changedVisualLayers(a,{...a,settlementId:'other'})).toThrow(RangeError);
    expect(()=>deserializeVisualState('{"schemaVersion":99}')).toThrow(RangeError);
    expect(()=>deserializeVisualState(JSON.stringify({...a,weights:{...a.weights,civic:-1}}))).toThrow(RangeError);
  });
});
describe('authored-asset quality gate',()=>{
  it('lists the actual missing production kit and validates existing development sources',()=>{
    expect(()=>validateAssetManifest(manifest,exists)).not.toThrow();expect(manifest.assets.filter(a=>a.quality==='production')).toHaveLength(0);
    for(const role of ['residential','civic','religious','military','fortification','port','agricultural','infrastructure','prop','landmark','hlod'])expect(manifest.assets.some(a=>a.role===role)).toBe(true);
  });
  it('never promotes a baked procedural .res or a missing gate to production art',()=>{
    expect(resolveVisualAsset(manifest,'roman_italic.house_a',0,exists).status).toBe('missing');
    expect(resolveVisualAsset(manifest,'roman_italic.house_a',0,exists,true).status).toBe('development');
    expect(resolveVisualAsset(manifest,'roman_italic.gate',0,exists,true).status).toBe('missing');
  });
  it('requires authored source, license, period/PBR review and every LOD for a production asset',()=>{
    const a=structuredClone(manifest.assets[0]!);a.quality='production';
    expect(()=>validateAssetManifest({version:1,assets:[a]},()=>true)).toThrow(RangeError);
    Object.assign(a,{authoredSource:'res://source/house.glb',licenseEvidence:'res://source/LICENSE.txt',periodReviewed:true,uvReviewed:true,normalsReviewed:true,pbrReviewed:true,lods:['res://house-0.res','res://house-1.res','res://house-2.res','res://house-3.res']});
    expect(()=>validateAssetManifest({version:1,assets:[a]},()=>true)).not.toThrow();
    a.lods[3]=null;expect(resolveVisualAsset({version:1,assets:[a]},a.id,0,()=>true).status).toBe('missing');
  });
});
