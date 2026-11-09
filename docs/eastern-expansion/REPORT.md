# Levant, then Egypt — regional geography expansion

5 November 2026. Implemented in the regular Godot campaign. [Matched Godot screenshots](REVIEW.html), [initial audit](AUDIT.md), [machine comparison](../../godot-prototype/evidence/eastern-expansion/verification.json), and [native checks](../../godot-prototype/evidence/eastern-expansion/native-validation.json).

The Levant was implemented, captured at six reference views, inspected and natively validated before Egypt implementation began. Egypt then reused the same bounded terrain adapter. No global terrain replacement, settlement additions, political-data changes, gameplay changes, commit or push is included. Visual inspection here establishes the delivered checkpoint, not owner approval or a surveyed reconstruction of 278 BCE.

## 1. Geographic features

**Levant and western Mesopotamian transition.** Source-derived relief now distinguishes Lebanon, Anti-Lebanon, the intervening valley, Syrian uplands, Jordan rift and the transition towards the Euphrates. Negative terrestrial elevations are preserved instead of clamped above sea level. Fine source coast masks replace the old coarse coastline within the footprint. Jordan river and Galilee geometry come from existing local Natural Earth files; the existing Dead Sea polygon and water level are retained. Orontes valley relief is present in the DEM; its river course is a recorded vector-data gap, not a fabricated line.

The first candidate flooded the negative-elevation rift with the ocean plane. A regional ocean exclusion fix removed that defect before Egypt work. Cyprus and the completed Anatolian footprint are excluded. Arid interior colours and existing Mediterranean/steppe/desert vegetation rules remain distinct from the coastal vegetation belt.

**Egypt and adjacent coast.** Finer terrain exposes the Nile valley sides, Eastern Desert ridges, Western Desert plateaux/escarpments and northern coastal transitions. The Nile corridor remains legible in overview, strategic, regional and closer terrain views. The Delta receives finer coastline geometry, existing sourced river courses and a broad lowland alluvial treatment. Egypt's surface yields to the already validated Levant footprint at the Sinai edge.

The fertile mask follows distance from sourced Nile/Delta rivers, local elevation relative to river terrain, and low Delta elevations. It does not trace modern crop parcels or satellite agricultural boundaries. Fayum, Kharga and Dakhla habitat patches reference the unchanged existing research IDs. Their soft radii and height limits are presentation estimates, not ancient cultivation boundaries. Siwa lies outside the new footprint and is not extended eastward or relocated.

## 2. Rendering, biomes and level of detail

The new `eastern_surface.gd` reuses the existing mesh format, campaign terrain shader/material families, original vegetation assets, deterministic placement, river ribbons, static/animated water infrastructure and per-frame bounded tile loading. Each region has a continuous 32-samples/degree backdrop and at most 24 close tiles at 128 samples/degree. Close meshes morph from their actual parent surface between 320 and 230 km, with the existing short readiness transition. CPU label and placement heights follow the corresponding source surface.

Source normals reveal actual relief; no procedural mountains or erosion channels are generated. Political ownership/geometry is unchanged. Political colour strength over these physical surfaces follows the restrained treatment used in earlier regional work, exposing terrain at strategic zoom. Egypt uses the existing alluvium, desert, mineral and sparse scenery families with the new terrain-constrained suitability raster. Its close material avoids importing the old macro land-cover colour as an agricultural map. Original river widths remain presentation estimates.

Regional bounds, Egypt's western transition, floodplain thresholds and researched oasis references are recorded in `data/eastern-regions.json`; generated manifests record actual source coverage and hashes. Egypt has a wider western blend to reduce the abrupt authoring edge. Source changes participate in scenery-cache invalidation. Existing cache scheduling, deterministic RNG, residency caps and dissolve transitions are retained; cache invalidation can still incur cold generation costs.

## 3. Sources and assumptions

* **Elevation:** existing local Egypt and Anatolia derivatives are reused first. Missing land samples are obtained from the same public Copernicus DEM COG service used by previous regional passes. Input files, URLs and SHA-256 hashes are listed in each regional manifest. Although the underlying product is GLO-30, this renderer samples it at approximately 0.7–0.9 km, with a roughly 3 km backdrop; it does **not** render a 30 m terrain mesh. [Copernicus describes the product as a modern surface model](https://dataspace.copernicus.eu/explore-data/data-collections/copernicus-contributing-missions/collections-description/COP-DEM), including surface objects rather than a reconstruction of ancient bare earth.
* **Coast and existing waters:** the unchanged local GSHHG archive, existing WDBII river subset, existing lake rings and water levels. GSHHG license copies accompany the derivatives. Modern coastlines are physical proxies; ancient harbours, lagoons and lake extents are not thereby validated.
* **Jordan/Galilee and Nile suitability:** existing local Natural Earth river and lake files. [Natural Earth documents smoothing, positional adjustment and reservoir centerlines](https://www.naturalearthdata.com/downloads/10m-physical-vectors/10m-rivers-lake-centerlines/). These are generalized modern cartographic sources, not ancient river-bank surveys.
* **Oases:** unchanged research records `r16-egy-krokodilopolis`, `r16-egy-kharga`, and `r16-egy-dakhla`, retaining their coordinate precision and source qualifications. [UCL's Fayum account](https://www.ucl.ac.uk/museums-static/digitalegypt/fayum/index.html) supports the region's Nile-fed basin character and Ptolemaic importance, without supplying an exact 278 BCE agricultural polygon.
* **Ancient Delta:** [Ullmann et al. (2020)](https://egqsj.copernicus.org/articles/69/225/2020/) documents palaeogeographical traces and limits on dating/interpretation. This pass does not infer seven dated ancient distributary geometries from modern imagery. Current Rosetta/Damietta and inherited river geometry are explicitly proxies.

Levant: 57 close descriptors, 56 available DEM sources and one recorded missing/ocean source. Egypt: 72 descriptors, 65 available sources and seven recorded missing/ocean sources. Missing tiles retain the existing world fallback. Raw shared source-edge discrepancies reach roughly 339 m at steep sampled boundaries; shared geographic vertices are reconciled before deriving the terrain. This is a resampling limitation, not evidence of ancient topography.

## 4. Files modified

Existing runtime files: `godot-prototype/northern_italy_world.gd`, `environment_rules.gd`, and `regional_scenery.gd`. The canonical renderer/material sources and previous regional terrain datasets are preserved; regional materials are derived copies.

Added runtime/data: `godot-prototype/eastern_surface.gd`, `data/eastern-regions.json`, `data/levant/`, and `data/egypt/`. These directories contain bounded meshes, height arrays, normals, land/ocean/shore masks, source manifests, license notices, hydrology supplement and Egypt's alluvium raster/rules. Cached source samples are under `data/geography/source-cache/levant/` and `egypt/`.

Added review tools: `tools/eastern-build.mjs`, `eastern-capture.gd`, `eastern-validate.gd`, and `eastern-review.mjs`. Documentation and raw capture/log evidence are under `docs/eastern-expansion/` and `godot-prototype/evidence/eastern-expansion/`. Godot may generate matching `.uid` sidecars. `verification.json` lists hash changes from the initial audit snapshot; that snapshot already included the newly created capture harness.

## 5. Validation

* Repository regression suite: **514 tests in 37 files pass**. Typecheck and build/postbuild smoke pass.
* Integrity: **460 protected files unchanged**, **35 approved anchors exact**, and **687 research records retained byte-identically**. Existing faction definitions, initial owners, settlement/research records and earlier regional source datasets are unchanged.
* Native region checks pass for close terrain versus CPU label height, actual morph-parent metadata, below-sea-level terrain, Dead Sea/Galilee exclusion masks, readiness, the 24-tile cap, release outside the region and zero footprint in the completed regional controls/Cyprus. Egypt checks also distinguish Nile/Delta/oasis suitability from Eastern Desert and reject overlap with the validated Levant.
* The existing Anatolia native streaming regression also passes: 14 close tiles, matching label/mesh heights and release outside its region.
* Matched captures record camera position, basis, FOV and clipping planes, fixed ocean time, frame samples and render timings. These are actual Godot 1920×1080 images, not mockups or tests substituted for inspection. Overview, strategic, regional and closer terrain images are reviewed, together with completed-area controls.
* New JavaScript tools pass targeted ESLint. **Full `npm run validate` does not pass:** repository-wide lint reports **66 errors in unchanged pre-existing files**, including older review/build scripts and vendored vegetation tooling. The initial run also caught an undeclared `fetch` in the new builder; that was corrected. Unrelated lint files/configuration were not changed. See `lint-final.log` and `npm-validate.log`.
* Existing raw image-loading/export warnings remain. Native runtime captures do not validate an exported package.

Initial failed captures/native probes and intermediate candidates remain as diagnostics. Published review pairs use the selected validated/final folders. The extra Levant control repeats its earlier strategic camera after Egypt integration. The overview refresh includes the final Dakhla habitat threshold; intermediate overview images are not its final evidence.

## 6. Performance and regression observations

Per-view wall/GPU measurements, draw calls, residency and final memory observations are recorded in `views.json`; comparisons are summarized in `verification.json` and the review. Timings are short uncapped hidden-window samples with VSync disabled and forced rendering, not sustained interactive FPS guarantees. Source loading, cache invalidation, shader compilation, background CPU work and OS scheduling can affect them.

Native final-check residency is 10 close Levant tiles and 8 close Egypt tiles at the reference focuses, within the 24-per-region cap. Both release their near tiles when leaving the region. The finer source grids, textures and backdrops have a memory and first-load cost. Existing global vegetation streaming/cold pipeline stalls are not claimed solved.

| View | Before GPU mean | After GPU mean |
|---|---:|---:|
| Egypt overview | 8.32 ms | 17.34 ms |
| Egypt strategic | 4.89 ms | 20.17 ms |
| Nile regional | 6.75 ms | 13.03 ms |
| Delta | 4.06 ms | 14.67 ms |
| Eastern Desert | 7.04 ms | 19.04 ms |
| Nile terrain, 8 km | 8.22 ms | 14.69 ms |

These samples show a real performance cost, not an optimization win. The former full political fill skipped much of the terrain shading that is now visible. Source meshes and regional shading add work. The final sequence reports roughly 450–487 MiB engine static memory and 1.89–1.93 GiB engine video memory; those counters are not total process working set. Close Egypt/Delta streaming reaches the 24-tile cap at wider campaign views and falls to three tiles at the 8 km Nile camera.

The first corrected Levant/control baseline briefly overlapped the abandoned failed capture before it was terminated. Its before timings are not controlled performance comparisons, even though the recorded cameras and images are valid. The later Egypt baseline was a separate clean run. No speed improvement is inferred from the older-region timing differences.

Italy, Sicily and Illyria are pixel-identical in the 1,176,000-pixel central terrain crops. Greece differs at 37 pixels above one channel level (mean difference 0.00303/255); Anatolia differs at 837 pixels (mean 0.03079/255). Inspection of the Anatolia difference image places most sparse differences around vegetation edges; exact raster/dither/wind timing causes were not isolated. Terrain data and regional masks remain unchanged. The separate post-Egypt Levant strategic image is pixel-identical to its validated pre-Egypt image across the entire frame. No performance acceptance or global optimization claim is made.

## 7. Remaining geographic limitations

Orontes river vectors are missing locally. Its valley is refined, but a defensible sourced river course remains outstanding. Exact 278 BCE Nile distributaries, floodplain extent, seasonal inundation, Delta lagoons and ancient shorelines are also missing. Existing modern river/lake geometry can include reservoir-era features; this pass is not a pre-dam terrain reconstruction. Dead Sea/Galilee water levels and polygons remain modern-source proxies.

The close Nile pair exposes an inherited intersection between the generalized river ribbon and the neutral Thebes representation. It occurs in both before and after views. Neither the protected settlement/research anchor nor the sourced river was displaced to conceal this mismatch; finer bank geometry and a separate settlement-art placement review remain necessary.

Close geology remains limited by the sampled source grid; individual cliff faces, dunes, erosion forms and fine banks are not supplied by these data. Existing vegetation and settlement assets remain stylized. Political polygons retain their existing provisional straight segments. Regional authoring transitions can still be seen in broad views adjoining unrefined areas, despite feathering; this task does not recolour the entire world to conceal that boundary. Oasis extent and vegetation density remain interpretive. Historical settlement selection/ownership gaps have not been filled with invented records.

## 8. Next regional milestone

Refine the **Marmarica–Cyrenaica coast west of the Egypt footprint** as the next bounded geographic pass, while separately resolving the Orontes vector and dated Nile/Delta hydrology gaps. Source and inspect that coastal/desert transition before any wider North African rollout. No implementation of that next area is included.
