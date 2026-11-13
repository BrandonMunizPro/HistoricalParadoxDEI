# Native streaming measurements

One paired run per region; no statistical significance or universal frame-rate claim. Godot 4.7.2 Forward+, RTX 3060 Laptop GPU, 1920×1080, uncapped, VSync disabled. Real forced GPU submissions and normal camera easing, six-second logarithmic zoom goals from 300 to 12 km. Cold means an empty isolated placement-cache namespace; OS and driver caches were not flushed. Warm re-entry revisits the same focus in the same process after 2.5 seconds at 300 km.

Local onset is actual camera distance below 32 km (existing shader transition). First-visible is focused cell ready, visible, and reveal >0.2. Full-ready means all nine nearby cells uploaded; it does not imply every coarse cell or fade is complete. Screenshot saving occurs after timed samples. The 90-frame post-local-ready sample may include ongoing coarse preparation; it is not guaranteed to be globally settled. Frame samples include terrain streaming, UI, CPU, GPU submissions and OS scheduling, not vegetation CPU alone.

| Region / trial | First-visible delay ms, before → after | All nine ready delay ms | Loading mean ms | Loading p99 ms | Loading max ms |
|---|---:|---:|---:|---:|---:|
| italy / cold | 4204 → 1470 | 20295 → 16886 | 21.7 → 17.5 | 133.8 → 69.1 | 2129.6 → 179.0 |
| italy / warm-reentry | 0 → 0 | 0 → 0 | 39.1 → 41.7 | 60.5 → 57.7 | 65.8 → 59.6 |
| gaul / cold | 28656 → 0 | 51666 → 25661 | 14.0 → 15.5 | 38.7 → 42.0 | 116.4 → 49.3 |
| gaul / warm-reentry | 0 → 0 | 0 → 0 | 32.5 → 35.9 | 54.5 → 50.7 | 56.6 → 51.4 |

| Region / trial | Post-local-ready FPS | Engine static MiB | Engine video MiB | Draw calls | Resident instances |
|---|---:|---:|---:|---:|---:|
| italy / cold | 73.4 → 71.5 | 2503.9 → 2502.0 | 4563.0 → 4563.0 | 601 → 601 | 16200 → 16200 |
| italy / warm-reentry | 64.3 → 62.6 | 2523.8 → 2522.7 | 4563.1 → 4563.1 | 612 → 612 | 17399 → 17399 |
| gaul / cold | 63.1 → 62.2 | 2487.0 → 2480.0 | 4443.2 → 4442.1 | 739 → 717 | 31004 → 16604 |
| gaul / warm-reentry | 60.4 → 60.2 | 2487.2 → 2480.8 | 4444.9 → 4443.9 | 753 → 738 | 31004 → 18404 |

Resident totals include retained/coarse cells, so totals and draw calls can differ as preparation order changes. **All nine local cells have byte-identical MultiMesh buffers and identical plant/rock counts before and after, in both cold and warm trials (36 comparisons).** Density, RNG, transforms, colors, terrain elevations and LOD custom data are preserved. Engine memory counters are not process working set or peak RSS.

Raw profiles include terrain tile preparation timings, generation/upload CPU work, pipeline compilation counts, repeated threshold crossings, rapid focus travel, memory, draw calls and exact buffer hashes. See [raw evidence](../../evidence/streaming-optimization/) and [paired screenshots](../../evidence/streaming-optimization/compare.html).
