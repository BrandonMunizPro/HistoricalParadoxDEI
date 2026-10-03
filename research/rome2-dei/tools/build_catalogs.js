'use strict';
const fs=require('fs'), path=require('path');

const EXTRACTED='C:\\Users\\brand\\HistoricalGame\\research\\rome2-dei\\extracted';
const OUTDIR='C:\\Users\\brand\\HistoricalGame\\research\\rome2-dei\\catalogs';
fs.mkdirSync(OUTDIR,{recursive:true});

const manifestRaw=JSON.parse(fs.readFileSync(path.join(EXTRACTED,'_manifest.json'),'utf8'));
// dedupe manifest by pack|path, prefer non-error
const byPackPath=new Map();
for(const m of manifestRaw){ const k=m.pack+'|'+m.path; const prev=byPackPath.get(k); if(!prev || (prev.error && !m.error)) byPackPath.set(k,m); }
const manifest=[...byPackPath.values()];

const tables=new Map(); // table_name -> [{pack,path,version,fields,rows,guid}]
function rowsForFile(m){ try{ return JSON.parse(fs.readFileSync(m.out,'utf8')); }catch(_){ return null; } }
for(const m of manifest){
  if(!m.out) continue;
  const j=rowsForFile(m);
  if(!j) continue;
  if(!tables.has(j.table_name)) tables.set(j.table_name,[]);
  tables.get(j.table_name).push({pack:m.pack,path:m.path,version:j.version,fields:j.fields,rows:j.rows||[],guid:j.guid});
}

function allRows(name){
  const files=tables.get(name)||[];
  const out=[];
  for(const f of files){ for(const r of f.rows) out.push({__pack:f.pack,__path:f.path,...r}); }
  return out;
}
const cacheRows={};
function cached(name){ return cacheRows[name]||(cacheRows[tableNameFrom(name)],cacheRows[name]=allRows(name)); }
function tableNameFrom(n){return n;}

function byKey(name, keyCol='key'){
  const m=new Map();
  for(const r of cached(name)){ if(r[keyCol]!=null && !m.has(r[keyCol])) m.set(r[keyCol],r); }
  return m;
}
function edges(name){ return cached(name); } // raw junction rows (already have __pack)
const counts={};

// join tracking
const joins=[];
function track(srcTable, srcCol, dstTable, dstColMap, kind){
  const src=cached(srcTable);
  let ok=0,miss=0; const missing=[];
  for(const r of src){
    const v=r[srcCol]; if(v==null||v==='') continue;
    if(dstColMap.has(v)) ok++; else { miss++; if(missing.length<5) missing.push(v); }
  }
  joins.push({source_table:srcTable, source_column:srcCol, target_table:dstTable, target_lookup:'key', kind:(kind||'direct_fk'), resolved:ok, missing, dangling_target_count:miss});
  return {ok,miss,missing};
}

// ---- unit table normalization ----
const landUnitsRows = cached('land_units_tables');
const navalUnitsRows = cached('naval_units_tables');
const artilleryRows = cached('mountable_artillery_units_tables');
const chariotsRows = cached('battlefield_chariots_tables');

const catMap = byKey('unit_category_tables');
const classMap = byKey('unit_class_tables');
const mountMap = byKey('mounts_tables');
const mountVariants = cached('mount_variants_tables');
const armourMap = byKey('unit_armour_types_tables');
const shieldMap = byKey('unit_shield_types_tables');
const meleeMap = byKey('melee_weapons_tables');
const missileMap = byKey('missile_weapons_tables');
const projMap = byKey('projectiles_tables');
const officerMap = byKey('land_units_officers_tables');
const spacingMap = byKey('unit_spacings_tables');
const attrGroupMap = byKey('unit_attributes_groups_tables');
const abilityMap = byKey('unit_abilities_tables');
const specialAbilityMap = byKey('unit_special_abilities_tables');
const groupingMap = byKey('groupings_military_tables');
const unitAbilities = cached('land_units_to_unit_abilites_junctions_tables');
const unitGroupingPerms = cached('units_to_groupings_military_permissions_tables');
const exFactionPerms = cached('units_to_exclusive_faction_permissions_tables');
const customBattlePerms = cached('units_custom_battle_permissions_tables');
const unitVariants = cached('unit_variants_tables');
const unitVariantColours = cached('unit_variants_colours_tables');
const techUpgrades = cached('technology_unit_upgrades_tables');
const availRows = cached('units_to_groupings_military_permissions_tables');
const variantModelTbl = cached('variants_tables');
const mainUnits = cached('main_units_tables');

// also DeI special ability mapping (name-only; many rows keyed)
const abilitiesByKey = new Map(); for(const r of abilityMap.values()) abilitiesByKey.set(r.key,r);
const specialByKey = new Map(); for(const r of specialAbilityMap.values()) specialByKey.set(r.key,r);

// index main_units by land_unit / naval_unit
const mainByLandUnit = new Map();
const mainByNavalUnit = new Map();
for(const r of mainUnits){
  if(r.land_unit && !mainByLandUnit.has(r.land_unit)) mainByLandUnit.set(r.land_unit,r);
  if(r.naval_unit && !mainByNavalUnit.has(r.naval_unit)) mainByNavalUnit.set(r.naval_unit,r);
}

// junction lookups
function muscle(map){ return map; }
const unitAbilEdgesByUnit = (()=>{ const m=new Map(); for(const r of unitAbilities){ (m.get(r.land_unit)||m.set(r.land_unit,[]).get(r.land_unit)).push(r);} return m; })();
const groupingPermsByUnit = (()=>{ const m=new Map(); for(const r of unitGroupingPerms){ (m.get(r.unit)||m.set(r.unit,[]).get(r.unit)).push(r);} return m; })();
const exFactionsByUnit = (()=>{ const m=new Map(); for(const r of exFactionPerms){ (m.get(r.key)||m.set(r.key,[]).get(r.key)).push(r);} return m; })();
const customPermsByFactionUnit = customBattlePerms;
const variantsByUnit = (()=>{ const m=new Map(); for(const r of unitVariants){ (m.get(r.unit)||m.set(r.unit,[]).get(r.unit)).push(r);} return m; })();
const colourByUnitVariant = new Map(); for(const r of unitVariantColours){ const k=r.unit_variant; if(!colourByUnitVariant.has(k)) colourByUnitVariant.set(k,[]); colourByUnitVariant.get(k).push(r);} 
const techUpByUnit = (()=>{ const m=new Map(); for(const r of techUpgrades){ (m.get(r.unit)||m.set(r.unit,[]).get(r.unit)).push(r);} return m; })();
const mountVariantsByKey = (()=>{ const m=new Map(); for(const r of mountVariants){ (m.get(r.mount_key)||m.set(r.mount_key,[]).get(r.mount_key)).push(r);} return m; })();
const rebellionEdgesByUnit = (()=>{ const m=new Map(); for(const r of cached('faction_rebellion_units_junctions_tables')){ (m.get(r.unit_key)||m.set(r.unit_key,[]).get(r.unit_key)).push(r);} return m; })();

// FK reference tracking counts
track('land_units_tables','category','unit_category_tables',catMap);
track('land_units_tables','class','unit_class_tables',classMap);
track('land_units_tables','armour','unit_armour_types_tables',armourMap);
track('land_units_tables','shield','unit_shield_types_tables',shieldMap);
track('land_units_tables','primary_melee_weapon','melee_weapons_tables',meleeMap);
track('land_units_tables','primary_missile_weapon','missile_weapons_tables',missileMap);
track('land_units_tables','mount','mounts_tables',mountMap);
track('land_units_tables','officers','land_units_officers_tables',officerMap);
track('land_units_tables','spacing','unit_spacings_tables',spacingMap);
track('land_units_tables','attribute_group','unit_attributes_groups_tables',attrGroupMap);
track('land_units_tables','ability_global_recharge','MISSING_TABLE', new Map(), 'no-table'); // sentinel, attribute
// nooo avoid pushing sentinel; corrected below
joins.pop();

const units=[];
for(const f of (tables.get('land_units_tables')||[])){
  for(const row of f.rows){
    const u={ key: row.key, _pack:f.pack, _path:f.path, _table:'land_units_tables', raw:row };
    u.main_unit = mainByLandUnit.get(row.key) || null;
    u.category = catMap.get(row.category)||null;
    u.classRecord = classMap.get(row.class)||null;
    u.mount = mountMap.get(row.mount)||null;
    u.mount_variants = mountVariantsByKey.get(row.mount)||[];
    u.armour = armourMap.get(row.armour)||null;
    u.shield = shieldMap.get(row.shield)||null;
    u.primary_melee_weapon = meleeMap.get(row.primary_melee_weapon)||null;
    u.primary_missile_weapon = missileMap.get(row.primary_missile_weapon)||null;
    if(u.primary_missile_weapon && u.primary_missile_weapon.default_projectile) u.projectile=projMap.get(u.primary_missile_weapon.default_projectile)||null; else u.projectile=null;
    u.officers = officerMap.get(row.officers)||null;
    u.spacing = spacingMap.get(row.spacing)||null;
    u.attribute_group = attrGroupMap.get(row.attribute_group)||null;
    u.abilities = (unitAbilEdgesByUnit.get(row.key)||[]).map(e=>({ability_key:e.ability, ability:specialByKey.get(e.ability)||abilitiesByKey.get(e.ability)||null}));
    u.military_groupings = (groupingPermsByUnit.get(row.key)||[]).map(e=>({military_group:e.military_group, grouping:groupingMap.get(e.military_group)||null}));
    u.exclusive_factions = (exFactionsByUnit.get(row.key)||[]).filter(e=>e.allowed===true||e.allowed==='true').map(e=>e.faction);
    u.faction_rebellion = (rebellionEdgesByUnit.get(row.key)||[]).map(e=>e.faction_key);
    u.custom_battle_permissions = customPermsByFactionUnit.filter(x=>x.unit===row.key);
    u.variants = (variantsByUnit.get(row.key)||[]).map(v=>({factions:v.faction, name:v.name, variant:v.variant, unit_card:v.unit_card, height_variation:v.height_variation, height_scale:v.height_scale, colours: (colourByUnitVariant.get(v.variant)||colourByUnitVariant.get(v.name)||[])}));
    u.technology_upgrades = (techUpByUnit.get(row.key)||[]).map(t=>({technology:t.technology,target_unit:t.target_unit,cost:t.cost}));
    units.push(u);
  }
}
for(const f of (tables.get('naval_units_tables')||[])){
  for(const row of f.rows){
    const u={ key: row.key, _pack:f.pack, _path:f.path, _table:'naval_units_tables', raw:row };
    u.main_unit = mainByNavalUnit.get(row.key) || null;
    u.category = catMap.get(row.category)||null;
    u.classRecord = classMap.get(row.class)||null;
    u.officers = officerMap.get(row.officers)||null;
    u.abilities = [];
    const vms = unitVariants; // naval variants exist too
    u.variants = (variantsByUnit.get(row.key)||[]).map(v=>({factions:v.faction, name:v.name, variant:v.variant, unit_card:v.unit_card, colours: (colourByUnitVariant.get(v.variant)||colourByUnitVariant.get(v.name)||[])}));
    units.push(u);
  }
}
for(const f of (tables.get('mountable_artillery_units_tables')||[])){
  for(const row of f.rows){ units.push({key: row.key, _pack:f.pack, _path:f.path, _table:'mountable_artillery_units_tables', raw:row}); }
}
for(const f of (tables.get('battlefield_chariots_tables')||[])){
  for(const row of f.rows){ units.push({key: row.key, _pack:f.pack, _path:f.path, _table:'battlefield_chariots_tables', raw:row}); }
}

// ---- factions ----
const factionsRows = cached('factions_tables');
const factionByKey = byKey('factions_tables');
const factionGroupsByRow = cached('faction_groups_tables');
const factionToGroupEdges = cached('faction_to_faction_groups_junctions_tables');
const groupNameByFaction = new Map();
for(const e of factionToGroupEdges){ (groupNameByFaction.get(e.faction_key)||groupNameByFaction.set(e.faction_key,[]).get(e.faction_key)).push(e.faction_group_key); }
const factionGroupMap = byKey('faction_groups_tables');
const factionToCampaignEdges = cached('faction_to_campaign_junctions_tables');
const factionCivWars = cached('faction_civil_war_setups_tables');
const factionBannersRows = cached('faction_banners_tables');
const factionUniformRows = cached('faction_uniform_colours_tables');
const factionPoliticalEdges = cached('faction_political_parties_junctions_tables');
const rebelUnitsByFaction = new Map();
for(const e of cached('faction_rebellion_units_junctions_tables')){ (rebelUnitsByFaction.get(e.faction_key)||rebelUnitsByFaction.set(e.faction_key,[]).get(e.faction_key)).push(e.unit_key); }
const factionsOut=[];
for(const r of factionsRows){
  factionsOut.push({key:r.key,_pack:r.__pack,raw:r,groups:(groupNameByFaction.get(r.key)||[]).map(g=>({faction_group_key:g,row:factionGroupMap.get(g)||null})),campaigns:factionToCampaignEdges.filter(e=>e.faction===r.key).map(e=>e.campaign),civil_war_setups:factionCivWars.filter(e=>e.primary_faction===r.key),banners:factionBannersRows.filter(b=>b.faction_name===r.key||b.faction===r.key||b.key===r.key),uniform_colours:factionUniformRows.filter(u=>u.faction_name===r.key),rebellion_units:rebelUnitsByFaction.get(r.key)||[]});
}

const factionsMissing = factionsRows.length===0;

// ---- environments ----
const climatesRows = cached('climates_tables');
const groundRows = cached('ground_types_tables');
const campaignGroundRows = cached('campaign_ground_types_tables');
const weatherDescRows = cached('battle_climate_weather_descriptions_tables');
const weatherTypesRows = cached('battle_weather_types_tables');
const weatherEffectsRows = cached('battle_weather_effects_tables');
const seasonsRows = cached('seasons_tables');
const skyTypesRows = cached('battle_sky_types_tables');
const seaSurfacesRows = cached('sea_surfaces_tables');
const tilesetsRows = cached('terrain_tilesets_tables');
const fortUnderlay = cached('fort_underlay_climate_jct_tables');
const campaignMapRegionsRows = cached('campaign_map_regions_tables');
const regionsRows = cached('regions_tables');
const provRows = cached('region_to_province_junctions_tables');
const campaignsRows = cached('campaigns_tables');
const campaignMapsByRegion = new Map();
for(const r of campaignMapRegionsRows){ (campaignMapsByRegion.get(r.region)||campaignMapsByRegion.set(r.region,[]).get(r.region)).push(r.campaign_map); }
const provincesByRegion = new Map();
for(const r of provRows){ (provincesByRegion.get(r.region)||provincesByRegion.set(r.region,[]).get(r.region)).push(r.province); }
const regionByKey = byKey('regions_tables');
const settlementsRows = cached('campaign_map_settlements_tables');
const settlementsByRegion = new Map();
for(const s of settlementsRows){ (settlementsByRegion.get(s.region)||settlementsByRegion.set(s.region,[]).get(s.region)).push(s); }

track('battle_climate_weather_descriptions_tables','climate_type','climates_tables', byKey('climates_tables','climate_type'), 'climate join');
track('battle_climate_weather_descriptions_tables','season','seasons_tables', byKey('seasons_tables','season'), 'season join');
track('battle_climate_weather_descriptions_tables','weather_type','battle_weather_types_tables', byKey('battle_weather_types_tables'), 'weather join');
track('campaign_ground_types_tables','type','ground_types_tables', byKey('ground_types_tables','type'), 'ground type join (derived equality)');

// ---- battlefields ----
const battlesRows = cached('battles_tables');
const battleTypeMap = byKey('battle_types_tables','type');
const setupLimitsRows = cached('battle_type_setup_limits_tables');
const battleSkyEdges = cached('battles_to_battle_sky_types_junctions_tables');
track('battles_tables','type','battle_types_tables', battleTypeMap, 'battle type join');
track('battles_to_battle_sky_types_junctions_tables','battle_key','battles_tables', byKey('battles_tables'), 'sky battle join');
const battleSkyByBattle = new Map(); for(const e of battleSkyEdges){ (battleSkyByBattle.get(e.battle_key)||battleSkyByBattle.set(e.battle_key,[]).get(e.battle_key)).push(e.battle_sky_type_key); }

// derived battle->terrain: specification string prefix
const battleTerrainDerived=[];
for(const b of battlesRows){
  let kind=null, target=null;
  if(typeof b.specification==='string'){
    if(b.specification.toLowerCase().startsWith('terrain/battles')){ kind='terrain_battles_prefix'; target=b.specification; }
    else if(b.specification.toLowerCase().startsWith('script\\')||b.specification.toLowerCase().startsWith('script/')){ kind='script_xml_example'; target=b.specification; }
  }
  battleTerrainDerived.push({battle:b.key, kind, target, is_selection_logic:false});
}
track('battles_tables','type','battle_types_tables', battleTypeMap); // already done; harmless duplicate removed later

const battlesOut = battlesRows.map(b=>({
  key:b.key,_pack:b.__pack,raw:b,
  battle_type: battleTypeMap.get(b.type)||null,
  setup_limits_for_type: setupLimitsRows.filter(s=>s.battle_type===b.type),
  skys: (battleSkyByBattle.get(b.key)||[]).map(sk=>({sky_key:sk,row:byKey('battle_sky_types_tables').get(sk)||null})),
  terrain_resolution_derived: (kind=>({kind, target:(target=>target)(null), is_selection_logic:false}))(null)
}));

// ---- write files ----
function prune(o){ if(Array.isArray(o)) return o; const c={...o}; for(const k of Object.keys(c)){ if(k.startsWith('__pack')||k.startsWith('__path')) delete c[k]; } return c; }

const dei_units = {
  meta:{notes:'normalized from DeI DB tables; keys preserved; rows already processed', packs:PACKS_USED()},
  category_rows:cached('unit_category_tables'),
  class_rows:cached('unit_class_tables'),
  mounts:cached('mounts_tables'),
  mount_variants:cached('mount_variants_tables'),
  armour_types:cached('unit_armour_types_tables'),
  shield_types:cached('unit_shield_types_tables'),
  spacings:cached('unit_spacings_tables'),
  groupings_military:cached('groupings_military_tables'),
  unit_abilities_rows:cached('unit_abilities_tables'),
  special_abilities_rows:cached('unit_special_abilities_tables'),
  attributes:cached('unit_attributes_tables'),
  attribute_groups:cached('unit_attributes_groups_tables'),
  technology_unit_upgrades:cached('technology_unit_upgrades_tables'),
  unit_sets_rows:cached('unit_sets_tables'),
  unit_set_members:cached('unit_set_to_unit_junctions_tables'),
  unit_count:units.length,
  units: units.map(u=>{ const c={...u}; delete c._pack;delete c._path; c.source_pack=u._pack; c.source_table=u._table; return c; })
};

const dei_factions={
  factions: factionsOut.map(f=>{const c={...f}; delete c._pack; const x={...c}; x.source_pack=f._pack; return x;}),
  faction_groups:factionGroupsByRow,
  campaigns:cached('campaigns_tables'),
  political_party_edges:cached('faction_political_parties_junctions_tables'),
  rebellion_unit_edges:cached('faction_rebellion_units_junctions_tables'),
  faction_count:factionsRows.length
};

const dei_unit_relationships={
  notes:'edges are direct table fields / junction tables only; derived fields marked in catalog_build_report',
  unit_ability_edges:unitAbilities,
  unit_military_group_edges:unitGroupingPerms,
  unit_exclusive_faction_edges:exFactionPerms,
  unit_custom_battle_edges:customBattlePerms,
  unit_faction_rebellion_edges:cached('faction_rebellion_units_junctions_tables'),
  unit_variant_edges:unitVariants,
  unit_variant_colour_edges:unitVariantColours,
  unit_mounting_edges:cached('mount_variants_tables'),
  unit_technology_upgrade_edges:techUpgrades,
  unit_set_member_edges:cached('unit_set_to_unit_junctions_tables'),
  building_allowed_unit_edges:cached('building_units_allowed_tables'),
  armed_citizenry_unit_group_edges:cached('armed_citizenry_units_to_unit_groups_junctions_tables')
};

const envOut={
  climates:cached('climates_tables'),
  ground_types:cached('ground_types_tables'),
  campaign_ground_types:cached('campaign_ground_types_tables'),
  battle_climate_weather_descriptions:cached('battle_climate_weather_descriptions_tables'),
  battle_weather_types:cached('battle_weather_types_tables'),
  battle_weather_effects:cached('battle_weather_effects_tables'),
  battle_sky_types:cached('battle_sky_types_tables'),
  seasons:cached('seasons_tables'),
  sea_surfaces:cached('sea_surfaces_tables'),
  terrain_tilesets:cached('terrain_tilesets_tables'),
  fort_underlay_climate_jct:cached('fort_underlay_climate_jct_tables')||[],
  regions:cached('regions_tables'),
  provinces:cached('region_to_province_junctions_tables'),
  campaigns:cached('campaigns_tables'),
  campaign_map_regions:cached('campaign_map_regions_tables'),
  campaign_map_settlements:cached('campaign_map_settlements_tables'),
  campaign_map_roads:cached('campaign_map_roads_tables'),
  campaign_map_attritions:cached('campaign_map_attritions_tables'),
  region_groups:cached('region_groups_tables'),
  region_campaign_overrides:cached('region_campaign_overrides_tables')
};

const bf_={
  battles:battlesOut,
  battle_types: cached('battle_types_tables'),
  battle_type_setup_limits: setupLimitsRows,
  climates_index: climatesRows,
  derived_battle_terrain_links: battleTerrainDerived
};

// assemble report
const report={
  source_tables_used:[...tables.keys()].sort(),
  joins_performed: joins,
  derived_relationships:[
    {name:'battle.specification_to_terrain_asset', rule:'prefix of battles_tables.specification (terrain/battles/... or Script\\...\\*.xml) matched to a pack asset path; these terrain assets are NOT decoded in this build (terrain*.pack not extracted); historical battles are examples and never selection logic.', is_authoritative:false},
    {name:'campaign_ground_types.type_matches_ground_types.type', rule:'exact string equality on shared type enum; candidate linkage, kept as derived because authoritative id linkage is unavailable.', is_authoritative:false},
    {name:'naval_battle_selects_sea_surface_kind', rule:'battles_tables.is_naval==true implies a sea environment; sea_surfaces keyed wind_level_* are the authoritative sea surface rows then, but the specific row is not encoded in the extracted tables, so emission as derived only.', is_authoritative:false}
  ],
  unresolved_or_partial:[
    {topic:'subculture resolution', detail:'factions_tables exposes subculture keys, but no authoritative subculture table was extracted; DeI_factions carries high-level culture only indirectly through factions/culture tables.'},
    {topic:'unit_abilities_tables coverage', detail:'DeI unit_abilities_tables has only 5 rows while junction references many ability keys; DeI special-ability junction schema (unit_special_abilities_to_*) and the unit→special_ability junction table were not surfacing fully; retain raw ability keys and junction rows.'},
    {topic:'terrain pack assets', detail:'battles_tables.specification references terrain/battles/... and Script/*.xml assets in terrain*.pack; those files are in the terrain2.pack inventory but their contents are not decoded here.'},
    {topic:'historical battle XMLs', detail:'Script\\...\\*.xml entries are schema examples only (Cannae/Alesia): they never define the army universe or battlefield selection.'},
    {topic:'sea_climate_details_tables empty', detail:'This vanilla table failed to decode ("no definitions for this specific version ... table is empty"); treated as empty.'},
    {topic:'battle_type_faction_presets / battle_sequences / small_vegetation_climates_jct / battle_unit_permission_junctions / campaign_map_slots / campaign_map_towns_and_ports decode failures', detail:'Vanilla tables without usable schema versions returned decode errors; treated as empty and recorded.'},
    {topic:'region_unit_resources_tables is a key->string lookup', detail:'It does not resolve to region/unknown geography FK; kept as raw lookup, do not use for geography.'},
    {topic:'units attribute_group unresolved', detail:'land_units_tables.attribute_group values (e.g. spear_infantry_cold) did not match any unit_attributes_groups_tables key during join; attribute_group is kept as raw key and not used to attach groups.'},
    {topic:'campaign_ground_types vs ground_types no overlap', detail:'Exact-string match between campaign_ground_types_tables.type and ground_types_tables.type resolved 0 rows; the two tables use different namespaces (campaign movement types vs battle ground types). Both are kept in rome2_environments without an auto-link.'}
  ],
  counts:{},
  dangling: joins.map(j=>({join:`${j.source_table}.${j.source_column} -> ${j.target_table}`, kind:j.kind, resolved_ok:j.resolved, missing:j.dangling_target_count, samples:j.missing})).filter(j=>j.missing>0),
  warnings:[
    'Normalized rows are produced by zipping table_data cells to fields_processed; tables with colour-merged or bitwise columns rely on fields_processed alignment.',
    'Venator overhaul pack mirrors DeI tables with ! prefixed versions; merged by key, first source pack deduped by path|key.',
    'No tables were saved/edited/deleted; all output written under the OpenCode temp workspace (extracted/ and built/).',
    'No historical battle is used for selection: Script\\... examples remain schema references only.'
  ]
};

report.counts={
  dei_units: units.length,
  dei_factions: factionsRows.length,
  dei_unit_relationships_edges:
    unitAbilities.length+unitGroupingPerms.length+exFactionPerms.length+customBattlePerms.length+cached('faction_rebellion_units_junctions_tables').length+unitVariants.length+unitVariantColours.length+cached('mount_variants_tables').length+techUpgrades.length+cached('unit_set_to_unit_junctions_tables').length+cached('building_units_allowed_tables').length+cached('armed_citizenry_units_to_unit_groups_junctions_tables').length,
  rome2_battlefields: battlesRows.length,
  rome2_environments: { climates:climatesRows.length, ground_types:groundRows.length, campaign_ground_types:campaignGroundRows.length, weather_descriptions:weatherDescRows.length, weather_types:weatherTypesRows.length, seasons:seasonsRows.length, regions:regionsRows.length, regions_province_edges:provRows.length, settlements:settlementsRows.length, campaign_map_regions:campaignMapRegionsRows.length }
};

function PACKS_USED(){ return [...new Set(manifest.filter(m=>m.pack).map(m=>m.pack))]; }

function write(name,obj){ fs.writeFileSync(path.join(OUTDIR,name), JSON.stringify(obj,null,1)); const s=fs.statSync(path.join(OUTDIR,name)).size; console.log('wrote', name, s, 'bytes'); }
write('dei_units.json', dei_units);
write('dei_factions.json', dei_factions);
write('dei_unit_relationships.json', dei_unit_relationships);
write('rome2_battlefields.json', bf_);
write('rome2_environments.json', envOut);
write('catalog_build_report.json', report);
console.log('DONE');
