# ADR-0003: Strategic command periods, SimTime, simultaneous world progression and pause

- Status: **Approved** (resolves prior AD5)
- Date: 2026-10-04
- Affects: turn/time model, scheduler, UI, AI, determinism, save/load
- Related: [ADR-0004](0004-simulation-scheduling-and-bounded-computation.md), [../architecture/system-dependency-graph.md](../architecture/system-dependency-graph.md)

## Context

The design direction is approximately two strategic command periods per year
(first and second half). An earlier proposal described a phase pipeline
(`start → player orders → autonomous decisions → movement → battles →
propagation → end`). That diagram is useful only as a conceptual dependency
sketch. It must **not** be implemented as six giant sequential phases, because
those processes interleave repeatedly within a single period according to
simulated time and causality.

## Decision

1. **Command period granularity is approximately half a year, two per year**
   (first half, second half). This is a configurable default, not a hardcoded
   rule.
2. **Command periods are the player decision cadence, not exclusive turns.** No
   faction owns time. The world owns time.
3. **All factions, characters, armies, scouts, outposts, messengers,
   institutions and economies advance on one shared simulation calendar within
   the same period.** AI factions and characters act during that same window;
   they never wait for a separate AI turn.
4. **Orders interleave with world progression.** An order to march produces
   progressive movement during the period; an outpost may observe it; the
   observation produces a report; the report takes simulated time to arrive; the
   receiving commander acts on the information they actually hold, possibly
   changing orders, intercepting, ambushing, occupying terrain or withdrawing.
   Encounter and battle may occur inside the same period, and the political
   consequences continue inside it.
5. **SimTime is distinct from the command period and strictly finer-grained.**
   Exact intra-period resolution is unresolved. Do not assume a literal per-day
   sweep across all entities.
6. **Seasons derive from the simulation calendar.** Their effects on movement,
   supply, agriculture and campaigning are unresolved and must not be invented.
7. **Simulation time can pause.** Substantial management interfaces
   (diplomacy, character/family, government/politics, army organisation,
   settlement management, institutions, economy) and significant events requiring
   player input are candidates for pausing progression. Pause is a capability of
   the simulation clock, not scattered per-system flags. Exact pause rules and
   which notifications interrupt automatically are unresolved.
8. **Interleaving must be first-class.** The architecture must support repeated
   interleaving within a period without becoming an unbounded event storm or a
   giant world manager.
9. **World truth and player knowledge remain separate at all times.** Things
   happen elsewhere in the world without the player knowing; information reaches
   the player later through reports, merchants, diplomacy, scouts, rumors,
   institutions or other channels.

## Consequences

- The simulation needs a clock/arbiter with pause semantics, schedulable
  systems, and resumable pause points. Systems are scheduled units, not pipeline
  stages.
- The command period boundary is a synchronisation and notification point, not a
  state teleport.
- The UI is a pause client, and pause/resume must not introduce wall-clock
  dependence into the domain.
- Determinism requires care around pause boundaries and resume ordering
  ([ADR-0008](0008-determinism-and-reproducibility.md)).
- Interleaving must be bounded and observable, which is the subject of
  [ADR-0004](0004-simulation-scheduling-and-bounded-computation.md).

## Rejected alternatives

| Alternative | Why rejected |
| --- | --- |
| Exclusive player turn then AI turn | AI does not wait; world time would be artificial |
| Six sequential phases per period | Processes interleave repeatedly; phases serialise causally unrelated work |
| World teleports at End Turn | Breaks continuous living world and information travel |
| Faction-owned time | No faction owns time |

## Unresolved

- **Unresolved:** intra-period SimTime resolution and whether simulation is
  event-driven, fixed-step, or hybrid.
- **Unresolved:** how movement time couples to command periods.
- **Unresolved:** calendar, epoch and dating of historical events.
- **Unresolved:** pause UX rules and which notifications auto-interrupt.
- **Unresolved:** save/load while paused and clock resume semantics.
- **Unresolved:** what happens to in-flight world progression when a battle is
  launched from a pause and returns a result.
