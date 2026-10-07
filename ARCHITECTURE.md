# Architecture

## Principle

**The campaign simulation owns strategic truth and its own geography. Tactical
engines temporarily own battle resolution and return results to the campaign
simulation.**

A tactical engine is a subordinate, short-lived authority. It is handed one
engagement, it resolves that engagement, it returns a coarse result, and control
returns to the simulation, which remains the only writer of campaign state. No
tactical engine ever becomes a second source of truth.

## Boundary

```
Game Simulation
      |
      v
BattleState (+ geographic context + command/control map)
      |
      v
BattleAdapter  ──▶ BattlefieldResolver (adapter-side translation)
      |
      +--> Rome2DeIAdapter
      |
      +--> Future tactical implementation
```

- **Game simulation** (`src/simulation`) — authoritative campaign state. Not
  implemented yet; the design is still being written.
- **BattleState** (`src/domain/battles`) — the minimal, engine-agnostic
  description of an engagement the simulation decided to fight: participants,
  locations, formation references, pre-battle state, and who commands and who is
  player-controlled. It carries **no** engine keys and issues **no** tactical
  orders.
- **BattleAdapter** (`src/domain/battles`) — the only interface the domain knows
  about battle resolution: `prepareBattle`, `launchBattle`, `waitForResult`,
  `cleanup`.
- **BattlefieldResolver** (adapter side) — translates authoritative campaign
  geography into the best available engine battlefield representation. It is a
  translation step, not an authority: inferred geography is never treated as
  historical fact.
- **Rome2DeIAdapter** (`src/tactical/adapters/rome2-dei`) — the Rome II /
  Divide et Impera implementation of that contract. Currently a shell: no game
  launching, scenario generation, Lua integration or result extraction.
- **Future tactical implementation** — other engines, added behind the same
  interface without any change to the domain.

## Dependency rules

1. `src/domain` depends on nothing engine-specific. It may not import Rome II
   types, DeI unit keys, XML or scenario structures, Lua concepts, filesystem
   paths, catalogue implementation details, **map keys or battlefield
   identifiers**. This is enforced by a test
   (`tests/domain-purity.test.ts`).
2. `src/simulation` may depend on `src/domain` only.
3. Engines are pluggable: `src/tactical/adapters/*` implements domain interfaces,
   never the reverse. The simulation selects an adapter; it does not know which
   engine it is talking to.
4. Tactical adapters reach reference data (units, factions, battlefields,
   environments) through the narrow `TacticalCatalogReader` interface in
   `src/infrastructure`. Catalogue structures and identifiers stay within the
   adapter/infrastructure boundary; neither the domain nor the simulation
   consumes this interface or its tactical keys (ADR-0001).
5. Engines and catalogues are external, substitutable infrastructure. Nothing
   third-party (Rome II, DeI, RPFM) is vendored into this repository.
6. Presentation is a consumer with no write path into authoritative state, and it
   runs on a parallel design track so it cannot block simulation architecture.
7. **AI is external.** Jev is implemented in and exposed through **TheRev**, not
   in this repository. This game owns canonical state, knowledge filtering, and
   the legal-action gate, and maintains only a game-side intelligence seam whose
   name and API are not yet decided. Provider selection, routing, model
   management and credentials belong to TheRev (ADR-0012).

## Research

`research/rome2-dei/` holds the completed, read-only interoperability research:
extracted database tables, generated catalogues, and the tooling to reproduce
them. See [`research/rome2-dei/HANDOFF.md`](research/rome2-dei/HANDOFF.md).

The generated output is large and reproducible, so it stays local and is listed
in `.gitignore`. Only `HANDOFF.md`, the extraction/build scripts and the small
research metadata are tracked. The research describes what was found in a
foreign engine's data; it is documentation and tooling, not a dependency of the
game.

## Design documentation

The boundaries summarised above are specified in detail under
[`docs/`](docs/README.md), including the accepted decisions on campaign-vs-tactical
representation (ADR-0001), authoritative state with a causal ledger and snapshots
(ADR-0002), strategic command periods and simultaneous world time (ADR-0003),
single-player MVP scope (ADR-0014), the campaign command hierarchy with no
tactical orders (ADR-0015), cohesion and post-battle organisational survival
(ADR-0016), population cohorts and migration (ADR-0017), mutable government and
political transformation (ADR-0018), the presentation boundary (ADR-0019), and
campaign geography authority with tactical battlefield projection (ADR-0020).
Scheduling (ADR-0004), event taxonomy (ADR-0005), legal-action validation
(ADR-0006) and determinism seams (ADR-0008) are approved as architectural
directions with their implementation details deliberately unlocked. The
TheRev/Jev ownership boundary is recorded in ADR-0012.

## Deliberately undecided

The battle model, participants, objectives, result detail, persistence, campaign
systems and the choice of further tactical engines are all deferred until the
game design is finalised. The current types are the smallest set that makes the
boundary compile and testable.

Also deliberately undecided: aggregate boundaries and concurrent action
resolution (ADR-0007); exact determinism depth; gameplay mechanics and formulas
for cohesion, migration and political transformation; the canonical campaign
coordinate system and the `BattlefieldResolver` algorithm; the presentation
renderer and the Visual Design Bible; the TheRev SDK, transport and the name of
the game-side intelligence port; and the engine capabilities required to validate
mixed player/AI allied control and geography-consistent battlefield selection.
These are tracked in
[`docs/architecture/assumptions-and-open-decisions.md`](docs/architecture/assumptions-and-open-decisions.md)
and must not be silently converted into implementation decisions.
