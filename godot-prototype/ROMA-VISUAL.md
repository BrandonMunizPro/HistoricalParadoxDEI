# Roma visual prototype — review candidate

27 October 2026 local time (captures dated 28 October UTC). No commits or pushes. No rollout to other settlements. **Artistic acceptance is reserved for independent review. This is not a claim of Rome II/DEI visual parity.**

[Matched screenshot gallery](evidence/roma/comparison.html) · [Measurements](evidence/roma/MEASUREMENTS.md) · [Flat asset manifest](evidence/roma/asset-manifest.json) · [Licensing and historical references](assets/roma/PROVENANCE.md).

## Visible changes

Roma alone now replaces the former repeated detached-house cluster with **121 illustrative structures using seven geometrically distinct archetypes**: courtyard-wing house, longhouse with porch, three-front shop row, L-shaped workshop with kiln, raised storehouse, two peripheral round vernacular structures, and a podium temple. Close assets include recessed door openings, lintels, window details, timber posts, eaves, ridge caps, imbrices and terracotta antefix rhythm. The temple has a deep columned pronaos, three cellae and frontal stair rather than an Imperial monument.

Six connected, irregular approach/street routes shape the building fronts. Intersection and civic-space exclusions replace the first rejected concentric-ring trial. A broad open public space, smaller worn yards, courtyard interiors and a modest tuff boundary fragment give the settlement a structure beyond roof scattering. These routes are **local illustrative art**, not new canonical roads or a researched reconstruction of the Forum and street network.

Two cohesive CC0 PBR sets supply weathered wall and clay-roof color/normal/roughness maps. Only six 1K JPG maps were downloaded, with publisher MD5 checks. Ground uses the existing licensed soil source, with a new Roma-local material and soft-edged yard/path overlays. Existing source terrain, rivers, water shaders and surrounding vegetation are preserved. No terrain flattening or invented seven-hill heightmap was introduced.

Building floors sample the existing rendered terrain at their centre and surrounding footprint corners. Foundation skirts fit the archetype footprint and rotation rather than the initially rejected generic square plinths. Coarse and detailed forms retain their layout across zoom; strategic rendering uses shared coarse meshes without close window, roof-rib or beam geometry. Campaign display scale grows continuously and is capped at 2.3×. This is a readability convention, not historical urban extent.

## Rendering problems found in actual output

I inspected the running Godot screenshots, including both 0.42 km architecture views, 1.2 km east/west views, 7.2 km regional view and 45 km strategic view. The previous Roma asset was clearly a repeated gabled-house grid on continuous grass. The new kit makes roofs, courtyards, streets and the landmark distinguishable, but still has visible procedural repetition and modest facade detail.

The initial new public-space surface appeared black. A shadow-disabled diagnostic proved it was **not a cast shadow**: the public-space triangles had the opposite winding to the path ribbons, so their back faces shaded incorrectly in the two-sided material. Winding was corrected; the final plaza is lit and textured. Tangents are generated for the ground normal response. The diagnostic and failed previews are retained separately, not passed off as final evidence.

The inherited **35 m SSAO radius** is poorly matched to small architecture. A smoothly weighted Roma-only rule reduces it to 1.8 m near the city, lowers intensity and retains some indirect light in cast shadows. It restores the original values away from Roma and at broader zoom. A soft angular-sun trial was rejected because it introduced stippled shadows; final angular distance remains zero. Terrain-cast shadows remain disabled, preserving the earlier wedge-artifact fix. Roma's oversized close label is reduced without changing other labels, selection or search.

## Historical basis and uncertainty

Reviewed the existing `docs/research/r16-rome-architecture-278bce.md`, architecture evidence/anachronism register and component catalog. Their early Republican tuff/timber, pitched terracotta, courtyard, Tuscan temple and unmonumental defence guardrails informed the kit. The catalog is a proposal, not a gameplay implementation mandate; no development levels or simulation state were introduced.

The Capitoline Museums and Roma archaeological authority support the presence/type of an archaic podium temple and fourth-century tuff defences. **Exact building placement, wall-fragment alignment, street widths, dwelling mix, kiln/storehouse forms, roof weathering and density are reconstructed/speculative art.** Modern photographic materials are surface references, not excavated 278 BCE specimens. The two peripheral round structures are particularly uncertain for the urban mix and should be reviewed. The temple is a schematic Tuscan-form landmark; it is not a precise archaeological model or a claim about the authentic Capitoline coordinates relative to the preserved settlement anchor.

No marble forum, Imperial basilica, Colosseum, monumental aqueduct arcade, triumphal arch, medieval tower or Aurelian circuit was added. The displayed city is compact and symbolic; its 121 structures are neither the complete historical city nor a population estimate.

For visual comparison I revisited the prior reference notes in `ART-DIRECTION.md` / `COAST-POLISH-V2.md`, and actually inspected the owner-provided `Screenshot 2026-10-27 140402.png`. The reference's tightly integrated urban fabric, coherent wooded foothills and authored landforms remain substantially richer. No commercial game asset, shader, texture or screenshot was imported into the project. Installation-file observations were inherited research; this pass did not re-extract game files.

## Measured performance and correction

The first same-path test failed: the prototype produced recurring **187–211 ms warmed frames** and a 10.8 FPS 1% low. The neutral control had no comparable spikes. Repeated Roma geometry generation was being triggered by the hidden generic house-count LOD, and the new yard/foundation loops included unbudgeted terrain queries.

The correction keeps Roma's hidden neutral topology stable, budgets the surface loops, caches sampled heights against the resident-terrain signature and reuses the terrain-conforming path/yard/foundation/wall meshes across architectural LOD changes. Height cache has a 30,000-entry reset guard; it does not load more terrain. Texture preparation yields between maps. Existing terrain/scenery residency limits remain intact. All archetypes are shared and instanced in batches; no per-building scenes or per-frame geometry animation were introduced.

Final same-source, warmed navigation on the RTX 3060 Laptop at 1920×1080:

| Metric | Original-neutral control | Roma prototype |
| --- | ---: | ---: |
| Mean navigation FPS | 110.5 | 100.8 |
| p95 / p99 frame ms | 10.916 / 12.300 | 11.925 / 14.257 |
| 1% low FPS | 77.6 | 64.8 |
| Maximum warmed frame | 14.082 ms | 20.268 ms |
| Synchronous startup | 3,196 ms | 3,376 ms |
| First readiness maximum frame | 89.953 ms | 130.410 ms |
| Initial readiness, including streaming/stable samples | 9,185 ms | 9,496 ms |
| Sampled peak process working set | 1,383 MiB | 1,425 MiB |
| Godot tracked video allocations | 1,112 MiB | 1,143 MiB |

The approximately 9% mean-FPS regression and extra RAM/VRAM are real costs of the new art. The measured warmed path meets the stated 60 FPS / 45 FPS 1% low / no >100 ms movement-stall targets on this hardware and run; this is not a guarantee for all cameras or machines. Approaching 7.2 km took 8.712 s versus the neutral 7.096 s, including navigation and readiness sampling. Ready time remains a limitation even after the frame spikes were removed.

Initial preparation remains slower and contains a >100 ms frame. The old 4.10-second cold-render stall is **not certified fixed**: these launches used existing caches. Texture-preparation/build durations include yields. `maxChunkMs` in the Roma work counter can include a multi-frame group-creation span; it is **not an exclusive CPU-slice measurement**. Use raw process-frame intervals for the stall claims. `maxArchetypeMs` measures individual synchronous asset construction; the prototype navigation run recorded 66.0 ms on first preparation. Sampled RAM is a lower bound, and Godot's video counter is not total board VRAM. Full telemetry/caveats are in the measurement report.

## Evidence and validation

Primary baseline: `evidence/roma/before-source.json`, source `cd82ca5c45df14447a87b22f2eed9d1a987134a9fb3aa674141eb7686fdda909`.

Final: `evidence/roma/final3-source.json`, source `f655dbb942c5e8eff1cdcb1c1ee018b085b38ce45f64b3487e3dd945582663d0`, 2,663 inputs. HEAD remains `cbab45903ee34973b68fac5360ad17dbe24c90a6`.

The gallery contains five exact-camera matched pairs: 45 km strategic, 7.2 km intermediate, 1.2 km east, 1.2 km west and 1.8 km top-down layout. Two additional 0.42 km east/west images show details; they are explicitly after-only. Originals are unretouched 1920×1080 GPU output. Animated water phase is not synchronized. The first overlapping baseline launches and earlier prototypes are not primary performance evidence.

Validation artifacts:

* `evidence/roma/npm-final3.log`: `npm.cmd run validate` — typecheck, lint, **475 tests / 34 files**, TypeScript build and smoke passed.
* `evidence/roma/checks3.json`: **12/12 Godot checks**, including script parse, resolver collision tests, existing environment/habitat/canopy/river/water checks, all accepted settlement placement checks, actual production global/regional navigation, expected timeout-negative failure and the new Roma archetype/LOD/lighting restoration check.
* `evidence/roma/integrity.json`: **460 protected files unchanged, 35 identities/coordinates exact, 687 research records byte-preserved**, 660 existing browser references retained. Existing Three.js/TypeScript foundation is preserved.
* `evidence/roma/navigation3-neutral` / `navigation3-prototype`: same-source, same-goal repeatable warm-up/navigation, raw frame samples and memory/telemetry. The neutral diagnostic disables only Roma's new representation and local lighting.

No changes were made to The Rev. No faction, ownership, characters, diplomacy, population values, economy or campaign mechanics were added. The other accepted settlement representations and the prior uncommitted visual work are preserved.

## Exact implementation files

Modified existing file: `settlement_population.gd` — Roma-only integration, anchor-preserving invisible neutral audit node, correct LOD cache key, local lighting/label updates and a neutral-baseline diagnostic flag.

Added:

* `roma_architecture.gd` — original geometry, seven archetypes / fourteen coarse-close variants, PBR bindings and staged preparation.
* `roma_settlement.gd` — deterministic local street/plot composition, grounded batch placement, cached terrain-conforming surfaces, wall fragment and scoped lighting.
* `roma_ground.gdshader`, `roma_roof.gdshader` — local ground and photographed clay-roof response.
* `data/roma-presentation.json` — LOD/display-scale and local lighting settings.
* `data/roma-views.json` — capture-only cameras; added before the baseline snapshot, not merged into production presets.
* `tools/roma-profile.gd`, `tools/roma-validate.gd` — repeatable comparison path and focused GPU checks.
* `assets/roma/` — six named JPGs plus `manifest.json` and `PROVENANCE.md`.
* `ROMA-VISUAL.md`, `evidence/roma/` and the named `evidence/repair-20261026/roma-*` directories — report, scripts, source revisions, primary screenshots and retained diagnostic evidence.

Source-manifest delta lists **16 changed inputs** relative to this pass's baseline: one existing source file modified and fifteen inputs added. Capture profile is listed separately because it predates that baseline. Changes from previous visual passes remain in the working tree; they are not all changes from this assignment.

## Reproduce the review

Open `evidence/roma/comparison.html` locally. Click the originals at 100% and compare the same camera framing. Open `evidence/roma/MEASUREMENTS.md` alongside it. The final screenshot stages are `roma-final3`, `roma-final3-detail` and `roma-final3-architecture` under `evidence/repair-20261026/`.

From repository root, a fresh capture can use:

```powershell
& godot-prototype/tools/checkpoint-capture.ps1 -Stage roma-independent-review -Views @() -Profiles @('roma-east') -Scales @('strategic','regional') -ProfileFile data/roma-views.json -SourceManifest res://evidence/roma/final3-source.json
```

Choose a new stage name: the capture tool refuses to overwrite existing evidence. Re-run `npm.cmd run validate` for the normal suite; the exact GPU commands and expectations are recorded in `checks3.json`. For fresh same-path profiling, run `res://tools/roma-profile.gd` with a new `--output` folder and the final source manifest, with and without `--roma-neutral-baseline`. The existing evidence runner deliberately refuses to overwrite its folders.

## Remaining artistic weaknesses — independent decision required

* Architecture is more differentiated but remains a procedurally assembled kit, with repeated facade motifs, simple interiors and no finished sculptural ornament. The temple, workshops and two round structures need historical/art review.
* The urban fabric remains fairly sparse and street-front repetition is visible. Yard and path edges, foundation shoulders and the wall fragment can still look diagrammatic. It is not the dense, richly composed urban environment of the reference.
* The original local relief does not resolve Roma's hills convincingly. The terrain and Tiber still look source-limited; no source alteration was used to hide that problem. Ground macro-patterns remain visible.
* Surrounding trees and rocks retain the existing stylized meshes. This pass did not meet a photorealistic vegetation target or expand/rebuild that asset system. The lack of integrated tree/field composition is a major remaining quality gap.
* Strategic identity relies on the readable label and compact coarse silhouette. It is not a detailed city vista at 45 km. Architectural details change at LOD boundaries; full continuous geomorphing was not added.
* The final 7.2 km comparison exposes a readability tradeoff: the new, smaller architectural units are less individually legible than the oversized old houses. The visual gain is concentrated in the close views; the intermediate/strategic environment has not reached the requested cohesive, polished target. Passing performance and preservation checks does not resolve that artistic shortfall.
* Foundation checks sample representative footprint corners, not every roof overhang or terrain contact edge. Individual dense intersections and pads need further close inspection.

Submit these captures for Nexus, Pickle and owner review. **Do not expand the kit to other cities until approved.**
