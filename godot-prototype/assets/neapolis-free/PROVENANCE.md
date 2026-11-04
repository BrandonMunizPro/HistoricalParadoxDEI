# Neapolis free residential experiment

Only Neapolis can opt into these meshes. The existing population renderer retains its deterministic slots, resident selection, MultiMesh batching, and baseline mesh. No archaeological site coordinates or political data are edited.

## Acquired source

- Kenney, **Fantasy Town Kit 2.0**: https://kenney.nl/assets/fantasy-town-kit
- License: **CC0 1.0**; see the original `source/License.txt`. Commercial use and redistribution are permitted; attribution is optional. No purchase or paid dependency.
- Original archive: `source-cache/neapolis-free/kenney_fantasy-town-kit_2.0.zip` (outside Godot resources).
- SHA-256: `1a7530c09f4d2fa2cdee259876f089334f8b1f27fa86a0c4f54ef86cdd8676ef`.
- Acquisition uses the official page's short-lived download link, not an unofficial mirror. Reacquire through the product page if that signed link expires.
- Selected original GLBs, palette, and license are retained in `source/`. Original model coordinates use Y up. Inventory and exact source bounds/counts: `source-cache/neapolis-free/inventory.json`.

The complete kit's medieval/fantasy buildings are **not** used as ancient housing. Plain wall, square doorway, small window, gable roof, and wood-post components are baked into new interpretive courtyard assemblies. No windmills, half-timber houses, turrets, or fantasy landmarks are adopted. Roof pitch is reduced; source palette materials are replaced. Spare roof modules retained for source inspection are not necessarily used in the bake.

## Materials

The assemblies reuse the existing Roma CC0 Poly Haven plaster and clay roof texture sets; see `../roma/PROVENANCE.md` and its original manifest. Sources: https://polyhaven.com/a/plastered_stone_wall and https://polyhaven.com/a/clay_roof_tiles . No new texture set is downloaded. Final plaster uses a plain warm color with the existing normal/roughness maps; roofs use all three existing maps. These five referenced images decode to 11 MiB; campaign GPU texture allocation rises by 14 MiB. Photographic modern materials approximate plaster and terracotta; they do not establish ancient construction details. Posts use a plain rough material.

## Derivation and limits

`tools/neapolis-free-inventory.mjs` inventories/extracts the selected sources. `tools/neapolis-free-bake.gd` builds three reusable, open-courtyard compounds and their simpler far meshes, converting metres to the campaign's kilometre units. Each assembly is one baked mesh with two or three material surfaces; no wall-by-wall runtime scene hierarchy. `assemblies.json` records actual triangle counts and bounds.

Broad courtyard/pastas precedents: University of Michigan Olynthos Project, https://sites.lsa.umich.edu/olynthos-project/olynthian-houses/ ; University of Bonn Priene housing project, https://www.iak.uni-bonn.de/de/institut/abteilungen/klassische-archaeologie/forschung-1/projekte/priene-wohnen-in-einer-hellenistischen-stadt . These are comparative Greek precedents, not evidence for a particular Neapolis house in 278 BCE. No rooms are assigned proven archaeological functions. Existing campaign building footprints are schematic and enlarged for readability; imported modules do not make those footprints surveyed archaeology.

Neapolis housing is enabled in normal campaign play. Run `--neapolis-neutral-baseline` to restore the original appearance for comparison. The change remains limited to Neapolis.
