# Campaign shoreline rollout

The regular campaign now streams nearby sea coast detail throughout its existing
extent. The approved Pellaro pass remains the local control. Open the
[production-game review](REVIEW.html), or run:

```
.\godot-prototype\world-coast-preview.ps1 -Coast dover
```

The same treatment follows normal map navigation; the preview is a convenient
camera position in the regular game, not a separate shoreline demonstration.

## Behavior

Low-gradient shores receive a textured beach, wet edge, advancing/retreating wash
and shoreward breaking foam. Higher terrain retains its land surface, with a
short rock skirt meeting the water and a narrow pulsing impact fringe. Low,
river-influenced banks use darker ground and quieter contact. Narrow sheltered
water suppresses the broad breaker trains. Rock shading uses triplanar mapping
to avoid stretching a horizontal ground texture up a vertical face.

Breaking foam is evaluated directly on the FFT ocean surface. It rejects the
land side of the signed shoreline. The fine coast field also damps geometric
ocean displacement to zero on land and towards the waterline. Land-side wash is
limited to the graded beach strip; it is not applied to cliffs or muddy banks.
Existing inland water polygons and levels remain fixed, with subtle moving
contact on the river ribbons' existing bank coordinates. Ocean surf is not
inserted into lake interiors.

The terrain backdrop, close tiles, overview variants and Anatolian material all
receive the same field. In particular, later close-tile loading must not revert
to a coarser coast mask. Shared miter joins close wedges between adjacent shore
segments. Beaches blend back into the existing ground; non-beach land is retained
behind its contact skirt rather than excavated to make an artificial beach.

## Coverage and resources

The source catalog contains 2,757,887 directed segments from the existing GSHHG
2.3.7 full-resolution L1 sea-coast archive, within the existing campaign extent.
This includes mainland shores, islands, bays and inlets. No line is invented
along the rectangular campaign boundary. The original archive hash, derived
catalog hash and source licenses accompany `data/world-coasts/`.

The catalog uses a packed one-kilometre spatial index and a four-chunk source
cache. Individual source chunks are at most 9.6 MB. Only the nearby coastline
gets meshes; close detail is active below 12 km camera distance. Dense coasts
reduce the local footprint rather than silently dropping islands. Each mesh is
bounded at 180,000 vertices. Work yields between short construction chunks, and
joining terrain heights are sampled twice per cross-section instead of querying
the whole regional stack for every beach vertex.

Two reusable 1024² RGBA32F GPU fields use about 32 MiB together. A spatially binned
compute pass generates distance, alongshore phase and material weights. Normal
play performs no GPU readback. Local geometry releases when zooming away; field
allocations are reused and released on scene exit. Material references remain
weak so streamed terrain materials are not retained indefinitely.

## Validation and limits

Resumed validation on 11 November 2026. The catalog audit now also verifies the
original GSHHG archive SHA-256 and checks that every coastline segment appears
in the streaming spatial index. Both checks pass. The interrupted visual review
page and contact sheet have been generated from the production captures.
All eight production views were recaptured successfully on 11 November: 14
CPU/GPU shoreline-side comparisons and eight zoom-out release checks pass.
TypeScript checking and targeted shoreline JavaScript linting pass. All 514
application tests pass with two workers and a 30-second timeout; the first
default-concurrency run hit timeouts in two existing file-integrity tests.

The geographic reference is the modern GSHHG coastline. Catalog construction
simplifies the projected source at an 18-metre tolerance, then rounds corners;
this is not a surveyed, metre-exact shoreline or a reconstruction for the
campaign's ancient date. Terrain and visual shore treatments have their own
resolution limits.

All 514 application tests pass, along with TypeScript checking and targeted
JavaScript linting. The source audit checks all segment values, unit normals,
index references, source hashes and chunk sizes. Fifteen orientation probes
agree with the approved Pellaro coast.

The visual review covers eight fully settled production views: an Italian
beach, English Channel cliffs, Corsica, a low bank, a Norwegian fjord, western
India, Pellaro and Anatolia. Validation-only GPU readback compares the sea and
land sides with CPU source geometry in the seven streamed views. Each capture
checks that the effect disables and its streamed geometry releases on zoom-out.
Earlier iteration images are retained separately and do not claim full readiness.
Short capture timings are not sustained interactive performance acceptance.

Shore types are inferred from source terrain and existing river proximity. They
are illustrative suitability, not surveyed sediment, measured bathymetry or
reconstructed ancient shorelines. Small-scale land/water accuracy remains limited
by the source terrain and coast data. This rollout does not claim a hydrodynamic
shoaling, tidal or erosion simulation, nor certification of every coastline pixel.

Reproduction:

```
node --expose-gc godot-prototype/tools/world-coast-build.mjs
node godot-prototype/tools/world-coast-validate.mjs
node godot-prototype/tools/world-coast-capture.mjs --complete --views=tarquinii,dover,corsica,estuary,fjord,india,pellaro,anatolia
node godot-prototype/tools/world-coast-report.mjs
```

The existing GodotOceanWaves FFT integration and MIT attribution remain in
`godot-prototype/ocean/`. These changes are local until committed and pushed.
