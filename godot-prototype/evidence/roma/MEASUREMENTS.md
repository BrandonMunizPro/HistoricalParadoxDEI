# Roma measured evidence

Final source: f655dbb942c5e8eff1cdcb1c1ee018b085b38ce45f64b3487e3dd945582663d0. Baseline source: cd82ca5c45df14447a87b22f2eed9d1a987134a9fb3aa674141eb7686fdda909. HEAD cbab45903ee34973b68fac5360ad17dbe24c90a6. RTX 3060 Laptop, Godot 4.7.2 Forward+, 1920×1080, 120 FPS cap / mailbox policy unchanged.

## Matched images

FPS is the reciprocal of mean frame duration, from the final 180 settled frames. Before and after production render settings are unchanged except the documented local Roma art/lighting treatment. Geometry, camera settings and art naturally differ. CPU scheduling, driver, thermals and caches are not controlled; do not attribute baseline strategic FPS differences solely to the new architecture.

| View | Before FPS | After FPS | p95 ms before / after | Draw calls before / after | Godot video MiB before / after | Sampled RAM MiB before / after |
|---|---:|---:|---:|---:|---:|---:|
| Strategic — 45 km | 54.2 | 120.3 | 22.04 / 8.39 | 176 / 204 | 1060 / 1085 | 1343 / 1356 |
| Intermediate — 7.2 km | 75.2 | 89.8 | 16.39 / 13.88 | 534 / 596 | 1114 / 1145 | 1352 / 1407 |
| Close east — 1.2 km | 120.3 | 100.4 | 8.39 / 13.02 | 246 / 328 | 1114 / 1145 | 1354 / 1406 |
| Close west — 1.2 km | 103.3 | 98.8 | 12.38 / 12.93 | 302 / 394 | 1114 / 1145 | 1353 / 1407 |
| Layout overview — 1.8 km | 120.3 | 119.1 | 8.41 / 10.43 | 156 / 218 | 1114 / 1145 | 1340 / 1409 |

## Same-source repeatable navigation control

Both runs use the final source. Neutral control uses --roma-neutral-baseline to restore Roma's old neutral cluster and original local lighting. All other world presentation is unchanged. Warm-up: 45→7.2→1.2→45 km. Measured: 45→7.2→1.2→7.2→45 km, then the same small pan/orbit. 1% low = reciprocal of the mean slowest 1% of measured process-frame intervals. Frame percentiles include motion, LOD updates and readiness waits, not just settled images.

| Mode | Navigation mean FPS | p95 ms | p99 ms | 1% low FPS | Warm maximum ms | Synchronous startup ms | First readiness maximum frame ms | Sampled peak RAM MiB |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| neutral | 110.5 | 10.92 | 12.30 | 77.6 | 14.08 | 3196 | 89.95 | 1383 |
| prototype | 100.8 | 11.93 | 14.26 | 64.8 | 20.27 | 3376 | 130.41 | 1425 |

Full raw frame lists, stage readiness, first readiness and video-memory totals are in navigation3-*/navigation.json. Process memory is a sampled working set (wrapper and direct child), a lower bound on true peak. RenderingServer video memory counts allocations and is not a complete board-wide VRAM measurement. Endpoint nvidia-smi telemetry does not rule out mid-run thermal changes. Startup is measured separately; these are warm-cache launches, not a cache-cleared cold-start benchmark. The older 4.10-second cold-start issue is not certified fixed.

## Validation

Twelve Godot checks passed, including Roma, all accepted settlement anchors, actual production global/regional navigation and expected failure of the timeout-negative case. npm run validate log records lint, typecheck, 475 tests and build/smoke. Protected data integrity is separately recorded in integrity.json. No asset rollout outside Roma and no commits/pushes.

## Evidence exclusions

Early roma-before / roma-before-detail launches overlapped and are not the primary benchmark. The serial baseline directories are primary. roma-preview* / roma-review / roma-light-review* / roma-shadow-review and the first roma-final* are diagnostic/superseded. The first navigation-neutral run failed because the new benchmark harness assigned integers to float camera goals; the harness was corrected, a new source snapshot taken and all primary final images recaptured. This was a harness failure, not a production navigation defect.

## Final review caveats

The earlier source feea48e232bf3d9df1ffc8e4483427eb1ac28542d977ff15f8f425e157bfe70d passed functional checks but FAILED the warmed performance target: 187–211 ms spikes and 10.8 FPS 1% low. navigation2-prototype retains that evidence. It was superseded by source f655 after budgeting/caching local surfaces and removing generic-neutral topology invalidations. The final metrics above use navigation3 and roma-final3 only. Roma maxChunkMs can include yielded multi-frame spans and is not an exclusive CPU slice; raw frame lists support the stall measurements.

Final images were visually inspected. Close architectural differentiation is the primary gain; the 7.2 km view makes individual units less legible than the oversized old houses. Strategic presentation, flat local relief, stylized vegetation and repeated facade motifs remain below the reference target. Artistic acceptance remains independent.
