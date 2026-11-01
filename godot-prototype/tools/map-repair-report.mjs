import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import { PNG } from 'pngjs';

// Run from the repository root after the native captures and protection checks.
const folder = 'godot-prototype/evidence/map-repair-20261029';
const read = name => fs.readFileSync(path.join(folder, name));
const json = name => JSON.parse(read(name).toString('utf8').replace(/^\uFEFF/, ''));
const log = name => { const b = read(name); return b.includes(0) ? b.toString('utf16le') : b.toString('utf8'); };
const write = (name, value) => fs.writeFileSync(path.join(folder, name), typeof value === 'string' ? value : JSON.stringify(value, null, 2) + '\n');
const hash = file => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const original = json('source-before.json');
const changed = original.filter(file => !fs.existsSync(file.path) || hash(file.path) !== file.sha256);
assert.deepEqual(changed.map(file => file.path).sort(), [
  'godot-prototype/nile_water.gdshader', 'godot-prototype/ocean/ocean_surface.gdshader',
]);
assert.equal(original.length, 2936);
for (const file of changed) assert(fs.existsSync(file.path), 'Source file deleted');
for (const [copy, source] of [
  ['before-ocean_surface.gdshader', 'godot-prototype/ocean/ocean_surface.gdshader'],
  ['before-nile_water.gdshader', 'godot-prototype/nile_water.gdshader'],
]) assert.equal(hash(path.join(folder, copy)), original.find(file => file.path === source).sha256);

const before = json('before/views.json').views;
const after = json('final/views.json').views;
assert.equal(before.length, 33);
assert.equal(after.length, 33);
for (const stage of ['before', 'final', 'native-delivery']) {
  assert.equal(json(`${stage}/process.json`).exitCode, 0);
  assert(!/SCRIPT ERROR|SHADER ERROR|^ERROR:/m.test(log(`${stage}/errors.log`)));
}
const native = json('native-delivery/validation.json');
assert(native.passed && native.checks.length === 12 && native.checks.every(check => check.passed));
assert(log('navigation.log').includes('NAVIGATION_REGRESSION_OK'));
const protection = log('protected-integrity.txt');
for (const token of ['protectedFiles: 460', 'changed: []', 'approvedSites: 35', 'researchRecords: 687', 'canonicalCoordinatesExact: true', 'researchCopyByteIdentical: true']) assert(protection.includes(token));
for (let index = 0; index < before.length; index++) {
  const a = before[index], b = after[index];
  assert.equal(a.name, b.name);
  assert.deepEqual(a.preset, b.preset);
  for (const key of ['position', 'basis']) a.camera[key].forEach((number, i) => assert(Math.abs(number - b.camera[key][i]) < 0.00001));
  for (const key of ['fov', 'near', 'far']) assert.equal(a.camera[key], b.camera[key]);
  for (const stage of ['before', 'final']) {
    const header = read(`${stage}/${a.name}.png`);
    assert.equal(header.readUInt32BE(16), 1920);
    assert.equal(header.readUInt32BE(20), 1080);
  }
}

// Local regression for the known diagonal crack, independent of the native tests.
function crackMetric(stage) {
  const png = PNG.sync.read(read(`${stage}/catana.png`));
  const sum = (x, y) => { const i = (y * png.width + x) * 4; return png.data[i] + png.data[i + 1] + png.data[i + 2]; };
  let outliers = 0, peak = 0;
  for (let x = 1660; x <= 1917; x++) {
    const center = Math.round(249 + (x - 1644) * 0.5);
    for (let y = center - 2; y <= center + 2; y++) {
      const residual = sum(x, y) - (sum(x - 1, y + 2) + sum(x + 1, y - 2)) * 0.5;
      if (residual > 20) outliers++;
      peak = Math.max(peak, residual);
    }
  }
  return { outliers, peak, region: 'Known diagonal crack at x=1660..1917, y=round(249+(x-1644)*0.5) +/-2 pixels' };
}
const seam = { before: crackMetric('before'), after: crackMetric('final') };
assert(seam.after.outliers < seam.before.outliers * 0.25, 'Known patch crack remains');
write('validation.json', {
  passed: true, matchedViews: 33, resolution: [1920, 1080], cameraTolerance: 0.00001,
  sourceFilesCompared: original.length, changedExistingSources: changed.map(file => file.path),
  deletedSources: [], protectedFiles: 460, approvedSites: 35, researchRecords: 687,
  nativeChecks: native.checks.length, navigationPassed: true, patchCrack: seam,
});
write('changed-files.json', {
  runtime: changed.map(file => ({ path: file.path, beforeSha256: file.sha256, afterSha256: hash(file.path) })),
  addedTools: ['map-repair-audit.gd', 'map-repair-capture.ps1', 'map-repair-validate.gd', 'map-repair-report.mjs'].map(name => `godot-prototype/tools/${name}`),
  evidenceDirectory: folder,
  note: 'Compared with task-start source snapshot; earlier uncommitted work is preserved. No commits or pushes.',
});
const fmt = value => Number(value).toFixed(2);
const selected = ['campaign', 'catana', 'caspian-3300', 'tarquinii-close', 'roma-transition', 'maximum'];
const perf = selected.map(name => {
  const a = before.find(view => view.name === name), b = after.find(view => view.name === name);
  return `| ${name} | ${fmt(a.steady.averageFps)} / ${fmt(b.steady.averageFps)} | ${fmt(a.steady.onePercentLowFps)} / ${fmt(b.steady.onePercentLowFps)} | ${fmt(a.gpu.meanMs)} / ${fmt(b.gpu.meanMs)} | ${fmt(a.steady.maxMs)} / ${fmt(b.steady.maxMs)} | ${a.drawCalls} / ${b.drawCalls} |`;
}).join('\n');
write('REPORT.md', `# Map rendering repair — 29 October 2026

Three confirmed rendering defects were corrected while preserving the approved geographic/political presentation. Only two existing runtime shaders changed. [Open the 33-view before/after comparison](comparison.html).

## Findings and retained fixes

1. **False water over low land near the Caspian at distant zoom.** The ocean and the existing one-metre minimum land floor could quantize to the same depth. The source land masks were correct. The ocean shader now applies a small ocean-only raster depth offset, smoothly from zero at 1,200 km to full at 2,500 km. Vertex positions, coastlines, elevations and masks are untouched. It uses the Forward+ reversed-Z projection convention; [Godot's explanation](https://godotengine.org/article/introducing-reverse-z/). No assumption about the active depth attachment format is needed.
2. **Striped/shimmering inland water.** The analytic ripple frequencies in the shared river/lake shader were undersampled at campaign scale. Screen-space derivatives now suppress only unresolved frequencies, like mip filtering. Close resolved waves retain their original amplitudes and animation.
3. **Thin bright diagonal ocean crack near Catana.** The local FFT patch and background discard edge could leave a raster coverage gap. A one-metre overlap at the already flat outer patch ring and a small background depth offset close it. FFT simulation, displaced waves and the patch envelope are retained.

Runtime files: ocean/ocean_surface.gdshader, nile_water.gdshader. Added tools: tools/map-repair-audit.gd, tools/map-repair-capture.ps1, tools/map-repair-validate.gd, tools/map-repair-report.mjs. [Hashes and exact scope](changed-files.json).

## Actual Godot evidence and validation

- Godot 4.7.2, Forward+, Vulkan, RTX 3060 Laptop. 33 matched 1920×1080 views: all 22 existing navigation presets plus Caspian distance checks, Aral, Crete, Messina, close Tarquinii, Mediterranean overview, maximum zoom and the Roma transition. Recorded camera positions/bases match within 0.00001; FOV and clipping planes match exactly. The approved neutral-gray transition remains 60–180 km.
- Selected evidence is **before/** versus **final/**. Images are actual, unretouched viewport captures. UI layers are hidden for inspection; world labels remain. Water animation clocks are frozen for repeatable stills. Raw capture/process logs and camera metrics accompany each set.
- All **12 current native rendering checks pass** in [native-delivery/validation.json](native-delivery/validation.json). At the reproduced Caspian pose, water-colored source-land probes fall from **1,631 to 16 out of 2,480** (99% reduction). Residual coast-pixel classification is tolerated below 2%, not presented as zero. The reference reproducer must exceed 20 failures; the repair must remove more than 95%.
- The lake alias metric is the horizontal pixel second difference over 1,373 interior-water samples: before **${native.checks[3].details.before.pixelSecondDifference}**, after **${native.checks[3].details.after.pixelSecondDifference}**. This is a targeted alias regression metric, not an artistic quality score.
- The known Catana crack drops from **${seam.before.outliers} to ${seam.after.outliers}** bright-line outliers in the recorded local region. The matched close-ocean RGB average change is **${native.checks[0].details.mean}** on a 0–1 scale; the maximum localized change is **${native.checks[0].details.max}** at repaired coverage. Close inland water average change is **${native.checks[4].details.mean}**, maximum **${native.checks[4].details.max}**. Close captures should be judged visually alongside these metrics; they are not claimed pixel-identical.
- Existing navigation regression passes (seven original distances, two rejected collisions, isolated capture names). Existing geography validation passes. All **460 protected files, 35 approved coordinates and 687 research records are preserved**. Full task-start comparison checks **2,936 existing source/asset files**: exactly the two intended shader changes, no deletions. Terrain shader, camera/controller, political configuration, masks, elevation, settlement data and FFT simulation are byte-unchanged.
- [Aggregate validation](validation.json), [navigation log](navigation.log), [protected data check](protected-integrity.txt).

## Performance: before / final

Each view records 120 uncapped, VSync-off, settled submitted frame intervals using hidden-window forced draws. These short sequential captures are useful regression samples, **not** sustained gameplay, camera-motion, cold-load or first-render benchmarks. Thermal/load variation and submission/readback overhead prevent attributing all FPS differences to the shader changes. The normal game cap/settings are unchanged. No meshes, textures, compute passes or draw calls were added by these fixes.

| View | Average FPS | 1% low FPS | Mean GPU ms | Max submitted interval ms | Draw calls |
| --- | --- | --- | --- | --- | --- |
${perf}

Full raw timings: [before](before/views.json), [final](final/views.json). No sustained 60 FPS guarantee or new RAM/VRAM measurement is claimed.

## Limits and rejected experiments

- The maximum zoom and outer geography coverage edges remain visible. These are finite source-world/water coverage limits, not repaired by inventing geography or silently restricting camera controls. See maximum and mediterranean in the comparison.
- Coarse terrain relief/LOD softness, source coastline resolution and occasional coast-pixel jaggedness remain. A terrain-normal experiment did not resolve the investigated coarse relief and was reverted byte-for-byte. No terrain quality improvement is claimed.
- This repairs the three reproduced defects, not every possible camera/location combination. Static captures and sampled yaw checks do not certify all animated traversal conditions or other GPU/backends. Legacy fallback water is unchanged.
- Earlier native and native-1920 test logs are retained as failed harness experiments: the first did not reproduce the matched 1080p case; the second used an unrealistic zero-error coast-pixel threshold. Current validation explicitly requires 1080p, verifies the old failure, then applies the documented 2% coast-pixel tolerance. The after folder predates the patch-crack repair; relief-probe is the rejected terrain experiment; neither is delivery evidence. Native-final predates the last crack fix; use native-delivery.
- The pre-task inland-water shader copy was reconstructed by reversing the exact known edit and verified byte-identical against the task-start SHA-256 before use. The baseline screenshots themselves were captured before edits.

No new third-party assets/code, gameplay, interface, ownership, coordinates or research changes. No commits or pushes. Next work should separately address dataset-edge presentation and coarse terrain transitions, preserving the approved art direction.
`);

const names = after.map(view => view.name);
const script = `const names=${JSON.stringify(names)};const picker=document.querySelector('select');const images=[...document.querySelectorAll('img')];const slider=document.querySelector('input');const afterLayer=document.querySelector('.after');function clip(){afterLayer.style.clipPath='inset(0 0 0 '+slider.value+'%)';document.querySelector('output').textContent=slider.value+'%';}function show(){const name=names[picker.selectedIndex];images[0].src='before/'+name+'.png';images[1].src='final/'+name+'.png';document.querySelector('#rawbefore').href=images[0].src;document.querySelector('#rawafter').href=images[1].src;document.querySelector('#view').textContent=name;}picker.addEventListener('change',show);slider.addEventListener('input',clip);document.querySelectorAll('[data-view]').forEach(button=>button.addEventListener('click',()=>{picker.selectedIndex=names.indexOf(button.dataset.view);show();}));picker.selectedIndex=names.indexOf('caspian-3300');show();clip();`;
new Function(script); // Syntax check the self-contained local review page.
write('comparison.html', `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Map repairs — actual Godot comparison</title><style>body{margin:0;background:#16232c;color:#e8eef0;font:16px system-ui}main{max-width:1500px;margin:auto;padding:20px}h1{font-size:25px}a{color:#a4d8ff}button,select{font:inherit;padding:7px;margin:4px;background:#293e4c;color:white;border:1px solid #65808f;border-radius:4px}.stage{position:relative;aspect-ratio:16/9;background:#101820}.stage img{position:absolute;inset:0;width:100%;height:100%;object-fit:contain}.caption{position:absolute;bottom:10px;padding:6px 12px;background:#10212dcc}.beforelabel{left:10px}.afterlabel{right:10px}input{width:min(80%,600px)}p{line-height:1.5}.controls{display:flex;align-items:center;flex-wrap:wrap;gap:6px}</style><main><h1>Map repairs — <span id="view"></span></h1><p>Actual matched 1920×1080 Godot captures. Left: before. Right: final. Drag the divider to inspect the same pixels. All 33 views are available; changes are localized rather than a new map style.</p><div class="controls"><label>View <select>${names.map(name => `<option>${name}</option>`).join('')}</select></label><button data-view="caspian-3300">Caspian depth conflict</button><button data-view="catana">Ocean patch crack</button><button data-view="tarquinii-close">Close ocean</button><button data-view="roma-transition">Map transition</button></div><p><label>Divider <input type="range" min="0" max="100" value="50" aria-label="Before after divider"> <output>50%</output></label></p><div class="stage"><img alt="Before repair"><img class="after" alt="After repair"><span class="caption beforelabel">BEFORE</span><span class="caption afterlabel">FINAL</span></div><p><a id="rawbefore">Original before PNG</a> · <a id="rawafter">Original final PNG</a> · <a href="REPORT.md">Findings, performance and limits</a> · <a href="validation.json">Validation</a></p><p>Retained fixes: distant sea/land depth conflict; undersampled inland-water ripples; FFT patch coverage crack. Finite source-world edges and coarse terrain relief remain visible at extreme views. Water clocks are fixed for repeatable stills; no image retouching.</p></main><script>${script}</script></html>`);
console.log(JSON.stringify({ passed: true, matchedViews: names.length, nativeChecks: native.checks.length, changedExistingSources: changed.length, seam }, null, 2));
