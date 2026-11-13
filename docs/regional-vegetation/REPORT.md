# Regional vegetation and close-detail loading — 12 November 2026

Textured vegetation now extends beyond the former central-Italy trial. Full close-cell placement density is unchanged. Original 24-tree regional grove populations are retained. Real native measurements reproduce the reported 45–60-second delay, and show a substantial reduction; this is **not** a claim of instant detailed vegetation everywhere.

## Root causes and changes

- Outside 11.5–13.5°E / 40.5–43.5°N, scenery fell back to solid faceted crowns despite an existing licensed, textured asset library. Extend this library through the regional renderer.
- Serial scenery scheduling put coarse regional jobs ahead of eight remaining close cells. Prepare the full close neighbourhood first and cancel obsolete coarse work safely when close detail is missing.
- Each candidate, height/footprint probe and climate lookup repeatedly checked unrelated regional surfaces. Reject out-of-bounds weights early and pass a padded intersecting-region subset through land, climate and scenery elevation sampling. Original scope functions and full-list samplers were compared directly.
- A 4 ms generation allowance per frame stretched CPU work across many seconds, especially in GPU-bound views. Use bounded 8–12 ms live slices, 12 ms under the existing initial cover. This trades some frame time for faster completion; it is not free work or a wholesale worker-thread terrain rewrite.
- Retain up to 36 close cells rather than expiring a recently visited cell after 12 seconds. Placement caches remain on disk. Only immutable MultiMesh buffer packing uses a worker; scene-tree/GPU changes remain on the main thread.
- Warm all 36 local/coarse atlas variants during the existing single startup cover. Camera movement never reopens it. No all-world tree allocation or touring camera is used.

## Artwork and materials

36 asset variants: the existing oak, pine, columnar evergreen, ash and scrub families, plus olive, Scots pine, umbrella-pine adaptation and date-palm geometry. The two newly sourced 3D models are [Innerscene olive, CC0](https://www.innerscene.com/tools/library/3d-parts/mature-olive-tree-bc261a43) and [Innerscene Scots pine, CC0](https://www.innerscene.com/tools/library/3d-parts/mature-scots-pine-tree-280307e1). Local models, atlas renders, native resources, SHA256 manifest and license/provenance notes are in [assets/regional-vegetation](../../godot-prototype/assets/regional-vegetation/ATTRIBUTION.md). Existing EZ-Tree leaf maps are **MIT**, and AmbientCG bark maps are **CC0**; their original notices remain intact.

Following [Godot 4.7 Making Trees](https://docs.godotengine.org/en/4.7/tutorials/shaders/making_trees.html), detailed authoring meshes use double-sided alpha-cut foliage, red vertex-colour wind masks, rooted trunks, transmission/backlighting and separate bark with normal/roughness maps. Campaign rendering retains dense MultiMesh directional impostors baked from 3D sources: eight azimuths, three elevations; new assets use 384-pixel frames. This is not full 3D mesh vegetation at every campaign instance. Close views blend four atlas samples; regional groves use one directional sample to retain full population affordably. Wind uses the shared, pausable/reduced-motion clock, never unrestricted shader TIME. Foliage greens were toned down after inspecting actual screenshots.

Mediterranean existing woodland can select olives and umbrella-pine shapes; northern conifers use Scots pine; northern columnar proxies no longer select the Mediterranean columnar kit. Existing warm/arid palm placements in North Africa/West Asia use the new detailed fronds. Date palms are not substituted into southern India. Selection uses climate/geography presentation families, independent of culture, ownership and playability.

The umbrella pine is an **artistic adaptation**, not a scanned or species-validated Pinus pinea. The columnar evergreen remains a narrowed generated pine, not a botanically validated cypress. The palm is original project-authored geometry. Southern Indian palms retain the existing fallback; South Asian hardwood, steppe and arid acacia-specific kits remain gaps. This work does not reconstruct woodland extent in 278 BCE.

## Actual native timing

RTX 3060 Laptop GPU, Forward+, 1920×1080, uncapped, forced submitted frames while the diagnostic window is hidden. Each route eases from 100 to 2 km over four seconds. Delay is measured from crossing 32 km until the focused cell / all nine close cells are uploaded **and revealed**, not just queued. Placement namespaces are empty for cold travel routes; OS/driver caches are not flushed. The opening area's placement cache was warm. Baseline preloads coast sources; final additionally runs the requested production startup asset preparation before travel. Opening focus is (13,42); the timed Italy view is (12.67,41.73), so it is a separate close-cell neighbourhood. These are single runs, not statistically controlled hardware benchmarks.

| View | Centre seconds, before / final | All nine seconds, before / final | Reduction, all nine |
|---|---:|---:|---:|
| italy-cold | 4.70 / 1.47 | 19.98 / 8.67 | 56.60% |
| gaul-cold | 9.81 / 2.43 | 52.38 / 11.34 | 78.36% |
| messina-cold | 13.14 / 2.03 | 52.02 / 9.79 | 81.18% |

- gaul-resident-revisit: centre 0.00 s, all nine 0.00 s; one initial loading screen total.
- italy-resident-revisit: centre 0.00 s, all nine 0.00 s; one initial loading screen total.
- baltic-cold: centre 2.41 s, all nine 9.30 s; one initial loading screen total.
- nile-cold: centre 2.98 s, all nine 15.16 s; one initial loading screen total.

Final production-startup preparation took 7.36 seconds inside the initial cover; total cover time was 35.72 seconds. It warmed 132 reusable vegetation/outcrop variants and two coastline material families. This startup timing includes a warm opening placement cache; a first launch can take longer. See [full measured trace](../../godot-prototype/evidence/close-vegetation/final-art/profile.json) and [baseline](../../godot-prototype/evidence/close-vegetation/before/profile.json).

| View | Streaming mean frame ms, before / final | p99 ms, before / final | Worst frame ms, before / final | Final draw calls at ready |
|---|---:|---:|---:|---:|
| italy-cold | 16.95 / 26.16 | 59.77 / 88.40 | 812.97 / 115.34 | 445 |
| gaul-cold | 24.27 / 22.20 | 40.82 / 65.11 | 240.04 / 68.67 | 415 |
| messina-cold | 29.34 / 29.16 | 55.32 / 64.84 | 199.31 / 195.59 | 274 |

These frame samples include zoom, terrain streaming and generation; **they are not steady-state FPS measurements**. Hitches remain. Baseline did not record draw calls, so no before/after draw-call claim is made. The isolated sampler/scheduler pass reduced Italy's measured cumulative generation CPU time from 7,411 to 3,503 ms before the artwork rollout; see optimized/profile.json. Full-density textured rendering and the larger cache increase graphics memory use.

| View | Godot-tracked static MiB, before / final | Godot-reported video MiB, before / final |
|---|---:|---:|
| italy-cold | 2614.52 / 2632.03 | 4581.26 / 4950.99 |
| gaul-cold | 2615.32 / 2636.79 | 4584.63 / 4955.35 |
| messina-cold | 2614.54 / 2639.96 | 4618.20 / 4989.91 |

These are Godot counters, not process working-set measurements. Later resident instance totals include cached invisible cells, so they must not be read as changed visible density. Exact native comparisons of all 27 baseline close-cell caches passed 135 checks of transforms, colours, LOD/slope customs and plant/rock counts.

## Verification

- npm test -- --maxWorkers=1: 38 files, 519 tests passed.
- npm run typecheck and npm run build (including smoke/postbuild): passed.
- Regional asset/source manifest: 16 new atlas variants, local GLB signatures and texture files validated.
- Sampler/asset validation: 2224 passed, including original-vs-optimized weights, full-list-vs-subset land/climate/height queries and rock exclusion.
- Native MultiMesh buffer regression: 5,403 passed.
- Native vegetation regression: 10 passed, including atlas geometry, reduced-motion image equality, camera orbit, local/coarse/political transitions and 35/687 geographic record checks.
- Startup regression: 86 passed, including one cover, all assets warmed, camera movement without reopening, restored starting camera and retained bounded cells.
- Actual GPU gallery comparison: frozen motion frames identical; advancing wind changes foliage. No native shader/script errors in the final runs.
- Protected-data hashing: 7671 files unchanged; six previously protected rendering scripts differ under an explicit allowlist. The historical baseline was not rewritten. Settlement coordinates, political/historical data and terrain source files are preserved.

Existing engine warnings remain: raw-image loads warn about future export packaging, headless Windows reports its root certificate-store error, and the startup validator reports two ObjectDB instances leaked at exit. Native rendering and checks pass. The archived October trial report generator rejects the accumulated project changes against its fixed two-file snapshot; it is not a current validation gate and was not used to rewrite that historical report. Export packaging and those pre-existing cleanup warnings are not fixed here.

## Actual screenshots inspected

[Gaul before](../../godot-prototype/evidence/close-vegetation/before/gaul-cold.png) / [Gaul final](../../godot-prototype/evidence/close-vegetation/final-art/gaul-cold.png); [Messina final](../../godot-prototype/evidence/close-vegetation/final-art/messina-cold.png); [Baltic final](../../godot-prototype/evidence/close-vegetation/final-art/baltic-cold.png); [Nile palms final](../../godot-prototype/evidence/close-vegetation/final-art/nile-cold.png); [asset gallery](../../godot-prototype/evidence/close-vegetation/asset-gallery.png). Screenshots are actual Godot renders, not mockups. Comparisons use the same camera routes. The Nile and Baltic have final captures but no measured old-art baseline in this task.

## Changed files

Production: godot-prototype/{world.gd,northern_italy_world.gd,eastern_surface.gd,environment_rules.gd,regional_scenery.gd,vegetation_quality.gd,vegetation_quality.gdshader,vegetation_impostor.gdshader,startup_preparation.gd}.

New artwork: godot-prototype/assets/regional-vegetation/ (two licensed source models, sixteen PNG/native atlas pairs, metadata, source notes and hash manifest).

New tools: godot-prototype/tools/{close-vegetation-profile.gd,close-placement-validate.gd,regional-vegetation-bake.gd,regional-vegetation-validate.gd,regional-vegetation-gallery.gd,regional-asset-manifest.mjs,regional-vegetation-report.mjs}. Updated tools: detail-data-validate.mjs, detail-boot-validate.gd, vegetation-quality-validate.gd. Evidence: godot-prototype/evidence/close-vegetation/ and refreshed startup/protected-data validation. Documentation: this report.

## Remaining limits

Uncached areas still take 8.67–15.16 seconds for the entire close neighbourhood in the measured routes, with the centre appearing sooner. The initial cover prepares shared assets and the opening area; it does not generate every tree on the entire world. Terrain upload/frame spikes remain. Dense campaign trees are optimized directional assets, so they do not have full geometric parallax at first-person distances. Additional regional botanical artwork and ground cover are future work. No claim of zero pop-in or complete ancient vegetation accuracy is made.
