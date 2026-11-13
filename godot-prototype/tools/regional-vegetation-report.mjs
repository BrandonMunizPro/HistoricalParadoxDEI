import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
const base='godot-prototype/evidence/close-vegetation';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const before=read(base+'/before/profile.json');
const final=read(base+'/final-art/profile.json');
const placement=read(base+'/placement-validation-final-art.json');
const regions=read(base+'/regional-validation.json');
const visuals=read(base+'/visual-validation.json');
const startup=read('godot-prototype/evidence/startup-preparation/validation.json');
const native=read(base+'/native/validation.json');
const protection=read('godot-prototype/evidence/detail-readiness/protected-data-validation.json');
for(const result of [placement,regions,visuals,startup,native,protection])assert(result.passed);
assert(final.trials.every(t=>!t.timedOut&&t.loadingScreens===1));
assert(final.trials.filter(t=>t.name.includes('revisit')).every(t=>t.allNineDelayMs===0));
const comparisons=before.trials.map(old=>{
 const now=final.trials.find(t=>t.name===old.name);assert(now);
 return {name:old.name,before:old,after:now,reductionPercent:100*(1-now.allNineDelayMs/old.allNineDelayMs)};
});
fs.writeFileSync(base+'/summary.json',JSON.stringify({passed:true,comparisons,additionalViews:final.trials.slice(3),startup:final.startup,checks:{regional:regions.checks,placements:placement.checks,native:native.checks.length,startup:startup.checks,buffer:5403},protectedFilesUnchanged:protection.unchangedProtectedFiles},null,2)+'\n');
const n=v=>v.toFixed(2),seconds=ms=>n(ms/1000),mib=bytes=>n(bytes/1048576);
const table=comparisons.map(c=>`| ${c.name} | ${seconds(c.before.centreDelayMs)} / ${seconds(c.after.centreDelayMs)} | ${seconds(c.before.allNineDelayMs)} / ${seconds(c.after.allNineDelayMs)} | ${n(c.reductionPercent)}% |`).join('\n');
const frames=comparisons.map(c=>`| ${c.name} | ${n(c.before.frames.meanMs)} / ${n(c.after.frames.meanMs)} | ${n(c.before.frames.p99Ms)} / ${n(c.after.frames.p99Ms)} | ${n(c.before.frames.maxMs)} / ${n(c.after.frames.maxMs)} | ${c.after.drawCallsAtReady} |`).join('\n');
const memory=comparisons.map(c=>`| ${c.name} | ${mib(c.before.staticBytes)} / ${mib(c.after.staticBytes)} | ${mib(c.before.videoBytes)} / ${mib(c.after.videoBytes)} |`).join('\n');
const extra=final.trials.slice(3).map(t=>`- ${t.name}: centre ${seconds(t.centreDelayMs)} s, all nine ${seconds(t.allNineDelayMs)} s; one initial loading screen total.`).join('\n');
const cold=final.trials.filter(t=>t.name.endsWith('-cold'));
const range=`${seconds(Math.min(...cold.map(t=>t.allNineDelayMs)))}–${seconds(Math.max(...cold.map(t=>t.allNineDelayMs)))}`;
fs.mkdirSync('docs/regional-vegetation',{recursive:true});
fs.writeFileSync('docs/regional-vegetation/REPORT.md',`# Regional vegetation and close-detail loading — 12 November 2026

Textured vegetation now extends beyond the former central-Italy trial. Full close-cell placement density is unchanged. Original 24-tree regional grove populations are retained. Real native measurements reproduce the reported 45–60-second delay, and show a substantial reduction; this is **not** a claim of instant detailed vegetation everywhere.

## Root causes and changes

- Outside 11.5–13.5°E / 40.5–43.5°N, scenery fell back to solid faceted crowns despite an existing licensed, textured asset library. Extend this library through the regional renderer.
- Serial scenery scheduling put coarse regional jobs ahead of eight remaining close cells. Prepare the full close neighbourhood first and cancel obsolete coarse work safely when close detail is missing.
- Each candidate, height/footprint probe and climate lookup repeatedly checked unrelated regional surfaces. Reject out-of-bounds weights early and pass a padded intersecting-region subset through land, climate and scenery elevation sampling. Original scope functions and full-list samplers were compared directly.
- A 4 ms generation allowance per frame stretched CPU work across many seconds, especially in GPU-bound views. Use bounded 8–12 ms live slices, 12 ms under the existing initial cover. This trades some frame time for faster completion; it is not free work or a wholesale worker-thread terrain rewrite.
- Retain up to 36 close cells rather than expiring a recently visited cell after 12 seconds. Placement caches remain on disk. Only immutable MultiMesh buffer packing uses a worker; scene-tree/GPU changes remain on the main thread.
- Warm all 36 local/coarse atlas variants during the existing single startup cover. Camera movement never reopens it. No all-world tree allocation or touring camera is used.

## Artwork and materials

36 asset variants: the existing oak, pine, columnar evergreen, ash and scrub families, plus olive, Scots pine, umbrella-pine adaptation and date-palm geometry. The two newly sourced 3D models are [Innerscene olive, CC0](https://www.innerscene.com/tools/library/3d-parts/mature-olive-tree-bc261a43) and [Innerscene Scots pine, CC0](https://www.innerscene.com/tools/library/3d-parts/mature-scots-pine-tree-280307e1). Local models, atlas renders, native resources, SHA256 manifest and license/provenance notes are in [assets/regional-vegetation](../../godot-prototype/assets/regional-vegetation/ATTRIBUTION.md). Existing EZ-Tree leaf maps are **MIT**, and AmbientCG bark maps are **CC0**; their original notices remain intact.

Following [Godot 4.7 Making Trees](https://docs.godotengine.org/en/4.7/tutorials/shaders/making_trees.html), detailed authoring meshes use double-sided alpha-cut foliage, red vertex-colour wind masks, rooted trunks, transmission/backlighting and separate bark with normal/roughness maps. Campaign rendering retains dense MultiMesh directional impostors baked from 3D sources: eight azimuths, three elevations; new assets use 384-pixel frames. This is not full 3D mesh vegetation at every campaign instance. Close views blend four atlas samples; regional groves use one directional sample to retain full population affordably. Wind uses the shared, pausable/reduced-motion clock, never unrestricted shader TIME. Foliage greens were toned down after inspecting actual screenshots.

Mediterranean existing woodland can select olives and umbrella-pine shapes; northern conifers use Scots pine; northern columnar proxies no longer select the Mediterranean columnar kit. Existing warm/arid palm placements in North Africa/West Asia use the new detailed fronds. Date palms are not substituted into southern India. Selection uses climate/geography presentation families, independent of culture, ownership and playability.

The umbrella pine is an **artistic adaptation**, not a scanned or species-validated Pinus pinea. The columnar evergreen remains a narrowed generated pine, not a botanically validated cypress. The palm is original project-authored geometry. Southern Indian palms retain the existing fallback; South Asian hardwood, steppe and arid acacia-specific kits remain gaps. This work does not reconstruct woodland extent in 278 BCE.

## Actual native timing

RTX 3060 Laptop GPU, Forward+, 1920×1080, uncapped, forced submitted frames while the diagnostic window is hidden. Each route eases from 100 to 2 km over four seconds. Delay is measured from crossing 32 km until the focused cell / all nine close cells are uploaded **and revealed**, not just queued. Placement namespaces are empty for cold travel routes; OS/driver caches are not flushed. The opening area's placement cache was warm. Baseline preloads coast sources; final additionally runs the requested production startup asset preparation before travel. Opening focus is (13,42); the timed Italy view is (12.67,41.73), so it is a separate close-cell neighbourhood. These are single runs, not statistically controlled hardware benchmarks.

| View | Centre seconds, before / final | All nine seconds, before / final | Reduction, all nine |
|---|---:|---:|---:|
${table}

${extra}

Final production-startup preparation took ${seconds(final.startup.startupPreparation.elapsedMs)} seconds inside the initial cover; total cover time was ${seconds(final.startup.blockedMs)} seconds. It warmed ${final.startup.startupPreparation.warmedVariants} reusable vegetation/outcrop variants and two coastline material families. This startup timing includes a warm opening placement cache; a first launch can take longer. See [full measured trace](../../godot-prototype/evidence/close-vegetation/final-art/profile.json) and [baseline](../../godot-prototype/evidence/close-vegetation/before/profile.json).

| View | Streaming mean frame ms, before / final | p99 ms, before / final | Worst frame ms, before / final | Final draw calls at ready |
|---|---:|---:|---:|---:|
${frames}

These frame samples include zoom, terrain streaming and generation; **they are not steady-state FPS measurements**. Hitches remain. Baseline did not record draw calls, so no before/after draw-call claim is made. The isolated sampler/scheduler pass reduced Italy's measured cumulative generation CPU time from 7,411 to 3,503 ms before the artwork rollout; see optimized/profile.json. Full-density textured rendering and the larger cache increase graphics memory use.

| View | Godot-tracked static MiB, before / final | Godot-reported video MiB, before / final |
|---|---:|---:|
${memory}

These are Godot counters, not process working-set measurements. Later resident instance totals include cached invisible cells, so they must not be read as changed visible density. Exact native comparisons of all 27 baseline close-cell caches passed ${placement.checks} checks of transforms, colours, LOD/slope customs and plant/rock counts.

## Verification

- npm test -- --maxWorkers=1: 38 files, 519 tests passed.
- npm run typecheck and npm run build (including smoke/postbuild): passed.
- Regional asset/source manifest: 16 new atlas variants, local GLB signatures and texture files validated.
- Sampler/asset validation: ${regions.checks} passed, including original-vs-optimized weights, full-list-vs-subset land/climate/height queries and rock exclusion.
- Native MultiMesh buffer regression: 5,403 passed.
- Native vegetation regression: ${native.checks.length} passed, including atlas geometry, reduced-motion image equality, camera orbit, local/coarse/political transitions and 35/687 geographic record checks.
- Startup regression: ${startup.checks} passed, including one cover, all assets warmed, camera movement without reopening, restored starting camera and retained bounded cells.
- Actual GPU gallery comparison: frozen motion frames identical; advancing wind changes foliage. No native shader/script errors in the final runs.
- Protected-data hashing: ${protection.unchangedProtectedFiles} files unchanged; six previously protected rendering scripts differ under an explicit allowlist. The historical baseline was not rewritten. Settlement coordinates, political/historical data and terrain source files are preserved.

Existing engine warnings remain: raw-image loads warn about future export packaging, headless Windows reports its root certificate-store error, and the startup validator reports two ObjectDB instances leaked at exit. Native rendering and checks pass. The archived October trial report generator rejects the accumulated project changes against its fixed two-file snapshot; it is not a current validation gate and was not used to rewrite that historical report. Export packaging and those pre-existing cleanup warnings are not fixed here.

## Actual screenshots inspected

[Gaul before](../../godot-prototype/evidence/close-vegetation/before/gaul-cold.png) / [Gaul final](../../godot-prototype/evidence/close-vegetation/final-art/gaul-cold.png); [Messina final](../../godot-prototype/evidence/close-vegetation/final-art/messina-cold.png); [Baltic final](../../godot-prototype/evidence/close-vegetation/final-art/baltic-cold.png); [Nile palms final](../../godot-prototype/evidence/close-vegetation/final-art/nile-cold.png); [asset gallery](../../godot-prototype/evidence/close-vegetation/asset-gallery.png). Screenshots are actual Godot renders, not mockups. Comparisons use the same camera routes. The Nile and Baltic have final captures but no measured old-art baseline in this task.

## Changed files

Production: godot-prototype/{world.gd,northern_italy_world.gd,eastern_surface.gd,environment_rules.gd,regional_scenery.gd,vegetation_quality.gd,vegetation_quality.gdshader,vegetation_impostor.gdshader,startup_preparation.gd}.

New artwork: godot-prototype/assets/regional-vegetation/ (two licensed source models, sixteen PNG/native atlas pairs, metadata, source notes and hash manifest).

New tools: godot-prototype/tools/{close-vegetation-profile.gd,close-placement-validate.gd,regional-vegetation-bake.gd,regional-vegetation-validate.gd,regional-vegetation-gallery.gd,regional-asset-manifest.mjs,regional-vegetation-report.mjs}. Updated tools: detail-data-validate.mjs, detail-boot-validate.gd, vegetation-quality-validate.gd. Evidence: godot-prototype/evidence/close-vegetation/ and refreshed startup/protected-data validation. Documentation: this report.

## Remaining limits

Uncached areas still take ${range} seconds for the entire close neighbourhood in the measured routes, with the centre appearing sooner. The initial cover prepares shared assets and the opening area; it does not generate every tree on the entire world. Terrain upload/frame spikes remain. Dense campaign trees are optimized directional assets, so they do not have full geometric parallax at first-person distances. Additional regional botanical artwork and ground cover are future work. No claim of zero pop-in or complete ancient vegetation accuracy is made.
`);
console.log('REGIONAL_VEGETATION_REPORT_OK comparisons='+comparisons.length+' nativeChecks='+native.checks.length);
