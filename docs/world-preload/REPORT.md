# Remaining world preload gaps

The previous startup change did **not** prepare the entire world. It warmed reusable resources and only the opening area's nine local vegetation cells and twelve coarse cells. The latest complaint is therefore consistent with remaining region-by-region generation; the earlier startup test did not establish that newly visited regions were already prepared.

## Additional concrete gaps corrected

1. `world.gd` defaulted extended startup preparation to false. Normal project boot explicitly enabled it, but directly running `world.tscn` did not. Project play and direct-scene play now both request preparation; camera-owning diagnostic scripts remain explicitly opt-in.
   Interactive coast, ocean, landscape and settlement preview launchers now explicitly request the same preparation. The identity preview inherits it from the development preview. Automated capture/profile scripts retain their own camera control.
2. `coast_catalog.gd` retained only four of fourteen source chunks. Startup now reads and retains **all fourteen chunks**, **132,378,576 bytes**, covering the complete existing world coastline catalog. Queries during travel no longer evict this source data. This is source-data residency, not a claim that every coastal mesh and compute field is already baked.

## Capacity inventory

The read-only [inventory](../../godot-prototype/evidence/world-preload/capacity.json) found:

- **4,731 terrain mesh source files**, totalling **6,089,023,168 bytes**.
- **76,468,859 vertices** and **451,682,304 indices** in those files.
- An approximate **7,924,237,936 bytes** of unpacked geometry buffers using the current decoded attribute layout. This is an estimate before renderer-specific packing, not a measured full-world GPU allocation. Backdrops, textures, vegetation and other resources add further costs.
- **1,740,000 possible close vegetation grid cells** across the supported bounds. The basic geographic masks put 1,331,041 cell centres on land; regional/coastal overrides are not included in that count. The 1,800-instance limit is a per-cell cap, not an actual count of generated world instances. The reported aggregate buffer number is a worst-case budget and must not be described as measured resident vegetation.
- **2,757,887 source coastline segments**, now fully source-resident at startup.

The inspected machine has about **15.77 GiB RAM** and **6,144 MiB GPU memory**. About 4.21 GiB RAM was available with the game closed at inspection time. Thus allocating every detailed terrain mesh and every vegetation instance simultaneously is not an appropriate solution on this hardware. A longer loading screen alone does not change the residency budget.

## What remains unresolved

The world is still not fully pre-generated. Terrain detail meshes, close vegetation placement and camera-local coast meshes/fields remain region-based. Their remaining preparation delays require changes to baking, scheduling, caching or visibility transitions. A specific reproducible location/zoom is requested to identify which remaining path causes the reported pop-in. No claim of worldwide pop-in elimination is made.

## Verification

- Native startup/navigation validation: **87 checks passed, zero failures**. Covers normal/direct-scene startup policy, complete coast-source residency, asset warming, restored camera, and uninterrupted travel with no recurring loading screen.
- Coast-source equivalence validation: **47 checks passed**, comparing source chunks and nearest-coast results with the previous on-demand catalog across all fourteen chunks. The isolated headless engine emitted its existing root-certificate-store error; the script completed with exit code 0 and no assertion failures.
- Latest cold placement-cache startup: **82.4 seconds**, including scene construction; preparation after construction took **53.0 seconds**. This is one native run on the inspected GPU, with OS/driver caches not flushed.
- Native startup logs: `godot-prototype/evidence/world-preload/{stdout,stderr}.log`.
- `npm.cmd test -- --maxWorkers=1`: **519 tests passed across 38 files**, including the build smoke test.
- Protected-data validation: **7,673 protected files unchanged**. Four explicitly authorized renderer scripts differ; historical baseline data was not rewritten.
- Interactive preview scripts passed Godot parse checks; each preview was not separately launched for visual verification.
- [Coast comparison results](../../godot-prototype/evidence/world-preload/catalog-validation.json).
- Current startup result and preparation metrics are written by the shared runner under `godot-prototype/evidence/startup-preparation/`.

## Files changed in this follow-up

- `godot-prototype/world.gd`: consistent startup policy for direct-scene play.
- `godot-prototype/coast_catalog.gd`: complete source preload and pinned residency.
- `godot-prototype/startup_preparation.gd`: worldwide coastline source phase and explicit coverage metrics.
- `godot-prototype/tools/detail-boot-validate.gd`: launch policy and coast-source coverage checks.
- `godot-prototype/tools/{world-coast,landscape,ocean,showcase,development}-preview.gd`: opt interactive previews into startup preparation.
- `godot-prototype/tools/coast-preload-validate.gd`: source/result equivalence checks.
- `godot-prototype/tools/detail-data-validate.mjs`: adds the coast reader to the explicit rendering-script exception list; historical baseline hashes remain untouched.
- Capacity evidence and this report.

No geography dataset, settlement coordinate, faction record, ownership assignment, terrain source or vegetation density setting changed.
