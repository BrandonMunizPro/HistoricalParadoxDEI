# Hispania regional geography

Hispania now reuses the campaign's established regional terrain system: source-sampled relief, detailed coastal masks, continuous distant backdrops and bounded close terrain. The scope covers the Iberian Peninsula, a soft Pyrenean transition and the Balearic islands. It does not change political ownership or expand historical settlement data.

[Matched Godot screenshot review](REVIEW.html). Full-resolution images, camera transforms and validation evidence are in `godot-prototype/evidence/hispania-expansion/`. The `before` and `final` directories are the delivered comparison; named diagnostic directories retain intermediate evidence.

## Audit and geographic changes

Earlier work supplied generalized world elevation, ecology, rivers, settlement anchors and close scenery. Hispania still displayed coarse relief and solid political fill at strategic zoom. The approved Mediterranean and African terrain derivatives were already present and have been retained.

This pass improves the Atlantic coast and Galician rias, Cantabrian range and Picos, Pyrenees, Meseta, Sistema Central/Gredos, Iberian and coastal ranges, Ebro basin, Betic ranges and Sierra Nevada, Guadalquivir lowlands, Portuguese Atlantic coast and Strait of Gibraltar. The Balearic land masks and source relief use the same bounded derivative. Existing river lines remain geographic proxies; no ancient river banks or delta geometries have been invented.

The climate presentation retains the wetter Atlantic north and coastal vegetation. Soft suitability adjustments reduce the excessive inherited fertility across the Meseta, Ebro dry basin and southeast. They represent broad climatic character, not mapped 278 BCE forests, farms or grazing boundaries. Existing vegetation models, random seeds, density controls, tile budgets and scenery generation policies remain in use.

Four inherited water polygons correspond to modern reservoirs: Alcántara, Cíjara, Mequinenza and Ricobayo. The derived land mask fills those holes, and a bounded shader mask suppresses their lake surfaces. Original source polygons and river vectors are unchanged. **Pre-dam elevations remain unavailable:** modern DEM surfaces under those reservoirs have not been replaced with invented ancient valleys.

## Renderer and regional boundaries

`hispania-region.json` holds the physical extent, soft northern/southern transition curves, climate parameters and reservoir provenance. The renderer registers Hispania through the same dynamic adapter used for Africa. The southern mask excludes Morocco; the northern blend includes the Pyrenean terrain buffer without creating a political border.

Hispania shares the existing 128-sample-per-degree close meshes, 32-sample-per-degree backdrop, morphing, 24-close-tile per-region cap, selection cache and land/water integration. Detailed materials fade into the existing inexpensive overview response from 700–1200 km, retaining geometry and source normals. The new backdrop stays visible at full zoom-out, while close tiles release above their existing prefetch distance.

CPU vegetation suitability and GPU material suitability use the same data-defined climate zones. Cache signatures include Hispania's physical inputs and configuration, so old terrain placements cannot silently persist. OpenCode should establish WS2 performance baselines with this completed geography in place.

## Sources and assumptions

* [Copernicus DEM](https://dataspace.copernicus.eu/explore-data/data-collections/copernicus-contributing-missions/collections-description/COP-DEM): modern DSM obtained through the same public COG service as earlier regions. Rendered close spacing is roughly 0.7–0.9 km, not 30 m; the backdrop is roughly 3 km. The manifest records 145 source/close descriptors, with 117 available elevation tiles and 28 missing/ocean entries retaining world fallback. Source hashes, URLs, shared-edge reconciliation and coastline licences accompany the derivative.
* Existing local GSHHG coastline/lake archive, WDBII river geometry and global ecology raster. Coastlines, wetlands and deltas are modern physical proxies. No modern agricultural boundary dataset is imported.
* [IGN's relief account](https://educativo.ign.es/atlas-didactico/relieve-bach/caractersticas_del_relieve_espaol.html) and [Meseta description](https://educativo.ign.es/atlas-didactico/relieve-bach/la_meseta.html) support the plateau-and-range structure. [MITECO's vegetation atlas](https://www.miteco.gob.es/content/dam/miteco/es/biodiversidad/publicaciones/especies/intro_paisaje_vegetal_tcm30-99894.pdf) supports broad Atlantic/Mediterranean and semiarid habitat distinctions. These are geographic references, not proof of precise ancient vegetation extents.
* Modern reservoir evidence: [CEDEX Alcántara series](https://ceh.cedex.es/anuarioaforos/afo/embalse-datos.asp?ref_ceh=3019), [CEDEX Cíjara series](https://ceh.cedex.es/AnuarioAforos/afo/embalse-datos_anual.asp?ref_ceh=4002), [Ebro authority's Mequinenza report](https://www.chebro.es/documents/20121/48992/Informe_Final_Embalse_de_Mequinenza_1996.pdf/e53f501d-7713-45de-5d2f-4bbd4e326955), and [Iberdrola's Ricobayo history](https://www.iberdrola.com/about-us/power/hydroelectric-power/ricobayo-hydroelectric-power-station). Their present water bodies are incompatible with the campaign date; suppression does not reconstruct their pre-dam topography.

## Changed files

Existing runtime integration: `godot-prototype/eastern_surface.gd`. No WS2 scenery, population, political-map, world, host-world or navigation-validator files were edited. Africa's configuration, elevation files and renderer helper remain unchanged.

New runtime/data: `hispania_regions.gd`, `data/hispania-region.json`, `data/hispania/` meshes, rasters, provenance, hydrology metadata and licence copies. Download cache: `data/geography/source-cache/hispania/`.

New tools: `hispania-build.mjs`, `hispania-hydrology.mjs`, `hispania-data-validate.mjs`, `hispania-capture.gd`, `hispania-validate.gd`, `hispania-zoom-validate.gd`, `hispania-report.mjs`. Review documentation and evidence are retained. No commits or pushes.

## Validation

* 514 TypeScript tests across 37 files pass; type checking and production build pass.
* Targeted new JavaScript tools pass ESLint. Full repository lint retains 66 existing errors.
* Source checks verify finite height grids, mainland/Mallorca land, open strait, four reservoir exclusions and recognizable mountain relief: Picos ~2390 m, Pyrenees ~3059 m, Gredos ~2427 m and Sierra Nevada ~3291 m maximum within the sampled diagnostic windows. These are sample-window checks, not assertions of exact summit elevations.
* Native Godot checks cover CPU/source/mesh height agreement, morph-parent agreement, preserved-region exclusions, bounded close residency, tile release and full-zoom visibility.

All 27 before/final cameras match exactly. Four comparison sheets were visually inspected, with Sierra Nevada also inspected at full resolution; the final GPU capture has no script or shader errors. Within the central 1,176,000-pixel comparison crop, Libya, Egypt, Levant, Italy, Sicily and Illyria are pixel-identical. Maghreb has 177 pixels changed by more than one channel intensity unit, Greece 37 and Anatolia 837 (at most 0.071%); their terrain layout and coverage remain visually unchanged. `controls.json` retains exact measurements rather than claiming every view is pixel-identical.

Integrity checks verify all 460 protected source files, all 35 canonical settlement anchors and the byte-identical 687-record research copy. The six WS2/shared file hashes match the starting snapshot. No ownership, character or settlement records were expanded.

Short hidden-window captures record 30 uncapped submitted wall intervals per settled view. They are visual evidence and indicative timings, not sustained FPS or WS2's controlled 170/200/250/520 km benchmark. Additional resident height/normal/coast resources have a memory and rendering cost. GPU query samples can repeat stale values in this capture mode.

Existing raw-image loading warnings remain an export limitation. These checks validate the native prototype, not a packaged export.

The final native sweep checked nine resident close tiles and six mesh/CPU height samples, then verified release at world zoom. Close-view readiness was 37.2 seconds in that run; hidden scenery generation remains WS2's separate work. All eleven regional backdrops passed 3290, 3310, 8500 and 30,000 km with zero close regional tiles.

Indicative capture measurements:

| View | Before mean wall interval | Final mean wall interval |
| --- | ---: | ---: |
| World, 8500 km | 26.10 ms | 35.30 ms |
| Hispania, 1800 km | 13.30 ms | 24.10 ms |
| Hispania, 520 km | 9.70 ms | 21.89 ms |

At world view, engine static memory increased from approximately 1016 to 1101 MiB and video memory from 2924 to 3069 MiB. The final native sweep ran concurrently with the early screenshots, so these wall intervals include possible CPU contention. They do not establish an isolated rendering regression rate or interactive FPS. Raw samples and stage timings are preserved for further profiling.

## Remaining limits and next milestone

Ancient Ebro/Guadalquivir/Tagus estuaries, dated forest clearance, seasonal river flow, exact ancient shorelines and submerged pre-dam relief require further research. Generalized rivers and sub-kilometre samples cannot resolve every inlet, cliff or gorge. No modern field patterns, new settlement anchors or political claims were added.

Southern Gaul is the next contiguous regional milestone: connect the Pyrenean transition through the Rhône and southern Alpine approaches while preserving the existing Italy and Hispania work. A separate profiling pass should address accumulated resource cost without reducing geographic detail or overlapping WS2's hidden-generation work.
