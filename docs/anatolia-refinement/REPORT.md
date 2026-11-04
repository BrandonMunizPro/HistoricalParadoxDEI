# Anatolia refinement: political identities, terrain and vegetation streaming

2026-11-04. Changes run in the regular Godot campaign. This continues the Anatolia wave; it does not activate another geographic wave. Approved settlement coordinates, research records, geographic definitions and starting territorial ownership are preserved. See [matched screenshots and zoom playback](REVIEW.html), [machine verification](verification.json), and the [previous Anatolia audit](../anatolia-rollout/REPORT.md).

## What the investigation found

There were two different identity problems. Pontus and Rhodes already existed among the 131 canonical factions and had raster territory, but ordinary collision ordering could hide their labels. Lydia and Cappadocia had researched locations but no distinct identity in the faction catalogue. An imperial colour alone was hiding important regional distinctions. Adding independent kingdoms indiscriminately would introduce another historical error.

The new `political-identities-278.json` catalogue separates researched identity, relationship evidence and territorial presentation. It references existing research IDs rather than duplicating coordinates. `political_identities.gd` derives its label positions from those records, gives the important identities collision priority, and reads current control from the existing region-owner lookup. The existing faction emblem atlas is reused for canonical states. Local administrations/polities use restrained letter markers with control-coloured rings; no invented heraldry is presented as historical evidence. Local entries are searchable in the existing faction panel. This is presentation/research metadata, not seven new playable factions or diplomacy mechanics.

| Identity | Treatment at 278 BCE | Evidence / confidence | Remaining limitation |
|---|---|---|---|
| Pontus | Existing independent faction retained; visible Pontus and Amaseia labels | Existing scenario and research retained; border extent provisional | No projection of the later Mithridatid empire into 278; this pass does not independently validate its entire envelope |
| Rhodes | Independent Rhodian state, existing ownership and emblem | High for state identity; external alliance is separate from ownership | Later mainland grants and empire cannot define its 278 territory |
| Lydia | Lydian regional administration under Seleucid colour, with Sardis visible | High for Seleucid Sardis after 281; exact regional limits provisional | This is not a restored independent Lydian kingdom or an approved new province |
| Cappadocia | Ariarathid dynastic identity; allegiance explicitly uncertain | Early chronology and degree of autonomy disputed | Existing Seleucid envelope is a reconstruction, not proof of a definite client relationship |
| Ptolemaic coastal holdings | Existing Egyptian-owned land gains a local label and emblem | Coastal activity established; exact 278 frontier provisional | Existing broad envelope is not newly validated; no inferred coastal province is painted |
| Miletus | Polis identity with Ptolemaic association and affiliation ring | Royal benefaction dated 279/278 attests a relationship | Current coarse territory is Seleucid at its approved point. Association alone does not supply a surveyed boundary or complete sovereignty model |
| Side | Polis identity; 278 control unresolved | Regional imperial activity is established; exact city/date attribution unresolved | Approved point samples an unassigned raster gap. This is an evidence/data gap, not diplomatic neutrality or active conflict |

### Historical references and their limits

* [Brian McGing, *Pontus*, Encyclopaedia Iranica](https://www.iranicaonline.org/articles/pontus/): the Mithridatid state emerged by the end of the fourth century. “Pontus” is a conventional retrospective designation; contemporary use as its royal title is not established. This supports retaining its identity, not its entire present envelope.
* [Diodorus 20.99.3, translated at LacusCurtius](https://penelope.uchicago.edu/Thayer/E/Roman/Texts/Diodorus_Siculus/20E%2A.html#99): the 304 settlement preserved Rhodian autonomy and distinguished alliance obligations involving Ptolemy. It provides evidence against equating an alliance with annexation, not a direct survey of 278 possessions.
* [Sardis Expedition, Yegül, *History*](https://www.sardisexpedition.org/en/essays/r7-yegul-ch3-history): Sardis entered Seleucid control after Koroupedion in 281 and served as an important western royal centre. This supports the administrative identification; it does not survey all Lydia.
* [B. C. McGing, *Ariarathes*, Oxford Classical Dictionary](https://academic.oup.com/edited-volume/61673/chapter-abstract/548510253): the early dynasts are poorly known, and the transition to an independent kingdom belongs later in the third century in this account. The early dynasty should remain visible without asserting certain independence or a certain satrapy in 278.
* [Christelle Fischer-Bovet, *Ptolemaic Imperialism in Southern Anatolia* (2023)](https://static.revue-etudes-anciennes.fr/wp-content/uploads/2024/09/fischer-bovet-REA-1-2023.pdf): southern Anatolian possessions and influence require locality- and date-specific assessment. Pamphylian evidence is uneven; later foundations, coinage and events do not settle Side's exact status in 278. The available evidence justifies a regional investigation, not a continuous coast-wide ownership polygon.
* [Attalus chronology, 278 BCE, event 15](https://www.attalus.org/bc3/year278.html): records a gift from Ptolemy II to Miletus, citing the translated inscription and Austin. It supports the dated association shown here. Benefaction is not itself a complete territorial title.
* [Classical Studies, Rhodes and the Second Nesiotic League](https://classicalstudies.org/rhodes-cyclades-and-second-nesiotic-league): later Rhodian expansion provides a chronological warning, not a 278 boundary. Rhodian alliance with Egypt must not be represented as annexation.

No proprietary game source or unpublished historical reconstruction was used. Confidence in a state or regional name is separate from confidence in its boundary. Source links and per-record qualifications are also available through the in-app identity details.

## Terrain and political presentation

`tools/anatolia-refine-build.mjs` derives restrained horizon visibility from the existing source elevation grid, using eight directions and several sample radii. `anatolia_surface.gdshader` uses it to distinguish real ridges and valleys, alongside the existing ground and rock textures. It adds no procedural peaks, extra saturation or snow treatment. Detail texture influence stays modest to avoid replacing the map's geographic relief with surface noise.

The unchanged political polygons are rasterized at 512 samples/degree instead of 256 in this bounded area. Owner-aware screen-space edge sampling remains in use, with restrained political fill over terrain. Higher raster resolution reduces stair stepping; it cannot fix the historically provisional straight segments already present in the source polygons. Coastline and lake source geometry are retained from the previous Anatolia pass.

Close terrain is requested before it is visible. Its vertices morph from the actual parent surface between 320 and 230 km, with a short readiness transition when a tile arrives late. CPU label height uses the corresponding surface. This avoids a sudden replacement of coarse terrain by detailed terrain. Source positions, normals and approved geography remain intact; the derived close mesh stores the parent height as additional morph metadata.

## Vegetation: solve loading before replacing assets

Previously coarse vegetation generation began below 200 km and local generation below 32 km. Cells were discarded aggressively; batches could appear while other species were still building. This produced avoidable bursts during a zoom.

The existing assets now use earlier prefetch (380 km coarse; 180 km local), bounded resident caches, completed-batch visibility and an approximately 0.85-second dissolve for newly ready cells. Existing distance-based coarse/local transitions remain. Political-mode transparency combines with readiness instead of overriding it. Placement uses final terrain height, independent of the zoom at which the cache was made.

The shipped placement cache contains all 128 Anatolian coarse cells plus 72 local cells around eight reference areas: 200 cells, 174,266 plant instances and 96,930 rock instances. It stores deterministic placement buffers, not rendered screenshots or duplicated asset meshes. The signature includes placement code, settings and relevant geographic inputs. Other close cells prefetch and cache on demand; this is **not** a promise that all vegetation everywhere is pre-rendered or that every fast teleport is seamless. Memory remains bounded to 18 coarse and 18 local roots.

`scenery_fade.gdshaderinc` is included in the existing foliage, canopy-quality and impostor shaders. Assets and their style are unchanged. The shared streaming correction benefits the existing vegetation system, while the new published cache and terrain treatment are Anatolia-specific. `tools/scenery-prebake.gd` rebuilds this derived cache if its input signature changes.

## Verification and review

The review contains 15 before/after views at identical recorded camera positions, bases, FOV and clipping planes: Anatolia strategic, Ionia, Lycia, Taurus, Cappadocia, Pontic mountains, Bithynia, eastern Anatolia, Rhodes, Side, Lydia, close vegetation, and completed Greece/Italy/Sicily controls. Ocean time is frozen for comparison. All views use the regular campaign scene.

The zoom review repeats the same 181 zoom input steps and records 46 matched-camera frames, with before, published-cache and deliberately cache-bypassed sequences. Playback is frame-indexed, not an interactive FPS benchmark. It is included to inspect transitions; static screenshots cannot establish absence of pop-in.

At the final 18 km frame, the original run had 1 ready cell and 17 pending; the published-cache run had 18 ready and 0 pending; bypassing placement caches had 12 ready and 6 pending. These counts support the loading improvement but do not prove every camera path is seamless. Ready-cell counts include retained roots; use the images to judge what is visible.

The ownership diagnostic temporarily changes Bithynia while a neighbour shares its original test owner, then restores all state. It checks one palette entry, unchanged geographic/raster data and unchanged neighbouring pixels. A separate native check changes the controller behind Lydia: the identity remains Lydia, its administrative caption/control colour follows the owner, geometry remains unchanged and the original state is restored. These are nonhistorical transient tests, not saved scenario changes.

`verification.json` records exact camera checks, protected source hashes, unchanged initial owners/definitions, source mesh alignment, current cache signature, native results, suite totals and control-image differences. Tests cannot determine whether the relief looks convincing, whether emblem offsets feel natural while rotating, or whether the remaining political reconstruction is historically adequate. Inspect those in the review and regular app.

The existing suite passed **514 tests in 37 files**. Native identity, ownership, cache, terrain-height/streaming and region-foundation checks passed. The initial short-lived native harness teardown interrupted asynchronous preparation and reported leaked resources; waiting for readiness before teardown removed those errors. Final capture/native logs contain no script, shader or resource-leak errors. Existing raw-image export warnings remain.

Italy and Sicily's completed-area comparison crops are pixel-identical. Greece has a mean channel difference of 0.00308/255 in the inspected crop; 24 pixels exceed one channel level (maximum 73), consistent with the existing sparse raster/antialiasing variation. This is reported rather than labelled identical. Timing is mixed: captured GPU means increased at Ionia (3.57 → 5.65 ms) and eastern Anatolia (4.67 → 6.39 ms), while several other views decreased. These are uncapped hidden-window samples, not sustained FPS or proof of a performance improvement. The finer identity raster and earlier bounded preload have memory/loading costs.

## Remaining issues

* Side's precise 278 affiliation, Cappadocian autonomy and actual coastal ownership require further dated evidence. Miletus's Ptolemaic relationship and its coarse Seleucid raster colour remain an explicitly documented mismatch.
* The old Ptolemaic/Seleucid and northern Anatolian envelopes still contain broad straight segments and uncertain extents. Raising raster resolution does not validate them. No smaller regions or capitals were invented to conceal this problem.
* The existing elevation source limits very close geological detail. This pass improves shading and transitions; it does not turn the source into survey-resolution terrain.
* Ancient harbour positions differ from modern coastlines around Miletus/Ephesus. Approved coordinates are preserved; a defensible ancient shoreline needs separate evidence.
* Existing trees, rocks and settlement models still need the later asset-quality pass requested by the user. Distant vegetation can remain speckled, and cold fast travel into uncached local cells can still reveal a gradual fill.
* Existing raw image-loading warnings remain an export-packaging concern. Native editor/runtime checks are not a packaged-build validation.
* Alpine snow is still deferred. Other geographic waves are not activated. This refinement stops for manual inspection; passing tests is not visual or historical acceptance.
