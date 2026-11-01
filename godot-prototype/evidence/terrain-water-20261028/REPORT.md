# Terrain/water review — visual acceptance NOT met

The native prototype now demonstrates multi-material PBR terrain, higher-resolution source relief around Aricia, and flowing/depth-shaded Tiber water. It **does not reach the requested Imperator/Rome II landscape standard**. Repeated ground motifs, faceted vegetation, incomplete riverbed integration and coarse adjoining terrain remain conspicuous. The rectangular material boundary is also visible at campaign zoom, and the full PBR branch currently bypasses the original strategic relief shading, weakening distant landform readability. Do not promote this to the main presentation or expand it worldwide.

## Review the actual screenshots

[Interactive comparison](comparison.html) displays eight matched pairs of unedited 1920×1080 Godot screenshots. Camera positions, basis, FOV, clipping planes and focus are validated in [validation.json](validation.json). Aricia's new relief is viewed from the **original physical camera position**, not a higher camera following the new elevation. Existing objects remain rendered. Map marker/UI overlays are hidden equally on both sides.

- **campaign**: [before](before/campaign.png) · [after](review-final/campaign.png)
- **roma-region**: [before](before/roma-region.png) · [after](review-final/roma-region.png)
- **aricia-region**: [before](before/aricia-region.png) · [after](review-final/aricia-region.png)
- **aricia-terrain**: [before](before/aricia-terrain.png) · [after](review-final/aricia-terrain.png)
- **roma-terrain**: [before](before/roma-terrain.png) · [after](review-final/roma-terrain.png)
- **tiber-close**: [before](before/tiber-close.png) · [after](review-final/tiber-close.png)
- **roma-ground**: [before](ground-before/roma-ground.png) · [after](ground-after/roma-ground.png)
- **aricia-ground**: [before](ground-before/aricia-ground.png) · [after](ground-after/aricia-ground.png)

Water animation: [time 0](review-final/tiber-close.png) · [time 8 s](review-final/tiber-flow-t8.png). Only water time changes for that pair. Ocean and Tiber time are synchronized for the main comparisons; the unchanged lake ripple phase was not synchronized in the original baseline, so do not attribute lake animation differences to this work. Images are real engine outputs, not generated concepts, retouched renders or reference-game screenshots.

## What produces the differences

- **Terrain shape:** same Copernicus source, additive 257² Aricia patch at roughly 28×37 m rather than roughly 650–870 m. Existing Roma local relief is preserved. No invented noise-displaced hills. Visible improvements chiefly occur on the Aricia slopes; Roma's existing mesh is not magically made higher resolution by a shader.
- **Surface response:** grass, soil and exposed-ground albedo, measured OpenGL normals and roughness; continuous slope/soil blending, bank wetness, triplanar rock colour, world-space phase, proper compressed mipmaps and a filtered colour macro. Nine maps share three sets across terrain and existing close settlement ground. This corrects material plumbing; art-directed land-cover composition is still inadequate.
- **Tiber:** two animated normal layers aligned to inferred flow, inverse-projection depth absorption, subdued screen refraction, dielectric reflections and alpha-softened banks. Existing river positions, widths and elevation convention are unchanged; the native test compares the complete rendered vertex set with quality off/on. The 3 m lift is still present and depth is a rendering approximation, not bathymetry.
- **Vegetation integration:** existing local proxies shrink around anchored origins; no new tree counts or assets. This exposes terrain and improves scale, but the original faceted foliage still prevents a convincing close landscape.
- Roads and settlement geometry/data were not redesigned. Existing ground masks retain roads/plazas and gain the shared landscape response. See the two supplemental ground views for integration and remaining edge/paving limitations.

## Performance — uncapped, same cameras

Godot 4.7.2-stable (official); forward_plus; NVIDIA GeForce RTX 3060 Laptop GPU; 1920×1080, 4× MSAA. Cap **0**, VSync **off**, asserted after world initialization. Each main row contains 600 settled wall intervals with forced GPU submission and buffer swap. This controlled hidden-window method is **not** OS PresentMon/display scan-out. 1% low = reciprocal mean of the slowest 1% of measured frame intervals. Raw intervals, GPU timings, loads and process/device telemetry are retained. Runs are sequential, not simultaneous. Shader caches were retained; there is no clean-cache claim.

| View | Before average / 1% low FPS | Final average / 1% low FPS | Worst settled frame ms | Draw calls |
|---|---:|---:|---:|---:|
| campaign | 146.3 / 121.4 | 151.1 / 132.3 | 8.4 → 7.8 | 266 → 267 |
| roma-region | 109.4 / 93.7 | 136.1 / 115.2 | 10.9 → 9.0 | 270 → 271 |
| aricia-region | 124.7 / 105.7 | 129.6 / 115.1 | 9.8 → 9.0 | 498 → 511 |
| aricia-terrain | 73.6 / 65.1 | 78.3 / 65.1 | 15.8 → 15.7 | 343 → 345 |
| roma-terrain | 61.3 / 54.7 | 69.9 / 63.5 | 18.8 → 16.2 | 258 → 259 |
| tiber-close | 75.9 / 66.2 | 72.2 / 23.8 | 15.5 → 164.6 | 116 → 117 |
| roma-ground | 53.9 / 49.6 | 68.6 / 63.3 | 20.3 → 16.2 | 251 → 252 |
| aricia-ground | 58.7 / 46.5 | 73.8 / 65.8 | 21.6 → 15.6 | 607 → 613 |

Tiber regresses in average FPS and contains a **164.6 ms spike at sample 308**. It is included in the 1% low, not discarded. Its surrounding samples return to normal; these data do not identify whether the isolated stall is driver, OS, telemetry or rendering work. It cannot be presented as a clean performance pass.

Camera movement, 900 submitted frames from Roma to Aricia while zooming 45 km → 650 m, including streaming: before **44.3 average / 12.2 1% low**, final **47.4 / 12.4**. Worst movement interval 85.3 → 83.4 ms; frames over 33.33 ms 25 → 32. **Smooth sustained 60 FPS during movement is not achieved.** Original before capture predates the movement extension; the equivalent baseline route is separately retained in <code>before-repeat/</code>, including its fixed-view data.

Peak measured process working set, main six-view sequence: **1229.5 → 1294.6 MiB**. Engine-reported maximum rendering video memory: **1201.5 → 1272.7 MiB**. This engine counter is not total physical VRAM residency. <code>process.json</code> also records NVIDIA device-wide memory/utilization/clocks/power/temperature at one-second intervals; it includes the desktop and other GPU allocations and must not be labeled application-only VRAM. Both sequences reach 87°C, so these are thermally constrained laptop measurements, not cool desktop extrapolations.

## Loading and LOD — separate from steady FPS

Scene instantiation: **3628.6 → 3471.4 ms**. This blocks startup and is not a playable frame-rate metric. Readiness additionally waits for streamed tiles, vegetation, settlement presentation, river work and 180 stabilization frames; per-view values are in the raw report.

Final warm-cache first-view intervals reach **179.4 ms**, versus **186.1 ms** in the original baseline. Earlier first-use captures after shader changes reached **1.9 seconds**, retained in <code>after/</code> and candidate logs. These stalls are not fixed by improving steady FPS. Material/pipeline first-use work is implicated by when they occur, but an instrumented driver-level trace would be required to attribute all that time precisely.

The new Aricia tile uses a native mesh derivative. Original context/tile image and buffer setup remain synchronous. Existing 650 ms source morph, parent edge matching and 13-tile resident budget are preserved; numeric LOD boundary checks cover 15, 8 and 3 km neighborhoods. Movement still reveals streaming/culling costs, and the transition is not certified artistically seamless. Existing coarse lake polygons remain visible near Aricia and are outside the chosen Tiber treatment.

## Validation and preservation

- 460 protected files unchanged, 35 approved coordinates exact, 687 research records byte-identical to canonical source.
- 23 settlement/architecture/data source hashes from this task's starting snapshot remain identical; no chain, starting-level or city asset edits.
- Native checks: river rendered vertices unchanged, terrain edge heights match parent, detail gates/resident budget, mipmaps/compression and normal XY error, existing ground material binding. Initial attempts exposed excessive BC1 normal error; final BC5 XY decoding is checked against source data. A same-bucket camera jump also exposed existing settlement viewport-culling cache behavior; the material test explicitly invalidates that cache. The production settlement system was not changed under this terrain-only task.
- Eight camera/screenshot pairs, image dimensions, photograph hashes, additive DEM source hash/counts/finite values and distinct animation frames verified by the report generator.
- Final capture/validation logs have no shader or script errors. Existing baseline runtime-image/export warnings remain and are documented; the new PBR resources are baked/importable.

Passing these checks is **not artistic acceptance**. Both visual acceptance and smooth-movement performance acceptance remain false.

## Changed files and reproduction

Existing renderer sources changed: <code>world.gd</code>, <code>terrain.gdshader</code>, <code>roma_showcase_surface.gdshaderinc</code>, <code>foliage.gdshader</code>. New scoped sources: <code>landscape_quality.gd</code>, <code>landscape_surface.gdshaderinc</code>, <code>landscape_river.gdshader</code>. New assets/derivatives: <code>assets/landscape-quality/</code>, <code>data/landscape-quality/</code>, three <code>data/regional/aricia-landscape.*</code> parent/normal files. Authoring, validation, capture, preview and report tools are <code>tools/landscape-*</code>; public opt-in launcher: <code>terrain-water.ps1</code>. Full source/renderer findings: [AUDIT.md](AUDIT.md). Exact assets/licenses: [PROVENANCE.md](../../assets/landscape-quality/PROVENANCE.md).

Launch from the repository: <code>.\godot-prototype\terrain-water.ps1</code>. It starts the existing Roma presentation with the terrain experiment, cap zero and VSync off. All source coordinates are retained. Existing navigation and development UI are not reimplemented.

Rebuild derivatives using tools/landscape-assets.mjs, landscape-dem.mjs, landscape-control.mjs, a Godot editor import and the headless landscape-textures.gd script. Capture with tools/landscape-capture.ps1; existing stage directories are rejected to preserve evidence. Validation scripts and the report generator are included.

## Remaining work before another visual acceptance attempt

1. Restore the existing source-derived strategic relief response within the PBR distance levels and remove the visible rectangular material boundary. Author a coherent Latium land-cover/control map that reads as terrain at campaign scale: woodland massing, grass/soil variation, wet river corridors and road margins. Fine PBR textures cannot substitute for that composition. The aerial colour macro remains repetitive/mossy.
2. Build a proper Tiber cross-section with a controlled bed, banks and floodplain from compatible geographic evidence. Keep source placement and record uncertainty; remove the floating ribbon convention only as a deliberate terrain/hydrology change. Upgrade nearby lake shore geometry separately.
3. Replace the existing close vegetation proxies with a coherent licensed Mediterranean foliage kit and matching distance representation. Scaling the proxies is useful but insufficient.
4. Extend source-derived terrain detail across the narrow showcase corridor with measured LOD transitions, then address startup uploads and streaming/movement frame budgets. Profile first-use pipelines and the isolated Tiber spike with a driver/OS frame trace.

No worldwide rollout, The Rev edits, commits or pushes. Stop here for independent review; this package is evidence of a **partial prototype and a failed overall quality target**, not a completed visual overhaul.
