/** Prototype read model. No ownership, economy, construction timers or authoritative simulation. */
export type BuildingLevel = 1 | 2 | 3;
export type BuildingCategory = 'food' | 'religion' | 'civic' | 'industry' | 'trade' | 'military' | 'entertainment' | 'extraction';
export type TerrainTag = 'cultivable' | 'freshwater' | 'coastal' | 'navigable' | 'rocky' | 'urban';
export type Mineral = 'iron' | 'gold' | 'copper' | 'tin' | 'stone';
export interface CultureStyle {
  id: string; name: string; parent: string | null;
  roofs: string[]; materials: string[]; forms: string[]; details: string[];
}
export interface BuildingStage {
  level: BuildingLevel; name: string; visualKey: string; effects: string[];
}
export interface BuildingDefinition {
  id: string; category: BuildingCategory; maxLevel: 3;
  cultures: string[]; fromBce: number; toBce: number;
  terrain: TerrainTag[]; deposits: Mineral[]; technology: string | null;
  infrastructure: 'water-route' | null; levels: [BuildingStage, BuildingStage, BuildingStage];
  evidence: string[]; interpretation: string;
  designLiberty?: string;
}
export interface DevelopmentEnvironment {
  surface: 'civic' | 'sacred' | 'cultivation' | 'trade' | 'entertainment';
  radiusM: number;
  fields: { centerM: [number, number]; sizeM: [number, number]; rotationDegrees: number; crop: 'grain' | 'fallow' }[];
  treePointsM: [number, number][];
}
export interface VisualAssetDefinition {
  id: string; visualKey: string; culture: string; regionalStyle: string;
  near: string; far: string; footprintM: [number, number]; silhouette: string;
  license: string; source: string;
  environment?: DevelopmentEnvironment;
}
export interface LandmarkDefinition {
  id: string; chain: string; settlementIds: string[]; minimumLevel: BuildingLevel;
  modifiers: string[]; evidence: string[];
}
export interface DevelopmentCatalog {
  schemaVersion: 1; yearBce: number;
  classes: { id: string; slots: number }[];
  cultures: CultureStyle[]; chains: BuildingDefinition[]; visuals: VisualAssetDefinition[];
  landmarks: LandmarkDefinition[];
  effects: { id: string; description: string; magnitude: null; metric?: 'food' | 'public-order' | 'wealth' | 'trade' | 'recruitment' | 'culture' | 'development'; scope?: 'settlement' | 'region' }[];
  technologies: { id: string; cultures: string[]; fromBce: number; toBce: number; evidence: string[] }[];
}
export interface Deposit {
  id: string; mineral: Mineral; evidence: string[];
}
export interface WaterRoute {
  pointsM: [number, number, number][]; sourceEvidence: string[];
  /** Sampled elevation of channel invert in metres, in upstream-to-downstream order. */
  mode: 'gravity-channel' | 'subterranean-conduit';
}
export interface DevelopmentSlot {
  id: string; anchorM: [number, number]; yawDegrees: number;
  /** Categories are optional site-specific restrictions, never universal category slots. */
  allowedCategories: BuildingCategory[];
  building: { chain: string; startingLevel: BuildingLevel; landmark: string | null; evidence: string[]; confidence: 'attested' | 'interpretive' } | null;
}
export interface SettlementDevelopment {
  settlementId: string; class: string; architectureCulture: string; regionalStyle: string;
  yearBce: number; terrain: TerrainTag[]; deposits: Deposit[]; technologies: string[];
  waterRoutes: WaterRoute[]; slots: DevelopmentSlot[]; evidence: string[];
}
export type DevelopmentCatalogOverlay = Pick<DevelopmentCatalog,'cultures'|'chains'|'visuals'|'effects'>;
/** Add/replace by stable definition ID; never mutate the preceding catalog. */
export function mergeDevelopmentCatalog(base: DevelopmentCatalog, overlay: DevelopmentCatalogOverlay): DevelopmentCatalog {
  const merged=structuredClone(base);
  merged.cultures=[...new Map([...merged.cultures,...overlay.cultures].map(x=>[x.id,structuredClone(x)])).values()];
  merged.chains=[...new Map([...merged.chains,...overlay.chains].map(x=>[x.id,structuredClone(x)])).values()];
  merged.visuals=[...new Map([...merged.visuals,...overlay.visuals].map(x=>[x.id,structuredClone(x)])).values()];
  merged.effects=[...new Map([...merged.effects,...overlay.effects].map(x=>[x.id,structuredClone(x)])).values()];
  validateCatalog(merged);return merged;
}
function demand(value: unknown, message: string): asserts value {
  if (!value) throw new RangeError(message);
}
function unique(ids: string[], label: string): void {
  demand(ids.every(Boolean) && new Set(ids).size === ids.length, `Duplicate/empty ${label}`);
}
export function validateCatalog(c: DevelopmentCatalog): void {
  demand(c.schemaVersion === 1 && c.yearBce === 278, 'Unsupported catalog period');
  for (const [label, rows] of Object.entries({ classes: c.classes, cultures: c.cultures, chains: c.chains, visuals: c.visuals, effects: c.effects, technologies: c.technologies, landmarks: c.landmarks })) unique(rows.map(r => r.id), label);
  demand(c.classes.find(x => x.id === 'major')?.slots === 6 && c.classes.find(x => x.id === 'minor')?.slots === 4, 'Settlement slot limits');
  const cultures = new Set(c.cultures.map(x => x.id));
  const effects = new Set(c.effects.map(x => x.id));
  for (const style of c.cultures) {
    demand(style.parent === null || cultures.has(style.parent), 'Unknown parent culture');
    const seen = new Set([style.id]); let parent = style.parent;
    while (parent !== null) { demand(!seen.has(parent), 'Culture inheritance cycle'); seen.add(parent); parent = c.cultures.find(x => x.id === parent)?.parent ?? null; }
    demand(style.roofs.length && style.materials.length && style.forms.length && style.details.length, 'Incomplete cultural design');
  }
  for (const t of c.technologies) demand(t.evidence.length && t.cultures.every(x => cultures.has(x)) && t.fromBce >= t.toBce, 'Technology eligibility');
  for (const b of c.chains) {
    demand(['food', 'religion', 'civic', 'industry', 'trade', 'military','entertainment','extraction'].includes(b.category), 'Unknown category');
    demand(b.maxLevel === 3 && b.levels.length === 3 && b.levels.every((l, i) => l.level === i + 1 && l.name && l.visualKey && l.effects.every(x => effects.has(x))), 'Invalid three-level progression');
    unique(b.levels.map(l => l.visualKey), 'level visual keys');
    demand(b.cultures.length && b.cultures.every(x => cultures.has(x)) && b.fromBce >= b.toBce && b.evidence.length && b.interpretation, 'Invalid building eligibility');
    demand(b.terrain.every(x => ['cultivable','freshwater','coastal','navigable','rocky','urban'].includes(x)) && b.deposits.every(x => ['iron','gold','copper','tin','stone'].includes(x)), 'Invalid prerequisites');
    demand(b.technology === null || c.technologies.some(t => t.id === b.technology), 'Missing technology');
    demand(b.infrastructure === null || b.infrastructure === 'water-route', 'Invalid infrastructure');
  }
  unique(c.visuals.map(v => `${v.visualKey}/${v.culture}/${v.regionalStyle}`), 'asset resolutions');
  for (const v of c.visuals) demand(cultures.has(v.culture) && c.chains.some(b => b.levels.some(l => l.visualKey === v.visualKey)) && v.near !== v.far && v.near.startsWith('res://') && v.far.startsWith('res://') && v.footprintM.every(n => n > 0) && v.silhouette && v.license && v.source, 'Invalid visual asset');
  for (const v of c.visuals) if (v.environment) {
    const e=v.environment;
    demand(['civic','sacred','cultivation','trade','entertainment'].includes(e.surface) && e.radiusM>0, 'Invalid specialization surface');
    demand(e.fields.every(f=>f.centerM.length===2 && f.centerM.every(Number.isFinite) && f.sizeM.length===2 && f.sizeM.every(n=>n>0) && Number.isFinite(f.rotationDegrees) && ['grain','fallow'].includes(f.crop)), 'Invalid cultivated field');
    demand(e.treePointsM.every(p=>p.length===2 && p.every(Number.isFinite)), 'Invalid orchard placement');
  }
  for (const l of c.landmarks) demand(c.chains.some(b => b.id === l.chain) && [1,2,3].includes(l.minimumLevel) && l.settlementIds.length && l.modifiers.every(x => effects.has(x)) && l.evidence.length, 'Invalid landmark');
  demand(c.effects.every(x => x.magnitude === null), 'Effect magnitudes are intentionally unbalanced');
  demand(c.effects.every(x=>(x.metric===undefined || ['food','public-order','wealth','trade','recruitment','culture','development'].includes(x.metric)) && (x.scope===undefined || ['settlement','region'].includes(x.scope))), 'Invalid effect interface');
}
export function eligibility(c: DevelopmentCatalog, s: SettlementDevelopment, chainId: string): string[] {
  const b = c.chains.find(x => x.id === chainId);
  if (!b) return ['Unknown building chain'];
  const reasons: string[] = [];
  if (!b.cultures.includes(s.architectureCulture)) reasons.push('Architectural culture');
  if (s.yearBce > b.fromBce || s.yearBce < b.toBce) reasons.push('Historical period');
  if (!b.terrain.every(t => s.terrain.includes(t))) reasons.push('Terrain prerequisites');
  if (!b.deposits.every(d => s.deposits.some(x => x.mineral === d && x.evidence.length > 0))) reasons.push('Evidenced resource deposit');
  if (b.technology !== null) {
    const t = c.technologies.find(x => x.id === b.technology);
    if (!t || !s.technologies.includes(t.id) || !t.cultures.includes(s.architectureCulture) || s.yearBce > t.fromBce || s.yearBce < t.toBce) reasons.push('Attested technology');
  }
  if (b.infrastructure === 'water-route' && !s.waterRoutes.some(r => r.sourceEvidence.length && r.pointsM.length >= 2 && r.pointsM.every((p, i) => {
    if (!p.every(Number.isFinite)) return false;
    const prev = r.pointsM[i - 1];
    return !prev || (prev[1] > p[1] && Math.hypot(prev[0]-p[0], prev[2]-p[2]) > 0);
  }))) reasons.push('Surveyed downhill water route');
  return reasons;
}
export function validateSettlement(c: DevelopmentCatalog, s: SettlementDevelopment, knownIds: ReadonlySet<string>): void {
  demand(knownIds.has(s.settlementId), 'Unknown settlement identity');
  const cls = c.classes.find(x => x.id === s.class);
  demand(cls && s.slots.length === cls.slots, 'Settlement slot capacity');
  unique(s.slots.map(x => x.id), 'slot IDs');
  demand(c.cultures.some(x => x.id === s.architectureCulture) && s.yearBce === c.yearBce && s.regionalStyle && s.evidence.length, 'Invalid starting context');
  unique(s.deposits.map(x => x.id), 'deposit IDs');
  for (const slot of s.slots) {
    demand(slot.anchorM.length === 2 && slot.anchorM.every(Number.isFinite) && Number.isFinite(slot.yawDegrees), 'Invalid placement');
    demand(slot.allowedCategories.every(x => ['food','religion','civic','industry','trade','military','entertainment','extraction'].includes(x)), 'Invalid slot categories');
    const b = slot.building;
    if (!b) continue;
    const chain = c.chains.find(x => x.id === b.chain);
    demand(chain && chain.levels.some(l => l.level === b.startingLevel) && b.evidence.length && ['attested','interpretive'].includes(b.confidence), 'Invalid starting building/level');
    demand(!slot.allowedCategories.length || slot.allowedCategories.includes(chain.category), 'Slot category restriction');
    demand(!eligibility(c, s, b.chain).length, 'Starting prerequisites');
    if (b.landmark) { const landmark = c.landmarks.find(x => x.id === b.landmark); demand(landmark && landmark.chain === b.chain && landmark.settlementIds.includes(s.settlementId) && b.startingLevel >= landmark.minimumLevel, 'Historical landmark restriction'); }
  }
  unique(s.slots.flatMap(x => x.building?.landmark ? [x.building.landmark] : []), 'landmark instances');
}
export type AssetResolution = { status: 'ready'; asset: VisualAssetDefinition } | { status: 'missing'; reason: string };
/** No automatic cross-culture fallback. Missing art preserves the slot and its state. */
export function resolveVisual(c: DevelopmentCatalog, s: SettlementDevelopment, chainId: string, level: BuildingLevel, exists: (path: string) => boolean): AssetResolution {
  const b = c.chains.find(x => x.id === chainId);
  const stage = b?.levels.find(x => x.level === level);
  if (!stage || eligibility(c, s, chainId).length) return {status:'missing', reason:'Ineligible building or level'};
  const asset = c.visuals.find(x => x.visualKey === stage.visualKey && x.culture === s.architectureCulture && x.regionalStyle === s.regionalStyle)
    ?? c.visuals.find(x => x.visualKey === stage.visualKey && x.culture === s.architectureCulture && x.regionalStyle === 'default');
  return asset && exists(asset.near) && exists(asset.far) ? {status:'ready', asset} : {status:'missing', reason:'Compatible art unavailable; slot retained'};
}
export function nextLevel(level: BuildingLevel): BuildingLevel | null { return level < 3 ? (level + 1) as BuildingLevel : null; }
/** Read-only, unbalanced effect references. Previewing below III disables Roma's landmark modifier. */
export function previewEffectReferences(c: DevelopmentCatalog, s: SettlementDevelopment, slotId: string, level: BuildingLevel): { buildingEffects: string[]; landmarkModifiers: string[] } {
  const b=s.slots.find(x=>x.id===slotId)?.building;
  const chain=c.chains.find(x=>x.id===b?.chain);
  const stage=chain?.levels.find(x=>x.level===level);
  if(!b || !stage || eligibility(c,s,b.chain).length) return {buildingEffects:[],landmarkModifiers:[]};
  const landmark=c.landmarks.find(x=>x.id===b.landmark && x.chain===b.chain && x.settlementIds.includes(s.settlementId) && level>=x.minimumLevel);
  return {buildingEffects:[...stage.effects],landmarkModifiers:[...(landmark?.modifiers ?? [])]};
}
