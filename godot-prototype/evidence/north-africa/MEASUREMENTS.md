# Matched North Africa performance

Godot 4.7.2 Forward+, RTX 3060 Laptop GPU, 1920 x 1080. Unchanged driver/shader/native caches. Short desktop samples of at least 180 consecutive settled frames, not a controlled hardware benchmark. No concurrent validation/build ran during the review captures or navigation tour.

Source `ce0246585068e514c27c3c539851c90951075accdc19c9040da6bda19b65cbfe`. Full JSON includes timestamps, GPU time, counts, CPU generation/upload work and process memory.

| Region | Zoom / km | Before FPS | After FPS | Before GPU ms | After GPU ms | Before / after draw calls |
| --- | --- | --- | --- | --- | --- | --- |
| africa | inspection / 6.0 | 112.6 | 123.9 | 7.1 | 6.9 | 351 / 241 |
| africa | regional / 52.5 | 99.4 | 144.0 | 5.6 | 5.3 | 177 / 183 |
| africa | strategic / 150.0 | 132.4 | 144.0 | 5.7 | 4.5 | 82 / 65 |
| coast | inspection / 4.0 | 141.1 | 144.1 | 4.4 | 3.6 | 381 / 145 |
| coast | regional / 35.0 | 142.6 | 144.0 | 3.5 | 2.7 | 86 / 63 |
| coast | strategic / 100.0 | 119.0 | 144.1 | 3.3 | 2.7 | 157 / 87 |
| delta | inspection / 7.2 | 93.8 | 122.3 | 8.9 | 7.2 | 622 / 213 |
| delta | regional / 63.0 | 89.0 | 144.4 | 5.7 | 4.3 | 207 / 111 |
| delta | strategic / 180.0 | 140.4 | 144.4 | 3.6 | 3.5 | 49 / 49 |
| desert | inspection / 7.2 | 115.7 | 123.7 | 7.5 | 6.1 | 249 / 209 |
| desert | regional / 63.0 | 99.3 | 144.3 | 4.4 | 4.8 | 87 / 82 |
| desert | strategic / 180.0 | 121.3 | 144.4 | 4.8 | 5.0 | 71 / 69 |
| egypt | inspection / 7.2 | 120.6 | 142.8 | 7.1 | 6.1 | 600 / 272 |
| egypt | regional / 63.0 | 141.2 | 144.5 | 5.1 | 4.1 | 160 / 102 |
| egypt | strategic / 180.0 | 142.0 | 144.4 | 4.1 | 4.2 | 47 / 47 |
| illyria | inspection / 3.6 | 143.1 | 144.4 | 2.4 | 2.7 | 85 / 85 |
| illyria | regional / 31.5 | 140.6 | 141.6 | 4.1 | 5.4 | 360 / 360 |
| illyria | strategic / 90.0 | 111.4 | 29.5 | 6.5 | 24.6 | 122 / 122 |
| italy | inspection / 3.6 | 129.2 | 88.0 | 4.5 | 9.5 | 343 / 343 |
| italy | regional / 31.5 | 145.0 | 36.5 | 3.9 | 18.9 | 524 / 524 |
| italy | strategic / 90.0 | 144.1 | 43.0 | 4.4 | 14.6 | 106 / 106 |
| sicily | inspection / 3.6 | 116.8 | 27.7 | 6.7 | 27.0 | 399 / 399 |
| sicily | regional / 31.5 | 114.9 | 40.1 | 4.4 | 18.2 | 528 / 528 |
| sicily | strategic / 90.0 | 143.4 | 105.1 | 5.3 | 7.1 | 130 / 130 |

Settled FPS 27.7–144.5; mean GPU 2.7–27.0 ms. Startup 2955–5943 ms; measured startup/streaming maximum frames 69.0–4098.8 ms. Material initialization 1814.1–3696.1 ms remains a synchronous boot cost. Generation chunk maximum 6.6 ms, upload chunk maximum 5.8 ms.

Sampled console-wrapper + direct-child process memory 1284.5–1376.7 MiB (250 ms polling); reported renderer video memory 1047.8–1102.2 MiB. All captures stayed at 13 terrain tiles, at most 12 coarse groups and nine close cells, 1,800 instance records per cell. Coarse stands contain 24 small tree forms and are not botanical density measurements.

## Actual production navigation and zoom approach

| Stage | Settled FPS | GPU ms | Max transition frame ms | Complete readiness ms |
| --- | --- | --- | --- | --- |
| production-greece | 126.2 | 6.6 | 27.5 | 7330 |
| production-anatolia | 144.6 | 5.3 | 29.4 | 6810 |
| production-egypt | 144.4 | 4.6 | 34.0 | 5721 |
| production-mesopotamia | 144.0 | 4.1 | 37.9 | 7117 |
| production-persia | 144.0 | 4.9 | 27.5 | 6169 |
| zagros-200 | 144.0 | 4.8 | 22.6 | 5339 |
| zagros-70 | 104.8 | 4.9 | 8.4 | 1541 |
| zagros-8 | 114.7 | 7.7 | 13.8 | 5211 |
| production-cancellation-recovery | 144.0 | 5.3 | 18.5 | 6087 |

All nine stages passed complete readiness, bounded terrain/scenery residency and relative zoom step <=0.08. Production stages use the real resolver; Zagros distances are explicitly diagnostics. River-bank checks and interrupted-generation recovery passed. See navigation-before/navigation.json for the fresh baseline tour. Timing is a measured sample rather than a statistical benchmark.

## Remaining regressions and caveats

The regional pass replaces coarse North African stands with individual plants; Italian/Sicilian/Illyrian composition is unchanged. Read the entire paired table: some views improve while others regress. The measured table includes all regional changes and baseline views. Lower total FPS with similar/lower GPU time also occurs, so frame pacing and laptop hardware variability are not isolated. No generic performance-pass threshold is inferred from these measurements. No cache-cleared startup benchmark was performed; the prior 1.69-second cold hitch is not declared solved.

## Fresh readiness comparison and CPU work

Complete readiness includes camera travel, terrain/scenery completion and 180 settled frames; it is not CPU generation time alone.

| View | Before ready ms | After ready ms | Before transition peak ms | After transition peak ms |
| --- | ---: | ---: | ---: | ---: |
| production-greece | 8457 | 7330 | 19.1 | 27.5 |
| production-anatolia | 8270 | 6810 | 23.1 | 29.4 |
| production-egypt | 6915 | 5721 | 20.5 | 34.0 |
| production-mesopotamia | 7636 | 7117 | 23.7 | 37.9 |
| production-persia | 7147 | 6169 | 21.2 | 27.5 |
| zagros-200 | 6530 | 5339 | 19.3 | 22.6 |
| zagros-70 | 1545 | 1541 | 14.8 | 8.4 |
| zagros-8 | 5751 | 5211 | 15.4 | 13.8 |
| production-cancellation-recovery | 7506 | 6087 | 17.3 | 18.5 |

The forced 96-candidate cap required at least 63 frame yields for an empty 6,000-attempt cell, in addition to the CPU budget. The 1,024 cap reduces this minimum to six; the 4 ms check every eight candidates still bounds scheduling. The tour now records 378840 candidates, 4263 yields, 17249.8 ms cumulative generation CPU and 161.2 ms upload CPU over completed chunks. These exclude awaited frames and may omit cancelled partial chunks. Actual tour maximum generation chunk 6.1 ms, upload 8.7 ms. CPU budget is a target, not a hard real-time guarantee.

## Thermal confounding and cooled repeat

The main 24-pair set is retained in full, including 27.7�144.5 FPS and loading peaks up to 4,098.8 ms. North African views alone measured 122.3�144.5 FPS. During the later baseline captures, NVIDIA reported 86�87 C and active SW Thermal Slowdown. See `gpu-thermal-during-capture.log`; other desktop applications were not stopped. GPU cooled to 58 C before a separate three-view regional repeat (77 C at end).

| Regional camera | Before FPS | Long-run final FPS | Cooled repeat FPS | Repeat GPU ms | Repeat loading peak ms |
| --- | ---: | ---: | ---: | ---: | ---: |
| italy | 145.0 | 36.5 | 143.8 | 5.0 | 217.4 |
| sicily | 114.9 | 40.1 | 140.3 | 5.4 | 289.3 |
| illyria | 140.6 | 141.6 | 141.7 | 4.1 | 616.3 |

Repeated cameras and composition are identical; source is unchanged. This supports thermal/hardware variability as a substantial contributor, not proof that every rendering cost is unchanged. No cooled close/strategic repeat is substituted into the main table. Sustained performance acceptance remains pending.

The 4.10-second Illyria first frame had only 13.8 ms measured prior terrain-upload CPU; the next frame reported 3,209.8 ms render CPU. This locates a large stall outside scenery generation, in first-render/renderer work. Driver compilation, resource upload and OS scheduling are not separately isolated. Material initialization still takes 1.81�3.70 seconds synchronously; warm navigation now peaks at 37.9 ms versus the fresh baseline 23.7 ms. These are remaining regressions/limitations, not a pass for hitch elimination. Compared with the earlier art pass (79.9�144.3 FPS, generation 6.1 ms, warm peak 24.0 ms, readiness near 9 seconds), readiness improves in these samples, generation remains approximately similar, and sustained thermals/loading remain unresolved.
