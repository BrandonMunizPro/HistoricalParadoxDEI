# Neapolis composition kit

No new third-party asset was downloaded or purchased. These sixteen near/far
meshes are original project geometry assembled by `neapolis_composition_kit.gd`,
using the existing project's `roma_architecture.gd` masonry, wing, roof and column
helpers. The Roma high-podium temple is **not** reused: the new sanctuary has a
low stepped crepis, single cella and surrounding column rows. This is an
interpretation, without a claimed deity or excavated building identification.

The existing three courtyard-house resources remain in `../neapolis-free/`.
They derive from selected Kenney Fantasy Town Kit 2.0 modules under **CC0 1.0**.
The retained original [license](../neapolis-free/source/License.txt) expressly
permits commercial use; attribution is optional. Sources and archive checksum
remain in [their provenance](../neapolis-free/PROVENANCE.md). The official
[Kenney asset page](https://kenney.nl/assets/fantasy-town-kit) and
[license FAQ](https://kenney.nl/support) confirm CC0.

Plaster/roof normal and roughness maps reuse the existing Poly Haven plastered
stone wall and clay roof tile textures, also **CC0**, with commercial use and
redistribution permitted and no mandatory attribution. The original download
manifest and author credits remain in [Roma provenance](../roma/PROVENANCE.md).
See the [publisher's license](https://polyhaven.com/license). Roof albedo is a
restrained warm color in this adapter to reduce photographic aliasing. The
original residential resources and other cities' materials are unchanged.

The ground shader, terrain ribbons, yards, plinths and access steps are original
project code and geometry. No new photographic texture, AI image, proprietary
game asset, paid dependency, or runtime service is introduced. Newly authored
geometry remains under the repository's existing terms; it is not represented
as a separately released CC0 kit.

`manifest.json` records bounds, surface counts and triangles. Rebuild with:

```powershell
& C:\Users\brand\tools\godot\4.7.2-stable\Godot_v4.7.2-stable_win64_console.exe --headless --path godot-prototype --script res://tools/neapolis-composition-bake.gd
```

The Greek street-plan precedent comes from [UNESCO's Naples statement](https://whc.unesco.org/en/list/726/).
Courtyard/pastas housing is informed by the [University of Michigan Olynthos Project](https://sites.lsa.umich.edu/olynthos-project/olynthian-houses/).
Those sources support broad urban/domestic forms, **not** this district's exact
street alignment, houses, sanctuary location, municipal building, workshops,
storage, market stalls, watch facility, terrace heights or drainage details in
278 BCE. None is added to the canonical archaeological research dataset.
