# Simulation scheduling and performance architecture

- Status: **Approved architectural direction** (ADR-0004, approved
  2026-10-04). The *strategy* is approved; every technique, threshold and budget
  below remains a candidate and no implementation detail is locked.
- Decision record: [ADR-0004](../adr/0004-simulation-scheduling-and-bounded-computation.md)
- Related: [ADR-0003](../adr/0003-strategic-command-periods-simtime-pause.md), [ADR-0008](../adr/0008-determinism-and-reproducibility.md), [ADR-0014](../adr/0014-single-player-mvp-scope.md), [ADR-0016](../adr/0016-military-cohesion-and-post-battle-survival.md), [ADR-0017](../adr/0017-population-cohorts-migration-and-displacement.md), [ADR-0020](../adr/0020-campaign-geography-and-tactical-battlefield-projection.md)

## 1. Problem statement

The design goal (**Approved**) is *not* to simulate every person every second.
The goal is to preserve the illusion and causal integrity of a living,
simultaneous world while spending computation only where it materially affects
simulation state.

Constraints that shape every option:

- C1. Thousands of meaningful entities; potentially far more aggregate records.
- C2. All factions progress inside the same command period (ADR-0003).
- C3. Background factions must remain genuinely simulated; optimisation may not
  turn them into random flavour events disconnected from world state.
- C4. Performance degradation must be measurable; budgets must come from
  evidence, not invented numbers.
- C5. Deterministic ordering and reproducibility where practical (ADR-0008).
- C6. The simulation must remain debuggable — a designer must be able to ask
  "why did this happen at this moment".
- C7. Scale now includes mobile population cohorts and, eventually, a real
  grand campaign map with coordinates and terrain properties rather than
  abstract adjacency (ADR-0017, ADR-0020).
- C8. Determinism is justified by single-player engineering needs — debugging,
  testing, benchmarking, save/load, bug reproduction and controlled replay — not
  by multiplayer, which is out of MVP scope (ADR-0014).

## 2. Candidate architectures

### Option A — Naive fixed-step full sweep

Every system evaluates every entity on every tick.

| Pros | Cons |
| --- | --- |
| Simplest possible code and mental model | O(entities x systems x ticks); unbounded and wasteful |
| Perfectly uniform fidelity | Ignores that most entities are irrelevant this instant |
| | Directly violates C1 and the design goal |

Verdict: **rejected**.

### Option B — Fixed-step with dirty/active sets

Same fixed tick, but only entities marked dirty (or in an active region) are
evaluated.

| Pros | Cons |
| --- | --- |
| Large constant-factor win; still easy to reason about | Still tick-rate bound; tick rate is a blunt instrument for "when" work is due |
| Diffing to find dirty entities is itself costly at scale | Background regions still evaluated at full tick rate if marked active |

Verdict: **partial improvement, insufficient alone**.

### Option C — Scheduled due work ("next meaningful occurrence")

Each system registers work with a due time; the scheduler advances SimTime to the
next due item and processes it. No global tick.

| Pros | Cons |
| --- | --- |
| Work is proportional to what actually changes | Requires every system to expose "when is my next meaningful change" |
| Naturally matches event-driven causality (reports arriving, harvests maturing) | Risk of pathological event cascades inside one instant |
| Idle time costs nothing; big jumps are free | Harder to reason about "what does a period do" without tooling |
| Excellent fit for "process the next meaningful occurrence" | Requires a global priority/order to stay deterministic |

Verdict: **strongest fit for the design intent**, on its own.

### Option D — Hybrid: due work + spatial partitioning + tiered fidelity + cached projections + batched aggregates

Option C plus:

- **Spatial partitioning** (uniform grid or similar over `Location`) so movement,
  contact, scouting and observation only consider nearby entities instead of all
  pairs;
- **Foreground/background tiers**: entities near player-relevant activity get
  full-rate evaluation; distant/low-relevance entities get lower frequency or
  coarser abstraction;
- **Cached derived projections** (knowledge, reputation, pressure) with explicit
  invalidation instead of recomputation;
- **Batched aggregate systems** (economy, population) evaluated at lower
  frequency per settlement/province batch;
- **Instrumentation** (work counters, phase timings) feeding deterministic
  benchmarks.

| Pros | Cons |
| --- | --- |
| Bounded, measurable work; scales with *relevant* activity, not entity count | Most engineering effort of any option |
| Background fidelity reduction is explicit and auditable | Tiering can starve distant regions if tuned badly |
| Caches and spatial index are independently testable | Risk of divergence between tiers |

Verdict: **recommended candidate**.

### Option E — LOD-by-abstraction / coarse background simulation

Background regions are simulated by an abstract summariser (statistical
approximation) rather than by degrading individual entity evaluation.

| Pros | Cons |
| --- | --- |
| Very cheap for the long tail | Abstracted results can contradict individual state, harming causal integrity (C3, C6) |
| Natural fit for "nobody will ever look at this region for 200 years" | Hard to explain to a player who does look |

Verdict: **only for provably irrelevant background**, and only with a documented
coherence guarantee. Not a default.

### Option F — Full event-sourcing replay per period

Rebuild period state by replaying every event.

| Pros | Cons |
| --- | --- |
| Perfect auditability | Cost grows with history length; contradicts ADR-0002 (no full replay requirement) |
| | Rebuilding the world each period is prohibitive |

Verdict: **rejected** (already excluded by ADR-0002).

## 3. Comparison

| Option | Determinism | Causal fidelity | Cost profile | Debuggability | Implementation cost |
| --- | --- | --- | --- | --- | --- |
| A Naive sweep | Perfect | Perfect | Unbounded | Trivial | Trivial |
| B Dirty sets | Good | Perfect | Reduced but tick-bound | Easy | Low |
| C Due work | Good (needs ordering) | High | Proportional to real change | Needs tooling | Medium |
| D Hybrid | Good (needs care) | High with discipline | Bounded and measurable | Needs tooling | High |
| E LOD abstraction | Fragile | At risk | Very cheap | Poor | High |
| F Replay | Perfect | Perfect | Growing | Trivial to audit, costly to produce | Medium |

## 4. Recommendation (**Approved as architectural direction**)

Adopt **Option D**, built on **Option C**'s due-work model, with these explicit
principles:

1. **Advance to the next meaningful occurrence, not a naive daily loop.** The
   scheduler's fundamental unit is a *scheduled consequence*, not a tick. A
   half-year period advances by repeatedly processing the earliest due work.
2. **Movement, contact, scouting and information propagation must avoid pairwise
   global comparison.** Use spatial partitioning so candidate pairs come from
   locality, not from all-vs-all.
3. **Two tiers, both genuine.** Foreground (player-relevant, active armies,
   nearby agents) at full fidelity; background at lower frequency. Background
   must remain causally coherent — the ledger and events it emits must still be
   real, and its results must still feed the same systems.
4. **Derived views are cached and invalidated, never authoritative.**
5. **Aggregate systems (economy, population) run batched at lower frequency**,
   because their meaningful granularity is seasonal or annual, not per-instant.
   This extends to population cohorts: they move in bulk as a single aggregated
   record, never as simulated individuals (ADR-0017).
6. **Measure first.** Introduce instrumentation seams and deterministic
   benchmarks before setting any budget.
7. **Spatial structure must survive contact with real geography.** A pure
   adjacency graph is the cheapest representation and may prove an early slice,
   but it must not become the permanent model: movement, encounter location,
   supply and tactical projection all eventually need coordinates and terrain
   properties. Migrating later is more expensive than designing for it now
   (ADR-0020).
8. **Post-battle work is campaign-side and potentially expensive.** Deriving
   organisational survival for every participant — fragmentation, cohesion decay,
   remnants, remobilisation — adds work after every battle. Whether this runs at
   full fidelity for foreground armies and a documented lower fidelity for
   background is an open question (ADR-0016).

### 4.1 Proposed instrumentation seams (conceptual ports, not yet implemented)

| Seam | Purpose |
| --- | --- |
| `Clock` | Owns SimTime, pause state, period boundaries; no wall clock in domain |
| `Scheduler` / due-work queue | Holds scheduled consequences with due SimTime; deterministic ordering |
| `SpatialIndex` | Locality queries for movement, contact, observation |
| `RandomSource` | Seeded, partitioned streams (ADR-0008) |
| `ProjectionStore` | Cached derived views with explicit invalidation |
| `MetricsSink` | Work items processed, per-system and per-period counters, timings |

### 4.2 Deterministic benchmarks (**Proposal**)

- Fixed scenario + fixed seed; replay from a snapshot; compare final state hash.
- Report work items processed per period, per system.
- Report relative foreground/background split and cache hit/miss counts.
- Record baseline numbers *before* proposing any performance budget.

### 4.0 What the approval does not lock

Scheduler implementation; tick resolution; evaluation frequencies;
foreground/background thresholds; spatial index technology; batch sizes;
performance budgets; promotion/demotion rules between tiers. The two standing
principles that *are* approved: the background world stays causally real at lower
fidelity, and the world owns time — every faction and system progresses on the
same timeline.

## 5. Risks of the recommended direction

| Risk | Mitigation |
| --- | --- |
| Tiering starves distant regions into incoherence | Fairness review; documented fidelity guarantees per system |
| Nondeterminism from hash iteration or scheduler ordering | Explicit ordering keys; seeded streams; determinism test (ADR-0008) |
| Debuggability loss ("it happened but why here?") | Causal trace tooling over the ledger; significance classification |
| Cache staleness bugs | Explicit invalidation on state change; projection rebuild tests |
| Over-engineering before measurement | Instrument first; adopt technique only with evidence |
| Event cascade explosion within one instant | Cap work per instant; defer overflow work to later SimTime |

## 6. Open decisions (**Unresolved**)

- Spatial structure choice and its update cost at campaign scale, including the
  migration path from adjacency to a coordinate-based map.
- Which systems may use lower fidelity, and the coherence guarantee each gives.
- Whether SimTime is event-driven, fixed-step, or hybrid (the recommendation is
  event-driven with due work; the exact intra-period resolution is still open per
  ADR-0003).
- Numeric performance targets — deferred until baselines exist.
- Cohort movement resolution cost: bulk movement is cheap, but attrition,
  multi-settlement absorption and multi-generational residence may not be.
- Fidelity level for post-battle organisational resolution in background armies
  (ADR-0016).
- Whether tactical encounter sites are chosen at schedule time or lazily at
  battle launch, and whether that choice is part of the deterministic ordering
  (ADR-0020).
