# Settlement development and cultural visual architecture — Roma vertical slice

## Result and boundaries

A working, opt-in development preview now renders Roma's supplied starting
buildings and switches their real geometry through three levels. **Roma starts
with Forum III and grain storage II; four development slots remain empty.**
Those choices live in JSON, not rendering branches. The maximum chain level is
independent of each starting level. Forum III is a game-design classification,
not a claim of three literal historical construction stages.

Open [actual Godot screenshots and comparisons](index.html),
[performance summary](performance-summary.json),
[raw final measurements](after-final/performance.json),
[licenses](asset-license-manifest.json), [integrity](integrity.json), and
[native/UI checks](after-final/runtime-validation.json).

This implements the reusable architecture and two complete Roman visual chains.
It does **not** finish the other cultural art kits, populate 700 cities, establish
2026 commercial visual quality, or implement a campaign economy. No ownership,
factions, armies, characters, diplomacy or gameplay construction was added.

## Repository audit and implementation decisions

Before editing, the existing implementation was inspected:

- `src/presentation/settlement-development.ts` is an older pure presentation
  selector, with synthetic external snapshots and three architectural cultures.
  It remains intact. Its category slots were not promoted into universal
  development-slot rules. The new contract is separately named and remains a
  prototype read model, consistent with the existing presentation boundary.
- `docs/architecture/settlement-visual-development-architecture.md` describes
  development authority as a future simulation concern. The developer UI edits
  a disposable in-memory preview. It does not finalize that campaign aggregate,
  persist state, create production, or silently resolve open simulation decisions.
- There are **35 protected active sites**, **687 research records**, and a
  **460-file protected hash snapshot**. Research locations are not automatically
  approved settlements, assigned architectural cultures, classified as major
  cities, or filled with invented buildings. The architecture accepts independent
  configurations for those identities when research supports them.
- Godot 4.7.2 uses Vulkan Forward+, existing MSAA, anisotropic filtering, SSAO,
  atmosphere and native terrain streaming. The previous opt-in Roma showcase
  already provides a 50-placement kit and CC0 material imports. It was preserved.
  This feature layers onto it with a separate flag and composition overlay.
- The civic anchor `(47,-22)` metres and its -18 degree orientation are inherited
  from that showcase. The first storage anchor is also inherited. No geographic
  identity, source elevation or canonical settlement coordinate changed.
- No applicable `AGENTS.md` was found in the workspace/ancestor paths inspected.
  No subagents were used. No edits were made to The Rev.

The implementation order was contract/catalog and tests, native meshes and
placement adapter, real UI interaction, then matched render/performance capture.
The previous failed/rejected visual experiments and evidence were retained.

## Data contract

The typed contract is
[`settlement-development-system.ts`](../../../src/presentation/settlement-development-system.ts).
The external structural schema is
[`settlement-development.schema.json`](../../data/settlement-development.schema.json).
TypeScript validation additionally enforces cross-references, chronology,
three-level progression, capacity, prerequisites and landmark restrictions.

Separate records describe:

| Concept | Responsibility |
|---|---|
| Building definition | Category, cultural/period eligibility, prerequisites and maximum level |
| Building stage | Exactly I, II or III, stage name, unique visual key, reserved effect references |
| Visual definition | Culture/style, actual near/far resource paths, footprint and silhouette |
| Architectural culture | Independent material, roof, form and detail specifications; no political owner |
| Settlement class | Major = 6 slots, minor = 4; no universal category arrangement |
| Starting development | Existing settlement ID, per-slot building and independently supplied starting level |
| Historical landmark | Restricted identities/chain/minimum level and separate modifier references |
| Resource deposit | Mineral and evidence, independently supplied for the settlement context |
| Terrain/technology | Required site tags, evidenced technology and surveyed water-route prerequisites |
| Future effects | Named hooks with null magnitudes; no costs, yields or balance values |

All six Roma slots have unrestricted category lists. A future site may restrict
individual slots, but categories are not implied by slot indices. Empty slots
have no building and consume no visual resource. The UI lists eligible chain
definitions for an empty slot; it does not build unimplemented chains.

The catalog contains **20 three-level definitions** across food, religion, civic,
industry, trade and military: farms, irrigation, grain storage, sanctuaries,
civic squares/Forum, qualified Greek baths, buried aqueduct conduits, markets,
aromatics trade, ports, warehouses, bronze workshops, walls, training compounds,
iron/gold/copper/tin extraction and quarries. **Only the Forum and grain chain
currently have finished native visual variants in this slice.** A definition
does not imply an available construction option or finished asset.

Extraction requires an evidenced local deposit plus rocky terrain. Roma is not
given invented iron/gold/copper/tin/stone deposits. Ports require coastal and
navigable context. Water infrastructure requires freshwater, relevant technology
where specified, and a source-evidenced, finite, strictly downhill route supplied
in metres. No route is invented for Roma, so its aqueduct definition is currently
ineligible. Full GIS verification, intake/outlet design and infrastructure art
remain future work; checking supplied heights is not a hydrological survey.

## Culture and historical qualifications

The nine architecture-family design records are Roman/Italic, Greek/Hellenistic,
regional Celtic, Thracian, Dacian, Illyrian, Punic, Kemetic Egyptian and
Hellenistic Egyptian. They specify different roofs, materials, forms and details,
not just color variants. IDs, regional styles and parent references are extensible.
These are starting design specifications, not nine completed archaeological art
kits. Particularly broad labels such as Celtic and Illyrian require regional
subdivision and more site evidence before production artwork.

Asset resolution uses exact architecture culture plus regional style, then an
explicit default style **within the same culture**. It never falls back to Roman
meshes for another culture. Missing near/far resources preserve slot/state,
produce a labelled art gap in Godot and explain the absence in the UI. No box
is inserted as a substitute. Architectural provenance is independent of any
future ownership; no conquest-triggered replacement behavior exists.

Historical references used include the existing Roma/Pleiades evidence,
the [Oxford research on Curia/Forum memory](https://ora.ox.ac.uk/objects/uuid%3A939fea0c-5032-4a44-9b6f-0dffff53d0cc/files/d3r074v341),
[University of California Press discussion of the Republican Comitium](https://publishing.cdlib.org/ucpressebooks/public/book/representations-images-of-the-world-in-ciceronian-oratory.html),
[ASCSA's excavated Corinth bath sequence](https://www.ascsa.edu.gr/uploads/media/hesperia/148226.pdf),
and [Parco Appia's aqueduct overview](https://www.parcoappiaantica.it/itinerari/acquedotti/).
The official Colosseum Forum URL in the starting evidence timed out during this
run; that page is not treated as a verified detailed plan. No commercial game
art or code was downloaded or copied.

The civic kit represents assembly space, council house, tabernae and rostra.
Its curved assembly seating is interpretive: the circular Comitium's chronology
and exact 278 BCE layout are not independently established by this model.
There is no imperial basilica, marble imperial forum, Colosseum, imperial
Pantheon, monumental aqueduct arcade or Roman thermae. The bath chain is gated
to qualified Greek architectural contexts and a separate technology definition.
The granary's II starting classification and placement are interpretive urban
provisioning, not an attested individual excavated building at that coordinate.

## Working Godot behavior

Run:

```powershell
.\godot-prototype\settlement-development.ps1
.\godot-prototype\settlement-development.ps1 -Baseline
```

Select one of six slots. The first two have I/II/III preview buttons. Clicking
loads a different baked mesh, footprint and silhouette immediately. Empty slots
remain inspectable with disabled level buttons. Reset restores Forum III/grain II.
Inspect, city and strategic camera buttons work alongside normal navigation.
The UI explicitly labels the temporary preview and keeps starting/max levels
and building/landmark effects separate. Closing the process discards previews.

The civic ladder goes from an open assembly area to council house/partial
frontage, then a Curia/assembly/rostra precinct framed by tabernae. The grain
ladder goes from one raised store to a long ventilated granary/threshing yard,
then twin grain houses with rear stores and a working courtyard. Raised floors,
vents, loading ramps, pots, grain stooks, roof detail and civic colonnades are
real geometry. There are **12 native resources: six near and six far**.

The authored overlay replaces the old civic structure and one storehouse,
relocates one background house to clear the maximum footprint, joins paths
to the two developments, adds footprint-aware grading/worn yards, and replaces
the disconnected eastern wall fragments with a joined, terrain-draped boundary
curtain and a deliberate approach opening. This is an illustrative precinct,
not a surveyed circuit of ancient Rome's walls. Other old houses, temple and
scenery remain background presentation, not newly inferred occupied slots.

Only Roma is connected to the live adapter. Shared catalogs, meshes, bounded
ground caches and resident-tile culling avoid individually authored city scenes.
Native far meshes switch at 3 km; the local ground patch switches off at 15 km.
Strategic map symbols grow from physical scale at 15 km to a **6x representation
at 30 km** and clear terrain at their footprint corners. This improves Roma's
previously almost invisible silhouette, but individual details remain too small
to read at 45 km. It is map-symbol exaggeration, not historical geographic size.
LOD transitions remain discrete; they are not claimed seamless.

## Performance and captures

`before` is the previous Roma showcase. **`after-final` is the review candidate.**
`after-initial`, `after` and `after-readable` retain diagnostic iterations; do not
substitute them for the final package. The latter exposed strategic readability
and ambiguous selected-slot status wording, both corrected before final capture.

The report generator asserts exact camera equality for before/after city and
strategic views and identical cameras within each three-level close sequence.
Twelve full-resolution screenshots are included. Level buttons are exercised
through their actual UI signals; rendered resource IDs and levels must agree
with state before screenshots are saved. Strategic I/II/III compares **both**
chains at that level; those are not the initial campaign configuration.

Each view measures 600 settled wall-clock intervals at 1920x1080 on the RTX 3060
Laptop. Each interval forces GPU rendering with automatic rendering disabled;
the hidden window does not swap buffers. These are controlled rendered results,
**not presented-frame/PresentMon measurements**. The slowest six intervals form
the 1% low. Temperatures, clocks and device-wide Nvidia samples are retained.
Shader caches are retained; no clean-cache cold-start claim is made.

Final city overview: **66.8 average / 53.5 FPS 1% low**, compared with
**67.4 / 53.4** for the previous showcase. Civic I/II/III averages are
**91.5 / 90.4 / 86.3 FPS**; grain I/II/III averages are
**82.7 / 81.5 / 78.8 FPS**. Grain III's 1% low is **56.4 FPS**.
Strategic views remain at the existing ~120 FPS cap. Thus all averages meet 60,
but the complete smooth-60 target is **not passed**.

Scene instantiation is **3.08 seconds**, followed by **22.03 seconds** to the
first settled city capture, including streaming and the imposed settle wait.
Its worst readiness interval is **176.6 ms**. Peak sampled RAM is
**1,509,928,960 bytes (~1.41 GiB)** versus **1,500,983,296** before; engine
video allocations are about **1.19 GiB**. These are retained-cache observations,
not evidence that cold-start or first-use stalls have been eliminated.

See [the generated performance table](performance-table.md) for final FPS,
1% lows, worst settled frames and readiness stalls. Scene instantiation is
separate from asynchronous streaming/readiness. Readiness waits also include
180 frames by design; they are not pure loader execution times. Engine VRAM
counters are allocations, not independently measured physical process residency.
Nvidia samples cover the whole device. Process RAM peaks are sampled working set.
The existing 120 FPS cap limits strategic measurements.

## Tests and validation

- 36 focused Vitest tests pass across the new development contract, existing
  visual-selector regression tests and approved-site tests. Coverage includes
  6/4 slot limits, independent starts/maxima, progression, valid references,
  cultural/style resolution, missing assets, landmark restrictions, separate
  effects, deposits, terrain, water routes, technology and protected bytes.
- A synthetic 700-record validation exercise demonstrates the data architecture
  without creating scenes or modifying real researched records. It is not a
  700-city GPU benchmark or historical assignment of those buildings.
- Headless Godot validation loads all six near/far pairs, checks actual mesh
  bounds/silhouette differences, starting levels, invalid levels, reset,
  missing-culture art, landmark and prerequisite restrictions.
- Real UI/renderer assertions verify button-driven levels, empty-slot behavior,
  state/render agreement, reset and a deliberately missing resource path. Missing
  art displays a gap instead of corrupting state; the resource path is restored.
- Oriented native bounds were checked for all nine civic/grain level combinations:
  no overlaps exceeding 0.15 m. This is not a navigation/walkability test.
- TypeScript typechecking and scoped ESLint pass. Final Godot capture logs have
  no script errors. Existing runtime-image/export warnings remain; this is not
  claimed to be an export-ready build or full unrelated application validation.
- All 460 protected files remain byte-identical; all 35 canonical active
  settlement IDs/coordinates and all 687 research records are preserved.

## Changed files and assets

Primary source additions:

- `src/presentation/settlement-development-system.ts` and its focused test.
- `data/settlement-development-{catalog,starts}.json`, structural schema, and
  `data/roma-development-composition.json`.
- `settlement_development.gd`, `_view.gd`, `_ui.gd`, `_kit.gd`.
- `tools/development-{bake,validate,profile,preview}.gd`, capture launcher,
  layout checker and report builder; `settlement-development.ps1`.
- `assets/settlement-development/`: twelve original meshes, geometry manifest
  and provenance. Existing CC0 material maps are reused; **zero new downloads**.
- This evidence directory, native validation, raw samples/process logs and hashes.

Integration changes are confined to `roma_settlement.gd`, `roma_showcase.gd`
and the README. The existing default/showcase paths remain available; the new
development data is loaded only with `--settlement-development`. Existing working
tree changes from the preceding visual task were preserved, not reverted.
Godot also creates additive import/UID metadata. No commits or pushes were made.

## Remaining limitations and next work

The functional system is proven in Roma, but the visual target is not finished.
The surrounding houses remain repetitive, facades/material wear still need an
artist's treatment, the streets lack dense environmental storytelling, the
ground transition is simple, and the large inherited temple still dominates the
precinct. The river, distant vegetation and regional terrain remain the old
prototype. Strategic buildings are symbols, not a finished macro-city silhouette.
The scene still has a miniature appearance in wide views. Tests cannot certify
artistic success.

Most chain/culture combinations deliberately have no finished art. Produce and
review one additional culture-specific chain using evidence and genuinely
different geometry before wider rollout. Refine the Forum's frontage, wear,
ornament and street contacts; improve strategic LOD composition and remaining
frame-time tails; then add researched per-settlement starts progressively.
Infrastructure requires surveyed routes and local water/deposit evidence before
assets can be plausibly placed. Do not expand Roma's prototype models worldwide.

This package stops at review. The Rev, protected geography/research, simulation
ownership and campaign economy were not modified.
