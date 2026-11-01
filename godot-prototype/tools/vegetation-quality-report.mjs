import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {PNG} from 'pngjs';

const folder='godot-prototype/evidence/vegetation-quality-20261030';
const assets='godot-prototype/assets/vegetation-quality';
const read=file=>fs.readFileSync(path.join(folder,file));
const json=file=>JSON.parse(read(file).toString('utf8').replace(/^\uFEFF/,''));
const log=file=>{const b=read(file);return b.includes(0)?b.toString('utf16le'):b.toString('utf8');};
const write=(file,value)=>fs.writeFileSync(path.join(folder,file),typeof value==='string'?value:JSON.stringify(value,null,2)+'\n');
const hash=file=>crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const snapshot=json('source-before.json');
const changed=snapshot.filter(file=>!fs.existsSync(file.path)||hash(file.path)!==file.sha256);
assert.deepEqual(changed.map(file=>file.path).sort(),['godot-prototype/regional_scenery.gd','godot-prototype/roma_landscape.gd']);
for(const stage of ['before','resource-final','native-final','load-before','load-after','load-compiled']){
  assert.equal(json(stage+'/process.json').exitCode,0);
  assert(!/^ERROR:|SHADER ERROR|SCRIPT ERROR/m.test(log(stage+'/errors.log')));
}
assert(!/^ERROR:|SHADER ERROR|SCRIPT ERROR/m.test(log('gallery-errors.log')));
assert(log('gallery.log').includes('VEGETATION_GALLERY after'));
assert(log('texture-bake.log').includes('bit_identical_atlas_mip_chains=20'));
assert(log('fallback.log').includes('VEGETATION_FALLBACK_OK'));
assert(log('navigation.log').includes('NAVIGATION_REGRESSION_OK'));
const protection=log('protected-integrity.txt');
for(const token of ['protectedFiles: 460','changed: []','approvedSites: 35','researchRecords: 687','canonicalCoordinatesExact: true','researchCopyByteIdentical: true'])assert(protection.includes(token));
const native=json('native-final/validation.json');assert(native.passed&&native.checks.length===10&&native.checks.every(check=>check.passed));
const before=json('before/views.json').views,after=json('resource-final/views.json').views;
assert.equal(before.length,8);assert.equal(after.length,8);
for(let i=0;i<before.length;i++){
  assert.equal(before[i].name,after[i].name);assert.deepEqual(before[i].preset,after[i].preset);
  for(const key of ['position','basis'])before[i].camera[key].forEach((v,k)=>assert(Math.abs(v-after[i].camera[key][k])<1e-5));
  for(const key of ['near','far','fov'])assert.equal(before[i].camera[key],after[i].camera[key]);
  for(const stage of ['before','resource-final']){const png=read(stage+'/'+before[i].name+'.png');assert.equal(png.readUInt32BE(16),1920);assert.equal(png.readUInt32BE(20),1080);}
  // Native texture compilation must preserve the already-reviewed actual pixels.
  assert(PNG.sync.read(read('final/'+after[i].name+'.png')).data.equals(PNG.sync.read(read('resource-final/'+after[i].name+'.png')).data));
}
for(const view of ['political','baltic-control'])assert(PNG.sync.read(read('before/'+view+'.png')).data.equals(PNG.sync.read(read('resource-final/'+view+'.png')).data));
const catalog=JSON.parse(fs.readFileSync(assets+'/catalog.json'));assert.equal(catalog.records.length,20);
assert.equal(new Set(catalog.records.map(r=>r.sha256)).size,20);
for(const record of catalog.records)assert.equal(hash(assets+'/'+record.file),record.sha256);
const sources={
  date:'2026-10-30',
  generator:{name:'EZ-Tree',author:'Daniel Greenheck',url:'https://github.com/dgreenheck/ez-tree',revision:'dcf309bd86bd521083d9c70f01f2de45fdc7c457',license:'MIT',notice:'LICENSE-EZ-Tree.txt',vendoredSource:'../../tools/vendor/ez-tree',adaptations:'Node ESM relative import extensions and JSON import attributes; uses existing repository Three.js dependency. Generated meshes normalize height and use project-specific seeds; foliage size multiplied by 1.8. Columnar evergreen narrows a pine preset; not a botanically validated cypress model.'},
  textures:[
    {files:['oak.png','ash.png','pine.png'],source:'https://github.com/dgreenheck/ez-tree/tree/dcf309bd86bd521083d9c70f01f2de45fdc7c457/src/app/public/textures/leaves',license:'MIT, under the EZ-Tree project license as explicitly stated in its texture attribution',verification:'https://github.com/dgreenheck/ez-tree/blob/dcf309bd86bd521083d9c70f01f2de45fdc7c457/src/app/public/textures/LICENSE.md'},
    {files:['bark-Color.jpg','bark-NormalGL.jpg','bark-Roughness.jpg'],asset:'ambientCG Bark001',source:'https://ambientcg.com/view?id=Bark001',license:'CC0-1.0',verification:'https://docs.ambientcg.com/license/',acquiredThrough:'EZ-Tree bundled Bark001_1K-JPG maps; upstream attribution copied as TEXTURE-LICENSE.md'},
  ],
  derivatives:'Twenty project-generated mesh variants with three LODs, directional renders and native Godot texture resources. Retain bundled MIT notices; do not describe MIT leaf textures as CC0. No Total War or other proprietary game assets.',
  directionalBake:{azimuths:8,elevationsDegrees:[15,50,85],framePixels:256,atlasPixels:[2048,768],runtime:'Four-frame interpolation between neighboring directions/elevations, alpha-to-coverage, mipmaps, source alpha edge repair baked offline. Campaign uses these impostors throughout its current supported zoom range; full meshes are retained for asset authoring/gallery and possible future close camera work.'},
  trialBoundsDegrees:{west:11.5,east:13.5,south:40.5,north:43.5},
  notImplemented:['Species-validated olive trees','Umbrella/stone pine kit','Updated palms','Grass/flower/ground-cover pass','World-wide rollout'],
  evaluatedNotImported:[
    {url:'https://polyhaven.com/a/pine_tree_01',license:'CC0',finding:'Metadata shows multi-million-vertex tree geometry. Rejected as a direct campaign instance; no large mesh binary downloaded.'},
    {url:'https://opengameart.org/content/foliage1',license:'CC0',finding:'Downloaded and inspected outside the game. Rounded/stylized tree crowns do not meet this art direction. No files imported.'},
    {url:'https://www.innerscene.com/tools/library/3d-parts/mature-scots-pine-tree-280307e1',license:'CC0 stated by provider',finding:'Downloaded outside project and inspected GLB structure. Not integrated or presented as a validated asset.'},
    {url:'https://github.com/caphindsight/Foliage3D',finding:'Reference investigated. Existing instancing/culling was retained; no plugin or demo asset imported.'},
  ],
  files:fs.readdirSync(assets).filter(file=>!file.startsWith('.')&&file!=='SOURCES.json').sort().map(file=>({file,bytes:fs.statSync(assets+'/'+file).size,sha256:hash(assets+'/'+file)})),
};
fs.writeFileSync(assets+'/SOURCES.json',JSON.stringify(sources,null,2)+'\n');
const motion=json('native-final/motion.json').statistics;
const loadBefore=json('load-before/load.json'),loadNaive=json('load-after/load.json'),loadFinal=json('load-compiled/load.json');
write('validation.json',{passed:true,nativeChecks:10,matchedCampaignViews:8,matchedGalleryViews:1,compiledTextureMipChainsIdentical:20,compiledCampaignViewsPixelIdentical:8,politicalControlPixelIdentical:true,outsideTrialControlPixelIdentical:true,uniqueMeshVariants:20,sourceFilesCompared:snapshot.length,changedExistingSources:changed.map(file=>file.path),protectedFiles:460,approvedSites:35,researchRecords:687,fallbackPassed:true,navigationPassed:true,motion});
write('changed-files.json',{
  existing:changed.map(file=>({path:file.path,beforeSha256:file.sha256,afterSha256:hash(file.path)})),
  newRuntime:['vegetation_quality.gd','vegetation_quality.gdshader','vegetation_impostor.gdshader'].map(file=>'godot-prototype/'+file),
  assets:sources.files.map(file=>assets+'/'+file.file).concat(assets+'/SOURCES.json'),
  tools:fs.readdirSync('godot-prototype/tools').filter(file=>file.startsWith('vegetation-')&&!file.endsWith('.uid')).map(file=>'godot-prototype/tools/'+file),
  vendor:'godot-prototype/tools/vendor/ez-tree',evidence:folder,
});
const format=n=>Number(n).toFixed(2);
const performance=after.map((v,i)=>`| ${v.name} | ${format(before[i].steady.averageFps)} / ${format(v.steady.averageFps)} | ${format(before[i].steady.onePercentLowFps)} / ${format(v.steady.onePercentLowFps)} | ${format(before[i].gpu.meanMs)} / ${format(v.gpu.meanMs)} | ${before[i].drawCalls} / ${v.drawCalls} |`).join('\n');
write('REPORT.md',`# Central-Italy vegetation quality trial — 30 October 2026

The previous crowns were opaque low-detail volumes with synthetic surface shading. This trial replaces them with directionally rendered, textured trees derived from actual branching meshes and leaf cutouts. It changes silhouettes and material detail; it does not add more scattered trees to claim improvement. [Open actual Godot comparisons](comparison.html).

## Implemented artwork and rendering

- Twenty generated variants: oak-like broadleaf, pine, columnar evergreen, ash-like broadleaf and scrub, four seeds each. Source meshes have textured bark, alpha-cut branch foliage and three geometric LODs. [Actual detailed-mesh gallery before](asset-gallery-before.png) / [after](asset-gallery-after.png). These gallery views use a separate neutral studio scene, not the campaign camera.
- [EZ-Tree](https://github.com/dgreenheck/ez-tree) is used **offline**, under MIT. Bark001 PBR color, OpenGL normal and roughness maps are from [ambientCG](https://ambientcg.com/view?id=Bark001), CC0. The leaf cutouts are MIT assets from EZ-Tree, not CC0. Exact URLs, pinned revision, file hashes and copied notices are in [SOURCES.json](../../assets/vegetation-quality/SOURCES.json).
- The first full-mesh forest was rejected: roughly **10–21 FPS** in the recorded campaign views, with sparse foliage when its small cutouts minified. Leaf coverage was increased in the source artwork. At the current campaign zoom range, the retained implementation uses **directional impostors**, each baked from those meshes at eight azimuths and three elevations. It blends four neighboring frames during rotation and changes viewing elevation continuously. Each tree is two triangles; each coarse twelve-tree stand is 24 triangles. This is not a claim that full 3D mesh trees currently render near the campaign camera. Detailed meshes remain available in Godot and are shown honestly in the separate gallery.
- Mipmaps, alpha-to-coverage under the existing 4× MSAA, repaired transparent-edge colors and muted foliage shading improve fine crown edges. Existing placement, instance origins, habitat choices, exclusion areas and local/coarse fade conventions are retained. Coarse stand representations use twelve textured tree sprites instead of the old twenty-four opaque crown proxies; these stands are interpretive rendering proxies, not individual historical tree records.
- The trial is bounded to **11.5–13.5°E, 40.5–43.5°N**, covering Roma, Aricia and nearby central Italy. Roma's existing authored hinterland uses the same new assets. Other regions retain their previous artwork. The Baltic and full political control images are **pixel-identical** to baseline.
- Crown sway uses the existing pausable water clock. Switching Animated water off also freezes this small sway; there is no new UI or independent wind simulation. This is an initial shared reduced-motion behavior, not a separate vegetation controls design.

Only two existing runtime files changed: **regional_scenery.gd** selects the bounded replacement meshes and updates presentation uniforms; **roma_landscape.gd** selects those assets for its existing batches. Added runtime files: vegetation_quality.gd, vegetation_quality.gdshader, vegetation_impostor.gdshader. No terrain, camera, ocean/inland-water shader, research, settlement, gameplay or interface changes. [Exact file list and hashes](changed-files.json).

## Measured performance

Godot 4.7.2 Forward+, Vulkan, RTX 3060 Laptop. Each matched view records 120 settled, uncapped, VSync-off forced submitted frame intervals. These are short sequential render samples, not sustained scan-out/gameplay guarantees. Thermal and cache state vary; small differences, including at the pixel-identical Baltic control, are not automatically caused by this art change. Normal game cap/settings remain unchanged.

| View | Average FPS before / after | 1% low FPS before / after | Mean GPU ms before / after | Draw calls before / after |
| --- | --- | --- | --- | --- |
${performance}

The measured 240-frame **360-degree Aricia orbit** averages **${format(motion.averageFps)} FPS**, 1% low **${format(motion.onePercentLowFps)} FPS**, maximum interval **${format(motion.maxMs)} ms**. Screenshots are captured after timing, not inside measured intervals. [Raw motion samples and method](native-final/motion.json); four actual orbit captures are in that folder. Six distance checks exercise the local/coarse fades, full political view and return to close geography.

### Initial loading was investigated separately

The first PNG-based atlas preparation produced a **${format(loadNaive.firstFrames.maxMs)} ms** first-residency frame spike. Transparent-edge repair and mip generation now run **offline**. Godot loads native compressed ImageTexture resources; all twenty serialized atlas mip chains and all eight final campaign captures are **bit-identical** to the reviewed PNG-based result.

| Warm-cache loading probe | Old artwork | PNG atlas prototype (rejected loading path) | Compiled texture delivery |
| --- | --- | --- | --- |
| Scene instantiation ms | ${format(loadBefore.sceneInstantiationMs)} | ${format(loadNaive.sceneInstantiationMs)} | ${format(loadFinal.sceneInstantiationMs)} |
| First Aricia residency ms | ${format(loadBefore.firstResidencyMs)} | ${format(loadNaive.firstResidencyMs)} | ${format(loadFinal.firstResidencyMs)} |
| Maximum initial submitted interval ms | ${format(loadBefore.firstFrames.maxMs)} | ${format(loadNaive.firstFrames.maxMs)} | ${format(loadFinal.firstFrames.maxMs)} |
| Initial intervals over 33.33 ms | ${loadBefore.firstFrames.over33_33ms} | ${loadNaive.firstFrames.over33_33ms} | ${loadFinal.firstFrames.over33_33ms} |
| Engine-reported video memory MiB | ${format(loadBefore.engineVideoMemoryBytes/1048576)} | ${format(loadNaive.engineVideoMemoryBytes/1048576)} | ${format(loadFinal.engineVideoMemoryBytes/1048576)} |
| Engine static allocation MiB | ${format(loadBefore.engineStaticMemoryBytes/1048576)} | ${format(loadNaive.engineStaticMemoryBytes/1048576)} | ${format(loadFinal.engineStaticMemoryBytes/1048576)} |

These probes include the existing world startup/streaming with warm disk and driver caches; they are not clean-cache tests or process working-set/driver-VRAM measurements. Initial loading still has visible stalls. No stutter-free startup or sustained 60 FPS claim is made. [Baseline](load-before/load.json), [rejected path](load-after/load.json), [compiled delivery](load-compiled/load.json).

## Validation and review

- **10 native checks pass**: bounded region; twenty distinct assets/three mesh LODs; campaign triangle budgets; legacy fallback for unsupported families; 24-view atlases; usable detailed meshes; reduced-motion freeze; full camera orbit; local/coarse/political roundtrip; existing geography validation.
- Separate fallback checks cover a missing atlas, empty catalog and disabled trial. Existing navigation regression passes. Texture compilation checks all twenty mip chains for exact equality after serialization. Eight final 1920×1080 campaign pairs have matched positions/bases within 0.00001, exact FOV/clipping, and unchanged camera presets.
- All **460 protected files, 35 approved coordinates and 687 research records** pass the existing integrity validator. The 2,936-file task-start source/asset snapshot finds exactly the two intended existing-file changes and no deletions. Existing water work is preserved. No The Rev modifications, commits or pushes.
- Selected evidence: **before**, **resource-final**, **native-final**, the two **asset-gallery** PNGs and **load-compiled**. Candidate is the rejected full-mesh performance/coverage experiment. Impostor-candidate contains a corrected shader parse error; impostor-two is the earlier brighter palette. Final/native/native-delivery predate native texture loading; their images are pixel-identical to delivery, but use the selected folders for current timings. Failed and superseded logs remain available.

## Remaining art limitations

This is a reviewable vegetation quality trial, **not a completed Mediterranean ecosystem or worldwide overhaul**. Olive trees, umbrella/stone pines, palms, grass, flowers and a proper layered ground-cover pass remain gaps. The columnar evergreen is a narrowed pine-derived visual study, not a validated Cupressus asset. Distribution/diorama scale still comes from the old interpretive system and is not reconstructed 278 BCE vegetation.

Directional impostors trade volumetric detail for campaign performance: low-angle intersections, approximate shadows, baked internal lighting, image crossfades and some softness can still be noticeable. They are not suitable for walking underneath trees. Detailed meshes need spatially subdivided batches and a tighter close-view budget before any future lower-altitude camera rollout. The trial edge can show a style change; do not expand the kit worldwide until the look has been independently reviewed.

The underlying terrain, shore fringes, rock repetition and settlement artwork were deliberately not retouched. Visual improvement should be judged from the actual PNGs; passing checks is not artistic acceptance. No additional plugin is currently required: the existing instancing system is sufficient for this trial.

## Rebuilding the assets

The small pinned generator source is vendored under tools/vendor/ez-tree with its MIT notice. The Three.js dependency already exists in the repository; the game runtime does not use JavaScript/Three.js. From the repository root:

1. Run node godot-prototype/tools/vegetation-quality-bake.mjs to regenerate the twenty detailed mesh binaries/catalog.
2. Run Godot headlessly with --path godot-prototype --script res://tools/vegetation-texture-bake.gd to compile the six source texture maps.
3. Run Godot graphically with --script res://tools/vegetation-impostor-bake.gd to render all 24-direction atlases. The source shader/gallery require a real GPU.
4. Run the texture bake again to compile the twenty atlas mip chains. Capture with tools/vegetation-quality-capture.ps1 using a fresh stage name, then regenerate this report.

The gallery and bake tools use hidden native windows when launched by the recorded commands. The existing project's overall export packaging has not been validated in this task; the new campaign atlases themselves are native Godot resources.
`);
const pairs=[...after.map(view=>({name:view.name,before:'before/'+view.name+'.png',after:'resource-final/'+view.name+'.png'})),{name:'Detailed asset gallery (separate studio scene)',before:'asset-gallery-before.png',after:'asset-gallery-after.png'}];
const script=`const pairs=${JSON.stringify(pairs)};const picker=document.querySelector('select'),imgs=[...document.querySelectorAll('img')],slider=document.querySelector('input');function show(){let p=pairs[picker.selectedIndex];imgs[0].src=p.before;imgs[1].src=p.after;document.querySelector('#rawbefore').href=p.before;document.querySelector('#rawafter').href=p.after;}function clip(){imgs[1].style.clipPath='inset(0 0 0 '+slider.value+'%)';}picker.onchange=show;slider.oninput=clip;picker.selectedIndex=1;show();clip();`;
new Function(script);
write('comparison.html',`<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Vegetation quality trial — actual Godot captures</title><style>body{margin:0;background:#182722;color:#edf2ee;font:16px system-ui}main{max-width:1500px;margin:auto;padding:20px}a{color:#b1dec0}p{line-height:1.5}select{font:inherit;padding:8px}.stage{position:relative;aspect-ratio:16/9}.stage img{position:absolute;width:100%;height:100%;object-fit:contain}input{width:min(80%,700px)}</style><main><h1>Central-Italy vegetation trial</h1><p>Actual matched Godot captures: old artwork on the left, trial on the right. Drag to compare crown outlines, material detail and woodland readability. The trial keeps the existing placements.</p><label>View <select>${pairs.map(pair=>'<option>'+pair.name+'</option>').join('')}</select></label><p><label>Divider <input type="range" min="0" max="100" value="50" aria-label="Before after divider"></label></p><div class="stage"><img alt="Before"><img alt="Trial"></div><p><a id="rawbefore">Original before PNG</a> · <a id="rawafter">Original trial PNG</a> · <a href="REPORT.md">Findings, performance and limits</a> · <a href="validation.json">Validation</a> · <a href="../../assets/vegetation-quality/SOURCES.json">Sources and licenses</a></p><p>The campaign uses directionally blended tree impostors generated from detailed branching meshes. The detailed asset gallery is a separate native 3D studio scene. This is a bounded trial; grass, olives, palms and the rest of the world's vegetation have not been overhauled.</p></main><script>${script}</script></html>`);
console.log(JSON.stringify({passed:true,nativeChecks:10,matchedCampaignViews:8,uniqueVariants:20,controlsPixelIdentical:true,modifiedExistingFiles:changed.length,motionFps:motion.averageFps,maximumLoadingSpikeMs:loadFinal.firstFrames.maxMs},null,2));
