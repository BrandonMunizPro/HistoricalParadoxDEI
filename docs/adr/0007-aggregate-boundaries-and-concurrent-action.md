# ADR-0007: Aggregate boundaries and concurrent action resolution

- Status: **Deferred** (no decision; interim guidance only)
- Date: 2026-10-04
- Related: [ADR-0002](0002-authoritative-state-causal-ledger-snapshots.md), [ADR-0008](0008-determinism-and-reproducibility.md)

## Context

Entities in this simulation are highly interconnected (characters, families,
factions, armies, settlements, institutions) and the world is simultaneous
within a command period. Someone has to decide where consistency boundaries sit
and what happens when two actors act on the same thing at the same simulated
time.

## Status

**Deferred.** Aggregate boundaries and concurrency policy are not decided. The
domain model document records a candidate partition for discussion only.

## Candidate partition (discussion only)

- **World / time** — clock, period boundaries, world registry.
- **Faction political** — government, offices, claims, legitimacy/pressure terms.
- **Character** — identity, traits, offices, claims, relationships, memories.
- **House / kinship** — family graph, marriages, lineage branches.
- **Army** — army, detachments, orders, supply, position.
- **Geography** — locations and adjacency (mostly read model).
- **Settlement** — civic state, population aggregate, production, garrisons.
- **Institution** — founder, leader, teachers, students, prestige.
- **Knowledge** — derived projections per actor/faction.
- **Ledger** — append-only historical record.

## Options for concurrent action

| Option | Tradeoff |
| --- | --- |
| Deterministic total ordering of actions | Simple, reproducible; may feel arbitrary when actors "collide" |
| Domain-specific conflict resolution (contested outcomes) | More expressive, more design work; risks hidden randomness |
| Optimistic concurrency with retries | Infrastructure-friendly; can produce nondeterminism |
| Locks / serialisation | Predictable; poor fit for a turnless interleaving model |

## Unresolved

- **Unresolved:** final aggregate boundaries and transaction scope.
- **Unresolved:** how simultaneous contested actions resolve (for example two
  characters claiming the same office in the same window).
- **Unresolved:** whether "contest" is a first-class domain outcome.
- **Unresolved:** isolation level required for correctness versus what
  scheduling can safely interleave.
