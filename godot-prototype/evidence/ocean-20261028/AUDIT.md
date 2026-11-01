# Ocean inspection and reference adaptation

Session 2026-10-28/29. The initial seven-view baseline was captured before integration. Initial inspection findings and the integration approach were presented during work; this file consolidates that record.

## Existing implementation

- Godot **4.7.2 official**, Forward+, Vulkan 1.4, **RTX 3060 Laptop GPU**. 1920×1080 evidence, 4× MSAA, 8× project anisotropy. The ordinary world initializes a 120 FPS cap and presentation mode from foundation settings; every performance capture overrides the cap to **0** and VSync to **off after world initialization**.
- The ocean was one **40,000×40,000 km PlaneMesh**, at sea level, with no vertex subdivision/displacement. Its existing shader already had two advected synthesized normal scales, roughness variation, sky/solar lighting, coastal colour and a restrained foam wash. It was not an absent or unanimated water system.
- Shared inverse azimuthal projection and GSHHG-derived masks govern the sea. Italy's regional maps are 7169² over 6–20°E / 35–49°N; global land/ocean/exclusion and shore-distance maps cover the broader campaign. Ocean remains beneath opaque land to avoid parallax gaps. Inland-water exclusions are distinct from the land mask. The original exclusion predicate is retained exactly.
- Terrain uses existing streamed context/regional/degree meshes, a 13-resident-tile budget, parent-height/normal morphing and source-derived heights. Regional degree terrain is typically 128² cells; source coastline sampling is much finer than that mesh but still coarse at beach-level viewing. The optional prior Roma/Aricia terrain experiment is not enabled by this task.
- Rivers and lakes have independent renderers/materials. They are not replaced with FFT ocean surfaces. Source coordinates, elevation files, settlement catalogs and the projection are unchanged.
- Perspective camera FOV 42°, existing variable near/far planes and geographic movement controls are retained. Actual position, basis, FOV, focus and clipping are recorded per screenshot. The ocean adapter uses kilometre world units; the simulation uses metres/seconds.
- Existing startup image uploads, streamed tile conversion, scenery/settlement work and first-use rendering stalls remain relevant. The ocean work does not remove those systems or attribute their costs to the engine.

## Reference inspected outside the project

Cloned to `C:/Users/brand/AppData/Local/Temp/GodotOceanWaves-reference-20261028`. Repository: [2Retr0/GodotOceanWaves](https://github.com/2Retr0/GodotOceanWaves/), pinned commit **a171446f8174348895aaafc426576c26261058b9**. The clone targets Godot 4.3 Forward+. [MIT license](https://github.com/2Retr0/GodotOceanWaves/blob/a171446f8174348895aaafc426576c26261058b9/LICENSE), Copyright (c) 2024 Ethan Truong; exact notice is included in the new ocean folder.

| Component studied | Reuse / adaptation |
|---|---|
| Directional TMA/JONSWAP spectrum and time modulation | Adapted compute code, deterministic seeds, calm wind/fetch presets. Replaced the Shadertoy-attributed hash helper with an original project helper. The spectral depth constant is not a bathymetric dataset. |
| Stockham butterfly/FFT and tiled transpose | Reused MIT kernels. Separate 128/256/512 workgroup-size variants avoid idle threads returning before workgroup barriers. |
| Packed displacement/gradient unpack | Adapted to retain mean slope, slope second moment and foam. Simulation output is metres; geometry applies .001 conversion. |
| Foam | Retained negative-Jacobian generation, accumulation and exponential decay. Strength is restrained; source-mask swash is separate. |
| Lighting | Inspected the demo's custom BSDF. Integration uses Godot dielectric sky/sun lighting and GGX with water-like reflectance, not the demo's complete custom light function. No real-time planar or terrain SSR reflections claimed. |
| Cascades | Three noncommensurate domains (128, 487, 1973 m) with independent seeds, separately weighted displacement/slopes. Low preset uses two. This reduces coherent repetition without inventing kilometre-high waves. |
| Sea spray | Inspected GPUParticles shader and upstream notes about wasted/cut particles. Not imported or instantiated; budget zero for these calm conditions. |
| Clipmap/demo infrastructure | Demo scene, mesh OBJ files, sky image, audio, ImGui and editor plugin were not imported. Existing campaign world remains the main scene. |

Primary source files are linked by their paths and original hashes in [upstream.json](../../ocean/upstream.json). Compatibility was established through native GPU runs, not assumed from the version labels.

## Necessary compatibility and geographic adaptations

1. **Render-thread ownership:** global RenderingDevice initialization, dispatch and cleanup are scheduled on the rendering thread. Texture2DArrayRD exposes GPU outputs directly to materials. There are no playing-frame CPU texture readbacks; explicit validation readbacks are separate.
2. **Godot 4.7 validation:** exact reflected push-constant sizes replace the reference's old 16-byte rounding. Read-only and writable image bindings use separate matching descriptor sets. The spectrum texture format now matches the GLSL rgba16f declaration.
3. **Filtering and animation:** normal-moment mipmaps preserve unresolved wave energy as roughness. Close views resolve temporal interpolation once per texel; intermediate views interpolate histories in the surface shader; distant views use filtered moments directly. Geometry keeps temporal displacement interpolation. FFT frequency varies with camera distance.
4. **Geography:** original land/ocean/inland masks and the shared inverse projection remain authoritative. Shore distance colours/damps the sea; it is not measured depth. Displacement fades near the coast and its final crest cap is .75 m, below the renderer's existing one-metre land floor. Native probes verify signed waves, finite values and temporal history, while file integrity verifies source geography.
5. **Geometry:** the existing global plane is retained as the distant sea. A single camera-centred graded mesh supplies local displacement and tapers to the plane. It has no terrain-tile boundaries. Background ray/plane reconstruction removes an observed precision seam caused by interpolating across the enormous plane.
6. **Fallback:** preserved legacy water is selected by `--legacy-ocean`, disabled settings, headless operation or a non-Forward+ backend. No renderer settings, terrain files or camera implementation were replaced.

Official API references: [RenderingDevice](https://docs.godotengine.org/en/stable/classes/class_renderingdevice.html), [compute shaders](https://docs.godotengine.org/en/stable/tutorials/shaders/compute_shaders.html). For raw GPU timestamp units, the current [Godot class reference source](https://github.com/godotengine/godot-docs/blob/master/classes/class_renderingdevice.rst) specifies nanoseconds; raw deltas remain in the evidence. GPU FFT markers bracket FFT/mip work, excluding history copies and the separate close-view resolve. Viewport timings and full wall-frame intervals have different scopes.

## Rejected experiments

- Candidate 1–2: strict push-constant and descriptor compatibility failures. Invalid as visual/performance evidence.
- Candidate 3: working FFT, but a visible precision line at the local mesh border. Corrected using analytic background coordinates.
- A later experimental mip-tail batching kernel crashed the test process inside `nvoglv64.dll` (signal 11). Exact root cause was not isolated. Its source and logs are retained under the rejected evidence; **it is not referenced or included in the active ocean folder**. The ordinary per-level reduction is retained. No claim is made that the crash was a confirmed Godot or hardware defect.

The final report identifies selected captures and final preset measurements. Earlier captures remain for traceability. Native checks establish functioning and preservation, not independent artistic approval or a universal coast-by-coast guarantee.
