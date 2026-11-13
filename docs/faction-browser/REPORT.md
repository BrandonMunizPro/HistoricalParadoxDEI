# Phase 2A · cultural faction browser

Implemented in the live Godot Factions → Cultures panel. This is a read-only
browser over the existing 278 BCE faction catalog. No faction roster, ownership,
settlement model, army, economy, diplomacy or AI system was created.

[Screenshot review](REVIEW.html) · [Native results](../../godot-prototype/evidence/faction-browser/validation.json)

## Audit and reused data

The active scenario contains **131 unique faction IDs**, **25 culture codes** and
131 existing map banners. It includes polities, regional associations and
presence-only groups; these are not 131 independently verified centralized states.
Its evidence statuses remain **30 reconstructions, 98 provisional and 3 presence-only**.

Sources reused:

- `data/world-border-review/scenario-278.json`, through the existing `world.read_json`
  resolution of `data/factions/scenario-278.json`: stable IDs, names, aliases,
  culture codes, evidence notes, source registry and geographic label anchors.
- `data/factions/presentation.json`: existing emblem evidence, source dates and
  explicit warnings about later motifs and game adaptations.
- `assets/factions/emblems.res`: the same 16-column baked banner atlas used by the
  map. Raw PNGs are under `.gdignore`; they are not imported resources. No banner
  was regenerated. The browser can reuse the baked resource under neutral-map mode;
  that fallback is implemented but was not separately launched for verification.
- Nine existing R-16 research sheets: Rome, Carthage, Epirus, Macedon, Seleucids,
  Ptolemaic Egypt, Syracuse, Aetolian League and Maurya. The publication tool extracts
  existing polity/date/scope/evidence paragraphs, retains source status and records
  the source SHA-256. It does not synthesize historical overviews or edit research.

Other factions show their existing catalog notes and an explicit missing-overview
message. Geographic coordinates are labeled as **map-label anchors**, not capitals,
settlement positions, borders or ownership assignments.

## Cultural categories

The browser uses **26 nonempty presentation categories**, keeping finer existing
culture codes separate rather than flattening every source family into an ethnicity.
All labels carry a general provisional-taxonomy warning; broad regional codes are
identified as catalog groupings. Original faction culture values are unchanged.

| Browser category | Factions |
| --- | ---: |
| Celtic · Gallic | 24 |
| Celtic · Brittonic | 10 |
| Celtiberian · catalog grouping | 7 |
| Germanic | 8 |
| Roman | 1 |
| Italic · regional catalog grouping | 3 |
| Etruscan | 1 |
| Hellenic · Greek communities | 18 |
| Hellenistic kingdoms | 5 |
| Hellenistic Egyptian | 1 |
| Iranian | 1 |
| Punic | 1 |
| North African · Numidian | 2 |
| North African · Mauretanian | 1 |
| North African · Libyan catalog group | 4 |
| Nubian | 1 |
| Thracian | 1 |
| Dacian / Getic | 2 |
| Illyrian · regional catalog grouping | 5 |
| Anatolian and Pontic · regional grouping | 3 |
| Caucasus · regional catalog grouping | 4 |
| Steppe · Scythian catalog group | 4 |
| Arabian | 7 |
| Indian | 1 |
| Iberian · regional catalog grouping | 10 |
| Classification review / unclassified | 6 |
| **Total** | **131** |

Six inherited mappings are held for cultural review: **Aquitanian polities,
Yuezhi, Ligurian polities, Veneti (Adriatic), Messapians and Daunians**. Their
original culture code remains visible as source metadata. This is an explicit
review queue, not six invented replacement ethnicities. No current catalog record
has an unknown culture code; future unknown codes enter the review category.

The Aquitanian warning references [Caesar, Gallic War 1.1](https://beta.perseus.tufts.edu/urn:cts:latinLit:phi0448.phi001.perseus-eng2/),
explicitly as later testimony. [The Yuezhi research reference](https://academic.oup.com/edited-volume/61799/chapter-abstract/546324434)
supports not treating the inherited Steppe code as a proven Scythian identity.
[Oxford's Italic Languages reference](https://academic.oup.com/reference/62365/reference-article-abstract/554611645)
distinguishes regional Italy from the Italic language family. The catalog's own
provisional regional-classification notice supplies the cautious Veneti/Daunian
review rationale. These checks did not rewrite the campaign's historical catalog.

## Interaction and architecture

The Roman marble panel provides expandable cultural sections, alias/name/group
search, scrollable lists, matching banner icons, a detail view and a Back action.
Search expands matching sections; groups remain individually collapsible.
Buttons support keyboard activation, Left/Right collapse/expand, Tab focus and
the existing panel Escape behavior. The Back action restores list focus and scroll.
Both the bottom HUD and older map Factions entry open this same browser.

`faction_browser_model.gd` is a read-only projection; `faction_browser.gd` owns its
view state. `faction-browser-groups.json` maps existing culture IDs to stable,
namespaced presentation group IDs. No group owns a region or settlement, and no
political-controller field determines culture. Future architecture can reference
the existing culture IDs without using faction ownership. Territory geometry is
not consumed by the browser model.

## Changed files

- `godot-prototype/ui/faction_browser_model.gd` — deterministic grouping/search model.
- `godot-prototype/ui/faction_browser.gd` — reusable accordion and detail view.
- `godot-prototype/ui/campaign_ui.gd` — Factions/Cultures integration and event-driven
  correction for transient header/HUD minimum sizes during UI construction.
- `godot-prototype/faction_cartography.gd` — only the legacy Factions button route;
  map drawing, palette, owners and faction camera methods are unchanged.
- `godot-prototype/data/faction-browser-groups.json` — presentation taxonomy/review
  notes and references to existing research sheets, not a second faction roster.
- `godot-prototype/data/faction-browser-research.json` — nine generated, sourced excerpts.
- `godot-prototype/tools/faction-browser-research.mjs` — reproducible publication tool.
- `godot-prototype/tools/faction-browser-validate.gd` — native regression and capture tool.
- This report, screenshot review and `evidence/faction-browser/` artifacts.

## Validation

Type checking, application build and all **514 existing tests across 37 files** pass;
targeted JavaScript lint also passes. The faction-browser native suite passes
**423 checks**, covering all 131 source identities and detail names, all 131 existing
emblems, duplicate rejection, deterministic grouping under reversed input order,
unknown-culture fallback, search, empty state, accordion buttons, keyboard arrows,
Back, scrolling, closing and uncovered-map orbit.

The suite compares territorial controllers and region owners before and after
browsing every faction, checks map selection and camera targets, and hashes the
site/research/world/scenario inputs. All remain unchanged. The existing campaign UI
native regression suite also passes, retaining settlement selection, modal focus,
Escape, reduced motion and independent HUD collapse behavior.

Actual 1920×1080 and 1000×700 renders were captured and visually inspected. The
first run exposed the ignored raw-icon directory; switching to the existing atlas
fixed emblem display. Captures also exposed retained transient header/HUD heights;
an event-driven size correction now keeps the map visible without touching its
render loop. Existing raw-image/export warnings remain; no export build, sustained
performance benchmark or screen-reader certification is claimed.

Phase 2A stops here. No settlement asset creation has begun.
