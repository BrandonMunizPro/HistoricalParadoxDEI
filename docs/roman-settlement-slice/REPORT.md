# Roman/Italic visual pipeline: implementation and acceptance status

Implemented the reusable visual pipeline and its development integration. **This
does not complete the production Roman vertical slice.** There are no approved
authored Roman architectural assets in this checkout. Real-map placement also
exposes terrain failures that a flat-surface test cannot certify away. The normal
game retains its existing settlements. Opt in with `--settlement-visual-slice`
after Godot's `--` separator to exercise the six labelled development fixtures.

## A–B. Causes and existing architecture

See [AUDIT.md](AUDIT.md), written before integration. Neutral primitive houses,
prototype-generated meshes, repeated silhouettes, camera-dependent proxy scale,
city-specific branches and proximity residency explain the existing appearance.
Gameplay/presentation development data exists, but an authoritative population
simulation does not supply this renderer. Unknown demographics remain unknown.
The project already uses MultiMesh, asynchronous resource loading and terrain
contact checks. The implementation reuses these responsibilities and the existing
settlement owner and startup controller rather than introducing a map streamer.

## C–D. Files and contracts

- `src/presentation/settlement-visual-state.ts`: input/state/profile/asset types,
  normalization, culture resolution, deterministic seeds, specialization, visual
  save encoding and layer invalidation. Gameplay has no architectural file paths.
- `godot-prototype/settlement_visual_state.gd`: native contract counterpart.
- `settlement_visual_composition.gd`: deterministic district parcels, streets,
  enclosure/gates, terrain checks, named landmark reservations and harbor planning.
- `settlement_visual_renderer.gd`: retained baseline, staged replacement,
  threaded asset requests, material-preserving MultiMesh batches, LOD hysteresis,
  cache limits, state refresh and diagnostics.
- `settlement_population.gd`, `startup_preparation.gd`: existing-owner integration
  and startup baseline preparation. Existing world-readiness work is preserved.
- `data/settlement-visuals/{profiles,roman-assets,roman-fixtures}.json`:
  declarative configuration, required-asset manifest and synthetic test cases.
- `tools/roman-visual-definitions.mjs`: reproducible definition builder; it
  creates no architectural meshes.
- `tests/settlement-visual-state.test.ts`, native validation/runtime tools and
  `tools/settlement-visual-contract.mjs`: test and cross-language parity coverage.

The visual state carries graphical culture, rank, population/prosperity bands,
capital/terrain/coastal state, infrastructure levels, five specialization weights,
monuments, construction/damage and a stable seed. It is presentation state, not
a modification to campaign-save demographics or researched site records.

## E–G. Profile, ranks and specialization

Only `roman_italic` is implemented. Other culture keys are explicit extension
points with unavailable profiles, not recolored Roman art. Architecture culture
or an explicit graphical-culture rule selects the profile; ownership does not.
The material direction is tufa, lime stucco, terracotta and timber for 278 BCE.
The compressed spectacle chain is excluded from specialization mapping.

Five tiers have radii 65/140/240/380/560 m and increasing parcel/district/landmark
budgets. Rank changes footprint and composition, never building scale. Explicit
population thresholds are 1,000/5,000/20,000/75,000; absent population is not
fabricated. Active building-chain levels contribute commercial, military,
religious, civic and agricultural weights. Ruined or unmapped chains do not.
An explicit site-scoped monument slot reserves space without a Roma branch in
the common renderer. This is a slot for a missing hero asset, not a reconstruction.

## H–I. Harbor, wall and road behavior

Harbors use the unchanged source coastline index within 5 km, nearest-priority
and distributed candidates, segment tangent and water normal, land contact,
water-side sockets and a validated road to a gate/civic approach. No generic
port is placed at the site center. Port levels add waterfront parcels. Invalid
shoreline/land connections are reported, not silently placed inland.

Walls follow an irregular six-edge footprint with connected gate slots. Higher
levels add tower slots instead of enlarging wall meshes. A failed ring is
rejected whole. Road level changes width. Parcels reserve space outside road
ribbons, walls and other parcels; contact tests reject water, steep ground and
excessive relief. Segment clipping replaces overly conservative diagonal-road
bounding-box rejection. Each parcel gets independent attempts, so an impossible
temple does not block every subsequent house. These are composition rules, not
authored visible walls/roads: gate, road and port models are still missing.

## J. LOD, loading and refresh

Four representations use 2.5/15/160 km boundaries with 8% hysteresis. Production
paths can supply separate LODs and rank HLODs. A retained icon-assisted baseline
survives missing assets and async replacement. Development meshes are excluded
from world LOD; near/far prototype meshes exercise the other levels. This is not
proof that production HLODs exist or that final transitions are acceptable.

Startup establishes every registered baseline before allowing streaming. Plans
are reused across LOD changes; resource requests use a 10 s timeout. Mesh cache
accounting is estimated and bounded to 96 MiB, source-height arrays to 64 MiB.
This does not bound the engine's entire texture allocation or claim total GPU
residency. Work yields between candidates, including rejected candidates.
Large synchronous source reads/contact operations can still exceed the target.

Layer signatures include parcel dependencies on road width and shoreline gate
orientation. Unchanged same-LOD layer nodes are retained during refresh. Damage
and construction currently update metadata without rebuilding geometry; visible
condition variants require art. Affected plans are recomputed as a unit, while
unaffected mesh groups are reused. This is not incremental per-parcel planning.

## K–L. Asset production gate

**52 required assets; zero production-approved.** `roman-assets.json` enumerates
residential variants/clusters/courtyards, civic/market structures, Republican
shrines/temples, military yards, wall/corner/gate/tower, harbor/warehouse pieces,
rural/storage, roads/bridge, props, hero assets, foundations and seven HLODs.
Production resolution requires authored source, licensing evidence, period review,
UV/normal/PBR reviews and four existing LOD resources. Baking a prototype `.res`
cannot promote it. No Paradox/Creative Assembly assets were copied or extracted.

Existing project-original Roma showcase/settlement-identity `.res` resources are
reused **only as labelled development fixtures**, with their existing provenance.
Poly Haven CC0 material inputs remain reusable; they are not an authored Roman
building kit. No production architectural assets were reused or created.

## M–O. Measurements, tests and visual checks

[MEASUREMENTS.md](MEASUREMENTS.md) summarizes the native runs. Raw JSON and
before/after captures are in `godot-prototype/evidence/roman-settlement-slice/`.
The runtime harness visits Roma, Ostia, Capua, Aricia, Minturnae and Formiae at
0.65/4/35/500 km. These synthetic infrastructure/rank scenarios are not historical
start data. A native run uses actual startup preparation; isolated runs explicitly
bypass ordinary startup work and cannot be compared as startup improvements.

- 546 TypeScript tests across 39 files passed, including 27 new contract tests.
- Typecheck, production build/smoke and targeted ESLint passed.
- 436 native headless checks passed: determinism, culture, terrain/water rejection,
  enclosure/gate connectivity, harbor validity on controlled shores, serialization,
  refresh, missing art, infrastructure levels and road intersection precision.
- Six fixture states and all layer keys match across TypeScript and GDScript.
- Native RTX 3060/Vulkan runs completed all 24 views per route, retained registered
  baselines, bounded cache and condition-only refresh checks. Integration passing
  is explicitly separate from production acceptance and real placement rejection.
- Real captures were inspected for Roma, Ostia and Formiae. They demonstrate
  development layouts/markers, **not final visual quality**. Roma remains sparse;
  Formiae's steep source shore rejects the current harbor plan. Existing terrain
  and river graphics remain visible, including their independent limitations.
- Existing source-exact coastline validation and historical-integrity validation
  pass: 2,757,887 source segments preserved, 7,671 protected files unchanged.

The broader repository has pre-existing lint failures documented by the prior
world-readiness work. No whole-repository lint-clean claim is made here.

## P. Remaining limitations and acceptance failures

Production art, period review, authored landmark identity, final material/LOD QA,
damage/construction variants and final city silhouettes remain undelivered.
The real terrain rejects Roma's current wall ring and many building parcels;
Aricia has insufficient accepted parcels, and Formiae lacks a valid tested
harbor/approach. These require terrain-informed layout/foundation authoring and
more capable route planning; do not weaken contact checks or move historical
anchors to conceal them. Agricultural specialization selects rural pieces but
does not yet create a dedicated external field system. Harbor access links to
the internal plan, not an authoritative campaign-wide road graph.

No matched cold/warm settlement-generation disk-cache benchmark exists: plans
are session caches, no persistent settlement cache was introduced. Driver/OS
caches were not flushed. Native wall-frame intervals are not isolated GPU timing.
The diagnostics expose generation stalls; no general performance improvement is
claimed. The default map is preserved because this development slice cannot yet
pass the user's production visual acceptance criteria.
