# Repository checkpoint — 13 November 2026

The accumulated world terrain, coast, vegetation, campaign interface, faction,
and startup work is preserved in regional data commits followed by application
and review-artifact commits. Terrain commits are pushed separately to limit
individual upload size. This checkpoint does not claim all checks pass.

Checks run against the complete working tree before committing:

- TypeScript typecheck: passed.
- Vitest (`npm.cmd test -- --maxWorkers=1`): 519 tests across 38 files passed.
- Production build and build smoke check (`npm.cmd run build`): passed.
- World completion data: passed, including height continuity across 22 sections
  and 3,322 land coverage samples with no uncovered samples.
- World coast data: passed, including source hashes and indexing of 2,757,887
  source coastline segments.
- Northern terrain data: passed.
- Campaign artwork validation: passed for six files, including source checksum
  and cutout alpha checks.
- Protected historical data: passed; 7,671 files matched the protected manifest,
  and six renderer changes were within the validator's permitted set.
- Git whitespace check on existing changes: passed. New upstream GSHHG licenses,
  generated Godot import metadata, and captured evidence retain their original
  bytes and whitespace; they are excluded from subsequent staged whitespace
  checks.

Known failures retained for follow-up:

- `npm.cmd run lint`: 74 errors across documentation scripts, Godot tools,
  vendor JavaScript, `src/presentation/faction-cartography.ts`, and
  `tests/faction-backgrounds.test.ts`. The combined `validate` command stops here;
  tests and build were therefore run separately.
- Godot 4.7.2 headless `res://tools/global-validate.gd`: failed at the Greece
  preset with `Terrain placement/edge mismatch: greece`. The reported maximum
  placement error was approximately 4,499.62 metres, with zero shared-edge error.
  The result repeated outside the sandbox under the normal Windows account.
  The current result is retained in
  `godot-prototype/evidence/global-navigation.json`.

These checks do not establish a full visual review of every region, successful
native startup preparation, or elimination of worldwide terrain/vegetation pop-in.
