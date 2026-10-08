# ADR-0010: Persistence and repository ports

- Status: **Approved** (resolved 2026-10-07; ratified by the VS-3 / `E2 + E17a` implementation)
- Date: 2026-10-04
- Related: [ADR-0002](0002-authoritative-state-causal-ledger-snapshots.md), [ADR-0004](0004-simulation-scheduling-and-bounded-computation.md), [ADR-0008](0008-determinism-and-reproducibility.md), [ADR-0009](0009-identity-model.md), [ADR-0014](0014-single-player-mvp-scope.md)

## Context

The blueprint requires repository interfaces that separate simulation/domain
logic from ORM and database technology, a long-lived world with an event ledger,
character history and recovery, and permits the running world to live largely in
memory with snapshots, events and durable state persisted. The database
technology is explicitly not chosen.

## Decision (ratified 2026-10-07)

- **Domain ports stay pure and technology-free.** Persistence is defined by
  interfaces in `src/domain/persistence` that speak only domain types
  (`CanonicalId`, `SimTime`, `LedgerEvent`, `PersistedWorkEntry`, `WorldEntity`,
  `ScenarioDescriptor`). No storage vocabulary, filesystem paths, `Date`, ORM
  types or database values cross that boundary.
- **Implementation lives behind the ports.** `src/persistence` realises the
  ports with **SQLite** (better-sqlite3) driving **Drizzle ORM**: an embedded,
  transactional, single-file, single-process engine (amendment Delta 1), with
  Drizzle providing change-aware typed SQL and the migration runner.
- **Relational canonical world state.** The durable mirror stores one row per
  entity, the pending scheduler-work envelope, and the append-only ledger, all
  in explicitly defined tables with a schema version (`meta.schema_version`).
  VS-3 carries only the **smallest representative authoritative state** — an
  identity, a kind, one scalar and an ended flag — sufficient to prove
  change-aware persistence and deterministic continuation; real game schemas
  arrive in later epics.
- **The simulation remains authoritative in memory.** The database is a durable
  mirror, committed **change-aware**: one transaction per executed step records
  the step's world and ledger writes, the scheduler's accepted pending set, and
  the authoritative current `SimTime`. Never a whole-world rewrite on each
  mutation, never a snapshot journal replay on load.
- **Live `SimTime` may exceed the latest saved `SimTime`.** Nothing pretends
  the mirror and the bytes on disk must match at every instant; a save captures
  one coherent boundary.
- **Rome-II semantics.** A save is an **independent, immutable slot**. Loading
  and continuing always start a **fresh continuation** in a fresh
  `CampaignStore`; a load **never writes into a slot**.
- **Save protocol (verified-before-reported).** A snapshot is produced with the
  engine's own consistent copy command (`VACUUM INTO` a fresh staged file —
  never a raw file copy of a live WAL database), stamped with its save kind,
  then **fully verified** (`integrity_check`, `schema_version`, `save_kind`,
  `current_sim_time`) and **atomically renamed** into the slot. A failed save
  leaves any previous valid slot untouched; `manual` saves never overwrite,
  `autosave` may overwrite its own slot. Success is only ever reported after
  verification.
- **The scheduler is never serialized as closures.** Persistence records the
  scheduling envelope (due instant, class rank, work identifier) plus a
  `workKind` registration key and a JSON-safe payload through a domain
  `WorkKindRegistry`. A load reconstructs each entry and feeds it back through
  `scheduler.schedule()`, so every scheduler invariant re-validates — including
  the past-due rejection, which can never fire on a coherent save.
- **Ledger is append-only with no update or delete surface** (ADR-0002);
  consequences are appended later as separate `LedgerConsequenceLink`s, never
  written into an already-recorded event.
- **Schema changes are versioned and refused, not silently migrated.** An
  unsupported slot version, missing stamp, or integrity failure raises a
  distinct, typed error; reconstruction never repairs a corrupt checkpoint
  (ADR-0008).
- **`SimTime` persists as its canonical exact decimal string** (ADR-0003
  amendment B1 / N-29), never a float and never a wall-clock representation.

## Consequences and amendments

- Domain code depends on repository *interfaces*, never on an ORM.
- Rebuilding projections must be possible from state plus ledger, which
  constrains projection inputs.
- Recovery ("load last good snapshot and continue") is a first-class capability
  and is the VS-3 acceptance proof: **save → destroy → load → continue** must
  reproduce a byte-identical `ScenarioTrace` past the save point.
- **Amendment (Delta 1):** the MVP is single player
  ([ADR-0014](0014-single-player-mvp-scope.md)). Persistence is therefore a
  *single-process* concern: save/load, autosave, and recovery. No
  multiplayer authority, replication, locking-for-consensus or distributed
  coordination requirements are carried here. This removes a whole class of
  premature complexity (leader election, conflict resolution, network
  partitions, server authority) from the persistence design.
- **Amendment (Delta 2, ratified 2026-10-07):** the VS-3 persistence shape is
  now concrete: a schema-versioned SQLite database mirroring state, pending
  scheduler work and the ledger through pure domain ports; immutable
  verified save slots; save-kind stamped copies; scenario and calendar identity
  stored as domain data.

## Deferred to E17b (deliberately out of VS-3)

- Crash-to-last-good-save **auto-restore** UX and the recovery flow entry point.
- **Retention policy** and **migration-at-scale** (schema evolution tooling is
  in place; policy for old saves is not).
- The **why-query** API on the ledger.
- Save/load with a battle in flight (**N-32**; the freeze-at-`SimTime` save is
  safe because held entries have due == now and `schedule()` rejects only
  `< now`, but "supported" is **not** claimed and stays open).