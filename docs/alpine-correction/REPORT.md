# Alpine terrain and snow correction

The high Alps contain glaciers and persistent high snow/firn, while lower slopes and valleys have seasonal cover. Snow distribution varies with elevation, aspect, precipitation and season. A pale blanket over the whole mountain range would be misleading. Modern observations also cannot establish a precise 278 BCE snowline or glacier boundary.

References: [Alpine climate review](https://comptes-rendus.academie-sciences.fr/geoscience/articles/en/10.5802/crgeos.288/), [Swiss climate service: snow and glaciers](https://www.nccs.admin.ch/nccs/en/home/sectors/water-management/auswirkungen-auf-den-wasserhaushalt/snow-and-glaciers.html), [Copernicus Alpine glaciers](https://climate.copernicus.eu/alpine-glaciers). These establish physical context, not ancient geographic extents.

## Confirmed implementation problems

The existing regional manifest explicitly states that finer Copernicus coverage ends at 46 N and begins at 9 E. The remaining Alpine arc uses approximately 3–4 km world samples, and the regional backdrop has only 32 cells per degree. Several important western/northern crest areas therefore used visibly smoothed terrain.

The original snow shader used elevation but applied a muted grey snow tint before the subsequent macro-color and political blends. The visual result did not clearly distinguish high rock/snow from the green lower landscape. The campaign has no implemented seasonal snow simulation; this correction does not add one.

## Delivered

`tools/alpine-build.mjs` reads existing cached Copernicus samples where available and retrieves the missing bounded GLO-30 samples using COG range requests. Original source-cache files are not rewritten. All 40 tile URLs and sampled-data hashes are recorded in `data/alpine/manifest.json`, with attribution alongside it. Source documentation: [AWS dataset registry](https://registry.opendata.aws/copernicus-dem/), [Copernicus collection and terms](https://dataspace.copernicus.eu/explore-data/data-collections/copernicus-contributing-missions/collections-description/COP-DEM).

The source is a modern digital surface model. Output is resampled to approximately 650–870 m spacing, **not** a 30 m rendered mesh. The pixel-centre/geographic-vertex correction follows the existing importer. The bounded surface covers 6–16 E / 44–48 N, with an edge blend into the existing backdrop. Original DEMs, approved coordinates, lakes, research records and political polygons are retained.

`alpine_surface.gd` supplies two mesh levels: 1,310,720 triangles below 250 km camera distance and 81,920 farther away. This avoids submitting the close mesh from the 300 km Po Valley view. It retains the existing 1.5 vertical scale and creates no procedural mountains. Labels query the sourced surface elevation. The original terrain is clipped under the detailed surface, with a common footprint; existing lake-mask clipping remains active. Meshes are hidden beyond the existing regional rendering range.

`alpine_surface.gdshaderinc` adds source-derived normals, exposed high-elevation rock and a static snow/firn approximation. Snow increases through a roughly 2.85–3.45 km presentation band, with an aspect adjustment and reduced accumulation on steep rock. Those parameters are explicitly artistic late-summer/high-elevation approximations, not inferred historical climate. Snow is applied after the macro-color blend and political replacement is weakened over snow so it remains legible. Foothills/low valleys remain snow-free. No calendar, season, weather or glacier gameplay system is introduced.

The normal campaign loads the correction through `northern_italy_world.gd`. `--alpine-baseline` disables the new surface for troubleshooting. No change is made to the Illyria/Greece rollout queue.

## Review and verification

Five matched pairs: strategic Alps, regional crest, oblique mountain view, Po Valley control and Sicily control. Saved position, basis, FOV, clipping planes and focus/distance/pitch/yaw are checked exactly by `verify.mjs`. `REVIEW.html` presents the pairs. Source-preservation hashes and a Sicily image comparison are recorded in `verification.json`.

The existing ownership-isolation regression is rerun against the Alpine surface in `evidence/alpine-correction/validation`. It verifies that changing one owner's presentation does not change neighboring ownership or geographic rasters, and restores the diagnostic owners. Those temporary assignments are not historical campaign data.

Existing automated suite: 37 files / 514 tests passed. GDScript parses and the rendered views are inspected separately from those tests. Existing raw-image/export warnings remain; source-project rendering does not certify packaged export. Native logs are checked for script/shader errors.

## Remaining limits

The sampled surface still smooths narrow peaks, cliffs and individual glacier landforms; the maximum output sample is approximately 4,463 m and must not be mistaken for the surveyed maximum Alpine summit. Mesh and normal detail improve the arc substantially but are not photorealistic rock geometry. Modern ice-surface elevations are not an ancient glacier reconstruction. Source political envelope gaps and boundary seams remain inherited issues, visible in both baseline and corrected views. Snow persistence varies in reality; the chosen static surface is not a claim that all rendered snow survives every summer.

Review frame timings are recorded per view. Additional near mesh triangles and textures have a rendering/memory cost; tests and screenshots alone do not establish sustained performance on other hardware.
