# Strategic camera and water presentation

The production zoom limit is now **2,800 km**, reduced from **30,000 km**. The previous Home/overview preset was 8,500 km; it now frames the eastern/central Mediterranean at 2,800 km, 57° pitch and focus 29° E, 37° N. Water gains a continuous distant response while preserving the existing close FFT waves, animation, coastline masks and local wave patch.

[Godot before/after review](REVIEW.html). Raw screenshots, transforms, frame samples, source-integrity checks and native results are in `godot-prototype/evidence/strategic-camera-water/`.

## Audit and rationale

The ocean already had filtered FFT normals, temporal normal history, a close displacement patch and regional shore masks. At political zoom, however, the shader replaced its ocean response with almost uniform chart water. Small strategic texture fields became unresolved, leaving little variation. The old 30,000 km wheel limit exposed the entire world mesh as a small slab; the 8,500 km overview exposed its finite geographic extent.

The fixed 42° vertical field of view at 16:9 provides approximately 3,800 km horizontal coverage at the target plane at 2,800 km. This supports a broad Mediterranean region while retaining useful geographic scale. The oblique ground footprint is wider toward the top of the frame, so a cached frustum/coverage check reduces maximum distance near supported map edges. For example, the test focused at 20° E, 38° N resolves a requested 2,800 km to about 2,474 km; the production overview at 29° E, 37° N supports the full 2,800 km. The focus remains on the explored region instead of jumping inward to fit an arbitrary global rectangle.

The visual references were the low oblique terrain, coast framing and readable campaign symbols in [Creative Assembly's Rome II campaign panoramas](https://wiki.totalwar.com/w/Panorama) and [Paradox's Imperator: Rome media](https://www.paradoxinteractive.com/games/imperator-rome/about). No assets or unrelated systems were copied.

## Changes

Water response fades from its existing close appearance over 24–520 km. Small FFT slope contribution gradually reduces, roughness increases, and the political-water branch gains restrained, nonperiodic basin-scale colour variation. Existing shore-distance colour remains authoritative for coastal blending. These fields are artistic water appearance, not claimed bathymetry. They use a small amount of value-noise arithmetic in the existing shader; there are no new textures, dependencies, water meshes or draw calls. Settings live in `ocean-settings.json`.

The camera retains perspective projection and its existing zoom interpolation. Pitch constraints tighten continuously with distance: close orbit remains available, regional viewing avoids a grazing horizon, and distant views stay between 48° and 62°. Actual pitch and yaw ease toward their requested orientation, including preset changes and angle wraparound. Wheel zoom, pan, orbit, rotation, settlement selection and Home continue through the production controller. Mouse motion uses the event's button mask, which keeps drag handling self-contained and testable.

`strategic_camera.gd` computes a supported distance from eight frustum perimeter samples, the existing geographic projection and source world bounds. The calculation is cached while focus, requested orientation and aspect ratio are stationary. The coverage limit has a small safety margin near the boundary. Source terrain resolution, streaming caps and regional geometry are unchanged.

Existing faction icons and label collision suppression remain in place. At the tighter maximum, the screenshot shows recognizable Italy, Greece, Anatolia, the Levant, Egypt, coastlines and mountains with readable faction symbols. No label or faction-system redesign was necessary.

## Hispania's square borders

The square-edged areas are inherited political scenario geometry, not rectangular terrain chunks. `data/factions/README.md` explicitly classifies provisional tribal regions as authored scenario envelopes rather than scholarly boundary data. They must not be described as confirmed 278 BCE frontiers. This task leaves their geometry and ownership unchanged; refining them requires a separate historical/cartographic pass.

## Files changed

* Runtime: `world.gd`, `ocean/ocean_surface.gdshader`, `ocean/ocean_controller.gd`.
* New runtime helpers: `strategic_camera.gd`, `ocean/strategic_water.gdshaderinc`.
* Presentation settings: `data/visual-settings.json`, `data/ocean-settings.json`, `data/production-views.json`.
* Updated preset expectation: `data/navigation-expectations.json`.
- New evidence tools: `tools/strategic-camera-water-capture.gd`, `tools/strategic-camera-home-capture.gd`, `tools/strategic-camera-validate.gd`, `tools/strategic-water-benchmark.gd`, `tools/strategic-camera-water-report.mjs`.
* This report, review page and evidence.

OpenCode's completed scenery/population generation and residency-validator changes remain intact. `regional_scenery.gd`, `settlement_population.gd`, `political_map.gd` and `tools/navigation-validation.gd` match the starting hashes. Only the camera-related portions of shared `world.gd` changed. No historical, faction-control, boundary, character or coordinate data was edited. No commits or pushes.

## Validation

Eleven before/after Godot views cover 1.2, 8, 24, 96.6, 170, 200, 520, 1200 and 2800 km, plus the old 8500/30000 km requests. The first eight use identical camera transforms; the capped maximum comparison retains the reference pose for water comparison but records its changed clipping planes. The last two demonstrate the new production constraints, so their cameras intentionally differ. These distinctions are recorded instead of treating all images as identical-pose comparisons.

The central 1,176,000-pixel crop is pixel-identical at 1.2, 8 and 24 km. This is direct close-water regression evidence; FFT simulation, patch geometry, wind and wave quality settings were retained. The after images have no script or shader errors. Initial failed diagnostic checks were corrected and their logs remain separate from the final results.

Native tests exercise all 22 production presets, map-edge/rotation combinations, wheel limits, right/middle drag events and all 35 settlement selections. The existing navigation registry regression also passes. Overview framing, source coverage and streaming continuity were inspected in the actual screenshots.

A 240-frame live zoom trajectory also passes: its largest distance step is 8%, its largest pitch step is 1.01°, and the strategic top-center viewing ray stays below the horizon. The final production Home capture is shown separately at the top of the review. The final benchmark, production capture and trajectory check contain no script or shader errors.

All 514 TypeScript tests across 37 files pass, along with type checking and production build. Integrity checks verify 460 protected source files, the exact 35 settlement anchors and the byte-identical 687-record research copy. Existing raw-image loading/export warnings remain; this validates the native prototype, not a packaged export.

## Performance and limitations

The before/after visual captures use 120 uncapped submitted wall intervals per settled view. Examples: 96.6 km 44.44→26.46 ms, 520 km 30.52→26.58 ms, and 1200 km 20.34→16.84 ms. These sequential hidden-window timings vary with cache state, scheduling and concurrent checks; they do not establish that the shader caused those improvements. Extreme-zoom FPS is not directly comparable after changing the framing.

A separate same-process benchmark compares the original water response with the new response at identical geometry and camera settings, using 90 warm frames then 240 recorded intervals per variant. Its raw frame/GPU samples and draw counts are retained under `benchmark/`. This isolates presentation more closely, but hidden-window `force_draw` remains different from sustained interactive scan-out and GPU queries may repeat stale values.

| Distance | Original / new mean GPU | Original / new mean wall interval | Original / new sampled FPS | Draw calls |
| --- | --- | --- | --- | --- |
| 96.6 km | 14.19 / 14.75 ms | 29.34 / 30.44 ms | 34.1 / 32.9 | 121 / 121 |
| 520 km | 12.90 / 13.49 ms | 29.23 / 29.31 ms | 34.2 / 34.1 | 139 / 139 |
| 1200 km | 17.32 / 17.53 ms | 18.64 / 18.86 ms | 53.6 / 53.0 | 133 / 133 |
| 2800 km | 26.24 / 27.20 ms | 27.66 / 28.69 ms | 36.1 / 34.8 | 189 / 189 |

The added GPU cost is approximately 0.2–1.0 ms in these samples; it is not performance-neutral. The reference uniform bypasses the new chart-color function while retaining the same shader infrastructure and camera. Close animation at times 0 and 8 seconds changes 1,654,462 pixels by more than one intensity unit. With pose, geometry and lighting held fixed, shader-distance samples at ±0.1 km around 24 and 520 km differ by at most one channel intensity unit; neither endpoint introduces a visible switch.

Remaining limits: the map is still a projected terrain surface, not a spherical world; strategic relief relies on existing sampled meshes and lighting. Shore colours approximate distance from shore, not measured water depth. The frustum guard samples the perimeter rather than proving continuous coverage for every point on a curved projected boundary. Very close low-angle inspection retains the existing horizon behavior. Legacy evidence tools that deliberately request unsupported extreme distances no longer describe production navigation. Provisional political shapes, including Hispania's square envelopes, remain visible by design and need separate research to improve.
