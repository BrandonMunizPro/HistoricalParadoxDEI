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
| A-41 | Canonical identity is globally unique, immutable, permanently referenceable, never reused, storage-independent, serialization-safe, save/load-stable, and carries no mutable or chronological meaning (**Approved**, ADR-0009) | Design direction | Ledger references dangle; save/load breaks identity; engine or storage leaks into domain identity |
| A-42 | Canonical identity is distinct from authored **source** identity; a stable source namespace/key may be an input to derivation but is not the runtime ID (**Approved**, ADR-0009) | Design direction | Content edits silently rewrite runtime identity and break every reference |
| A-43 | Identity and **extant state** are separate concepts: ending active existence never erases, recycles or invalidates canonical identity; IDs are never recycled and historical references are never rewritten (**Approved**, ADR-0009) | Design direction | Dead/disintegrated/disbanded entities become unresolvable; life histories, memories and chronicles break |
| A-44 | Canonical ID assignment is **deterministic** given scenario identity, stable source identifiers, version/configuration and seed; never wall-clock, ambient-random, database-generated or derived from mutable display data; persisted and never regenerated on load (**Approved**, ADR-0009/ADR-0008) | Design direction | Replay, benchmarking and bug reproduction break |
| A-45 | Canonical IDs are globally unique in **representation** but their historical meaning is **world/scenario-scoped** (**Approved**, ADR-0009) | Design direction | An ID is interpreted in a world that never created it |
| A-46 | SimTime is an **absolute, monotonic, fixed-point measure of elapsed simulation time**; it is not an event count, scheduler sequence, fidelity density, frame count or causal-operation count (**Approved**, ADR-0003 N-1) | Design direction | Duration depends on unrelated background event density; movement and report travel become inexpressible |
| A-47 | The historical calendar is **authoritative scenario data**; calendar dates derive mechanically from `SimTime + immutable ScenarioCalendar`; the scalar always increases forward, so BCE display direction never reverses SimTime; JS `Date` is not the canonical model and no Gregorian-only assumption is invented (**Approved**, ADR-0003) | Design direction | BCE breaks the clock; calendar becomes a presentation cache or a second source of truth |
| A-48 | Fine SimTime resolution does **not** imply fixed-step simulation: due work advances directly to the earliest due SimTime. No daily/hourly/minute whole-world sweep, no renderer-driven simulation (**Approved**, ADR-0003/ADR-0004) | Design direction | Unbounded O(entities × systems × ticks); presentation rate leaks into the domain |
| A-49 | SimTime and same-instant ordering are **separate**: SimTime answers *when*, a separate deterministic ordering mechanism answers *what resolves first*, and that mechanism is independent of fidelity tier, hash order, presentation and wall clock (**Approved**, ADR-0003) | Design direction | Ordering shifts with tiering; the same seed yields different history at different fidelities |
| A-50 | **Month is the normal player-facing progression cadence** within the ~six-month strategic command/planning horizon; internal precision does not imply presenting sub-month units (**Approved**, ADR-0003) | Narrowing of ADR-0003 decision 1 | Player rhythm is wrong, or internal resolution leaks into the UI |
| A-51 | Orders create **commitments**; pause is a clock capability giving thinking time and is **not** an action-point exploit that makes travel or communication instant (**Approved**, ADR-0003) | Design direction | Pausing to gain free temporal progress becomes dominant play |
| A-52 | The monthly UI cadence must **never** flatten operational movement into monthly teleportation; military truth is not a monthly snapshot and rendering interpolation is not authoritative state (**Approved**, ADR-0003) | Design direction | Detachments, scouts and rear guards effectively teleport each month |
| A-53 | Scheduled work is a **trigger with a due time** that reads authoritative state at execution, not a precomputed outcome (**Approved**, ADR-0003) | Design direction | Resumed work applies values computed against superseded state, producing impossible history |
| A-54 | An **interactive player tactical handoff freezes the shared campaign clock** at the encounter SimTime; held work is neither processed nor cancelled; `BattleResult` is applied while frozen, before incompatible remaining work; real-world battle duration consumes **zero** campaign SimTime (**Approved**, ADR-0003) | Design direction | Real-world battle length silently advances or corrupts campaign ordering; in-flight commitments lost or cancelled |
| A-55 | **Background AI-versus-AI battles are resolved by HistoricalGame internally and do not freeze the world clock**; the freeze belongs to an interactive external handoff, not to the existence of a battle (**Approved**, ADR-0003) | Design direction | With every faction simulated (A-31), freezing per battle makes the campaign stutter indefinitely |
| A-56 | Both battle resolution paths cross one **campaign-side `BattleResult` boundary**; HistoricalGame consumes a campaign-authoritative outcome and remains owner of persistent world state; schema and internal mechanics are not frozen and Rome II's representation is never canonical (**Approved**, ADR-0003/ADR-0001) | Design direction | Two divergent campaign consequence paths; Rome II becomes a second authoritative store |
| A-57 | The canonical ID **representation** is **RFC 4122 UUIDv5** (name-based, SHA-1, deterministic by construction), derived from a fixed application namespace and a stable name input. The player has **no product requirement** for human-readable IDs (**Approved**, ADR-0009 §5a) | Ruling 2026-10-05 | A representation is chosen that satisfies AD-6 only by convention, leaving determinism as an ongoing implementation obligation |
| A-58 | The authoritative simulation clock **never moves backward** and the simulation **never executes retroactively**. New due work may not be scheduled for a SimTime earlier than the current authoritative SimTime. Historical facts and knowledge may still refer to an earlier `occurredAt`, and information may arrive later (**Approved**, ADR-0003 A13; **closes N-31**) | Ruling 2026-10-05 | A late-arriving report pulls already-processed history out of order; an actor effectively acts on information it could not yet hold |
| A-59 | **Time mechanism and historical tuning are separate concerns.** The time model must be able to represent a duration without knowing its value when the time primitive is created. Concrete travel and report rates are deferred content derived from domain inputs, not part of the time representation (**Approved**, ADR-0003 A14) | Ruling 2026-10-05 | Historical rates get hard-coded into a primitive that must exist before the authoritative campaign geography does |

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
| ADR-0004 scheduling | **Approved as architectural direction** (due-work / event-driven scheduler). **Amended 2026-10-05:** the "event-driven vs fixed-step vs hybrid" question and the tick-resolution element are now **closed** by ADR-0003 (N-1) — due-work event-driven with absolute monotonic fixed-point timestamps and **no** fixed world sweep. Scheduler implementation, evaluation frequencies, thresholds, spatial index technology, batch sizes, budgets and tier promotion rules remain explicitly **not** locked |
| ADR-0005 event taxonomy | **Approved as architectural direction** (one envelope, four classifications). No significance formula or threshold approved |
| ADR-0006 legal actions | **Approved as architectural direction** (single gate; validator judges, owning system mutates). Action vocabulary, costs, cooldowns and political/diplomatic/criminal/coordination sets **not** locked |
| ADR-0008 determinism | **Approved as architectural direction** (injected time, seeded streams, stable ordering, explicit scheduling, reproducible scenario setup). Depth remains AD-3. No lockstep, net sync, rollback, distributed authority, desync recovery or multiplayer pause semantics. **Amended 2026-10-05:** deterministic canonical identity (ADR-0009) and fixed-point SimTime semantics (ADR-0003) |
| ADR-0014 single player | **Approved**: MVP is single-player only; multiplayer deferred until a functioning single-player game exists |
| ADR-0012 ownership | **Resolved**: Jev lives in TheRev; HistoricalGame owns canonical state, knowledge filtering and the legal-action gate, and maintains only a game-side intelligence seam. SDK/transport/IPC/schemas deferred |
| AD-2 / AD-3 | **Deliberately kept open.** Aggregate boundaries and determinism depth were explicitly *not* resolved by the 2026-10-04 approvals |

## 2.1 Resolved decisions from the 2026-10-05 pass (AD-6 and N-1)

| Prior | Resolution |
| --- | --- |
| **AD-6 identity scheme** | **Contract and representation resolved.** Canonical identity is globally unique, immutable, permanently referenceable, never reused, storage-independent, serialization-safe, save/load-stable, and carries no mutable or chronological meaning (ADR-0009). The representation is **RFC 4122 UUIDv5**, deterministic by construction (ADR-0009 §5a). Source identity stays distinct and separately representable; engine and catalog keys stay adapter-side. **Still open, non-blocking:** the `sourceKey` field name/shape, the UUID library, re-import reconciliation (**N-28r**) |
| **AD-6 — end-of-life referenceability** | **Resolved.** Identity and extant state are separate concepts. A dead character, disintegrated army or ended cohort keeps a permanently referenceable canonical ID; IDs are never recycled; historical references are never rewritten merely because the referenced entity ended (ADR-0009 §3) |
| **AD-6 — merge/split identity** | **Principle resolved, per-domain rules deferred.** Continuation preserves identity; a genuinely new historical entity gets a new ID; ended entities stay referenceable. **No universal merge/split rule** — fragmentation, split, merge, succession, reorganization and transformation are decided in the epic owning the mechanic (ADR-0009 §4; ADR-0016; ADR-0017) |
| **AD-6 — determinism guarantee** | **Resolved.** Same scenario identity, source datasets via stable source identifiers, version/configuration and seed ⇒ same canonical ID for the same authored or deterministically generated entity. No wall-clock, ambient randomness, database-generated identity or mutable display data; authored derivation keys off a stable source namespace/key, not mutable content; persisted, never regenerated on load (ADR-0009 §5; ADR-0008 A1) |
| **N-1 — intra-period SimTime resolution** | **Resolved.** SimTime is an **absolute, monotonic, fixed-point measure of elapsed simulation time**; the defining property is that the difference between two SimTimes is the elapsed duration between them (ADR-0003 A1–A2). The fixed-point **scale** and units-per-calendar-unit value were later closed by **N-29** (2026-10-06, §2.1c) |
| **N-1 — event-ordinal interpretation** | **Rejected and closed.** An intra-month ordinal / event counter is explicitly rejected: its unit is the event, so its magnitude depends on unrelated event density and fidelity tier and cannot express duration (ADR-0003 A1) |
| **N-1 — elapsed time vs same-instant ordering** | **Resolved.** SimTime answers *when*; a separate deterministic ordering mechanism answers *what resolves first*, and is independent of wall clock, hash order, presentation and **fidelity tier**. The final key shape was later closed by **N-30** (2026-10-06, §2.1c) |
| **N-1 — fixed-step vs due work** | **Resolved.** Due-work, event-driven. With work at T=100 and next work at T=527 the scheduler may advance directly; no daily/hourly/minute whole-world sweep and no renderer-driven simulation. Timestamp precision ≠ evaluation frequency (ADR-0003 A4; ADR-0004) |
| **N-1 — calendar, epoch and dating** | **Direction resolved; values deferred.** The calendar is authoritative scenario data; dates derive mechanically from `SimTime + immutable ScenarioCalendar` supporting epoch, BCE, year numbering direction, month sequence and month boundaries/lengths. The scalar always increases forward, so BCE display never reverses SimTime. JS `Date` is not canonical and no Gregorian-only assumption is invented. The scale and conversion-constant values were later closed by **N-29** (2026-10-06, §2.1c) |
| **N-1 — tactical in-flight world progression** | **Resolved for interactive tactical battles.** The clock freezes at the encounter SimTime; held work is neither processed nor cancelled; `BattleResult` is applied while frozen, before incompatible remaining work; remaining work executes against post-battle state; real-world battle duration consumes zero campaign SimTime (ADR-0003 A10). **Still open: save/load while a tactical battle is in flight** |
| **N-1 — do background AI battles freeze the world?** | **Resolved: no.** Background AI-versus-AI battles are resolved by HistoricalGame internally and do not freeze the clock. The freeze is tied to an interactive external tactical handoff. A future player spectate/enter feature may use the same contract but is not designed (ADR-0003 A11) |
| **N-1 — retroactive execution** | **Resolved: no retroactive execution.** The authoritative clock never moves backward; new due work may not be scheduled for a SimTime earlier than the current authoritative SimTime; processed history is never retroactively mutated. An earlier `occurredAt` on a historical fact or knowledge record, and later arrival of information, remain legitimate — those are references to the past, not retroactive execution. Reactions begin at or after the SimTime at which they became possible (**N-31 closed**, ADR-0003 A13, ADR-0004) |
| **N-1 — mechanism versus historical tuning** | **Resolved.** The time model represents durations without knowing their values when the primitive is created. Concrete travel and report rates are deferred content derived from distance, route, terrain, movement method, unit state, courier method, weather and other domain inputs. No historical rate may be hard-coded into the SimTime primitive (ADR-0003 A14) |
| **New: player-facing cadence** | **Resolved.** ~Six months remains the strategic command/planning horizon; **month is the normal player-facing progression cadence** within it; internal precision does not imply presenting sub-month units (ADR-0003 A6) |
| **New: shared battle outcome boundary** | **Direction resolved.** Background and interactive paths both cross one campaign-side `BattleResult` boundary; HistoricalGame stays owner of persistent world state; schema and internal mechanics not frozen; Rome II's representation never canonical (ADR-0003 A12; ADR-0001 decision 12) |
| **New: due-work contract** | **Resolved.** Scheduled work is a trigger with a due time that reads authoritative state at execution, not a precomputed outcome (ADR-0003 A9) |

## 2.1b Resolved decisions from the 2026-10-05 focused ruling

| Prior | Resolution |
| --- | --- |
| **N-28 canonical ID representation** | **Resolved as far as needed to unblock E0.** The representation is **RFC 4122 UUIDv5** — name-based, SHA-1, deterministic by construction, opaque, offline and stateless. Derived from a fixed application namespace UUID plus a stable name input. Chosen because the player has **no product requirement** for human-readable IDs, which removes the only real reason to prefer a debuggable format; UUIDv4 breaks determinism, UUIDv7/ULID leak wall-clock chronology that §1.13 forbids, per-kind counters need cross-merge coordination, and prefixed hybrids encode kind, which the "no domain semantics" rule rejects. Authored entities derive from the stable source namespace/key, which stays **separately representable** as source identity; procedural entities derive from the approved deterministic simulation guarantees. **Still open and non-blocking:** the `sourceKey` field name/shape, the library used to compute the value, re-import reconciliation, and per-domain creation semantics (ADR-0009 §5a) |
| **N-31 retroactive execution** | **Resolved: no retroactive execution.** The authoritative clock never moves backward; new due work may not be scheduled for a SimTime earlier than the current authoritative SimTime; processed history is never retroactively mutated. A historical fact or knowledge record may still carry an earlier `occurredAt`, and information may arrive later — that is a reference to the past, not retroactive execution. Reactions always begin at or after the SimTime at which they became possible, preserving world truth → information → knowledge and causal ordering (ADR-0003 A13; ADR-0004) |
| **N-1 fixed-point scale ownership** | **Split approved.** The foundations epic implements the SimTime abstraction and its approved invariants — absolute, monotonic, fixed-point, elapsed-time semantics, difference-is-duration, no event-ordinal semantics, no scheduler ordering in SimTime, no JavaScript `Date` as canonical historical time — and **hard-codes no historical movement or report rate**. The time-and-clock epic chooses the concrete fixed-point scale and `ScenarioCalendar` conversion (ADR-0003 A2/A3/A14) |
| **N-24 / R-12 classification** | **Reclassified from blockers to deferred tuning/content.** Neither is required to write the scheduler mechanism; see §3.1. Frequencies, thresholds, batch sizes and budgets are configurable and measurable later; historical travel and report rates are domain content derived from geography that does not yet exist (ADR-0003 A14) |

## 2.1c Resolved decisions from the 2026-10-06 ruling (N-29 and N-30)

| Prior | Resolution |
| --- | --- |
| **N-29 SimTime scale + calendar conversion** | **Resolved 2026-10-06** (ADR-0003 amendment B1). **1 SimTime unit = 1 simulation hour**; **`UnitsPerDay = 24`** declared as scenario/`ScenarioCalendar` calibration metadata; `ScenarioCalendar` authored naturally in epoch, era, year-numbering direction, month sequence and month lengths in days; scalar→calendar conversion uses **exact integer arithmetic**, month boundaries at day boundaries; SimTime carries **no calendar semantics**; hour resolution does **not** imply hourly ticks (still due-work/event-driven); canonical cross-language serialization = **exact decimal integer string** plus explicit scale and calendar metadata; floating point, Unix epoch, JS `Date`, `DateTime` and wall clock are **never authoritative SimTime** |
| **N-30 same-instant ordering key** | **Resolved 2026-10-06** (ADR-0003 amendment B2). Scheduler total order = lexicographic ascending **dueSimTime → workClassRank → workIdentifier**; work entries carry **schedule-time-fixed values**; `workClassRank` is a small **domain-owned, append-only, never-renumbered ordered enum**; `BattleResult`/encounter resolution occupies the **first precedence class**; `workIdentifier` is deterministic, stable, unique, immutable and never derived from insertion order, mutable content, randomness, wall clock, iteration order or a runtime counter; **single pending set** — work due at T competes immediately with the remaining T work; **no wave/generation/eligibility cohort/dynamic ordinal**; causality via **consequence-creation** (a pre-scheduled same-instant dependency is a modelling error); class rank is the **only static semantic precedence axis**; cap-and-defer unchanged; contract **language-neutral**, reproducible across save/load, replay, tooling and future process/engine boundaries |

## 2.2 Explicitly deferred by the 2026-10-04 approval pass

These were considered and intentionally left unresolved. They must not be treated
as decided:

| Item | Why it stays open |
| --- | --- |
| AD-2 aggregate boundaries / concurrent action resolution | Approving the surrounding architecture is not the same as deciding consistency boundaries |
| AD-3 exact determinism depth | ADR-0008 fixes the seams, not how strict determinism must be |
| AD-6 **identity encoding** | **Resolved 2026-10-05** as RFC 4122 UUIDv5 (ADR-0009 §5a). Residual non-blocking items are in **N-28r** |
| AD-9 persistence technology | Unaffected by these approvals |
| AD-10 TheRev SDK, transport, IPC, schemas, streaming and error protocols | Integration work has not begun; premature to lock |
| Name and shape of the game-side intelligence port | Deliberately unapproved; `CharacterIntelligencePort` is illustrative only |
| All gameplay mechanics, formulas and thresholds | Approving a boundary never approves the mechanics inside it |
| Internal campaign battle-resolution formulas | Background AI battles are now *authorised to exist* and resolve campaign-side (ADR-0003 A11); the mechanics remain undesigned |
| Per-domain merge/split identity semantics | The general principle is **Approved** (ADR-0009 §4); deciding fragmentation/split/merge per domain belongs to ADR-0016/0017 mechanics design |
| SimTime fixed-point scale and calendar conversion constant | **Resolved 2026-10-06 (N-29)** — 1 unit = 1 simulation hour, `UnitsPerDay = 24` as `ScenarioCalendar` calibration metadata (ADR-0003 amendment B1). Was owned by the **time-and-clock epic**; no longer deferred |
| Historical travel, courier and report rates | **Deferred content/research**, not a mechanism blocker. The authoritative campaign geography does not exist yet, so no value could responsibly be locked; the mechanism is designed to run without them (ADR-0003 A14, **R-12**) |
| Scheduler frequencies, thresholds, batch sizes, budgets, tier rules | **Tuning and measurement**, not a mechanism blocker. The scheduler writes against configurable placeholders (ADR-0003 A14, **N-24**) |

## 3. Unresolved decision register

| ID | Decision | Blocks | Artefact needed |
| --- | --- | --- | --- |
| AD-2 | Aggregate boundaries and concurrent-action resolution | E4, E9, E14, E18 | ADR-0007 decision — **deliberately deferred 2026-10-04** |
| AD-3 | Exact determinism depth (seams approved, depth not) | E16 / S9 benchmark | ADR-0008 decision — **deliberately deferred 2026-10-04**; not an E1 blocker (approved execution roadmap §F) |
| ~~AD-6~~ | ~~Identity scheme~~ — **CLOSED 2026-10-05** as both contract and representation (ADR-0009): **RFC 4122 UUIDv5**, deterministic by construction (§5a). Non-blocking residuals: `sourceKey` field naming, UUID library, re-import reconciliation, carried below as **N-28r** | ~~all~~ | ADR-0009 — **Approved** |
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
| ~~N-1~~ | ~~Intra-period SimTime resolution (event-driven vs fixed-step vs hybrid)~~ — **CLOSED 2026-10-05**: absolute monotonic fixed-point SimTime, due-work event-driven, no fixed world sweep (ADR-0003 A1–A6). Residual items carried below as **N-29**, **N-30**, **N-31** | ~~E1, E4~~ (plus **E0**, see §3.1) | ADR-0003 — **Approved** |
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
| N-24 | Scheduler implementation, evaluation frequencies, foreground/background thresholds, spatial index technology, batch sizes, performance budgets, tier promotion/demotion rules. **Reclassified 2026-10-05: tuning and measurement, NOT an E1 mechanism blocker** — the scheduler writes against configurable intervals and placeholders (ADR-0003 A14, ADR-0004) | E0 performance work, E6, E12 | Explicitly **not** locked by the ADR-0004 approval. Both former elements are now settled: the "tick resolution" element is **closed** (SimTime semantics are ADR-0003 A1–A2) and the frequencies element is **tuning**, not a gate on writing the mechanism |
| N-25 | Significance formula, threshold or policy | E2, E14, E18 | Explicitly **not** locked by the ADR-0005 approval |
| N-26 | Action vocabulary, costs, cooldowns, and the political/diplomatic/criminal/coordination/rebellion action sets | E9, E11, E14, E16, E18 | Explicitly **not** locked by the ADR-0006 approval |
| N-27 | TheRev SDK, transport, IPC mechanism, process boundary, request/response schema, streaming protocol, error protocol, capability negotiation | E16 | Deferred until integration work begins (ADR-0012) |
| ~~N-28~~ | ~~Concrete canonical ID **encoding** and the `sourceKey` property name/shape~~ — **CLOSED 2026-10-05 as far as required to unblock E0**: representation is **RFC 4122 UUIDv5**, derived from a fixed application namespace plus a stable name input (ADR-0009 §5a). Non-blocking residuals remain in the row below | ~~E0, E4, E6, E12~~ | ADR-0009 — **Approved** |
| N-28r | Non-blocking residuals from the N-28 ruling: the `sourceKey` field name/shape and number of provenance slots; whether a runtime UUID dependency is added or RFC 4122 v5 derivation is implemented directly; start-world regeneration / re-import reconciliation against existing canonical IDs | E4, E6, E12, E17a | Content-aggregate detail and tooling decisions; do not gate the foundations epic |
| ~~N-29~~ | ~~SimTime fixed-point **scale/precision**, and the numeric value of the **simulation-units-per-calendar-unit** constant (a `ScenarioCalendar` property, not a global)~~ — **CLOSED 2026-10-06**: 1 SimTime unit = 1 simulation hour; `UnitsPerDay = 24` declared as `ScenarioCalendar` calibration metadata; calendar authored in days/month lengths; exact integer conversion; month boundaries at day boundaries; serialization = exact decimal integer string + scale + calendar metadata (ADR-0003 amendment **B1**) | ~~E1~~ | ADR-0003 amendment 2026-10-06 — **Approved** |
| ~~N-30~~ | ~~Final shape of the **same-instant ordering key** for work due at one SimTime~~ — **CLOSED 2026-10-06**: total order **dueSimTime → workClassRank → workIdentifier**; append-only domain-owned rank enum, `BattleResult` first precedence class; single pending set; no wave/generation; causality via consequence-creation (ADR-0003 amendment **B2**) | ~~E1, E6~~ | ADR-0003 amendment 2026-10-06 — **Approved** |
| ~~N-31~~ | ~~Whether any decision may take retroactive effect / whether scheduling may target a SimTime earlier than the current one~~ — **CLOSED 2026-10-05: no retroactive execution.** The clock never moves backward, new due work may not be scheduled into the past, and processed history is never retroactively mutated. Past-tense reference to an earlier `occurredAt` and later information arrival remain legitimate (ADR-0003 A13, ADR-0004) | ~~E1~~ | ADR-0003 A13 — **Approved** |
| N-32 | Save/load and clock resume while an **interactive tactical battle is in flight** (relaunch, restore, or abort-and-refund), plus save/load while paused generally | E7, E17a | ADR-0003 A10 follow-up; the freeze makes this a stable persistable state |
| N-33 | Whether consequences of an instantaneous-in-campaign-time battle land at the **encounter SimTime** or at a post-resume time | E8 | Domain rule; affects "did the battle happen before the relief force finished moving" |
| N-34 | Internal **background battle-resolution formulas** for AI-versus-AI battles (composition, strength, quality, commanders, formation, morale, cohesion, fatigue, supply, terrain, positioning, reinforcement state, bounded deterministic/random factors) | E8 | ADR-0016 mechanics design + ADR-0003 A11; authority split **Approved**, mechanics not |
| N-35 | Complete **`BattleResult` schema** shared by both resolution paths | E7, E8 | ADR-0003 A12 follow-up; only the shared campaign-side boundary is **Approved** |
| N-36 | Per-domain rules for whether a specific fragmentation, split, merge, succession or reorganization is continuation, survival, termination or creation | E6, E8, E12 | ADR-0016/ADR-0017 mechanics design; general principle **Approved** (ADR-0009 §4) |
| N-37 | Whether start-world regeneration / scenario re-import should reconcile against existing canonical IDs, mint new ones for changed source entities, or require an explicit operator decision | E10, E17a | ADR-0009 follow-up; the identity contract applies either way |

## 3.1 Blocker reconciliation: E0 and E1 (2026-10-05, focused ruling)

**Inconsistency found and corrected.** `vertical-slices-and-epics.md` listed E0 as
delivering a `SimTime` value object with "Blocked on design: —", while the
register previously showed N-1 blocking only E1 and E4. Either E0's `SimTime`
was a placeholder, or the SimTime semantics blocked E0.

**Resolution.** The SimTime semantics and the canonical identity contract are
**Approved** (ADR-0003 A1–A6, ADR-0009), and the focused ruling then closed the
two remaining items: **N-28** (representation is now UUIDv5, ADR-0009 §5a) and
**N-31** (no retroactive execution, ADR-0003 A13).

- **E0 has no remaining design blockers.** Branded canonical IDs are specified
  (UUIDv5), and the `SimTime` abstraction with its invariants is fully specified.
- **E0/E1 split, approved.** E0 implements the SimTime abstraction and the
  invariants — absolute, monotonic, fixed-point, elapsed-time semantics,
  difference-is-duration, no event-ordinal semantics, no scheduler ordering in
  SimTime, no JavaScript `Date` as canonical historical time — and **hard-codes
  no historical movement or report rate**. E1 chooses the concrete fixed-point
  scale and the `ScenarioCalendar` conversion (ADR-0003 A2/A3/A14).
  Hard-coding a scale in E0 is an E0 slip, not a blocker.
- **E1 blockers: N-29 and N-30 only.** Both are genuinely required to *write*
  the mechanism, because the epic's deliverable is arithmetic plus a calendar
  mapping plus an ordering mechanism:
  - **N-29** — the epic cannot perform SimTime arithmetic or map a SimTime onto a
    calendar position without a concrete scale and a units-per-calendar-unit
    constant. There is no placeholder that is not simply the value.
  - **N-30** — resolving work due at one SimTime *is* part of the deliverable.
    Ordering cannot be left as an unspecified mechanism the epic is supposed to
    build. Its minimum properties are already approved, so this is a small,
    well-bounded choice.
  - **Both N-29 and N-30 were closed by the 2026-10-06 ruling** (ADR-0003
    amendment B1/B2). E1 no longer has any design blockers — see the table
    below.
- **Removed from E1: N-24 and R-12.** Both were classified as blockers only
  because the mechanism is what will eventually consume their values. Under
  ADR-0003 A14's mechanism-versus-content rule they are not:
  - **N-24** (evaluation frequencies, foreground/background thresholds, batch
    sizes, spatial index technology, performance budgets, tier promotion rules)
    is **tuning and measurement**. The scheduler writes against configurable
    intervals; placeholder values are legitimate and the mechanism is testable
    with them. No implementation dependency exists.
  - **R-12** (historical travel speeds, courier and messenger rates, report
    transmission durations) is **content research**, and the authoritative
    campaign map/geography does not yet exist, so no responsible value could be
    locked even if asked. Durations are derived from domain inputs — distance,
    route, terrain, movement method, unit state, courier method, weather — and the
    time model can represent the results without knowing them in advance.

| Epic | Design blockers after the focused ruling |
| --- | --- |
| **E0** | **None** |
| **E1** | **None** — N-29 (fixed-point scale + `ScenarioCalendar` conversion constant) and N-30 (same-instant ordering-key shape) were both **closed 2026-10-06** (ADR-0003 amendment B1/B2) |
| E6 | **N-36**, plus N-24 tuning as a *later* dependency, not a design gate |
| E7 | **N-32** (save/load mid-battle), **N-35** (`BattleResult` schema), plus existing research-dependent items |
| E8 | **N-33**, **N-34**, **N-35**, **N-36** |

> **Updated 2026-10-06:** the rows above reflect the closing of N-29 and N-30.
> E1 (VS-2, Clock-Driven World) is now the next executable slice in the roadmap.

**Classification rule going forward.** An item blocks an epic only if the epic
**cannot be written or tested without it**. Content tuning, balance values and
research findings are dependencies of *tuning*, not of the mechanism, and are
registered as such.

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
| R-12 | What historical travel speeds, courier and messenger rates, and report-transmission durations should ground movement and information-travel durations? | E1, E6, E12 | research |

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
- **2026-10-05 pass additionally did not, and must not, treat as authorised:**
  - the final same-instant ordering-key shape (**N-30**);
  - the `sourceKey` field naming, the UUID library choice, or re-import
    reconciliation (**N-28r**) — the representation itself *is* now authorised
    (RFC 4122 UUIDv5, ADR-0009 §5a);
  - internal background AI battle-resolution formulas (**N-34**);
  - tactical battle duration as campaign time (locked to **zero**, so no formula
    is needed; consequences deferred as **N-33**);
  - the complete `BattleResult` schema (**N-35**);
  - per-domain merge/split identity semantics (**N-36**);
  - the SimTime fixed-point scale and calendar conversion-constant **values**
    (**N-29**);
  - concrete historical travel, courier or report rates (**R-12**) — deferred
    content, deliberately not a mechanism blocker (ADR-0003 A14);
  - scheduler frequencies, thresholds and performance budgets as decided values
    (**N-24**) — tuning and measurement, not a mechanism blocker;
  - save/load behaviour with a tactical battle in flight (**N-32**);
  - Rome II mixed allied control or reinforcement-direction capability
    (research-dependent, R-2/R-3/R-5);
  - any execution roadmap or sprint tracker.

  — **Updated 2026-10-06:** the 2026-10-05 pass scope is unchanged, but **N-29**
  and **N-30** were subsequently closed by explicit ruling and **are now
  authorised** (ADR-0003 amendment B1/B2).
