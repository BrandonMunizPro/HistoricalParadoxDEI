# Assumptions and open decisions

- Status: **Register**. Nothing in here authorises implementation; unresolved
  mechanics must stay unresolved until designed.

## 1. Assumption register

| ID | Assumption | Basis | Risk if wrong |
| --- | --- | --- | --- |
| A-1 | Domain events are the only cross-system mutation channel | Blueprint §11 wording | Direct cross-writes return; "world manager" risk |
| A-2 | Deterministic, reproducible state transitions are desirable | Inference (tests, replay, debugging) | Over-engineering if not required |
| A-3 | `Settlement` (civic) is separate from `Location` (geographic) | Blueprint lists settlements under both systems | Coupling economy/politics to the map graph |
| A-4 | Multi-axis relationships stored as facets on one edge | Blueprint §4.1 mandates the axes (affection, trust, fear, respect, rivalry, obligation, remembered events) but is silent on storage shape; no ADR resolves it, so storage shape remains **Unresolved** | Affects storage and rival-evidence queries |
| A-5 | AI/Jev output stays outside the deterministic transition function | Blueprint §14 | Replay/determinism break |
| A-6 | Running world may live largely in memory with snapshots | Blueprint §16 | Memory ceiling for long campaigns |
| A-7 | Start world is data, never hardcoded to Rome/DeI | Blueprint §1.2 (start date open) | Roman defaults fork the engine |
| A-8 | Catalog-derived data enters only via adapters | Blueprint §10, §16 | Vocabulary leaks; purity guarantee lost |
| A-9 | Culture/religion behaviour is data + rules; bespoke only when justified | Blueprint §6 | Stereotype risk if coded per culture |
| A-10 | Decisions read belief, never truth | Blueprint §8 | Knowledge honesty guarantee lost |
| A-11 | Player continuity is a bloc that can hold offices/claims independently of a single character | Blueprint §2 | Succession design changes |
| A-12 | Multiplayer is out of V1 scope; ledger/turn model stays replay-friendly | Blueprint §1.2 | Expensive late retrofit |
| A-13 | Formation identity is domain-owned and never a DeI key (**Approved**, ADR-0001) | Design direction | Engine coupling returns |
| A-14 | Ledger holds significant history; routine mutations need not (**Approved**, ADR-0002) | Design direction | Ledger noise or lost causality |
| A-15 | Command period is a configurable cadence, not a hardcoded rule (**Approved**, ADR-0003) | Design direction | Cadence tuning becomes a rewrite |
| A-16 | Intra-period resolution can be scheduler/event-driven rather than a fixed daily sweep (**Approved direction**, ADR-0004; mechanism open) | ADR-0004 | Performance/architecture rework |
| A-17 | Pause is a clock capability, not per-system flags (**Approved** direction; mechanics open) | ADR-0003 | Pause inconsistency across systems |
| A-18 | Background tier fidelity reduction is acceptable when causally coherent (**constraint**) | Design direction | Either unbounded cost or fake background |
| A-19 | The whole running world is single-process TypeScript in V1 | Blueprint §16 hint | Concurrency/scale assumptions change |
| A-20 | One event envelope with four classifications suffices (**Approved**, ADR-0005; formulas open) | ADR-0005 | Separate buses re-emerge if insufficient |
| A-21 | One legal action gate for player/AI/Jev (**Approved**, ADR-0006; vocabulary open) | ADR-0006 | AI or UI bypass paths appear |
| A-22 | MVP is **single-player only**; no networking, replication or multiplayer authority (**Approved**, ADR-0014) | Design direction | Premature distributed-systems complexity, or a late retrofit |
| A-23 | Determinism is justified by single-player engineering needs — debugging, testing, benchmarks, save/load, bug reproduction, causal explanation, controlled replay (**Approved**, ADR-0014/0008) | Design direction | Over-engineering if the real requirement list is shorter |
| A-24 | The campaign owns the command hierarchy and issues **no** tactical orders during a battle (**Approved**, ADR-0015) | Design direction | A fictional tactical protocol is invented; the player is ordered by a fiction the engine does not implement |
| A-25 | Cohesion is first-class state distinct from morale, and organisational survival is derived campaign-side (**Approved concept**, ADR-0016) | Design direction | Battles reduce to casualty subtraction; post-battle history is unexplained |
| A-26 | Population is aggregated; movers are `PopulationCohort` objects carrying information and history (**Approved direction**, ADR-0017) | Design direction | Either one character per civilian (unscalable) or settlement numbers only (no migration) |
| A-27 | Displacement consequences flow causally through cohorts, knowledge and political action; never a direct faction relation modifier (**Approved**, ADR-0017) | Design direction | Conquest collapses into a magic number; "explain why" is lost |
| A-28 | Government is mutable state; `GovernmentType` is data and `Faction.government` is the in-force configuration (**Approved**, ADR-0018) | Design direction | Government becomes immutable config or a free respec menu |
| A-29 | Political transformation is a validated action that power enables but does not guarantee (**Approved**, ADR-0018) | Design direction | "Reach prestige X → become monarchy" replaces institutions and agency |
| A-30 | Foreign recognition is a belief-driven decision, not a rule or modifier (**Approved**, ADR-0018) | Design direction | Foreign reactions become arbitrary or omniscient |
| A-31 | Playable scope is a content decision; every faction in the world is simulated regardless (**Approved**, ADR-0013/0014) | Design direction | Unsimulated background factions; playable set mistaken for known cultures |
| A-32 | Presentation is a consumer with no write path, on a parallel track (**Approved**, ADR-0019) | Design direction | Presentation blocks architecture, or leaks into the domain |
| A-33 | The campaign world owns geography; the adapter owns translation; Rome II / DeI owns the battlefield representation (**Approved**, ADR-0020) | Design direction (geographic analogue of A-13) | Dual strategic truth; domain depends on engine map data |
| A-34 | Authoritative campaign facts, researched engine metadata and derived compatibility scores are three separate things | Design direction | Inferred geography is presented as historical fact |
| A-35 | Jev is implemented **in and through TheRev**, not in HistoricalGame; the game owns only a game-side intelligence seam (**Approved**, ADR-0012) | Ownership clarification 2026-10-04 | The game starts orchestrating providers, models or credentials |
| A-36 | TheRev owns the AI runtime/provider layer: local models, cloud APIs, locally hosted Jev, future frameworks, routing, credentials, capability negotiation (**Approved**, ADR-0012) | Ownership clarification 2026-10-04 | Provider coupling leaks into the domain and must be undone later |
| A-37 | The game is **provider-agnostic**: it does not care whether TheRev served a request with Jev, Ollama, OpenAI, Gemini, Claude or a future framework (**Approved**, ADR-0012) | Ownership clarification 2026-10-04 | Every provider change becomes a game change |
| A-38 | Only knowledge-filtered context crosses the boundary; providers are never handed omniscient state (**Approved**, ADR-0012) | Ownership clarification 2026-10-04 | Knowledge honesty guarantee lost; truth leaks to characters |
| A-39 | TheRev launcher/platform concerns (marketplace, monetization, distribution, mod distribution, creator payouts) are **out of scope** for this repository | Ownership clarification 2026-10-04 | Platform concerns leak into game architecture |
| A-40 | **Make sure the door exists; do not build the building on the other side of the door in this repository** | Design rule (ADR-0012) | Premature SDK/transport/IPC work that integration will invalidate |

## 2. Resolved decisions from this review

| Prior | Resolution |
| --- | --- |
| AD1 — unit vocabulary | **Resolved**: campaign formations are domain entities; DeI resolution is adapter-side (ADR-0001) |
| AD4 — ledger depth | **Resolved**: authoritative state + causal ledger + snapshots, not full event sourcing (ADR-0002) |
| AD5 — time model | **Resolved**: ~2 command periods/year, world-owned time, SimTime finer, pause, interleaving (ADR-0003) |
| AD7 — action vocabulary | **Boundary resolved**, vocabulary deferred (ADR-0006) |
| Phase pipeline | **Corrected**: conceptual dependency only, not sequential phases (ADR-0003) |
| Standalone civil war event | **Rejected**: emergent from causal pressure via legal actions (ADR-0011) |
| Delta 1 — multiplayer | **Resolved**: MVP is single-player only; networking and multiplayer architecture are explicitly out of scope (ADR-0014). Determinism retained for engineering reasons. |
| Delta 2 — tactical orders | **Resolved**: no invented tactical instruction protocol; command hierarchy is campaign-side authority only (ADR-0015) |
| Delta 3 — post-battle outcome | **Resolved in principle**: organisational survival is simulated, not subtracted. Formulas deferred (ADR-0016) |
| Delta 4 — migration | **Resolved in principle**: aggregated cohorts are the movers and carry information; schema deferred (ADR-0017) |
| Delta 5 — government change | **Resolved in principle**: mutable state, validated transformation, institutional and foreign agency. Mechanics deferred (ADR-0018) |
| Delta 6 — playable vs simulated | **Resolved**: distinct concepts; playable set is limited, candidate list research-dependent (ADR-0013/0014) |
| Delta 7 — visual design | **Resolved in principle**: shared grammar, culturally specific expression, parallel track, renderer open (ADR-0019) |
| Delta 8 — grand map | **Resolved in principle**: campaign owns location, adapter translates, engine represents. Resolver and representation deferred (ADR-0020) |
| ADR-0004 scheduling | **Approved as architectural direction** (Option D hybrid). Scheduler implementation, tick resolution, frequencies, thresholds, spatial index technology, batch sizes, budgets and tier promotion rules explicitly **not** locked |
| ADR-0005 event taxonomy | **Approved as architectural direction** (one envelope, four classifications). No significance formula or threshold approved |
| ADR-0006 legal actions | **Approved as architectural direction** (single gate; validator judges, owning system mutates). Action vocabulary, costs, cooldowns and political/diplomatic/criminal/coordination sets **not** locked |
| ADR-0008 determinism | **Approved as architectural direction** (injected time, seeded streams, stable ordering, explicit scheduling, reproducible scenario setup). Depth remains AD-3. No lockstep, net sync, rollback, distributed authority, desync recovery or multiplayer pause semantics |
| ADR-0014 single player | **Approved**: MVP is single-player only; multiplayer deferred until a functioning single-player game exists |
| ADR-0012 ownership | **Resolved**: Jev lives in TheRev; HistoricalGame owns canonical state, knowledge filtering and the legal-action gate, and maintains only a game-side intelligence seam. SDK/transport/IPC/schemas deferred |
| AD-2 / AD-3 | **Deliberately kept open.** Aggregate boundaries and determinism depth were explicitly *not* resolved by the 2026-10-04 approvals |

## 2.1 Explicitly deferred by the 2026-10-04 approval pass

These were considered and intentionally left unresolved. They must not be treated
as decided:

| Item | Why it stays open |
| --- | --- |
| AD-2 aggregate boundaries / concurrent action resolution | Approving the surrounding architecture is not the same as deciding consistency boundaries |
| AD-3 exact determinism depth | ADR-0008 fixes the seams, not how strict determinism must be |
| AD-6 identity scheme | Unaffected by these approvals |
| AD-9 persistence technology | Unaffected by these approvals |
| AD-10 TheRev SDK, transport, IPC, schemas, streaming and error protocols | Integration work has not begun; premature to lock |
| Name and shape of the game-side intelligence port | Deliberately unapproved; `CharacterIntelligencePort` is illustrative only |
| All gameplay mechanics, formulas and thresholds | Approving a boundary never approves the mechanics inside it |

## 3. Unresolved decision register

| ID | Decision | Blocks | Artefact needed |
| --- | --- | --- | --- |
| AD-2 | Aggregate boundaries and concurrent-action resolution | E4, E9, E14, E18 | ADR-0007 decision — **deliberately deferred 2026-10-04** |
| AD-3 | Exact determinism depth (seams approved, depth not) | E1, E16 | ADR-0008 decision — **deliberately deferred 2026-10-04** |
| AD-6 | Identity scheme | all | ADR-0009 decision |
| AD-8 | Legitimacy / claims / pressure representation | E9, E14, E18 | ADR-0011 decision |
| AD-9 | Persistence technology and snapshot policy | E17 | ADR-0010 decision |
| AD-10 | TheRev SDK surface, transport, IPC, request/response and error schemas | E16 | ADR-0012 decision — deferred until integration begins |
| AD-24 | Name and shape of the game-side intelligence seam | E16 | ADR-0012 follow-up |
| AD-11 | Content data format for cultures/religions/governments, including government transition graphs | E10, E13, E18 | ADR-0013 decision |
| AD-12 | Ownership overlap (unrest, supply, prestige definitions) | E6, E12, E14 | Ownership map |
| AD-13 | Cohesion granularity, storage shape, formulas, decay and recovery | E6, E8 | ADR-0016 mechanics design |
| AD-14 | Post-battle organisational outcome resolution, including whether the player may order a retreat | E8 | ADR-0016 mechanics design |
| AD-15 | `PopulationCohort` schema, movement resolution, merge/split, assimilation, promotion to `Character` | E12, E5 | ADR-0017 mechanics design |
| AD-16 | Political transformation vocabulary, eligibility data, hybrid arrangements, recognition rules | E18 | ADR-0018 mechanics design |
| AD-17 | Modelling of institutional durability versus personal durability at succession | E18 | ADR-0018/0011 design |
| AD-18 | Visual Design Bible ownership, scope and sequencing; renderer; art pipeline | PT1 | Presentation design track |
| AD-19 | Canonical campaign coordinate system, geometry representation, and the adjacency → real-geography migration path | E3, E7 | ADR-0020 design |
| AD-20 | `BattlefieldResolver` algorithm and which geographic dimensions participate in matching | E7 | ADR-0020 design |
| N-1 | Intra-period SimTime resolution (event-driven vs fixed-step vs hybrid) | E1, E4 | Time model ADR |
| N-2 | Formation → DeI mapping fidelity (experience/equipment influence) | E7 | Adapter mapping design (ADR-0001 unresolved) |
| N-3 | Significance policy details and contextual elevation | E2, E14, E18 | Event taxonomy ADR-0005 decision |
| N-4 | Spatial structure and locality query cost | E3, E6 | Scheduling ADR-0004 decision |
| N-5 | Which systems may use lower fidelity, and coherence guarantees | E4, E6, E12, E8 | Fidelity ledger per system |
| N-6 | Pause UX rules and which notifications auto-interrupt | E1, UI | Interaction design |
| N-7 | Ledger retention and volume policy | E2, E17 | Ledger policy |
| N-8 | Chronicle presentation and audience | E2 | Chronicle design |
| N-9 | Legal action vocabulary per system | E9, E14, E16, E18 | Action catalogue (ADR-0006) |
| N-10 | Authority/provenance for diplomatic commitments | E11 | Authority model |
| N-11 | Multi-actor coordinated actions and coalitions | E11, E14, E18 | Coordination design |
| N-12 | Illegal vs criminal actions | E9, E14 | Legality model |
| N-13 | Numeric performance budgets | E0 performance work | Measurement baselines first |
| N-14 | First executable Rome II/DeI round-trip battle, at a known campaign location | E7 | Scenario choice |
| N-15 | First campaign map region | E3, E6 | Region choice + map import |
| N-16 | V1 government types and factions for first slice | E9, E10 | Slice definition |
| N-17 | Information channels at launch; deception model; cohort testimony representation | E5 | Channel + distortion spec |
| N-18 | Generic vs bespoke institutions | E13 | Institution taxonomy |
| N-19 | Command/control mapping granularity (per army, per command element, per formation) and whether the player's character always commands a force in battles it joins | E6, E7 | ADR-0015 design |
| N-20 | Per-culture displacement response vocabulary and historical availability | E12 | ADR-0017 data design |
| N-21 | The actual V1 playable faction list and what a playable package must contain | E10 | ADR-0013/0014 decision |
| N-22 | Historical displacement magnitudes and settlement absorption capacity per region and period | E12 | Research |
| N-23 | Whether derived tactical compatibility scores are recorded anywhere at all | E7, E2 | ADR-0020 decision |
| N-24 | Scheduler implementation, tick resolution, evaluation frequencies, foreground/background thresholds, spatial index technology, batch sizes, performance budgets, tier promotion/demotion rules | E0, E1, E6, E12 | Explicitly **not** locked by the ADR-0004 approval |
| N-25 | Significance formula, threshold or policy | E2, E14, E18 | Explicitly **not** locked by the ADR-0005 approval |
| N-26 | Action vocabulary, costs, cooldowns, and the political/diplomatic/criminal/coordination/rebellion action sets | E9, E11, E14, E16, E18 | Explicitly **not** locked by the ADR-0006 approval |
| N-27 | TheRev SDK, transport, IPC mechanism, process boundary, request/response schema, streaming protocol, error protocol, capability negotiation | E16 | Deferred until integration work begins (ADR-0012) |

## 4. Research-dependent questions

| ID | Question | Blocks | Owner |
| --- | --- | --- | --- |
| R-1 | Are DeI's regional and period units historically adequate as the source for V1 start-world formations? | E10 | content research |
| R-2 | Does Rome II / DeI support mixed player/AI control of allied armies in one battle? | E6, E7 | tactical POC |
| R-3 | Can the player's character hold full control of all friendly armies when it holds supreme command? | E6, E7 | tactical POC |
| R-4 | Does Rome II / DeI permit terrain-, season- or weather-consistent battlefield selection? | E7 | tactical POC + catalog research |
| R-5 | Can reinforcement arrival direction and approach heading be influenced by campaign geography? | E7 | tactical POC |
| R-6 | Which modern GIS/elevation datasets are legally reusable, and at what fidelity? | E3 | research |
| R-7 | Which historical border, settlement, road and territory datasets exist for the chosen start period? | E3, E12 | research |
| R-8 | Which candidate playable factions are implementable at acceptable content cost? | E10 | research + content scoping |
| R-9 | What historical visual-language grounding exists per candidate playable culture? | PT1 | art-direction research |
| R-10 | What are plausible government transformations per polity and period? | E18 | research |
| R-11 | Are the handoff's catalog caveats (`attribute_group` 0/4313 resolved; disjoint campaign/battle ground-type namespaces) blockers for V1? | E3, E7 | research |

## 5. Explicit non-goals for this documentation pass

- No timelines, milestones or estimates.
- No implementation of any gameplay system.
- No tactical adapter work.
- No culture-specific mechanics from stereotypes.
- No numeric performance targets before measurement.
- No renderer choice, UI implementation, or Visual Design Bible content.
- No `BattlefieldResolver` API lock, no canonical coordinate system.
- No mass battlefield mapping.
- No new archaeology: existing research documentation and catalogue knowledge only.
- No AI provider registry, model manager, model installation, Ollama or cloud API integration, credential management, Jev hosting, provider routing, permissions, marketplace, subscriptions, distribution, creator payouts, mod distribution or launcher internals. These belong to TheRev (ADR-0012).
- No E0 start, and no `src/` or `tests/` modification.
