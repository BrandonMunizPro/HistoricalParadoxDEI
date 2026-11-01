# Faction political map review — 30 October 2026

The existing Godot world now displays faction colors, original emblems and names when zoomed out. A searchable **Factions · 131** roster finds factions or cultural families and focuses the existing camera. The first catalog has **131 entries: 128 territorial factions/regional polity groups and three Galatian arrival groups**. This is a first scenario roster, not an exhaustive inventory of ancient communities.

Open [the matched screenshot viewer](review.html) or inspect [Mediterranean](final/mediterranean.png), [Italia](final/italia.png), [western regions](final/western-world.png), [Africa](final/africa.png), [eastern regions](final/eastern-world.png), [Hellenic regions](final/hellenic.png) and [Massylian roster search](native-fixed/roster-numidia.png). All screenshots are actual Godot output. Nine before/after pairs share exact camera position, basis, FOV and clipping planes. The comparison viewer is an inspection artifact, not the game's UI.

## Scope and behavior

Rome, Carthage, Massylii, Masaesyli, Mauri, Ptolemaic Egypt, the Seleucids, Kush, Greek leagues/cities, Macedonian claimants, Anatolian dynasts, Celtic/Gallic, Germanic, Iberian, Italic, Illyrian, Thracian, Dacian/Getic, steppe, Caucasian and Arabian groups are represented. Cultural family and faction identity are separate. No family automatically owns a single empire.

The existing smooth transition remains **60–180 km camera distance**: geographic below 60 km, continuous blend between thresholds, political above 180 km. The same camera, meshes, shoreline masks and coordinate projection remain in use. At continental distances (600 km and above), ordinary settlement name labels are suppressed to reduce clutter; all 35 approved settlement markers remain, and selected settlement labels are retained. Existing search, focus and settlement positions are preserved.

Small faction emblems and names are prioritized and collision-filtered. All 131 entries remain reachable through the roster even when their map text is suppressed. These are original vector game symbols and monograms, not copied flags or attested ancient national flags. The close geographic world and ocean simulation have not been rebuilt.

## Rendering and data architecture

`scenario-278.json` contains independent cultural families, faction identities, source/confidence notes, polygon geometry and initial region controllers. A separate 4096×2354 RGBA raster encodes territory IDs; it is not a color-painted ownership texture. A tiny runtime palette maps those IDs to current faction colors. The terrain shader resolves IDs through the palette and existing geographic bounds, with coastlines clipped by the unchanged land system. Unassigned pixels stay neutral; equal-priority source conflicts are disputed rather than arbitrarily awarded.

Source reconstruction and provisional scenario regions use different opacity/outline strength. Screen-sized borders use neighboring ID samples rather than regenerating geometry. The existing water presentation never receives faction ownership colors. No per-frame CPU territory generation or extra full-world render pass was introduced.

`set_faction_color()` updates palette and emblem colors. `set_region_controller()` changes a region's palette association and display label without changing geometry, cultural identity or the researched settlement catalog. Unknown IDs are rejected. These are in-memory integration APIs, not conquest, diplomacy or a saved ownership simulation. A TypeScript adapter derives stable canonical faction UUIDs and exposes the existing `MapFaction` read model for future integration. No simulation/database faction ownership has been persisted.

## Changed and added files

Four existing Godot source files changed in this task:

- `political_map.gd`: initializes/updates the faction adapter and resets ID mode on clearing layers.
- `political_map.gdshaderinc`: territory-ID/palette lookup and confidence-sensitive screen-sized boundaries; existing direct-color layers remain supported.
- `project.godot`: two new shader globals for palette and ID mode.
- `world.gd`: camera keyboard movement respects any focused `LineEdit`, including the new faction search.

Added runtime modules: `faction_cartography.gd`, `faction_overlay.gd`, `faction_emblems.gd`; data/source/license files in `data/factions/`; original emblem assets and attribution in `assets/factions/`; `src/presentation/faction-cartography.ts`; `tests/faction-cartography.test.ts`; build/raster/bake/capture/native/motion/review tools named `faction-*` in `tools/`; this evidence directory. Generated Godot UID/import sidecars may also appear. Existing uncommitted vegetation and water work was preserved.

The build tools can regenerate scenario data, ID raster, placement anchors and emblems. The reference data clone remains outside the project in the temporary directory. Only the small, licensed dated geographic subset is bundled.

## Validation and preservation

- **510 tests passed across 37 Vitest files**, including four new faction schema/identity tests. TypeScript type checking and targeted ESLint passed.
- **17 native Godot checks passed:** roster/data binding, distinct culture/control, actual colored land probes, all 128 regional anchors inside their own region, Galatian presence-only handling, live color changes, control transfer, unchanged raster, invalid updates, alias search, all roster entries, camera focus, close-image equivalence, thresholds and geography counts.
- Two additional native motion checks passed during bidirectional zoom/pan/rotation. Existing navigation regression test passed.
- **460 protected files remain byte-identical; 35 approved sites retain exact canonical coordinates; all 687 research records remain byte-identical.** No pre-existing Godot source or asset was deleted. Of 3,059 snapshotted files, only the four intended existing source files above changed.
- Both full-frame close control screenshots — Roma and ocean — have **mean and maximum pixel difference 0** against the baseline in native validation.

Final capture and native/motion runs completed without script/shader errors or resource leaks. Existing warnings about loading older terrain/building source images as raw files remain; they are export-pipeline work outside this change. An initial validation attempt used an editor-only shader-global getter and failed; it was corrected to inspect the retained texture reference. The initial candidate also exposed a RefCounted cycle, fixed using a weak adapter reference. Failed/candidate logs are retained and are not passing delivery evidence.

## Performance and remaining limitations

See [the measured comparison](PERFORMANCE.md) and raw frame arrays. Short settled-view final averages range from approximately **84 to 200 FPS**, with 1% lows approximately **66 to 145 FPS** on the RTX 3060 Laptop at 1920×1080. These are uncapped, VSync-off submitted-frame samples, not a sustained guarantee. Emblem/name outlines add substantial 2D draw submissions (Mediterranean sample: 26 → 427); the eastern and Italian comparisons show measurable regressions. This is not a zero-cost overlay.

The rapid moving-camera test includes the existing UI and active tile streaming: **45.17 FPS neutral versus 45.39 FPS with factions**, with 1% lows of 22.36 and 21.98 FPS. Both fail a sustained 60 FPS movement target. Similar results indicate the faction layer is not the dominant bottleneck in this test; the existing bottleneck still needs investigation. Godot's video-memory counter increases by approximately 42.5 MiB. These counters are not driver VRAM measurements. Raw evidence is in `motion-neutral/` and `motion/`; do not confuse it with settled captures. A sustained thermal-soak benchmark and comprehensive first-render stall profiling are not complete.

Historical and visual limitations are material: **only 30 territorial shapes use dated reconstruction; 98 are provisional authored regional envelopes**. Several look angular, larger source polygons can look stepped at regional zoom, and later-attested tribal names require dedicated scenario research. Unknown areas remain gray. These are reviewable game-scenario choices, not definitive 278 BCE frontiers. The [reference study](REFERENCE-STUDY.md) explains dates, sources and adaptations. No game assets or code were copied.

Next work should prioritize historical review of the provisional roster/regions, more geographically informed boundary geometry, a hand-directed emblem art pass, and batching/caching political labels before adding more factions. The palette APIs are ready for a future authoritative ownership model, but armies, diplomacy, economy, characters and campaign rules are outside this delivery. No commits or pushes were made; The Rev was not modified.
