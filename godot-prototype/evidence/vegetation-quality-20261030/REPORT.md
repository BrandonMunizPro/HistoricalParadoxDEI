# Central-Italy vegetation quality trial — 30 October 2026

The previous crowns were opaque low-detail volumes with synthetic surface shading. This trial replaces them with directionally rendered, textured trees derived from actual branching meshes and leaf cutouts. It changes silhouettes and material detail; it does not add more scattered trees to claim improvement. [Open actual Godot comparisons](comparison.html).

## Implemented artwork and rendering

- Twenty generated variants: oak-like broadleaf, pine, columnar evergreen, ash-like broadleaf and scrub, four seeds each. Source meshes have textured bark, alpha-cut branch foliage and three geometric LODs. [Actual detailed-mesh gallery before](asset-gallery-before.png) / [after](asset-gallery-after.png). These gallery views use a separate neutral studio scene, not the campaign camera.
- [EZ-Tree](https://github.com/dgreenheck/ez-tree) is used **offline**, under MIT. Bark001 PBR color, OpenGL normal and roughness maps are from [ambientCG](https://ambientcg.com/view?id=Bark001), CC0. The leaf cutouts are MIT assets from EZ-Tree, not CC0. Exact URLs, pinned revision, file hashes and copied notices are in [SOURCES.json](../../assets/vegetation-quality/SOURCES.json).
- The first full-mesh forest was rejected: roughly **10–21 FPS** in the recorded campaign views, with sparse foliage when its small cutouts minified. Leaf coverage was increased in the source artwork. At the current campaign zoom range, the retained implementation uses **directional impostors**, each baked from those meshes at eight azimuths and three elevations. It blends four neighboring frames during rotation and changes viewing elevation continuously. Each tree is two triangles; each coarse twelve-tree stand is 24 triangles. This is not a claim that full 3D mesh trees currently render near the campaign camera. Detailed meshes remain available in Godot and are shown honestly in the separate gallery.
- Mipmaps, alpha-to-coverage under the existing 4× MSAA, repaired transparent-edge colors and muted foliage shading improve fine crown edges. Existing placement, instance origins, habitat choices, exclusion areas and local/coarse fade conventions are retained. Coarse stand representations use twelve textured tree sprites instead of the old twenty-four opaque crown proxies; these stands are interpretive rendering proxies, not individual historical tree records.
- The trial is bounded to **11.5–13.5°E, 40.5–43.5°N**, covering Roma, Aricia and nearby central Italy. Roma's existing authored hinterland uses the same new assets. Other regions retain their previous artwork. The Baltic and full political control images are **pixel-identical** to baseline.
- Crown sway uses the existing pausable water clock. Switching Animated water off also freezes this small sway; there is no new UI or independent wind simulation. This is an initial shared reduced-motion behavior, not a separate vegetation controls design.

Only two existing runtime files changed: **regional_scenery.gd** selects the bounded replacement meshes and updates presentation uniforms; **roma_landscape.gd** selects those assets for its existing batches. Added runtime files: vegetation_quality.gd, vegetation_quality.gdshader, vegetation_impostor.gdshader. No terrain, camera, ocean/inland-water shader, research, settlement, gameplay or interface changes. [Exact file list and hashes](changed-files.json).

## Measured performance

Godot 4.7.2 Forward+, Vulkan, RTX 3060 Laptop. Each matched view records 120 settled, uncapped, VSync-off forced submitted frame intervals. These are short sequential render samples, not sustained scan-out/gameplay guarantees. Thermal and cache state vary; small differences, including at the pixel-identical Baltic control, are not automatically caused by this art change. Normal game cap/settings remain unchanged.

| View | Average FPS before / after | 1% low FPS before / after | Mean GPU ms before / after | Draw calls before / after |
| --- | --- | --- | --- | --- |
| roma-close | 89.15 / 99.16 | 60.09 / 76.45 | 9.98 / 8.69 | 414 / 396 |
| aricia-close | 116.37 / 115.15 | 25.71 / 86.45 | 7.10 / 7.31 | 338 / 327 |
| tarquinii-woodland | 102.29 / 107.81 | 87.76 / 82.81 | 8.73 / 7.72 | 415 / 305 |
| roma-hinterland | 121.37 / 120.91 | 104.82 / 90.14 | 7.20 / 7.00 | 247 / 203 |
| aricia-regional | 83.19 / 114.58 | 75.39 / 90.33 | 11.07 / 7.52 | 642 / 521 |
| italia-regional | 124.63 / 128.92 | 109.12 / 104.10 | 7.13 / 6.61 | 208 / 185 |
| political | 196.71 / 172.15 | 170.52 / 123.11 | 4.28 / 4.79 | 48 / 48 |
| baltic-control | 107.72 / 87.12 | 91.41 / 68.20 | 8.25 / 10.19 | 185 / 185 |

The measured 240-frame **360-degree Aricia orbit** averages **116.74 FPS**, 1% low **86.05 FPS**, maximum interval **11.82 ms**. Screenshots are captured after timing, not inside measured intervals. [Raw motion samples and method](native-final/motion.json); four actual orbit captures are in that folder. Six distance checks exercise the local/coarse fades, full political view and return to close geography.

### Initial loading was investigated separately

The first PNG-based atlas preparation produced a **1125.72 ms** first-residency frame spike. Transparent-edge repair and mip generation now run **offline**. Godot loads native compressed ImageTexture resources; all twenty serialized atlas mip chains and all eight final campaign captures are **bit-identical** to the reviewed PNG-based result.

| Warm-cache loading probe | Old artwork | PNG atlas prototype (rejected loading path) | Compiled texture delivery |
| --- | --- | --- | --- |
| Scene instantiation ms | 3662.02 | 3943.30 | 3683.44 |
| First Aricia residency ms | 13014.58 | 14370.61 | 12329.07 |
| Maximum initial submitted interval ms | 351.53 | 1125.72 | 163.20 |
| Initial intervals over 33.33 ms | 3 | 8 | 5 |
| Engine-reported video memory MiB | 1137.80 | 1290.54 | 1290.54 |
| Engine static allocation MiB | 374.66 | 375.25 | 375.25 |

These probes include the existing world startup/streaming with warm disk and driver caches; they are not clean-cache tests or process working-set/driver-VRAM measurements. Initial loading still has visible stalls. No stutter-free startup or sustained 60 FPS claim is made. [Baseline](load-before/load.json), [rejected path](load-after/load.json), [compiled delivery](load-compiled/load.json).

## Validation and review

- **10 native checks pass**: bounded region; twenty distinct assets/three mesh LODs; campaign triangle budgets; legacy fallback for unsupported families; 24-view atlases; usable detailed meshes; reduced-motion freeze; full camera orbit; local/coarse/political roundtrip; existing geography validation.
- Separate fallback checks cover a missing atlas, empty catalog and disabled trial. Existing navigation regression passes. Texture compilation checks all twenty mip chains for exact equality after serialization. Eight final 1920×1080 campaign pairs have matched positions/bases within 0.00001, exact FOV/clipping, and unchanged camera presets.
- All **460 protected files, 35 approved coordinates and 687 research records** pass the existing integrity validator. The 2,936-file task-start source/asset snapshot finds exactly the two intended existing-file changes and no deletions. Existing water work is preserved. No The Rev modifications, commits or pushes.
- Selected evidence: **before**, **resource-final**, **native-final**, the two **asset-gallery** PNGs and **load-compiled**. Candidate is the rejected full-mesh performance/coverage experiment. Impostor-candidate contains a corrected shader parse error; impostor-two is the earlier brighter palette. Final/native/native-delivery predate native texture loading; their images are pixel-identical to delivery, but use the selected folders for current timings. Failed and superseded logs remain available.

## Remaining art limitations

This is a reviewable vegetation quality trial, **not a completed Mediterranean ecosystem or worldwide overhaul**. Olive trees, umbrella/stone pines, palms, grass, flowers and a proper layered ground-cover pass remain gaps. The columnar evergreen is a narrowed pine-derived visual study, not a validated Cupressus asset. Distribution/diorama scale still comes from the old interpretive system and is not reconstructed 278 BCE vegetation.

Directional impostors trade volumetric detail for campaign performance: low-angle intersections, approximate shadows, baked internal lighting, image crossfades and some softness can still be noticeable. They are not suitable for walking underneath trees. Detailed meshes need spatially subdivided batches and a tighter close-view budget before any future lower-altitude camera rollout. The trial edge can show a style change; do not expand the kit worldwide until the look has been independently reviewed.

The underlying terrain, shore fringes, rock repetition and settlement artwork were deliberately not retouched. Visual improvement should be judged from the actual PNGs; passing checks is not artistic acceptance. No additional plugin is currently required: the existing instancing system is sufficient for this trial.

## Rebuilding the assets

The small pinned generator source is vendored under tools/vendor/ez-tree with its MIT notice. The Three.js dependency already exists in the repository; the game runtime does not use JavaScript/Three.js. From the repository root:

1. Run node godot-prototype/tools/vegetation-quality-bake.mjs to regenerate the twenty detailed mesh binaries/catalog.
2. Run Godot headlessly with --path godot-prototype --script res://tools/vegetation-texture-bake.gd to compile the six source texture maps.
3. Run Godot graphically with --script res://tools/vegetation-impostor-bake.gd to render all 24-direction atlases. The source shader/gallery require a real GPU.
4. Run the texture bake again to compile the twenty atlas mip chains. Capture with tools/vegetation-quality-capture.ps1 using a fresh stage name, then regenerate this report.

The gallery and bake tools use hidden native windows when launched by the recorded commands. The existing project's overall export packaging has not been validated in this task; the new campaign atlases themselves are native Godot resources.
