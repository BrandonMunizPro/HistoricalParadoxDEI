# Mediterranean water and shore presentation — second pass

Review candidate built on `cbab459` (the previous polish was committed before this assignment). No commit or push was made in this pass. The full commercial-game quality target remains subject to owner review.

[Open 13 matched before/final screenshot pairs](evidence/coast-v2/comparison.html). These are fresh 1920×1080 Godot renders around Sicily, Naples, Greece's Saronic Gulf and the Cyclades at close, medium and overview distances, plus the actual production Catana preset at 1.8 km. Click each image for full resolution. Cameras match exactly; capture profiles do not override production navigation.

## Visible changes

- An original 256×256 periodic ripple normal field replaces the regular analytic wave bands. Two independently moving scales, mip filtering, restrained specular response and sky lighting give the sea visible surface structure without moving vertices. Motion fades at broad strategic distances. The texture is 124,919 bytes, deterministically synthesized from seed `0x4d4544`.
- Deep blue and restrained coastal teal replace the uniformly matte sea. Shore distance remains an appearance cue, **not measured bathymetry**. The narrow, broken coastal wash uses the higher-resolution land mask rather than painting a broad white band from the coarse global distance field.
- Shared coast-mask reconstruction softens fractional diagonal corners within half a source texel; solid source pixels are retained, including tiny islands. Low gentle coast fragments receive a muted sediment transition; higher coast fragments receive a mineral/wet fringe. This is a presentation filter, not a new geographical definition. Canonical raster bytes, geography tests and site sampling are unchanged.
- A matched diagnostic confirmed that Naples' dark floating-looking strip was a terrain shadow on water. The sea material now opts out of shadow reception; sunlight/sky response remains, and terrain shadows on land remain enabled. This removes that artificial ledge without flattening source elevations or moving settlements. Tradeoff: actual terrain-cast shadows no longer appear on the sea.

The first candidate was rejected during visual inspection: highlights were too strong, its shore wash was too broad in Greece, and filtering the lake-exclusion comparison exposed pale slivers. The final shader uses raw source masks for inland-water exclusions, narrows the wash and reduces wave strength. Intermediate `coast-v2-preview`, `coast-v2-refined` and `coast-v2-shadow-diagnostic` captures are diagnostic evidence, not final acceptance evidence.

## Reference use

Revisited the local Imperator `game/gfx/map/water/water.settings` under `C:\Users\brand\Downloads\Imperator.Rome-SteamRIP.com\Imperator Rome`: layered normals, independent flow, coastal/foam masks, shallow/deep colors and zoom-dependent gloss/reflection are directly observable configuration categories. The Rome II install at `C:\Program Files (x86)\Steam\steamapps\common\Total War Rome II` and existing `research/rome2-dei/HANDOFF.md` were revisited; prior campaign-water inventory identifies separate normal/froth categories. This pass did not decode or reuse proprietary shader implementations. Public visual benchmarks include [Imperator's publisher screenshots](https://www.paradoxinteractive.com/games/imperator-rome/add-ons/imperator-rome-centurion-bundle) and [Rome II's Sicily campaign screenshot](https://www.instant-gaming.com/en/9069-buy-total-war-rome-ii-hannibal-at-the-gates-campaign-pack-pc-game-steam/). Those are references, not assets in this repository.

The implementation remains opaque and uses existing MSAA rather than adding a transparent terrain pass; [Godot's spatial shader documentation](https://docs.godotengine.org/en/4.7/tutorials/shaders/shader_reference/spatial_shader.html) describes the alpha/transparency pipeline distinction. No proprietary game images, meshes, textures or code were imported. No dependencies or services were added.

## Exact implementation files

| File | Change |
| --- | --- |
| `water.gdshader` | Layered moving ripple samples, colors, lighting, narrow wash, raw inland-water exclusion and sea-only shadow policy. |
| `terrain.gdshader` | Shared fractional coverage sampling and height/slope-informed shore material blend. |
| `shoreline.gdshaderinc` | Shared bounded corner reconstruction helper. |
| `world.gd` | Loads the original normal field and generates its mipmaps once at startup. |
| `data/visual-settings.json` | Configurable ripple wavelengths, strengths, colors and shore material blend. |
| `data/visual/water-ripples.png` (added) | Original seamless normal field, not geographical data. |
| `tools/water-ripples.mjs` (added) | Deterministic source for that field. |

Documentation changes: this report and the README link. Evidence additions: `evidence/coast-v2/` and `evidence/repair-20261026/coast-v2-{before,preview,refined,shadow-diagnostic,final}/`. The evidence folder contains the paired gallery generator, raw measurements, source manifests, validation logs, and a diagnostic script with baseline shader/settings copies from `cbab459`. A delivery manifest enumerates every changed/added path and hash. Three.js, navigation code, terrain streaming, meshes and canonical data were not edited.

## Validation

| Command/check | Result |
| --- | --- |
| `npm.cmd run validate` | Exit 0: typecheck, repository-wide lint, **475 tests / 34 files**, build and build smoke. Output: `evidence/coast-v2/validate.log`. |
| `node godot-prototype/tools/check-integrity.mjs` | **460 protected files unchanged**, **35 exact canonical identities and coordinates**, **687 research records**, research copy byte-identical. `integrity.log`. |
| Godot `--headless --path godot-prototype --script res://tools/parse-scripts.gd` | 13 GDScript modules parsed; GPU captures also compiled the actual shaders. `parse.log`. |
| Same with `navigation-test.gd` | Original distances and collision/capture isolation passed. `navigation.log`. |
| Same with `global-validate.gd` / `regional-validate.gd` | **17 global / 9 regional production views passed**; exact resolved distances, scenery completion with timeout, expected positive vegetation, 35 selections. `validation/*.json`, `global.log`, `regional.log`. |
| GPU `tools/visual-validate.gd` | Static patches identical; animated patch differs; camera/terrain unchanged. `water/water.json`, `water.log`. |
| `node godot-prototype/evidence/coast-v2/compare.mjs` | All 13 camera/source/site/scenery/residency assertions passed. `comparison.json`. |
| `node godot-prototype/tools/checkpoint-source.mjs verify godot-prototype/evidence/coast-v2/final-source.json` | 2,606 inputs verified, zero changes. |

Final runtime fingerprint: `1d2dd84a08e6bf0b79763a60a997d9e8a062499a023a36f9e516ce903bc4b29b`. All final screenshots, global/regional validation, water validation and performance diagnostic use that fingerprint. UTC timestamps are embedded in their JSON. The before manifest retains the previous runtime fingerprint; that difference is intentional.

## Performance and limitations

1920×1080, Godot 4.7.2 Forward+, RTX 3060 Laptop GPU. The 13 final consecutive settled samples measured **69.2–145.4 FPS**, always **13 terrain tiles**. The initial Italy overview pair was slower: 84.0 → 69.2 FPS, GPU 8.67 → 9.75 ms. Other views varied widely too. No other validation or capture process was intentionally run concurrently with the final screenshot batch; serial runs still show substantial system/clock variability.

To investigate that apparent regression, `evidence/coast-v2/performance.gd` alternated old/new shaders and settings in **the same loaded Italy overview world** at 288 km, with 180 warmup frames and 300 measured frames per stage. Results: old **83.46 / 85.52 FPS**, **9.98 / 9.45 ms GPU**; new **86.62 / 90.18 FPS**, **9.43 / 9.21 ms GPU**. Residency stayed 13. This follow-up did not reproduce a sustained slowdown; it is not proof of a universal speed gain. Raw results: `performance.json`. Rendering warmup/compilation frames are excluded from this steady diagnostic.

The first final production Catana process still recorded a **1,689.61 ms startup/streaming frame**. This remains a loading limitation and is not included in steady FPS. No loading-hitch fix is claimed.

Actual rendered close and wider images were inspected in all four target areas, including the Naples shadow diagnostic and final Greek wash correction. Water appearance is visibly richer and the false coastal shadow is removed. **Close coastline geometry remains coarse**, especially Greek islands outside Italy's higher-resolution mask; half-texel filtering cannot supply missing coves or beach geometry. No bathymetric refraction, transparent shallows, geometric surf or historical shoreline reconstruction was added. Some broad water texture directionality and distant terrain/river transitions remain visible. This is a focused visual improvement, not a claim of Rome II/Imperator parity.

## Reproduce

Use a fresh stage name; the capture script refuses to overwrite evidence:

```powershell
& .\godot-prototype\tools\checkpoint-capture.ps1 -Stage coast-v2-review -Views catana -Profiles sicily,italy,greece,aegean -ProfileFile data/coast-views.json -SourceManifest res://evidence/coast-v2/final-source.json
node godot-prototype/evidence/coast-v2/compare.mjs
```

Godot executable used: `C:\Users\brand\tools\godot\4.7.2-stable\Godot_v4.7.2-stable_win64_console.exe`. Validator arguments: `--output=res://evidence/coast-v2/validation --source-manifest=res://evidence/coast-v2/final-source.json`; water validator uses `--output=res://evidence/coast-v2/water`. Performance script: `--path godot-prototype --resolution 1920x1080 --script res://evidence/coast-v2/performance.gd -- --source-manifest=res://evidence/coast-v2/final-source.json`. Run it alone for meaningful timing.

Interactive: `godot-prototype/run.ps1 -View catana` or `-View greece`; pan/zoom with the existing controls. The Animated water checkbox or `-StaticWater` freezes water movement. The deterministic normal field can be regenerated with `node godot-prototype/tools/water-ripples.mjs`.

Next visual step after review: improve coast geometry/detail from existing trustworthy geographic inputs in a separately scoped pass. Current source-mask and clipped-mesh limits remain the main obstacle to a fully natural close-up shore.
