# Vertical slices and epics

- Status: **Proposal**. Ordering is **dependency-driven**; there are
  deliberately no timelines or estimates here.
- Related: [domain-model.md](domain-model.md), [system-dependency-graph.md](system-dependency-graph.md), [../adr/README.md](../adr/README.md)

## 1. Epic dependency order

```
E0 Foundations hardening  (ADR-0009 identity contract + UUIDv5 representation,
                           ADR-0003 SimTime semantics and invariants)
     │
     ├── E1 SimTime scale, scenario calendar, command periods, clock, pause &
     │        freeze, due-work scheduler, no-retroactive-execution, ordering
     │        (ADR-0003; month = player-facing cadence)
     │        │
     │        └── E2 Causal ledger + significance gate  (ADR-0002/0005)
     │                 │
     │                 ├── E17a Persistence thin slice (repos, snapshots, ledger store)
     │                 │
     ├── E3 Geography, coordinates, terrain & spatial index  (ADR-0020)
     │        │
     │        ├── E4 Characters, houses, relationships, life history
     │        │        │
     │        │        ├── E9 Offices, legitimacy, claims
     │        │        │        │
     │        │        │        ├── E14 Internal crisis & emergent civil conflict
     │        │        │        │
     │        │        │        └── E18 Mutable government & political
     │        │        │             transformation  (ADR-0018; also needs
     │        │        │             E11 recognition, E13 institutions)
     │        │        │
     │        │        └── E13 Institutions, education, legacy
     │        │
     │        └── E6 Formations, armies, command hierarchy, detachments,
     │            movement, encounters, cohesion, background battle
     │            resolution  (ADR-0015/0016/0003 A11)
     │                 │
     │                 └── E7 Tactical battle round trip + geographic
     │                          projection  (ADR-0001/0015/0020/0003 A10)
     │                          │
     │                          └── E8 Battle becomes history (incl.
     │                               organisational survival, ADR-0016)
     │
     ├── E5 Knowledge & information propagation (incl. cohort testimony,
     │        ADR-0017)
     │        │
     │        ├── E6 (observation feeds contact)
     │        └── E16 TheRev / Jev integration via the game-side seam (ADR-0012)
     │
     ├── E10 Culture / religion / government expression (data, ADR-0013)
     │        └── E11 Diplomacy, authority provenance & regime recognition
     │
     └── E12 Settlements, population cohorts, migration, minimum economy
              ├── E13 Institutions live in settlements
              └── E15 Player continuity (ADR-0014: single-player MVP)

PARALLEL TRACK (must not block the chain above, ADR-0019)
     └── PT1 Presentation requirements → Visual Design Bible
```

Dependency-only. E14 sits last among the political work because it is the
integration of legitimacy, claims, institutions, army loyalty, relationships and
culture — it is the hardest requirement and depends on the most. **E18** sits
after E14 for the same reason: political transformation integrates legitimacy,
claims, institutions, diplomacy and succession, and additionally requires
recognition (E11) and institutional state (E13).

**PT1 is explicitly outside the dependency chain.** Presentation consumes
simulation explanation APIs and must never gate simulation architecture
(ADR-0019). Renderer choice is **Unresolved**.

## 2. Epics

| Epic | Delivers | Key acceptance signal | Blocked on design |
| --- | --- | --- | --- |
| **E0** Foundations hardening | Branded canonical IDs (**RFC 4122 UUIDv5**, ADR-0009 §5a), `SimTime` abstraction and its **Approved** invariants — absolute, monotonic, fixed-point, elapsed-time semantics, difference-is-duration, no event-ordinal semantics, no scheduler ordering in SimTime, no JS `Date` as canonical historical time — plus the `ScenarioCalendar` seam, seeded RNG and **separate** same-instant ordering seams, quality gates, purity test extended to forbid DeI mapping vocabulary and AI types in `src/domain`. **Hard-codes no historical movement or report rate; the numeric scale is deferred to E1** | `validate` green; purity test covers the new boundary; a SimTime difference is elapsed duration, not an event count; canonical IDs are deterministic for identical run inputs; **no** historical rate appears in the time primitive | **None.** Identity contract and representation, and SimTime semantics, are all **Approved** (ADR-0009, ADR-0003 A1–A2, A14) |
| **E1** Time and clock | `SimTime` arithmetic on the chosen **fixed-point scale**, `ScenarioCalendar` (epoch, era, BCE-compatible year numbering, month sequence/lengths, units-per-calendar-unit), `CommandPeriod`, clock with pause/resume **and freeze at a fixed SimTime**, due-work scheduler advancing directly between due times, **no-retroactive-execution enforcement** (**reject** — never silently clamp — a proposal to schedule into the past), the same-instant ordering mechanism, and the S13 litmus scenario | The S13 operational-manoeuvre scenario passes: main body plus independent rear guard, both sides continuing to move, scout observation, elapsed-duration report travel, post-information reaction, geography-affected routes, identical arrival and report timings across fidelity tiers, and **no new work scheduled into the past** | **N-29** and **N-30** were **Approved 2026-10-06** (ADR-0003 amendment B1/B2): scale and conversion constant = **1 SimTime unit = 1 simulation hour**, `UnitsPerDay = 24` as `ScenarioCalendar` calibration; ordering key = **`dueSimTime → workClassRank → workIdentifier`**, append-only ranks, `BattleResult` first, single pending set, no wave/generation. **Blocked on design: None.** **N-24** frequencies and **R-12** historical rates are **not** blockers — tuning and content (ADR-0003 A14) |
| **E2** Causal ledger | `HistoricalEvent` per blueprint §11, append-only, causes/consequences, significance classification, causal trace queries | Trace from a civil-conflict onset back to contributing causes; significance gate keeps ledger proportional; references to entities that have ended still resolve (ADR-0009 §3) | significance policy detail |
| **E3** Geography | Locations, adjacency, **coordinates and terrain properties**, spatial index port; migration path from adjacency-only toward real geography | Movement path cost is a pure function of graph + terrain; locality queries avoid all-vs-all; a location retains enough geographic facts to be projected to a battlefield; movement duration is expressed in elapsed SimTime, not month steps | terrain effect formulas; canonical coordinate system; map data sourcing (**Research-dependent**) |
| **E4** Characters and houses | Life history, multi-facet relationships, kinship graph, succession/claim reactions, memory references to ledger | A character has a family, education, relationships and a changing life history derived from events; a **dead** character stays permanently referenceable | trait/psychology ranges |
| **E5** Knowledge and information | Observation → Report → Rumor → Belief with delay and mutation; **cohort testimony** as a source (ADR-0017) | An actor provably cannot act on a fact absent from its knowledge; displaced people carry eyewitness accounts with them; report travel consumes **elapsed SimTime** and is not an event counter | channel set at launch; deception model; testimony representation |
| **E6** Armies and movement | Formations (ADR-0001), armies, **command hierarchy and command elements** (ADR-0015), **cohesion** (ADR-0016), detachments, movement, contact, encounter creation, **rear guard / independent operational maneuver**, and **campaign-side resolution of background (non-interactive) engagements** | An army with detachments and a command hierarchy moves through geography and creates observations without global pairwise checks; who commands and who is player-controlled is campaign fact; an independent rear guard can move separately, observe, and have reports arrive later; a background AI-vs-AI engagement resolves campaign-side **without freezing the world clock** | supply/fatigue formulas; control-mapping granularity; **N-34** (background battle formulas) |
| **E7** Tactical round trip | Adapter implements all four stages; BattleState projection; formation → DeI resolution inside the adapter; **geographic projection via `BattlefieldResolver`** (ADR-0020); BattleResult ingested as canonical event; **campaign clock freeze at the encounter SimTime with in-flight work held** | A `BattleState` built from a **known campaign location** launches a geographically appropriate Rome II/DeI battlefield and returns a `BattleResult`; the clock is frozen at encounter SimTime and in-flight commitments survive; no DeI key or battlefield identifier appears in domain; mixed player/AI allied control validated | mapping fidelity; resolver algorithm; first round-trip scenario; engine control capabilities (**Research-dependent**); **N-32** (save/load mid-battle); **N-35** (`BattleResult` schema) |
| **E8** Battle becomes history | Casualties, injury, death, prestige, occupation, memories applied as events; **cohesion change and organisational outcomes** (ADR-0016) applied on **both** battle paths (ADR-0003 A12); ended entities keep permanently referenceable canonical IDs (ADR-0009 §3) | A tactical outcome changes characters, politics and knowledge with a full causal trace; an army may retreat, scatter, fragment or disintegrate, and the outcome is explained from campaign state; a background AI engagement produces the same kind of authoritative consequence; a disintegrated army remains referenceable afterwards | consequence magnitudes; organisational outcome formulas; **N-33** (battle-consequence SimTime), **N-34** (background battle formulas), **N-36** (fragmentation identity rules) |
| **E9** Offices, legitimacy, claims | Offices/commands/claims as world entities; eligibility data-driven | Political pressure derives from ledger-recorded causes | legitimacy model |
| **E10** Culture/religion/government | Data-driven roles, permissions, education channels, events; **possible government transitions per polity** (ADR-0018); **playable package scope** (ADR-0013/0014) | Two contrasting cultures express authority/education/events via the same primitives | culture-specific rule research; playable faction list |
| **E11** Diplomacy, authority and recognition | Treaties, wars, alliances, trade, marriage with authority provenance; **regime recognition and refusal** (ADR-0018) | An agreement can fail for want of authority; foreign powers recognise or refuse a transformed government based on belief, not truth | treaty taxonomy; recognition rules |
| **E12** Settlements, population and migration | Production → prices → population health → unrest/manpower as events; **owns `PopulationCohort` creation, movement and arrival** (ADR-0017) | Settlement development materially changes supply and manpower; a displaced population moves, arrives, and changes its destination with consequences | resource taxonomy; cohort schema; movement resolution |
| **E13** Institutions and legacy | founder/leader/teachers/students; institution survives founder; rival traditions | A renowned character leaves a persistent institution and students who matter later | generic vs bespoke institutions |
| **E14** Internal crisis and civil conflict | Pressure terms from causal state; crisis predicate; escalation via legal actions only | Civil war is entered only via validated actions and traces fully to contributing events; no random war roll | thresholds, escalation vocabulary |
| **E15** Player continuity | Player controls a family/power bloc, not a single body; single-player MVP scope (ADR-0014) | Bloc can gain and lose offices, commands, claims and state control | control surface per member |
| **E16** TheRev / Jev integration | Game-side intelligence seam (name/API **Unresolved**), knowledge-filtered context assembly, permission boundary, proposal validation, deterministic fallback. **No provider, model manager, routing or Jev implementation lives in this repository** (ADR-0012) | Jev/external intelligence reasons and speaks from filtered knowledge and cannot mutate state; the game works with no model available; the game never contacts a provider directly | SDK contract; transport; port name and shape |
| **E17a** Persistence thin slice | Repository ports, snapshot + ledger store, derived-projection rebuild | Load a snapshot and continue; rebuild a derived view from state | ORM choice |
| **E17b** Persistence hardening | Recovery, projection rebuilds, "why" query API | Crash recovery and explanation queries work | retention/migration |
| **E18** Mutable government and political transformation | Transformation as a validated legal action; institutional resistance; hybrid arrangements; recognition consequences; **succession durability test** (ADR-0018/0011) | A faction's government changes only through a validated attempt with institutional and foreign responses; a personally dependent order can visibly fail at the leader's death | transformation vocabulary; eligibility data; recognition rules; durability modelling |
| **PT1** Presentation *(parallel track)* | Presentation requirements seed; Visual Design Bible; shared UI grammar with culturally specific expression | Presentation reads simulation state and explanation APIs with **no write path**; simulation architecture is not blocked by presentation work | renderer; art pipeline; Visual Design Bible ownership |

## 3. Vertical slices and acceptance criteria

These refine the blueprint's candidate slices (§20). They are **proposals**; the
dependency analysis may split or reorder them.

### S1 — Living Character (E4)
- A character has parents, siblings, a spouse, children, mentors and students.
- Relationships carry multiple simultaneous facets.
- Life history is derived from canonical events; memories reference them.
- Death triggers successor/claim reaction events.
- Persistence round-trips a character without ledger replay.

### S2 — Army in a Real World (E3, E6)
- An army with detachments moves through geography over a command period.
- Detachments act independently; scouts and outposts create observations.
- Movement, contact and scouting are driven by the scheduler and spatial index,
  not all-vs-all comparison.
- Encounter produces a battle candidate with reinforcement timing derived from
  position and route.
- *(ADR-0015/0016)* The army has a command hierarchy: who commands, which
  formations belong to which command element, and which participating forces are
  player-controlled versus AI-controlled — all decided before the battle.
- *(ADR-0016)* Cohesion is visible, distinct from morale, and is affected by
  campaign circumstances, not only by battles.

### S3 — Generated Tactical Battle (E7)
- A `BattleState` (campaign formations, no DeI keys) launches Rome II/DeI and
  returns a `BattleResult`.
- *(ADR-0003 A10)* The campaign clock **freezes** at the encounter SimTime;
  in-flight commitments are **held**, neither processed nor cancelled;
  `BattleResult` is applied as the first due work at that SimTime; remaining
  work at that instant executes against post-battle state; then resume from the
  same SimTime. Real-world battle duration consumes **zero** campaign SimTime.
- Formation → DeI faction/unit resolution happens inside the adapter using the
  extracted catalogs.
- Failure paths return a structured error, never partial world state.
- The purity test proves no DeI vocabulary entered the domain.
- *(ADR-0020)* The encounter originates from a **known campaign location**.
  Geographic context flows `location → TacticalLocationContext →
  BattlefieldResolver → battlefield representation`, and a deliberately small
  known mapping set is enough to prove the round trip.
- *(ADR-0015)* The command/control mapping reaches the engine; the campaign
  issues no tactical orders during the battle; mixed player/AI allied control is
  validated (or its limitation documented).
- *(ADR-0020)* The `BattleResult` is applied back to the same campaign location
  and participants.

### S4 — Battle Becomes History (E8)
- Casualties, injury and death are recorded as events.
- Prestige, army loyalty and political reactions emerge from those events.
- A rival's response is driven by what they know, not by omniscience.
- The political aftermath traces back through the ledger to the battle.
- *(ADR-0016)* Organisational survival is resolved campaign-side: retreat,
  scattering, fragmentation, surrender or disintegration, explained from
  commander survival, cohesion, supply, terrain and loyalty — not from
  `start − casualties = remaining`.
- *(ADR-0016)* Disintegrating armies produce downstream consequences through
  existing systems: veterans, deserters, stories, recruitment, blame.

### S5 — Institutional Legacy (E4, E12, E13)
- A renowned character founds or leads a culturally appropriate institution.
- Students gather, form relationships, and carry skills/doctrine onward.
- The institution survives the founder's death; rival traditions can emerge.
- Institution prestige is settlement-scoped.

### S6 — Different Societies (E10)
- Two contrasting cultures express authority, education and events differently
  using the same primitives, with no per-culture engine branches.
- All culture-specific rules cite research.
- *(ADR-0014)* Playable scope is limited and separate from simulation scope: the
  playable set receives handcrafted packages while **every** faction in the
  world continues to be simulated. A non-playable faction must still progress,
  act and be explainable.
- *(ADR-0018)* `GovernmentType` is data; `Faction.government` is mutable state,
  and the data describes plausible transitions for that polity.

### S7 — Character Mind (E5, E16)
- The character receives only knowledge the character is entitled to hold.
- Knowledge-filtered context is assembled by the simulation and sent across the
  game-side intelligence seam; the game does not contact any AI provider itself.
- External intelligence (Jev via TheRev, or whatever provider TheRev chooses)
  returns dialogue, reasoning or proposed intent.
- Every proposed action re-enters the game and passes the single legal-action
  gate; nothing an AI says becomes world truth, and nothing it proposes becomes
  a world action without validation.
- Lies in dialogue remain belief/dialogue, never world truth.
- A deterministic template path works with no model available.

### S8 — Simultaneous Living World (E1, E5) *(addition from ADR-0003)*
- Inside one command period: movement → observation → report travel → AI
  reaction → changed orders → encounter, interleaved by SimTime.
- Events occur world-wide for AI factions without the player witnessing them.
- Player knowledge stays separate: something happens elsewhere and the player
  only learns later, if at all.
- Substantial management interfaces pause time; significant events can interrupt;
  resume continues the same calendar.
- *(ADR-0003 A1/A2)* Elapsed durations between events are computed as
  **SimTime differences** and are independent of how much unrelated background
  work occurred between them.
- *(ADR-0003 A4)* The scheduler jumps directly between due SimTimes. No daily,
  hourly or minute whole-world sweep exists and presentation frame rate is never
  a simulation driver.
- *(ADR-0003 A5)* Work due at the same SimTime is resolved by a deterministic
  ordering mechanism that is separate from SimTime and independent of fidelity
  tier.
- *(ADR-0003 A13)* **No retroactive execution.** The clock never moves backward
  and no new work is scheduled into the past. An event occurring at T=500 whose
  report arrives at T=620 produces a reaction at T=620 or later, never a rewind.
- *(ADR-0003 A14)* The mechanism is content-agnostic: durations come from domain
  inputs, and no historical travel or report rate is embedded in the primitive.

### S9 — Bounded Computation (E0, E4, E6, E12) *(addition from ADR-0004)*
- A deterministic benchmark (fixed seed, fixed scenario) reports work items per
  period per system.
- Background factions remain causally coherent under reduced fidelity.
- Measured degradation exists and is attributable (metrics seams), with budgets
  derived from baselines rather than invented.
- No naive per-entity sweep exists in the hot path.
- *(ADR-0014/0008)* Determinism is verified for single-player engineering needs:
  debugging, save/load, benchmark reproducibility and controlled replay. No
  networking determinism requirement exists.
- *(ADR-0017)* Population cohorts move as bulk aggregated records and do not
  create per-individual scheduling work.

### S10 — Displacement and Migration (E5, E12) *(addition from ADR-0017)*
- Conquest or siege produces displacement; an aggregated `PopulationCohort`
  moves to a destination.
- The cohort carries culture, religion, social composition, displacement cause
  and collective memory.
- Its arrival changes the destination: growth, labour, food pressure, unrest,
  recruitment, trade and composition.
- Testimony originating from the cohort enters the knowledge system through the
  normal provenance chain.
- **No code writes a conquest directly into a faction relation modifier.**

### S11 — Political Transformation (E9, E11, E14, E18) *(addition from ADR-0018)*
- A character, house, dynasty, political faction or military bloc attempts a
  transformation through a validated legal action.
- Power enables the attempt; institutions and other actors may resist, producing
  elite opposition, popular reaction, army loyalty shifts, compromise or hybrid
  arrangements.
- Foreign powers learn of the change through information channels and may
  recognise, refuse recognition, support exiles or rivals, renegotiate, exploit
  or stay neutral — driven by belief, not by truth.
- The attempt, its causes and its consequences trace fully through the ledger.
- *(ADR-0011)* A system resting on one extraordinary person can fail at their
  death: prestige vanishes, relationships shift, old institutions reassert
  themselves, and the player can see whether a durable order was created.

### S12 — Culturally Distinct but Shared (E10, PT1) *(addition from ADR-0019)*
- The same interface grammar presents different researched visual languages per
  culture.
- Presentation reads simulation state and explanation APIs and has **no write
  path** into authoritative state.
- Simulation architecture is complete and testable with no renderer chosen and
  no UI implemented.

### S13 — Operational Maneuver Litmus Test (E1, E6, E7) *(addition from ADR-0003/0009, 2026-10-05)*

**The architecture acceptance test for the locked time and identity model.** A
scripted scenario must demonstrate **all** of the following, with no fixed
ticks, no whole-world sweeps, no monthly teleportation, no renderer authority,
no Rome II campaign authority, and no event-count-based duration:

- The player's **main body** approaches an enemy army.
- A friendly **rear guard / detachment** moves **independently** around the
  enemy, on its own commitment with its own start SimTime, path and duration.
- **Both sides continue moving** according to actual commitments.
- **Scouts observe** from actual positions, and **reports require elapsed
  simulation duration** to reach a commander.
- Commanders **react only after information arrives**, and those reactions may
  **change future movement**.
- **Terrain and geography affect routes** and duration.
- The enemy may **escape, counter-manoeuvre, intercept, become partially
  encircled, or become fully encircled** — all as consequences of commitment
  outcomes, not scripted stage directions.
- The player may receive a **significant interrupt** and return to control.
- If **tactical contact occurs and the player enters the battle**: campaign
  SimTime freezes → `BattleState` → Rome II / DeI → `BattleResult` → result
  applied → campaign resumes. Meanwhile the rear guard's in-flight commitment
  **survives** the freeze and completes at its own due SimTime after resume.
- If **two AI armies elsewhere fight** during this same operational situation,
  their battle is resolved **internally by HistoricalGame** under normal campaign
  scheduling and **does not** trigger the player's tactical freeze merely because
  combat occurred elsewhere.
- Durations and **due times** are **independent of unrelated background event
  density**: the same seed at a different fidelity tier produces the same arrival
  and report timings (A1, A5). ADR-0004's allowance to cap work per instant and
  defer overflow must not move a due time; it changes *when work is processed*,
  not *when it is due*, and a deferred item still reads authoritative state at
  execution (A9).
- A unit that **disintegrates or is disbanded** stays **permanently
  referenceable** afterwards, and no ledger reference to it was rewritten
  (ADR-0009 §3).
