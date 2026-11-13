# Pellaro shoreline focus

The [campaign shoreline rollout](../world-coasts/REPORT.md) now extends this
treatment to nearby sea coasts throughout the map. Pellaro remains the approved
local control; the original focused review below is retained.

The regular campaign now has a focused beach and surf pass along about four
kilometres of coast at Pellaro, south of Rhegion in southern Calabria. Open the
[motion and before/after review](REVIEW.html), or run
`godot-prototype/coastal-focus-preview.ps1` for the interactive game view.
The production view registry also accepts `--view=pellaro`.

The existing [GodotOceanWaves integration](https://github.com/2Retr0/GodotOceanWaves/)
continues to provide offshore FFT waves, filtered normals and reflections. Its
MIT attribution remains in `godot-prototype/ocean/`. The new local shoreline
uses the existing GSHHG full-resolution mainland polygon. Original coordinates
and the source archive hash are retained in `data/coastal-focus/pellaro.json`;
the presentation curve rounds source stair steps with two corner-cutting passes.
GSHHG attribution and license text accompany the derived distance fields.

The visual pass adds:

- A local signed coast-distance field for land/water contact at this focus area.
- A graded beach profile, roughly 28 metres of sand followed by a textured inland
  transition, a dark wet edge, and brighter shallow water.
- Shoreward crest trains, irregular breaking foam, trailing foam and advancing /
  retreating wash on a separate bounded mesh. Phase, foam and wetness use the
  world's pausable water clock. Positions remain in world space during panning.
- Vegetation exclusion on the intertidal/beach strip and placement on the visual
  backshore profile. These placement inputs are included in scenery cache keys.
- A local effect that releases its visible geometry when zooming beyond 12 km
  or leaving the area. Dynamic terrain material references are weak, so moving
  across the map does not retain every streamed material.

Canonical coast catalogs, faction placements, terrain source elevations and
campaign simulation data are retained. This is an illustrative modern-physical
proxy and visual sediment profile, not a surveyed beach, ancient shoreline or
measured bathymetry. The directed breakers are a local rendering model rather
than a hydrodynamic shoaling solver. Other coastlines have not received this pass.

The final review uses 48 actual 1920×1080 Forward+ frames sampled over six seconds,
after full production scenery and terrain readiness. A fully settled baseline
uses the same camera and the `--coast-baseline` switch. The capture also checks
that the effect disables on zoom-out and outside the focus bounds. Iteration
captures are retained separately and do not claim full readiness. No shader or
script errors were accepted in the final capture. The motion viewer is not a
sustained interactive performance benchmark.

All 514 application tests pass. TypeScript checking and targeted ESLint checks
cover the added JavaScript tools. `review.json` records matched cameras, complete
readiness, visible foam animation and the two scope checks.

Rebuild the local source-derived fields with:

```
node godot-prototype/tools/coastal-focus-build.mjs
node godot-prototype/tools/coastal-focus-capture.mjs --baseline --complete
node godot-prototype/tools/coastal-focus-capture.mjs --complete
node godot-prototype/tools/coastal-focus-report.mjs
```

The capture runner accepts `GODOT_BINARY`; the interactive PowerShell shortcut
uses the installed local Godot executable. Changes remain local until committed.
