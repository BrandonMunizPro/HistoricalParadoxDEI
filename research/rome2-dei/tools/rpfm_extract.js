'use strict';
const M = require('./rpfm_mcp.js');
const fs = require('fs');
const path = require('path');

const ROME2 = 'C:\\Program Files (x86)\\Steam\\steamapps\\common\\Total War Rome II\\data';
const DEI = 'C:\\Program Files (x86)\\Steam\\steamapps\\workshop\\content\\214950';
const PACKS = [
  { key: 'vanilla_data', path: `${ROME2}\\data.pack` },
  { key: 'dei_part1', path: `${DEI}\\362473569\\___divide_et_impera_010_part1.pack` },
  { key: 'dei_part2', path: `${DEI}\\1405475000\\___divide_et_impera_010_part9.pack` },
  { key: 'dei_part3', path: `${DEI}\\1405479496\\___divide_et_impera_010_part10.pack` },
  { key: 'dei_venator', path: `${DEI}\\3349117467\\@DEI_Venator_Realistic_Combat_Overhaul.pack` },
];
const OUT = 'C:\\Users\\brand\\HistoricalGame\\research\\rome2-dei\\extracted';

const DEI_TABLES = ['land_units_tables','main_units_tables','naval_units_tables','mountable_artillery_units_tables','land_units_officers_tables','battlefield_chariots_tables','unit_sets_tables','unit_set_to_unit_junctions_tables','armed_citizenry_units_to_unit_groups_junctions_tables','armed_citizenry_unit_groups_tables','unit_category_tables','unit_class_tables','unit_variants_tables','variants_tables','unit_variants_colours_tables','mounts_tables','mount_variants_tables','ship_dbs_tables','melee_weapons_tables','missile_weapons_tables','missile_weapons_to_projectiles_junctions_tables','projectiles_tables','projectiles_explosions_tables','naval_weapons_tables','naval_fire_junctions_tables','unit_armour_types_tables','unit_shield_types_tables','unit_abilities_tables','land_units_to_unit_abilites_junctions_tables','unit_special_abilities_tables','unit_special_abilities_to_concepts_junctions_tables','unit_special_abilities_to_secondary_effects_junctions_tables','unit_spacings_tables','groupings_military_tables','units_to_groupings_military_permissions_tables','commander_unit_permissions_tables','units_to_exclusive_faction_permissions_tables','unit_ground_type_movement_modifiers_tables','region_unit_resources_tables','unit_required_technology_junctions_tables','building_units_allowed_tables','unit_attributes_tables','unit_attributes_groups_tables','unit_attributes_to_groups_junctions_tables','unit_experience_thresholds_tables','unit_experience_threshold_modifiers_tables','unit_experience_bonuses_tables','ui_unit_stats_tables','ui_unit_stat_to_classes_tables','unit_weights_tables','unit_fatigue_effects_tables','spotting_and_hiding_values_tables','ground_type_to_stat_effects_tables','technology_unit_upgrades_tables','faction_tables','factions_tables','faction_groups_tables','faction_to_faction_groups_junctions_tables','faction_to_campaign_junctions_tables','factions_rebellion_units_junctions_tables','faction_rebellion_units_junctions_tables','faction_civil_war_setups_tables','faction_to_culture_junctions_tables','faction_banners_tables','faction_uniform_colours_tables','faction_political_parties_junctions_tables','faction_politics_government_actions_junctions_tables','culture_subculture_politics_government_types_tables','culture_settlement_occupation_options_tables'];

const ROME2_TABLES=['battles_tables','battle_types_tables','battle_type_setup_limits_tables','battle_type_faction_presets_tables','battle_unit_permission_junctions_tables','units_custom_battle_permissions_tables','battles_to_battle_sky_types_junctions_tables','battle_sky_types_tables','climates_tables','battle_climate_weather_descriptions_tables','battle_weather_types_tables','battle_weather_effects_tables','ground_types_tables','campaign_ground_types_tables','terrain_tilesets_tables','campaign_map_regions_tables','campaign_map_settlements_tables','campaign_map_slots_tables','campaign_map_playable_areas_tables','campaign_map_roads_tables','campaign_map_attritions_tables','campaign_map_towns_and_ports_tables','campaigns_tables','regions_tables','region_to_province_junctions_tables','regions_continents_tables','region_groups_tables','region_campaign_overrides_tables','region_unit_resources_tables','historical_battles_ui_locations_tables','sea_climate_details_tables','sea_surfaces_tables','battle_terrain_farms_tables','battlefield_buildings_tables','battlefield_buildings_names_tables','battlefield_engines_tables','battlefield_siege_vehicles_tables','battlefield_siege_vehicles_custom_battles_tables','battle_cities_tables','battle_cameras_tables','deployables_tables','deployables_custom_battles_tables','battle_personalities_tables','battle_sequences_tables','fort_underlay_climate_jcts_tables','small_vegetation_climates_jct_tables','seasons_tables','season_province_effect_bundles_tables','start_pos_region_slot_templates_tables'];

const unwrap=(r)=>{const t=M.renderToolResult(r);const i=t.indexOf('--- structuredContent ---');const b=i>=0?t.slice(i).split('\n').slice(1).join('\n'):t;try{return JSON.parse(b);}catch(_){return t;};};
const log=(...a)=>{const msg=a.map(x=>typeof x==='string'?x:JSON.stringify(x)).join(' ');console.log(new Date().toISOString().slice(11,19),msg);fs.appendFileSync(path.join(OUT,'progress.log'), new Date().toISOString().slice(11,19)+' '+msg+'\n');};
function* strs(v){ if(typeof v==='string') yield v; else if(Array.isArray(v)) for(const e of v) yield* strs(e); else if(v&&typeof v==='object') for(const k of Object.keys(v)) yield* strs(v[k]); }
const cellValue=(c)=>{ if(c&&typeof c==='object'){ const k=Object.keys(c)[0]; return c[k]; } return c; };

(async()=>{
  fs.mkdirSync(OUT,{recursive:true});
  fs.writeFileSync(path.join(OUT,'progress.log'),'');
  const manifestPath=path.join(OUT,'_manifest.json');
  let manifest=[];
  if(fs.existsSync(manifestPath) && process.argv.includes('--resume')){ try{manifest=JSON.parse(fs.readFileSync(manifestPath,'utf8'));}catch(_){manifest=[];} }
  const doneSet=new Set(manifest.filter(m=>m.out).map(m=>m.pack+'|'+m.path));
  const fieldsCache={}; // table_name|version -> names[]

  await M.init(); log('init ok');
  try{ unwrap(await M.callTool('set_game_selected',{game_name:'rome_2',rebuild_dependencies:false},600000)); log('set_game ok'); }catch(e){ log('set_game ERROR:', e.message); }
  try{ unwrap(await M.callTool('update_schemas',{},1800000)); log('schemas updated'); }catch(e){ log('update_schemas ERROR:', e.message); }
  try{ log('is_schema_loaded:', JSON.stringify(unwrap(await M.callTool('is_schema_loaded',{},120000)))); }catch(e){ log('is_schema ERROR:', e.message); }

  const openKeys=[];
  for(const p of PACKS){
    try{ unwrap(await M.callTool('open_packfiles',{paths:[p.path]},1800000)); openKeys.push(p.key); log('opened',p.key); }
    catch(e){ log('open ERROR',p.key,e.message); }
  }

  let jobs=[];
  for(const key of openKeys){
    const meta=PACKS.find(p=>p.key===key);
    try{
      const info=unwrap(await M.callTool('open_pack_info',{pack_key:meta.path},900000));
      const allow = key==='vanilla_data' ? new Set(ROME2_TABLES) : new Set(DEI_TABLES);
      const db=[...new Set([...strs(info)].filter(v=>/^db[\\/]/i.test(v)))];
      const cands=db.filter(p=>{const parts=p.split(/[\\/]/); return parts.length>=3 && allow.has(parts[1]);});
      for(const c of cands) jobs.push({key, metaPath:meta.path, path:c});
      log(key,'candidate tables:',cands.length);
    }catch(e){ log('open_pack_info ERROR',key,e.message); }
  }
  log('total jobs:', jobs.length, ' already_done:', doneSet.size);

  let done=0, fail=0, skip=0;
  for(const job of jobs){
    if(doneSet.has(job.key+'|'+job.path)){ skip++; continue; }
    const parts=job.path.split(/[\\/]/); const tableDir=parts[1]; const shard=parts[parts.length-1];
    const outFile=path.join(OUT, `${tableDir}__${shard}__${job.key}.json`.replace(/[^A-Za-z0-9_.-]/g,'_'));
    let dec=null, err=null;
    try{
      dec=unwrap(await M.callTool('decode_packed_file',{pack_key:job.metaPath,path:job.path,source:'PackFile'},1200000));
    }catch(e){ err=e.message; }
    const info=dec&&dec.DBRFileInfo&&dec.DBRFileInfo[0];
    if(!info || typeof info!=="object"){
      const msg = err || (typeof dec==='string' ? dec.slice(0,200) : 'no DBRFileInfo');
      fs.writeFileSync(outFile.replace(/\.json$/,'')+'.error.txt', msg);
      manifest.push({pack:job.key, path:job.path, error:msg}); doneSet.add(job.key+'|'+job.path); fail++;
      fs.writeFileSync(manifestPath, JSON.stringify(manifest,null,2));
      continue;
    }
    const table=info.table||{};
    const fkey = (table.table_name||tableDir)+'|'+(table.definition&&table.definition.version);
    if(!(fkey in fieldsCache)){
      try{
        const proc = unwrap(await M.callTool('fields_processed',{definition: JSON.stringify(table.definition)},1200000));
        let names = Array.isArray(proc) ? proc : (proc && Array.isArray(proc.fields) ? proc.fields : null);
        if(!names && proc && typeof proc==='object'){ const v=Object.values(proc).find(x=>Array.isArray(x)); if(Array.isArray(v)) names=v.map(x=>x && (x.name ?? x.key ?? x)); }
        fieldsCache[fkey]=names || (table.definition&&table.definition.fields?table.definition.fields.map(f=>f.name):[]);
      }catch(e){ log('fields_processed ERR', fkey, e.message); fieldsCache[fkey]=(table.definition&&table.definition.fields?table.definition.fields.map(f=>f.name):[]); }
    }
    const names = fieldsCache[fkey];
    const rowsIn = Array.isArray(table.table_data)?table.table_data:[];
    const rows = rowsIn.map(row=>{ const o={}; for(let i=0;i<names.length && i<row.length;i++){ const fn=names[i]&&(names[i].name!==undefined?names[i].name:names[i])||('f'+i); o[fn]=cellValue(row[i]); } return o; });
    fs.writeFileSync(outFile, JSON.stringify({table_name: table.table_name||tableDir, version: table.definition?table.definition.version:undefined, source_pack: job.key, fields: names, row_count: rows.length, rows}));
    manifest.push({pack:job.key, path:job.path, table_name: table.table_name||tableDir, version: table.definition?table.definition.version:undefined, row_count: rows.length, fields_count: names.length, out: outFile, guid: info.guid});
    doneSet.add(job.key+'|'+job.path); done++;
    if(done%25===0||done-(skip<0?0:0)>=0 && done%25===0) {}
    if(done%5===0) fs.writeFileSync(manifestPath, JSON.stringify(manifest,null,2));
    if(done%25===0) log(`done=${done} fail=${fail} skip=${skip} | ${tableDir}/${shard} rows=${rows.length}`);
  }
  fs.writeFileSync(manifestPath, JSON.stringify(manifest,null,2));
  log(`EXTRACTION COMPLETE done=${done} fail=${fail} skip=${skip} total_manifest=${manifest.length}`);
})().catch(e=>{console.error('FATAL '+e.stack);process.exit(1);});
