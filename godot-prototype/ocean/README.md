# Campaign FFT ocean

The main world uses this ocean by default on Forward+/RenderingDevice. `--legacy-ocean` selects the preserved original surface. Headless/dummy rendering falls back automatically. Existing terrain, coast masks, inland-water exclusions, rivers, lakes, camera controls and settlements remain authoritative.

From the repository, run `./godot-prototype/ocean-preview.ps1` for the Tarquinian coast. Optional `-Quality low|balanced|high` and `-WindDirection 28`. The preview is uncapped with VSync disabled. Standard map navigation remains available.

`data/ocean-settings.json` controls intensity, wind, foam, colours, maximum crest displacement and all quality budgets. Quality changes require restarting the scene; this is rendering configuration, not a new gameplay interface. There are no ImGui, C#, audio or demo-project dependencies. Sea spray is deliberately budgeted at zero for the calm preset.

- Low: 128² FFT, two cascades, 65² local grid, 18/8/2 Hz near/regional/far.
- Balanced: 256², three cascades, 129² grid, 24/12/3 Hz.
- High: 512², three cascades, 193² grid, 30/15/4 Hz.

Physical spectra use metres and seconds. World geometry remains kilometres; the adapter converts output displacement by .001. The final crest cap is .75 m, below the renderer's existing minimum land surface of 1 m. Nearshore displacement is damped using the existing masks/distance field. This is a rendering safeguard, not a bathymetric or tidal model.

The single graded local mesh tapers to the global sea plane; it does not create water meshes per terrain tile. Background ray/plane reconstruction avoids close-view interpolation errors across the original 40,000 km background plane. Texture phase is world-space. Two temporal states and filtered slope/second-moment mipmaps keep movement smooth and transfer unresolved wave energy into roughness. Close views resolve interpolated normals on the GPU; intermediate views interpolate histories in the shader; distant views sample filtered moments directly. The ordinary per-level mip reduction remains; an experimental batched tail was rejected after a driver-side test-process crash.

Reference: https://github.com/2Retr0/GodotOceanWaves/ at `a171446f8174348895aaafc426576c26261058b9`, MIT, Copyright (c) 2024 Ethan Truong. The exact license is included as `LICENSE-GodotOceanWaves.txt`; upstream paths and hashes are in `upstream.json`.

Reused/adapted: directional TMA/JONSWAP spectrum, Stockham FFT/butterfly, packed gradient/displacement unpacking, Jacobian-based accumulated foam, transpose kernel, RenderingDevice wrapper and cascade parameter resource. Reference demo scene, clipmap OBJ assets, sky image, particle textures, UI/plugin and audio were not imported. The Shadertoy-attributed hash helper was replaced with an original project avalanche helper.

Compatibility adaptations: exact reflected push-constant sizes; distinct read/write descriptor sets; spectrum texture format matching GLSL; matching workgroup sizes at each FFT resolution; explicit render-thread initialization/update/cleanup; temporal history textures; normal-moment mip reduction; game-unit and coastline adapter; standard Godot dielectric sky/solar reflections instead of the demo's custom light function.

Validation: native `--script res://tools/ocean-validate.gd` requires a real Forward+ GPU, not `--headless`. It checks all three quality presets, finite signed animated waves, mip energy, temporal copies, cleanup and distance geometry budgets. GPU readback occurs only in this validation tool. Capture with `tools/ocean-capture.ps1`; existing stage folders are rejected to preserve evidence.

Limitations: no measured bathymetry, shoaling/refraction simulation, tides, breaking surf, underwater view, ship wakes, planar reflections or terrain SSR. Coastal colour uses the preserved shore-distance field. High-altitude physical waves become subpixel; the shader filters them rather than enlarging them into implausible kilometre waves. Tests do not certify artistic quality or every coastline pixel.
