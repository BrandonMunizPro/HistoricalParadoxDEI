# Validation — 11 November 2026

Completed on the native Windows Godot 4.7.2 Forward+ renderer, RTX 3060 Laptop GPU:

- `tools/streaming-optimization-validate.gd`: **5,403 checks, zero failures**. Worker completion, byte-identical packed buffer, 1,800 exact transforms, colors and LOD/slope values, and empty species handling.
- Existing `tools/environment-validate.gd`: **passed**, 4,096 GPU samples, palette 24, maximum error 0.00215542316437.
- Existing `tools/habitat-validate.gd`: **passed**, 4,096 GPU samples, maximum error 0.00219521702996.
- Four final benchmark processes: before/after × Italy/Gaul; both trials completed per process; no script or renderer errors. The comparison validator passed **36 exact local-cell comparisons**, retained-nine-cell assertions after repeated zooms, and cache-budget assertions after travel.
- Two additional native transition capture processes completed without script/renderer errors. Reviewed the original and optimized +3-second Gaul screenshots and the Italy rendered views. The optimized capture visibly contains the focused forest earlier; surrounding cells still arrive in blocks. This is an acknowledged limitation, not a claim that popping is eliminated.
- `npm.cmd test`: **514 tests passed, 37 files passed**.
- `npm.cmd run typecheck`: **passed**.
- `npm.cmd run build`, including postbuild migration copy and smoke check: **passed**.
- Final `world.gd` SHA-256 equals its pre-change snapshot: `ccd0a05c97a98c7f874aa9a1e7c167c7ab5b6bd80c28785d936c10583614f30f`. The optimized scenery source is restored after baseline/capture runners and matches the tested optimized snapshot.

Godot logs retain existing warnings about raw image loading and export compatibility in unrelated assets. No export build was tested. An initial headless/dummy-renderer buffer check could not read GPU MultiMesh buffers; the final checks use the actual renderer and pass. An initial sandboxed editor invocation could not save user editor settings/read the certificate store; this was not a successful validation and was not counted as one.

The native camera routes exercised terrain, labels and the existing UI rendering, but this task did not repeat every campaign-menu, settlement-click, or political-overlay interaction test. No campaign UI, historical datasets, ownership records, political overlays or simulation files were edited.

Engine memory counters and frame samples are in the raw JSON. Peak process RSS, GPU-only timing, driver-cold startup, long-distance travel across the entire world and hardware other than the listed GPU were not measured. The short rapid-travel checks do not prove every newly visited cell finishes loading before the next move.
