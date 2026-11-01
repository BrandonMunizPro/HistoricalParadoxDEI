# Neutral political map transition — 29 October 2026

[Interactive before/after and bidirectional transition sequence](comparison.html). Implemented in the existing campaign world, using the existing geographic coordinates, camera and terrain. Selected evidence: before-clean versus delivery; native-delivery supplies correctness checks and animation. No factions, ownership, provinces or invented borders exist.

## Rome II reference study

The official [Rome II Campaign Map Play manual](https://r2enc.totalwar.com/en/manual/single-player/0012_enc_page_campaign_play/index.html) describes a regional strategic overview that highlights controlled territory and supports recentering the campaign camera. Its [official manual](https://cdn.akamai.steamstatic.com/steam/apps/214950/manuals/RTW2EE_PC_MANUAL_EN.pdf) lists Tab for the strategic map. These confirm the overview interaction, not a particular internal rendering technique or numeric zoom threshold.

I also inspected [the publisher-hosted Empire Divided ownership-map screenshot](https://cdn.akamai.steamstatic.com/steam/apps/694880/ss_f4a27700149a4853c181d706ec09d2c4ebe29088.1920x1080.jpg). Visual observations: broad muted territorial fills, emphatic coastline/water contrast, restrained relief, and small settlement symbols. This later campaign is a visual reference only, not historical evidence for 278 BCE. The image was downloaded to the system temporary directory and never imported into this project.

Adapted principles: information-first zoomed-out presentation, consistent blue water, neutral land shading and settlement points. Deliberate differences: we retain the same 3D terrain/camera and blend automatically by distance; all land is neutral gray, without territory polygons, regional names, ownership symbols or borders. No proprietary assets, source code or exact designs were reused.

## Architecture inspected

Godot 4.7.2 official, Forward+, RTX 3060 Laptop. world.gd owns the perspective camera, azimuthal geographic projection, navigation, terrain streaming, approved markers and existing selection. Scroll zoom supports 1.2–30,000 km; camera goal smoothing, anchored zoom, pan and rotation are unchanged. Presets include campaign 1100 km, overview 8500 km, Sicily 520 km, and Etna 22 km. Geographic terrain uses shared terrain.gdshader across context/regional/resident tiles, existing DEM geometry and shared shoreline masks. The existing ocean uses FFT cascades with kilometre conversion, temporal normals and a local displacement patch. Rivers/lakes have separate renderers.

Tile bounds, lon/lat UVs, settlement IDs and geographic masks could support later cartography placement, but they are not political regions. No ownership or territory geometry was found. Settlement markers are not treated as boundaries.

## New presentation system

political_map.gd updates one shader-global weight from the existing world.distance. There is no second world, camera swap, terrain copy, new geographic projection, full-screen map pass or scene reload. The shared terrain shader blends its existing geographic material into neutral gray with source-derived normals, restrained hill shading and subtle engraving grain. Its existing vertex code, land clipping and source inputs remain identical. At full political weight, it bypasses the expensive geographic surface branch. Equal RGB material values give neutral land; existing warm/cool illumination still affects final pixels. No territory layers are bound.

The same weight blends the existing ocean shader into a quiet blue chart surface with restrained broad variation and a shoreline wash. At full weight the shader skips FFT texture sampling, and the adapter suspends FFT scheduling. FFT textures, cascades, resources and the existing water clock are retained; compute resumes as geography becomes visible. Close ocean rendering is unchanged. Rivers and lakes retain their existing geographic rendering.

Small geometry fades with smoothstep(0,0.45,politicalWeight), then its existing roots hide once transparent. No geometry is regenerated for the transition. A child-added observer handles streamed details; weak references are updated only while fade changes. Full political mode shows one instanced draw for all 35 approved settlement points, at their existing coordinates. Existing labels declutter, prioritizing the selected settlement and Roma. Selection remains the original world input path. Dense sites still overlap at continental scale; their names remain available through existing search/selection.

Shader globals are declared in project.godot and updated through Godot’s [global-uniform API](https://docs.godotengine.org/en/stable/tutorials/shaders/shader_reference/shading_language.html#global-uniforms). Cached script state avoids per-frame synchronous global-parameter reads. No shader assignments/recompilation, asset reloads or large allocations are performed by the runtime transition.

## Thresholds and controls

- ≤60 km: exact geographic weight zero, including 1.2 and 59.3 km reference views.
- 60–180 km: smoothstep blend, 50% at 120 km.
- ≥180 km: full neutral political presentation.

This continuous stateless curve reverses naturally and has zero slope at its endpoints; hysteresis is unnecessary. Geometry fades out earlier within the blend to avoid vegetation speckles. Shared shader globals apply to newly streamed tiles automatically. The camera remains in the same geographic world and controls are unchanged.

[political-map-settings.json](../../data/political-map-settings.json) exposes enabled, transition thresholds, neutral RGB, sea colours, 2.5 km chart coastal wash and 7-pixel settlement points. Restart to reload file settings. --geographic-only forces the original presentation for comparisons. Run .\godot-prototype\political-map-preview.ps1; -View etna starts close, -GeographicOnly disables the blend. No interface or production preset was redesigned.

## Future faction colours — rendering extension only

set_cartography_layers(colors, boundaries, bounds) accepts externally prepared display-colour/coverage and optional antialiased boundary textures with lon/lat bounds in the existing geographic system. Transparent or missing coverage stays neutral. Replacing/updating these textures changes map appearance without rebuilding terrain. clear_cartography_layers(), or a null colour layer, disables both layers and releases atlases to a shared transparent 2×2 resource.

No faction objects, faction palette records, ownership tables, transfer/elimination rules, synthetic provinces, Voronoi cells or seeded territory examples were added. The future ownership system must generate display inputs from actual territory geometry and validated data. Boundary width/LOD refinement is deferred until those real boundaries exist. The renderer does not infer territory from settlements. [Technical input contract](../../POLITICAL_MAP.md).

## Visual validation

Nine matched native 1920×1080 pairs cover close sea, 59.3 km geographic coast, 120 km transition, 180 km political view, Sicily, campaign Italy, continental overview, Alps and Egypt. Position/basis agree to 1e-5, with identical FOV and clipping. UI canvases are hidden consistently for comparison; approved world labels remain visible. Screenshots are unretouched. A 144-frame native 960×540 sequence shows zoom out and back while panning/rotating. It is deterministic camera sampling at 24 fps with water held, not a real-time performance recording.

19 native checks passed, including original/current close FFT pixels, original/current 59.3 km terrain pixels, threshold continuity, neutral RGB, no bound territories/borders, missing-layer fallback, existing geographic validator, 35 exact marker transforms, detail-root hiding, actual pointer selection on a political settlement, FFT suspension without stopping the world clock, reduced motion, return-to-geographic FFT resume, existing selection/preset retention and both-direction transition. The two preservation comparison regions have zero changed channels. [Native results](native-delivery/validation.json). Existing headless navigation regression also passed. [Navigation output](navigation-test.log).

## Performance

RTX 3060 Laptop, 1920×1080, Forward+, MSAA 4×; ordinary 120 FPS cap/VSync disabled for measurement after world initialization. 300 settled wall intervals per view, forced GPU submissions with automatic render loop disabled, hidden window; not PresentMon/display scan-out. Retained caches, sequential view order and one-second NVIDIA telemetry. One-percent low = reciprocal mean of slowest 1% of intervals. No other Godot preview was active.

| View / km | Before avg / 1% FPS | Political pass avg / 1% FPS | GPU ms before → after | Draw calls before → after |
|---|---:|---:|---:|---:|
| close / 1.2 | 196.2 / 45.8 | 176.9 / 120.0 | 3.88 → 4.46 | 8 → 8 |
| geographic / 59.3 | 163.4 / 51.2 | 140.2 / 97.3 | 5.03 → 5.94 | 99 → 99 |
| transition / 120 | 133.8 / 53.1 | 136.2 / 100.8 | 6.37 → 6.16 | 139 → 43 |
| political / 180 | 157.3 / 52.0 | 168.2 / 121.2 | 5.26 → 4.92 | 115 → 50 |
| sicily / 520 | 136.3 / 6.1 | 173.8 / 124.5 | 4.29 → 4.73 | 48 → 22 |
| campaign / 1100 | 105.4 / 87.2 | 124.4 / 98.8 | 8.55 → 6.93 | 201 → 46 |
| overview / 5200 | 71.1 / 16.2 | 93.6 / 76.9 | 12.21 → 9.44 | 185 → 26 |
| alps / 260 | 109.5 / 86.2 | 145.1 / 22.7 | 7.71 → 5.40 | 25 → 12 |
| egypt / 800 | 113.3 / 91.1 | 158.0 / 112.9 | 7.60 → 5.24 | 49 → 15 |

The marker adds at most one instanced draw when political weight is nonzero. Culling close detail reduces net draw calls substantially at full political zoom. Close views retain identical draw counts; the larger shared shaders/global inputs have some measured cost even where their political contribution is zero. Sequential run temperature, cache and OS scheduling also affect these differences; they are not perfectly isolated shader microbenchmarks.

| Motion route | Average / 1% FPS | Mean / max ms | Frames >33.33 ms |
|---|---:|---:|---:|
| before-clean | 57.5 / 34.9 | 17.39 / 35.33 | 1 |
| delivery | 59.8 / 30.2 | 16.71 / 48.08 | 3 |

Motion route: 45→260→45 km over 900 uncapped frames, pan and 100° rotation, streaming included. It demonstrates both directions but is a submitted-frame route, not a fixed-duration player benchmark. Stutter-free 60 FPS is not established. Existing streaming/scenery/settlement work remains. No cause is asserted for individual spikes without a separate trace.

Scene instantiation: 3900.22 → 3776.51 ms. Largest readiness/initial interval: 518.86 → 100.30 ms. These readiness samples are separate from settled frames and may include resource uploads and first use. Largest settled interval: 113.56 ms. No clean-cache first-launch guarantee is claimed.

| Run | Peak process RAM MiB | Peak device-wide VRAM MiB | Peak GPU °C |
|---|---:|---:|---:|
| before-clean | 1271.8 | 2825 | 87 |
| delivery | 1300.3 | 2721 | 87 |
| native-delivery | 1355.2 | 2454 | 87 |

VRAM includes desktop and other processes; it is not app-exclusive. Per-view Godot memory counters and all raw wall/GPU samples, exact process arguments and NVIDIA telemetry remain in stage JSONs. There is no duplicate terrain mesh or full-world render target. The new point mesh, 35 instance records and shared 2×2 transparent layer are small fixed allocations. Existing FFT allocations are retained for seamless return.

## Files and preservation

Modified: project.godot (shader globals), world.gd (adapter initialization/update and label handling), terrain.gdshader (fragment blend), ocean/ocean_surface.gdshader (chart blend), ocean/ocean_controller.gd (full-political scheduling gate).

Added: political_map.gd, political_map.gdshaderinc, political_marker.gdshader, political_empty_layer.tres, data/political-map-settings.json, political-map-preview.ps1, POLITICAL_MAP.md, tools/political-map-{profile,validate,report} and capture.ps1, plus review evidence. [Exact source paths and hashes](changed-files.json).

Compared all 2925 pre-existing project source/asset hashes from the start of this task. Only the five intended existing runtime/configuration files changed, with no deletions. Terrain/ocean vertex code and geographic projection functions are identical. All FFT compute code, source elevation/masks, catalogs, coordinates, research, hydrology and navigation presets are unchanged. The protected validator passes all 460 files, 35 exact approved coordinates, 687 retained records and the byte-identical research copy. [Protection output](protected-integrity.txt), [package checks](validation.json). No ownership/gameplay, The Rev changes, commits or pushes.

## Limits and rejected iterations

Political borders and owner colours are intentionally absent. The neutral map is a rendering foundation, not a playable political simulation. The full view is genuinely gray land with preserved relief, but it does not recreate Rome II’s parchment artwork. Existing coast raster resolution, broad hydrological features and extreme-zoom finite-world/plane artifacts remain. Dense approved points overlap at continental scale; labels are decluttered rather than moved. Global uniforms assume one active campaign world. Current native validation covers Forward+; explicitly selecting legacy water keeps its geographic water shader rather than the new chart-water branch.

An initial baseline quit while async work remained and logged resource leaks; before-clean waits for readiness and frees the scene before exit, and is the selected baseline. candidate1 logged missing null sampler resources; explicit transparent defaults fixed that. Its midpoint vegetation speckles led to the earlier detail fade. A broad coast wash exposed distance-field saturation and coarse diamond shapes; the selected compact, narrower wash avoids amplifying them. Earlier captures remain for traceability and are not presented as final acceptance.

Review the actual comparisons and bidirectional sequence before accepting the visual direction. Passing tests establishes preservation and functioning, not independent artistic approval. Recommended next work: profile traversal stalls, then design real territory geometry/data before using the cartography input; do not populate artificial ownership as a rendering shortcut.
