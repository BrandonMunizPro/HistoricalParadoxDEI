# HistoricalGame Execution Roadmap & Vertical Slice Plan

**Status: Approved** — authoritative execution planning material for this repository.

- Presenting the roadmap for approval, then committing it and updating its status
  in a later stage. Approved in session 2026-10-05; persisted to the repository
  as a documentation contribution standing alongside
  [`vertical-slices-and-epics.md`](vertical-slices-and-epics.md), which remains
  the authority for epic and slice details.
- **VS-1 / E0 Foundations is shipped** in commit
  `1546779cd619053cf015707f500b8737921bcd94` ("Implement E0 Foundations: canonical
  identity and SimTime").
- **Immediate next executable slice: VS-2 / E1 Time & Clock.** Its predecessor
  gates, **N-29** (SimTime fixed-point scale + calendar conversion constant) and
  **N-30** (same-instant ordering-key shape), were **decided 2026-10-06**
  (ADR-0003 amendment B1/B2). They gated E1 only; they were never E0 blockers.
- The roadmap orders approved work. It does not override any ADR or the
  BLUEPRINT; where sequencing or slicing references an ADR, the ADR remains the
  design authority.

---

## A. Roadmap Principles and Dependency Rules

1. **Slices, not subsystems.** Each slice must make the simulation *demonstrably do something* and leave production infrastructure behind. No throwaway milestone demos.
2. **Every slice ends green and committable.** `npm run validate` passes, a headless scenario or test proves the slice's claim, and the work is committed. Rhythm for one engineer: a slice is typically a handful of commits, not a ticket swarm.
3. **Five work classes are tracked separately everywhere below:**
   - `[P]` Production implementation
   - `[D]` Architecture decision required *before* this stage
   - `[X]` Experimental tactical proof-of-concept
   - `[R]` Research / data acquisition
   - `[F]` Deliberately deferred
4. **Decision gates sit where the decision is needed, not at stage zero.** N-29 and N-30 gated E1 (they were *not* E0 blockers) and were decided 2026-10-06. Nothing else is pulled forward.
5. **Research is pull-based.** `[R]` work is only triggered when its gate approaches. A negative research answer is a valid outcome: document the limitation and proceed. Research is never a standing prerequisite for unrelated work.
6. **Approved architecture is a constraint, not a backlog.** No slice may introduce a SimTime scale into E0, clamp past-due work, encode ordering in SimTime, hard-code historical rates, put DeI vocabulary in `src/domain`, or conflate campaign geography / tactical field / unit position / adapter identifiers.
7. **Geography never becomes a universal prerequisite.** (Section E gates this explicitly.)
8. **Architecture reopening requires a concrete contradiction**, reported to you as a stop — not silent redesign.
9. **No timelines or estimates**, consistent with `vertical-slices-and-epics.md`: dependency-driven ordering only.

## B. High-Level Execution Map

```
CURRENT STATE: 1546779 — VS-1 / E0 Foundations SHIPPED; N-29, N-30 decided 2026-10-06.
                Next: VS-2 / E1 implementation (no remaining design gates).

Stage 1  [P] E0 Foundations                        VS-1  Identity + SimTime abstraction  [SHIPPED: 1546779]
              │
Stage 2  [P] E1 Time & clock (N-29, N-30 approved)      VS-2  Clock-driven world (scheduler, freeze, rejection)
              │
Stage 3  [D] AD-9 ──► [P] E2 Ledger + E17a thin persistence   VS-3  Ledger + snapshot
              │                      ║
              │                      ╚══ [X] T0 Tactical environment POC (parallel, independent)
              │
Stage 4  [P] E4 Characters ──┐    [P] E3 Minimum authoritative geography (graph, no coordinates)
              │              │                ║
              ├─ VS-4 Living Character          ╚══ [X] T1 First round-trip POC (needs G1 location)
              └─ VS-5 Minimum Geography (G1)
              │
Stage 5  [X] T2 Mixed-control POC ──┐
         [X] T3/T4 terrain & heading POC ──┤ (results gate Stage 5 acceptance)
              │                           │
         [P] E6 Armies/orders/movement + [P] E5 core information flow
              └─ VS-6 Army in a Real World (first game-like campaign slice)
              │
Stage 6  [P] S13 litmus core + S8 simultaneous world   VS-7, VS-8
              ║  ── STOP: review litmus evidence with you
Stage 7  [P] E7 Tactical round trip (AD-19, AD-20, N-35 gates)   VS-9  (+ full S13 re-run)
              │
Stage 8  [P] E8 Battle becomes history (N-33/34/35/36, AD-13/14)  VS-10
              │
Stage 9  [P] World systems: E9/E10/E11/E12/E13/E14/E15/E18   VS-11+ (outlined, not detailed)
              │
Stage 10 [P] E16 TheRev / E17b hardening / S9 performance / PT1 presentation  (integration & hardening)

PARALLEL TRACKS (never block the main chain):
  [X] Tactical POC:   T0 → T1 → T2 → T3/T4      (Section D)
  [R] Research:       pulled by gate proximity    (Section G)
  [F] PT1 presentation, renderer, Visual Design Bible — always parallel, never a dependency
```

**Dependency summary:** 1→2→3→4→5→6→7→8 are strictly ordered; T0 can start during Stage 3; T1 needs Stage 4's minimum geography; T2 needs T1; T3/T4 need T1; PT1 never gates anything (ADR-0019).

## C. Vertical Slices

#### VS-1 — Foundations: Identity + SimTime `E0` `[P]` — **SHIPPED** (commit `1546779cd619053cf015707f500b8737921bcd94`)
- **Possible after:** canonical UUIDv5 IDs exist and are deterministic for identical run inputs; `SimTime` exists with its invariants enforceable by tests; `ScenarioCalendar`, RNG, and same-instant ordering exist as *seams* only.
- **Systems:** world/entity identity, `SimTime` representation, purity boundary.
- **Depends on:** ADR-0009, ADR-0003 A1–A6/A14 — all Approved. No open `[D]`.
- **Acceptance:** branded UUIDv5 derivation deterministic across runs; `SimTime` difference is elapsed duration (property test: event-ordinal independence); no JS `Date`, no DeI vocabulary, no historical rate in `src/domain` (extended purity test); `npm run validate` green.
- **Excluded:** scale value, calendar conversion, scheduler, ordering key shape, ledger, geography.
- **Status:** all acceptance criteria satisfied and verified 2026-10-06 (`npm run validate` green); delivered across
  `src/domain/identity/`, `src/domain/time/`, `src/domain/random/`, and the extended purity test, with no dependencies added. N-28r's library question resolved in favour of a dependency-free pure-TypeScript SHA-1 inside the domain (`src/domain/identity/sha1.ts`), because the purity rule forbids `node:crypto` imports there; the remaining N-28r items (source-key naming / re-import reconciliation) stay `[F]`.

#### VS-2 — Clock-Driven World `E1` `[P]` — **NEXT**
- **Possible after:** a scripted headless scenario advances by command periods with `pause/resume/freeze-at-SimTime`, dates derive correctly from `ScenarioCalendar` (including era/BCE direction), and same-instant work resolves deterministically.
- **Systems:** simulation time, scheduler.
- **Depends on:** VS-1. **N-29** (fixed-point scale + conversion constant) and **N-30** (ordering-key shape) were **Approved 2026-10-06** (ADR-0003 amendment B1/B2): scale = 1 unit per simulation hour with `UnitsPerDay = 24` declared as `ScenarioCalendar` calibration; ordering = `dueSimTime → workClassRank → workIdentifier`. N-24 (frequencies/thresholds) enters as configurable placeholders, not decisions.
- **Acceptance:** scheduler advances *directly* between due SimTimes (no sweep — asserted); a past-due scheduling request is **rejected with an explicit error and never clamped** (test asserting rejection); shuffled insertion order of same-instant work yields byte-identical output order; two runs with fixed seed produce identical output; dates monotonic with SimTime; pause stores nothing that could rewind the clock.
- **Excluded:** armies, geography, ledger, any historical rate, UI.
- **Status:** N-29 / N-30 **decided 2026-10-06** (ADR-0003 amendment B1/B2). No design gates remain; VS-2 is the next executable slice.

#### VS-3 — Ledger + Snapshot `E2 + E17a` `[D] AD-9 → [P]`
- **Possible after:** events are append-only with causes/consequences, significance-gated queries answer "trace this civil-conflict onset back", and a snapshot can be saved, loaded, and resumed with a derived projection rebuilt.
- **Systems:** historical event/consequence ledger, save/load (thin), persistence ports.
- **Depends on:** VS-2 (ledger events carry SimTime); **gate: AD-9** — recommended resolution: repository ports + JSON snapshot + append-only JSONL ledger; ORM/DB explicitly `[F]` to E17b.
- **Acceptance:** causal trace query returns a provenance chain; append-only enforced by test; save → load → continue yields the same subsequent state as an uninterrupted run; derived view rebuilt from state, not trusted from disk.
- **Excluded:** crash recovery, retention/migration, "why" query API (E17b); in-flight battle save/load (**N-32** stays open, deliberately).

#### VS-4 — Living Character `S1: E4` `[P]`
- **Possible after:** a character has family, multi-facet relationships, mentors/students, a life history derived from ledger events, memories referencing them, and death triggers successor/claim reaction events.
- **Systems:** characters and houses, ledger, persistence round-trip.
- **Depends on:** VS-3; **AD-2 review trigger** — if concurrent actions on one character in one SimTime surface real conflicts, stop and decide AD-2; otherwise it stays deferred.
- **Acceptance:** existing S1 criteria; life history reconstructed from ledger alone; persistence round-trips a character without ledger replay.
- **Excluded:** offices/claims (E9), culture (E10), institutions (E13), population cohorts (E12).

#### VS-5 — Minimum Authoritative Geography `E3 (G1) [P]`
- **Possible after:** locations, adjacency, and terrain properties exist as authoritative pure-graph state; path cost is a pure function of graph + terrain; a spatial-index port exists behind an interface.
- **Systems:** geography (minimum), spatial index seam.
- **Depends on:** VS-1 only. **AD-19 (coordinate system) is deliberately NOT decided here** — opaque location identity + adjacency satisfies the approved "adjacency → real geography migration path".
- **Acceptance:** movement path cost deterministic and testable; locality queries avoid all-pairs scans; geography is domain state, not adapter data (purity test).
- **Excluded:** canonical coordinates `[D AD-19]`, real GIS data `[R-6/R-7]`, rendering, tactical continuity.

#### VS-6 — Army in a Real World `S2: E3 + E6 + E5-core` `[X] T2 gate → [P]`
- **Possible after:** *the first genuinely game-like campaign slice* — an army with detachments moves over command periods on terrain-affected routes, scouts/outposts create observations, reports travel with delay, an actor cannot act on facts it does not know, orders are scheduler commitments, and contact produces an encounter with reinforcement timing derived from position and route.
- **Systems:** armies and movement, orders and commitments, detection and scouting, knowledge/reports/information delay, geography, scheduler.
- **Depends on:** VS-5; **T2 results gate the command-hierarchy and player-vs-AI control mapping** (ADR-0015 requires this validation in a tactical POC before that mapping hardens). Cohesion enters with placeholder granularity (**AD-13** unresolved — acceptable, it is mechanics design).
- **Acceptance:** movement/contact/scouting driven by scheduler + spatial index, not all-vs-all; report arrival precedes reaction (knowledge gate holds); encounter object produced with reinforcement timing; R-12 rates present only as configurable placeholders.
- **Excluded:** prebattle maneuver detail, tactical launch, background battle formulas `[F: N-34]`, UI.

#### VS-7 — Operational Maneuver Litmus `S13 core (E1, E6)` `[P]`
- **Possible after:** the approved time and scheduling model is *proven*, not just asserted.
- **Systems:** time, scheduler, movement, knowledge, scouting.
- **Depends on:** VS-6. Staging note: **S13's criteria are unchanged**; the core litmus runs now with a **stubbed `BattleResult`** (rear guard, independent movement, observation, report travel, post-information reaction, no new work into the past, identical timings across fidelity tiers). **The full S13 is re-run after VS-9** with the real round trip, because S13 nominally participates E7.
- **Acceptance:** every S13 criterion passes, twice — core now, full after Stage 7.
- **Excluded:** real tactical engine.

#### VS-8 — Simultaneous Living World `S8 (E1, E5)` `[P]`
- **Possible after:** one command period interleaves movement → observation → report travel → AI reaction → changed orders → encounter by SimTime; events occur worldwide for AI factions the player never witnesses; player knowledge stays separate; a headless driver can pause for "management" and resume on the same calendar.
- **Systems:** all of VS-6 plus multi-faction AI activity.
- **Depends on:** VS-7 (it re-asserts A5, A13, A14 as running conditions).
- **Acceptance:** existing S8 criteria; elapsed durations computed as SimTime differences independent of unrelated background work; event occurring at T=500 with report at T=620 reacts at ≥620, never a rewind.
- **Excluded:** renderer, visual UI (a minimal headless director API is in scope; gameplay UI is `[F] PT1`).

#### VS-9 — Tactical Round Trip `S3: E7` `[X] T1/T3/T4 + [D] AD-19, AD-20, N-35 → [P]`
- **Possible after:** `BattleState` launches Rome II/DeI and returns a `BattleResult` applied campaign-side under the freeze semantics: freeze at encounter SimTime, hold in-flight work, apply `BattleResult` as first due work at that SimTime, resume from the same SimTime, zero campaign time consumed.
- **Systems:** tactical battle handoff, BattleResult application, geography continuity, command/control mapping.
- **Depends on:** VS-6; **evidence: T1 (round trip proves projection), T3 (geography-consistent selection), T4 (arrival heading)**; **decisions: AD-19** (coordinates — required here, if not earlier), **AD-20** (BattlefieldResolver algorithm, informed by T3), **N-35** (`BattleResult` schema — must be decided to apply results); **N-32** explicitly resolved or explicitly deferred as "save during battle unsupported, documented".
- **Acceptance:** existing S3 criteria — including failure paths returning structured errors with no partial world state; purity proving no DeI vocabulary in domain; result applied to the same location and participants; full S13 re-run passes.
- **Excluded:** background AI formulas, post-battle politics, save/load mid-battle beyond the N-32 decision.

#### VS-10 — Battle Becomes History `S4: E8` `[D] N-33, N-34, N-35, N-36, AD-13, AD-14 → [P]`
- **Possible after:** casualties/injury/death/prestige/loyalty recorded as events, rival response driven by knowledge not omniscience, organisational survival (retreat/scatter/fragment/surrender/disintegrate) resolved campaign-side, downstream consequences (veterans, deserters, stories) flow through existing systems, and **background AI-vs-AI battles resolve internally without freezing the world** on the second `BattleResult` path.
- **Systems:** BattleResult application (both paths), background AI battles, ledger consequences.
- **Depends on:** VS-9; **gates listed above are all genuinely required here** — N-34 for background formulas, N-33 for consequence landing time, N-36 for fragmentation identity.
- **Acceptance:** existing S4 criteria; both battle paths converge on one campaign-owned `BattleResult`; organisational survival never reduces to `start − casualties = remaining`.
- **Excluded:** civil conflict escalation, political transformation.

#### Later slices (outlined, deliberately not detailed now)
`S9` Bounded computation (after VS-8 + real workload; **AD-3** gate), `S5` Institutions, `S6` Different societies (**AD-11**, R-1, R-8), `S7` Character mind (**AD-24/AD-10** — deferred until integration begins), `S10` Displacement, `S11` Political transformation (**AD-8, AD-16, AD-17, R-10**), `S12` Cultures, plus E15 player continuity, E17b hardening, PT1 presentation.

### System placement summary

| System | Enters at | System | Enters at |
|---|---|---|---|
| World/entity identity | VS-1 (E0) | Orders and commitments | VS-6 |
| Simulation time & scheduler | VS-2 (E1) | Detection and scouting | VS-6 |
| Historical event/consequence ledger | VS-3 (E2) | Prebattle maneuver | Post-VS-6, pre-VS-9 (E6 late) |
| Characters and houses | VS-4 (E4) | Tactical battle handoff | VS-9 (E7) |
| Geography (minimum) | VS-5 (E3) | BattleResult application | VS-9/VS-10 |
| Armies and movement | VS-6 (E6) | Background AI battles | VS-10 (E8) |
| Knowledge/reports/delay | VS-6 core → VS-8 full (E5) | Save/load/persistence | VS-3 thin → E17b later |
| Factions and political state | Stage 9 (E9–E11, E14, E18) | | |

## D. Tactical POC Track

| POC | When | Must prove | Gates |
|---|---|---|---|
| **T0 — Environment & catalog inventory** | Parallel with Stage 3 | Adapter stack can load DeI catalogs; launch mechanism reachable; catalog caveats (R-11) assessed as blocker or not | Nothing production-critical; de-risks the entire tactical pillar early |
| **T1 — First round trip** | After VS-5 (needs a real location context; a *small known mapping set is explicitly sufficient* per S3) | **Projection, not launching** (ADR-0020 #10): `BattleState → engine → BattleResult` returns to the campaign location and participants, with structure that can be applied to state | E7 production work (VS-9); early warning before deep E6 investment |
| **T2 — Mixed player/AI allied control** | Parallel with Stage 4, before VS-6 acceptance | **R-2**: mixed control of allied armies in one battle; **R-3**: player's character holds full control under supreme command. A documented limitation is an acceptable outcome | The command/control mapping shape in E6/ADR-0015 (S2 requires control decided *before* battle) |
| **T3 — Geography-consistent battlefield selection** | Parallel with Stage 5, before AD-20 | **R-4**: terrain/season/weather-consistent battlefield selection | **AD-20** (BattlefieldResolver algorithm and participating dimensions); VS-9 projection |
| **T4 — Reinforcement direction/heading** | With T3 | **R-5**: arrival direction influenced by campaign geography | E7 reinforcement mapping; failure is acceptable → documented capability boundary |

**Rule:** every POC ends with a written result — claim, evidence, consequence — reviewed at a stop point (Section I). Launching a battle without establishing projection/control/selection evidence counts as **no result**.

## E. Geography Track

| Stage | Level | What it unlocks | What it needs |
|---|---|---|---|
| **G0** — Pre-geography | Stages 1–3 | Identity, time, ledger, characters, knowledge, orders — all may reference **opaque location IDs** with no geometry | Nothing |
| **G1** — Minimum authoritative geography | Stage 4 (VS-5) | Movement path cost, encounters, scouting, spatial queries | Location/adjacency/terrain graph as domain state; **no coordinate decision** |
| **G2** — Real geographic data | Stage 5–6 (pull when terrain fidelity matters) | Terrain-affected routes, credible geography-dependent durations | **[D] AD-19 canonical coordinate system**; **[R] R-6** (legally reusable GIS/elevation), **[R] R-7** (borders/settlements/roads) |
| **G3** — Tactical continuity | Stage 7 (VS-9) | Battlefield selection, arrival heading, projection both directions | **[D] AD-20**; T3/T4 evidence; four layers stay distinct: campaign geography → `TacticalLocationContext` → `BattlefieldResolver` → Rome II/DeI adapter identifiers |
| **G4** — Rendering, map UI, semantic zoom | Stage 10 / parallel PT1 | Visual campaign map | **[F] AD-18**, Visual Design Bible — never a prerequisite for G0–G3 |

**Separation rule (all stages):** campaign geography, tactical battlefield, unit position, and Rome II/DeI adapter identifiers are four different things with different lifetimes. No stage merges them.

## F. Architecture Decision Gates

| Gate | Type | Blocks | Why it sits there |
|---|---|---|---|
| ~~**N-29**~~ fixed-point scale + calendar conversion | `[D]` — **CLOSED 2026-10-06** | E1 (VS-2) | Nothing in E1 could be written without it; it was **not an E0 blocker**. Decided: 1 SimTime unit = 1 simulation hour, `UnitsPerDay = 24` declared as `ScenarioCalendar` calibration metadata (ADR-0003 amendment B1) |
| ~~**N-30**~~ same-instant ordering key | `[D]` — **CLOSED 2026-10-06** | E1 (VS-2) | Minimum properties Approved; shape was small and bounded. Decided: **`dueSimTime → workClassRank → workIdentifier`**, append-only ranks, `BattleResult` first, single pending set, no wave/generation (ADR-0003 amendment B2) |
| **AD-9** persistence technology | `[D]` | E17a (VS-3) | Recommend ports + JSON now, ORM `[F]` to E17b |
| **AD-2** aggregate boundaries / concurrent-action resolution | `[D]` | E4/E9/E14/E18 | Deliberately deferred; trigger = VS-4/VS-6 reveals real same-aggregate conflicts |
| **AD-19** canonical coordinate system | `[D]` | E3-deep / E7 (G2–G3) | Not needed for G1; required when real data or projection lands |
| **AD-20** BattlefieldResolver algorithm | `[D]` | E7 (VS-9) | Informed by T3 evidence — deciding it earlier would be uninformed |
| **N-35** `BattleResult` schema | `[D]` | E7 application (VS-9) | Boundary Approved; full schema needed to apply results |
| **N-32** save/load with battle in flight | `[D]` | E17a/E7 interface | Resolve as "supported", "explicitly unsupported", or "refuse to save" — never improvise |
| **N-33, N-34, N-36** | `[D]` | E8 (VS-10) | Consequence timing, background formulas, fragmentation identity |
| **AD-13 / AD-14** cohesion & org-outcome mechanics | `[D]` | E6 partial / E8 | Placeholder granularity acceptable in VS-6; formulas required in VS-10 |
| **AD-8, AD-11, AD-12, AD-16, AD-17** | `[D]` | Stage 9 epics | Legitimacy, content format, ownership overlap, transformation vocabulary |
| **AD-3** determinism depth | `[D]` | E16 / S9 benchmark | Deferred by design; seams approved in ADR-0008 |
| **AD-10, AD-24** TheRev SDK / seam name | `[D]` | E16 | Deferred until integration begins |
| **AD-18** renderer / Visual Design Bible | `[F]` | PT1 only | Never gates simulation |
| **N-24** frequencies/thresholds/budgets | `[F]` tuning | none | Configurable placeholders from VS-2 onward; measure before deciding |
| **R-12** historical rates | `[R]` content | none | Derived from domain inputs; placeholders until geography + research exist |
| **N-28r** `sourceKey` naming, UUID library, re-import reconciliation | `[F]` | none | Non-blocking; settle during first authored-source import. VS-1 resolved the UUID-library item in favour of dependency-free pure-TypeScript SHA-1 (`src/domain/identity/sha1.ts`); the remaining items stay open |
| **N-37** re-import ID reconciliation | `[F]` | start-world regeneration | Decision whenever re-import is first built |

## G. Research and Data Dependencies

| Research | Pulled when | Handling |
|---|---|---|
| **R-11** catalog caveats | T0 | Assess blocker-or-not; scope into T0 result |
| **R-2, R-3** allied control | T2 | POC evidence; documented limitation acceptable |
| **R-4, R-5** terrain/season selection, heading | T3/T4 | POC evidence; feeds AD-20 |
| **R-6** GIS/elevation legality | G2 entry | Time-boxed; a negative answer narrows fidelity, not scope |
| **R-7** historical borders/settlements/roads | G2 entry | Same rule |
| **R-1** DeI regional units adequacy | Before E10 start-world | Content research |
| **R-8** playable faction candidates | Before E10 scoping | Research + content scoping |
| **R-10** government transformations | Before E18 | Research |
| **R-9** visual-language grounding | PT1 (parallel, never blocking) | Art direction track |
| **R-12** historical rates | After G2, before performance tuning | Content; mechanism ships with placeholders |

**Anti-endless-rule:** each `[R]` item gets a stop point when reached; if research stalls, we document the assumption and move on rather than hold the schedule hostage.

## H. First Implementation Milestone — VS-1 / E0 Foundations `[P]`

**Recommendation: E0 Foundations is the first production milestone.** This
milestone is **completed** — delivered and verified in commit
`1546779cd619053cf015707f500b8737921bcd94` (committed 2026-10-06). The rationale
is preserved below as the record of why it was chosen first.

**Why it was correct:**
- It is the only epic with **no decision, research, or experimental gates** — N-29/N-30 are E1's, and nothing else applies.
- It is the *root of every downstream dependency* (identity feeds all entities; SimTime feeds ledger, scheduler, movement, knowledge).
- It is small enough to complete and commit quickly, giving the one-engineer rhythm a first real checkpoint after an architecture-only history.
- It makes the approved design *tangibly testable* — UUIDv5 determinism and SimTime invariants are exactly the invariants we risk losing to drift, and encoding them as tests now protects everything after.
- Starting anywhere else would force either an unpinned time representation or identity improvisation, both of which would be architecture violations.

**As delivered (VS-1, commit `1546779…`):**

| Action | Path |
|---|---|
| New | `src/domain/identity/` — branded UUIDv5 ID type + name-based derivation (RFC 4122 v5; the **N-28r** library question resolved as **dependency-free**: pure-TypeScript SHA-1 in `src/domain/identity/sha1.ts`, because the domain purity rule forbids `node:crypto` imports) |
| New | `src/domain/time/` — branded `SimTime`, `Difference → Duration` types, the `ScenarioCalendar` seam, and RNG / same-instant-ordering *seams* (interfaces only, no scale) |
| Extend | `tests/domain-purity.test.ts` — forbids `Date`, calendar/date vocabulary, historical-rate constants, and DeI terms in `src/domain` |
| New tests | `tests/canonical-id.test.ts` (determinism across runs, authored vs procedural derivation), `tests/sim-time.test.ts` (elapsed semantics, no event-ordinal interpretation, difference is duration) |
| Not touched | `src/tactical/`, `src/infrastructure/`, battle modules, `docs/` architecture, persistence |

**Completion means:** all E0 acceptance criteria green — IDs deterministic for identical run inputs; SimTime invariants enforced by tests; `ScenarioCalendar`/RNG/ordering seams present as interfaces; extended purity test passing; `npm run validate` green; committed as one or a few coherent commits. **Explicitly absent:** any scale, any conversion constant, any scheduler, any rate.

## I. Stop Points — where I return to you

1. ~~**Now — before Stage 2:** N-29 scale choice + N-30 ordering-key shape~~ — **decided 2026-10-06** (ADR-0003 amendment B1/B2); VS-2 implementation now proceeds. The next return point is item 2.
2. **Before Stage 3's persistence work:** AD-9 recommendation (ports + JSON vs. alternative) needs your approval.
3. **After each POC (T0, T1, T2, T3/T4):** experimental evidence review before the gated production work proceeds. T1 in particular: if projection cannot be proven, Stage 7 does not start.
4. **After VS-7 (S13 litmus):** review the litmus evidence before treating the time/scheduling model as proven; this is the architecture's own acceptance test for ADR-0003.
5. **Before Stage 7:** AD-19 (coordinate system) and AD-20 (BattlefieldResolver) decisions; N-35 schema; N-32 resolve-or-document.
6. **If AD-2 triggers** (real concurrent-action conflicts in VS-4/VS-6): stop and decide aggregate boundaries.
7. **Before Stage 8:** N-33/N-34/N-36 + AD-13/AD-14 mechanics decisions.
8. **If any stage exposes a concrete contradiction** with approved architecture or an implementation impossibility: stop, report, do not redesign silently.

### Contradiction check (required disclosure)
No contradiction found. Two tensions were examined and are *sequencing notes*, not defects:
- **S13 names E7**, but the litmus needs no tactical engine for its time/scheduling claims → staged as core-now/full-after-VS-9, with **unchanged criteria and both runs mandatory**.
- **E3's epic row mentions "coordinates"** while **AD-19 (canonical coordinate system) is deferred** → G1 satisfies E3 via location + adjacency + terrain properties with opaque IDs, which is precisely the approved migration path. AD-19 triggers at G2/G3, not before.

---