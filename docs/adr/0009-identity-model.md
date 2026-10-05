# ADR-0009: Identity model

- Status: **Deferred**
- Date: 2026-10-04

## Context

Thousands of characters, families, settlements, regions, formations and events
must be referenced stably across snapshots, across the causal ledger, across
save/load, and (per ADR-0001) independently of any tactical engine's
identifiers.

## Status

**Deferred.** The only firm requirement today is the *shape* of the need:

- stable identity that survives snapshots and reloads;
- identity usable as a ledger and relationship reference;
- identity distinct from display names;
- identity independent of external engine keys (ADR-0001).

## Options

| Option | Tradeoff |
| --- | --- |
| UUIDv4 / v7 | Opaque, simple, poor locality for debugging |
| Monotonic per-kind counters | Human-readable in logs, needs coordination on merge/import |
| Prefixed hybrid (kind + counter/random) | Balance of debuggability and safety |

## Unresolved

- **Unresolved:** concrete identifier scheme.
- **Unresolved:** identity of aggregates that span multiple records (an "army"
  versus its detachments; a "house" versus its members).
- **Unresolved:** behaviour when start-world data is regenerated or a scenario
  is re-imported.
