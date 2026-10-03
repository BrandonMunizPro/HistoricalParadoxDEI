# HistoricalGame

Repository for a historical strategy game.

## What is established

- The **campaign simulation is authoritative**. It owns strategic state: the
  simulation is the single source of truth for the campaign.
- **Tactical battles are delegated** to an external battle engine. The first
  integration target is Total War: Rome II / Divide et Impera, reached only
  through an adapter boundary (`BattleAdapter`).
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
research/rome2-dei/    Preserved Rome II / DeI interoperability research
```

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
