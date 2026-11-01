# Map rendering repair — 29 October 2026

Three confirmed rendering defects were corrected while preserving the approved geographic/political presentation. Only two existing runtime shaders changed. [Open the 33-view before/after comparison](comparison.html).

## Findings and retained fixes

1. **False water over low land near the Caspian at distant zoom.** The ocean and the existing one-metre minimum land floor could quantize to the same depth. The source land masks were correct. The ocean shader now applies a small ocean-only raster depth offset, smoothly from zero at 1,200 km to full at 2,500 km. Vertex positions, coastlines, elevations and masks are untouched. It uses the Forward+ reversed-Z projection convention; [Godot's explanation](https://godotengine.org/article/introducing-reverse-z/). No assumption about the active depth attachment format is needed.
2. **Striped/shimmering inland water.** The analytic ripple frequencies in the shared river/lake shader were undersampled at campaign scale. Screen-space derivatives now suppress only unresolved frequencies, like mip filtering. Close resolved waves retain their original amplitudes and animation.
3. **Thin bright diagonal ocean crack near Catana.** The local FFT patch and background discard edge could leave a raster coverage gap. A one-metre overlap at the already flat outer patch ring and a small background depth offset close it. FFT simulation, displaced waves and the patch envelope are retained.

Runtime files: ocean/ocean_surface.gdshader, nile_water.gdshader. Added tools: tools/map-repair-audit.gd, tools/map-repair-capture.ps1, tools/map-repair-validate.gd, tools/map-repair-report.mjs. [Hashes and exact scope](changed-files.json).

## Actual Godot evidence and validation

- Godot 4.7.2, Forward+, Vulkan, RTX 3060 Laptop. 33 matched 1920×1080 views: all 22 existing navigation presets plus Caspian distance checks, Aral, Crete, Messina, close Tarquinii, Mediterranean overview, maximum zoom and the Roma transition. Recorded camera positions/bases match within 0.00001; FOV and clipping planes match exactly. The approved neutral-gray transition remains 60–180 km.
- Selected evidence is **before/** versus **final/**. Images are actual, unretouched viewport captures. UI layers are hidden for inspection; world labels remain. Water animation clocks are frozen for repeatable stills. Raw capture/process logs and camera metrics accompany each set.
- All **12 current native rendering checks pass** in [native-delivery/validation.json](native-delivery/validation.json). At the reproduced Caspian pose, water-colored source-land probes fall from **1,631 to 16 out of 2,480** (99% reduction). Residual coast-pixel classification is tolerated below 2%, not presented as zero. The reference reproducer must exceed 20 failures; the repair must remove more than 95%.
- The lake alias metric is the horizontal pixel second difference over 1,373 interior-water samples: before **0.0203618798825486**, after **0.0000028562042197431**. This is a targeted alias regression metric, not an artistic quality score.
- The known Catana crack drops from **32 to 2** bright-line outliers in the recorded local region. The matched close-ocean RGB average change is **0.0000616544123273343** on a 0–1 scale; the maximum localized change is **0.192156851291656** at repaired coverage. Close inland water average change is **0.00000604575127363205**, maximum **0.00392156839370728**. Close captures should be judged visually alongside these metrics; they are not claimed pixel-identical.
- Existing navigation regression passes (seven original distances, two rejected collisions, isolated capture names). Existing geography validation passes. All **460 protected files, 35 approved coordinates and 687 research records are preserved**. Full task-start comparison checks **2,936 existing source/asset files**: exactly the two intended shader changes, no deletions. Terrain shader, camera/controller, political configuration, masks, elevation, settlement data and FFT simulation are byte-unchanged.
- [Aggregate validation](validation.json), [navigation log](navigation.log), [protected data check](protected-integrity.txt).

## Performance: before / final

Each view records 120 uncapped, VSync-off, settled submitted frame intervals using hidden-window forced draws. These short sequential captures are useful regression samples, **not** sustained gameplay, camera-motion, cold-load or first-render benchmarks. Thermal/load variation and submission/readback overhead prevent attributing all FPS differences to the shader changes. The normal game cap/settings are unchanged. No meshes, textures, compute passes or draw calls were added by these fixes.

| View | Average FPS | 1% low FPS | Mean GPU ms | Max submitted interval ms | Draw calls |
| --- | --- | --- | --- | --- | --- |
| campaign | 136.66 / 154.14 | 105.05 / 135.83 | 6.24 / 5.69 | 9.61 / 7.56 | 46 / 46 |
| catana | 101.79 / 115.58 | 77.98 / 103.35 | 8.49 / 7.62 | 12.87 / 9.73 | 327 / 327 |
| caspian-3300 | 111.67 / 121.45 | 99.37 / 110.88 | 7.98 / 7.37 | 10.12 / 9.24 | 17 / 17 |
| tarquinii-close | 160.52 / 169.89 | 126.25 / 143.77 | 5.11 / 4.84 | 8.26 / 7.00 | 8 / 8 |
| roma-transition | 128.31 / 136.07 | 108.17 / 119.33 | 6.72 / 6.33 | 9.45 / 8.49 | 43 / 43 |
| maximum | 222.60 / 246.82 | 186.99 / 218.36 | 3.62 / 3.25 | 5.36 / 4.64 | 8 / 8 |

Full raw timings: [before](before/views.json), [final](final/views.json). No sustained 60 FPS guarantee or new RAM/VRAM measurement is claimed.

## Limits and rejected experiments

- The maximum zoom and outer geography coverage edges remain visible. These are finite source-world/water coverage limits, not repaired by inventing geography or silently restricting camera controls. See maximum and mediterranean in the comparison.
- Coarse terrain relief/LOD softness, source coastline resolution and occasional coast-pixel jaggedness remain. A terrain-normal experiment did not resolve the investigated coarse relief and was reverted byte-for-byte. No terrain quality improvement is claimed.
- This repairs the three reproduced defects, not every possible camera/location combination. Static captures and sampled yaw checks do not certify all animated traversal conditions or other GPU/backends. Legacy fallback water is unchanged.
- Earlier native and native-1920 test logs are retained as failed harness experiments: the first did not reproduce the matched 1080p case; the second used an unrealistic zero-error coast-pixel threshold. Current validation explicitly requires 1080p, verifies the old failure, then applies the documented 2% coast-pixel tolerance. The after folder predates the patch-crack repair; relief-probe is the rejected terrain experiment; neither is delivery evidence. Native-final predates the last crack fix; use native-delivery.
- The pre-task inland-water shader copy was reconstructed by reversing the exact known edit and verified byte-identical against the task-start SHA-256 before use. The baseline screenshots themselves were captured before edits.

No new third-party assets/code, gameplay, interface, ownership, coordinates or research changes. No commits or pushes. Next work should separately address dataset-edge presentation and coarse terrain transitions, preserving the approved art direction.
