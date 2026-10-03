'use strict';
const fs=require('fs');
const D='C:\\Users\\brand\\HistoricalGame\\research\\rome2-dei\\catalogs\\';
const F=JSON.parse(fs.readFileSync(D+'dei_factions.json','utf8'));
let max=null; for(const f of F.factions){ if(f.rebellion_units && (!max || f.rebellion_units.length>max.rebellion_units.length)) max=f; }
console.log('faction with most rebellion_units:', max && max.key, (max&&max.rebellion_units.length), (max&&max.rebellion_units.slice(0,3).join(', ')));
const B=JSON.parse(fs.readFileSync(D+'rome2_battlefields.json','utf8'));
console.log('battle0 keys:', Object.keys(B.battles[0]).join(','));
const R=JSON.parse(fs.readFileSync(D+'catalog_build_report.json','utf8'));
const kinds={}; for(const j of R.joins_performed) kinds[j.kind]=(kinds[j.kind]||0)+1;
console.log('join kinds:', JSON.stringify(kinds));
console.log('unresolveds:', R.unresolved_or_partial.length);
for(const u of R.unresolved_or_partial) console.log('  -', u.topic);
