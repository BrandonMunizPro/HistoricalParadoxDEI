# Settlement visual development — prioritized Codex handoff

**Status: Proposal (2026-10-14).** A prioritized implementation handoff from the
Big Pickle research/architecture track to the Codex presentation/geography track.
It does **not** authorize production art before the Visual Design Bible gate
(`../presentation/artwork-production-roadmap.md` §1), does **not** finalize a
runtime schema, and does **not** resolve OPEN decisions (AD-33, ADR-0019).

Read first:
[`settlement-visual-development-architecture.md`](settlement-visual-development-architecture.md) (the boundary),
`../research/r16-settlement-architecture-and-visual-identity.md` (the historical matrix),
`../research/settlement-procedural-component-catalog.md` (the components),
`../research/settlement-architecture-evidence-and-anachronism-register.md` (the guards).

## 1. Where we are

The VS-5 track already built a **conforming seam**:

- `src/presentation/settlement-development.ts` — pure selector over an external
  snapshot; typed catalog with culture/period/tier/level/geographic eligibility.
- `map/architectural-modules.js` — renders selected archetypes in stable slots.
- `public/data/development-visual-fixtures.json` — presentation fixtures.
- `docs/vs5/geographic-fidelity-and-development-visuals.md` §Phase 4 — documents
  the seam and its dependency on a simulation-side read model.

**The seam is correct and must be preserved.** This handoff does not ask Codex to
build simulation rules; it asks for **presentation content and robustness** built
strictly on the existing "presentation reads supplied state" boundary.

## 2. Priority-ordered work

### P1 — Preserve and harden the boundary (do first)

- **Keep presentation read-only.** No prices, production, queues, ownership
  decisions, population or turn progression in renderer code.
- **Revision-gated re-selection**: on a changed `revision`, re-run the pure
  selector; never mutate the supplied snapshot; identical inputs ⇒ identical
  output regardless of array order ([ADR-0008](../adr/0008-determinism-and-reproducibility.md)).
- **Stable category slots**: adding a catalog entry must not relocate an existing
  category (existing prototype rule — keep a test for it).
- **Acceptance:** existing VS-5 tests still pass; `npm run validate` green;
  no renderer key enters `src/domain/`.

### P2 — Extend the component library (content, from the catalog)

Add components in this order (all presentation-only, evidence-classed):

1. **Fortification family** (currently missing as a first-class family): wall
   segments (tuff ashlar / polygonal / mud-brick-on-stone / massive ashlar /
   earth-timber), gates (simple, bent, arched), towers, citadel/acropolis,
   rampart/ditch. Driven by a supplied `walls`/fortification state.
2. **Temple variants** by tradition: Italic podium (Tuscan), Greek peripteral
   (Doric/Ionic/Corinthian), Punic shrine + tophet, Egyptian pylon.
3. **Residential archetypes** by culture × environment: atrium domus, courtyard/
   pastas house, flat-roof mud-brick, wattle-and-daub, tower house.
4. **Commercial/maritime**: quay, mole, warehouse (cothon only as [R]).
5. **Agricultural**: field system, terrace, irrigation works, farmstead.
6. **Condition overlays**: damaged, ruined/rubble, under-construction.
- **Acceptance:** each component carries `periodWindow` + `evidenceClass`;
  period-ineligible components cannot be selected at 278; unit tests for
  eligibility and for [X] anachronism rejection.

### P3 — Environment (terrain) adaptation

- Add **terrain archetypes** (hilltop/terraced, coastal/maritime, riverine,
  plain, oasis/desert-edge) as a composition base derived from **authoritative
  geography** inputs ([ADR-0020](../adr/0020-campaign-geography-and-tactical-battlefield-projection.md)),
  not from a second geographic source.
- Confirm the same culture yields different looks across environments, and the
  same environment hosts different cultures.
- **Acceptance:** a deterministic mapping test: `(culture × environment × level
  × condition)` → component set, order-independent.

### P4 — Cultural architectural inheritance

- Support **provenance layers**: render the settlement's original-tradition mass
  plus later additions tagged with their own culture/era, rather than a single
  skin swap on ownership change.
- Ensure **control/ownership** changes (`CampaignMapState.settlementControl`)
  affect political styling only — never silently restyle architecture.
- **Acceptance:** a control transfer does not alter the architectural component
  selection unless the supplied development snapshot changes.

### P5 — Lifecycle rendering

- Render `condition ∈ {active, damaged, ruined, under-construction}`.
- On **destruction**: ruins/rubble; identity remains referenceable.
- On **abandonment**: decayed but present.
- On **expansion/founding**: new structures/quarters under new stable IDs.
- **Acceptance:** selection tests for each condition; ended identity remains
  resolvable and never reused.

### P6 — Scalability and performance validation

- Validate **detail-level** city rendering (not just markers) against the ~700
  managed-settlement envelope and its growth headroom.
- Keep components **instanced and culled**; LOD must not change identity.
- Confirm supporting sites (villages/farms/estates/mines) stay **landscape**, not
  managed settlements (AD-33 OPEN).
- **Acceptance:** measured performance evidence at representative quantities;
  documented limits, not a claim of unlimited capacity.

## 3. Dependencies and blockers (do not work around these)

| Dependency | Owner | Note |
| --- | --- | --- |
| **Authoritative settlement development read model** | Simulation/domain (OPEN) | Proposed shape in the architecture doc §3; **not finalized**. Codex consumes it once approved. |
| **AD-33** (granularity/scale/tiers) | OPEN | Presentation must not pre-commit tiers or density. |
| **ADR-0019** (renderer) | OPEN | Renderer remains Unresolved; Three.js is a presentation-track prototype, not an approved engine. |
| **Visual Design Bible gate** | Presentation | No mass asset generation before the standard exists. |
| **Art asset production** | Presentation | This handoff provides the *catalog design*, not the art. |
| **Licensed/custom assets** | Presentation | No proprietary mod/game assets; period/culture-specific licensed assets still needed for premium quality. |

**If the read model is not yet approved, build only against the existing fixture
snapshot** (as today) and keep the selector a pure function of supplied state.

## 4. What Codex must NOT do

- **Do not change domain/simulation types** or add renderer keys to
  `src/domain/`.
- **Do not implement** settlement construction rules, prices, production,
  population, ownership decisions or turn progression — that is a future
  decision, not this assignment.
- **Do not finalize** the read-model schema or close AD-33 / ADR-0019.
- **Do not import** proprietary game/mod assets, maps, textures or code.
- **Do not render** any [X] anachronism (register §3) or period-ineligible asset.
- **Do not** make the renderer a second source of geographic or historical truth.

## 5. Suggested validation

```sh
npm run validate          # typecheck, lint, tests, build smoke
npm run map:build
npm run map:preview       # http://127.0.0.1:4173
npm run map:verify:italy  # production Chrome tour/screenshots
```

Add/extend tests for: stable category slots; revision-gated re-selection;
order-independence; culture/period/environment eligibility; [X] anachronism
rejection; condition rendering (active/damaged/ruined/under-construction);
provenance layering under control transfer; unchanged settlement coordinates/IDs
under snapshot changes.

## 6. Hand-off summary

1. Keep the existing seam read-only and deterministic (**P1**).
2. Fill the catalog with the researched components, evidence-classed (**P2**).
3. Add environment adaptation from authoritative geography (**P3**).
4. Add cultural architectural inheritance (**P4**).
5. Render the lifecycle honestly (**P5**).
6. Prove detail-level scalability without closing AD-33 (**P6**).

Everything depends on the **simulation-side read model** and the **Visual Design
Bible gate**; until then, work stays on the fixture snapshot and produces no
authoritative or production art.
