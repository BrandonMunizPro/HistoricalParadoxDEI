# Settlement audit — before integration

The existing historical anchors remain authoritative. `data/sites.json` contains
Roma, Ostia, Capua, Aricia, Setia and Minturnae at stable researched coordinates.
No ranks, populations, cultural conversion or new building starts will be written
back to those records by this visual slice.

## Existing responsibilities

- `src/presentation/settlement-development*.ts` and `settlement_development.gd`
  contain presentation/development read models, eligibility, building levels and
  visual-key resolution. They explicitly do not implement an authoritative
  demographic/economic simulation. Population/rank inputs must therefore remain
  explicit, nullable or labelled test scenarios, rather than invented history.
- `settlement_population.gd` owns bounded proximity selection and asynchronous
  MultiMesh attachment. It creates the shared neutral house from `BoxMesh`, uses
  repeated instances, changes proxy scale with camera distance, and only selects
  settlements after nearby terrain work. It has special Roma, Neapolis and rural
  identity branches. This is not a generic graphical-culture renderer.
- `roma_settlement.gd`, `roma_showcase*.gd`, and the development/identity kits
  construct project-original geometry using boxes, cylinders and SurfaceTool.
  Baked `.res` files do not turn that source into production-authored modular art.
  The identity overlay explicitly includes chronologically compressed spectacle
  architecture; the new 278 BCE profile must not inherit it automatically.
- The Neapolis composition planner already checks terrain contact, slope, road
  access, overlaps and connected streets. Its renderer batches meshes and uses
  threaded requests. Its layout is a Neapolis-specific street/agora definition,
  not a settlement-state resolver. Reuse these placement/renderer responsibilities
  rather than adding a competing map streamer.
- World readiness now supplies persistent terrain/coasts, startup phases and
  bounded caches. A settlement baseline should be prepared through this startup
  path and retained while detailed assets are pending.

## Asset findings and quality gate

The audited Roman architecture is project-generated prototype geometry. The
appropriately attributed Poly Haven albedo/normal/roughness maps are reusable
material inputs, not evidence of finished Roman buildings. The Kenney Fantasy
Town source has an included CC0 license and limited components already reused
for a Neapolis experiment; it is not a production Roman/Italic kit. No proprietary
game assets are needed or permitted.

The cheap appearance follows from primitive-derived silhouettes, repeated
neutral houses, proxy scaling, city-specific branching, weak rank/state grammar,
and proximity-only residency. Texturing existing primitives more heavily is not
a production-art solution.

Implementation will provide the resolver, asset contract, deterministic district
composition, terrain/shore placement, wall/road connectivity, retained LODs and
repeatable tests. Production acceptance is blocked until authored Roman pieces
pass the manifest's period, licensing, UV/material and LOD requirements. Any
existing meshes used to exercise the pipeline remain explicitly development
assets. Default historical data and the working map/coast improvements stay intact.
