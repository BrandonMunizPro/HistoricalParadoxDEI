Tree sources, retrieved 12 November 2026:

* **Mature olive tree**, Innerscene original model, [source and CC0 declaration](https://www.innerscene.com/tools/library/3d-parts/mature-olive-tree-bc261a43). Stored locally as `olive.glb`.
* **Mature Scots pine tree**, Innerscene original model, [source and CC0 declaration](https://www.innerscene.com/tools/library/3d-parts/mature-scots-pine-tree-280307e1). Stored locally as `scots-pine.glb`.

Both providers' pages explicitly release these models under [CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/). Commercial reuse, modification and redistribution are permitted without attribution; credit is retained voluntarily. `SOURCES.json` preserves the provider's source metadata, license and acquisition record. `manifest.json` records actual local SHA256 hashes; the downloaded GLB can differ from the provider page's older file hash.

The umbrella-pine silhouette is an artistic adaptation of the existing **EZ-Tree** pine geometry, not a scanned Pinus pinea specimen. EZ-Tree by Daniel Greenheck is MIT licensed; the complete notice is retained at `../vegetation-quality/LICENSE-EZ-Tree.txt`. Its needle maps retain that MIT license. Bark maps are AmbientCG Bark001 under CC0; existing notices are at `../vegetation-quality/TEXTURE-LICENSE.md` and `SOURCES.json`.

The date-palm mesh and fronds are original project-authored geometry in `tools/regional-vegetation-bake.gd`, using the same CC0 bark maps. Narrow pinnate leaflets are geometric cutouts, not a photographic scan or an ancient vegetation reconstruction.

Offline baking normalizes units, rotates four asset variants and renders eight azimuths at three elevations, 384 pixels per frame. Runtime only uses local `.res` resources. Models remain available for rebaking; no external URL is fetched by the game.

Regional selection is a broad artistic/climatic approximation. It does not establish ancient woodland coverage, land use, faction culture or political control. Broadleaf, ash, conifer, columnar evergreen and scrub meshes reuse the earlier licensed library. Additional species-specific work is still needed for South Asian woodland, steppe shrubs and arid acacias. Southern Indian palms retain their existing fallback rather than receiving date palms.
