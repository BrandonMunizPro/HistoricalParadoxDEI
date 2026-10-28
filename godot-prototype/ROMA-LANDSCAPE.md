# Roma — landscape integration review

This pass preserves the accepted **121-structure layout and all building archetype meshes**. It changes the setting, terrain presentation, road approaches, ground response, wall and vegetation distribution. No rollout to other cities, commits, pushes, gameplay or changes to The Rev.

[Before/after gallery](evidence/roma-landscape/comparison.html) · [Measurements](evidence/roma-landscape/MEASUREMENTS.md) · [Machine-readable results](evidence/roma-landscape/comparison.json).

## What changed

* **Connected approaches:** four paths continue directly from existing north, south, west and east street endpoints. Their worn ground treatment uses the same terrain paint as the streets and courtyard surrounds. They are illustrative access routes, not newly researched ancient highways or inter-city links.
* **Local relief:** the repository already contained `public/data/italy-terrain/local-roma.json`, a Copernicus-derived 129×129 height field with approximately 39–43 m sampling. Godot had been showing its kilometre-scale parent instead. One native-format derivative now enters the **existing** bounded tile loader near Roma below 15 km camera distance, replacing an outer tile. The limit remains context + twelve native tiles. The existing projection, height scale, material system, reveal morph and terrain sampler remain authoritative.
* **Continuous ground:** ten illustrative cultivated/fallow parcels, local yards and connected paths are painted into the existing opaque terrain material. A deterministic 1024² RGBA mask supplies land-use weights; original soil/normal materials supply detail. This avoids raised field meshes, floating paths and coplanar field intersections. Only a 3.3 km square around Roma receives the paint; alpha feathering and organic parcel edges blend with the original ground.
* **Joined wall:** the former detached long blocks are replaced with one terrain-following, gently battered tuff-style curtain fragment. Its capped ends and gate returns are coherent; the opening aligns with the eastern approach. Staggered masonry joints, mineral variation, roughness and fine normal response replace the plain dark strip. This is a local illustrative fragment, not the surveyed Servian circuit.
* **Vegetation transition:** 479 deterministic trees in twelve shared MultiMesh batches mix the existing broad-canopy, slender evergreen and broadleaf variants at varied sizes. Roots avoid fields, approaches and the wall. Native scenery thins progressively over the surrounding 1.6 km rather than ending at a hard clearing. Existing foliage distance fading and shadow limits are retained. No new tree library or large asset pack was introduced.
* **Ground contact:** building XY positions, headings, sizes and types stay fixed. On the finer terrain, buildings use centre-ground contact with existing footprint skirts instead of raising every floor to the highest oversized corner sample. This avoids the tall display plinths exposed by the first fine-terrain trial. Some uphill intersections still need detailed art review.

Lighting direction, exposure, atmosphere, Roma's existing scoped SSAO treatment and the disabled terrain-cast-shadow policy remain unchanged. The additional depth comes primarily from source-supported landforms, terrain normals, material response and object contact, rather than a global lighting recolour.

## Source integrity and historical interpretation

The original Roma height file is **not modified**. `data/roma-terrain.json` records its exact input SHA-256, source URL and derivative settings. A 5×5 Gaussian surface filter (sigma 1.2 source samples) reduces small DSM features before native-mesh conversion. This filter attenuates real small landforms as well as modern roof-scale spikes; it is not a validated ancient terrain reconstruction. The original values remain intact in the canonical file. Existing 1.5× display elevation and the 5.5% parent-edge blend are retained.

The modern DSM is not evidence that every rendered ridge or valley had this exact shape in 278 BCE. The fields, tree mix, road alignments and wall fragment remain **interpretive artwork**, separate from the 687 research records and approved-site data. No river, lake, settlement, mountain range, political state or archaeological identification was invented.

The mesh kit (`roma_architecture.gd`) and the original Roma view profiles are byte-identical to the prior checkpoint. The new GPU test independently compares every layout entry against the exported original coordinates, heading, size and archetype. Protected-file validation confirms 460 unchanged files, all 35 approved identities/coordinates exact and all 687 research records preserved. Three.js and TypeScript simulation sources are unchanged.

## Problems rejected during visual inspection

The initial field ribbons intersected the finer terrain and produced patchy triangles. They were removed from the production path in favour of terrain-material paint. The first fine-height trial also exposed excessive generic foundation heights; centre grounding reduced that problem without rearranging the settlement.

A new weak owner reference fixes an early RefCounted cycle that leaked cached rendering resources at shutdown. Primary evidence requires empty error logs; failed preview logs remain available separately.

Most importantly, the first wide view revealed **Tiber gaps** that the close city views did not show. The old river ribbon sampled too coarsely for the finer DEM and ignored higher banks. Only source segments crossing the Roma detail tile now use 20 m sampling and bank-aware clearance. Source centreline coordinates and width are retained. The new test checks river vertices over the fine tile against sampled terrain; the wider image was inspected again after the fix. This is a renderer compatibility correction, not a new river survey, carved riverbed or hydraulically level water simulation.

## Evidence

The gallery includes five pairs using the same geographic focus, distance, yaw, pitch and FOV: strategic 45 km, intermediate 7.2 km, east/west 1.2 km and layout 1.8 km. Two additional 0.42 km views show ground contact and material detail. Because camera height follows terrain, **absolute camera Y differs** where the new elevation is active; the gallery records that difference. Originals are unretouched running-Godot 1920×1080 PNGs, not concept art.

The prior reviewed Roma images (`roma-final3*`) are the before evidence, source `f655dbb942c5e8eff1cdcb1c1ee018b085b38ce45f64b3487e3dd945582663d0`.

Final source: `b63b6ed68d3b0b728a049376e6dcc604cd423e6018f8ac0167689e91acd706f4`, 2,676 inputs, in `evidence/roma-landscape/final2-source.json`. HEAD remains `cbab45903ee34973b68fac5360ad17dbe24c90a6`. Final image stages are `roma-landscape-final2`, `roma-landscape-final2-detail` and `roma-landscape-final2-architecture` under `evidence/repair-20261026/`. Earlier final/preview stages are superseded diagnostics, including the wide view that exposed the river regression.

## Performance and validation

The same-source control uses `--roma-landscape-baseline`: it retains the accepted Roma architecture while disabling this pass's terrain paint, local tile, wall replacement and vegetation transitions. Both runs use the same warm-up and camera-goal sequence, RTX 3060 Laptop, Forward+, 1920×1080, mailbox policy and 120 FPS cap.

| Final repeatable navigation | Previous landscape control | New landscape |
| --- | ---: | ---: |
| Mean FPS | 114.6 | 104.1 |
| 1% low FPS | 77.0 | 58.1 |
| p95 / p99 frame time | 9.789 / 11.625 ms | 12.689 / 15.036 ms |
| Maximum warmed frame | 15.370 ms | 32.356 ms |
| 7.2 km approach readiness | 6.393 s | 8.591 s |
| Sampled peak process working set | 1,432 MiB | 1,441 MiB |
| Godot tracked video allocations | 1,143 MiB | 1,148 MiB |

The mean-FPS cost is about 9%; readiness is about 2.2 seconds longer on the approach. Readiness includes motion, generation, terrain reveal and stable-frame sampling, not one blocking CPU operation. The earlier warmed 60 FPS / 45 FPS 1% low / no >100 ms movement-frame targets are met **on this measured path**, not guaranteed universally.

Synchronous startup measured 3.329 s for control and 3.465 s for the landscape. Initial-readiness maximum frames were 377.5 ms and 160.5 ms respectively. Launch order, caches and temperature differ; this does **not** establish that the old first-render hitch is fixed. It remains an explicit limitation. Endpoint GPU telemetry cannot exclude thermal variation. RAM is sampled rather than an exact peak; Godot's video counter is not whole-board VRAM.

The 3 ms generation budget is a target: API/material/mesh-upload spans can exceed it. Raw frame samples are the basis of the movement-stall claims. The 479 new trees use shared meshes; terrain paint adds no field/road draw calls, and surfaces/instances are cached by terrain residency.

Validation commands and logs are retained in `evidence/roma-landscape/`:

* `npm.cmd run validate`: lint, typecheck, **475 tests / 34 files**, build and smoke.
* `run-checks2.ps1` / `checks2.json`: **13 Godot checks**, including existing environment/water/settlement checks, production navigation, expected timeout failure, unchanged Roma layout, four approach joins, positive bounded vegetation, terrain-edge continuity and Tiber vertex clearance.
* `checkpoint-integrity.mjs`: all 460 protected files, 35 exact approved sites and 687 records preserved.
* `checkpoint-source.mjs verify .../final2-source.json`: frozen source check.

## Exact changed implementation files

Modified:

* `world.gd`: optional native Roma detail registration, bounded near-view selection, child/parent sampling and coverage, terrain-paint binding and local river sampling compatibility.
* `terrain.gdshader`: Roma-only field/path/yard material blend with filtered furrow detail.
* `regional_scenery.gd`: skip the nested detail tile as a new scenery cell, and blend native vegetation into Roma's local field/woodland rules.
* `roma_settlement.gd`: attach the landscape, preserve layout, use centre grounding and hide superseded raised road/field geometry and detached wall.
* `data/roma-presentation.json`: configurable local approaches, parcels, wall/gate, generation and vegetation settings.
* `tools/roma-profile.gd`: records the landscape control flag in performance evidence.

Added:

* `roma_landscape.gd`, `roma_stone.gdshader`.
* `tools/roma-terrain.mjs`, `tools/roma-landscape-mask.mjs`, `tools/roma-landscape-validate.gd`.
* `data/roma-landscape-layout.json`, `data/roma-landscape-mask.png`, `data/roma-terrain.json`.
* `data/roma-terrain/roma.bin`, `data/roma-terrain/roma.height`.
* `data/regional/roma-local.parent`, `.normal`, `.pnormal`.

These are nineteen changed source/derivative inputs relative to this pass's baseline. This report and `evidence/roma-landscape/` add the review package. Previous uncommitted visual work remains preserved and is not all attributed to this pass.

## Assets, reproduction and remaining limitations

No external assets were downloaded in this pass. The soil/normal maps reuse the prior verified CC0 Rocky Terrain 02 material (`assets/foundation/PROVENANCE.md`). The wall reuses the project's original limestone texture (`assets/slice/provenance.json`), with independently authored masonry shading. The mask, terrain derivatives and wall geometry are original project outputs. Existing vegetation and house meshes are reused; no proprietary game content is copied.

Open the local comparison gallery and measurements above. For a fresh close capture from repository root:

```powershell
& godot-prototype/tools/checkpoint-capture.ps1 -Stage roma-landscape-independent-review -Views @() -Profiles @('roma-east') -Scales @('strategic','regional') -ProfileFile data/roma-views.json -SourceManifest res://evidence/roma-landscape/final2-source.json
```

Use a new stage name; the capture tooling refuses to overwrite evidence. Existing navigation and approved-site search still locate Roma; local terrain enters below 15 km during normal navigation. No new camera mode or production preset was added.

The setting is more connected, but still uses stylized tree meshes and diagrammatic parcels. Cultivation is restrained rather than a richly authored agricultural landscape. Some foundation corners may intersect uphill ground; centre grounding is not full building-by-building terrace authoring. The existing Tiber remains an approximate source ribbon, without a surveyed riverbed or banks. The local detail boundary is height-tested, but its normal/shading transition and 15 km load threshold still deserve independent moving-camera inspection. Historical and global artistic quality are not self-certified.
