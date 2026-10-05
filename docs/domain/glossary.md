# Glossary

- Status: **Working vocabulary.** Definitions marked **[B]** follow blueprint
  text; a `blueprint §…` cite is given where the entry maps to a specific
  section. Terms marked **[A]** come from the approved architecture delta rather
  than the blueprint (single-player/command/cohesion/migration/government/
  presentation/geography); the governing ADR is cited in each entry. Others are
  design proposals; none is implemented.

## Truth, time and causality

| Term | Definition |
| --- | --- |
| Authoritative state | **[B]** The mutable strategic truth owned by the TypeScript simulation. What systems read and write. |
| Causal ledger | **[B]** Canonical record of historically meaningful domain events with participants, locations, magnitude, causes and consequences; enables "explain why" (blueprint §11, §1.1). **Append-only** is a stronger requirement contributed by ADR-0002. |
| Snapshot | **[B]** Durable capture of authoritative state at a point in time. |
| `HistoricalEvent` | **[B]** Canonical ledger entry: `id`, `date`, `type`, `participants[]`, `factions[]`, `locations[]`, `magnitude`, `causes[]`, `consequences[]`, `witnesses[]`. |
| Causality spine | The `causes[]` links that let a chain of events be traversed forwards and backwards. |
| SimTime | **[A]** The simulation clock: an **absolute, monotonic, fixed-point measure of elapsed simulation time**, strictly finer-grained than a command period. The defining property is that the difference between SimTime A and SimTime B is the elapsed simulation duration between them. It is **not** an event count, scheduler sequence, fidelity density, presentation frame count, or count of causal operations, and it does **not** carry same-instant ordering. Fixed-point **scale** is **Unresolved** (ADR-0003, N-29). The blueprint does not define SimTime — it states only that the direction is turn based and the exact temporal scale is unresolved (§15). |
| `ScenarioCalendar` | **[A]** Immutable authoritative **scenario data** carrying epoch/start mapping, era and year numbering direction (including BCE), month sequence, month boundaries/lengths, and the simulation-units-per-calendar-unit constant. Calendar dates are derived mechanically from `SimTime + ScenarioCalendar`; the conversion is a pure function. This is domain data, not a presentation cache and not a rebuildable projection. The scalar always increases forward, so display direction never reverses SimTime (ADR-0003). |
| Same-instant ordering | **[A]** A **separate deterministic mechanism** deciding what resolves first among work due at the **same** SimTime. Distinct from SimTime, which answers *when*. Must be total, deterministic, stable, and independent of wall-clock timing, hash iteration order, presentation and **fidelity tier**. Final key shape **Unresolved** (ADR-0003, N-30). |
| Command period | **[A]** Approximate half-year **strategic command / planning horizon**; two per year (first half, second half). A configurable default, not a hardcoded rule (ADR-0003). The blueprint fixes **no** cadence: §1.2 lists exact turn duration as not locked and §15 states the exact temporal scale is unresolved. |
| Player-facing cadence | **[A]** **Month** is the normal player-facing progression cadence inside the ~six-month command period. Internal SimTime resolution is much finer, and internal precision does **not** imply presenting days, hours, minutes or abstract units to the player. The monthly cadence must never flatten operational movement into monthly teleportation (ADR-0003). |
| World owns time | **[B]** No faction owns time; all actors progress on one shared simulation calendar within a period. |
| Pause | **[A]** Halting simulation progression, e.g. for a substantial management interface or an event requiring player input. A capability of the simulation clock, not scattered per-system flags (ADR-0003). Exact pause rules and which notifications auto-interrupt remain **Unresolved**. Pause gives thinking time and is **not** an action-point exploit. The blueprint contains no pause concept. |
| Freeze | **[A]** Holding the shared campaign clock at a **fixed SimTime** while an **interactive external tactical handoff** is in progress. Distinct from pause: a freeze exists specifically to hand tactical authority to Rome II / DeI and back. In-flight work is **held**, neither processed nor cancelled; `BattleResult` is applied while still frozen; real-world battle duration consumes **zero** campaign SimTime (ADR-0003). Background AI battles do **not** freeze. |
| World truth vs knowledge | **[B]** What happened versus what an actor believes happened. Never conflated. |
| Canonical identity | **[A]** The domain-owned, stable reference for an entity: globally unique within the HistoricalGame identity system, immutable, **permanently referenceable**, **never reused**, independent of database presence, serialization safe, stable across save/load, usable in ledgers/relationships/snapshots/histories, and independent of display names, mutable domain state, Rome II / DeI identifiers and external catalog identifiers. Carries **no authoritative chronology** and no domain semantics (ADR-0009). The player has **no product requirement** for human-readable IDs. |
| Canonical ID representation | **[A]** **RFC 4122 UUIDv5** — name-based, SHA-1, 128-bit, deterministic by construction, opaque. Derived from a fixed application namespace UUID plus a stable name input. Chosen because determinism becomes a **structural property** of the representation rather than an implementation obligation (ADR-0009 §5a). UUIDv4 breaks determinism; UUIDv7 and ULID leak wall-clock chronology that the identity contract forbids; per-kind counters need cross-merge coordination; prefixed hybrids encode kind. **Non-blocking open:** the `sourceKey` field name/shape and the UUID library (**N-28r**). |
| Source identity / `sourceKey` | **[A]** A stable authored **source** identifier identifying an authored source entity. Content-side provenance and a permitted **input** to canonical identity derivation. It is **not** the canonical runtime ID. Derived identity must key off a stable source namespace/key rather than mutable content (ADR-0009). |
| Extant state | **[A]** Whether an entity is currently an **active/extant** world entity. **Separate from identity**: ceasing to be active never erases, recycles, invalidates or replaces canonical identity. A dead character, disintegrated army or ended cohort stays permanently referenceable, and historical references are never rewritten because their target ended (ADR-0009). |
| Continuation vs creation | **[A]** The transformation principle: an operation that continues the same historical entity **preserves identity**; an operation that genuinely creates a new historical entity gives it a **new** canonical identity; ended entities remain referenceable. **No universal merge/split identity rule exists** — domain-specific rules decide per fragmentation, split, merge, succession, reorganization or transformation, in the epic owning that mechanic (ADR-0009 §4, N-36). |
| World-scoped meaning | **[A]** Canonical IDs may be **globally unique in representation** while their **historical meaning belongs to a particular world/scenario history**. An ID from a fork, mod or re-import carries no claim about another world (ADR-0009 §6). |

## Events

| Term | Definition |
| --- | --- |
| Domain event | A single envelope for anything that happens, carrying `kind`, `tier`, actors, locations, payload and `causes[]`. |
| `simulation` tier | Transient intra-period occurrences (movement steps, order changes, routine ticks). Not ledgered by default. |
| `information` tier | Knowledge or reputation deltas with provenance (observation → report → rumor → belief). |
| `canonicalHistorical` tier | Historically meaningful occurrences appended to the causal ledger. |
| `playerNotification` tier | Presentation-only projection of the other tiers; never authoritative. |
| Significance | Whether an occurrence deserves permanent historical status. Contextual; no formula. |
| Derived compatibility score | **[A]** An adapter-computed score for how well an engine battlefield matches campaign geography. Never historical fact; never in the domain. |

## Information

| Term | Definition |
| --- | --- |
| Observation | **[B]** A witnessed fact: estimated strength, position, direction, confidence, observed time, reported time. |
| Report | **[B]** An observation relayed, subject to travel delay. |
| Rumor | **[B]** A report that may mutate as it travels. |
| Knowledge entry | **[B]** What an actor believes, with source and confidence. The only thing decisions may rely on. |
| Information propagation | **[B]** News travelling through geography and social networks, not teleporting. |
| Reputation | **[B]** Audience-dependent standing ("the Great" at home, "the Butcher" abroad). |
| Testimony | **[A]** Eyewitness account carried by a displaced `PopulationCohort`; an information source that travels with the people rather than with a scout or merchant. |

## Characters and politics

| Term | Definition |
| --- | --- |
| Character | **[B]** A person with identity, psychology, traits/skills, offices, claims, wealth, prestige, influence, legitimacy, popularity, elite support, army loyalty, knowledge, relationships, memories and life history. |
| House / dynasty | **[B]** A political family carrying continuity across generations, with branches. |
| Kinship edge | **[B]** A typed relationship (parent, child, sibling, spouse) between characters or houses. |
| Relationship | **[B]** A multi-facet social edge: affection, trust, fear, respect, rivalry, obligation, remembered events. |
| Life history | **[B]** A character's history composed from canonical historical events. |
| Memory | **[B]** What a character retains, referencing historical events. |
| Office / title / command | **[B]** Political and military positions that belong to the world, not to UI menus. |
| Claim | **[B]** A claim to authority or succession held by a character or house, with a legitimacy basis. |
| Legitimacy | **[B]** The perceived right to rule or hold authority; shaped by religion, culture, institutions and history. |
| Player continuity / power bloc | **[B]** The player's persistent political family or bloc, which can gain or lose offices, commands, claims and control of the state. |
| Crisis | **[B]** A derived political state emerging from accumulated legitimacy, succession, claim, prestige, loyalty and support pressure. Not a random event. |
| Civil conflict | **[B]** Internal political conflict that emerges from interacting systems through validated decisions, never a standalone roll. |
| Institution | **[B]** A settlement-based, culture/religion-scoped organization of teachers, students, prestige and traditions that can outlive its founder. |
| Education / knowledge transmission | **[B]** Culture-appropriate transmission of skills, traits and knowledge through people and institutions. |
| Government type | **[B]** A data definition: a culturally scoped set of roles, offices, permissions and expectations. Not mutable state. |
| Government (in force) | **[A]** A faction's **mutable** government state: the type currently in force plus its institutional configuration. Changes through simulation. |
| Political transformation | **[A]** A validated attempt to change a faction's government. Power makes it possible; institutions and other actors decide whether it succeeds. |
| Regime recognition | **[A]** A foreign polity's decision to recognise or refuse a transformed government, made from belief rather than truth. |
| Institutional durability | **[A]** Whether a political order survives the death of the person who created it. Tested by succession. |
| Playable package | **[A]** Handcrafted content enabling a faction to be played. A content scope only: every faction in the world is simulated regardless. |

## Geography, settlements and economy

| Term | Definition |
| --- | --- |
| Location | A place in the world with terrain, adjacency and strategic meaning. |
| Settlement | **[B]** A place where population, production, institutions, military presence, politics and culture meet. |
| Population aggregate | **[B]** Aggregate demographics, labor, manpower and local pressure. Not individual people. |
| `PopulationCohort` | **[A]** A mobile aggregated population group with origin, size, culture, religion, social composition, displacement cause and collective history. The mover in migration and displacement. |
| Displacement | **[A]** The forced or voluntary movement of people out of a place, creating cohorts. |
| Manpower | **[B]** The military recruiting resource derived from population. |
| Unrest | **[B]** Local pressure on a settlement arising from economy, politics and security. |
| Supply | **[B]** The logistics state that conditions armies, movement and campaigning. |

## Military and tactics

| Term | Definition |
| --- | --- |
| Formation | **[A]** A persistent campaign military unit with stable domain identity and persistent campaign state: formation identity, faction/culture/home region, manpower, experience, morale, fatigue, equipment state, army and detachment membership, commander relationships, strategic position, history, loyalty and supply state (ADR-0001). Candidate military state additionally includes **cohesion** (ADR-0016), whose granularity and storage shape are **Unresolved**. Owns campaign truth, never tactical catalog keys (ADR-0001; blueprint §10). Blueprint §9 supplies the spatial conception: armies are spatial organisations, detachments move independently, and supply/fatigue/terrain/distance shape manoeuvre. |
| Army | **[B]** A spatial organisation of formations under a supreme commander, containing detachments. |
| Command hierarchy | **[A]** `Army → command hierarchy → command elements/detachments → commanders → formations`. Owned by the campaign. Issues **no** tactical orders. |
| Command element | **[A]** A subordinate part of an army with its own commander: supreme/main command, vanguard, main body, rearguard, supply train, independent detachment. A shared military primitive, not a Roman-only structure. |
| Command stability | **[A]** Whether a command structure holds together — distinct from a commander's personal prestige. |
| Cohesion | **[A]** A formation, command element or army's ability to remain organised and function as a military body. **Distinct from morale** (willingness to fight). Granularity unresolved. |
| Organisational outcome | **[A]** What happens to an army's structure after a battle: organised retreat, disorganised retreat, scattered formations, desertion, capture, surrender, regrouping, fragmentation, disintegration. Computed campaign-side. |
| Detachment | **[B]** A subordinate part of an army (vanguard, main body, rear guard, supply train) that can move, scout and fight independently. |
| Commander | **[B]** A character in command; commanders are characters, so battle outcomes feed prestige, injury, death and politics. |
| Encounter | **[B]** Contact between forces that may create a battle, derived from real campaign position and movement. |
| Background battle | **[A]** An **AI-versus-AI** engagement resolved by HistoricalGame's **own** internal campaign battle simulation from authoritative campaign military state. No external handoff occurs and the campaign clock is **not** frozen — the world continues under normal scheduling (ADR-0003 A11). Internal formulas **Unresolved** (N-34). |
| Interactive battle | **[A]** A battle the **player takes part in**, requiring the external tactical handoff: campaign clock **freezes** at the encounter SimTime, `BattleState` → `BattleAdapter` → Rome II / DeI → `BattleResult` → applied before incompatible remaining work at that instant → resume from the same SimTime (ADR-0003 A10). |
| Operational maneuver | **[A]** Movement and posture by **independent** command elements — detachments, main body, vanguard, rear guard, scouts, screening, flanking, reinforcement, interception, retreat, pursuit and supply protection — each acting on its **own commitment** with its own start SimTime, path and duration, constrained by geography, observation and information delay. The monthly presentation cadence must not create monthly teleportation; military truth is not a monthly snapshot (ADR-0003 A8). |
| BattleState | The engine-agnostic description of a battle handed to a `BattleAdapter`. Contains campaign truth, formation references and the command/control map; never DeI keys. |
| `BattleAdapter` | **[B]** The interface between simulation and tactical engine: prepare, launch, wait for result, cleanup. |
| `BattleResult` | **[B]** The coarse outcome of a battle, returned to the simulation, which applies all consequences and remains the owner of persistent world state. One campaign-side seam is shared by **both** the background and interactive paths; Rome II's representation is never canonical. Complete schema **Unresolved** (ADR-0003 A12, N-35). |
| Rome2DeIAdapter | **[B]** The BattleAdapter implementation for Total War: Rome II / Divide et Impera. Currently a shell. |
| DeI tactical vocabulary | **[B]** DeI's historically grounded factions, units, equipment and formations, used as the tactical representation. Adapter-side only. |
| Tactical catalog | Generated research data (units, factions, battlefields, environments) consumed by adapters. Never domain vocabulary. |
| Campaign geography | **[A]** Authoritative simulation geography: coordinates, regions, terrain, elevation, rivers, coasts, passes, roads, biome, season and weather context. Owned by the domain. |
| Tactical geographic projection | **[A]** Adapter-side translation from campaign geography into an engine battlefield representation. Never authoritative. |
| `TacticalLocationContext` | **[A]** The domain-owned geographic facts about a battle site, handed to the resolver. Contains no engine identifiers. |
| `BattlefieldResolver` | **[A]** Adapter-side component that selects the best available engine battlefield representation for a given campaign context. Algorithm unresolved. |
| Control mapping | **[A]** Campaign fact recording which participating forces are player-controlled and which are AI-controlled. Mapped onto engine control by the adapter. |

## Decision, action and AI

| Term | Definition |
| --- | --- |
| Legal action proposal | A typed, structured request to change the world, submitted by any actor. |
| Action validation | The single gate that decides whether a proposal is legal against authoritative state at a given SimTime. It judges; the owning system mutates. |
| Autonomous character / faction | **[B]** An actor with goals, constraints, knowledge and incentives that acts during the shared simulation window. |
| Jev | **[B]** A character and agent intelligence capability. **Implemented in and exposed through TheRev, not in this repository.** It reasons, interprets, converses and proposes intent. Never authoritative. |
| TheRev | **[B]** The separate platform/application through which the game is intended to launch. Contains the AI runtime/provider layer. Not part of this repository. |
| AI runtime / provider layer | **[A]** TheRev's layer that connects to local models, cloud AI APIs, locally hosted Jev models, and future frameworks. Provider selection, routing, credentials and model management belong here, not in the game. |
| Game-side intelligence seam | **[A]** The engine-agnostic interface through which HistoricalGame exchanges knowledge-filtered context for dialogue, reasoning or proposed intent. Conceptually analogous to a `CharacterIntelligencePort`; **the name and API are not approved.** |
| TheRev integration boundary | **[A]** The boundary between the game and the external intelligence implementation. Context leaves filtered; intent returns as a proposal. |
| AI SDK gateway | **[B]** Historical term for the AI boundary. See *TheRev integration boundary* and *game-side intelligence seam*. |
| Provider-agnostic | **[A]** The game does not know or care whether TheRev served a request with Jev, a local runtime or a cloud provider. |
| Proposal / intent provenance | **[A]** The actor, intent provenance and knowledge basis carried on a `LegalActionProposal`, enabling validation and explanation (ADR-0006). The blueprint requires only that the simulation validate proposed intents (§14, §14.1); it does not define recorded proposal provenance, and the action vocabulary remains an open blueprint question (§18 Q11). |

## Architecture and engineering

| Term | Definition |
| --- | --- |
| Domain | Engine-agnostic game logic and types. Forbidden from importing Rome II/DeI types, keys, XML, Lua, filesystem paths or catalog structures. |
| Adapter | An implementation that translates between the domain and an external system (tactical engine, catalog files, AI runtime). |
| Tactical boundary | **[B]** The one-way channel where the simulation hands over a prepared battle and receives a result. |
| Aggregate | A consistency boundary grouping entities that must change together. Boundaries are an open decision. |
| Derived projection | A rebuildable, cached view computed from authoritative state; never authoritative. |
| Scheduler / due work | **[A]** Simulation advances by jumping **directly to the earliest due SimTime** and processing the scheduled occurrence, rather than by a fixed-step loop or a daily/hourly/minute whole-world sweep. Presentation frame rate is never a simulation driver (ADR-0003 A4, ADR-0004). |
| No retroactive execution | **[A]** The authoritative simulation clock **never moves backward**, and the simulation **never executes retroactively**. New due work may not be scheduled for a SimTime earlier than the current authoritative SimTime; such a proposal is **rejected**, never silently clamped or adjusted into a different due time. Already-processed authoritative history is never retroactively mutated. **Past-tense reference to an earlier SimTime is legitimate and separate**: a historical fact or knowledge record may carry an earlier `occurredAt`, and information about an earlier event may arrive later. Reactions always begin at or after the SimTime at which they became possible, preserving world truth → information → knowledge and causal ordering (ADR-0003 A13, ADR-0004). |
| Explicit overdue semantics | **[U]** Deliberately **not** provided. The scheduler rejects past-due scheduling requests outright rather than silently clamping them to the current SimTime. If a future feature genuinely needs "execute immediately if overdue" behaviour, it must be modelled as an **intentional, explicit domain rule** in the owning epic — a named, reviewable decision — and not emerge implicitly from scheduler internals (ADR-0003 A13). |
| Mechanism versus tuning | **[A]** The time **mechanism** (SimTime, calendar mapping, due-work scheduler, ordering) is content-agnostic and must be able to *represent* a duration without knowing its value when the time primitive is created. **Historical tuning** — actual travel speeds, courier and messenger rates, report-transmission durations — is derived from domain inputs: geographic distance, route/path, terrain, movement method, army/detachment state, messenger method, weather and conditions. The authoritative campaign map/geography does not yet exist, so no concrete rate is locked, and none may be hard-coded into the time primitive (ADR-0003 A14). |
| Scheduled work trigger | **[A]** A scheduled occurrence carrying a **due SimTime** and a **read of authoritative state at execution time**. It is a trigger, **not** a precomputed outcome: no path may apply a result computed against state that later changed (ADR-0003 A9). |
| Commitment | **[A]** A temporal pledge an order creates: an entity is bound to an action starting at a specific SimTime and completing after a specific elapsed duration. An order that ignored elapsed time would not be a model of the world, and pause provides thinking time rather than an action-point exploit (ADR-0003 A7). |
| Presentation interpolation | **[B]** Visual smoothing between simulation states. **Non-authoritative**: rendering must never drive SimTime, scheduling, ordering or outcomes (ADR-0003 A8). |
| SimTime scale / resolution | **[U]** The **numeric fixed-point scale** of the SimTime scalar and the numeric value of the scenario's units-per-calendar-unit constant, plus which report rates run at which frequency. **SimTime's semantics are [A]; its numeric scale is [U]** (ADR-0003, N-29). |
| Spatial partitioning | A locality structure enabling nearby-only queries for movement, contact and observation. |
| Foreground / background tier | Fidelity tiers: player-relevant activity at full rate; distant activity at lower frequency, still causally coherent. |
| Fidelity ledger | A record of which abstraction each system uses at each tier and what coherence it guarantees. |
| Determinism | The property that the same seed and inputs produce the same simulation. |
| Seeded RNG stream | A reproducible, partitioned random source. |
| Vertical slice | A thin end-to-end proof that a set of systems works together. |
| Working set / live world | The portion of the world resident in memory, with snapshots and ledger providing durability. |
| Presentation | **[A]** Everything that renders state to the player. A consumer only: it reads authoritative state and explanation APIs and has no write path. |
| Visual Design Bible | **[A]** The future document defining shared UI grammar plus researched per-culture visual expression. Owned by the parallel design track. |
| Playable vs simulated | **[A]** Playable is a content designation for a limited faction set. Simulated covers every faction in the world. The two sets are not the same. |
| Single-player MVP | **[A]** Product scope: one local player, no networking, no multiplayer authority. Determinism is justified by engineering needs, not multiplayer. |
| AI authority | **[A]** The rule set that no AI provider, TheRev or Jev owns canonical state, receives unfiltered world state, or bypasses the legal-action gate. |
