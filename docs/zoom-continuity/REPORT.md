# Regional appearance at full zoom-out

5 November 2026. [Ten matched Godot comparisons](REVIEW.html), [native validation and WS2 isolation](../../godot-prototype/evidence/zoom-continuity/verification.json), [close-view comparison](../../godot-prototype/evidence/zoom-continuity/close-controls.json).

Anatolia, the Levant and Egypt previously hid their continuous regional terrain at 3,300 km. Their replacement fragments also discarded themselves at that distance, and the parent shader stopped excluding the legacy terrain. Consequently the 8,500 km production overview reverted to the older full political fill. The inherited ocean shader additionally blended back to older land/lake masks between 2,800 and 4,000 km.

The existing continuous regional backdrops now remain visible through the full supported camera range, including 30,000 km. Parent clipping follows the same geographical regions at every zoom, and regional water exclusions are applied after the distant legacy-water blend. No terrain, settlement, ownership or source dataset was regenerated or moved.

Only three runtime files changed:

* `godot-prototype/anatolia_surface.gd`: retain its backdrop and parent exclusion, reapply regional water masks after the distant blend.
* `godot-prototype/anatolia_surface.gdshader`: remove the 3,300 km fragment cutoff.
* `godot-prototype/eastern_surface.gd`: retain the Levant/Egypt backdrops and parent exclusion, preserve ocean/inland-water masks at distant zoom.

Close-detail prefetch, tile caps, vertex density, vegetation density, settlements and camera controls are unchanged. Native checks confirm all three backdrops remain visible at 3,290, 3,310, 8,500 and 30,000 km, with **zero close regional tiles** retained there. This keeps the existing backdrop rather than extending close terrain generation to world zoom.

The visual review includes the production world overview, a 4,800 km eastern overview, each affected region at 3,600 km, both sides of the former cutoff, maximum zoom-out, and unchanged-camera Egypt/Anatolia close controls. Camera position, basis, FOV and clipping match exactly for all ten pairs. Script parsing and the native zoom checks pass. Selected runtime logs contain no script or shader errors. All 460 previously protected geography/research files remain byte-identical. New report tools and evidence are separate from WS2.

The Egypt close-control terrain crop is pixel-identical. Anatolia differs at 837 pixels above one channel level in the central 1,176,000-pixel crop, with a mean difference of 0.03079/255, matching the sparse vegetation-edge variation recorded in the preceding regional review. No close-terrain mesh or source data changed.

The WS2 files `regional_scenery.gd`, `settlement_population.gd`, `political_map.gd`, `world.gd`, `northern_italy_world.gd`, and `tools/navigation-validation.gd` were read but **not edited**. Their before/after hashes match in this run. No residency-validator expectation, hidden-build counter or visibility-aware generation change was implemented here. This leaves OpenCode's WS2 implementation separate. The 170/200/250/520 km WS2 benchmark series was not run as part of this fix; these captures are visual evidence, not an optimization acceptance claim.

Handoff note: the existing scenery-cache signature hashes the regional renderer scripts. This fix can therefore invalidate placement caches even though placement/density rules are unchanged. WS2 should take its controlled before/after measurements against this updated, stable renderer baseline and account for cache warm-up. Its implementation files and cache-key logic were not changed here.

Added tools: `zoom-continuity-capture.gd`, `zoom-continuity-validate.gd`, and `zoom-continuity-report.mjs`. Evidence is under `godot-prototype/evidence/zoom-continuity/`. Some initial after-images contain a transient hover tooltip outside the affected regions; subsequent capture tooling disables GUI input to avoid that incidental UI artifact. It does not affect the regional rendering result.

The earlier regional reports still describe their own frozen checkpoints and known geographic limitations. This pass corrects zoom continuity; it does not extend the geographic footprint, reconstruct missing ancient hydrology, alter the shared world elevation lookup, or implement WS1/WS3. The continuously visible backdrops add distant rendering work; performance acceptance belongs to the separate controlled measurement work. No commit or push was performed.
