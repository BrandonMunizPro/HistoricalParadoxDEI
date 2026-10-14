# Settlement architecture and visual identity (278 BCE)

**Status: Proposal (2026-10-14), part of R-16 (settlement sub-program).** The
historical foundation for **development-driven 3D settlements**: how plausible
278 BCE settlements should differ visually and structurally across cultures,
environments and levels of development. This is a **research matrix**, not a
schema and not art direction for a finished asset; it grounds the presentation
track ([ADR-0019](../adr/0019-presentation-boundary-and-visual-design-track.md))
and the architecture proposal
([`../architecture/settlement-visual-development-architecture.md`](../architecture/settlement-visual-development-architecture.md)).

Related: [`r16-rome-architecture-278bce.md`](r16-rome-architecture-278bce.md),
[`r16-greek-italic-punic-architecture-278bce.md`](r16-greek-italic-punic-architecture-278bce.md),
[`settlement-architecture-evidence-and-anachronism-register.md`](settlement-architecture-evidence-and-anachronism-register.md),
[`settlement-procedural-component-catalog.md`](settlement-procedural-component-catalog.md),
[`r16-settlement-scale-and-regional-distribution.md`](r16-settlement-scale-and-regional-distribution.md),
[`../presentation/artwork-production-roadmap.md`](../presentation/artwork-production-roadmap.md)
(§8 settlements parameterised by culture/period).

## 1. Method and how to read confidence

- **Discovery references are not authorities.** Game screenshots, mod assets and
  region names never define the 278 BCE look; they are leads only
  (`r16-candidate-entity-inventory.md`).
- **Architectural evidence classes** (used throughout, and in the separate
  evidence/anachronism register):
  - **[D] Directly supported** — surviving remains and/or secure dating place the
    form at or near 278 BCE.
  - **[R] Reconstructed** — the building *type* is known for the culture/period,
    but this settlement's specific form is inferred from later or analogous
    examples; plausible, not proven.
  - **[S] Speculative** — artistic plausibility with no direct evidence (colours,
    exact street widths, unexcavated sanctuaries).
- **Chronology discipline (area 5).** A structure supported in 278 BCE is
  distinguished from one introduced centuries later. **Do not put imperial-era
  Rome into Republican Rome**, and do not import Late Antique, medieval or
  Roman-imperial forms into any 278 BCE settlement (§8, register).
- **No invented motifs** (`presentation-requirements.md`): a visual convention
  becomes canonical only with grounding.
- **Colour and micro-detail are inherently reconstructed.** Roof colours, plaster
  hue and street furniture are usually **[S]** even when the building mass is
  **[D]**; the renderer must not present them as excavated fact.

## 2. Reference groups (assignment scope)

1. **Republican Rome and central Italian communities** — Latin, Etruscan and
   other Italic towns; Roman *coloniae*.
2. **Greek *poleis* and colonial settlements**, including **Neapolis**.
3. **Samnite and other Italic fortified hill settlements.**
4. **Carthaginian/Punic coastal settlements.**
5. **Hellenistic royal and administrative centres**, including **Alexandria**.
6. **Additional traditions only where evidence supports meaningful distinctions**:
   Etruscan, Egyptian (non-Alexandrian), Mesopotamian/Babylonian, Iranian,
   Gallic/Celtic, Iberian/Celtiberian, Thracian/Geto-Dacian, South-Arabian,
   Mauryan-eastern (§4; detail in the comparative sheets).

## 3. Cross-cultural visual-identity matrix

Legend: **D** directly supported · **R** reconstructed · **S** speculative.
"Character" is a design summary of the *composite* look, not a single source.

| Reference group | Plan character | Fortifications | Dominant civic/religious forms | Domestic forms | Materials & roofs | Distinguishing cues |
| --- | --- | --- | --- | --- | --- | --- |
| **Republican Rome** | Organic, multiple hills, few grid areas; Forum as civic core | Tuff **ashlar circuit** (Servian-type) [D]; river bridge [D] | Italic/Tuscan podium temples (deep porch, high base); Senate house; open Forum | **Atrium domus**, courtyard; no multistorey blocks [R] | Tuff, timber, mud brick, **terracotta tile** [D]; lime plaster [R] | Compact tuff architecture; temple podiums; absence of imperial monumentality |
| **Greek polis / colony** | **Hippodamian grid** in planned cities (Alexandria, Thurii, Neapolis) [D] | Stone/ashlar or mud-brick-on-stone walls, towers, often bent gateways [D] | Agora, **stoa**, theatre, bouleuterion, peripteral **Doric/Ionic** temples [D] | Courtyard/pastas houses; peristyle emerging [R] | Limestone/marble, terracotta tile, mud brick [D] | Colonnaded frames; ordered temples; grid streets; theatre on slope |
| **Samnite / Italic hill town** | Agglomerative, terraced, hilltop, rarely gridded [D] | **Polygonal/cyclopean masonry** walls, hillfort circuits [D] | Italic podium sanctuaries; open assembly areas [R] | Smaller clustered houses, terrain-following [R] | Rough stone, timber, tile/thatch [R] | Earth-toned hilltop silhouette; polygonal walls; terraces |
| **Carthaginian / Punic** | Harbour-led coastal layout; Byrsa acropolis at Carthage [R] | Massive ashlar walls (chronology cautious) [R] | Rectangular temples to Tanit/Baal Hammon; open-air **tophet** [D] | Courtyard houses with **cisterns** [D] | Sandstone, plaster, mud brick [R] | Artificial **cothon** harbours [R]; tophet stelae; maritime storefronts |
| **Hellenistic royal centre** | Large planned grid, processional axes (Alexandria Canopic Way) [D] | Strong enceinte, citadel, harbour fortification [R] | **Palace quarter**, Mouseion/library, monumental temples, Serapeum-type [D/R] | Peristyle houses for elite [R] | Marble, ashlar, terracotta; monumental scale [D] | Palace/citadel; lighthouse (Pharos, ~280 [D]); grid + canal |
| **Etruscan** | Tufa cities, sometimes gridded (Marzabotto) [D] | Tufa ashlar walls, arch gates [D] | Deep-porch Italic temples on podiums [D] | Atrium-like courtyard houses [R] | Tuff, terracotta revetment [D] | Tufa ashlar; arcuated gates; podium temples |
| **Egyptian (Ptolemaic)** | Nile-tied; temple towns + village clusters | Mud-brick enclosures; temple fortress-like precincts [R] | Monumental **pylon** temples, hypostyle halls (mostly built after 278 — see register) [D/R] | Mud-brick flat-roof houses | Mud brick, sandstone, plaster; **flat roofs** [D] | Pylons; hieroglyphic temple fronts; flat roofs; palm |
| **Mesopotamian / Babylonian** | City mounds; temples + palaces | Mud-brick walls | Mud-brick temples/palaces; ancient ziggurats | Courtyard mud-brick, flat roofs | Mud brick, glazed brick (earlier), bitumen [D] | Flat roofs; mud-brick mass; ziggurat ruins |
| **Iranian (Seleucid/sub-kingdom)** | Royal/administrative centres; terraced | Ashlar/mud-brick citadels | Audiences halls, fire-related cult, dynastic monuments [R] | Courtyard houses | Stone, mud brick; some tile | Achaemenid/Hellenistic fusion; columned halls |
| **Gallic / Celtic** | Open + hilltop (**oppida** mostly later — see register) | Timber/earth **ramparts**, ditches; *murus gallicus* is later [D/R] | Little monumental architecture; open sanctuaries | Round/rectilinear **wattle-and-daub** houses [D/R] | Timber, earth, thatch; no stone cities [D] | Earth-and-timber ramparts; thatch; organic layout |
| **Iberian / Celtiberian** | Hilltop **oppida**, some gridded | Stone/rubble walls, towers | Small temples; open cult areas [R] | Rectilinear stone/earth houses | Stone, mud brick, timber, tile/thatch | Hilltop stone towns; coherent blocks |
| **Thracian / Geto-Dacian** | Fortresses + open settlements | Stone/timber citadels, earthworks [R] | Thracian cult/royal centres; tombs (elite) [R] | Wattle-and-daub, some stone | Timber, stone, earth | Citadels; elite tombs; Hellenistic borrowings |
| **South-Arabian** | Oasis/incense-route towns | Stone/rubble walls, towers | Stone temples; dam works (Ma'rib) [D/R] | Multi-storey **mud-brick/stone tower houses** [R] | Stone, mud brick | Tower houses; irrigation/dam; desert oasis |
| **Mauryan (eastern edge)** | Palace/city centres; timber abundant | Earth/timber ramparts, moats | Timber/stone palace; **no Ashokan pillars at 278** (post-268) | Timber/bamboo, mud; baked brick | Timber, mud, baked brick, thatch | Timber architecture; no Ashokan/NBPW forms yet |

Confidence column is indicative; per-settlement confidence lives in the atlas.
The matrix deliberately shows **gradients, not one look per culture**.

## 4. Settlement morphology (research area 1)

Morphology is driven by **environment + tradition + development**, not culture
alone (the same Greek culture builds a gridded colonial port and an organic
older *polis*):

- **Street layouts.** Planned grids (Hippodamian) appear where a city is founded
  or refounded deliberately — Alexandria [D], Thurii [D], Neapolis [D],
  Marzabotto [D]; older and mountain towns are organic/agglomerative [D/R]. A
  grid is a **development signal**, not a culture label.
- **Fortifications.** Circuit type is a strong, readable identifier: tuff ashlar
  (Rome) [D]; polygonal/cyclopean (Samnite/Latin hills) [D]; mud-brick-on-stone
  (Greek Asia, Egypt) [D]; earth-and-timber (Celtic) [D/R]. Towers, bent gates
  and enceinte extensions are **upgrade stages** (§6).
- **Civic spaces.** Agora (Greek), Forum (Roman), assembly/citadel (Italic),
  palace court (Hellenistic, Punic Byrsa) — each maps to a civic category and a
  development level.
- **Harbours.** Natural bays, quays, moles and enclosed basins (Piraeus,
  Carthaginian **cothon** [R], Alexandrian Great Harbour [D/R]). Harbour works
  are high-cost, high-visibility **development**.
- **Sanctuaries.** From open precinct/altar to monumental temple complex; the
  **tophet** is a distinctive Punic form [D].
- **Residential districts.** Density and house type track development: clustered
  small houses → courtyard houses → peristyle/elite houses; **no Roman imperial
  multistorey *insulae*** at 278 (§8).
- **Agricultural surroundings.** Field systems, terraces, threshing floors,
  irrigation (Egyptian basin, Persian *qanat*, South-Arabian dams), orchards;
  these are **supporting landscape**, not necessarily managed settlements
  (`r16-settlement-scale-and-regional-distribution.md` §3).
- **Terrain adaptation.** Hilltop/terraced (Samnite, Iberian), coastal/flat
  (Greek, Punic, Hellenistic), riverine (Rome, Egyptian, Mesopotamian),
  oasis/desert (South-Arabian, Garamantian). Terrain adaptation is the primary
  environmental axis; see the component catalog §"terrain archetypes".

## 5. Building forms and materials (research area 2)

| Element | Republican Rome / Italy | Greek / Hellenistic | Punic | Egyptian / Mesopotamian |
| --- | --- | --- | --- | --- |
| **Roof** | Low-pitched gable, terracotta tile; thatch for poor [D/R] | Gable, terracotta tile [D] | Tile/flat, plastered [R] | **Flat mud roof** [D] |
| **Wall** | Tuff ashlar, mud brick, timber frame; **no concrete** [D] | Ashlar/mud brick; marble in Hellenistic [D] | Sandstone ashlar, plaster, mud brick [R] | Mud brick, sandstone, glazed brick [D] |
| **Temple** | Italic/Tuscan podium, deep porch, frontal [D] | Peripteral, Doric/Ionic/Corinthian [D] | Rectangular shrine, open tophet [D/R] | Pylon front, hypostyle hall (mostly post-278 [D/R]) |
| **House** | Atrium domus [R] | Courtyard/pastas, peristyle emerging [R] | Courtyard + cistern [D] | Courtyard, flat roof [D] |
| **Public building** | Senate house, basilica **not yet** (basilica is late 2nd c. BCE — see register) | Stoa, bouleuterion, theatre, gymnasium [D] | Harbour/shipping halls [R] | Palace, temple, granary [D] |
| **Market/workshop** | Open Forum, tabernae/booths [D/R] | Agora, workshops, stoa-shaded trade [D] | Emporion, warehouses [R] | Bazaar/courtyard trade [R] |
| **Defence** | Ashlar circuit, simple gates [D] | Towers, bent gates, artillery-ready [D] | Massive walls (chronology cautious) [R] | Mud-brick/stone walls [D] |

**Material chronology guard.** Roman **travertine** (from ~2nd c. BCE) and
**concrete / *opus caementicium*** (significant from ~2nd c. BCE) are **not**
used at 278; **marble** is a Hellenistic material, not a Republican-Roman norm.
See the register.

## 6. Development-driven visual evolution (research area 3)

The central question: *which investments plausibly create new visible buildings,
districts, infrastructure or expansions?* Proposed **development dimensions**
(a design model, not a schema), each with a visible ladder:

1. **Fortification** — none → circuit → towers/monumental gates → extended
   enceinte (new wall line, new quarter).
2. **Civic** — open assembly space → council building/senate house →
   monumental civic core (paving, porticoes, platform).
3. **Religious** — altar/precinct → temple → sanctuary complex/terraces.
4. **Residential density/quality** — few houses → more, denser → elite houses
   (peristyle/atrium) and richer facades.
5. **Commercial/maritime** — market → permanent market/warehouses → harbour
   works (quay, moles, cothon).
6. **Agricultural hinterland** — fields → irrigation/terraces → estate/landscape
   investment.
7. **Administrative status** — town/regional hub/capital: *status* drives
   monumental investment (a capital attracts palace/administrative buildings),
   but status itself is **political** state, not architecture.

Each ladder is **cumulative and visible**: an upgrade adds or replaces visible
mass; it does not silently recolor the settlement. Crucially, the **renderer
decides none of this** — it displays the simulated outcomes (§
[`../architecture/settlement-visual-development-architecture.md`](../architecture/settlement-visual-development-architecture.md)).

## 7. Cultural continuity under conquest (research area 4)

**Conquest must not instantly replace architecture with the conqueror's
culture.** Rules:

- **Built stock persists.** Existing buildings remain until deliberately rebuilt,
  damaged or destroyed. Ownership/control changes are political state
  ([geography contract](../architecture/geography-integration-requirements.md) §3).
- **New construction follows the ruling culture over time**, often with
  **syncretism** (e.g., a Roman-held Greek city keeps its Greek fabric and adds
  Roman forms gradually; Ptolemaic Egypt is Greek-and-Egyptian).
- **Architectural inheritance is a layered property.** A settlement carries its
  **original architectural tradition** plus **additions** with their own cultural
  provenance; presentation renders the layers, not a single skin swap.
- **Destruction vs. reuse vs. abandonment** are distinct outcomes: destruction
  leaves ruins/rubble; reuse keeps standing fabric; abandonment leaves unmaintained
  structures decaying. An **ended identity remains referenceable** (settlement
  lifecycle, `r16-settlement-scale-and-regional-distribution.md` §8).

## 8. Historical chronology and anachronism discipline (research area 5)

Structures/technologies **not** to be shown in 278 BCE settlements (full register
in [`settlement-architecture-evidence-and-anachronism-register.md`](settlement-architecture-evidence-and-anachronism-register.md)):

- **Roman:** Imperial fora; Colosseum/Flavian amphitheatre; Aurelian Walls;
  imperial baths; **concrete**-based architecture; **travertine** as a standard
  material; multistorey **insulae**; **basilica**; triumphal arches; widespread
  monumental marble; Pantheon; imperial palaces.
- **Greek/Hellenistic:** the **Great Altar of Pergamon** and Pergamene
  gigantomachy monuments (~2nd c. BCE); Roman-imperial temples; well-developed
  colonnaded *streets* (a later Hellenistic-Roman development) as a default.
- **Punic:** the fully described triple land wall and the canonical **cothon**
  form are later-3rd/2nd c. descriptions — use with explicit **[R]** caution.
- **Egyptian:** the great Ptolemaic temple complexes of Edfu/Dendera in their
  completed form (construction largely **after 278**); Roman-period and Late
  Antique additions.
- **Eastern/Mauryan:** **Ashokan pillars/edicts** (from ~268 BCE); monumental
  Sanchi-type stupas; Northern Black Polished Ware.
- **General:** medieval castles/crenellations/machicolations, gunpowder bastions,
  Gothic/Romanesque churches, and modern city plans.

**Positive guardrails:** Republican Rome is tuff-and-timber, not marble; the
Punic and Greek worlds carry the monumental stone tradition at 278; the most
advanced large-scale planning visible at 278 is the **Hellenistic planned city**
(Alexandria), not imperial Rome.

## 9. Architectural evidence and uncertainty (research area 6)

- Every element in the matrix and the reference sheets carries **[D]/[R]/[S]**.
- **What is directly supported** tends to be: wall construction and city plans
  (excavated), temple orders and column forms (standing remains), harbour
  infrastructure (archaeological), and Egyptian pylons.
- **What is reconstructed** tends to be: house interiors, complete street
  networks, sanctuaries unexcavated, and chronological phases with contested
  dating (e.g., Norba's walls — caution already recorded in VS-5).
- **What is speculative**: colour, plaster, roofing detail, timber
  superstructures, street furniture, and any unexcavated building.
- **Dating caution.** A surviving wall or gate does not date every phase to 278;
  multi-phase sites must not be flattened into one date (the VS-5 Norba note is
  the model).

## 10. Procedural asset suitability (research area 7)

Reusable components that support many distinct settlements without hand-modelling
every city (full catalog in
[`settlement-procedural-component-catalog.md`](settlement-procedural-component-catalog.md)):

- Components vary along **culture × environment × development level**, so a few
  component families recombine into hundreds of plausible settlements.
- High-value reusable families: **fortification segments and gates/towers**,
  **temple types** (Italic podium, Greek peripteral, Punic shrine/tophet, Egyptian
  pylon), **civic shells** (stoa/portico, senate/council hall, open agora/forum),
  **house archetypes** (courtyard, atrium, terraced, flat-roof, wattle-and-daub,
  tower house), **harbour works** (quay, mole, warehouse), **agricultural
  patterns** (orchard, terrace, field, irrigation), and **terrain-adaptation
  bases** (hilltop terrace, coastal flat, riverine, oasis).
- Components compose through the existing prototype seam
  (`map/architectural-modules.js`; `src/presentation/settlement-development.ts`)
  and must remain **culled, instanced and presentation-only**.

## 11. Comparison with Medieval Kingdoms 1212 and Divide et Impera (research area 8)

**Leads only, not authorities; no proprietary assets, maps or code are copied.**

| Concept | Divide et Impera (Rome II) | Medieval Kingdoms 1212 (Attila) | HistoricalGame direction |
| --- | --- | --- | --- |
| Visual result | Hand-authored/derived **3D city models** + textures per culture | Settlement **building chains** with era/stage growth | **Simulation-driven procedural selection** from a culture/period asset catalog |
| Growth driver | Building chain upgrades; some models cosmetic | Building chain slots + tiers; population/development gates | **Authoritative simulated development state**; renderer displays outcomes only |
| Culture change | Faction-specific models; conquest re-skins via ownership | Culture-specific chains | **Architectural inheritance**: existing fabric persists; new additions follow ruler, with syncretism |
| Granularity | One main settlement per region | One settlement per region (single-region provinces) | ~700 settlements, tiers 1–4; supporting sites as landscape (AD-33 OPEN) |
| Verification status | **[D] documented** mod concept; exact mechanics vary and must be verified per feature | **[D] documented** open-alpha mechanics; treat as unverified until evidenced | Grounded in the historical matrix here, not in either mod |

Neither reference models **institutional** development or **information
transmission**; HistoricalGame's differentiator is that the *look* is a pure
projection of simulated investment and history, not a separate building minigame.
Any claim about either mod's mechanics is **unverified** until independently
confirmed (per the comparative-study policy).

## 12. Open questions

- Per-settlement morphological evidence for the ~700 set (a large R-16/R-7
  build-out).
- How much visual variation is scientifically defensible within a culture before
  it becomes invented motif.
- The precise Ptolemaic temple chronology around 278 (Edfu/Dendera phases).
- Carthaginian fortification/harbour chronology at 278 (later descriptions).
- Whether non-monumental traditions (Celtic, Iberian, Mauryan) should use a
  documented "representative-pattern" treatment rather than bespoke art
  (`r16-regional-coverage-matrix.md` T3).

> This matrix fixes **ranges of defensible appearance and the chronology
> discipline**, not a roster, not a schema, and not a renderer decision. AD-33
> and ADR-0019 remain OPEN.
