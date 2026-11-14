/** Presentation contract only. Ownership and save-game simulation never contain mesh paths. */
import type { DevelopmentCatalog, SettlementDevelopment } from './settlement-development-system.js';
export type SettlementRank = 'rural' | 'town' | 'city' | 'major' | 'capital';
export type District = 'commercial' | 'military' | 'religious' | 'civic' | 'agricultural';
export const districts: readonly District[] = ['commercial','military','religious','civic','agricultural'];
export interface VisualInput {
  settlementId: string;
  architectureCulture: string;
  graphicalCultureOverride?: string | null;
  rank: SettlementRank;
  population: number | null;
  prosperity: number | null;
  capital: boolean;
  terrain: 'plain' | 'hill' | 'river';
  coastal: boolean;
  portLevel: number;
  fortificationLevel: number;
  roadLevel: number;
  buildings: readonly {chain: string; level: number; condition: 'active' | 'ruined'}[];
  monuments: readonly string[];
  construction: 'none' | 'building';
  damage: 'intact' | 'damaged' | 'ruined';
  seed?: number;
}
export interface SettlementVisualState {
  schemaVersion: 1;
  settlementId: string;
  graphicalCultureId: string;
  rank: SettlementRank;
  populationBand: number | null;
  prosperityBand: number | null;
  capital: boolean;
  terrain: VisualInput['terrain'];
  coastal: boolean;
  portLevel: number;
  fortificationLevel: number;
  roadLevel: number;
  weights: Record<District,number>;
  monuments: string[];
  construction: VisualInput['construction'];
  damage: VisualInput['damage'];
  seed: number;
}
export interface RankProfile {
  radiusM: number; residentialClusters: number; districtSlots: number; landmarks: number;
  defaultDensity: number; wallEnabled: boolean;
}
export interface VisualPolicy {
  version: 1;
  cultureAliases: Record<string,string>;
  cultures: Record<string,{status:'implemented'|'planned'; profile:string|null}>;
  populationBands: number[];
  prosperityBands: number[];
  chainWeights: Record<string,Partial<Record<District,number>>>;
  profiles: Record<string,{
    assetPrefix: string; yearBce: number; palette: string[]; roofs: string[];
    ranks: Record<SettlementRank,RankProfile>;
    roles: Record<string,string[]>;
    boundary: [number,number][];
    lodDistancesKm: [number,number,number];
    maxGrade: number; maxReliefM:number; harborSearchM:number;
  }>;
}
export interface VisualAsset {
  id:string; role:string; culture:string;
  quality:'missing'|'production'; units:'metres'|'kilometres';
  lods:[string|null,string|null,string|null,string|null];
  footprintM:[number,number];
  authoredSource:string|null; licenseEvidence:string|null;
  periodReviewed:boolean; fromBce:number; toBce:number;
  uvReviewed:boolean; normalsReviewed:boolean; pbrReviewed:boolean;
  development:{near:string;far:string;provenance:string;quality:'procedural_prototype'}|null;
}
export interface AssetManifest {version:1; assets:VisualAsset[]}
export type VisualLayer = 'layout'|'residential'|'districts'|'fortifications'|'harbor'|'roads'|'condition'|'lod';
const allLayers: readonly VisualLayer[] = ['layout','residential','districts','fortifications','harbor','roads','condition','lod'];
const ranks:readonly SettlementRank[]=['rural','town','city','major','capital'];
function demand(value:unknown,message:string):asserts value {if(!value)throw new RangeError(message);}
function finiteInt(n:unknown,min:number,max:number):boolean{return typeof n==='number'&&Number.isInteger(n)&&n>=min&&n<=max;}
export function visualSeed(id:string):number {
  let hash=2166136261;
  for(const c of id){hash^=c.charCodeAt(0);hash=Math.imul(hash,16777619)>>>0;}
  return hash;
}
function band(value:number|null,limits:readonly number[]):number|null {
  if(value===null)return null;
  return limits.filter(n=>value>=n).length;
}
export function resolveSettlementVisual(input:VisualInput,policy:VisualPolicy):SettlementVisualState {
  demand(input.settlementId.length>0&&ranks.includes(input.rank),'Invalid settlement identity/rank');
  demand([input.population,input.prosperity].every(n=>n===null||(Number.isFinite(n)&&n>=0)),'Invalid demographics');
  demand([input.portLevel,input.fortificationLevel,input.roadLevel].every(n=>finiteInt(n,0,3)),'Invalid infrastructure level');
  demand(input.coastal||input.portLevel===0,'An inland settlement cannot receive a sea port');
  demand(['plain','hill','river'].includes(input.terrain)&&['none','building'].includes(input.construction)&&['intact','damaged','ruined'].includes(input.damage),'Invalid visual context');
  demand(input.seed===undefined||finiteInt(input.seed,0,4294967295),'Invalid deterministic seed');
  const culture=input.graphicalCultureOverride??policy.cultureAliases[input.architectureCulture]??input.architectureCulture;
  const weights:Record<District,number>={commercial:0,military:0,religious:0,civic:0,agricultural:0};
  for(const b of input.buildings){
    demand(b.chain.length>0&&finiteInt(b.level,1,3)&&['active','ruined'].includes(b.condition),'Invalid building state');
    if(b.condition==='ruined')continue;
    for(const key of districts)weights[key]+=(policy.chainWeights[b.chain]?.[key]??0)*b.level;
  }
  for(const key of districts)weights[key]=Math.round(weights[key]*1000)/1000;
  demand(input.monuments.every(m=>m.length>0),'Invalid monument');
  return {schemaVersion:1,settlementId:input.settlementId,graphicalCultureId:culture,rank:input.rank,
    populationBand:band(input.population,policy.populationBands),prosperityBand:band(input.prosperity,policy.prosperityBands),
    capital:input.capital,terrain:input.terrain,coastal:input.coastal,portLevel:input.portLevel,fortificationLevel:input.fortificationLevel,roadLevel:input.roadLevel,
    weights,monuments:[...new Set(input.monuments)].sort(),construction:input.construction,damage:input.damage,seed:input.seed??visualSeed(input.settlementId)};
}
/** Explicit adapter for the existing disposable development model, including changed levels. */
export function developmentVisualInput(context:Omit<VisualInput,'buildings'|'architectureCulture'|'settlementId'>,development:SettlementDevelopment,catalog:DevelopmentCatalog,levels:Readonly<Record<string,number>>={}):VisualInput {
  const buildings=development.slots.flatMap(slot=>{
    if(!slot.building)return [];
    demand(catalog.chains.some(c=>c.id===slot.building?.chain),'Unknown development chain');
    return [{chain:slot.building.chain,level:levels[slot.id]??slot.building.startingLevel,condition:'active' as const}];
  });
  return {...context,settlementId:development.settlementId,architectureCulture:development.architectureCulture,buildings};
}
export function rankProfile(state:SettlementVisualState,policy:VisualPolicy):RankProfile|null {
  const family=policy.cultures[state.graphicalCultureId];
  if(family?.status!=='implemented'||!family.profile)return null;
  return policy.profiles[family.profile]?.ranks[state.rank]??null;
}
export function validateAssetManifest(manifest:AssetManifest,exists:(path:string)=>boolean):void {
  demand(manifest.version===1&&new Set(manifest.assets.map(a=>a.id)).size===manifest.assets.length,'Invalid asset manifest');
  for(const a of manifest.assets){
    demand(a.id.length&&a.role.length&&a.culture.length&&a.footprintM.every(n=>Number.isFinite(n)&&n>0),'Invalid asset identity/footprint');
    demand(a.lods.length===4&&a.fromBce>=a.toBce&&['metres','kilometres'].includes(a.units),'Invalid LOD/period/unit contract');
    if(a.quality==='production'){
      demand(a.periodReviewed&&a.fromBce>=278&&a.toBce<=278&&a.uvReviewed&&a.normalsReviewed&&a.pbrReviewed,'Unreviewed production art');
      demand(a.authoredSource!==null&&/\.(glb|gltf|blend|fbx|obj)$/i.test(a.authoredSource)&&exists(a.authoredSource),'Missing authored mesh source');
      demand(a.licenseEvidence!==null&&exists(a.licenseEvidence)&&a.lods.every(p=>p!==null&&p.startsWith('res://')&&exists(p)),'Missing production license/LOD');
    }else demand(a.quality==='missing','Invalid quality status');
    if(a.development)demand(a.development.quality==='procedural_prototype'&&exists(a.development.near)&&exists(a.development.far)&&exists(a.development.provenance),'Invalid development fallback');
  }
}
export function resolveVisualAsset(manifest:AssetManifest,id:string,lod:0|1|2|3,exists:(path:string)=>boolean,allowDevelopment=false):{status:'production'|'development'|'missing';path:string|null;reason:string} {
  const asset=manifest.assets.find(a=>a.id===id);
  if(!asset)return {status:'missing',path:null,reason:'Unknown asset ID'};
  if(asset.quality==='production'){
    // Validate the complete asset, not just the currently selected LOD.
    try{validateAssetManifest({version:1,assets:[asset]},exists);}catch{return {status:'missing',path:null,reason:'Production asset failed review/LOD contract'};}
    const path=asset.lods[lod];if(path&&exists(path))return {status:'production',path,reason:''};
  }
  if(allowDevelopment&&asset.development){const path=lod===0?asset.development.near:asset.development.far;if(exists(path))return {status:'development',path,reason:'Procedural prototype; not production architecture'};}
  return {status:'missing',path:null,reason:'Authored production asset required; retain baseline'};
}
export function visualLayerKeys(s:SettlementVisualState):Record<VisualLayer,string> {
  const layout=[s.graphicalCultureId,s.rank,s.seed,s.terrain].join('|');
  const special=[...districts.map(k=>Math.round(s.weights[k]*1000)),...s.monuments,s.capital].join('|');
  const parcels=[layout,s.roadLevel,s.coastal && s.portLevel>0].join('|');
  return {layout,residential:[parcels,s.populationBand??'unknown',s.prosperityBand??'unknown',special].join('|'),
    districts:[parcels,...districts.map(k=>Math.round(s.weights[k]*1000)),...s.monuments,s.capital].join('|'),
    fortifications:[layout,s.fortificationLevel,s.coastal && s.portLevel>0].join('|'),harbor:[layout,s.coastal,s.portLevel,s.fortificationLevel].join('|'),
    roads:[layout,s.roadLevel,s.fortificationLevel,s.coastal,s.portLevel,s.populationBand??'unknown',s.prosperityBand??'unknown',special].join('|'),condition:[s.damage,s.construction].join('|'),
    lod:[layout,s.populationBand??'unknown',s.prosperityBand??'unknown',s.fortificationLevel,s.portLevel,...districts.map(k=>Math.round(s.weights[k]*1000)),...s.monuments,s.capital].join('|')};
}
export function changedVisualLayers(previous:SettlementVisualState|null,next:SettlementVisualState):VisualLayer[] {
  if(!previous)return [...allLayers];
  demand(previous.settlementId===next.settlementId,'Cannot refresh a different settlement');
  const before=visualLayerKeys(previous),after=visualLayerKeys(next);
  return allLayers.filter(key=>before[key]!==after[key]);
}
export function serializeVisualState(state:SettlementVisualState):string{return JSON.stringify(state);}
export function deserializeVisualState(text:string):SettlementVisualState {
  const raw:unknown=JSON.parse(text);demand(raw!==null&&typeof raw==='object','Invalid visual save');
  const r=raw as Record<string,unknown>;
  demand(r['schemaVersion']===1&&typeof r['settlementId']==='string'&&typeof r['graphicalCultureId']==='string','Unsupported visual save');
  demand(ranks.includes(r['rank'] as SettlementRank)&&finiteInt(r['seed'],0,4294967295),'Invalid saved rank/seed');
  for(const key of ['portLevel','fortificationLevel','roadLevel'])demand(finiteInt(r[key],0,3),'Invalid saved infrastructure');
  for(const key of ['populationBand','prosperityBand'])demand(r[key]===null||finiteInt(r[key],0,4),'Invalid saved demographic band');
  demand(typeof r['capital']==='boolean'&&typeof r['coastal']==='boolean'&&['plain','hill','river'].includes(r['terrain'] as string),'Invalid saved context');
  demand(r['coastal']||r['portLevel']===0,'Invalid saved inland port');
  const weights=r['weights'];demand(weights!==null&&typeof weights==='object','Invalid saved weights');
  for(const key of districts)demand(typeof (weights as Record<string,unknown>)[key]==='number'&&Number.isFinite((weights as Record<string,unknown>)[key])&&((weights as Record<string,number>)[key]??-1)>=0,'Invalid saved district');
  demand(Array.isArray(r['monuments'])&&r['monuments'].every((v:unknown)=>typeof v==='string'&&v.length>0),'Invalid saved monuments');
  demand(['none','building'].includes(r['construction'] as string)&&['intact','damaged','ruined'].includes(r['damage'] as string),'Invalid saved condition');
  return r as unknown as SettlementVisualState;
}
