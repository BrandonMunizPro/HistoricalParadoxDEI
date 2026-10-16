# Accurate geography and living world implementation

Implemented in the existing working tree on 2026-10-16. All changes remain uncommitted. No commits, pushes, resets, research edits, or simulation changes were made.

## Outcome

The existing Three.js campaign renderer now has a repaired inland-water rasterizer, consistent geographic mask sampling, resolution-aware terrain overlaps, terrain-following geographic markers and camera targets, a complete research export, settlement search and research inspection, improved relief/water presentation, and restrained atmospheric animation.

This is an incremental improvement to a prototype, not finished Rome II-quality art or a reconstructed 278 BCE physical atlas. The preexisting signed-height/inland-water work already prevented broad flooding in the initial screenshots. This assignment preserves that work and fixes additional defects; it does not claim credit for all prior water corrections.

## Discovery and architecture decision

The application is a Vite browser application with Three.js and plain DOM controls, not React. Its TypeScript simulation remains separate. `map/main.js` coordinates the scene; `map/terrain-tiles.js` streams local JSON terrain, limits residency to 12 tiles, caches four inactive tiles, and morphs between three levels of detail. A work queue bounds incremental mesh preparation. The world context is a 513 × 513 elevation grid with a 4097 × 4097 shoreline mask; regional tiles and Italy/Greece/Egypt detail provide closer views. Rendering units are kilometres, with a shared elevation display factor of 1.5. The fixed azimuthal equidistant origin is 13.5 E, 41.5 N.

Source assets already contain GSHHG shoreline/lake polygons, Mapzen terrain, Copernicus-derived regional detail, sourced river lines, and modern ecological textures. These assets and their attributions are retained. No runtime map service, API key, paid service, new dependency, or downloaded terrain is introduced.

Options considered:

| Option | Assessment |
| --- | --- |
| Repair the current offline Three.js pipeline | Chosen. Concrete defects were in clipping, raster indexing, sampling and data discovery. Existing terrain, camera, selection, LOD and map modes could be retained and tested. |
| MapLibre raster DEM terrain | A viable established alternative, with a documented [terrain pipeline](https://maplibre.org/maplibre-gl-js/docs/examples/3d-terrain/) and [raster DEM sources](https://maplibre.org/maplibre-style-spec/sources/). In this repository, migration would also require translating the existing projection, local geometry, material transitions and interaction contracts. It would not resolve ambiguous research or reconstruct ancient shores. Those costs were not justified by the isolated defects. |
| Rebuild higher-resolution offline assets | Useful future work for close views outside the detail areas. It does not replace the need to correct raster and mesh-boundary logic. |

Material changes use the existing Three.js extension mechanism and depth/alpha controls documented in [Material](https://threejs.org/docs/pages/Material.html). There is one renderer, not a second unfinished implementation.

## Geographic defects and disposition

| Finding | Root cause | Implemented correction and evidence |
| --- | --- | --- |
| Inland polygons could erase unrelated terrain | A concave polygon can overlap a tile while an individual scanline span lies entirely west of it. A negative end index passed to `Uint8Array.fill` is interpreted relative to the entire array. | Reject empty clipped spans before filling. A regression fixture reproduces the old failure. Raster output is also compared against point-in-polygon classification throughout Egypt, Armenia, the Caspian and the Black Sea. This fixes a demonstrable failure mechanism; it does not establish that every previously reported flooded image had this single cause. |
| Thin blue rectangular seams near the Nile Delta | The base mesh was discarded almost exactly at geographic tile bounds despite different projected mesh chords, sample resolutions and raster coverage. The resulting gaps exposed the water backdrop. | Compute overlap from projection chord error and half a source sample, retain underlying terrain there, and keep detail depth priority. The same rule applies to city windows. Seams were visible in baseline and intermediate captures and are closed in the final inspected Delta view. |
| Shorelines shifted between mesh levels | Endpoint-aligned source masks were sampled as ordinary edge-aligned texture UVs. Tile masks also used interpolated UVs while the context used inverse geographic projection. | Use inverse geographic coordinates and pixel-centre sampling consistently for both context and detail masks. Existing island holes and source polygons remain intact. |
| Markers/camera could disagree with visible relief | Research markers had a fixed source-height anchor, a large fixed lift, and no update after terrain streaming. Approved markers sampled the DEM instead of the currently drawn triangle. | A spatially indexed triangle sampler follows active LOD morph and reveal vertices. Research and approved markers and camera targets use the drawn surface; ocean and lake surfaces are distinguished from their beds. Below-sea dry terrain retains signed heights. |
| Broken river strokes at strategic scale | Thin source river lines crossed coarser terrain triangles and failed depth tests. | At strategic distances they render as cartographic river lines; local views retain depth testing. The Nile and its delta branches remain sourced geometry. This is a line-presentation policy, not a new river reconstruction. |
| Priority settlements absent from reference layer | The exporter stopped at batch 9 although batch 10 was already present. | Discover and numerically sort all numbered research batches, retain source hashes and geographic metadata, and export all 687 records. |
| Narrow local Nile escarpment window seam remains | Isolated to the join between `window-egypt-nile-escarpment` and `detail-egypt-N25E32`. It persists with all 12 tiles loaded, preparation complete and reveal transitions finished. Disabling both water layers changes the exposed strip to background, confirming an uncovered terrain join rather than an incorrectly classified inland sea. The exact clipping/edge-interpolation mismatch remains unresolved. | **Not fixed.** Reproduced at 32.57 E, 25.74 N, 9 km camera distance, approximately 0.5 rad polar angle. See the settled and no-water diagnostic captures below. The regional Delta repair must not be interpreted as closing every local terrain-window join. |

The initial working tree already contained the ocean backdrop with depth writes disabled, signed terrain heights, independent lake surfaces, and 265 source island holes. Those changes were preserved. Lake surface heights still use the preexisting modal-DEM/shore fallback estimator: they are approximate modern display datums, not verified ancient levels.

## Settlement inventory and uncertainty

The authoritative inventory is [settlement-audit.json](settlement-audit.json), generated by `npm run map:research`.

| Measure | Count |
| --- | ---: |
| Research batches discovered | 10 |
| Research records / unique research handles | 687 / 687 |
| Records with finite coordinates | 684 |
| Missing coordinate pairs | 3 |
| Located research records outside the rendering envelope | 10 |
| Existing selectable original sites | 23 |
| Existing approved geographic additions | 12 |
| Selectable approved/original sites preserved | 35 |
| Promoted research representations suppressed | 12 |
| Exact repeated name-and-coordinate representations consolidated | 2 |
| Displayable research locations after exclusions/consolidation | 660 |
| Research locations flagged disputed | 86 |
| Possible duplicate/co-location pairs retained for review | 15 |
| Available geographic anchors across the two runtime layers | 695 |

The atlas remains a separate 36-record catalogue. The 12 approved additions have their own registry and provenance; their research records must not be counted again as new historical sites. **695 available anchors is not a verified count of unique ancient settlements.** Possible aliases and co-located institutions remain unresolved.

The three missing locations are Tartessos, Rhodanousia, and the Central Asian Aornos stronghold. Ten entries east of 75 E are excluded with explicit reasons: Pataliputra, Vaishali, Rajagriha, Kaushambi, Sravasti, Ujjain, Mathura, Vidisha, Hastinapura and Ayodhya. Their coordinates and source records are preserved.

Two identical named representative points—Alexandria in Aria and Alexandria in Arachosia—are consolidated only for display. Both original research handles, combined sources, and the more cautious uncertainty are retained. Nearby homonyms, Taucheira/Tocra, Bactra/Zariaspa, Napata/Jebel Barkal, and other possible duplicates are reported separately, without a new historical identification decision.

All requested priority places already existed in batch 10: Syracuse, Messana, Alexandria, Antioch on the Orontes, Seleucia Pieria, Apamea, Tarsus, northern Black Sea Olbia, Tingis, Nea Paphos, Salamis, Kition and Amathus. They are searchable and inspectable as research references. No additional approval was fabricated.

The approved layer retains selection, inspection, IDs, original positions, map modes and neutral geographic additions. Research remains an opt-in layer, also enabled when a research search result is selected. Search covers historical names and supplied aliases and prioritizes exact matches. Clicking a research cluster zooms to its members; clicking a reference opens a clearly provisional inspector. Research actions never write simulation state.

## Presentation, atmosphere and navigation

- Water uses a broader source-depth gradient and the existing restrained animated normals. Water geometry is not displaced by the effect.
- Directional relief shading improves overhead mountain readability without increasing terrain height. Existing ecological desert, grassland and forest variation is retained.
- Broad moving cloud shadows darken terrain by at most 4.5%; they never alter land masks, water boundaries or alpha.
- Twelve small birds in three flocks use one reusable line buffer, at most 30 geometry updates per second, and one draw call. They appear only at local scale in suitable source-classified habitat. Their world anchor persists while the camera moves nearby.
- An atmosphere toggle and reduced-motion preference disable animation. Hidden documents stop the atmosphere clock. Birds are absent from continental views.
- Approved markers retain instanced rendering and now have hover/selection size and tint feedback. Research markers reuse a bounded DOM pool, update at 150 ms intervals, and cluster into at most 180 visible symbols. Labels remain zoom-dependent.
- New search and cluster navigation use eased camera travel with existing zoom limits. Camera target/clearance queries now use visible terrain or water surfaces. Existing WASD/arrows, Q/E rotation, R/F tilt, mouse pan/orbit, wheel zoom, edge scrolling, Home reset and UI-focus suppression remain operational.

Cartographic markers deliberately remain readable through terrain. Full depth-buffer occlusion of DOM research symbols is not implemented. Original prototype architectural anchors are preserved; this change improves the geographic marker layers rather than rebuilding those authored models.

## Validation

Baseline: **31 test files, 458 tests passed**, and the production map built.

Final TypeScript/lint/unit/build validation: **34 test files, 474 tests passed**. `npm run validate` passed typechecking, ESLint, tests, the simulation build and build smoke checks. `npm run map:build` passed. Its existing-style large-chunk warning remains (approximately 702 kB minified main bundle); it is not a build failure.

The 16 added tests cover raster clipping, islands, regional water classification, signed heights, projection round trips, every research batch and its source hash, priority cities, duplicate preservation, simulation-field exclusion, projected triangle sampling, animated heights and resolution-aware overlaps.

[Browser validation](evidence/after/validation.json) passes on local headless Chrome at 1440 × 1000, with no page/shader/data-loading errors. It waits for the full expected tile set and completed preparation before captures. It tests all priority names, research inspection, unchanged control state, layer toggles, bounded markers/tiles, bird visibility and reduced-motion shutdown. [Camera validation](evidence/controls/camera-controls.json) passes all nine existing control assertions.

[Settlement selection validation](evidence/selection/validation.json) passes: all 35 sites were physically selected, an empty approved-registry response retained the original 23, and research interaction left political control, architecture and building counts unchanged. The existing [Italy regression](evidence/italy-regression/metrics.json) also passes its 12 assertions, including tile eviction, mixed LOD, raycast selection, map modes, original simulation control transfer and external development snapshots. These last two tests exercise existing behavior; no new simulation behavior was introduced.

[Determinism verification](evidence/determinism.json) reran the exporter and confirmed byte-identical research output and audit files. The export command now compiles its TypeScript transformation first, avoiding stale compiled processing code.

Representative settled measurements with all research references loaded:

| View | Atmosphere | Mean FPS | p95 frame | Visible clusters | Represented references | Draw calls |
| --- | --- | ---: | ---: | ---: | ---: | ---: |
| World | Off | 143.9 | 7.1 ms | 96 | 588 | 147 |
| World | On | 143.9 | 7.1 ms | 96 | 588 | 147 |
| Greece | Off | 143.9 | 7.1 ms | 75 | 147 | 21 |
| Greece | On | 143.6 | 7.1 ms | 75 | 147 | 21 |

These short desktop samples are refresh-limited, not minimum hardware guarantees. JS heap in these samples was approximately 304–352 MiB; GPU memory was not measured. Not all 660 references appear simultaneously: off-screen/UI-covered sites and clustered references remain accessible by search.

The separate Italy regression measured approximately 1.68 GB of private memory across seven Chrome processes on an i7-11800H / RTX 3060 Laptop GPU. This is a broader browser-process measurement than JS heap and is not directly comparable to it. Memory optimization and lower-end GPU testing remain worthwhile.

During development the browser harness caught a search-order bug (`Roma` matched an alias containing `Roman` before the exact name); exact-match ranking fixed it. A missing favicon caused a console 404; an inline empty favicon removed that error. The existing selection verifier had a stale 633-reference assertion and now derives its expected count from the complete exported data. Intermediate evidence is retained and is not final acceptance evidence.

## Visual inspection and evidence

Actual screenshots were inspected, including baseline/intermediate failures and final Egypt/Delta, Armenia, Caspian, Sicily, Cyprus and settlement views. The final capture set also includes Mediterranean, Black Sea, Greece/Aegean, Red Sea and local Nile views. Screenshot evidence supports the observed views only, not every possible angle and zoom.

- [Nile Delta after](evidence/after/nile-delta.png), [baseline regional Delta](evidence/before/nile-delta-regional.png)
- [Egypt](evidence/after/egypt.png), [Armenia](evidence/after/armenia.png), [Caspian](evidence/after/caspian.png)
- [Mediterranean](evidence/after/mediterranean.png), [Black Sea](evidence/after/black-sea.png)
- [Sicily](evidence/after/sicily.png), [Greece and Aegean](evidence/after/greece-aegean.png), [Cyprus](evidence/after/cyprus.png)
- [Syracuse research inspector](evidence/after/syracuse-research.png), [registry at world scale](evidence/after/registry-world.png)
- [Local atmosphere view](evidence/after/local-atmosphere.png). Birds are deliberately small; animation and reduced-motion behavior are additionally checked through runtime diagnostics.

Additional [angled capture diagnostics](evidence/angled/captures.json) cover nine Egypt/Red Sea/Caspian views without browser errors. The legacy capture script can capture during the final reveal animation, so a separate local reproduction explicitly waited for all 12 tiles, zero preparation jobs and zero revealing tiles. The [settled local Nile seam](evidence/angled/nile-local-settled.png), [water-disabled isolation](evidence/angled/nile-local-no-water.png) and [camera/tile state](evidence/angled/nile-local-settled.json) document the remaining defect. The no-water view is diagnostic evidence only; water is enabled in the normal application.

## Exact implementation files

Modified during this assignment (many already had uncommitted work at discovery):

```text
eslint.config.js
index.html
package.json
map/main.js
map/terrain-tiles.js
map/regional-material.js
map/inland-water.js
map/approved-site-markers.js
map/research-layer.js
map/style.css
src/presentation/inland-water.ts
src/presentation/research-markers.ts
scripts/build-research-markers.mjs
scripts/verify-approved-sites.mjs
public/data/research-locations.json
```

Created implementation and test files:

```text
map/living-world.js
src/presentation/terrain-surface.ts
scripts/verify-living-world.mjs
tests/living-world-water.test.ts
tests/living-world-registry.test.ts
tests/living-world-surface.test.ts
```

Created documentation/data evidence is under `docs/living-world/`: this report, `settlement-audit.json`, `preservation.json`, `files.json`, and the exact screenshot/JSON paths enumerated in `files.json`. Ignored build outputs `dist/`, `dist-map/` and task scratch files under `.runtime/living-world/` were also generated. Preexisting changes in README files, settlement-assets, simulation-related research and other verification scripts were not overwritten or included as new work.

[Preservation evidence](preservation.json) compares against hashes captured before implementation: **416 protected research, registry and geographic asset files are unchanged; none of the captured files is missing.** The research export is the intentional derived-data exception. The original research catalogues, approved registry and terrain assets are unchanged.

## Remaining limitations and next steps

1. Physical terrain, vegetation evidence, coastlines, reservoirs and canals are modern-source approximations. For example, the modern Suez/Aswan-area features are not a claim about 278 BCE. A reviewed historical hydrography layer is future work; no speculative ancient shoreline was invented here.
2. Close views outside the established detail areas remain coarse. Cyprus, the Caucasus and much of the wider world need higher-resolution offline terrain and shore masks for city-scale inspection.
3. Lake datums remain estimates and some polygon/coast discrepancies reflect different modern datasets. Regional screenshots show no obvious broad flooding, but this is not a comprehensive ancient hydrological validation.
4. Resolve the 15 reported possible duplicate pairs and missing locations through research review. Promote additional sites only through the existing approval pipeline. The new research display does not authorize gameplay integration.
5. Continue performance testing on lower-end GPUs and long navigation sessions. The current measurements cover one desktop browser; source texture loading and regional streaming remain significant parts of startup/memory use.
6. Further art work can improve local terrain texture resolution and authored vegetation without changing geography or simulation authority. No faction, economy, population, character or military systems were added.
7. Close the isolated local Nile escarpment window join by reconciling parent/child projected edges and clipping with their drawn surfaces. This remaining seam is visible in the evidence above; the map should not yet be described as artifact-free at every close angle.
