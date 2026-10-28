# Final environmental measurements

Source `9e3a29425721c8de8a81f74998d30598f94e46d461ab6c182e6ffc2e50cd1e0c`. Godot 4.7.2 Forward+, RTX 3060 Laptop GPU, 1920 x 1080. Existing shader/driver/native caches retained. Single short desktop samples, often limited near 144 FPS; not a controlled throughput benchmark. No other validation workload ran alongside the final3 captures or repaired tour.

51 completed final captures: settled FPS 13.5–145.0, mean GPU 3.4–64.0 ms. All captures have complete scenery. Terrain tiles 13–13 (limit 13). Sampled process memory 1235.2–1322.4 MiB; renderer video memory 1046.0–1100.1 MiB. Process measurement includes console wrapper and direct Godot child sampled every 250 ms; it is not a VRAM allocator peak measurement.

Startup 2741.0–3403.0 ms; measured startup/streaming frame maxima 51.8–252.7 ms. Synchronous material boot 1731.3–2139.9 ms is separate from the frame samples and remains a blocking startup cost. Max scenery candidate chunk 12.8 ms, upload chunk 26.6 ms. Warm navigation maximum 22.0 ms. Cold shader-cache behavior was not measured. The earlier 1.69-second hitch is not declared fixed.

## Matched settled FPS, before → final

| Region | Strategic | Regional | Inspection |
| --- | --- | --- | --- |
| africa | 132.1 → 140.3 | 119.9 → 101.2 | 139.1 → 134.2 |
| alps | 89.8 → 74.4 | 109.9 → 51.0 | 126.0 → 48.6 |
| anatolia | 136.9 → 26.2 | 140.0 → 145.0 | 127.5 → 108.9 |
| balkans | 144.8 → 78.7 | 135.7 → 61.4 | 107.4 → 13.5 |
| east | 115.3 → 143.9 | 144.2 → 143.9 | 119.7 → 131.6 |
| egypt | 125.0 → 143.9 | 144.4 → 144.0 | 141.8 → 134.4 |
| gaul | 144.7 → 142.3 | 139.9 → 115.2 | 122.1 → 95.9 |
| greece | 141.9 → 86.4 | 110.5 → 65.3 | 103.9 → 51.1 |
| iberia | 144.5 → 144.4 | 143.7 → 144.5 | 140.6 → 124.8 |
| italy | 134.0 → 124.3 | 119.3 → 143.9 | 143.6 → 86.1 |
| levant | 144.5 → 143.9 | 134.0 → 144.0 | 131.9 → 123.9 |
| mesopotamia | 144.0 → 143.9 | 144.4 → 143.9 | 116.4 → 117.8 |
| persia | 116.2 → 143.9 | 136.0 → 144.0 | 143.0 → 135.7 |
| pyrenees | 145.2 → 144.6 | 143.1 → 141.3 | 122.8 → 113.6 |
| sicily | 144.3 → 144.0 | 124.2 → 144.4 | 115.1 → 138.9 |
| zagros | 143.2 → 143.5 | 144.3 → 143.9 | 139.5 → 123.4 |

## Samples with more than 10% lower FPS

These are retained as observed regressions. Different desktop pacing and the added material/instance work both affect comparisons; a single pair does not isolate a root cause. GPU columns distinguish GPU cost from total frame pacing.

| Region | Zoom | Before FPS | Final FPS | Before GPU ms | Final GPU ms |
| --- | --- | --- | --- | --- | --- |
| africa | regional | 119.9 | 101.2 | 6.5 | 6.5 |
| alps | inspection | 126.0 | 48.6 | 6.6 | 18.2 |
| alps | regional | 109.9 | 51.0 | 5.8 | 17.2 |
| alps | strategic | 89.8 | 74.4 | 6.0 | 10.9 |
| anatolia | inspection | 127.5 | 108.9 | 6.5 | 8.2 |
| anatolia | strategic | 136.9 | 26.2 | 3.8 | 27.4 |
| balkans | inspection | 107.4 | 13.5 | 8.1 | 64.0 |
| balkans | regional | 135.7 | 61.4 | 6.3 | 13.9 |
| balkans | strategic | 144.8 | 78.7 | 4.2 | 7.6 |
| gaul | inspection | 122.1 | 95.9 | 6.4 | 8.0 |
| gaul | regional | 139.9 | 115.2 | 4.0 | 4.2 |
| greece | inspection | 103.9 | 51.1 | 8.6 | 17.0 |
| greece | regional | 110.5 | 65.3 | 5.9 | 12.9 |
| greece | strategic | 141.9 | 86.4 | 3.7 | 7.1 |
| iberia | inspection | 140.6 | 124.8 | 5.5 | 7.1 |
| italy | inspection | 143.6 | 86.1 | 4.0 | 3.6 |
| zagros | inspection | 139.5 | 123.4 | 6.2 | 7.0 |

## Continuous production navigation and Zagros approach

| Stage | Actual km | Settled FPS | GPU ms | Max transition frame ms | Ready in ms | Plants / rocks |
| --- | --- | --- | --- | --- | --- | --- |
| production-greece | 95.0 | 126.0 | 3.4 | 22.0 | 6619 | 9155 / 4085 |
| production-anatolia | 150.0 | 143.4 | 3.9 | 20.1 | 5742 | 8609 / 7591 |
| production-egypt | 180.0 | 141.9 | 3.3 | 21.2 | 6424 | 3230 / 12665 |
| production-mesopotamia | 200.0 | 118.5 | 3.4 | 20.3 | 6890 | 5245 / 10921 |
| production-persia | 200.0 | 143.3 | 3.8 | 18.3 | 6693 | 1422 / 14778 |
| zagros-200 | 200.0 | 144.2 | 3.9 | 17.1 | 5866 | 3140 / 13060 |
| zagros-70 | 70.0 | 97.4 | 3.8 | 14.4 | 1577 | 3140 / 13060 |
| zagros-8 | 8.0 | 140.6 | 6.2 | 16.2 | 5734 | 6524 / 25876 |
| production-cancellation-recovery | 200.0 | 144.2 | 3.9 | 17.9 | 6824 | 1422 / 14778 |

Production stages use `jump()` and the unchanged production resolver. Zagros distances are explicitly diagnostic framing. All stages require complete generation, bounded residency and camera convergence; maximum relative zoom step is at most 0.08. The cancellation recovery stage follows two interrupted region changes. Repaired tour logs and source revision accompany the results.

## Unchanged-source performance repeat

Ten new captures repeat the outlying regions at exactly matching cameras. Source revision, scenery composition and draw calls are asserted equal to final3. These supplement the original batch; they do not replace its slow samples.

| View | Initial FPS | Repeat FPS | Initial GPU ms | Repeat GPU ms | Draw calls |
| --- | --- | --- | --- | --- | --- |
| profile-alps-inspection | 48.6 | 111.9 | 18.2 | 8.1 | 607 |
| profile-alps-strategic | 74.4 | 123.2 | 10.9 | 6.5 | 162 |
| profile-anatolia-inspection | 108.9 | 129.7 | 8.2 | 6.7 | 651 |
| profile-anatolia-strategic | 26.2 | 144.1 | 27.4 | 3.8 | 119 |
| profile-balkans-inspection | 13.5 | 119.8 | 64.0 | 7.4 | 630 |
| profile-balkans-strategic | 78.7 | 144.6 | 7.6 | 4.0 | 122 |
| profile-greece-inspection | 51.1 | 113.7 | 17.0 | 7.8 | 509 |
| profile-greece-strategic | 86.4 | 144.0 | 7.1 | 3.5 | 123 |
| profile-zagros-inspection | 123.4 | 140.8 | 7.0 | 6.2 | 485 |
| profile-zagros-strategic | 143.5 | 143.9 | 4.5 | 4.1 | 50 |

Repeat range 111.9–144.6 FPS. The Balkans 13.5 FPS / 64.0 ms GPU sample recovered to 119.8 FPS / 7.4 ms without code, camera, count or draw-call changes. This establishes that the severe slowdown is not consistently reproduced by this scene; it does not prove a cause or erase the regression.

`gpu-repeat-live.csv` contains NVIDIA telemetry from the latter part of the repeat (Greece and Zagros), showing power-cap activity under load, temperatures up to 86 C and changing clocks. Software thermal slowdown was not active in that sampled interval. The separate post-capture query has cumulative thermal-throttling counters, which cannot attribute a particular earlier frame. No GPU power/clock/driver settings were changed. Original final3 outliers have no contemporaneous hardware telemetry, so their root cause remains unresolved. The first background telemetry attempt in `gpu-repeat.csv` failed argument parsing and is not measurement evidence.
