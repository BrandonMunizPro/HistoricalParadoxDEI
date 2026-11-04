# Neapolis — zero-budget residential prototype

Status: **zero-cost, Neapolis-only prototype implemented and captured for manual review. Not approved for adoption or rollout.** The earlier JuanChee acquisition proposal is deferred. No purchase, paid software or paid dependency.

## Source assessment and decision

| Source | Verified license / contents | Suitability | Decision |
|---|---|---|---|
| [Kenney Fantasy Town Kit 2.0](https://kenney.nl/assets/fantasy-town-kit) | CC0; 160 assets; downloaded official archive includes original license, GLBs, other interchange exports, previews and palette. Selected GLBs inspected and counted locally. | Finished buildings are fantasy/medieval. Plain wall, doorway, window, gable and post geometry can be reused after material replacement, roof adjustment and new assembly. | Acquire selected components, not finished houses. |
| [Kenney Modular Buildings](https://kenney.nl/assets/modular-buildings) | CC0; modular building components. [Official format listing](https://kenney-assets.itch.io/modular-buildings) lists OBJ, FBX and glTF. | Contemporary building language; no convincing Hellenistic finished housing. | Reject for this prototype. |
| [Quaternius Medieval Village](https://quaternius.com/packs/medievalvillage.html) | Official page: CC0, 44 models, FBX/OBJ/Blend. | Medieval finished buildings and roof forms; importing them unchanged would misrepresent the period. | No download, no adoption. |
| [Quaternius Medieval Village MegaKit](https://quaternius.com/packs/medievalvillagemegakit.html) | Official page: CC0 models, 304-model kit; free subset versus paid source/engine convenience packages must be distinguished. | Medieval architecture; larger integration does not solve historical suitability. | No purchase or dependency. |
| [Quaternius Ultimate Modular Ruins](https://quaternius.com/packs/ultimatemodularruins.html) | Official page: CC0 modular ruins. | Ruins/dungeon components do not supply ordinary inhabited Greek homes. | Reject for this experiment. |

No complete free Greek residential kit with sufficiently verified historical suitability was established in the investigated sources. This does not establish that none exists. The smallest usable zero-cost alternative is adapting a few legally reusable, plain components into three baked courtyard-house archetypes.

The actual Kenney archive SHA-256 is `1a7530c09f4d2fa2cdee259876f089334f8b1f27fa86a0c4f54ef86cdd8676ef`. The archive and full inventory are retained in `source-cache/neapolis-free/`; the selected GLBs and original CC0 license are in `godot-prototype/assets/neapolis-free/source/`. Exact measured inventory is `source-cache/neapolis-free/inventory.json`. The source website supplies expiring signed download URLs; reacquisition starts at the official product page. No paid model or paid software is required.

CC0 permits commercial use, modification and redistribution without mandatory attribution. Kenney credit and the original license are nevertheless preserved. Existing CC0 Poly Haven plaster and roof textures are reused with their existing provenance. No proprietary game extraction is used as art.

## Historical interpretation

The [University of Michigan Olynthos housing research](https://sites.lsa.umich.edu/olynthos-project/olynthian-houses/) supports enclosed courtyards and pastas arrangements as comparative Greek residential precedents. The [University of Bonn Priene housing project](https://www.iak.uni-bonn.de/de/institut/abteilungen/klassische-archaeologie/forschung-1/projekte/priene-wohnen-in-einer-hellenistischen-stadt) supplies a further Hellenistic housing comparison. These sites do not prove a Neapolis plan, precise roof pitch, room use or construction detail in 278 BCE.

Three deliberately simple assemblies use open courtyards, perimeter walls, modest rectangular rooms and shallow terracotta roofs. One has a plain post-supported court-side porch. There are no Imperial Roman atria, domes, triumphal structures, medieval half-timber elevations or fantasy landmarks. Plaster, tiles and timber are interpretive material choices. The modern photographic textures are approximations, not ancient material evidence. Geographic position, settlement identity, archaeological research records and ownership remain untouched. Campaign footprints remain schematic and enlarged for readability; this prototype is not an excavated-city reconstruction.

## Existing architecture retained

`godot-prototype/settlement_population.gd` still owns population selection, deterministic placement, residency limits, terrain sampling, build budgeting and distance-based detail. Its sole new opt-in branch targets canonical `neapolis`; Roma, Catana and other settlements retain their existing paths. `neutral_settlement.gd` and the original house mesh remain unchanged.

`neapolis_housing_assets.gd` adapts those existing slot transforms and tints into three MultiMeshes, grouped by deterministic slot variant. No separate city renderer or per-wall runtime nodes are introduced. Each assembly is baked offline by `tools/neapolis-free-bake.gd` into one mesh with two or three material surfaces. Complete slot origins, orientation and horizontal footprint remain tied to the original layout. Height follows architectural proportions, with foundation skirts. The original renderer remains solely responsible for terrain sampling; the adapter does not resample heights or move slots. The original MultiMesh buffer is retained with zero visible instances in candidate mode and restored by rebuilding the same deterministic baseline when disabled.

Metres become kilometres during baking. Source pivots and native component extents are normalized by explicit transforms; assembly ground level is Y=0, with skirts below it. Source palette textures are replaced with the established campaign plaster and roof materials. All source components were inspected before integration.

| Variant | Near triangles | Far triangles | Material surfaces |
|---|---:|---:|---:|
| Courtyard with side rooms | 1,980 | 1,144 | 2 |
| Courtyard with post-supported porch | 2,220 | 1,384 | 3 |
| Enclosed courtyard compound | 2,478 | 1,472 | 2 |

The near meshes apply below 3 km camera distance, simplified meshes from 3 to 30 km, and the established proxy above 30 km. These thresholds are prototype choices requiring visual review. Far meshes remove small opening details while retaining their roof silhouette. They do not add distant decorative objects. New materials share the existing texture resources; no new texture images are acquired. The photographic plaster color was rejected after direct asset inspection because it read as dark masonry: the final local material uses plain warm plaster color with subtle existing normal/roughness maps. Zero-area source faces found by the mesh validator are removed during baking; counts above are the cleaned meshes. Geometry, draw submissions and actual GPU texture allocation must be evaluated separately rather than assuming MultiMesh makes the added geometry free.

## Review and verification

Open [REVIEW.html](REVIEW.html) for six matched 1920×1080 image pairs, the three-assembly inspection image, and seven paired samples from the recorded moving-camera test. The complete evidence is in `godot-prototype/evidence/neapolis-free/`. [verification.json](verification.json) records cameras, pixel differences, native checks and raw measurement comparisons. Regenerate it with `node docs/neapolis-free/verify.mjs`.

The baseline was captured from the existing working renderer before the prototype edits; its source snapshot is retained at `before/settlement_population.gd.txt`. Candidate captures restore the baseline camera position, basis, FOV and clipping values at strategic 60 km, regional 12 km, close 1.5 km, and oblique 0.8 km / pitch 32° / yaw 45°. Roma and Catana at 12 km are control views. Saved camera records match exactly in the independent verification script. Water simulation time is fixed for both captures; approved terrain, lighting and political rendering are retained. UI panels are hidden equally for image comparison.

Strategic Neapolis and Catana controls are pixel-identical. Roma's geometry and draw count are unchanged, but 23,104 pixels differ, with mean channel difference 0.005/255 and maximum 66/255. Its amplified difference image is retained as `roma-control-difference.png`; the cause of the sparse rendering differences is not proven, so Roma is not claimed pixel-identical. Native ownership state is unchanged. A native run at close range has no other resident population nodes, so its zero-other-node check alone does not validate every settlement; the two control captures and preserved source/data checks provide additional evidence.

### Actual geometry, texture allocation and timing

GPU capture: Godot 4.7.2, Vulkan Forward+, NVIDIA GeForce RTX 3060 Laptop GPU, 1920×1080. Each static view contains 180 uncapped submitted intervals after readiness. The harness submits explicit renders; these figures are diagnostics rather than sustained interactive FPS. Unrelated applications remained running, available RAM was low, and unchanged control GPU times also increased. Consequently the full timing difference cannot be causally assigned to the prototype.

| View | GPU mean before → after (ms) | Render CPU mean before → after (ms) | Whole-view draw submissions before → after |
|---|---:|---:|---:|
| Strategic | 7.82 → 8.46 | 0.411 → 0.443 | 99 → 99 |
| Regional | 9.84 → 11.69 | 0.665 → 0.683 | 443 → 456 |
| Close | 8.43 → 10.59 | 0.510 → 0.544 | 297 → 315 |
| Oblique | 10.27 → 14.37 | 0.549 → 0.678 | 348 → 366 |
| Roma control | 9.48 → 11.70 | 0.787 → 0.877 | 685 → 685 |
| Catana control | 10.40 → 12.90 | 0.626 → 0.823 | 502 → 502 |

At regional distance there are 40 instantiated compounds, distributed 12/16/12, using **53,536 triangles**. Close and oblique use the existing **45 slots**, distributed 13/18/14, using **100,392 triangles**. The three near meshes contain 6,678 unique triangles. All six baked mesh files total 716,838 bytes on disk; that is not a measured GPU geometry allocation. Seven main-pass material groups replace the original single surface group; whole-view draw numbers above also include shadows and other map geometry.

The five reused 1024² texture maps decode to **11 MiB** in the headless resource check. Actual viewport texture allocation increases by **14 MiB** once the candidate loads. This is consistent with expanding RGB resources to RGBA storage; the exact GPU formats were not independently queried. No new texture images are downloaded. Cached candidate textures remain resident when traveling to another settlement or toggling back to baseline; they are released with the world, avoiding repeated loading. The texture increment is reported in the controls as well as Neapolis.

The first synchronous attachment took 104.39 ms in a native diagnostic and was replaced with `ResourceLoader.load_threaded_request` plus frame yields within the existing asynchronous population build. Final full-map capture: first regional attachment used **1.992 ms active CPU**, longest active batch **0.961 ms**, asset wait **316.059 ms**, and **352.589 ms elapsed**. Near attachment used **0.400 ms active CPU**, longest batch **0.124 ms**, asset wait **0.124 ms**, and **32.246 ms elapsed** including deliberate frame yields. The existing baseline node remains until the replacement is ready. Native final test separately measured 0.850 ms active / 0.708 ms longest batch. These are adapter timings, not total scene loading costs or GPU upload guarantees. Uncollected threaded requests for unused detail levels are drained on adapter teardown.

### Moving-camera and LOD check

The harness records 120 frame-indexed transforms per mode, zooming from 36 to 0.8 km while yaw changes 0→45° and pitch 45→32°. Candidate frames restore the recorded baseline transforms; independent verification confirms all 120 matches. Screenshots are saved at frames 0/20/40/60/80/100/119. The path crosses the proxy and near/far thresholds and retains live streaming and population rebuilding.

Both modes exhibit severe hitches on this constrained run: baseline submitted mean/p95/max **82.33/843.92/1000.35 ms**; candidate **81.15/782.17/907.08 ms**. Mean GPU time is **11.71 → 12.33 ms**. Thirty candidate samples are not yet settled. This is evidence of unresolved moving-camera streaming behavior, not evidence of smooth gameplay or a successful pop-in fix. The 3 km geometry switch preserves roof forms; the 30 km return to the original tall proxy remains a visible scale/silhouette risk. The review samples make both transitions inspectable.

### Tests and preservation

- Full existing suite: **513 passed, 1 timed out** across 37 files / 514 tests. The timeout was the 460-file protected-source hash/research check at its default 5 s limit, with no assertion mismatch reported.
- Reran the affected existing test file with `--testTimeout=60000 --maxWorkers=1`: **21/21 passed** in 12.76 s, including the protected hashes, active identities and 687-record research copy. Test source and assertions were not changed. Logs: `tests.log` and `protected-rerun.log` here.
- `tools/neapolis-free-asset-check.gd`: all six baked meshes pass finite-coordinate, nondegenerate-face and kilometre-scale checks; texture resource sizes recorded in `asset-verification.json`.
- `tools/neapolis-free-validate.gd`: passes; native exit code 0. Checks the same deterministic original slot buffer/hash, all candidate instance origins drawn from the original origins, preserved political ownership, near/far selection, and restoration of the original node after disabling. Evidence: `native-verification.json`, `native-final.log`, `native-exit.txt`.
- Capture logs report all six static views and both motion paths completed, with no script error in the final run. Existing raw-image loading/export warnings remain; this task does not establish export readiness.

No settlement coordinates, faction setup, region geometry, historical records, vegetation sources, terrain materials, Roma models, Catana models or approved regional presentation files were changed by this prototype. Preexisting Anatolia and other workspace changes were retained. Only `settlement_population.gd` changes in the production renderer; the asset adapter, baked resources, provenance and audit tools are additive.

### Visual judgment and remaining issues

The experiment demonstrates that a few free CC0 modules can supply reusable Greek-inspired residential forms through the current batching system. Open courtyards, lower rooflines and varied room wings are visible improvements in architectural specificity over a single solid proxy. It does **not** establish a production-quality inhabited Neapolis.

1. At low camera pitch, some bases and shadows read as detached from the ground. Original population slot origins and height sampling are preserved. Terrain contact versus shadow bias needs a site-local diagnostic before adoption. An early separate corner-height adjustment disagreed with the existing placement and was removed; there is no second terrain-height system in the final adapter.
2. Roof photographs produce excessive contrast/aliasing in the close campaign images. Existing material imports are preserved; the resource check reports no mip chain in its CPU image data. Texture filtering and a restrained roof material require review before declaring the result polished.
3. Original spacing is intentionally unchanged, so this still reads as separated compounds on grass rather than dense urban blocks. Courts have no authored paving or street fabric, and there are no household props or new civic buildings. Those additions are outside this controlled comparison.
4. The baseline color tints are preserved, including some pink/green variation. Three reusable assemblies repeat visibly, and room scale remains a campaign readability abstraction.
5. Near/far selection is technically correct, but the original tall proxy transition and asynchronous replacement can remain perceptible. The motion run is too constrained to claim smoothness.
6. Comparative Greek house layouts do not authenticate a Neapolis neighborhood in 278 BCE. Roof intersections, opening details, plaster condition and precise household composition remain interpretive.

Recommendation: keep this opt-in candidate for inspection, retain the acquired source/license and current renderer integration, and decide whether these archetypes justify a second small Neapolis-only material/contact pass. Do not adopt the kit globally or present tests as visual acceptance.

Enable the isolated prototype with `--neapolis-residential-trial`; omit it for the comparison baseline. The regular campaign defaults to the existing buildings. This explicit reversible switch is confined to this experiment, not a new map mode.

### Recorded initial verification issue

The first candidate GPU capture failed at the existing `northern_italy_world.gd:77` Italy-ID image conversion with null memory allocations, before residential assets were attached. The failed log is retained at `godot-prototype/evidence/neapolis-free/candidate/errors.log`. The map's large existing startup memory requirement is a verification limitation; no global raster or terrain modifications are part of this task. Short hidden-window timings must not be presented as sustained gameplay FPS, particularly while unrelated applications are active.
