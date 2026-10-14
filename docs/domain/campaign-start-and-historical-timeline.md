# Campaign start and historical timeline

**Status: Proposal (2026-10-14).** This document proposes a concrete campaign
start, a historical-character entrance policy and an alternate-history
contingency model. It does **not** approve the start date, does **not** implement
any system, and does **not** narrow any approved ADR. Where it touches approved
architecture it is explicitly a consumer of that architecture, not an amendment
to it.

> **Direction approved 2026-10-14; decisions remain open.** The conditional-entry
> direction is approved, with refinements incorporated below: a historical birth
> **no longer requires the original polity to survive** if the family and other
> plausible conditions hold (§4); behaviour **after major divergence** is defined
> (§4.1); and **historical death dates never automatically override simulation
> outcomes** (§5). **AD-27 is not closed.**

Authority follows `docs/README.md`: approved ADRs override this document; this
document overrides nothing. The original start-date intent is recorded in
`BLUEPRINT.md` §1.2 ("Exact historical start date" was deliberately left open);
this proposal is the first attempt to close it and must be approved before it is
treated as decided.

## 1. Proposed start: 278 BCE

**Proposal.** The grand campaign starts at the beginning of **278 BCE**, in the
middle of the Pyrrhic War (281–275 BCE), with a scope comparable to a Total
War: Rome II grand campaign but a deeper political and character simulation.

**Why this year is proposed**

- It is a genuine multi-polar crisis: Rome versus Pyrrhus and Tarentum in Italy,
  Pyrrhus about to leave for Sicily, Carthage holding western Sicily, the Greek
  east divided between the Ptolemies, Seleukids, Antigonids and Epirus.
- It puts several historically documented named characters on the board at
  once (consul Fabricius, Pyrrhus, Ptolemy II, Antigonus II) while leaving the
  most famous generation (Hannibal, Scipio) **unborn** — exactly the condition
  the birth/lineage system must handle.
- It is close to, but not identical with, generations that the DeI-era content
  already evokes, so artwork and content research can be reused with period
  correction rather than rebuilt.

**This is a Proposal, not a decision.** Open decision **AD-27** (historical
timeline content model) and research **R-13** (278 BCE start-world data) must be
resolved before start-world content is authored.

## 2. Verified starting facts (with confidence)

The rows below are the facts a start-world needs. **Confidence is stated
because this design depends on it**: a fact marked *uncertain* must not be
hard-coded as canon without a research pass, and must not be silently invented.

| Fact at 278 BCE | Standard reference | Confidence |
| --- | --- | --- |
| Consuls of 278 BCE: **Gaius Fabricius C. f. Luscinus** (2nd consulship) and **Quintus Aemilius Cn. f. Papus** (2nd consulship) | Fasti / Broughton, *Magistrates of the Roman Republic*; Attalus consular index | High |
| Fabricius campaigned in southern Italy; triumph over Lucanians, Bruttians, Tarentines and Samnites dated in the triumphal Fasti to **13 December** | Triumphal Fasti; Attalus triumph index | High for the consulship; the campaign narrative is thin |
| Rome and Carthage renewed their treaty (the "fourth" renewal in the traditional count) | Livy *Per.* 13.10; Polybius 3.22–25 | High that a renewal is reported; **the numbering and date scheme are disputed** |
| Pyrrhus was in Italy during 278 and **departed for Sicily within the year** | Plutarch *Pyrrhus*; Diodorus | High that he went; **arrival timing is uncertain** (early 278 vs. late autumn 278) |
| Pyrrhus returned to Italy in 276, was checked at Beneventum in 275, withdrew to Epirus, and died at Argos in 272; **Tarentum fell to Rome in 272** | Plutarch; Livy *Per.*; Diodorus | High for the sequence; individual years have small competing variations |
| Gallic war around **Arretium / Ariminum**: a Roman commander (traditionally L. Caecilius Metellus Denter) was defeated and killed, and the Senones were expelled / Sena Gallica settled | Polybius 2.19–20; modern scholarship | **Uncertain: 284 vs. 283 BCE** (Cambridge Core discussion of the dating) |
| Mamertines (Campanian mercenaries of Agathocles) hold **Messana** | Polybius 1.7–8; Diodorus | Medium; seizure dated to 289/288 or 282 depending on source |
| Ptolemy **I Soter is dead** (d. 283/282); **Ptolemy II Philadelphus** is sole king | Ptolemaic chronology | High |
| Ptolemy II born **308 BCE**, reigned **285–246 BCE** | Standard Ptolemaic chronology | High |
| **Antiochus I Soter** rules the Seleukid realm (until 261) | Standard Seleukid chronology | High |
| **Antigonus II Gonatas** contests and consolidates Macedon in this decade | Standard Antigonid chronology | High that he rules by ~276/272; **the exact consolidation year is uncertain** |
| **Magas** rules Cyrene (from ~276) | Standard chronology | Medium |
| **Hiero II** is a rising Syracusan officer/commander | Polybius 1.8; Diodorus | **Uncertain before ~275/274**; kingship by ~269/268 |

For any *unnamed* office-holder (e.g. individual Carthaginian suffetes in 278,
or minor magistrates) the sources are silent. Those seats are **content gaps**,
not licence to invent named historical people.

## 3. Characters: three entrance classes

A well-known historical person is not "created" by the sim at a chosen moment;
they are placed into the world by a rule that respects when they can plausibly
have existed and what family they belong to.

### 3.1 Alive at the start (authored, present)

Documented people whose existence at 278 BCE is safe to author: Pyrrhus of
Epirus; C. Fabricius Luscinus; Q. Aemilius Papus; M'. Curius Dentatus; Ptolemy II
Philadelphus; Arsinoe II; Antiochus I Soter; Antigonus II Gonatas; Magas of
Cyrene; the Pontifical/Augural college leadership at the time (to be identified,
**research**).

These are authored **start-world entries**: a canonical identity, a house/kin
link, an approximate age (usually year-precision, sometimes only a range), and a
source note. Where a birth year is only known as a range, the age is authored as
a **range**, not a point.

### 3.2 Unborn at the start (scheduled, conditional)

People who must not exist yet but who may exist later: **Hannibal** (born
~247 BCE, and note that **no ancient source states his birth year directly** —
it is inferred from his reported age at Zama); **Scipio Africanus** (236 BCE);
Cato the Elder (234); Masinissa (~240); Hasdrubal and Mago Barca (~245/~243,
uncertain); Hamilcar Barca (**uncertain — see §3.3**); Quintus Fabius Maximus
Verrucosus (**~275, i.e. possibly a small child at the start — a deliberate
edge case**).

These are **scheduled historical entries**: a due-time at or after the earliest
plausible birth, whose *outcome* is not precomputed. When the scheduled trigger
executes it **reads authoritative state** (standing constraint 11, ADR-0003 A5)
and decides whether the historical entry can still happen.

### 3.3 Uncertain existence at the start (gate on research)

Some people's presence at 278 cannot be settled from the sources. **Hamilcar
Barca is the canonical example**: his birth is not recorded, and modern guesses
range from ~275 to much earlier; a ~275 birth sits awkwardly with his
commanding Carthage in Sicily from 247 and having marriageable daughters by
then, while a much earlier birth is unproven. Such a person is **held in a
`needs-research` class** and is **not** placed at the start until R-13 answers.
The engine models the *policy*; the content fixes the *value*.

## 4. The birth-and-lineage rule (conditional historical entries)

**Proposal.** Historical lineage is authored as **conditional historical
entries**, not as precomputed outcomes:

- Each entry declares: a stable `sourceKey`, the historical person's identifying
  data, an expected birth window (earliest/latest plausible SimTime), the
  authors' *expected* linked relatives, and an **explicit precondition** list.
- At the earliest plausible SimTime the scheduled trigger executes and evaluates
  preconditions against **authoritative state** at that moment:
  - both necessary parents (or the single necessary parent) exist, are alive,
    are the right people, and — where the model requires it — are linked as
    spouses/partners;
  - the relevant **house/lineage still exists** and has not been extincted;
  - **the original polity need not still exist** (refinement 2026-10-14): a
    person may be born into a surviving family even if their polity was
    conquered, annexed or destroyed, provided the **family and the other
    plausible conditions** hold. Affiliation at birth derives from the family's
    circumstances at that moment, not from the survival of the historical state.
    A person is still never "born into" a state that no longer exists, but they
    may be born into a subjugated, exiled or successor community;
  - no prior **divergence flag** blocks the entry (see §4.1 and §5).
- If the preconditions hold, the entry instantiates the historical person
  deterministically and records a **proposed** `character.born`-class event.
- If they fail, the entry is **suppressed**, and a **proposed**
  `timeline.lineage_suppressed` (name illustrative) event is appended so the
  divergence is explainable in the ledger and never looks like a bug.
- **Determinism.** A procedurally instantiated character derives its canonical
  identity by UUIDv5 from a stable name input (ADR-0009), exactly as authored
  identities do, so identical run inputs reproduce identical IDs.

**No blind generation.** The historical timeline never fabricates a descendant
of a family that has ceased to exist, never re-spawns an extinct line, and never
overrides a house's own succession rules. If a house wants an heir when none is
authorable, that is **the house/succession system's** business (E4), not the
historical timeline's.

### 4.1 How historical identities behave after major divergence (refinement 2026-10-14)

Once the world has diverged from the historical timeline (a polity destroyed, a
family extinct, a pivotal figure dead early), the timeline must stay **informing,
never forcing**. The rule is per-entry and re-evaluated, never a global switch-off:

1. **Divergence is classified, not binary.** A divergence record carries a scope —
   *lineage-affecting* (a house or person), *polity-affecting* (a state), or
   *global/major* (a divergence that reshapes the regional order). Later entries
   consult these records as precondition inputs (§4, last bullet).
2. **Every entry is still attempted in its due time, then decided locally.** A
   major divergence does **not** disable historical birth entries wholesale. Each
   entry is evaluated against authoritative state at its own trigger time; those
   whose plausible conditions still hold proceed, those whose conditions fail are
   suppressed with a `timeline.lineage_suppressed`-class event (§4). This is how
   history can be *partly* recognisable after a major break.
3. **The person is historical; the career is simulated.** When a historical person
   does appear, their canonical identity is preserved (UUIDv5 from `sourceKey`).
   But their *expected* roles (consul, king, general) are **not** forced: a person
   born into a conquered polity lives a different life, and no expected office is
   granted them. The timeline supplies people; the simulation supplies careers.
4. **Suppression never generates replacements.** When an entry is suppressed the
   timeline emits a divergence event and stops. It does not invent a stand-in to
   fill the expected role; if a role needs an occupant, which system fills it
   (house succession, generic generation, election) is that system's decision, not
   the timeline's (§4, "No blind generation").
5. **Suppression is queryable and deterministic.** Every divergence is an
   append-only, ID-stable event: "what happened to the Barcid line in *this*
   world?" is answerable from the ledger, and identical run inputs reproduce
   identical suppression outcomes (ADR-0009).

**Standing constraint.** The timeline must never revive a suppressed entry, never
re-apply historical expectations retroactively over simulation outcomes, and never
let a major divergence silently downgrade to "history as scripted".

## 5. Alternate history: divergence, not false destiny

The campaign is a simulation, not a script. Two rules keep history "informed"
without making it deterministic:

1. **Authored facts are expectations, not forced outcomes.** A historical death
   (e.g. Pyrrhus at Argos in 272) is **not** a scripted kill. Deaths arise from
   the simulation's own mechanisms and events. The authored date is used for
   content and artwork expectations (e.g. a portrait's apparent age) and as an
   *expected* value for divergence reporting — never as an outcome the engine
   imposes. (This splits into AD-27 alternatives below.)
2. **Divergence is recorded, not hidden.** When the world stops matching the
   expectation (a person dies early, a line ends, a polity is destroyed), the
   difference is emitted as an event and is queryable. A player should be able to
   ask "what happened to the Barcid line in *this* world?" and read the answer.

**Refined death rule (2026-10-14): authored death dates are expectations and must
never automatically override simulation outcomes.** Death is **always** a
simulation outcome. An authored expected-death window may at most schedule a
**state-reading** trigger that feeds plausible causes (age, health, circumstance)
into the simulation's own death mechanism; it may **never** directly apply a
death, and it is automatically void if the character is already dead or the state
contradicts it. This supersedes the earlier (a)/(b)/(c) framing.

The earlier alternatives are retained here for provenance, with the override
removed:

- **(a) Pure simulation** — no trigger at all; the sim alone decides.
- **(b) Scheduled, state-reading, non-applying** — an authored window schedules a
  plausible-cause input the sim may act on; it cannot itself kill.
- **(c) Hybrid (recommended)** — (b) with a soft window plus an explicit
  divergence event when the sim's own causes pre-empt or outlive the expectation.

Option **(c)** remains the recommendation, now explicitly **without** any
death-applying power: it is the only framing consistent with "expectations, not
forced outcomes" while still giving artwork and content a usable target. **AD-27
remains Unresolved** on the surrounding schema (windows, cause inputs, divergence
event shape).

## 6. What the start-world must contain (content requirements)

The start-world generation for 278 BCE must populate, at minimum:

- **Polities and their government types** (E10, ADR-0013): Rome (republic),
  Carthage (oligarchic republic with annually elected suffetes and a strong
  military-familial strand — R-16), Tarentum and other Italiote cities,
  Epirus/Molossian kingship, Ptolemaic Egypt, the Seleukid realm, Antigonid
  Macedon, Syracuse, the Mamertines of Messana, and the major Gallic and Iberian
  peoples as non-playable-but-simulated factions (standing constraint 6).
- **Named characters** per §3, with **year-precision or range** births and
  explicit source notes.
- **Offices held in 278** and their holders, or an explicit "holder unknown — to
  be generated" marker where the sources are silent.
- **Treaties in force**, including the Rome–Carthage renewal, authored with
  authority provenance (E11).
- **Geography** per the geography track (G1/VS-5) — this document does **not**
  author geography; it declares what the start-world needs from it.

## 7. Anachronism guard (period-correctness at 278 BCE)

The start-world must not import later Roman institutions or objects. Explicit
examples to guard against:

- **No denarius.** The silver denarius begins ~211 BCE; Roman coinage at 278 is
  the **didrachm / quadrigatus** and bronze *aes*. Coin art and economy content
  must not show a denarius. (See `artwork-production-roadmap.md`.)
- **No permanent "provinces".** *Provincia* at 278 means a **sphere of duty**,
  not a fixed territory; Sicily is not yet a province (241). Government content
  must not present a province system as existing fact at the start.
- **No codified cursus honorum.** The minimum-age/sequence laws (e.g. the *lex
  Villia annalis*, 180 BCE) do not exist at 278; the competition for the two
  consulships does. Office eligibility must be data-driven and period-scoped,
  not a later legal ladder (R-16).
- **No medieval heraldry.** Faction emblems are period-appropriate symbols, not
  coats of arms.

## 8. Research requirements opened by this document

| ID | Question | Blocks |
| --- | --- | --- |
| **R-13** | The 278 BCE start-world dataset: which families, magistrates, priestly officers, treaties, dynasties and territorial holdings are attested, which are reconstructed, and which are gaps to be generated? Includes resolving the §3.3 `needs-research` class. | E4, E10, AD-27 |
| **R-16** | Per-polity political institutions at 278 BCE, with anachronism checks (Roman magistracies, Carthaginian suffetes/gerousia/Hundred-and-Four, Ptolemaic court, Epirote league, Syracusan constitution). | E9, E10, AD-25 |

The research plan for these (and R-14/R-15) is
[`../architecture/start-world-research-plan.md`](../architecture/start-world-research-plan.md),
prioritising **R-16** then **R-13**.

## 9. Non-goals of this proposal

- It does not close **AD-27**; the refined rule that authored death dates never
  override simulation outcomes is incorporated (§5), but the surrounding schema
  stays **Unresolved**.
- It does not author the full 278 dataset (that is R-13 / content research).
- It does not implement start-world generation.
- It does not add scripted "historical events" that fire regardless of state;
  any authored historical happening must be a state-reading trigger.
- It does not claim any uncertain date as canon.
