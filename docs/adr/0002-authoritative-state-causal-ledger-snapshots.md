# ADR-0002: Authoritative mutable state plus causal historical ledger and snapshots

- Status: **Approved** (resolves prior AD4)
- Date: 2026-10-04
- Affects: persistence, causality, memory, reputation, chronicles, explanations
- Related: [ADR-0005](0005-event-taxonomy-and-historical-significance.md), [../events/event-catalogue-v0.md](../events/event-catalogue-v0.md)

## Context

The simulation must be able to explain why something happened, give characters
life histories and memories, propagate reputation, and produce chronicles and
player-facing explanations. Full event sourcing — rebuilding all world state by
replaying every event since campaign start — is not required and would impose a
large permanent cost for no design benefit.

## Decision

1. **Authoritative current state is mutable domain state**, held per system and
   per entity, and is the truth the simulation reads and writes.
2. **An append-only causal ledger records historically meaningful domain events.**
   Ledger entries follow the blueprint shape: `id`, `date`, `type`,
   `participants[]`, `factions[]`, `locations[]`, `magnitude`, `causes[]`,
   `consequences[]`, `witnesses[]`.
3. **Snapshots capture authoritative state** at chosen points (nominally command
   period boundaries; exact policy unresolved).
4. **Cross-system consequences travel as domain events** and are recorded in the
   ledger, so important causal history stays traceable. Intra-system routine
   mutation does not have to become permanent historical narrative.
5. **No full replay requirement.** The world is not reconstructed from the
   ledger; derived projections may be rebuilt from authoritative state, using
   the ledger where causality must be explained.
6. **The ledger must support:** causality traversal, character life histories,
   memories, reputation justification, chronicles, information provenance, and
   player-facing explanations.
7. **Amendment (Deltas 3–5):** organisational outcomes after battle
   (fragmentation, disintegration, surrender, desertion), population
   displacement and cohort movement, and political transformation attempts and
   regime recognition are all candidate ledger-worthy occurrences, because they
   are the kind of history the player must later be able to trace. They are
   recorded like any other significant event, with causes — not through separate
   mechanisms. See
   [ADR-0016](0016-military-cohesion-and-post-battle-survival.md),
   [ADR-0017](0017-population-cohorts-migration-and-displacement.md) and
   [ADR-0018](0018-mutable-government-and-political-transformation.md).

## Consequences

- Systems need explicit "emit consequence" behaviour rather than writing into
  other systems directly; the ledger is the visible record of that traffic.
- A significance gate is required to keep the ledger meaningful rather than
  exhaustive — specified as a proposal in
  [ADR-0005](0005-event-taxonomy-and-historical-significance.md).
- Memories, reputation deltas and chronicles reference ledger entries rather
  than duplicating facts.
- Derived projections (knowledge, reputation indices, pressures) must be
  rebuildable, which constrains how they are computed — see
  [ADR-0010](0010-persistence-and-repository-ports.md).
- Explanations ("why is this army refusing orders?") become a first-class query,
  not a UI afterthought.

## Rejected alternatives

| Alternative | Why rejected |
| --- | --- |
| Full event sourcing | Cost and complexity with no design benefit; not required |
| Mutable state only, no ledger | Loses causality, memory sources, chronicles, explanations |
| Ledger for every field mutation | Noise; destroys the signal the player must perceive |
| A central world manager mutating all systems | Explicitly forbidden by the blueprint; destroys locality |

## Unresolved

- **Unresolved:** ledger retention and volume policy per significance class.
- **Unresolved:** whether memories are derived from ledger entries or curated
  character-authored selections.
- **Unresolved:** chronicle format, audience and authorship.
- **Unresolved:** whether any aggregate is ledger-authoritative (for example
  office and claim registries) rather than snapshot-authoritative.
- **Unresolved:** snapshot cadence, retention and migration policy.
