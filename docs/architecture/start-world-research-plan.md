# Start-world research plan (R-13 – R-16)

**Status: Proposal (2026-10-14).** This document plans the **research** that
unblocks the proposed 278 BCE start-world and the political/economic expansion.
It approves nothing, implements nothing, and authors no content values. It is the
companion to
[`domain/campaign-start-and-historical-timeline.md`](../domain/campaign-start-and-historical-timeline.md)
(AD-27),
[`political-office-and-government-architecture.md`](political-office-and-government-architecture.md)
(AD-25),
[`economic-authority-architecture.md`](economic-authority-architecture.md)
(AD-26) and
[`character-interaction-and-event-architecture.md`](character-interaction-and-event-architecture.md)
(AD-28/AD-29).

It covers research questions **R-13, R-14, R-15, R-16** from
[`assumptions-and-open-decisions.md`](assumptions-and-open-decisions.md) §4.

> **Research changes no decision status by itself.** Answering a question
> produces evidence. It closes a decision only when that decision is explicitly
> ruled closed. **AD-25, AD-26, AD-27, AD-28 and AD-29 stay OPEN** regardless of
> research progress.

## 1. Scope and the "no new archaeology" rule

The 2026-10-14 documentation pass set an explicit non-goal: **no new
archaeology** — existing research documentation and catalogue knowledge only
(`assumptions-and-open-decisions.md` §5). This plan therefore describes **what to
compile from existing sources, how to record uncertainty, and what output form
each answer takes** — not new field investigation.

- **In scope:** collating and reconciling known evidence; naming the sources that
  support each datum; labelling every value by confidence; identifying content
  gaps that must be *generated* (and how they are marked as generated).
- **Out of scope:** commissioning or performing original fieldwork, scanning new
  primary material, or asserting precision the sources do not support.

## 2. Priority order (and why)

| Order | ID | Why this order |
| --- | --- | --- |
| 1 | **R-16** | Political institutions are **load-bearing for AD-25**, the decision the whole political layer depends on. Office kinds, collegiality, veto and term rules must be known before the office model can be ruled closed. It also gates E9/E10 content. |
| 2 | **R-13** | The 278 BCE start-world dataset is **what the campaign is populated with**; it depends on R-16 for the institutional vocabulary (a `magistrate` is only meaningful once R-16 defines the offices). Gated by AD-27 for how conditional entries behave. |
| 3 | **R-15** | Economy/treasury evidence gates E19 content and E12 values, but E19 is **deliberately late** and must not block earlier slices. |
| 4 | **R-14** | Art-likeness and age-progression methodology runs on the **presentation track** (PT1) and blocks no simulation architecture. |

**Natural unlock chain.** R-16 → AD-25 → {AD-26, AD-29}; R-16 + AD-27 → R-13 →
S15 content. R-15 and R-14 are independent and parallel.

## 3. R-16 — Per-polity political institutions at 278 BCE (highest priority)

**Question.** What are the documented political institutions per polity at 278
BCE, with anachronism checks?

**Polities in minimum scope** (proposed start-world): Rome and its Italian
allies; Carthage; the Ptolemaic kingdom; Epirus/the Epirote league; Syracuse (the
civic *polis*, **before** Hiero II's rise — note the anachronism guard); and the
successor states that matter to the horizon (Seleucid, Antigonid Macedon).

**World-program expansion (2026-10-14).** R-16 was expanded from the three
load-bearing polities into a **comprehensive world political-institutions
program** covering the whole intended map (scope comparable to *Rome II*'s grand
campaign). The program, method, entity classification, coverage tracking and the
proposed institution taxonomy are in
[`research/r16-world-political-institutions-program.md`](../research/r16-world-political-institutions-program.md);
the discovery/verification output is
[`research/r16-candidate-entity-inventory.md`](../research/r16-candidate-entity-inventory.md)
and [`research/r16-regional-coverage-matrix.md`](../research/r16-regional-coverage-matrix.md).

**What must be answered per polity.**

- **Office kinds and names:** which roles exist, how they are filled (election,
  lot, inheritance, appointment, acclamation), and what each may legally do.
- **Collegiality:** how many holders a role admits and whether they act jointly
  (Roman consulship; Carthaginian dual suffetes).
- **Veto / intercession:** whether a colleague or another body can block an act
  (Roman tribunician intercession; gerousia/assembly checks).
- **Term and re-entry rules:** fixed terms, iteration limits, minimum ages *where
  attested* — and explicitly **not** the later codified **cursus honorum**
  (lex Villia annalis, 180 BCE; Sulla's rules): a documented anachronism guard.
- **Decision bodies and their authority:** senate/council, assemblies, royal
  court, the Carthaginian Hundred-and-Four, the Epirote league's federal organs.
- **Religious and priestly offices** as roles (pontifices, augures; Punic and
  Ptolemaic priesthoods) where they carry political authority.
- **Legal authority vs. informal influence:** for each office, what is *legal*
  authority and what is merely prestige/patronage (AD-25 §4.1).

**Anachronism guards to enforce.** No codified cursus honorum; no permanent
provinces (Sicily becomes the first, 241 BCE); no denarius (from ~211 BCE); no
imperial-era offices; no medieval heraldry or feudal titles; no modern party or
"faction" vocabulary.

**Output form.** A per-polity institution sheet: office table (name, filling
method, collegiality, veto, term, legal capabilities), decision-body table,
an explicit `attested / reconstructed / generated` label per row, source
citations, and a list of open gaps. Feeds AD-25 and E9/E10 content.

**Blocks on completion:** E9, E10 content authoring; AD-25 may be ruled closed.

**In progress (2026-10-14).** The reusable
[`research/political-institution-research-template.md`](../research/political-institution-research-template.md)
has been created, with the first three per-polity sheets — the ones whose
institutions are most load-bearing for AD-25:

- [`research/r16-rome-278bce.md`](../research/r16-rome-278bce.md)
- [`research/r16-carthage-278bce.md`](../research/r16-carthage-278bce.md)
- [`research/r16-ptolemaic-egypt-278bce.md`](../research/r16-ptolemaic-egypt-278bce.md)

Their model challenges are consolidated in
[`research/r16-model-challenges.md`](../research/r16-model-challenges.md) as
**proposals to AD-25** (C1–C13; plus **N1–N7** and **RV0–RV3** from 2026-10-14);
they change no architecture and close no decision. The **four load-bearing T1
sheets** have since been added (2026-10-14):

- [`research/r16-seleucid-278bce.md`](../research/r16-seleucid-278bce.md)
- [`research/r16-macedon-278bce.md`](../research/r16-macedon-278bce.md) (kingship **in contest** at 278)
- [`research/r16-epirus-278bce.md`](../research/r16-epirus-278bce.md) (federal league + kingship)
- [`research/r16-syracuse-278bce.md`](../research/r16-syracuse-278bce.md) (civic *polis* + crisis command)

**Remaining scope:** the T2 powers (Maurya, Bosporan, Bithynia, Pontus,
Cappadocia, Armenia, Atropatene, Pergamon, Rhodes, Sparta, Aetolian/Achaean
leagues, Numidia, Kush, South Arabia, the Celtic and Galatian peoples) and the
T3 region-completing representative profiles; see the coverage matrix
[`research/r16-regional-coverage-matrix.md`](../research/r16-regional-coverage-matrix.md)
§5 for the ordered backlog.

All seven detailed sheets have since been audited against the proposed taxonomy
in
[`research/r16-sheet-consistency-review.md`](../research/r16-sheet-consistency-review.md)
(findings **RV0–RV3**; **no new family and no new role kind** required; AD-25
stays OPEN).

## 4. R-13 — 278 BCE start-world dataset

**Question.** What is the attested 278 BCE start-world dataset (families,
magistrates, priestly officers, treaties in force, dynasties, territorial
holdings), which parts are reconstructed, and which are content gaps to be
generated? Includes the `needs-research` character class.

**Dependencies.** AD-27 (how conditional historical entries behave) and R-16
(institutional vocabulary).

**What must be compiled.**

- **Magistrates and officeholders in year:** the consuls of 278 BCE
  (C. Fabricius C.f. Luscinus II; Q. Aemilius Cn.f. Papus II) and other attested
  Roman officers; Carthaginian, Ptolemaic and epirote/dynastic officeholders.
- **Families and houses** alive at the start, with the geneaology known well
  enough to seed the **conditional historical entry** model (AD-27 §4).
- **Treaties in force:** the Rome–Carthage treaty renewal (Livy *Per.* 13.10;
  Polybius 3.22–25 numbering disputed) and others that constrain action at 278.
- **Dynasties and their current rulers:** Ptolemy II (308–246; sole ruler
  283/282); Antiochus I (d.261); Antigonus II Gonatas (king ~276/272); Hiero II
  (rose ~275/274); Pyrrhus (to Sicily 278).
- **Priestly officers** and religious bodies that carry authority.
- **Territorial holdings** at the start, consistent with the geography track's
  scope (see `geography-integration-requirements.md`).

**Uncertainty classes (must be respected).**

- **Attested** — a source states it (e.g. the 278 consuls).
- **Reconstructed** — inferred from surrounding evidence; labelled as such.
- **`needs-research`** — cannot be settled from existing sources; **not placed at
  the start** until answered. Hamilcar Barca's birth is the canonical example.
- **Generated** — a deliberate content gap filled by the generator, explicitly
  marked generated, never presented as historical.

**Specific caution.** Hannibal is born ~247 (no ancient source states the date
directly) and Hamilcar's birth is unrecorded; the person-level data must not
manufacture false precision. See the uncertainty caveats in
`campaign-start-and-historical-timeline.md` §3.

**Output form.** A start-world dataset document keyed by entity kind
(polities, offices, families, persons, treaties, holdings), each datum tagged
attested/reconstructed/needs-research/generated with sources, plus a
`needs-research` register. Feeds S15 and AD-27.

## 5. R-15 — Ancient economy/treasury evidence per polity at 278 BCE

**Question.** What is the attested economy/treasury evidence per polity (revenue
sources, tithe systems, minting, military pay, temple treasuries)?

**Dependencies.** E19 (deliberately late) and AD-26. **Must not block E0–E8 or the
geography track** (`economic-authority-architecture.md` §10).

**What must be compiled.** Revenue streams (tax, tribute, tithe, customs, mines),
treasury-holding institutions (Rome's *aerarium*; Ptolemaic royal treasury; temple
treasuries), minting and coinage **at 278** (no denarius), military-pay norms, and
who was **legally authorised** to spend from which fund (feeding AD-26 §7).

**Anachronism guards.** No denarius (from ~211 BCE); no imperial fiscal apparatus;
no modern banking; label every currency as period-appropriate (didrachm /
quadrigatus coinage and bronze aes for Rome).

**Output form.** A per-polity economy sheet: revenue table, treasury table,
spending-authority table, each row attested/reconstructed/generated with sources.
Feeds E19 content and E12 values.

## 6. R-14 — Art consistency and survival-likeness evidence

**Question.** What basis exists for consistent art across a subject's ages, and
what surviving-likeness evidence exists per historical figure?

**Dependencies.** The presentation track only (PT1). Blocks no simulation
architecture. See `presentation/artwork-production-roadmap.md`.

**What must be compiled.** Surviving-likeness evidence per figure (portrait
busts, coins, literary descriptions, later artistic tradition) with an explicit
confidence label; an age-progression methodology statement; an anachronism policy
(no later iconography mapped onto 3rd-century figures). Feeds PT1 and the artwork
roadmap's portrait identity requirement.

## 7. Cross-cutting rules for every answer

1. **Label every datum** as attested / reconstructed / needs-research /
   generated. Never let a generated gap look attested.
2. **Cite the source** for each attested datum; carry the source's own
   uncertainty into the label.
3. **Enforce the anachronism guards for 278 BCE** continuously (no denarius, no
   permanent provinces, no codified cursus honorum, no medieval heraldry).
4. **Do not close a decision by research.** Emit evidence and a recommendation;
   the decision stays OPEN until explicitly ruled.
5. **Do not author content values here.** This plan produces evidence sheets; the
   content itself is a later, separately-approved authoring step.
6. **Determinism is not a research concern.** Research fixes plausible ranges and
   labels uncertainty; the engine's determinism (ADR-0008/0009) is unaffected.

## 8. Recommended sequence and gates

```
R-16 ──▶ AD-25 may close ──▶ { AD-26, AD-29 may close }
  │
  └──▶ (with AD-27) ──▶ R-13 ──▶ S15 start-world content

R-15 (parallel) ──▶ E19 content (late)
R-14 (parallel, presentation track) ──▶ PT1
```

**First recommended action:** begin **R-16**, compiling the per-polity
institution sheets for Rome, Carthage and the Ptolemaic court first (the three
polities whose institutions are most load-bearing for AD-25), each row labelled
and sourced, then circle back to fill the remaining polities. *(Started
2026-10-14 via `research/political-institution-research-template.md` and the
three sheets; see §3.)*

## 9. Related documents

- [`assumptions-and-open-decisions.md`](assumptions-and-open-decisions.md) §4 —
  the research register (R-13 – R-16).
- [`domain/campaign-start-and-historical-timeline.md`](../domain/campaign-start-and-historical-timeline.md)
  — the 278 BCE start, verified facts, uncertainty classes (AD-27).
- [`political-office-and-government-architecture.md`](political-office-and-government-architecture.md)
  — what R-16 must feed (AD-25).
- [`economic-authority-architecture.md`](economic-authority-architecture.md) —
  what R-15 must feed (AD-26/E19).
- [`presentation/artwork-production-roadmap.md`](../presentation/artwork-production-roadmap.md)
  — what R-14 must feed (PT1).
- [`research/political-institution-research-template.md`](../research/political-institution-research-template.md)
  — the reusable R-16 sheet template.
- [`research/r16-world-political-institutions-program.md`](../research/r16-world-political-institutions-program.md)
  — the R-16 world program (method, classification, priorities); with the
  [`candidate-entity-inventory`](../research/r16-candidate-entity-inventory.md),
  [`regional-coverage-matrix`](../research/r16-regional-coverage-matrix.md) and
  [`institutional-taxonomy`](../research/r16-institutional-taxonomy.md).
- [`research/r16-model-challenges.md`](../research/r16-model-challenges.md) —
  consolidated R-16 model challenges (proposals to AD-25).
- [`research/r16-sheet-consistency-review.md`](../research/r16-sheet-consistency-review.md)
  — cross-sheet audit of all seven detailed sheets against the taxonomy; the
  architecture challenges (RV0–RV3) that should influence AD-25.
- `research/rome2-dei/` — existing extracted tables and `HANDOFF.md` (coordination
  only; not an architecture source).
