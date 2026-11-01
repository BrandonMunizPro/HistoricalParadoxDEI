# Neutral political presentation

Run `./godot-prototype/political-map-preview.ps1` from the repository. Existing campaign camera controls and settlement selection remain active. `-View etna` starts in the detailed world; `-GeographicOnly` disables the automatic political blend for comparison. No interface or navigation presets were replaced.

`data/political-map-settings.json` defines the 60–180 km camera-distance transition, neutral linear RGB, strategic sea colours/coastal wash and point size. Restart to reload these settings. At or below 60 km the blend is exactly zero; at or above 180 km it is one. `smoothstep` is continuous and reversible, so no binary state or hysteresis is needed. The scene and camera never change ownership or reload. Small geometry fades out earlier within that same blend, reaching zero opacity before its root is hidden. Source terrain vertices, coast clipping and masks are unchanged.

`project.godot` registers shader globals. `political_map.gd` updates one blend and approved marker transforms in the existing world. Terrain and ocean read the same global weight. Terrain preserves its geographic branch at zero, blends at intermediate weights, and bypasses detailed material work at one. Full political land uses one neutral colour, source-derived relief and restrained grain. River/lake systems remain independent. The ocean blends to quiet blue chart shading, skips FFT texture sampling when fully political, and suspends compute scheduling until geography becomes visible again. Its resources, cascades and clock are retained.

The coast-distance field is an appearance approximation, not bathymetry. Regional distance saturates near 13.8 km, so the chart wash has compact support below that limit. The final 2.5 km wash avoids amplifying coarse distance-field shapes. The 35 approved sites have one instanced point draw at strategic zoom; existing labels declutter, prioritizing selected sites and Roma. Their positions and original selection path remain authoritative. Research presentation geometry is faded along with other close detail; research records are untouched.

## Future cartography contract

`world.political_map.set_cartography_layers(colors: Texture2D, boundaries: Texture2D, bounds: Rect2) -> bool` is a rendering input, **not ownership logic**. It accepts:

- `colors`: sRGB RGBA cartography, rasterized externally from real territory geometry. RGB is resolved display colour; alpha is valid coverage. Alpha zero leaves neutral land. Row zero corresponds to the north of `bounds`.
- `boundaries`: optional linear single-channel antialiased coverage from those same actual boundaries. No layer means no borders. Future screen-width styling/LOD belongs to that real-data producer or a later renderer extension.
- `bounds`: longitude/latitude degrees, with positive eastward/northward size, within ±180°/±90°. Terrain/water already use this geography; no alternate coordinate system is introduced.

Replacing/updating a texture changes presentation without rebuilding terrain. A future ownership system may resolve its current owners/palette into these layers; the renderer knows no faction IDs, settlement-to-territory assignments, transfers, elimination rules or province records. Such systems are deliberately absent now. **Never derive these layers from settlement Voronoi cells or guessed historical borders.**

`clear_cartography_layers()` or passing a null colour layer restores neutral, disables boundaries, and releases bound atlases in favour of the shared transparent 2×2 resource. The current game never binds a nonempty cartography layer. No faction or territory examples are seeded.

Global uniforms assume one active campaign world. Multiple simultaneous map viewports needing different presentation weights would require per-viewport/material overrides. Native testing covers the current Forward+ renderer. Legacy-water fallback remains available; its geographic water shader does not implement the new chart-water blend.

Reference study and measured evidence are in `evidence/political-map-20261029/REPORT.md`. Rome II materials were inspected as references only; no game images, geometry, textures or code were imported.
