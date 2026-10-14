# R-16 settlement scale and regional distribution (278 BCE)

**Status: Proposal (2026-10-14), part of R-16.** Product direction: the
start-world targets **approximately 700 historically important settlements**
across the full 278 BCE campaign envelope, rather than the 1,300+ settlements of
the engine-capped references. This is a **quality and historical-significance
target, not a mandatory exact count**: no settlement is invented and no
unsupported location is assigned merely to reach the number. The selection is
**open** — see §9.

Related: [`r16-candidate-entity-inventory.md`](r16-candidate-entity-inventory.md)
(the *who* these settlements sit under), [`../vs5/world-scope-and-settlement-atlas.md`](../vs5/world-scope-and-settlement-atlas.md)
(the atlas schema, tiers and world envelope), [`r16-comparative-strategy-game-coverage.md`](r16-comparative-strategy-game-coverage.md)
(why engine-capped densities are not the target), [`../architecture/geography-integration-requirements.md`](../architecture/geography-integration-requirements.md)
(identity vs. ownership vs. presentation), and
[`r16-world-political-institutions-program.md`](r16-world-political-institutions-program.md)
(method and confidence labels).

## 1. What this document is and is not

**Is:** a **selection policy, a role taxonomy, a confidence discipline, and a
regional distribution envelope** for the ~700 managed settlements — the shape of
the settlement layer, so that research (R-16 / R-7) and the geography track can
target it without over- or under-building any one region.

**Is not:** a list of 700 named sites (that is the atlas-research build-out, not
this document); a border map; a population/economy model; a renderer decision;
and **not** a closure of **AD-33** (which stays OPEN, §9).

This document **does not modify the current geographic expansion priority.** It
describes the destination distribution, not a re-ordering of the build sequence.

## 2. Reading rules and confidence

- **Discovery references are not authorities.** Game factions, region names and
  borders only *find* candidates; they never enter the start-world
  (`r16-candidate-entity-inventory.md`).
- **Confidence labels** (matching the atlas schema): **Attested** (high) ·
  **Probable** (medium) · **Uncertain** (low). A settlement's *presence* and its
  *identity/location* are separate claims: a well-attested city may still have an
  imprecise 278 BCE extent, and an uncertain name may sit on an attested site.
- **Evidence-first.** A site enters the managed set only with independent
  evidence (gazetteer record such as Pleiades, archaeological/epigraphic record,
  or a primary literary/administrative source). Absence of evidence is recorded
  as *uncertain*, never promoted to fact.
- **Roles, not sizes.** Category (port, fortress, political centre…) is distinct
  from size and from tier; a village is not permanently small (`world-scope`
  §"Settlement atlas schema and tier policy").

## 3. Managed settlements vs. supporting sites

The ~700 figure counts **managed settlements** — places with their own canonical
identity, a role, a tier and (later) directly managed local systems.

**Supporting sites are not separately managed settlements.** Smaller villages,
farms, estates, mines, quarries, salt-works, rural sanctuaries, road stations and
similar are represented through **supporting geographic and economic systems**:
terrain/feature attributes, resource and production attributes, and aggregate
economy/population records (E12, ADR-0017 cohorts) that *reference* nearby
managed settlements and locations. They may gain identity later if a decision
justifies promotion, but they are **not** instantiated as independent managed
settlements by default. This is a deliberate scalability boundary, not a claim
that such places were unimportant.

## 4. Selection criteria (priority order)

When more candidates exist than the envelope allows, rank by:

1. **Political / administrative centrality** — capitals, royal and satrapal
   seats, league and federal centres, seats of assemblies or councils.
2. **Strategic military value** — fortresses, garrison towns, passes, frontier
   strongholds, naval bases.
3. **Maritime and river-port importance** — ports, emporia, river crossings that
   carry trade or fleets.
4. **Regional economic hub** — major market, mining, agricultural or caravan
   centres of supra-local reach.
5. **Cultural / religious significance** — oracular and federal sanctuaries,
   major cult centres (only when they were also settlements or political nodes).
6. **Attestation strength** — prefer Attested over Probable over Uncertain at the
   margin.

Where a region is under-attested at 278 BCE (e.g. inner Germania, Britain), the
envelope is **filled honestly with fewer sites and an explicit uncertainty note**,
not padded.

## 5. Role taxonomy

One primary role per settlement (secondary roles permitted):

| Role | Meaning (278 BCE sense) |
| --- | --- |
| **Capital / royal seat** | Seat of a monarch, court or imperial administration |
| **Political centre** | Seat of a council, league, assembly or civic government |
| **Regional hub** | Administrative/commercial centre of a district or people |
| **Port / emporion** | Maritime or river-port settlement with trade/transport function |
| **Fortress / stronghold** | Primarily military settlement, garrison or frontier post |
| **Sanctuary town** | Settlement whose significance is primarily cultic/federal |
| **Town / polis / civitas** | Ordinary self-governing or dependent urban community |

These map onto the atlas `category`/`suggestedTier` fields without redefining
them (tier is a research seed, never an identity property).

## 6. Regional distribution envelope

The envelope is expressed as **low / mid / high** per region. **The sum of mid
values is ≈ 690–700**, which is the working interpretation of "approximately
700"; the overall span (≈ 610–805) is the honest uncertainty band. Counts are
**planning targets, not quotas** — a region may land anywhere in its band as
evidence dictates, and the total may drift within the band without changing the
policy.

| # | Region | Inventory § | Low | Mid | High | Evidence basis | Confidence mix |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Italy, Sicily & the islands (incl. Cisalpine Gaul) | §1 | 92 | 100 | 110 | Rich: literary, epigraphic, archaeology, gazetteer | Mostly Attested |
| 2 | Iberia | §2 | 34 | 38 | 44 | Punic colonies attested; interior peoples later-attested | Mixed; interior Uncertain |
| 3 | Transalpine Gaul | §3 | 35 | 40 | 46 | Greek colonies attested; Gallic *civitates* mostly later names | Mixed |
| 4 | Britain & Ireland | §5 | 5 | 8 | 12 | Near-silent after Pytheas (~325) | Largely Uncertain |
| 5 | Germania, Alps & inner Europe | §4 | 8 | 12 | 18 | Celtic centres attested; Germania thin at 278 | Largely Uncertain |
| 6 | Balkans & Thrace (incl. Illyria, Dacia/Getae) | §7 | 46 | 52 | 60 | Greek colonies, Thracian/Illyrian centres, Celtic influx | Mixed |
| 7 | Greece, the Aegean & Crete | §7 | 84 | 92 | 102 | Very rich: dense *poleis*, leagues, inscriptions | Predominantly Attested |
| 8 | Anatolia & the Black Sea | §8 | 72 | 80 | 90 | Rich Greek coast; interior tribal thinner | Mixed |
| 9 | Levant & Syria (Phoenicia, Judaea, Nabataean fringe) | §9 | 36 | 40 | 46 | Rich: Phoenician cities, Yehud, caravan centres | Mostly Attested |
| 10 | Mesopotamia & Babylonia | §9 | 27 | 31 | 36 | Royal/royal-city centres, later-context cities | Mixed |
| 11 | Iran & the Iranian plateau | §9 | 32 | 36 | 42 | Seleucid satrapal seats; sub-kingdoms | Mixed |
| 12 | Central Asia (Bactria, Sogdiana, Margiana, Chorasmia) | §11 | 14 | 17 | 21 | Seleucid east; **not** later Greco-Bactrian kingdom | Mixed |
| 13 | NW India / Maurya frontier (Indus, Gandhara) | §11 | 14 | 17 | 21 | Mauryan administration; Ashokan-era names later | Mixed |
| 14 | North Africa (Punic Africa, Numidia, Tripolitania) | §6 | 36 | 40 | 46 | Rich Punic/Numidian record | Mostly Attested |
| 15 | Cyrenaica | §6 | 7 | 9 | 12 | Greek Cyrenaic cities attested | Attested |
| 16 | Egypt & the western oases | §10 | 27 | 31 | 36 | Rich: Nile towns, Delta, temple centres, oases | Predominantly Attested |
| 17 | Arabia (N Arabia, South-Arabian kingdoms, Gulf) | §9 | 20 | 24 | 29 | South-Arabian kingdoms, Nabataea, Gerrha/Dilmun | Mixed |
| 18 | Kush, Meroe & Nubia | §6 | 6 | 8 | 11 | Established Nubian kingdom | Likely/Attested |
| 19 | Caucasus, Bosporan kingdom & the Crimea | §8/§11 | 15 | 18 | 23 | Greek colonies + local kingdoms | Mixed |
| | **Total** | | **610** | **693** | **805** | | |

**Distribution logic.** Density tracks 278 BCE urbanisation and record quality:
the Greek *polis* world (#7), Italy/Sicily (#1) and the Anatolian coast (#8)
carry the greatest weight because they genuinely were the densest settlement
landscapes; under-attested regions (#4, #5) are deliberately small. No region is
sized to match a game map, and the western/eastern edges of the envelope are not
padded toward the box (see `world-scope` on the coverage mask).

## 7. Confidence discipline for the managed set

- Every managed settlement carries an explicit **presence** and **location**
  confidence and a source (`sources`, `discoveryReference`, `attribution` per the
  atlas schema).
- **Unlocated** sites are retained with null coordinates and kept out of the
  active renderer until located (existing atlas rule).
- A **settlement identity is never reused** for a different foundation, and a
  settled location's identity is separate from any settlement identity that
  historically replaced it (e.g. Sybaris/Thurii/Copia handling in `world-scope`).
- Aggregate confidence by region is reported so a reader can see where the ~700
  figure is well-evidenced and where it is necessarily thinner.

## 8. Dynamics: settlement existence and importance over time

The design must preserve the possibility of settlements being **founded,
abandoned, destroyed, expanded, or changing importance** over campaign time.
Therefore:

- **Identity persists independently of state.** A settlement's canonical ID does
  not carry its current existence, tier, role, owner or population.
- **Mutable campaign classification** references the settlement ID and may change
  tier/role/existence as history unfolds — it must **not** regenerate IDs, edit
  research evidence, or assume population thresholds (`world-scope` §"Settlement
  atlas schema and tier policy").
- **Founding, abandonment, destruction and importance shifts** are future
  simulation actions; an **ended identity remains referenceable** (never deleted
  and reused).
- **Location continuity is separate from settlement continuity**: a new
  foundation at an old site reconciles separately and preserves original
  published IDs.

This aligns with the atlas lifecycle, ADR-0017 (aggregate population/cohorts) and
the identity/ownership split in the geography contract.

## 9. AD-33 status — remains OPEN

**AD-33 (settlement granularity and campaign-world scale) stays OPEN.** This
document records the **product direction of ~700 managed settlements** as
**working evidence** for AD-33; it does **not** decide tiers, the exact density,
or the geography/continuous-vs-discrete relationship. Still open under AD-33:

- final settlement tier definitions and how many tiers exist;
- whether any supporting sites promote to managed settlements, and the threshold;
- the continuous-geography ↔ discrete-settlement relationship and content cost;
- the authoritative count and per-region allocation after evidence build-out.

## 10. Evidence sources and method (pointers)

- **Gazetteer:** Pleiades records (CC BY 3.0, contributors retained) and the
  Pleiades GIS archive for homonym disambiguation (`world-scope` §"Research
  method and RIS rights").
- **Independent archaeology/epigraphy/literature** where available, with explicit
  source and confidence.
- **Licensing caution:** public mod datasets are leads only, never reuse grants
  (`world-scope`; R-6/R-7).
- **No Rome II/DeI keys, borders or names** may enter domain data.

## 11. Open questions / needs-research

- **Per-settlement 278 BCE attestation and coordinates** for the whole envelope —
  the large, region-by-region build-out sitting under R-16 with R-7 datasets.
- **Under-attested regions** (#4 Britain/Ireland, #5 inner Germania) need an
  explicit "representative-pattern only" treatment rather than invented sites.
- **Regional confidence summary** to be produced alongside the build-out so the
  ~700 target's evidence quality is auditable.
- **Promotion policy** for supporting sites → managed settlements (belongs to
  AD-33).

> This proposal fixes a **destination and a discipline**, not a roster. It exists
> so the settlement layer is built to a defensible scale and evidence standard,
> and so the ~700 target never becomes a licence to invent sites.
