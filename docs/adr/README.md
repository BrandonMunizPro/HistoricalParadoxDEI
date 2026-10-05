# Architecture decision records

Decision records for the historical strategy game. Each ADR states its status
using the legend below. ADR-0000 (record format) is implicit in this file.

## Status legend

| Status | Meaning |
| --- | --- |
| **Approved design direction** | Signed-off intent; implementable as stated |
| **Architectural proposal requiring approval** | Written proposal awaiting sign-off (currently unused) |
| **Deferred** | Recognised need, no decision yet |
| **Architecture only, mechanics unresolved** | Boundary agreed; the mechanics are still open design |
| **Research-dependent** | Needs research/design outside code |

## Index

| ADR | Title | Status | Date |
| --- | --- | --- | --- |
| [0001](0001-campaign-military-representation-vs-dei-tactical.md) | Campaign military representation vs DeI tactical representation | Approved design direction | 2026-10-04 |
| [0002](0002-authoritative-state-causal-ledger-snapshots.md) | Authoritative mutable state plus causal ledger and snapshots | Approved design direction | 2026-10-04 |
| [0003](0003-strategic-command-periods-simtime-pause.md) | Strategic command periods, SimTime, simultaneous progression, pause | Approved design direction | 2026-10-04 |
| [0004](0004-simulation-scheduling-and-bounded-computation.md) | Simulation scheduling and bounded computation | **Approved** (architecture; details unlocked) | 2026-10-04 |
| [0005](0005-event-taxonomy-and-historical-significance.md) | Event taxonomy and historical significance | **Approved** (architecture; formulas unlocked) | 2026-10-04 |
| [0006](0006-legal-action-and-proposal-validation.md) | Legal action and proposal validation architecture | **Approved** (architecture; vocabulary unlocked) | 2026-10-04 |
| [0007](0007-aggregate-boundaries-and-concurrent-action.md) | Aggregate boundaries and concurrent action resolution | Deferred | 2026-10-04 |
| [0008](0008-determinism-and-reproducibility.md) | Determinism and reproducibility | **Approved** (architecture; depth deferred as AD-3) | 2026-10-04 |
| [0009](0009-identity-model.md) | Identity model | Deferred | 2026-10-04 |
| [0010](0010-persistence-and-repository-ports.md) | Persistence and repository ports | Deferred | 2026-10-04 |
| [0011](0011-legitimacy-claims-and-internal-conflict.md) | Legitimacy, claims and internal conflict pressure | Architecture only; mechanics unresolved | 2026-10-04 |
| [0012](0012-therev-ai-sdk-boundary.md) | TheRev / Jev AI boundary | **Boundary approved**; SDK/transport deferred | 2026-10-04 |
| [0013](0013-content-data-cultures-religions-governments.md) | Content data for cultures, religions and government types | Research-dependent | 2026-10-04 |
| [0014](0014-single-player-mvp-scope.md) | Single-player MVP scope | **Approved** | 2026-10-04 |
| [0015](0015-campaign-command-hierarchy-and-tactical-control.md) | Campaign command hierarchy and tactical control boundary | **Approved** (engine capabilities research-dependent) | 2026-10-04 |
| [0016](0016-military-cohesion-and-post-battle-survival.md) | Military cohesion and post-battle organisational survival | **Approved** (mechanics unresolved) | 2026-10-04 |
| [0017](0017-population-cohorts-migration-and-displacement.md) | Population cohorts, migration and displacement | **Approved** (schema proposal/unresolved) | 2026-10-04 |
| [0018](0018-mutable-government-and-political-transformation.md) | Mutable government and political transformation | **Approved** (mechanics unresolved) | 2026-10-04 |
| [0019](0019-presentation-boundary-and-visual-design-track.md) | Presentation boundary and visual design track | **Approved** (renderer unresolved) | 2026-10-04 |
| [0020](0020-campaign-geography-and-tactical-battlefield-projection.md) | Campaign geography authority and tactical battlefield projection | **Approved** (resolver algorithm unresolved) | 2026-10-04 |

## Approval status of the architecture (2026-10-04)

Approved as architectural boundaries: **0001, 0002, 0003, 0004, 0005, 0006,
0008, 0014, 0015, 0016, 0017, 0018, 0019, 0020**, plus the ownership boundary of
**0012**.

Explicitly **not** approved, and deliberately still open:

- **AD-2** aggregate boundaries and concurrent action resolution (ADR-0007);
- **AD-3** exact determinism depth (ADR-0008 fixes seams, not depth);
- **AD-6** identity scheme (ADR-0009);
- **AD-9** persistence technology (ADR-0010);
- **AD-10** TheRev SDK surface, transport and schemas (ADR-0012);
- all gameplay mechanics, formulas and thresholds.

**Approval of a boundary does not approve the mechanics inside it.** No ADR was
approved by implication, and no unresolved mechanic was resolved by these
approvals.

## Scope decisions established by this set

- **Product scope:** single-player only for the MVP (ADR-0014). No networking or
  multiplayer architecture is carried by any record.
- **Authority chain:** campaign world → tactical adapter → Rome II / DeI
  battlefield (ADR-0015, ADR-0020). The campaign never asks the engine what map
  it is standing on, and never issues invented tactical orders.
- **Simulation depth:** cohesion, migration cohorts and mutable government are
  authoritative campaign state, not presentation concerns (ADR-0016, ADR-0017,
  ADR-0018).
- **Presentation independence:** shared UI grammar, culturally specific
  expression, separate design track (ADR-0019).
- **Intelligence ownership:** Jev is implemented in and exposed through
  **TheRev**, not in this repository. HistoricalGame owns canonical state,
  knowledge filtering, and the legal-action gate; TheRev owns providers, model
  runtimes and routing (ADR-0012).

## Standing constraints (apply to every ADR)

1. The TypeScript simulation owns strategic truth.
2. Rome II / Divide et Impera temporarily owns tactical battle resolution only.
3. Jev / TheRev may reason about character state but never authoritatively mutate
   world state.
4. Domain code is engine agnostic.
5. Background factions remain genuinely simulated; optimisation may reduce
   fidelity, never causal coherence.
6. Playable scope is a content decision; simulation scope is the whole world
   (ADR-0014, ADR-0013).
7. Domain code never contains Rome II / DeI keys, catalog field names, or map and
   battlefield identifiers (ADR-0001, ADR-0020).
8. Jev, TheRev and any AI provider never own canonical state, never receive
   unfiltered world state, and never bypass the legal-action gate (ADR-0012,
   ADR-0006).

## Process

- New decisions get the next ADR number; superseded records are marked, not
  deleted.
- Anything marked unresolved must not be converted into an implementation
  decision without a follow-up ADR.
