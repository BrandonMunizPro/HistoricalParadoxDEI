# ADR-0008: Determinism and reproducibility

- Status: **Approved architectural direction** (approved 2026-10-04). Exact
  determinism **depth** remains deliberately **Unresolved** (AD-3).
- Date: 2026-10-04
- Related: [ADR-0004](0004-simulation-scheduling-and-bounded-computation.md), [ADR-0003](0003-strategic-command-periods-simtime-pause.md), [ADR-0014](0014-single-player-mvp-scope.md)

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
- numeric representation (floats versus fixed point) and its effect on
  reproducibility.

## Consequences of approval

- Deterministic benchmarks become possible: replay a fixed scenario from a seed
  and compare state hashes.
- Pause/resume must not depend on wall-clock time.
- Determinism becomes a testable property, which also strengthens the domain
  purity guarantees.

## Rejected alternatives

| Alternative | Why not |
| --- | --- |
| Best-effort determinism | Unreproducible bugs become undebuggable |
| Global single RNG stream | Any system's extra draw shifts everything else |

## Unresolved

- **Unresolved (AD-3, deliberately kept open):** how strict determinism must be.
  The approval fixes the *seams*; it does not fix the *depth*.
- **Unresolved:** numeric representation (floats versus fixed point) and its
  effect on reproducibility.
- **Unresolved:** whether AI-proposed actions are recorded for exact replay, or
  replayed as recorded inputs.
