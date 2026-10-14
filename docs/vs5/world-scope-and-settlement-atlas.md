# World scope and the 278 BCE settlement atlas

Status: bounded atlas/renderer implementation, 2026-10-14. The approved Three.js
foundation and authoritative TypeScript simulation are retained. This is an Italian
expansion and world-scope proposal, not an import of 1,305 settlements or a shipped
grand campaign. Original prototype screenshots remain in `evidence/`; new screenshots
and measurements are in `atlas-evidence/`.

## Geographic scope and limits of the evidence

Proposed world envelope: **12° W to 75° E, 12° N to 62° N**. The machine-readable
proposal is [`world-scope.json`](../../public/data/world-scope.json). It includes
Britain, Atlantic Iberia, Gaul, Germania, Italy, the Balkans, Greece, North Africa,
Egypt, Anatolia, Mesopotamia, the Near East, the Iranian plateau, Bactria and the
Paropamisadae approaches. This is a conservative outer geographic envelope with
buffers; presence inside the box does not automatically authorize a playable region
or a settlement. Border deserts, ocean and eastern buffers require a later coverage
mask rather than filling every rectangle with campaign content.

**These are proposed HistoricalGame coordinates, not the actual measured Rome II
engine crop.** No authoritative georeferenced Rome II extent was found. Its official
[regions page](https://r2encv2.totalwar.com/en/regions/) supplies campaign context,
and its [Baktria entry](https://r2encv2.totalwar.com/en/faction/rom_baktria/index.html)
confirms the Afghan eastern setting. Its
[Lusitani entry](https://r2encv2.totalwar.com/en/faction/rom_lusitani/index.html)
supports the western Iberian coverage reference. Those sources do not provide a
lat/lon calibration. Screenshot pixels and engine map coordinates must not be
reported as precise geographic boundaries without independently validated control
points and a georeferencing residual/error report.

Real-world anchor checks include Olisipo (-9.136°, 38.707°), northern Britain
(-3.1°, 58.6°, rounded coverage check), southern Scandinavian approaches (9.9°,
57.7°, rounded), the Atlantic Moroccan coast (-9.8°, 30.4°, rounded), Meroe
(33.712°, 16.937°), Adane (45.039°, 12.772°), Bactra (66.901°, 36.768°), and
Alexandria/Kapisa (69.310°, 34.993°). The latter southern/eastern anchors ensure
room for an ancient-world research envelope; they are not a claim that every
location is visible in the unavailable screenshot or occupied in 278 BCE.
Gazetteer anchor references: [Olisipo](https://pleiades.stoa.org/places/256338),
[Meroe](https://pleiades.stoa.org/places/805630),
[Adane](https://pleiades.stoa.org/places/39269),
[Bactra](https://pleiades.stoa.org/places/961886),
[Alexandria/Kapisa](https://pleiades.stoa.org/places/59668). Source coordinates
were checked against the [Pleiades GIS archive](https://atlantides.org/downloads/pleiades/gis/).
The gazetteer includes homonyms: the Syrian Meroe record is not the Nile site.

The supplied screenshot and concept artwork were not accessible as attachments or
workspace files in this execution context. Exact reference matching remains pending;
the proposed extent follows coverage research and real coordinates rather than an
unseen image. A future calibrated reference review may tighten the outer envelope.

## Coordinate architecture

The world envelope is independent of the current terrain crop. The active prototype
crop is **11.6–15.2° E, 40.3–43.1° N**, expanded only enough to reach Maleventum and
Poseidonia. A single 513 × 513 grid remains bounded; sampling spacing is approximately
600 m for this crop. It is not the Mediterranean's coordinate system.

`src/infrastructure/world-geography.ts` provides double-precision geographic
coordinates, coverage checks, great-circle distances, WGS84 ECEF-to-local tangent
coordinates, and an invertible local azimuthal equidistant presentation map. The
renderer now projects coordinates from an explicit active-view origin; it does not
stretch the Italy rectangle over the world. Projection/unprojection and independent
distance checks are tested. Distances are QA inputs, not army travel rates.

The local projection preserves distance from its origin and has low regional
distortion; it is not a globally distortion-free projection. At grand-campaign scale,
use an ellipsoid/globe or shared ECEF basis with rebased active terrain chunks, and
choose a documented macro map projection for political overview if desired. Do not
display an 87° longitude span using Italy's old constant units per degree.

WGS84 is an interchange convention at the infrastructure boundary. AD-19 still
requires a production decision covering canonical simulation coordinates, vertical
datum, metric distance policy, tile/cell identities and tactical continuity. Neither
view origin, crop bounds, tier nor map projection contributes to canonical identity.

## Settlement atlas schema and tier policy

The typed schema and validation are in `src/infrastructure/settlement-atlas.ts`;
the complete current records are in
[`settlement-atlas.json`](../../public/data/settlement-atlas.json).

| Field | Meaning |
|---|---|
| `id`, `locationId`, `key` | Distinct canonical settlement and geographic location IDs; authored key is stable and separate from name |
| `historicalName`, `alternateNames` | Curated campaign name and gazetteer aliases; aliases can span periods and do not all become 278 BCE display names |
| `coordinates`, `coordinateEvidence` | WGS84 metadata or explicit null for an unlocated site; source, representative-point caveat and accuracy (unknown rather than invented) |
| `category` | City, town, port, fort, sanctuary or village; role is distinct from size |
| `suggestedTier` | Research/presentation seed from 1 to 4, not an immutable identity property or population estimate |
| `earliestEvidence` | BCE range or unknown, descriptive evidence, source, confidence and warning to distinguish initial occupation, traditions, attestation and colonial refoundation |
| `presence278Bce`, `evidence`, `confidence` | Attested, probable, absent or uncertain; presence confidence does not establish founding precision or political ownership |
| `culturalContext`, `politicalContext` | Qualified research claims; political claim requires a source. Unresearched affiliation stays null |
| `geographicFeatures` | Nearby terrain/water/corridor context; not generated resource production |
| `importance` | Qualitative strategic/economic/political research notes, explicitly not simulation rates, wealth or population |
| `sources`, `discoveryReference`, `attribution` | Independent evidence, optional RIS discovery link, license and Pleiades creators/contributors |
| `selection` | Existing, expansion, deferred or excluded; uncertain/absent or unlocated records cannot enter the active renderer |

| Tier | Intended simulation detail (design only) | Current representation |
|---|---|---|
| 1: major city/capital | Individual civic/strategic reference; later detailed simulation when its systems exist | Largest schematic urban cluster, prominent label, far-view marker |
| 2: regional center | Regional administrative/commercial relevance; no fabricated office or economy | Medium cluster, regional-zoom labels |
| 3: town/community | Persistent individual identity, future aggregate/low-frequency detail | Small cluster, labels at local zoom or when selected |
| 4: smaller site | Persistent village/fort/port/sanctuary identity; future detail activated by relevance | Sanctuary archetype here, small marker and local label |

Ports can belong to several tiers. A village is not permanently small because its
atlas seed says tier 4. A future campaign classification record references settlement
ID and may change tier/role as history evolves; it must not regenerate IDs, edit the
research evidence, or assume population thresholds. Growth/decline, abandonment and
destruction remain future simulation actions. Ended identities remain referenceable.

Pleiades sometimes combines successive cities in one archaeological-place record
(Sybaris/Thurii/Copia). The current atlas selects the relevant campaign phase rather
than instantiating them all. Before founding new entities at an old site, reconcile
settlement continuity separately from stable geographic location, preserve original
published IDs, and never reuse a destroyed entity's ID for an unrelated foundation.

## Research method and RIS rights

The [RIS regions page](https://rtr-imperium-surrectum.github.io/ris-wiki/regions.html)
currently says 1,305 regions, each with one settlement. The
[sortable list](https://rtr-imperium-surrectum.github.io/ris-wiki/regions-sortable.html)
was inspected for candidate discovery. The
[repository](https://github.com/RTR-Imperium-Surrectum/ris-wiki) had no declared
repository license in GitHub metadata and no root license was identified. Public
visibility is not a dataset reuse grant. Only ten matched candidate names/links
are retained in `data/geography/ris-discovery.json`; no mod ownership, manpower,
population, environment tables, models, textures, artwork or map assets are imported.
Absence from that shortlist is not evidence that an ancient site did not exist.

Our atlas is a hand-authored review of 36 candidates using individual Pleiades
records (CC BY 3.0, contributors retained), the Pleiades GIS archive to disambiguate
homonyms, and independent archaeological evidence where available. For Pompeii,
[Fondo Iozzino](https://pompeiisites.org/en/excavations-plan-en/fondo-iozzino-area/)
documents archaic finds. For Poseidonia,
[the site's history](https://parchipaestumvelia.cultura.gov.it/la-storia-di-paestum/)
and [museum chronology](https://parchipaestumvelia.cultura.gov.it/scopri-i-parchi/museo-e-depositi-di-paestum/)
separate Greek/Lucanian occupation from the Latin colony of 273 BCE.

This is a reviewed **candidate atlas**, not a comprehensive archaeological survey.
Several founding dates remain undated, cultural notes are coarse and qualitative,
and most precise political affiliation claims are deliberately unknown. The Nemi
sanctuary is rendered with a probable-presence flag, not promoted to high-confidence
monumental reconstruction. Ostia's founding chronology remains probable. Cora and
Fidenae are held for further campaign-period activity evidence. Unlocated Taurasia
is retained with null coordinates. Cosa's 273 BCE colony is excluded at 278 BCE.

Dates in the atlas are BCE magnitudes (older numbers first). Descriptions take
precedence over numerical intervals: a documented colony date is not automatically
the earliest occupation date. Rome/Capua founding numbers are not asserted merely
from tradition or a cultural label. No birth, economy, treaty or government system
is generated from these research records.

## Comparison with the original seven and expansion selection

All seven original settlement and location UUIDs are preserved. Roma, Capua, Tibur,
Praeneste, Norba, Tarracina and Ostia remain active. Tarracina's label is simplified
from the gazetteer's `Tarracina(e)`; this changes no identity. Ancient Capua stays
near Santa Maria Capua Vetere, not the later modern Capua.

Sixteen additions are integrated: **Antium, Lanuvium, Aricia, Anagnia, Fregellae,
Arpinum, Setia, Formiae, Minturnae, Kyme/Cumae, Neapolis, Nola, Pompeii,
Maleventum, Poseidonia and the probable Diana sanctuary at Nemi**. Selection gives
Latium an inland/coastal network, adds the Liris/Appian corridor and Campanian bay,
tests dense-label cases and represents a small sanctuary rather than only cities.
Maleventum is not silently named with its later Roman label; Poseidonia is not
given Paestum's later Latin-colony status. First expansion is 23 active sites, not
all 36 candidates and not all 1,305 RIS settlements.

Twelve candidates are deferred: Lavinium, Cora, Fidenae, Taras, Brentesion,
Venusia, Luceria, Elea, Rhegion, Herakleia, Thourioi and Taurasia. The southern
coastal and Apulian sites have researched coordinates where available but do not
force full southern Italy terrain generation now. Cosa is the one explicit excluded
post-start candidate. The generated
[candidate comparison table](italian-settlement-candidates.md) lists all records;
the JSON supplies aliases, identities, context and complete source references.

## Contract coordination and authority

The implementation follows Big Pickle's
[geography integration contract](../architecture/geography-integration-requirements.md),
including its prototype coordination response (§10): pure geographic graph and
canonical identity remain separate from rendering, ownership, administrative
meaning and settlements' future population/economy. Atlas coordinates are import
metadata, not a silent AD-19 decision. Settlement IDs and location IDs are distinct.
Renderer types do not enter domain/simulation; the new label algorithm lives in
`src/presentation`, and geographic import math lives in `src/infrastructure`.

The existing seven-site political fixture remains explicitly provisional. New
settlements receive a separate **Control not yet researched** fixture group,
not mod factions or guessed sovereignty. The atlas's qualified legal/cultural
notes are not automatically assigned to `settlementControl`. Political mode reads
the simulation snapshot. Nearest-settlement influence areas remain presentation
estimates rather than historical borders. No modern country polygons are imported.

The existing graph's seven route edges are preserved; added places are not
automatically connected by Euclidean proximity. New source-backed route and river
crossing edges remain separate research work before military movement adopts them.
Campaign persistence repository ports/migration, territorial control aggregates,
demographic/economic systems and tactical resolver mechanics remain deferred.

## Renderer improvements and visual limits

Settlement detail now uses shared instanced gable roofs, plaster/stone bodies,
perimeter walls and gates, columned civic/sanctuary forms and modest developed
surroundings. These are **schematic artistic archetypes**, not researched street
plans or building inventories. The same urban archetype is still shared too widely;
period/culture-specific licensed assets and distinctive city silhouettes remain
necessary for premium production quality. No imperial basilicas, amphitheaters or
late monuments are used to establish campaign chronology.

Near view uses detailed archetypes; far view switches to compact tier-sized markers.
Labels use tier/selection priority, zoom bands, screen-space collision buckets and
HUD occlusion. They are deterministic across input ordering. Nearby minor towns
are revealed at close zoom, and selecting one prioritizes its label when space exists.
Far/regional/local thresholds are presentation settings, not demographic mechanics.

Terrain now blends rocky color on steep slopes; broadleaf/conifer styles have
deterministic variation; static shadow mapping adds relief and architecture shading.
Decorative field patches sample terrain heights and are rejected over sea. Water
uses available negative elevation samples for approximate coastal/deep color and
small animated waves. The bathymetric style samples the rectangular source grid
through a local planar approximation, so it is not a surveyed nearshore depth map.
Historical vegetation, ancient shorelines, the Tiber delta, Pontine marshes and
pre-79 CE volcanic terrain still require correction. Natural Earth coast resolution
and terrain raster steps remain visible at close zoom.

No artwork benchmark comparison is claimed without the actual concept/reference
attachments. The richer scene and dense-site readability improve the approved
foundation; the result remains stylized and below a finished Rome II/CK3 art target.

## Large-world implementation plan (not generated yet)

1. **Macro geography:** low-resolution land/elevation, explicit outer bounds and
   coverage mask. Store source-backed world coordinates independently of renderer
   units. Keep historical coastline corrections as versioned feature layers.
2. **Terrain chunks:** manifest-driven source tiles with bounding coordinates,
   revision/hash, vertical datum, error bounds and LOD samples. Shared border
   vertices, parent/child correspondence, skirts or morphing, water level and
   texture/biome coordinates must agree across tiles. Rebase active view using
   doubles before sending nearby coordinates to GPU floats.
3. **Streaming:** camera/frustum-driven load queue, worker decoding, bounded CPU/GPU
   caches, cancellation and explicit disposal. Adjacent chunk seams and material
   continuity are acceptance tests. Do not generate the whole envelope at 30 m.
4. **Settlement visibility:** spatially query candidate bounds, batch instances by
   archetype/tier/LOD, retain selection identity independent of draw instances;
   layout labels only for the visible candidate set. Current 23-site placement is
   bounded; the prototype influence raster scan is not a full-world algorithm.
5. **Physical features:** multi-resolution rivers/lakes/coastlines, terrain slope
   and biome masks, roads and explicit crossings. Shared global material/vegetation
   seeds prevent visible rectangular tile patterns; terrain vegetation is not
   authoritative ancient forest coverage.
6. **Political views:** independent dated territory/control records, contested or
   unknown areas and sourced uncertainty. Zoom changes line/label emphasis; it
   must not replace settlement identity or physical geography with faction textures.
7. **Movement/tactical inputs:** hierarchical adjacency and route indexes, source-
   backed crossings and terrain costs; later extract geographic context containing
   coordinate/elevation/slope/water/road/forest evidence and nearby settlement IDs.
   Tactical translation stays adapter-side under AD-20. No battle engine or army
   travel-time mechanic is implemented in this phase.

## Reproduction and evidence

Requires Node 22.12+ and WebGL2; browser verification uses installed Chrome.

```powershell
npm.cmd run map:dev
npm.cmd run validate
npm.cmd run map:build
npm.cmd run map:preview
# Select the URL printed by the server (5173 may already be occupied):
npm.cmd run map:verify -- http://127.0.0.1:5173
# Or verify the production artifact:
npm.cmd run map:verify -- http://127.0.0.1:4173
# Explicit atlas/terrain re-import, network needed only for uncached source bytes:
npm.cmd run map:atlas
npm.cmd run map:import
```

`map:atlas` compiles the existing pure identity/atlas modules, loads authored
candidate research and the limited discovery reference list, checks cached source
SHA-256 against `atlas-manifest.json`, and rebuilds the licensed derivative records.
`map:import` uses only existing/expansion records to regenerate the bounded terrain
bundle. A changed upstream hash requires deliberate reviewed manifest update.
The full licensed GIS download and RIS HTML used for research remain in ignored
`.runtime/`; neither is required to rebuild from the retained source caches/references.

Tests verify existing IDs, inactive/absent candidates, independent scope bounds,
coordinate round trips, distance sanity, label collision/priority/occlusion and
zoom tiers. Browser checks cover all previous interactions plus 23 active sites,
close selection, local labels and actual non-overlapping rendered rectangles.
The measured environment is Windows, i7-11800H, RTX 3060 laptop GPU, ~16 GB RAM,
headless Chrome at 1440 × 1000. Idle/reset FPS and JS heap are not broad gameplay
or low-end hardware guarantees; browser process private bytes/working set exclude
GPU VRAM and working-set totals can double-count shared pages.

- [Geographic overview](atlas-evidence/geographic.png)
- [Political selection](atlas-evidence/political-selection.png)
- [Neapolis and Campanian development](atlas-evidence/neapolis-close.png)
- [Nemi sanctuary and dense local labels](atlas-evidence/sanctuary-close.png)
- [Interaction/performance evidence](atlas-evidence/metrics.json)

Remaining work: reference attachment review and exact extent calibration, broader
independent political/founding research, final asset art direction, better coasts
and water, true tile streaming/seam tests, culture-specific city architecture,
campaign persistence promotion and source-backed route expansion. No engine
migration or future economic/political/demographic implementation is necessary here.
