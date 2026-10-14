# Military architecture: authoritative military state and continuous geographic presentation

**Status: Proposal (2026-10-14).** This document **consolidates existing,
already-Approved military architecture** — [ADR-0001](../adr/0001-campaign-military-representation-vs-dei-tactical.md),
[ADR-0015](../adr/0015-campaign-command-hierarchy-and-tactical-control.md),
[ADR-0016](../adr/0016-military-cohesion-and-post-battle-survival.md) and
[ADR-0020](../adr/0020-campaign-geography-and-tactical-battlefield-projection.md) —
into a single architectural view, and **proposes** an army-presentation model in
which a continuous geographic zoom replaces a separate army-management scene.

It implements **no code**, narrows **no ADR**, and **reinterprets no ADR
contract**. The consolidation below adds no authority to any of it: where this
document and an ADR disagree, **the ADR wins**. Everything new here (the
continuous-zoom presentation model, §§5–11) is a **Proposal** and requires
approval; it is **not** to be built during the current VS-5 geography work.

- Date: 2026-10-14
- Authority: [ADR-0001](../adr/0001-campaign-military-representation-vs-dei-tactical.md)
  (campaign military representation), [ADR-0015](../adr/0015-campaign-command-hierarchy-and-tactical-control.md)
  (command hierarchy and tactical-control boundary), [ADR-0016](../adr/0016-military-cohesion-and-post-battle-survival.md)
  (cohesion and organisational survival), [ADR-0020](../adr/0020-campaign-geography-and-tactical-battlefield-projection.md)
  (geography and battlefield projection), [ADR-0019](../adr/0019-presentation-boundary-and-visual-design-track.md)
  (presentation boundary), [ADR-0009](../adr/0009-identity-model.md) (canonical identity)
- Related: [domain-model.md](domain-model.md) §3.1–3.4,
  [geography-integration-requirements.md](geography-integration-requirements.md),
  [system-dependency-graph.md](system-dependency-graph.md),
  [../presentation/presentation-requirements.md](../presentation/presentation-requirements.md),
  [execution-roadmap.md](execution-roadmap.md) §E (geography track) and §J,
  [vertical-slices-and-epics.md](vertical-slices-and-epics.md) (E6/E7)

## 1. Purpose and scope

The simulation needs one place that states, in order, how an army exists as
**authoritative state**, how it is **presented on the geographic campaign map**,
how the player moves from a **strategic marker to a close view of the same army
without leaving the map**, and how an actual **tactical battle** hands off to the
Rome II / DeI adapter. Earlier military decisions are spread across four ADRs and
the domain model; this document gathers them and adds the presentation model that
the user has requested.

**In scope:** the relationship between authoritative military state and its
presentation; the five layers that must stay distinct; the proposed continuous
geographic zoom; the proposed close-range army presentation; the mapping from
simulation state to presentation states; the boundary to the tactical adapter.

**Out of scope (this pass):**

- no implementation, and no `src/` or `tests/` change;
- no renderer choice, no engine change, no shader/LOD/streaming design
  (ADR-0019 renderer remains **Unresolved**);
- no mass unit taxonomy, and no historically specific unit vocabulary in the
  domain (ADR-0001);
- no reopening of AD-19 (coordinates), AD-20 (`BattlefieldResolver`), N-35
  (`BattleResult`) or any battle mechanic;
- no new simulation state: presentation never introduces state the military
  simulation does not already own.

## 2. What this document does **not** change

This section is a preservation guarantee. The proposal below **must obey** all of
the following, and none of it is re-opened.

| Preserved decision | Source |
| --- | --- |
| The campaign simulation owns persistent military formations; a `Formation` is a domain entity with stable canonical identity and persistent campaign state | ADR-0001 decisions 1, 10 |
| The domain defines **no** historical unit taxonomy mirroring DeI; DeI keys and catalog schema stay adapter-side; `BattleState` carries campaign truth and domain references only | ADR-0001 decisions 2–4, 6 |
| Representation is resolved **per battle**; identity is not. The same persistent formation re-resolves to the appropriate tactical representation each battle | ADR-0001 decision 5 |
| The campaign owns the command hierarchy (`Army → command hierarchy → command elements/detachments → commanders → formations`) and issues **no** tactical orders during a battle | ADR-0001 decision 7, ADR-0015 decisions 1–4 |
| Command elements are **shared military primitives**, not universally Roman structures | ADR-0015 decision 2 |
| Cohesion is first-class campaign state, distinct from morale; post-battle organisational survival is derived campaign-side | ADR-0016, ADR-0001 decisions 8 |
| Only an **interactive** external tactical handoff freezes the clock; background AI-vs-AI battles do not | ADR-0003 A11, ADR-0001 decision 12 |
| The campaign world owns location; the adapter owns translation; Rome II owns the battlefield representation. Four layers stay distinct | ADR-0020 decisions 1–2, 9 |
| Presentation is a parallel track that never blocks the simulation and never becomes a second source of truth | ADR-0019 decisions 3–4 |
| Every formation, army, command element and detachment holds a canonical ID that survives end of life | ADR-0009 §3, ADR-0001 decisions 10–11 |

## 3. The five layers that must stay distinct

This is the core requirement. Conflating any two of these is the failure mode
this document exists to prevent.

| # | Layer | What it is | Who owns it |
| --- | --- | --- | --- |
| 1 | **Authoritative military simulation state** | Armies, formations, command elements, detachments, command hierarchy and relationships, plus manpower, experience, morale, **cohesion**, fatigue, supply, loyalty, command stability, equipment state and position | The campaign simulation (`src/domain`, later `src/simulation`) |
| 2 | **Campaign-map presentation at strategic zoom** | The general's portrait, the military standard and compact identifying information shown for an army on the map | The presentation track (ADR-0019); reads layer 1 |
| 3 | **Continuous geographic zoom** | A camera transition inside the existing geographic world from strategic zoom to close range at the army's actual coordinates — **not** a separate army-management scene | The presentation track; reads layer 1 and the authoritative geography |
| 4 | **Close-range army presentation** | The same army shown as an organisation of formations and subordinate commanders on the existing geographic terrain, arranged to reflect its simulation state (marching, encamped, deployed, retreating) | The presentation track; reads layer 1 |
| 5 | **Tactical battle projection** | Campaign location + military state → `BattleState` → adapter → Rome II / DeI battlefield; the result returns through `BattleResult` | The tactical adapter (ADR-0001, ADR-0020); the campaign applies consequences |

Layers 2, 3 and 4 are three views of **one** army over a continuous zoom range.
They are **not** three entities, and moving between them changes **no** simulation
state (see §9).

### 3.1 Relationship to the four geographic layers (ADR-0020)

ADR-0020 already requires that *campaign geography*, the *visual campaign map*,
the *tactical geographic projection* and the *Rome II / DeI battlefield* stay
distinct. Layers 3–4 above are **that ADR's "visual campaign map"**, extended from
a single display into a continuous zoom range. The rule is unchanged: the rendered
map is a **presentation of authoritative geography**, never a second source of
geographic truth, and it never supplies gameplay facts back to the simulation.

## 4. Layer 1 — authoritative military simulation state

Restated from ADR-0001/0015/0016 and `domain-model.md` §3.1–3.4, for a single
reference point:

- **Entities:** `Army`, `CommandElement` (supreme/main command, vanguard, main
  body, rearguard, supply train, independent detachment), `Detachment`,
  `Formation` (campaign truth), commander and subordinate-commander references.
- **Formation campaign state:** identity, faction, culture, home region where
  appropriate; manpower, experience, morale, **cohesion**, fatigue, equipment
  state; army / detachment / command-element membership; commander relationships;
  strategic position (a location); supply and loyalty state, command stability;
  ledger history.
- **Command hierarchy:** `Army → command hierarchy → command elements /
  detachments → commanders → formations`, expressed through shared primitives.
- **Resolution paths:** background AI-vs-AI battles resolve internally with no
  clock freeze; interactive battles hand off with the clock frozen at the
  encounter SimTime; both converge on campaign-owned `BattleResult`.

**A unit is not a separately simulated army.** The authoritative entities are the
army, its formations and its command structure. Where individual units are
*displayed* (layer 4), they are a presentation of an authoritative `Formation`,
not an additional simulation entity, and any historically specific unit vocabulary
is resolved adapter-side at battle time (ADR-0001 decisions 2–4). Formations carry
canonical identity; visual units do not mint identity.

## 5. Layer 2 — campaign-map presentation at strategic zoom

At strategic zoom an army is presented as a compact marker built from
authoritative state:

- the **general's portrait** (the commanding character referenced by the army /
  command element);
- the army's **military standard** (expression of the polity/culture, researched
  per ADR-0019's "shared grammar, culturally specific expression");
- **compact identifying information** — enough to distinguish the army (e.g.
  commander, polity, size class / strength band, current activity) without
  becoming a data panel.

Every element is derived from layer 1. The marker has **no independent state**: it
is a projection. If the commanding character changes, the army moves, or its
activity changes, the marker changes because the underlying state changed.

## 6. Layer 3 — continuous geographic zoom (proposed)

The proposed interaction model, stated as a requirement rather than an
implementation:

1. **No separate army-management scene.** Selecting a general does **not** open a
   full-screen army interface detached from the world.
2. **The camera moves within the same 3D geographic world.** Clicking the
   general's portrait smoothly moves the camera toward the army's **actual
   geographic coordinates** on the campaign map — the same world, not a new
   screen.
3. **Terrain gains detail as the camera descends.** The authoritative geography
   already carries terrain and physical facts; the close view shows more of them.
   The zoom level is a presentation concern and never changes geographic identity
   (§9).
4. **The army transforms from strategic marker (layer 2) into a visible
   organisation of formations and subordinate commanders (layer 4)** as the camera
   arrives. This is a change of *representation*, not of state.
5. **Zooming out reverses the transition**, returning the formations to the
   single strategic army marker.

The player therefore stays in **one continuous geographic world** throughout. The
"army view" is a zoom level of the campaign map, not a mode.

## 7. Layer 4 — close-range army presentation (proposed)

At close range the same army is shown on the existing geographic terrain as an
organisation of formations:

- **Subordinate commanders appear as portraits and standards attached to their
  actual formations**, mirroring the campaign command hierarchy (ADR-0015). A
  vanguard commander's marker is on the vanguard, not detached from it.
- **The arrangement reflects simulation state.** Candidate presentation states,
  projected from authoritative state (not decided here):
  - **marching** — column / route-ordered;
  - **encamped** — compact camp organisation;
  - **deployed** — battle-line arrangement;
  - **retreating** — disorganised / rearward arrangement.

  These are **presentation states inferred from** cohesion, activity, orders and
  position. They do not replace, and are not, authoritative military state; the
  mapping is a presentation concern (§10) and a change of zoom must never *cause*
  a state change.
- The visible formations are the authoritative `Formation` entities. Visual
  sub-elements (standards, figures, grouping) are illustrative of those entities
  and **introduce no unit taxonomy into the domain** (ADR-0001).

## 8. Layer 5 — tactical battle projection

The only thing that may take the player out of the continuous geographic view is
an **actual tactical battle**, and only through the future external adapter:

- Campaign location + geographic context → `TacticalLocationContext` →
  `BattlefieldResolver` (adapter) → Rome II / DeI battlefield (ADR-0020).
- `BattleState` carries campaign truth and domain formation references only; the
  adapter resolves formations to DeI factions/units inside
  `src/tactical/adapters/rome2-dei` (ADR-0001).
- The interactive handoff freezes the campaign clock at the encounter SimTime; a
  background AI-vs-AI battle resolves internally with no freeze; both cross the
  same `BattleResult` boundary (ADR-0003 A11–A12).
- This transition is **subject to technical feasibility** and is bounded by the
  existing open questions (AD-19, AD-20, N-35). **No engine capability is claimed
  before it is verified.**

Layers 2–4 are the campaign-map presentation of an army; layer 5 is the
battlefield. They are not the same view, and the campaign map never becomes a
tactical battlefield.

## 9. The invariant: presentation derives from simulation; zoom never mutates state

Restated as a rule, because it is the whole point of the layered separation:

1. **Every visual representation of an army, formation or commander derives from
   authoritative simulation entities.** No presentation object is a source of
   gameplay truth.
2. **Zooming never changes military simulation state.** Descending to close range
   or rising back to strategic zoom changes only what is drawn. It does not
   create, move, merge, split, reinforce or disband anything.
3. **Presentation does not write state.** Consistent with ADR-0019 decision 3 and
   `presentation-requirements.md` rule 3, presentation reads simulation state and
   never writes it.
4. **No second source of truth.** The rendered map and the rendered army are
   presentations of authoritative geography and authoritative military state,
   exactly as the rendered campaign map is a presentation of authoritative
   geography (ADR-0020 decision 2, rule 4 of ADR-0019).
5. **Player intent is expressed as legal actions, not as presentation.** An order
   the player issues from any zoom level enters through the legal-action gate
   (ADR-0006); the presentation layer carries no authority.

This mirrors the identity/ownership/presentation separation already applied to
geography in `geography-integration-requirements.md` §3.

## 10. Mapping simulation state → presentation states (candidate, not a decision)

Illustrative only. The actual mapping (and its thresholds) is part of the open
question in §13 and must not be treated as a model:

| Presentation state | Candidate inputs from authoritative state | Notes |
| --- | --- | --- |
| Marching | current order/activity, route/position, formation type | Column arrangement |
| Encamped | activity = stationary/camp, supply state, season | Camp layout |
| Deployed | battle imminent / encirclement, command-element assignment | Battle-line arrangement |
| Retreating | cohesion and morale below a threshold, retreat order, recent result | Rearward/disorganised arrangement |
| Disintegrating | cohesion collapse and organisational outcome (ADR-0016) | Presentation must not *cause* the outcome |

The presentation state is a **read-only inference**. It is never stored as the
authoritative activity, and the presentation must be able to explain *why* an army
is shown deployed or retreating by traversing the same causes the simulation
records (the perceivability design law, ADR-0019).

## 11. Visual reference (user-supplied) — comparison pending

The user has supplied screenshots from **House of History's "Pyrrhus Invades
Italy"** as the visual reference for the close-range army presentation, and the
requested model (general portrait → continuous zoom → formations and subordinate
commanders on the actual geographic terrain) is derived from that intent.

**Direct visual comparison is pending.** The referenced images are not present in
this repository (a docs search finds no reference to them), so this document does
**not** claim to have inspected them. The characteristics it records are the
**described intent**, not an analysis of the screenshots:

- a **strategic marker** (commanding general) that becomes a **visible order of
  battle** on the same terrain as the camera descends;
- **subordinate commanders** shown attached to their formations;
- **terrain continuity** between the strategic and close views;
- no separate army-management screen.

When the images are available, a follow-up pass should record the observed
characteristics explicitly and reconcile them with this document; until then, the
reference above is a description of intent and nothing more.

## 12. Proposed placement in the roadmap

- This is a **presentation-track** concern. It sits alongside the geography
  track's **G4 — Rendering, map UI, semantic zoom** (Stage 10 / parallel PT1) and
  is gated by the Visual Design Bible (ADR-0019, **AD-18**). It **never blocks**
  E0–E9 or the geography track (G0–G3).
- It is **explicitly not part of VS-5**. The current VS-5 geography work is
  authoritative geography (G1) plus a bounded presentation experiment; the army
  presentation model is proposed **ahead of** that work as a contract, not built
  into it.
- It connects forward to **E6 (armies/orders/movement)** and **E7 (tactical
  round trip)**: layer 1 is E6's domain; layer 5 is E7's adapter boundary.

## 13. Open questions carried by this proposal

Proposed for the open decision register (not opened silently; the register is the
authority once a row exists):

- **Army presentation model** — the continuous geographic zoom, the strategic
  marker ↔ close-range formation presentation, the mapping from authoritative
  military state to presentation states (marching/encamped/deployed/retreating),
  and the boundary at which the future visual-design work may specify it.
  Blocks: PT1 presentation. Does not block the simulation.
- Presentation fidelity / level-of-detail policy, and the selection→zoom
  interaction, are sub-items of the above and remain **Unresolved**.

## 14. Non-goals and purity

- No implementation, no renderer decision, no art production.
- No domain change, and no `src/`/`tests/` change.
- No new simulated state for presentation to read that the simulation does not
  already own.
- No unit taxonomy in the domain; no DeI keys, catalog field names, map keys or
  battlefield identifiers in `src/domain` (ADR-0001, ADR-0020, standing
  constraint 7).
- No claim about engine capability that has not been verified.

## Unresolved

- **Unresolved:** the precise mapping from authoritative military state to the
  presentation states of §10, including thresholds.
- **Unresolved:** presentation fidelity / LOD policy and the selection→zoom
  interaction mechanics.
- **Unresolved:** the renderer and map-presentation technology (ADR-0019;
  **AD-18**).
- **Unresolved:** whether and how the engine-based tactical transition (layer 5)
  is triggered from the continuous view, pending AD-19/AD-20/N-35 and T1/T3
  evidence.
- **Research-dependent:** culturally specific standards, portraits and formation
  presentation grounded in research (ADR-0019; **R-9**).
- **Pending:** direct visual comparison with the supplied House of History
  reference (§11), once the images are available in the repository.
