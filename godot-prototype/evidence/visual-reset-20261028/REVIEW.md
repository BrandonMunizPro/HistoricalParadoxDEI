# Roma visual quality reset — audit and rejected asset evaluation

**The requested visual overhaul is not delivered. Artistic acceptance: FAIL / not demonstrated.** The campaign scene was deliberately left unchanged after the asset evaluation failed to establish a suitable replacement kit. This is a stop at the requested asset-quality gate, not a successful showcase or an approval request. No new assets were deployed worldwide.

Open [the evidence gallery](index.html), [baseline measurements](baseline/performance.json), [navigation measurements](navigation/navigation.json), and [asset sources and licenses](ASSETS.md).

## What was actually completed

- Inspected the current renderer, shaders, native terrain adapter, architectural mesh generator, vegetation generator, hydrology, cameras and capture tools.
- Captured three fresh 1920×1080 Godot screenshots at exactly the positions of the existing close, regional and strategic Roma evidence. These are **baseline recaptures**, not after images.
- Measured 600 consecutive settled frame intervals per view, first readiness, memory counters, draw calls and primitive counts; ran the existing warmed Roma navigation benchmark.
- Downloaded four licensed Roman house meshes and their shared maps, converted their static geometry, and rendered them in a separate Godot inspection scene. Downloaded model/texture files total 5,907,489 bytes, including the upstream license. No full game or commercial assets were downloaded.
- Verified all 460 protected source hashes, all 35 exact settlement coordinates and all 687 research records.

The improved Roma scene, matched before/after overhaul comparison, and performance comparison of an improved scene remain **undelivered**. Tests cannot substitute for these missing deliverables.

## Rendering and asset pipeline audit

| Area | Actual implementation | Limitation and origin |
|---|---|---|
| Engine/backend | Runtime reports **Godot 4.7.2 stable**, hash `ed1daf0bf`, **Vulkan 1.4.351 / Forward+**, RTX 3060 Laptop GPU. This was read from the native run log, not inferred from project features. | No evidence of an engine capability ceiling. |
| Image quality | Project `msaa_3d=2`: 4× MSAA. Anisotropic filtering level 3: 8×. Procedural sky, filmic tone mapper, exposure 1.0. No TAA/FSR2 or SDFGI configuration found in the active setup. | Existing configuration already exceeds a bare compatibility renderer. MSAA cannot supply missing geometry or natural silhouettes. |
| Lighting | Directional sun energy 1.5, warm `fff5e7`, rotation −28°/−48°, ambient color `b9cfdf`, energy .38. Directional shadows enabled; angular size zero; max distance clamps from 3 to 360 km with zoom; bias .035, normal bias .8. | Hard sun and substantial flat ambient fill reduce material/depth cues. These are art/configuration choices. Terrain shadow casting is explicitly disabled by `visual-settings.json`, even though sun shadows are enabled. |
| SSAO/atmosphere | SSAO enabled below 18 km. Base radius .035 km / intensity 1.15; Roma focus interpolates to .0018 km / .7. Depth fog density .38, start .75× camera distance, end 2.2× max(distance,12 km), curve 1.4. | Kilometer scene units require careful physical tuning. Fog/depth and SSAO exist; another global toggle is not the missing overhaul. |
| Terrain geometry | Context grid 512² cells. Italy backdrop 448² cells. Coarse world tile grids 48²; regional tile grids 128². At most 12 detail residents plus context. Roma has a 129×129-vertex tile, 32,768 triangles over about 5×5.6 km, ~39–43 m spacing. | Roma source is modern DSM filtered with a 5×5 Gaussian. This cannot resolve street crowns, terraces, ditches, banks, or wall footings. More samples interpolated from it would not add genuine terrain information. Source geography must stay intact. |
| Terrain LOD | Nearest tiles selected synchronously; one queued load per frame; parent-height UV2 and normal-color channels morph boundaries/reveal. Roma detail participates below 15 km and within .03° of focus. | Bounded streaming, not an asynchronous asset pipeline. Loading and procedural build work can still exceed a frame budget. |
| Terrain shader | `terrain.gdshader` blends macro geography, ecology families, rock/slope, volcanic/snow/shore layers, multiscale texture samples, relief normals, canopy shading and a local Roma paint mask. Ground tile .012 km, rock .035 km. Foundation photograph tiles .09 km, fades 6–55 km. | Many color operations but few calibrated material channels. Roughness is globally .94, specular .12. Rock normals partly derive from albedo differences. There is a real foundation normal texture, not a complete PBR stack per terrain layer. No terrain microdisplacement. |
| Texture pipeline | Original procedural material family uses small bitmap tiles; file dimensions are inventoried in `texture-inventory.json`. Existing Roma plaster and tile albedo/normal/roughness maps are 1K CC0 sets. Runtime uses `Image.load_from_file`, generates mipmaps and creates `ImageTexture`. | Runtime image decoding/upload bypasses the usual imported compressed-texture path. Raising every texture to 4K without changing that pipeline would add loading and memory cost. The current asset manifest also contains a nested PowerShell `{value,Count}` wrapper around plaster entries; the report reads it without altering it. |
| Buildings | Seven generated archetypes, two detail variants each, 121 placed structures. `BoxMesh`, `PrismMesh`, 6/12-sided cylinders assembled with SurfaceTool; MultiMesh batches by archetype. Roof includes eaves/caps/imbrices; doors have openings. | Much better than single cubes, but repeating rectangular wings and prism roofs still dominate. Only plaster and roofs get full texture stacks. Timber, foundation, trim and other slots mostly use constant colors/roughness. There is no authored modular building kit with consistent texel density, sculpted damage, baked details and inspected LODs. |
| Integration/streets | Buildings sit at sampled footprint maxima, with box foundation skirts. In the current landscape mode streets, yards and approaches are painted into the terrain from `roma-landscape-mask.png`; older draped street meshes are hidden. Wall is a terrain-following curtain with a gate gap, procedural stone shader. | Sloping foundations become large geometric plinths. Painted dirt approaches have no constructed margins, camber or drainage. Terrain remains effectively unchanged beneath the settlement. Sparse, repeated street frontages are a composition issue as well as a mesh issue. |
| Vegetation | Original branches and opaque crown volumes: 5 latitude rows × 8 angular columns per crown; 24 species/variant assets, coarse stands, MultiMesh batching and index LODs. Coarse/local populations transition by shader scaling. Roma adds sampled local trees with field/road/river exclusions. | Leaves are shading/noise on crown volumes, not textured leaf clusters. Bark has no scan texture. Shape, distribution and material response cause the faceted/artificial appearance. This is an asset limitation, not a Godot instancing limitation. |
| Rivers/coasts | Source coastline coverage clips terrain against a sea plane; shore material bands, animated normal/ripple shading and depth palette. Rivers are subdivided draped ribbons; Roma bank samples lift the ribbon above the finer terrain. | The Tiber is not a carved riverbed with authored bank geometry; lifting water clears intersections but can compromise physical integration. Coast masking and fake shore response do not produce actual littoral relief. Sea and hydrology source paths are outside this stopped experiment's edits. |
| Camera/scale | Perspective, 42° FOV. Orbit/pan/zoom around geographic focus; near=max(.003,distance×.025) km, far=max(500,distance×5+200) km. Roma building LOD at 3 and 20 km; strategic proxy scales after 22 km, capped 2.3×. | At .42 km camera distance, near clipping is 10.5 m. At 7.2 km it is 180 m. Extreme scale changes need authored strategic silhouettes and camera-specific detail budgets. A strategic proxy is illustrative rather than a physically scaled city. |
| Performance | Fresh run: 492 / 643 / 229 draw calls; approximately 1.96 / 1.48 / 1.25 million primitives at close/regional/strategic. Engine video memory ~1.12 GiB. | Regional has more draw calls despite fewer primitives; tile/scenery batches and material surfaces matter. These counters alone do not establish CPU versus GPU causality. Existing matched regional evidence reports ~9.66 ms GPU vs .64 ms render CPU; that older sample suggests a GPU-heavy settled view. A new pass-by-pass GPU capture was not performed. First-load CPU mesh/material work and navigation stalls are independently evidenced below. |

Runtime values: `project.godot`, `world.gd`, `data/visual-settings.json`, `data/roma-presentation.json`, `roma_architecture.gd`, `roma_settlement.gd`, `roma_landscape.gd`, `canopy_assets.gd`, `foliage.gdshader`, `terrain.gdshader`, `river_geometry.gd`. These are findings from the actual project, not proposed settings.

## Why the art-quality gate did not pass

The available CC0 material libraries are usable; licensing and basic PBR support are **not** the blocker. The existing Roma scene already demonstrates successful texture integration. The missing piece is a cohesive, detailed, historically screened architectural and vegetation kit, plus constructed local terrain integration.

The small 0 A.D. trial imports successfully. Its four houses have 925–1,376 triangles each and share a 1024×1024 atlas, normal/specular maps and separate AO maps. Their silhouettes and facade variety improve on the existing kit. However, much facade/roof detail is painted; the source is a legacy strategy art set, not a verified 278 BCE Roma reconstruction. Generic Roman labeling does not date roof terraces, facade treatments, orders or household forms. The trial's fixed roughness is an inspection approximation; specular was not treated as a roughness map. Missing actor props, animation, player-color behavior and full original-engine materials mean this preview is **not a faithful reproduction of the complete 0 A.D. actor**. It is adequate to inspect the base meshes, UVs and texture density, not to declare the source game's visual potential exhausted.

Poly Haven has high-quality tree assets, but its evaluated pine's 1K Blender package alone is 570,739,325 bytes before dependencies. The catalog/species/format and size must be screened; no umbrella pine or olive was verified in the inspected catalog. That is not proof none exists elsewhere. The Romano-British house candidate explicitly depicts later Londinium and subsequent modifications, so it was excluded for period mismatch. Museum/open collections are useful reference, but no complete, compatible, period-verified production kit was established in this investigation.

There was **no technical failure importing geometry**, and no evidence that Godot cannot render the desired scene. This run failed to assemble and demonstrate a sufficiently high-quality, period-suitable replacement. Repeating the imported low-detail houses across Roma, adding more procedural crowns, or applying another color pass would evade the stated objective. Consequently the experiment stops here. No artistic success is claimed.

Historical reference: the [Capitoline Museums](https://museicapitolini.org/en/sede/campidoglio_antico/tempio_di_giove_capitolino) date Jupiter's temple to before the Republic and its dedication to 509 BCE. That supports a temple of the period, not the current exact geometry, position within the illustrative city, or an unreviewed imported Capitoline model. No imperial monument was added.

## Performance result and tradeoffs

| Fresh baseline | Average FPS | 1% low FPS | Worst settled frame | Draw calls |
|---|---:|---:|---:|---:|
| Close, .42 km, pitch 38°, yaw 65° | 115.8 | 95.2 | 11.58 ms | 492 |
| Regional, 7.2 km, pitch 45°, yaw 0° | 95.4 | 70.7 | 21.79 ms | 643 |
| Strategic, 45 km, pitch 45°, yaw 0° | 120.0 | 117.3 | 8.69 ms | 229 |

Each view has 600 wall-clock process-frame samples after readiness; 1% low is 1000 divided by the mean of the slowest six frame times. Includes presentation/OS scheduling. Windows shader caches were retained; this is **not a clean-cache cold-start benchmark**. Views run sequentially in one process. The near-120 strategic result can be presentation-limited; it does not prove unlimited GPU headroom. The first capture tool recorded its readiness-duration field after the sample loop; `reset-report.mjs` reconstructs that duration from the retained first-render intervals, preserves the original combined duration separately, and marks the correction. Frame samples and FPS statistics are unaffected.

First Roma readiness includes a **275.01 ms** frame; 20 frames exceed 33.33 ms. Synchronous scene creation takes about 3.42 s in this run. Mesh preparation reports an archetype slice up to 62.06 ms and build chunk up to 61.98 ms. Those are CPU-stage observations, not every stall's proven cause. Shader compilation, uploads and other first-use work were not individually isolated.

The existing navigation benchmark warms its LODs, then performs 45→7.2→1.2→7.2→45 km plus a small pan/orbit: **98.1 FPS average, 55.5 FPS 1% low**, 1,549 frames. The navigation 1% low misses 60 FPS. Its `passed:true` means the scripted route completed; it is not a performance or art acceptance flag. `navigation-summary.json` derives worst frames and counts from the stored samples. This route does not inspect every possible transition or prove absence of visual popping.

Sampled peak process working set: **1.38 GiB**, console wrapper plus direct Godot child; this is resident RAM, not total committed memory. Engine allocations: ~307–313 MiB. Engine video allocations: ~1.12 GiB. `nvidia-smi` measures the entire GPU including desktop/other programs; its telemetry must not be called process VRAM. RTX 3060 Laptop has 6,144 MiB dedicated VRAM. See `baseline/process.json` for sampled temperature, clocks, power and device memory. Temperatures rose from ~53°C to ~75°C over the run, so later stages are not thermally identical to the first.

Earlier matched settled means were 8.900 / 10.491 / 8.310 ms; fresh means are 8.636 / 10.481 / 8.333 ms. They are similar baseline repetitions with different sample counts and capture conditions, **not gains from a visual upgrade**. There is no after-scene performance measurement because there is no accepted replacement scene.

## Validation and reproduction

`node godot-prototype/tools/check-integrity.mjs`: **460 protected files unchanged; 35 approved sites; coordinates exact; 687 research records; research copy byte-identical.** Result copied to `integrity.json`.

Godot baseline and isolated import both completed using Forward+ on the RTX 3060. Native logs are included. The camera positions in all three fresh screenshots equal the corresponding earlier capture JSON positions exactly. `camera-matches.json` records the checks. The isolated evaluation is not a matched Roma after image.

Only new review/evaluation files and tools were created. Campaign renderer, source geometry/data, gameplay, The Rev, and protected files were not edited. No commits or pushes. Read-only Git status/diff checks required execution under the repository owner's context because the sandbox identity fails Git's ownership check. The new Node conversion/report tools pass syntax and ESLint checks. Application test suites were not rerun for this additive, quarantined audit; executed checks are listed explicitly, not substituted with old passing results.

From the repository root:

```powershell
node godot-prototype/tools/check-integrity.mjs
node godot-prototype/tools/reset-convert.mjs
& .\godot-prototype\tools\reset-capture.ps1
& 'C:\Users\brand\tools\godot\4.7.2-stable\Godot_v4.7.2-stable_win64_console.exe' --path .\godot-prototype --resolution 1920x1080 --script res://tools/reset-asset-view.gd
& 'C:\Users\brand\tools\godot\4.7.2-stable\Godot_v4.7.2-stable_win64_console.exe' --path .\godot-prototype --resolution 1920x1080 --script res://tools/roma-profile.gd -- --output=res://evidence/visual-reset-20261028/navigation
node godot-prototype/tools/reset-report.mjs
```

Capture tools overwrite only this experiment's evidence outputs. Downloading the evaluation again is optional (`tools/reset-assets.ps1`); source files and hashes already accompany the report. The static COLLADA adapter supports this specific four-model test, not arbitrary models.

## Recommended next work, after this stopped review

1. Author or identify a small, period-reviewed kit: two domestic courtyard/roof variants, shop/workshop frontage, tuff footing and wall section, Tuscan/Italic temple elements. Deliver editable source meshes, UVs, texture-channel definitions and actual render turntables before any city population. Use architectural drawings and material references to establish 278 BCE suitability; do not accept a file merely named Roman.
2. Establish shared material calibration and texel density. Retain useful CC0 plaster/tile sources; add period-appropriate timber and tuff/stone. Use correctly tagged albedo/OpenGL normal/roughness/AO with imported GPU compression, not runtime full-image loading. Texture library availability is already adequate for a prototype; it should not delay mesh work.
3. Acquire or author a verified olive/holm-oak/umbrella-pine vegetation set with leaf-cluster materials, bark normals and two inspected LODs. Do not force a northern pine or subtropical broadleaf model into the scene because its license is convenient.
4. Build one constructed local street/temple-terrace contact area over the preserved geographic foundation. Hand-authoring a local presentation layer must be distinguished from changing canonical relief or asserting a surveyed ancient city layout. Add banks, road shoulders and footing transitions at meter scale.
5. Then integrate only within the Roma showcase, capture the three existing cameras plus a genuinely close architectural shot, and have the artwork independently assessed. Benchmark with new assets using warmed and first-use runs; replace main-thread construction with imported/cached resources and budgeted uploads. Verify LOD changes in motion, not only static endpoints.

Do not expand globally or call this reset successful on the strength of integrity checks or the isolated house import. The missing convincing Roma showcase remains the central unmet requirement.
