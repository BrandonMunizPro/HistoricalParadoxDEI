# Terrain and vegetation streaming optimization

The change prepares nearby scenery earlier and retains it across ordinary zoom reversals. It preserves the existing scatter algorithm, density, meshes, terrain sampling, visibility distances, shader transitions and reveal fade. It does not eliminate the cost of generating an uncached region.

## Rendering audit and root cause

- `world.gd::queue_tiles`, `load_tile`, and `_process` select the nearest twelve terrain descriptors, synchronously decode/upload one tile per frame, and reveal each over 650 ms. Terrain loading is not a worker-thread or asynchronous resource-loading pipeline.
- `regional_scenery.gd::tick` previously waited until below 190 km, until the terrain queue was empty, and until **all resident terrain finished revealing**. Close-cell requests began below 180 km. Outside regional Italy, all nine coarse cells were generated serially before any close cells. This was the main avoidable delay in the Gaul test.
- `build` performs deterministic habitat, coastline, river, settlement-clearance and rendered-height checks on the main thread, with timed yields. Those calls access live world state and mutable caches; moving them wholesale to a worker would be unsafe. Placements are stored in validated disk caches; zoom can reuse them, but the old 220 km eviction threshold destroyed live local MultiMeshes on a routine zoom reversal.
- Vegetation already uses `MultiMeshInstance3D`. Previously each cell uploaded transforms, tint and LOD/slope data using three native calls per instance and additional frame yields. Some detailed atlas resources are loaded synchronously on first use in `vegetation_quality.gd::mesh_for`.
- Existing shaders already blend coarse/local representations and fade newly prepared cells. No new shader, material, terrain or scenery density has been substituted. Raw profiles record pipeline compilation counters, but they do not isolate compilation time; shader compilation cannot honestly be assigned a measured share of the delay.

## Implementation

`regional_scenery.gd` now requests focused close detail first, then the focused coarse cell. Other cells are prioritized by camera distance. Preparing scenery begins below **360 km**, while actual visibility stays at **190 km for coarse cells** and **37 km for local nodes**, with the existing local shader transition at **32–12 km**. The parent visibility gate and existing fades remain intact.

Local cells are retained until **420 km**, with a **12-second grace period** for cells outside the requested focus, and the existing **18-cell cache limit**. Coarse retention keeps its existing 440 km release rule and 18-cell limit. A newly added in-flight cell can briefly take a dictionary to 19 entries before the next tick evicts an old entry. This is bounded regional preparation, not world-wide vegetation allocation.

`scenery_buffers.gd` packs immutable placement arrays on a single worker thread. The main thread waits through frame yields, joins the completed worker, validates the cell is still alive, and submits one packed buffer per nonempty species. Scene-tree operations, meshes, resource loading and GPU uploads remain on the main thread. A thread-start failure falls back to local packing. The native regression compares both raw buffers and all 1,800 instance transforms/colors/custom values against the original setters.

Terrain-ready gating is intentionally retained: generating against an intermediate terrain morph could move trees vertically or invalidate the equality checks. Terrain loading itself and the campaign UI are unchanged.

## Measurements and evidence

See [measured results](MEASUREMENTS.md), [threshold/travel/spike results](STRESS.md), [native profiles and screenshots](../../evidence/streaming-optimization/), and the [comparison viewer](../../evidence/streaming-optimization/compare.html). Original source snapshots and first-iteration profiles are retained alongside the final comparison. `run-streaming-comparison.ps1` temporarily selects the original scenery script for baseline runs and restores the optimized script in a `finally` block.

Each final profile includes cold placement-cache zoom, warm re-entry, repeated threshold crossings, rapid movement between three nearby regions, actual terrain tile preparation times, frame intervals, memory counters, draw calls, instance counts and placement hashes. Screenshot capture is outside timed samples. The separate transition captures explicitly disclose screenshot pauses and are qualitative evidence only.

## Limits

- Uncached habitat generation remains time-sliced main-thread work. The focused cell can be ready much earlier while surrounding cells continue to fill in. Instantaneous jumps into an uncached area can still show delayed detail.
- Synchronous terrain decoding, initial scene/asset setup, first-use atlas loading and GPU pipeline work remain possible sources of spikes. This change is not a wholesale asynchronous terrain loader.
- The cache signature includes the scenery script. Updating it invalidates previous placement-cache signatures once; published cache files are not rewritten or bypassed.
- Memory is traded for retained nearby MultiMeshes. Engine static/video counters are reported; process peak working set was not measured.
- Two camera routes on one GPU are evidence for those routes, not a world-wide or hardware-independent guarantee. No density reduction, historical-data edit, political edit, UI edit or simulation change was made.

## Changed files

- Runtime: `regional_scenery.gd`, new `scenery_buffers.gd`.
- Verification: `tools/streaming-optimization-{profile,validate}.gd`, `tools/streaming-transition-capture.gd`, `tools/run-streaming-{comparison,capture}.ps1`, `tools/streaming-optimization-report.mjs`.
- Documentation/evidence: this directory and `evidence/streaming-optimization/`.

Validation results are recorded in `VALIDATION.md` after the native and repository checks complete.

The worker/bulk-buffer approach follows the [Godot MultiMesh optimization guidance](https://docs.godotengine.org/en/stable/tutorials/performance/using_multimesh.html). Scene and GPU objects stay on the main thread in accordance with the [thread-safe API guidance](https://docs.godotengine.org/en/stable/tutorials/performance/thread_safe_apis.html).
