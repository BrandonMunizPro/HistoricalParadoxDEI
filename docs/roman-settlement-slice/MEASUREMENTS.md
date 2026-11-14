# Native development-slice measurements

Godot 4.7.2, RTX 3060 Laptop, Vulkan Forward+, 1280×720. Single sequential runs.
Each view samples 60 process-frame wall intervals after 12 frames; streaming,
OS scheduling and presentation are included. These are not isolated GPU times.
Default legacy and opt-in preview render different amounts of geometry; neither
comparison establishes an art-equivalent speedup. No settlement disk cache was
added. OS/driver caches were not flushed.

| Mode | Preparation (s) | Planner active (s) | Longest planning chunk (ms) | Peak video (GiB) | Peak static (GiB) |
|---|---:|---:|---:|---:|---:|
| legacy | 34.02 | 0.00 | 0.00 | 5.05 | 2.53 |
| preview | 67.35 | 10.21 | 456.17 | 5.05 | 2.56 |
| preview-startup | 71.43 | 10.30 | 479.45 | 5.36 | 2.57 |

Only preview-startup runs the ordinary loading-screen preparation. The other
preparation values include source loading/baselines but bypass normal warmup.
They are not interchangeable cold/warm startup measurements.

| Settlement, 0.65 km | Legacy mean / p99 (ms) | Preview mean / p99 (ms) | Full-startup preview mean / p99 (ms) |
|---|---:|---:|---:|
| roma | 29.19 / 380.32 | 10.50 / 15.78 | 13.65 / 17.66 |
| ostia | 21.39 / 37.93 | 18.44 / 196.65 | 18.13 / 163.66 |
| capua | 8.28 / 10.01 | 10.18 / 41.52 | 13.47 / 36.49 |
| aricia | 8.33 / 8.39 | 13.43 / 185.96 | 14.56 / 158.42 |
| minturnae | 8.44 / 19.00 | 19.52 / 211.96 | 17.44 / 162.94 |
| formiae | 9.95 / 24.12 | 17.48 / 200.16 | 18.14 / 178.80 |

Full-startup preview: 1694 mesh-cache hits, 17 misses,
19.71 MiB retained estimated mesh bytes,
0.19 MiB retained source heights.
Plans are reused on LOD changes. Attach/asset-wait metrics include async frame
waits and are not CPU upload timings. Raw reports retain draw-call counts and
each view's mean, p99 and maximum interval. All 24 captures/view metrics exist
per mode; no final architectural quality is asserted.

| Real-map fixture | Accepted parcels | Enclosure rejection | Harbor rejection |
|---|---:|---|---|
| roma | 0 | wall_terrain | — |
| ostia | 7 | — | — |
| capua | 3 | — | — |
| aricia | 0 | — | — |
| minturnae | 7 | — | — |
| formiae | 0 | — | no_valid_shore_and_land_connection |

A blank rejection is not proof that authored art exists. The harbor validity
check is relevant only when the fixture requests a port. Roma/Aricia/Formiae
placement and missing production art remain acceptance failures.
