# Mediterranean ocean review — 29 October 2026

Implemented and captured in the actual campaign world. Open [the interactive comparison and animation](comparison.html). Native captures are unretouched; this is a review candidate, not independent artistic acceptance.

## Visible outcome and limits

The close/surface pair replaces blurred repeating bands with directional multi-scale waves, moving highlights and local displacement. Tarquinii shows fine directional water and a calmer horizon. Wave detail intentionally filters into roughness at campaign altitude, where the result remains restrained and can still appear flat. This does not deliver an entire modern campaign-map art overhaul. The existing terrain, beach geometry and sky still limit the overall scene. Campaign-scale artistic acceptance remains open.

Eight matched camera pairs cover campaign, regional and low Tarquinii, open sea, Sicily, Messina and the Corsica/Sardinia archipelago, plus a supplementary very low surface view. The first seven use 600 measured frames each. The supplementary surface pair uses 90 frames and is not used for the main performance comparison. Actual transforms/clipping are checked to 1e-5; all stills are 1920×1080. UI/markers are hidden consistently. New-water images use deterministic time zero after foam initialization. Separate t=4 captures prove a changed render; the 120-frame native 960×540 sequence demonstrates waves and zoom/rotation. The sequence is sampled deterministically at 24 frames per simulated second, not a real-time performance recording.

## Integrated architecture

The existing world attaches a GPU FFT renderer to its existing sea material. Three independently seeded directional TMA/JONSWAP domains (128, 487, 1973 metres) produce metre-scale displacement, slopes, second slope moments and Jacobian foam. Metres convert to the existing kilometre world. A single camera-following graded mesh tapers into the existing background sea, avoiding terrain-tile water seams. Analytic background coordinates remove the precision line observed in an early candidate. Existing geographic masks/projection, inland exclusions, opaque land, river/lake renderers and source elevations remain authoritative. Coastal waves are damped and final displacement capped at 0.75 m below the existing 1 m land floor.

Normal-moment mipmaps preserve unresolved wave energy as roughness. Below 1 km camera distance, temporal normals resolve once per texel on the GPU; 1–8 km views interpolate histories in the surface shader; farther views sample filtered moments directly. Displacement remains interpolated. Godot dielectric GGX sky/sun reflections replace the original procedural bands; there are no planar/terrain SSR reflections. Shore distance controls shallow-looking colour and shoreline damping, not real bathymetric depth. There is no simulation CPU readback during play.

Low: 128² / 2 cascades / 65² grid / 18,8,2 Hz. Balanced: 256² / 3 / 129² / 24,12,3 Hz. High: 512² / 3 / 193² / 30,15,4 Hz (near/regional/far). Spray budget is zero; foam is deliberately subtle for moderate Mediterranean conditions. Quality, wind, wave intensity, foam, colours and distance budgets are in [ocean-settings.json](../../data/ocean-settings.json). Restart for quality changes. Existing animation toggle pauses/resumes scheduling. Unsupported/headless renderers use preserved legacy water; --legacy-ocean explicitly selects it.

Run from the repository: .\godot-prototype\ocean-preview.ps1 -Quality balanced. The preview starts on the Tarquinian coast, uncapped, using existing navigation. Main world integration also defaults to balanced on Forward+.

## Performance

Godot 4.7.2 official, Forward+, Vulkan 1.4.351, RTX 3060 Laptop 6 GB, driver 617.42, 1920×1080, MSAA 4×. These are uncapped controlled hidden-window submissions with force_draw(true), automatic render loop disabled and VSync off after world initialization. They are wall-frame throughput, not PresentMon/display scan-out. 1% low is reciprocal mean of the slowest 1% of intervals. Retained caches; not clean-cache shader-compilation measurements. One-second device telemetry reached 88°C in the after run; laptop temperature/clocks and sequential execution introduce uncertainty. No other Godot preview was active in the final paired runs.

| View | Old avg / 1% FPS | New avg / 1% FPS | Wall ms old → new | Viewport GPU ms old → new |
|---|---:|---:|---:|---:|
| campaign | 240.7 / 197.9 | 197.2 / 162.0 | 4.2 → 5.1 | 3.3 → 4.2 |
| tarquinii-region | 218.3 / 184.1 | 204.7 / 170.1 | 4.6 → 4.9 | 3.8 → 4.1 |
| tarquinii-coast | 122.0 / 84.7 | 93.0 / 77.4 | 8.2 → 10.7 | 3.9 → 5.0 |
| offshore | 339.2 / 184.1 | 218.8 / 161.4 | 2.9 → 4.6 | 2.2 → 3.6 |
| sicily | 187.1 / 159.1 | 167.3 / 138.6 | 5.3 → 6.0 | 4.5 → 5.1 |
| messina | 134.3 / 110.5 | 120.5 / 102.4 | 7.4 → 8.3 | 6.6 → 7.4 |
| archipelago | 137.2 / 113.4 | 129.1 / 111.1 | 7.3 → 7.7 | 6.5 → 6.8 |

All 4,200 final balanced stationary samples were below 16.67 ms. This does not imply all traversal/loading frames meet that budget.

| Run | Coastal avg / 1% FPS | Offshore avg / 1% FPS |
|---|---:|---:|
| review-low | 103.5 / 85.2 | 242.8 / 194.9 |
| review-after | 93.0 / 77.4 | 218.8 / 161.4 |
| review-high | 79.0 / 63.0 | 182.8 / 130.0 |
| review-frozen | 93.0 / 83.0 | 210.2 / 151.3 |

Freezing scheduled FFT updates did not materially improve the close view in this run: shading/filtering and other world work remain significant. Warm balanced FFT/mip GPU marker deltas were approximately 0.26–0.29 ms; first-use markers were around 1.9 ms in earlier valid runs. Raw GPU deltas are nanoseconds, sampled/delayed, and exclude history copies plus the separate close-view temporal resolve. They are not the total ocean cost. See [API source](https://github.com/godotengine/godot-docs/blob/master/classes/class_renderingdevice.rst).

### Stalls and movement

- review-before 900-frame pan/rotate/zoom with streaming: 88.6 average / 49.5 1% low, 28.7 ms maximum; 0 frames >33.33 ms.
- review-after 900-frame pan/rotate/zoom with streaming: 75.9 average / 40.3 1% low, 46.1 ms maximum; 1 frames >33.33 ms.

The final 60-second balanced coastal run measured 89.0 average / 69.1 1% low FPS over 5,341 samples, maximum 48.396 ms, two frames over 33.33 ms. Therefore uninterrupted 60 FPS is not established. An earlier pre-adaptive sustained run measured 68.0 FPS; it is retained as history, not substituted for final results.

Scene instantiation: 3622.5 ms old versus 3769.1 ms new. Initial settled-view readiness ranges 1587.4–8515.8 ms old, 1429.5–8797.3 ms new; the harness waits at least 180 frames, so this is not pure I/O time. Startup first-frame interval maxima were 277.9 / 241.1 ms. Existing material uploads consume about 1.87 s of the new startup; water/UI/hydrology grouping 1.22 s cannot isolate FFT initialization alone.

Full-run diagnostics also retain 0.37–0.93 s before and 0.14–0.77 s after wall intervals around view/capture transitions. Some include synchronous screenshot I/O and explicit deterministic capture work; they must not be presented as steady gameplay. A few ordinary streaming uploads are separately recorded. The 46 ms final motion spike has no corresponding large instrumented CPU stage; its exact cause is unresolved. Earlier adaptive candidates had still worse traversal spikes (up to 490 ms). Do not use these measurements to promise stutter-free movement. See raw firstFrameSamplesMs, motion frameSamplesMs and diagnostics slowFrames.

| Run | Peak process RAM MiB | Peak device-wide VRAM MiB | Peak GPU °C |
|---|---:|---:|---:|
| review-before | 1252.7 | 2510 | 86 |
| review-after | 1266.8 | 2534 | 88 |
| review-low | 1238.6 | 2619 | 87 |
| review-high | 1242.6 | 2560 | 88 |
| review-frozen | 1236.2 | 2539 | 87 |
| review-sustained | 1217.7 | 2653 | 87 |

VRAM telemetry includes desktop/other applications and is not app-exclusive. Godot per-view videoMemoryBytes and drawCalls/primitives remain in performance.json. Balanced FFT/texture allocation estimate is 22.5 MiB, excluding engine/driver overhead. No CPU readbacks occur in play; validation deliberately reads GPU data.

| View | Old → new draw calls | Old → new Godot video memory MiB |
|---|---:|---:|
| campaign | 44 → 44 | 1148.6 → 1171.7 |
| tarquinii-region | 67 → 67 | 1149.9 → 1172.9 |
| tarquinii-coast | 90 → 91 | 1150.0 → 1173.1 |
| offshore | 7 → 8 | 1149.2 → 1172.3 |
| sicily | 45 → 45 | 1149.1 → 1172.2 |
| messina | 429 → 429 | 1150.0 → 1173.1 |
| archipelago | 568 → 568 | 1150.4 → 1173.5 |

### Rejected path

An experimental batched mip-tail kernel crashed the test process inside nvoglv64.dll (signal 11). It was reverted, source moved under rejected-mip-tail evidence, and no active renderer references it. Root cause is unconfirmed. The ordinary per-level mip pipeline passed subsequent final captures, preset runs and 16 native GPU checks. Earlier push-constant/descriptor failures and the early seam candidate remain in the logs, but are excluded from selected comparisons.

## Validation and protection

16 actual Forward+ GPU checks passed: all preset FFT sizes/cascade counts, finite signed animated heights, temporal history/resolve copies, slope-moment mip energy, foam ranges, GPU lifecycle, nine zoom distances/normal paths, displacement/mask guards and existing pause/resume behavior. [Native results](native-validation-final.json). They do not certify visual quality or every coastline pixel.

All 2871 pre-existing project files were SHA-256 compared against the pre-integration snapshot. Only world.gd changed; no pre-existing file was deleted. Original water shader is byte-identical. The existing integrity validator passes: all 460 protected files unchanged, 35 exact approved coordinates, 687 research records and byte-identical research copy. [Integrity output](protected-integrity.txt), [review checks](validation.json). Existing prior dirty work is preserved. No gameplay, ownership, faction, character, settlement, elevation or The Rev changes. No commit or push.

## Changed files and attribution

- Existing world.gd: small ocean attachment, settings load and lifecycle reference; pre-existing work retained.
- New ocean/: GPU simulation, render context/cascade resource, compute kernels, filtered surface shader, geographic/controller adapter, README, exact third-party license and upstream provenance.
- New data/ocean-settings.json and ocean-preview.ps1.
- New tools/ocean-{profile,preview,validate,animation,api}.gd, ocean-capture.ps1 and this ocean-report.mjs.
- New evidence/ocean-20261028/: original baseline, selected and rejected experiments, raw metrics/logs, screenshots, animation, audit and review package. Evidence is excluded from Godot import with .gdignore.

[Exact source file list with SHA-256 hashes](changed-files.json). The only pre-existing file modified by this task is world.gd, verified against the session snapshot rather than the repository HEAD (which contains earlier uncommitted work).

Primary technical reference: [GodotOceanWaves](https://github.com/2Retr0/GodotOceanWaves/) pinned a171446f8174348895aaafc426576c26261058b9, cloned outside the game. MIT, Copyright (c) 2024 Ethan Truong. [Exact license](../../ocean/LICENSE-GodotOceanWaves.txt), [upstream manifest](../../ocean/upstream.json), [inspection/reuse audit](AUDIT.md), [implementation guide](../../ocean/README.md). Only the licensed FFT/spectrum/context components listed there were reused/adapted. No reference demo project, proprietary game assets or purchased assets were imported.

## Remaining work for review

Judge the matched images and animation before accepting the art direction. Low coastal waves are substantially improved; campaign water remains subdued. Beach transitions still follow source-mask resolution (about 217 m in the regional fields), with broad colour bands rather than real shoaling or surf. There is no measured bathymetry, wave refraction, breaking surf, tides, wakes, underwater rendering, spray, planar reflection or terrain SSR. Existing close shoreline/terrain detail is not upgraded. Hardware validation covers this RTX 3060 Laptop and native Forward+ only. Pixel-perfect absence of all possible coastal clipping is not proven by source integrity; sampled Tarquinii/Messina/archipelago views show no introduced tile seams or obvious flooding. Further work should prioritize detailed coastal terrain/depth evidence and tracing remaining motion stalls before adding expensive effects. Stop here for visual review.
