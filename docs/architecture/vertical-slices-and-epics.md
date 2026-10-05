# Vertical slices and epics

- Status: **Proposal**. Ordering is **dependency-driven**; there are
  deliberately no timelines or estimates here.
- Related: [domain-model.md](domain-model.md), [system-dependency-graph.md](system-dependency-graph.md), [../adr/README.md](../adr/README.md)

## 1. Epic dependency order

```
E0 Foundations hardening
     │
     ├── E1 SimTime, command periods, clock & pause  (ADR-0003)
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
     │            movement, encounters, cohesion  (ADR-0015/0016)
     │                 │
     │                 └── E7 Tactical battle round trip + geographic
     │                          projection  (ADR-0001/0015/0020)
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
| **E0** Foundations hardening | Branded ids, `SimTime` value object, seeded RNG + ordering seams, quality gates, purity test extended to forbid DeI mapping vocabulary and AI types in `src/domain` | `validate` green; purity test covers the new boundary | — |
| **E1** Time and clock | `SimTime`, `CommandPeriod`, clock with pause/resume, interleaving harness | A scripted scenario interleaves movement → observation → report travel → reaction → encounter **inside one period** | intra-period resolution |
| **E2** Causal ledger | `HistoricalEvent` per blueprint §11, append-only, causes/consequences, significance classification, causal trace queries | Trace from a civil-conflict onset back to contributing causes; significance gate keeps ledger proportional | significance policy detail |
| **E3** Geography | Locations, adjacency, **coordinates and terrain properties**, spatial index port; migration path from adjacency-only toward real geography | Movement path cost is a pure function of graph + terrain; locality queries avoid all-vs-all; a location retains enough geographic facts to be projected to a battlefield | terrain effect formulas; canonical coordinate system; map data sourcing (**Research-dependent**) |
| **E4** Characters and houses | Life history, multi-facet relationships, kinship graph, succession/claim reactions, memory references to ledger | A character has a family, education, relationships and a changing life history derived from events | trait/psychology ranges |
| **E5** Knowledge and information | Observation → Report → Rumor → Belief with delay and mutation; **cohort testimony** as a source (ADR-0017) | An actor provably cannot act on a fact absent from its knowledge; displaced people carry eyewitness accounts with them | channel set at launch; deception model; testimony representation |
| **E6** Armies and movement | Formations (ADR-0001), armies, **command hierarchy and command elements** (ADR-0015), **cohesion** (ADR-0016), detachments, movement, contact, encounter creation | An army with detachments and a command hierarchy moves through geography and creates observations without global pairwise checks; who commands and who is player-controlled is campaign fact | supply/fatigue formulas; control-mapping granularity |
| **E7** Tactical round trip | Adapter implements all four stages; BattleState projection; formation → DeI resolution inside the adapter; **geographic projection via `BattlefieldResolver`** (ADR-0020); BattleResult ingested as canonical event | A `BattleState` built from a **known campaign location** launches a geographically appropriate Rome II/DeI battlefield and returns a `BattleResult`; no DeI key or battlefield identifier appears in domain; mixed player/AI allied control validated | mapping fidelity; resolver algorithm; first round-trip scenario; engine control capabilities (**Research-dependent**) |
| **E8** Battle becomes history | Casualties, injury, death, prestige, occupation, memories applied as events; **cohesion change and organisational outcomes** (ADR-0016) | A tactical outcome changes characters, politics and knowledge with a full causal trace; an army may retreat, scatter, fragment or disintegrate, and the outcome is explained from campaign state | consequence magnitudes; organisational outcome formulas |
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
