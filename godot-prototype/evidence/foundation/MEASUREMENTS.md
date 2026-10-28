# Foundation performance measurements

Godot 4.7.2 Forward+, RTX 3060 Laptop GPU, original 1080p captures. No test/build or image-sheet processing ran concurrently with timed captures. Existing driver/native/shader caches were retained. Short settled-frame samples are not a controlled sustained hardware benchmark. GPU temperature/utilization/clocks/power at job start/end are recorded in process JSON, not synchronized with every measured frame.

Source `80f1c276958ea64cc8f61279b71bfbe7c6f4d9b9888845e25ad2afa0efa94207`.

| Region | Zoom / km | Before FPS | After FPS | Before / after p95 ms | Before / after GPU ms | Towns | Loading peak ms |
| --- | --- | ---: | ---: | --- | --- | ---: | ---: |
| coast | inspection / 4.0 | 119.3 | 120.2 | 14.2 / 8.4 | 3.5 / 3.0 | 1 | 144.3 |
| coast | regional / 35.0 | 121.2 | 120.2 | 12.8 / 8.4 | 2.9 / 2.2 | 1 | 122.7 |
| coast | strategic / 100.0 | 117.6 | 120.1 | 14.3 / 8.4 | 2.8 / 2.1 | 1 | 145.4 |
| delta | inspection / 7.2 | 116.2 | 114.0 | 11.3 / 10.1 | 7.2 / 7.7 | 0 | 95.5 |
| delta | regional / 63.0 | 106.0 | 120.3 | 11.9 / 8.4 | 4.4 / 3.0 | 5 | 143.3 |
| delta | strategic / 180.0 | 129.1 | 120.3 | 10.9 / 8.5 | 3.8 / 2.9 | 11 | 83.3 |
| dense | inspection / 3.6 | 107.7 | 114.2 | 15.2 / 11.0 | 6.6 / 7.6 | 1 | 137.4 |
| dense | regional / 31.5 | 96.2 | 120.3 | 15.1 / 8.4 | 5.7 / 5.9 | 3 | 129.8 |
| dense | strategic / 90.0 | 105.8 | 120.3 | 15.8 / 8.4 | 4.8 / 4.0 | 17 | 124.8 |
| egypt | inspection / 7.2 | 113.5 | 120.3 | 13.3 / 8.4 | 5.5 / 4.8 | 1 | 135.9 |
| egypt | regional / 63.0 | 119.7 | 120.4 | 11.8 / 8.4 | 4.3 / 3.7 | 3 | 189.2 |
| egypt | strategic / 180.0 | 107.4 | 120.4 | 13.5 / 8.4 | 3.9 / 3.5 | 14 | 117.6 |
| illyria | inspection / 3.6 | 120.0 | 120.4 | 13.9 / 8.4 | 2.7 / 1.8 | 0 | 131.3 |
| illyria | regional / 31.5 | 101.5 | 120.4 | 17.8 / 8.4 | 4.4 / 4.2 | 2 | 375.2 |
| illyria | strategic / 90.0 | 90.8 | 105.7 | 18.2 / 12.0 | 6.8 / 8.4 | 6 | 120.4 |
| italy | inspection / 3.6 | 145.0 | 120.0 | 7.1 / 8.4 | 6.4 / 4.1 | 1 | 138.0 |
| italy | regional / 31.5 | 122.1 | 120.0 | 11.9 / 8.4 | 5.1 / 4.4 | 3 | 143.8 |
| italy | strategic / 90.0 | 119.1 | 120.0 | 12.1 / 8.4 | 4.8 / 4.0 | 18 | 141.8 |
| sicily | inspection / 3.6 | 104.1 | 100.2 | 14.2 / 12.5 | 6.9 / 8.8 | 0 | 165.8 |
| sicily | regional / 31.5 | 101.9 | 120.0 | 16.9 / 8.4 | 5.1 / 4.9 | 1 | 293.2 |
| sicily | strategic / 90.0 | 103.1 | 120.0 | 15.3 / 8.4 | 5.3 / 5.5 | 7 | 148.8 |
| sparse | inspection / 4.4 | 145.0 | 99.9 | 7.1 / 12.7 | 10.4 / 8.9 | 1 | 142.5 |
| sparse | regional / 38.5 | 108.9 | 120.0 | 13.6 / 8.4 | 5.3 / 4.6 | 4 | 130.2 |
| sparse | strategic / 110.0 | 84.1 | 120.0 | 17.1 / 8.4 | 6.0 / 5.4 | 8 | 128.7 |

Settled FPS 99.9 - 120.4; startup 3102.0 - 3735.0 ms; measured first-render/streaming peaks 83.3 - 375.2 ms; synchronous material initialization 1900.1 - 2323.2 ms. Peak sampled console+runtime working set 1283.7 - 1363.6 MiB; engine video memory 1059.9 - 1114.9 MiB. All captures retain 13 terrain tiles or fewer. Settlement build chunks peak 3.10 ms; candidate-selection peak 2.31 ms. The 3 ms budget is a target; recorded selection and whole-frame time must also be considered.

Read the full paired table: performance regressions are not converted into a pass. Hardware thermals, source changes and added rendering work are not fully isolated by this table. See the supplemental on/off and production-tour results below.

Baseline sparse inspection initially wrote its image/data then the runtime crashed on exit. The comparison uses the clean same-source retry. The crash log is retained in foundation-before; it is not hidden or attributed to the new implementation.

## Final production navigation and readiness

Mailbox VSync, configured 120 FPS cap. Readiness includes camera approach, complete terrain/scenery/settlement generation and 180 settled frames. It is not pure CPU-generation time.

| Stage | Settled FPS | p95 ms | GPU ms | Max transition ms | Complete ready ms | Prior FIFO ready ms |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| production-greece | 116.2 | 9.1 | 7.7 | 33.9 | 8280 | 13301 |
| production-anatolia | 120.3 | 8.4 | 4.8 | 20.3 | 8438 | 12701 |
| production-egypt | 120.3 | 8.4 | 4.0 | 23.6 | 6975 | 11186 |
| production-mesopotamia | 120.0 | 8.4 | 3.8 | 31.8 | 8299 | 13763 |
| production-persia | 120.0 | 8.4 | 4.3 | 24.0 | 7450 | 11980 |
| zagros-200 | 120.0 | 8.4 | 4.2 | 27.2 | 7400 | 11357 |
| zagros-70 | 120.2 | 8.4 | 4.4 | 10.8 | 1749 | 2991 |
| zagros-8 | 103.1 | 11.0 | 8.8 | 13.4 | 6058 | 9964 |
| production-cancellation-recovery | 120.0 | 8.4 | 4.3 | 18.9 | 7508 | 12519 |

All nine stages passed terrain residency <=13, scenery group limits, complete readiness and relative zoom step <=0.08, including interrupted generation and Zagros 200/70/8 km. Five named region jumps use the production resolver; the Zagros approach is an explicit diagnostic camera. Settlement work for each stage is included in the corresponding godot-production-*.json, not inferred from raw record count.

## Settlement rendering on/off controls � final source

Both runs use the final source, exact matched cameras, identical terrain/water/scenery and the production presentation settings. The off switch disables settlement geometry and its labels; registry loading and scenery clearances remain enabled. These are single desktop samples, not randomized repeated trials. The frame cap limits what FPS can establish about spare throughput; GPU time and draw counts are also listed.

| Camera | Towns on | On / off FPS | On / off GPU ms | On / off draw calls |
| --- | ---: | --- | --- | --- |
| delta strategic | 11 | 120.3 / 120.3 | 2.85 / 3.18 | 76 / 49 |
| delta inspection | 0 | 114.0 / 95.9 | 7.72 / 9.36 | 213 / 213 |
| dense strategic | 17 | 120.3 / 120.3 | 4.02 / 4.42 | 167 / 131 |
| dense inspection | 1 | 114.2 / 118.7 | 7.60 / 7.06 | 334 / 330 |
| sparse strategic | 8 | 120.0 / 120.0 | 5.40 / 4.73 | 148 / 126 |
| sparse inspection | 1 | 99.9 / 106.9 | 8.87 / 8.42 | 490 / 486 |

Proxy shadows are disabled at strategic distances; close buildings retain local shadows. Build and candidate-filter work remain explicitly budgeted and reported in every main capture. Deferred-free objects can remain allocated until the next frame, so residency figures describe active batches rather than an assertion of zero transient allocation.

## Presentation-mode root-cause experiment

Archived source `e1650b7897c83c24eb65170f4ad71c6bb41baad0b582b95a1c364f500718d950`, identical Delta strategic content/camera:

| Configuration | FPS | p95 ms | GPU ms |
| --- | ---: | ---: | ---: |
| Existing FIFO/default VSync | 77.3 | 19.59 | 4.64 |
| VSync disabled, uncapped diagnostic | 257.1 | 4.17 | 3.13 |
| Mailbox plus 120 FPS target diagnostic | 120.3 | 8.39 | 2.57 |

The screen was measured at 143.912 Hz. The earlier full 24-view FIFO set measured 64.4�82.3 FPS; it remains in pre-pacing-comparison.json and the foundation-final2 raw folder. A separate photo-sampling-disabled Delta close diagnostic measured 75.3 FPS / 10.54 ms GPU versus 67.3 FPS / 10.52 ms GPU with it enabled in that older run, so that test did not identify photo sampling as the dominant GPU cost. Settlement-off also did not recover the entire FIFO slowdown. The mode/cap intervention substantially changes observed pacing; exact driver scheduling, GPU clock behavior and every hardware factor are not separately isolated.

Godot documents mailbox as presenting the newest queued frame on vertical blanking without tearing: https://docs.godotengine.org/en/stable/classes/class_displayserver.html#enum-displayserver-vsyncmode . Final production measurements use mailbox with a 120 FPS target, not the uncapped diagnostic. Peaks below an earlier 144 FPS sample are intentional under this target. Other render backends/drivers may fall back; only the present Windows/Vulkan hardware was validated.

Readiness diagnosis: before the pacing correction Greece needed 13301 ms with 623 scenery yield frames and 2613.2 ms cumulative scenery CPU. The final sample needs 8280 ms, 599 yield frames and 2497.5 ms CPU. Elapsed readiness is therefore strongly coupled to frame cadence; it was not simply a doubled synchronous scenery workload. The prior North Africa tour was 7330 ms for Greece, which remains a separate earlier hardware sample.

## Limits and remaining stalls

The main table retains all regressions. A material/texture stage remains synchronous, taking roughly the range shown above; no native/shader/driver cache was cleared. These short warm-cache captures do not establish that the previously observed 4.10-second cold first-render stall is solved. First-render/streaming peaks and warm-navigation maxima are separate measurements. A complete cold-to-ready timer was not added; startup deserialization and timed production-tour readiness are reported separately.

Process memory is a sampled lower bound on the actual peak. The legacy sidecar intervalMs=250 field denotes a nominal wait; the wrapper also sleeps 250 ms and performs a process-tree query, so actual sample spacing is at least about 500 ms plus query overhead. Engine video memory is an allocation counter, not total system VRAM. GPU telemetry at job endpoints cannot prove absence of thermal throttling between samples. CPU scheduling budgets are targets rather than hard real-time guarantees.
