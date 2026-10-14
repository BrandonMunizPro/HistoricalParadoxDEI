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
- **VS-2 / E1 Time & Clock is shipped.** Its predecessor gates, **N-29**
  (SimTime fixed-point scale + calendar conversion constant) and **N-30**
  (same-instant ordering-key shape), were **decided 2026-10-06** (ADR-0003
  amendment B1/B2).
- **VS-3 / E2 Ledger + E17a thin persistence shipped** in commit
  `3814d69` ("VS3: SQLite persistence, historical ledger, and deterministic
  checkpoints; note deterministic campaign outlier"). Its gate **AD-9** was
  **resolved 2026-10-07** (ADR-0010 Approved): pure domain persistence ports +
  SQLite/Drizzle implementation behind them, change-aware mirroring, and
  immutable verified save slots. The VS-3 implementation and acceptance are
  complete and green (`npm run validate`); the deterministic campaign **outlier**
  was noted in the VS-3 commit message (`3814d69`).
- **VS-4 / E4 Living Character is shipped** (S1 acceptance; `[D] AD-2`
  stays deferred unless real same-aggregate conflicts surface). Domain
  character aggregate, relationships, kinship/mentorship derivations, life
  history and memories, the death + `character.succession_reacted` reaction,
  and character persistence round-trip are implemented and green.
- The roadmap orders approved work. It does not override any ADR or the
  BLUEPRINT; where sequencing or slicing references an ADR, the ADR remains the
  design authority.

**VS5 implementation update, 2026-10-14:** G1 domain graph, terrain-aware route
costs and adjacency locality queries are implemented alongside a requested bounded
central Italy visual prototype. See [implementation and measured evidence](../vs5/central-italy-prototype.md).
This begins the requested PT1/G2 experiment earlier than the original sequencing;
imported WGS84 data and renderer units do not close AD-19 or AD-20. VS5 is not yet
marked shipped; historical reconstruction, campaign persistence integration and
production visual acceptance remain outstanding. Older "not started" references
below describe the preceding milestone checkpoint.

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
CURRENT STATE: VS-1 / E0 SHIPPED (1546779); VS-2 / E1 SHIPPED; AD-9 CLOSED 2026-10-07.
                VS-3 / E2+E17a SHIPPED (3814d69); VS-4 / E4 Living Character SHIPPED; VS-5 not started.

Stage 1  [P] E0 Foundations                        VS-1  Identity + SimTime abstraction  [SHIPPED: 1546779]
              │
Stage 2  [P] E1 Time & clock (N-29, N-30 approved)      VS-2  Clock-driven world (scheduler, freeze, rejection)  [SHIPPED]
              │
Stage 3  [P] E2 Ledger + E17a thin persistence (AD-9 CLOSED)   VS-3  [SHIPPED: 3814d69]
              │                      ║
              │                      ╚══ [X] T0 Tactical environment POC (parallel, independent)
              │
Stage 4  [P] E4 Characters ──┐    [P] E3 Minimum authoritative geography (graph, no coordinates)
              │              │                ║
              ├─ VS-4 Living Character [SHIPPED] ╚══ [X] T1 First round-trip POC (needs G1 location)
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

#### VS-2 — Clock-Driven World `E1` `[P]` — **SHIPPED**
- **Possible after:** a scripted headless scenario advances by command periods with `pause/resume/freeze-at-SimTime`, dates derive correctly from `ScenarioCalendar` (including era/BCE direction), and same-instant work resolves deterministically.
- **Systems:** simulation time, scheduler.
- **Depends on:** VS-1. **N-29** (fixed-point scale + conversion constant) and **N-30** (ordering-key shape) were **Approved 2026-10-06** (ADR-0003 amendment B1/B2): scale = 1 unit per simulation hour with `UnitsPerDay = 24` declared as `ScenarioCalendar` calibration; ordering = `dueSimTime → workClassRank → workIdentifier`. N-24 (frequencies/thresholds) enters as configurable placeholders, not decisions.
- **Acceptance:** scheduler advances *directly* between due SimTimes (no sweep — asserted); a past-due scheduling request is **rejected with an explicit error and never clamped** (test asserting rejection); shuffled insertion order of same-instant work yields byte-identical output order; two runs with fixed seed produce identical output; dates monotonic with SimTime; pause stores nothing that could rewind the clock.
- **Excluded:** armies, geography, ledger, any historical rate, UI.
- **Status:** all acceptance criteria satisfied and verified (`vs2-clock-driven-world.test.ts`); delivered across `src/domain/time/` (scheduler, clock, SimTime serializer), `src/simulation/headless-scenario-run.ts`, and `tests/vs2-clock-driven-world.test.ts`.

#### VS-3 — Ledger + Snapshot `E2 + E17a` `[P]` — **SHIPPED** (commit `3814d69`)
- **Possible after:** events are append-only with causes/consequences, significance-gated queries answer "trace this civil-conflict onset back", and a snapshot can be saved, loaded, and resumed with a derived projection rebuilt.
- **Systems:** historical event/consequence ledger, save/load (thin), persistence ports.
- **Depends on:** VS-2 (ledger events carry SimTime). **Gate:** AD-9 — **resolved 2026-10-07** (ADR-0010 **Approved**): pure domain persistence ports + SQLite (better-sqlite3) behind Drizzle ORM, change-aware per-step mirroring, immutable verified save slots (`VACUUM INTO` → stamp → verify → atomic rename). ORM/DB depth otherwise `[F]` to E17b.
- **Acceptance:** causal trace query returns a provenance chain; append-only enforced by test; save → load → continue yields the same subsequent state as an uninterrupted run (asserted as a **byte-identical `ScenarioTrace`** past the save point); derived view rebuilt from state, not trusted from disk.
- **Excluded:** crash recovery, retention/migration policy, "why" query API (E17b); in-flight battle save/load (**N-32** stays open, deliberately).
- **Status:** E2 content + E17a thin persistence delivered (`src/domain/ledger/`, `src/domain/persistence/` ports, `src/persistence/` SQLite implementation, `src/simulation/persistent-scenario-run.ts`, `tests/causal-trace.test.ts`, `tests/sqlite-persistence.test.ts`, `tests/vs3-persistence.test.ts`); `npm run validate` green; shipped at `3814d69` with the deterministic campaign outlier noted in the commit message.

#### VS-4 — Living Character `S1: E4` `[P]` — **SHIPPED** (milestone checkpoint 2026-10-12)
- **Possible after:** a character has family, multi-facet relationships, mentors/students, a life history derived from ledger events, memories referencing them, and death triggers a character-owned successor reaction event.
- **Systems:** characters and houses, ledger, persistence round-trip.
- **Depends on:** VS-3; **AD-2 review trigger** — if concurrent actions on one character in one SimTime surface real conflicts, stop and decide AD-2; otherwise it stays deferred.
- **Acceptance:** existing S1 criteria; life history reconstructed from ledger alone; persistence round-trips a character without ledger replay.
- **Excluded:** offices/claims (E9), culture (E10), institutions (E13), population cohorts (E12).
- **Status:** shipped at the VS-4 milestone checkpoint, 2026-10-12, following independent **APPROVED FOR COMMIT** from BigPickle. This checkpoint commit records the approved implementation. VS-5 has not begun.
- **Delivered:** immutable canonical character identity, birth/death state and permanent historical references; directed relationships with simultaneous facets; pure parents/children/siblings/spouses and mentors/students derivations; ledger-derived life history and event-reference memories. `CharacterRepository` on `CampaignStore`, SQLite schema version 2 (`0002_characters.sql`), character/relationship mirrors, verified snapshots, restore and deterministic continuation are implemented. Registered production character work uses stable character-derived identifiers and resolves authoritative state during execution. Death schedules its causally dependent same-instant reaction during execution; causality does not rely on identifier ordering.
- **Persistence safeguards:** recorded death cannot be reversed or given a conflicting timestamp; identical writes remain accepted. Captured write values are validated and persisted without rereading caller-controlled accessors, including ledger consequence endpoints. Parent ancestry must be acyclic at writes and checkpoint verification. Published checkpoints verify memory-event, relationship-character and designated-successor references. Failed steps roll back persisted changes and invalidate the in-memory continuation. Fresh databases apply migrations and receive schema stamp 2. Older/unsupported databases and saves are deliberately rejected without automatic migration or repair. Compatibility inspection uses an owned main-file/WAL copy before connecting to the source, preserving unsupported database/WAL/SHM bytes; unresolved rollback journals fail closed.
- **Verified:** `npm run validate` passes typecheck, lint, 19 test files / 325 tests, build and postbuild. Focused persistence regressions pass 4 files / 124 tests. Coverage includes changing-accessor attacks, irreversible death, direct/indirect ancestry cycles, malformed checkpoint references, unsupported committed-WAL preservation, supported version-2 WAL recovery, rollback/invalidation, and save/destroy/restore/continue compared with an uninterrupted oracle. Existing VS-3 scheduler, ledger and persistence guarantees remain covered.
- **Deferred:** E9 offices, legal/political claims (`claim.asserted`), inheritance rules and authoritative office/property transfers remain excluded. `character.succession_reacted` records a reaction and an existing authoritative successor designation when present; it never chooses an heir or invents a claim. Full house/dynasty aggregates, trait/psychology ranges, culture, institutions, population cohorts and broader education mechanics are outside this S1 slice. AD-2 remains deferred until real same-aggregate conflicts require a decision. See [event catalogue](../events/event-catalogue-v0.md).

##### Nonblocking VS-4 review notes

1. **Residual preflight TOCTOU under the single-writer model:** copying and rechecking source bytes does not provide an atomic filesystem snapshot or a lock spanning the later writable open. Another process could change/replace the database or WAL after the last check. The supported model remains one writer with no concurrent external mutation during opening; detected changes fail closed. Stronger multi-process coordination remains persistence hardening work.
2. **Interrupted database creation window:** fresh migrations and the application schema stamp are separate operations. Interruption after tables are created but before the stamp is written can leave an unidentifiable database that the next open refuses. VS-4 does not resume, delete or repair it. Atomic initialization/crash recovery belongs to E17b; preserve interrupted files for diagnosis and use a fresh path rather than treating them as a supported campaign.
3. **E9 claims and inheritance remain excluded:** the E4 same-instant death reaction is causally recorded character history. Political/legal claim validation, inheritance choices and authoritative transfers remain future E9 work. Generic S1 successor/claim wording does not imply those political systems ship with VS-4.


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
| ~~**AD-9**~~ persistence technology | `[D]` — **CLOSED 2026-10-07** | E17a (VS-3) | Decided in VS-3 (ADR-0010 **Approved**): pure domain persistence ports; SQLite (better-sqlite3) behind Drizzle ORM with change-aware per-step mirroring; immutable verified save slots. ORM/DB depth `[F]` to E17b |
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

1. ~~**Now — before Stage 2:** N-29 scale choice + N-30 ordering-key shape~~ — **decided 2026-10-06** (ADR-0003 amendment B1/B2).
2. ~~**Before Stage 3's persistence work:** AD-9 recommendation (ports + JSON vs. alternative) needs your approval~~ — **resolved 2026-10-07** (ADR-0010 **Approved**; decided as pure domain ports + SQLite/Drizzle + immutable verified slots). VS-3 implemented and green; result reported for commit approval.
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

## J. Expansion status board and future work (2026-10-14)

**Status: Proposal (2026-10-14).** Sections A–I above remain **Approved** and
unchanged. This section records the *current* state of the world, and proposes
(where new work should sit) without authorising implementation of anything
listed as "future". Nothing here overrides any ADR or the sections above.

### J.1 Status board

| Track | State |
| --- | --- |
| **VS-1 / E0** Foundations | **Shipped** (`1546779`) |
| **VS-2 / E1** Time & Clock | **Shipped** |
| **VS-3 / E2 + E17a** Ledger + persistence | **Shipped** (`3814d69`) |
| **VS-4 / E4** Living Character | **Shipped** (`3aec257`) |
| **VS-5 / E3 G1** Geography | **Functioning prototype delivered (Codex, uncommitted)** — central-Italy G1 graph + bounded presentation experiment (`docs/vs5/central-italy-prototype.md`); contract-conforming (see `geography-integration-requirements.md` §10); `npm run validate` green; AD-19/AD-20 remain open |
| VS-6…VS-8, T0–T4 POCs, Stage 7/8, VS-9/VS-10 | Not started |
| Political office / government layer (E9/E10/E18) | **Proposed decomposition** — see `political-office-and-government-architecture.md` |
| Economic authority / audit (new epic E19) | **Proposed** — see `economic-authority-architecture.md` |
| Character development expansion (S14) | **Proposed** — see `character-interaction-and-event-architecture.md` |
| Historical start-world (278 BCE, S15) | **Proposed** — see `domain/campaign-start-and-historical-timeline.md` |
| Artwork production (PT1) | **Proposed roadmap** — see `presentation/artwork-production-roadmap.md` |
| Geography integration contract (for Codex/VS-5) | **Proposed + coordination response** — see `geography-integration-requirements.md` (§10) |
| Military architecture + army presentation model | **Proposed** — see `military-architecture.md` (consolidates ADR-0001/0015/0016/0020; continuous geographic zoom replaces a separate army-management scene) |
| Start-world research plan (R-13 – R-16) | **Proposed** — see `start-world-research-plan.md`; priority R-16 → R-13 |

### J.2 Where the new work sits (dependency-driven, no timelines)

The expansion adds **one new epic** and **two proposed slices**, and slots into
the existing stage structure without restructuring it:

- **E19 Economic authority and financial audit** (new epic, **Proposal**). Depends
  on E12 (economy mechanisms), E9 (offices/spending authority), E13
  (institutions hold funds) and **AD-25/AD-26**. Sequenced in **Stage 9** alongside
  the other political epics; it must not block E0–E8 or the geography track.
- **S14 Consequential Interaction** (proposed slice, E4 + E9 + E14). The
  mechanism behind the "character interaction/events" expansion; gated on
  **AD-28** (traits) and **AD-29** (eligibility/consequence evaluation).
- **S15 Historical Start World (278 BCE)** (proposed slice, E4 + E10). The
  start-world generation for the proposed 278 BCE campaign; gated on **AD-27**
  (timeline content model) and **R-13** (start-world data).
- **Artwork production (PT1)** runs **in parallel, never blocking** (ADR-0019);
  its own gate is the Visual Design Bible (see the artwork roadmap §1).
- **Military architecture + army presentation model** ([`military-architecture.md`](military-architecture.md),
  **Proposal**) is a **presentation-track** concern. It sits with the geography
  track's **G4 — Rendering, map UI, semantic zoom** (Stage 10 / parallel PT1),
  gated by the Visual Design Bible (**AD-18**) and proposed as **AD-30**. It
  **never blocks** E0–E9 or the geography track, and it is **explicitly not part
  of VS-5**: the current VS-5 geography work owns G1 and a bounded presentation
  experiment, not the army presentation model.

**Rule (unchanged from §A).** New work is *dependency-ordered, not
time-estimated*. The rows above say *where*, not *when*.

### J.3 New register entries opened by the expansion

| ID | Item | Blocks |
| --- | --- | --- |
| **AD-25** | Office model shape (role definition / holding / derived authority; role-kind vocabulary; collegiality, veto, term expiry) | E9, E10, E18 |
| **AD-26** | Economic authority schema (accounts/assets/transactions; single vs multi-currency; audit-query vocabulary) | E19, E12 economy tuning |
| **AD-27** | Historical timeline content model (conditional historical entries; birth scheduling; death policy — recommendation (c) hybrid) | E4, E10, S15 |
| **AD-28** | Trait/psychology facet representation, ranges, transition function (consolidates the unnamed E4 "trait/psychology ranges" blocker) | E4 expansion, S14 |
| **AD-29** | Event eligibility/consequence evaluation shape; dialogue/interaction presentation boundary | S14, S7, E16 |
| **AD-30** | Army presentation model: continuous geographic zoom (strategic marker ↔ close-range formations), simulation-state → presentation-state mapping, fidelity/LOD | PT1 presentation (never blocks the simulation) |
| **R-13** | 278 BCE start-world dataset (families, magistrates, treaties, dynasties, holdings; the `needs-research` character class) | E4, E10, S15, AD-27 |
| **R-14** | Art-asset consistency and age-progression methodology; surviving-likeness evidence per historical figure | PT1 |
| **R-15** | Ancient economy/treasury evidence per polity at 278 BCE | E19 content, E12 values |
| **R-16** | Per-polity political institutions at 278 BCE, with anachronism checks (Roman magistracies, Carthaginian suffetes/gerousia, Ptolemaic court, Epirote league) | E9, E10, AD-25 |

**Update 2026-10-14:** **AD-25 – AD-29** had their architectural *direction*
approved, with refinements incorporated into their proposal documents; they
**remain OPEN** until ruled closed. Research is now planned in
[`start-world-research-plan.md`](start-world-research-plan.md), prioritising
**R-16** (political institutions) then **R-13** (start-world dataset).

### J.4 Dependencies, risks and open decisions (report to you)

**Dependencies**
- The **political office model (AD-25)** is the load-bearing decision: spending
  authority (economic), knowledge access (intelligence) and interaction
  capabilities all derive from it.
- The **start-world (S15)** depends on **geography (G1/VS-5)** for locations and
  on **AD-27** for how historical entries behave; it must not be built before
  both.
- **E19** depends on **E12** and **AD-25/AD-26**; sequencing it earlier would
  violate the "economy values are content, mechanisms are architecture"
  classification rule.

**Risks**
- **Anachronism.** The 278 BCE start invites later-Roman imports (denarius,
  codified cursus honorum, permanent provinces, medieval heraldry). Mitigated by
  explicit anachronism guards in the start-world and artwork documents; content
  must be checked against **R-16/R-15** before authoring.
- **Presentation leaking into the domain.** VS-5's in-progress tree adds a `three`
  (renderer) dependency and a `campaign-map-state.ts`. ADR-0019 records the
  renderer as **Unresolved**, and the presentation track must never become a
  second source of geographic truth or put renderer types into `src/domain/`.
  Recorded here so it is a decision, not a silent drift (see
  `geography-integration-requirements.md` §7).
- **Uncertain historical data.** Birth dates (Hannibal, Hamilcar), Gallic-war
  years (284/283) and Carthaginian institutions are uncertain. The timeline model
  treats uncertainty as **first-class** (ranges, `needs-research`, conditional
  entries) rather than inventing canon; the risk is being forced to a false
  precision, which R-13 must resist.
- **Scope creep into the political layer.** E9/E10/E18 have open mechanics; the
  proposed decomposition must not be mistaken for approved mechanics (AD-25/AD-26
  gate it).

**Open decisions to be resolved by you before implementation**
- **AD-25, AD-26, AD-27, AD-28, AD-29** (above) — none may be silently resolved
  during implementation.
- **Renderer choice** (ADR-0019) is still **Unresolved** and is now a live
  question given VS-5's `three` dependency.

### J.5 Contradiction check (this expansion)

No contradiction with Sections A–I or any ADR. One tension was examined and is a
**sequencing note**, not a defect: the expansion adds an epic and slices **after**
the current roadmap's Stage 6 boundary, which is consistent with §J.2's rule
that geography and the E0–E8 sequence are never blocked by later political or
content work. E19 is a new epic row, not a rewrite of an existing one.

---
