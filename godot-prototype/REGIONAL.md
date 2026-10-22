# Italia and Sicily: regional rendering checkpoint

Working changes are limited to the Godot prototype. No commit or push was made. [Open the before/after image slider](evidence/regional-comparison.html).

## Result and checkpoint status

The shared renderer now covers Italia and Sicily with a continuous regional surface, common land/water boundaries, geography-dependent materials, and bounded regional/local vegetation. The screenshots demonstrate clearer woodland/lowland/rock transitions and shore colour across multiple landscapes. This remains a prototype: it does **not** achieve the intended commercial environmental quality.

| Checkpoint | Implemented and inspected | Remaining visual limit |
|---|---|---|
| A: Northern Italy | Alps/Po captures, repaired large open terrain boundary, rocky highlands, lowland palette, source-based lake levels | Northern/western Alpine arc lacks fine local elevation; still rounded |
| B: Central Italy | Apennine spine, hill/woodland/lowland material separation, Adriatic coast | Fine ravines/cliffs unresolved by 650–870 m grid |
| C: Southern Italy | Calabrian relief, wooded hills, dry lowlands, Tyrrhenian/Ionian shore transitions | Generic vegetation and generalized rivers |
| D: Sicily | Regional integration, volcanic Etna palette, dense local vegetation cells, Catana anchors and close view | Smooth Etna summit; simple settlement/vegetation art; close ground still needs polish |

All four functional checkpoints were exercised and captured in order. Their **visual targets remain partial**. Source/code snapshots were preserved under [checkpoints](evidence/checkpoints/), with final views under [regional-after](evidence/regional-after/).

## Underlying problems addressed

- Fine terrain previously blended directly into the coarse continental mesh. A separate 449×449 regional backdrop now samples the existing finest available geographic grids, with at most 12 finer resident tiles. Parent heights use float UV data; parent and fine normals blend coherently. Mesh heights and the 1.5 display exaggeration remain unchanged at source. Residual shading changes at the fine-data boundary can still be seen.
- Placement used bilinear height interpolation while rendered geometry uses triangles. Trees and regional rivers now sample the active mesh triangles and their vertex morphing. Duplicate coarse river lines are hidden in regional views. This fixes a placement mismatch; it does not manufacture surveyed river beds.
- The fine sea coastline previously existed only around eastern Sicily. Land and sea now share a 7,169×7,169 lattice assembled from the existing coastline masks. A derived shoreline-distance field supplies coastal colour and restrained foam across the whole region. It is **not bathymetry**. Lake levels within available regional coverage are estimated from the finer existing DEM instead of only the world context.
- One hard material-distance switch and one repeated material palette flattened regional differences. Continuous zoom weights, cross-scale texture sampling, elevation/slope/colour suitability, rocky/alpine/volcanic layers and woodland patches now share one shader. Suitability is artistic and informed by modern geographic inputs, not verified ancient ecology.
- Vegetation was Sicily-only and used a single canopy silhouette. Three original branching/conifer/cypress-like meshes now use deterministic regional batches plus up to nine dense local cells. Geometry fades by distance; the ground's woodland colour supplies the distant layer. These are interpretive silhouettes, not authenticated species distributions.
- Unchanged terrain neighbourhoods unnecessarily reset coverage uniforms. Those updates now occur when the neighbourhood changes. Regional tiles also reuse the shared land image, avoiding redundant texture uploads/readbacks. Loading remains partly synchronous.
- Lighting, water glare, shadow range and local ambient occlusion are coordinated with campaign scale. Close flat terrain stops casting terrain self-shadows, while settlement geometry still casts shadows. The camera presets support the Alps, Po Valley, Apennines, south, Sicily and the original overview without changing approved horizontal anchors.

The principles follow the requested references: separate geographic truth from presentation, use coherent geographic colour/material layers, instance regional scenery, and coordinate detail with strategic zoom. All new geometry/shaders are original; no proprietary reference assets were used. No new datasets, assets, dependencies or engines were downloaded.

## Matching rendered evidence and performance

Camera eye position, distance, pitch, yaw, FOV and 1080p resolution are verified by the report generator. Interfaces differ in size; the landscape camera does not.

| View | Before | After | Before avg FPS | After avg FPS | After p95 ms | Runtime peak MiB |
|---|---|---|---:|---:|---:|---:|
| Alps and northern Italy | [PNG](evidence/regional-before/godot-alps.png) | [PNG](evidence/regional-after/godot-alps.png) | 141.9 | 143.2 | 8 | 1360.9 |
| Po Valley | [PNG](evidence/regional-before/godot-po.png) | [PNG](evidence/regional-after/godot-po.png) | 142.6 | 143 | 7.8 | 1360.3 |
| Central Apennines | [PNG](evidence/regional-before/godot-apennines.png) | [PNG](evidence/regional-after/godot-apennines.png) | 136.7 | 140.3 | 8.5 | 1358.1 |
| Southern Italy | [PNG](evidence/regional-before/godot-south.png) | [PNG](evidence/regional-after/godot-south.png) | 81.9 | 143.5 | 7.7 | 1363.1 |
| Sicily regional | [PNG](evidence/regional-before/godot-sicily.png) | [PNG](evidence/regional-after/godot-sicily.png) | 81.2 | 143.4 | 7.4 | 1356.5 |
| Etna campaign view | [PNG](evidence/regional-before/godot-etna.png) | [PNG](evidence/regional-after/godot-etna.png) | 123.8 | 138.8 | 9 | 1524.4 |
| Catana close view | [PNG](evidence/regional-before/godot-catana.png) | [PNG](evidence/regional-after/godot-catana.png) | 113.9 | 142.2 | 8.3 | 1416 |
| Campaign overview | [PNG](evidence/regional-before/godot-overview.png) | [PNG](evidence/regional-after/godot-overview.png) | 141.3 | 143.9 | 7.6 | 1337.6 |

Hardware: RTX 3060 Laptop GPU, i7-11800H, approximately 16 GiB RAM. Godot 4.7.2 Forward+. Wall-clock frame intervals are measured, excluding the first 90 frames; final samples per view are in [regional-comparison.json](evidence/regional-comparison.json). These are short desktop runs near a 144 Hz cadence, not isolated GPU benchmarks or a long navigation test. Background GPU load was not controlled. Before/after sample durations differ. Do not interpret capped averages as proof of spare GPU capacity.

| View | Scene setup ms | Largest startup/streaming frame ms | Largest detail tile load ms | Reported video memory MiB |
|---|---:|---:|---:|---:|
| Alps and northern Italy | 2386 | 1268.4 | 26.8 | 810.1 |
| Po Valley | 2221 | 1345.5 | 24.7 | 809.5 |
| Central Apennines | 2250 | 1175.4 | 16.9 | 809.5 |
| Southern Italy | 2200 | 1071.4 | 15.9 | 809.6 |
| Sicily regional | 2198 | 1219 | 16.7 | 809 |
| Etna campaign view | 2428 | 1490.1 | 27.7 | 810 |
| Catana close view | 2402 | 1089 | 15.3 | 862.1 |
| Campaign overview | 2286 | 150 | — | 794.9 |

Average steady-view performance exceeds the 60 FPS target in these runs. Setup and some loading/frame spikes still exceed 16.7 ms, so continuous smooth 60 FPS is **not established**. RAM is the sum of the launched runtime and console working sets sampled every 200 ms; other Godot sessions are excluded. Baseline RAM collection included all Godot processes and is not presented as a comparable memory baseline. GPU memory is the engine-reported allocation counter.

## Geographic validation and limits

- [Source preservation](evidence/final-integrity.json): 460 protected files unchanged, 35 selectable settlement identities and exact canonical coordinates, 687 byte-identical research records. The TypeScript simulation and Three.js viewer were not edited.
- [Regional source checks](evidence/regional-geography-validation.json): 1,414,485 imported elevation samples preserved and 10,285 coastline probes match the original derived masks. New parent heights/normals are finite.
- [Runtime checks](evidence/regional-navigation-validation.json): overview through all subregions and Catana, bounded tile/scenery residency, stable horizontal markers, all 35 settlement selections, shared edge alignment and placement against actual mesh triangles. These checks complement the screenshots; they do not establish visual quality by themselves.
- The full Copernicus regional set is 85 grids at roughly 650–870 m spacing. It stops at **46°N** and begins at **9°E**. The rest of the Alpine arc uses the already-cached world data at roughly 3–4 km spacing. No detailed Alpine cliff/valley data is locally available in the inspected cache. The old continental context is coarser still.
- Existing finer 39–52 m city windows exist around Roma, Capua, Neapolis and Norba. They do not cover the Alps, Gran Sasso, Sila or Etna; they were not substituted as unrelated mountain data. Sharper mountain landforms require better geographic input in those places. Procedural detail here affects appearance, not elevation.
- Generic trees, estimated lake levels, visual river widths, modern reservoirs/coastlines and generic Catana buildings do not establish ancient landscape or settlement certainty. Rivers still lack carved beds and surveyed banks. Close-ground material artifacts, shore edges, residual LOD shading seams and simplified tree silhouettes remain work to finish.

## Run and regenerate

Use the existing launcher, for example ` .\godot-prototype\run.ps1 -View alps ` or `-View apennines`, `-View south`, `-View sicily`. All regions are also available in the native viewer's buttons.

Derived regional assets are reproduced with `node godot-prototype/tools/regional-build.mjs`; `--terrain-only` reuses the generated shoreline atlas. Check them with `regional-verify.mjs` and `check-integrity.mjs`. Run `tools/regional-validate.gd` through Godot headlessly for the navigation/placement exercise. Capture using `tools/regional-capture.ps1 -Stage after`; generate this report/slider using `node godot-prototype/tools/regional-report.mjs`.

The next visual gate should be better terrain input for the Alpine arc and a small set of higher-quality original/licensed vegetation and ground materials. Further palette tweaks cannot recover missing mountain geometry. Keep the current regional implementation as a working, reviewable checkpoint rather than declaring the region finished.
