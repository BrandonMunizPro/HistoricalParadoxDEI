# Sicily and southern Italy environmental slice

Review candidate, 27 October 2026. No commit or push. The working tree already contained Coastline Polish V2; this builds on that state and preserves its work. Git HEAD remains `cbab459`. The [seven matched before/final comparisons](evidence/slice/comparison.html) show Catana at 1.8 km and Sicily/Naples at 14.4, 90 and 288 km. Three additional production views cover Greece, Anatolia and Egypt.

The close view changes substantially: ground has soil, scrub and mineral structure; trees have opaque volumes and contact shadows; stones add ground clutter; Catana's repeated roofs and rigid rows have more variation. Wider land cover has continuous, finer-grained structure rather than the old isolated woodland blobs. **This is a reviewable environmental slice, not a claim of Rome II/Imperator parity.** Coarse shore geometry and simple architecture remain obvious, and the improvement is stronger close up than at broad overview.

## Why the previous world looked like a prototype

1. **Wrong material scales:** the old grass texture formed conspicuous oversized veins close up, while metre-scale replacements averaged to a flat color at campaign height. One material scale could not support all camera distances.
2. **Disconnected vegetation:** sparse random trees and a separate, coarse ecological color field did not describe the same woodland. Repeated alpha cards read as dots/cutouts and supplied little depth.
3. **Weak contact and depth:** vegetation cast no shadows, warm ground dominated the palette, and much source relief shading appeared only farther out. Terrain, sea and props did not read as one scene.
4. **Uniform environment/settlement edges:** regular identical houses, unbroken ground and bare cut coast edges made the scene feel assembled from placeholders. The existing sea shader alone could not repair that.

The previous local research remains a benchmark. Revisited Rome II's inventory at `research/rome2-dei/tools/rome2_data_list.txt`: campaign-specific `display/trees/trees.campaign_tree_list` and river-froth resources are directly listed. Imperator's local `game/gfx/map/terrain/` contains separate beach/boulder diffuse, normal, mask and property resources, plus material/detail settings. Its `map_object_data/` separates locators from terrain materials. These observations support a layered presentation with material detail and placed objects; they do not establish either game's proprietary rendering algorithm. No game assets or code were imported. Installation paths are documented in the preceding [reference report](COAST-POLISH-V2.md).

## Four implemented priorities

**Ground at multiple scales.** Three original, generated albedo materials supply dry grass/mineral soil, limestone/scree and landscape-scale scrub/outcrop structure. Fine detail remains close; the mosaic modulates the broader ground treatment instead of replacing its climate/forest colors. Rotation/blending reduces obvious repetition, and rock uses triplanar sampling. Aridity reduces the Mediterranean mosaic outside suitable environments. Existing elevation, slope, ecology, snow/volcanic cues and geographical coordinates remain the inputs; no hills, rivers or historical land cover were invented.

Saved assets: `assets/slice/mediterranean-ground.png`, `assets/slice/limestone-scree.png`, `assets/slice/mediterranean-mosaic.png`. They were generated with the built-in image tool, then copied into the project. Exact prompts and provenance are in [assets/slice/provenance.json](assets/slice/provenance.json). The old assets were retained. Generated textures are artistic materials, not geographic evidence, and perfect seamlessness is not asserted.

**Coherent vegetation and original prop geometry.** `habitat.gd` and `habitat.gdshaderinc` share a deterministic integer hash and continuous habitat function. The ground treatment and CPU placement use this same field with fertility, dryness, height and slope constraints. Twelve reusable branching tree variants now have opaque irregular crown volumes with a smaller distant mesh; scrub uses scale variation. Four closed, faceted boulder variants share the instancing path. Local props cast shadows; distant batches retain their cheaper rendering path. This is interpretive scenery, not reconstructed 278 BCE plant distribution.

Placement remains bounded: 6,000 candidates and at most 1,800 accepted props per scenery cell, nine close cells, and the existing resident regional/global groups. Empty habitat is rejected before expensive rendered-terrain samples. This fixed an early prototype timeout. A post-fix diagnostic reached all 12,624 then-current props in roughly 8.2 seconds at 1.8 km, with later GPU samples around 5–7 ms; final counts differ after the final habitat changes. Terrain residency remains 12 detail tiles plus context.

**Lighting and relief depth.** Neutraler sunlight, configurable ambient/exposure settings, local contact shading and earlier use of source-derived strategic normals improve the relationship between props and terrain. An experimental soft-shadow configuration produced stippling; it was rejected. An experimental lower terrain shadow bias produced acne; original safe bias values were restored. Clear hard sunlight/shadows remain. Neither source elevation nor the navigation camera was moved.

**Grounded coastal and settlement surroundings.** The new shore/ground materials and limited boulder placement extend to low coastal ground while respecting the existing land mask. Water remains the V2 system; the task did not become another sea-shader color pass. Catana's existing interpretive model gains deterministic masonry/roof variants, modest orientation/spacing changes and a less uniform edge. Its anchor is unchanged. This improves presentation, not the historical settlement plan. The generic batching and material code can be reused; no new settlement simulation or ownership system exists.

## Implementation files

Modified in this slice: `terrain.gdshader`, `world.gd`, `canopy_assets.gd`, `regional_scenery.gd`, `data/visual-settings.json`.

Added runtime/test resources: `habitat.gd`, `habitat.gdshaderinc`, `foliage.gdshader`, the three textures and provenance/ignore files under `assets/slice/`, and `tools/habitat-validate.gd`. The exact before-to-final runtime file/hash list is [implementation-changes.json](evidence/slice/implementation-changes.json). README, this report and evidence files accompany them. The Git diff also contains the preceding uncommitted V2 changes; do not confuse those with this slice's incremental file list.

## Validation and performance

All final captures use runtime fingerprint `cfa4048cf7026693a5e69d7a7e027c5f5bb216306c5b1b469be3ddf20274da00`. Before/after manifests, raw screenshots, logs and timestamps are retained. The comparison generator asserts exact camera dictionaries, expected source revisions, complete scenery, 35 sites and 13 resident tiles.

| Check | Result/evidence |
| --- | --- |
| `npm.cmd run validate` | Typecheck, repository-wide lint, 475 tests / 34 files, build and build smoke passed. `evidence/slice/validate-final2.log`. |
| `node godot-prototype/tools/check-integrity.mjs` | All 460 protected files unchanged; 35 exact identities/coordinates; all 687 research records and byte-identical research copy. `integrity2.log`. |
| Godot `tools/parse-scripts.gd` | 15 GDScript modules parsed. `parse2.log`. |
| Godot `tools/navigation-test.gd` | Original production distances and capture isolation/collision cases pass. `navigation2.log`. |
| Godot `tools/global-validate.gd` / `regional-validate.gd` | 17 global / nine regional production views pass: exact distances, scenery readiness/timeouts, expected positive vegetation and 35 selections. `validation2/*.json`. |
| Godot `tools/habitat-validate.gd` | Actual GPU vs CPU agreement over 4,096 samples; maximum error 0.00220, below 0.005. Alpine exclusion also passes. `habitat-final2.log`. |
| Godot `tools/visual-validate.gd` | Static water patches identical, animated patch differs, unchanged camera/terrain. `water2/water.json`. |
| Source verification and paired capture assertions | Final source inputs unchanged; all seven camera pairs match. `source-verify2.log`, `comparison.json`. |

Measured at 1920×1080, Godot 4.7.2 Forward+, RTX 3060 Laptop GPU. Final settled means span **127.6–144.5 FPS**, with **13 terrain tiles** throughout. Production Catana: **138.7 → 144.2 FPS**, mean GPU **5.60 → 4.10 ms**, props **28,036 → 11,287**. Naples close: **118.9 → 127.6 FPS**, GPU **6.33 → 5.84 ms**. Sicily strategic: **120.6 → 144.2 FPS**, GPU **5.57 → 3.81 ms**. These are short paired desktop samples, often refresh paced; variation is not proof of a universal speedup. Full measurements and boot timings: `comparison.json`.

### Loading hitch findings

The first candidate Catana process (`slice-final`, superseded source `510903...`) still had a **1,834 ms frame**, reporting **1,808 ms render CPU** versus about **39 ms GPU** for the associated slow-frame record. Its warm repeat's maximum was **70.6 ms**. This points to first-use render/pipeline setup, not sustained terrain/prop rendering; no driver event profile was collected, so the exact driver/compiler cause remains an inference. That older warm run overlapped headless validation and is used to characterize loading behavior, not as the primary FPS sample.

After the final boulder topology correction, the current `slice-final2` Catana maximum was **186.4 ms** and `slice-warm2` was **266.7 ms**. These captures ran serially before final validation, but already-warm pipeline caches were retained. No cache was cleared to manufacture a cold measurement, and the low current maxima do **not** establish that the cold hitch is fixed.

Separate boot instrumentation measures roughly **1,058 ms** loading/converting/uploading existing geographical masks/ecology and **115 ms** for the three new material images in the current final Catana capture. This CPU boot cost is distinct from the later render-thread frame. Unused legacy material loads were removed as part of the material replacement. No cache, database or source asset was deleted. The cold hitch is **not fixed** and still needs a future loading-screen/pipeline-warmup decision; no unrelated renderer refactor was attempted.

## What still looks artificial

- Coarse raster coastline cuts, flat coastal ledges and thin/angular rivers remain. New materials and stones do not supply missing shore geometry or bathymetry.
- Tree crowns and rocks are visibly faceted close up. At medium distance the individual trees can still read as speckles, and the procedural habitat is not an authored ecological reconstruction.
- Catana is still a simple repeated-building model without an authored street/harbor/landmark set. Its variation is an improvement, not archaeological fidelity.
- Strategic terrain is more coherent but still lacks the rich authored transitions and recognizable environmental landmarks of the reference games. Some texture repetition and broad color mosaics remain visible; do not call the broad view finished.
- Vegetation still has distance cutoffs and a bounded close-cell footprint. The existing streaming architecture was preserved, not redesigned.

## Review and reproduction

Start with [the matched gallery](evidence/slice/comparison.html), then inspect the production Catana image at full resolution and the 14.4/90 km pairs. `slice-final2/` and `slice-regression2/` under `evidence/repair-20261026/` are authoritative. `slice-preview*`, `slice-review` and the initial `slice-final`/`slice-regression` sets are intermediate visual experiments. The initial previews contain recorded errors/timeouts; the initial final candidate was superseded to fix hollow-looking boulder topology.

```powershell
& .\godot-prototype\tools\checkpoint-capture.ps1 -Stage slice-owner-review -Views catana -Profiles sicily,italy -ProfileFile data/coast-views.json -SourceManifest res://evidence/slice/final2-source.json
node godot-prototype/evidence/slice/compare.mjs
node godot-prototype/tools/checkpoint-source.mjs verify godot-prototype/evidence/slice/final2-source.json
```

Interactive: `godot-prototype/run.ps1 -View catana`, then the existing Sicily/southern Italy navigation and zoom controls. Validator executable: `C:\Users\brand\tools\godot\4.7.2-stable\Godot_v4.7.2-stable_win64_console.exe`, `--path godot-prototype --script res://tools/<validator>.gd`; use `--headless` for parse/navigation/global/regional suites. Global/regional extra arguments: `-- --output=res://evidence/slice/validation2 --source-manifest=res://evidence/slice/final2-source.json`. Water uses GPU rendering and `--output=res://evidence/slice/water2`; habitat validation also requires real GPU rendering.

Await owner review of the actual images. The next major quality gain would require better close coast geometry and a small authored settlement/shore asset set, rather than another isolated water-color adjustment. No commit, push or gameplay integration was performed.
