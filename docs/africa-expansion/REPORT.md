# Africa campaign geography

This pass extends the existing regional renderer across African continental land inside the current campaign bounds (12° W–45° E, 12° N and northward). It does not extend the world into central or southern Africa. Libya was implemented and visually checked first, followed by the Maghreb, Sahara/Sahel and Nubian/Red Sea transition. Earlier Mediterranean refinements remain in place.

[Open the matched-camera Godot review](REVIEW.html). Full-resolution before/final images, camera transforms, native results and diagnostics are in `godot-prototype/evidence/africa-expansion/`. The incomplete `after` folder and named diagnostic folders are development evidence; `final` is the delivered image set.

## Geographic improvements

* Libya: Jebel Akhdar, Nafusa, coastal plains, Fezzan relief and desert transitions; Siwa habitat uses the existing researched coordinate.
* Maghreb: Tunisian coast and Cape Bon, Algerian coastal mountains, Rif and Atlas relief, and their dry interior transition. Marine masks exclude the previously refined European regions and Iberia.
* Sahara: actual sampled relief rather than a flat surface, with distinct Ahaggar, Tibesti and Haruj mineral shading. These tints do not add elevations or imply dated volcanic activity.
* Sahel and Niger bend: retain inherited climatic gradients and water geometry, while preventing the old fertile-plain rule from making arid terrain broadly green.
* Nubia and African Red Sea coast: continuous inherited Nile corridor, source relief, escarpments and northern Ethiopian highlands. The inherited modern Lake Nasser surface is suppressed; the existing Nile line remains.

No settlement, research coordinate, ownership, character or gameplay data was added or moved. Political colour overlays remain part of the existing presentation.

## Rendering and integration

Seven data-driven regional sections reuse `eastern_surface.gd`, its existing far/near meshes, materials, scenery integration and 24-tile per-section limit. The Egypt adapter registers the extensions through the existing dynamic surface collection, so WS2's host files need no edits. Shared scopes blend across authoring boundaries and exclude earlier geographic regions.

Climate suitability reduces fertility only as existing aridity increases. Siwa uses a soft, terrain-constrained habitat mask, not an ancient agricultural polygon. Snow is suppressed at tropical desert/highland latitudes. Existing vegetation assets, deterministic placement, density controls and scenery streaming budgets are retained. New physical-data hashes invalidate stale scenery placements; OpenCode should measure WS2 against this completed baseline.

Terrain descriptor selection is cached while focus and distance are stationary. Bounding-box rejection avoids redundant geographic-mask calculations. From 700–1200 km the material fades into a cheaper response using the same texture-family mip averages, source normals, climate, political palette and geometry. At 1200 km the far mesh uses that material directly. Close terrain retains the existing detailed material. Backdrops remain visible through 30,000 km; close tiles unload at distant zoom.

## Sources and assumptions

Elevation derives from existing local samples where available and the same [Copernicus DEM](https://dataspace.copernicus.eu/explore-data/data-collections/copernicus-contributing-missions/collections-description/COP-DEM) service used in previous passes. This is a modern surface model, not reconstructed ancient bare earth. Close meshes sample 128 intervals per degree (approximately 0.7–0.9 km); backdrops use 32. Source URLs, hashes, missing tiles, reconciled shared edges and licences are recorded in each section's manifest. Missing samples retain the existing world fallback.

Coastlines and rivers reuse the local GSHHG/WDBII and Natural Earth sources. Modern shorelines, wetlands and lake extents remain physical proxies. No modern agricultural boundary dataset is imported.

| Section | Close descriptors | Missing/ocean source entries using fallback |
| --- | ---: | ---: |
| Cyrenaica | 79 | 19 |
| Tripolitania | 99 | 8 |
| Eastern Maghreb | 130 | 7 |
| Western Maghreb | 120 | 24 |
| Western Sahara/Sahel | 376 | 0 |
| Central Sahara/Sahel | 248 | 0 |
| Nubia/Red Sea | 183 | 5 |

Geographic interpretation was checked against [USGS's Libya geology](https://pubs.usgs.gov/pp/0660/report.pdf), [NASA's Fezzan imagery](https://science.nasa.gov/earth/earth-observatory/otherworldly-earth-149253/), [USGS African bioclimatic regions](https://www.usgs.gov/centers/eros/science/bioclimatic-regions-map), [NASA's Tibesti description](https://science.nasa.gov/earth/earth-observatory/the-saharas-diverse-landscape-1940/), [NASA's Haruj imagery](https://science.nasa.gov/earth/earth-observatory/haruj-volcanic-field-87939/) and [UNEP's African mountain atlas](https://na.unep.net/siouxfalls/publications/Africa_Mountains_Atlas.pdf). These support broad physical character, not precise 278 BCE habitat boundaries.

[NASA dates construction of the Aswan High Dam to 1960–1970](https://science.nasa.gov/earth/earth-observatory/aswan-high-dam-85992/). The derived Nubian land mask fills that modern reservoir hole, and a bounded water mask suppresses its inherited lake surface. Original source files remain unchanged. **Pre-dam valley elevations and bank geometry are unavailable:** the modern DEM beneath the suppressed reservoir remains a flat proxy. This pass does not fabricate submerged ancient relief.

## Files

Existing runtime edits: `eastern_surface.gd`, `environment_rules.gd`. Existing validation edit: `tools/zoom-continuity-validate.gd` accepts additional regional backdrops.

New runtime/config: `africa_regions.gd`, `africa_overview.gdshaderinc`, `data/africa-regions.json`, and seven `data/africa_*/` derivative directories. These contain 1,235 close mesh descriptors, backdrops, height/normal/coast/habitat rasters, manifests and provenance. Source download cache: `data/geography/source-cache/africa/`.

New tools: `africa-build.mjs`, `africa-hydrology.mjs`, `africa-capture.gd`, `africa-validate.gd`, `africa-zoom-validate.gd`, `africa-water-diagnostic.gd`, `africa-report.mjs`. Review documentation and evidence accompany them. No commits or pushes were performed.

## Validation and performance

* TypeScript: 514 tests across 37 files pass; type checking and production build pass.
* Targeted new data tools pass ESLint. Repository-wide lint still reports 66 existing errors; it is not a passing check.
* Actual Godot: all seven regions pass source-height/mesh agreement, morph-parent agreement, bounded residency, preserved-region exclusions, distant visibility and close-tile release. All ten regional backdrops pass 3290, 3310, 8500 and 30,000 km checks with zero close regional tiles.
* Existing raw-image loading produces export warnings. These are recorded; this validates the editor/runtime prototype, not a packaged export.

All 35 before/final views have exactly matching camera transforms and were inspected as five contact sheets, with close images checked at full resolution. The final capture contains no script or shader errors. In the 1,176,000-pixel central comparison crop, Italy and Sicily have no channel changes above one intensity unit; Illyria is identical. Egypt/Levant have two/one pixels above that threshold. Greece has 37 and Anatolia 837 (0.071%) scattered changed pixels; their terrain coverage and layout remain visually unchanged. Exact differences are retained in `controls.json`; these controls are not claimed to be universally pixel-identical. All six WS2/shared-file hashes match the starting snapshot, and all 460 protected source files, 35 canonical settlement anchors and 687 research records pass integrity checks.

The larger terrain coverage has a measurable cost. Short hidden-window captures use 30 uncapped submitted wall intervals per settled view, not a sustained FPS benchmark. Initial full-material diagnostics were too expensive; mask rejection and the blended far material reduced an Africa overview diagnostic from roughly 80 ms GPU to 27 ms. Those development runs were not controlled WS2 measurements. An isolated three-view check recorded approximately 26 ms GPU at world overview and 20 ms at Maghreb overview. Memory was about 1.0 GiB engine static / 2.9 GiB video, compared with about 0.45 / 1.9 GiB before Africa. Do not interpret this expansion as performance-neutral or a 60 FPS guarantee. Exact before/final samples are retained in the view JSON files; GPU queries may repeat stale values in hidden-window runs.

The first seven-region native sweep recorded 49–112 seconds of close-view readiness under concurrent capture load before the final selection/mask optimizations. It establishes correctness, not interactive transition performance. WS2 remains independently responsible for hidden scenery and settlement generation.

Final capture wall-interval samples (30 frames each, milliseconds; additional geography is active after the change):

| View | Before mean | Final mean |
| --- | ---: | ---: |
| World, 8500 km | 18.53 | 32.36 |
| Africa, 6000 km | 24.77 | 39.43 |
| Libya, 1700 km | 14.85 | 26.78 |

These short samples show the additional cost and timing variability. They are not OpenCode's controlled 170/200/250/520 km WS2 benchmark.

## Remaining limits and next milestone

Ancient coastlines, seasonal water, Lake Chad extent, dated Sahel vegetation, oasis extents and pre-reservoir Nubian topography need specialist reconstruction. Current terrain samples cannot resolve small cliffs, channels or harbour structures. Existing generalized rivers and vegetation assets remain; the northern Ethiopian edge has no bespoke tropical biome assets. Land south of 12° N is outside this campaign and was not added.

The next regional milestone should be Iberia, with the same source audit, zoom continuity and matched-image controls. A separate renderer profiling pass can address Africa's additional memory and draw cost without reducing geographic detail.
