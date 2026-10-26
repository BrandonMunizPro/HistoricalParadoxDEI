# Separate audit findings and deferred work

Repair update: repository-wide lint coverage is corrected in the [current repair candidate](REPAIR.md). The lint counts below describe the failed predecessor; unrelated Three.js findings remain deferred.

The owner relayed Big Pickle's independent audit on 2026-10-26. Its Three.js terrain-coverage encoding defect, coastal elevation display inconsistencies, search-label issues and documentation discrepancies are recorded here as reported technical debt. This Godot assignment does not reproduce or silently repair those Three.js findings.

Repository-wide ESLint currently includes Godot Node tooling and the ignored `godot-prototype/.vite-cache/` generated JavaScript. The investigation measured 3,862 errors; linting with `--ignore-pattern 'godot-prototype/**'` passed. The error count depends on local cache contents. This assignment does not refactor repository-wide lint configuration.

The final upgrade check measured **3,870 errors, 0 warnings**: 3,769 in generated Godot Vite cache code and 101 in Godot tooling, with no errors outside Godot. This is a failing repository-wide lint result, not a passing aggregate validation.

The Three.js local Nile escarpment/window join is separately documented in `docs/living-world/implementation-report.md`. Godot global coarse/fine shading facets, modern source limitations, lake seams, approximate water datums, and cache-cold traversal costs are recorded in `GLOBAL.md`. Visual improvements do not establish verified 278 BCE coastlines, vegetation, water levels or settlement architecture.

The October 16 and October 22 reports contain writing-time statements that work was uncommitted. Git history subsequently committed those checkpoints (`6845254`, `cc1abea`, `3ff5be1`). Big Pickle reports 475 passing tests; the older living-world report records 474. Treat each as evidence for its own execution, not the current test total.

Godot's existing research-dot toggle reads the raw 687-record export and filters missing/out-of-envelope coordinates. It does not reproduce the browser's promotion suppression and exact-duplicate consolidation into 660 display references. These dots remain a separate noncanonical node tree and never become approved sites; this visual assignment preserves that behavior. Harmonizing research display/labels is separate presentation work.
