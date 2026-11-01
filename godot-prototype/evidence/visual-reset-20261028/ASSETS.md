# Asset evaluation, sources and licenses

Status: evaluation only. No new third-party art is connected to the campaign scene. Accessed 2026-10-28. Download hashes, bytes and exact URLs are in [source-evaluation/download-manifest.json](source-evaluation/download-manifest.json); original actor descriptions and static geometry are retained beside it.

| Candidate | Verified source/license | Decision |
|---|---|---|
| Four 0 A.D. Roman houses A–D, shared atlas/normal/specular, per-house AO | [Wildfire Games art license](https://github.com/0ad/0ad/blob/master/binaries/data/mods/public/art/LICENSE.txt), CC BY-SA 3.0; [original actors](https://github.com/0ad/0ad/blob/master/binaries/data/mods/public/art/actors/structures/romans/house.xml) | Downloaded, converted and rendered separately. 925–1,376 triangles each; shared 1K atlas. Not accepted as a modern or 278 BCE-verified showcase kit. |
| 0 A.D. Capitoline, farmstead and storehouse | Same upstream art license; actor XMLs inspected and retained | Meshes not downloaded. Capitoline actor requests separate pediment/quadriga/statues; importing only the named base mesh would omit those dependencies. Date suitability unresolved. No later imperial monuments imported. |
| Existing Roma plaster | [Plastered Stone Wall, Rob Tuytel](https://polyhaven.com/a/plastered_stone_wall), [Poly Haven CC0](https://polyhaven.com/license) | Already integrated before this task; 1K color/normal/roughness. Retain as a material source, not evidence of a new overhaul. |
| Existing Roma roof | [Clay Roof Tiles, Amal Kumar](https://polyhaven.com/a/clay_roof_tiles), CC0 | Already integrated, 1K color/normal/roughness. Generic scan does not by itself establish ancient tegula/imbrices dimensions or layout. |
| Timber | [Wood Planks](https://polyhaven.com/a/wood_planks), CC0 | Material candidate, no new download. Weathering/plank pattern must be scaled and screened for the intended timber assembly. |
| Terrain | [Rocky Terrain](https://polyhaven.com/a/rocky_terrain), CC0 | Material candidate, no new download. Useful surface channels do not replace local terrain geometry. |
| Road paving | [Cobblestone Floor 02](https://polyhaven.com/a/cobblestone_floor_02), CC0 | Not selected: neat small square cobbles are not evidence of Roma street paving in 278 BCE. Need screened compacted aggregate/earth and appropriate stone treatment instead. |
| Broader stone/soil material source | [ambientCG license](https://docs.ambientcg.com/license/), CC0 | Verified reusable library. No specific tuff scan verified; no material downloaded or claimed integrated. |
| Pine Tree 01, Rico Cilliers/Rob Tuytel | [Poly Haven asset](https://polyhaven.com/a/pine_tree_01), CC0; exact file metadata in `source-evaluation/pine-files.json` | 1K Blender file alone 570,739,325 bytes; skipped the large download. Species suitability and conversion/LOD dependencies unresolved. This is a budget/suitability decision, not proof Godot cannot load it. |
| Tree Small 02, Rico Cilliers | [Poly Haven asset](https://polyhaven.com/a/tree_small_02), CC0 | Catalog/page inspected; botanical identity and Roma suitability not established. No download. |
| Romano-British house, Andy Woodhead | [Author's model and CC Attribution notice](https://sketchfab.com/3d-models/romano-british-house-in-medieval-london-free-a13b6ace269945a78918518d69378eef) | Rejected for period/context mismatch: author describes Roman Britain and later Saxon/Viking modifications. Not downloaded. |

## Attribution and derivative terms for the retained trial

The 0 A.D. mesh, atlas, map and actor files originate from **[Wildfire Games](https://wildfiregames.com/)** and 0 A.D. contributors and are retained under **[Creative Commons Attribution-ShareAlike 3.0](https://creativecommons.org/licenses/by-sa/3.0/)**. The upstream [LICENSE.txt](source-evaluation/LICENSE.txt) is included. It explains the special permission covering the project's altered CGTextures-derived textures; this does not license unrelated original CGTextures material.

`source-evaluation/house-a.json` through `house-d.json`, `conversion.json` and `godot-house-evaluation.png` are this experiment's adapted geometry/render outputs. They are likewise distributed under CC BY-SA 3.0, credit Wildfire Games, and mark these changes: static mesh extraction, polygon triangulation/winding conversion, coordinate/UV conversion, scene transforms and inspection lighting/material approximation. The source files remain available so the adaptation can be inspected and modified. No source engine code was imported.

The original files are kept at their original geometry resolution; this test did not upscale textures or add invented detail. All newly downloaded models/maps are quarantined beneath an evidence `.gdignore`, loaded only by the explicit inspection script. The source catalog API was used for metadata research; [Poly Haven](https://polyhaven.com/) supplies the catalog. No payment, account login or commercial game extraction was used.

Existing geographic dataset notices, Pleiades research attribution and the existing Roma asset manifest remain in their original files. This evaluation manifest does not replace those licenses or claim a new license over the protected research/geographic data.
