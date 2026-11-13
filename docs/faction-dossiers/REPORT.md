# Faction background and current situation

The short-background content described below has been superseded by the [expanded 132-faction historical articles](../faction-articles/REPORT.md). The Current/Chronicle architecture remains in use.

The Factions browser now separates fixed historical reading material from current campaign information. All 132 factions retain their existing IDs, culture assignments and undecided playability. No starting ownership, geographic records, political rasters, coordinates, terrain or vegetation change in this task.

## Behavior

- **Background**: a permanent Spring 278 BCE description and cultural grouping. Major powers have concise opening narratives; many regional groups have shorter geographic introductions. Later-attested names are qualified rather than presented as contemporary third-century states. Irish communities use archaeological context rather than an island-wide monarchy.
- **Current**: actual map allocations from the existing political adapter, with territorial areas and explicitly linked locations. Successful ownership updates refresh an open Current article immediately. No population, ruler, war, government or cultural assimilation is inferred from map colour.
- **Chronicle**: an honest empty state until an authoritative campaign event feed exists. No fictional events or automatic historical outcomes are generated.
- **Sources**: background citations, links to the nine existing research sheets where available, scenario caveats, identity and emblem evidence. Technical catalog information no longer dominates the main reading view.

Detail tabs support clicks, Tab/Enter and Left/Right/Home/End. Back restores the cultural list position. The repeated browser introduction is hidden during detail reading; smaller viewports use a compact faction heading. Existing scrolling, Escape closing, map controls and primary management tabs remain available.

## Architecture

`data/faction-backgrounds.json` contains 132 authored entries, source keys, evidence scopes and original research-file references. Runtime code never writes to it. `tools/faction-backgrounds-build.mjs` is the reproducible editorial builder; it reads authored opening data, never live ownership, and does not rewrite existing research.

The browser model copies the background catalog at configuration and returns copies to callers. The old scenario `openingOverview` remains a fallback for callers without the new catalog. The diagnostic 131-faction baseline filters the extra Mamertine background while the normal campaign uses all 132 entries.

`ui/faction_campaign_view.gd` is a read-only projection over the current cartography adapter. Only explicit settlement-to-district links enter its location list. Cultural associations and arbitrary points in broad polygons do not establish civic ownership. Opening relationship labels remain explicitly historical: Neapolis' treaty context is not silently relabelled as direct administration.

`faction_cartography.gd` emits `control_changed` after a successful changed owner assignment or changed state restoration. This notification adds no conquest rules. The browser refreshes only while Current is visible, without per-frame polling or map-loop changes. Future authoritative campaign systems should use the existing adapter methods; government, leadership and diplomacy readers can later extend the current-state projection without editing historical prose.

The chronicle awaits a real event reader. No event recorder, persistence scheme, fictional rulers, units, bonuses, diplomatic agreements or campaign mechanics are added.

## Historical coverage

Entries reuse the approved pre-expedition opening and existing R-16 material, supplemented with traceable geographic references. Strabo provides regional descriptions; Tacitus and Ptolemy provide later naming evidence, not 278 BCE censuses; Heritage Ireland provides archaeological interpretation; Encyclopaedia Iranica supports the Yuezhi and Massagetae context. Ptolemy's Stevenson translation has known defects, explicitly recorded; no coordinates or frontiers are derived from it.

These entries are short introductions, not a new comprehensive audit. Piraeus and Rhegion seasonal uncertainties remain qualified. Akragas retains the approved Syracuse aggregation. Precise later tribal institutions are not projected backward. References and their limitations are preserved in each entry's source metadata.

## Changed files

Paths below are relative to the repository:

| File | Change |
|---|---|
| `godot-prototype/data/faction-backgrounds.json` | New historical entries and source registry |
| `godot-prototype/tools/faction-backgrounds-build.mjs` | Editorial builder |
| `godot-prototype/ui/faction_browser_model.gd` | Validated background catalog and copy-based access |
| `godot-prototype/ui/faction_campaign_view.gd` | New live-state projection |
| `godot-prototype/ui/faction_browser.gd` | Article tabs, live refresh and compact reading layout |
| `godot-prototype/ui/campaign_ui.gd` | Loads background catalog; preserves diagnostic baseline support |
| `godot-prototype/faction_cartography.gd` | Ownership-change notifications |
| `godot-prototype/tools/faction-browser-validate.gd` | Expanded native interaction and state-isolation verification |
| `tests/faction-backgrounds.test.ts` | Coverage, sources, opening chronology and original research links |

## Verification

- Full TypeScript suite: **519 tests passed in 38 files**, one worker.
- Type check, build and postbuild smoke: passed.
- Political/protected-data validator: **8,728 checks passed**, including **7,677 protected files unchanged**.
- Native Forward+ verification: **446 checks passed**, covering all 132 faction details, all four tabs, keyboard navigation, scroll, Escape, orbit and smaller viewport layout. Tests temporarily change the Messana district through the existing owner adapter, verify immediate Current refresh and unchanged Background, inspect the receiving faction, and restore the original state. No production owner assignments are written.
- Additional native checks cover defensive background copies, invalid source rejection, missing political data and unassigned factions without declaring them destroyed.

Native results: `godot-prototype/evidence/faction-browser/validation.json`. Screenshots and engine logs: `godot-prototype/evidence/faction-dossiers/` (`background-desktop.png`, `current-desktop.png`, `background-small.png`). Actual captures at 1920×1080 and 1000×700 were inspected; the introduction and heading were tightened after the first smaller capture, then tests and screenshots were repeated. Existing raw-image export warnings remain in stderr; export packaging and future simulation behavior were not tested.
