# Campaign detail preparation and loading

**Superseded interaction flow:** the [startup-only correction](../startup-preparation/REPORT.md) removes recurring loading screens. The measurements below document the earlier implementation, not current camera behavior.

The campaign now opens through a loading screen and keeps unfinished nearby terrain, vegetation, shorelines and ocean setup covered. Newly visited close views can also use that screen. The 3D scene continues rendering behind it so preparation and first-use rendering work can complete before the map is revealed.

## Root causes found

- Scenery already used MultiMesh instancing, a placement cache and early preparation below 360 km. Nevertheless, uncached cells were generated serially against settled terrain, with a 4 ms CPU slice. Nine close cells could take tens of seconds after their visibility threshold.
- Global coast construction began only below the 12 km display threshold. The old patch key depended on continuously changing eased camera distance, generating redundant work during zoom.
- Zooming out above 12 km immediately discarded coast meshes. Even warmed vegetation routes could wait for their coast to rebuild.
- The original Pellaro pass waited another 30 stable frames before creating its close geometry.
- There was no player-facing readiness gate: terrain fades, procedural placement, coastal compute and ocean initialization could all become visible independently.

## Changes

`campaign_boot.tscn` is the main scene. It paints the existing burgundy material and a restrained historical loading title before requesting the unchanged campaign scene through Godot's threaded resource loader. Scene instantiation and scene-tree work remain on the main thread. The campaign remains directly loadable as `world.tscn` for existing diagnostic tools.

`detail_loading.gd` waits for required terrain tiles and their fades, regional surfaces, ocean readiness, rivers, settlement surroundings, visible scenery cells and close coast readiness. It then allows six further rendered frames before revealing the map. It shows actual stages and elapsed time rather than a fabricated percentage. It blocks map input while covering the view. Warm camera easing alone does not open a loading screen; a screen already in use waits for the destination to settle.

Scenery preparation uses up to 12 ms per generation slice while the loading screen is visible, retaining the normal 4 ms setting during live map use. Candidate limits, random sequence, density, habitat tests, meshes, transforms, tint and LOD data remain unchanged. Previously visible close cells remain visible while retained, avoiding an immediate disappearance at the next cell boundary. Existing bounded caches and release rules remain in place. Fully opaque political views do not wait for vegetation that cannot contribute to their presentation.

Coast preparation starts below 36 km, with visibility still beginning below 12 km. Patch sizes use stable 8/16/32 km buckets instead of a new size every eased zoom sample. A finer destination can cancel obsolete work safely. Completed patches are retained across ordinary zoom reversals and released beyond 48 km after a 12-second grace period. The current complete patch remains in use while another is prepared. Existing vertex limits, coastline sources, style profiles and compute field buffers are retained. Pellaro prepares after two terrain-stable frames in the earlier preparation range.

This prepares bounded nearby detail; it does not allocate vegetation for the entire campaign world. Historical records, settlement positions, ownership, faction data, terrain sources and vegetation density are unchanged.

## Measured native results

Godot 4.7.2 Forward+, NVIDIA RTX 3060 Laptop GPU, 1920 × 1080. Each route uses the same six-second zoom goal from 300 to 2 km. Cold means an isolated empty placement-cache namespace; OS and driver caches were not flushed. Warm is the same route revisited in the same process. One before/after pair per route is evidence for those routes, not a statistical or hardware-independent guarantee.

Vegetation delay is measured from crossing 32 km until all nine local cells are ready and their existing reveal fade is effectively complete. Coast delay starts below 12 km. These are preparation delays, including work occurring behind the loading screen. The incomplete-frame counter observes readiness flags with the cover absent, not screenshot pixel analysis.

| Route | Vegetation delay, before → after | Coast delay, before → after | Exposed incomplete-detail frames, before → after |
|---|---:|---:|---:|
| Italy, cold | 19,794 → 12,766 ms | 1,777 → 856 ms | 1,232 → **0** |
| Italy, warm | 0 → 0 ms | 1,499 → 842 ms | 47 → **0** |
| Messina, cold | 27,236 → 13,724 ms | 10,269 → 5,546 ms | 1,499 → **0** |
| Messina, warm | 0 → 0 ms | 11,774 → 1,720 ms | 576 → **0** |

The loading screen is a deliberate tradeoff. The first Italy release recorded about 43.2 seconds of coverage, including scene construction occurring before the timed zoom route. The subsequent cold Messina view was covered for about 18.2 seconds; warmed route transitions about 8 seconds each. The additional cold Pellaro check was covered for about 14.5 seconds. These are not universal loading-time promises. River and settlement work can also extend the wait.

| Timed loading interval | Mean frame ms, before → after | p99 ms | Maximum ms |
|---|---:|---:|---:|
| Italy, cold | 15.3 → 17.7 | 41.6 → 59.0 | 397.3 → 706.1 |
| Italy, warm | 34.3 → 34.3 | 64.4 → 54.5 | 88.8 → 57.9 |
| Messina, cold | 18.3 → 20.3 | 41.5 → 53.5 | 75.9 → 329.0 |
| Messina, warm | 22.7 → 37.6 | 43.9 → 111.8 | 68.4 → 261.2 |

The larger covered generation budget trades loading-screen smoothness for faster preparation. Frame spikes remain, and these loading intervals do not establish improved steady interactive FPS. The maximum sample can include first-use asset/GPU work; the experiment does not isolate a shader-compilation share.

Engine static memory increased by about 1.5 MiB in these endpoints, and engine video memory by about 2.9 MiB. These are engine counters, not process peak working set. Endpoint instance counts were identical: 32,621 in Italy and 24,813 near Messina. Endpoint draw calls were 457–458 in Italy and 287 near Messina, with a one-call difference in the warm Italy sample.

Exact native placement-cache comparison passed **90 checks across 18 local cells**: transforms, colours, LOD/slope custom data, plant counts and rock counts all match. No density reduction explains the timing changes.

## Verification and evidence

- [Final native profile and nine functional checks](../../godot-prototype/evidence/detail-readiness/after-final/profile.json): all passed. Includes cold/warm routes, stable zoom keys, new-destination cover, resizing to 1000 × 700, blocked orbit input and Pellaro readiness.
- [Placement equality](../../godot-prototype/evidence/detail-readiness/placement-validation.json): 90 checks passed, no differences.
- Existing native MultiMesh worker/buffer regression: 5,403 checks passed on Forward+. The initial headless attempt reported one bulk-buffer equality failure; the same regression passed on the actual renderer. Both logs are retained rather than treating the headless attempt as a pass.
- [Startup handoff](../../godot-prototype/evidence/detail-readiness/boot-validation.json): passed. The loading screen renders before campaign construction, hands off to the existing world and opens with all 35 canonical sites and 687 research records loaded.
- `npm.cmd test -- --maxWorkers=1`: **519 tests passed across 38 files** on the serial rerun. The first run overlapped a separate build and reported a build-smoke import failure; the isolated rerun passed without source changes.
- `npm.cmd run typecheck` and `npm.cmd run build`: passed, including the build smoke checks.
- Godot script parse checks passed.
- The strict pre-existing historical validator reports `Protected input unchanged godot-prototype/world.gd`, because its baseline intentionally includes renderer scripts. It was not weakened or rebaselined. The separate `detail-data-validate.mjs` checks all 7,677 protected paths, permitting differences only in the three renderer scripts changed here. Every other protected file must retain its original hash; [results](../../godot-prototype/evidence/detail-readiness/protected-data-validation.json).

Raw baseline, first iteration and final native results are retained in `godot-prototype/evidence/detail-readiness/{before,after,after-final}/`. Original runtime source snapshots are in the baseline directory. Screenshot writes occur after the timed trials.

- [Loading screen, desktop](../../godot-prototype/evidence/detail-readiness/after-final/loading-desktop.png)
- [Loading screen, smaller viewport](../../godot-prototype/evidence/detail-readiness/after-final/loading-small.png)
- [Prepared Pellaro view](../../godot-prototype/evidence/detail-readiness/after-final/pellaro-ready.png)
- [Prepared Messina view](../../godot-prototype/evidence/detail-readiness/after-final/messina-cold.png)
- [Boot loading screen](../../godot-prototype/evidence/detail-readiness/boot-loading.png)

## Files changed

- `godot-prototype/project.godot`: main-scene entry only.
- `godot-prototype/campaign_boot.{gd,tscn}`: initial loading-screen handoff.
- `godot-prototype/detail_loading.gd`: visible-detail readiness, input blocking and loading instrumentation.
- `godot-prototype/world.gd`: loading integration, timely terrain requests and input guards.
- `godot-prototype/regional_scenery.gd`: visible readiness, covered generation budget and retained-cell visibility.
- `godot-prototype/coastal_focus.gd`: earlier bounded preparation and explicit local readiness.
- `godot-prototype/world_coast.gd`: early preparation, stable buckets, cancellation safety, retention and readiness.
- `godot-prototype/tools/detail-{readiness-profile,placement-validate,boot-validate}.gd`: actual-runtime measurements and validation.
- `godot-prototype/tools/detail-data-validate.mjs`: protected-file hashes with an explicit renderer-only exception list; no changes to historical audit baselines.
- This report and `godot-prototype/evidence/detail-readiness/`.

## Limits

Uncached generation, synchronous terrain uploads, scene construction and first-use rendering costs still exist. The loading screen can recur when entering an unprepared region. Existing distance-based LOD changes remain; this work addresses late preparation and incomplete view exposure, not every intentional LOD transition or a new terrain renderer. Published placement-cache signatures change once with the runtime edits. No packaged export, whole-world traversal or additional GPU was tested. Existing terrain-image import/export warnings remain outside this change.

Resource loading follows the [Godot background-loading API](https://docs.godotengine.org/en/stable/tutorials/io/background_loading.html). Scene-tree and GPU operations stay on their existing threads, consistent with the [thread-safe API guidance](https://docs.godotengine.org/en/stable/tutorials/performance/thread_safe_apis.html).
