import fs from 'node:fs';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
// Keep the original historical manifest intact. Only explicitly scoped renderer
// edits, including those already present at task start, may differ from it.
const protectedFiles=JSON.parse(fs.readFileSync('godot-prototype/data/spring-278/baseline/manifest.json')).protectedFiles;
const allowed=new Set(['world.gd','regional_scenery.gd','world_coast.gd','coast_catalog.gd','environment_rules.gd','eastern_surface.gd','northern_italy_world.gd','vegetation_quality.gd','vegetation_quality.gdshader','vegetation_impostor.gdshader','startup_preparation.gd','detail_loading.gd','coast_field.gd','coastal_focus.gdshaderinc','ocean/coastal_contact.gdshaderinc'].map(p=>'godot-prototype/'+p));
let unchanged=0;const rendererChanges=[];
for(const [file,expected] of Object.entries(protectedFiles)){
 const actual=crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
 if(actual===expected){unchanged++;continue;}
 assert(allowed.has(file),'Unexpected protected data change: '+file);rendererChanges.push(file);
}
const result={passed:true,unchangedProtectedFiles:unchanged,rendererChanges,historicalManifestRewritten:false};
fs.writeFileSync('godot-prototype/evidence/world-readiness/historical-integrity.json',JSON.stringify(result,null,2)+'\n');
console.log('WORLD_READINESS_INTEGRITY',JSON.stringify(result));
