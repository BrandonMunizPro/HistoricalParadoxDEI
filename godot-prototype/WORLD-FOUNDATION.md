# World visual foundation and settlement population

Review candidate, 27 October 2026. No commit/push. Phase 1 presentation only. The pre-existing uncommitted work is preserved. This is not a claim that the map reaches Rome II/DEI artistic quality.

## What changed and why

The prior images show almost empty historical locations, thin polygonal rivers, very uniform ground at close range, and V-shaped rock shells. The source elevation spacing remains roughly 2�19 km outside finer Italian coverage. Changing palette/noise cannot recover absent landforms, and this pass does not invent them.

1. **Water geometry and response.** `river_geometry.gd` supplies continuous bounded bank joins, replacing independent per-segment side vectors. Render-only cubic interpolation is constrained to 60% of the existing half-width from the source segment, with exact segment endpoints; joins are capped at 1.5 half-widths. Canonical source centerlines remain unchanged. Heights are sampled on the rendered terrain. `nile_water.gdshader` uses two moving surface scales, correctly transformed normals, stronger blue-green response, restrained directional specular and an inexpensive sky-reflection cue. A narrow wet/silt edge remains inside the ribbon. Existing lake polygons now use the same water-response material. No screen-space reflections, refraction copy, new bathymetry or per-frame CPU mesh updates were added. Other non-North-African river materials remain the existing material; bank-join improvements are shared.
2. **Physical ground detail.** Two verified CC0 1K maps from Poly Haven's Rocky Terrain 02 provide photographic ground structure and a real normal map, fading continuously between 6 and 55 km camera distance. Existing regional colors, moisture families, slope/height decisions and strategic relief remain in place. The material supplies surface detail, not new elevations or vegetation evidence. Rock meshes now use outward-facing surfaces globally; their positions, sizes and underlying source geography remain unchanged.
3. **Data-driven neutral settlements.** `neutral_settlement.gd` creates shared original gabled architecture with doors, windows, eaves and foundation blocks. Deterministic courtyard blocks, roof/masonry tint and building sizes vary by stable ID. A larger central building grounds each cluster at its researched anchor. The shared style is temporary and makes no cultural, population, fortification or archaeological-plan assertion. The original detailed Catana asset is preserved and is not doubled.
4. **Bounded presentation and coherence.** `settlement_population.gd` admits only the derived placement registry, limits active settlement batches to 160 and detailed clusters to 12, rejects offscreen/distant candidates before height queries, caches label heights and builds within a 3 ms scheduling target. A spatial index keeps vegetation away from illustrative settlement footprints. Research labels carry `R`; approval, search/selection and simulation registries remain unchanged. The building count grows with close zoom rather than introducing whole settlements only at close range. Proxy scale is a capped campaign-map convention, not historical town extent.

No new source elevations, historical coordinates, lakes, rivers, political control, factions, population values, characters, ownership or campaign mechanics were introduced. Terrain-cast shadows remain disabled. Native terrain residency remains bounded at 13 tiles.

## Consentia / Cosentia finding

The research record is `r16-ita-consentia`, historical name **Consentia**, alternate **Cosenza**. There is no dedicated Cosentia/Consentia mesh or scene in the current repository. The detailed existing implementation is `world.gd::build_catana()`, seven MultiMesh material batches built at Catana. The new neutral asset generalizes the building-cluster approach, while retaining the old Catana representation. No settlement was invented to resolve the spelling difference.

## Settlement population audit

| Stage | Count | Treatment |
| --- | ---: | --- |
| Original research catalog | 687 | Preserved byte-identically |
| Raw research with numeric coordinates | 684 | Three records lack coordinate components |
| Raw research inside supported extent | 674 | Ten additional records outside coverage |
| Already promoted handles | 12 | Use protected approved anchors; no second research town |
| Missing/invalid/out-of-coverage pipeline exclusions | 13 | Existing validator reasons retained individually |
| Exact duplicate representations consolidated | 2 | Existing reference handles retained in audit |
| Existing pipeline displayable references | 660 | Approximate references, not independently verified ancient sites |
| Disputed identification/location/presence | 86 | No solid settlement visual |
| Unresolved possible-duplicate participants | 28 | No duplicate clusters forced onto the map; 15 candidate pairs remain recorded |
| Eligible research visuals before terrain-mask check | 546 | Coordinates copied exactly |
| Research points rejected by current land mask | 42 | Not moved to nearby land; IDs recorded in runtime audit |
| Land-supported research settlement visuals | 504 | Remain unapproved references |
| Approved anchors | 35 | Identities and canonical coordinates exact |
| Successfully instantiated locations | **539** | 538 new neutral clusters plus preserved Catana representation |

The GPU audit actually instantiates every admitted location serially, checks exact anchor metadata and each nonzero building's sampled terrain height, and then frees/evicts it. It validates **23,894 land-supported building instances**, excluding the old Catana asset from that building tally. This is not a claim that 539 detailed towns are resident at once. Normal navigation instantiates only nearby visible batches; the audit lists every admitted ID/coordinate in `evidence/foundation/final3-check-settlement-population/settlements.json`.

`data/settlement-presentation.json` records all exclusions and duplicate decisions. `tools/settlement-presentation.mjs` invokes the existing compiled TypeScript `researchLocations()` function rather than implementing a divergent coordinate validator. Rebuild it from repository root after the normal TypeScript build. No research or approved source file is edited by that generator. Water-mask rejection reflects current modern presentation masks and source precision; it is not a historical verdict about the 42 locations, some of which are coastal/submerged sites.

## Source and asset provenance

Fresh baseline source: `c737e176745d2b47d97eb4354eb65c82c98cc374326a9ba96892dc423bd29671`.

Final source: `80f1c276958ea64cc8f61279b71bfbe7c6f4d9b9888845e25ad2afa0efa94207`, 2,647 frozen inputs; HEAD remains `cbab45903ee34973b68fac5360ad17dbe24c90a6`.

Exact new external asset: [Rocky Terrain 02](https://polyhaven.com/a/rocky_terrain_02), author Amal Kumar, explicitly CC0 on its asset page; [license](https://polyhaven.com/license). Only 1K diffuse/OpenGL-normal JPEGs were downloaded, about 1.84 MB combined. Both MD5 hashes match the publisher's metadata. No attribution is required by CC0; provenance and original URLs are retained in `assets/foundation/PROVENANCE.md`. The old Kenney medieval-town URL returned 404; no license was assumed and no medieval pack was imported. Settlement geometry, layouts and shader code are original. No proprietary reference-game assets or code were used.

## Exact implementation files

Modified:

- `world.gd`: material bindings, settlement lifecycle/readiness/metrics, river geometry, lake material, configurable presentation policy and recorded VSync/frame-cap metadata.
- `terrain.gdshader`: distance-faded photographic surface/normal detail.
- `nile_water.gdshader`: water response and animation.
- `regional_scenery.gd`: outward-facing shared rock meshes.
- `environment_rules.gd`: indexed interpretive settlement clearances.
- `tools/checkpoint-capture.ps1`: settlement-off diagnostic flag and before/after GPU telemetry.
- `tools/environment-profile.gd`: settlement work in continuous-tour evidence.
- `README.md`: current review link; trailing EOF whitespace corrected.

Added:

- `neutral_settlement.gd`, `settlement_population.gd`, `river_geometry.gd`.
- `data/settlement-presentation.json`, `data/foundation-settings.json`, capture-only `data/foundation-views.json`.
- `tools/settlement-presentation.mjs`, `tools/foundation-validate.gd`.
- `assets/foundation/rocky-ground.jpg`, `rocky-normal.jpg`, `PROVENANCE.md`.
- This report and `evidence/foundation/` review tools, source manifests, audit, logs, measurements and gallery. Full matched captures are in `evidence/repair-20261026/foundation-before/` and `foundation-final3/`; one clean baseline retry is in `foundation-before-retry/`. Other preview/preflight stages are diagnostics only.

Earlier dirty/untracked Godot files are pre-existing work; the source-manifest delta and delivery manifest distinguish this pass from the prior passes.

## Validation and review

`npm.cmd run validate` passed: typecheck, lint, **475 tests / 34 files**, build and postbuild smoke. The Godot suite passed **11 checks**: 24 scripts parse, navigation resolver, environmental/habitat parity, canopy GPU transitions, North African GPU/static-water controls, all-location settlement instantiation, water rendering, production global/regional navigation and expected timeout failure. Exact commands, timestamps, exit codes and stderr are in `evidence/foundation/checks3.json`. The negative control deliberately exits 1. The 460 protected files, all 35 exact approved records and 687 original research records are unchanged. `git diff --check` passes; the previous trailing EOF whitespace was removed before freezing this revision.

The comparison gallery and performance report are generated after final captures. Functional tests do not establish artistic acceptance. Open `evidence/foundation/comparison.html`, `MEASUREMENTS.md`, and the full-resolution originals for independent review.

## Known visual limits and unfinished artistic goals

This is a reusable settlement-population foundation and an improved water/ground presentation, not a finished commercial campaign environment. The neutral houses remain simple original geometry with a shared temporary architectural style; there are no culture-specific city plans, archaeological structures, verified walls or settlement outskirts. Streets/courtyards are layout gaps, not newly researched road geometry.

Major mountain **shape** and coarse coast geometry still reflect the existing source resolution; this pass does not solve missing fine landforms by inventing displacement. The new photographed surface is not a new geographic survey. River shapes still inherit coarse source paths despite bounded visual interpolation and joined banks. There are no surveyed river beds/banks, physical refraction or reconstruction of the ancient Delta. Some coasts and lake polygons retain modern/coarse shapes.

Whole-world terrain realism is therefore **incomplete**. The most substantial functional/visible change is that eligible locations now acquire grounded architectural clusters consistently across the map. It would be inaccurate to describe the ground-detail addition alone as a major terrain-engine or mountain-quality upgrade.

Synchronous PNG/material setup and first-render/driver stalls remain under measurement. The 3 ms settlement and existing 4 ms scenery budgets are scheduling targets, not hard realtime guarantees. Simple close-detail changes and terrain rebatching may remain noticeable during zoom. Sustained thermal behavior needs independent hardware review; no FPS claim should omit the full measurement table.

## Reproduction

From repository root:

```powershell
npm.cmd run validate
node godot-prototype/tools/settlement-presentation.mjs
node godot-prototype/tools/check-integrity.mjs
node godot-prototype/tools/checkpoint-source.mjs verify godot-prototype/evidence/foundation/final3-source.json
& godot-prototype/evidence/foundation/run-checks.ps1
& godot-prototype/tools/checkpoint-capture.ps1 -Stage foundation-new-review -Views @() -Profiles egypt,delta,coast,italy,sicily,illyria,dense,sparse -Scales strategic,regional,inspection -ProfileFile data/foundation-views.json -SourceManifest res://evidence/foundation/final3-source.json
```

Use fresh stage/output names; capture tooling refuses to overwrite evidence. `-NoSettlementVisuals` is a diagnostic only, preserving scene/material/scenery work while disabling the new architecture and research labels. Production camera presets, approved navigation and the original Three.js application remain intact. Stop here for independent review; no commit or push is authorized.

The earlier `foundation-final/` set is diagnostic. The geometry/LOD corrections disable strategic proxy shadows, refresh cached proxy size during zoom and include near/far river sampling in live navigation signatures. Final3 adds the measured presentation-pacing correction and is the primary review evidence.

## Actual visual review

All eight final contact sheets were inspected, showing all 24 matched pairs. Full-resolution Nile and neutral-town close-ups were also inspected during development. The final pictures demonstrate populated locations and a more legible blue-green Nile, but not a transformed terrain foundation.

| Area | Observed improvement | Still artificial |
| --- | --- | --- |
| Egypt / Nile | Blue-green surface replaces dark flat stripe; joins are continuous; settlements identify more locations | Still a narrow source-derived ribbon with limited bank depth; corridor remains smooth |
| Delta | Research towns make the broad plain less empty; source moisture contrast is retained | Green ground remains too uniform/soft at strategic range; distant towns are small |
| Alexandria coast | A grounded town appears at the recorded coastal location; existing sea/coast alignment retained | Broad plain is still flat and shores are simple |
| Italy | Neapolis and other approved sites gain clusters; existing terrain/forest/coast composition largely retained | Shared compact street-grid silhouettes are recognizably procedural |
| Sicily | Original detailed Catana and coastline preserved | Correct rock faces expose conspicuous pale scattered stones at close zoom; no extra rock locations were added |
| Illyria | Existing island/coast shapes and vegetation retained; additional recorded sites appear at regional zoom | Source shoreline steps and stylized trees remain |
| Athenai / dense region | New roof clusters and research labels; a 45-building close template is clearly visible | A neutral village silhouette is not a reconstructed Athens/Acropolis |
| Babylon / sparser view | Previously empty reference location acquires a terrain-following cluster among existing scenery | Generic architecture and surrounding procedural vegetation remain obvious |

The strongest achievement is geographical population and reusable presentation, not commercial realism. Terrain geometry and regional environmental composition still need a larger art/data milestone. Approval should not be inferred from passing tests.

## Frame presentation correction

The default FIFO VSync path on this 143.9 Hz display paced the new Delta strategic scene at 77.3 FPS. A same-source VSync-disabled diagnostic reached 257.1 FPS; a tear-free mailbox diagnostic with a 120 FPS cap reached 120.3 FPS with p95 8.39 ms. Settlement-off and photo-off controls did not explain the full frame-rate difference. This supports presentation pacing as a major contributor, while not isolating every hardware/driver factor.

Final production settings now request mailbox VSync and cap rendering at 120 FPS, configurable in `data/foundation-settings.json::rendering`. Headless runs skip window-mode changes. This limits unnecessary rendering and avoids using uncapped throughput as the product FPS claim. Unsupported backends may fall back to another present mode; validation here covers the existing Windows/Vulkan development hardware. See Godot DisplayServer VSyncMode documentation: https://docs.godotengine.org/en/stable/classes/class_displayserver.html#enum-displayserver-vsyncmode . The frame-cap and reported VSync mode are included in every final capture JSON.

The final review source and primary evidence are **final3**. `foundation-final/` and `foundation-final2/` remain earlier diagnostics; their slower results are retained, not substituted into the new primary set.

## Final measured outcome

The 24 final matched captures measured **99.9?120.4 FPS**, with per-view p95 frame times **8.37?12.67 ms**, under the configured 120 FPS target. Largest recorded first-render/streaming frame: **375.2 ms**. Warm production/approach-tour maximum: **33.9 ms**. Complete tour readiness: **1.75?8.44 seconds**, including camera approach and 180 steady frames. These are current Windows/Vulkan measurements, not performance guarantees. The earlier multi-second cold first-render problem is not declared fixed.

All six final-source settlement on/off controls and all nine final-source production/approach tour stages completed. See `evidence/foundation/MEASUREMENTS.md` and `final-performance.json` for per-view GPU time, frame percentiles, memory, generation costs, readiness and all regressions. Engine FPS and process-frame intervals are measured; actual monitor scanout latency was not captured with a high-speed presentation trace.

The additional [Consentia close-up](evidence/repair-20261026/foundation-consentia3/godot-profile-consentia-inspection.png) is an **after-only** inspection at 1.2 km, using that record's supplied coordinates. It is not included among the 24 matched pairs. The town remains a temporary shared neutral asset; houses/roof colors and regular blocks are still visibly procedural. It is not an archaeological model of Consentia.

### Coordinate-check precision

The independent Node audit checks all **581 eligible input records** against the original research or protected coordinates using strict numeric equality. All **539 admitted locations** have unique serialized anchors, and all 35 approved inputs are exact. Godot's default JSON writer rounds some audit-output numbers to 15 significant digits: the largest observed difference from the source is **4.62e-14 degrees**. The audit output is therefore checked within 1e-12 degrees, while canonical input comparison remains strict. No canonical/source coordinates were rounded or rewritten. Rendering itself retains Godot's existing floating-point projection precision. See `coordinate-audit.json`.

Serial geometry validation uses the currently loaded terrain, including the context fallback outside resident detail. Representative captures and navigation exercise streamed detail. Building contact is verified at origins, not every foundation corner or a reconstructed historical urban footprint; complete river/building-footprint exclusion and steep-slope architectural authoring remain future work. No population totals are inferred from the camera-dependent building count.

### Review decision

Functional/data validation passes. The reusable visual population foundation is implemented, and frame presentation is improved on this hardware. **The full artistic goal remains incomplete:** stronger terrain geometry, authored settlement silhouettes and credible banks/settlement surroundings still require further work. The map should not be described as achieving Rome II/DEI realism. The next visual milestone should target those source/art limitations, using this stable data/placement/LOD layer, without adding faction or campaign systems.

No commit or push was made. Stop here for Nexus/Pickle/project-owner review.
