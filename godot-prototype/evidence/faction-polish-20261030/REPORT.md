# Faction-map presentation refinement

Implemented stronger colors, clearer faction borders and a consistent set of larger coin-style emblems in the existing Godot campaign world. The previous roster, initial controllers and geographic territory data are unchanged.

Open the [nine-view before/after comparison](review.html), [all emblems and evidence](emblems.html), [current Mediterranean screenshot](../factions-20261030/polish/mediterranean.png), [Italia screenshot](../factions-20261030/polish/italia.png), or [Massylian inspector screenshot](../factions-20261030/polish-native/roster-numidia.png). These are actual Godot renders at matched camera positions. The viewers are standalone review artifacts.

## What changed visually

- Removed the gray mixing that diluted provisional faction colors. All controlled regions now use their full palette color. This does not change their historical confidence.
- Built a palette using **178 neighboring-faction pairs** from the unchanged region-ID raster. Major identities use curated colors; other colors are chosen for adjacent separation with bounded chroma and lightness. A first overly vivid candidate was rejected and retained in `polish-candidate/`; the refined result is in `polish/`.
- Replaced faint dashed seams with continuous dark borders approximately 2.4 screen pixels wide, plus a restrained wider inner rim. Width follows screen-space derivatives as the camera zooms and rotates. Controller palette colors are compared, so transferring two neighboring regions to the same faction removes their internal political seam. Unknown land remains neutral. The shader uses more texture samples, but no additional world render pass, terrain mesh or compute dispatch.
- Replaced small generic shields with larger, consistently framed medallions: **36 pixels for major factions, 26 for smaller factions**, previously 26/19. Documented/adapted motifs are unobstructed by tiny monograms. Original devices retain identifying monograms and varied cultural motifs.
- Added emblem icons to the faction roster. Hover/selection exposes motif evidence and dates; the inspector continues to identify provisional territorial assignments.

## Historical symbols, not invented claims of ancient flags

All 131 entries now have explicit emblem provenance: **7 documented ancient motifs, 12 later regional adaptations, 112 original game devices**. This is not a claim that these states had modern national logos or that every motif was an official banner in 278 BCE. Most small tribal groups lack a verified faction-specific emblem in the research completed here. They retain explicitly original designs rather than false attribution.

| Faction | Device | Evidence and qualification |
|---|---|---|
| Seleucids | Anchor | [Metropolitan Museum, ca. 298–281 BCE tetradrachm](https://www.metmuseum.org/art/collection/search/330169): anchor used by Seleucus I and successors. Its precise meaning is not asserted. |
| Carthage | Sign of Tanit | [University of Ottawa, third-century BCE Carthaginian stele](https://omeka.uottawa.ca/museumclassicalantiquities/items/show/511). Religious motif, not proof of a state flag or an exact year. |
| Ptolemaic Egypt | Eagle on thunderbolt | [Penn Museum coin of Ptolemy I, 29-70-509](https://collections.penn.museum/collections/object/123253). Newly drawn profile eagle informed by the recorded device. |
| Athens | Owl | [Acropolis Museum tetradrachm, 483–480 BCE](https://www.theacropolismuseum.gr/en/node/21907). Long-established civic coin motif. |
| Rhodes | Rose with bud | [Spurlock Museum tetradrachm, 304–189 BCE](https://www.spurlock.illinois.edu/collections/search-collection/details.php?a=1900.63.0010). Source's date range is broad. |
| Tarentum | Dolphin rider | [British Museum nomos, ca. 280–272 BCE](https://www.britishmuseum.org/collection/object/C_RPK-p292M-31-Tar). Close to the campaign date. |
| Croton | Tripod | [University of Colorado coin study, 480–430 BCE](https://www.colorado.edu/project/expressionsofidentity/silver-nomos-croton-480-430-bce). Earlier civic coin motif. |
| Rome | She-wolf and twins | [British Museum didrachm, 269–266 BCE](https://www.britishmuseum.org/collection/object/C_1867-0101-31). Deliberate near-period adaptation from nine or more years after the start; labeled later. |
| Massylii / Masaesyli | Horse | [Padrino Fernández, Numisma 256 (2012)](https://www.siaen.org/documents/10901/11639/2012_256.pdf). Later Numidian coin inspiration; not separately verified 278 BCE tribal flags. |
| Selected Gallic groups | Boar | [Boudet and Moreau, Soulac standard study (1991)](https://www.persee.fr/doc/afeaf_1624-6349_1991_num_9_1_1406). A real regional motif, with the object proposed as first-century BCE; not evidence for the individual tribal assignments used here. |

All SVG paths, framing and gradients are original drawings. No proprietary game art, modern national flags, museum photographs or copied/traced logo packs were imported. The complete [presentation manifest](../../data/factions/presentation.json) records source URLs, titles, evidence classes and limitations for every entry. Updated asset attribution is in `assets/factions/ATTRIBUTION.md`.

The real-map basis remains the previously attributed Cliopatria reconstruction plus openly provisional scenario envelopes. No additional authoritative ancient map was found that would justify silently converting all 98 provisional regions into precise historical frontiers. This task improves their rendering without altering those assignments.

## Files and integration

Runtime changes: `political_map.gdshaderinc`, `faction_cartography.gd`, `faction_overlay.gd`, `faction_emblems.gd`.

New `data/factions/presentation.json` and `tools/faction-presentation-build.mjs` separate art choices and symbol evidence from immutable scenario geography. The emblem bake tool and 131 SVGs plus PNG/native atlas were updated. Existing `data/factions/README.md` and emblem attribution now describe this separation.

`src/presentation/faction-cartography.ts` adds a typed presentation schema/validator and optional palette application to the canonical faction read model. `tests/faction-cartography.test.ts` adds four tests for complete coverage, source classifications, invalid art/evidence/nonvisual overrides, and identity/geography preservation. Native validation adds four corresponding runtime checks. `tools/faction-polish-review.mjs` produces this review's HTML and validation/performance artifacts.

Rebuild: `node godot-prototype/tools/faction-presentation-build.mjs`, then Godot headless `--script res://tools/faction-emblem-bake.gd`. Scenario/raster builders are unnecessary for a presentation-only change. The 60–180 km transition and existing map controls are unchanged.

## Validation and performance

- **514 tests passed in 37 Vitest files.** TypeScript checking and targeted ESLint passed.
- **21 native Godot checks passed**, including presentation/evidence resolution, opaque fields, roster behavior, live palette/controller changes, all territorial anchors, and geography preservation. Two motion checks passed during bidirectional zoom, pan and rotation.
- All nine before/after camera transforms match exactly. Native close-up Roma and water comparisons remain **pixel-identical to the original geographic baseline**.
- Of **3,219 pre-task Godot files** hashed, only the intended faction art, rendering, validation and attribution files changed. No pre-existing file was deleted. Scenario catalog, territory raster, anchor coordinates, terrain and ocean assets remain byte-identical.
- **460 protected files, 35 approved settlement coordinates and all 687 research records remain unchanged.** No The Rev modifications, commits or pushes.

See [performance measurements](PERFORMANCE.md). Short settled capture averages are approximately **105–226 FPS**; 1% lows approximately **88–190 FPS**. The continental sample's GPU time is 8.29 → 8.56 ms while overall wall FPS is similar. Changes in clock/cache/temperature state mean faster samples do not prove a speedup. Mediterranean 2D/world draw submissions decrease from 427 to 357 because fewer monograms are drawn.

The rapid streaming-camera sweep measures **44.21 FPS average, 23.12 FPS 1% low**, compared with roughly 45 FPS in the preceding implementation and neutral mode earlier today. Smooth 60 FPS movement remains unmet. These are short submitted-frame tests, not sustained presentation/thermal-soak guarantees. Existing raw-image export warnings remain; final runs contain no script/shader errors or resource leaks.

## Remaining visual limitations

Borders are more legible, but angular provisional shapes and coarse steps in source polygons are still visible. Their geometry was deliberately preserved. More geographically informed, researched boundary data is the next substantive map-quality improvement. The original devices are consistent vector art, not 131 individually painted historical insignia. More period coin/seal research can replace them incrementally through the presentation manifest. Palette separation is not a color-blind accessibility certification, and fine labels still require zooming or roster search in dense regions.
