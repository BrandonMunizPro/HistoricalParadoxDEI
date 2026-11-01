# Strategic ocean fidelity pass — 29 October 2026

Implemented in the existing FFT ocean. [Open matched screenshots and animation](comparison.html). Final selected stage is **final**, compared to the untouched pre-pass **before** stage. This improves strategic surface presentation while retaining the existing close-water simulation; no ocean rebuild or geographic edits.

## Diagnosis

The project runs Godot 4.7.2 official Forward+, Vulkan, on RTX 3060 Laptop. The existing ocean combines directional GPU FFT spectra, three 128/487/1973 m domains, displacement below 10 km, filtered slope/second-moment mipmaps, and normal history interpolation. Moderate winds produce mostly metre-scale waves despite the large simulation domains. Domain size does not imply dominant wavelength.

At 59.3 km and FOV 42°, an approximate central horizontal pixel footprint is 24 m at 1920 pixels; oblique foreshortening makes some footprints larger. Most metre-scale waves disappear into mip averages. Mean slope approaches zero; second moments correctly retain energy as roughness, but that roughness becomes nearly spatially uniform. The old far path switches from interpolated histories to direct filtered moments at 8 km. Increasing FFT domain size or all wave heights would not solve the presentation problem plausibly. Displacement is subpixel at these distances.

The original sun is rotated (-28,-48,0), with the existing dielectric GGX lighting and roughness. Camera rotation changes the reflection geometry: yaw 132° produces the strongest glint in these tests; -48° faces the other direction. Distant 48° pitch differs from the 28° sun altitude and the 1.2 km test pitch. A bright reflection is not physically appropriate everywhere. No light direction, brightness, atmosphere, specular constant or exposure was altered. [Godot spatial shader reference](https://docs.godotengine.org/en/stable/tutorials/shaders/shader_reference/spatial_shader.html).

## Rendering changes

The FFT compute pipeline, all cascade parameters/frequencies, foam, geometry and displacement cap remain unchanged. The surface shader samples the already-loaded, anisotropically mip-filtered ripple texture twice, at differently oriented/noncommensurate 11×3.7 km and 67×43 km domains. These are statistical wind-roughness fields, not literal giant swell heights. They modulate effective slope slightly, roughness and offshore colour. Actual texture features are smaller than those domain dimensions. A lightweight original nonperiodic value field adds restrained basin-scale colour over 3500 km cells. No new asset downloads or third-party code were introduced. Existing MIT ocean provenance remains in ocean/upstream.json and ocean/LICENSE-GodotOceanWaves.txt.

The new contribution is exactly zero through 4 km camera distance, smoothly grows with smoothstep(4,24,distance), and is fully enabled by 24 km. The original detailed normal, displacement, foam and sunlight paths remain active. Separately, pixel-footprint attenuation smoothly removes the effective wind slopes/roughness as pixels grow from 50 m to 500 m, avoiding distant aliasing and the repeating rug-like pattern found in an intermediate maximum-zoom candidate. At very large zoom, only broad filtered colour and the physically unresolved sea remain.

The existing history interpolation now smoothly reaches the direct-current-moment result from 5 to 8 km, before the old normal-path switch. No new LOD mesh or compute pass is introduced. World-space coordinates stabilize the patterns during camera movement. Existing water_time advects them at 9 m/s along the configured wind. The adapter forwards that same clock to both ocean materials; pause/reduced motion freezes both FFT scheduling and wind shading. There is no independent clock, animation system, TIME-based motion or new per-frame CPU field generation. Coastline masks/exclusions, shallow-water colour, coastal damping and all shoreline geometry are preserved; colour modulation fades offshore with (1-shallow).

Controls live under strategic in [ocean-settings.json](../../data/ocean-settings.json): strength, begin/full distance, drift, effective slope, roughness and colour contribution. Set strength to zero for the original strategic surface presentation (the smoother 5–8 km history transition remains). Existing wind direction drives both FFT and strategic shading. No interface changes.

## Visual evidence and validation

Fifteen 1920×1080 before/after camera pairs: 1.2, 10, 30, 59.3 and the actual maximum supported 30,000 km distance, each at yaw -48/42/132°. Camera transforms agree to 1e-5; FOV and clipping match exactly. Every view includes time zero and time 12 s PNGs. Native images are unretouched. The 144-frame 960×540 sequence shows eight simulated seconds fixed at 59.3 km, followed by a zoom/rotation to 1.2 km. It is deterministically sampled at 12 fps, not a real-time performance video.

The strategic views now show directional surface variation and a broken-up glint rather than one uniform blur. Facing away from the sun remains darker and subtler. At 30,000 km, the map occupies a small area and the existing finite ocean-plane edges are visible; metre-scale motion is not meaningfully resolvable there. The new shading intentionally does not enlarge waves into continent-scale animation. Thus the visual gain is strongest at regional/strategic distances, not the extreme maximum.

11 native GPU checks passed: original/current 1.2 km wave/glint pixel equality, shared material clock, strategic animation, paused clock/pixels, stopped FFT scheduling, resume, plus continuity across 4/5/8/10/24 km. The close comparison loads the saved original shader in the same scene with identical FFT state; an 800×400 all-water region at native 960×540 has **zero channel difference**. Strategic animation is measured in a separate all-water region at 59.3 km over 12 simulated seconds; this is a visibility check, not an artistic score. [Native results](native-final/validation.json).

## Performance

All full-view runs are balanced quality, 1920×1080, MSAA 4×, cap 0 and VSync off after world creation. Each view measures 300 settled wall intervals with force_draw(true) and automatic render loop disabled; hidden-window controlled throughput, not OS scan-out/PresentMon. Retained shader caches, sequential views, real terrain/scenery streaming during readiness. 1% low is reciprocal mean of slowest 1%. The ordinary project still has its existing 120 FPS cap; these runs deliberately remove it.

| Distance km | Yaw | Before avg / 1% FPS | Final avg / 1% FPS | GPU ms before → final | Draw-call delta |
|---:|---:|---:|---:|---:|---:|
| 1.2 | -48 | 203.4 / 163.0 | 195.8 / 149.2 | 4.00 → 4.17 | 0 |
| 1.2 | 42 | 207.7 / 180.9 | 202.3 / 167.5 | 3.91 → 4.02 | 0 |
| 1.2 | 132 | 204.9 / 179.5 | 202.8 / 163.9 | 3.98 → 4.01 | 0 |
| 10 | -48 | 181.4 / 156.5 | 181.8 / 152.8 | 4.65 → 4.64 | 0 |
| 10 | 42 | 189.6 / 161.7 | 187.8 / 163.6 | 4.41 → 4.48 | 0 |
| 10 | 132 | 221.9 / 180.7 | 215.6 / 181.1 | 3.67 → 3.80 | 0 |
| 30 | -48 | 189.0 / 166.0 | 198.0 / 173.8 | 4.43 → 4.22 | 0 |
| 30 | 42 | 186.2 / 165.4 | 197.2 / 171.2 | 4.51 → 4.23 | 0 |
| 30 | 132 | 182.4 / 157.6 | 193.7 / 164.9 | 4.62 → 4.32 | 0 |
| 59.3 | -48 | 156.6 / 139.0 | 169.7 / 152.3 | 5.49 → 5.03 | 0 |
| 59.3 | 42 | 147.3 / 130.5 | 166.5 / 147.1 | 5.88 → 5.15 | 0 |
| 59.3 | 132 | 171.5 / 154.1 | 189.4 / 165.0 | 4.93 → 4.43 | 0 |
| 30000 | -48 | 187.6 / 16.5 | 222.7 / 192.8 | 3.96 → 3.69 | 0 |
| 30000 | 42 | 203.2 / 173.2 | 219.3 / 188.4 | 4.07 → 3.75 | 0 |
| 30000 | 132 | 192.5 / 171.2 | 213.0 / 187.1 | 4.34 → 3.89 | 0 |

Raw before/final captures sometimes run faster after this pass despite additional shader work. These sequential numbers are not evidence of a speed optimization: thermal/clocks, caches, OS scheduling and the initially minimized user preview changed the environment. That preview was no longer running by the end of baseline capture; it was not relaunched. Same-process ABBA ordering below is the better estimate of incremental shader cost.

### Incremental cost at 59.3 km

Within one native process the viewport was changed to actual 1920×1080 and warmed, then the strategic contribution was toggled off/on/on/off with 300 frames per leg. Same shader, scene, camera and FFT; it tests the additional shading only.

| Leg | Enabled | Wall ms | GPU ms | Average / 1% FPS |
|---:|---|---:|---:|---:|
| 1 | false | 6.67 | 5.60 | 150.0 / 119.7 |
| 2 | true | 6.68 | 5.67 | 149.7 / 129.3 |
| 3 | true | 6.82 | 5.64 | 146.6 / 46.5 |
| 4 | false | 6.52 | 5.48 | 153.3 / 126.8 |

Mean wall: 6.60 → 6.75 ms, **+0.16 ms (2.35%)**. Mean viewport GPU: 5.54 → 5.66 ms, +0.12 ms. This is a short local estimate, not a sustained thermal guarantee. No extra draw calls, simulation cascades, texture allocations or compute passes were added. Existing FFT memory budgets are unchanged.

Final settled-view maximum interval 7.02 ms; 0 of 4,500 measured frames exceeded 16.67 ms. Baseline maximum 170.71 ms includes a 170.71 ms maximum-zoom outlier. First-render/streaming intervals and capture/readback work are separate; they are not removed from raw evidence or misrepresented as steady performance. Scene instantiation 3922.57 → 3484.45 ms. Largest measured initial streaming interval 380.56 → 931.39 ms. The current readinessMs field includes measurement time as well as readiness; initialSamplesMs is the useful raw loading record. No clean-cache first-launch or real-time traversal FPS guarantee is claimed.

| Run | Peak process RAM MiB | Peak device-wide VRAM MiB | Peak GPU °C |
|---|---:|---:|---:|
| before | 1269.9 | 2638 | 88 |
| final | 1341.4 | 2590 | 86 |
| native-final | 1260.5 | 3333 | 86 |

VRAM includes desktop and other processes. Per-view Godot videoMemoryBytes, raw timings, full arguments and one-second NVIDIA memory/utilization/clock/power telemetry remain in the stage JSONs.

## Files and preservation

Modified runtime files: [ocean_surface.gdshader](../../ocean/ocean_surface.gdshader), [ocean_controller.gd](../../ocean/ocean_controller.gd), [ocean-settings.json](../../data/ocean-settings.json). Added profile/review/capture/report tools under tools/strategic-ocean-*. Evidence is under evidence/strategic-ocean-20261029, excluded from Godot import. [Exact source list and hashes](changed-files.json).

Compared 2871 pre-existing core-file hashes from the start of this pass and 48 entries from the prior ocean source manifest. Only the three intended runtime files changed; all FFT/compute files, world.gd, terrain/elevation/masks, camera, light, vegetation, atmosphere, hydrology and settlement sources remain byte-identical. Existing integrity validation passes: 460 protected files, 35 exact approved coordinates, 687 records and byte-identical research copy. [Protection output](protected-integrity.txt), [package validation](validation.json). No gameplay or The Rev modifications, commits or pushes.

## Limitations / rejected candidates

The new wind fields are an artistic statistical shading approximation, not resolved kilometre waves, measured wind/current data, or a new physical ocean simulation. No bathymetry, reflections from terrain, breaking surf or lake/river changes were added. The inherited coarse shoreline colour bands and some close-view local-patch edge speckles remain visible in the original and final captures. Extreme maximum zoom retains pre-existing finite-plane/map-extent artifacts and very little perceptible animation. It would be misleading to call every supported distance equally detailed.

candidate1 is invalid: its first mat2 constructor did not compile in Godot and was corrected. candidate2 was visually too weak. candidate3/after improved strategic water but exposed excessive repeating colour at maximum zoom; final replaces that basin texture with a nonperiodic field and footprint attenuation. Initial native checks passed, but their ad-hoc PowerShell wrapper misread an unavailable exit status; native-final uses the established process-handle capture wrapper and exits cleanly. Earlier evidence is retained and excluded from final selected comparisons.

Review the 59.3 km animation at actual playback speed and rotate in the existing game before accepting the art direction. Tests demonstrate preservation, operation and continuity, not independent aesthetic approval. Further tuning can use the isolated strategic settings without changing close FFT quality.
