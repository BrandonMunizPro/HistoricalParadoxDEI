# VS6 terrain presentation and performance

Continues checkpoint `a00ac25`; preserves Three.js, TypeScript simulation authority, camera controls, 23 active sites, 700-settlement benchmark, 12 active terrain tiles, three in-flight requests and four inactive cached tiles. No commits/pushes or edits to research/OPEN decisions.

## Changes

Fine terrain windows now reveal from their actual regional parent mesh, including its normal field. Previously the edge apron matched the parent but the reveal animation used the global context surface throughout the interior. The new transition therefore starts from the surface being replaced instead of briefly flattening toward a different-resolution global mesh. This remains cooperative work under the existing frame budget. The presentation verifier compares the applied center reveal attribute to the parent height within 0.01 m in Greece and Egypt; raw global/parent heights are recorded for inspection. Other family/LOD discontinuities are not declared solved.

Terrain materials share the same sourced ecological color field and now expose some rock based on the source mesh's actual slope as well as elevation. This is material art direction, not invented erosion, altered elevations or reconstructed 278 BCE land cover. Coast masks use multisample alpha-to-coverage instead of a hard binary fragment edge. It improves pixel coverage; it cannot fix generalized coast vectors or missing shoreline detail.

Existing symbolic grove instances fade between local/regional distances and disappear before becoming scattered strategic black dots. Canopy colors were lightened. No new forest distribution was invented outside the existing decorative Italy placement. That placement remains explicitly provisional, and richer sourced regional vegetation is unfinished.

The floating campaign-envelope line is now diagnostic-only. At low viewing angles, a neutral fog-color transition near the dataset edge reduces its hard appearance; overhead views preserve the full visible envelope. This hides a data boundary aesthetically, not by inventing land or treating missing geography as verified sea. Camera bounds and geographic coordinates are unchanged.

An offscreen 32-square shadow/depth warmup runs during loading before interactive readiness. It shifts first-use work into startup and does not guarantee that every later shader variant avoids a driver stall. Existing asynchronous compilation and bounded tile caches remain intact.

## Validation and evidence

Use `npm run validate`, `npm run map:build`, then `npm run map:preview -- --port 4173`. `npm run map:verify:vs6` captures and checks the new presentation. `npm run map:profile:streaming -- docs/vs6/evidence/replay` runs the repeatable zoom/loading path. The profiler now fails on shader errors and missing resources, rather than accepting FPS from a failed material.

The new presentation verifier checks parent-surface reveal attributes, low-angle haze activation, diagnostic-only coverage lines, strategic canopy suppression, unchanged 23-site count, bounded residency/cache, no accidental unapproved pilot publication and no shader/runtime errors. Additional pipeline tests are described in the [promotion report](settlement-promotion.md).

Screenshots: [world](evidence/presentation/world.png), [Greece](evidence/presentation/greeceDetail.png), [Egypt](evidence/presentation/egyptDetail.png), [Rome](evidence/presentation/rome.png), [Greece low angle](evidence/presentation/greece-low-angle.png). Comparable VS5 references remain in [the previous evidence directory](../vs5/streaming-evidence/); the same scripted input replay has fresh [before](evidence/before/profile.json) and [after](evidence/after/profile.json) measurements and endpoint screenshots.

## Scope and remaining limitations

No new DEM, coastline, river or ecological dataset was imported. Modern Copernicus DSM, GSHHG and ecological evidence retain their existing ancient-shoreline, modern-engineering and land-cover uncertainties. Coarse regional rounded relief and uniform plains remain outside the existing fine windows; no fantasy terrain was added to disguise source resolution. Close coastlines still reveal rasterization/generalization. Broader vegetation identity and material richness remain below premium campaign-game quality.

Changing terrain families can still expose source-resolution differences. The frame budget is cooperative and may overrun on an indivisible allocation or driver call. JS heap excludes GPU/process memory. Shader caches were not cleared at the OS/driver level, so first-use timing is not a rigorously controlled cold-cache hardware benchmark. The next section records the actual final measurements, including regressions and remaining stalls.

## Final fixed-input replay

Windows, i7-11800H, 16 GB RAM, RTX 3060 Laptop GPU, headless Chrome 155.0.8059.40, 1440 x 1000, local production build. Identical distance targets, timing and key/wheel inputs; stage timing and CPU sampling enabled. Percentiles include loading. Timed movement can end at different coordinates if an earlier frame was blocked. Final initial readiness: 4.57 seconds, including startup shader/depth preparation. OS/driver shader cache state was not reset.

| Region | Before p50 / p95 / p99 / worst ms | After p50 / p95 / p99 / worst ms | Before / after long tasks |
| --- | --- | --- | --- |
| greece | 6.9 / 7.1 / 7.3 / 48.7 | 6.9 / 7.1 / 7.2 / 20.8 | 0 / 0 |
| egypt | 6.9 / 7.1 / 7.2 / 27.8 | 6.9 / 7.1 / 7.2 / 20.9 | 0 / 0 |
| italy | 6.9 / 7.1 / 7.4 / 229.3 | 6.9 / 7.1 / 7.3 / 35.0 | 2 / 0 |

| Moving endpoint | Draws | JS heap MB | Active / cached / pending | Max preparation slice ms |
| --- | ---: | ---: | --- | ---: |
| greece | 9 | 261 | 12 / 3 / 0 | 15.0 |
| egypt | 8 | 253 | 10 / 4 / 2 | 7.3 |
| italy | 58 | 263 | 12 / 4 / 0 | 14.3 |

These are moving endpoint samples, not peak memory or guaranteed settled views. The 3 ms preparation target is cooperative; indivisible allocation/GC/driver work can exceed it. Shader-status stalls remain possible despite the supported shadow-type correction and startup warmup. Other optimized development replays observed Italy worst frames between about 174 and 283 ms. This final sample does not establish universal hitch elimination or a hardware frame-time guarantee. Final capture had no shader/runtime/resource errors. GPU memory and execution timing were not measured. Extra parent-surface sampling can lengthen detail readiness while preserving camera frames.

[Before CPU profile](evidence/before/cpu-profile.json), [after CPU profile](evidence/after/cpu-profile.json), [comparison JSON](evidence/comparison.json), [presentation assertions](evidence/presentation/validation.json). Development captures with shader errors were rejected and replaced.

## Reveal-target continuity diagnostic

The browser reads the actual GPU input attribute after preparation and compares it with the regional parent triangle. Display elevation already has the existing 3x vertical scaling; these values are presentation differences, not claims of corrected elevation-data accuracy. Mesh centers may be water-masked, especially in Greece, so this diagnostic is not a pixel-based whole-view popping score.

| Window | Previous global-target discrepancy from parent (display metres) | Applied target discrepancy (display metres) |
| --- | ---: | ---: |
| window-greece-argolid-coast | 1119.49 | 0.000000 |
| window-egypt-nile-escarpment | 121.22 | 0.000026 |
| local-roma | 20.46 | 0.000001 |

Settled visual comparisons use the same geographic presets from the supplied VS5 evidence. They show the final material/coast presentation, while the attribute diagnostic establishes the specific reveal-path correction. Broader family-transition popping remains unquantified and unfinished.

| View | VS5 reference | VS6 capture |
| --- | --- | --- |
| Greece | [before](../vs5/streaming-evidence/greece-detail.png) | [after](evidence/presentation/greeceDetail.png) |
| Egypt | [before](../vs5/streaming-evidence/egypt-detail.png) | [after](evidence/presentation/egyptDetail.png) |
| Rome | [before](../vs5/streaming-evidence/rome.png) | [after](evidence/presentation/rome.png) |
| World | [before](../vs5/streaming-evidence/world.png) | [after](evidence/presentation/world.png) |

The installed Three.js 0.186.1 `WebGLShadowMap` explicitly replaces the removed PCFSoftShadowMap with PCFShadowMap on first shadow rendering; `WebGLPrograms` keys programs on renderer.shadowMap.type. Initialization now uses PCFShadowMap directly, avoiding a precompile/runtime shadow-type mismatch. This is a supported-type correction, not a promise that all shader variants are warmed.

## Completed regression validation

**443 tests in 29 files passed**, plus typecheck, lint, simulation build/smoke, production map build, the VS6 presentation browser check, existing camera controls, streaming movement assertions, full-world and 700/1,000-marker benchmark, ecology/detail/zoom checks, Italy and legacy browser verifiers. Political mode, settlement/region raycasts, control transfers, collision-free labels and external development snapshots passed. All 23 existing sites remain unchanged. The existing large-bundle warning remains.

| Settled view | Mean FPS | Draw calls | JS heap MB |
| --- | ---: | ---: | ---: |
| World | 143.9 | 182 | 216 |
| Synthetic 700 | 143.6 | 183 | 254 |
| Synthetic 1,000 | 143.9 | 183 | 263 |
| Rome local | 143.9 | 57 | 261 |
| greeceDetail | 143.9 | 12 | 246 |
| egyptDetail | 143.9 | 8 | 253 |

Detailed evidence: [world/navigation/density](evidence/world-validation.json), [detail](evidence/detail-validation.json), [ecology](evidence/ecology-validation.json), [camera](evidence/camera-validation.json), [active-loading responsiveness](evidence/responsiveness.json), [Italy](evidence/italy-validation.json), [legacy](evidence/legacy-validation.json). The final political capture is [here](evidence/presentation/rome-political.png). These are short headless measurements, not long-session memory-leak or GPU-memory benchmarks.

Final geographic validators passed: 26 landmarks and 1,024 stable points had zero mismatches (43 coastal points excluded); Italy geography validation passed; all ten ecology probes passed. The prior 333 unclassified ecological coastal land-mask cells remain documented source gaps. No geographic source datasets or researched settlement coordinates were changed.
