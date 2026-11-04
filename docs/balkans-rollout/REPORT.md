# Illyria and mainland Greece: regional visual pass

This batch runs in the regular Godot campaign (`world.tscn` → `northern_italy_world.gd`). It extends the accepted Italy/Sicily style. Alpine snow treatment is deferred at the user's request; no Alpine source assets or snow shader were edited. Crete, the wider Aegean, Thrace and Anatolia remain later work areas.

## What changed

- `data/cartographic-rollout.json` and `cartography_rollout.gd` define explicit presentation coverage for the eastern Adriatic, Illyrian interior, Epirus, Macedonia, Thessaly, central Greece and Peloponnese. These masks never assign sovereignty, region membership or control centres.
- `tools/balkans-build.mjs` reuses the existing Greek physical detail sources and imports missing Copernicus GLO-30 samples for the Dinaric/Pindus terrain. Geographic positions use the existing azimuthal projection and 1.5 vertical scale. Ridges and valleys come from elevation samples, with no invented peaks or added snow.
- `balkans_surface.gd` and its shader include render that physical detail through the existing terrain materials. Strategic geometry uses 225,280 triangles; close geometry uses 3,604,480 triangles, split into two assets below 80 MB each. Both use the same source-normal field. There is an abrupt LOD threshold at 250 km; continuous LOD and more efficient regional streaming remain future presentation work.
- Terrain and the existing water shader share a 512-sample-per-degree GSHHG coastline mask, including the Adriatic islands. Existing lake rings remain authoritative exclusions. The shared mask avoids independently shifted land/water clipping. Shore distance affects water colour, not bathymetric depth.
- Existing political polygons are rasterized at 512 samples/degree into a separate identity texture over 14–25 E, 36–46 N. This fixes raster stair-stepping without smoothing away coastlines or changing source boundary coordinates. It cannot fix straight or implausible source polygon edges.
- Political fill keeps the reviewed 0.24 replacement strength. Ownership-identity edges are antialiased; border contrast has its own scoped contribution. Palette updates retain the existing stable region ID → raster index → faction owner relationship.
- `northern_italy_labels.gd` adds researched Greek/Illyrian settlement names, strategic density reduction in the new area, collision avoidance and distinct settlement/faction/geographic type sizes. Faction emblems remain screen-facing. Settlement labels use researched coordinates; faction label anchors do not define territory or capital authority.

## Geographic evidence and limits

[Copernicus DEM documentation](https://dataspace.copernicus.eu/explore-data/data-collections/copernicus-contributing-missions/collections-description/COP-DEM) describes the modern surface model and reference systems. [GSHHG](https://www.soest.hawaii.edu/pwessel/gshhg/) supplies physical coastline geometry. Per-tile URLs and hashes are in `godot-prototype/data/balkans/manifest.json`; attribution is beside it. Modern coastlines and DSM surfaces are not a reconstruction of ancient shorelines, vegetation or settlement fabric.

All 128 legacy political geometries, initial owners, settlement coordinates and historical research records are preserved. No new permanent region boundaries, control centres or settlement memberships were approved or activated in this pass. The accepted hybrid model remains available, with the earlier geographic review/approval gate intact.

Existing data explicitly identifies Antigonid Greek holdings separately from secure Macedonian kingship. Macedonian claimant territory and several Illyrian tribal envelopes remain provisional. The source records warn that some tribal extent/name associations may be attested later. This visual pass provides no new evidence that would justify rewriting those claims. Source gaps continue to mean unassigned/unknown coverage, not empty land, neutral diplomacy or an active military contest. The existing display label “Macedon (contested)” is inherited scenario terminology; it does not introduce a gameplay conflict state.

Straight tribal envelope edges, overlaps and incomplete Greek coverage still need a dated political geography dossier. Capitals and smaller regional subdivisions require explicit review. No arbitrary boundaries were generated to conceal those gaps.

## Verification and inspection

`REVIEW.html` presents ten matched cameras: strategic Illyria and Greece, Dalmatian coast, Epirus, central Greece, Peloponnese, Macedonia, Pindus at an oblique angle, and Italy/Sicily controls. Camera position, full basis, FOV, clipping planes and presets must match exactly. Water animation is frozen at the same time in both captures. These are controlled map views with most interface layers hidden, not evidence of a redesigned interface.

The fresh ownership diagnostic temporarily gives Aetolian territory the same owner as its Antigonid neighbour, then changes only Aetolia to Rome. It verifies one palette entry changes, geometry/raster bytes stay fixed, the target pixels change and the neighbour pixels do not. Original owners are restored; this is deliberately nonhistorical test state, never a new campaign setup.

The existing automated suite, native scope/membership checks, screenshot checks and exact source hashes are recorded with this report in the logs and `verification.json`. The suite cannot judge convincing relief, historical sovereignty, label crowding, coastline plausibility or quality while moving the camera. Passing tests does not constitute visual acceptance.

Remaining inspection concerns: coarse/provisional political source shapes; transitions to untreated neighbouring areas visible in wide views; close vegetation appears speckled; the source mesh remains coarse at very close range; some inland water elevations/shore contacts need inspection; collision avoidance can suppress labels; the 250 km geometry LOD can pop during zooming. Low-angle coastal clipping and export packaging need separate interactive/export checks. Existing raw-image loading export warnings remain in the engine logs.

The new near geometry and textures add resident memory and startup work. Capture timing is uncapped hidden-window submission timing, not a sustained interactive benchmark. Review the recorded per-view timings and manually pan/zoom before accepting performance. Stop at this regional review; do not extend the treatment globally.

## Recorded results

- Existing suite: **37 files / 514 tests passed**. Native scope, multi-settlement membership/centre validation and regular campaign startup pass. A headless startup regression introduced while binding both ocean materials was caught and fixed: headless mode uses the fallback water material because it has no GPU ocean controller. Final native and GPU capture logs contain no script/shader errors. Existing image/export warnings remain.
- **Ten exact matched cameras**, with representative strategic, regional and oblique images inspected. The source alignment checks compare published Greek grid samples directly; the split terrain meshes have identical shared-edge positions and normals.
- Greek ownership locality: exactly one palette entry changes. Target pixel delta is recorded in `verification.json`; neighbour pixel delta is **0**. All owners are restored. Original geometry, initial owners and protected research/settlement hashes pass.
- The fixed 800,000-pixel completed-area crops differ at only **nine pixels in Italy and eight in Sicily**, by one 8-bit channel level each. These isolated differences are consistent with shader rounding. The full views show intended changes where the newly treated eastern shore appears at the distant right horizon; those differences are recorded separately, not hidden by the crop.
- The physical source catalog contains 64 tile locations: 20 published Greek detail tiles, 25 existing raw cached tiles, 16 newly sampled cached tiles, and three absent sea-only DSM tiles that retain the existing world fallback. No source files were overwritten.
- Interactive performance has **not** been accepted. Per-view submitted timings are diagnostic only and show substantially greater rendering cost than the flat political baseline. The detailed mesh and new textures increase memory, and moving-camera LOD behaviour remains a manual review item.

The final eight Illyria/Greece view means are approximately **24–38 ms**, compared with **4–12 ms** in the flatter baseline. Italy/Sicily full-view control timings also increase. The reduced border path removes redundant work, but does not resolve this regression. More terrain shading, source detail and shader complexity remain material costs. These measurements do not establish interactive FPS; they do establish that performance needs further profiling/optimization before this becomes an accepted template for later regions. The regional visual candidate is ready for inspection, with that limitation explicit.
