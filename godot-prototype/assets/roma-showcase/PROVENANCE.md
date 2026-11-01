# Roma showcase art provenance

This is a Roma-only, opt-in presentation candidate. No commercial-game art or 0 A.D. artwork is used by these meshes. All mesh construction in `roma_showcase_kit.gd` and district composition in `roma_showcase.gd` are original project work. The illustrations of early Republican architecture are interpretations, not surveyed reconstructions or evidence that every detail existed in 278 BCE.

## Reusable material sources

New downloads are nine 2K JPEG maps (20,958,794 bytes total): albedo, OpenGL normal and roughness for each of the following. Exact download URLs, byte sizes and SHA-256 hashes are in `manifest.json`.

- [Stone Wall 02](https://polyhaven.com/a/stone_wall_02), [Poly Haven CC0 license](https://polyhaven.com/license). Used as generic weathered masonry; not claimed to be a scan of Republican Roman tuff.
- [Rough Wood](https://polyhaven.com/a/rough_wood), Rob Tuytel, CC0.
- [Aerial Grass Rock](https://polyhaven.com/a/aerial_grass_rock), Rob Tuytel, CC0. Surface color/normal detail, not a source of new geographic relief.

The revised precinct additionally uses the albedo, OpenGL normal and roughness maps from [Grass Path 2](https://polyhaven.com/a/grass_path_2), Rob Tuytel, CC0. These three 2K files are recorded separately in `path-manifest.json`; the review's complete `asset-manifest.json` combines both downloads and the reused/generated maps. No building, tree or geographic asset pack was downloaded.

The following files were copied byte-for-byte from already-present, attributed project material sources so the showcase can have independent 3D import settings:

- `plaster-*.jpg`: [Plastered Stone Wall](https://polyhaven.com/a/plastered_stone_wall), Rob Tuytel, CC0; existing `assets/roma/manifest.json` retains source URLs.
- `roof-*.jpg`: [Clay Roof Tiles](https://polyhaven.com/a/clay_roof_tiles), Amal Kumar, CC0; existing `assets/roma/manifest.json` retains source URLs.
- `gravel-color.jpg`: existing `assets/foundation/rocky-ground.jpg`; see that folder's provenance and original notice.

No paid assets, whole game downloads, proprietary shader/code extraction or copyrighted Total War assets were used. Texture filtering and compression are configured by `tools/showcase-import.mjs`. Regeneration uses the original source images, explicit mipmaps and VRAM compression. The original materials elsewhere in the project retain their existing loading path.

## Original generated foliage bitmap

`holm-oak-branch.png` was generated specifically for this project with the built-in image generation tool and the `imagegen` skill. It is an AI-generated game texture, not a botanical photograph, not a scanned model, and not labeled CC0. Its alpha cutout is mapped to branch cards on original forked tree meshes. Geometry and shading do not assert botanical measurement accuracy.

Saved project path: `godot-prototype/assets/roma-showcase/holm-oak-branch.png`.

The exact generation prompt:

> Create one production game foliage texture asset, NOT concept art or a scene: a realistic dense branch cluster of Mediterranean holm oak (Quercus ilex), isolated on genuine transparent alpha. Square image. One connected spray filling central 85% of image, about 70 small leathery oval evergreen leaves, irregular overlapping organic branching structure, dark muted olive-green tops and a few silvery undersides, slender brown twigs visible between leaves. Natural asymmetrical silhouette with holes between leaf groups, no large solid blob. View straight down at the flattened spread, orthographic, even neutral diffuse lighting, no cast shadow, no background, no soil, no container, no text, no borders. Sharp detailed leaf margins and subtle veins. This will be mapped onto 3D branch cards, so avoid perspective, glossy studio highlights, lighting gradients and any shadows painted around the object. Original asset, do not emulate any commercial game's textures.

Only this texture uses image generation. Review screenshots are actual Godot viewport captures. No generated city image is presented as engine output.
