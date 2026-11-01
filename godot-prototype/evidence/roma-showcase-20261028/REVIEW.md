# Roma district implementation and Rome II research

**Superseded:** this report describes the rejected large-grid iteration. The current result is the [hand-composed temple/market precinct review](PRECINCT-REVIEW.md) and [updated comparison gallery](index.html).

**This is a working, opt-in Roma art candidate, not a successful 2026-quality overhaul.** It supplies actual new geometry, materials, a local constructed surface, trees, matched Godot captures and measurements. It still falls short of the requested artistic standard, and its demanding close-view benchmark misses 60 FPS. Do not expand this kit or approve it merely because engineering checks pass.

Open [the four matched comparisons](index.html), [Rome II / DEI research](ROME-II-RESEARCH.md), [performance comparison](comparison.json), [navigation comparison](navigation-comparison.json), and [asset provenance](../../assets/roma-showcase/PROVENANCE.md).

## What the reference research changed

DEI's [resource documentation](https://divideetimperamod.com/resources/) establishes construction/resource dependencies, not a unique visible mesh for every building-chain level. The visual lesson is to give residential, trade, workshop, storage, ritual and defensive areas different forms and contextual details. No economy or construction mechanics were implemented.

Creative Assembly's [capital-city presentation](https://wiki.totalwar.com/w/Capital_Cities_(TWR2).html) specifically describes authored battle maps. Those should be distinguished from campaign models and from later graphical mods. The research note links the campaign HD Cities reference separately. No Total War or DEI assets, textures or code were copied.

For 278 BCE, the [Capitoline Museums' temple account](https://museicapitolini.org/en/sede/campidoglio_antico/tempio_di_giove_capitolino) informed the Tuscan porch, three-cell organization and timber/terracotta language. The exact plan, siting and domestic reconstructions remain illustrative. The Colosseum, imperial Pantheon, imperial forum/basilica complexes and monumental aqueduct arcades were not added.

## Implemented scene

- Original meshes authored in Godot code and baked to native resources: six house variants with service wings, two atrium compounds, two shop rows, two workshop yards, warehouse, civic hall, temple, masonry wall section, rough stone landing and four forked evergreen trees. There are 15 building archetypes, plus landscape assets and simplified distance versions. These are project-authored parametric models; they are not scans or sculpted production assets.
- Door and window openings on all elevations, recessed shutters and lintels, upper-storey sills, canopies, counters, pottery, storage timber and workshop kilns. Roofs include separate raised imbrices and ridge details; columns have shaped shafts, bases and capitals. Detail is baked before runtime instead of constructing each building during navigation.
- 2K CC0 stone/timber/ground albedo, normal and roughness maps, plus independently imported copies of the existing CC0 plaster, roof and gravel sources. `showcase-import.mjs` explicitly enables mipmaps, normal-map import and GPU compression. Original source maps elsewhere keep their original loading path.
- An original AI-generated holm-oak branch cutout is used on the forked tree meshes. It is a game texture, not a photograph or a claim of botanical reconstruction. The exact prompt/tool and saved path are recorded in asset provenance. Review screenshots are actual Godot captures, not generated city imagery.
- A ~980 m local presentation surface samples existing elevations on a 140×140-cell mesh. Small building/temple pads grade that surface; roads use an analytical material mask. A narrow stone landing is draped onto the same sampled surface. Underlying terrain rendering is masked within a 405 m radius only when the explicit showcase flag is active and the camera is below 15 km. Canonical source heights, hydrology and settlement coordinates are unchanged.
- Roma-only ambient/shadow adjustments use one directional shadow cascade near the city. Close and distance meshes switch at 3 km; strategic placement reuses the existing proxy scale convention. These transitions are functional but not yet artist-reviewed or cross-faded.

The current layout contains 442 structures and 203 local tree instances. Those counts describe the candidate; they are not evidence of visual success. The city is still assembled from repeated modules and an overly regular street scaffold.

## Problems found and corrected during the work

The first custom meshes had incorrect winding/normal orientation, and triplanar texture sampling added unnecessary cost. Mesh orientation and metre-scaled UVs were corrected. The initial editor import used 2D defaults with **no mipmaps**, producing severe texture aliasing and poor bandwidth use. The contained texture-import step now configures all 17 textures for 3D use. Early noisy captures are retained as diagnostics, not the final comparison.

Changing terrain residents originally bypassed the legacy height-cache invalidation because the candidate returned early from the old Roma builder. That produced artificial steps on the return from a strategic view. The candidate now clears sampled heights and its ground mesh together when the resident signature changes; the scene validator explicitly exercises this invalidation.

One early hidden-window run reported ~120 process FPS alongside a stale ~35 ms GPU reading. Those numbers are not valid rendering acceptance evidence. The final `*-controlled` scripts disable automatic rendering and force one actual render per process interval without a buffer swap. This is based on the [documented RenderingServer render-loop/force-draw behavior](https://docs.godotengine.org/en/stable/classes/class_renderingserver.html#class-renderingserver-property-render-loop-enabled). The strict camera-equality check subsequently caught input reaching a hidden automated window. The final runs also use `--automation-input-lock`, which disables keyboard polling and mouse events only for explicitly automated runs while preserving scripted camera easing. Earlier preview, `after`, `after-final`, `*-rendered` and uncontrolled navigation folders are rejected/superseded and must not be quoted as final acceptance evidence.

## Performance and limitations of the measurement

Final results and exact cameras are in `comparison.json` and `measurements-summary.json`; raw per-frame intervals are in `before-controlled/performance.json` and `after-controlled/performance.json`. Each view has 600 settled samples. A 1% low is the reciprocal of the mean of the slowest six intervals. Both sides use 1920×1080, the same executable and exactly matching position, focus, pitch, yaw, FOV and clipping settings.

The forced-render driver prevents logic-only measurements from an occluded window. It also introduces CPU/GPU pacing and synchronization behavior that differs from ordinary interactive presentation. **Report both wall-clock intervals and GPU measurements; do not equate them or replace the slower number with the faster one.** This is a controlled rendered comparison, not a full screen-presented-frame/PresentMon benchmark. Shader caches were retained; no clean-cache cold-start claim is made. Temperatures, clocks, device-wide memory and power samples accompany each run in `process.json`.

The close and supplementary inspection views fail the 60 FPS average/low target under this driver. The regional and strategic views are lighter after the distance meshes take over. First-use stalls and navigation tails remain. The final data generator records all threshold failures instead of labeling the route's `passed:true` as performance acceptance. That original benchmark flag means only that the route completed.

| Input-locked rendered view | Before average / 1% low | Candidate average / 1% low |
|---|---:|---:|
| Close settlement | 61.3 / 51.1 FPS | 40.7 / 36.6 FPS |
| Intermediate region | 98.0 / 74.5 FPS | 95.0 / 77.5 FPS |
| Strategic campaign | 120.0 / 110.0 FPS | 120.0 / 107.3 FPS |
| Supplementary architectural inspection | 66.7 / 54.5 FPS | 48.2 / 44.9 FPS |

Warm navigation measures 74.0 / 34.4 FPS before versus 65.9 / 12.9 FPS for the candidate. Candidate navigation includes a 100.2 ms worst frame and 83 frames above 33.33 ms. This is a material regression. The scripted route completes, but its loading/rebuild behavior and near-view rendering need optimization. These final controlled values supersede intermediate commentary measurements.

Working set is sampled for the console wrapper and its direct Godot child, not all system RAM. Engine video-memory counters are separate from `nvidia-smi` device-wide memory, which includes the desktop and other applications. No process-specific physical-VRAM residency measurement is claimed.

Sampled peak working set was 1,522,991,104 bytes before and 1,529,896,960 bytes after (~1.42 GiB each). The asset folder is approximately 45.6 MB including import metadata; nine newly downloaded 2K maps account for 21.0 MB. Full per-view engine allocation counters and telemetry are retained in the comparison and process JSON files.

## Visual assessment: still below the requested bar

The candidate visibly changes the building elevations, roof forms, density, materials and vegetation silhouette, particularly in the supplementary inspection pair. It nevertheless still reads as a procedural prototype. I do **not** recommend treating it as the established art direction or claiming Rome II parity.

Remaining failures:

1. The repeated street spacing and module orientation dominate the composition. The surface mask follows this scaffold rather than a carefully designed historical district. Courtyards and alleys need deliberate block design and stronger frontage relationships.
2. The ground's grass/earth transitions and repeated small landing patches are visibly artificial. The stone strip remains an unfinished integration study, not a finished street. The surrounding fields and Tiber banks still use the earlier prototype implementation.
3. The architectural kit is more articulated but still has overly simple profiles, repeated weathering, limited silhouette variation and approximate material calibration. It needs artist-designed hero pieces and building-specific wear/trim work; simply increasing these instance counts would not address the gap.
4. The generated leaf-card trees improve the old opaque-crown silhouette locally, but are not a complete vegetation pipeline. Existing surrounding campaign vegetation remains visible; no worldwide replacement was performed.
5. Native near/far resources reduce regional geometry cost, but switches are discrete. The local ground/wall presentation disappears above its distance threshold. The navigation route exercises zoom/pan/orbit but does not establish imperceptible transitions.
6. Some module placements, including manually added special buildings, still need footprint/intersection review. The land/unique-anchor checks do not certify all building footprints are free of overlap or all terrain contacts are finished.
7. The near view has significant GPU and driver-pacing cost. More geometry is not a free quality improvement. Mesh visibility, material cost and shadow budgets require further work before a 60+ FPS claim is justified.

The appropriate next step is a deliberately designed street block and a genuinely finished landmark/environment sample using this now-explicit import pipeline, with an art review before any population expansion. The current candidate is retained as inspectable implementation and evidence; the high-quality showcase objective remains unmet.

## Validation and protected boundaries

`integrity.json` records **460 protected files unchanged, 35 approved settlements with exact coordinates, and all 687 research records retained byte-for-byte**. `validation/showcase.json` checks the opt-in scene, anchors on land, distinct placement anchors, near/far resource availability, resident-tile bound and height-cache invalidation. `validation/baseline/landscape.json` exercises the original Roma landscape path, original 121-building layout, connected approaches, parent mesh edges and river clearance. These are engineering checks, not art approval.

The new Node tools pass syntax and ESLint checks. Godot parses and renders the candidate shaders/meshes in the included native runs. Existing `Image.load_from_file` export warnings are retained in logs; this task is a native editor/runtime prototype, not an export-ready game build. No repository-wide test pass is claimed for these Godot changes.

An initial scene-validator assertion compared a float32 shader value to a decimal with exact equality and stalled that test. It was corrected to an approximate comparison; the passing rerun is `validation/showcase.json`, and the original failure log is retained as `validation/initial-float-assert.log`. The comparison generator initially rejected a camera mismatch rather than weakening its equality assertion; final input-locked pairs now pass that assertion.

All new art is selected by **`--roma-showcase`**. Regular campaign launches retain the previous Roma presentation. No other settlement receives these meshes. The Rev, research sources, original geographic sources and campaign gameplay were not edited. No factions, ownership, diplomacy, characters, economy, commits or pushes were added.

## Run and reproduce

```powershell
# Interactive candidate at an architectural preview camera:
.\godot-prototype\roma-showcase.ps1
# Same camera, original Roma:
.\godot-prototype\roma-showcase.ps1 -Baseline

# Existing evidence directories are intentionally protected against overwriting:
.\godot-prototype\tools\showcase-capture.ps1 -Stage before-controlled
.\godot-prototype\tools\showcase-capture.ps1 -Stage after-controlled
.\godot-prototype\tools\showcase-capture.ps1 -Stage navigation-before-controlled
.\godot-prototype\tools\showcase-capture.ps1 -Stage navigation-after-controlled

node godot-prototype/tools/check-integrity.mjs
node godot-prototype/tools/showcase-report.mjs
```

To regenerate assets in a fresh workspace, run the ordinary Godot editor import, `node godot-prototype/tools/showcase-import.mjs`, import again, run that Node configuration step once more if the copied textures were new, import again, then run Godot headless with `--script res://tools/showcase-bake.gd`. The saved `.res` assets and source images already accompany this review. `showcase-download.ps1` is optional and capped at 50 MB; no redownload is required to inspect the delivered candidate.

Stop at this review package. No global deployment or artistic acceptance is implied.
