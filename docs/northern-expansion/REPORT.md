# Gaul and Britannia regional geography

This records the initial regional checkpoint. The later
[world completion pass](../world-completion/REPORT.md) supersedes its Alpine
join, border-drawing and coverage limitations.

This pass applies the existing sourced regional renderer to Gaul and to Britain,
Ireland and neighboring islands. The shared island terrain section is a physical
authoring area, not a claim of political unity. Earlier Italy, Sicily, Illyria,
Greece, Anatolia, Egypt, Levant, Africa and Hispania source data remain unchanged.
The separately accepted camera navigation fix remains in place.

## Geography and presentation

Gaul now uses sampled relief for the Massif Central and Cevennes, Armorican
uplands, Vosges and the transitions into the Paris, Loire and Aquitaine basins.
The Mediterranean/Rhone approach uses the existing climatic and material
families. The established Pyrenean and Alpine renderer takes precedence where
the sections meet; new mesh weights, shader scopes and CPU placement scopes
use matching exclusions.

Britannia includes the Scottish Highlands, Pennines, Lake District, Wales,
southern/eastern lowlands, and surrounding islands. Ireland receives the same
physical treatment. The Channel is kept open by the sourced coast mask and a
marine authoring limit separating the sections. Existing vegetation assets,
temperate/Mediterranean climate gradients, river corridors and deterministic
scenery placement are reused. There are no new settlement or faction claims.

Full regional materials expose terrain instead of the old dominant political
fill. Existing political colors, outlines and faction icons remain. The same
material response fades into the cheaper overview path from 700–1,200 km.
Continuous backdrops remain at production strategic zoom; close tiles unload
above the existing prefetch threshold. Each section retains the 24-tile limit.

## Sources and limits

- Elevation: [Copernicus DEM](https://dataspace.copernicus.eu/explore-data/data-collections/copernicus-contributing-missions/collections-description/COP-DEM), using the same public COG service and source sampling as earlier regional passes. Exact URLs, source hashes, missing tiles and reconciled tile edges are recorded in each manifest.
- Coastline: the existing local GSHHG archive; source hash and license copies accompany both derivatives.
- Rivers, lake geometry and climate: the existing project datasets. These remain generalized modern physical proxies; ancient river mouths, marsh extents, coastlines and forest clearance are not reconstructed here. Modern reservoirs in inherited hydrology have not received a new historical audit in this pass.
- Broad regional interpretation: [France's environment ministry on its physical structure](https://www.donnees.statistiques.developpement-durable.gouv.fr/lesessentiels/essentiels/sol-diversite-metropole.htm) and [British Geological Survey's regional summaries](https://www.bgs.ac.uk/geology-projects/regional-geological-summaries/).

Close terrain samples 128 intervals per degree (roughly 0.7–0.9 km), and backdrops
32. Small cliffs, chalk faces, gorges and summits are therefore generalized.
For example, the sampled Ben Nevis neighborhood peaks near 1,137 m; this does
not reproduce its actual summit height. No procedural summit was added to
hide the sampling limit. The DEM is modern surface geography, not ancient bare
earth or a survey of 278 BCE.

| Section | Close descriptors | Missing/ocean source entries with existing fallback | Derivative size |
| --- | ---: | ---: | ---: |
| Gaul | 109 | 16 | 161.8 MiB |
| Britannia and neighboring islands | 165 | 64 | 234.7 MiB |

## Validation and review

`tools/northern-data-validate.mjs` checks finite height arrays, descriptor meshes,
major upland relief, mainland/island coverage and the open Channel. Both sections
pass. Native Godot checks verify mesh/label height agreement, actual morph-parent
height agreement, bounded close residency, exclusion of preserved regions,
backdrop visibility and release of close tiles at 520, 1,200 and 2,800 km.
The final native run loaded 10 close tiles in Gaul and 14 in Britannia.

TypeScript checking passes. The application suite initially recorded 512 passes
and two five-second timeouts in protected-byte tests while captures were running.
A focused repeat of those two files passes all 31 tests. Together these runs
cover all 514 tests; there was no failed value assertion. Targeted ESLint checks
pass for the modified builder and the new JavaScript tools.

The native run retains the existing raw-image loading/export warnings; packaged
export is not validated. Initial sandbox-only Godot log/certificate errors were
resolved by repeating native validation with normal application access.

Before and final screenshots use the same 20 recorded cameras in the actual
1920×1080 Forward+ renderer, including seven preserved-region controls. Raw
captures, transforms, timings and comparisons are in
`godot-prototype/evidence/northern-expansion/`; [open the review](REVIEW.html).
Capture timings are short hidden-window samples, not sustained gameplay FPS.
The additional terrain has resource and draw cost; this is not a WS2 performance
acceptance claim. Baseline captures overlap source building/native checks, so
wall timings can include CPU contention.

All 20 before/final camera transforms match exactly. Italy, Sicily, Illyria,
Egypt and Libya controls are pixel-identical. Greece has 58 changed pixels above
one channel level (0.0028%); Anatolia has 1,676 (0.0808%), with mean absolute
channel differences of 0.0026 and 0.0315 out of 255 respectively. Contact-sheet
inspection shows the same terrain layout; these two controls are not claimed
to be pixel-identical or assigned an unverified cause.

The overview and Alpine seam were recaptured after excluding the full physical
Alpine overlay, which extends north beyond the older Italy presentation mask.
The report tool merges those two corrected views into the delivered final set.
The older Alpine coverage-edge seam visible in the baseline remains outside the
new Gaul coverage; it was not introduced or repaired by this pass. Political
polygons remain schematic and can still have visibly straight boundaries.

## Faction review

The Italian Boii remain near Bologna, south of the Po: that broad placement is
supported by Polybius. Bohemian Boii do not justify relocating the Italian group.
The audit covers 131 factions: 128 territorial labels fall inside their own
scenario territories, and three Galatian presence markers have no territories. Many tribal
identities and polygons remain explicitly provisional for 278 BCE. See the
[dated placement review](FACTION-PLACEMENT-REVIEW.md). No scenario, ownership,
settlement, research record or faction source file was modified.

## Reproduction

Build from the repository root with:

```
node godot-prototype/tools/hispania-build.mjs --region=gaul
node godot-prototype/tools/hispania-build.mjs --region=britannia
node godot-prototype/tools/northern-data-validate.mjs
node godot-prototype/tools/faction-placement-audit.mjs
```

The builder's existing no-argument Hispania behavior is retained. Downloaded
sample caches stay ignored under `data/geography/source-cache/`. New native
tools are `northern-validate.gd` and `northern-capture.gd`; the latter accepts
`--northern-baseline`, `--output=...`, `--only=...`, and `--reference=...`.
`northern-report.mjs` creates the matched-image review and contact sheets.

Further work should separate dated ancient environmental reconstruction and
tribal-boundary research from physical rendering, and profile accumulated world
resource cost before enlarging coverage again.
