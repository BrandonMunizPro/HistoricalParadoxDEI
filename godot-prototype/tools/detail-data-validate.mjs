// Preserve the historical baseline. Only this task's listed renderer scripts
// are permitted to differ; every other previously protected file is hashed.
import fs from 'node:fs';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
const manifest=JSON.parse(fs.readFileSync('godot-prototype/data/spring-278/baseline/manifest.json'));
const rendererChanges=new Set(['godot-prototype/world.gd','godot-prototype/regional_scenery.gd','godot-prototype/world_coast.gd','godot-prototype/coast_catalog.gd','godot-prototype/environment_rules.gd','godot-prototype/eastern_surface.gd','godot-prototype/northern_italy_world.gd','godot-prototype/vegetation_quality.gd','godot-prototype/vegetation_quality.gdshader','godot-prototype/vegetation_impostor.gdshader','godot-prototype/startup_preparation.gd']);
let unchanged=0;const permitted=[];
for(const [file,original] of Object.entries(manifest.protectedFiles)){
  const current=crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
  if(current===original){unchanged++;continue;}
  assert(rendererChanges.has(file),'Unexpected protected change: '+file);
  permitted.push({file,baseline:original,current});
}
const result={passed:true,unchangedProtectedFiles:unchanged,authorizedRendererChanges:permitted,notice:'The historical baseline was not rewritten. The strict historical validator still rejects renderer edits by design. This task explicitly authorizes these renderer changes, while every other protected file must remain byte-identical.'};
fs.writeFileSync('godot-prototype/evidence/detail-readiness/protected-data-validation.json',JSON.stringify(result,null,2)+'\n');
console.log('DETAIL_PROTECTED_DATA_VALIDATION',JSON.stringify(result));
