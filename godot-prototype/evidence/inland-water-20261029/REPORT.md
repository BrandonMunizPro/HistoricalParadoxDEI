# Inland water rendering — 29 October 2026

Lakes and ordinary detailed river ribbons now use the Mediterranean ocean's existing FFT normal textures, history interpolation, filtered wave variance, wind direction, color configuration, sky/sun lighting and pausable water clock. The old lake shader's broad analytic bands and ordinary rivers' flat material have been replaced. [Actual before/after screenshots](comparison.html).

## Architecture and scope

- Added **inland_water.gdshader**: three existing wave cascades supply physical surface slopes and filtered roughness. Inland slopes are attenuated to 80% for calmer water. The sea's existing broad wind fields grow between 4 and 24 km. Both close FFT textures and broad fields use filtered sampling to avoid the earlier map-scale stripe aliasing. Dielectric sky/sun lighting provides reflections; no fake always-visible sun glint or screen-space reflection pass.
- **ocean/ocean_controller.gd** registers inland materials as wave-texture receivers without creating another simulation, displacement patch, mesh or compute pass. They share the same current/previous texture objects and interpolation state as the Mediterranean. Late-created Nile materials register once and inherit the active normal mode. Receiver count is bounded by the two sea materials, shared lake/ordinary river material and Nile material.
- **world.gd** binds the new material to all existing lake triangles and ordinary/arid detailed river ribbons, adds cross-bank UVs to the previously flat ordinary ribbons, and forwards camera distance. Original triangle positions, lake heights, river paths, widths and terrain are retained. Bank roughness remains configurable through the existing river settings. The already-specialized opt-in Roma/Tiber landscape river shader is preserved. Thin distant river cartography remains a separate strategic line layer.
- At 60–180 km, inland water now follows the approved geographic-to-political blend, becoming the same strategic deep-blue water as the Mediterranean. It no longer keeps an unrelated green shaded lake material in fully political views. Existing FFT suspension in full political mode remains intact.
- The ocean surface shader and FFT implementation are byte-unchanged. No geometry displacement is added inland: the existing large lake polygons and narrow river ribbons keep their shores and levels. This is shared animated surface shading, not a new lake wave-height simulation, bathymetry or fluid solver.

## Actual validation

All **11 native checks pass**: shared current/history texture identities and cascade scales; receiver registration; original lake mesh geometry; visible pixel animation; shared clock; reduced-motion freeze; political presentation; paused FFT updates in political mode; late Nile binding; protected geography validation. [Native details](native-two/validation.json).

The lake geometry check compares all **82,935 triangle vertices** with the unchanged lake catalog and regional level overrides. Maximum mesh readback roundtrip error is **0.0000872367672855034 km** (about 8.7 cm; tolerance 1 m), arising from the mesh readback representation. The initial exact-equality test failed on that roundtrip and is retained under native; it was replaced by this explicit tolerance. No source heights/vertices were edited.

The two controlled animation frames at 0 and 2 seconds have mean maximum-channel difference **0.0668309565173462** on a 0–1 scale in the interior-water ROI. Reduced-motion comparison has **zero pixel difference** and no FFT scheduling or clock advance. These metrics verify animation behavior, not artistic quality. [Frame 0](native-two/lake-t0.png) · [Frame 2](native-two/lake-t2.png).

Eight real, unretouched, matched 1920×1080 Godot captures cover Garda, Bracciano, Bolsena, Caspian close/regional/political, Nile, and a Mediterranean control. Camera position/basis match within 0.00001; FOV/clipping match exactly. The **Mediterranean control is pixel-identical** before/after, and all eight draw-call counts are unchanged. Existing navigation regression passes.

All **460 protected files, 35 approved coordinates and 687 research records** pass integrity validation. A task-start comparison of 2,936 source/asset hashes finds exactly the two intended existing runtime file changes. Lake data, masks, terrain, political settings, settlement data, elevations and the ocean surface shader are unchanged. [Aggregate validation](validation.json) · [Changed files](changed-files.json) · [Protection](protected-integrity.txt).

## Performance — before / final

Godot 4.7.2 Forward+, Vulkan, RTX 3060 Laptop. Per view: 120 uncapped VSync-off forced submitted frame intervals after settling. These are short controlled render samples, not sustained gameplay or cold-start tests. FFT texture sampling costs more than the old inland sine/flat materials, but no new simulation, draw call or render target is introduced. All sampled final averages and 1% lows exceed 60 FPS; this does not guarantee every camera or sustained traversal. Normal game cap/settings are unchanged.

| View | Average FPS | 1% low FPS | Mean GPU ms | Draw calls |
| --- | --- | --- | --- | --- |
| garda-close | 243.6 / 223.9 | 168.3 / 152.3 | 3.09 / 3.43 | 24 / 24 |
| bracciano-close | 225.9 / 203.0 | 148.5 / 134.8 | 3.48 / 3.92 | 220 / 220 |
| bolsena-regional | 107.6 / 106.9 | 81.9 / 80.9 | 8.22 / 8.35 | 592 / 592 |
| caspian-close | 286.8 / 255.4 | 189.3 / 171.7 | 2.53 / 2.89 | 8 / 8 |
| caspian-regional | 308.1 / 311.0 | 206.2 / 223.7 | 2.32 / 2.31 | 6 / 6 |
| caspian-political | 164.9 / 166.1 | 126.8 / 127.3 | 5.05 / 5.08 | 16 / 16 |
| nile-close | 108.1 / 102.2 | 85.8 / 77.6 | 7.94 / 8.35 | 143 / 143 |
| mediterranean-control | 151.5 / 168.4 | 95.7 / 111.4 | 5.28 / 4.67 | 8 / 8 |

Raw frame intervals: [before](before/views.json) / [final](final/views.json). No new RAM/VRAM or first-render-stall measurement is claimed.

## Limits and provenance

Existing lake polygon boundaries, turquoise coastal fringes, coarse shoreline/terrain geometry and river bank integration remain visible in some views. No new depth-based shallow coloring, geometric surf, reflection of nearby scenery, river current simulation or erosion is claimed. Wind shading is a shared art configuration rather than measured basin-specific weather; this can be tuned later per inland basin without changing its geography. The no-FFT texture fallback is implemented, but this native validation used Forward+ FFT rather than another GPU/backend.

No new external assets or code were downloaded. The existing FFT source attribution/license remains in ocean/upstream.json and ocean/LICENSE-GodotOceanWaves.txt. New inland shading/adapter code is original project code. No gameplay, ownership, research, interface or The Rev changes. No commits or pushes.

Selected evidence is **before**, **final**, and **native-two**. Candidate is a failed initial script-parse attempt (wrong comment syntax, corrected); candidate-two predates the final camera-distance fallback integration; native is the rejected exact geometry-equality harness. Their logs are retained and are not passing delivery evidence.
