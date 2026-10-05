# Simulation scheduling and performance architecture

- Status: **Approved architectural direction** (ADR-0004, approved
  2026-10-04). The *strategy* is approved; every technique, threshold and budget
  below remains a candidate and no implementation detail is locked.
  **Amended 2026-10-05** to incorporate the N-1 closure from ADR-0003: SimTime
  semantics, the due-work jump, same-instant ordering separation, the
  trigger-not-outcome contract, and the tactical freeze versus background battle
  distinction.
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
- C9. **The time model is now settled (ADR-0003, N-1 closed 2026-10-05):**
   SimTime is an absolute, monotonic, fixed-point measure of **elapsed**
   simulation time; simulation is **due-work driven**; there is **no fixed-step
   whole-world sweep**; and same-instant ordering is a **separate** mechanism
   from SimTime.

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
9. **Advance directly between due times; never sweep (ADR-0003 A4).** With work
   due at T=100 and the next work due at T=527, the scheduler advances directly
   from 100 to 527. It processes 101…526 only if work actually exists there. No
   daily, hourly or minute whole-world sweep exists, and no system is driven by
   presentation frame rate. **Timestamp precision is not evaluation
   frequency.**
10. **Elapsed time is not event count (ADR-0003 A1).** A duration is the
    difference between two SimTimes. SimTime must never be an event counter, a
    scheduler sequence, a fidelity density, a frame count or a causal-operation
    count. An intra-month ordinal is **rejected**: its unit is the event, so its
    magnitude depends on unrelated background activity and it cannot express
    duration.
11. **Same-instant ordering is a separate mechanism (ADR-0003 A5).** When several
    items are due at one SimTime, a **separate deterministic ordering mechanism**
    decides what resolves first. Its minimum properties are total,
    deterministic, stable, and independent of wall-clock timing, hash iteration
    order, presentation and **fidelity tier**. The final key shape remains open
    (**N-30**).
12. **Scheduled work is a trigger, not a precomputed outcome (ADR-0003 A9).**
    Work carries a due time and reads authoritative state **at execution**.
    Without this, work resumed at a given SimTime could apply values computed
    against superseded state and produce history that could not have happened.
13. **Fidelity changes work volume, never SimTime meaning.** Raising or lowering
    how much work is processed must not change what SimTime means or when work is
    due. It also must not change the ordering among work due at one instant,
    because that would make the same seed produce different history at different
    tiers.
14. **Player cadence is a presentation concern, not a scheduling cadence
    (ADR-0003 A6).** Month is the normal player-facing progression cadence inside
    the ~six-month strategic horizon. The scheduler still processes far finer due
    work internally; the UI presents month boundaries. **The monthly cadence must
    never flatten operational movement into monthly teleportation** — military
    truth is not a monthly snapshot, and rendering interpolation is not
    authoritative simulation state.

### 4.1 Proposed instrumentation seams (conceptual ports, not yet implemented)

| Seam | Purpose |
| --- | --- |
| `Clock` | Owns SimTime (absolute, monotonic, fixed-point elapsed time), pause and freeze state, period boundaries; holds at a frozen instant across a tactical handoff; no wall clock in domain (ADR-0003) |
| `Scheduler` / due-work queue | Holds scheduled consequences with due SimTime; reads authoritative state at execution; **separate deterministic same-instant ordering** from SimTime |
| `ScenarioCalendar` | Authoritative immutable scenario calendar data (epoch, era, year numbering direction, month sequence, month lengths, units-per-calendar-unit); dates derive mechanically from SimTime + this data (ADR-0003 A3) |
| `SpatialIndex` | Locality queries for movement, contact, observation |
| `RandomSource` | Seeded, partitioned streams (ADR-0008) |
| `ProjectionStore` | Cached derived views with explicit invalidation |
| `MetricsSink` | Work items processed, per-system and per-period counters, timings |
| `BattleOutcomePort` (conceptual) | The single campaign-side seam through which **both** resolution paths deliver a campaign-authoritative outcome: HistoricalGame-internal background battles and the Rome II / DeI adapter. Carries `BattleResult`; schema **not** frozen (**N-35**) (ADR-0003 A12) |

### 4.2 Deterministic benchmarks (**Proposal**)

- Fixed scenario + fixed seed; replay from a snapshot; compare final state hash.
- Report work items processed per period, per system.
- Report relative foreground/background split and cache hit/miss counts.
- Record baseline numbers *before* proposing any performance budget.

### 4.0 What the approval does not lock

Scheduler implementation; evaluation frequencies; foreground/background
thresholds; spatial index technology; batch sizes; performance budgets;
promotion/demotion rules between tiers. The standing principles that *are*
approved: the background world stays causally real at lower fidelity, and the
world owns time — every faction and system progresses on the same timeline.

**Changed by ADR-0003 (2026-10-05):** "tick resolution" is **no longer** in this
list. The SimTime question is closed: absolute monotonic fixed-point elapsed
SimTime, due-work driven, no fixed-step whole-world sweep, and same-instant
ordering as a separate mechanism. What remains open is the **fixed-point scale**
(**N-29**) and the **final ordering-key shape** (**N-30**), not the model.

## 4.3 Clock ownership during a tactical handoff (ADR-0003 A10/A11)

Two distinct battle paths, and only one of them stops the clock:

| | Background non-interactive battle | Interactive player tactical battle |
| --- | --- | --- |
| Who resolves it | HistoricalGame's own campaign battle simulation | Rome II / DeI via `Rome2DeIAdapter` |
| Campaign clock | **Continues** under normal scheduling | **Freezes** at encounter SimTime `T` |
| In-flight work | Continues on schedule | **Held** — neither processed nor cancelled |
| Real-world duration | not applicable | Consumes **zero** campaign SimTime |
| Outcome seam | `BattleResult` | `BattleResult` |
| Consequence owner | HistoricalGame | HistoricalGame, applied while still frozen |

**The freeze belongs to an interactive external handoff, not to the existence of
a battle.** Every faction in the world is simulated regardless (ADR-0014), so
freezing on *every* battle would make the campaign stutter indefinitely.

Scheduler obligations during a freeze:

1. On freeze at `T`, do not advance the clock and do not discard the queue.
2. On result, apply `BattleResult` as the **first due work at `T`**, ordered by
   the same-instant ordering mechanism — not as a special-cased side channel.
3. Process only afterwards the remaining work due at `T`, which must read the
   **post-battle** authoritative state (trigger, not precomputed outcome).
4. Resume the clock from `T`.

No special-casing is needed beyond ordering `BattleResult` first at `T`; the
generic mechanism already provides it.

## 5. Risks of the recommended direction

| Risk | Mitigation |
| --- | --- |
| Tiering starves distant regions into incoherence | Fairness review; documented fidelity guarantees per system |
| Nondeterminism from hash iteration or scheduler ordering | Explicit ordering keys independent of hash order **and fidelity tier**; seeded streams; determinism test (ADR-0008) |
| Debuggability loss ("it happened but why here?") | Causal trace tooling over the ledger; significance classification |
| Cache staleness bugs | Explicit invalidation on state change; projection rebuild tests |
| Over-engineering before measurement | Instrument first; adopt technique only with evidence |
| Event cascade explosion within one instant | Cap work per instant; defer overflow work to later SimTime |
| **Reintroducing event counts as time** | SimTime is elapsed-duration arithmetic only; forbid ordinal/counter semantics in the clock (ADR-0003 A1) |
| **Conflating timestamp precision with tick rate** | State the due-work jump explicitly (ADR-0003 A4); no world sweep exists in the hot path |
| **Monthly UI flattening operational movement** | Movement/report commitments carry sub-month durations; UI cadence never sets SimTime granularity (ADR-0003 A6/A8) |
| **Resumed work applying stale precomputed outcomes** | Due work reads authoritative state at execution (ADR-0003 A9) |
| **Freezing the world on background AI battles** | Freeze is bound to the interactive handoff only (ADR-0003 A11) |
| **Tactical battle leaking real-world time into campaign order** | Clock holds at `T`; result applied at `T`; zero campaign SimTime consumed (ADR-0003 A10) |
| **Calendar/BCE breaking the monotonic clock** | Scalar always increases forward; BCE is scenario calendar data only (ADR-0003 A3) |
| **Late-arriving information rewinding the world** | No retroactive execution: the clock never moves backward and no new work is scheduled into the past; reactions begin at or after the moment they became possible (ADR-0003 A13) |
| **Historical rates baked into the time primitive** | Mechanism and tuning are separate; the time model represents durations without knowing their values (ADR-0003 A14) |

## 6. Open decisions (**Unresolved**)

- Spatial structure choice and its update cost at campaign scale, including the
  migration path from adjacency to a coordinate-based map.
- Which systems may use lower fidelity, and the coherence guarantee each gives.
- Evaluation frequencies, foreground/background thresholds, batch sizes, spatial
  index technology and promotion/demotion rules (**N-24**). **Tuning and
  measurement, not a mechanism blocker**: the scheduler writes against
  configurable intervals and placeholders (ADR-0003 A14).
- The **fixed-point scale/precision** for SimTime and the numeric value of the
  simulation-units-per-calendar-unit constant (**N-29**). The *semantics* are
  closed; the values are not. **This is a genuine time-and-clock-epic blocker**,
  because the epic cannot perform SimTime arithmetic or map a SimTime onto a
  calendar position without them — there is no placeholder that is not simply the
  value.
- The **final shape of the same-instant ordering key** (**N-30**). Its minimum
  properties are closed; its shape is not. **Also a genuine blocker**, because
  resolving work due at one SimTime is itself part of the epic's deliverable.
- Numeric performance targets — deferred until baselines exist.
- Cohort movement resolution cost: bulk movement is cheap, but attrition,
  multi-settlement absorption and multi-generational residence may not be.
- Fidelity level for post-battle organisational resolution in background armies
  (ADR-0016).
- Internal **background battle-resolution formulas** for AI-versus-AI battles
  (**N-34**). The authority split is closed (ADR-0003 A11); the mechanics are
  not.
- The complete shared **`BattleResult` schema** across both resolution paths
  (**N-35**).
- Save/load and clock resume while an **interactive tactical battle is in
  flight** (**N-32**).
- Whether tactical encounter sites are chosen at schedule time or lazily at
  battle launch, and whether that choice is part of the deterministic ordering
  (ADR-0020).
- Historical travel, courier and messenger rates that will ground movement and
  report-travel durations (**R-12**, research). **Deferred content, not a
  mechanism blocker**: the authoritative campaign geography does not yet exist,
  durations are derived from domain inputs, and the time model is designed to
  represent results without knowing the values (ADR-0003 A14).
