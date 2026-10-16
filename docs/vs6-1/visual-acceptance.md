# VS6.1 — partial visual correction; visual acceptance remains open

VS6's terrain presentation is **not visually accepted**. This pass reproduces the defects in the production browser, adds targeted corrections and the optional research layer, but does not complete the continuous-world presentation requirement. No commits, pushes, resets, source-research edits or simulation replacements were performed.

## Evidence and reproduction

The [before captures](evidence/before-six/views.json) and [after captures](evidence/after-six/views.json) record camera positions, frame samples, tile state and metrics. All six required views are captured in both directories: [world overhead](evidence/after-six/world-overhead.png), [world oblique](evidence/after-six/world-oblique.png), [Italy regional](evidence/after-six/italy-oblique.png), [Italy close](evidence/after-six/italy-close.png), [Greece regional](evidence/after-six/greece-oblique.png), and [Egypt regional](evidence/after-six/egypt-oblique.png). Compare each to its identically named image in `evidence/before-six/`. These are live renderer screenshots, not painted reference images. Keyboard F supplies oblique views; elapsed-time input introduces small angle differences recorded in the JSON.

`node scripts/capture-vs6-1.mjs <new-output-directory>` reproduces these views against the production preview on port 4173. Existing VS5/VS6 evidence is preserved. User-described defects and repository screenshots are the references; no separate user screenshot attachment was available in this turn for a pixel-exact comparison.

The matched [Greece close before](evidence/before/greeceDetail.png) and [after](evidence/presentation/greeceDetail.png) show the removed glare particularly clearly. A manually checked 300x280 open-water crop contained 53,797 bright neutral pixels before and zero after (out of 84,000); [crop coordinates and measurements](evidence/water-glare.json). This is evidence for that specific glare correction, not proof that coastline geometry or overall visual acceptance passes.

## Root causes and acceptance by defect

| Defect | Finding and correction | Acceptance |
| --- | --- | --- |
| Giant wedge / exposed rectangle | The finite lon/lat raster is projected through the existing Italy-centered azimuthal equidistant transform. Its geographic edges become curved and sloping in this projection. Camera tilt exposes/compresses that finite sheet. This is not evidence of randomly shifted settlements or a camera clipping plane. Source coordinates and the world transform remain unchanged. | **Unresolved**. The wedge is still obvious in the whole-world views. |
| Hard horizon / abrupt background | Background and distance fog used different colors. Water also deliberately switches to dark unknown coverage beyond the raster. Matched fog/background colors and removed the additional camera-tilt-driven two-degree geographic recoloring band. Standard distance fog remains unchanged in density. | **Partly improved, unresolved**: finite source boundaries and the flat projected plane remain. No extra heavy fog was added. |
| Pale / nearly white surfaces | High exposure (1.02), strong warm directional light (2.2) and very glossy water amplified pale source imagery. Exposure is now 0.9 and directional intensity 1.65 with a more neutral sun. The ecological image already uses sRGB texture handling; inspection of Three.js fog uniform conversion did not establish a color-space bug. | **Improved, not fully resolved**. Desert imagery remains pale and close terrain still lacks rich materials. |
| Wide shoreline colors / water glare | Physical water roughness .3 and metalness .2 produced a conspicuous broad bright specular patch. Roughness is now .95, metalness zero. Bathymetric color blending previously extended to .28 of the 1600 m depth range (~448 m); now .035 (~56 m). Muted blue colors replace bright turquoise. | **Improved**. This changes presentation, not coastline geometry. Coarse bathymetry interpolation and raster coast stair-stepping remain visible. |
| Rounded mountains / repetitive ridges | Heights and shading derivatives used 3x vertical exaggeration; coarse sampled grids and smooth normals limit available shape detail. Shared display scale is now 1.5x for every terrain family, normals, rivers, lakes, settlement anchors and camera samples. Removed the periodic sinusoidal terrain color patch. Source elevations are untouched. | **Improved exaggeration; unresolved shape detail**. No invented noise displacement was added. |
| Scattered black vegetation dots | Fifteen-metre schematic settlement crowns were rendered while they occupied only a few screen pixels. These small vegetation batches are now culled beyond 4 km from the camera; original larger symbolic groves retain their existing distance fade. | **Improved at Rome intermediate zoom**. Regional vegetation distribution remains schematic and is not an ancient forest reconstruction. |
| Terrain popping / material shifts | Existing parent-surface reveal, morphing, bounded cache and cooperative preparation are preserved. Reduced vertical exaggeration halves displacement amplitude; removing view-angle boundary recoloring eliminates that particular color change. | **Not closed**. Cache activation, neighbor-dependent edge reconstruction and LOD thresholds still need temporal image-based transition validation. Stable FPS and source-parent equality are not visual acceptance. |

The shader has logarithmic depth, dynamic near clipping and a 40,000 km far plane. The reproduced wedge follows dataset limits rather than an observed near/far clipping fault. This is an inspected explanation, not an assertion that every possible clipping artifact has been eliminated. No driver failure or shader compilation error was established by the screenshot run.

### Required next architectural work

The render coverage must be separated from playable bounds: import real low-resolution elevation, coastline and ecology context beyond the campaign envelope, retaining explicit provenance, then choose a strategic framing/projection policy that does not expose a cropped foreground sheet. A globe-backed context is another option, but requires consistent projection/zoom handling; it was not silently introduced here. Simply extending a flat water plane would invent ocean beyond cropped land. Adding skirts or more fog would conceal the defect rather than supply missing geography.

Coast improvements require higher-resolution land/bathymetry masks at local zoom, with consistent multiresolution shoreline handling. Additional mountain shape requires source detail and consistent normals/temporal LOD transitions, not procedural fabricated peaks. These are remaining renderer/data-pipeline tasks, not a need to migrate engines or rewrite simulation.

## Historical and geographic limits

Existing Mapzen Terrarium world elevation, Copernicus Italy detail, GSHHG coasts, WDBII rivers and Natural Earth I / Beck modern ecological presentation are retained. No new geographic source is asserted. Modern coastlines, land cover and irrigation are approximations, not verified 278 BCE reconstructions. Height exaggeration is a display choice, not altered scientific elevation data. Schematic agriculture and architecture retain their previous provisional status.

## Research references and approval boundary

`npm run map:research` reads all nine R-16 research batches without modifying them, writes a minimal separate `public/data/research-locations.json`, and records SHA-256 source-file provenance. It deliberately omits political claims, population, economics and architectural development. `researchLocations` filters usable coordinates; research handles are namespaced `research:` and never canonical settlement identities.

Of 658 draft candidates, **645** are available in current coverage: **584 approximate and 61 disputed**. **13 are excluded**: three null coordinate-component pairs and ten east of the current rendering envelope. The complete handles/reasons are in [research-audit.json](research-audit.json). No missing coordinates are coerced to zero, and no off-envelope locations are clamped onto the map edge.

The unchecked **Unapproved research references** control is independent of **Authoritative settlements**. `?` means an approximate reference, dashed rings indicate disputed location, and numbers represent clusters. Rings are screen symbols, **not measured archaeological uncertainty radii**. Hover/focus tooltips state that references are unapproved and not verified for 278 BCE. Nearby singletons can receive at most 12 collision-checked names; wider zooms use counts rather than hundreds of names. A 64-pixel screen grid, 180-marker cap, viewport/UI culling and 150 ms presentation refresh bound work. Clustering preserves individual research identities. These DOM references have no selection dispatch to simulation; authoritative models, selection, development snapshots and map modes remain separate.

The 700/1000 synthetic benchmark remains separately named and toggled; it does not populate historical simulation. The production-browser research check verifies that settlement identities and political control are identical before/after reference-layer operation.

### Promotions: zero

`data/settlement-integration/reviews.json` still has no independent approvals, and `public/data/approved-settlements.json` remains empty. The existing 12-candidate pilot remains blocked. Missing for each: confirmed gazetteer identity, independently checked location, identity/existence/278 BCE chronology evidence findings with locators, reviewed atlas definition and explicit reviewer/date/approval reference bound to the candidate digest. Research readiness is insufficient. No Pleiades identifiers, coordinates, control, approval packets or new authoritative regions were invented. The existing application-registration dependency remains open as documented in VS6; no OPEN decision was resolved.

## Validation and measurements

See [checks.json](checks.json) for browser/geographic exit results, [research browser results](evidence/research/validation.json) for enabled/disabled measurements, and the adjacent screenshots for the reference layer. Full automated validation passes **452 tests**, typecheck, lint and simulation build/smoke; the Vite production build succeeds with the existing large-chunk warning. The added nine focused tests cover missing/null/invalid/outside coordinates, uncertainty, identity separation, duplicate handles, toggles, deterministic screen clustering and density bounds. Existing promotion safeguards remain tested.

Measurements use Chrome 155 headless at 1440x1000, Intel i7-11800H, 16 GB RAM, NVIDIA RTX 3060 Laptop GPU (ANGLE/D3D11, verified by the world browser check), on the same local machine for both marker states. Each state resets the camera preset, waits for streaming, performs the same 450 ms W input and then waits four seconds. The existing frame buffer retains the latest 600 frames (about 4.17 seconds at 144 Hz), so it can omit the beginning of this interval. These are short **warm navigation/reference-layer comparisons**, not cold streaming benchmarks or statistical proof of a performance improvement. The near-144 FPS cadence is display/browser limited. JS heap is GC-dependent; GPU memory is not measurable through this API.

| View | Markers off/on FPS | Off/on p95 ms | Off/on p99 ms | Off/on worst ms | Off/on draws | Off/on JS heap MB | Resident tiles |
| --- | --- | --- | --- | --- | --- | --- | --- |
| world | 143.9 / 143.9 | 7.1 / 7.1 | 7.2 / 7.1 | 7.2 / 7.3 | 179 / 179 | 168 / 164 | 0 |
| greece | 143.9 / 143.7 | 7.1 / 7.1 | 7.2 / 7.2 | 7.4 / 13.8 | 28 / 28 | 231 / 229 | 12 |
| egypt | 143.2 / 143.0 | 7.1 / 7.1 | 7.2 / 7.2 | 14.0 / 21.1 | 17 / 17 | 272 / 242 | 12 |
| rome | 143.6 / 143.7 | 7.1 / 7.1 | 7.2 / 7.2 | 14.0 / 13.8 | 57 / 57 | 264 / 284 | 12 |

World reference display showed 47 clusters representing 627 usable references; Greece 80/165; Egypt 39/84; Rome's close camera showed 0 because there are no eligible draft sites in that tiny viewport. Counts depend on camera and UI occlusion. The other available references remain indexed, not excluded as historical records. DOM marker draws are not included in WebGL draw-call counts. A lower heap reading with references enabled reflects GC, not a demonstrated memory saving. Tile limits remain 12 resident, three requests and four inactive cached entries.

Median frame times were 6.9–7.0 ms in all eight reference-layer samples. The separate [loading responsiveness regression](evidence/streaming/responsiveness.json) also exercises W movement while requests are pending in Greece, Egypt and Italy; it verifies bounded movement steps and unchanged settlement/control state. This is complementary evidence of responsiveness, not a full cold-cache p99 comparison against VS6.

To run: `npm run map:research`, `npm run map:build`, then `npm run map:preview -- --port 4173`. The research toggle starts off. `node scripts/verify-research-layer.mjs` checks the optional layer, records enabled/disabled timings, and captures reference-layer screenshots. `npm run validate` runs simulation/unit validation; the existing browser and geographic checks are listed in `checks.json`. No meaningful legacy map test was removed; it passes in this run.

The visual milestone remains **partially implemented and not accepted**. In particular, the exposed campaign sheet, low-angle horizon and richer local terrain/vegetation presentation still require further work despite passing tests and responsive controls.
