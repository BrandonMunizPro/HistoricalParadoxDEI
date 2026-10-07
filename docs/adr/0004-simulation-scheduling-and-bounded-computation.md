# ADR-0004: Simulation scheduling and bounded computation

- Status: **Approved architectural direction** (approved 2026-10-04). Exact
  implementation details are deliberately **not** locked. **Amended 2026-10-05**
  to record that the SimTime question this ADR left open is now closed by
  ADR-0003 (N-1).
- Date: 2026-10-04
- Amended: 2026-10-05
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
- tick / intra-period resolution (**subsequently resolved** by ADR-0003 A1–A4
  and amendment B1; timestamp precision does not imply fixed-step simulation);
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

## Amendment 2026-10-05: SimTime question closed by ADR-0003

This ADR previously listed "whether SimTime is event-driven, fixed-step, or
hybrid" as unresolved. That question is now **closed** by the ADR-0003 amendment
(**N-1**):

- SimTime is an **absolute, monotonic, fixed-point measure of elapsed simulation
  time**.
- Simulation is **due-work / event-driven**. The scheduler advances directly to
  the earliest due SimTime and may skip any instant with no due work.
- **No fixed-step whole-world sweep exists**: no daily, hourly or minute sweep,
  no renderer-driven simulation, and no mandatory processing of every
  representable SimTime value.
- **Timestamp precision is not evaluation frequency.** These are separate
  concerns, and this ADR's due-work model already treats them that way.
- **Deterministic same-instant ordering is a separate mechanism from SimTime.**
  It must be total, deterministic, stable, and independent of wall-clock
  timing, hash iteration order, presentation, and **fidelity tier**. This ADR
  remains authoritative for due-work scheduling, bounded computation, spatial
  partitioning and fidelity tiers.

**Contract added:** scheduled work is a **trigger with a due time** that reads
authoritative state at execution, not an outcome precomputed at schedule time.
This is what makes it safe to freeze the clock across an interactive tactical
battle and then resume (ADR-0003 A9/A10).

**Second contract added (ADR-0003 A13): no retroactive execution.** The
authoritative clock never moves backward, and **new due work may not be
scheduled for a SimTime earlier than the current authoritative SimTime**. The
scheduler **rejects** such a proposal rather than rewind the world and
retroactively mutate already-processed history. A historical fact or knowledge
record may still carry an earlier `occurredAt` SimTime, and information about an
earlier event may still arrive later; that is a *reference* to the past, not
retroactive *execution*, and it never requires the clock to rewind. Reactions
therefore always begin at or after the SimTime at which they became possible.

This closes the registered decision **N-31**.

**Unchanged:** this ADR still does **not** lock scheduler implementation,
evaluation frequencies, foreground/background thresholds, spatial index
technology, batch sizes, numeric performance budgets, or promotion/demotion
rules. Per ADR-0003 A14, none of those is required to *write* the scheduler
mechanism: frequencies and thresholds are configurable, and the mechanism runs
with placeholder intervals until measurement and tuning exist.

## Consequences of approval

- Simulation work becomes explicit and countable rather than emergent from
  naive loops.
- A "fidelity ledger" becomes necessary: each system's abstraction level and
  its effect on results must be documented.
- Deterministic ordering and seeded randomness become requirements of the
  scheduler, not optional refinements.
- Optimisation risk shifts from performance to correctness and fairness
  (background factions must not silently diverge).
- Fidelity changes **how much work is processed, never what SimTime means or
  when work is due**.
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
| Rewinding the clock to execute newly discovered past work | Retroactively mutates processed history, breaks causal ordering and the world-truth → information → knowledge model (ADR-0003 A13) |

## Unresolved

- **Unresolved:** which spatial structure and what its update cost is under
  campaign-scale geography.
- **Unresolved:** which systems may legitimately use lower fidelity, and what
  coherence guarantee each provides.
- **Unresolved:** profiling budgets and instrumentation thresholds; these should
  follow measurement.
- **Unresolved:** foreground/background thresholds and promotion/demotion rules.
- **Unresolved:** spatial index technology and batch sizes.
- **Resolved 2026-10-06:** the same-instant ordering key is **dueSimTime →
  workClassRank → workIdentifier**, lexicographic ascending; ranks are
  domain-owned and append-only, `BattleResult` has first precedence, and work
  competes in a single pending set with no wave/generation (ADR-0003 amendment
  B2, **N-30**). It is no longer an E1 design blocker.
- **Unresolved (tuning and measurement, not a mechanism blocker):** spatial
  index technology, batch sizes, foreground/background thresholds,
  promotion/demotion rules, and numeric budgets. These require measurement and
  campaign-scale geography that do not exist yet; the scheduler can be written
  against configurable placeholders.
- **Resolved by ADR-0003 (2026-10-05):** whether any decision may take
  retroactive effect and whether the simulation may execute retroactively —
  **no**; the clock never moves backward and new work may not be scheduled into
  the past, while past-tense reference to an earlier `occurredAt` remains
  legitimate (**N-31** closed).
- **Unresolved (AD-3, deliberately kept open):** exact determinism depth.
  ADR-0008 fixes the seams, not the depth.
- **Resolved by ADR-0003 (2026-10-05):** whether SimTime is event-driven,
  fixed-step, or hybrid — **due-work event-driven with absolute monotonic
  fixed-point SimTime**, and no fixed-step whole-world sweep.
- **Resolved by scope:** determinism is justified by debugging, testing,
  benchmarking, save/load, bug reproduction, causal explanation and controlled
  replay — **not** by multiplayer, which is out of MVP scope
  ([ADR-0014](0014-single-player-mvp-scope.md)).
