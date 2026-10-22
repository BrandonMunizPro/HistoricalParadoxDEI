# Campaign world visual prototype

Global expansion: [regional status and measurements](GLOBAL.md), [matching world-region screenshots](evidence/global-comparison.html). The region picker and `-View greece`, `anatolia`, `egypt`, `iberia`, `persia` and other presets extend the same renderer beyond Italy. Existing Italian controls and geographic data remain available.

Latest asset-quality checkpoint: [results and remaining visual limits](QUALITY.md), with [eight matching side-by-side rendered comparisons](evidence/quality-comparison.html). This adds original ground/leaf artwork and branching tree variants; the whole-region commercial-quality target remains unmet.

Current Italia/Sicily development: [regional checkpoint and measurements](REGIONAL.md), with an [actual before/after image slider](evidence/regional-comparison.html). Launch with `-View alps`, `-View po`, `-View apennines`, `-View south`, or the existing Sicily views. The implementation details below describe the initial prototype; the regional report records the subsequent changes and remaining limits.

Separate Godot desktop presentation experiment. The existing viewer, simulation and canonical geography are unchanged. See [measured evaluation and paired screenshots](REPORT.md).

## Run

From `C:\Users\brand\HistoricalGame`:

```powershell
.\godot-prototype\run.ps1
.\godot-prototype\run.ps1 -View etna
.\godot-prototype\run.ps1 -View catana
```

Or import `project.godot` in the installed Godot editor. Godot is at `C:\Users\brand\tools\godot\4.7.2-stable`; no PATH changes or export templates are required to run this project. This checkpoint runs through the native engine executable; it is not an exported standalone installer.

WASD/arrows pan geographically, Q/E rotate, wheel zooms toward the cursor, right drag orbits, middle drag pans, Home returns to the overview. Buttons open the four comparison views. Search/list and visible labels select approved settlements. All 35 remain selectable. Research references can be displayed as dots; their complete evidence is preserved in JSON, not recreated as a research-editing interface.

## What is built

- Original azimuthal equidistant projection, origin 13.5 E / 41.5 N, full bounds 12 W–75 E / 12 N–62 N. Scene units are kilometres; Y up, Z south. Display height exaggeration is 1.5, matching the adapter's declared convention.
- Offline adapter reuses `projectLocalMapMetres` from the existing TypeScript geography module. Derived binary meshes and height arrays are disposable presentation assets; canonical IDs, lon/lat and research remain authoritative.
- One continental context mesh, 176 world tile descriptors and 85 Italy regional descriptors. At most 12 detail tiles plus context are resident. Detail is loaded one tile per frame; parent-height morphing and boundary blending reduce abrupt transitions. This is bounded loading, not a completed asynchronous terrain streamer.
- Original five-layer volcanic/rock/grass/soil/shore material shader, procedural seamless textures and normals; macro colours reuse the existing regional ecology texture.
- Original sea shader, source coastline masks, polygonal inland water, source river lines and draped regional river ribbons. River widths and lake levels are presentation estimates.
- Warm directional light, procedural sky, distance-adjusted fog, close-view SSAO, original spatially batched vegetation and an interpretive Catana settlement assembled from batched masonry and pitched roofs.
- Canonical Catana: **15.088142 E, 37.502959 N**. Akragas: **13.585475 E, 37.290594 N**. Visual labels change height with terrain detail; horizontal approved anchors remain fixed. Geometry and camera use Godot's normal floating-point scene precision; source coordinates are retained exactly in JSON.

## Reproduce checks and captures

The following use the existing repository's Node packages; no package installation is needed:

```powershell
node godot-prototype/tools/check-integrity.mjs
& C:\Users\brand\tools\godot\4.7.2-stable\Godot_v4.7.2-stable_win64_console.exe --headless --path C:\Users\brand\HistoricalGame\godot-prototype -- --exercise
& .\godot-prototype\tools\capture.ps1
node godot-prototype/tools/compare.mjs
node godot-prototype/tools/report.mjs
```

Run captures sequentially, with other GPU-heavy applications idle. `compare.mjs` starts a temporary local Vite server and an isolated Chrome session, instruments the existing viewer in memory, and changes only transient camera/UI state. It writes artifacts and Vite cache inside this prototype. It does not edit viewer code. The test hides research markers and clouds/wildlife in Three.js; ordinary Three.js terrain/environment detail remains active.

`node godot-prototype/tools/prepare.mjs` rebuilds derived geographic assets from existing local files only. It can take several minutes. It refuses to silently replace the original protected-source hash baseline. No regeneration is needed to launch the delivered checkpoint. `materials.mjs` regenerates only original procedural textures. Evidence is excluded from Godot asset import with `.gdignore`.

## Data and asset provenance

`licenses/` carries the existing Copernicus, GSHHG/WDBII and Mapzen notices. `data/settlement-provenance.json` retains the full atlas and approval metadata, including per-record Pleiades attribution and CC BY 3.0 links. `data/research-locations.json` is a byte-identical copy of the source export. Preserve these notices when distributing derived geographic assets. Existing source datasets and research records remain in their original directories.

All added shaders, vegetation geometry, settlement geometry and material bitmaps were made for this prototype. No reference-game assets, shaders, binaries or code were copied or executed. No geographic datasets were downloaded. Modern DEMs/coastlines, generic vegetation placement and generic settlement forms do not establish ancient landscape or building accuracy.

Godot's official stable Windows x64 **standard** build was downloaded from the [official release](https://github.com/godotengine/godot/releases/tag/4.7.2-stable). Archive SHA-256: `731980f9608d61333e5baf54a2ef17210acc7a538446c0cb9969f002aca1e953`. The official SHA-512 manifest was verified before extraction; its archive and checksum file remain outside the repository in the tools directory. Engine version: `4.7.2.stable.official.ed1daf0bf`. [Godot licensing](https://godotengine.org/license/).
