# Native measurements

Godot 4.7.2, Vulkan Forward+, NVIDIA GeForce RTX 3060 Laptop GPU, 1280×720. Startup is measured from campaign scene loading to retirement of its loading cover; engine process initialization is excluded. Eight-second navigation windows; PNG readbacks excluded. Single sequential runs. Cold = fresh placement-cache namespace; OS/driver caches were not flushed.

| Run | Startup to map (s) | Peak reported video allocation (GiB) | Peak tracked static memory (GiB) |
|---|---:|---:|---:|
| before-cold | 52.43 | 4.74 | 2.65 |
| before-warm | 35.63 | 4.74 | 1.93 |
| after-cold | 65.72 | 5.27 | 2.52 |
| after-warm | 54.16 | 5.27 | 2.60 |

| Route | Before warm mean / p99 (ms) | After warm mean / p99 (ms) | Before detail ready (s) | After detail ready (s) | Baseline on first arrival |
|---|---:|---:|---:|---:|---|
| tarquinii | 15.61 / 26.19 | 20.22 / 39.64 | 1.11 | 1.65 | Available |
| delta | 15.03 / 35.14 | 19.74 / 40.76 | 3.61 | 4.21 | Available |
| aegean | 15.95 / 24.99 | 20.71 / 37.83 | 3.51 | 4.83 | Available |
| blacksea | 16.12 / 35.40 | 23.01 / 38.49 | 1.73 | 2.40 | Available |
| brittany | 16.97 / 35.26 | 19.54 / 36.57 | 3.42 | 4.18 | Available |
| delta (repeat) | 16.82 / 20.67 | 19.00 / 24.51 | 3.97 | 0.27 | Available |

Detail-ready times describe the optional detailed beach/compute patch, not a wait for basic coastline geometry. The repeated Delta visit exercises the patch cache. Baseline readiness flags alone do not prove visual correctness; inspect the first-draw screenshots. No general frame-rate improvement is claimed.

On the repeated Delta visit, the largest recorded frame interval was 975.11 ms before and 48.16 ms after. This is a single-run observation, not attribution of every stall to coast generation.

Native first-draw/zoom assertions: 70 checks; passed=true. Visual inspection is documented separately in REPORT.md.
