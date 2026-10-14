# VS5 geographic fidelity and development-driven architecture

Status: iterative presentation prototype. This pass preserves the authoritative TypeScript simulation, existing settlement identities and source coordinates, Three.js, and completed VS4 behavior. No Big Pickle research files, ADRs or open architectural decisions were edited.

## Phase 1 — assessment and geographic audit

Reviewed the renderer, import pipeline, projection helpers, geography integration contract and previous peninsula/city screenshots before editing. The previous image combined an oblique camera, strong warm ambient lighting, coarse terrain context and generalized physical features. Those are different problems from coordinate placement.

The new **Overhead diagnostics** button presents north-up Italy, Sicily, Sardinia, Corsica and surrounding coasts with a geographic graticule and landmark leaders. Coordinates displayed for existing settlements are resolved from the atlas, not copied into a second identity model. [Diagnostic screenshot](visual-fidelity-evidence/overhead-diagnostic.png), [clean overhead screenshot](visual-fidelity-evidence/overhead-geographic.png), [numeric audit](../../data/geography/campaign-geography-audit.json).

| Finding | Evidence and change |
|---|---|
| Perspective foreshortening | The old camera looked obliquely across Italy. A near-vertical north-up camera removes that foreshortening. Camera changes do not move geographic coordinates. |
| Projection | Existing spherical azimuthal equidistant coordinates remain, origin 13.5° E / 41.5° N, metres converted to render kilometres, north = −Z. Roundtrip tests include Italy, the islands, Iberia, Egypt and the Near East. Distances from the projection origin match the spherical great-circle calculation. This is mathematical consistency, not a survey of ancient boundaries. |
| Water data contamination | The terrain importer overwrote context seabed values with zero-valued, land-only Copernicus cells. Depth coloring exposed degree-shaped shallow-water rectangles. Bathymetry is now preserved separately before land elevation sampling. Regression tests check open Tyrrhenian sea samples remain negative. |
| Strategic depth precision | A short city-scale near plane cannot reliably distinguish a sea surface from low coastal land at continent-view distances. The WebGL renderer now uses logarithmic depth buffering. This removes the triangular flicker visible during overhead testing without moving coastlines. |
| Terrain transitions | The old apron sampled a height raster even when a different-resolution context mesh was displayed. The apron now samples the displayed mesh's projected triangle with barycentric interpolation, blending height, normals and color. Changes to context LOD refresh the apron. Neighboring detailed tiles retain their shared perimeter topology and source-edge values. |
| Settlement positions | The original 23 imported coordinates are unchanged. The prior renderer copied Neapolis's provisional visual anchor over its source `lon`/`lat`. These fields are now separate, and the selection panel distinguishes the atlas point from the visual anchor. |

The audit verifies Roma, ancient Capua and Ostia against the established Pleiades records; the previous independent GeoNames locality checks remain available in [italy-validation.json](../../data/geography/italy-validation.json). Sicily and Sardinia use [GeoNames island representative points](https://www.geonames.org/advanced-search.html?country=IT); Corsica uses a [documented modern Cargèse locality](https://www.geonames.org/search.html?country=FR&q=Korsika). These points fall on land in the imported context mask. Gran Sasso uses the existing separate-product elevation QA point. The Tiber diagnostic is a rounded river corridor reference from [GSHHG/WDBII](https://www.soest.hawaii.edu/pwessel/gshhg/), **not an independently surveyed channel vertex**.

Neapolis's broad atlas point is flagged as water by the coarse modern context mask. This is an unresolved combination of representative-point semantics and shoreline resolution, not proof that the ancient city was offshore. It is not corrected by moving the source coordinate. The pre-existing provisional Greek-core visual anchor remains separately recorded at 14.257° E, 40.852° N, with 1 km uncertainty. A surveyed ancient urban footprint is still required before promoting a more precise location.

Source extents remain: regional terrain catalog 9°–20° E / 36°–46° N; coarse context 5° W–30° E / 30°–55° N. These are data coverage, not campaign boundaries. The proposed 12° W–75° E / 12° N–62° N world envelope remains provisional. No georeferenced Rome II campaign reference was available to establish its exact crop.

## Phase 2 — terrain, water and vegetation

Terrain uses a shared continuous elevation palette rather than different threshold palettes per mesh. Lower warm exposure, less fog and neutral daylight preserve the distinction between low plains, vegetated hills and rocky high ground. Interior tile normals now follow the local elevation samples; perimeter derivatives remain shared, with latitude-dependent metric spacing rather than Italy-specific fixed denominators. Vertical exaggeration stays **3×**; no invented mountain ridge or increase in relief was introduced.

Water shading uses preserved Mapzen context bathymetry through the inverse geographic projection, with a restrained shelf/deep-water color ramp and animated surface normals. The bathymetry is coarse and its colors are illustrative, not navigable depth or 278 BCE sea-level evidence. Shore clipping still comes from GSHHG, independently of terrain mesh LOD.

Procedural texture variation no longer uses the old regular checker-like macro pattern. Strategic vegetation is represented as lower canopy clusters, not kilometre-high individual trees. Those proxies disappear at city zoom; local small-tree instances remain around settlements. Distribution remains decorative and height-constrained, not a researched ancient forest-cover layer.

The tile cache remains bounded at 12 resident tiles, with at most three loads in flight. There are now 85 regional tiles and four small city windows; only Norba's approximately 5 km window was added. No Mediterranean maximum-resolution terrain was generated. Geometry, materials and shore textures are disposed on eviction. The current scheduler still prioritizes the camera target rather than production screen-space terrain error. Coarse regional relief and transition bands remain visible at some views; this is not a finished terrain-streaming system.

Physical sources and rights are documented in [the previous calibration report](italy-geographic-calibration.md) and the updated [manifest](../../public/data/italy-terrain/manifest.json). [Copernicus GLO-30](https://dataspace.copernicus.eu/explore-data/data-collections/copernicus-contributing-missions/collections-description/COP-DEM) is a modern **surface** model including buildings and vegetation, in EGM2008 vertical coordinates. Regional derivatives are approximately 650–870 m; bounded city windows approximately 39–52 m. [GSHHG 2.3.7](https://www.soest.hawaii.edu/pwessel/gshhg/) coasts/lakes/rivers retain their bundled LGPL notices. Mapzen context elevation/bathymetry retains its source-specific attribution. No third-party game/mod asset was imported.

## Phase 3 — settlement architecture

[Rome close](visual-fidelity-evidence/rome-close.png), [Neapolis close](visual-fidelity-evidence/neapolis-close.png), [Norba close](visual-fidelity-evidence/norba-close.png).

Rome retains irregular Latin/Italic neighborhoods, original pitched-roof and courtyard components, partial defensive stretches and externally supplied civic/religious archetypes. There are no Imperial fora, Colosseum, Imperial palace or Aurelian walls. [Municipal archaeological evidence for the earlier defenses](https://museovirtualedellemura.romasitounesco.it/en/mura-serviane-english-version/) supports the feature class; the procedural circuit and building positions are not surveyed reconstructions.

Neapolis retains its Greek rectangular neighborhood vocabulary and partial defenses. Its religious archetype has a gabled roof and columned perimeter; civic and commercial components are separately selected. [UNESCO](https://whc.unesco.org/en/list/726/) supports the Greek grid and defensive remains, not the exact plots rendered here. No ancient harbor basin, reclaimed shoreline or named sanctuary footprint is claimed. The maritime category currently draws a storehouse archetype, avoiding an invented pier on dry land.

Norba provides the Italic hill-settlement sample at its unchanged atlas coordinate. A bounded Copernicus window provides the plateau and surrounding slopes. Earth-toned pitched roofs, smaller terrain-following neighborhoods, a schematic civic structure and an orchard distinguish it from Greek Neapolis. House placement rejects nearby occupied positions. The [municipality](https://comune.norma.lt.it/luoghi/2561916/parco-archeologico-antica-citta-norba) documents the archaeological site and defenses; [regional visitor documentation](https://www.visitlazio.com/parco-archeologico-dellantica-citta-di-norba/) describes the plateau setting. The [archaeological publication on fortification chronology](https://sabap-met-rm.cultura.gov.it/wp-content/uploads/2024/05/Lazio-e-Sabina-6.pdf) cautions against assigning every surviving wall/gate phase to 278 BCE. This prototype therefore omits a complete Norba wall circuit. Roof color and neighborhood plans are artistic choices, not excavated structure inventories.

The underlying house batches remain instanced. Development modules are a small original procedural asset library; they are individually culled meshes in a culled settlement group. A larger future catalog should instance those components too. Rendering remains below the premium final benchmark: more facade/roof diversity, researched urban footprints, local river surfaces, agricultural development and shoreline reconstruction are needed.

## Phase 4 — development-driven asset selection

`src/presentation/settlement-development.ts` is a pure selector over an **externally supplied snapshot**. It is a presentation adapter proposal, not a new authoritative campaign aggregate. It consumes:

- Existing settlement identity, culture, era, tier and geographic eligibility.
- A snapshot revision and explicit existing structure records: identity, category, visual level and active/ruined condition.
- A typed asset catalog with culture, period, tier, level and geographic eligibility.

Categories: military, civic, religious, commercial, agricultural and maritime. Only supplied structure records produce development assets. An empty snapshot produces none. Stable structure/settlement/asset identifiers determine variation; sorting makes selection independent of input array order and revision labels. Culture/period eligibility rejects unsupported assets; coastal eligibility gates maritime assets. Ruined records produce a rubble representation. The catalog's 400–200 BCE interval is an **authored prototype eligibility window**, not evidence for the construction date of every depicted archetype.

`map/architectural-modules.js` renders selected archetypes: training yard, civic hall, culture-specific sanctuary, market stalls, orchard and maritime storehouse. Stable category slots prevent an added military module from relocating an existing sanctuary. Base urban texture is not a population estimate or an economic model.

The current example snapshots are in [development-visual-fixtures.json](../../public/data/development-visual-fixtures.json), explicitly marked as presentation fixtures. The **Preview external development snapshot** button, enabled for the three supported fixture settlements, supplies another snapshot with a training-yard example. It does not build anything in the simulation. The same seam is callable by an application adapter:

```js
window.__campaignMap.applyDevelopmentSnapshot({
  settlementId: existingSettlementId,
  revision: 'external-snapshot-revision',
  structures: [
    { id: existingStructureId, category: 'civic', level: 1, condition: 'active' }
  ]
});
```

This diagnostic API demonstrates integration; it is not the permanent gameplay API. Renderer code implements no prices, upgrades, production, queues, population, ownership decisions or turn progression. [Browser evidence](visual-fidelity-evidence/development-proof.json) shows changed asset selections with identical settlement coordinates, IDs and control snapshots. [Before](visual-fidelity-evidence/norba-close.png) and [after](visual-fidelity-evidence/norba-external-development.png) screenshots show the same settlement.

**Dependency before authoritative use:** the application/simulation side must define or approve the read model for existing structures, stable structure IDs, construction/damage state, culture/era context and revisions, then adapt it to this presentation input. That dependency is documented here only. This pass does not amend Big Pickle's active research, economic authority, settlement aggregate, coordinate decisions or ADRs. Development must eventually reflect actual simulated structures and effects; this prototype is not a cosmetic game mechanic or a substitute for those rules.

## Phase 5 — validation and performance

Run:

```sh
npm run map:dev
npm run map:audit              # builds simulation modules, writes numerical geographic audit
npm run validate               # typecheck, lint, tests, simulation build
npm run map:build
npm run map:preview            # normally http://127.0.0.1:4173
npm run map:verify:italy        # production Chrome tour and screenshots
```

Checked-in derivatives run without GIS source-network access. `npm run map:terrain` regenerates them from cached sources, obtaining public source data when absent. The source/reuse rights and historical limitations remain visible in the map's attribution panel.

Automated tests cover transform roundtrips/orientation and radial distances beyond Italy, unchanged atlas coordinates, retained seabed samples, shared material continuity, barycentric context sampling, external snapshot ordering/identity checks, all asset categories, culture/era/tier/level/geographic eligibility, ruined structures, and the existing shared-edge/LOD topology tests. Production checks exercise overhead diagnostics, Rome/Neapolis/Norba views, selection, development snapshot replacement without control/coordinate mutation, political transfer, label collision rejection, tile eviction and missing-asset/browser errors.

Measured results are in [metrics.json](visual-fidelity-evidence/metrics.json): Windows, i7-11800H, 16 GB RAM, RTX 3060 Laptop GPU, headless Chrome 155, 1440×1000. Each idle view samples 3.5 seconds after streaming settles. FPS is refresh-limited around 144 in this environment, not a hardware-independent performance claim. The JSON records per-view FPS, p95 frame time, draw calls, triangles, JS heap and resident tile IDs, plus owned Chrome process memory. JS heap excludes GPU memory; summed process working sets may double-count shared pages. Longer camera-motion, lower-end GPU and campaign-scale stress tests remain to be done.

Final measured run:

| View | Mean FPS | p95 frame | Draws | Triangles | JS heap |
|---|---:|---:|---:|---:|---:|
| Central Italy | 143.6 | 7.1 ms | 147 | 862,315 | 148 MiB |
| Peninsula | 141.3 | 7.1 ms | 383 | 304,071 | 136 MiB |
| Overhead diagnostic | 142.2 | 7.1 ms | 419 | 304,349 | 147 MiB |
| Rome intermediate | 143.9 | 7.1 ms | 55 | 678,256 | 139 MiB |
| Neapolis close | 143.9 | 7.1 ms | 68 | 741,780 | 142 MiB |
| Norba close | 133.5 | 7.1 ms | 46 | 731,772 | 135 MiB |

Ready time: 2.29 seconds on the local production preview server. Seven owned Chrome processes used approximately 1,013 MiB private memory after the full tour. The lower Norba mean despite similar p95 illustrates why short idle samples are not a campaign stress benchmark. `npm run validate` passed **351 tests across 23 files**, typecheck, lint, simulation build and build smoke checks. Production map build and browser validation passed; Vite retains its >500 kB bundle-size advisory.

This phase does not certify exact ancient coastline, Tiber meanders, settlement footprints, forest cover or territorial boundaries. It verifies the geographic transforms and distinguishes camera, data, mask and placement uncertainty. The overhead view is geographically recognizable, while remaining an iterative art and geographic-data prototype.
