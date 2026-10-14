# VS5 streaming smoothness refinement

14 October 2026. No commits or pushes. Existing TypeScript simulation, geography, stable IDs, political read models and development-driven architecture remain authoritative and unchanged.

## Reproduction and measurement method

Build with `npm run map:build`, serve with `npm run map:preview -- --port 4173`, then run `npm run map:profile:streaming -- docs/vs5/streaming-evidence/replay`. Use `npm run map:verify:streaming` for movement/lifecycle assertions under active loading. Run `npm run validate` and the existing camera, detail/world, Italy and legacy browser verifiers for regression checks.

The same production-browser replay was used before and after, at 1440 x 1000 on Windows, Intel i7-11800H, 16 GB RAM, RTX 3060 Laptop GPU, Chrome 155.0.8059.40 via ANGLE/D3D11. Browsers ran sequentially for the comparison. Both captures enable the same stage timers and Chrome CPU sampling. Each replay visits Greece, Egypt and Italy, traverses distances 800, 600, 400, 200, 80, 20, 8, 80, 400, 800, 400, 80 and 8 km at 650 ms intervals, then approaches the local preset, holds W and uses the wheel. The validation distance changes deliberately stress residency thresholds; they are not a claim that scripted distance jumps reproduce every human gesture. Actual input assertions run separately.

Frame percentiles include loading and camera transitions, not just settled averages. They use browser animation timestamps between consecutive samples. Long tasks use PerformanceObserver's 50 ms threshold. Raw per-frame data and CPU profiles accompany the screenshots. CPU instrumentation and headless scheduling affect absolute results; these are comparable development measurements, not a promised frame-time target on other hardware. Startup shader preparation is outside the navigation sample and is disclosed below.

## Findings and implementation

Before optimization, median frames were approximately 7 ms but p99 was 215-243 ms. A single terrain build/activation blocked for 513 ms; coverage preparation reached 305 ms and transition preparation reached 270 ms. The asynchronous `response.json()` wall duration also grew while unrelated synchronous tile work blocked its continuation; it must not be interpreted as JSON parse CPU time or physical network transfer time.

The implementation preserves Three.js and the source pipeline:

- A cooperative `FrameWorkQueue` prepares geometry, parent interpolation and edge transitions across animation frames, aiming for a 3 ms preparation budget. Inner loops yield at checkpoints. The budget is cooperative, not a hard maximum for allocation, garbage collection or driver calls.
- Topologies and parent interpolation are reused, each cache bounded to 16 size/stride entries. Numerical interpolation/topology remain unchanged.
- Source fetches plus preparation retain the three-in-flight bound. Active residency remains at most 12 tiles. A four-entry inactive mesh/texture cache retains recent evictions and disposes the oldest entry on overflow; up to three additional tiles may be in preparation. Cached resources are presentation-only and never become historical data.
- Terrain materials compile asynchronously for shadowed and unshadowed use before activation; coast textures initialize before activation. Shared scene programs are prepared during startup before the map reports ready. This moves some first-use work into startup and delays detail rather than freezing input; unsupported parallel-compile drivers can still block.
- The global coarse geographic surface remains available while detail is prepared. Late unwanted results are disposed. Shader preparation restores renderer flags synchronously before awaiting, avoiding stale asynchronous shadow-state restoration.
- Parent terrain edges are prepared before fine-window edges. A fine window invalidates its edge blend when its parent's edge state changes, reducing stale apron discontinuities. This is a targeted continuity correction; no elevation, coastline or ecology source values were changed.

Stage timers and event logs are disabled during normal play; enable `window.__streamProfile.enabled = true` to inspect them. They record network/header wait, body/decode wall duration, geometry and interpolation CPU slices, coverage/edge work, texture upload submission, shader submission/readiness, renderer submission, river draping and camera input. Nested stage totals overlap and must not be added together. Build/activation and tile-total durations after this change include queue waiting across frames; a longer wall duration can accompany a much shorter blocking slice.

## Camera and visual boundaries

The camera's coordinate transforms, acceleration, speed curve, zoom interpolation and terrain clearance have not been retuned to conceal loading. Regression coverage checks input while terrain is pending, continuing animation frames, bounded horizontal movement steps and unchanged scene/settlement/control records. Existing controls continue to cover edge scrolling, panning, rotation, tilt, cursor anchoring, UI conflicts and reset.

Visual refinement focuses on connected terrain edges and uninterrupted navigation. Terrain materials and source relief are preserved. Greece/Egypt do not acquire invented vegetation, settlements, ancient irrigation or shorelines. Modern Copernicus DSM, GSHHG coast/hydrology and the previous modern ecological approximation retain all historical limitations documented in the [campaign experience report](campaign-map-experience.md). Broader close-detail coverage, generalized ecological shading, close coast rasterization, river-width detail and premium scene art remain unfinished.

## Remaining limits

No claim is made that all long frames have been eliminated. Shader-status/driver waits remain a first-use risk, particularly entering Italy's local scene. A diagnostic intercepted WebGL calls and found individual `getProgramInfoLog` waits of roughly 88-110 ms; no intercepted buffer/texture upload exceeded 10 ms in that diagnostic. This identifies CPU/driver synchronization, not GPU execution time. GPU memory and GPU timer-query execution time were not measured.

River re-draping remains a small synchronous batch on residency changes. JSON decoding, garbage collection, resource disposal and geometry uploads still occur on the main thread. The bounded inactive cache increases retained memory in exchange for avoiding some repeated work; it is not a complete source-data cache. Preparing detail can take longer in wall-clock time because work yields to interaction. Abrupt family changes still fall back to coarse geography while new tiles load. The geographic windows remain finite and are not seamless full-world street-scale terrain.

## Measured before/after

All numbers below are milliseconds from the final identical-path comparison.

| Region | Before p50 / p95 / p99 / worst | After p50 / p95 / p99 / worst | Before / after long tasks |
| --- | --- | --- | --- |
| greece | 7.0 / 7.2 / 243.2 / 632.5 | 6.9 / 7.1 / 7.2 / 69.6 | 40 / 0 |
| egypt | 7.0 / 20.9 / 215.5 / 417.0 | 6.9 / 7.1 / 7.2 / 27.9 | 50 / 0 |
| italy | 6.9 / 7.1 / 215.4 / 417.0 | 6.9 / 7.1 / 7.4 / 222.5 | 20 / 2 |

Greece has a 69.6 ms presentation interval without a corresponding reported long task; animation-frame gaps do not all imply a 50+ ms JavaScript task. Italy retains two reported long tasks (97 and 227 ms), including a renderer-submission maximum of 224 ms. A previous optimized replay saw a 271 ms Italy frame. Those outliers prevent a claim of universally hitch-free navigation. First-use shader cache state was not cleared at the OS/driver level between runs.

| Final path endpoint | Draws | JS heap MB | Active / cached / pending | Maximum preparation slice ms |
| --- | ---: | ---: | --- | ---: |
| greece | 10 | 238 | 12 / 2 / 0 | 9.1 |
| egypt | 9 | 229 | 9 / 4 / 2 | 23.6 |
| italy | 56 | 267 | 12 / 4 / 0 | 12.7 |

These are moving-path endpoint samples, not guaranteed fully settled: Egypt still had two pending tiles. All per-frame active/request/cache counts remain in the raw evidence. The source preparation slice maximum was 9-24 ms despite the nominal 3 ms checkpoint budget; that includes occasional indivisible operations and scheduling/GC effects. Texture initialization submission stayed below 0.4 ms in the earlier optimized replay and 0.3 ms in the final capture. Shader submission stayed below 2.5 ms, while asynchronous readiness reached 197 ms without blocking the camera for that duration. Camera input processing peaked at 1.1 ms. River draping peaked at 21.1 ms and remains a candidate for incremental scheduling.

CPU sampling attributed 606 ms before and 568 ms after to garbage collection over the complete sampled replay, and 1403 / 314 ms to shader-status calls. This is sampled self-time, not precise per-frame GC pause attribution. Memory pressure was not proven to be the principal hitch source.

## Loading latency versus blocking

| Region | Before tile-total mean / max ms | After tile-total mean / max ms | After network/header max ms | After body/decode wall max ms |
| --- | ---: | ---: | ---: | ---: |
| greece | 538 / 1237 | 979 / 1510 | 38 | 20 |
| egypt | 459 / 760 | 961 / 1618 | 78 | 21 |
| italy | 500 / 785 | 1201 / 1851 | 77 | 46 |

Completion samples exclude abandoned results and cache hits. Detail latency increased: yielding lets the camera continue while preparation waits for frame budgets. The three in-flight slots include preparation and shader readiness, so this deliberately bounds memory instead of filling an unbounded decoded-data queue. A settled-view screenshot can therefore arrive later than before. The existing geographic fallback remains visible during this wait. Runtime tiles come from localhost packaged files; these results do not benchmark upstream geographic-data download speed. ResourceTiming response/body observations from the separate responsiveness check are included in its JSON.

## Validation and final captures

`npm run validate` passed: typecheck, lint, **417 tests in 28 files**, simulation build and smoke check. The production map build passed with the existing 500 kB bundle-size warning. New tests cover work yielding with ongoing camera integration, serialized completion/error recovery, and cooperative topology/interpolation equality.

The separate active-loading browser check passed for Greece, Egypt and Italy: greece 148 frames with pending terrain; egypt 118 frames with pending terrain; italy 140 frames with pending terrain. Maximum horizontal movement steps stayed below 1.4 km at the tested 300 km zoom, with no tile-arrival horizontal jump. Bounds of 12 active, three pending and four cached were asserted every captured movement frame. These are deterministic browser assertions, not a subjective claim that every input gesture on all machines is smooth.

Existing camera controls, world navigation, ecological/zoom/detail checks and Italy checks passed, including all 23 settlement/control records, selection, collision-free labels, external development snapshots and political control transfer. The synthetic 700- and 1,000-marker benchmarks remain separate from historical data. Startup readiness in the new world verifier was 3.23 seconds, including startup program preparation.

| Settled production view | Mean FPS | Draws | JS heap MB |
| --- | ---: | ---: | ---: |
| World | 143.9 | 186 | 198 |
| Synthetic 700 | 143.6 | 187 | 248 |
| Synthetic 1,000 | 143.9 | 187 | 194 |
| Rome local | 143.2 | 55 | 247 |
| greeceDetail | 142.6 | 10 | 241 |
| egyptDetail | 143.9 | 9 | 293 |

Updated settled screenshots: [Greece](streaming-evidence/greece-detail.png), [Egypt](streaming-evidence/egypt-detail.png), [Rome](streaming-evidence/rome.png), [full world](streaming-evidence/world.png). The identical-input replay endpoints, including movement, are separately saved in the `before/` and `after/` evidence directories; a formerly blocked camera need not end at precisely the same coordinate after a timed key hold.

Evidence: [comparison](streaming-evidence/comparison.json), [before frames/stages](streaming-evidence/before/profile.json), [after frames/stages](streaming-evidence/after/profile.json), [before CPU profile](streaming-evidence/before/cpu-profile.json), [after CPU profile](streaming-evidence/after/cpu-profile.json), [WebGL status diagnostic](streaming-evidence/shader-status-diagnostic.json), [movement/resource timing](streaming-evidence/responsiveness.json), [world/700-marker validation](streaming-evidence/world-validation.json), [settled detail](streaming-evidence/detail-validation.json), [Italy](streaming-evidence/italy-validation.json), [camera controls](streaming-evidence/camera-validation.json).

The legacy browser verifier also passed ([evidence](streaming-evidence/legacy-validation.json)). Final world, Italy and ecology geographic validators passed: 26 landmarks and 1,024 stable comparison points had no mismatches; 43 coastal points were excluded as documented. The existing 333 unclassified ecological coastal land-mask cells remain a source limitation, not a new classification claim. No runtime errors or missing geographic assets were reported in the completed browser verifiers. No commits or pushes were performed.
