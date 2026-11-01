import {describe,it,expect} from 'vitest';
import fs from 'node:fs';
import crypto from 'node:crypto';
import {mergeDevelopmentCatalog,validateSettlement,resolveVisual,eligibility,previewEffectReferences} from '../src/presentation/settlement-development-system.js';
import type {DevelopmentCatalog,DevelopmentCatalogOverlay,SettlementDevelopment} from '../src/presentation/settlement-development-system.js';
const read=(p:string):unknown=>JSON.parse(fs.readFileSync(p,'utf8')) as unknown;
const base=read('godot-prototype/data/settlement-development-catalog.json') as DevelopmentCatalog;
const overlay=read('godot-prototype/data/settlement-identity-overlay.json') as DevelopmentCatalogOverlay;
const catalog=mergeDevelopmentCatalog(base,overlay);
const starts=(read('godot-prototype/data/settlement-identity-starts.json') as {settlements:SettlementDevelopment[]}).settlements;
const sites=read('godot-prototype/data/sites.json') as {id:string;key:string}[];
const known=new Set(sites.map(x=>x.id));
const exists=(p:string):boolean=>fs.existsSync(p.replace('res://','godot-prototype/'));
describe('two original settlement identities',()=>{
 it('extends the preceding catalog without modifying it',()=>{
  expect(base.chains).toHaveLength(20);expect(base.cultures).toHaveLength(9);
  expect(catalog.chains).toHaveLength(21);expect(catalog.cultures).toHaveLength(10);
  expect(catalog.visuals).toHaveLength(18);
 });
 it('validates two existing canonical identities with different density and slot counts',()=>{
  expect(starts).toHaveLength(2);
  for(const s of starts)validateSettlement(catalog,s,known);
  expect(starts[0]!.slots).toHaveLength(6);expect(starts[1]!.slots).toHaveLength(4);
  expect(starts[0]!.slots[0]!.building!.startingLevel).toBe(3);
  expect(starts[1]!.settlementId).toBe(sites.find(x=>x.key==='aricia')!.id);
  expect(starts[1]!.slots.filter(s=>s.building===null)).toHaveLength(2);
 });
 it('resolves 18 genuinely separate native stage assets, with near/far forms',()=>{
  const paths=[];
  for(const chain of ['civic-forum','sanctuary','farm','market','roman-spectacle','grain-storage'])for(const level of [1,2,3] as const){
   const settlement=chain==='farm'?starts[1]!:starts[0]!;
   const asset=resolveVisual(catalog,settlement,chain,level,exists);expect(asset.status,chain+level).toBe('ready');
   if(asset.status==='ready'){paths.push(asset.asset.near);expect(exists(asset.asset.far)).toBe(true);}
  }expect(new Set(paths).size).toBe(18);
 });
 it('grows cultivated land and orchard counts with the farm building, without cloning houses',()=>{
  const assets=[1,2,3].map(i=>catalog.visuals.find(v=>v.visualKey==='farm.'+i)!);
  const areas=assets.map(v=>v.environment!.fields.reduce((sum,f)=>sum+f.sizeM[0]*f.sizeM[1],0));
  expect(areas).toEqual([896,2808,6072]);
  expect(assets.map(v=>v.environment!.treePointsM.length)).toEqual([3,6,9]);
  expect(new Set(assets.map(v=>v.silhouette)).size).toBe(3);
 });
 it('changes civic and sacred environments as well as silhouettes',()=>{
  for(const chain of ['civic-forum','sanctuary']){
   const a=[1,2,3].map(i=>catalog.visuals.find(v=>v.visualKey===chain+'.'+i)!);
   expect(a[0]!.environment!.radiusM).toBeLessThan(a[1]!.environment!.radiusM);
   expect(a[1]!.environment!.radiusM).toBeLessThan(a[2]!.environment!.radiusM);
   expect(new Set(a.map(v=>v.silhouette)).size).toBe(3);
  }
 });
 it('makes historical compression explicit and preserves separate landmark effects',()=>{
  const chain=catalog.chains.find(x=>x.id==='roman-spectacle')!;
  expect(chain.designLiberty).toMatch(/compresses/);
  expect(eligibility(catalog,starts[0]!,chain.id)).toEqual([]);
  expect(eligibility(catalog,starts[1]!,chain.id)).toContain('Terrain prerequisites');
  expect(previewEffectReferences(catalog,starts[0]!,starts[0]!.slots[0]!.id,2).landmarkModifiers).toEqual([]);
  expect(catalog.effects.every(x=>x.magnitude===null)).toBe(true);
 });
 it('does not fabricate deposits or enable unsupported local extraction',()=>{
  for(const s of starts){expect(s.deposits).toEqual([]);expect(eligibility(catalog,s,'gold-extraction')).toContain('Evidenced resource deposit');}
  expect(catalog.chains.find(x=>x.id==='iron-extraction')!.category).toBe('extraction');
 });
 it('keeps missing Germanic/cultural art explicit',()=>{
  const s=structuredClone(starts[1]!);s.architectureCulture='germanic';
  expect(eligibility(catalog,s,'farm')).toEqual([]);
  expect(resolveVisual(catalog,s,'farm',2,exists).status).toBe('missing');
  expect(catalog.cultures.find(x=>x.id==='germanic')!.forms).toContain('aisled longhouses');
 });
 it('rejects malformed environment and effect interfaces',()=>{
  const bad=structuredClone(overlay);bad.visuals.find(x=>x.visualKey==='farm.1')!.environment!.fields[0]!.sizeM=[-1,10];
  expect(()=>mergeDevelopmentCatalog(base,bad)).toThrow('field');
 });
 it('retains exact licensed download bytes and the old protected sources',()=>{
  const files=read('godot-prototype/assets/settlement-identities/texture-manifest.json') as {file:string;sha256:string;license:string}[];
  for(const file of files){expect(file.license).toBe('CC0-1.0');expect(crypto.createHash('sha256').update(fs.readFileSync('godot-prototype/assets/settlement-identities/'+file.file)).digest('hex')).toBe(file.sha256);}
  const protectedFiles=read('godot-prototype/evidence/protected-before.json') as {path:string;sha256:string}[];
  for(const file of protectedFiles)expect(crypto.createHash('sha256').update(fs.readFileSync(file.path)).digest('hex'),file.path).toBe(file.sha256);
 });
});
