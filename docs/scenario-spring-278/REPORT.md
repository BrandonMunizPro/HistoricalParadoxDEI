# Spring 278 BCE starting-world corrections

Opening convention: spring, before Pyrrhus' Sicilian expedition. No exact day is asserted. This implements the approved targeted corrections, including the Akragas–Syracuse aggregation and the subsequent instruction to make the Mamertines an ordinary faction.

## Factions and future configuration

The active roster is **132 factions**: all 131 original IDs in their original atlas order, followed by `mamertines`. Every record uses the same schema. `playerSelectable: null` means **undecided**, not false, AI-only, or a promise of playability. Future `true` and `false` values are validated independently of culture, territorial ownership and map presence. The browser lists all records regardless of that field. There is no faction selection screen.

Existing IDs remain the extension points for future government, military, economic, diplomatic, character, objective and unique-mechanic configuration. None of those systems or speculative configuration records have been added. There are no placeholder rulers, units or bonuses.

## Applied changes

| Area | Representation at the opening | Affected identifiers |
|---|---|---|
| Messana | Mamertine control; Campanian controlling community, Greek civic context; no Carthaginian ownership | `mamertines`, `territory:mamertines`, `r16-ita-messana` |
| Akragas | Approved Syracuse regional gameplay aggregation, before Pyrrhus' command in Sicily | `syracuse`, `territory:akragas-spring`, canonical `5c5f9130-5076-5a71-b63a-4a51353c70d9`, `r16-ita-akragas` |
| Neapolis | Roman allied sphere, explicitly a treaty relationship rather than direct Roman administration; Greek civic context | `rome`, `territory:neapolis-alliance`, canonical `1f50fd31-a377-5df8-b182-d84e962aed97` |
| Athens / Piraeus | Athenian civic district distinct from the reconstructed Macedonian garrison at Piraeus | `athens`, `antigonid-holdings`, `territory:athens-city-spring`, `territory:piraeus-garrison-spring`, `r16-gre-athens`, `r16-gre-piraeus` |
| Aegium | Garrison reconstruction before accession to the renewed Achaean League | `antigonid-holdings`, `territory:aegium-before-accession`, `r16-gre-aegium` |
| Chalcedon | Separate existing Chalcedonian faction instead of extension of Byzantion | `chalcedon`, `territory:chalcedon-city-spring`, `r16-ana-chalcedon` |
| Eastern Iberia / Colchis | Existing Kartli envelope resolves its overlap with Colchis only; Armenian coverage is preserved | `kartli`, `colchis`, `territory:kartli`, `r16-cau-harmozica` |
| Western Yuezhi envelope | Withdrawn western ownership. Stable faction and region IDs remain; underlying existing Saka coverage is revealed where present, other gaps remain unresolved | `yuezhi`, `territory:yuezhi`, `saka` |
| Galatian groups | Retained as pending arrivals without settled territory or misleading starting map banners | `tectosages`, `trocmi`, `tolistobogii` |
| Cenabum | Existing Carnutes regional approximation | `carnutes`, `territory:cenabum-association`, `r16-gal-cenabum` |
| Samarobriva | Existing broad Belgae grouping accommodates Ambian regional context without adding a faction | `belgae`, `territory:samarobriva-association`, `r16-gal-samarobriva` |
| Burdigala | Existing Bituriges grouping; Vivisci context is not confused with the Cubi homeland | `bituriges`, `territory:burdigala-association`, `r16-gal-burdigala` |
| Tolosa | Existing Volcae regional approximation | `volcae`, `territory:tolosa-association`, `r16-gal-tolosa` |
| Known coastal point gaps | Bounded districts around existing Lilybaeum, Massalia, Panticapaeum and Heraclea Pontica references | `territory:lilybaeum-coverage`, `territory:massalia-city-coverage`, `territory:panticapaeum-coverage`, `territory:heraclea-city-coverage` |

These are **15 bounded political districts**, not new geographic settlements or surveyed ancient boundaries. The active map therefore has **143 territorial records** (128 retained plus 15 districts). Original region UUIDs, raster indexes, vector geometry and geographic/banner anchors remain unchanged. New region UUIDs are deterministic; new definitions have no fabricated permanent settlement memberships or control centres. Political polygons and ownership are independently revisable.

Rhegion retains its existing faction with the Campanian-garrison issue documented. Macedonia remains contested; Antigonid holdings do not assert a securely consolidated Macedonian monarchy. Pergamon is described as Philetairos' domain rather than the later royal kingdom. Existing plausible tribal/regional groupings remain available without deciding their eventual playability.

## Culture and settlement relationships

Culture changes are enumerated with reasons in `godot-prototype/data/spring-278/corrections.json`. They distinguish Irish from Brittonic; Venetic, Messapic, Daunian and Ligurian identities; Aquitanian and several Iberian regional identities; Armenian, Colchian and Kartlian; and Minaean, Sabaean, Hadramitic and Qatabanian traditions. Etruscan is no longer given an Italic family label. Yuezhi remains culturally unclassified instead of asserting a Scythian identity. Campanian is added for the Mamertines.

`settlement-relations.json` holds **24 explicit contextual relationships** keyed to existing research or canonical IDs. It distinguishes direct control, allied treaty, military occupation, regional aggregation and cultural association. It is static opening documentation, not a diplomatic simulation. Greek colonies and Chorasmian settlement context are not recultured from the faction palette. `cultural-profiles.json` supplies a separate lookup for later presentation; it creates no architecture assets. Canonical settlement panels show their explicit starting relationship where one exists. Research-only Messana remains a research location; no canonical settlement is added.

## Sources and unresolved questions

The source registry is preserved and extended in the active scenario and correction specification. Important traceable references include:

- [Polybius 1.7–8](https://penelope.uchicago.edu/Thayer/E/Roman/Texts/Polybius/1%2A.html): later ancient testimony on Messana and Rhegion.
- [Diodorus, fragments of book 22](https://penelope.uchicago.edu/Thayer/E/Roman/Texts/Diodorus_Siculus/22%2A.html): later testimony for the Sicilian sequence. This supports the political context, not exact district boundaries or direct Syracusan government of Akragas.
- [Polybius 2.41](https://penelope.uchicago.edu/Thayer/E/Roman/Texts/Polybius/2%2A.html): league reformation and subsequent accessions.
- [IG II³ 1 911, Kallias decree](https://www.atticinscriptions.com/inscription/IGII31/911): inscription of 270/269 recalling the earlier Athens–Piraeus conflict; not a precise 278 border survey.
- [Memnon](https://www.attalus.org/translate/memnon1.html): later epitomized testimony for the northern Anatolian political setting.
- [Encyclopaedia Iranica, Colchis](https://www.iranicaonline.org/articles/colchis/) and [Khalchayan](https://www.iranicaonline.org/articles/khalchayan/): scholarly regional geography and the later Yuezhi migration into Bactria.
- [Oxford's Samarobriva gazetteer entry](https://chre.ashmus.ox.ac.uk/admin/ancientplace/303) and [Strabo 4](https://penelope.uchicago.edu/Thayer/E/Roman/Texts/Strabo/4B%2A.html): regional associations; these do not establish exact third-century BCE tribal frontiers.

Unresolved: seasonal precision of Piraeus and Rhegion control; Akragas' distinct local authority within the approved aggregation; early Kartlian dynastic chronology; exact tribal frontiers in Britain, Ireland, Gaul and Iberia; and the extent of coastal dependencies. Miletus' documented Ptolemaic association remains distinct from its existing broad Seleucid map envelope, as already recorded in `data/anatolia/political-identities-278.json`; this pass does not invent a new city-state or resolve exclusive sovereignty. The unassigned-location inventory is not automatically filled by nearest faction.

## Future Messana Crisis — design note only

A later, separately approved conditional chain could inspect actual Messana control, local pressure from Syracuse, and requests for assistance or intervention choices involving Rome and Carthage. It must permit alternatives to the historical sequence and account for changed campaign circumstances. Neither a fixed-year trigger nor an automatic First Punic War is introduced. No event definitions, timer, diplomatic rules or scripted outcome are implemented here.

## Files and reproducibility

- Active data: `godot-prototype/data/world-border-review/{scenario-278,definitions,initial-owners,label-placements}.json`; political ID images in that folder and `data/anatolia/territory-ids.png`; `data/faction-browser-groups.json`; `data/factions/presentation.json`.
- Independent metadata and pinned political baseline: `godot-prototype/data/spring-278/`.
- Runtime: `godot-prototype/northern_italy_world.gd`, `faction_cartography.gd`, `ui/{faction_browser_model,faction_browser,campaign_ui}.gd`.
- Art: appended original `assets/factions/mamertines.svg` device and one previously unused cell in `emblems.{png,res}`. Original 131 cells remain byte-identical.
- Validation/model: `src/presentation/faction-cartography.ts`, `tests/faction-cartography.test.ts`, `tools/faction-browser-validate.gd`, `tools/world-border-validate.mjs`.
- Build tools: `tools/spring-278-{snapshot,build,validate}.mjs`, `tools/spring-278-{emblem,runtime}.gd`; active-roster support in `tools/faction-emblem-bake.gd`; correction hook in `tools/world-border-build.mjs`. All paths in this bullet are under `godot-prototype/`.

Run from repository root:

```text
node godot-prototype/tools/spring-278-build.mjs
godot --headless --path godot-prototype --script res://tools/spring-278-emblem.gd
node godot-prototype/tools/world-border-validate.mjs
godot --path godot-prototype --resolution 1920x1080 --script res://tools/spring-278-runtime.gd
godot --path godot-prototype --resolution 1920x1080 --script res://tools/faction-browser-validate.gd
npm.cmd test -- --maxWorkers=1
npm.cmd run typecheck
npm.cmd run build
```

The snapshot tool refuses to replace an existing baseline. The correction builder is repeatable from that pinned baseline and never regenerates physical geography. `world-border-build.mjs` reapplies the overlay automatically. If using other legacy regional political generators, reapply `spring-278-build.mjs` afterwards: their historical snapshot output is not the approved opening. Older `--border-baseline` launch mode intentionally retains the diagnostic 131-faction historical snapshot. `data/geographic-regions/initial-owners.json` is preserved for it; normal runtime redirects both definitions and owners to their matching active files.

## Verification

Final results:

| Check | Result |
|---|---|
| Vitest, existing suite plus two faction regressions | **516 passed**, 37 files (`--maxWorkers=1`) |
| TypeScript type check | Passed |
| TypeScript build and postbuild smoke | Passed |
| Political data / protected-file / pixel validation | **8,728 checks passed**, 7,677 protected files unchanged |
| Native Godot opening verification | **443 checks passed**, Forward+ on RTX 3060 Laptop |
| Existing native faction-browser regression | **426 checks passed**: full roster, deterministic groups, search, accordion keyboard behavior, detail/emblems, scroll, Escape, orbit, no owner/selection/camera mutation |
| Original emblems | All 131 existing atlas cells byte-identical; Mamertine device appended |
| Visual review | Actual 1920×1080 map/browser captures and 1000×700 browser capture inspected |

The initial concurrent test run exposed the old 131-record test fixture and four persistence timeouts during native rendering. The fixture was corrected to use the active scenario; the complete suite subsequently passed with one worker. An initial runtime assertion searched only immediate panel children rather than nested section labels; the assertion was corrected and all native checks rerun successfully. A detected Kartli overreach into Armenia was narrowed before the final raster/native validation. No final test failures remain.

See `godot-prototype/evidence/spring-278/data-validation.json` and `runtime-validation.json`, and `evidence/faction-browser/validation.json`. Final screenshots are `messana-political-map.png`, `mamertines-browser-desktop.png` and `mamertines-browser-small.png` in `evidence/spring-278/`.

Protected geography, all 687 research records, all 35 canonical settlements, terrain/vegetation data, research sheets and existing banner anchors are hash-checked against the pre-change manifest. Raster verification checks every pixel: changes must lie in approved political districts, the Colchis overlap, or the withdrawn Yuezhi claim. Armenian coverage is explicitly protected against the Kartli correction. Native verification exercises real Forward+ rendering and static owner palettes, not merely JSON counts. Existing raw-image export warnings are recorded in the engine stderr logs; export packaging is outside this validation.
