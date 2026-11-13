# Threshold and travel checks

Repeated zoom sets eleven distances around the prepare/visibility/release neighbourhood and back to 12 km, six real GPU frames per value. Rapid travel moves the focus about 0.15° east/north, then west/south, then back, with two seconds at each focus. These short travel checks do not prove all new regions finish generating.

| Trial | Mean frame ms before → after | p99 ms | Max ms | Local cells resident | Engine static MiB |
|---|---:|---:|---:|---:|---:|
| italy / repeatedZoom | 48.1 → 50.2 | 57.3 → 62.4 | 57.3 → 62.4 | 0 → 9 | 2517.4 → 2522.4 |
| italy / rapidMovement | 13.5 → 14.4 | 22.6 → 22.3 | 53.0 → 48.8 | 9 → 11 | 2524.1 → 2523.9 |
| gaul / repeatedZoom | 29.1 → 30.5 | 52.0 → 51.7 | 52.0 → 51.7 | 3 → 9 | 2483.3 → 2481.4 |
| gaul / rapidMovement | 13.5 → 14.9 | 19.0 → 24.2 | 28.8 → 30.6 | 11 → 10 | 2488.6 → 2482.5 |

Both optimized routes retained all nine focused local cells across the zoom reversals. The validation also checks the post-travel cache budgets. Faster arrival of central detail does not translate into a general sustained FPS improvement: the optimized runs keep more local scenery ready and continue preparing different coarse cells.

| Route | Slowest terrain tile preparation ms before → after | Max generation CPU slice ms through warm trial | Max upload/resource CPU slice ms through warm trial |
|---|---:|---:|---:|
| italy | 111.8 → 125.9 | 16.0 → 13.5 | 3.7 → 139.6 |
| gaul | 126.1 → 117.3 | 13.0 → 11.0 | 2.3 → 0.9 |

The upload timer includes synchronous first-use mesh/atlas resource setup. Italy still has a large first-use upload/resource spike; this patch does not remove that bottleneck. Terrain timing includes existing context startup. Pipeline compilation counters are in each raw snapshot, but no GPU profiler isolates their wall-time contribution.
