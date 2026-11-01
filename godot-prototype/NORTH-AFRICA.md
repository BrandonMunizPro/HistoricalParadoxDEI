# North Africa and Egypt regional review

Status: review candidate; final validation results are recorded below. No commit or push.

## Scope and causes

The existing global ecology source contains a broad moist Nile Delta, but material and scenery classification relied on a narrow derived river field. Low elevation also triggered a coastal tint far inland. North African coarse scenery reused 24-tree forest stands; larger desert props exposed inward-facing rock surfaces. Scenery generation yielded unconditionally every 96 candidate attempts, even when inexpensive exclusions dominated.

The existing elevation grids are 129 samples per source tile with roughly 2�19 km source spacing. They cannot support new close-range landforms without additional justified source data. This pass preserves their elevations, terrain meshes, canonical coordinates and hydrology.

## Implementation

- Source moisture, elevation and slope identify low fertile plains; the Nile corridor and Delta receive finer alluvial material variation. Shore tint now requires proximity to the existing coastline inside the North African presentation scope.
- Existing arid and mineral materials blend using source slope/elevation. Source-normal directional contrast reveals real desert relief without displacement or invented drainage geometry.
- Arid scenery uses individual scrub and warm lowland riparian palms instead of repeated coarse forest stands. Sparse clustered outcrops use closed, correctly facing regional clones; existing Mediterranean assets are preserved.
- Existing North African river ribbons retain their coordinates, width and sampled height. A restrained wet/silt fringe lies inside those ribbons; their material follows the existing animated/static-water control.
- The unconditional candidate yield cap rises to 1,024; the existing 4 ms budget check every eight candidates remains. CPU work, candidate counts and yield frames are now recorded separately from elapsed readiness.
- Screenshot write errors now cause capture failure instead of publishing a success message for an empty PNG.

Presentation scope is configurable and feathered; it has zero weight in Italy, Sicily and Illyria. These rules are interpretive modern-source presentation, not a verified 278 BCE land-cover reconstruction. Sea water, global lighting, terrain-cast shadow policy, production navigation and all protected historical inputs remain unchanged.

## Files changed in this pass

Implementation: `data/environment-presentation.json`, `environment_rules.gd`, `regional_scenery.gd`, `terrain.gdshader`, `world.gd`.

Added implementation: `north_africa.gdshaderinc`, `nile_water.gdshader`, `tools/na-validate.gd`; capture-only `data/north-africa-views.json`.

Documentation/validation: this report and `evidence/north-africa/` (source manifests, capture runner, comparison generator, supplemental CPU/GPU rule check, test logs and measurements). Full captures are under `evidence/repair-20261026/na-before/` and `na-final4/`. Preview directories are diagnostics and are not acceptance evidence, including failed zero-byte preview images.

Earlier uncommitted changes in the repository are pre-existing work and are not attributed to this pass. HEAD remains cbab45903ee34973b68fac5360ad17dbe24c90a6.

## Review and reproduction

Open `evidence/north-africa/comparison.html` and `MEASUREMENTS.md` after capture validation finishes. Full originals use matched 1920 x 1080 cameras; three zooms per region. Capture profiles never enter the production navigation registry.

From repository root:

```powershell
npm.cmd run validate
node godot-prototype/tools/check-integrity.mjs
node godot-prototype/tools/checkpoint-source.mjs verify godot-prototype/evidence/north-africa/final4-source.json
& godot-prototype/evidence/north-africa/run-checks.ps1
& godot-prototype/tools/checkpoint-capture.ps1 -Stage na-review-new -Views @() -Profiles italy,sicily,illyria,egypt,delta,coast,desert,africa -Scales strategic,regional,inspection -ProfileFile data/north-africa-views.json -SourceManifest res://evidence/north-africa/final4-source.json
```

Use a fresh Stage name; the capture runner refuses to overwrite evidence. The supplemental GPU rule check is `--script res://tools/na-validate.gd` using the installed Godot console executable.

## Limitations

Coarse source relief and inherited coastline masks remain evident close up. River centerlines retain angular joins and do not acquire verified historical banks or tributaries. This pass does not add fine desert erosion geometry, new fields, roads or ancient vegetation evidence. Existing tree models remain stylized. Synchronous material startup is separate from scenery scheduling; the earlier cold loading hitch is not declared fixed. The 4 ms generation budget is a scheduling target, not a hard maximum. Failed preview captures are explicitly excluded from visual acceptance.



## Evidence revisions

Fresh baseline: `7b9d5013ba53bc6616ab9f4e4138bfc88b5dc617e19cb0b8ad22e3946c9dc67e`. Final: `ce0246585068e514c27c3c539851c90951075accdc19c9040da6bda19b65cbfe`, covering 2,636 code/data/protected inputs. All final capture and navigation evidence must match this revision. Earlier `na-preview*`, `na-final/`, `na-final2/` and `na-coast-fix-check/` are diagnostics, not the final acceptance set.

The first preview had empty image files during near-full system-drive conditions. Capture saving now checks its error code. A later preview exposed a presentation bug: the existing shore-distance raster is zero on inland land, so it cannot identify inland distance to shore. The added broad sediment fringe was removed; shoreline restriction now follows actual source land coverage. No source shore raster was modified.

## Regional visual inspection

All eight matched contact sheets were actually inspected at all three zooms, plus full-resolution Nile, Delta, desert and coastal close-ups.

| Region | Visible result | Remaining limit |
| --- | --- | --- |
| Egypt/Nile | Fertile corridor reads clearly; individual riparian palms replace oversized generic forest stands | Straight ribbon edges and joins; flat source floodplain |
| Nile Delta | Broad fertile plain now distinct from desert at campaign distance; fine alluvial variation closer | Coarse moisture footprint and modern hydrology; no verified ancient fields |
| Alexandria/Mediterranean coast | Less repetitive, smaller scrub; fertile coastal plain and source shoreline stay aligned | Simple banks and occasional canopy overhang; coarse coast resolution |
| Eastern Desert | Existing ridges/plateaux read through source-aspect relief; sparse closed outcrops replace tiny scatter | Close ground remains smooth because source spacing cannot resolve fine landforms |
| Tunisia/Cape Bon | Low fertile terrain and rocky uplands retain different material treatment; fewer oversized groves | Sparse coarse vegetation at intermediate zoom; original assets still stylized |
| Italy | All three cameras, scenery counts and observed composition preserved | Existing groves and shoreline simplifications remain |
| Sicily | All three cameras, scenery counts and observed composition preserved | Existing stylized canopy forms and settlement assets remain |
| Illyria | All three cameras, scenery counts and observed composition preserved | Existing coast steps; first-render stall remains a performance concern |

No new global atmospheric, lighting, sea-water or terrain-shadow change was introduced. Better North African depth comes from source relief readability, surface scale variation and solid environmental props, not fabricated mountains. This remains a source-limited prototype presentation rather than finished Rome II-quality environmental art.

## Validation results

- `npm.cmd run validate`: exit 0 after final implementation; typecheck, repository lint, 475 tests in 34 files, TypeScript build and postbuild smoke all pass. See `evidence/north-africa/npm-validate-final.log`. Existing lint scope was preserved.
- `run-checks.ps1`: 10/10 checks passed: 20 GDScript files parse; production resolver; environment and habitat GPU parity; actual canopy transition rendering; North African GPU rules/rock caps; static and animated Nile controls; water rendering; global and regional production navigation; negative timeout control. Exact commands/timestamps/exit codes are in `checks.json`.
- New regional CPU/GPU check: 4,096 samples, maximum error 0.002152; Italy/Sicily/Illyria mask exactly zero; existing rock vertices preserved while regional face winding/cap normals corrected.
- Global/regional validators require exact resolved distances, complete readiness with timeout, positive expected vegetation and all 35 selections. Continuous navigation passed nine stages including Zagros approach and interrupted-generation recovery.
- Integrity: 460 protected files unchanged; 35 approved identities/coordinates exact; 687 research records retained byte-identically; all 2,636 frozen source inputs verify unchanged. Three.js and the TypeScript foundation are preserved.
- All 24 pairs validate exact matched camera data, source revision, readiness, site/research counts and bounded residency. Italy/Sicily/Illyria scenery composition equals before at all nine cameras.
- `git diff --check` flags trailing blank lines at EOF in README.md, terrain.gdshader and world.gd. These are recorded rather than editing the frozen rendering revision after captures; they do not affect lint/build/runtime.

## Performance decision and next milestone

The complete measurements and original slow captures are in `evidence/north-africa/MEASUREMENTS.md`. North African captures measured 122.3�144.5 settled FPS; the full sustained set spans 27.7�144.5 FPS with active thermal slowdown observed. Cooled regional repeats recover Italy/Sicily/Illyria to 140.3�143.8 FPS. Terrain residency stays at 13 tiles with bounded coarse and close scenery cells. Scenery readiness improves (Egypt 6.92 to 5.72 seconds; Greece 8.46 to 7.33 seconds). Warm transition peak is 37.9 ms; a first-render frame reaches 4.10 seconds in the long run. The original loading problem is not solved and this checkpoint is not an unconditional performance acceptance.

The next focused milestone should isolate first-render resource/pipeline stalls under controlled thermals, then review higher-resolution, provenance-backed desert/coastal presentation inputs and better river-bank representation. Do not change canonical geography to hide the source limits. No further implementation, commit or push is included; independent visual and performance review is required.

Continuous navigation reproduction (use a new output directory):

```powershell
& 'C:\Users\brand\tools\godot\4.7.2-stable\Godot_v4.7.2-stable_win64_console.exe' --path godot-prototype --resolution 1920x1080 --script res://tools/environment-profile.gd -- --output=res://evidence/north-africa/navigation-review-new --source-manifest=res://evidence/north-africa/final4-source.json
```

The main gallery retains the sustained-run captures. `na-repeat-cooled` is supplemental performance evidence and does not replace slow results. `delivery-manifest.json` hashes the full review evidence and lists the precise source delta against the fresh baseline.
