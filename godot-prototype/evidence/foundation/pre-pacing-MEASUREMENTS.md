# Foundation performance measurements

Godot 4.7.2 Forward+, RTX 3060 Laptop GPU, original 1080p captures. No test/build or image-sheet processing ran concurrently with timed captures. Existing driver/native/shader caches were retained. Short settled-frame samples are not a controlled sustained hardware benchmark. GPU temperature/utilization/clocks/power at job start/end are recorded in process JSON, not synchronized with every measured frame.

Source `e1650b7897c83c24eb65170f4ad71c6bb41baad0b582b95a1c364f500718d950`.

| Region | Zoom / km | Before FPS | After FPS | Before / after p95 ms | Before / after GPU ms | Towns | Loading peak ms |
| --- | --- | ---: | ---: | --- | --- | ---: | ---: |
| coast | inspection / 4.0 | 119.3 | 73.9 | 14.2 / 22.1 | 3.5 / 5.3 | 1 | 79.0 |
| coast | regional / 35.0 | 121.2 | 67.6 | 12.8 / 22.2 | 2.9 / 3.9 | 1 | 176.0 |
| coast | strategic / 100.0 | 117.6 | 76.7 | 14.3 / 20.2 | 2.8 / 3.7 | 1 | 89.2 |
| delta | inspection / 7.2 | 116.2 | 67.3 | 11.3 / 23.3 | 7.2 / 10.5 | 0 | 70.2 |
| delta | regional / 63.0 | 106.0 | 67.2 | 11.9 / 21.3 | 4.4 / 6.3 | 5 | 82.5 |
| delta | strategic / 180.0 | 129.1 | 77.3 | 10.9 / 19.6 | 3.8 / 4.6 | 11 | 72.7 |
| dense | inspection / 3.6 | 107.7 | 72.9 | 15.2 / 19.5 | 6.6 / 9.3 | 1 | 80.4 |
| dense | regional / 31.5 | 96.2 | 67.5 | 15.1 / 23.3 | 5.7 / 7.8 | 3 | 71.2 |
| dense | strategic / 90.0 | 105.8 | 75.2 | 15.8 / 20.6 | 4.8 / 6.8 | 17 | 70.4 |
| egypt | inspection / 7.2 | 113.5 | 69.0 | 13.3 / 20.6 | 5.5 / 8.0 | 1 | 80.0 |
| egypt | regional / 63.0 | 119.7 | 71.7 | 11.8 / 20.4 | 4.3 / 5.3 | 3 | 71.0 |
| egypt | strategic / 180.0 | 107.4 | 69.8 | 13.5 / 21.3 | 3.9 / 5.4 | 14 | 112.0 |
| illyria | inspection / 3.6 | 120.0 | 82.3 | 13.9 / 20.0 | 2.7 / 3.6 | 0 | 111.6 |
| illyria | regional / 31.5 | 101.5 | 72.2 | 17.8 / 20.4 | 4.4 / 6.0 | 2 | 297.0 |
| illyria | strategic / 90.0 | 90.8 | 65.1 | 18.2 / 23.2 | 6.8 / 9.3 | 6 | 85.3 |
| italy | inspection / 3.6 | 145.0 | 80.3 | 7.1 / 20.3 | 6.4 / 7.5 | 1 | 90.9 |
| italy | regional / 31.5 | 122.1 | 68.9 | 11.9 / 21.9 | 5.1 / 6.8 | 3 | 71.7 |
| italy | strategic / 90.0 | 119.1 | 69.6 | 12.1 / 20.5 | 4.8 / 6.5 | 18 | 71.5 |
| sicily | inspection / 3.6 | 104.1 | 70.0 | 14.2 / 20.6 | 6.9 / 10.2 | 0 | 76.4 |
| sicily | regional / 31.5 | 101.9 | 75.9 | 16.9 / 20.5 | 5.1 / 7.3 | 1 | 75.4 |
| sicily | strategic / 90.0 | 103.1 | 70.2 | 15.3 / 20.5 | 5.3 / 8.1 | 7 | 82.1 |
| sparse | inspection / 4.4 | 145.0 | 70.2 | 7.1 / 22.1 | 10.4 / 10.4 | 1 | 98.1 |
| sparse | regional / 38.5 | 108.9 | 64.4 | 13.6 / 22.2 | 5.3 / 6.7 | 4 | 73.7 |
| sparse | strategic / 110.0 | 84.1 | 64.8 | 17.1 / 23.8 | 6.0 / 7.5 | 8 | 80.6 |

Settled FPS 64.4 - 82.3; startup 3550.0 - 3831.0 ms; measured first-render/streaming peaks 70.2 - 297.0 ms; synchronous material initialization 2181.0 - 2345.7 ms. Peak sampled console+runtime working set 1287.4 - 1342.4 MiB; engine video memory 1060.1 - 1115.2 MiB. All captures retain 13 terrain tiles or fewer. Settlement build chunks peak 3.13 ms; candidate-selection peak 2.02 ms. The 3 ms budget is a target; recorded selection and whole-frame time must also be considered.

Read the full paired table: performance regressions are not converted into a pass. Hardware thermals, source changes and added rendering work are not fully isolated by this table. See the supplemental on/off and production-tour results below.

Baseline sparse inspection initially wrote its image/data then the runtime crashed on exit. The comparison uses the clean same-source retry. The crash log is retained in foundation-before; it is not hidden or attributed to the new implementation.
