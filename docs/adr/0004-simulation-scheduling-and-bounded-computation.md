# ADR-0004: Simulation scheduling and bounded computation

- Status: **Approved architectural direction** (approved 2026-10-04). Exact
  implementation details are deliberately **not** locked.
- Date: 2026-10-04
- Full analysis: [../architecture/simulation-scheduling-and-performance.md](../architecture/simulation-scheduling-and-performance.md)
- Related: [ADR-0003](0003-strategic-command-periods-simtime-pause.md), [ADR-0008](0008-determinism-and-reproducibility.md)

## Context

The world is a living, simultaneous simulation with thousands of meaningful
entities and potentially many more aggregate records. A naive design that
evaluates every system for every entity at fine intervals is unacceptable.
Performance, responsiveness, determinism where practical, debuggability and
bounded computational work are architectural requirements from the start.
Background factions must remain genuinely simulated; optimisation may reduce
fidelity, never causal coherence.

## Decision

**Approved as an architectural direction.** The strategy is the Option D hybrid in
[../architecture/simulation-scheduling-and-performance.md](../architecture/simulation-scheduling-and-performance.md),
combining:

- a deterministic **due-work scheduler** keyed on SimTime, instead of a naive
  daily sweep;
- **spatial partitioning** so movement, contact and scouting avoid pairwise
  comparison of every army, outpost and scout;
- **tiered evaluation** (foreground / background) with lower frequency or
  coarser abstraction for distant or low-relevance entities;
- **cached derived projections** with explicit invalidation;
- **batched, lower-frequency evaluation** for aggregate systems such as
  economy and population;
- **instrumentation seams and deterministic benchmarks**, with budgets derived
  from measurement rather than invented numbers.

### What this approval does **not** lock

- the exact scheduler implementation;
- tick / intra-period resolution;
- evaluation frequencies;
- foreground/background thresholds;
- spatial index technology;
- batch sizes;
- numeric performance budgets;
- promotion/demotion rules between simulation tiers.

### Principles preserved by this approval

1. **The background world remains causally real.** Optimisation may reduce
   computational fidelity; it may not create fake history or violate causal
   coherence.
2. **No faction owns time. The world owns time.** All factions, armies,
   characters, institutions, settlements, population cohorts and other systems
   progress through the same simulation timeline.

## Consequences of approval

- Simulation work becomes explicit and countable rather than emergent from
  naive loops.
- A "fidelity ledger" becomes necessary: each system's abstraction level and
  its effect on results must be documented.
- Deterministic ordering and seeded randomness become requirements of the
  scheduler, not optional refinements.
- Optimisation risk shifts from performance to correctness and fairness
  (background factions must not silently diverge).
- **Amendment (Deltas 4 and 8):** the workload model must additionally account
  for (a) population cohorts moving in bulk between locations, including
  long-distance displacement, and (b) a future grand campaign map with real
  coordinates and terrain properties rather than abstract adjacency only
  ([ADR-0020](0020-campaign-geography-and-tactical-battlefield-projection.md)).
  Both increase spatial-index and scheduler pressure, and both are reasons to
  measure before choosing structures.

## Rejected alternatives

| Alternative | Why not |
| --- | --- |
| Naive fixed-step full sweep | O(entities x systems x ticks); unbounded work |
| Full event-sourcing replay per tick | Cost without design benefit |
| Pure agent-based continuous simulation | Very hard to keep deterministic, debuggable and reproducible |
| Optimising by making background factions random | Violates causal coherence and the "genuinely simulated" requirement |

## Unresolved

- **Unresolved:** which spatial structure and what its update cost is under
  campaign-scale geography.
- **Unresolved:** which systems may legitimately use lower fidelity, and what
  coherence guarantee each provides.
- **Unresolved:** profiling budgets and instrumentation thresholds; these should
  follow measurement.
- **Unresolved:** whether SimTime is event-driven, fixed-step, or hybrid.
- **Unresolved:** foreground/background thresholds and promotion/demotion rules.
- **Unresolved:** spatial index technology and batch sizes.
- **Unresolved:** whether SimTime resolution and determinism depth remain open as
  registered decisions N-1 and AD-3.
- **Resolved by scope:** determinism is justified by debugging, testing,
  benchmarking, save/load, bug reproduction, causal explanation and controlled
  replay — **not** by multiplayer, which is out of MVP scope
  ([ADR-0014](0014-single-player-mvp-scope.md)).
