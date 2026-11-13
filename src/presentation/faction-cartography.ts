import { deriveAuthoredCanonicalId } from '../domain/identity/canonical-id.js';
import type { CanonicalId } from '../domain/identity/canonical-id.js';
import type { MapFaction } from '../simulation/campaign-map-state.js';

export type FactionStatus = 'reconstruction' | 'provisional' | 'presence_only';
export type GeographicPoint = readonly [number, number];
export type GeographicRing = readonly GeographicPoint[];
export type TerritoryGeometry =
  | { readonly type: 'Polygon'; readonly coordinates: readonly GeographicRing[] }
  | { readonly type: 'MultiPolygon'; readonly coordinates: readonly (readonly GeographicRing[])[] };
export interface ScenarioFaction {
  /** Authored source key, not a settlement identity or foreign-game ID. */
  readonly id: string;
  readonly name: string;
  readonly culture: string;
  /** null/absent means undecided; independent of AI control and starting land. */
  readonly playerSelectable?: boolean | null;
  readonly startPresence?: 'pending_arrival' | 'background';
  readonly color: string;
  readonly label: GeographicPoint;
  readonly status: FactionStatus;
  readonly emblem: { readonly motif: string; readonly monogram: string };
  readonly sources: readonly string[];
  readonly notes: string;
}
export interface ScenarioTerritory {
  readonly id: string;
  readonly initialController: string;
  /** A retained, withdrawn envelope is inert rather than a new political entity. */
  readonly active?: boolean;
  readonly geometry: TerritoryGeometry;
  readonly confidence: 'source_reconstruction' | 'scenario_abstraction';
  readonly sources: readonly string[];
}
export interface FactionScenario {
  readonly version: 1;
  readonly dateBce: 278;
  readonly cultures: readonly { readonly id: string; readonly family: string; readonly motif: string }[];
  readonly sources: Readonly<Record<string, { readonly url: string }>>;
  readonly factions: readonly ScenarioFaction[];
  readonly territories: readonly ScenarioTerritory[];
}
function object(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
function requireValue(ok: unknown, reason: string): asserts ok {
  if (!ok) throw new RangeError(reason);
}
function point(value: unknown): value is GeographicPoint {
  return Array.isArray(value) && value.length === 2 &&
    value.every((v: unknown) => typeof v === 'number' && Number.isFinite(v)) &&
    Math.abs(value[0] as number) <= 180 && Math.abs(value[1] as number) <= 90;
}
/** Validates the new scenario layer; never edits canonical geography/research. */
export function validateFactionScenario(value: unknown): asserts value is FactionScenario {
  requireValue(object(value) && value['version'] === 1 && value['dateBce'] === 278, 'Invalid faction scenario/date');
  const cultures = value['cultures'], factions = value['factions'], territories = value['territories'], sources = value['sources'];
  requireValue(Array.isArray(cultures) && Array.isArray(factions) && Array.isArray(territories) && object(sources), 'Missing catalog relationships');
  const cultureIds = new Set<string>(), factionIds = new Set<string>(), territoryIds = new Set<string>();
  for (const culture of cultures) {
    requireValue(object(culture) && typeof culture['id'] === 'string' && typeof culture['family'] === 'string' && typeof culture['motif'] === 'string', 'Invalid culture');
    requireValue(!cultureIds.has(culture['id']), 'Duplicate culture');cultureIds.add(culture['id']);
  }
  const checkSources = (list: unknown): void => {
    requireValue(Array.isArray(list) && list.length > 0 && list.every((id: unknown) => typeof id === 'string' && object(sources[id]) && typeof sources[id]['url'] === 'string'), 'Missing/unknown evidence source');
  };
  for (const faction of factions) {
    requireValue(object(faction) && typeof faction['id'] === 'string' && /^[a-z0-9-]+$/.test(faction['id']), 'Invalid faction source key');
    requireValue(!factionIds.has(faction['id']), 'Duplicate faction');factionIds.add(faction['id']);
    requireValue(typeof faction['name'] === 'string' && faction['name'].length > 0 && typeof faction['culture'] === 'string' && cultureIds.has(faction['culture']), 'Invalid name/culture');
    requireValue(faction['playerSelectable'] == null || typeof faction['playerSelectable'] === 'boolean', 'Invalid player-selectable status');
    requireValue(faction['startPresence'] === undefined || ['pending_arrival','background'].includes(faction['startPresence'] as string), 'Invalid starting presence');
    requireValue(typeof faction['color'] === 'string' && /^#[0-9a-f]{6}$/i.test(faction['color']), 'Invalid faction color');
    requireValue(point(faction['label']), 'Invalid label coordinate');
    requireValue(['reconstruction', 'provisional', 'presence_only'].includes(faction['status'] as string), 'Invalid evidence status');
    requireValue(object(faction['emblem']) && typeof faction['emblem']['motif'] === 'string' && typeof faction['emblem']['monogram'] === 'string', 'Missing original emblem definition');
    requireValue(typeof faction['notes'] === 'string' && faction['notes'].length > 0, 'Missing reconstruction caveat');checkSources(faction['sources']);
  }
  for (const territory of territories) {
    requireValue(object(territory) && typeof territory['id'] === 'string' && !territoryIds.has(territory['id']), 'Invalid/duplicate territory');territoryIds.add(territory['id']);
    requireValue(typeof territory['initialController'] === 'string' && (factionIds.has(territory['initialController']) || (territory['initialController'] === '' && territory['active'] === false)), 'Unknown territory controller');
    requireValue(['source_reconstruction', 'scenario_abstraction'].includes(territory['confidence'] as string), 'Missing territory confidence');checkSources(territory['sources']);
    const geometry = territory['geometry'];requireValue(object(geometry) && Array.isArray(geometry['coordinates']), 'Missing geographic geometry');
    requireValue(geometry['type'] === 'Polygon' || geometry['type'] === 'MultiPolygon', 'Only polygon territory geometry is allowed');
    const polygons: unknown[] = geometry['type'] === 'Polygon' ? [geometry['coordinates']] : geometry['coordinates'];
    for (const polygon of polygons) {
      requireValue(Array.isArray(polygon) && polygon.length > 0, 'Empty polygon');
      for (const ring of polygon) {
        requireValue(Array.isArray(ring) && ring.length >= 4 && ring.every(point), 'Invalid coordinate ring');
        requireValue(JSON.stringify(ring[0]) === JSON.stringify(ring.at(-1)), 'Unclosed polygon ring');
      }
    }
    const owner = factions.find((f: unknown) => object(f) && f['id'] === territory['initialController']) as Record<string, unknown>;
    requireValue(!owner || (owner['status'] !== 'presence_only' && owner['startPresence'] !== 'pending_arrival' && owner['startPresence'] !== 'background'), 'A migrating/background faction cannot own settled territory');
  }
}
/** Optional bridge to the existing canonical map read model, not a simulation. */
export function factionCanonicalId(sourceKey: string): CanonicalId {
  return deriveAuthoredCanonicalId({ sourceNamespace: 'historicalparadox:factions', sourceKey });
}
export function factionReadModel(scenario: FactionScenario, presentation?: FactionPresentation): readonly MapFaction[] {
  return scenario.factions.map(faction => ({ id: factionCanonicalId(faction.id), name: faction.name, color: presentation?.factions[faction.id]?.color ?? faction.color }));
}

export type EmblemBasis = 'attested_motif' | 'later_regional_motif' | 'original_design';
export interface FactionPresentation {
  readonly version: 1;
  readonly sources: Readonly<Record<string, { readonly url: string; readonly title: string; readonly evidence: string }>>;
  readonly factions: Readonly<Record<string, {
    readonly color: string;
    readonly emblem: {
      readonly motif: string;
      readonly monogram: string;
      readonly basis: EmblemBasis;
      readonly sourceKeys: readonly string[];
      readonly note: string;
    };
  }>>;
}
/** Presentation overrides cannot alter geography, identity, culture or control. */
export function validateFactionPresentation(value: unknown, scenario: FactionScenario): asserts value is FactionPresentation {
  requireValue(object(value) && value['version'] === 1 && object(value['factions']) && object(value['sources']), 'Invalid faction presentation');
  const factions=value['factions'], sources=value['sources'];
  const ids=new Set(scenario.factions.map(f=>f.id));
  requireValue(Object.keys(factions).length===ids.size, 'Presentation must cover the complete roster');
  const supported=new Set(['anchor','wolf_twins','eagle','eagle_stand','owl','rose','dolphin_rider','tripod','boar','boar_charging','boar_head','torc','helmet','spear','spearhead','standard','tanit','star','sun','rosette','wheel','sun_disc','sun_wheel','crescent','star_crescent','spiral','triskele','triskelion','horse','galloping_horse','horse_head','horse_grazing','horse_lyre','rider','bull','bull_head','lion','lion_head','wolf','bear','raven','bird','stag','deer','griffin','snake','serpent','elephant','ibex','ram_head','ostrich','camel','chariot','fish','dolphin','palm','incense_altar','pomegranate','grain_ear','grape','thunderbolt','club','lyre','labyrinth','pegasus','sphinx','sica','shield','bow','axe','draco','fleece','macedonian_shield','fire_altar','mountain_peak','cornucopia','mountain','fire','lotus','meander','ship','pyramid','oak','wreath']);
  for(const [id,entry] of Object.entries(factions)) {
    requireValue(ids.has(id) && object(entry) && Object.keys(entry).every(k=>k==='color'||k==='emblem'), 'Unknown faction or non-presentation override');
    requireValue(typeof entry['color']==='string' && /^#[0-9a-f]{6}$/i.test(entry['color']), 'Invalid presentation color');
    const emblem=entry['emblem'];requireValue(object(emblem), 'Missing emblem');
    requireValue(typeof emblem['motif']==='string' && supported.has(emblem['motif']) && typeof emblem['monogram']==='string', 'Unsupported emblem motif');
    requireValue(['attested_motif','later_regional_motif','original_design'].includes(emblem['basis'] as string), 'Missing emblem evidence classification');
    requireValue(typeof emblem['note']==='string' && emblem['note'].length>0 && Array.isArray(emblem['sourceKeys']), 'Missing emblem evidence note');
    requireValue(emblem['basis']==='original_design'||emblem['sourceKeys'].length>0, 'Documented/adapted motifs require sources');
    for(const key of emblem['sourceKeys']) {
      requireValue(typeof key==='string' && object(sources[key]), 'Unknown emblem evidence source');
      const source=sources[key];requireValue(typeof source['url']==='string' && source['url'].startsWith('https://') && typeof source['title']==='string' && typeof source['evidence']==='string', 'Invalid emblem source');
    }
  }
}
