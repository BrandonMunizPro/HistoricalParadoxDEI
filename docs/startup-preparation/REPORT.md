# Startup-only loading correction

The [world preload follow-up](../world-preload/REPORT.md) documents the remaining limits and fixes direct-scene startup and incomplete coastline-source residency. This report's original measurements describe the preceding startup-only change.

The previous recurring loading gate has been removed. The campaign has one continuous loading screen before play. Once it opens, the loading controller marks startup complete, hides its cover and disables its processing and input handler. Even newly queued terrain or vegetation cannot reopen it.

## Startup preparation

Normal project launch uses `campaign_boot.tscn`. It requests full startup preparation before attaching the existing campaign scene. During the initial screen the game:

- Loads the shared foliage/outcrop meshes and all 20 vegetation atlases, including the 40 local/coarse atlas mesh variants.
- Submits the reusable vegetation material/mesh families and coast/surf materials to rendering behind the cover. Temporary samples are removed after six frames rather than kept drawing throughout landscape generation.
- Prepares close vegetation, terrain, water and coastal detail at the opening focus. It also lets the opening area's coarse scenery finish.
- Pins prepared opening-area scenery within the existing regional cache limits, so restoring the strategic camera does not immediately discard it.
- Restores the configured focus, zoom, pitch and yaw, waits for that opening view to finish, and permanently retires the loading screen.

The prepared coast patch at the opening focus is also retained until replaced by another region. There is no worldwide allocation of individual trees. The existing renderer generates placement and coast patches by region, and distant procedural geometry continues streaming in the background after startup. That work never blocks camera movement with another loading screen. Remaining first-visit detail transitions are not claimed to be eliminated worldwide.

Direct `world.tscn` diagnostic tools retain their camera control: the extended warmup is requested by normal boot rather than moving cameras owned by capture/test scripts.

## Verification

The native test exercises the real boot scene, shared asset counts, retained cells, restored opening camera, and travel/zoom across the opening area, Gaul, Messina and Pellaro while work is still pending. It checks that no cover reappears, cache limits hold and mouse orbit remains available. The final run uses an isolated empty placement-cache namespace; OS and driver caches are not flushed.

Actual results and preparation metrics:

- **83 native checks passed, zero failures** on Godot 4.7.2 Forward+ / RTX 3060 Laptop GPU, 1920 × 1080.
- Exactly **one** loading screen; no recurrence during 64 sampled navigation frames across four views, including pending background work. Mouse orbit remained available.
- **100 reusable vegetation/outcrop variants**, **40 atlas mesh variants using 20 atlases**, and **two coast/surf material families** prepared. Opening landscape: **nine local cells and twelve coarse cells**.
- The isolated cold placement-cache run covered startup for **78.4 seconds**. Preparation after scene construction took **48.8 seconds**; this is one machine/run, not a universal load-time guarantee.
- Restored campaign camera: focus **13°E, 42°N**, distance **1,100 km**.
- Startup endpoint engine counters: approximately **2.47 GiB static memory** and **4.56 GiB video memory**. These are engine counters, not process peak working set.
- `npm.cmd test -- --maxWorkers=1`: **519 tests passed across 38 files**, including the production build smoke test.
- Protected-file validation: **7,674 baseline files unchanged**, with the same three explicitly authorized renderer-script differences. No historical baseline was rewritten.
- Godot parse checks passed. The native boot runner still emits the two ObjectDB-at-exit warnings also present before this correction, alongside existing terrain-image export warnings; no script errors were reported.

- [Native validation](../../godot-prototype/evidence/startup-preparation/validation.json)
- [Startup phases and resource counts](../../godot-prototype/evidence/startup-preparation/preparation.json)
- [Loading screen](../../godot-prototype/evidence/startup-preparation/startup-loading.png)
- [Restored opening view](../../godot-prototype/evidence/startup-preparation/startup-ready.png)

The original first iteration is retained as `first-validation.json` and `first-preparation.json`; final logs use the `final-` prefix. Earlier recurring-gate measurements under `evidence/detail-readiness/` describe the superseded behavior and are not evidence of the current interaction flow.

## Changed files

- `godot-prototype/detail_loading.gd`: one-shot startup state and permanent retirement.
- `godot-prototype/startup_preparation.gd`: shared resource warming, opening-area preparation and camera restoration.
- `godot-prototype/campaign_boot.gd`: explicitly requests startup preparation.
- `godot-prototype/world.gd`: startup request flag for the boot/diagnostic distinction.
- `godot-prototype/regional_scenery.gd`: retain prepared opening cells within existing cache limits.
- `godot-prototype/world_coast.gd`: retain the prepared opening coast patch.
- `godot-prototype/tools/detail-boot-validate.gd`: startup-only and uninterrupted-camera regression coverage.
- `godot-prototype/tools/detail-readiness-profile.gd`: retains timing measurements but removes obsolete assertions requiring recurring loading screens.
- This report and the new evidence directory.

No geography, settlement coordinates, historical records, ownership, vegetation placement rules or density changed. Existing terrain-image export warnings remain outside this correction. Startup can take substantial time; this deliberately moves preparation before play. Preloading every procedurally generated world instance simultaneously is not implemented or represented as complete.
