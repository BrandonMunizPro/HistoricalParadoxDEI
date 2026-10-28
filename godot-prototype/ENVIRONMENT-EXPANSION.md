# Global environmental expansion

Review candidate, 27 October 2026. Implementation remains uncommitted on `cbab45903ee34973b68fac5360ad17dbe24c90a6`. Existing Coastline V2 and Sicily/Italy slice work was already uncommitted and has been preserved. No commit or push was made. Awaiting Nexus, Pickle and owner review; this document does not declare independent visual acceptance or commercial-game parity.

## Scope and audit

Water, atmosphere, lighting, strategic relief and the canopy mesh system already operated globally. The quality gap came partly from presentation rules: `terrain.gdshader` selected the newer surface treatment with an Italian geographic test; scenery used separate Italian/global ecology paths and offered only Mediterranean tree forms. Rock placement depended on vegetation suitability, leaving dry regions bare of both plants and stones. River terrain-following sampling was four times coarser outside the Italian source extent. Catana's scenery clearance used explicit coordinates.

These presentation exceptions have been replaced with shared rules. The Italian high-resolution terrain residency and coverage bounds remain legitimate source-resolution distinctions. This milestone does not invent equivalent elevation detail elsewhere or change the terrain engine. Existing lighting and animated/static water are retained. The existing detailed Catana settlement is retained; comparable cities across the map were not fabricated.

Reference observations were revisited through existing project research and ordinary local metadata. Rome II is installed at `C:\Program Files (x86)\Steam\steamapps\common\Total War Rome II`; its recorded file inventory at `research/rome2-dei/tools/rome2_data_list.txt` lists campaign-specific tree placement and river-froth resources. Imperator is at `C:\Users\brand\Downloads\Imperator.Rome-SteamRIP.com\Imperator Rome`; `game/gfx/map/terrain/materials.settings` defines named terrain materials with diffuse/normal/property/mask resources, and `detail_data.settings` separates material detail controls. These directly observed structures support the design choice of layered materials plus placed scenery. They do not reveal either game's complete rendering algorithm. No proprietary assets, code or shaders were imported, and game files were not modified.

## Implementation

**Continuous environmental families.** `environment_rules.gd` and `environment.gdshaderinc` calculate the same four normalized weights: Mediterranean, temperate, arid/steppe and river alluvium. Inputs are existing global ecology, latitude, source elevation/slope and an appearance field derived from existing river centrelines. There are no rectangular Italy-only material selections. `data/environment-presentation.json` holds family density, scale, ground cover, rock rates, visibility and generation budgets. The existing Etna volcanic appearance is now a configurable geology entry; the existing Catana clearance resolves its approved site ID instead of copying coordinates.

**Original surfaces at multiple scales.** Three new materials supply temperate grass/soil, dry mineral ground and alluvial earth. The Mediterranean slice assets remain in use. Fine samples, rotated samples and broader material structure keep the same family visible at strategic, regional and close distances. Slope, elevation, snow, existing relief normals and triplanar mineral detail still contribute. Arid rock uses the new mineral material rather than only tinting Italian limestone. Family weights also control distant canopy ground shading.

Original bitmap assets were generated with the built-in image tool, saved to `assets/environment/temperate-ground.png`, `arid-ground.png` and `alluvial-ground.png`, and visually inspected. Exact prompts, generation mode and provenance are in [assets/environment/provenance.json](assets/environment/provenance.json). These are artistic materials, not ancient land-cover evidence. No external runtime dependency was added.

**Reusable vegetation and dry-ground props.** `canopy_assets.gd` now builds 24 original plant variants: Mediterranean broadleaf/umbrella, conifer, cypress, temperate deciduous, low dry scrub and palm-like riparian forms, four variants each. Existing opaque foliage and mesh LOD remain. Four closed boulder variants share the same instancing path. Climate weights select forms and scale; source height, slope and habitat constrain placement. Rocks have an independent acceptance probability, so sparse dry environments retain mineral detail without artificial woodland. Plants and rocks are counted separately in evidence and vegetation validators.

**River presentation and bank safety.** `tools/environment-build.mjs` derives a 5,569 × 3,201 R8 influence texture from 20,233 existing river segments, at 64 pixels/degree with a 1.5 km visual influence. It adds no river geometry or historical floodplain claims. CPU and GPU sample the same texture. A bounded lazy projection cache excludes props within 140 m of source river segments. Close ribbon terrain sampling is now 250 m globally, versus 1 km far away, preserving original centrelines and ribbon widths. The original high-resolution/global width conventions remain a limitation.

**Bounded work.** Terrain remains at most 13 resident tiles including context. Scenery retains at most 12 coarse groups and nine local cells; each cell tests at most 6,000 deterministic candidates and accepts at most 1,800 props. Probability rejection happens before costly terrain/river queries. Generation yields every 96 candidates and transform uploads every 250 instances, with cancellation checks after yields. The projected river-cell cache is capped at 128. Coarse scenery fades over 30 km toward a 110 km visibility limit; local scenery fades over 15 km toward 45 km. No world-wide detailed prop load was introduced. The existing 200 km scenery-generation cutoff is retained; shader ground cover provides distant structure.

All ecological families, stones, tree forms and corridor widths here are **interpretive presentation**, separate from canonical geography, archaeological provenance and the research catalog. Existing waterways and modern elevation are inputs; this is not a verified 278 BCE biome reconstruction.

## Exact implementation file list

Paths below are relative to `godot-prototype/`. “Modified” means changed further from the already uncommitted approved slice, rather than newly changed from HEAD. [implementation-files.json](evidence/environment/implementation-files.json) records before/final hashes. Capture framing was introduced before the baseline snapshot so matched cameras could be used on both versions.

| Status | Files | Purpose |
| --- | --- | --- |
| Modified | `world.gd` | Bind shared rules/materials, consistent river sampling, composition/work metrics |
| Modified | `terrain.gdshader` | Global family blending at multiple scales |
| Modified | `regional_scenery.gd` | Family placement, independent rocks, bank safety, bounded cooperative work |
| Modified | `canopy_assets.gd` | Deciduous/scrub/riparian forms; valid reduced LOD index sets |
| Modified | `tools/navigation-validation.gd` | Count actual plants for positive vegetation assertions |
| Modified | `tools/visual-capture.gd` | Matched `regional` and `inspection` capture distances |
| Added | `environment_rules.gd`, `environment.gdshaderinc` | Shared CPU/GPU family rules |
| Added | `data/environment-presentation.json`, `data/environment-views.json` | Interpretive configuration and capture-only framing |
| Added | `tools/environment-build.mjs`, `tools/environment-profile.gd`, `tools/environment-validate.gd` | Derived field generation, continuous navigation diagnostics, CPU/GPU checks |
| Added | `assets/environment/temperate-ground.png`, `assets/environment/arid-ground.png`, `assets/environment/alluvial-ground.png` | Original material albedos |
| Added | `assets/environment/.gdignore`, `assets/environment/provenance.json` | Runtime image-loading convention and exact prompts |
| Added | `data/environment/river-corridors.png`, `data/environment/.gdignore`, `data/environment/provenance.json` | Derived appearance field and reproducible provenance |
| Documentation | `README.md` (modified), `ENVIRONMENT-EXPANSION.md` (added) | Current review entry and this report |

Evidence-only files are under `evidence/environment/` and the `environment-*` stages in `evidence/repair-20261026/`: frozen manifests, original PNGs, metrics/process JSON, execution logs, comparison builder/gallery/sheets, validation runner/results and delivery inventories. These do not load into the campaign. Existing Three.js, source research, water shaders, shoreline include, lighting settings, production presets and navigation resolver were not changed by this milestone. Git also lists earlier V2/slice modifications and assets; those are preserved prior work, not newly attributed to this task.

## Evidence and camera definitions

[Comparison gallery](evidence/environment/comparison.html): 48 matched before/after pairs, 16 regions at three distances, plus three Nile-centred supplementary views. Original 1,920 × 1,080 Godot PNGs are authoritative. Contact sheets are labelled half-resolution layout previews; screenshots were not retouched. Camera longitude, latitude, distance, pitch and yaw are asserted identical across each pair.

Before source: `f1847e952b42693f9a8a39265873871526bf095a182fc04c645d56bc8dcdf712` ([manifest](evidence/environment/before-source.json)). Final source: `9e3a29425721c8de8a81f74998d30598f94e46d461ab6c182e6ffc2e50cd1e0c` ([manifest](evidence/environment/tour-source.json)). The authoritative final screenshot stage is `evidence/repair-20261026/environment-final3/`; `environment-final`, previews, bank checks and the stale-manifest `environment-final2` attempt are diagnostic predecessors, not final evidence.

`data/environment-views.json` defines capture-only regional framing. “Strategic” means that profile's documented base distance, “regional” means 35%, and “inspection” means 4%. These do not replace the 1,100 km production campaign default or any production navigation preset. Nile close views centre on an existing source vertex; they have no matching original close baseline and are explicitly supplementary. Production navigation is separately exercised by the global/regional validators and the continuous navigation tour.

The inherited scenery-generation cutoff is `distance >= 200 km`. Direct 200 km capture profiles therefore contain zero props; production approaches can settle infinitesimally below 200 km and retain coarse groups. The reported counts expose this distinction. Their visibility fade ends nearer the camera, so group residency is not equivalent to visible trees at 200 km. The threshold's dependence on approach direction remains a streaming limitation rather than a new geography rule.

[delivery-manifest.json](evidence/environment/delivery-manifest.json) inventories authoritative screenshots, logs, validation, documents and implementation files with byte sizes and SHA-256 hashes. Diagnostic predecessor stages remain on disk and are excluded from that acceptance-evidence inventory. The manifest itself is not a signed acceptance declaration.

## Regional coverage and visual inspection

Each linked sheet contains strategic, regional and inspection rows; before is left, final is right. All regions use the same reusable rules; regional differences follow inputs rather than separate renderer paths.

| Region / sheet | Visible result | Remaining limitation |
| --- | --- | --- |
| [Southern Italy](evidence/environment/sheets/italy.png) | Mediterranean scrub/ground retained; mineral clutter and clearer broad material variation | Coast vertices remain angular close up; simple prop forms |
| [Sicily](evidence/environment/sheets/sicily.png) | Existing Etna cue, Catana footprint and Mediterranean canopy retained | Generic rocks and mottled distant texture; no new city assets |
| [Iberia](evidence/environment/sheets/iberia.png) | Dry mineral plateau with greener supported pockets and sparse scrub | Broad mineral pattern can look soft at strategic height; coarse source relief |
| [Pyrenees](evidence/environment/sheets/pyrenees.png) | Mountain barrier remains; conifers and stony high slopes | Rounded source ridges, generic exposed rock |
| [Gaul](evidence/environment/sheets/gaul.png) | Cooler ground and deciduous canopy; shared river corridor treatment | River angles and repeated family silhouettes remain visible |
| [Alps](evidence/environment/sheets/alps.png) | Strategic mountain relief retained, greener foothills and high-altitude stone | Sharp inherited terrain edges/skirt-like faces in regional view remain unresolved |
| [Greece](evidence/environment/sheets/greece.png) | Mediterranean ground/canopy quality matches Italian treatment | Coarse coastline and low-resolution terrain limit close geometry |
| [Balkans](evidence/environment/sheets/balkans.png) | Temperate/Mediterranean transitions and mixed trees | Generic tree silhouettes; source valleys are smooth |
| [Anatolia](evidence/environment/sheets/anatolia.png) | Dry plateau and supported greener patches; stones and low scrub | Lakes retain coarse boundaries; broad material pattern is conspicuous |
| [Egypt](evidence/environment/sheets/egypt.png) | Desert/alluvial contrast replaces blanket green/yellow treatment | Source river segments remain angular; straight inland water edges already present |
| [Nile supplement](evidence/repair-20261026/environment-final3/godot-profile-nile-inspection.png) | Alluvial ground and palm-like forms near existing centreline, clear prop-free ribbon | Uniform ribbon width, stylized fronds and an over-simple bank remain obvious |
| [North Africa](evidence/environment/sheets/africa.png) | Coastal green-to-dry transition, mineral ground and sparse vegetation | This sample is Tunisia; it is not exhaustive Atlas or Sahara acceptance |
| [Levant](evidence/environment/sheets/levant.png) | Coastal Mediterranean to drier interior transition | Coastline remains coarse; no historical terracing/agriculture claims |
| [Mesopotamia](evidence/environment/sheets/mesopotamia.png) | Existing waterways gain coherent alluvial surroundings amid dry terrain | Coarse reservoir/lake geometry and ribbon joins remain artificial |
| [Zagros](evidence/environment/sheets/zagros.png) | Broad relief retained; dry scrub/stone replaces generic woodland close up | Near profile falls on smooth terrain; broad source detail cannot produce fine ridges |
| [Iranian plateau](evidence/environment/sheets/persia.png) | Sparse steppe/mineral surface, much less Mediterranean appearance | Large-scale texture mottling and generic stones |
| [Eastern extent](evidence/environment/sheets/east.png) | Snow/high relief retained, dry valleys and sparse foothill forms | Strong snow contrast and coarse source mesh; no survey of the entire eastern extent |

The screenshots visibly retain regional identity, but this is not uniform commercial-game detail. Italy's superior source geometry still matters. The reusable families extend environmental treatment globally; the evidence samples do not prove every tile and every possible travel path is defect-free.

## Validation, measurements and reproduction

Fresh final results are in [checks.json](evidence/environment/checks.json), [npm log](evidence/environment/npm-validate.log), [production navigation tour](evidence/environment/navigation-repaired/navigation.json), [measurements](evidence/environment/MEASUREMENTS.md) and [all paired metrics](evidence/environment/comparison.json). All final runtime evidence resolves source `9e3a2942…`; each engine-produced record includes its UTC timestamp and HEAD. No diagnostic predecessor is treated as a passing final run.

| Check / exact command or script | Result |
| --- | --- |
| `npm.cmd run validate` | Exit 0: TypeScript, repository-wide ESLint, 475 tests across 34 files, build and postbuild smoke passed |
| `tools/parse-scripts.gd` (`--headless`) | 18 GDScript files compiled |
| `tools/navigation-test.gd` (`--headless`) | Seven original camera distances; two duplicate-name collisions rejected; capture names isolated |
| `tools/environment-validate.gd` (real GPU) | 4,096 CPU/GPU family samples; max error 0.00215543; normalized weights and 24 valid plant variants |
| `tools/habitat-validate.gd` (real GPU) | 4,096 shared habitat samples; max error 0.00219522 |
| `tools/visual-validate.gd` (real GPU) | Static water patches identical, animated patch different; camera and terrain unchanged; scenery ready |
| `tools/global-validate.gd` | All 17 production views passed exact distances, complete generation, expected positive plants, bounded residency and all 35 selections |
| `tools/regional-validate.gd` | All nine production views passed the same checks |
| Global validator with `--timeout-seconds=0.001` | Expected exit 1 and explicit timed-out/not-passed result; validates the failure path |
| `tools/environment-profile.gd` | Nine-stage continuous production/diagnostic tour passed, including river-bank exclusion and interrupted generation recovery |
| `node godot-prototype/tools/check-integrity.mjs` | All 460 protected files unchanged; 35 exact canonical identities/coordinates; 687 records, research copy byte-identical |
| `node godot-prototype/tools/environment-build.mjs` | Regeneration byte-identical for PNG and provenance; 20,233 segments |
| `node godot-prototype/tools/checkpoint-source.mjs verify godot-prototype/evidence/environment/tour-source.json` | All 2,630 source-manifest files unchanged |
| `git diff --check` | Exit 0; Git printed LF/CRLF conversion notices, no whitespace errors |

The repository lint configuration already excluded generated caches/evidence while linting Node tooling correctly; no additional lint exclusions or unrelated fixes were needed here. Global/regional terrain interpolation comparisons were within 0.000066 m and shared same-resolution edge error was zero. These are internal mesh/sampling checks, **not** a claim of surveyed geographic accuracy or proof that the visible Alpine faces are repaired. The 35 canonical markers and approved/research separation are preserved; new scenery does not create selectable historical sites. Three.js/source/data/tests have no new tracked diff from this assignment.

Reproduce automated checks (the runner records exact engine arguments, exits and timestamps):

```powershell
npm.cmd run validate
.\godot-prototype\evidence\environment\run-checks.ps1
node godot-prototype/tools/check-integrity.mjs
node godot-prototype/tools/checkpoint-source.mjs verify godot-prototype/evidence/environment/tour-source.json
$g='C:\Users\brand\tools\godot\4.7.2-stable\Godot_v4.7.2-stable_win64_console.exe'
& $g --path godot-prototype --resolution 1920x1080 --script res://tools/environment-profile.gd -- --output=res://evidence/environment/navigation-new --source-manifest=res://evidence/environment/tour-source.json
```

**Performance remains a review limitation.** Godot 4.7.2 Forward+, RTX 3060 Laptop GPU, 1,920 × 1,080. Final3's 51 settled captures span **13.5–145.0 FPS**, with a severe Balkans close outlier; all retain 13 resident terrain tiles. A ten-view unchanged-source repeat measured **111.9–144.6 FPS**. Balkans close recovered from 13.5 to 119.8, Anatolia strategic from 26.2 to 144.1, and Zagros close from 123.4 to 140.8. Camera, counts and draw calls matched. Both runs are retained in [performance-repeat.json](evidence/environment/performance-repeat.json) and the measurements report. Some added material/instance cost is real; severe batch variability is not explained by count changes. No overall performance acceptance is declared.

The repaired continuous tour measured 22.0 ms maximum warm navigation frame, 97.4–144.2 settled FPS across its nine stages, and 140.6 FPS / 6.2 ms GPU at Zagros close. The 70 km approach sample was slower despite only 3.8 ms GPU, indicating frame pacing outside GPU work; a controlled pacing benchmark remains future work. All stages settled within 6.9 seconds and stayed within residency limits. Positive plant assertions count plants, never stones.

Startup remains blocking: **2.741–3.403 seconds** total, including **1.731–2.140 seconds** in material initialization. In the first final3 Italian capture, the three new textures account for 144.1 ms of recorded image load work; existing large land/ocean/shore inputs remain substantial. Candidate generation now yields in measured chunks up to 12.8 ms and uploads up to 26.6 ms, but those are not the whole boot cost. Recorded startup/streaming frame maxima were 51.8–252.7 ms. Driver/shader caches were retained, so the earlier 1.69-second cold hitch is **not declared solved**. A cache-reset experiment was deliberately avoided.

GPU telemetry during the latter part of the repeat showed power-cap activity, varying clocks and temperatures up to 86 C. It did not show active software thermal slowdown in that interval. Cumulative thermal counters cannot establish the cause of earlier outliers, which lacked contemporaneous telemetry. No hardware settings were changed. The original 13.5 FPS outlier and remaining lower-than-baseline samples are reported openly; the task is ready for visual/technical review with unresolved performance variability.

Launch production navigation from the repository root:

```powershell
.\godot-prototype\run.ps1 -View greece
.\godot-prototype\run.ps1 -View anatolia
.\godot-prototype\run.ps1 -View egypt
.\godot-prototype\run.ps1 -View persia
```

Reproduce matched framing using a **new** stage name (the script refuses to overwrite evidence):

```powershell
.\godot-prototype\tools\checkpoint-capture.ps1 -Stage environment-review-new -Views @() -Profiles italy,sicily,iberia,pyrenees,gaul,alps,greece,balkans,anatolia,egypt,africa,levant,mesopotamia,zagros,persia,east,nile -Scales strategic,regional,inspection -ProfileFile data/environment-views.json -SourceManifest res://evidence/environment/tour-source.json
```

The source verifier deliberately rejects changed runtime/tool files against a frozen manifest. For a future revision, create a new manifest before capturing; do not edit an old manifest to relabel screenshots.

## Known limits and next milestone

The new material families and forms improve regional distinction. Close-up vegetation and boulders are still stylized, large mineral patterns can look cloudy at strategic height, and source coastlines, rivers and some terrain transitions remain conspicuous. Water/atmosphere were preserved rather than rebuilt. No roads, historical vegetation survey, campaign simulation, politics, characters or battles were introduced. Detailed settlement presentation remains the existing Catana slice.

Recommended next visual milestone: review the paired regional evidence first, then address the inherited Alpine terrain edge and river-bank/ribbon joins using current source data, with focused movement captures. Those defects are more visible than adding another broad color layer. Changes to canonical hydrology or higher-resolution source acquisition require their own provenance review.
