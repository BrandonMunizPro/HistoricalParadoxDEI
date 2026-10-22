# Italia and Sicily: asset quality checkpoint

[Side-by-side rendered comparisons](evidence/quality-comparison.html) · [Measured results](evidence/quality-comparison.json) · [Asset provenance](assets/quality/provenance.json)

## Assessment

The prototype runs with improved close-view vegetation and more detailed rock/ground surfaces throughout the regional renderer. The requested immediately obvious commercial-quality leap across the entire region is **not achieved**. At regional scales much of the difference is material treatment; the coarse mountain silhouettes, synthetic woodland patches, plain rivers/lakes and simple settlement assets remain visibly below Rome II and Imperator. Preserve this as a working asset checkpoint, not a completed commercial art pass.

## Implemented

- Replaced cone trees with twelve deterministic original branching meshes: broad crowns/umbrella forms, tiered conifers and columnar forms. Alpha-scissored original leaf-cluster artwork replaces solid polygon crowns. Shared materials, MultiMesh instancing and native index LOD reduce distant geometry. These are interpretive scenery, not verified ancient species or distribution.
- Added three original AI-generated bitmap assets: weathered stone, mineral/grass ground and transparent leaves. Terrain uses triplanar stone, rotated cross-scale ground sampling, slope/altitude/volcanic/shore layering and restrained surface-normal detail. These images are artwork, not scanned PBR materials; shader normals do not alter elevations.
- Narrowed the artistic shallow-water colour band, added close-scale wave normals and restrained shore modulation. Land/water boundaries and source river geometry remain unchanged. Shore distance is not bathymetry.
- Added fresh before/after captures, exact camera matching for this baseline, per-runtime memory collection, full-resolution side-by-side PNGs and this reproducible comparison. Original baseline screenshots are preserved separately from prior regional evidence.

The fixed sun, sky, fog configuration, elevation scale, geographic mesh sampling and canonical world model are unchanged during this pass. This makes the asset/material comparison assessable without a lighting or camera change disguising the result. No reference-game assets/code were copied; no engine, dependency, third-party art pack or elevation dataset was downloaded.

## Diagnosis and next specific inputs

1. **Geometry:** Italy's existing 129×129 degree tiles resolve approximately 650–870 m; the fine set stops at 46°N and starts at 9°E. Much of the Alpine arc uses existing 3–4 km samples. More triangles interpolating these grids cannot recover missing ridges. A permitted 30 m DEM for the Alpine arc, Apennines, southern mountains and Sicily, converted to a bounded presentation pyramid without replacing canonical geography, is the highest-value next input. Existing 39–52 m city windows at Roma/Capua/Neapolis/Norba do not cover the target mountain ranges. No invented displacement was added.
2. **Art:** The generated ground/leaf assets are a real asset change, but are insufficient for commercial environmental art. Needed next: a small consistent set of original/licensed Mediterranean broadleaf, umbrella pine, alpine conifer and shrub assets with authored canopy LODs; measured stone/soil/grass/volcanic albedo-normal-roughness sets; and varied settlement silhouettes. No archaeological certainty is implied.
3. **Composition:** The inherited procedural woodland suitability produces large synthetic patches, with scattered trees reading as dark speckles at some campaign distances. A terrain-aligned canopy-cover treatment and hand-reviewed geographic biome masks are still needed. This is a code/art-direction issue, not a reason to change historical coordinates.
4. **Water:** Accurate masks keep alignment, but close shoreline steps, uniform lake shading, estimated river widths and missing banks/beds remain. Better shoreline presentation geometry and reviewed hydrology data are required; the new water shader alone does not solve them.
5. **Streaming:** Detail meshes are still constructed synchronously on the main thread. Loading spikes remain; a derived native-mesh cache or asynchronous preparation should be measured next, separately from the art upgrade. This pass does not claim to resolve the previously observed stalls.

## Matching render measurements

All views use 1920×1080 and matching eye position, geographic focus, FOV, distance, pitch and yaw. Time of day and atmosphere settings are fixed; animated water phase is not synchronized. Each view captures after 600 frames, after pending terrain/scenery work drains.

| View | FPS before → after | p95 ms before → after | Peak RAM MiB before → after | Video memory MiB before → after |
|---|---:|---:|---:|---:|
| [Alps and northern Italy](evidence/quality-pairs/alps.png) | 122.2 → 139.3 | 11.8 → 8.6 | 1628.9 → 1583.3 | 810.1 → 844 |
| [Po Valley](evidence/quality-pairs/po.png) | 132.2 → 137.1 | 10.8 → 10.4 | 1412.3 → 1374.8 | 809.5 → 843.4 |
| [Central Apennines](evidence/quality-pairs/apennines.png) | 117.9 → 134.7 | 12.3 → 9.9 | 1414.3 → 1434.5 | 809.5 → 843.3 |
| [Southern Italy](evidence/quality-pairs/south.png) | 132.3 → 135.5 | 13.7 → 13.7 | 1354.6 → 1375.5 | 809.6 → 843.4 |
| [Sicily regional](evidence/quality-pairs/sicily.png) | 139.5 → 139.8 | 8 → 7.8 | 1348.7 → 1363.1 | 809 → 842.8 |
| [Etna campaign view](evidence/quality-pairs/etna.png) | 133.9 → 129.6 | 12.6 → 14 | 1426.3 → 1413.8 | 810 → 843.8 |
| [Catana close view](evidence/quality-pairs/catana.png) | 135.4 → 137.6 | 13.4 → 9.6 | 1416.4 → 1426.9 | 862.1 → 896 |
| [Mediterranean overview](evidence/quality-pairs/overview.png) | 140.7 → 141.4 | 8.2 → 7.5 | 1391.7 → 1343.9 | 794.9 → 828.8 |

| View | Largest setup/streaming frame ms before → after | Largest detail mesh load ms before → after | Draw calls before → after |
|---|---:|---:|---:|
| Alps and northern Italy | 1604.3 → 1554.4 | 60.5 → 16.3 | 61 → 89 |
| Po Valley | 1348.2 → 1346.6 | 54.5 → 20.4 | 68 → 96 |
| Central Apennines | 1302.8 → 1179.8 | 152.4 → 19.3 | 72 → 107 |
| Southern Italy | 1113.3 → 1162.2 | 59.6 → 18.7 | 67 → 81 |
| Sicily regional | 1152.8 → 1150.9 | 86.1 → 22.2 | 55 → 55 |
| Etna campaign view | 1118.9 → 1164.5 | 17 → 16.9 | 81 → 241 |
| Catana close view | 1108 → 1195.1 | 14.8 → 18.1 | 62 → 116 |
| Mediterranean overview | 150 → 150 | — → — | 46 → 46 |

Hardware: RTX 3060 Laptop GPU, i7-11800H, approximately 16 GiB system RAM; Godot 4.7.2 Forward+. These short desktop samples run near a 144 Hz cadence with uncontrolled background GPU load. Steady-view averages exceed 60 FPS; neither uninterrupted 60 FPS nor a causal speedup is established. The first 90 frame intervals are excluded from steady-state statistics. RAM sums each launched runtime plus console wrapper only, sampled every 200 ms; GPU allocation is engine-reported. Higher-resolution images and extra foliage surfaces cost memory and draw calls. See the JSON for sample counts, max steady-frame times and complete metrics.

## Preservation and validation

[Protected source check](evidence/final-integrity.json): 460 files unchanged, 35 selectable identities with exact canonical coordinates, 687 byte-identical research records. [Regional geographic checks](evidence/regional-geography-validation.json) preserve the imported elevations/coast probes. [Headless navigation validation](evidence/regional-navigation-validation.json) exercises all eight views, bounded residency, source mesh alignment and all 35 selections. These checks establish integrity and function, not visual success.

Run with `.\godot-prototype\run.ps1 -View alps` (also po, apennines, south, sicily, etna, catana, overview). Recreate final captures using `tools/regional-capture.ps1 -Stage quality-after -Views alps,po,apennines,south,sicily,etna,catana,overview`; regenerate comparisons with `node godot-prototype/tools/quality-report.mjs`. Do not recapture quality-before after changing the renderer.

Only Godot presentation assets/code and evidence were changed. The Three.js viewer, simulation and canonical research remain intact. No commit or push was made.
