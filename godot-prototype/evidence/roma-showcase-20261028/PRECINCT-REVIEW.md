# Roma temple and market precinct — current review candidate

**A revised Roma-only scene is implemented and measured. It is not declared a successful 2026-quality art direction.** The large repeated-grid experiment was rejected. The current candidate is a small, hand-composed temple/market district with original building meshes, real material channels, curved approaches, local terrain contacts and textured trees. It remains opt-in and has not been expanded elsewhere.

Open [four matched Godot comparisons](index.html), [Rome II / DEI research](ROME-II-RESEARCH.md), [performance data](comparison.json), [navigation data](navigation-comparison.json), [asset sources](asset-manifest.json), and [licenses plus the generated foliage prompt](../../assets/roma-showcase/PROVENANCE.md).

## Research findings

The [DEI resource page](https://divideetimperamod.com/resources/) establishes resource-dependent construction choices. It does not establish that every listed chain level has a unique visible city mesh. Its useful visual lesson here is differentiated building purpose: domestic courtyards, shop frontages, production yards, storage, civic and ritual spaces.

[Creative Assembly's capital-city presentation](https://wiki.totalwar.com/w/Capital_Cities_(TWR2).html) concerns specially authored battle maps. The linked campaign HD Cities reference is a mod, not proof of unmodified 2013 graphics. The research note keeps these references distinct. No Total War, DEI or 0 A.D. art enters this candidate.

The [Capitoline Museums' description](https://museicapitolini.org/en/sede/campidoglio_antico/tempio_di_giove_capitolino) informed the temple's deep Tuscan porch, three-cell organization and timber/terracotta treatment. The candidate's city plan, site within the illustrative settlement, domestic details and material calibration are interpretations. No Colosseum, imperial Pantheon, imperial basilica complex or monumental aqueduct arcade was introduced.

## What changed

- Replaced the rejected 442-building grid with **50 explicitly placed structures** in [the composition file](../../data/roma-showcase-district.json). Streets and building orientations follow authored connections, not repeated row spacing. This is a contained precinct, not a reconstruction of all Rome.
- Built an original native mesh kit with 15 building archetypes: six homes, two courtyard compounds, two shop rows, two workshops, warehouse, civic hall and an Italic/Tuscan temple. There are near/far versions plus wall, landing and four tree variants, totaling 40 baked resources. Meshes are authored in Godot code; they are not claimed to be scans or sculpted production assets.
- Added real facade openings and shaded recesses on all elevations, shutters/lintels/sills, service wings, pottery, counters, kilns, stock timber, sagging canopies, shaped column profiles, individual podium courses and raised roof details. Back-face culling now applies to solid material surfaces; fabric and foliage remain two-sided. Roof UV direction agrees with the modeled drainage direction.
- Integrated 12 new 2K CC0 maps for weathered stone, timber, rural ground and compacted path surfaces. Existing CC0 plaster, clay roof and gravel sources were copied into the contained asset folder for independent import settings. All 20 consumed texture files have mipmaps and GPU compression; normals have explicit normal-map import settings.
- Added an original AI-generated holm-oak branch cutout on forked tree meshes. Seventeen trees are placed as part of the composition. The exact tool/prompt/path is recorded in provenance. It is not presented as a botanical photograph or CC0 scan. All comparison images are actual Godot renders.
- Built a 520 m square local presentation mesh with 130×130 cells from the existing source heights. Small pads grade the building/temple contacts; the landing samples the rendered triangle surface to avoid intersecting it. A 210 m inner terrain mask is active only for the opted-in showcase below 15 km camera distance. No canonical source height or settlement coordinate changed.
- Replaced the repetitive street lattice with authored route segments, building-specific worn yards and a market forecourt. Multi-scale, rotated texture samples reduce repeating patterns. Fine normal detail fades at distance. Opaque central ground and a separate blending fringe avoid shading the whole terrain patch as transparent geometry.
- Added a bounded, two-mode local-surface cache. Returning from strategic zoom reuses Roma's ground, sampled heights and draped landing instead of rebuilding them because unrelated distant tiles changed. Native near/far building resources switch at 3 km; the local presentation layer switches off at 15 km.

The earlier [rendering/asset audit](../visual-reset-20261028/REVIEW.md) documents the original pipeline: Godot 4.7.2, Vulkan Forward+, 4× MSAA, 8× anisotropic filtering, existing SSAO/filmic/fog, coarse source terrain, runtime image loading and procedural asset limits. The engine backend was already capable. Important fixes in this task were the asset import settings, actual mesh construction, material sampling, composition and loading behavior.

## Matched captures and performance

Final evidence is **`precinct-before` versus `precinct-optimized`**. Four pairs use exactly matching camera position, focus, distance, pitch, yaw, FOV and clipping settings. The first three are the existing close/regional/strategic camera definitions; the fourth is a matched architectural inspection pair. Only that supplementary pair hides the UI on both sides. The report generator asserts camera equality rather than assuming preset names imply a match.

All views contain 600 settled wall-clock intervals at 1920×1080 on the RTX 3060 Laptop. A 1% low averages the slowest six intervals. Automated input is locked. Automatic rendering is disabled and one GPU render is forced per interval, without a buffer swap, to avoid hidden-window logic-only FPS. The [RenderingServer behavior is documented by Godot](https://docs.godotengine.org/en/stable/classes/class_renderingserver.html#class-renderingserver-property-render-loop-enabled).

This driver includes CPU/GPU pacing and synchronization behavior different from ordinary interactive presentation. GPU timings are reported separately. It is a controlled rendered comparison, **not a PresentMon/presented-frame benchmark**. Shader caches were retained; temperatures, clocks and power are in each process log. Do not use the near-120 FPS capped views to infer unlimited headroom.

| View | Before average / 1% low | Candidate average / 1% low |
|---|---:|---:|
| Close settlement | 60.9 / 50.0 FPS | 64.4 / 52.6 FPS |
| Intermediate region | 96.3 / 72.3 FPS | 109.6 / 81.8 FPS |
| Strategic campaign | 120.0 / 110.6 FPS | 120.0 / 109.2 FPS |
| Supplementary inspection | 65.9 / 52.7 FPS | 74.5 / 57.5 FPS |

All four settled averages exceed 60 FPS. **The close/inspection 1% lows still miss 60 FPS**, so the complete performance target is not met.

The warmed zoom/pan/orbit route measures **74.5 average / 34.6 FPS 1% low before**, versus **87.3 / 37.6 FPS after**. Its candidate worst interval is 34.5 ms. The surface cache removed the earlier candidate regression of ~100–127 ms warm navigation frames. This is not proof that every transition is seamless or that all possible camera paths perform the same way.

First-readiness frames still stall: the final warmed-cache close run records 165.6 ms, versus 209.3 ms before. An earlier first use of the new ground shader variant recorded **1.69 seconds**. That failure remains in `precinct-final/performance.json`; its precise shader/upload/driver breakdown was not independently isolated. There was no clean-cache cold-start test. Do not present the warmed rerun as eliminating first-use stalls.

Sampled peak process working set is approximately **1.41 GiB before / 1.43 GiB after**. Engine video allocations are about **1.12 GiB before / 1.18 GiB after**; these counters are not process-specific physical VRAM residency. `nvidia-smi` measures the whole GPU, including other applications. New downloads total **27,583,145 bytes**, with exact sources/hashes in the manifests.

## Problems found, corrections and tradeoffs

- New editor-imported images initially had no mipmaps. Their distance aliasing and bandwidth cost were corrected using a contained 3D import step. Earlier noisy screenshots are rejected diagnostics.
- Custom winding and some roof gable orientations were corrected before enabling solid-surface back-face culling. The final captures include that geometry.
- A terrain-height cache was initially reused across different source levels, causing artificial steps after zooming out and back. Height/mesh caches are now coupled to the actual local source mode. The validator exercises invalidation and reuse and asserts the two-entry bound.
- Hidden-window rendering initially produced stale GPU times beside high process FPS. A strict camera comparison also caught background input moving an automated view. Final captures force real rendering and lock input. Earlier `after`, `after-final`, `*-rendered`, `*-controlled` and `precinct-after` folders are diagnostic iterations, not the final comparison.
- The large grid reduced performance and still looked repetitive. It was not accepted as the art direction. Reducing the scene to a composed precinct improved both its spatial relationships and its render budget.
- Short-range single-cascade shadows are used near Roma. This changes coverage compared with the original four-cascade setup; regional shadow coverage is reduced and needs review. Shader/profile changes are not free visual gains with identical lighting cost.
- The `buildWallMs` statistic includes yielded frames and is elapsed construction time, not pure CPU work. Older diagnostics used a misleading `lastCpuSliceMs` label for such elapsed time; that label was removed. Use raw frame intervals and measured render CPU/GPU timings to assess stalls.

## Artistic assessment and remaining work

This version is a more coherent, materially distinct scene than the rejected grid. It demonstrates that proper imports, real facade/roof detail, varied forms, terrain contact and deliberate placement matter more than adding instances. **It is still not declared on par with Rome II or a 2026 commercial environment.**

Remaining visual limitations include simple landmark silhouettes, unfinished pediment/relief work, repeated module wear, approximate material scale, sparse street furnishings, simple landscape transitions and a small precinct representing only a fraction of Rome. The tree cutout improves local silhouettes but does not finish the vegetation pipeline. The surrounding fields, faceted distant vegetation and Tiber ribbon remain the previous prototype. Strategic Roma readability is still a proxy, not a finished full-city art treatment.

The first-use stall, remaining low-FPS tails, discrete LOD changes and limited shadow range require further work. Native meshes and surface caching improve the pipeline, but engineering checks do not certify artistic success.

Next work should finish one landmark/frontage set and its wear/trim/ornament at close distance, then refine the planting, street furnishings and local bank/terrain contact using these same controlled cameras. Do not expand this asset set worldwide before independent visual approval.

## Validation and protected boundaries

- `integrity.json`: **460 protected source files unchanged, all 35 settlements/coordinates exact, all 687 research records retained byte-for-byte**.
- `layout-check.json`: all 50 placements checked using conservative oriented mesh bounds; no overlaps exceeding the 0.15 m tolerance. This is not a surveyed ancient layout or a full walkability test.
- `validation/precinct.json`: land-supported anchors, distinct placements, 15 near/far archetypes, resident-tile bound, height-cache invalidation, cache reuse and the two-mode bound.
- `validation/baseline/landscape.json`: original 121-building Roma layout and approach endpoints unchanged; parent terrain edges and Tiber clearance exercised on the default path.
- New Node tools pass syntax/ESLint checks. Godot parses and renders the actual candidate shaders/meshes. Existing runtime-image/export warnings remain in logs; this is not an export-ready game build. No unrelated full application test pass is claimed.

Godot's import also created additive `.uid`/`.import` metadata for existing resources. The original geographic, research and art source bytes were not changed. The Rev was not edited. No factions, ownership, diplomacy, characters, resource economy, commits or pushes were implemented.

An initial validator stalled on exact comparison of a float32 shader value; the check now uses an approximate comparison, and the passing rerun is included. Its original failure log is retained. Passing these checks is not artistic acceptance.

## Run or reproduce

```powershell
.\godot-prototype\roma-showcase.ps1
.\godot-prototype\roma-showcase.ps1 -Baseline
```

The public preview camera is the same in those two launches. Normal controls remain available. Regular campaign launches retain the old Roma unless **`--roma-showcase`** is explicitly supplied. Only Roma uses the new meshes.

The saved comparison folders are protected from overwrite. Fresh measurements use `tools/showcase-capture.ps1` with new stage names; current stages are `precinct-before`, `precinct-optimized`, `navigation-precinct-before` and `navigation-precinct-optimized`. `showcase-report.mjs` verifies cameras, source hashes and import settings and rebuilds the gallery. Source/asset fingerprints are in `source-manifest.json`.

Source images and baked resources accompany the project; no download is necessary to run it. To rebuild in a fresh workspace, import in Godot, run `node godot-prototype/tools/showcase-import.mjs`, import again (repeating once if the copied textures were new), then run Godot headless with `--script res://tools/showcase-bake.gd`. The foliage generation tool/prompt and project path are in asset provenance.

This package stops at independent review. It does not establish or deploy a worldwide art direction.
