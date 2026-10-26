# Strategic relief and Mediterranean water

**Historical failed checkpoint, superseded by [REPAIR.md](REPAIR.md).** Pickle rejected this version because capture profiles leaked into production navigation and its validators could pass without complete scenery. The measurements below are historical and are not acceptance evidence for the repaired implementation.

Implemented for review on 2026-10-26. No commit or push. This checkpoint changes Godot presentation only. [Matching comparisons](evidence/visual-comparison/index.html) and [measurements](evidence/visual-comparison/measurements.json) cover ten regions at overview, strategic and close scales.

## Why mountains previously appeared late

The old launch selected an 8,500 km, 78-degree overview, despite the initial variable containing 5,200 km. At those distances true kilometre-scale elevations occupy very few pixels. Independently, `_process()` faded `detail_strength` to zero between 250 and 1,800 km, replacing all slope/altitude/ecological material variation with the macro colour texture. Loading a closer tile also introduced higher-resolution normals and heights over the existing 650 ms reveal. World meshes already used all 129-by-129 samples; the global context used a 513-by-513 grid and Italy had a separate 449-by-449 backdrop. Fine world detail and sharper normals were concentrated around the camera focus. These were combined camera, material and source-resolution effects, not a new height-scale change or a missing mountain-generation system.

## Water

`water.gdshader` retains the original plane and all coast/inland exclusions. Five analytic normal-gradient wave layers use different wavelengths, speeds and directions. Cross-phase modulation breaks up straight scrolling bands; screen-space derivatives fade subpixel waves before specular evaluation. Directional and environment specular response, distance-aware roughness and restrained Fresnel colour improve surface lighting. No screen-space reflection pass, texture download or CPU vertex animation was added.

Existing shore-distance fields blend coastal and offshore colour. This is shore proximity, **not bathymetry**. A low-opacity close-range wash uses that same field; it creates no new shoreline, displacement, alpha change or foam mesh. Inland lake surfaces retain their existing calm treatment and estimated datums.

The only animated input is `water_time`, advanced once per frame. The UI toggle and `run.ps1 -StaticWater` freeze it, including all wave/foam motion. Minimized windows stop the water clock. This standalone Godot app does not claim to inherit the browser/OS reduced-motion preference automatically. All settings live in `data/visual-settings.json`.

## Strategic and global terrain

The default `campaign` camera is 13 E, 42 N, 1,100 km distance and 42-degree pitch. Home and the overview button retain the 8,500 km view, and normal zoom limits remain 1.2–30,000 km. Named strategic views expose the Alps, Apennines, Sicily, Pyrenees, Greece, Anatolia, Egypt, Atlas, Zagros and eastern mountains; existing other regional presets remain available. A configurable 8% per-frame zoom-step cap prevents a large catch-up jump after a loading stall; it does not eliminate the stall itself.

Materials now retain a configurable 0.62 weight at distant scales rather than disappearing. Existing elevation, slope, ecological colour and source-river corridor variation continue to distinguish wet lowlands, dry plateaus, mountains and coasts. No new regional rectangles, climate claims or vegetation distributions were added.

`tools/strategic-relief.mjs` derives one 2,785-by-1,601 world-normal lighting field from the 176 existing world DEMs and 85 Italian fine DEMs. Projection-aware cross products preserve geographic lighting orientation. Fine-data outer edges blend over 0.15 degrees for shading only. Source paths and SHA-256 hashes are retained alongside the texture. The same texture spans context and detail meshes, gradually contributing between 120 and 500 km. A bounded directional relief-contrast term improves ridge readability; fine texture normals fade out at strategic distances to avoid shimmer.

This preserves existing silhouettes and display elevation scale (1.5). It does **not** increase geometry resolution, recover missing source detail, exaggerate new mountains, or make a close-up-quality mesh resident over the whole world. Context silhouettes remain limited by the existing coarse grid. The 12-detail-plus-context residency cap, one-tile-per-frame loading and parent-height reveal remain intact. A configurable 0.6 km fragment-coverage overlap keeps parent terrain beneath differently projected mesh joins; source vertices and sampling are unchanged. This reduced the inspected leaks north of the Alps; occasional fine edge glints remain visible in the default/overview captures, so complete seam elimination is not claimed.

The shared system covers the full existing 12 W–75 E, 12–62 N envelope, including Iberia/Gaul, Balkans, Anatolia, North Africa, Levant, Mesopotamia and Iran. Representative validation is not a claim that every location is polished.

## Inspection and reproduction

```powershell
.\godot-prototype\run.ps1
.\godot-prototype\run.ps1 -View greece
.\godot-prototype\run.ps1 -View zagros -StaticWater
node godot-prototype/tools/strategic-relief.mjs
# Use a new stage name: capture tooling refuses to replace an existing evidence folder.
.\godot-prototype\tools\visual-capture.ps1 -Stage review
node godot-prototype/tools/visual-report.mjs baseline review
```

Capture profiles are in `data/visual-views.json`: strategic distances are 650–1,100 km, overview is 3.2 times those distances, and close inspection is 0.16 times. The comparison tool asserts identical camera objects, image dimensions, 35 sites, 687 retained records and bounded residency. These fixed-profile captures are independent of changed production presets.

Run `tools/visual-validate.gd` through the installed Godot executable with `--script res://tools/visual-validate.gd` at 1920×1080 for GPU/static-water and camera checks. The existing `global-validate.gd`, `global-verify.mjs`, `regional-verify.mjs` and `check-integrity.mjs` remain applicable. Validators write presentation evidence inside this prototype.

## Measured checkpoint

Thirty camera pairs passed camera/dimension/count assertions at 1920×1080 on the RTX 3060 Laptop GPU using Godot 4.7.2 Forward+. These sequential samples use the last 300 consecutive settled frames and are frequently refresh-limited. They are not cold-cache or sustained navigation benchmarks.

| Strategic view | Before FPS | After FPS | After p95 ms | Resident terrain |
|---|---:|---:|---:|---:|
| Alps / northern Italy | 121.9 | 120.3 | 10.95 | 13 |
| Apennines | 131.4 | 133.7 | 10.16 | 13 |
| Sicily | 144.0 | 143.7 | 9.71 | 13 |
| Greece | 144.0 | 144.0 | 10.16 | 13 |
| Anatolia | 141.6 | 144.0 | 10.97 | 13 |
| Egypt | 143.9 | 143.8 | 10.44 | 13 |
| Zagros | 141.6 | 127.2 | 10.97 | 13 |
| Eastern coverage | 129.0 | 130.4 | 10.84 | 13 |

All 30 after-view settled averages range from 99.5 to 144.9 FPS. This does not establish uninterrupted 60 FPS: the largest measured startup/streaming frame is 1,457.9 ms. The Zagros strategic sample regressed about 10%, and several regional p95s increased despite similar mean FPS. Uncontrolled background load and short sampling prevent causal attribution; retain these regressions for review rather than claiming a speedup. Strategic GPU memory rose by approximately 24.4–24.6 MiB, consistent with the mipmapped relief texture. Additional UI controls add four observed draw calls.

Sampled peak working set was 1,183.8–1,206.1 MiB across the 30 after captures, counting the launched console wrapper and its direct Godot child at 250 ms intervals. Sicily static-water comparison measured 143.9 FPS strategic / 144.0 FPS close, versus 143.7 / 144.0 animated. Those refresh-limited samples show no resolved animation-time cost; the wave shader still executes in static mode. The final zoom-step cap was added after these settled captures and does not change their fixed camera poses or material output.

The original ten profiles include the Algerian Tell/Aurès Atlas area. Additional Moroccan High Atlas captures are in `evidence/visual-high-atlas/`; those are after-only inspection evidence, not fabricated before/after pairs. The actual default campaign and full-world overview are captured in `evidence/regional-visual-default/`.

Typechecking and nine relevant Vitest files (83 tests) passed. The existing global/regional source validators preserve 2,928,816 world and 1,414,485 Italian elevation samples, 2,992 world and 10,285 regional coast probes, and 484 Nile source vertices. The integrity validator preserves all 460 protected files, 35 exact site identities/coordinates and the byte-identical 687-record research copy. GPU water checks confirm identical static patches, changing animated patches and unchanged camera/terrain sampling. Full traversal/selection validation results are recorded separately in the evidence folder.

Final GPU validation passed 33 region/scale checks, all 35 selections, research-node separation, pointer zoom, and a 180-frame interpolated approach. The approach's largest distance step was exactly 8%, its largest sampled focus-height change was 1.83 m, and a 1,294.4 ms loading frame remained. Those focus samples do not bound changes everywhere in the viewport. The existing headless global validator passed 16 presets, reporting 0.0000652 m maximum sampled placement error and zero sampled shared-world-edge error. No page/shader/runtime errors were logged in the completed capture or GPU validation runs.

Repository-wide ESLint still fails: 3,870 errors (3,769 generated Godot Vite cache / 101 Godot tooling), zero warnings and no errors outside Godot. No lint configuration was changed. The full emitting `npm run validate`/build suite was not run; the scoped 83-test result must not be described as all repository tests passing.

## Files and evidence

All paths below are relative to `godot-prototype/`.

- Modified implementation: `world.gd`, `terrain.gdshader`, `water.gdshader`, `run.ps1`.
- Modified documentation: `README.md`.
- Refreshed existing runtime evidence: `evidence/global-navigation-validation.json`.
- Added configuration: `data/visual-settings.json`, `data/visual-views.json`.
- Added derived lighting assets: `data/visual/relief.png`, `data/visual/relief-provenance.json`.
- Added tools: `tools/strategic-relief.mjs`, `tools/visual-capture.gd`, `tools/visual-capture.ps1`, `tools/visual-report.mjs`, `tools/visual-validate.gd`.
- Added reports: `VISUAL-UPGRADE.md`, `VISUAL-DEBT.md`.
- Added captures, measurements, runtime checks and comparison gallery under the new `evidence/visual-*` and `evidence/regional-visual-default/` folders. Early preview/continuity folders are intermediate evidence; the 30 official pairs use `visual-baseline/` and `visual-after/`.

The [delivery manifest](evidence/visual-delivery.json) enumerates every changed/new nonignored file with its size and SHA-256, including each individual evidence artifact. Engine-owned caches and ignored diagnostic logs are not source deliverables. No canonical geography, research, Three.js, simulation or persistence files changed.

## Remaining visual limits

This is a reusable presentation improvement, not final commercial art. Coarse/fine geometry can still change local silhouettes during the existing reveal, even though lighting now persists across distance. Some lake/coast joins, fine tile-edge glints, source-resolution facets, synthetic woodland patches, dark close-view Sicily river strokes and periodic wave structure remain. Shore fields are approximate; ancient Delta branches, water levels, seasonal snow and vegetation are not verified reconstructions. The eastern finite data boundary is visible when the camera looks beyond 75 E; no terrain was invented beyond coverage.

The overlap corrects observed background leaks but is not a proof that every possible projected join is gap-free. Expensive cold shader compilation, PNG decoding, synchronous tile uploads and sustained traversal remain performance risks. See [separate audit debt](VISUAL-DEBT.md) for the unrelated Three.js findings and repository-wide lint configuration failure.

Recommended next visual milestone: profile cache-cold continuous journeys across context/detail boundaries, then improve coarse geometry and authored vegetation where measured source limitations justify it. Keep canonical data and ownership work separate.
