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
| SimTime | The simulation clock, strictly finer-grained than a command period. **[A]** Exists; exact intra-period resolution is **Unresolved** (ADR-0003). The blueprint does not define SimTime — it states only that the direction is turn based and the exact temporal scale is unresolved (§15). |
| Command period | **[A]** Approximate half-year player decision cadence; two per year (first half, second half). A configurable default, not a hardcoded rule (ADR-0003). The blueprint fixes **no** cadence: §1.2 lists exact turn duration as not locked and §15 states the exact temporal scale is unresolved. |
| World owns time | **[B]** No faction owns time; all actors progress on one shared simulation calendar within a period. |
| Pause | **[A]** Halting simulation progression, e.g. for a substantial management interface or an event requiring player input. A capability of the simulation clock, not scattered per-system flags (ADR-0003). Exact pause rules and which notifications auto-interrupt remain **Unresolved**. The blueprint contains no pause concept. |
| World truth vs knowledge | **[B]** What happened versus what an actor believes happened. Never conflated. |

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
| BattleState | The engine-agnostic description of a battle handed to a `BattleAdapter`. Contains campaign truth, formation references and the command/control map; never DeI keys. |
| `BattleAdapter` | **[B]** The interface between simulation and tactical engine: prepare, launch, wait for result, cleanup. |
| `BattleResult` | **[B]** The tactical engine's coarse outcome, returned to the simulation, which applies all consequences. |
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
| Scheduler / due work | The proposal that simulation advances by processing the next meaningful scheduled occurrence rather than a naive sweep. |
| SimTime resolution | How finely the world clock advances; unresolved. |
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
