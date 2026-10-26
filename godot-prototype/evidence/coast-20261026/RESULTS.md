# Final coast polish results

Final runtime source fingerprint: `3150bd84bf2b3d9b687668c09d836e2399dda897d2e78c0821ffd0685697bd41` (2,604 inputs). This fingerprints the uncommitted runtime, not a new Git commit. Screenshots were captured 2026-10-26 21:58:25–22:00:20 UTC. Baseline source fingerprint and timestamps are preserved separately. The gallery checks exact matching camera dictionaries, source fingerprints, completed scenery and 35 sites for every pair.

| Validation command | Final result |
| --- | --- |
| `npm.cmd run validate` | Exit 0: TypeScript, repository-wide ESLint, 34 test files / 475 tests, build and build smoke passed. Full output: `npm-validate.log`. |
| `node godot-prototype/tools/check-integrity.mjs` | 460 protected files byte-identical; 35 canonical site identities/coordinates exact; 687 research records and research copy byte-identical. Output: `integrity.log`. |
| Godot `--headless --path godot-prototype --script res://tools/parse-scripts.gd` | Exit 0, 13 GDScript modules parsed (`parse.log`). Shaders also compiled in actual Vulkan screenshot/water runs. |
| Godot `--headless --path godot-prototype --script res://tools/navigation-test.gd` | Exit 0, seven original production distances; two collision cases rejected; capture names isolated (`navigation.log`). |
| Godot `--headless --path godot-prototype --script res://tools/global-validate.gd -- --output=res://evidence/coast-20261026/final-validation --source-manifest=res://evidence/coast-20261026/final-source.json` | 17 production views passed; exact distances, complete scenery, positive vegetation where expected, 35 selections. `final-validation/global-navigation.json`. |
| Same command with `regional-validate.gd` | Nine production views passed. `final-validation/regional-navigation.json`. |
| Godot `--path godot-prototype --resolution 1920x1080 --script res://tools/visual-validate.gd -- --output=res://evidence/coast-20261026/final-water --source-manifest=res://evidence/coast-20261026/final-source.json` | Exit 0: static GPU patches identical, animated patches differ, camera/terrain unchanged. `final-water/water.json` and three diagnostic PNGs. |
| Capture command in `COAST-POLISH.md`, stage `coast-final` | All 13 final processes exited successfully with empty error logs and ready scenery. |
| `node godot-prototype/evidence/coast-20261026/compare.mjs` | 13 exact camera/source/scenery/site assertions passed; generated gallery and per-view measurements. |

Godot executable used: `C:\Users\brand\tools\godot\4.7.2-stable\Godot_v4.7.2-stable_win64_console.exe`. Renderer: Vulkan Forward+, NVIDIA GeForce RTX 3060 Laptop GPU, 1920×1080. Global and regional validators exercised production navigation, not capture profiles.

## Measured performance

| View | Before → final FPS | Before → final mean settled GPU ms | Resident terrain tiles |
| --- | --- | --- | --- |
| Production Catana, 1.8 km | 140.4 → 139.4 | 4.45 → 4.55 | 13 |
| Sicily close, 14.4 km | 138.2 → 130.7 | 5.81 → 6.30 | 13 |
| Sicily strategic, 90 km | 144.0 → 143.0 | 4.53 → 5.11 | 13 |
| Italy overview, 288 km | 142.9 → 140.2 | 5.49 → 6.14 | 13 |
| Greece close, 14.4 km | 143.8 → 143.9 | 3.05 → 3.11 | 13 |
| Aegean strategic, 160 km | 144.0 → 144.0 | 2.58 → 2.52 | 13 |

All 13 matched measurements are in `comparison.json`; frames are substantially display-paced near 144 FPS. These are single paired runs, not a statistical benchmark or an uncapped throughput claim. Headless production validators ran during parts of the final capture sequence, so CPU contention can influence wall-clock FPS and loading maxima. Settled GPU means changed by −0.07 to +0.64 ms. There is measurable overhead, not a claim of identical performance. Shared inverse projection per terrain fragment and sea underlap are plausible contributors; attribution is an inference, not a GPU event profile. No streaming limits or source meshes changed.

The final production Catana startup/streaming maximum was 1,199.96 ms. Other final capture maxima were 50.25–186.17 ms. These loading frames remain visible limitations; they are not counted as steady FPS or disguised as smooth navigation. Existing boot-stage/material timings and slow-frame records remain in each capture JSON. A cold shader/material setup contribution is plausible but this pass does not establish a fresh causal loading profile.

## Actual visual review and remaining defects

Inspected actual before/intermediate/final engine images around Sicily, Naples, Saronic Gulf and Cyclades, including close terrain edges and strategic/overview views. The pale Greek background fringe disappears; continuing water under elevated Italy coast edges removes the intermediate white gap. Darker sea, narrower color transition and weaker, finer wave patterns are visible. Existing material/relief and settlement anchors remain intact.

Coastal elevation still produces a dark vertical-looking edge in parts of the Naples close view; water underlap hides the background, not the underlying coarse cliff geometry. The coast mask remains visibly scalloped or angular at close zoom. Coarse global islands and distant material transitions remain. Water animation is subtle and can look nearly static in still images or at distant scales; the GPU animation check confirms actual motion. No detailed surf, transparent shallows, true depth, reflection probes or coastline remeshing were added. This is an incremental polish pass, not commercial-quality acceptance.

Recommended next visual milestone: review this evidence independently, then consider a separately scoped coast-edge geometry/detail improvement using existing approved geographic inputs. No new living-world or terrain-streaming architecture was implemented.
