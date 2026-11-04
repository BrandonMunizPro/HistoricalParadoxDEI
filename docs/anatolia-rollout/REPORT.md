# Anatolia regional campaign-map pass

Follow-up: [Anatolia identities, terrain and streaming refinement](../anatolia-refinement/REPORT.md), with [15 matched comparisons and zoom playback](../anatolia-refinement/REVIEW.html). This original report remains the first-pass record.

Available in the regular campaign scene. This pass covers the western Anatolian coast and adjacent shore islands, Bithynia, the plateau, Taurus, Cappadocia, Pontic ranges and eastern Anatolian approaches. It does not activate the remaining Caucasus, Thrace, Crete, Cyprus or Levant rollout areas. Alpine snow remains deferred.

## Geography and ownership

Approved settlement coordinates, all historical research records, initial ownership and the 128 legacy political geometries remain unchanged. No new region boundary, capital or settlement dependency has been invented. Terrain tiles are physical rendering subdivisions, not administrative or conquerable regions.

`data/anatolia/territory-ids.png` rerasterizes the existing polygons with the same scanline precedence and original raster indices. `anatolia_surface.gdshader` reads the existing palette and owner-identity lookup. A transfer changes one region's palette entry; identical owner identities suppress internal political edges. This reuses the accepted geography/ownership separation and introduces no conquest or military mechanics.

The existing Galatian records explicitly describe arrivals in 278 BCE and retain presence markers rather than later fixed Galatian territorial divisions. Their labels are not proof of settled ownership. The [Ohio State Herodotos Project](https://u.osu.edu/herodotos/%CE%B3%CE%B1%CE%BB%CE%AC%CF%84%CE%B1%CE%B9/) discusses the 278/277 alliance with Nicomedes; [Livius on Zipoetes II](https://www.livius.org/articles/person/zipoetes-ii-of-bithynia/) illustrates the contemporary Bithynian succession conflict. These references support caution about precise starting control, not new surveyed borders. Existing Seleucid, Ptolemaic, Pergamene, Pontic and dynastic envelopes still require a separate dated boundary review.

The new coast is sharper **modern** GSHHG geometry. It is not an ancient coastline correction. [UNESCO's Ephesus account](https://whc.unesco.org/en/list/1018/) and [published palaeogeographical research](https://kups.ub.uni-koeln.de/6368/) document harbour/delta changes. Ephesus and the Maeander/Miletus coast need a palaeoshoreline dossier before any approved coordinate or ancient shoreline correction. Existing sites were not moved to make them meet the modern sea.

Unassigned source coverage remains unknown/unassigned; it is not silently converted to neutral sovereignty or active military conflict. Straight and disputed source borders remain visible. There is no inferred capital authority from a faction label anchor.

## Physical and visual implementation

- `tools/anatolia-build.mjs` reads Copernicus elevation samples, existing Greek detail tiles near the western shore, and the existing GSHHG archive. Published tiles already have geographic vertex alignment; only raw DSM samples receive pixel-centre reconstruction. Per-source URLs/hashes live in `data/anatolia/manifest.json`.
- The existing azimuthal projection and 1.5 vertical scale are retained. Source heights and normals show Taurus/Pontic barriers and plateau valleys without generated peaks or decorative snow. The regional edge blends into the existing world heights; close-tile edges match the shared backdrop.
- The independent raw overview tiles had shared-edge discrepancies of up to **586.6 metres** before reconciliation. The derived grids now average shared geographic edge vertices, following the existing Greek importer. This removes a confirmed physical-data assembly seam; raw research/source files remain intact. It is a rendering derivative correction, not a historical border change.
- `anatolia_surface.gd` supplies one continuous backdrop (294,912 triangles) and streams at most 24 close tiles (32,768 triangles each). Close tiles unload on leaving the area. The finer geographic-normal field is shared across both levels. Tile changes are discrete; further LOD polish may be warranted during interactive zooming.
- `anatolia_surface.gdshader` is a simpler regional material using the existing macro/ground assets, world lighting and atmosphere. It keeps the reviewed 0.24 political replacement and a separate antialiased ownership-edge contribution. It avoids reproducing the full noisy terrain texture stack for this region.
- Terrain and both existing ocean meshes share the same new land/ocean masks and shore-distance field. FFT waves and Mediterranean water lighting remain the existing systems. Shore distance is a colour/damping aid, not an invented bathymetry model. Inland water rings are retained; individual lake shore/elevation contacts still require inspection.
- The existing settlement/faction/geographic text hierarchy gains researched Anatolian names, strategic density limits and screen-facing emblems. Large empires can receive a regional presentation label: its faction is read from the current region raster/owner state. Those display anchors are neither new settlements nor capitals.
- Common label rendering now curates research once, reuses the existing ownership-refreshed faction anchor cache, culls off-screen labels before expensive height queries and shares height results between label-offset attempts. Appearance outside the work area is checked with matched controls. These changes address repeated CPU work without extending the visual rollout.

Physical source references: [Copernicus DEM product documentation](https://dataspace.copernicus.eu/explore-data/data-collections/copernicus-contributing-missions/collections-description/COP-DEM), [Copernicus AWS distribution](https://registry.opendata.aws/copernicus-dem/), and [GSHHG](https://www.soest.hawaii.edu/pwessel/gshhg/). Modern DSM includes modern surface features and does not establish ancient land cover. Attribution and the archived GSHHG licence notices accompany the derivatives.

## Verification and remaining issues

`REVIEW.html` pairs eleven exact cameras: Anatolia strategic, Ionia, Lycia, Taurus oblique, Cappadocia, Pontic ranges, Bithynia, eastern Anatolia, and Greece/Italy/Sicily controls. Positions, orientation bases, FOV, clipping planes and presets match. Water time is frozen for each image. The harness hides most interface panels; it does not demonstrate an interface redesign.

The nonhistorical ownership diagnostic temporarily gives Bithynia its Paphlagonian neighbour's owner, then changes Bithynia alone to Rome. It checks one changed palette entry, unchanged geography/raster bytes, changed target pixels and unchanged neighbour pixels. Initial owners are restored. The diagnostic is never saved as campaign setup.

The verification script checks protected source hashes, stable geometry/initial owners, exact cameras, source sample alignment, mesh-edge alignment, bounded streaming, startup logs and the existing automated suite. An initial concurrent suite run hit two 5-second source-hash test timeouts; the rerun is recorded separately. No test timeout was enlarged or disabled.

Manual review remains necessary for historical boundaries, modern versus ancient shorelines, lake contacts, emblem/settlement crowding, low-angle seams, close scenery speckling, LOD transitions and performance while moving the camera. The initial candidate showed excessive repeated label CPU work; diagnostic timing fields now distinguish labels, regional updates, render CPU and GPU cost. Hidden-window submitted intervals are not sustained interactive FPS and should not be used as a performance acceptance claim.

The pass stops at Anatolia for review. Source border uncertainty, ancient harbours, very close terrain fidelity and export packaging remain unresolved; existing image-loading export warnings are retained in the logs. Passing tests and producing screenshots do not constitute final historical or visual acceptance.

## Recorded results

- Existing suite rerun: **37 files, 514 tests passed**, using four workers without capture contention. The initial run's two timeouts are retained in `tests.log`; final results are in `tests-final.log`. Native scope, ownership/membership foundation, regular startup and streamed-terrain validation pass.
- The streaming fixture loaded **14** close tiles within the 24-tile cap, checked CPU label heights against displayed mesh vertices, and verified release on leaving Anatolia. Published source sample alignment, shared mesh edges, protected research/settlement hashes and all 128 geometry/initial-owner records pass.
- Eleven before/after cameras match exactly. The Bithynia diagnostic changes exactly one palette entry and target appearance; Paphlagonian neighbour pixel delta is **0**. Original owners are restored.
- Italy and Sicily completed-area control crops are **pixel-identical**. The Greek control has sparse pixel/antialiasing differences after the terrain shader extension: mean absolute channel delta about **0.0031 out of 255**, with 24 of 800,000 crop pixels differing by more than one channel level. That variation was inspected and recorded, not described as pixel identity or hidden by a broad tolerance. See exact figures in `verification.json`.
- CPU label work was measured separately from GPU cost. The initial strategic candidate recorded about **13.8 ms** for its label draw; an optimized diagnostic recorded about **4.2 ms**. Final per-view submitted, GPU and label timings are presented together in `REVIEW.html`. Capture scheduling and hardware state are not normalized benchmarks, and interactive performance remains a manual acceptance item.
