# Expanded faction histories

All **132 active factions** now have an authored historical article, replacing the short opening descriptions. Coverage totals **46,139 words**, with **309–409 words per faction**, excluding fact labels, headings and references. Articles are compiled from twelve regional editorial batches and reference 115 distinct source records.

## Reading experience

Open **Factions → a cultural group → a faction → Background**. The side panel provides the complete article. **Open full reading view** opens a wider marble-framed reading window, up to 980 × 900 pixels, with larger body text.

Each entry contains a lead, homeland, political setting, cultural grouping and five sections:

1. Origins and historical development.
2. Homeland and regional society.
3. Internal position in 278 BCE.
4. External relationships at the opening.
5. The Spring 278 BCE setting.

Contents buttons scroll to and focus their section. References are numbered per article, with section links to the bibliography and a References contents entry. Keyboard focus follows scrolling. Escape closes the reader first, restores its originating control and leaves the faction panel open. The return button also closes the reader.

The existing **Current**, **Chronicle** and **Sources** views remain available. Historical articles are fixed opening material; ownership updates continue to refresh Current without rewriting history. Chronicle remains empty until an authoritative event feed exists.

## Editorial coverage

| Batch | Factions |
|---|---:|
| Major powers and Mamertines | 10 |
| Greek civic and federal world | 18 |
| Italy | 11 |
| Iberia | 17 |
| Gaul | 17 |
| Britain and Ireland | 10 |
| Germania and southern Scandinavia | 8 |
| Balkans | 10 |
| Africa | 8 |
| Anatolia and Caucasus | 8 |
| Steppe populations and Galatian groups | 8 |
| Arabia | 7 |
| **Total** | **132** |

The narrative uses the approved pre-Sicilian-expedition spring convention. It distinguishes civic institutions, monarchies, regional communities and migration-era identities. Later tribal names, borders and institutions are not silently treated as contemporary evidence. Irish entries use indigenous archaeological context; Yuezhi migration into Bactria and settled Galatian territories remain later developments. Mamertine Messana remains distinct from Carthage. The Syracuse–Akragas aggregation is identified as a regional approximation.

Ancient testimony is identified as earlier or later where relevant. Sources include Polybius, Plutarch, Strabo, Herodotus, epigraphic research, museum material and modern scholarship. Bibliographies preserve traceable URLs and evidence notes. Nine existing research-file links are retained. This is an expanded reading layer, not a new scholarly reassessment of every political boundary.

## Files changed for this expansion

- `godot-prototype/data/faction-articles/manifest.json`: ordered editorial batch list.
- `godot-prototype/data/faction-articles/metadata.json`: retained evidence scopes, original research links and source metadata, separated from authored prose.
- `godot-prototype/data/faction-articles/01-major-powers.json` through `12-arabia.json`: the authored articles and additional sources. The folder's `.gdignore` prevents unnecessary editor imports; the Node compiler reads these files directly.
- `godot-prototype/data/faction-backgrounds.json`: compiled runtime encyclopedia, version 2.
- `godot-prototype/tools/faction-backgrounds-build.mjs`: compiler that validates the exact active roster, section structure, substantive length and references. It rejects missing batches and duplicate IDs. `--check-progress` reports coverage without publishing partial content.
- `godot-prototype/ui/faction_article.gd`: shared article renderer, contents navigation and references.
- `godot-prototype/ui/faction_browser.gd`: embeds articles and opens the wider reader.
- `godot-prototype/ui/faction_browser_model.gd`: validates structured articles and source relationships while preserving legacy fallback support.
- `godot-prototype/ui/campaign_ui.gd`: optional wider reading-modal layout and keyboard-following scroll behavior.
- `tests/faction-backgrounds.test.ts`: complete article coverage, section/source validation, exact word counts, opening chronology and retained research links.
- `godot-prototype/tools/faction-browser-validate.gd`: expanded native interaction checks and screenshot capture.
- `godot-prototype/evidence/faction-articles/`: screenshots, engine logs and machine-readable results. Existing faction-browser validation evidence is refreshed by the same runner.

No geography, settlement positions, culture assignments, faction IDs, ownership mappings, terrain, vegetation or simulation data were edited for this expansion. The workspace already contained substantial unrelated changes; those have been preserved.

## Verification

- Article compiler: 132/132 entries, five sourced sections each; no missing cultural batches.
- `npm.cmd test -- --maxWorkers=1`: **519 tests passed across 38 files**.
- Final content check: `npm.cmd test -- tests/faction-backgrounds.test.ts --maxWorkers=1`: **3 tests passed**.
- `npm.cmd run typecheck`: passed.
- `npm.cmd run build`: passed, including postbuild smoke checks.
- Godot headless script parse: passed.
- Native Godot Forward+ validation on an NVIDIA RTX 3060 Laptop GPU: **1,252 checks passed, zero failures**; [validation.json](../../godot-prototype/evidence/faction-articles/validation.json).
- `node godot-prototype/tools/world-border-validate.mjs`: **8,728 checks passed**, including the existing scenario consistency rules and hashes for **7,677 protected files**. Reported raster changes are the previously approved spring scenario corrections relative to its baseline, not edits made by the article compiler.

Native checks cover every faction and emblem, grouping/search, all detail tabs, source resolution, article navigation, reader focus and closing, smaller viewport bounds, live Current updates and restoration, background immutability, protected inputs and camera behavior. Viewports: 1920 × 1080 and 1000 × 700. Actual captures were inspected for readability, layout and clipping.

## Screenshots and limitations

- [Full reader, desktop](../../godot-prototype/evidence/faction-articles/reader-desktop.png)
- [Historical section, desktop](../../godot-prototype/evidence/faction-articles/reader-section-desktop.png)
- [Reference list, desktop](../../godot-prototype/evidence/faction-articles/reader-references-desktop.png)
- [Faction side panel, desktop](../../godot-prototype/evidence/faction-articles/background-desktop.png)
- [Reader, smaller viewport](../../godot-prototype/evidence/faction-articles/reader-small.png)

For poorly documented groups, the articles explain the limits of contemporary evidence rather than inventing rulers, constitutions or alliances. Some regional context necessarily overlaps. Bibliographic URLs are displayed as text; reference controls navigate within the article. The native run emits existing map-image import/export warnings; this task does not repair terrain asset packaging. No packaged export or mobile-sized layout was tested. Campaign events and simulated domestic affairs remain future systems.
