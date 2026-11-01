# Screenshot-directed shoreline repair — 29 October 2026

Inspected the user's three screenshots (18:41:16, 18:41:34 and 18:42:22). The first two expose a gap in the previous validation: low viewing angles can cause false water over land below the old 1,200 km activation threshold. The last shows straight-edged water presentation. A matching class of straight water boundary was reproduced at the existing regional atlas edge. Its exact user-camera location has not been established, so this is not claimed as an exact recreation of that third pose.

[Interactive before/after review](comparison.html) · [Validation](validation.json) · [Changed files and hashes](changed-files.json)

## Implemented

Only **ocean/ocean_surface.gdshader** changed among 2,936 task-start source/asset hashes. Existing terrain, water/land masks, terrain elevations, FFT simulation, world camera and neutral political styling are unchanged.

- Background ocean now receives the existing small reversed-Z raster depth separation at **all zoom distances**. The old smoothstep at 1,200–2,500 km missed the 785–1,087 km shallow-angle cases and distant geometry visible from close cameras. The displaced local wave patch is untouched. No geographic geometry or water elevations move.
- Regional/global shore-distance atlases use different resolutions and distance metrics. Switching between them at a rectangle produced a false diagonal water-color boundary. Color-distance sampling now feathers over **12 km inside the regional atlas edge**, remaining exactly global at the boundary. Land/water clipping, source masks and inland-water exclusions do not blend or move. Both background and local ocean materials use the same calculation. No new textures, draws, compute passes or per-frame CPU generation.
- A tentative parent-terrain clipping experiment did not resolve the observed shape and was reverted byte-for-byte. No speculative terrain change was retained.

## Actual validation

**13 native GPU checks pass.** Ten low-angle/distance poses cover 180, 785.6, 1,087.3, 3,300 and 8,500 km, pitches 8–65 degrees, and rotated views. The previous shader reproduces the failure at 785.6 km / 12 degrees: **1,751 water-colored land probes out of 2,480**, versus **8** after the repair. All ten corrected poses remain below 2% coast-pixel classification error. This does not mean zero coast aliasing. See [native results](native/validation.json) and [pose measurements](native/poses.json).

The same-process matched reproducer [before](native/reproduced-785.6-12.0-0.0.png) / [after](native/repaired-785.6-12.0-0.0.png) is the clearest evidence: camera position is identical while the shader changes. The baseline multi-view sweep's 785 km camera can land on a slightly different floating-point pose and exhibit less speckling; retained separate native images explicitly demonstrate the reproduced defect.

Ten additional matched 1920×1080 captures cover the Caspian, Riga, Tallinn, Black Sea, regional atlas coast, Sicily and close Tarquinii. Camera transforms match within 0.00001, clipping/FOV exactly. The known atlas line's mean green-channel jump falls from **16.9575 to 0.2175** in the targeted water region. This is a line-artifact regression metric, not an art quality score. Close wave comparison changes at most one 8-bit channel step; mean RGB maximum-channel difference **0.000047120102820918** on a 0–1 scale. Close simulation/displacement is unchanged.

Navigation regression passes. All **460 protected files, 35 approved locations and 687 research records** pass the existing integrity validator. No source geography changes, gameplay changes, third-party assets, commits or pushes. Existing image-loading export warnings are retained in logs; no shader/script errors.

## Short performance samples (before / final)

Godot 4.7.2 Forward+, Vulkan, RTX 3060 Laptop. Each settled view records 120 uncapped forced submissions with VSync off. These are short sequential render samples, not a sustained gameplay or clean-cache benchmark. Normal game FPS cap/settings are unchanged. The one atlas-boundary view has a small measured GPU increase; most other samples are slightly faster, which should not be treated as a proven optimization. No new memory-intensive resources were added.

| View | Average FPS | 1% low FPS | Mean GPU ms | Draw calls |
| --- | --- | --- | --- | --- |
| caspian-low | 156.7 / 161.6 | 112.1 / 112.1 | 5.32 / 5.14 | 16 / 16 |
| caspian-horizon | 173.5 / 178.8 | 121.4 / 125.1 | 4.69 / 4.51 | 17 / 17 |
| caspian-785 | 181.4 / 182.4 | 129.7 / 128.4 | 4.49 / 4.48 | 16 / 16 |
| caspian-east | 142.4 / 144.8 | 106.4 / 106.8 | 5.94 / 5.84 | 23 / 23 |
| riga-coast | 217.9 / 223.5 | 139.3 / 146.3 | 3.48 / 3.38 | 8 / 8 |
| tallinn-coast | 98.7 / 99.5 | 76.4 / 71.3 | 8.85 / 8.80 | 185 / 185 |
| blacksea-coast | 132.5 / 136.4 | 95.3 / 99.9 | 6.34 / 6.11 | 205 / 205 |
| regional-boundary | 133.9 / 130.7 | 96.0 / 91.2 | 6.25 / 6.42 | 286 / 286 |
| sicily-close | 88.8 / 89.8 | 68.4 / 68.8 | 9.90 / 9.77 | 316 / 316 |
| tarquinii-close | 153.2 / 161.1 | 108.6 / 111.6 | 5.12 / 4.95 | 8 / 8 |

[Before raw intervals](before/views.json) · [Final raw intervals](final/views.json)

## Remaining limits

The fixes address depth conflicts and texture-atlas seams, not the original coarse shoreline geometry. Close shallow views still expose angular source-mask edges, flattened/coarse terrain, and some floating-looking scenery at clipped/elevated coast edges. Outer dataset boundaries and maximum-zoom finite-plane limits remain. No claim is made that every coast is polished or that the exact third screenshot's location was reproduced. A proper coast geometry/vertical edge pass would be separate from the color seam repair and should use existing geographic evidence; this pass does not invent coastlines or hide the issue by changing the camera.

The selected evidence is **before**, **final**, and **native**. Depth-probe predates color blending; blend-probe predates the rejected terrain experiment; coverage-probe contains that rejected experiment. They are retained for diagnosis, not selected delivery. The three original user images are copied under **user-screenshots** for reference, without altering the originals.
