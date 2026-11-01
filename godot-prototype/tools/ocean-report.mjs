import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {execFileSync} from 'node:child_process';
const project=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const root=path.dirname(project), out=path.join(project,'evidence/ocean-20261028');
const read=p=>JSON.parse(fs.readFileSync(path.join(out,p),'utf8').replace(/^\uFEFF/,''));
const hash=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const write=(p,s)=>fs.writeFileSync(path.join(out,p),s);
const assert=(ok,msg)=>{if(!ok)throw Error(msg);};
const baseline=read('project-before.json');
const changed=[],missing=[];
for(const f of baseline){const p=path.join(root,f.path);if(!fs.existsSync(p))missing.push(f.path);else if(hash(p)!==f.sha256)changed.push(f.path);}
assert(!missing.length,'Pre-existing files deleted: '+missing);
assert(changed.length===1&&changed[0]==='godot-prototype/world.gd','Unexpected pre-existing changes: '+changed);
assert(hash(path.join(project,'water.gdshader'))===hash(path.join(out,'before-water.gdshader')),'Legacy shader changed');
const integrity=execFileSync(process.execPath,[path.join(project,'tools/check-integrity.mjs')],{cwd:root,encoding:'utf8'});
write('protected-integrity.txt',integrity);
const native=read('native-validation-final.json');assert(native.passed&&native.count===16,'Native checks failed');
for(const s of ['review-before','review-after','review-low','review-high','review-frozen','review-sustained','review-surface']){
 assert(read(s+'/process.json').exitCode===0,'Capture exit failed: '+s);
 assert(!/SCRIPT ERROR|^ERROR:|SHADER ERROR/m.test(fs.readFileSync(path.join(out,s,'errors.log'),'utf8')),'Capture errors: '+s);
}
const sources=['world.gd','data/ocean-settings.json','ocean-preview.ps1',...fs.readdirSync(path.join(project,'tools')).filter(n=>/^ocean-/.test(n)).map(n=>'tools/'+n)];
function walk(dir){for(const e of fs.readdirSync(path.join(project,dir),{withFileTypes:true})){const p=dir+'/'+e.name;if(e.isDirectory())walk(p);else sources.push(p);}}walk('ocean');
write('changed-files.json',JSON.stringify(sources.sort().map(p=>({path:'godot-prototype/'+p,status:p==='world.gd'?'modified':'added',sha256:hash(path.join(project,p))})),null,2));
const before=read('review-before/performance.json'),after=read('review-after/performance.json');
const pairs=before.views.map((v,i)=>({name:v.view.name,before:'review-before/'+v.view.name+'.png',after:'review-after/'+v.view.name+'.png',b:v,a:after.views[i]}));
pairs.push({name:'surface',before:'surface-before/surface.png',after:'review-surface/surface.png',b:read('surface-before/performance.json').views[0],a:read('review-surface/performance.json').views[0]});
for(const p of pairs){
 assert(p.b.view.name===p.a.view.name,'Wrong paired view');
 for(const k of ['position','basis','focus'])assert(p.b.camera[k].every((x,i)=>Math.abs(x-p.a.camera[k][i])<1e-5),'Camera mismatch '+p.name+' '+k);
 for(const k of ['fov','near','far'])assert(p.b.camera[k]===p.a.camera[k],'Projection mismatch '+p.name);
 for(const f of [p.before,p.after]){const png=fs.readFileSync(path.join(out,f));assert(png.readUInt32BE(16)===1920&&png.readUInt32BE(20)===1080,'Image size '+f);}
}
for(const [s,v] of [['review-after','offshore'],['review-surface','surface']])assert(hash(path.join(out,s,v+'.png'))!==hash(path.join(out,s,v+'-t4.png')),'Unanimated screenshot');
const anim=read('animation/frames.json');assert(anim.frames.length===120,'Incomplete animation');
for(const f of anim.frames)assert(fs.existsSync(path.join(out,'animation',f.file)),'Missing animation frame');
const f=n=>Number(n).toFixed(1), mb=n=>f(n/1048576);
const stages=['review-before','review-after','review-low','review-high','review-frozen','review-sustained'];
const processSummary=s=>{const p=read(s+'/process.json');const csv=p.gpuSamples.flatMap(x=>x.deviceWideCsv).map(x=>x.split(',').map(y=>parseFloat(y)));return [mb(p.peakWorkingSetBytes),Math.max(...csv.map(x=>x[0])),Math.max(...csv.map(x=>x[2]))];};
const validation={passed:true,existingFilesCompared:baseline.length,changedExisting:changed,deletedExisting:missing,legacyShaderUnchanged:true,nativeGpuChecks:native.count,matchedViews:pairs.map(p=>p.name),imageSize:[1920,1080],animationFrames:anim.frames.length,notice:'Correctness and preservation checks do not certify artistic quality.'};
write('validation.json',JSON.stringify(validation,null,2));
const lines=[
'# Mediterranean ocean review — 29 October 2026',
'',
'Implemented and captured in the actual campaign world. Open [the interactive comparison and animation](comparison.html). Native captures are unretouched; this is a review candidate, not independent artistic acceptance.',
'',
'## Visible outcome and limits',
'',
'The close/surface pair replaces blurred repeating bands with directional multi-scale waves, moving highlights and local displacement. Tarquinii shows fine directional water and a calmer horizon. Wave detail intentionally filters into roughness at campaign altitude, where the result remains restrained and can still appear flat. This does not deliver an entire modern campaign-map art overhaul. The existing terrain, beach geometry and sky still limit the overall scene. Campaign-scale artistic acceptance remains open.',
'',
'Eight matched camera pairs cover campaign, regional and low Tarquinii, open sea, Sicily, Messina and the Corsica/Sardinia archipelago, plus a supplementary very low surface view. The first seven use 600 measured frames each. The supplementary surface pair uses 90 frames and is not used for the main performance comparison. Actual transforms/clipping are checked to 1e-5; all stills are 1920×1080. UI/markers are hidden consistently. New-water images use deterministic time zero after foam initialization. Separate t=4 captures prove a changed render; the 120-frame native 960×540 sequence demonstrates waves and zoom/rotation. The sequence is sampled deterministically at 24 frames per simulated second, not a real-time performance recording.',
'',
'## Integrated architecture',
'',
'The existing world attaches a GPU FFT renderer to its existing sea material. Three independently seeded directional TMA/JONSWAP domains (128, 487, 1973 metres) produce metre-scale displacement, slopes, second slope moments and Jacobian foam. Metres convert to the existing kilometre world. A single camera-following graded mesh tapers into the existing background sea, avoiding terrain-tile water seams. Analytic background coordinates remove the precision line observed in an early candidate. Existing geographic masks/projection, inland exclusions, opaque land, river/lake renderers and source elevations remain authoritative. Coastal waves are damped and final displacement capped at 0.75 m below the existing 1 m land floor.',
'',
'Normal-moment mipmaps preserve unresolved wave energy as roughness. Below 1 km camera distance, temporal normals resolve once per texel on the GPU; 1–8 km views interpolate histories in the surface shader; farther views sample filtered moments directly. Displacement remains interpolated. Godot dielectric GGX sky/sun reflections replace the original procedural bands; there are no planar/terrain SSR reflections. Shore distance controls shallow-looking colour and shoreline damping, not real bathymetric depth. There is no simulation CPU readback during play.',
'',
'Low: 128² / 2 cascades / 65² grid / 18,8,2 Hz. Balanced: 256² / 3 / 129² / 24,12,3 Hz. High: 512² / 3 / 193² / 30,15,4 Hz (near/regional/far). Spray budget is zero; foam is deliberately subtle for moderate Mediterranean conditions. Quality, wind, wave intensity, foam, colours and distance budgets are in [ocean-settings.json](../../data/ocean-settings.json). Restart for quality changes. Existing animation toggle pauses/resumes scheduling. Unsupported/headless renderers use preserved legacy water; --legacy-ocean explicitly selects it.',
'',
'Run from the repository: .\\godot-prototype\\ocean-preview.ps1 -Quality balanced. The preview starts on the Tarquinian coast, uncapped, using existing navigation. Main world integration also defaults to balanced on Forward+.',
'',
'## Performance',
'',
'Godot 4.7.2 official, Forward+, Vulkan 1.4.351, RTX 3060 Laptop 6 GB, driver 617.42, 1920×1080, MSAA 4×. These are uncapped controlled hidden-window submissions with force_draw(true), automatic render loop disabled and VSync off after world initialization. They are wall-frame throughput, not PresentMon/display scan-out. 1% low is reciprocal mean of the slowest 1% of intervals. Retained caches; not clean-cache shader-compilation measurements. One-second device telemetry reached 88°C in the after run; laptop temperature/clocks and sequential execution introduce uncertainty. No other Godot preview was active in the final paired runs.',
'',
'| View | Old avg / 1% FPS | New avg / 1% FPS | Wall ms old → new | Viewport GPU ms old → new |',
'|---|---:|---:|---:|---:|',
...pairs.slice(0,7).map(p=>'| '+p.name+' | '+f(p.b.steady.averageFps)+' / '+f(p.b.steady.onePercentLowFps)+' | '+f(p.a.steady.averageFps)+' / '+f(p.a.steady.onePercentLowFps)+' | '+f(p.b.steady.meanMs)+' → '+f(p.a.steady.meanMs)+' | '+f(p.b.gpu.meanMs)+' → '+f(p.a.gpu.meanMs)+' |'),
'',
'All 4,200 final balanced stationary samples were below 16.67 ms. This does not imply all traversal/loading frames meet that budget.',
'',
'| Run | Coastal avg / 1% FPS | Offshore avg / 1% FPS |',
'|---|---:|---:|',
...['review-low','review-after','review-high','review-frozen'].map(s=>{const v=read(s+'/performance.json').views;const c=v.find(x=>x.view.name==='tarquinii-coast'),o=v.find(x=>x.view.name==='offshore');return '| '+s+' | '+f(c.steady.averageFps)+' / '+f(c.steady.onePercentLowFps)+' | '+f(o.steady.averageFps)+' / '+f(o.steady.onePercentLowFps)+' |';}),
'',
'Freezing scheduled FFT updates did not materially improve the close view in this run: shading/filtering and other world work remain significant. Warm balanced FFT/mip GPU marker deltas were approximately 0.26–0.29 ms; first-use markers were around 1.9 ms in earlier valid runs. Raw GPU deltas are nanoseconds, sampled/delayed, and exclude history copies plus the separate close-view temporal resolve. They are not the total ocean cost. See [API source](https://github.com/godotengine/godot-docs/blob/master/classes/class_renderingdevice.rst).',
'',
'### Stalls and movement',
'',
...['review-before','review-after'].map(s=>{const m=read(s+'/motion.json').steady;return '- '+s+' 900-frame pan/rotate/zoom with streaming: '+f(m.averageFps)+' average / '+f(m.onePercentLowFps)+' 1% low, '+f(m.maxMs)+' ms maximum; '+m.over33_33ms+' frames >33.33 ms.';}),
'',
'The final 60-second balanced coastal run measured 89.0 average / 69.1 1% low FPS over 5,341 samples, maximum 48.396 ms, two frames over 33.33 ms. Therefore uninterrupted 60 FPS is not established. An earlier pre-adaptive sustained run measured 68.0 FPS; it is retained as history, not substituted for final results.',
'',
'Scene instantiation: '+f(before.sceneInstantiationMs)+' ms old versus '+f(after.sceneInstantiationMs)+' ms new. Initial settled-view readiness ranges '+f(Math.min(...before.views.map(v=>v.readinessMs)))+'–'+f(Math.max(...before.views.map(v=>v.readinessMs)))+' ms old, '+f(Math.min(...after.views.map(v=>v.readinessMs)))+'–'+f(Math.max(...after.views.map(v=>v.readinessMs)))+' ms new; the harness waits at least 180 frames, so this is not pure I/O time. Startup first-frame interval maxima were '+f(before.views[0].firstFrames.maxMs)+' / '+f(after.views[0].firstFrames.maxMs)+' ms. Existing material uploads consume about 1.87 s of the new startup; water/UI/hydrology grouping 1.22 s cannot isolate FFT initialization alone.',
'',
'Full-run diagnostics also retain 0.37–0.93 s before and 0.14–0.77 s after wall intervals around view/capture transitions. Some include synchronous screenshot I/O and explicit deterministic capture work; they must not be presented as steady gameplay. A few ordinary streaming uploads are separately recorded. The 46 ms final motion spike has no corresponding large instrumented CPU stage; its exact cause is unresolved. Earlier adaptive candidates had still worse traversal spikes (up to 490 ms). Do not use these measurements to promise stutter-free movement. See raw firstFrameSamplesMs, motion frameSamplesMs and diagnostics slowFrames.',
'',
'| Run | Peak process RAM MiB | Peak device-wide VRAM MiB | Peak GPU °C |',
'|---|---:|---:|---:|',
...stages.map(s=>'| '+s+' | '+processSummary(s).join(' | ')+' |'),
'',
'VRAM telemetry includes desktop/other applications and is not app-exclusive. Godot per-view videoMemoryBytes and drawCalls/primitives remain in performance.json. Balanced FFT/texture allocation estimate is 22.5 MiB, excluding engine/driver overhead. No CPU readbacks occur in play; validation deliberately reads GPU data.',
'',
'| View | Old → new draw calls | Old → new Godot video memory MiB |',
'|---|---:|---:|',
...pairs.slice(0,7).map(p=>'| '+p.name+' | '+p.b.drawCalls+' → '+p.a.drawCalls+' | '+mb(p.b.videoMemoryBytes)+' → '+mb(p.a.videoMemoryBytes)+' |'),
'',
'### Rejected path',
'',
'An experimental batched mip-tail kernel crashed the test process inside nvoglv64.dll (signal 11). It was reverted, source moved under rejected-mip-tail evidence, and no active renderer references it. Root cause is unconfirmed. The ordinary per-level mip pipeline passed subsequent final captures, preset runs and 16 native GPU checks. Earlier push-constant/descriptor failures and the early seam candidate remain in the logs, but are excluded from selected comparisons.',
'',
'## Validation and protection',
'',
'16 actual Forward+ GPU checks passed: all preset FFT sizes/cascade counts, finite signed animated heights, temporal history/resolve copies, slope-moment mip energy, foam ranges, GPU lifecycle, nine zoom distances/normal paths, displacement/mask guards and existing pause/resume behavior. [Native results](native-validation-final.json). They do not certify visual quality or every coastline pixel.',
'',
'All '+baseline.length+' pre-existing project files were SHA-256 compared against the pre-integration snapshot. Only world.gd changed; no pre-existing file was deleted. Original water shader is byte-identical. The existing integrity validator passes: all 460 protected files unchanged, 35 exact approved coordinates, 687 research records and byte-identical research copy. [Integrity output](protected-integrity.txt), [review checks](validation.json). Existing prior dirty work is preserved. No gameplay, ownership, faction, character, settlement, elevation or The Rev changes. No commit or push.',
'',
'## Changed files and attribution',
'',
'- Existing world.gd: small ocean attachment, settings load and lifecycle reference; pre-existing work retained.',
'- New ocean/: GPU simulation, render context/cascade resource, compute kernels, filtered surface shader, geographic/controller adapter, README, exact third-party license and upstream provenance.',
'- New data/ocean-settings.json and ocean-preview.ps1.',
'- New tools/ocean-{profile,preview,validate,animation,api}.gd, ocean-capture.ps1 and this ocean-report.mjs.',
'- New evidence/ocean-20261028/: original baseline, selected and rejected experiments, raw metrics/logs, screenshots, animation, audit and review package. Evidence is excluded from Godot import with .gdignore.',
'',
'[Exact source file list with SHA-256 hashes](changed-files.json). The only pre-existing file modified by this task is world.gd, verified against the session snapshot rather than the repository HEAD (which contains earlier uncommitted work).',
'',
'Primary technical reference: [GodotOceanWaves](https://github.com/2Retr0/GodotOceanWaves/) pinned a171446f8174348895aaafc426576c26261058b9, cloned outside the game. MIT, Copyright (c) 2024 Ethan Truong. [Exact license](../../ocean/LICENSE-GodotOceanWaves.txt), [upstream manifest](../../ocean/upstream.json), [inspection/reuse audit](AUDIT.md), [implementation guide](../../ocean/README.md). Only the licensed FFT/spectrum/context components listed there were reused/adapted. No reference demo project, proprietary game assets or purchased assets were imported.',
'',
'## Remaining work for review',
'',
'Judge the matched images and animation before accepting the art direction. Low coastal waves are substantially improved; campaign water remains subdued. Beach transitions still follow source-mask resolution (about 217 m in the regional fields), with broad colour bands rather than real shoaling or surf. There is no measured bathymetry, wave refraction, breaking surf, tides, wakes, underwater rendering, spray, planar reflection or terrain SSR. Existing close shoreline/terrain detail is not upgraded. Hardware validation covers this RTX 3060 Laptop and native Forward+ only. Pixel-perfect absence of all possible coastal clipping is not proven by source integrity; sampled Tarquinii/Messina/archipelago views show no introduced tile seams or obvious flooding. Further work should prioritize detailed coastal terrain/depth evidence and tracing remaining motion stalls before adding expensive effects. Stop here for visual review.'
];
write('REPORT.md',lines.join('\n')+'\n');
const data=pairs.map(p=>({name:p.name,before:p.before,after:p.after}));
const html=`<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Mediterranean ocean review</title><style>body{margin:24px;background:#101c26;color:#e4eff4;font:16px system-ui;max-width:1500px}a{color:#9bd6ff}button,select,input{font:inherit;margin:8px;padding:6px}#pair{position:relative;width:100%;aspect-ratio:16/9;background:#000}#pair img{position:absolute;width:100%;height:100%;object-fit:contain}#new{clip-path:inset(0 0 0 50%)}.labels{display:flex;justify-content:space-between}#movie{width:min(960px,100%);aspect-ratio:16/9}p{max-width:1000px}</style><h1>Mediterranean ocean — native Godot captures</h1><p>Matched 1920×1080 screenshots, unretouched. Drag the divider: original left, FFT right. Close-water gains are clearer than campaign-altitude gains. <a href="REPORT.md">Full report, limitations and performance</a> · <a href="AUDIT.md">Audit / licenses</a></p><select id="view"></select><input id="split" type="range" min="0" max="100" value="50" aria-label="Before after divider"><div class="labels"><span>Before — preserved legacy</span><span>After — balanced FFT</span></div><div id="pair"><img id="old" alt="Original ocean"><img id="new" alt="New FFT ocean"></div><p><a id="oldlink">Original PNG</a> · <a id="newlink">New PNG</a></p><h2>Waves and camera transition</h2><p>120 actual native 960×540 engine frames, deterministically sampled at 24 frames per simulated second. This flipbook demonstrates rendering, not measured real-time FPS.</p><button id="play">Play / pause</button><input id="frame" type="range" min="0" max="119" value="0" aria-label="Animation frame"><span id="time"></span><br><img id="movie" alt="Native Godot animated ocean frame"><script>const pairs=${JSON.stringify(data)},frames=${JSON.stringify(anim.frames)},fps=24;const $=id=>document.getElementById(id);pairs.forEach((p,i)=>{$('view').add(new Option(p.name,i))});function setView(){let p=pairs[$('view').value];$('old').src=p.before;$('new').src=p.after;$('oldlink').href=p.before;$('newlink').href=p.after} $('view').onchange=setView;$('split').oninput=()=>{$('new').style.clipPath='inset(0 0 0 '+$('split').value+'%)'};setView();let playing=false,index=0,last=0;const images=frames.map(f=>{let i=new Image;i.src='animation/'+f.file;return i});function show(){let f=frames[index];$('movie').src=images[index].src;$('frame').value=index;$('time').textContent='t='+f.waterTimeSeconds.toFixed(2)+'s · distance '+f.distanceKm.toFixed(2)+' km'}$('frame').oninput=()=>{index=+$('frame').value;show()};$('play').onclick=()=>{playing=!playing};function tick(t){if(playing&&t-last>=1000/fps){index=(index+1)%frames.length;show();last=t}requestAnimationFrame(tick)}show();requestAnimationFrame(tick);</script></html>`;
new Function(html.match(/<script>([\s\S]*)<\/script>/)[1]);
write('comparison.html',html);
console.log(JSON.stringify(validation,null,2));
