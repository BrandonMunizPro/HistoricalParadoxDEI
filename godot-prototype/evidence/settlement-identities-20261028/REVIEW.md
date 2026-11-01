# Roma and Aricia — settlement identity review

## Delivered scope

Open the [21 actual Godot captures](index.html), [reference study](REFERENCE-STUDY.md),
[measured performance](performance-summary.json), [license manifest](asset-license-manifest.json),
[native checks](native-validation.json), [layout checks](layout-validation.json),
and [test results](tests.json).

The existing development architecture now demonstrates **two different original
settlement identities**. Roma has six slots, starts with Forum III and includes
civic, religious, commercial and entertainment forms among denser residential
quarters. Aricia is an existing protected Italic location configured as a
four-slot agricultural minor, with farm II, shrine I and two available slots.
Its buildings, fields, orchard and tracks form a rural composition.

The contrast and development ladders are implemented, not just catalog entries.
The scene is still below the intended commercial visual quality. Repetition,
terrain transitions and environmental finish remain visible limitations; no
claim of Rome II parity or modern 2026 art quality is made.

## Audit and design choices

The preceding Roma showcase, data contracts, UI, instancing, near/far meshes,
protected sources and evidence were inspected before editing. The old catalog
and starting-state files remain available. New data is a stable-ID overlay and
two-settlement starting file. The original Roma-only launcher still works;
the new visual identities require `--settlement-identities`.

The [reference study](REFERENCE-STUDY.md) separates confirmed game mechanics,
directly inspected campaign/battle images and our adaptations. It documents
source access failures and unverified details. We adopt functional silhouettes,
cultural materials, connected quarters and specialization beyond city centers.
We deliberately use six/four configurable slots and three stages rather than
copy the references' full progression. No universal category arrangement is
hardcoded. The eight categories are food/agriculture, civic, religion, industry,
trade, military, entertainment and extraction.

Germanic architecture joins the prior nine design families. Generic eligible
chains can resolve that culture, but compatible artwork remains explicitly
missing. Non-Roman families are **planned art vocabulary**, not finished kits.
Architecture remains separate from future political ownership.

The entertainment ladder deliberately compresses history: timber festival
theater, grand theater, original oval arcaded arena. This is allowed game design,
not a claim of those buildings in Roma in 278 BCE. The Forum's III classification
and Aricia's agricultural start are also scenario classifications. They are not
literal historical construction phases or an excavated census.

The protected active-site records provide identity, coordinate and evidence
links; no supported deposit was established for Roma or Aricia. The inspected
data did not provide a validated mineral/deposit inventory for this pair.
**No mine or quarry was invented.** Existing extraction definitions still require
evidenced deposits and appropriate terrain. Ports/water infrastructure were not
placed without suitable geography and route evidence.

## Implemented assets and environment changes

There are **55 original baked meshes**:

- 18 primary stages with near/far assets: civic Forum, sanctuary, farm, market,
  entertainment and grain storage, each with I/II/III.
- Six near/far urban block types: atrium compounds, narrow street houses,
  mixed-height corner frontages, arcaded shop fronts and courtyard groups.
- Three near/far rural cluster types and one original grain tuft mesh.

The geometry includes true arch openings and voussoirs, deep columnar porches,
temple podiums and stairs, terracotta pediment treatment, clerestories, curved
assembly seating, cavea, elliptical arena arcades, raised grain stores,
ventilation, loading ramps, awnings, pots and agricultural work areas.
These are original authored meshes using reusable mesh tools, not imported
Total War models, recolored generic houses or traced proprietary designs.

The darker, stone-like old plaster was replaced in the new kit with actual CC0
white plaster. New plaster/soil color, GL-normal and roughness maps total
**9,407,123 bytes**, with mipmaps and GPU compression. Existing CC0 roof, stone,
timber and path materials are reused. Tree art retains the previously disclosed
generated branch cutout; no new AI imagery was generated.

Roma uses 27 authored residential block placements rather than isolated copies
of one house. Landmarks have deliberate spaces and connected approaches. Its
boundary curtain is joined and follows terrain; it is an illustrative game
boundary, not a reconstructed ancient wall circuit. The obsolete landing from
the earlier temple composition is omitted only in the new identity mode.

Aricia has three sparse rural background groups and no urban wall ring. Farm
upgrades change the main compound, storage, working yard and orchard, while
managed field area grows **896 → 2,808 → 6,072 m²**. III includes one fallow plot;
active grain area also grows. Crop rows have small variation rather than rigid
identical tuft placement. Sacred/civic stage changes also expand courts and
planting, not just the main roof size.

Local presentation terrain preserves source elevations while grading contacts
in the displayed meshes. Roma reuses the 520 m local patch. Aricia has a 300 m,
72-cell patch with a 125 m inner cutout and blending fringe. The default mask is
zero outside the opt-in mode. Roads and working surfaces sample rendered
triangle heights; crops and fields follow local terrain. Original geographic
data and canonical anchors are not displaced.

Near/far assets switch at 3 km. Crop tufts stop at that distance, while local
fields/props stop at 15 km. Strategic city symbols grow to 6x for Roma and 4x for
the minor settlement; this is representational scale, not geographic city size.
A finished macro-city silhouette and smooth LOD crossfades remain future work.

## Run and use

```powershell
.\godot-prototype\settlement-identities.ps1
```

Use the settlement selector for Roma or Aricia, inspect a slot, switch I/II/III,
or restore the selected starting configuration. Empty slots remain available.
The same UI adapts between six and four slots. Each model keeps independent
temporary state. Normal geographic camera controls and inspect/city/strategic
buttons remain available. No preview writes scenario data.

The new launcher caps rendering at 60 FPS after production scene initialization,
matching the supplemental swap-enabled check. This limits unnecessary heat
without changing asset quality. Existing launchers retain their configured caps.
Direct Godot launches may add `--identity-uncapped` to the identity preview script
to retain the production cap.

The primary starting data is
[`settlement-identity-starts.json`](../../data/settlement-identity-starts.json).
Only its two existing IDs are connected to the new rendering adapters. Other
settlements keep their preceding presentation. There is no worldwide rollout.

## Evidence, performance and failures

Final screenshots are **`before` versus `after-release`**. The former is the
preceding Roma development slice plus Aricia's old neutral presentation.
The report asserts exact camera equality for both settlements at city and
strategic distance, and identical cameras across each civic/religious/farm
I/II/III sequence. The additional detail captures include the original arena.
Actual UI callbacks drive the captured level changes; rendered stage IDs and
state must agree before each screenshot is saved.

Earlier `after-initial`, `after-reviewed` and `after-final` folders are retained
diagnostics. They exposed oversized/bright yard patches, a giant Aricia label,
reversed rural-road winding, stale old paving and coarse road height sampling.
Those were corrected before `after-release`. The isolated material probe is a
diagnostic scene, not a campaign screenshot or final quality claim.

The main comparison uses 600 settled wall intervals per view at 1920×1080,
forcing one GPU render with automatic rendering disabled and no buffer swap.
This avoids hidden-window logic-only FPS but is **not a presented-frame or
PresentMon benchmark**. The slowest six intervals define its 1% low. GPU timings
are reported separately. Shader caches were retained, and strategic results are
limited by the existing 120 FPS cap.

The [generated table](performance-table.md) is the authoritative result. The
longer final run includes **sub-60 average FPS and low-frame-rate tails**. Its
failure is retained; it is not replaced with the faster diagnostic runs.
Device-wide telemetry records temperatures reaching 86–87°C and reduced GPU
clocks around 1,170–1,215 MHz during portions of that run. These are an important
thermal confound; the whole slowdown cannot be causally assigned to either the
new art or the engine from this sequential comparison.

The final no-swap city views measured **67.4 average / 59.4 FPS 1% low** for
Roma, and **55.7 / 45.5** for Aricia. The Level III farm view measured
**49.5 / 37.0** in the hotter part of the run. The earlier baseline city averages
were **66.7** and **92.4** respectively, under different thermal conditions;
these numbers do not support a controlled causal speedup/regression claim.

Scene instantiation was **3.21 seconds**; the first Roma settled-capture wait
was **22.07 seconds**, including streaming/settling. Worst recorded readiness
intervals include **177.8 ms** initially at Roma and **382.2 ms** at Aricia.
Sampled process RAM peaked at **1,525,882,880 bytes (~1.42 GiB)**, versus
**1,468,604,416** before. Engine video allocations are about **1.21 GiB**.

The separate [swap-enabled check](swap-60-corrected/performance.json) requests
buffer swaps with a verified 60 FPS cap and 1,200 intervals per view, without any
quality reduction. It is a different driver, not a replacement matched baseline
or proof of OS scan-out timing. The initial `swap-60` experiment set its cap
before the production scene overrode it; it is explicitly rejected in that
folder's `rejected-method.json`. The corrected runner applies and asserts its
cap after scene initialization.

The corrected swap-enabled run measured **60.00 FPS averages in all three
views**, with 1% lows of approximately **57.0 Roma / 57.1 Aricia / 56.4 farm III**.
That is encouraging for the capped preview but still does not establish a
strict 60 FPS floor, cold-start behavior or an OS-level presented-frame result.

Scene instantiation and first settled capture are separate measurements.
Readiness includes asynchronous streaming and imposed settle frames, not just
asset-load CPU time. First-use/loading and upgrade stalls remain in raw samples.
Process RAM is sampled working set; engine VRAM counters are allocations, not
physical per-process residency. Nvidia samples are device-wide. No clean-cache
cold-start claim is made. **The full sustained smooth-60 target is not passed.**

## Validation and preservation

- **46 focused Vitest tests pass**, covering the old presentation selectors,
  approved sites, new/old development contracts, overlay merge, class capacities,
  starts/progression, culture resolution, effect interfaces, explicit historical
  liberties, missing art, deposits, environment growth and protected source hashes.
- TypeScript typechecking and scoped ESLint pass. The structural schema was
  extended compatibly for overlays, environments and effect interfaces.
- Headless Godot loads actual occupied I/II/III near/far assets and verifies
  bounds, starts, reset, family count and unchanged deposit restrictions.
- **All 243 Roma and nine Aricia stage combinations pass conservative oriented
  native bounds checks**, including field/building intersections. This does not
  certify navigation, complete wall/street clearance or historical accuracy.
- Real UI checks verify six/four slot counts, selector signals, independent
  preview state, disabled empty slots and restoration of starts. Every capture
  checks the actual rendered slot levels.
- A headless camera round trip at 2.9/3.1/14.9/15.1/2.9 km verifies real resident
  assets and field culling. This caught a refresh issue in the broad camera
  buckets: identity nodes now explicitly invalidate at 3 and 15 km. That
  scheduling correction was made after the captures; the captured distances,
  selected assets and visual quality are unchanged. The screenshots/performance
  samples remain evidence of their recorded runs, not a new post-fix timing run.
- All **460 protected files**, **35 active identities/coordinates** and **687
  research records** remain intact. The old catalog, starts and working Roma
  launcher remain available. Existing work was preserved rather than reverted.

Existing runtime-image/export warnings remain in Godot logs. This is not an
export-ready game release or a full unrelated application test pass. No commits,
pushes, The Rev edits, faction ownership, characters, armies or economy were added.

## Changed files and next steps

Primary integration changes: `roma_showcase.gd`, `roma_settlement.gd`,
`settlement_population.gd`, `settlement_development_ui.gd`,
`settlement_development_view.gd`, `terrain.gdshader`, the typed development
contract and its structural schema. New files include the identity kit/catalog,
rural adapter, specialization environment/shader, four identity data files,
launcher, bake/import/download/capture/validation/report tools, focused tests,
55 meshes, six source maps and this evidence package. Full source hashes are in
`source-manifest.json`; asset hashes/licenses are in `asset-license-manifest.json`.

The pair now demonstrates different settlement purposes and visible development,
but the art still needs work: repeated module wear, broad empty areas between
some blocks, simple monument ornament, unfinished terrain fringes, stylized crop
rows, old distant vegetation/river rendering and a miniature appearance at wide
zoom. City density and architectural detail improved, but are not certified as
commercial quality by passing tests.

The arena shell is still schematic, including simplified wall infill and seating
access. The temples' pediment treatment and material wear are similarly limited.
These are visible production-art gaps, not issues a validation pass can resolve.

Recommended next work is one art-reviewed frontage/landmark set with better
surface wear and street detail, then a macro-city LOD and sustained presentation
profiling under controlled thermal conditions. Add another cultural kit only
after reviewing the current pair. Extraction and water infrastructure require
site evidence before implementation. Do not spread these assets worldwide.
