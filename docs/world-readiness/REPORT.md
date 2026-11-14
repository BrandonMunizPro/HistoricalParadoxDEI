# World coverage, coast rendering, and streaming

## Causes

The prior loading screen pinned all fourteen coast source chunks (132,378,576
bytes), warmed shared foliage assets and two coast materials, and prepared the
opening area. It did not prepare a worldwide coast representation. Outside the
Pellaro focus area, `world_coast.gd` still clipped source segments, sampled terrain,
built beach/surf meshes, and dispatched a 1024² GPU distance-field bake after the
camera approached. Moving between snapped camera buckets cancelled unfinished
work. Completed patches were discarded instead of reused.

The terrain system already had continuous world and regional backdrops. A second
terrain renderer was unnecessary. However, parent clipping used tile residency
before the replacement finished revealing. Regional ocean masks also discarded
water under ordinary elevated land; source-exact terrain clipping could expose
those exclusions as background-coloured gaps.

## Implementation

`coast_baseline.gd` extends the existing coast controller and beach material. It
uploads derived buffers once during startup: all **2,757,887 existing catalog
segments**, shared strip geometry instanced into 1,253 spatial batches, and a
sparse nearest-coast lookup. No coastline segment is removed or simplified by
this change. Shared corner offsets and endpoint styles close strip joins. The
half-kilometre GPU index reduces candidate scans while retaining every segment;
the original CPU coast catalog is unchanged.

The derived lookup occupies 240,995,936 bytes and instance data 220,630,960 bytes,
about **440.2 MiB combined**, before driver overhead. Files are split into parts
of at most 32 MiB. The persistent strips use the same existing sand, rock, ground,
and surf appearance; the original more detailed mesh/compute pass enhances them
when ready. Above 190 km camera distance, the existing world/regional terrain and
water masks provide the distant representation. This is not full-resolution
world terrain residency or proof that the whole world is drawn in every frame.

The coastline signed-distance path is shared by terrain and ocean shading. Each
fragment reuses its sample. A baseline strip does not cut away its underlying
land; only a completed detailed strip may carve that land. Ocean remains under
ordinary coastal land, while ocean/land mask differences retain inland-water
exclusions. Original geographical datasets and the historical manifest are not
rewritten.

The original detailed coast pass now has four cached patches and six reusable
GPU field slots: four retained patches, an active patch, and a destination. Slot
protection prevents a new compute bake overwriting a cached field. Camera motion
can finish and cache bounded work instead of continually cancelling it. Normal
play performs no GPU readback for this cache. Terrain ArrayMeshes use a separate
96 MiB estimated-byte LRU, avoiding repeated tangent/normal/attribute decoding.
Parent terrain remains until child reveal completes.

## Startup readiness

The existing one-time loading screen remains. Startup verifies persistent terrain
and water meshes, loads worldwide coast sources, uploads the complete coast
baseline, initializes the existing refinement compute resources, warms 71 terrain
materials plus the original foliage/coast families, prepares the opening area,
restores the campaign camera, and waits for rendered frames before release.
Phases, counts, timings, and resource budgets are recorded.

Missing or stale essential coast buffers cannot silently open an incomplete map.
Optional detail preparation has a 60-second work budget once complete baseline
coverage exists; it can continue in the background without reopening the loading
screen. This budget is a limit, not an artificial minimum delay.

## Validation and measurements

See [MEASUREMENTS.md](MEASUREMENTS.md) for measured startup, route frame times,
refinement latency, and memory. Raw reports and screenshots are under
`godot-prototype/evidence/world-readiness/`.

- TypeScript typecheck, all 519 tests in 38 files, production build and smoke
  check passed during implementation.
- Derived-data validation checks source hashes, all source segment fields,
  every instance, 849,536 GPU spatial cells, and 12,197,970 candidate references.
- Historical integrity validation matched 7,671 protected files; the existing
  historical manifest was preserved. Its permitted renderer differences include
  renderer changes already present before this task.
- Native comparisons use Godot 4.7.2, Vulkan Forward+, an RTX 3060 Laptop GPU,
  and a forced 1280×720 viewport. The old renderer is isolated from committed
  revision `b136800`, with resource paths redirected and line endings normalized
  for the shader-text substitutions. No active renderer files are swapped.
- The route visits Tarquinii, the Nile Delta, the Aegean, a source-selected Black
  Sea coast, Brittany, and the Delta again. Each navigation window is eight
  seconds; screenshots are outside frame measurements. Detailed refinement
  readiness is reported separately from immediately available baseline geometry.
- First-draw geometry captures visit the Delta, Aegean, Norwegian fjord, western
  India, Arabia and Pellaro without waiting for destination detail. They also
  exercise large jumps and repeated world/close zoom transitions. The short
  `--baseline-only` diagnostic skips optional opening-area vegetation warming;
  it does not measure normal startup. Its assertions must be paired with visual
  inspection: an earlier assertion-passing iteration still exposed coastal gaps.
- Final visual inspection confirmed the formerly empty fjord/island water gaps
  are filled. A targeted image regression found zero background-coloured gap
  pixels in all six final close captures, compared with 52,954 in the retained
  faulty fjord iteration. This colour test detects that specific defect; it is
  not proof of every pixel's geographical accuracy. The final offshore colour
  falloff was checked visually after the performance runs; the geometry/cache
  architecture and buffer sizes used for those measurements are unchanged.
- Existing strategic-camera validation passed: 23 presets, 16 edge rotations,
  and the 35 researched sites. Four additional headless checks confirm that
  legacy no-coast and Pellaro-only diagnostics can still query startup readiness.
- Targeted ESLint checks passed for the new JavaScript tools. The earlier full
  repository lint failures were not changed or suppressed.

## Reproduction

From the repository root:

```powershell
node godot-prototype/tools/world-coast-baseline-build.mjs
node godot-prototype/tools/world-coast-baseline-validate.mjs
node godot-prototype/tools/world-readiness-integrity.mjs
node godot-prototype/tools/world-readiness-baseline.mjs
```

Run the existing Godot executable with `--path godot-prototype --resolution
1280x720 --script res://tools/world-readiness-profile.gd -- --stage=after
--cache=cold`, then `--cache=warm`. Use `--stage=before` for the frozen committed
renderer. Run `res://tools/world-readiness-visual.gd` for first-arrival images.
Rebuild the derived coast buffers when changing coast or terrain source data.

For the targeted image regression and legacy-mode compatibility checks, run
`tools/world-readiness-image-validate.mjs` with Node and
`res://tools/world-readiness-compatibility.gd` with headless Godot.

## Files

- Coast representation: `coast_baseline.gd`, `coast_baseline.gdshaderinc`,
  `coastal_focus.gdshaderinc`, `world_coast.gd`, `coast_field.gd`, and the derived
  `data/world-coast-baseline/` buffers.
- Terrain and water integration: `world.gd`, `northern_italy_world.gd`,
  `eastern_surface.gd`, `anatolia_surface.gdshader`,
  `ocean/ocean_surface.gdshader`, `ocean/coastal_contact.gdshaderinc`.
- Startup: `startup_preparation.gd`, `detail_loading.gd`.
- Diagnostics: `tools/world-coast-baseline-{build,validate}.mjs`,
  `tools/world-readiness-{baseline,integrity,report}.mjs`,
  `tools/world-readiness-image-validate.mjs`,
  `tools/world-readiness-profile.gd`, `tools/world-readiness-visual.gd`, and
  `tools/world-readiness-compatibility.gd`.

## Limits

The baseline uses coarser cross-sections than the existing detailed coast meshes.
Fine vegetation, settlement surroundings, and high-resolution terrain continue
streaming within their existing bounds. Geographic continuity does not mean every
fine object exists on the GPU. Cold means a fresh placement-cache namespace;
OS filesystem and driver shader caches are not flushed. Measurements are single
runs on one GPU, not broad hardware qualification or a claim of universal speedup.
The pre-existing lint failures and Greece navigation-validator height mismatch
recorded in the earlier repository checkpoint are separate known issues; that
full Greece navigation suite was not rerun for this task.
