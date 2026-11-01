import fs from 'node:fs';import crypto from 'node:crypto';import assert from 'node:assert/strict';
const root='godot-prototype',dir=root+'/evidence/terrain-water-20261028',read=p=>JSON.parse(fs.readFileSync(p)),sha=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const before=read(dir+'/before/performance.json'),after=read(dir+'/review-final/performance.json'),pairs=[];
for(const [b,a,bFolder,aFolder] of [[before,after,'before','review-final'],[read(dir+'/ground-before/performance.json'),read(dir+'/ground-after/performance.json'),'ground-before','ground-after']]){
 assert.equal(b.frameCap,0);assert.equal(a.frameCap,0);assert.equal(b.vsync,0);assert.equal(a.vsync,0);
 for(const bv of b.views){const av=a.views.find(v=>v.view.name===bv.view.name);assert.ok(av);const differences={};for(const key of ['position','basis','focus']){differences[key]=Math.max(...bv.camera[key].map((x,i)=>Math.abs(x-av.camera[key][i])));assert.ok(differences[key]<.00001,'Camera mismatch '+key);}for(const key of ['fov','near','far'])assert.equal(bv.camera[key],av.camera[key]);
  const name=bv.view.name;for(const p of [bFolder+'/'+name+'.png',aFolder+'/'+name+'.png']){const buf=fs.readFileSync(dir+'/'+p);assert.equal(buf.readUInt32BE(16),1920);assert.equal(buf.readUInt32BE(20),1080);}
  pairs.push({name,before:bFolder+'/'+name+'.png',after:aFolder+'/'+name+'.png',cameraDifferences:differences,beforeSha256:sha(dir+'/'+bFolder+'/'+name+'.png'),afterSha256:sha(dir+'/'+aFolder+'/'+name+'.png')});
 }
}
for(const [file,hash] of Object.entries(read(dir+'/settlement-preservation.json')))assert.equal(sha(file),hash,'Settlement source changed: '+file);
const protection=read(root+'/evidence/final-integrity.json');assert.equal(protection.protectedFiles,460);assert.deepEqual(protection.changed,[]);fs.writeFileSync(dir+'/protection.json',JSON.stringify(protection,null,2));
for(const entry of read(root+'/assets/landscape-quality/sources.json'))assert.equal(sha(root+'/'+entry.file),entry.sha256);
const native=read(dir+'/native-validation.json');assert.ok(native.passed);
// Verify additive terrain derivative and its immutable source relationship.
const d=read(root+'/data/landscape-quality/aricia.json'),mesh=fs.readFileSync(root+'/'+d.mesh),heights=fs.readFileSync(root+'/'+d.heights);assert.equal(mesh.readUInt32LE(0),257*257);assert.equal(mesh.readUInt32LE(4),256*256*6);assert.equal(heights.length,257*257*4);assert.equal(sha(root+'/data/landscape-quality/aricia-source.json'),d.inputSha256);
for(let i=0;i<heights.length;i+=4)assert.ok(Number.isFinite(heights.readFloatLE(i)));
const animation0=sha(dir+'/review-final/tiber-close.png'),animation8=sha(dir+'/review-final/tiber-flow-t8.png');assert.notEqual(animation0,animation8);
fs.writeFileSync(dir+'/validation.json',JSON.stringify({passed:true,artisticAcceptance:false,performanceAcceptance:false,nativeChecks:native.count,matchedCameras:pairs,protected:protection,settlementSourceHashesPreserved:Object.keys(read(dir+'/settlement-preservation.json')).length,verifiedNewPhotographs:6,ariciaVertices:257*257,animationFramesDiffer:true,notice:'Automated validation establishes integrity and functioning, not artistic quality.'},null,2));
const fmt=n=>n.toFixed(1),mib=n=>(n/1048576).toFixed(1),processBefore=read(dir+'/before/process.json'),processAfter=read(dir+'/review-final/process.json'),motionBefore=read(dir+'/before-repeat/motion.json'),motionAfter=read(dir+'/review-final/motion.json');
const allBefore=[...before.views,...read(dir+'/ground-before/performance.json').views],allAfter=[...after.views,...read(dir+'/ground-after/performance.json').views];
const performanceRows=allBefore.map((v,i)=>{const a=allAfter[i];return`| ${v.view.name} | ${fmt(v.steady.averageFps)} / ${fmt(v.steady.onePercentLowFps)} | ${fmt(a.steady.averageFps)} / ${fmt(a.steady.onePercentLowFps)} | ${fmt(v.steady.maxMs)} → ${fmt(a.steady.maxMs)} | ${v.drawCalls} → ${a.drawCalls} |`;}).join('\n');
const report=`# Terrain/water review — visual acceptance NOT met

The native prototype now demonstrates multi-material PBR terrain, higher-resolution source relief around Aricia, and flowing/depth-shaded Tiber water. It **does not reach the requested Imperator/Rome II landscape standard**. Repeated ground motifs, faceted vegetation, incomplete riverbed integration and coarse adjoining terrain remain conspicuous. The rectangular material boundary is also visible at campaign zoom, and the full PBR branch currently bypasses the original strategic relief shading, weakening distant landform readability. Do not promote this to the main presentation or expand it worldwide.

## Review the actual screenshots

[Interactive comparison](comparison.html) displays eight matched pairs of unedited 1920×1080 Godot screenshots. Camera positions, basis, FOV, clipping planes and focus are validated in [validation.json](validation.json). Aricia's new relief is viewed from the **original physical camera position**, not a higher camera following the new elevation. Existing objects remain rendered. Map marker/UI overlays are hidden equally on both sides.

${pairs.map(p=>`- **${p.name}**: [before](${p.before}) · [after](${p.after})`).join('\n')}

Water animation: [time 0](review-final/tiber-close.png) · [time 8 s](review-final/tiber-flow-t8.png). Only water time changes for that pair. Ocean and Tiber time are synchronized for the main comparisons; the unchanged lake ripple phase was not synchronized in the original baseline, so do not attribute lake animation differences to this work. Images are real engine outputs, not generated concepts, retouched renders or reference-game screenshots.

## What produces the differences

- **Terrain shape:** same Copernicus source, additive 257² Aricia patch at roughly 28×37 m rather than roughly 650–870 m. Existing Roma local relief is preserved. No invented noise-displaced hills. Visible improvements chiefly occur on the Aricia slopes; Roma's existing mesh is not magically made higher resolution by a shader.
- **Surface response:** grass, soil and exposed-ground albedo, measured OpenGL normals and roughness; continuous slope/soil blending, bank wetness, triplanar rock colour, world-space phase, proper compressed mipmaps and a filtered colour macro. Nine maps share three sets across terrain and existing close settlement ground. This corrects material plumbing; art-directed land-cover composition is still inadequate.
- **Tiber:** two animated normal layers aligned to inferred flow, inverse-projection depth absorption, subdued screen refraction, dielectric reflections and alpha-softened banks. Existing river positions, widths and elevation convention are unchanged; the native test compares the complete rendered vertex set with quality off/on. The 3 m lift is still present and depth is a rendering approximation, not bathymetry.
- **Vegetation integration:** existing local proxies shrink around anchored origins; no new tree counts or assets. This exposes terrain and improves scale, but the original faceted foliage still prevents a convincing close landscape.
- Roads and settlement geometry/data were not redesigned. Existing ground masks retain roads/plazas and gain the shared landscape response. See the two supplemental ground views for integration and remaining edge/paving limitations.

## Performance — uncapped, same cameras

Godot ${after.engine.string}; ${after.backend}; ${after.adapter}; 1920×1080, 4× MSAA. Cap **0**, VSync **off**, asserted after world initialization. Each main row contains 600 settled wall intervals with forced GPU submission and buffer swap. This controlled hidden-window method is **not** OS PresentMon/display scan-out. 1% low = reciprocal mean of the slowest 1% of measured frame intervals. Raw intervals, GPU timings, loads and process/device telemetry are retained. Runs are sequential, not simultaneous. Shader caches were retained; there is no clean-cache claim.

| View | Before average / 1% low FPS | Final average / 1% low FPS | Worst settled frame ms | Draw calls |
|---|---:|---:|---:|---:|
${performanceRows}

Tiber regresses in average FPS and contains a **164.6 ms spike at sample 308**. It is included in the 1% low, not discarded. Its surrounding samples return to normal; these data do not identify whether the isolated stall is driver, OS, telemetry or rendering work. It cannot be presented as a clean performance pass.

Camera movement, 900 submitted frames from Roma to Aricia while zooming 45 km → 650 m, including streaming: before **${fmt(motionBefore.steady.averageFps)} average / ${fmt(motionBefore.steady.onePercentLowFps)} 1% low**, final **${fmt(motionAfter.steady.averageFps)} / ${fmt(motionAfter.steady.onePercentLowFps)}**. Worst movement interval ${fmt(motionBefore.steady.maxMs)} → ${fmt(motionAfter.steady.maxMs)} ms; frames over 33.33 ms ${motionBefore.steady.over33_33ms} → ${motionAfter.steady.over33_33ms}. **Smooth sustained 60 FPS during movement is not achieved.** Original before capture predates the movement extension; the equivalent baseline route is separately retained in <code>before-repeat/</code>, including its fixed-view data.

Peak measured process working set, main six-view sequence: **${mib(processBefore.peakWorkingSetBytes)} → ${mib(processAfter.peakWorkingSetBytes)} MiB**. Engine-reported maximum rendering video memory: **${mib(Math.max(...before.views.map(v=>v.videoMemoryBytes)))} → ${mib(Math.max(...after.views.map(v=>v.videoMemoryBytes)))} MiB**. This engine counter is not total physical VRAM residency. <code>process.json</code> also records NVIDIA device-wide memory/utilization/clocks/power/temperature at one-second intervals; it includes the desktop and other GPU allocations and must not be labeled application-only VRAM. Both sequences reach 87°C, so these are thermally constrained laptop measurements, not cool desktop extrapolations.

## Loading and LOD — separate from steady FPS

Scene instantiation: **${fmt(before.sceneInstantiationMs)} → ${fmt(after.sceneInstantiationMs)} ms**. This blocks startup and is not a playable frame-rate metric. Readiness additionally waits for streamed tiles, vegetation, settlement presentation, river work and 180 stabilization frames; per-view values are in the raw report.

Final warm-cache first-view intervals reach **${fmt(Math.max(...after.views.map(v=>v.firstFrames.maxMs)))} ms**, versus **${fmt(Math.max(...before.views.map(v=>v.firstFrames.maxMs)))} ms** in the original baseline. Earlier first-use captures after shader changes reached **1.9 seconds**, retained in <code>after/</code> and candidate logs. These stalls are not fixed by improving steady FPS. Material/pipeline first-use work is implicated by when they occur, but an instrumented driver-level trace would be required to attribute all that time precisely.

The new Aricia tile uses a native mesh derivative. Original context/tile image and buffer setup remain synchronous. Existing 650 ms source morph, parent edge matching and 13-tile resident budget are preserved; numeric LOD boundary checks cover 15, 8 and 3 km neighborhoods. Movement still reveals streaming/culling costs, and the transition is not certified artistically seamless. Existing coarse lake polygons remain visible near Aricia and are outside the chosen Tiber treatment.

## Validation and preservation

- 460 protected files unchanged, 35 approved coordinates exact, 687 research records byte-identical to canonical source.
- ${Object.keys(read(dir+'/settlement-preservation.json')).length} settlement/architecture/data source hashes from this task's starting snapshot remain identical; no chain, starting-level or city asset edits.
- Native checks: river rendered vertices unchanged, terrain edge heights match parent, detail gates/resident budget, mipmaps/compression and normal XY error, existing ground material binding. Initial attempts exposed excessive BC1 normal error; final BC5 XY decoding is checked against source data. A same-bucket camera jump also exposed existing settlement viewport-culling cache behavior; the material test explicitly invalidates that cache. The production settlement system was not changed under this terrain-only task.
- Eight camera/screenshot pairs, image dimensions, photograph hashes, additive DEM source hash/counts/finite values and distinct animation frames verified by the report generator.
- Final capture/validation logs have no shader or script errors. Existing baseline runtime-image/export warnings remain and are documented; the new PBR resources are baked/importable.

Passing these checks is **not artistic acceptance**. Both visual acceptance and smooth-movement performance acceptance remain false.

## Changed files and reproduction

Existing renderer sources changed: <code>world.gd</code>, <code>terrain.gdshader</code>, <code>roma_showcase_surface.gdshaderinc</code>, <code>foliage.gdshader</code>. New scoped sources: <code>landscape_quality.gd</code>, <code>landscape_surface.gdshaderinc</code>, <code>landscape_river.gdshader</code>. New assets/derivatives: <code>assets/landscape-quality/</code>, <code>data/landscape-quality/</code>, three <code>data/regional/aricia-landscape.*</code> parent/normal files. Authoring, validation, capture, preview and report tools are <code>tools/landscape-*</code>; public opt-in launcher: <code>terrain-water.ps1</code>. Full source/renderer findings: [AUDIT.md](AUDIT.md). Exact assets/licenses: [PROVENANCE.md](../../assets/landscape-quality/PROVENANCE.md).

Launch from the repository: <code>.\\godot-prototype\\terrain-water.ps1</code>. It starts the existing Roma presentation with the terrain experiment, cap zero and VSync off. All source coordinates are retained. Existing navigation and development UI are not reimplemented.

Rebuild derivatives using tools/landscape-assets.mjs, landscape-dem.mjs, landscape-control.mjs, a Godot editor import and the headless landscape-textures.gd script. Capture with tools/landscape-capture.ps1; existing stage directories are rejected to preserve evidence. Validation scripts and the report generator are included.

## Remaining work before another visual acceptance attempt

1. Restore the existing source-derived strategic relief response within the PBR distance levels and remove the visible rectangular material boundary. Author a coherent Latium land-cover/control map that reads as terrain at campaign scale: woodland massing, grass/soil variation, wet river corridors and road margins. Fine PBR textures cannot substitute for that composition. The aerial colour macro remains repetitive/mossy.
2. Build a proper Tiber cross-section with a controlled bed, banks and floodplain from compatible geographic evidence. Keep source placement and record uncertainty; remove the floating ribbon convention only as a deliberate terrain/hydrology change. Upgrade nearby lake shore geometry separately.
3. Replace the existing close vegetation proxies with a coherent licensed Mediterranean foliage kit and matching distance representation. Scaling the proxies is useful but insufficient.
4. Extend source-derived terrain detail across the narrow showcase corridor with measured LOD transitions, then address startup uploads and streaming/movement frame budgets. Profile first-use pipelines and the isolated Tiber spike with a driver/OS frame trace.

No worldwide rollout, The Rev edits, commits or pushes. Stop here for independent review; this package is evidence of a **partial prototype and a failed overall quality target**, not a completed visual overhaul.
`;
fs.writeFileSync(dir+'/REPORT.md',report);
const html=`<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Roma–Aricia terrain / water review</title><style>body{margin:0;background:#151b20;color:#e6e5df;font:16px system-ui}main{max-width:1500px;margin:auto;padding:24px}h1{font-size:25px}a{color:#b8dafa}.status{padding:14px;background:#503c2b;border-left:4px solid #e9b06d}select,button{font:inherit;padding:9px;background:#27353c;color:white;border:1px solid #66818d;margin:12px 4px}input{width:100%}.viewer{position:relative;aspect-ratio:16/9;background:#000;overflow:hidden}.viewer img{position:absolute;width:100%;height:100%;object-fit:contain}.label{position:absolute;top:12px;background:#111c;padding:8px}.right{right:12px}.line{position:absolute;top:0;bottom:0;left:50%;border-left:2px solid white;pointer-events:none}.stats{line-height:1.8}details{margin:20px 0}</style><main><h1>Roma–Aricia terrain and water</h1><p class="status"><strong>Visual target not met.</strong> Native Godot 4.7.2 screenshots; inspect the local improvements and remaining prototype appearance. No generated or retouched imagery.</p><p><a href="REPORT.md">Full report and failures</a> · <a href="AUDIT.md">Rendering audit / references</a> · <a href="validation.json">Camera / protection validation</a></p><label>View <select id="view">${pairs.map((p,i)=>`<option value="${i}">${p.name}</option>`).join('')}</select></label><button id="before">Before</button><button id="after">After</button><button id="split">Split</button><div class="viewer"><img id="b" alt="Actual baseline Godot screenshot"><img id="a" alt="Actual prototype Godot screenshot"><span class="label">BEFORE</span><span class="label right">PROTOTYPE</span><div id="line" class="line"></div></div><label>Before/prototype boundary <input id="reveal" type="range" min="0" max="100" value="50"></label><p id="links"></p><p class="stats">Uncapped 1920×1080, same camera transforms and clip planes. Passing integrity checks is not an art-quality verdict. Repeated ground motifs, faceted vegetation, source mesh limits and riverbed integration remain unresolved. Movement and the Tiber spike fail smooth-60 acceptance.</p><details><summary>What changes in these frames</summary><p>Aricia source DEM derivative, full grass/soil/rock PBR, corrected mipmaps and normal compression, macro colour variation, Tiber flow/depth/refraction/bank fading and existing vegetation scale correction. Ocean, lake polygons, settlement buildings and geography records remain intact.</p></details></main><script>const pairs=${JSON.stringify(pairs)};const $=id=>document.getElementById(id);function split(n){$('reveal').value=n;$('a').style.clipPath='inset(0 0 0 '+n+'%)';$('line').style.left=n+'%'}function update(){let p=pairs[$('view').value];$('b').src=p.before;$('a').src=p.after;$('links').innerHTML='<a href="'+p.before+'">Open full before</a> · <a href="'+p.after+'">Open full prototype</a>';split(50)}$('view').onchange=update;$('reveal').oninput=e=>split(e.target.value);$('before').onclick=()=>split(100);$('after').onclick=()=>split(0);$('split').onclick=()=>split(50);update();</script></html>`;
fs.writeFileSync(dir+'/comparison.html',html);
console.log({matchedPairs:pairs.length,nativeChecks:native.count,visualAcceptance:false,performanceAcceptance:false,report:dir+'/REPORT.md'});
