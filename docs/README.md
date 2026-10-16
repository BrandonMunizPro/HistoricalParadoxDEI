# Documentation index

Design documentation for the historical strategy game. This tree is
**design documentation only**: no gameplay system in it has been implemented, and
nothing here authorises building one.

## Design baseline

| Document | Purpose |
| --- | --- |
| [BLUEPRINT.md](BLUEPRINT.md) | **Game Systems Blueprint V1** — the original design source and design baseline from which all later architecture work was developed |

The blueprint records **original game design intent**: what owns truth, how the
major systems interact, what causes what, where cultural variation enters the
simulation, and which boundaries must stay stable under decomposition. It is
preserved as the historical provenance for every `blueprint §…` citation and
every **[B]** marker in this tree.

**Authority runs forward, not backward.** The blueprint does **not** override any
approved ADR. Where an approved ADR narrows, elaborates or supersedes blueprint
material, **the ADR is authoritative for the current architecture**, and the
blueprint remains the record of the original intent. An ADR never retroactively
rewrites what the blueprint said.

Hierarchy, highest to lowest:

1. **Approved ADRs** — authoritative wherever they narrow, elaborate or
   supersede earlier material.
2. **Architecture documents** (`architecture/`, `domain/`, `events/`,
   `presentation/`) — system decomposition consistent with approved ADRs. The
   approved execution roadmap governs sequencing, not architectural decisions.
3. **Blueprint** — original game design intent and historical provenance; it
   does not override approved ADRs.
4. **Open decision register**
   ([architecture/assumptions-and-open-decisions.md](architecture/assumptions-and-open-decisions.md))
   — deliberately unresolved decisions.

## Status legend

Every recommendation in these documents is marked with one of:

| Mark | Meaning |
| --- | --- |
| **Approved** | Approved design direction. Implementable as stated. |
| **Proposal** | Architectural proposal. Requires approval before implementation. |
| **Unresolved** | Gameplay mechanic or detail not decided. Must **not** be silently converted into an implementation decision. |
| **Research-dependent** | Needs research or design work outside code before it can be specified. |

**Approving a boundary does not approve the mechanics inside it.** Where a record
is marked Approved, anything listed under its own *Unresolved* section remains
open.

## Architecture

| Document | Purpose |
| --- | --- |
| [architecture/domain-model.md](architecture/domain-model.md) | Entities, relationships, aggregate boundaries, formation ↔ DeI resolution boundary, command hierarchy, cohorts, mutable government, campaign geography |
| [architecture/system-dependency-graph.md](architecture/system-dependency-graph.md) | Who owns what, who reads what, corrected interleaving model, three geographic layers, testable invariants |
| [architecture/simulation-scheduling-and-performance.md](architecture/simulation-scheduling-and-performance.md) | Alternatives, tradeoffs and proposal for bounded simulation work |
| [architecture/event-taxonomy.md](architecture/event-taxonomy.md) | One envelope, four classifications, significance path, worked causal chains |
| [architecture/legal-action-architecture.md](architecture/legal-action-architecture.md) | Proposal → validation → applied action, single gate for player/AI/Jev |
| [architecture/vertical-slices-and-epics.md](architecture/vertical-slices-and-epics.md) | Dependency-ordered epics and vertical slice acceptance criteria |
| [architecture/execution-roadmap.md](architecture/execution-roadmap.md) | Approved execution roadmap and vertical slice plan: stages, VS-1…VS-10, tactical POC and geography tracks, decision gates, research, stop points |
| [architecture/assumptions-and-open-decisions.md](architecture/assumptions-and-open-decisions.md) | Assumption register, unresolved decision register, research-dependent question register |
| [architecture/political-office-and-government-architecture.md](architecture/political-office-and-government-architecture.md) | **Proposal (2026-10-14)** — office/government decomposition: role definition vs. holding vs. derived authority, role kinds, per-polity expression (Rome/Carthage/Ptolemaic) |
| [architecture/economic-authority-architecture.md](architecture/economic-authority-architecture.md) | **Proposal (2026-10-14)** — ownership vs. control vs. flows, treasuries, financial transaction ledger, spending authority, audit/corruption as derived discrepancy (new epic E19) |
| [architecture/character-interaction-and-event-architecture.md](architecture/character-interaction-and-event-architecture.md) | **Proposal (2026-10-14)** — traits/psychology (AD-28), self vs. reputation vs. legitimacy, interaction via the legal-action gate, event eligibility/consequence evaluation, dialogue boundary (AD-29) |
| [architecture/geography-integration-requirements.md](architecture/geography-integration-requirements.md) | **Proposal (2026-10-14)** — simulation-side requirements and interfaces for the Codex/VS-5 geography track; identity vs. ownership separation |
| [architecture/military-architecture.md](architecture/military-architecture.md) | **Proposal (2026-10-14)** — consolidates the Approved military architecture (ADR-0001/0015/0016/0020) and proposes the continuous geographic zoom army-presentation model (strategic marker ↔ close-range formations); presentation derives from simulation and zoom never changes state |
| [architecture/intersettlement-infrastructure-and-information-transmission-architecture.md](architecture/intersettlement-infrastructure-and-information-transmission-architecture.md) | **Proposal (2026-10-14)** — authoritative infrastructure state (roads, bridges, passes, ferries, ports, river transport) and physical information transmission (observers, messengers, delivery, reliability, interception, delayed orders); one network serves military, economic, political and informational movement (AD-31, AD-32) |
| [architecture/settlement-visual-development-architecture.md](architecture/settlement-visual-development-architecture.md) | **Proposal (2026-10-14)** — authoritative settlement development → visual building/asset selection; the renderer displays simulation outcomes; stable identity, changing development, conquest, destruction, abandonment and cultural architectural inheritance (proposes AD-34; AD-33 and ADR-0019 stay OPEN) |
| [architecture/settlement-visual-development-codex-handoff.md](architecture/settlement-visual-development-codex-handoff.md) | **Proposal (2026-10-14)** — prioritized implementation handoff for the Codex presentation/geography track: harden the read-only seam, extend the component library, environment adaptation, cultural inheritance, lifecycle, scalability |

## Research plans

| Document | Purpose |
| --- | --- |
| [architecture/start-world-research-plan.md](architecture/start-world-research-plan.md) | **Proposal (2026-10-14)** — research plan for R-13 – R-16 (278 BCE start-world dataset, per-polity institutions, economy/treasury evidence, art consistency); priority order, outputs and uncertainty handling |
| [research/political-institution-research-template.md](research/political-institution-research-template.md) | **Proposal (2026-10-14)** — reusable R-16 political-institution research template (confidence labels, office tables, mapping to RoleDefinition/RoleHolding/Authority) |
| [research/r16-world-political-institutions-program.md](research/r16-world-political-institutions-program.md) | **Proposal (2026-10-14)** — R-16 world program (discovery→verification→taxonomy method, entity classes A–F, ten research areas, priority tiers) |
| [research/r16-candidate-entity-inventory.md](research/r16-candidate-entity-inventory.md) | **Proposal (2026-10-14)** — geo-grouped candidate entity inventory for 278 BCE (every map entity classified, anachronism register, open gaps) |
| [research/r16-regional-coverage-matrix.md](research/r16-regional-coverage-matrix.md) | **Proposal (2026-10-14)** — coverage matrix (entities × ten research areas) and ordered backlog |
| [research/r16-institutional-taxonomy.md](research/r16-institutional-taxonomy.md) | **Proposal (2026-10-14)** — proposed government families (F1–F7), role-kind usage, subordinate-community tiers (proposals to AD-25) |
| [research/r16-rome-278bce.md](research/r16-rome-278bce.md) | **Research sheet (2026-10-14)** — Roman institutions at 278 BCE |
| [research/r16-carthage-278bce.md](research/r16-carthage-278bce.md) | **Research sheet (2026-10-14)** — Carthaginian institutions at 278 BCE |
| [research/r16-ptolemaic-egypt-278bce.md](research/r16-ptolemaic-egypt-278bce.md) | **Research sheet (2026-10-14)** — Ptolemaic institutions at 278 BCE |
| [research/r16-seleucid-278bce.md](research/r16-seleucid-278bce.md) | **Research sheet (2026-10-14)** — Seleucid institutions at 278 BCE (Antiochus I; personal monarchy) |
| [research/r16-macedon-278bce.md](research/r16-macedon-278bce.md) | **Research sheet (2026-10-14)** — Macedon at 278 BCE (kingship in contest; army assembly) |
| [research/r16-epirus-278bce.md](research/r16-epirus-278bce.md) | **Research sheet (2026-10-14)** — Epirus at 278 BCE (Epirote League + Aiakid kingship) |
| [research/r16-syracuse-278bce.md](research/r16-syracuse-278bce.md) | **Research sheet (2026-10-14)** — Syracuse at 278 BCE (civic *polis* + crisis command) |
| [research/r16-aetolian-league-278bce.md](research/r16-aetolian-league-278bce.md) | **Research sheet (2026-10-14)** — Aetolian League at 278 BCE (F3 federal league; no king) |
| [research/r16-maurya-278bce.md](research/r16-maurya-278bce.md) | **Research sheet (2026-10-14)** — Maurya at 278 BCE (F2 royal monarchy; Bindusara reign) |
| [research/r16-model-challenges-addendum-20261014.md](research/r16-model-challenges-addendum-20261014.md) | **Proposal (2026-10-14)** — cross-sheet model-challenges addendum (T1–T6); concludes the taxonomy is sufficient (no extension, no deeper revision) |
| [research/r16-comparative-strategy-game-coverage.md](research/r16-comparative-strategy-game-coverage.md) | **Proposal (2026-10-14)** — comparative coverage of Rome II, Divide et Impera and Medieval Kingdoms 1212 AD; verified baselines, five-part assessment, and whether HistoricalGame can exceed them (surfaces AD-33, R-19) |
| [research/r16-settlement-scale-and-regional-distribution.md](research/r16-settlement-scale-and-regional-distribution.md) | **Proposal (2026-10-14)** — settlement-scale policy for the 278 BCE world: selection criteria, role taxonomy, confidence discipline, ~700 managed-settlement regional distribution envelope, supporting-sites boundary and settlement lifecycle (AD-33 stays OPEN) |
| [research/r16-settlement-roster.md](research/r16-settlement-roster.md) | **Proposal (2026-10-14)** — R-21 evidence-backed settlement roster for 278 BCE covering **all 19 envelope regions**: **658 researched candidates in 9 batches**, reaching the ~693 mid-target with the 35 atlas candidates; proposed IDs, per-dimension confidence, citations, source-and-confidence audit, duplicate-guard vs the 23-site atlas, anachronism checks, full regional coverage tracker, integration-readiness and verification/integration plan (AD-33 stays OPEN) |
| [research/r16-settlement-roster.batch1.json](research/r16-settlement-roster.batch1.json) | **Research draft (2026-10-14)** — machine-readable records, 55 batch-1 candidates (central Mediterranean, region 1); evidence, citations, existence/identity/location/political confidence, chronology/anachronism warnings, readiness; non-canonical IDs, not authoritative, not a runtime schema |
| [research/r16-settlement-roster.batch2.json](research/r16-settlement-roster.batch2.json) | **Research draft (2026-10-14)** — 56 batch-2 candidates (Greece/Aegean/Crete regions 7; western Anatolia/Black Sea region 8); same fields |
| [research/r16-settlement-roster.batch3.json](research/r16-settlement-roster.batch3.json) | **Research draft (2026-10-14)** — 116 records completing regions 7–8 to target; same fields |
| [research/r16-settlement-roster.batch4.json](research/r16-settlement-roster.batch4.json) | **Research draft (2026-10-14)** — 62 records: Balkans & Thrace (region 6) + Cisalpine Gaul/north Italy (region 1); same fields |
| [research/r16-settlement-roster.batch5.json](research/r16-settlement-roster.batch5.json) | **Research draft (2026-10-14)** — 78 records: Iberia (region 2) + Transalpine Gaul (region 3); same fields |
| [research/r16-settlement-roster.batch6.json](research/r16-settlement-roster.batch6.json) | **Research draft (2026-10-14)** — 107 records: Levant & Syria (region 9), Mesopotamia & Babylonia (region 10), Iran (region 11); same fields |
| [research/r16-settlement-roster.batch7.json](research/r16-settlement-roster.batch7.json) | **Research draft (2026-10-14)** — 80 records: North Africa (region 14), Cyrenaica (region 15), Egypt (region 16); same fields |
| [research/r16-settlement-roster.batch8.json](research/r16-settlement-roster.batch8.json) | **Research draft (2026-10-14)** — 84 records: Central Asia (12), NW India/Maurya (13), Arabia (17), Kush/Nubia (18), Caucasus/Bosporan/Crimea (19); same fields |
| [research/r16-settlement-roster.batch9.json](research/r16-settlement-roster.batch9.json) | **Research draft (2026-10-14)** — 20 records: Britain & Ireland (region 4), Germania/Alps/inner Europe (region 5), with explicit honesty coverage notes; same fields |
| [research/r16-settlement-architecture-and-visual-identity.md](research/r16-settlement-architecture-and-visual-identity.md) | **Proposal (2026-10-14)** — settlement architecture and visual-identity matrix for 278 BCE: morphology, building forms/materials, development-driven visual evolution, cultural continuity, chronology, evidence classes, procedural suitability, MK1212/DeI comparison (R-20) |
| [research/r16-rome-architecture-278bce.md](research/r16-rome-architecture-278bce.md) | **Research sheet (2026-10-14)** — Republican Rome architectural reference (278 BCE): city form, plausible structures, materials, development ladders and anachronism guards (not imperial Rome) |
| [research/r16-greek-italic-punic-architecture-278bce.md](research/r16-greek-italic-punic-architecture-278bce.md) | **Research sheet (2026-10-14)** — comparative reference sheets for Greek/poleis (incl. Neapolis), Samnite/Italic hill towns, Carthaginian/Punic, Hellenistic royal (incl. Alexandria) and additional traditions, with evidence classes |
| [research/settlement-architecture-evidence-and-anachronism-register.md](research/settlement-architecture-evidence-and-anachronism-register.md) | **Proposal (2026-10-14)** — shared evidence-class ([D]/[R]/[S]/[X]) and chronology/anachronism register for settlement architecture (what must not appear at 278 BCE) |
| [research/settlement-procedural-component-catalog.md](research/settlement-procedural-component-catalog.md) | **Proposal (2026-10-14)** — modular procedural building-component catalog (culture × environment × development × condition) for reusable, development-driven settlement art |
| [research/r16-model-challenges.md](research/r16-model-challenges.md) | **Proposal (2026-10-14)** — consolidated R-16 model challenges (C1–C13, N1–N7, RV0–RV3) as proposals to AD-25 (no architecture change) |
| [research/r16-sheet-consistency-review.md](research/r16-sheet-consistency-review.md) | **Proposal (2026-10-14)** — seven-sheet consistency review against the taxonomy; architecture challenges (RV0–RV3) that should influence AD-25 |

## Domain reference

| Document | Purpose |
| --- | --- |
| [domain/glossary.md](domain/glossary.md) | Shared vocabulary for design and code |
| [domain/campaign-start-and-historical-timeline.md](domain/campaign-start-and-historical-timeline.md) | **Proposal (2026-10-14)** — proposed 278 BCE campaign start, verified starting facts with confidence, historical-character entrance policy, conditional lineage, alternate-history divergence |
| [events/event-catalogue-v0.md](events/event-catalogue-v0.md) | Event kind catalogue v0 with tier, emitter and persistence intent |

## Presentation (parallel track)

| Document | Purpose |
| --- | --- |
| [presentation/presentation-requirements.md](presentation/presentation-requirements.md) | Seed for the future Visual Design Bible; shared UI grammar, culturally specific expression. Does not block simulation architecture |
| [presentation/artwork-production-roadmap.md](presentation/artwork-production-roadmap.md) | **Proposal (2026-10-14)** — artwork production plan: prerequisite standard, style tokens, reference pipeline, portrait identity, emblems, events, settlements, asset metadata |

## Architecture decision records

| ADR | Title | Status |
| --- | --- | --- |
| [ADR-0001](adr/0001-campaign-military-representation-vs-dei-tactical.md) | Campaign military representation vs DeI tactical representation | **Approved** |
| [ADR-0002](adr/0002-authoritative-state-causal-ledger-snapshots.md) | Authoritative mutable state plus causal ledger and snapshots | **Approved** |
| [ADR-0003](adr/0003-strategic-command-periods-simtime-pause.md) | Strategic command periods, SimTime, simultaneous progression, pause | **Approved** (time model and battle authority **Approved** 2026-10-05; scale/ordering-key details **Approved** 2026-10-06 — N-29/N-30) |
| [ADR-0004](adr/0004-simulation-scheduling-and-bounded-computation.md) | Simulation scheduling and bounded computation | **Approved** (architecture; details unlocked; scheduler model resolved 2026-10-05) |
| [ADR-0005](adr/0005-event-taxonomy-and-historical-significance.md) | Event taxonomy and historical significance | **Approved** (architecture; formulas unlocked) |
| [ADR-0006](adr/0006-legal-action-and-proposal-validation.md) | Legal action and proposal validation architecture | **Approved** (architecture; vocabulary unlocked) |
| [ADR-0007](adr/0007-aggregate-boundaries-and-concurrent-action.md) | Aggregate boundaries and concurrent action resolution | Deferred (AD-2) |
| [ADR-0008](adr/0008-determinism-and-reproducibility.md) | Determinism and reproducibility | **Approved** (architecture; depth deferred as AD-3) |
| [ADR-0009](adr/0009-identity-model.md) | Canonical identity model | **Approved** (identity contract **Approved** 2026-10-05; representation **Approved** — RFC 4122 UUIDv5; field naming **Unresolved** (N-28r); UUID library resolved at VS-1 as dependency-free pure-TypeScript SHA-1) |
| [ADR-0010](adr/0010-persistence-and-repository-ports.md) | Persistence and repository ports | Approved (2026-10-07) |
| [ADR-0011](adr/0011-legitimacy-claims-and-internal-conflict.md) | Legitimacy, claims and internal conflict pressure | Architecture only, mechanics **Unresolved** |
| [ADR-0012](adr/0012-therev-ai-sdk-boundary.md) | TheRev / Jev AI boundary | **Boundary approved**; SDK/transport deferred |
| [ADR-0013](adr/0013-content-data-cultures-religions-governments.md) | Content data for cultures, religions and government types | **Research-dependent** |
| [ADR-0014](adr/0014-single-player-mvp-scope.md) | Single-player MVP scope | **Approved** |
| [ADR-0015](adr/0015-campaign-command-hierarchy-and-tactical-control.md) | Campaign command hierarchy and tactical control boundary | **Approved** (engine capabilities research-dependent) |
| [ADR-0016](adr/0016-military-cohesion-and-post-battle-survival.md) | Military cohesion and post-battle organisational survival | **Approved** (mechanics **Unresolved**) |
| [ADR-0017](adr/0017-population-cohorts-migration-and-displacement.md) | Population cohorts, migration and displacement | **Approved** (schema **Proposal/Unresolved**) |
| [ADR-0018](adr/0018-mutable-government-and-political-transformation.md) | Mutable government and political transformation | **Approved** (mechanics **Unresolved**) |
| [ADR-0019](adr/0019-presentation-boundary-and-visual-design-track.md) | Presentation boundary and visual design track | **Approved** (renderer **Unresolved**) |
| [ADR-0020](adr/0020-campaign-geography-and-tactical-battlefield-projection.md) | Campaign geography authority and tactical battlefield projection | **Approved** (resolver algorithm **Unresolved**) |

## Session handoff records (non-authoritative)

| Record | Purpose |
| --- | --- |
| [HANDOFF-2026-10-04.md](HANDOFF-2026-10-04.md) | Point-in-time session resume note: git state, verification results, and what was in progress on 2026-10-04 |
| [vs6/verification/pilot-verification.md](vs6/verification/pilot-verification.md) | **Evidence only, not approval (2026-10-15)** — independent identity/location/existence/chronology verification of the twelve VS6 pilot settlement candidates, with reviewed definition drafts and a coordination note for the promotion pipeline; machine-readable form in `vs6/verification/pilot-verification.json` |

A handoff record is **not** an architecture source. It carries no authority over
any ADR, no authority over any status mark, and no authority to authorise
implementation. Where a handoff disagrees with an ADR or with a document in
`architecture/`, `domain/`, `events/`, `presentation/` or `adr/`, **the ADR and
those documents win.** Handoff records are kept only so a later session can
reconstruct why a change was made; they are expected to become stale.

## Scope in one paragraph

The MVP is **single-player only** (ADR-0014). The campaign simulation owns
strategic truth *and* its own geography; Rome II / DeI temporarily owns only the
tactical battlefield, reached through an adapter that translates campaign context
into a battlefield representation (ADR-0001, ADR-0020). The campaign owns the
command hierarchy but issues no tactical orders during a battle (ADR-0015).
Cohesion, migration and government are authoritative campaign state, not
presentation concerns (ADR-0016, ADR-0017, ADR-0018). Playable is a content
designation; every faction in the world is simulated (ADR-0013, ADR-0014).
Presentation runs on a parallel track and must never block the simulation
architecture (ADR-0019). **Jev is implemented in and exposed through TheRev, not
in this repository.** The game owns canonical state, knowledge filtering and the
legal-action gate, and maintains only a game-side intelligence seam; TheRev owns
providers, model runtimes and routing (ADR-0012). Multiplayer is outside MVP
architecture (ADR-0014).

## Time, identity and battles in one paragraph

**Time** is a single shared **absolute, monotonic, fixed-point measure of elapsed
simulation time**. The difference between two SimTimes is the elapsed duration
between them; SimTime is never an event count, scheduler sequence or frame count.
The scheduler advances **directly to the next due SimTime** — no whole-world
sweep, no renderer-driven simulation. Deterministic ordering of work due at the
same SimTime is a **separate** mechanism. Calendar dates derive mechanically from
SimTime plus immutable **scenario calendar** data, so era and BCE display
direction never reverse the clock. Roughly half a year is the strategic command
horizon and the **month** is the normal player-facing cadence, while internal
precision stays much finer and rendering interpolation is never authoritative
(ADR-0003, ADR-0004). The clock **never moves backward**: no new due work may be
scheduled for a SimTime earlier than the current one, so the simulation never
executes retroactively. An earlier `occurredAt` on a historical fact, and
information that arrives later, are legitimate — references to the past, not
rewinds — so reactions always begin at or after the moment they became possible.
The time **mechanism** is content-agnostic: no historical travel or report rate is
embedded in it, because actual durations are derived from distance, route,
terrain, movement method, unit state, courier method and weather (ADR-0003 A13,
A14). **Identity** is canonical, globally unique in representation, immutable,
never reused and permanently referenceable: ending an entity's active existence
never erases or rewrites references to it. The representation is **RFC 4122
UUIDv5**, deterministic by construction, derived from a fixed application
namespace plus a stable name input; source identity stays separate and
separately representable, and engine/catalog keys stay adapter-side
(ADR-0009). **Battles** have two paths: an
**interactive** player battle **freezes** the campaign clock at the encounter
SimTime while the handoff happens, and a **background** AI-versus-AI battle is
resolved inside HistoricalGame **without freezing the world**. Both cross one
campaign-side outcome seam, and the campaign applies every consequence
(ADR-0003, ADR-0001).

## Standing constraints

1. The TypeScript simulation owns strategic truth.
2. Rome II / Divide et Impera temporarily owns tactical battle resolution only,
   and only for the interactive handoff.
3. Jev / TheRev may reason about character state but can never authoritatively
   mutate world state.
4. Domain code stays engine agnostic (no Rome II keys, XML, Lua, filesystem
   paths, catalog schema).
5. Background factions must remain genuinely simulated; optimisation may reduce
   fidelity, never causal coherence.
6. Playable scope is a content decision; simulation scope is the whole world.
7. Domain code contains no Rome II / DeI unit keys, catalog field names, map keys
   or battlefield identifiers.
8. The game never contacts an AI provider directly, never receives unfiltered
   world state, and never lets an AI-proposed action bypass validation.
9. Time is elapsed simulation time only. No event counter, scheduler sequence,
   fidelity density or presentation frame may stand in for a duration.
10. No system owns time; calendar dates derive from SimTime plus authoritative
    scenario calendar data, and the SimTime scalar always moves forward.
11. Scheduled work is a trigger that reads authoritative state when it executes,
    never a precomputed outcome.
12. Only the interactive tactical handoff freezes the clock. Background AI battles
    never do, and real-world battle duration consumes zero campaign SimTime.
13. A canonical identity is never erased, reused or reassigned. Ended entities stay
    permanently referenceable and historical references are never rewritten
    because their target ended. The representation is RFC 4122 UUIDv5.
14. The simulation never executes retroactively. The clock never moves backward,
    no new due work may target a SimTime earlier than the current one, and a
    reaction begins at or after the SimTime at which it became possible.
15. The time mechanism and historical tuning are separate. No historical travel,
    courier or report rate may be hard-coded into the time primitive.
