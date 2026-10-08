# System dependency graph

- Status: **Ownership split and boundary shapes are Approved** (ADR-0004,
  ADR-0005, ADR-0006 now approved). Specific plumbing, thresholds and
  implementations remain **Unresolved**.
- Related: [ADR-0003](../adr/0003-strategic-command-periods-simtime-pause.md), [ADR-0004](../adr/0004-simulation-scheduling-and-bounded-computation.md), [ADR-0006](../adr/0006-legal-action-and-proposal-validation.md), [ADR-0015](../adr/0015-campaign-command-hierarchy-and-tactical-control.md), [ADR-0017](../adr/0017-population-cohorts-migration-and-displacement.md), [ADR-0018](../adr/0018-mutable-government-and-political-transformation.md), [ADR-0020](../adr/0020-campaign-geography-and-tactical-battlefield-projection.md)

## 1. Corrected progression model

An earlier sketch implied a sequential phase pipeline:

```
start → player orders → autonomous decisions → movement → battles → propagation → end
```

**This is not an implementation shape.** Those processes interleave repeatedly
inside a single command period according to simulated time and causality
(**Approved**, ADR-0003). The correct mental model is a loop, not a pipeline:

```
        ┌──────────────── one shared simulation calendar ────────────────┐
        │                                                             │
        │  order issued ─▶ movement progresses ─▶ contact/observation  │
        │        ▲                                   │                 │
        │        │                                   ▼                 │
        │  changed orders ◀── AI/character reacts ◀── report travels    │
        │        ▲                                   │                 │
        │        │                                   ▼                 │
         │  political consequence ◀── battle ◀── encounter              │
         │        │                                     │               │
         │        ▼                                     ▼               │
         │  knowledge updates ◀── rumors/reports ◀── more orders        │
         │       ▲                                                     │
         │       │ cohort testimony                                     │
         │  displaced population ◀── conquest / siege / policy          │
         │                                                             │
         └─────────────────────────────────────────────────────────────┘
```

Everything above happens inside the same half-year window. AI does not wait for
an "AI turn". The command period boundary is a synchronisation and notification
point, not a state teleport.

## 2. Ownership and dependency graph

```
┌───────────────────────────── KERNEL ──────────────────────────────┐
│ SimTime: absolute, monotonic, fixed-point ELAPSED simulation time  │
│   (difference between two values = elapsed duration; never an       │
│    event count, scheduler sequence, fidelity density or frame count)│
│ ScenarioCalendar: immutable authoritative scenario data (epoch,    │
│   era, year numbering direction incl. BCE, month sequence/lengths,  │
│   units-per-calendar-unit) → dates derive mechanically               │
│ CommandPeriod (~half-year planning horizon; month = player cadence)│
│ canonical ids (ADR-0009: unique, immutable, never reused,           │
│   survive end of life) · seeded RNG streams                          │
│ separate same-instant ordering (never encoded into SimTime)         │
│ clock supports pause AND freeze at a fixed SimTime                  │
└───────────────┬───────────────────────────────────────────────────┘
                │ drives due work, never "runs the world"
                │ advances directly between due times — no world sweep
┌───────────────▼───────────────────────────────────────────────────┐
│ SCHEDULER (Proposal, ADR-0004)                                    │
│ due-work queue (trigger, not precomputed outcome) · spatial index  │
│ foreground/background tiers · cached derived projections · batched  │
│ aggregate systems · instrumentation + deterministic benchmarks     │
└───┬───────────────┬───────────────┬───────────────┬───────────────┘
    │               │               │               │
    │ needs work    │ needs work    │ needs work    │ needs work
┌───▼────────────┐ ┌▼─────────────┐ ┌▼────────────┐ ┌▼────────────┐
│ GEOGRAPHY      │ │ POLITY &     │ │ CHARACTERS  │ │ MILITARY    │
│ locations,     │ │ FACTIONS     │ │ life, family│ │ formations, │
│ adjacency,     │ │ MUTABLE      │ │ relations,  │ │ armies,     │
│ coordinates,   │ │ government   │ │ offices,    │ │ command     │
│ terrain        │ │ (ADR-0018),  │ │ claims      │ │ hierarchy   │
│ (read model)   │ │ offices,     │ │             │ │ (ADR-0015), │
│ + cohort       │ │ claims,      │ │             │ │ cohesion    │
│ movement       │ │ institutions │ │             │ │ (ADR-0016)  │
│ (ADR-0017)     │ │              │ │             │ │             │
└───┬────────────┘ └┬─────────────┘ └┬────────────┘ └┬────────────┘
    │               │               │               │
    │ produces domain events (never direct cross-writes)
    ▼               ▼               ▼               ▼
┌──────────────────────────────────────────────────────────────────┐
│ EVENT LAYER (one envelope; four classifications, ADR-0005)         │
│  simulation · information · canonicalHistorical · playerNotification│
│  canonicalHistorical entries append to the causal ledger (ADR-0002) │
└───┬──────────────────────────────────────────────────────────────┘
    │ feeds derived views (rebuildable, never authoritative)
    ▼
┌──────────────────────────────────────────────────────────────────┐
│ DERIVED VIEWS                                                      │
│ KnowledgeIndex (who believes what, from where)   ← ADR §8         │
│ Reputation projections (audience-dependent)      ← ADR §8/§13     │
│ Pressure/legitimacy view (crisis predicates)     ← ADR-0011       │
└───┬──────────────────────────────────────────────────────────────┘
    │ decisions are made from belief, never from truth
    ▼
┌──────────────────────────────────────────────────────────────────┐
│ DECISION LAYER                                                     │
│ autonomous characters · AI factions · player                      │
│ external intelligence proposes intent only, via TheRev            │
│ (ADR-0012 — TheRev/Jev/provider live OUTSIDE this repository)      │
└───┬──────────────────────────────────────────────────────────────┘
     │ every proposal — player, AI or TheRev/Jev — enters one gate
     ▼
┌──────────────────────────────────────────────────────────────────┐
│ LEGAL ACTION VALIDATION (Approved boundary, ADR-0006)             │
│ proposal → validate against state at SimTime → accept | reject     │
│ the validator judges; the owning system mutates and emits events   │
└───┬──────────────────────────────────────────────────────────────┘
    │ applied effects
    ├──────────────▶ AUTHORITATIVE STATE (loop back to systems)
    │
     │ battle-specific path
     ▼
┌──────────────────────────────────────────────────────────────────┐
│ TACTICAL BOUNDARY (Approved, ADR-0001/0003/0015/0020)            │
│ BattleEncounter (campaign location + authoritative geography)    │
│   → geographic context → TacticalLocationContext                  │
│   → BattlefieldResolver (ADAPTER-SIDE; may consult Rome II/DeI    │
│     battlefield + environment catalogs, derives match scores)     │
│   → Rome2DeIAdapter → Rome II / DeI battlefield                   │
│ BattleState carries campaign truth ONLY: locations, participants,  │
│   formation refs, pre-battle state, and the command/control map   │
│   (who commands; who is player-controlled vs AI-controlled).      │
│ The campaign issues NO tactical orders during the battle.         │
│ BattleResult → simulation applies casualties, injuries, prestige, │
│   occupation, cohesion loss, organisational outcomes (ADR-0016),  │
│   memories, political consequences                               │
└──────────────────────────────────────────────────────────────────┘
        ▲ INTERACTIVE path only: campaign clock FREEZES at encounter
        │ SimTime T; in-flight work is HELD (not processed, not
        │ cancelled); BattleResult applied as first due work at T
        │ while still frozen; remaining work at T reads post-battle
        │ state; then resume from T. Real-world battle duration
        │ consumes ZERO campaign SimTime. (ADR-0003 A10)

┌──────────────────────────────────────────────────────────────────┐
│ BACKGROUND BATTLE SIMULATION (Approved 2026-10-05, ADR-0003 A11)  │
│ AI-vs-AI battles resolved by HistoricalGame's own campaign battle │
│ simulation from authoritative campaign military state.            │
│ NO external handoff. NO clock freeze — the world continues under   │
│ normal scheduling.                                                │
└──────────────────────────────┬───────────────────────────────────┘
                               │
                 both paths ───┴───▶ ONE campaign-side outcome seam
                                       BattleResult (ADR-0003 A12,
                                       ADR-0001 decision 12)
                                       HistoricalGame applies every
                                       consequence and remains owner of
                                       persistent world state.
                                       Schema NOT frozen (N-35).

Persistence (ADR-0010, approved 2026-10-07): authoritative state + causal ledger +
snapshots behind repository ports; SQLite (better-sqlite3) behind Drizzle ORM,
change-aware per-step mirroring, immutable verified save slots. Single-player MVP
means save/load and recovery only — no replication, locking or distributed
coordination (ADR-0014).

Presentation (ADR-0019): a **consumer only**. It reads authoritative state and
derived views to render a shared UI grammar with culturally specific expression.
It never writes state. It is a parallel design track and must not block
simulation architecture.

External intelligence (ADR-0012): TheRev and any AI provider are **outside this
repository**. HistoricalGame assembles knowledge-filtered context, sends it
across the game-side intelligence seam, and receives dialogue, reasoning or a
proposed action back. HistoricalGame performs no provider orchestration, no model
management and no routing. The seam's name and API are **Unresolved**; only its
existence is required.
```

## 2.1 Three geographic layers that must not be conflated

Per ADR-0020 (**Approved principle**):

| Layer | Owner | Contains | Never contains |
| --- | --- | --- | --- |
| Campaign geography | Domain | authoritative coordinates, regions, terrain, elevation, rivers, coasts, passes, roads, biome, season/weather context | Rome II / DeI map or battlefield keys |
| Visual campaign map | Presentation | rendering of campaign geography | a second source of geographic truth |
| Tactical geographic projection | Adapter | translation between campaign geography and an engine battlefield representation | decisions about what is historically true |

Three kinds of knowledge stay separated: (1) authoritative campaign facts,
(2) researched Rome II / DeI metadata, (3) adapter-derived compatibility scores.
Inferred geography is never authoritative.

## 2.2 AI authority (approved, ADR-0012 / ADR-0006)

1. The HistoricalGame TypeScript simulation owns canonical world state.
2. HistoricalGame decides what a character is permitted to know.
3. Only knowledge-filtered context crosses the boundary to TheRev.
4. TheRev / Jev / provider output cannot directly mutate canonical state.
5. Every proposed world action returns through the single legal-action gate.
6. Dialogue may lie, speculate, misunderstand, conceal, manipulate or repeat
   rumors when character state permits.
7. AI statements do not become world truth by being generated.
8. AI-proposed actions do not become world actions without validation.
9. A provider is never handed omniscient state merely because the simulation
   holds it.

Design principle: **TypeScript decides what happened. AI decides how a person
thinks or talks about what happened.**

## 3. Who reads what

| Consumer | Reads authoritative state | Reads derived views | Never reads |
| --- | --- | --- | --- |
| Decision layer (autonomous, player) | via legal actions only | knowledge, reputation, pressure | enemy hidden truth |
| TheRev / AI provider (external) | nothing — it is outside this repository | knowledge-filtered character context supplied by the game | omniscient world state, canonical state |
| Knowledge system | observations, events, cohort testimony | — | truth it has not observed |
| Battle adapter | BattleState projection + adapter-side catalogs | — | campaign systems internals |
| Battlefield resolver | campaign location + authoritative geographic context | adapter-side catalog metadata and derived match scores | campaign history, characters, politics |
| Presentation | authoritative state (read-only) | knowledge, reputation, chronicle, causality traversal | any write path to state |
| TheRev / AI provider | **nothing** — it lives outside this repository | knowledge-filtered character context supplied by the game | omniscient world state, provider internals, canonical state |
| Persistence | state, ledger, snapshots | — | — |
| Notification layer | nothing authoritative | knowledge/relevance | — |

## 4. Architectural invariants to encode in tests later

1. No system mutates another system's state directly; all cross-system effects
   arrive as domain events.
2. Decision-making reads belief, not truth.
3. `BattleResult` is the only inbound channel from the tactical engine.
4. External intelligence (TheRev / Jev / provider) output can only become state
   through validation.
5. The scheduler is driven by SimTime and pause state, never by wall clock.
6. Optimisation may reduce background fidelity but never breaks causal
   coherence for background factions.
7. No Rome II / DeI unit key, catalog field name, map key or battlefield
   identifier exists anywhere in the domain (ADR-0001, ADR-0020).
8. The campaign never issues tactical orders during a battle, and no code infers
   engine tactical intent as historical fact (ADR-0015).
9. Post-battle organisational outcomes are computed campaign-side from campaign
   state, never requested from the engine (ADR-0016).
10. Displacement consequences flow through cohorts, knowledge and political
    action; no code writes a conquest directly into a faction relation modifier
    (ADR-0017).
11. Government changes only through a validated transformation action with
    institutional and recognition consequences (ADR-0018).
12. Every faction in the world is simulated regardless of playable status
    (ADR-0014).
13. Presentation has no write path into authoritative state (ADR-0019).
14. No AI provider, TheRev or Jev holds canonical state or bypasses the legal
    action gate; no provider receives unfiltered world state (ADR-0012).
15. Adapters are translation layers: the tactical adapter returns results, and
    the battlefield resolver selects representations. Neither originates
    campaign truth (ADR-0001, ADR-0020).
16. No system anywhere owns time; all actors progress on one shared timeline
    (ADR-0003, ADR-0004).
17. SimTime is elapsed simulation time only: the difference between two SimTimes
    is the elapsed duration between them. SimTime is never an event count,
    scheduler sequence, fidelity density, frame count or causal-operation count
    (ADR-0003 A1).
18. The scheduler advances directly to the earliest due SimTime. No daily, hourly
    or minute whole-world sweep exists, and no system is driven by presentation
    frame rate. Timestamp precision is not evaluation frequency (ADR-0003 A4).
19. Deterministic same-instant ordering is resolved by a mechanism separate from
    SimTime, and is independent of wall-clock timing, hash iteration order,
    presentation and fidelity tier (ADR-0003 A5).
20. Calendar dates derive from SimTime plus immutable scenario calendar data. The
    SimTime scalar always increases forward; display direction, including BCE,
    never reverses it, and no system treats JavaScript `Date` as canonical
    historical time (ADR-0003 A3).
21. Every entity keeps a permanently referenceable canonical ID after ceasing to
    be active/extant. Identity is never erased, recycled or reused, and no
    historical reference is rewritten because its target ended (ADR-0009 §3).
22. Canonical ID assignment is deterministic given scenario identity, stable
    source identifiers, version/configuration and seed, and never derives from
    wall-clock time, ambient randomness, the database or mutable display data
    (ADR-0009 §5).
23. Only an interactive external tactical handoff freezes the campaign clock.
    Background AI-versus-AI battles are resolved internally and do not freeze the
    world; real-world tactical duration consumes zero campaign SimTime
    (ADR-0003 A10/A11).
24. Both battle resolution paths cross one campaign-side `BattleResult` boundary.
    The campaign applies every consequence and remains owner of persistent world
    state; Rome II's representation is never canonical (ADR-0003 A12).
25. Scheduled work is a trigger with a due time that reads authoritative state at
    execution; no path applies a precomputed outcome computed against superseded
    state (ADR-0003 A9).
26. Fidelity changes how much work is processed, never what SimTime means, when
    work is due, or how same-instant work is ordered (ADR-0004).
