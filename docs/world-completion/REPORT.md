# World terrain, Alpine continuity and border review

The Alps–Gaul join now uses one continuous sourced terrain section. The empty
strip and political color band are removed. The remaining land within the
existing campaign bounds receives regional terrain, and the square provisional
faction envelopes are replaced with terrain/river-informed drawing.

[Open the Godot visual review](REVIEW.html). The [complete territorial audit](BORDER-AUDIT.md)
distinguishes dated source models from provisional tribal associations.

## Alpine join

Two independent problems caused the strip. The older Alpine overlay and Gaul
backdrop feathered towards different legacy parent surfaces. In addition, the
political shader selected the Italian/Sicilian raster in the halo outside its
valid geographic area. That could turn an otherwise owned strip neutral.

Gaul's physical section now includes the Alpine chain, and the older overlapping
Alpine mesh is disabled while this section is active. Source normals, the
existing high-Alpine material response and snow treatment remain. Terrain
coverage determines visibility; it no longer flattens source heights against
an unrelated old backdrop. The same height-continuity correction applies to
the shared regional adapters, retaining near-tile edge and reveal transitions.
Original `source-metres.bin` inputs are unchanged.

An additional pale band at the northern authoring edge came from political
opacity fading with terrain coverage. Regional material quality and political
fill are now constant within their drawn fragments; coverage feathers control
visibility only. This removes the bright paint stripe without disguising it
with fog or moving a political border.

The older Italian parent uses that same constant response. Removing its separate
macro-color blend also removes the horizontal material boundary visible south
of the Alps and the pale patches near Massalia in the wide Gaul view.
Retiring the overlay removes its clipping rule from all inherited materials,
including the Balkan overlay, so northern Illyria does not lose fragments that
the Gaul mesh also excludes in favor of Balkan terrain.

Atlas selection now respects actual atlas bounds and gives the Balkan atlas
priority in its geographic scope. All reviewed border rasters are generated
from the same derived scenario, so regional and global layers agree.

## Remaining terrain

Ten physical sections complete the existing extent: Mediterranean islands,
northwestern Europe, northeastern Europe, central Europe, Pontic/Caucasus
terrain, the Eurasian steppe, Arabia, the Mesopotamian/western Iranian
transition, Iran/Afghanistan, and the western Indus/Indian edge. This includes
Sardinia, Corsica, Crete and Cyprus. Section names describe authoring coverage,
not political ownership or new campaign states.

The coverage audit samples 3,322 land points at one-degree intervals with no
uncovered points. This is not a proof of every small island. The 25 missing
Pontic/Caucasus source entries retain the earlier world fallback. Other new
sections have no missing source entries in their manifests. Source-height
checks retain a sampled Mont Blanc neighborhood peak of about 4,463 m; the
campaign grid does not reproduce exact summit heights.

Elevation uses the same [Copernicus DEM](https://dataspace.copernicus.eu/explore-data/data-collections/copernicus-contributing-missions/collections-description/COP-DEM)
COG service and existing source caches. Per-section manifests record URLs,
hashes, missing entries and shared-edge reconciliation. GSHHG coast licenses
and the archive hash accompany each section. Existing climate, river/lake
geometry, material families and vegetation assets are reused. Close terrain
samples 128 intervals per degree and backdrops 32; the existing vertical scale
is retained. No procedural peaks or modern agricultural field parcels are added.

These are modern physical proxies. Ancient shorelines, estuaries, marshes,
reservoir-free valleys, dated vegetation and glacier extent remain research
limits. The map remains projected terrain within −12..75° E, 12..62° N.
The accepted camera movement fix and 2,800 km ceiling remain.

## Borders and historical evidence

All 128 territorial records were audited for identity/order, initial controller,
geometry validity, display-anchor containment, raster identities and evidence
classification. The 26 features in the dated source subset include 278 BCE.
All 30 source-reconstruction shapes are unchanged. Of 98 provisional shapes,
85 receive revised drawing; the reviewed Italian core shapes are retained.
All 131 factions, three nonterritorial Galatian markers, 35 approved settlement
anchors and the 687-record research catalog retain their identities/data.

The new provisional curves use deterministic terrain/river costs within bounded
corridors around existing broad associations. Shared edges reuse one path.
They use neither random jitter nor settlement Voronoi cells. A few clear
association issues are corrected, including the Parisii envelope excluding
Lutetia and the offset Rhone-confluence junction. The Douro transition is
explicitly treated as a later regional association, not a dated 278 BCE border.

**These inferred lines are not confirmed ancient frontiers.** Caesar and Strabo
are later evidence. [Caesar I.1](https://penelope.uchicago.edu/Thayer/E/Roman/Texts/Caesar/Gallic_War/1A%2A.html)
supports broad river-linked associations; [Strabo III.3](https://penelope.uchicago.edu/Thayer/E/Roman/Texts/Strabo/3C%2A.html)
shows that even the regional use of Lusitania needs qualification. Neither
authenticates exact tribal sovereignty centuries earlier. The
[Cliopatria authors](https://www.nature.com/articles/s41597-025-04516-9) also
describe increasing uncertainty for older borders. The audit keeps these
evidence limits explicit instead of upgrading smoother polygons to certainty.

The new layer is a reproducible derivative under `data/world-border-review/`.
It preserves canonical source catalogs and geographic-region UUIDs, updates
derived geometry digests, and keeps initial ownership separate from geometry.
The dated Cliopatria source remains covered by the repository's existing
CC BY 4.0 attribution; its original subset/license is retained.

## Resource handling and validation

New large-area coast masks use 128 intervals per degree, matching their source
terrain sampling. Earlier reviewed 512-interval masks remain. Precomputed
coverage masks replace repeated analytic scope expressions in terrain, ocean
and CPU placement queries. This reduces shader complexity and avoids evaluating
every older geographic scope for each placement query. Source heights and
the 24-close-tile limit per section are retained.

An initial unoptimized preview used about 5 GiB of video memory with only part
of the new coverage loaded. A combined native/GPU run encountered a readiness
timeout; it is not reported as a pass. Final native checks isolate the terrain
adapters from unrelated scenery-generation work, while the full GPU capture
uses the production controller and its normal readiness checks. Native results
verify all ten sections, source-height/mesh and morph-parent agreement, bounded
residency, distant visibility, close-tile release and unchanged controller IDs.
Invalid ownership-state updates are rejected without changing existing state.

A single long capture session reached 26 views before timing out on Anatolia
readiness. The final visual review uses fresh Godot processes for groups of at
most four views, retaining full scenery and normal readiness. This bounds review
session accumulation; it does not establish sustained long-session stability.
The four-view batch also exceeded its two-minute allowance on close Anatolia.
An isolated retry completed in about 247 seconds overall with a four-minute
per-view readiness allowance. At 60/120/180 seconds its diagnostics show shrinking
scenery queues, an empty terrain queue, idle settlements and no river rebuild.
This is a slow cold scenery load, not an accepted interactive-performance result.
Full scenery remains enabled; the capture does not bypass the readiness check.

TypeScript checking and all 514 application tests pass. Targeted ESLint checks
cover the added/modified JavaScript tools. Border checks validate 4,654 changed
segments without self-intersections, all 128 territorial display anchors, and
stable controllers and geographic identities. The original protected-source
tests also pass. Existing raw-image/export warnings remain; packaged export
is not validated.

Independent source/backdrop checks cover all 22 shared terrain sections and
108,154 sampled vertices, including their outer edges. Mesh and stored backdrop
heights agree with source elevations through the authoring feathers.

The visual review uses actual 1920×1080 Godot Forward+ renders. Earlier frozen
poses are available for the Alpine join, Gaul and Hispania; other views review
the delivered world coverage and completed-region controls. The older Hispania
checkpoint predates subsequent water presentation work, so every changed pixel
cannot be attributed solely to border drawing. Raw poses, clipping planes,
timings and memory counters remain in `evidence/world-completion/`.
All 32 views completed with normal readiness; three comparisons retain their
earlier camera position, orientation and field of view. Final short samples
report about 4,386–4,407 MiB of video memory on the review machine. The full
campaign footprint remains a material memory cost.
Short hidden-window samples are not sustained interactive FPS or a WS2
optimization acceptance benchmark.

## Reproduction

From the repository root, build the named sections with
`node godot-prototype/tools/hispania-build.mjs --region=<name>`.
The existing no-argument Hispania behavior remains supported. A fresh completion
build uses the order in `data/frontier-regions.json`, then:

```
node --expose-gc godot-prototype/tools/frontier-coverage-build.mjs
node godot-prototype/tools/regional-height-continuity.mjs
node godot-prototype/tools/world-border-build.mjs
node godot-prototype/tools/world-border-validate.mjs
node godot-prototype/tools/world-completion-data-validate.mjs
```

Native tools are `world-completion-validate.gd` and
`world-completion-capture.gd`; views are in `data/world-completion-views.json`.
Run `node godot-prototype/tools/world-completion-capture.mjs` to capture the
complete review in small sessions (`GODOT_BINARY` can override the executable).
After captures, `world-completion-report.mjs` creates the review and audit.
Source download caches remain ignored. These changes are local until committed
and pushed separately.
