# R-16 comparative study — campaign-world coverage in Rome II, Divide et Impera, and Medieval Kingdoms 1212 AD

**Status: Proposal / research (2026-10-14).** Part of the R-16 world
political-institutions program. This document examines how three existing
historical-strategy designs — **Total War: Rome II** (vanilla), **Divide et
Impera** (DeI, a Rome II overhaul) and **Medieval Kingdoms 1212 AD** (MK1212, a
Total War: Attila overhaul) — represent their campaign worlds, and assesses what
HistoricalGame can learn, reuse as a *lead*, or exceed.

These games and mods are **design references and research leads only**. They are
**not** authoritative historical sources and **no** proprietary assets, maps,
code or identifiers may be copied (ADR-0001, ADR-0020; BLUEPRINT §10). No code,
`src/`, `tests/`, Codex VS-5 work, or approved ADR is changed by this study.

- Related: [R-16 world program](r16-world-political-institutions-program.md),
  [regional coverage matrix](r16-regional-coverage-matrix.md),
  [institutional taxonomy](r16-institutional-taxonomy.md),
  [campaign-start and historical timeline](../domain/campaign-start-and-historical-timeline.md),
  [political office and government architecture](../architecture/political-office-and-government-architecture.md) (AD-25),
  [geography integration requirements](../architecture/geography-integration-requirements.md),
  [intersettlement infrastructure and information transmission](../architecture/intersettlement-infrastructure-and-information-transmission-architecture.md) (AD-31/AD-32),
  [Rome II / DeI catalog handoff](../../research/rome2-dei/HANDOFF.md).

## 1. Purpose and method

**Question.** How do Rome II, DeI and MK1212 actually model the campaign world,
and where can a historically grounded, more expansive simulation go deeper
without inheriting their engine limits?

**Method.**

1. Mine the repository's **own** Rome II / DeI extraction
   (`research/rome2-dei/`; compiled catalogs and `extracted/` DB tables). Facts
   read directly from these files are marked **[V] verified**.
2. Cross-check with **official mod documentation** (Steam Workshop descriptions,
   ModDB pages, TWC wiki, developer guides). Facts from documentation are marked
   **[D] documented**.
3. Where a feature cannot be confirmed from data or documentation, say so and mark
   it **[U] unverified / limitation** — never assume.
4. Map each finding to the HistoricalGame architecture and to the R-16 taxonomy.

**Verification provenance (reproducible).**

- Catalogs: `research/rome2-dei/catalogs/dei_units.json`, `dei_factions.json`,
  `dei_unit_relationships.json`, `rome2_battlefields.json`,
  `rome2_environments.json`, `catalog_build_report.json`.
- Tables: `research/rome2-dei/extracted/` (vanilla `data.pack` tables for
  campaign geography; DeI `dei_part1` tables for factions/units/politics).
- Method/provenance/caveats: `research/rome2-dei/HANDOFF.md` §§2–5.

> **Verification boundary (important).** The extraction decodes **units, battles
> and environments, plus campaign geography, factions and politics-parties**. It
> **does not** contain **building chains, the economy/building effect tables, the
> full technology tree, diplomacy tables, or characters/traits**, and the DeI
> **`startpos.esf` (starting region ownership, playable set, per-region
> resources)** was **not decoded** (binary ESF, not DB). Claims about those areas
> are therefore **[D] documented** or **[U]**, never **[V]**.

## 2. Verified reference baselines

Counts read directly from the repository extraction (Rome II vanilla campaign map;
DeI content tables unless noted).

| Quantity | Value | Source table / catalog | Status |
| --- | --- | --- | --- |
| Campaign regions (total) | **813** | `regions_tables` | [V] |
| — land regions | **696** | `regions_tables` (`is_sea=false`) | [V] |
| — sea regions | **117** | `regions_tables` (`is_sea=true`) | [V] |
| Settlements (campaign map) | **684** | `campaign_map_settlements_tables` | [V] |
| Provinces (unique) | **210** | `region_to_province_junctions_tables` (684 edges) | [V] |
| Road levels per grand campaign | **3** | `campaign_map_roads_tables` | [V] |
| Campaigns defined | **10** (4 grand + minis + prologues) | `campaigns` in `dei_factions.json` | [V] |
| DeI faction records | **416** (`is_rebel` = **52**) | `factions_tables` (DeI) | [V] |
| DeI faction entries across packs | **909** | `dei_factions.faction_count` | [V] |
| DeI faction groups | 13 (table) / 18 (catalog) | `faction_groups_tables` | [V] |
| DeI subcultures | **16** | `factions_tables.subculture` | [V] |
| DeI political-party edges | **657** | `faction_political_parties_junctions_tables` | [V] |
| Politics/government rows | **279** | `culture_subculture_politics_government_types_tables` | [V] |
| DeI unit records | **4462** | `dei_units.json` `unit_count` | [V] |
| — by category | melee inf 2108 · cavalry 1099 · ranged inf 937 · artillery 170 · elephants 43 · ships 100 | `dei_units` | [V] |
| Kinds of table families extracted | **105** | `extracted/` | [V] |

**Vanilla Rome II roads (the entire road model, verified).**

| Road key | movement_cost | threshold | upgrade | downgrade |
| --- | --- | --- | --- | --- |
| `rom_main_road_lv_1` | 80 | 1 | 1 turn | 1 turn |
| `rom_main_road_lv_2` | 50 | 10 | 1 turn | 1 turn |
| `rom_main_road_lv_3` | 50 | 100 | 1 turn | 1 turn |

**Finding.** Rome II's roads are **three abstract regional levels** with a single
`movement_cost` and a development `threshold`; level 3 adds **no** movement over
level 2 (only economy/trade). There is **no** per-segment road geometry, quality,
condition, maintenance or deterioration in the data — those are engine/visual
abstractions. This is the Napoleon-style "upgradeable road tier" model our
**AD-31** proposal deliberately goes beyond.

## 3. Reference coverage matrix (what each design implements)

Legend: **[V]** verified from repo extraction · **[D]** documented by official
source · **[U]** unverified / engine limitation.

| Dimension | Total War: Rome II (vanilla) | Divide et Impera | Medieval Kingdoms 1212 AD |
| --- | --- | --- | --- |
| **Campaign map** | Fixed, non-moddable 3D campaign map; continuous zoom to battle [D]. Grand campaign ≈813 regions / 684 settlements / 210 provinces [V]. No official map tools [D]. | Same engine map; DeI overhauls content/mechanics, not the Grand-Campaign map [D]; a separate scenario campaign map exists [D]. **GC startpos not decoded here** [U]. | Same engine map (Attila); map editing "next to impossible" [D]. Settlement **hard limit 256** [D]; every region is its **own province** ("single-region provinces") [D]. Later updates add settlements up to the limit [D]. |
| **Settlement density** | **684** settlements on the GC [V]; engine-bounded. | Same 684-region map; density is an engine constant, not a mod choice [D] (startpos unverified [U]). | **≤256** settlements (Attila engine cap) [D]. |
| **Administrative units (provinces)** | Provinces = groups of 2–4 regions; province capital + edicts [D]. 210 provinces [V]. | Same province framework; province effects/edicts rebalanced [D]. | **One region = one province** (no multi-region provinces) [D]. |
| **Settlement hierarchy & slots** | Settlement tier + building slots; capital vs minor differ [D]. Slot table `campaign_map_slots` failed to decode → slot counts **[U]**. | Custom building-slot revamp planned/partly in 1.2, incl. regional/resource buildings [D]. | Every region **6 slots** (vanilla); a submod raises to **10** [D]. Cities vs castles vs donated fiefs [D]; every city has walls [D]. |
| **Building chains** | Large cultural building trees [D]. **Building tables not in extraction** [U]. | "Completely custom building chains" [D]; meaningful resources / AoR buildings [D]; economy moved to buildings [D]. | "Completely custom building chains" [D]; Knightly Orders line for crusader units [D]. |
| **Recruitment** | Building-driven, culture/subculture-gated; mercenaries [D]. | **Area of Recruitment (AoR)** by region; cultural control gates roster; reforms unlock tiers; Roman auxilia [D]. `building_units_allowed` tables present [V]. | Population-class-gated recruitment (Nobles/Burghers/Tribesmen/Peasants/Foreigners) [D]; 3 era tiers (13th–15th c.) [D]; mercenaries partial [D]. |
| **Cultural distinctions** | Culture + subculture drive rosters/religion/buildings [D]. | **16 subcultures** in faction data [V]; "Culture UI"; **4 political parties per faction** [D]. | Culture + **religion + local traditions**; foreign-vs-native population classes [D]. |
| **Political systems & relationships** | Faction politics (parties, senate, civil war); diplomacy = client states / satrapies / allies [D]. 279 politics/gov rows [V]. | Overhauled politics; reforms; supply; loyalty; "multiple parties" [D]; 657 party edges [V]. | **HRE elector system**, Papacy, Crusades, annex-vassal, buffer states, dynamic faction rank (county→empire), war weariness, scripted "Decisions" [D]. |
| **Economy & trade** | Province economy, resources, trade agreements, edicts [D]. | "Meaningful resources", supply system, trade redesigned; income from buildings [D]. | Population drives economy/squalor; city-vs-castle income tradeoff; settlement trading via diplomacy [D]. |
| **Infrastructure (roads)** | **3 abstract road levels**; `movement_cost` 80/50/50; upgrade/downgrade 1 turn [V]. | Same road framework [D]; "new graphical overlay map" for roads [D]. | Attila road framework (abstract levels) [D]. |
| **Information / knowledge** | Fog of war + line-of-sight only; **no** modelled knowledge propagation, couriers, delivery delay, interception [D/U]. | Same; **no** knowledge-transmission model [D/U]. | Scripted events/messages are global; **no** physical messenger/delivery model [D/U]. |
| **Characters** | Generals/statesmen with traits, skills, offices; agent characters [D]. | Deep character overhaul: skills, traits, traditions, ancillaries, political ranks [D]. **Character tables not in extraction** [U]. | Characters/agents; no evidence of institutional role-holding depth comparable to our AD-25 [U]. |
| **Seasons / environment** | Weather/season modifiers [D]. | **4 turns/year**; location-varying seasonal effects [D]. | **2 turns/year**, summer/winter only (no spring/autumn) [D]. |
| **Presentation continuity** | Continuous campaign map with seamless battle zoom [D]. | Same [D]. | Same, but siege maps largely re-hashed from Attila [D]. |

## 4. Five-part comparative assessment

The required comparison: (1) implements, (2) simplifies/abstracts, (3) where
HistoricalGame can go deeper, (4) architecture compatibility, (5) decisions or
research required.

| Area | 1. Demonstrably implements | 2. Simplifies / abstracts | 3. HistoricalGame could represent more deeply | 4. Compatible with our architecture | 5. New decision / research required |
| --- | --- | --- | --- | --- | --- |
| **Settlement density** | RII 684 · MK1212 ≤256, engine-capped [V/D] | Density fixed by engine; one settlement per region, no sub-settlement hierarchy [D] | Model **nested settlement/community tiers** (metropolis → polis → town → village → hamlet) with independent existence and lifecycle (ADR-0013/0020; R-16 subordinate tiers) | Geography graph + settlement identity already separate (ADR-0020; VS-5 prototype) | **AD-33 (proposed)** settlement granularity & world scale; domain-model notes settlement granularity **unresolved** |
| **Administrative units** | RII provinces (group of regions) [V]; MK1212 single-region provinces [D] | Province is a fixed engine grouping with one edict; no per-polity administration modes [D] | **Administration mode** (direct / hegemonic-indirect / corporate) and **obligation tiers** as in AD-25 + taxonomy §6; province meaning supplied by the polity, not geography | `geography-integration-requirements.md` already says provinces are **political** groupings, not geography; AD-25 | AD-25 (open) + R-16 sheets (subordinate communities) |
| **Institutions / political depth** | Party/office/civil-war systems [D]; 279 gov rows, 657 party edges [V] | Offices are abstracted slots with trait effects; no role definition vs holding vs derived authority [D] | Full **RoleDefinition / RoleHolding / derived Authority** model, collegiality, veto, term expiry, per-polity expression (F1–F7) | AD-25 proposal; E9/E10/E18; AD-28 traits/psychology | AD-25 (open); R-16 polity sheets |
| **Political relationships** | Client states, satrapies, vassals, alliances; HRE/Papacy (MK1212) [D] | Relationships are scalar attitude + a few subject types; limited obligation vocabulary [D] | **Typed subject relationships** with scoped/tiered/grantable membership and separate legal authority vs influence vs geographic control vs economic obligation | AD-25 §6; economic authority separation (AD-26); taxonomy §6 | AD-25 (open); R-16 |
| **Cultural distinctions** | Culture/subculture (16 subcultures [V]); religion/traditions (MK1212) [D] | Culture is a static tag choosing assets/rules; little internal evolution [D] | Culture/religion as **data + rules** (A-9), with cohort-carried culture (ADR-0017) and data-driven expression (ADR-0013) | A-9, ADR-0013, ADR-0017; E10 | AD-11 (open) culture/religion/government data format |
| **Recruitment** | Building/AoR/population-gated rosters; reforms (DeI) [D]; `building_units_allowed` [V] | Recruitment is a UI build action; no institutional recruitment authority, levy/obligation distinction [D] | Recruitment as an **institutional action** (who may levy whom), levy vs professional vs mercenary, obligation-based; historically grounded AOR | Legal-action gate (ADR-0006); E10/E13; AD-1 keeps DeI out of domain | R-1 (DeI unit adequacy); **R-19 (proposed)** recruitment/levy/AoR evidence at 278 BCE |
| **Infrastructure** | **3 abstract road levels** [V]; graphics overlay (DeI) [D] | Roads have no segment geometry, quality, condition, maintenance or deterioration; no bridges/passes/ferries/ports as state [V/D] | Mutable **route quality/condition** on geographic edges; **bridges/fords/ferries/passes/ports/river transport** as nodes; construction/maintenance/damage as simulation changes | ADR-0020 (geography), ADR-0003 (elapsed time), ADR-0006 (legal gate) | **AD-31 (proposed)**; **R-17 (proposed)** infrastructure evidence |
| **Information / knowledge** | Fog of war, line-of-sight only; no knowledge model [D/U] | Events are globally known instantly; no couriers, delivery delay, reliability, interception, or delayed orders [D/U] | Full **E5** extension: observers, messengers, delivery over the infrastructure network, reliability/mutation, interception, delayed orders, deception | E5; event envelope ADR-0005; ADR-0003 (elapsed duration) | **AD-32 (proposed)**; **R-18 (proposed)** |
| **Economy / trade** | Province economy, resources, trade, edicts; supply (DeI) [D] | Single-currency abstraction; ownership/control/spending not separated; no ledger [D] | **Ownership vs control vs flows**, treasuries, financial ledger, spending authority, audit-as-derived-discrepancy | AD-26 proposal; E19; ADR-0017 cohorts | AD-26 (open); R-15 |
| **Presentation continuity** | Continuous campaign map with seamless battle zoom [D] | Engine-bound art; MK1212 has no campaign-map art tools and reuses Attila siege maps [D] | Geographically **continuous** presentation derived from authoritative simulation state (ADR-0019), engine-replaceable | ADR-0019 presentation boundary; ADR-0020; AD-30 | AD-19/AD-20/AD-18 (open); renderer **Unresolved** |
| **Characters** | Traits/skills/offices/ancillaries; political ranks (DeI) [D] | Traits are effect stacks; no self vs reputation vs legitimacy separation [D] | Traits/psychology facets, self vs reputation vs legitimacy, interaction via the legal-action gate | AD-28/AD-29 proposals; E4 | AD-28/AD-29 (open) |

## 5. Can HistoricalGame exceed these references?

Verdict per axis, given our architecture (simulation-authoritative, engine-agnostic
domain, legal-action gate, data-driven culture, separate geography/ownership/
control) versus the engine limits of the references.

| Axis | Can we exceed? | Reasoning |
| --- | --- | --- |
| **Settlement density** | **Yes, potentially — but it is a content/scale decision, not a foregone conclusion.** | The references are **hard-capped by their engines** (MK1212 ≤256; Rome II 684 fixed regions; neither map is moddable [D]). We are **not** bound to an engine map (ADR-0020; own graph). But density is bounded by **modelling and art/research cost**, and our settlement granularity is **unresolved** → needs **AD-33** before promising numbers. |
| **Political entity diversity** | **Yes, in depth; count is a scope choice.** | RII/DeI encode ~416 DeI faction records / 909 entries [V]; MK1212 has 57 playable + emergents [D]. Our A-31 simulates every faction regardless of playability, and R-16 classes A–F can represent dependent leagues, ethne and subordinate communities the references flatten. Exceeding raw counts is possible; the differentiator is **typed institutional depth**, not headcount. |
| **Institutional depth** | **Yes.** | References use abstract office/trait/party slots [D]. Our AD-25 (role definition vs holding vs derived authority), collegiality, veto, term expiry, per-polity expression and the R-16 taxonomy are strictly richer and are **already designed**. |
| **Infrastructure simulation** | **Yes.** | References reduce roads to **3 abstract levels** [V] with no bridges/passes/ferries/ports state. AD-31 proposes mutable segment/node state, quality/condition/deterioration, and construction/maintenance/damage as simulation changes. |
| **Geographically continuous presentation** | **Plausible, not yet proven.** | The references achieve seamless continuity but are engine-bound with limited art tooling [D]. Our ADR-0019 presentation boundary permits an engine-agnostic renderer; VS-5 is a bounded prototype. Production continuity requires resolving the renderer (ADR-0019), coordinates (AD-19) and battlefield projection (AD-20) — **not yet closed**. |
| **Information/knowledge propagation** | **Yes — a decisive differentiator.** | No reference models knowledge physically [D/U]. E5 + AD-32 (messengers, delivery time, reliability, interception, delayed orders) is a capability none of the references have. |

**Overall.** HistoricalGame is architecturally **able** to exceed all three
references on institutional depth, infrastructure simulation and information
propagation, and to **potentially** exceed settlement density and entity
diversity — provided the **open scale/granularity decisions (AD-33)** and the
**renderer/coordinate decisions (ADR-0019, AD-19/AD-20)** are made, and the
content/research (R-16, R-17, R-18, R-19) is produced. The references' ceilings
are mostly **engine** ceilings; ours are **content and decision** ceilings.

## 6. Limitations and unverified claims

Explicit limitations, per the instruction not to assume a feature exists:

1. **Building chains, economy tables, technology tree, diplomacy and
   characters/traits are not in the extraction** — building-chain depth, economic
   internals and character systems are **documented only** ([D]/[U]), not
   verified from data.
2. **DeI `startpos.esf` was not decoded** — DeI's starting region ownership,
   playable-faction set, and any per-region resource/religious assignments are
   **[U] here**; DeI documents heavy startpos editing [D].
3. **Settlement slot counts** for vanilla Rome II are **[U]** (the
   `campaign_map_slots` table failed to decode; `campaign_map_settlements`
   returned uniform placeholder template/slot values). Reported 4–6 slots is
   [D], not [V].
4. **Culture vs subculture totals** are partially ambiguous: 16 **subcultures**
   are [V] from DeI faction data; the distinct-**culture** count from the
   politics table (4) is GC-scoped and **not** a reliable global total [U].
5. **MK1212 specifics are [D]** (Steam/ModDB/TWC/wiki) and change across
   versions; the campaign is an **open alpha**, missing technologies, naval units
   and (partly) mercenaries [D].
6. **Build/version drift:** Rome II/DeI/Attila and their mods are updated over
   time; counts are as documented/at extraction time (2026-10-14).
7. **No proprietary assets were extracted, copied or reused** beyond
   read-only, already-handled catalog research (`HANDOFF.md` §1).

## 7. Non-goals and purity

- No copying of proprietary game **assets, maps, or code** (ADR-0001, ADR-0020).
- No engine keys, DeI/Rome II identifiers or catalog structures enter
  `src/domain` (ADR-0001; domain-purity test).
- No implementation, no `src/`/`tests/` change, no VS-5 change, no approved ADR
  altered. All decisions remain **OPEN**.
- These references are **leads**, not historical authorities; every historical
  claim still requires its own cited evidence (R-16 method).

## 8. Proposed decisions and research surfaced by this study

- **AD-33 — Settlement granularity and campaign-world scale** *(proposed, OPEN).*
  How many settlement tiers and what density the world targets; relationship to
  continuous geography and to content cost. Surfaced because the domain model
  already lists settlement granularity as unresolved and because the references'
  density is engine-capped. Blocks settlement-content scale, not the simulation.
- **R-19 — Recruitment, levy and Area-of-Recruitment evidence at 278 BCE**
  *(proposed, research).* What attested recruitment/levy/obligation systems and
  regional-origin troop traditions existed per polity, to ground a recruitment
  system that is institutional (who may levy whom) rather than a UI build action.
  Feeds E10/E13 and R-1.
- Reaffirmed existing open items this study touches: **AD-25** (offices),
  **AD-26** (economic authority), **AD-11** (culture/religion/government data),
  **AD-28/AD-29** (characters/events), **AD-19/AD-20/AD-18** (geography/renderer),
  **AD-31/AD-32** (infrastructure/information), **R-15/R-16/R-17/R-18**.

## 9. References

**Repository (verified).**

- `research/rome2-dei/HANDOFF.md` — extraction method, catalogs, caveats.
- `research/rome2-dei/catalogs/` — `dei_units.json`, `dei_factions.json`,
  `dei_unit_relationships.json`, `rome2_battlefields.json`,
  `rome2_environments.json`, `catalog_build_report.json`.
- `research/rome2-dei/extracted/` — `regions_tables`,
  `region_to_province_junctions_tables`, `campaign_map_regions_tables`,
  `campaign_map_settlements_tables`, `campaign_map_roads_tables`,
  `factions_tables` (DeI), `faction_political_parties_junctions_tables`,
  `culture_subculture_politics_government_types_tables`,
  `building_units_allowed_tables`.

**Rome II / DeI (documented).**

- Divide et Impera — TWC Wiki and official forums/mod pages (reforms, AoR,
  seasons, supply, politics, building overhauls).
- ModDB: Divide et Impera; TWC: DeI 1.2/1.3 release notes and startpos guides.
- Rome II campaign mechanics (provinces, edicts, politics, diplomacy).

**Medieval Kingdoms 1212 AD (documented).**

- Steam Workshop: "Medieval Kingdoms 1212 AD Base Pack — Campaign Alpha";
  "Official Mechanics Guide"; "Custom cities beta".
- ModDB: "Medieval Kingdoms Total War (Attila Version)" — faction list and
  roster notes; planned-factions map thread.
- TWC: "Medieval Kingdom 1212 A.D Map [UPDATE]" thread (map-modding limits).
