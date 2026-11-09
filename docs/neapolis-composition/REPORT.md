# Neapolis settlement composition — 278 BCE presentation

The normal Godot campaign now uses a composition around Neapolis's existing
anchor, rather than replacing each neutral-house slot with another house.
This is a reusable presentation foundation, not a population model, upgrade
gameplay system, surveyed city reconstruction, or new settlement roster.

## Inspection and retained infrastructure

`settlement_population.gd` owns resident selection, camera-dependent detail,
terrain readiness, asynchronous construction, canonical anchors, and batched
settlement nodes. `neutral_settlement.gd` supplies deterministic generic slots.
`neapolis_housing_assets.gd` previously substituted three imported courtyard
assemblies without changing those slots. That explains the repeated-house
appearance: it never reserved a civic district or created public routes.

The existing assets include Kenney-derived courtyard houses, original Roma
architecture helpers, and Roman/Italic identity/development kits. The latter
include a high-podium sanctuary and later civic/spectacle forms unsuitable for
automatic adoption here. Compatible original masonry/roof/column helpers and
the courtyard resources are reused. No terrain, coastline, vegetation, water,
camera, historical-coordinate, research, ownership or simulation code is changed.

The original hidden neutral MultiMesh remains intact for audits and reversibility.
Only Neapolis's visible adapter changes, below the existing 30 km replacement
threshold. Near/far meshes still switch at 3 km; distant generic presentation is
unchanged. `--neapolis-housing-baseline` selects the preceding three-house
adapter; `--neapolis-neutral-baseline` selects the old generic presentation.

## Files and architecture

| Files | Responsibility |
| --- | --- |
| `godot-prototype/data/settlement-composition-catalog.json` | Categories, culture identifier, near/far assets, footprints, tier and placement requirements |
| `godot-prototype/data/neapolis-composition.json` | Seed, street junctions, neighborhoods, agora and authored landmark parcels; no duplicated historical anchor |
| `godot-prototype/settlement_composition.gd` | Deterministic planner taking a terrain/land sampler; conservative rotated bounds, clearances, access, grade/relief rejection and connected-road component |
| `godot-prototype/settlement_composition_renderer.gd` | Shared asynchronous MultiMesh adapter, asset requests/cache, terrain-following surfaces, contact plinths and access steps |
| `godot-prototype/settlement_composition_ground.gdshader` | Original texture-free worn soil/paving and soft surface edges |
| `godot-prototype/neapolis_composition_kit.gd` | Small Greek/Italic mesh set using existing geometry helpers |
| `godot-prototype/settlement_population.gd` | Five-line integration into the existing Neapolis-only replacement path |
| `godot-prototype/assets/neapolis-composition/` | Sixteen baked near/far resources, geometric manifest and provenance |
| `godot-prototype/tools/neapolis-composition-{bake,test,capture}.gd` and `neapolis-composition-compare.mjs` | Reproducible assets, property/constraint tests, matched-camera evidence and pixel/performance comparison |
| `godot-prototype/tools/neapolis-free-validate.gd` | Extended existing integration test; retains the previous adapter checks when explicitly selected |
| `godot-prototype/tools/neapolis-terrain-probe.gd` | Read-only diagnostic for the site's actual campaign terrain |
| `godot-prototype/evidence/neapolis-composition/` | Baseline/accepted screenshots, measurements, test results and protection audit |

Category definitions do not depend on the renderer. Each archetype has explicit
asset references, a conservative footprint, culture context, placement needs and
a tier. Future cultural assets or tiers can be added in data. No upgrade state,
construction economy or faction mechanics are introduced.

## Composition and placement

The accepted plan has 42 building parcels: 33 residential, two civic, one
religious, five commercial and one military. It uses eleven archetypes: three
courtyard forms, street house, stoa, meeting hall, sanctuary, market, workshop,
storage and watch facility. Infrastructure adds the agora, streets, access
paths, worn yards, edge drains and terrace steps. Repetition is confined to
reusable types rather than filling the town with extra buildings.

Three broad through streets and narrower connecting lanes organize the district.
The stoa, meeting hall, sanctuary and market frontages face the civic area.
House orientation follows street access, with seeded scale, courtyard/roof-form
and tint differences. Footprints, road buffers and public space are reserved
before accepting a parcel. One proposed western parcel is rejected because its
access would cross another parcel; it is not silently shifted into the street.

All 40 street segments are in the centre-connected graph, with one connected
access path per accepted building. This graph represents pedestrian access,
not gameplay pathfinding. Narrow drains are visual open-channel suggestions,
not a hydraulic simulation.

The existing displayed terrain around Neapolis has approximately 12% grade.
Buildings use sampled high points and bounded stone contact terraces, including
steps from access routes. Ordinary parcels allow up to 5.5 m sampled relief;
civic/religious parcels allow 8 m. Grade remains limited to 14%. These are
explicit campaign-art limits, not archaeological measurements. The open agora
and roads drape over the existing slope instead of leveling it.

Land and height checks cover a footprint grid, its centre, nearby gradients and
route width samples. This rejects coast crossings, steep parcels, local height
spikes and overlaps. Sampling uses the existing `world.elevation`/`is_land`
interfaces; their underlying raster resolution remains a limitation. There is
no terrain flattening or independent elevation dataset. The adapter receives
the owner's projected centre directly, avoiding latitude/longitude rounding
through a second Vector2 conversion.

## Historical basis, interpretation and licenses

[UNESCO](https://whc.unesco.org/en/list/726/) identifies the surviving rectangular
layout as part of Neapolis's **Greek foundation**. Ordered streets here are a
Greek colonial planning reference, not an imposed Roman military camp. The
displayed compact blocks and street dimensions are schematic and do not claim
to reproduce the actual ancient city's long insulae or historical extent.

The [University of Michigan Olynthos Project](https://sites.lsa.umich.edu/olynthos-project/olynthian-houses/)
supports courtyard/pastas domestic forms as a comparative Greek precedent.
It does not authenticate individual Neapolis houses or their room functions.

The stoa, meeting hall, modest colonnaded sanctuary, open market, workshops,
storehouse, watch building, precinct and terraces are interpretive. No deity,
excavated building identification, exact ancient street alignment, defensive
circuit or municipal institution is asserted for this site in 278 BCE.
There are no Imperial baths, aqueducts, triumphal arches or arena additions.

No assets were purchased or downloaded. Existing Kenney source modules are
CC0; existing Poly Haven material maps are CC0. Both publishers permit
commercial use without required attribution; retained credits and original
license/manifests remain linked in
[the new kit provenance](../../godot-prototype/assets/neapolis-composition/PROVENANCE.md).
New meshes/ground/stairs are original project work, not separately claimed CC0.

## Validation

- Existing application suite: **37 test files, 514 tests passed** (`npm test -- --reporter=dot`).
- ESLint passes for the new comparison tool; `git diff --check` passes.
- `neapolis-composition-test.gd`: passed deterministic composition, categories,
  tiers, asset bounds in both LODs, road/parcel separation, access obstruction,
  overlap rejection, coastal footprint sampling, steep-slope rejection and an
  interior terrain spike. A renamed alternate cultural asset family also uses
  the planner successfully without renderer changes. All accepted buildings
  have connected street access.
- Extended `neapolis-free-validate.gd`: passed actual Neapolis terrain contacts,
  live land masks, parcel separation, category presence, unchanged hidden
  baseline-slot hash, near/far switching, reversibility, 35 unchanged historical
  sites, 687 unchanged research records and unchanged ownership state.
  Its neighboring-resident count is zero at this tight camera, so that particular
  loop provides no neighboring-city coverage; separate control captures do.
- Protected-file audit confirms no tracked changes to canonical data/research
  or existing terrain, coast, camera, vegetation and water systems.
- The general `foundation-validate.gd` **does not pass**: its existing terrain
  contact assertion fails in the Roma construction path. A repeat with
  `--neapolis-neutral-baseline` produces the same assertion. It was not altered
  to hide that failure. See local `foundation.log` and `foundation-baseline.log`.
- Existing image-loading/export warnings remain in campaign startup logs.
  Native resources and live Godot campaign rendering succeed; this task does
  not claim an exported-build validation.
- One later headless repeat emitted dummy-renderer material RID errors after
  completing its assertions. The final integration repeat used the actual
  Vulkan/Forward+ GPU backend and completed with the pass marker and no
  `ERROR`/`SCRIPT ERROR` entries (`native-gpu.log`, `native-gpu-errors.log`).

## Screenshots and performance

Captures use 1920×1080 Forward+ on the RTX 3060 Laptop GPU. Baseline cameras are
recorded and reapplied exactly, including basis, position, FOV, near and far.
Water time is frozen. Each view records 180 uncapped submitted intervals and
GPU/CPU diagnostics; these are not sustained interactive FPS benchmarks.

- [Before, campaign close](../../godot-prototype/evidence/neapolis-composition/before/close.png)
- [After, campaign close](../../godot-prototype/evidence/neapolis-composition/accepted/close.png)
- [Before, oblique](../../godot-prototype/evidence/neapolis-composition/before/oblique.png)
- [After, oblique](../../godot-prototype/evidence/neapolis-composition/accepted/oblique.png)
- [After, higher pitch](../../godot-prototype/evidence/neapolis-composition/accepted/district.png)
- [Raw baseline measurements](../../godot-prototype/evidence/neapolis-composition/before/views.json)
- [Raw accepted measurements](../../godot-prototype/evidence/neapolis-composition/accepted/views.json)

| Camera | Before GPU ms | After GPU ms | Before scene draws | After scene draws |
| --- | ---: | ---: | ---: | ---: |
| Campaign close, 1.5 km | 10.49 | 10.24 | 315 | 409 |
| Oblique, 0.8 km | 12.98 | 12.75 | 366 | 441 |
| Higher pitch, 0.65 km | 10.52 | 10.34 | 231 | 344 |
| Regional, 4 km | 9.93 | 10.15 | 362 | 430 |
| Roma control, 12 km | 10.48 | 11.19 | 685 | 685 |
| Catana control, 12 km | 11.29 | 11.81 | 502 | 502 |

The new settlement submits **69,794 triangles**, including streets, plinths and
431 small access steps, versus 100,392 for the preceding house adapter. It uses
**13 batch nodes** and **42 main-pass material groups**, versus three nodes and
seven groups. Shadow passes increase whole-scene draw calls further. There are
no per-building scene nodes. New mesh/provenance assets total about 1.29 MiB;
there are no new texture downloads.

Steady GPU measurements remain close to baseline, within roughly -2.4% to +2.3%
for Neapolis views. Control GPU time also varies, so these small differences
are not evidence of a speed improvement. Raw submitted-frame timings have
scheduling/presentation noise and should not be reported as gameplay FPS.

Construction is **more expensive**: the accepted close capture measures 529.9 ms
active CPU spread over 2,389.9 ms wall time, with a longest recorded chunk of
20.5 ms. The headless integration run measures 611.1 ms active, 1,677.1 ms wall
and an 11.5 ms maximum chunk. The previous house substitution itself took about
0.75 ms active in the baseline capture. Cooperative construction prevents the
initial 500+ ms single-frame hitch, but the full first-load work and an occasional
frame over 16.7 ms remain limitations. The old resident stays visible until the
replacement is complete. Caching accepted contact/layout results is a sensible
next performance improvement before expanding to additional cities.

The final GPU-backed integration repeat after the data-reuse checks measured
589.4 ms active CPU over 2,280.2 ms wall time, with a 21.4 ms maximum chunk.
It produces the same 42 parcels and 69,794 triangles. These figures reinforce
the first-construction hitch limitation; they are not omitted from acceptance.

All six recorded cameras match exactly. Catana's control image is pixel-identical;
Roma has 23,104 changed pixels (1.11%), despite identical draw counts and no
changed source/assets there. Manual comparison shows the same city and landscape;
the remaining capture differences are not established as pixel-equivalent and
are recorded without attributing an unverified cause. See
[comparison.json](../../godot-prototype/evidence/neapolis-composition/comparison.json).

**Visual assessment after inspecting the actual accepted renders:** the close
and oblique campaign cameras now show an organized street network, a clear agora,
distinct colonnaded sanctuary and stoa, visible market canopies, workshop kilns,
and residential roof/size differences. The requested composition distinction is
present. This remains schematic campaign art, with open grass in the blocks,
straight simplified road edges and conspicuous retaining bases. At 4 km the
layout is visible but individual categories are small; distant generic proxies
remain unchanged. This is not a claim of dense urban fabric or final art quality.

## Remaining limitations and next milestone

This is a small schematic district: it remains more open than a dense ancient
urban fabric, and its street/yard treatment is simplified. Contact terraces are
conspicuous at low pitch because the inherited campaign terrain is steep at
building scale. Roofs and storefronts lack final authored detail, the watch
facility is deliberately modest, and distant generic LODs do not expose all
categories. The main street geometry is ordered; it is not an archaeological
plan of Neapolis.

The next milestone should be a Neapolis-only block/terrace art pass: more
convincing shared frontage, stairs/retaining walls, precinct edges, market
canopies and ground material transitions, with stronger archaeological siting
research. Reuse these categories and placement rules; do not substitute a large
new house count or begin upgrade gameplay to solve the remaining art issues.
