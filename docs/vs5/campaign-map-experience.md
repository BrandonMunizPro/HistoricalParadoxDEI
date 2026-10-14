# Campaign camera and reusable regional detail

Implementation report, 14 October 2026. No commits or pushes performed. The authoritative TypeScript simulation, 23 researched settlement identities, development-snapshot visual selection and political read models remain intact.

## Run and reproduce

Use Node 22+, `npm install`, `npm run validate`, and `npm run map:build`. Start `npm run map:preview -- --port 4173`, then open http://127.0.0.1:4173. Run `npm run map:verify:controls` and `npm run map:verify:detail` against that production build. The latter includes the existing world, synthetic 700/1,000-marker and ecological validation before the new close-detail checks. `npm run map:details` regenerates the new data; it needs network access, downloads official source archives/COGs and reuses ignored local caches. The manifest records source URLs, hashes, output bounds, resolution and source gaps.

## Camera interaction

Click the canvas to focus it. WASD or arrow keys pan relative to the current camera orientation; Shift accelerates. Q/E rotate, R/F or V/C tilt, wheel or Z/X zoom, and Home returns to the full-world strategic view. Left drag orbits, right drag pans, and middle drag defaults to pan with an orbit option. Wheel zoom follows the terrain location under the cursor when the ray has a usable downward intersection; otherwise it zooms around the target. Dragging does not select settlements. Camera settings in the sidebar persist locally: movement, rotation and zoom sensitivity, edge scrolling, its margin/delay, middle-drag scheme, and cursor anchoring.

Motion uses exponential acceleration/deceleration and distance-dependent speed. Wheel targets ease rather than jump. UI focus, modified shortcuts, blur and page hiding stop map keyboard motion. Edge scrolling requires the pointer on the canvas, a focused window, a delay and no active drag. Targets are clamped through inverse projection to the existing geographic envelope; camera clearance samples the best resident terrain. Frame-delta clamping prevents a long loading frame becoming a giant pan step. This is a practical terrain-aware campaign camera, not collision navigation through buildings.

The [official Rome II manual](https://cdn.akamai.steamstatic.com/steam/apps/214950/manuals/RTW2EE_PC_MANUAL_EN.pdf), camera table on PDF page 10, supports WASD, Q/E, Z/X and V/C conventions. Its Home/End actions differ from this implementation: our Home intentionally resets strategic view. The [Total War Academy campaign guide](https://academy.totalwar.com/campaign-keyboard-and-mouse-controls/) supports the general middle-drag/pan and wheel conventions, but is not proof of every Rome II campaign binding. Configurable edge delay, cursor anchoring, damping, R/F aliases and middle-drag choices are our design decisions, not claims of exact Rome II replication.

## Geographic detail

The world stays one scene in its existing -12 to 75 longitude, 12 to 62 latitude envelope. New physical sampling scopes are Greece/Aegean **21-28 E, 35-41 N**, and Egypt **29-34 E, 24-32 N**. There are 80 sourced land/intersecting one-degree tiles, each a 129-square elevation lattice (roughly 650-870 m spacing), plus two 0.0625-degree windows at **22.8 E, 37.56 N** and **32.57 E, 25.74 N**, each 129-square (roughly 42-55 m spacing). These diagnostic coordinates are not new settlement records. Sea-only cells need no DEM. The manifest reports no source gaps in these scopes.

Elevation is [Copernicus GLO-30](https://registry.opendata.aws/copernicus-dem/), WGS84 horizontal and EGM2008 metres. It is a modern digital surface model, including vegetation/infrastructure, not bare-earth or reconstructed ancient topography. Source COGs are bilinearly sampled, reconstructed onto common tile vertices and shared edges reconciled deterministically. Existing AEQD projection, coordinates and presentation relief scaling remain unchanged.

New scopes use the **full-resolution GSHHG 2.3.7 L1** land polygons rather than the world's reduced high-resolution generalization. Raster coast masks have 513 samples per edge; that sampling does not confer new source accuracy. [GSHHG/WDBII](https://www.soest.hawaii.edu/pwessel/gshhg/) supplies additional L3/L4 river geometry. L5 intermittent channels are recorded in the generated source file but excluded from blue-water rendering; canals L8-L10 are not imported. No roads, borders, ownership or historical river alignments are invented. River vertices in these scopes are re-draped when resident DEMs change.

Source attribution and Copernicus terms plus GSHHG LGPL notices accompany the generated files. These datasets are not presented as public-domain assets. Source notices, URLs and hashes are in `public/data/regional-details/`.

## Streaming and transition behavior

The existing global context and world tiles remain the strategic surface. Below 700 km camera distance, configured detail-area families become eligible; Italy retains its own existing family. Resident detail meshes remain capped at **12**, with **3** concurrent requests, eviction and the existing source-resolution LOD/reveal logic. Close windows use the same tile renderer and data format as Italy. New regions require source/configuration imports, not separate scenes or custom regional renderers.

Fine-window aprons blend to the actual parent triangle surface, including normals, instead of a bilinear approximation that produced rectangular height steps. Sampling chooses the smallest resident geographic footprint, avoiding arrival-order errors in terrain clearance and river height. Existing coarse-context edge morphing is retained. The finite windows remain observable in source-detail density; this is not unlimited high-resolution coverage or a claim that all LOD transitions are imperceptible.

Modern Beck climate and Natural Earth ecological materials from the prior milestone continue to provide region-appropriate arid/vegetated identity. This change exposes more actual terrain relief and coastline shape, with fewer disconnected fine-patch edges. It does not add a new world vegetation library, historically researched crops or premium settlement architecture.

## Historical and coverage limitations

Modern coastlines, Nile engineering, reservoirs, reclaimed land and harbors differ from 278 BCE. The new data is physical evidence for presentation, not an ancient shoreline reconstruction. Greek and Egyptian local windows are deliberately narrow source demonstrations; outside them the one-degree grids remain sub-kilometre rather than street-scale. Ecological materials remain about 2.47 km latitude resolution and do not establish ancient forest or agricultural boundaries. Additional river geometry may be generalized or modern and is not validated as an ancient navigable network.

Iberia, Anatolia, wider North Africa and Mesopotamia are listed as future imports in the generic scope configuration. They retain the previous world-scale geography and ecology; comparable new close-detail datasets there remain unfinished. No simulation authority, research atlas, institutional proposal or OPEN architectural decision was changed.

## Validation and screenshots

`npm run validate`: **414 tests passed**, typecheck, lint and simulation build passed. `npm run map:build` passed with the existing large JavaScript-chunk warning. Focused tests cover input eligibility/conflicts, edge timing/toggling, motion integration, zoom bounds, projected movement bounds, source hashes/coverage, shared elevation/coast edges, detail family selection and preservation of the 23-site atlas. Production browser evidence and measurements follow below.

Screenshots: [world](campaign-experience-evidence/world-overhead.png), [Greece regional](campaign-experience-evidence/greece.png), [Greece local](campaign-experience-evidence/greeceDetail.png), [Egypt regional](campaign-experience-evidence/egypt.png), [Egypt local](campaign-experience-evidence/egyptDetail.png), [Rome](campaign-experience-evidence/rome-intermediate.png). Other regional comparisons are in the same evidence directory.

## Production-browser measurements

Windows, Intel i7-11800H, 16 GB RAM, RTX 3060 Laptop GPU via ANGLE/D3D11, Chrome 155.0.8059.40, headless 1440 x 1000, localhost production Vite build. Three-second settled samples, not a broad hardware benchmark.

| View | Mean FPS | Draw calls | JS heap MB |
| --- | ---: | ---: | ---: |
| World | 143.9 | 186 | 202 |
| Synthetic 700 markers | 142.9 | 187 | 164 |
| Synthetic 1,000 markers | 143.9 | 187 | 169 |
| Rome local | 143.9 | 55 | 224 |
| greece | 143.9 | 29 | 244 |
| greeceRegional | 80.9 | 19 | 287 |
| greeceDetail | 143.9 | 10 | 227 |
| egypt | 88.1 | 18 | 307 |
| egyptRegional | 95.8 | 15 | 303 |
| egyptDetail | 92.6 | 9 | 240 |

The first detail traversal measured 58.5 FPS in Greece local and 69.6 FPS in Egypt local; a later traversal measured the higher values above. This variability is material: these short samples do not establish sustained performance. New detail traversal readiness took 1226-5329 ms including preset transitions and a 1.2-second settling allowance. Longest observed loading frames were 181-410 ms. Main-thread parsing, mesh construction and river draping still cause noticeable streaming stalls; bounded residency does not solve those stalls. Worker/off-thread preparation and request/mesh scheduling remain follow-up work. No missing geographic resources, failed tiles, shader errors or uncaught browser errors were observed.

The dispatched-key-to-detectable-movement probe measured 8.6 ms; this is browser-side event/animation timing, not physical keyboard-to-display latency. Cursor anchoring stayed within five screen pixels in the browser assertion. Resident meshes stayed at or below 12 with at most three requests. The 82 new terrain payloads total 16,981,003 bytes before HTTP compression; they are loaded on demand. JS heap excludes GPU/process memory; GPU memory bytes were not measured. Geometry/texture counts and tile payload bytes are recorded in the JSON evidence.

Existing world, Italy and legacy browser verifiers passed, including settlement/region raycasts, political mode and control transfer, zoom/reset, collision-free labels, and external development snapshots. World geography validation compared 1,024 stable points and 26 landmarks with zero mismatches (43 coastal points excluded). Ecology validation retained the documented 333 unclassified coastal land-mask cells out of 204,992 sampled land cells; ten climate probes passed.

Raw evidence: [world/environment and marker benchmark](campaign-experience-evidence/metrics.json), [detail performance and loading](campaign-experience-evidence/detail-validation.json), [camera controls](campaign-experience-evidence/camera-controls.json), [ecological/regression validation](campaign-experience-evidence/regional-validation.json), [Italy regression](campaign-experience-evidence/italy-regression.json), [legacy regression](campaign-experience-evidence/legacy-regression.json). Regional detail views: [Greece](campaign-experience-evidence/greeceRegional.png), [Egypt/Nile](campaign-experience-evidence/egyptRegional.png).

This iteration delivers working campaign controls and a reusable sourced detail foundation. It does not complete world-wide local detail or premium campaign art. Remaining visual gaps include generalized ecological shading, sparse local vegetation outside Italy, rasterized close shorelines, finite fine-window extents, occasional transition artifacts and generalized river widths/courses. No new historical sites or simulation rules were introduced.
