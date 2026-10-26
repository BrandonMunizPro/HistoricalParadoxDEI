# Water and coastline polish — 26 October 2026

This pass builds on the existing uncommitted checkpoint repair. No commits or pushes. It changes shared presentation shaders, not geography, mesh generation, simulation, or the Three.js renderer.

## Changes in this pass

| File | Change |
| --- | --- |
| `shoreline.gdshaderinc` (added) | Shared inverse geographic projection for shoreline clipping. |
| `terrain.gdshader` | Samples the coastline in projected world coordinates, matching water; modest wet fringe on low shoreline fragments. Existing LOD coverage and terrain vertices are retained. |
| `water.gdshader` | Matching coast coordinates; sea continues beneath opaque land to cover elevated-edge parallax gaps, while retaining inland-water exclusions. Corrects regional shore-distance pixel units to approximate kilometres. Shorter, less distorted, filtered directional ripples replace large cloth-like waves. |
| `world.gd` | Binds the existing strategic land mask to water so overview exclusions use the same land field as terrain. |
| `data/visual-settings.json` | Darker open water, restrained coastal teal, coastal band 4 → 1.4 km, foam strength .055 → .025. Settings remain configurable. |
| `data/coast-views.json` (added) | Capture-only Sicily, Naples, Saronic Gulf and Cyclades views. No production presets change. |
| `tools/visual-capture.gd`, `tools/checkpoint-capture.ps1` | Optional capture profile file; production path remains isolated. |
| `tools/checkpoint-source.mjs` | Includes shader include files in source fingerprints. |
| `evidence/coast-20261026/compare.mjs` (added) | Reproducible camera/source checks, performance comparison and screenshot gallery. |

Documentation and evidence files accompany these changes. Earlier unrelated uncommitted repair files remain in the working tree; the repository-wide Git diff includes those earlier changes too.

## Appearance and reference use

The local Imperator reference at `C:\Users\brand\Downloads\Imperator.Rome-SteamRIP.com\Imperator Rome\game\gfx\map\water\water.settings` separates ambient and flow normals, foam, coastal masks and multiple wave scales, with zoom-dependent water response. Prior local Rome II campaign-water research from `C:\Program Files (x86)\Steam\steamapps\common\Total War Rome II` likewise identifies low/high frequency water and separate froth layers. These are conceptual benchmarks, not imported assets. No proprietary textures, shaders or meshes were copied, and no installation files were modified.

The independent shader uses analytic directional gradients, derivative filtering, existing directional specular lighting and restrained Fresnel. Animation changes normals only, with no vertex displacement, CPU geometry work or new dependencies. The existing Animated water checkbox and `run.ps1 -StaticWater` freeze water time.

Visual inspection found a genuine pale background gap around Greek coasts caused by mismatched terrain/water mask coordinates. A wider Italy view also exposed parallax at elevated coastal edges. Matching mask sampling and continuing sea beneath opaque land address these independently. The final Italy strategic image was inspected after that correction. Smaller wave scale and weaker coastal tint reduce the artificial surface pattern and luminous coastline halo.

Shore distance controls appearance only; it is not bathymetry. The regional pixel-to-kilometre conversion uses meridional source spacing (111.195/512 km); east/west spacing varies with latitude. The original distance fields remain unchanged. Shared shader logic applies across coverage, rather than special-casing the screenshot regions.

## Evidence and reproduction

Open [the matched before/final gallery](evidence/coast-20261026/comparison.html); each pair links to full-resolution 1920×1080 images. There are 13 matched pairs: Sicily, Italy, Greece and Aegean at overview, strategic and close distances, plus production Catana at 1.8 km. Capture profile distances are explicit in the gallery and are not production navigation defaults.

Baseline: `evidence/repair-20261026/coast-before/`, source `evidence/coast-20261026/before-source.json`.
Final: `evidence/repair-20261026/coast-final/`, source `evidence/coast-20261026/final-source.json`.
`coast-preview`, `coast-after`, `after-source.json`, `validation/` and `water/` are intermediate evidence, superseded by the final set and `final-validation/`, `final-water/`.

From the repository root, choose a fresh stage name to avoid overwriting evidence:

```powershell
& .\godot-prototype\tools\checkpoint-capture.ps1 -Stage coast-review -Views catana -Profiles sicily,italy,greece,aegean -ProfileFile data/coast-views.json -SourceManifest res://evidence/coast-20261026/final-source.json
node godot-prototype/evidence/coast-20261026/compare.mjs
node godot-prototype/tools/checkpoint-source.mjs verify godot-prototype/evidence/coast-20261026/final-source.json
```

Use `godot-prototype/run.ps1 -View catana` or `-View greece` for interactive production navigation. Pan/orbit and zoom with the existing controls; toggle Animated water to inspect the static option.

## Validation and limits

See `evidence/coast-20261026/comparison.json` for measured FPS, settled GPU time, residency and capture timestamps, and `final-validation/` for exact production-camera and scenery checks. Tests, performance findings and remaining limitations are recorded in the accompanying results file.

The coastline mask is still coarse at very close zoom, particularly outside Italy. No detailed beaches, coves, bathymetry or historical shoreline reconstruction were fabricated. The sea remains an opaque plane with restrained lighting rather than expensive reflection/refraction. Distant coast colors and coarse mesh transitions remain imperfect; this pass does not replace the terrain system. Initial renderer/material setup can still hitch and is reported separately from settled FPS. Independent visual review is still required before checkpoint acceptance.
