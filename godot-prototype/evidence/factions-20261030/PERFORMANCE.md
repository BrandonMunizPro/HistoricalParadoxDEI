# Matched-view performance

Godot 4.7.2, Forward+ Vulkan, RTX 3060 Laptop, 1920×1080. VSync off and frame cap disabled. Each cell is before / after. 120 settled submitted wall intervals per view, captured sequentially in hidden windows with force_draw. These are short comparative samples, not sustained visible-window FPS guarantees. GPU timings are Godot viewport measurements. No concurrent GPU capture was running.

| View | Average FPS | 1% low FPS | GPU ms | Draw calls |
|---|---:|---:|---:|---:|
| mediterranean | 100.6 / 103.5 | 88.0 / 72.6 | 8.50 / 8.29 | 26 / 427 |
| western-world | 135.2 / 136.2 | 110.1 / 94.6 | 6.16 / 6.24 | 30 / 387 |
| africa | 133.8 / 133.7 | 109.3 / 103.1 | 6.19 / 6.45 | 22 / 120 |
| eastern-world | 113.4 / 104.0 | 95.6 / 86.8 | 7.54 / 8.50 | 18 / 238 |
| italia | 131.7 / 118.5 | 112.0 / 99.5 | 6.34 / 7.29 | 46 / 177 |
| hellenic | 212.6 / 200.3 | 155.1 / 144.8 | 3.64 / 4.01 | 13 / 87 |
| transition | 137.4 / 130.3 | 100.6 / 99.1 | 5.88 / 6.48 | 43 / 52 |
| water-control | 163.3 / 148.4 | 116.3 / 107.5 | 4.70 / 5.42 | 8 / 8 |
| roma-control | 94.9 / 84.2 | 77.9 / 65.9 | 8.92 / 10.27 | 396 / 396 |

The extra map emblems, glyphs and outlines increase 2D draw submissions significantly. The eastern and Italian samples regress, as do close samples despite pixel-identical output. Timing variability and GPU clock/temperature state were not controlled, so those close-view differences cannot be assigned solely to this change. Do not describe this as zero-cost. All final measured settled samples remain above 60 FPS at the 1% low; a sustained thermal-soak benchmark remains outstanding.

Raw frame arrays, maxima and over-budget counts are in before/views.json and final/views.json. The motion sweep including streaming and existing UI is in motion/performance.json; startup logs separately record world initialization. Captures wait for settled streaming and therefore exclude initial shader/font/texture stalls. No comprehensive first-render or driver VRAM residency benchmark is claimed.

## Rapid camera-motion comparison

The same 360-frame zoom/pan/rotation path was run with this build's faction layer disabled (--neutral-map) and enabled, retaining the existing campaign UI and active terrain streaming. This comparison isolates enabling this layer in the current build, rather than an old binary.

| Metric | Neutral | Factions |
|---|---:|---:|
| Average FPS | 45.17 | 45.39 |
| 1% low FPS | 22.36 | 21.98 |
| Worst interval ms | 45.86 | 47.80 |
| Intervals >33.33 ms | 17 | 19 |
| Godot video-memory counter MiB | 1315.3 | 1357.8 |
| Godot static-memory counter MiB | 380.4 | 385.9 |

**Smooth 60 FPS is not achieved during this aggressive moving-camera/streaming test in either mode.** Similar results indicate that enabling the faction layer is not the dominant bottleneck in this path; this does not prove which existing subsystem causes it. Memory values are Godot counters, not full process working-set or driver allocation measurements. The video-memory difference is approximately 42.5 MiB.
