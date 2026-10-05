# ADR-0005: Event taxonomy and historical significance

- Status: **Approved architectural direction** (approved 2026-10-04).
  Significance formulas and thresholds are deliberately **not** approved.
- Date: 2026-10-04
- Catalogue: [../events/event-catalogue-v0.md](../events/event-catalogue-v0.md)
- Analysis: [../architecture/event-taxonomy.md](../architecture/event-taxonomy.md)
- Related: [ADR-0002](0002-authoritative-state-causal-ledger-snapshots.md)

## Context

The blueprint defines a canonical `HistoricalEvent` ledger, but the simulation
also produces a very large number of routine occurrences: observations, report
arrivals, order changes, price updates, movement steps. Treating every domain
event as a player popup or a permanent chronicle entry would be noise. Treating
none of them as historical would break the "explain why" requirement.

## Decision

**Approved as an architectural direction.** One event infrastructure with
distinct classifications, deliberately minimal:

- **One event envelope** (`id`, `simTime`, `kind`, `tier`, participants,
  locations, payload, `causes[]`, provenance) — not four separate event systems.
- **Four classifications** with different policies:
  1. `simulation` — transient intra-period causal occurrences;
  2. `information` — knowledge/reputation deltas with provenance;
  3. `canonicalHistorical` — appended to the causal ledger;
  4. `playerNotification` — presentation-only projection, never authoritative.
- Significance is decided by the emitting system, with an optional
  `HistoricalSignificancePolicy` port later for contextual significance.
  Significance formulas are explicitly out of scope.

### What this approval does **not** lock

- any significance formula, threshold, weight or policy;
- who classifies significance, or whether classification may be revised.

### Principles preserved by this approval

1. **Not every state change is historical.**
2. **Not every historical event is immediately known.**
3. **Not every known event deserves a player notification.**
4. The four layers stay distinct and are never collapsed:

   ```
   WORLD TRUTH            what happened (authoritative state + ledger)
        │
        ▼  propagation, delay, distortion
   INFORMATION            observations, reports, rumors in transit
        │
        ▼  filtered by what each actor may know
   CHARACTER / FACTION KNOWLEDGE   belief, with provenance and confidence
        │
        ▼  relevance, coalescing, suppression
   PLAYER PRESENTATION    notifications and views
   ```

5. Canonical historical events preserve causal relationships where meaningful.
6. Routine internal simulation work does **not** automatically pollute the
   permanent historical ledger.

## Consequences of approval

- One dispatch path, four persistence/notification policies; avoids
  overengineering separate event buses.
- Causal links must exist even for transient events within a period, so a chain
  can be assembled and later promoted to ledger status.
- The ledger stays small enough to be meaningful while covering character
  histories, memory sources, reputation justification and chronicles.
- Player notifications can be queued, coalesced or suppressed without touching
  simulation truth.
- **Amendment (Deltas 3, 4, 5):** the `information` tier gains a further source
  channel — cohort testimony and displaced-population accounts
  ([ADR-0017](0017-population-cohorts-migration-and-displacement.md)) — and
  `canonicalHistorical` gains candidate classes for organisational survival
  after battle, displacement and cohort movement, and political transformation
  and regime recognition
  ([ADR-0016](0016-military-cohesion-and-post-battle-survival.md),
  [ADR-0018](0018-mutable-government-and-political-transformation.md)). The
  envelope does not change; only candidate kinds are added.

## Rejected alternatives

| Alternative | Why not |
| --- | --- |
| Everything is a canonical historical event | Ledger noise, chronicle noise, cost |
| Separate buses for information vs history vs notification | Overengineered; one envelope with classifications is enough |
| Significance formulas defined now | Explicitly premature |

## Unresolved

- **Unresolved:** contextual significance (for example, a minor marriage that
  matters because it affects the player's dynasty).
- **Unresolved:** who classifies significance and whether classification can be
  revised later.
- **Unresolved:** chronicle presentation and audience.
- **Unresolved:** which information events, if any, are ledger-worthy beyond
  causal support.
