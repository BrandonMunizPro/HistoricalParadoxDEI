# VS5 Italian terrain calibration and settlement reconstruction

Status: functioning presentation prototype, 14 October 2026. This is not completed production VS5 or a claim of premium final art. Three.js and the authoritative TypeScript simulation remain in place. No VS4 tables or character behavior were changed; the atlas still has 23 active sites and their existing canonical identities.

## Run and reproduce

Node 22+ and a WebGL2 browser are required.

```sh
npm install
npm run map:dev
```

The checked-in geographic derivatives run offline after installation. Use the four view buttons for Rome, Capua, Neapolis, and the peninsula; drag to orbit, right-drag to pan, and scroll to zoom. Geographic and political buttons use the same underlying places.

```sh
npm run map:terrain              # regenerate bounded physical terrain; network on first import
npm run map:validate:geography   # independent-product/locality checks; network if uncached
npm run validate                # typecheck, lint, tests, authoritative simulation build
npm run map:build
npm run map:preview             # production build, normally http://127.0.0.1:4173
npm run map:verify:italy         # Chrome/Playwright production evidence
```

`map:terrain` obtains the 149 MB GSHHG shapefile source archive and bounded Copernicus COG range reads. Import-only dependencies are `geotiff`, `shapefile`, and `fflate`; they are absent from the browser bundle. Raw source files and derived source sample caches live in ignored `data/geography/source-cache/`. Cached imports are deterministic; regeneration from mutable remote endpoints should be reviewed against the manifest hashes. Full COG files are not downloaded or hashed: recorded COG hashes identify the derived tile payload, not entire upstream raster objects.

The old `map:import`, original crop, and earlier evidence are retained as a baseline. `map:verify` is the older crop/atlas verifier; use `map:verify:italy` for this renderer.

## Geographic extent and coordinates

The proposed campaign envelope remains **12° W–75° E, 12° N–62° N, provisional**. This work neither validates exact Rome II boundaries nor promotes that rectangle to a simulation coordinate decision. No georeferenced campaign reference or concept artwork was available in this workspace for direct calibration. The prior [world scope report](world-scope-and-settlement-atlas.md) remains the scope proposal.

The physical terrain catalog covers land-bearing one-degree cells within **9°–20° E, 36°–46° N**: 85 regional tiles, plus three small city windows. This includes the Italian peninsula and Sicily. A deliberately coarse context surface covers **5° W–30° E, 30°–55° N**, allowing France, the Alps, the Balkans and surrounding land to continue beyond the detailed area. That context is a backdrop, not the campaign envelope. Terrain ends are not authored as coastlines or walls around an isolated island.

Sources use WGS84 longitude/latitude degrees. The renderer uses the existing spherical azimuthal equidistant projection with fixed origin **13.5° E, 41.5° N**, east as +X and north as −Z, and kilometres as render units. This origin is independent of the current dataset bounds. Latitude/longitude remain double precision outside the GPU. Copernicus heights use metres above the EGM2008 geoid. Rendering applies **3× vertical exaggeration** and a 2 m land floor for sea separation; these presentation choices do not change source elevations, movement costs or simulation geography. The spherical projection has increasing transverse distortion away from the origin; a future Mediterranean renderer still needs camera-relative/floating origins and a formally approved world-coordinate decision.

### Physical sources and resolution

| Layer | Implemented source | Effective prototype resolution and rights |
|---|---|---|
| Italian elevation | [Copernicus GLO-30 public COGs](https://registry.opendata.aws/copernicus-dem/) | Nominal source 30 m DSM, resampled to 129 vertices per degree: approximately 650–870 m. Three city windows have approximately 39–52 m spacing. |
| Height meaning | [Copernicus collection description](https://dataspace.copernicus.eu/explore-data/data-collections/copernicus-contributing-missions/collections-description/COP-DEM) | Modern surface model includes buildings and vegetation; it is not bare-earth archaeological terrain. Required attribution is bundled in `public/data/italy-terrain/ATTRIBUTION.txt`. |
| Coastlines and lakes | [GSHHG 2.3.7, high resolution](https://www.soest.hawaii.edu/pwessel/gshhg/) | NOAA/University of Hawaii source compilation; high resolution is a reduction of the original vectors, not a promised fixed metre accuracy. Shore masks: 513 samples per degree, about 150–220 m; coarse context mask: 2049 samples over its whole extent. LGPL v3-or-later notices and base license are bundled. |
| Rivers | GSHHG WDBII high-resolution classes 1–5 | Modern generalized vectors; better network coverage than the old single Tiber feature, but insufficient for close-range crossings or ancient channel research. No modern political borders are imported. |
| Context elevation | [Mapzen Terrain Tiles](https://github.com/tilezen/joerd/blob/master/docs/attribution.md), Terrarium z5 | A 513² context grid, approximately 4–7 km spacing. Italian context heights are sampled from the regional Copernicus derivatives. Source-specific Mapzen attribution continues to apply. |
| Settlement locations | Existing Pleiades atlas; independent [GeoNames](https://download.geonames.org/export/dump/readme.txt) locality comparison | Original atlas coordinates and IDs retained; Pleiades CC BY 3.0 notices retained. GeoNames CC BY 4.0; only three modern locality coordinates are used for QA, never population or ownership. |

[HydroRIVERS](https://www.hydrosheds.org/products/hydrorivers) was evaluated and downloaded into the research cache, **not shipped or rendered**. Its [HydroSHEDS license](https://data.hydrosheds.org/file/technical-documentation/HydroSHEDS_TechDoc_v1_4.pdf), Appendix A, adds conditions on redistribution and end-user agreements. The prototype uses the GSHHG river compilation instead. A higher-resolution hydrology layer remains future work.

GSHHG source: <https://www.soest.hawaii.edu/pwessel/gshhg/gshhg-shp-2.3.7.zip>. The importer clips/resamples the physical data and produces land masks; those coastline/rivers derivatives retain LGPL rights. Source link, notices, `COPYING.LESSERv3` and `COPYINGv3` accompany the build. Those licenses do not relicense the Copernicus height fields or the game code. Copernicus usage terms: [official license](https://documentation.dataspace.copernicus.eu/APIs/SentinelHub/Data/DEM/resources/license/License-COPDEM-30.pdf). No mod/game artwork, map mesh or settlement database was copied.

### Sampling and validation

The importer explicitly converts resampled pixel-center rasters to a geographic vertex lattice. Degree-border contributions are averaged once and assigned identically to both neighbors. Shared coast masks are sampled at identical geographic positions. Source and derived hashes, bounds, output resolutions and URLs are in [the terrain manifest](../../public/data/italy-terrain/manifest.json).

`data/geography/italy-validation.json` records the independent checks. Pleiades-to-GeoNames modern locality offsets are Rome **1,676 m**, ancient Capua/Santa Maria Capua Vetere **571 m**, and Neapolis/Naples **1,864 m**. These are locality sanity checks, **not evidence of exact ancient urban centers**. In particular, ancient Capua is not placed at the later modern Capua.

Copernicus versus separately sampled Mapzen z8 elevations differ by **−313 m at the Gran Sasso sample**, **−5 m on the Campanian plain**, and **+33 m in the Alban hills**. The products have different resolutions and may share upstream lineage; this does not establish surveyed vertical accuracy. Regional samples smooth mountain summits. They do establish that the mountain spine and low plain come from geographic data, rather than a fabricated ridge.

Tests validate every tile's finite values and mask dimensions, every adjacent regional border, full triangle coverage and consistent winding at all three LODs, retained perimeter samples, projection/atlas invariants, and the independent QA record. Ancient river migration, wetlands, drained basins, alluvial growth, modern reclaimed harbors and the 278 BCE shoreline are **not reconstructed**. Modern coast masks must not become ancient navigation or tactical crossing truth.

## Tiling, rendering and simulation boundaries

`map/terrain-tiles.js` streams local JSON files with at most three requests in flight. It retains **12 tiles**, including the three city windows, and disposes evicted terrain geometries, shore textures and materials. Six fixed startup samples support asset placement; they are separate from the streaming residency count. Tile LOD uses strides 1, 2 and 4, preserving the complete 129-sample perimeter at every level. Boundary fans avoid mixed-LOD T-junction cracks. All terrain textures use common projected coordinates, not per-tile restarted UVs. Normal derivatives use a common geographic sampler. Shore masks clip the terrain surface independently of elevation-mesh LOD.

Unloaded outer edges blend to the coarse context through a small transition band. City windows similarly blend their outer 16 cells to regional elevation. These are rendering approximations; source samples remain separately available. The prototype is bounded streaming, not a production quadtree scheduler: tile priority follows the camera target, all three mesh LODs are created for each resident tile, and context relief/material transitions are still visible. Frustum culling operates on meshes and instanced batches; future work should add screen-error selection, tighter per-tile vegetation batches and background mesh generation.

City-scale cameras use a short near plane; strategic views increase it dynamically to preserve coastline depth precision. Close views use localized sun shadows. Distant city silhouettes and house/roof/column/door batches are instanced; small decorative olive-type trees and terrain-following fields are reconstruction, not vegetation or landholding records. Zoom-dependent labels retain collision rejection and UI exclusion.

The [Big Pickle geography integration contract](../architecture/geography-integration-requirements.md), particularly §10, still governs promotion beyond the prototype. This work adds external-data validation in `src/infrastructure/terrain-tile.ts` and pure render topology in `src/presentation/terrain-topology.ts`. It does not change canonical identity, character, government, economy, population, movement-duration, persistence or campaign scheduling systems. Faction colors continue to come from `CampaignMapState`; transfer preserves settlement UUIDs. Nearest-settlement political influence is a **scenario visualization**, not attested territorial boundaries. Settlements with unresearched control retain that status. Source coastlines never imply political borders.

Future tactical generation should query geographic coordinates, unexaggerated height/gradient, land/water, feature provenance and uncertainty, local roads, vegetation interpretation and settlement references through an infrastructure/application adapter. Do not read GPU geometry or treat decorative trees, schematic roads or a resampled summit as authoritative battle terrain. Existing AD-19/AD-20 decisions and saved-campaign repository/migration gates remain open.

## Settlement evidence and reconstruction

[Machine-readable presentation profiles](../../public/data/settlement-presentation.json) separate sources, verified feature classes, artistic choices and excluded anachronisms. They do not replace atlas records or imply building populations.

| Place | Supported period/context | Visual reconstruction and limits |
|---|---|---|
| Rome | [Municipal archaeology](https://museovirtualedellemura.romasitounesco.it/en/mura-serviane-english-version/) supports a fourth-century defensive circuit; [archaeological research](https://pure.au.dk/ws/files/283891126/j.jua.5.126596.pdf) discusses archaic/Republican temples. | Uneven neighborhoods, courtyard houses, partial irregular defenses and an unnamed Italic temple archetype. Their exact footprint, gates, hill assignments and road courses are not surveyed. No Colosseum, Imperial fora, Aurelian walls or Imperial palaces. |
| Capua | [Italian Ministry of Culture](https://reggiadicaserta.cultura.gov.it/en/discover-the-complex/the-archaeological-circuit-of-ancient-capua/) identifies the ancient city and its Etruscan/Samnite/Republican phases. | Low-rise Campanian courtyard development and fields. No speculative complete enclosure or named temple plan; no surviving Imperial amphitheater or second-century CE Mithraeum. |
| Neapolis | [UNESCO](https://whc.unesco.org/en/list/726/) documents Greek origins, rectangular street pattern and Greek defensive remains. | Rectangular courtyard neighborhoods, partial defenses and an unnamed Greek sanctuary archetype. Streets, plot dimensions, defenses and sanctuary position are schematic. No claimed ancient harbor reconstruction, later theater or medieval castle. |

Neapolis's Pleiades representative point refers to the wider Naples/Parthenope area. Its renderer uses a **provisional Greek-core anchor at 14.257° E, 40.852° N, uncertainty 1 km**, recorded separately in the presentation profile and panel. The atlas location, stable ID and simulation control were not overwritten. This anchor needs a surveyed archaeological urban-boundary source before being promoted into authoritative geography.

Model density and house variation are visual choices. They neither estimate population nor assert an exact 278 BCE street plan. Detail is physical-scale close to the city; distant views use enlarged silhouettes for readability. Procedural visual assets are original game code, not reused mod assets.

## Evidence and performance

The production Chrome verifier writes [environment, per-view metrics and assertions](terrain-evidence/metrics.json). Required screenshots:

- [Central Italy, geographic](terrain-evidence/central-italy-geographic.png)
- [Wider peninsula and connected terrain](terrain-evidence/peninsula-connected-tiles.png)
- [Rome, intermediate](terrain-evidence/rome-intermediate.png)
- [Capua, intermediate](terrain-evidence/capua-intermediate.png)
- [Neapolis, close](terrain-evidence/neapolis-close.png)
- [Political mode](terrain-evidence/central-italy-political.png)
- [Control transfer](terrain-evidence/political-control-transfer.png)

The test environment is Windows, i7-11800H, 16 GB RAM, RTX 3060 Laptop GPU, headless Chrome 155, 1440×1000. Each idle-view sample lasts 3.5 seconds after streaming settles. The measured run is refresh-limited around 144 FPS; see the JSON for p95 frame time, JS heap, process memory, draw calls and triangle counts by view. JS heap is not total memory. CDP-owned Chrome process private bytes and working sets are recorded separately; working-set sums may count shared pages more than once and exclude VRAM. These are short presentation checks, not full-campaign or low-end-hardware performance claims.

`npm run validate` passes **342 tests in 22 files**, typecheck, lint and simulation build. `map:build` passes with Vite's existing >500 kB bundle-size advisory. Production-browser checks cover site focus, canvas selection, both modes, control transfer retaining identity, collision-free labels, mixed terrain LOD, tile eviction and absence of missing geographic assets/browser errors.

Final measured idle views (same environment, refresh limited):

| View | Mean FPS | p95 frame | JS heap | Draws | Triangles |
|---|---:|---:|---:|---:|---:|
| Central Italy | 143.9 | 7.1 ms | 131 MiB | 147 | 846,035 |
| Peninsula | 143.9 | 7.1 ms | 136 MiB | 383 | 294,063 |
| Rome intermediate | 143.9 | 7.1 ms | 126 MiB | 22 | 964,684 |
| Neapolis close | 143.9 | 7.0 ms | 142 MiB | 23 | 1,006,116 |

Ready time was 2.18 seconds on the local preview server. The seven measured Chrome processes used 904 MiB private memory after the complete tour. The control-transfer check also verifies that Capua's rendered terrain color changes, rather than checking only the selection panel. A [reproducibility check](terrain-evidence/reproducibility.json) confirms byte-identical SHA-256 hashes for every terrain output after repeating the cached-source importer.

## Remaining product and research work

The peninsula is recognizable and no longer a rectangular island. Regional tile borders have identical data and mixed-LOD topology. The screenshots still show visible fine/coarse context transitions, repetitive materials, generalized river polylines, schematic city fabric and sparse art-directed landscape development. This is below the requested premium campaign-map benchmark. Direct concept-art matching remains unassessed because the source artwork was not present.

Next work should refine terrain material/normal blending and terrain-stream transitions, replace generalized hydrology near cities, establish archaeological urban footprints and historical shoreline uncertainty, improve neighborhood/architecture variety and local water presentation, and research 278 BCE territorial boundaries. Historical ports and specific gates/roads should only appear once source support is adequate. No more settlements, maximum-resolution Mediterranean generation, engine migration, or unrelated economic/demographic systems were added in this pass.
