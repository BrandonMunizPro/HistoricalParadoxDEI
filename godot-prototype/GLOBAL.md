# Global campaign visual expansion

[Matching rendered comparisons](evidence/global-comparison.html) · [Complete measurements](evidence/global-comparison.json)

## Checkpoint coverage

**Visual acceptance:** A–D have implemented and inspected representative regional captures. E has the shared systems and captured previews, but its visual acceptance remains **partial**: the eastern mountain view still shows coarse/fine shading facets. The normal-blending extension does not fully resolve them. Do not describe the whole world as visually finished.

A: Greece/Balkans/Aegean; B: Anatolia/Levant; C: North African coast/Nile Valley/Delta; D: Iberia/Gaul; E: Mesopotamia/Iranian plateau/eastern coverage. All use the shared renderer, were captured at matching baseline cameras and exercised through headless navigation. The full existing bounds remain **12°W–75°E, 12–62°N**. Representative checkpoints are implemented; this is **not a claim that every location is individually polished or reaches the fine Italian DEM standard**.

## Shared implementation

- Italy's original detailed terrain, artwork, twelve tree variants, materials and high-resolution coastline lattice remain in use. The surrounding world now receives the same cross-scale ground textures, triplanar rock, slope/altitude layering, woodland ground cover and water treatment. Source geographic colour and smoothly blended environmental cues retain regional differences. No new environmental artwork was required.
- The 176 world meshes now use all **129×129 cached elevation samples**, instead of 48 mesh intervals. The **2,928,816 original heights** are preserved; no procedural elevation or extra exaggeration was introduced. This improves use of the existing DEM but does not create missing geographic detail. Existing source spacing is roughly 2–4 km per world sample, versus about 650–870 m in Italy's finer grids.
- A shared 128-pixels/degree land/inland-water exclusion lattice replaces the mismatched world sea/context mask combination outside Italy. Land and sea sample the same derivative, removing the broad pale coast gaps. This is nearest-source resampling (about 0.4–0.9 km per pixel), not a new coastline survey; some source-mask detail is lost. Italy retains its 512-pixels/degree lattice. The global shore-distance colour field is coarser and approximate, not bathymetry.
- Global woodland uses up to nine 1° spatial cells plus nine close 0.05° cells, reusing original instanced canopy meshes and native index LOD. Temperate lowlands favour broad crowns; colder/high terrain favours conifer forms; dry areas reduce cover and size. Italy retains its regional-tile batches. No whole-world tree population is loaded.
- The [environment configuration](data/global-environments.json) supplies broad, soft aridity biases for Hellenic scrub, the Anatolian and Iranian plateaus, Sahara, Arabia and interior Iberia. Existing modern colour/elevation cues still contribute. These are conservative art choices, **not reconstructed climate or vegetation data for 278 BCE**. Terrain heights, IDs and historical records do not depend on these choices.
- River-valley colour follows a derived influence field rasterized from existing source centrelines. The Nile and Mesopotamian river corridors were not moved. Nearby river ribbons now drape against resident world terrain; source river geometry remains unchanged. Width, floodplain colour and vegetation remain artistic estimates; no river beds or ancient delta reconstruction are claimed.
- CPU placement avoids redundant parent-height calculations when terrain is fully revealed. A **263-mesh native cache**, validated against source SHA-256 before use, avoids rebuilding mesh arrays repeatedly. Stale/missing entries fall back to the existing reader. Residency remains 12 detail meshes plus context and the Italian backdrop; no major streaming rewrite was made.
- The region picker and `run.ps1 -View` presets expose each checkpoint. The original Italian buttons and all 35 settlement selections remain available. Fixed lighting and atmosphere are retained for fair comparisons.

## Performance

RTX 3060 Laptop GPU, i7-11800H, approximately 16 GiB RAM; Godot 4.7.2 Forward+, 1920×1080. Short, refresh-limited desktop captures with uncontrolled background load. The legacy average excludes the first 90 frames and may include vegetation generation; settled-after statistics measure consecutive frames after pending terrain/scenery work finishes. They have no equivalent settled-only baseline, so do not treat them as a measured speedup.

| View | Legacy FPS before → after | p95 ms before → after | Settled after FPS | Peak RAM MiB before → after |
|---|---:|---:|---:|---:|
| [Greece](evidence/global-pairs/greece.png) | 136.1 → 142.8 | 13.8 → 7.7 | 144 | 1319.2 → 1190.7 |
| [Northern Balkans](evidence/global-pairs/balkans.png) | 141.1 → 141.7 | 9.4 → 7.9 | 144.2 | 1176.9 → 1188.6 |
| [Aegean islands](evidence/global-pairs/aegean.png) | 143.5 → 142.2 | 8.7 → 7.2 | 143.9 | 1316.6 → 1171.1 |
| [Anatolian interior](evidence/global-pairs/anatolia.png) | 140.6 → 142.8 | 9.3 → 7.6 | 144.1 | 1131 → 1190.8 |
| [Levant](evidence/global-pairs/levant.png) | 143 → 142.8 | 8.7 → 7.5 | 144.1 | 1113.7 → 1187.8 |
| [North African coast](evidence/global-pairs/africa.png) | 142.1 → 144 | 10.1 → 7.6 | 144.2 | 1368.1 → 1184.7 |
| [Nile Valley](evidence/global-pairs/egypt.png) | 143.1 → 141.1 | 9.4 → 7.3 | 144 | 1115.6 → 1174.9 |
| [Nile Delta](evidence/global-pairs/delta.png) | 142.8 → 141.4 | 8.9 → 7.3 | 144 | 1116 → 1172.4 |
| [Interior Iberia](evidence/global-pairs/iberia.png) | 143.7 → 142.8 | 9.2 → 7.7 | 144.1 | 1114.5 → 1179.3 |
| [Gaul](evidence/global-pairs/gaul.png) | 143 → 135.5 | 9.6 → 8.3 | 137.6 | 1315.8 → 1177.9 |
| [Mesopotamia](evidence/global-pairs/mesopotamia.png) | 142.9 → 138.7 | 9.4 → 7.6 | 143.9 | 1115.3 → 1175.8 |
| [Iranian plateau](evidence/global-pairs/persia.png) | 142.8 → 142.5 | 9.1 → 7.5 | 143.9 | 1114.6 → 1174.3 |
| [Eastern campaign coverage](evidence/global-pairs/east.png) | 143.6 → 137.7 | 8.7 → 7.6 | 143.9 | 1146.3 → 1169.6 |
| [Campaign overview](evidence/global-pairs/overview.png) | 143.9 → 143.9 | 9.7 → 7.8 | 143.9 | 1401.9 → 1176.5 |

| View | Setup ms before → after | Largest observed startup/streaming frame ms before → after | Largest detail tile load ms before → after | VRAM MiB before → after |
|---|---:|---:|---:|---:|
| Greece | 2655 → 2553 | 1097.8 → 196.7 | 173.2 → 12.2 | 848.8 → 988.1 |
| Northern Balkans | 2658 → 2520 | 1095.6 → 150 | 168 → 13.3 | 849.3 → 989.2 |
| Aegean islands | 2444 → 2336 | 1053.5 → 149.6 | 70 → 14.1 | 849.3 → 987.9 |
| Anatolian interior | 2368 → 2353 | 1062.8 → 150 | 72.1 → 13.1 | 849.3 → 988.5 |
| Levant | 2380 → 2329 | 1086.2 → 150 | 69.6 → 13.6 | 849.3 → 988.1 |
| North African coast | 2409 → 2344 | 1198 → 150 | 28.6 → 15.4 | 843.2 → 988.5 |
| Nile Valley | 2369 → 2322 | 1072 → 150 | 65.7 → 11.9 | 849.3 → 988.1 |
| Nile Delta | 2396 → 2364 | 1070.4 → 145.1 | 67.8 → 10.6 | 849.3 → 988 |
| Interior Iberia | 2445 → 2381 | 1127.3 → 143.1 | 72.1 → 13.8 | 849.3 → 988.5 |
| Gaul | 2427 → 2408 | 1108.8 → 147 | 73.1 → 16.7 | 849.3 → 989.3 |
| Mesopotamia | 2417 → 2415 | 1042.3 → 150 | 70.3 → 12.7 | 849.3 → 988.1 |
| Iranian plateau | 2541 → 2402 | 1079.4 → 150 | 71.6 → 13.1 | 849.3 → 987.9 |
| Eastern campaign coverage | 2378 → 2391 | 1250.6 → 177.1 | 68 → 12.8 | 849.3 → 987.9 |
| Campaign overview | 2444 → 2468 | 144.6 → 150 | — → — | 828.8 → 977.8 |

The new masks and denser meshes increase video memory. Native caching reduces repeated mesh preparation, but PNG decoding, initial renderer setup and synchronous resource uploads still occur. A small tile-load time does not establish hitch-free camera navigation. These results do not constitute a sustained world-traversal performance test. The native cache adds about 115.6 MiB on disk, in addition to disposable global mesh/mask derivatives. Cache generation is an offline step.

## Geographic validation and preservation

- [Protected source hashes](evidence/final-integrity.json): 460 files unchanged, 35 exact approved settlement identities/coordinates and 687 byte-identical research records. No Three.js, TypeScript simulation, provenance or persistence contracts were changed. No commit or push was made.
- [Global source checks](evidence/global-geography-validation.json): all 176 cached world grids, 2,928,816 height samples, 2,992 source coastline probes and unchanged source hashes. Source edge heights coincide.
- [Runtime validation](evidence/global-navigation-validation.json): all global presets plus overview and Italian regression views; bounded mesh/vegetation residency, stable markers, source triangle placement, shared world edges and all 35 selections. These tests validate function and integrity, not aesthetic quality.

## Remaining limitations

The global systems are expanded, but fine regional art development remains incomplete everywhere. World DEMs are coarser than Italy, limiting rugged mountain silhouettes. Woodland suitability still produces synthetic patches; trees remain generic interpretive assets, with no dedicated palms or region-specific shrub art. Rivers/lakes lack surveyed banks and detailed shading; ancient Nile Delta branches and palaeocoastlines have not been reconstructed. Some inland-water and coarse/fine-normal seams remain visible. Broad overview uses existing geographic macro colour rather than individual trees, preserving strategic readability. No new approved settlements outside the original set were invented.

## Reproduce

Run `.\godot-prototype\run.ps1 -View greece` (also balkans, aegean, anatolia, levant, africa, egypt, delta, iberia, gaul, mesopotamia, persia, east, overview). All are in the in-game region picker.

Rebuild presentation derivatives with `node godot-prototype/tools/global-build.mjs`, then run Godot headlessly with `--script res://tools/native-mesh-build.gd`. Check sources with `global-verify.mjs` and `check-integrity.mjs`; exercise navigation through `global-validate.gd`. Recreate after captures with `tools/regional-capture.ps1 -Stage global-after -Views ...` and regenerate this report with `node godot-prototype/tools/global-report.mjs`. Preserve the captured global-before folder. The capture path explicitly renders a final frame so a hidden native window cannot leave it waiting indefinitely for a draw signal.

## Final acceptance notes

World tiles now reuse the Italian fine/parent normal channel approach, with cross-source edge derivatives and context parent normals. Elevation is unchanged. Remaining eastern facets need further diagnosis of coarse/fine geometry, normal and material transitions; they are not all proven to be source-resolution limits.

The final set includes **14 matching global pairs** and **two Italian regression pairs**: [Alps](evidence/global-pairs/italy-alps.png) and [Catana](evidence/global-pairs/italy-catana.png). Capture viewports are fixed at 1920×1080; all file dimensions and camera pairs are checked.

An earlier capture set showed substantial regressions in Greece, the Balkans and Iberia; see the preserved earlier sample. The final table records a separate run after the sea-clipping correction. Settled performance in these short runs remains above 60 FPS, but background load was uncontrolled, and increased mesh/material work has not been isolated from it. Global detail loads can exceed 16.7 ms. The lower final warm-loading maxima do **not** establish a cold-start fix: an intermediate overview capture after a shader change recorded a roughly 1.62 s startup/streaming frame ([retained observation](evidence/global-loading-observations.json); its raw intermediate capture was superseded). Full cache-cold and sustained traversal benchmarking remains unfinished.

The Nile material was validated using a diagnostic capture and 484 existing source vertices. Fertile colour is applied after low-elevation shore tint and also uses existing geographic colour cues for broader lowlands. This restores the corridor/Delta contrast without drawing new rivers; it remains an interpretive presentation of modern source geometry.

Strategic map masks now blend to the original context masks between 2,800 and 4,000 km camera distance. The global sea explicitly discards all land and inland-water exclusions; relying on depth alone produced visible sea/terrain overlap in low-lying areas at continental zoom. The verified final overview removes that regression while keeping the regional mask alignment.

Source height preservation uses the existing renderer's conventions: raw source elevations remain intact, while display vertices retain the existing 1.5 scale and minimum 0.001 km terrain height. This is not a new bathymetric or below-sea-level terrain implementation.

[Earlier performance sample](evidence/global-performance-earlier.json) preserves the previous comparison, including approximately 78 FPS settled in the Balkans. The final table is a separate capture pass after the sea-clipping fix. Run-to-run variation and cold shader/cache costs remain risks; a good final average does not invalidate those earlier observations.

World detail meshes still keep terrain shadow casting disabled; the Italian regional terrain retains its existing shadows. Global relief uses the shared directional lighting, normals and materials. This is another presentation gap from the Italian baseline: selective close regional terrain shadows should be profiled before enabling them broadly. Finer source terrain, authored regional vegetation and a resolved eastern detail transition remain unfinished visual work.
