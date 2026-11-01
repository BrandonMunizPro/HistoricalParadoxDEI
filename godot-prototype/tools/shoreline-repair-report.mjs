import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';import assert from 'node:assert/strict';import {PNG} from 'pngjs';
const dir='godot-prototype/evidence/shoreline-repair-20261029';
const read=f=>fs.readFileSync(path.join(dir,f));const json=f=>JSON.parse(read(f).toString('utf8').replace(/^\uFEFF/,''));const text=f=>{const b=read(f);return b.includes(0)?b.toString('utf16le'):b.toString('utf8');};const write=(f,o)=>fs.writeFileSync(path.join(dir,f),typeof o==='string'?o:JSON.stringify(o,null,2)+'\n');const hash=f=>crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex');
const changed=json('source-before.json').filter(f=>!fs.existsSync(f.path)||hash(f.path)!==f.sha256);assert.deepEqual(changed.map(f=>f.path),['godot-prototype/ocean/ocean_surface.gdshader']);
for(const stage of ['before','final','native']){assert.equal(json(stage+'/process.json').exitCode,0);assert(!/^ERROR:|SCRIPT ERROR|SHADER ERROR/m.test(text(stage+'/errors.log')));}
const native=json('native/validation.json');assert(native.passed&&native.checks.length===13);assert(text('navigation.log').includes('NAVIGATION_REGRESSION_OK'));
for(const token of ['protectedFiles: 460','changed: []','approvedSites: 35','researchRecords: 687','canonicalCoordinatesExact: true','researchCopyByteIdentical: true'])assert(text('protected-integrity.txt').includes(token));
const a=json('before/views.json').views,b=json('final/views.json').views;assert.equal(a.length,10);assert.equal(b.length,10);
for(let i=0;i<a.length;i++){assert.equal(a[i].name,b[i].name);assert.deepEqual(a[i].preset,b[i].preset);for(const key of ['basis','position'])a[i].camera[key].forEach((v,k)=>assert(Math.abs(v-b[i].camera[key][k])<1e-5));for(const key of ['fov','near','far'])assert.equal(a[i].camera[key],b[i].camera[key]);for(const stage of ['before','final']){const h=read(stage+'/'+a[i].name+'.png');assert.equal(h.readUInt32BE(16),1920);assert.equal(h.readUInt32BE(20),1080);}}
function atlasStep(stage){const p=PNG.sync.read(read(stage+'/regional-boundary.png'));let sum=0;for(let y=600;y<1000;y++){const x=Math.round(1277-.57*y);sum+=p.data[(y*p.width+x+6)*4+1]-p.data[(y*p.width+x-6)*4+1];}return sum/400;}
const seam={before:atlasStep('before'),after:atlasStep('final'),metric:'Mean signed green-channel jump across +/-6 pixels on the known atlas edge; 400 water-only scanlines, 8-bit channels.'};assert(Math.abs(seam.after)<Math.abs(seam.before)*.15);
write('validation.json',{passed:true,matchedViews:10,nativeChecks:13,changedExistingSources:changed.map(f=>f.path),sourceFilesCompared:2936,protectedFiles:460,approvedSites:35,researchRecords:687,navigationPassed:true,atlasEdge:seam});
write('changed-files.json',{runtime:changed.map(f=>({path:f.path,beforeSha256:f.sha256,afterSha256:hash(f.path)})),addedTools:['shoreline-repair-audit.gd','shoreline-repair-capture.ps1','shoreline-repair-validate.gd','shoreline-repair-report.mjs'].map(f=>'godot-prototype/tools/'+f),evidenceDirectory:dir});
const rows=b.map((v,i)=>`| ${v.name} | ${a[i].steady.averageFps.toFixed(1)} / ${v.steady.averageFps.toFixed(1)} | ${a[i].steady.onePercentLowFps.toFixed(1)} / ${v.steady.onePercentLowFps.toFixed(1)} | ${a[i].gpu.meanMs.toFixed(2)} / ${v.gpu.meanMs.toFixed(2)} | ${a[i].drawCalls} / ${v.drawCalls} |`).join('\n');
write('REPORT.md',`# Screenshot-directed shoreline repair — 29 October 2026

Inspected the user's three screenshots (18:41:16, 18:41:34 and 18:42:22). The first two expose a gap in the previous validation: low viewing angles can cause false water over land below the old 1,200 km activation threshold. The last shows straight-edged water presentation. A matching class of straight water boundary was reproduced at the existing regional atlas edge. Its exact user-camera location has not been established, so this is not claimed as an exact recreation of that third pose.

[Interactive before/after review](comparison.html) · [Validation](validation.json) · [Changed files and hashes](changed-files.json)

## Implemented

Only **ocean/ocean_surface.gdshader** changed among 2,936 task-start source/asset hashes. Existing terrain, water/land masks, terrain elevations, FFT simulation, world camera and neutral political styling are unchanged.

- Background ocean now receives the existing small reversed-Z raster depth separation at **all zoom distances**. The old smoothstep at 1,200–2,500 km missed the 785–1,087 km shallow-angle cases and distant geometry visible from close cameras. The displaced local wave patch is untouched. No geographic geometry or water elevations move.
- Regional/global shore-distance atlases use different resolutions and distance metrics. Switching between them at a rectangle produced a false diagonal water-color boundary. Color-distance sampling now feathers over **12 km inside the regional atlas edge**, remaining exactly global at the boundary. Land/water clipping, source masks and inland-water exclusions do not blend or move. Both background and local ocean materials use the same calculation. No new textures, draws, compute passes or per-frame CPU generation.
- A tentative parent-terrain clipping experiment did not resolve the observed shape and was reverted byte-for-byte. No speculative terrain change was retained.

## Actual validation

**13 native GPU checks pass.** Ten low-angle/distance poses cover 180, 785.6, 1,087.3, 3,300 and 8,500 km, pitches 8–65 degrees, and rotated views. The previous shader reproduces the failure at 785.6 km / 12 degrees: **1,751 water-colored land probes out of 2,480**, versus **8** after the repair. All ten corrected poses remain below 2% coast-pixel classification error. This does not mean zero coast aliasing. See [native results](native/validation.json) and [pose measurements](native/poses.json).

The same-process matched reproducer [before](native/reproduced-785.6-12.0-0.0.png) / [after](native/repaired-785.6-12.0-0.0.png) is the clearest evidence: camera position is identical while the shader changes. The baseline multi-view sweep's 785 km camera can land on a slightly different floating-point pose and exhibit less speckling; retained separate native images explicitly demonstrate the reproduced defect.

Ten additional matched 1920×1080 captures cover the Caspian, Riga, Tallinn, Black Sea, regional atlas coast, Sicily and close Tarquinii. Camera transforms match within 0.00001, clipping/FOV exactly. The known atlas line's mean green-channel jump falls from **${seam.before.toFixed(4)} to ${seam.after.toFixed(4)}** in the targeted water region. This is a line-artifact regression metric, not an art quality score. Close wave comparison changes at most one 8-bit channel step; mean RGB maximum-channel difference **${native.checks[11].details.mean}** on a 0–1 scale. Close simulation/displacement is unchanged.

Navigation regression passes. All **460 protected files, 35 approved locations and 687 research records** pass the existing integrity validator. No source geography changes, gameplay changes, third-party assets, commits or pushes. Existing image-loading export warnings are retained in logs; no shader/script errors.

## Short performance samples (before / final)

Godot 4.7.2 Forward+, Vulkan, RTX 3060 Laptop. Each settled view records 120 uncapped forced submissions with VSync off. These are short sequential render samples, not a sustained gameplay or clean-cache benchmark. Normal game FPS cap/settings are unchanged. The one atlas-boundary view has a small measured GPU increase; most other samples are slightly faster, which should not be treated as a proven optimization. No new memory-intensive resources were added.

| View | Average FPS | 1% low FPS | Mean GPU ms | Draw calls |
| --- | --- | --- | --- | --- |
${rows}

[Before raw intervals](before/views.json) · [Final raw intervals](final/views.json)

## Remaining limits

The fixes address depth conflicts and texture-atlas seams, not the original coarse shoreline geometry. Close shallow views still expose angular source-mask edges, flattened/coarse terrain, and some floating-looking scenery at clipped/elevated coast edges. Outer dataset boundaries and maximum-zoom finite-plane limits remain. No claim is made that every coast is polished or that the exact third screenshot's location was reproduced. A proper coast geometry/vertical edge pass would be separate from the color seam repair and should use existing geographic evidence; this pass does not invent coastlines or hide the issue by changing the camera.

The selected evidence is **before**, **final**, and **native**. Depth-probe predates color blending; blend-probe predates the rejected terrain experiment; coverage-probe contains that rejected experiment. They are retained for diagnosis, not selected delivery. The three original user images are copied under **user-screenshots** for reference, without altering the originals.
`);
const pairs=[{name:'Reproduced low-angle failure',before:'native/reproduced-785.6-12.0-0.0.png',after:'native/repaired-785.6-12.0-0.0.png'},...b.map(v=>({name:v.name,before:'before/'+v.name+'.png',after:'final/'+v.name+'.png'}))];
const script=`const pairs=${JSON.stringify(pairs)};const select=document.querySelector('select'),images=[...document.querySelectorAll('img')],range=document.querySelector('input');function show(){let p=pairs[select.selectedIndex];images[0].src=p.before;images[1].src=p.after;document.querySelector('#rawbefore').href=p.before;document.querySelector('#rawafter').href=p.after;}function clip(){images[1].style.clipPath='inset(0 0 0 '+range.value+'%)';}select.onchange=show;range.oninput=clip;show();clip();`;new Function(script);
write('comparison.html',`<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Shoreline repair</title><style>body{margin:0;background:#17242e;color:#eef3f5;font:16px system-ui}main{max-width:1500px;margin:auto;padding:20px}a{color:#a4d8ff}select{padding:8px;font:inherit}.stage{position:relative;aspect-ratio:16/9}.stage img{position:absolute;width:100%;height:100%;object-fit:contain}input{width:min(700px,80%)}p{line-height:1.5}</style><main><h1>Screenshot-directed map repair</h1><p>Actual Godot captures: before on the left, final on the right. Drag to compare. The first pair reproduces the previous low-angle defect in the same scene; the other ten are matched sweep captures.</p><label>View <select>${pairs.map(p=>'<option>'+p.name+'</option>').join('')}</select></label><p><label>Divider <input type="range" min="0" max="100" value="50" aria-label="Before after divider"></label></p><div class="stage"><img alt="Before"><img alt="Final"></div><p><a id="rawbefore">Before PNG</a> · <a id="rawafter">Final PNG</a> · <a href="REPORT.md">Findings, performance and remaining limits</a> · <a href="validation.json">Validation</a></p><p>Repaired: low-angle sea/land depth conflict and abrupt regional/global water-color boundary. Coarse coast geometry and outer source-world coverage limits remain.</p></main><script>${script}</script></html>`);
console.log(JSON.stringify({passed:true,matchedViews:b.length,nativeChecks:13,seam,modifiedExistingSources:changed.length},null,2));
