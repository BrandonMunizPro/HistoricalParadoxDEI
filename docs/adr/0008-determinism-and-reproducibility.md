# ADR-0008: Determinism and reproducibility

- Status: **Approved architectural direction** (approved 2026-10-04). Exact
  determinism **depth** remains deliberately **Unresolved** (AD-3). **Amended
  2026-10-05** to record deterministic canonical identity (ADR-0009) and
  fixed-point SimTime semantics (ADR-0003).
- Date: 2026-10-04
- Amended: 2026-10-05
- Related: [ADR-0004](0004-simulation-scheduling-and-bounded-computation.md), [ADR-0003](0003-strategic-command-periods-simtime-pause.md), [ADR-0009](0009-identity-model.md), [ADR-0014](0014-single-player-mvp-scope.md)

## Context

Debuggability, testing, benchmarking and replay all benefit from reproducible
simulation. The world is turnless within a command period and interleaves many
actors, which makes ordering and randomness sources easy to lose track of. LLM
output (Jev) is inherently nondeterministic and must stay outside the state
transition.

**Scope confirmation (approved 2026-10-04):** the MVP is single player
([ADR-0014](0014-single-player-mvp-scope.md)). Determinism is justified by
single-player engineering needs and **not** by multiplayer. No architectural
complexity is paid today for hypothetical networking, and future multiplayer is
not made impossible without reason — it simply is not an architectural
requirement today.

Reproducibility is wanted for:

- debugging;
- automated testing;
- benchmarking;
- save/load verification;
- simulation bug reproduction;
- scenario replay;
- causal explanation;
- performance profiling;
- controlled experiments.

## Decision

**Approved as a set of architectural constraints, not a mechanism:**

- No wall-clock or ambient randomness inside domain code; time and randomness
  are injected.
- Every random draw comes from an explicit, seedable stream, partitioned per
  system or per entity so that unrelated systems cannot desynchronise each
  other.
- Iteration order over entities is explicit and stable, never dependent on
  incidental hash order.
- Scheduling decisions are deterministic given the same seed and inputs.
- Reproducible scenario setup: fixed seeds and fixed initial conditions.
- Jev/LLM proposals enter as validated inputs, so nondeterministic external
  intelligence cannot corrupt reproducibility of the simulation core.

### Not required by this approval

- multiplayer lockstep;
- network synchronisation;
- rollback networking;
- distributed simulation authority;
- desynchronisation recovery;
- multiplayer pause semantics.

### What this approval does **not** lock

- the depth of determinism (registered as AD-3, deliberately unresolved);
- numeric representation and its effect on reproducibility, **except** as
  recorded in the amendment below.

## Amendment 2026-10-05: two numeric/determinism questions closed

### A1. Canonical identity assignment is deterministic

Per [ADR-0009](0009-identity-model.md) (**Approved**): given the same scenario
identity, the same source datasets identified through stable source
identifiers, the same simulation version and configuration, and the same
deterministic seed, the same authored entity and the same deterministically
generated initial entity receive the **same canonical ID across equivalent
runs**.

Canonical ID generation must not depend on wall-clock time, ambient randomness,
database-generated identity or mutable display data, and IDs are persisted and
never regenerated on load.

**Unaffected by this approval:** the concrete ID **encoding** remains deferred
(ADR-0009).

### A2. SimTime's numeric semantics are fixed; the scale is not

Per [ADR-0003](0003-strategic-command-periods-simtime-pause.md) (**Approved**),
SimTime is an **absolute, monotonic, fixed-point measure of elapsed simulation
time**. This *is* a numeric-representation decision, and it removes the earlier
"floats versus fixed point" ambiguity **for SimTime**: floating-point timestamps
are not acceptable for the canonical clock, because exact reproducible ordering
and duration arithmetic are required.

Two things are deliberately **still open**:

- the **scale/precision** of the fixed-point representation;
- numeric representation **outside** SimTime — aggregates, ledger magnitude,
  simulation numbers generally — which is untouched by this amendment.

Because ordering among work due at one SimTime is a **separate mechanism**
(ADR-0003), this approval's ordering requirements are unchanged and now also
require that ordering be independent of **fidelity tier**: changing how much
work is processed must not change history.

## Consequences of approval

- Deterministic benchmarks become possible: replay a fixed scenario from a seed
  and compare state hashes.
- Pause/resume must not depend on wall-clock time.
- Determinism becomes a testable property, which also strengthens the domain
  purity guarantees.
- Scenario setup must be reproducible end to end, including canonical identity,
  which is why ADR-0009's guarantee is written against scenario identity, source
  datasets, version/configuration and seed rather than against a storage layer.

## Rejected alternatives

| Alternative | Why not |
| --- | --- |
| Best-effort determinism | Unreproducible bugs become undebuggable |
| Global single RNG stream | Any system's extra draw shifts everything else |

## Unresolved

- **Unresolved (AD-3, deliberately kept open):** how strict determinism must be.
  The approval fixes the *seams*; it does not fix the *depth*.
- **Unresolved:** the fixed-point **scale/precision** for SimTime, and numeric
  representation outside SimTime (floats versus fixed point) and its effect on
  reproducibility. SimTime's *semantics* are now fixed as absolute monotonic
  fixed-point elapsed time (ADR-0003).
- **Unresolved:** whether AI-proposed actions are recorded for exact replay, or
  replayed as recorded inputs.
- **Resolved (ADR-0009, 2026-10-05):** canonical identity assignment is
  deterministic given scenario identity, stable source identifiers,
  version/configuration and seed. Encoding remains deferred.
