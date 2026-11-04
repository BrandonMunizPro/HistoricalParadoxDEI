# Wave 01: Italian peninsula and Sicily

The accepted northern Italy/Sicily treatment now extends through central Italy, the Apennines, Campania, Apulia and Calabria in the regular campaign scene. Illyria and Greece are queued rather than changed in this wave. See `ROLLOUT-PLAN.md` for the complete sequence and repeatable workflow.

## Implemented

- `cartography_rollout.gd` reads `data/cartographic-rollout.json` and supplies the same work-area coverage to screen labels and terrain/political shading. The current settings activate one wave only. The corridors are visual work masks, not new geographic regions or political boundaries.
- The peninsula receives the accepted 24% political replacement, source-derived relief normals, reduced material noise and identity-based antialiased borders. The Adriatic coast and Calabria were checked and coverage gaps corrected after the first capture.
- A 7168×7168 detailed identity raster over 6–20 E / 35–49 N is generated from the exact existing scenario polygons. It preserves the previous Sicily/northern sampling density. It is used only inside active presentation scope; the northern override retains priority and the existing global fallback remains elsewhere. No polygon coordinates or initial owners change.
- The detailed runtime texture uses RG8: two identity bytes per texel, approximately 98 MiB. Historical confidence is retained in source data rather than encoded as mutable ownership. The source PNG is small on disk; compressed file size is not GPU memory use. Future waves should replace/localize detail tiles rather than indiscriminately loading worldwide high-resolution layers.
- Approved settlement coordinates take precedence. The custom label hierarchy extends to the peninsula; selected research-only labels retain their existing coordinates and research status. Existing native labels are suppressed only where the reference overlay replaces them.
- Faction labels/emblems now include Rome, Samnite polities, Lucanians, Bruttians, Daunians, Messapians, Tarentum, Rhegion and Croton as well as the prior northern factions and Syracuse. Alternative screen offsets avoid dropping an emblem immediately when its first location collides with settlement text. They remain screen-facing when the camera rotates.

## Evidence

Ten matched pairs in `REVIEW.html`: northern Italy, Po Valley, Alpine terrain, Sicily strategic, Sicily regional, Sicily oblique, central Italy, southern Italy, Apennines and Tarentum oblique. Existing angles and framing are preserved. The final capture reuses both saved camera position and saved basis explicitly; this eliminates tiny normalization roundoff from recomputing `look_at`. `verification.json` checks exact camera/preset equality.

The native scope check verifies Roma, Ancona, Gargano, Tarentum, Brundisium, Croton, Rhegion, Catana and Brixia lie in active visual coverage; sample locations in Greece, Illyria, Carthage and Corsica remain inactive. This is a coverage check, not a geographic ownership test.

The ownership regression check changes a single region whose neighbor initially shares its owner. One palette entry changes; the neighboring rendered probe remains identical, geographic rasters stay unchanged, and original owners are restored. The diagnostic pictures deliberately contain nonhistorical temporary ownership and are labeled accordingly.

The first exact-basis capture left that capture-only orientation active when the ownership diagnostic changed views, causing an out-of-bounds probe. The harness now clears it before the diagnostic. The ten matched images were retained and the corrected ownership-only validation rerun afterward; its fresh result and clean error log are checked separately. The failed harness log remains archived as `capture-first-diagnostic-errors.log` rather than being presented as a passing check.

Protected-source hashes and geometry digests verify that approved sites, research records, canonical faction scenario, original lake geometry, current source polygon coordinates and initial owner assignments remain unchanged. Existing suite: 37 files / 514 tests passed. Normal campaign startup and native region/scope validation are checked separately. Existing raw-image resource/export warnings are not new script/shader failures.

## Limits carried forward

This completes the visual **coverage** of the requested peninsula and Sicily, not a certification of every ancient border. The earlier provisional faction envelopes, source overlaps, unassigned gaps, uncertain control centres and unapproved permanent region memberships remain explicit. This wave introduces no new historical ownership claim, capital, conquest unit or gameplay system.

Visual inspection still shows coarse close terrain, sparse river contrast, some legacy research labels, angular source polygon/lake segments and transitions at the edge of the detailed raster. Label collisions can still hide text in crowded or edge-of-screen situations. Terrain under political color costs more than the previous flat fields; capture timings are reported per view rather than hidden behind a green test result. Packaged export and sustained performance on other hardware remain unverified.

Indicative 120-frame capture means include central Italy 7.30 to 19.35 ms, southern Italy 5.31 to 16.52 ms and the Apennines 11.21 to 27.48 ms. Those views now render terrain detail beneath the political layer, but the cost is a real remaining performance issue. Existing northern views change more modestly (northern strategic 21.39 to 22.30 ms; Po Valley 20.12 to 20.51 ms). These timings are observations from the capture harness, not hardware-independent frame-rate promises.

## Next

Use this style and workflow for Wave 02, Illyria, in a separate session. Then Wave 03, Greece. Keep later waves inactive and retain the existing accepted map while each new area is reviewed.
