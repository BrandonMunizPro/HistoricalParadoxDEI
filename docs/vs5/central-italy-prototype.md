# VS5 central Italy campaign map

This document records the approved seven-site baseline. The current 23-site atlas
expansion and revised terrain crop are documented in
[World scope and settlement atlas](world-scope-and-settlement-atlas.md).

Status: functioning prototype, 2026-10-14. This is G1 geography plus an explicitly
bounded PT1/G2 presentation experiment requested for VS5. It is not a shipped
Mediterranean campaign or a claim of production visual quality. No engine migration
or tactical engine change was made. AD-19/AD-20 remain open for production.

## Run and review

Requires Node 22.12+ for Vite (tested on 22.23.2) and a WebGL2-capable browser.

```powershell
npm.cmd ci
npm.cmd run map:dev
```

Open <http://127.0.0.1:5173>. The committed `public/data/central-italy.json` makes
normal play independent of external GIS services. Drag to orbit, right drag to
pan, scroll to zoom. Select a town marker or a settlement button. Click terrain
to select the geographic region. Use Geography/Political and Reset view.
Fonts have local fallbacks; no external font service is required.

```powershell
npm.cmd run validate
npm.cmd run map:build
npm.cmd run map:preview
# In a second terminal while map:dev is running:
npm.cmd run map:verify
# To verify the production build while map:preview is running:
npm.cmd run map:verify -- http://127.0.0.1:4173
# Only to reproduce/update source-derived data (network required on first import):
npm.cmd run map:import
```

Browser verification uses installed Google Chrome through Playwright. Its default
URL is Vite's development address; an optional argument selects a different server.
The production map builds separately to `dist-map/`;
the existing compiled simulation remains in `dist/`. Browser code does not load
SQLite or any tactical catalog. Build output, raw downloaded sources and runtime
campaign stores remain ignored.

## Repository assessment and recommendation

The repository uses strict TypeScript 6, Node 22+, ESM, Vitest and ESLint. VS1
provides UUIDv5 identities; VS2 provides clock/scheduler/calendar; VS3 provides
ledger, SQLite/Drizzle persistence and verified save slots. VS4 provides immutable
character identity, relationship facets, kinship/mentorship, ledger-derived life
history, death/succession work and character persistence. Those systems and their
tests remain intact. The tactical adapter is a shell behind domain-owned contracts.

There was no browser application, renderer, geographic graph, implemented faction
aggregate, government aggregate or settlement schema at the start of this work.
`WorldEntity` is still the VS3 scalar fixture, not a settlement storage format.
Characters already use canonical IDs that the new geography and control seams
also use. No second identity system or foreign game assets were introduced.

Recommend **Three.js + Vite for this proof**, with TypeScript simulation authority.
This recommendation is deliberately a prototype choice, not a permanent engine
decision. Current performance and integration show no technical need to migrate.

| Candidate | Terrain, streaming and LOD | Visual and map features | Integration/build/distribution | Assessment |
|---|---|---|---|---|
| Unreal Engine 5 | Landscape, World Partition and landscape LOD offer a mature large-world route | Strong water, vegetation, lighting, material and asset pipelines; custom political overlays and campaign labels still required | Separate C++/Blueprint presentation and snapshot transport to TypeScript; large editor/build/toolchain. Game distribution subject to Unreal EULA and royalties | Strong candidate for final art ambitions; considerable migration and content cost. Not needed to prove this slice |
| Godot | Large-world coordinate builds available; terrain and streaming require selecting/building a terrain pipeline | Scene/assets, shaders, multimesh vegetation and camera tooling; campaign overlays remain custom | Separate GDScript/C# client and snapshot transport; MIT with attribution; smaller native build pipeline | Plausible later native renderer, but no repository integration benefit sufficient to justify replacement now |
| Three.js | BufferGeometry, LOD, instancing and culling; tiled streaming must be built explicitly | Immediate interactive terrain, materials, water, labels and political overlays; premium assets and stronger material/lighting work remain necessary | Direct consumer of pure TS read models; Vite build, browser distribution; MIT | Smallest working path, selected for prototype |
| Babylon.js | Suitable browser terrain/mesh/material/scene tooling; large-world streaming remains an application responsibility | Broader scene tooling than this narrow renderer needs | Similar TypeScript integration and web delivery; Apache 2.0 | Reasonable alternative; changing libraries would not resolve the present art/content gaps |

Primary references: [Three.js LOD](https://threejs.org/docs/#api/en/objects/LOD),
[Three.js license](https://github.com/mrdoob/three.js/blob/dev/LICENSE),
[Godot large-world coordinates](https://docs.godotengine.org/en/stable/tutorials/physics/large_world_coordinates.html),
[Godot license](https://godotengine.org/license/),
[Unreal licensing](https://www.unrealengine.com/license),
[World Partition](https://dev.epicgames.com/documentation/en-us/unreal-engine/world-partition-in-unreal-engine),
[Babylon.js](https://github.com/BabylonJS/Babylon.js).
Unreal's game royalty model generally starts after the first $1 million in lifetime
product revenue, with the current standard rate 5%; consult the EULA before choosing
commercial distribution. Native engine adoption requires an explicit later decision.

## Scope and data pipeline

Coverage: 11.6–14.7° E, 40.7–43.1° N, approximately 257 × 266 km. This includes the
Tyrrhenian coast, Tiber valley, Monti Lepini, central Apennine relief, and Campania.
The seven settlement records are Roma, ancient Capua, Tibur, Praeneste, Norba,
Tarracina/Anxur, and Ostia. Ancient Capua is near Santa Maria Capua Vetere; it is
not the later town carrying the modern name. Locations are imported representative
points, not randomly placed or claimed archaeological building footprints.

| Input | Use/resolution | Rights and limitations |
|---|---|---|
| Mapzen/Tilezen Terrarium tiles on AWS | Actual elevation, zoom 8, roughly 460 m source pixel in this latitude range, resampled to a 513 × 513 grid (~500 m) | Composite upstream datasets; required regional attribution retained. EU-DEM/SRTM/GMTED/ETOPO provenance is not equivalent to a direct GLO-30 import. Modern surface/bare-earth sources are mixed; vertical datum precision is not asserted |
| Natural Earth 1:10m physical vectors | Land/coast outline, Tiber river centerline, one lake feature in the crop | Public domain. 1:10m is a cartographic scale, not 10 m positional accuracy. Coarse for tactical terrain and close coastal zoom |
| Pleiades individual place JSON | Names, representative coordinates, descriptions, contributor attribution and stable source IDs | CC BY 3.0. Gazetteer spans multiple periods; existence before 278 BCE reviewed below; the descriptions can mention later history |
| UNESCO Via Appia research | Existence of Rome–Capua road from 312 BCE | Linked historical evidence. The displayed line is an authored provisional corridor; it is not a licensed archaeological road survey |
| Copernicus GLO-30/GLO-90 (investigated, not imported) | Next terrain fidelity stage: 30/90 m DSM tiles reduced into campaign chunks | Available under the applicable free/open Copernicus DEM license with attribution. DSM includes surface objects; correction and historical terrain review needed |

Sources: [AWS Terrain Tiles](https://registry.opendata.aws/terrain-tiles/),
[Tilezen source inventory](https://github.com/tilezen/joerd/blob/master/docs/data-sources.md),
[Tilezen required attribution](https://github.com/tilezen/joerd/blob/master/docs/attribution.md),
[Natural Earth terms](https://www.naturalearthdata.com/about/terms-of-use/),
[Copernicus DEM collection](https://dataspace.copernicus.eu/explore-data/data-collections/copernicus-contributing-missions/collections-description/COP-DEM),
[GLO-30 license](https://docs.sentinel-hub.com/api/latest/static/files/data/dem/resources/license/License-COPDEM-30.pdf),
[Pleiades downloads](https://pleiades.stoa.org/downloads),
[Via Appia](https://whc.unesco.org/en/list/1708).

`scripts/import-central-italy.mjs` caches upstream bytes, checks previously recorded
SHA-256 hashes, decodes Terrarium RGB heights, crops/resamples elevation, clips
physical polygon rings to the prototype rectangle and imports named place records.
It rejects out-of-bounds places and name/ID mismatches. Fresh source bytes that
disagree with the existing manifest are rejected; review/version manifest changes
deliberately when updating a dataset. Reusing the cache reproduces the bundle.
This simple rectangular polygon clip is a prototype, not a general global GIS
topology repair tool. Runtime validation checks grid/bounds/settlements, and elevation
queries use bilinear interpolation with explicit out-of-coverage rejection.

`data/geography/manifest.json` records URLs, hashes and attribution. The bundled
place records retain creators/contributors, license links and original descriptions.
No modern national boundaries are imported. Coastlines and elevation are modern;
the Ostia/Tiber delta and Pontine marsh landscape in particular need historical
reconstruction. Do not interpret the decorative vegetation as evidence of ancient
forest extent. Mountain forms derive from elevation; semantic mountain-range records
and additional river networks such as the Volturno remain future imports.

Modern land-cover data may help biome plausibility but cannot establish forest cover
in 278 BCE. Historical roads, marshes, coast shifts, settlement lifecycle and territorial
claims need individually cited period-specific records. Keep unknowns explicit rather
than use modern land use, countries, or later Roman provincial borders.

| Settlement | Source | Period rationale / confidence |
|---|---|---|
| Roma | [423025](https://pleiades.stoa.org/places/423025) | Republican capital; high confidence presence |
| Capua | [432754](https://pleiades.stoa.org/places/432754) | Pre-Roman Campanian city, Etruscan/Villanovan origins; high confidence presence |
| Tibur | [423081](https://pleiades.stoa.org/places/423081) | Pre-Roman Sabine/Latin town; high confidence presence |
| Praeneste | [423013](https://pleiades.stoa.org/places/423013) | Seventh/eighth-century BCE origins and Latin War history; high confidence presence |
| Norba | [422987](https://pleiades.stoa.org/places/422987) | Latin colony from early fifth century BCE, destroyed much later; high confidence presence |
| Tarracina/Anxur | [433143](https://pleiades.stoa.org/places/433143) | Roman citizen colony recorded from 329 BCE; high confidence presence |
| Ostia | [422995](https://pleiades.stoa.org/places/422995) | Early Republican port/fortified site; keep founding chronology and shoreline provisional |

The import identity check was added after an initial wrong Tarracina ID resolved to
the Tiber. The corrected record and geographic regression test prevent that error.
The Appian corridor bends through approximate Albano, Forum Appii, Tarracina, Fondi,
Formiae, Minturnae, Sinuessa and Casilinum positions. These manually supplied route
waypoints are **provisional**; only the settlement endpoints come directly from
gazetteer records. Route graph edges have neutral placeholder costs, not historical
travel times or proof that every connection follows a known ancient road.

## Geographic model and simulation boundary

```text
Canonical world identity
  → GeographicRegion (worldId, districtIds)
    → GeographicDistrict (regionId, locationIds)
      → TerrainCell (districtId, terrain, GeographicContext)
      → GeographicLocation (stable id, regionId, terrain)
        ← GeographicSettlement (own stable id, locationId, existence, source refs)
      ↔ GeographicConnection (stable id, endpoint IDs, kind, traversal cost)

CampaignMapState.settlementControl: settlementId → factionId
CampaignMapState.factions: faction identity + display metadata
```

The hierarchy types live in `src/domain/geography`. The prototype instantiates one
region identity and seven settlement locations; it does not manufacture a historical district
administration or instantiate every raster sample as a simulation aggregate. Terrain
grid samples are immutable dataset values. District and cell types are expansion seams.
Population/resource fields are references only; economy, population simulation and
administrative systems remain deferred. Active/destroyed/abandoned existence is a
schema field, not an implemented founding/destruction mechanic.
Settlement identity is distinct from location identity. The combined renderer read
model carries both, and graph connections reference location IDs while political
control references settlement IDs. This matches the separate geography integration
proposal in `docs/architecture/geography-integration-requirements.md`.

Graph validation, deterministic least-cost routing with caller-supplied terrain
factors, and an adjacency-backed `GeographicSpatialIndex` support G1. Locality queries
visit only reachable adjacency lists, not every pair of locations. The small route
solver uses a sorted linear candidate queue rather than a heap; large-world routing
will need a heap/hierarchical graph and cached adjacency. Neutral factor defaults
are placeholders, not historical movement formulas.

Imported WGS84 longitude/latitude and elevation metres live at the infrastructure
boundary. Rendering maps them to an approximate local plane (83 units/degree longitude,
111/degree latitude, north toward negative Z), with 5× vertical exaggeration. These
units and projection are **presentation-only**, never canonical army coordinates.
Recommend WGS84 double-precision interchange plus local metric terrain chunks for a
future AD-19 decision, including explicit vertical datum, geodesic distance, cell
resolution and stable cell keys. No canonical coordinate decision is silently closed.

`src/simulation/campaign-map-state.ts` owns the thin control snapshot and pure transfer
operation; `central-italy-map-scenario.ts` seeds the deliberately provisional fixture.
The renderer reads this snapshot. A validation-only hook invokes the simulation
operation and replaces the snapshot, then regenerates overlay colors and borders;
the browser is not a separate political authority. A settlement retains its UUID
through transfer. The two fixture groups are Roman Republic and allied communities;
they are not complete or researched faction/government implementations.

Influence areas are nearest-settlement presentation estimates. Only settlement
control is present in the simulation snapshot; those areas are **not authoritative
territory polygons**. Geographic identity and political ownership have separate
lifetimes. Replace influence estimates with a territorial read model once researched
ownership exists. Do not persist these estimated boundaries as ancient facts.

Characters, governments, armies, offices and ledger events can reference canonical
location/settlement/faction IDs. Existing `BattleState.locationId` already supplies
the opaque location seam. There is no new scheduler, character system, government,
military movement loop, supply calculation or economic simulation. The map fixture
is not yet connected to a persisted running campaign; geography/control repository
ports and a migration should be added when authoritative saved campaigns adopt it,
without changing VS4 character tables or weakening snapshot guarantees.

## Tactical geographic interface (no battle engine implementation)

`GeographicContext` carries location identity, elevation, slope, forest coverage,
water feature references, nearby settlement IDs and connection IDs. `TerrainCell`
adds terrain classification. This is the foundation for a future sampled context:

1. Simulation selects canonical location/cell and retrieves geographic context.
2. Infrastructure samples DEM/river/road data using the approved coordinate mapping.
3. Context records source revision, uncertainty and geographic feature identity;
   decorative trees and estimated influence colors must never become facts.
4. Optional future season/weather comes from simulation state, not the renderer.
5. An adapter-side resolver translates that context to tactical engine capabilities.

River-crossing context must include river/road geometry and crossing orientation;
an arbitrary nearest river is insufficient. Forest coverage and slope need source-backed
sampling and uncertainty. The current interfaces exist, but full cell extraction,
weather, battlefield generation and AD-20 matching remain unimplemented. Campaign
location, tactical context, battlefield identifier and unit position remain distinct.

## Renderer and visual acceptance

Implemented: elevation mesh, layered elevation colors and deterministic procedural
surface texture; material lighting and atmosphere; coastline/sea and lake surfaces;
Tiber lines; clustered/jittered instanced vegetation; instanced buildings and terracotta
roofs with capital-sized clusters; settlement labels; orbit/pan/zoom/reset; settlement
and region raycast selection; geographic and political modes; simulation-driven
ownership colors and regenerated influence boundaries. There are no static image
substitutes and no imported proprietary game assets.

Performance measures include vegetation/building instancing, pixel ratio capped at
1.5, browser mesh frustum culling, a two-level terrain mesh (513 and 129 samples per
side, far transition at 450 renderer units), and bounded local data. Political overlay
geometry currently remains full resolution even at far zoom. No asynchronous tile
streaming, global quadtree, semantic label collision management or production memory
budget exists yet. The main browser bundle is roughly 610 kB before compression;
Vite's bundle-size advisory is expected and is not hidden.

The screenshots show a recognizable and interactive central Italy relief with a
coherent atlas UI. They also show why this is **not premium production acceptance**:
coast masking still follows the terrain raster at close range; terrain has a repeated
procedural grain rather than authored rock/soil/field material layers; forest and town
assets remain simple stylized geometry; lighting lacks a finished shadow/AO/art pass;
water lacks researched bathymetry/shore surf; world crop edges are visible; territory
extents are provisional and labels do not resolve collisions at all zooms.

No concept artwork was present in the supplied conversation/workspace files, so a
direct reference-image comparison cannot be claimed. Against the user's stated
Rome II terrain/CK3 readability direction, physical recognizability and interaction
are established; asset fidelity, terrain materials, atmosphere, coastline quality,
political research and semantic zoom still fall short.

## Validation and evidence

`npm run validate` passes the existing milestones plus geographic graph, routing,
control-transfer and DEM validation tests. `map:build` produces a standalone map
artifact. `map:verify` checks loading, panel selection, marker/region raycasts, both
modes, control transfer, camera zoom/reset, distant LOD and browser errors. It writes
screenshots and a measured-environment JSON report:

- [Geographic view](evidence/geographic.png)
- [Political view with Capua selected](evidence/political-selection.png)
- [Control transfer preserves settlement identity](evidence/control-transfer.png)
- [Rome selected by marker raycast](evidence/rome-raycast.png)
- [Geographic region selected](evidence/region-selection.png)
- [Closer zoom](evidence/zoom.png)
- [Measured environment, assertions and frame/memory data](evidence/metrics.json)

The test environment is Windows, Intel i7-11800H, ~16 GB RAM, RTX 3060 laptop GPU,
headless Chrome 155, 1440 × 1000. The report is the authority for the most recent
measurement; frame rate is a short idle/reset sample, not a percentile across a
campaign play session. JS heap is measured separately from geometry/texture counts;
on Windows the report also queries the launched Chrome process family for private
bytes and working set. Private bytes represent committed private memory rather than
resident RAM; the summed working set can double-count shared pages. GPU VRAM is not
measured. Do not generalize this result to
integrated GPUs, mobile devices or the Mediterranean scale. Screen capture runs,
GC and browser scheduling affect the numbers.

## Next focused work

1. Review the actual concept reference; produce an art acceptance checklist and
   replace stylized assets with licensed historically plausible towns/vegetation.
2. Acquire GLO-30 chunks, higher-detail coastline/hydrography, historical marsh and
   delta corrections; resolve AD-19 before simulation uses coordinates.
3. Separate reusable renderer layers, add tiled LOD/streaming, shoreline treatment,
   shadow/AO, slope-aware materials and zoom-sensitive labels; validate low-end GPUs.
4. Research independent faction/control records and district/territory geometry for
   278 BCE; replace estimated influence cells with explicit sourced uncertainty.
5. Integrate geography/control durable mirrors with campaign restore and add tests
   for saved ownership changes, then deliver source-backed tactical context extraction.

No engine migration is presently necessary. The outstanding blocker to direct
reference comparison is the missing concept artwork; historical reconstruction and
production art remain substantive work, not renderer failures.
