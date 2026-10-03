'use strict';
const fs=require('fs'),p='C:\\Users\\brand\\HistoricalGame\\research\\rome2-dei\\catalogs\\';
const R=JSON.parse(fs.readFileSync(p+'catalog_build_report.json','utf8'));
console.log('REPORT counts:', JSON.stringify(R.counts));
console.log('joins with dangling>0 (derived/weak):');
for(const j of R.dangling) console.log('  ', j.join, '| kind=', j.kind, '| resolved_ok=', j.resolved_ok, '| missing=', j.missing, '| samples=', (j.samples||[]).slice(0,3).join('; '));

const U=JSON.parse(fs.readFileSync(p+'dei_units.json','utf8'));
console.log('dei_units.units:', U.units.length);
let noCat=0,noCls=0,noArm=0,noWeap=0,noMount=0,noAbility=0,noGroup=0,noExF=0,noVar=0;
for(const u of U.units){
  if(!u.category) noCat++;
  if(!u.classRecord) noCls++;
  if(!u.armour) noArm++;
  if(!u.primary_melee_weapon && !u.primary_missile_weapon) noWeap++;
  if(!u.mount) noMount++;
  if(!u.abilities||!u.abilities.length) noAbility++;
  if(!u.military_groupings||!u.military_groupings.length) noGroup++;
  if(!u.exclusive_factions||!u.exclusive_factions.length) noExF++;
  if(!u.variants||!u.variants.length) noVar++;
}
console.log({noCat,noCls,noArm,noWeap,noMount,noAbility,noGroup,noExF,noVar});
const a=U.units.find(u=>u.key&&u.key.includes('Ita_Hastati'))||U.units[0];
console.log('sample unit:', JSON.stringify({key:a.key, category:a.category&&a.category.key, class:a.classRecord?{key:a.classRecord.key,name:a.classRecord.localised_name||a.classRecord.name}:null, mount:a.mount&&a.mount.key, armour:a.armour&&a.armour.key, weapon:(a.primary_melee_weapon&&a.primary_melee_weapon.key), abilities:(a.abilities||[]).map(x=>x.ability_key), groupings:(a.military_groupings||[]).map(g=>g.military_group), excl_factions_sample:(a.exclusive_factions||[]).slice(0,4), num_variants:(a.variants||[]).length, techUps:(a.technology_upgrades||[]).length, main_unit_key:a.main_unit&&a.main_unit.unit},null,1).slice(0,900));

const F=JSON.parse(fs.readFileSync(p+'dei_factions.json','utf8'));
console.log('dei_factions.factions:', F.factions.length);
const ff=F.factions[0];
console.log('faction[0] keys:', Object.keys(ff), '| key=',ff.key, 'groups=',ff.groups.length, 'campaigns=',ff.campaigns.length, 'rebellion_units=',ff.faction?ff:undefined);

const B=JSON.parse(fs.readFileSync(p+'rome2_battlefields.json','utf8'));
console.log('battles:', B.battles.length, '| first battle keys:', Object.keys(B.battles[0]));
console.log('battle0:', JSON.stringify({key:B.battles[0].key, type:B.battles[0].battle_type&&B.battles[0].battle_type.type, skys:(B.battles[0].skys||[]).map(s=>s.sky_key), num_setup_limits:(B.battles[0].setup_limits_for_type||[]).length},null,1));

const E=JSON.parse(fs.readFileSync(p+'rome2_environments.json','utf8'));
console.log('env climates:', E.climates.length, 'ground_types:', E.ground_types.length, 'regions:', E.regions.length, 'weather_desc:', E.battle_climate_weather_descriptions.length, 'campaign_ground_types:', E.campaign_ground_types.length);
console.log('OK check complete');
