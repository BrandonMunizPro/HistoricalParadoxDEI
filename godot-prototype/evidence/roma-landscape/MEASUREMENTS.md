# Roma landscape measurements

Final source b63b6ed68d3b0b728a049376e6dcc604cd423e6018f8ac0167689e91acd706f4; before f655dbb942c5e8eff1cdcb1c1ee018b085b38ce45f64b3487e3dd945582663d0; HEAD cbab45903ee34973b68fac5360ad17dbe24c90a6. RTX 3060 Laptop / Godot 4.7.2 Forward+ / 1920x1080, unchanged 120 FPS cap and mailbox setting.

## Same-source repeatable navigation

Both runs retain the accepted Roma architecture. The baseline flag --roma-landscape-baseline disables only the new landscape paint, local DEM tile, new wall and vegetation transitions. Warm-up 45 -> 7.2 -> 1.2 -> 45 km; measurement 7.2 -> 1.2 -> 7.2 -> 45 km plus small pan/orbit. Raw process-frame lists are retained. 1% low is the reciprocal of the mean slowest 1% of measured frames.

| Mode | Mean FPS | 1% low FPS | p95 / p99 ms | Warm max ms | Synchronous startup ms | Initial readiness max frame ms | Sampled RAM MiB | Godot video MiB |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| baseline | 114.6 | 77.0 | 9.79 / 11.63 | 15.37 | 3329 | 377.50 | 1432 | 1143 |
| landscape | 104.1 | 58.1 | 12.69 / 15.04 | 32.36 | 3465 | 160.54 | 1441 | 1148 |

The new work has a measurable mean-FPS cost and longer approach readiness (including camera motion, generation and stable sampling); exact final values and stage timings are retained in the raw navigation records. It meets the earlier warmed 60 FPS mean / 45 FPS 1% low / no >100 ms motion-stall targets on this run, with limited 1% low margin. No claim of unchanged performance. Complete raw stage timings are in navigation2-*/navigation.json.

First-readiness spikes are recorded separately above. Launch order, caches and thermals are not controlled, so this does not establish a startup improvement. The existing cold-start hitch remains unresolved. GPU endpoint telemetry does not exclude intermediate throttling. Sampled process RAM is a lower bound, and Godot video allocations do not include all system VRAM.

## Matched geographical framing

Camera focus/distance/pitch/yaw/FOV match. Camera height follows the new local elevation, so these are not identical absolute XYZ camera transforms. Water phases are not locked. Final 180 ready-frame samples are used for settled FPS, not first-loading frames. Historical before-source captures are from the prior Roma review, not a controlled thermal benchmark.

| View | Earlier FPS | Current FPS | Current p95 ms | Current draw calls | Current video MiB |
|---|---:|---:|---:|---:|---:|
| Strategic 45 km | 120.3 | 120.3 | 8.38 | 229 | 1091 |
| Intermediate 7.2 km | 89.8 | 95.3 | 11.44 | 643 | 1150 |
| Close east 1.2 km | 100.4 | 107.8 | 10.12 | 453 | 1150 |
| Close west 1.2 km | 98.8 | 113.6 | 9.82 | 518 | 1150 |
| Layout 1.8 km | 119.1 | 120.0 | 8.39 | 289 | 1150 |

## Validation and geometry

13/13 Godot checks passed; npm validation passed lint, typecheck, 475 tests and build/smoke. All 460 protected files, 35 approved identities/coordinates and 687 research records are unchanged. New landscape test verifies all 121 original XY/angle/size/type entries, four road endpoint joins, positive bounded vegetation, and zero sampled parent-edge height delta with at most 13 resident native tiles. The finer tile replaces an outer resident tile; it does not raise the tile cap.

New imagery, surface mask and mesh derivatives are original/generated from existing sources. There are no new external downloads. DSM source bytes remain unchanged; a 5x5 Gaussian surface filter (sigma 1.2 samples) attenuates small features in the renderer derivative, including potentially real features as well as modern roof-scale artefacts. Broad source relief and the existing 1.5x display scale are retained. This is modern topography, not an ancient terrain reconstruction.

Preview folders are diagnostic. The first preview leaked resources through a RefCounted cycle, corrected with a weak owner reference; final checks and captures require empty stderr. Intersecting field ribbons and tall generic foundations were rejected during actual image inspection. Final surface paint is in the existing opaque terrain material and buildings use centre-grounding on the finer terrain, with unchanged horizontal layout. Remaining foundation intersections, generic tree meshes and diagrammatic parcel/road details require visual review.
