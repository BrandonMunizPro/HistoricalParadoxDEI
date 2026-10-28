# Matched art-direction performance

Godot 4.7.2 Forward+, RTX 3060 Laptop GPU, 1920 x 1080. Unchanged driver/shader/native caches. Short desktop samples of at least 180 consecutive settled frames, not a controlled hardware benchmark. No concurrent validation/build ran during the review captures or navigation tour.

Source `da362c955d859fd0feb663accab739ebb96fed40b057a1051b6927810d423ac9`. Full JSON includes timestamps, GPU time, counts, CPU generation/upload work and process memory.

| Region | Zoom / km | Before FPS | After FPS | Before GPU ms | After GPU ms | Before / after draw calls |
| --- | --- | --- | --- | --- | --- | --- |
| alps | inspection / 4.0 | 93.9 | 92.1 | 9.4 | 9.5 | 607 / 511 |
| alps | regional / 35.0 | 98.3 | 116.2 | 9.1 | 5.7 | 858 / 119 |
| alps | strategic / 100.0 | 108.2 | 79.9 | 7.3 | 7.4 | 162 / 152 |
| anatolia | inspection / 6.0 | 108.6 | 109.2 | 7.8 | 8.2 | 651 / 609 |
| anatolia | regional / 52.5 | 137.9 | 143.5 | 5.9 | 5.7 | 621 / 151 |
| anatolia | strategic / 150.0 | 142.6 | 101.0 | 4.2 | 4.6 | 119 / 123 |
| egypt | inspection / 7.2 | 127.2 | 130.6 | 5.8 | 6.0 | 698 / 600 |
| egypt | regional / 63.0 | 103.8 | 144.3 | 3.7 | 4.5 | 146 / 160 |
| egypt | strategic / 180.0 | 107.7 | 144.3 | 3.5 | 3.7 | 47 / 47 |
| greece | inspection / 3.8 | 102.3 | 102.5 | 8.1 | 8.6 | 509 / 470 |
| greece | regional / 33.3 | 106.0 | 141.2 | 6.1 | 4.7 | 509 / 119 |
| greece | strategic / 95.0 | 143.6 | 102.9 | 3.9 | 6.1 | 123 / 145 |
| italy | inspection / 3.6 | 131.1 | 143.3 | 4.4 | 4.6 | 380 / 343 |
| italy | regional / 31.5 | 120.2 | 144.2 | 5.2 | 4.2 | 532 / 524 |
| italy | strategic / 90.0 | 123.1 | 121.2 | 4.2 | 4.1 | 126 / 106 |

Settled FPS 79.9–144.3; mean GPU 3.7–9.5 ms. Startup 2749–3128 ms; measured startup/streaming maximum frames 74.0–116.5 ms. Material initialization 1705.2–1934.8 ms remains a synchronous boot cost. Generation chunk maximum 6.1 ms, upload chunk maximum 4.7 ms.

Sampled console-wrapper + direct-child process memory 1268.4–1314.3 MiB (250 ms polling); reported renderer video memory 1048.6–1103.0 MiB. All captures stayed at 13 terrain tiles, at most 12 coarse groups and nine close cells, 1,800 instance records per cell. Coarse stands contain 24 small tree forms and are not botanical density measurements.

## Actual production navigation and zoom approach

| Stage | Settled FPS | GPU ms | Max transition frame ms | Complete readiness ms |
| --- | --- | --- | --- | --- |
| production-greece | 129.2 | 6.6 | 19.3 | 8962 |
| production-anatolia | 139.0 | 5.3 | 23.7 | 8120 |
| production-egypt | 143.4 | 3.6 | 22.3 | 6986 |
| production-mesopotamia | 142.5 | 4.2 | 24.0 | 8054 |
| production-persia | 138.0 | 4.2 | 22.7 | 6972 |
| zagros-200 | 103.0 | 3.9 | 19.0 | 6657 |
| zagros-70 | 103.0 | 4.3 | 14.8 | 1559 |
| zagros-8 | 113.6 | 7.4 | 16.1 | 5910 |
| production-cancellation-recovery | 129.7 | 4.4 | 16.9 | 7393 |

All nine stages passed complete readiness, bounded terrain/scenery residency and relative zoom step <=0.08. Production stages use the real resolver; Zagros distances are explicitly diagnostics. River-bank checks and interrupted-generation recovery passed. Final tour maximum transition frame 24.0 ms versus 39.2 ms in the pre-budget review tour. The same review capture suite had generation chunks up to 19.0 ms; final chunks max 6.1 ms. These are separate measured samples, not a controlled statistical benchmark. Complete readiness can take longer because smaller CPU slices span more frames (Greece 7.0 -> 9.0 seconds).

## Remaining regressions and caveats

The added canopy geometry and shading have real GPU cost. Read the entire paired table: some views improve while others regress. In particular, Greek strategic GPU time rises from about 3.9 ms to the final value listed above. Lower total FPS with similar/lower GPU time also occurs, so frame pacing and laptop hardware variability are not isolated. No generic performance-pass threshold is inferred from these measurements. No cache-cleared startup benchmark was performed; the prior 1.69-second cold hitch is not declared solved.
