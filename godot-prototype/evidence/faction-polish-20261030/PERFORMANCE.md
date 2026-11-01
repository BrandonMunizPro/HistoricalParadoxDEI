# Political-map polish performance

Godot 4.7.2 Forward+ Vulkan, RTX 3060 Laptop, 1920×1080. Matched cameras against the preceding faction-map delivery. VSync off, frame cap disabled. Each view uses 120 settled submitted wall intervals in a hidden window with force_draw; sequential captures, not sustained scan-out benchmarks. GPU measurements are Godot viewport timings.

| View | Average FPS | 1% low FPS | GPU ms | Draw calls |
|---|---:|---:|---:|---:|
| mediterranean | 103.5 → 106.0 | 72.6 → 91.9 | 8.29 → 8.56 | 427 → 357 |
| western-world | 136.2 → 139.2 | 94.6 → 108.7 | 6.24 → 6.26 | 387 → 358 |
| africa | 133.7 → 138.1 | 103.1 → 121.1 | 6.45 → 6.39 | 120 → 110 |
| eastern-world | 104.0 → 113.9 | 86.8 → 98.8 | 8.50 → 7.91 | 238 → 212 |
| italia | 118.5 → 139.7 | 99.5 → 119.7 | 7.29 → 6.31 | 177 → 161 |
| hellenic | 200.3 → 226.3 | 144.8 → 190.1 | 4.01 → 3.60 | 87 → 81 |
| transition | 130.3 → 156.2 | 99.1 → 136.8 | 6.48 → 5.50 | 52 → 50 |
| water-control | 148.4 → 188.9 | 107.5 → 158.9 | 5.42 → 4.32 | 8 → 8 |
| roma-control | 84.2 → 105.2 | 65.9 → 87.6 | 10.27 → 8.37 | 396 → 396 |

These samples show no measured settled-view regression, but cannot establish a speedup: unchanged close-view output also measures faster, indicating timing/clock/cache/temperature variability. Border rendering adds texture lookups; fewer monograms reduce 2D submissions. The Mediterranean sample is 427 → 357 draws. No extra compute pass or terrain mesh was introduced.

The current 360-frame rapid zoom/pan/rotation test with active terrain streaming and campaign UI measures 44.21 FPS average, 23.12 FPS 1% low, and 46.52 ms worst interval. The previous faction implementation measured 45.39 FPS and neutral mode 45.17 FPS in the same test earlier today. These short noncontemporaneous runs suggest broadly similar behavior; they do **not** meet smooth 60 FPS during aggressive movement. No first-render/thermal-soak or driver-level VRAM benchmark is claimed. Raw arrays and validation logs remain alongside the captures.
