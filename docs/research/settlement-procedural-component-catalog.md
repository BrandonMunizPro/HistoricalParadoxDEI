# Settlement procedural building-component catalog (proposal)

**Status: Proposal (2026-10-14), part of R-16 (settlement sub-program).** A
proposed **modular component library** so a small set of reusable pieces
recombines into many distinct, historically plausible settlements without
hand-modelling every city. This is a **catalog design**, not an asset spec, not a
runtime schema, and not production art (`../presentation/artwork-production-roadmap.md` §1
gate applies).

Related: [`r16-settlement-architecture-and-visual-identity.md`](r16-settlement-architecture-and-visual-identity.md),
[`r16-rome-architecture-278bce.md`](r16-rome-architecture-278bce.md),
[`r16-greek-italic-punic-architecture-278bce.md`](r16-greek-italic-punic-architecture-278bce.md),
[`settlement-architecture-evidence-and-anachronism-register.md`](settlement-architecture-evidence-and-anachronism-register.md),
[`../architecture/settlement-visual-development-architecture.md`](../architecture/settlement-visual-development-architecture.md).

## 1. Principles

1. **Variation is a product of a small number of axes**, not of bespoke models:
   **culture/tradition × environment × development level × condition**. A handful
   of components per family yields hundreds of distinct settlements.
2. **Only supplied simulation development renders.** The catalog provides
   *candidates*; the selector chooses; an empty development snapshot shows the
   base settlement only.
3. **Instanced and culled.** Components are shared meshes/materials; selection is
   spatially indexed. LOD swaps detail without changing identity.
4. **Evidence-classed.** Each component is **[D]/[R]/[S]** and carries a period
   eligibility window (register). Ineligible components cannot be selected at 278.
5. **Stable category slots.** Adding a component to a family does not relocate an
   existing building (prototype rule preserved).
6. **Culturally specific, not stereotype.** No invented motifs
   (`../presentation/presentation-requirements.md`); generic "ancient" forms are
   forbidden.

## 2. Component record (proposed fields, illustrative)

| Field | Meaning |
| --- | --- |
| `componentId` | stable asset id |
| `family` | fortification / religious / civic / residential / commercial / agricultural / infrastructural / monumental |
| `tradition` | Greek, Italic/Roman, Samnite, Punic, Hellenistic, Etruscan, Egyptian, Mesopotamian, Iranian, Celtic, Iberian, Thracian, South-Arabian, Mauryan |
| `environment` | hilltop, coastal, riverine, plain, oasis/desert-edge, generic |
| `level` | development rung this component represents (0–3) |
| `category` | selector category (military, civic, religious, commercial, agricultural, maritime) |
| `periodWindow` | eligible period(s), e.g. `-400..-200` |
| `evidenceClass` | D / R / S |
| `footprint` | placement footprint + anchor |
| `provenance` | hand-made/generated, licence, source note |

## 3. Terrain archetypes (environment base)

| Archetype | Adaptation | Precedent |
| --- | --- | --- |
| **Hilltop / terraced** | Contour-following blocks, retaining terraces, acropolis/citadel | Samnite, Iberian, Etruscan, Greek acropoleis [D/R] |
| **Coastal / maritime** | Harbour-facing, quays, moles | Greek colonies, Punic cities, Alexandria [D/R] |
| **Riverine** | Bridge, river port, flood-aware placement | Rome, Egyptian, Mesopotamian [D/R] |
| **Plain / inland** | Grid or organic blocks, agricultural surround | Planned Greek/Hellenistic, Gallic open settlements [D/R] |
| **Oasis / desert-edge** | Wall + tower, irrigation, compact shaded plan | South-Arabian, Egyptian oases, Garamantian fringe [R/S] |

## 4. Fortification components

| Component | Variants | Tradition | Class |
| --- | --- | --- | --- |
| Curtain wall segment | tuff ashlar · polygonal/cyclopean · mud-brick-on-stone · massive ashlar · rubble stone · earth-timber | Roman/Italic, Samnite, Greek, Punic, Iberian, Celtic | D/R |
| Gate | simple opening · **bent/offset** (Greek) · **arched** (Etruscan/Italian) | — | D/R |
| Tower | square · round · projecting | Greek, Hellenistic, Iberian, South-Arabian | D/R |
| Citadel / acropolis | fortified high point (Capitol, Byrsa-type, Greek akropolis) | Roman, Punic, Greek | D/R |
| Rampart/ditch | earth + timber, ditch | Celtic, Thracian | D/R |
| Enceinte extension | new wall line enclosing growth | any | R |

## 5. Religious components

| Component | Variants | Tradition | Class |
| --- | --- | --- | --- |
| Temple — Italic | podium, deep porch, Tuscan columns, terracotta revetment; 3-cella option | Roman/Italic/Etruscan | D |
| Temple — Greek | peripteral Doric / Ionic / Corinthian | Greek/Hellenistic | D |
| Shrine — Punic | rectangular cella; **tophet** open precinct with stelae | Punic | D/R |
| Temple — Egyptian | **pylon** front, forecourt, hypostyle (completion dates vary) | Egyptian | D/R |
| Temple — Mesopotamian | mud-brick temple platform; ziggurat ruin | Mesopotamian | D/R |
| Sanctuary terrace | terraced precinct, altars | Italic, Greek, Iberian | R |
| Altar / sacred enclosure | open precinct | many | R |

## 6. Civic components

| Component | Variants | Tradition | Class |
| --- | --- | --- | --- |
| Open assembly space | Forum / agora / assembly plateau | Roman, Greek, Italic | D/R |
| Council hall | Curia/Senate house · bouleuterion | Roman, Greek | R |
| Stoa / portico | colonnaded hall | Greek/Hellenistic | D |
| Speaker platform | Rostra-type (modest at 278) | Roman | R |
| Paved civic core | paving, defined edges | any | R |
| Monumental steps/terrace | sanctuary/civic terracing | Hellenistic, Italic | R |

*(Note: the **basilica** is not a 278 form and is intentionally absent.)*

## 7. Residential components

| Component | Variants | Tradition | Class |
| --- | --- | --- | --- |
| **Atrium domus** | courtyard/atrium plan, low-rise | Roman/Italic/Etruscan | R |
| **Courtyard / pastas house** | Greek courtyard house | Greek | R |
| **Peristyle house** | colonnaded court (emerging) | Greek/Hellenistic | R |
| **Mud-brick flat-roof house** | flat roof, courtyard | Egyptian, Mesopotamian | D |
| **Wattle-and-daub house** | round/rectilinear, thatch | Celtic, Thracian | D/R |
| **Rectilinear stone/earth house** | block housing | Iberian, Italic | R |
| **Tower house** | multi-storey stone/mud brick | South-Arabian | R |
| **Terrace housing strip** | repetitive hill housing | hilltop archetype | R/S |

## 8. Commercial / maritime components

| Component | Variants | Tradition | Class |
| --- | --- | --- | --- |
| Market stalls | open booths, awning | any | R/S |
| *Taberna* / shop row | street-front workshops | Greek/Roman | R |
| Warehouse / horreum | storage hall | Punic, Greek, Roman | R |
| Quay | artificial shore edge | maritime | R |
| Mole / breakwater | harbour arm | maritime | R |
| **Cothon** | enclosed basin (later form — cautious) | Punic | R |
| Lighthouse | Pharos-type (rare) | Hellenistic | D/R |

## 9. Agricultural components

| Component | Variants | Tradition | Class |
| --- | --- | --- | --- |
| Field system | rectilinear/irregular plots | any | S |
| Orchard / grove | tree rows | Mediterranean | R/S |
| Terrace | hillside terracing | hilltop archetype | R |
| Threshing floor | rural work surface | Mediterranean | R |
| Irrigation works | basin canal · **qanat** · dam | Egyptian/Iranian/South-Arabian | R |
| Farmstead | small rural cluster (no *villa* proper yet) | Italic | R |

## 10. Infrastructural / monumental components

| Component | Variants | Tradition | Class |
| --- | --- | --- | --- |
| Street pattern | grid · organic · terraced | planned vs organic | D/R |
| Paved road | civic paving / via | Roman/Greek | D/R |
| Bridge | timber (Pons Sublicius-type) · stone | Roman | D/R |
| Drain / sewer | Cloaca-type | Roman, Greek | R |
| Aqueduct | **underground channel; no arcades at 278** | Roman/Greek | D/R |
| Cistern / well / fountain | water storage | Punic, Greek, South-Arabian | R |
| Palace / royal quarter | residence + administration | Hellenistic, Punic, Mauryan | D/R |
| Dynastic monument | royal emblems, tombs (elite) | Hellenistic, Thracian | R |

## 11. Combination rules (few components → many settlements)

A settlement's visual identity is assembled as:

```
base(environment archetype)
  + fortification(set by level)
  + civic[0..n](by level)
  + religious[0..n](by culture + level)
  + residential(set by culture × environment × density)
  + commercial/maritime(only if eligible + level)
  + agricultural(surrounding, by environment)
  + condition overlay(active/damaged/ruined/under-construction)
  + provenance layer(original tradition + later additions)
```

Worked diversity example (same Greek culture, three different results):
- **Coastal planned colony**: grid streets + ashlar/mole harbour + peripteral
  temple + pastas houses + warehouses.
- **Old inland *polis***: organic streets + acropolis + temple + theatre +
  courtyard houses.
- **Hilltop Greek town**: terracing + circuit wall + smaller temple + terrace
  housing.

And the **same environment, different culture**: a coastal site renders as a
Greek colony (grid/stoa/peripteral temple) or a Punic city (cothon/tophet/
cistern houses) or a Hellenistic royal port (grid/palace/Pharos).

## 12. Mapping to the current prototype

| Prototype archetype (`map/architectural-modules.js`) | Catalog family | Next variants to add |
| --- | --- | --- |
| Civic hall | civic | council hall (Curia/bouleuterion), stoa |
| Culture-specific sanctuary | religious | Italic podium vs Greek peripteral vs tophet |
| Market stalls | commercial | taberna row, warehouse |
| Orchard | agricultural | field, terrace, irrigation |
| Maritime storehouse | commercial/maritime | quay, mole |
| Training yard | military | wall/gate/tower segments (level-driven) |

The prototype's `settlement-development.ts` selector and stable category slots
already implement the seam; the catalog is the **content** that fills it.

## 13. Evidence summary

- **Directly supported families:** Greek orders and grid, Italic/Etruscan podium
  temple, polygonal walls, Punic tophet, Egyptian pylon, flat-roof mud-brick
  housing, atrium/courtyard house types.
- **Reconstructed:** complete street networks, harbour works detail, Roman atrium
  interiors, Punic cothon layout, palace interiors.
- **Speculative:** colours, thatch appearance, field/street furniture, timber
  superstructures.
- Full per-component evidence class and anachronism guards live in the
  [evidence and anachronism register](settlement-architecture-evidence-and-anachronism-register.md).

> This is a **catalog design**. It finalizes no schema and authorises no mass
> generation; it exists so development-driven settlement art can be built
> **reusably** and **honestly**. AD-33 and ADR-0019 remain OPEN.
