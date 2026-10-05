# ADR-0003: Strategic command periods, SimTime, simultaneous world progression and pause

- Status: **Approved** (resolves prior AD5). **Amended 2026-10-05** to lock N-1:
  absolute monotonic fixed-point SimTime, scenario calendar data, month as the
  player-facing cadence, same-instant ordering separation, the tactical clock
  freeze, and the rule that background AI battles do not freeze the world.
- Date: 2026-10-04
- Amended: 2026-10-05
- Affects: turn/time model, scheduler, UI, AI, determinism, save/load
- Related: [ADR-0004](0004-simulation-scheduling-and-bounded-computation.md), [ADR-0001](0001-campaign-military-representation-vs-dei-tactical.md), [ADR-0016](0016-military-cohesion-and-post-battle-survival.md), [../architecture/system-dependency-graph.md](../architecture/system-dependency-graph.md)

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
   Exact intra-period resolution is **now decided** — see the amendment below.
   Do not assume a literal per-day sweep across all entities.
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

## Amendment 2026-10-05: N-1 closed — the time model

This amendment closes the registered decision **N-1**. It elaborates decisions
1–9 above; it does not rewrite them.

### A1. SimTime is elapsed simulation time, and nothing else

**Approved.** SimTime represents **elapsed simulation duration**. The defining
property is:

> The difference between SimTime A and SimTime B represents the elapsed
> simulation duration between them.

SimTime must **not** represent:

- the number of events processed;
- scheduler sequence;
- fidelity or work density;
- presentation frames;
- the number of causal operations;
- any "Nth thing that happened this month" counter.

Duration arithmetic therefore supports, without depending on unrelated event
density:

- army movement;
- detachment movement;
- information and report travel;
- reinforcement arrival;
- retreat and pursuit;
- recovery;
- construction;
- political and institutional processes.

**Rejected interpretation, recorded deliberately.** An earlier proposal used an
intra-month ordinal (an event counter within the calendar month) as the
intra-period time representation. That is **rejected**. An event counter's unit
*is the event*, so its magnitude depends on how much unrelated work exists, and
therefore varies with fidelity tier and background activity. It cannot express
duration. It is retained here as a recorded rejection so the idea is not
reintroduced.

### A2. Conceptual representation of SimTime

**Approved conceptually:** SimTime is an **absolute, monotonic, fixed-point
measure of elapsed simulation time**.

- **Absolute** — one shared scalar timeline for the whole world, not a
  month-relative position.
- **Monotonic** — it never decreases. BCE or descending-year display does not
  reverse it (§A3).
- **Fixed-point** — a fixed resolution with exact, reproducible arithmetic. The
  *semantics* are fixed now; the concrete numeric representation and scale may
  remain implementation-level, and the scale itself is **Unresolved**.

The concrete **scale/precision** is deliberately not fixed, because no
repository authority requires a particular value and choosing one now would be
inventing a mechanic. See A3 for the smallest decision that E1 actually needs.

### A3. The historical calendar is authoritative scenario data

**Approved.** Calendar dates are **derived mechanically** from
`SimTime + immutable ScenarioCalendar data`.

- `ScenarioCalendar` is **authoritative scenario/domain data**, not a
  presentation cache and not a rebuildable projection. The start world is data
  (A-7); so is its calendar.
- The conversion is a **pure function** of the SimTime scalar and that data.
- The mapping must support:
  - scenario start / epoch;
  - **BCE chronology**;
  - **year numbering direction**;
  - **month sequence**;
  - **month boundaries and lengths**;
  - future scenario and calendar variation where required.
- The SimTime scalar always increases forward, so **display direction never
  reverses SimTime**.
- JavaScript `Date` must **not** be the canonical historical time model.
- A **Gregorian-only assumption must not be invented** unless repository
  authority already requires it. None does.

**Smallest decision needed before E1 (recorded).** E1 needs to place a due
SimTime on a calendar date. The minimum `ScenarioCalendar` semantics that
unblocks E1 are therefore:

1. an immutable scenario calendar value carrying epoch/start mapping, era and
   year numbering direction, month sequence, and month boundaries/lengths;
2. a total, deterministic `SimTime + ScenarioCalendar → calendar position`
   function;
3. the fixed conversion constant — **simulation units per calendar unit** —
   declared as **a `ScenarioCalendar` property, not a global constant**, so a
   future scenario may differ;
4. a fixed-point scale fine enough that movement and report-travel durations are
   expressible without forcing sub-month duration to quantise to whole months.

The **numeric value** of that constant and of the scale remains **Unresolved**
and is not selected here. Do not over-design the historical calendar system
beyond what E1 requires.

### A4. SimTime is not a fixed-step world tick

**Approved.** Fine SimTime resolution does **not** imply fixed-step simulation.
HistoricalGame remains **due-work / event-driven**, per
[ADR-0004](0004-simulation-scheduling-and-bounded-computation.md), which stays
authoritative on due-work scheduling, bounded computation, spatial partitioning
and fidelity tiers.

Conceptually, with work due at T=100 and the next work due at T=527, the
scheduler may advance **directly from 100 to 527**. It does **not** need to
process 101, 102, … 526 unless work actually exists there.

No system may introduce:

- a daily whole-world sweep;
- an hourly whole-world sweep;
- a minute whole-world sweep;
- renderer-driven simulation;
- mandatory processing of every representable SimTime value.

**Timestamp precision and evaluation frequency are different concerns.**
Presentation frame rate is unrelated to SimTime. Capping work per instant and
deferring the overflow to a later SimTime is a legitimate scheduling behaviour
and is not a fixed step.

### A5. Same-SimTime ordering is separate from SimTime

**Approved.** The two questions are distinct:

- **SimTime answers:** *when does this occur?*
- **The scheduler ordering mechanism answers:** *if multiple things are due at
  the same SimTime, what resolves first?*

Deterministic same-instant ordering must **not** be encoded into SimTime. A
**separate deterministic ordering mechanism** must exist.

Its exact final key shape may remain under the appropriate unresolved scheduler
decision. At minimum it must be:

- **total**;
- **deterministic**;
- **stable**;
- **independent of wall-clock timing**;
- **independent of hash iteration order**;
- **independent of presentation**;
- **independent of fidelity tier**.

The independence-from-fidelity-tier requirement matters because fidelity changes
how much work exists, and therefore how many items share an instant. Ordering
that shifted with fidelity would make the same seed produce different history at
different tiers.

Do **not** reintroduce event ordinals as elapsed time (§A1).

### A6. Player-facing time cadence

**Approved.** The intended player experience is preserved and now explicit:

- Approximately **six months** remains the broader strategic **command /
  planning horizon** (decision 1).
- **Month is the normal player-facing progression cadence** within that horizon.
  This is a narrowing of decision 1, which previously left the player cadence at
  the half-year granularity.
- Conceptually: `JAN → FEB → MAR → APR → MAY → JUN`.
- Month being the visible cadence does **not** make month the minimum SimTime
  resolution. Internal simulation may schedule meaningful events between
  visible month boundaries.
- Internal precision does **not** imply presenting days, hours, minutes or
  abstract SimTime units to the player during normal strategic play.
- Significant developments may **interrupt** progression and return control to
  the player.

The normal player rhythm remains approximately:

```
plan → advance → observe → react → advance → interruption when significant
→ react → consequence
```

### A7. Orders create commitments

**Approved design principle.** An order does **not** immediately grant results
merely because it was issued while paused.

An order may create a **commitment** carrying, as applicable:

- start SimTime;
- movement or path;
- target;
- duration or progress;
- future due work;
- other domain-owned state.

**Pause gives the player thinking time. Pause is not an action-point exploit**
and does not make travel, communication or any other temporal process occur
instantly.

### A8. The time model must support real operational maneuver

**Approved.** N-1 is closed only if it can express the military requirement.
The campaign simulation must eventually support real operational maneuver
including independent detachments, main body, vanguard, rear guard, scouts,
screening, flanking, reinforcement, interception, avoidance, retreat, pursuit,
supply protection, geography-dependent routes, observation, report travel,
delayed knowledge, and reaction after information arrival.

Two prohibitions make this concrete:

- **The monthly UI cadence must never flatten operational movement into monthly
  teleportation.**
- **Military truth is not a monthly snapshot.**

Rendering interpolation is **not** authoritative simulation state. Fidelity and
work density may increase as armies become geographically or intelligence
related **without changing the meaning of SimTime**.

### A9. Due work is a trigger, not a precomputed outcome

**Approved.** Scheduled work is a **trigger with a due time** that reads
authoritative state **at execution**. It is not an outcome computed at schedule
time.

This is a scheduler contract, not an implementation detail. Without it, work
resumed at a given SimTime could apply values computed against superseded state,
producing history that could not have happened. This follows from mutable
authoritative state being the truth ([ADR-0002](0002-authoritative-state-causal-ledger-snapshots.md))
and from deterministic scheduling given inputs
([ADR-0008](0008-determinism-and-reproducibility.md)), and is stated here
explicitly because the tactical freeze in A10 depends on it.

### A10. Interactive player tactical battle freezes the campaign clock

**Approved.** When a battle is handed from HistoricalGame to Rome II / Divide
et Impera for **interactive tactical resolution**:

1. The encounter occurs at authoritative campaign SimTime `T`.
2. HistoricalGame **freezes the shared campaign clock at `T`**.
3. Existing scheduled campaign work is **held**.
4. Held work is **not** processed merely because the player spends real-world
   time in Rome II.
5. Held work is **not** cancelled.
6. HistoricalGame creates `BattleState`.
7. Tactical authority transfers through the adapter.
8. Rome II / DeI resolves the tactical battle.
9. `BattleResult` returns.
10. HistoricalGame applies `BattleResult` **while the campaign clock remains
    frozen at `T`**.
11. `BattleResult` application **must occur before incompatible remaining work at
    `T` continues**.
12. Remaining due work must **execute against the newly authoritative
    post-battle state**, not blindly apply stale precomputed outcomes (A9).
13. Campaign simulation may then **resume from `T`**.

Consequences:

- **Real-world tactical battle duration consumes ZERO campaign SimTime by
  itself.**
- Future battle consequences may create **future scheduled campaign work after
  resume**. Their formulas are **not** designed here.
- Arrival and reinforcement timing are **campaign-side commitments** expressed
  as offsets from the encounter SimTime, counted down after resume. Whether the
  tactical adapter honours them is **Research-dependent** (ADR-0015, ADR-0020).
- Applying `BattleResult` as due work at `T`, ordered by the A5 mechanism, is
  sufficient; no special-case machinery is required.

### A11. Background AI battles do not freeze the world

**Approved.** This resolves the question that the tactical freeze alone left
open.

- **Background AI-versus-AI battles are resolved by HistoricalGame's own
  campaign battle simulation.** They do **not** normally transfer authority to
  Rome II / DeI, and therefore do **not** freeze the shared campaign clock merely
  because an AI battle occurs.
- HistoricalGame will eventually resolve those battles using authoritative
  campaign military state and battle-resolution logic. Candidate inputs may
  include army composition, strength, troop quality, commanders, formation
  state, morale, cohesion, fatigue, supply, terrain, positioning, reinforcement
  state, operational circumstances, and bounded deterministic/random factors
  where appropriate.
- **No such formulas are designed or implemented here.**
- Because every faction in the world is simulated regardless (ADR-0014), the
  absence of a freeze here is what makes the freeze in A10 viable at all: a
  freeze on *every* battle would make the campaign stutter indefinitely.

The two paths are architecturally distinct:

```
BACKGROUND NON-INTERACTIVE BATTLE
  → HistoricalGame resolves it internally
  → produces authoritative campaign battle outcome/result
  → consequences enter normal campaign simulation
  → world clock continues under normal scheduling rules

INTERACTIVE PLAYER TACTICAL BATTLE
  → HistoricalGame freezes campaign clock at encounter SimTime
  → BattleState
  → Rome II / DeI
  → BattleResult
  → HistoricalGame applies result
  → campaign resumes from the frozen SimTime
```

**The tactical freeze is associated with an INTERACTIVE EXTERNAL TACTICAL
HANDOFF, not with the abstract existence of every battle in the world.**

If a future feature lets the player enter or spectate an otherwise AI battle
through an actual interactive tactical handoff, that case **may** use the A10
contract. That feature is **not** designed here.

### A12. Shared campaign-side battle outcome boundary

**Approved direction only.** Whether a battle is resolved by HistoricalGame's
internal battle simulation (A11) or by Rome II / DeI through the adapter (A10),
the result must cross a **common campaign-side conceptual boundary** sufficient
for HistoricalGame to apply authoritative consequences.

- The existing **`BattleResult`** abstraction is that boundary. The
  documentation is reconciled around it rather than introducing a competing
  abstraction.
- The complete `BattleResult` schema is **deliberately not frozen**.
- Both resolution mechanisms are **not** required to have identical internal
  mechanics.
- Rome II's representation is **never** canonical.

The invariant: **HistoricalGame consumes a campaign-authoritative battle
outcome/result and remains owner of persistent world state.**


### A13. No retroactive simulation execution

**Approved.** The authoritative simulation clock **never moves backward**, and
the simulation **never executes retroactively**.

- The authoritative SimTime is **monotonic non-decreasing in practice**: the
  clock advances and holds; it does not rewind.
- **New due work may not be scheduled for a SimTime earlier than the current
  authoritative SimTime. Such a proposal is rejected.**
- The simulation does **not** rewind and does **not** retroactively mutate
  history that has already been processed.
- **Past-tense reference to an earlier SimTime is legitimate and distinct from
  retroactive execution.** A historical fact or knowledge record may carry an
  earlier `occurredAt` SimTime, and information about an earlier event may
  arrive later. Neither requires, permits or implies rewinding the clock.

**Rejection, not silent clamping.** The scheduler must **reject** a past-due
scheduling request. It must **not** silently clamp it to the current SimTime,
adjust it to some other due time, or quietly reinterpret the requested timing.
A silent clamp would hide a modelling error inside scheduler behaviour: the
caller would believe its requested due time was honoured when it was not, and
the discrepancy would surface much later as unexplainable history. An explicit
rejection makes the violation visible at the point it is caused.

If a future feature genuinely requires **"execute immediately if overdue"**
semantics, that behaviour must be modelled **intentionally** — as a named,
explicit domain rule in the epic that owns the mechanic, with its own
consequences for determinism and for explanation — and must never emerge
implicitly from scheduler internals. That decision is **not** made here.

Worked example, using the user's ruling:

```
T=500   event occurs                          (world truth)
T=620   report / information arrives          (information)
T=620   recipient learns the event occurred at T=500   (knowledge)
T>=620  any reaction to that knowledge begins (causal ordering)
```

The reaction begins at `T=620` or later. The simulation does **not** return to
`T=500` and does not retroactively mutate already-processed authoritative history.

**Why this matters.** It is what makes the world-truth → information → knowledge
model coherent and preserves causal ordering: an actor may only ever act on
information it holds, at a SimTime at or after the moment it learned it. Without
this rule, a late-arriving report could pull already-processed history out of
order and make the ledger describe a world that never happened.

This closes registered decision **N-31**.

### A14. Mechanism and historical tuning are separate concerns

**Approved.** The time model must be able to *represent* a duration without
knowing, at the time the time primitive is created, how long that duration is in
the world.

- **The mechanism** — SimTime, the calendar mapping, the due-work scheduler and
  the ordering mechanism — is fixed-point and content-agnostic. It does **not**
  embed travel rates, report rates, distances or any other historical tuning.
- **Historical tuning** — actual rates and magnitudes — is content and domain
  work, derived from domain inputs such as: geographic distance, route/path,
  terrain, movement method, army/detachment state, messenger or courier method,
  weather and conditions, and other relevant domain factors.
- The authoritative campaign **map and geography are not yet established**
  ([ADR-0020](0020-campaign-geography-and-tactical-battlefield-projection.md)),
  so concrete historical travel and report rates cannot responsibly be locked.
  This is a reason to defer them, not a gap in the mechanism.

**Consequences for the foundations epic.** The foundations epic implements the
SimTime **abstraction and its invariants** — absolute, monotonic, fixed-point,
elapsed-time semantics, difference-is-duration, no event-ordinal semantics, no
scheduler ordering encoded in SimTime, no JavaScript `Date` as canonical
historical time — and **must not hard-code any historical movement or report
rate**. The time-and-clock epic then chooses the concrete fixed-point scale and
`ScenarioCalendar` conversion the scheduler and calendar need.

**Classification rule for registers.** A tuning or content dependency must not be
recorded as an implementation blocker for the mechanism simply because the
mechanism is what will eventually consume the tuned value. Registration must
distinguish **"the mechanism cannot be written without this"** from **"the
mechanism works with a placeholder until this is researched."**

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
- **Amendment consequence:** the clock now owns an absolute monotonic SimTime
  plus scenario calendar data, and it must be able to hold at a frozen instant
  across an external tactical handoff without letting real-world time leak into
  campaign ordering (A10).
- **Amendment consequence:** because a background AI battle no longer freezes
  the world (A11), the campaign needs an internal battle-resolution path whose
  outcome crosses the same campaign-side boundary as the adapter path (A12).
- **Amendment consequence:** because month is the player-facing cadence (A6),
  the UI presents month boundaries while the simulation schedules far finer due
  work. Presentation must never be used to drive SimTime (A4).
- **Amendment consequence:** because the clock never moves backward and no new
  work may be scheduled into the past (A13), the scheduler **rejects** a proposal
  to schedule work in the past rather than rewind. Late-arriving information
  therefore always produces **forward** consequences.
- **Amendment consequence:** the mechanism is content-agnostic (A14), so the
  foundations epic is not coupled to historical travel or report rates and may
  proceed on approved semantics alone.

## Rejected alternatives

| Alternative | Why rejected |
| --- | --- |
| Exclusive player turn then AI turn | AI does not wait; world time would be artificial |
| Six sequential phases per period | Processes interleave repeatedly; phases serialise causally unrelated work |
| World teleports at End Turn | Breaks continuous living world and information travel |
| Faction-owned time | No faction owns time |
| Intra-month ordinal / event counter as intra-period time | Its unit is the event; magnitude depends on unrelated event density and fidelity tier, so it cannot express duration (A1) |
| Event-driven, fixed-step, or hybrid as an open choice | Resolved: due-work event-driven with fixed-point timestamps; no fixed world sweep (A2, A4) |
| `(calendarPosition, withinMonthElapsedValue)` as the canonical time value | Requires carry/borrow across unequal months and complicates BCE direction; an absolute scalar plus scenario calendar data is simpler and safer (A2, A3) |
| Encoding same-instant ordering into SimTime | Conflates "when" with "in what order", and couples ordering to event density (A5) |
| Freezing the campaign clock for every battle | Every faction is simulated (ADR-0014), so this would make the world stutter indefinitely (A11) |
| Allowing a proposal to schedule work at a SimTime earlier than the current authoritative SimTime | Would require rewinding and retroactively mutating processed history, breaking causal ordering and the world-truth → information → knowledge model (A13) |
| Embedding historical travel/report rates in the time primitive | Conflates mechanism with tuning, and would hard-code content into a primitive that must exist before the campaign geography does (A14) |

## Unresolved

- **Resolved by this amendment:** intra-period SimTime resolution, and whether
  simulation is event-driven, fixed-step, or hybrid — **due-work event-driven
  with absolute monotonic fixed-point SimTime** (A1, A2, A4). This closes the
  registered decision **N-1**.
- **Resolved by this amendment:** elapsed time versus same-instant ordering
  (A5); the event-ordinal interpretation of SimTime (A1); tactical in-flight
  world progression for **interactive** tactical battles (A10); whether
  background AI battles freeze the world (A11).
- **Resolved by this amendment:** whether any decision may take retroactive
  effect, and whether the simulation may execute retroactively — **no**. The
  clock never moves backward, no new due work may be scheduled into the past,
  and past-tense reference to an earlier SimTime is a separate, legitimate
  concern (A13). This closes the registered decision **N-31**.
- **Resolved by this amendment:** the separation of the time **mechanism** from
  historical **tuning**. Concrete historical travel and report rates are
  deferred content, not a property of SimTime and not a foundations-epic
  dependency (A14).
- **Unresolved:** the fixed-point scale and the numeric value of the
  simulation-units-per-calendar-unit constant (A3). It lives in
  `ScenarioCalendar`; the value is not selected.
- **Unresolved:** how movement time couples to command periods, in detail.
  Player cadence is settled (A6); the mechanics of movement during a period are
  not.
- **Unresolved:** the final shape of the same-instant ordering key (A5). The
  minimum properties are fixed; the shape is a scheduler decision.
- **Unresolved:** pause UX rules and which notifications auto-interrupt
  (including what significance is sufficient to interrupt, A6).
- **Unresolved:** save/load while paused, and clock resume semantics. This now
  includes **save/load with an interactive tactical battle actively in flight**,
  which the freeze in A10 makes a stable persistable state (clock at `T`,
  battle launched, no result). Reload behaviour — re-launch, restore, or
  abort-and-refund — is not decided.
- **Unresolved (deferred content, not a mechanism blocker):** concrete
  historical travel speeds, courier and messenger rates, and report-transmission
  durations. These are tuning derived from domain inputs and authoritative
  geography that do not yet exist, and the mechanism is explicitly designed to
  run without them (A14, register **R-12**).
- **Unresolved (tuning, not a mechanism blocker):** the numeric evaluation
  frequencies, foreground/background thresholds, batch sizes, spatial index
  technology, performance budgets and tier promotion rules. The scheduler
  mechanism can be implemented with configurable intervals and placeholders;
  these values are tuning and measurement work (register **N-24**).
- **Unresolved:** the internal campaign battle-resolution formulas for
  background AI battles (A11). The authority split is decided; the mechanics are
  not, and belong to ADR-0016 mechanics design.
- **Unresolved:** the complete `BattleResult` schema (A12). Only the shared
  campaign-side boundary is decided.
