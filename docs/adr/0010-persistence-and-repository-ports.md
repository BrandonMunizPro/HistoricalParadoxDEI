# ADR-0010: Persistence and repository ports

- Status: **Deferred**
- Date: 2026-10-04
- Related: [ADR-0002](0002-authoritative-state-causal-ledger-snapshots.md), [ADR-0004](0004-simulation-scheduling-and-bounded-computation.md)

## Context

The blueprint requires repository interfaces that separate simulation/domain
logic from ORM and database technology, a long-lived world with an event ledger,
character history and recovery, and permits the running world to live largely in
memory with snapshots, events and durable state persisted. The database
technology is explicitly not chosen.

## Status

**Deferred.** ORM and database choices are not made. The architectural shape is
nonetheless constrained by ADR-0002:

- authoritative mutable state (per ADR-0002) is what repositories expose;
- the causal ledger is append-only;
- snapshots are the durability unit for state;
- derived projections (knowledge, reputation, pressure) are rebuildable and
  must not be the source of truth.

## Consequences for later design

- Domain code depends on repository *interfaces*, never on an ORM.
- Rebuilding projections must be possible from state plus ledger, which
  constrains projection inputs.
- Recovery ("load last good snapshot and continue") is a first-class capability.
- **Amendment (Delta 1):** the MVP is single player
  ([ADR-0014](0014-single-player-mvp-scope.md)). Persistence is therefore a
  *single-process* concern: save/load, autosave, and recovery. No
  multiplayer authority, replication, locking-for-consensus or distributed
  coordination requirements are carried here. This removes a whole class of
  premature complexity (leader election, conflict resolution, network
  partitions, server authority) from the persistence design.

## Unresolved

- **Unresolved:** ORM/database choice and whether snapshots are full, delta or
  hybrid.
- **Unresolved:** snapshot cadence and retention.
- **Unresolved:** whether the ledger is stored relationally, as documents, or as
  an append-only log.
- **Unresolved:** migration policy as the schema evolves.
- **Unresolved:** whether save files embed a replay journal for reproducing a
  reported bug (bounded by single-player scope and disk budget, not by network
  determinism requirements).
