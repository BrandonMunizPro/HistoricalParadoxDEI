# R-16 world political institutions program (278 BCE)

**Status: Proposal (2026-10-14).** This expands **R-16** from three polities into
a **comprehensive world political-institutions research program** covering the
whole intended campaign map (a scope comparable to *Total War: Rome II*'s grand
campaign but denser). It authors **no game content**, implements **no code**, and
**closes no decision**. AD-25, AD-26, AD-27 stay **OPEN**.

Related: [`../architecture/start-world-research-plan.md`](../architecture/start-world-research-plan.md)
(the parent plan), [`r16-candidate-entity-inventory.md`](r16-candidate-entity-inventory.md),
[`r16-regional-coverage-matrix.md`](r16-regional-coverage-matrix.md),
[`r16-institutional-taxonomy.md`](r16-institutional-taxonomy.md),
[`political-institution-research-template.md`](political-institution-research-template.md),
[`r16-model-challenges.md`](r16-model-challenges.md).

## 1. What changed and why

The first R-16 pass researched the three polities most load-bearing for AD-25
(Rome, Carthage, Ptolemaic Egypt). That is necessary but not sufficient: the
campaign is to cover roughly the geographic scope of *Rome II*'s grand campaign,
which contains **~117 factions** of which only a handful are playable. The
political architecture (AD-25) must be able to represent **all** of them — but
with **one flexible engine of institutions, not one engine per culture**.

The objective, stated plainly:

> **Not 100 separate government engines. One flexible political architecture,
> capable of representing many historically distinct institutions.**

To reach that, the research must first answer a *discovery* question (what
entities are on the map?), then a *verification* question (what was each entity
**actually** in 278 BCE?), then a *modelling* question (what institution
primitives does each need?). This program sequences those steps.

## 2. Discovery references (discovery only — never canon)

Two external references define the **intended map's entity set for discovery**.
They are **not** historical authorities and their names, territories and
government types must **not** be copied into the start-world.

| Reference | What it gives us | Provenance / caveat |
| --- | --- | --- |
| **Total War: Rome II** grand campaign | The ~117-faction roster and the map's **geographic extent** (Lusitania to Bactria; Caledonia to Kush/Aksum) with ~57 provinces / ~173 regions | A **game**, starting **272 BCE**, whose faction names, borders and start-positions are often **later than 278**, invented, or anachronistic; some are 1st-c. BCE/CE ethnonyms |
| **Divide et Impera (DeI)** | A curated **45 "featured factions"** list grouping the majors by culture (Successor Kingdoms, Greek cities & colonies, Eastern, Gallic/Germanic, Illyrian/Dacian/Thracian, Iberian, British, African/Arabian, Nomadic) | A **mod**; its groupings are a useful *index*, not a historical classification |

**Rules of use.**
1. Use them to **enumerate candidates**, never to assert a political fact.
2. Never copy a game faction name into the start-world where it is anachronistic
   (e.g. a 1st-century ethnonym at 278).
3. Never copy the game's **borders**: *modern and game political borders are not
   evidence for the ancient world* (geography contract §1).
4. Every candidate from a game reference must be **independently verified** (§3).

## 3. Method: discovery → verification → classification → taxonomy

```
 (1) DISCOVERY          (2) VERIFICATION            (3) CLASSIFICATION          (4) TAXONOMY
 Rome II + DeI    ──▶   Is this entity real      ──▶  What KIND of entity     ──▶ Which institution
 faction roster         at 278 BCE, and what         was it at 278?              primitives does it
 (candidates)           was its status?               (A–F, §4)                   need? (taxonomy)
```

### 3.1 Entity-status classification (the verification output)

Every candidate is assigned exactly one **class**:

| Class | Meaning | Example (278 BCE) |
| --- | --- | --- |
| **A — Established independent state** | A sovereign polity at the date | Rome; Carthage; Ptolemaic Egypt; the Maurya Empire; Bosporan Kingdom |
| **B — Dependent / subordinate** | A territory, city or people under another polity's hegemony, tribute, garrison or alliance-network | The Etruscan and Samnite *socii* under Rome; Athenian *polis* under Antigonid garrison; Bactria and Parthia as **Seleucid satrapies** |
| **C — Confederation / league / federal state** | A multi-community league with federal organs | The Epirote League; the Aetolian League; the Boeotian *koinon* |
| **D — Community / people / *ethnos*** | A tribe, people or civic community not organised as a (recognised) sovereign state | Gallic and Iberian *gentes*; Ligurians; Libyan peoples; Arabian chiefdoms |
| **E — Later historical formation (anachronism)** | The entity (or its name) does **not** exist at 278 | The Parthian *Empire* (Arsacid, from ~247); the Greco-Bactrian *kingdom* (from ~256/250); **Aksum** (1st c. CE); **Cimbri/Lugii** as named Germanics; **Iceni/Caledones** as named Britons |
| **F — Uncertain / `needs-research`** | Status at 278 cannot be settled from existing evidence | Some British, Saharan and inner-Germanic names; the "Nova Carthago" construct |

Class **E** is the single most important output: it is how the research stops the
game's later formations from leaking into the start-world.

### 3.2 Verification status (separate from class)

Independently of class, each candidate carries a **confidence**:
**Verified** (sources support it at 278) · **Likely** (strong inference) ·
**Uncertain** (thin evidence) · **Anachronistic label** (the *name* is later, even
if a people existed).

## 4. The ten research areas (per entity)

Every sheet answers the same ten areas, so entities are directly comparable and
mappable to AD-25. They are the columns of the coverage matrix
([`r16-regional-coverage-matrix.md`](r16-regional-coverage-matrix.md)) and the sections of
the template ([`political-institution-research-template.md`](political-institution-research-template.md)):

1. **Government structure and political institutions**
2. **Offices, officeholders and appointments**
3. **Succession, elections and term limits**
4. **Legal authority and institutional checks**
5. **Informal influence and elite power**
6. **Military command and mobilisation**
7. **Treasury, taxation and spending authority**
8. **Citizenship, social classes and political participation**
9. **Relationships with subordinate communities**
10. **Historical evidence, uncertainty and anachronism risks**

Areas 8 and 9 are additions beyond the first template: without them the model
cannot express who counts as a *citizen* (and therefore who may hold office), nor
how a polity *contains* other communities (the Ptolemaic *poleis*, the Seleucid
satrapies, Rome's *socii*, Carthage's subject Libyans).

## 5. Priority tiers

Priority follows AD-25 dependency and start-world prominence, **not** the game's
playable/non-playable distinction.

| Tier | Entities | Rationale |
| --- | --- | --- |
| **T1 — Load-bearing for AD-25** | Rome ✔, Carthage ✔, Ptolemaic Egypt ✔, **Seleucid Empire**, **Macedon (Antigonid)**, **Epirus**, **Syracuse** | The four institutional archetypes (oligarchic republic, personal monarchy, federal league, Greek *polis*) plus the two named-crisis powers of 278. Rome/Carthage/Ptolemaic done; the other four have sheets (§8). |
| **T2 — Major powers / neighbouring empires** | Maurya Empire; Bosporan Kingdom; Bithynia; Pontus (in formation); Cappadocia; Armenia (Orontid); Atropatene; Pergamon (dynastic city); Rhodes; Sparta; Aetolian League; Achaean League (early); the Numidian kingdoms (Masaesyli/Massylii); Kush/Meroe; the South-Arabian kingdoms (Saba, Maʿīn, Qataban, Ḥaḍramawt); the Celtic peoples of Cisalpine Gaul and the Balkans (Insubres, Boii, Scordisci, Taurisci); the Galatians (arriving) | Establish independent states, leagues and major non-state peoples that frame the start-world's diplomacy. |
| **T3 — Region-completing (representative profiles)** | The remaining named tribes/peoples of Iberia, Gaul, Germania, Britain, Illyria, Thrace, Dacia, the steppe, Libya, Arabia and inner Anatolia | Not every people needs a bespoke institution set; each **region** needs *representative* profiles plus a documented **pattern** the flexible architecture can instantiate for the rest. |
| **T4 — Anachronism register** | Every class-E candidate | The explicit list of game entities that must **not** appear at 278, with the reason and the correct 278 reality. |

## 6. Coordination

| Document / track | How this program coordinates |
| --- | --- |
| **AD-25** (`political-office-and-government-architecture.md`) | Every sheet maps institutions to RoleDefinition / RoleHolding / derived Authority and files model challenges as **proposals** ([`r16-model-challenges.md`](r16-model-challenges.md)); this program never changes the architecture. |
| **AD-26** (`economic-authority-architecture.md`) | Each sheet's area 7 records revenue, treasury-holding institutions and who was authorised to spend — the evidence AD-26's spending-authority/schema needs, and R-15's per-polity input. |
| **AD-27** (`campaign-start-and-historical-timeline.md`) | Area 3 (succession/succession-durability) and area 9 (subordinate communities) feed the conditional-entry and divergence model; class-E entities are preconditions the timeline must respect. |
| **R-13 (start-world dataset)** | The **inventory** (§[`r16-candidate-entity-inventory.md`](r16-candidate-entity-inventory.md)) is the entity spine R-13 populates: each row becomes a polity/people/community entry with attested/reconstructed/needs-research labels. |
| **VS-5 geographic atlas** (`geography-integration-requirements.md`) | Regions group the inventory geographically; entity **identity** is never their **control** (identity/ownership split). The atlas supplies the *where*; this program supplies the *who governs how* — neither owns the other. |
| **R-15 / R-14** | Area 7 feeds R-15; the program does not touch R-14. |

## 7. Expandability (the program must stay open)

The map and the entity set will grow. The program is built so additions are cheap:

- **Inventory rows are additive.** A new candidate is a new row with a class and a
  confidence; nothing else changes.
- **Region groups are additive.** A new geographic group is a new section.
- **Sheets are versioned by date-of-record.** A second date (e.g. a later-era
  expansion) is a new sheet, never an edit to the 278 sheet.
- **The taxonomy is the stable interface.** New institutions are expressed as
  combinations of existing primitives where possible; a genuinely new primitive is
  a new *proposal to AD-25*, recorded, not silently patched.

## 8. Priority sheets produced

The T1 sheets, in addition to the three first-pass sheets:

- [`r16-seleucid-278bce.md`](r16-seleucid-278bce.md)
- [`r16-macedon-278bce.md`](r16-macedon-278bce.md)
- [`r16-epirus-278bce.md`](r16-epirus-278bce.md)
- [`r16-syracuse-278bce.md`](r16-syracuse-278bce.md)

## 9. Non-goals

- **No code.** No `src/` or `tests/` change.
- **No invented history.** Uncertainty is labelled; no unsupported detail is
  asserted as fact.
- **No premature closure.** No decision is closed by research; AD-25/26/27 stay open.
- **No one-engine-per-culture.** The program's whole point is the opposite.
- **No copying game names or borders** into the start-world.
- **No mass mapping.** T3 is representative profiles plus a pattern, not 100
  exhaustive sheets before the architecture is closed.
