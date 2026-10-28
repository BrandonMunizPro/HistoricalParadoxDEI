# Campaign environmental art-direction pass

Review candidate, 27 October 2026. No commit or push. The owner-approved regional expansion and preceding uncommitted work were preserved. HEAD remains `cbab45903ee34973b68fac5360ad17dbe24c90a6`; this is an additional Godot-only milestone, awaiting independent visual review.

The most visible changes are denser, larger close woodland; recognizable grove stands at campaign distances; quieter ground surfaces; depth-dependent blue haze; and removal of the Alps' false dark shadow wedges. This is a substantial presentation change, **not a claim that Rome II/Imperator quality has been reached**. Repeated grove shapes, stylized tree geometry, source-limited landforms and simplistic shores/rivers still stand out.

## Supplied references and visible gaps

Viewed the three newest files in `C:\Users\brand\OneDrive\Pictures\Screenshots`, selected by last-write time:

| File | Observed reference | Relevant gap in the existing Godot output |
| --- | --- | --- |
| `Screenshot 2026-10-27 140402.png` | Rome II campaign: forests spanning foothills, mixed crowns/conifers, dark canopy interiors, bright clearings and blue distance | Tiny scattered tree dots and painted ground cover did not read as woodland; depth was weak |
| `Screenshot 2026-10-27 140356.png` | Rome II campaign: exposed rock faces, coastal vegetation, broken sunlit sea, strong foreground/background separation | Ground was broadly mottled, rock props were rounded, mountains too smooth, water repetitive and coast edges simple |
| `Screenshot 2026-10-27 140346.png` | Imperator political view: legible regional relief and restrained land/water balance | Useful strategic readability reference; its ownership colors and map labels are outside this assignment |

These are owner-supplied browser screenshots of reference images, not imported game resources. [references.json](evidence/art-direction/references.json) records their local paths and hashes. They were viewed locally and left unchanged. No proprietary art, textures, models or shaders were copied into the project.

Prior local research remains applicable: Rome II's inventory (`research/rome2-dei/tools/rome2_data_list.txt`) separates campaign trees and river-froth resources; Imperator's `game/gfx/map/terrain/materials.settings` and detail settings separate materials, masks and environmental detail. Those directly observed categories support layered ground plus discrete scenery. They do not establish the games' complete rendering algorithms. Install paths and earlier observations are in [COAST-POLISH-V2.md](COAST-POLISH-V2.md) and [ENVIRONMENT-EXPANSION.md](ENVIRONMENT-EXPANSION.md). No further extraction or installation changes were needed.

## Four implemented priorities

**1. Woodland composition and silhouettes.** The existing shared habitat field now drives CPU placement through the same woodland threshold used by terrain shading. Configurable density and campaign-scale display sizes produce clearer grove/clearing contrast while retaining Mediterranean, temperate, dry scrub and riparian choices. New original coarse assets contain 24 smaller tree forms per stand, rather than oversized single crowns. Close scenery retains individual branching trees. Crown LOD now preserves every vertical latitude ring and reduces angular segments; the previous vertical-ring reduction made rounded crowns pointed at ordinary map distances. Palm fronds have separate pinnae instead of one solid blade.

Two existing materials handle the handover on the GPU using per-instance attributes: coarse geometry grows from zero over 8–35 km; close geometry shrinks over 12–32 km. Coarse groups are hidden at/below 8 km to avoid processing collapsed geometry. Close cells are no longer generated above 32 km, reducing medium-distance speckles and draw submissions. This changes scenery presentation, not camera modes or terrain LOD.

Coarse stands are intentionally scaled campaign abstractions, not measured biological tree heights or verified ancient forest boundaries. Their origins remain on rendered terrain. A tangent-plane shear follows the sampled ground beneath each stand. A 1.2 km footprint check keeps coarse stands away from sampled coastline/water points, river centrelines and the existing Catana clearance. These finite checks reduce overlap; they are not exact polygon clipping or per-tree reconstruction over every irregular shore or steep surface.

**2. Ground and mineral structure.** Existing original albedo assets are reused. Fine material structure has more weight, broad mosaic modulation is reduced, and a restrained canopy normal/color layer connects the ground cover to actual scenery. Exposed rock receives world-space strata modulation following existing elevation and slope; this affects material shading only and adds no geographical ridges or cliffs. Four original closed fractured outcrop meshes replace rounded sphere-based stones and reuse the existing mineral texture. No new bitmap asset pack or dependency was added.

**3. Lighting and atmospheric depth.** Warm sunlight, cooler fill and depth-mode haze replace the near-uniform exponential wash. Haze starts beyond a configurable fraction of the current view distance; foreground contrast survives while distant hills recede. Parameters live in `data/visual-settings.json` and use the existing Environment node. Existing source-derived relief, terrain geometry, exposure controls and close scenery shadows remain.

A controlled Alps test isolated the dark wedge defect: [normal preview](evidence/repair-20261026/art-preview/godot-profile-alps-regional.png) versus [same-camera terrain-shadow diagnostic](evidence/repair-20261026/art-shadow-diagnostic/godot-profile-alps-regional.png). Disabling terrain-cast shadows removes the wedges without changing a vertex. Final lighting therefore disables those problematic casters globally, retaining directional/source-normal relief and close prop shadows. **Tradeoff:** mountains no longer cast real shadows onto other terrain. This resolves the observed shadow shapes, not every possible terrain seam.

**4. Sea/land palette integration.** Deep blue and coastal teal are coordinated with the ground and haze palette. The existing two moving ripple scales remain, with stronger normal response and mip-filtered gloss variation for broken highlights. Static water and all coastline, sea/lake exclusions and shore-distance inputs are preserved. Coastal distance remains an appearance cue, not measured bathymetry. This is the smallest change of the four; the reference's richer glitter and authored shore treatment remain ahead of this renderer.

## Architecture, integrity and bounded work

The same terrain generation, geographic projection, source meshes, height samples, global material families and bounded scenery loader remain. No source elevation or canonical coordinates were changed. Placement is deterministic for fixed source/configuration; yielding does not change candidate ordering or random seeds. There are 24 individual plant variants, 24 stand variants and four shared mineral variants. Counts in evidence are **instance records**: one coarse record represents a stand, not one botanical tree.

Limits remain 13 resident terrain tiles including context, at most 12 coarse scenery groups and nine close cells, 6,000 candidates and 1,800 accepted records per cell, with a 128-cell projected-river cache. Existing MultiMesh instancing is reused. The early candidate-count yield cap remains, with an additional 4 ms CPU-slice target checked every eight candidates. This addresses the variable cost of new footprint checks. Geometry and transforms are built when a cell loads; there are no per-frame CPU geometry rebuilds. The GPU morph, two material distance uniforms, environment parameters and existing streaming updates handle continuous presentation.

All environmental distribution and ground strata are interpretive artwork, separate from research records and canonical geography. No political mode, ownership, characters, roads, settlement approvals, gameplay, simulation integration or new player camera modes were introduced. The TypeScript foundation and Three.js remain intact.

## Matched visual evidence

[Open the 15 matched before/after pairs](evidence/art-direction/comparison.html). Full-size PNGs are unretouched 1,920 × 1,080 engine output; sheets are half-size layout previews. Longitude, latitude, position, distance, pitch, yaw and FOV match exactly for each pair. The owner reference images were not composited into game output.

| Region | Strategic / regional / inspection km | Result and remaining visible gap |
| --- | --- | --- |
| [Italy](evidence/art-direction/sheets/italy.png) | 90 / 31.5 / 3.6 | Much stronger close woodland and visible distant groves; repeated stand shapes, angular shores and simple water remain |
| [Greece](evidence/art-direction/sheets/greece.png) | 95 / 33.25 / 3.8 | Shared Mediterranean treatment and stronger depth; smooth source mountains and coarse coastal geometry remain |
| [Egypt / Nile](evidence/art-direction/sheets/egypt.png) | 180 / 63 / 7.2 | Desert/alluvial distinction retained, less pebble-like clutter and changed riparian forms; straight river ribbon and simple banks remain obvious |
| [Anatolia](evidence/art-direction/sheets/anatolia.png) | 150 / 52.5 / 6 | Dry ground/scrub retain regional identity, with clearer foreground/distance separation; macro mottling and source lake boundaries remain |
| [Alps](evidence/art-direction/sheets/alps.png) | 100 / 35 / 4 | False dark wedges removed, woodland and foothill relief more readable; rounded source silhouettes remain far from the reference's authored rock faces |

These use the existing capture machinery and a separate capture-only profile file. “Strategic” is that profile's framing, not a replacement for the production 1,100 km campaign default. Production presets and navigation are validated separately. Egypt framing follows an existing Nile vertex so close scenery is actually inspected.

Before revision: `ec4a261c34be8ced6aa713d1450866a4d3b231544cfe2e561109b749c4c1bbfc`. Final revision: `da362c955d859fd0feb663accab739ebb96fed40b057a1051b6927810d423ac9`. Frozen manifests are [before-source.json](evidence/art-direction/before-source.json) and [final2-source.json](evidence/art-direction/final2-source.json). Authoritative screenshot stages are `art-before` and `art-final2` under `evidence/repair-20261026/`. Earlier previews, the shadow test and `art-review` are diagnostics/predecessors, not final acceptance evidence.

## Exact implementation file list

All paths below are relative to `godot-prototype/`; the working tree also contains preserved earlier uncommitted changes.

| Files | Change |
| --- | --- |
| `canopy_assets.gd` | Original stand meshes, crown LOD silhouette fix, palm pinnae, shared woody shader |
| `foliage.gdshader` | Bark/leaf materials, canopy interiors, GPU handover and tangent-plane shear |
| `regional_scenery.gd` | Shared woodland threshold, density/scale, stand footprint checks, fractured mineral meshes, instancing attributes, visibility and time-budgeted generation |
| `environment_rules.gd` | Footprint-aware river index and configurable clearance margins |
| `terrain.gdshader` | Reduced broad mottling, canopy shading and restrained mineral strata |
| `water.gdshader` | Spatially varying gloss while preserving existing water boundaries/animation |
| `world.gd` | Configurable depth haze and terrain-shadow policy |
| `data/environment-presentation.json` | Scenery display scales, density, handover distances, footprint and generation budget |
| `data/visual-settings.json` | Material, sea, lighting and haze parameters |
| `data/art-direction-views.json` (added) | Capture-only matched framing, introduced before the baseline capture |
| `tools/art-validate.gd` (added) | 48 mesh variants and actual GPU close/coarse handover validation |
| `ART-DIRECTION.md` (added), `README.md` | This report and current review entry |

Evidence-only scripts, manifests, measurements, images and logs are under `evidence/art-direction/` and the `art-*` capture stages. The before/final source-hash delta and delivery manifest enumerate paths and hashes; the capture profile was already present in the before snapshot, so it is explicitly listed above. No new proprietary assets or generated raster materials were added.

## Validation and measured limitations

Final measurements are in [MEASUREMENTS.md](evidence/art-direction/MEASUREMENTS.md), [all paired metrics](evidence/art-direction/comparison.json) and the [nine-stage production/diagnostic tour](evidence/art-direction/navigation-final2/navigation.json). Godot 4.7.2 Forward+, RTX 3060 Laptop GPU, 1,920 × 1,080; at least 180 consecutive settled frames per screenshot. No build or validation workload ran alongside the final captures or tour. Desktop/thermal pacing was not controlled and existing shader/driver/native caches were retained.

The final 15 captures measured **79.9–144.3 FPS**, with **3.7–9.5 ms** mean GPU time. All had 13 resident terrain tiles and complete scenery. Sampled process memory was **1,268–1,314 MiB** (console wrapper plus direct Godot child, 250 ms polling); reported renderer video memory was **1,049–1,103 MiB**, not a measured allocator peak. Some pairs improve and others regress: added stand geometry and shading have real GPU cost, including Greek strategic views. Full paired results are retained rather than reduced to a performance-pass claim.

The earlier review exposed candidate CPU chunks up to **19.0 ms** and a **39.2 ms** warm navigation frame. The targeted scheduling correction reduced the final capture chunk maximum to **6.1 ms** and the final tour's warm navigation maximum to **24.0 ms**; upload slices peaked at **4.7 ms** in the final captures. The 4 ms budget is a target checked every eight candidates, not a hard upper bound. Smaller work slices trade latency for smoothness: Greece's complete tour readiness rose from about **7.0 to 9.0 seconds**. Final tour settled FPS was **103.0–143.4**; the Zagros close diagnostic measured **113.6 FPS / 7.4 ms GPU**. All stages stayed within residency bounds, including interrupted-generation recovery.

Startup is still **2.749–3.128 seconds**, including **1.705–1.935 seconds** of synchronous material initialization. The measured startup/streaming maximum frames were **74.0–116.5 ms**, but the boot work is a separate cost. The earlier 1.69-second cold-loading frame is **not declared fixed**; no cache-cleared benchmark was performed. Predecessor `art-review` results and its telemetry are diagnostic context, not final measurements.

Final test execution records are [checks.json](evidence/art-direction/checks.json), [npm-final-result.json](evidence/art-direction/npm-final-result.json) and the [npm log](evidence/art-direction/npm-final.log). The runner records exact engine arguments, UTC timestamps, standard error and exit codes. The intentional timeout-negative run is expected to return exit 1 and `passed:false`; its harness passes only when that failure occurs correctly. Positive vegetation assertions count plant/stand records, never rocks.

| Final check | Result |
| --- | --- |
| `npm.cmd run validate` | Exit 0: TypeScript, repository-wide ESLint, **475 tests / 34 files**, build and postbuild smoke passed |
| `tools/parse-scripts.gd` | **19** scripts compiled |
| `tools/navigation-test.gd` | Seven original distances, two rejected duplicate-name collisions, capture-only names isolated |
| `tools/environment-validate.gd` | 4,096 CPU/GPU family samples and plant mesh checks passed |
| `tools/habitat-validate.gd` | 4,096 CPU/GPU habitat samples passed |
| `tools/art-validate.gd` | **48** individual/stand variants checked; actual GPU proxy visible/hidden pixels **2,479 / 0**, close visible/hidden **303 / 0**; root transform retained |
| `tools/visual-validate.gd` | Static water patches identical; animated patch changed; camera and terrain unchanged |
| `tools/global-validate.gd` | **17** production views passed exact distances, complete scenery, expected positive vegetation, residency and all 35 selections |
| `tools/regional-validate.gd` | **9** production views passed the same checks |
| Forced timeout-negative | Expected exit 1 and explicit timeout failure; harness passed |
| `tools/environment-profile.gd` | Nine-stage continuous tour, bank exclusion and cancellation recovery passed |
| `node godot-prototype/tools/check-integrity.mjs` | **460 protected files unchanged**, **35 canonical identities/coordinates exact**, **687 research records**, byte-identical research copy |
| Source manifest verification | **2,632** files verified unchanged against final revision |
| `git diff --check` | Exit 0; only Git LF/CRLF conversion notices |

Existing lint scoping already separated generated Godot caches/evidence from legitimate source; no lint configuration changes or unrelated fixes were needed. Canonical inputs, source mesh/elevation files, source research, TypeScript and Three.js have no changes from this milestone. [implementation-files.json](evidence/art-direction/implementation-files.json) separates the new source delta from earlier uncommitted work; [delivery-manifest.json](evidence/art-direction/delivery-manifest.json) records authoritative artifact hashes. The artistic target remains subject to owner review despite passing automated checks.

## Visual gaps remaining after inspection

- Broad terrain silhouettes remain rounded because of the existing source and mesh resolution. Material strata cannot substitute for the reference's authored cliff and ridge geometry without changing the geographical presentation more substantially.
- Woodland now reads at several distances, but stand shapes repeat and isolated groups can still look too regular. The coarse representation is intentionally exaggerated. Newly loaded scenery can still visibly fill in; the smooth GPU handover applies once cells are resident.
- Close vegetation and mineral props remain stylized meshes, not production-grade botanical/geological assets. Fine branches/fronds can alias; sparse dry-region stands need further art review.
- The sea's repeating ripple structure is still visible close up, glitter is less varied than the reference, shore vertices remain angular and the Nile is still a simple ribbon. Those source/rendering limits were not hidden by fabricating geography.
- Real terrain-cast shadows are disabled to remove the confirmed wedge defect. Directional relief and prop contact/shadows remain, but mountain shadowing is now an explicit tradeoff.

The largest remaining artistic gap is convincing, less repetitive woodland and exposed-rock silhouettes at intermediate distance, followed by shore geometry and river-bank integration. Those should be reviewed in the matched gallery before expanding into gameplay or political presentation.

Reproduce from the repository root with a new stage/output name:

```powershell
.\godot-prototype\tools\checkpoint-capture.ps1 -Stage art-owner-review-new -Views @() -Profiles italy,greece,egypt,anatolia,alps -Scales strategic,regional,inspection -ProfileFile data/art-direction-views.json -SourceManifest res://evidence/art-direction/final2-source.json
npm.cmd run validate
.\godot-prototype\evidence\art-direction\run-checks.ps1
node godot-prototype/tools/check-integrity.mjs
node godot-prototype/tools/checkpoint-source.mjs verify godot-prototype/evidence/art-direction/final2-source.json
$g='C:\Users\brand\tools\godot\4.7.2-stable\Godot_v4.7.2-stable_win64_console.exe'
& $g --path godot-prototype --resolution 1920x1080 --script res://tools/environment-profile.gd -- --output=res://evidence/art-direction/navigation-new --source-manifest=res://evidence/art-direction/final2-source.json
```

The capture script refuses to overwrite an existing stage. Source validation rejects edits against a frozen manifest; a future implementation needs a new manifest. Existing caches and user/runtime databases are preserved. Independent Nexus/Pickle/owner review remains pending.
