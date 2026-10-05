# HistoricalGame

Repository for a historical strategy game.

## What is established

- The **campaign simulation is authoritative**. It owns strategic state: the
  simulation is the single source of truth for the campaign.
- **Tactical battles are delegated** to an external battle engine. The first
  integration target is Total War: Rome II / Divide et Impera, reached only
  through an adapter boundary (`BattleAdapter`).
- The **campaign owns its own geography**. An adapter translates campaign
  geographic context into an engine battlefield representation; the domain never
  contains engine map or battlefield identifiers.
- The campaign owns the **command hierarchy** and decides who commands and who is
  player-controlled, but it issues **no tactical orders** during a battle. Rome II
  / DeI *is* the tactical battlefield.
- **Cohesion, population migration and government are campaign state**, not
  presentation concerns: organisational survival after battle, mobile
  population cohorts, and mutable government with political transformation are
  all simulated.
- The MVP is **single-player only**. No networking or multiplayer architecture is
  carried. Determinism is retained for debugging, testing, benchmarking,
  save/load, bug reproduction and controlled replay.
- **AI is external.** Jev is implemented in and exposed through **TheRev**, not
  in this repository. The game owns canonical state, knowledge filtering and the
  legal-action gate, and keeps only a game-side intelligence seam; provider
  selection, routing and model management belong to TheRev (ADR-0012).
- **Playable is not the same as simulated.** A limited set of factions receives
  handcrafted playable packages; every faction in the world is simulated.
- The domain layer never imports engine-specific code, identifiers, file formats
  or catalogue structures.
- `research/rome2-dei/` contains the **completed interoperability research**:
  read-only extraction of Rome II / DeI database tables, the resulting catalogues,
  and the tooling needed to reproduce them. See
  [`research/rome2-dei/HANDOFF.md`](research/rome2-dei/HANDOFF.md).
- Game systems, mechanics and the roadmap are **still being designed**. This
  repository currently contains engineering foundations only.

## Layout

```
src/
  domain/battles/      Engine-agnostic battle types + BattleAdapter interface
  simulation/          Authoritative campaign simulation (not implemented yet)
  tactical/adapters/   Battle engine adapters (Rome2DeIAdapter shell)
  infrastructure/      Catalogue access boundary (interface + shell)
  shared/              Small cross-cutting helpers
tests/                 TypeScript tests (vitest)
docs/                  Design documentation (see docs/README.md)
research/rome2-dei/    Preserved Rome II / DeI interoperability research
```

## Design documentation

Design documentation lives under [`docs/`](docs/README.md): the domain
relationship model, system dependency graph, simulation scheduling and
performance analysis, event taxonomy, legal-action architecture, vertical slices
and epics, an assumptions/open-decisions register, a glossary, the event
catalogue, the presentation requirements, and the architecture decision records
(ADRs).

Every recommendation is marked **Approved**, **Proposal**, **Unresolved** or
**Research-dependent**. Unresolved items are design questions, not implicit
decisions, and nothing in `docs/` authorises building a gameplay system yet.

See also [ARCHITECTURE.md](ARCHITECTURE.md).

## Working on the code

Requires Node.js 22 or newer.

```bash
npm install
npm run typecheck   # tsc --noEmit over src, tests and config
npm run lint        # eslint
npm run test        # vitest run
npm run build       # emit JavaScript + declarations into dist/
npm run validate    # typecheck + lint + test + build
```

## Research data policy

The generated research output (`research/rome2-dei/extracted/`,
`research/rome2-dei/catalogs/`) and the pack inventories are **not tracked in
Git**. They are reproducible from the tracked tooling and are kept local. No
Rome II, DeI or RPFM assets or binaries belong in this repository. See
`.gitignore` and `ARCHITECTURE.md`.
