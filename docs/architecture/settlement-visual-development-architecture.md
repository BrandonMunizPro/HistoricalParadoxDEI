# Settlement visual development architecture

**Status: Proposal (2026-10-14).** How **authoritative settlement development
state** maps to **visual building/asset selection**, so the renderer *displays
simulation outcomes* rather than deciding what a settlement has built. This
document proposes a boundary and an interface shape; it **does not finalize a
runtime schema and does not resolve any OPEN decision** (AD-33, ADR-0019 stay
OPEN).

Authority: **ADR-0019** (presentation boundary — presentation reads simulation
state, never writes it), **ADR-0020** (campaign geography and projection),
**ADR-0009** (identity), **ADR-0018** (mutable government), **ADR-0017**
(population cohorts). Related: [`geography-integration-requirements.md`](geography-integration-requirements.md),
`../research/r16-settlement-architecture-and-visual-identity.md`,
`../research/settlement-procedural-component-catalog.md`,
`../research/settlement-architecture-evidence-and-anachronism-register.md`,
[`settlement-visual-development-codex-handoff.md`](settlement-visual-development-codex-handoff.md),
`../presentation/artwork-production-roadmap.md` §8.

## 1. The boundary rule

**The simulation owns settlement development. Presentation displays it.**

- Presentation **never** decides that a settlement has built something, never
  prices an upgrade, never runs construction, production, queues or turn
  progression. It consumes a **read model**.
- A settlement's *appearance* is a **pure function** of supplied authoritative
  state (development, culture, period, condition, environment) — deterministic
  and independent of input ordering ([ADR-0008](../adr/0008-determinism-and-reproducibility.md)).
- This is the same identity/ownership/presentation split already enforced for
  geography ([`geography-integration-requirements.md`](geography-integration-requirements.md) §3).

## 2. What already exists (Codex prototype seam)

The VS-5 presentation track already implemented a conforming seam; this proposal
builds on it rather than replacing it:

- `src/presentation/settlement-development.ts` — a **pure selector** over an
  externally supplied snapshot (`settlementId`, `revision`, `structures[]` with
  identity, `category`, `level`, `condition`), plus a typed asset catalog with
  culture/period/tier/level/geographic eligibility. Empty snapshot ⇒ no
  development assets.
- `map/architectural-modules.js` — renders selected archetypes (civic hall,
  culture-specific sanctuary, market stalls, orchard, maritime storehouse,
  training yard) in **stable category slots** (an added module does not relocate
  an existing one).
- Presentation fixtures in `public/data/development-visual-fixtures.json`,
  explicitly marked `synthetic`/presentation-only.

That seam is a **presentation adapter proposal**, not an authoritative campaign
aggregate. The missing piece — and the purpose of this document — is the
**authoritative read model** the application/simulation side must define and
supply (Codex's documented dependency). It is specified here as a **proposal**,
not a finalized schema.

## 3. Proposed authoritative read model (shape, not schema)

Three layers, kept strictly separate:

1. **Authoritative settlement state (simulation).** Owned by the settlement
   aggregate (E12) and related systems. Holds, per settlement: canonical
   **identity** ([ADR-0009](../adr/0009-identity-model.md)); **development** (what
   exists — structures/districts/works with stable identities and their own
   construction/damage history); **population/economy** aggregates
   ([ADR-0017](../adr/0017-population-cohorts-migration-and-displacement.md));
   **control/ownership** (mutable political state — *not* part of architectural
   identity); **status** (tier/importance as mutable campaign classification).
2. **Read model (application boundary).** A **projection** the simulation exposes
   for presentation. Proposed minimum fields per settlement and per structure
   (illustrative, not final):

   | Field | Meaning | Notes |
   | --- | --- | --- |
   | `settlementId` | stable canonical identity | never a renderer key |
   | `revision` | monotonic state revision | lets presentation re-select deterministically |
   | `culture`, `architecturalTradition` | current ruling culture + settlement's building tradition(s) | supports inheritance (§5) |
   | `period` | simulation period/era context | gates asset eligibility |
   | `tier`, `status` | mutable importance classification | presentation seed, not identity |
   | `environment` | terrain/coastal/riverine/oasis context | from geography ([ADR-0020](../adr/0020-campaign-geography-and-tactical-battlefield-projection.md)) |
   | `structures[]` | existing structures (`id`, `category`, `level`, `condition`, `provenance`) | only supplied structures render |
   | `walls` | fortification state (`circuit`, `towers`, `gates`, `extent`) | visual mass derived from supplied state; not renderer-invented |
   | `expansions[]` | visible quarters/district growth, if modelled | optional; presentation seed |

   `condition ∈ { active, damaged, ruined, under-construction }`; `provenance`
   tags the **building culture/era** of the structure, distinct from current
   owner.

3. **Presentation selection (renderer).** The pure selector maps
   `(culture × tradition × environment × category × level × condition × period)`
   to a **component/asset** from the catalog. Deterministic, order-independent,
   revision-gated.

**No runtime schema is finalized here.** Field names above are illustrative and
marked **Proposal**; AD-33 and the settlement aggregate remain OPEN.

## 4. Development → visual assets (the mapping proposal)

**Development dimensions** (from the research matrix §6), each a visible ladder;
the simulation decides the rung, presentation renders it:

| Dimension | rung 0 | rung 1 | rung 2 | rung 3 | Visual asset family |
| --- | --- | --- | --- | --- | --- |
| Fortification | none | simple circuit | towers/monumental gate | extended enceinte / new quarter | wall segment, gate, tower |
| Civic | open space | council/senate hall | monumental civic core | — | civic shell, portico, platform |
| Religious | altar/precinct | temple | sanctuary complex/terraces | — | temple type, altar, terrace |
| Residential | few houses | denser housing | elite house (atrium/peristyle) | — | house archetypes |
| Commercial/maritime | market | permanent market/warehouse | harbour works | — | stalls, warehouse, quay/mole/cothon |
| Agricultural | fields | irrigation/terraces | estate/landscape investment | — | orchard, terrace, field, canal |
| Administrative status | town | regional hub | capital | — | palace/administrative buildings |

Rules:

- **Cumulative and readable.** Upgrades add visible mass or replace an existing
  structure of the same identity; they do not silently recolour a settlement.
- **Stable category slots.** As in the current prototype, a new module may not
  relocate an existing category (identity stability).
- **`level` is bounded per category** by the researched chronology (a settlement
  cannot display a rung unsupported at 278 — §9).
- **Environment gates assets** (maritime works only on coastal/riverine
  eligibility; terraces on slopes; irrigation in arid contexts).

## 5. Culture and architectural inheritance

Conquest **must not instantly replace architecture with the conqueror's culture**
(research matrix §7). The read model therefore carries **two distinct concepts**:

- **Current ruling culture / period** — governs *new* construction and any
  deliberate rebuilding (and the political styling of the settlement).
- **Architectural provenance per structure** — the **building culture/era** of
  each existing structure. A Greek city taken by Rome keeps its Greek fabric; new
  Roman additions appear only as the simulation builds them, with **syncretism**
  where evidence supports it.

Presentation renders the **layered** result: original-tradition mass + later
additions + condition, not a single skin swap on ownership change. This mirrors
the identity/control separation already required for geography.

## 6. Lifecycle: founding, expansion, destruction, abandonment

Preserved from `r16-settlement-scale-and-regional-distribution.md` §8 and the
atlas policy:

- **Stable identity** across all changes; a settlement/foundation ID is unique,
  immutable and never reused (ADR-0009).
- **Founding / expansion** add structures/quarters under new stable IDs.
- **Destruction** sets structures to `ruined` (rubble representation) and may
  reduce development; the identity remains referenceable.
- **Abandonment** leaves structures decaying/unmaintained; presentation shows
  disrepair, not deletion.
- **Importance change** moves `tier`/`status` (mutable classification) without
  regenerating IDs or editing research evidence.
- **Location continuity ≠ settlement continuity**: a new foundation at an old
  site is reconciled separately (Sybaris/Thurii/Copia policy in the world-scope
  doc).

## 7. Identity, determinism and revision

- Selection is a **pure function** of the read model + catalog; identical inputs
  yield identical output regardless of array order or revision label
  ([ADR-0008](../adr/0008-determinism-and-reproducibility.md)).
- **Revision-gated**: on a new `revision`, presentation re-selects; it must not
  mutate simulation state.
- Renderer keys never enter domain data; the domain never references renderer
  types ([ADR-0019](../adr/0019-presentation-boundary-and-visual-design-track.md)).

## 8. Environment and terrain adaptation

Environment inputs come from **authoritative geography** (terrain, coast, river,
slope, aridity), not from the renderer ([ADR-0020](../adr/0020-campaign-geography-and-tactical-battlefield-projection.md)).
The catalog exposes **terrain archetypes** (hilltop/terraced, coastal, riverine,
plain, oasis/desert-edge) that recombine with culture components so the same
culture looks different by environment and the same environment hosts different
cultures.

## 9. Evidence, chronology and anachronism in the pipeline

- Every catalog entry carries a **period eligibility window** and an **evidence
  class ([D]/[R]/[S])** from the
  [evidence register](../research/settlement-architecture-evidence-and-anachronism-register.md).
- The selector **rejects** period-ineligible assets; a 278 BCE settlement can
  never select an imperial-Roman, medieval or later form.
- Asset metadata follows the
  [artwork production roadmap](../presentation/artwork-production-roadmap.md) §9
  (stable id, culture, period, evidence class, provenance, licence).
- Silhouette/scale/colour choices that are `[S]` must not be presented as
  excavated fact.

## 10. Performance and scalability

- Components are **instanced and culled**; selection is by spatial index, not
  per-settlement bespoke geometry. The VS-5 world foundation already demonstrates
  700 synthetic entities + 1,000 headroom for *markers*; **detail-level** city
  rendering at scale remains unvalidated (Codex handoff §).
- ~700 **managed** settlements; villages/farms/estates/mines remain **supporting
  landscape**, not individually managed settlements (AD-33 OPEN).
- LOD: far view = tier marker; near view = component assembly; the transition must
  not change identity.

## 11. Proposed decision and what stays open

- **Proposed AD-34** (OPEN): *settlement visual-development model* — the
  authoritative read model for settlement development, the presentation selection
  contract, and **cultural architectural inheritance** under conquest.
- **Stays OPEN:** **AD-33** (settlement granularity/scale/tiers); the finalized
  read-model schema; **ADR-0019** renderer; the settlement aggregate's internal
  structure; supporting-site promotion thresholds.
- This document **changes no ADR**, implements no code, and does not authorise
  production art before the Visual Design Bible gate
  ([artwork roadmap](../presentation/artwork-production-roadmap.md) §1).

## 12. Non-goals

- No runtime schema finalization; no `src/`/`tests/`/renderer change.
- No prices, production, queues or economy — presentation reads outcomes only.
- No renderer choice; no Visual Design Bible content.
- No resolution of AD-33 or ADR-0019.
- No invented motifs or anachronistic buildings.
