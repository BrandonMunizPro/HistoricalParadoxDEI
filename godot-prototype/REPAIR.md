# Repair of the failed Godot visual checkpoint

Status: **candidate for independent Pickle review; not accepted**. No commit or push. The Rome II/Imperator biome-and-scenery milestone has not begun.

The authoritative review evidence is [this single run](evidence/repair-20261026/final2/index.html): [source revision](evidence/repair-20261026/final2/source.json), [commands and exit results](evidence/repair-20261026/final2/checks.json), [measurements](evidence/repair-20261026/final2/summary.json), and [complete changed-file manifest](evidence/repair-20261026/final2/delivery-manifest.json). Earlier `visual-*` folders and the diagnostic folders outside `final/` are historical, not current acceptance results.

## Navigation repair

`navigation.gd.configure()` combines only `data/production-views.json` and `data/global-views.json`. A duplicate key rejects the entire update and leaves the old registry unchanged. Returned presets are copies. `world.gd.jump()`, the region picker, in-game buttons and `run.ps1 -View` use that registry exclusively; unknown names fail rather than silently falling back.

`data/visual-views.json` is read only by screenshot tooling. Capture names are filenames, never implicit navigation keys. Each screenshot reports `cameraPath`, `resolvedProductionView` and `resolvedCameraDistanceKm`, so a broad capture profile cannot masquerade as a production view.

| Production preset | Restored distance, km |
|---|---:|
| Greece | 95 |
| Anatolia | 150 |
| Egypt | 180 |
| East | 320 |
| Alps | 100 |
| Apennines | 85 |
| Sicily | 520 |

The separately named `campaign` preset retains 1,100 km; `overview` retains 8,500 km. The duplicate default camera definition was removed from visual material settings. `tools/navigation-test.gd` checks all seven restored distances, conflicting capture names, rejected duplicate merges, unknown names and mutation isolation. The launcher is also exercised directly with Greece.

## Validator repair

Both existing validator entry points now use `tools/navigation-validation.gd`: **17 global production cases and 9 regional production cases**. They call actual `jump()` and wait for camera easing, all terrain reveals, river work and every expected scenery cell to finish. They do not manually install capture-profile coordinates.

Scenery readiness now includes expected cells that have not started, not merely the brief `busy` flag between jobs. Cells receive a completion marker only after their MultiMeshes are built. Close cells also wait for settled terrain. An obsolete coroutine cannot mark a replacement cell ready.

Each case checks the resolved distance exactly against an independent fixture, checks actual eased distance within 0.0001 km, records positive generated/resident vegetation where expected, verifies empty pending-work lists and enforces terrain/scenery limits. These instance counts are not claims that every instance survives GPU distance/frustum culling. Missing scenery is an explicit failure.

The normal per-view timeout is 90 seconds. The final run deliberately forces a zero-second timeout: that negative test must write `passed:false` and exit 1. It is reported as an expected failure test, never relabeled as successful navigation. Windows process handles are acquired before exit so the runner cannot treat a null `ExitCode` as success.

A float32 `Vector2` easing endpoint could stop a few ULPs short of its destination. Camera focus now snaps to the exact requested vector within 0.0001 degrees. This changes no settlement coordinates or geographic definitions. The existing 8% maximum zoom step remains.

## Measured performance causes and repairs

Instrumented diagnostic runs separated script stages, render CPU/GPU time, terrain uploads, initial setup and settled frames:

- A **1,416.6 ms** frame was reproduced with **1,414.4 ms in river-ribbon construction**, while render GPU time was approximately 5.4 ms. The old code rebuilt these ribbons up to 1,800 km even though they were hidden at 500 km. Hidden rebuilds are removed. Visible rebuilds now yield in approximately 2 ms CPU chunks and cancel when their terrain/view signature changes. Final mesh upload and first-use rendering are still synchronous.
- Another first draw after a shader change measured **1,543.6 ms wall time**, followed by a reported **1,521.0 ms render CPU interval** and about **79.6 ms GPU time**. This implicates first-use render/pipeline setup rather than the preceding roughly 12 ms script work. The exact driver/compiler subroutine was not traced. No cache was deleted to manufacture a cold-start test, and this remaining stall is not claimed fixed.
- Initial material preparation independently took around **1.46–1.59 seconds** in sampled processes. It includes synchronous image loading, mip generation and texture creation. This setup duration must not be confused with steady frame time.
- Current/reference/current shader comparisons at identical capture cameras measured much smaller warm GPU differences than the old isolated FPS samples. Before the sampling optimization, Anatolia overview measured about 8.17/8.05/8.37 ms GPU and Zagros strategic 6.18/6.00/6.12 ms. These short runs do not explain every historical FPS difference; thermal/background/driver variation was not isolated.
- Four close-detail terrain texture reads are now skipped once their normal contribution is zero. Subpixel fine water layers fade out before their computation is skipped at strategic distance; two independently moving broad layers, coastal colour and lighting remain. A diagnostic optimized run measured about 7.76 ms GPU at Anatolia overview and 6.00 ms at Zagros strategic. Fresh final-run numbers are in `summary.json`; these diagnostics are not substituted for them.

The real production campaign-to-Apennines approach is recaptured, with per-frame distance and fixed-location height-step measurements. Terrain residency stays at twelve detail meshes plus context; no new terrain/biome streaming architecture was introduced.

## Edge glints and coarse transitions

At the same 1,100 km production camera, disabling terrain shadows changed **zero pixels above the comparison threshold** in a fixed northern join patch, whereas removing the 0.6 km parent-coverage overlap changed **275 pixels** in the earlier diagnostic. This isolates sensitivity to the differently tessellated parent/detail join, rather than shadows, in that view. Fresh controls and the exact patch/threshold are included in final evidence.

The overlap is retained. It reduces observed background leaks but is not a whole-world seam-free proof. Parent/detail geometry still comes from different source grids: approximately 650–870 m Italian source spacing, 2–4 km world spacing, and a coarser 513-square context. Existing parent-height reveal and boundary morphing still change local shapes while streaming. The shared relief field improves distant lighting; it does not add missing source geometry. Remaining edge/coast/lake artifacts and coarse/fine transitions remain visual limitations for review.

Fresh production-distance inspection also shows pale shoreline/lake rims in Greece and Anatolia, rounded coarse world relief, and local shading/join artifacts in the Alps. They are visible in the production gallery and are not concealed by substituting the broader capture profiles. Positive generated vegetation counts are a functional check, not a commercial-quality art verdict.

## Lint and checks

The root ESLint configuration excludes only generated Godot caches and evidence archives, while Godot `.mjs` tools remain linted as Node CLI source. Only the browser callbacks in `compare.mjs` receive browser globals. CLI stdout is allowed in CLI tools; unused variables and undefined names remain errors. The legitimate unused `lakeAt` function was removed from `tools/prepare.mjs`, rather than suppressed.

`tools/lint-scope.test.mjs` proves cache exclusion while intentionally undefined and unused symbols in Godot tool source are still diagnosed. Full `npm.cmd run validate` covers typechecking, repository-wide lint, **all 475 Vitest tests**, the production TypeScript build and build smoke checks. Godot compilation, production navigation, positive scenery, the negative timeout, GPU water/static controls and protected-source checks are separate steps; a subset pass never confers checkpoint acceptance.

The final run checks all **460 protected files**, **35 exact settlement identities and coordinates**, **687 byte-identical research records**, world/regional elevation samples and coastline probes. Research dots remain separate from approved markers; their pre-existing raw-reference display behavior was not replaced with the proposed new living-world implementation.

## Final measured results

The `final2` run completed all **21 checks** with their expected exit codes. It contains **92 revision-stamped evidence records**, nine production screenshots and 24 separate zoom-profile screenshots. The code/runtime source fingerprint is `2ada68e20dca03fc0529b6c139fe10292c497a1ba67ee3a559f989e130922b22`; all 2,602 fingerprinted inputs verified unchanged at completion.

Main candidate views measured **103.9–144.6 settled FPS** with at most 13 terrain nodes. The largest warm startup/streaming frame among those views was **188.0 ms**. The actual production campaign-to-Apennines approach measured **58.3 ms** maximum frame time, **2.106 ms** maximum river CPU chunk and **2.572 ms** river upload; its maximum distance step was 8%. This is a short warm run, not a cold-start or uninterrupted-frame-rate guarantee.

| Controlled profile | Current FPS | Reference FPS | Current repeat FPS |
|---|---:|---:|---:|
| Anatolia overview | 108.6 | 104.3 | 102.4 |
| Anatolia strategic | 144.0 | 143.2 | 143.1 |
| Zagros overview | 103.9 | 101.6 | 99.9 |
| Zagros strategic | 137.2 | 129.7 | 132.3 |

The repeat's lower Zagros overview sample remains visible in the data. These variations preclude a general speedup claim. The final edge controls reproduced zero changed pixels for the shadow control and 275 for removal of overlap in the fixed patch. Full lint/typecheck, all 475 tests, build/smoke checks, positive scenery assertions and the explicit timeout failure passed. Previously observed first-use render setup stalls and the documented shoreline/coarse-geometry defects remain unresolved.

## Reproduction commands

From the repository root, use a fresh output name; the runner refuses to overwrite an existing evidence set:

```powershell
& .\godot-prototype\tools\checkpoint-run.ps1 -RunName review2
node godot-prototype/tools/checkpoint-report.mjs review2
node godot-prototype/tools/checkpoint-source.mjs verify godot-prototype/evidence/repair-20261026/review2/source.json
.\godot-prototype\run.ps1 -View greece
.\godot-prototype\run.ps1 -View anatolia -StaticWater
```

The runner executes validation sequentially and records commands, exit codes and UTC timestamps in `checks.json`. It fingerprints runtime inputs, code, configuration and protected sources before testing, verifies them at the end, and stamps the same source revision on navigation, capture, water and integrity results. The second report command seals the delivery hashes after the runner records its last status entry; it does not rerun rendering or change the source revision. Production screenshots and capture-only zoom profiles are separate gallery sections. Reference shaders in diagnostic comparisons are the project's own committed shaders, not proprietary game assets.

Modified implementation is concentrated in `world.gd`, `regional_scenery.gd`, navigation/configuration and Godot tools. The only shared configuration change is `eslint.config.js`. The delivery manifest lists every modified/added nonignored file, including individual images and results. No canonical geography, approved research, Three.js source, ownership, character, battle or simulation files were changed. Review by Pickle, Nexus and the owner remains required.
