# Architecture

## Principle

**The campaign simulation owns strategic truth. Tactical engines temporarily own
battle resolution and return results to the campaign simulation.**

A tactical engine is a subordinate, short-lived authority. It is handed one
engagement, it resolves that engagement, it returns a coarse result, and control
returns to the simulation, which remains the only writer of campaign state. No
tactical engine ever becomes a second source of truth.

## Boundary

```
Game Simulation
      |
      v
BattleState
      |
      v
BattleAdapter
      |
      +--> Rome2DeIAdapter
      |
      +--> Future tactical implementation
```

- **Game simulation** (`src/simulation`) — authoritative campaign state. Not
  implemented yet; the design is still being written.
- **BattleState** (`src/domain/battles`) — the minimal, engine-agnostic
  description of an engagement the simulation decided to fight.
- **BattleAdapter** (`src/domain/battles`) — the only interface the domain knows
  about battle resolution: `prepareBattle`, `launchBattle`, `waitForResult`,
  `cleanup`.
- **Rome2DeIAdapter** (`src/tactical/adapters/rome2-dei`) — the Rome II /
  Divide et Impera implementation of that contract. Currently a shell: no game
  launching, scenario generation, Lua integration or result extraction.
- **Future tactical implementation** — other engines, added behind the same
  interface without any change to the domain.

## Dependency rules

1. `src/domain` depends on nothing engine-specific. It may not import Rome II
   types, DeI unit keys, XML or scenario structures, Lua concepts, filesystem
   paths, or catalogue implementation details. This is enforced by a test
   (`tests/domain-purity.test.ts`).
2. `src/simulation` may depend on `src/domain` only.
3. Engines are pluggable: `src/tactical/adapters/*` implements domain interfaces,
   never the reverse. The simulation selects an adapter; it does not know which
   engine it is talking to.
4. Tactical reference data (units, factions, battlefields) is reached through the
   narrow `TacticalCatalogReader` interface in `src/infrastructure`. The large
   generated catalogue structures stay in infrastructure and are never exposed
   to the domain.
5. Engines and catalogues are external, substitutable infrastructure. Nothing
   third-party (Rome II, DeI, RPFM) is vendored into this repository.

## Research

`research/rome2-dei/` holds the completed, read-only interoperability research:
extracted database tables, generated catalogues, and the tooling to reproduce
them. See [`research/rome2-dei/HANDOFF.md`](research/rome2-dei/HANDOFF.md).

The generated output is large and reproducible, so it stays local and is listed
in `.gitignore`. Only `HANDOFF.md`, the extraction/build scripts and the small
research metadata are tracked. The research describes what was found in a
foreign engine's data; it is documentation and tooling, not a dependency of the
game.

## Deliberately undecided

The battle model, participants, objectives, result detail, persistence, campaign
systems and the choice of further tactical engines are all deferred until the
game design is finalised. The current types are the smallest set that makes the
boundary compile and testable.
