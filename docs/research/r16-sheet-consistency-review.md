# R-16 — seven-sheet consistency review (taxonomy + AD-25)

**Status: Proposal (2026-10-14), part of R-16.** A cross-sheet audit of the **seven
detailed R-16 sheets** (Rome, Carthage, Ptolemaic Egypt, Seleucid, Macedon,
Epirus, Syracuse) against the proposed
[`r16-institutional-taxonomy.md`](r16-institutional-taxonomy.md), producing the
**architecture challenges that should influence AD-25**. It changes **no**
architecture and **closes no** decision: **AD-25 stays OPEN**.

Related: [`r16-model-challenges.md`](r16-model-challenges.md) (the consolidated
C/N proposals), [`r16-regional-coverage-matrix.md`](r16-regional-coverage-matrix.md)
(coverage), [`../architecture/political-office-and-government-architecture.md`](../architecture/political-office-and-government-architecture.md) (AD-25).

## 1. Family assignment (taxonomy §2 F1–F7)

| Sheet | Assigned family | Combination? | Consistency verdict |
| --- | --- | --- | --- |
| **Rome** | **F1 Collegiate republic** | No (F1 variants: sacrosanct veto-holder outside the magistrate order; conditional plebiscite authority) | **Consistent** |
| **Carthage** | **F1 Collegiate republic** | No (F1 variants: **civil/military split**, **self-co-opting body**, **conditional assembly**) | **Consistent** |
| **Ptolemaic Egypt** | **F2 Royal monarchy** | No (+ contained tiers: *polis*, temple estate) | **Consistent** |
| **Seleucid** | **F2 Royal monarchy** | No (+ satrapy / vassal / *polis* / temple tiers) | **Consistent** |
| **Macedon** | **F2 Royal monarchy** | No (F2 variant: **army-assembly king-making**; kingship **contested at 278**) | **Consistent** |
| **Epirus** | **F3 Federal league + F2 royal head** | **Yes** (F3 + F2) | **Consistent** — but see §5/RV0 |
| **Syracuse** | **F4 Civic *polis*** | **Yes** (+ a temporary F2-like **crisis command**) | **Consistent** — but see §5/RV0 |

**Finding.** **Every** detailed sheet maps to a taxonomy family or a clean
combination. **No new family is required** by the seven sheets — a strong
validation of F1–F7. Two entities are **combinations**, which the taxonomy
already anticipates (§7); this is expected, not an inconsistency.

## 2. Role-kind usage vs. taxonomy §3

| Role kind | Rome | Carthage | Ptolemaic | Seleucid | Macedon | Epirus | Syracuse |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Political office | ● | ● | ● | ● | ● | ● | ● |
| Military command | ○ | ● (separate!) | ● | ● | ● | ● | ● |
| Religious office | ● | ○ | ● | ● | ○ | ● | ○ |
| Administrative appointment | ● | ○ | ● | ● | ○ | ● | ○ |
| Social rank | ● | ● | ● | ● | ● | ● | ● |
| Property / landholding | ○ | ○ | ● | ● | ○ | ○ | ○ |
| Institutional membership | ● | ● | ● | ● | ● | ● | ● |

**Finding.** All seven sheets use the same **seven role kinds** — **no new role
kind is needed**. Two observations for AD-25:

- **Military command is genuinely independent of political office** in Carthage
  (independently elected generals) and delegated/separate in the monarchies and
  in Syracuse (elected generals vs. crisis command). It must remain a **distinct
  kind**, never derived from civil office.
- **Property/landholding** (Ptolemaic *kleruchic*/royal land, Seleucid *chora
  basilike*) is used as a **political** kind, not only economic — it carries
  **military obligation** (N7 → AD-26).

## 3. Subordinate-tier coverage vs. taxonomy §6

| Tier | Rome | Carthage | Ptolemaic | Seleucid | Macedon | Epirus | Syracuse |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Satrapy / province | — (none yet) | ○ (Africa) | ● (nome) | ● | ○ | — | — |
| Subject city | ○ | ● | ● | ● | ● | ○ | ● |
| Allied community (*socius*/*foedus*) | ● | ● | ● | ○ | ● | ● | ● |
| Colony | ● | ● | ○ (*kleruchoi*) | ○ | ○ | — | ○ |
| *Polis* inside kingdom | — | — | ● | ● | ○ | ○ | — |
| Temple estate | ○ | ○ | ● | ● | ○ | ● (Dodona) | ● |
| Vassal kingdom | — | ● (Numidians) | ○ (Cyprus/Cyrene) | ● | ○ | ○ | — |
| Tribal subdivision | ○ (*pagi*) | ● (Libyan tribes) | ○ | ○ | ○ | ● (tribes) | ○ |
| **Sphere of influence / naval hegemony** *(proposed)* | ○ | ○ | ● (Aegean) | ○ | ○ | — | — |

**Findings.**

- **The taxonomy's tier list is *almost* sufficient** but **two gaps** appear:
  1. **"Sphere of influence / naval hegemony" is missing.** Ptolemaic Aegean
     possessions and Rome's **non-provincial** Italian hegemony are **influence
     and alliance without administration** — distinct from the
     **administration** tiers (satrapy/nome). The tier list models *administrated*
     tiers well but needs an explicit **indirect-influence tier** (RV1).
  2. **Tier obligations are not in the taxonomy.** Every sheet distinguishes
     **tribute**, **troops**, and **garrison** obligations — which fall on
     **different tiers from rights**. The tier vocabulary needs **obligation
     fields** (RV2).
- **"Satrapy/province" is one primitive** realised differently (Seleucid satrapy,
     Ptolemaic nome, Carthaginian Africa) — consistent.
- **Direct vs. indirect administration is a spectrum**, exactly as the sheets
     show: **direct** (nome/satrapy/Africa), **hegemonic** (Aegean, Roman Italy,
     Cyrenaica), **corporate** (*poleis*, temples).

## 4. Cross-cutting primitives vs. taxonomy §5

| Primitive | Rome | Carthage | Ptolemaic | Seleucid | Macedon | Epirus | Syracuse |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Collegiality | ● | ● | — | — | — | ○ (federal) | ○ |
| Mutual veto / *intercessio* | ● | ○ | — | — | — | — | ○ |
| Conditional assembly competence | — | ● | — | — | ○ (army, crisis) | ○ | ○ |
| Revocable / at-pleasure tenure | — | ○ | ● | ● | ○ | ○ | ○ |
| Army-assembly king-making | — | — | ○ (acclaim) | ○ | ● | ○ | — |
| Federal dual citizenship / isopolity | — | — | — | — | — | ● | — |
| Sacral kingship | — | — | ● | ● | ● | ○ | — |
| Hereditary vs. appointed succession | — | — | ● | ● | ● | ● | ○ |
| Kin / gentilician bloc | ● | ● | ● | ● | ● | ● | ● |
| Subordinate-community tiers | ● | ● | ● | ● | ○ | ● | ● |

**Finding.** The primitive set covers the seven sheets **with one addition
needed: citizenship/obligation tiers** (§5, RV3). Everything else is either
present or already proposed (C1–C13, N1–N7).

## 5. New challenges arising *from the review* (proposals only)

| # | Evidence across sheets | Why the model needs it | Proposal to AD-25 |
| --- | --- | --- | --- |
| **RV0** | Epirus (F3+F2) and Syracuse (F4+crisis F2) are **combinations**, not single families | A government type must be able to **compose** families (royal head over a league; a civic body granting supreme command) | State that **families compose**; a government type is a **configuration**, possibly of several families (already implied by AD-25 §5 — make explicit) |
| **RV1** | Ptolemaic Aegean and Roman Italy are **influence/alliance without administration**; distinct from nome/satrapy rule | The subordinate-tier vocabulary models **administration** but not **indirect hegemony** | Add an **"indirect influence / hegemony" tier** (alliance/treaty/protectorate) distinct from administration tiers |
| **RV2** | Every sheet separates **tribute / troops / garrison** obligations from rights | Obligations are the substance of subordination and currently have no vocabulary | Give subordinate tiers explicit **obligation fields** (tribute, military levy, garrison, alignment) |
| **RV3** | Citizenship is **layered/absent**, not a binary: Rome (4+ tiers), Carthage (citizen/subject), Egypt (none/local), Seleucid (local/subject), Macedon (ethnic/assembly), Epirus (dual + grantable), Syracuse (civic + grantable) | A single citizenship flag is **false for five of seven** polities | Make citizenship **tiered, local, and grantable**, and separate **political rights / civil privileges / civic obligations / military obligations / office-eligibility** as distinct attributes (extends **N4/N5**, and area 8) |

## 6. What should influence AD-25 (consolidated, prioritised)

The review's output for the **next AD-25 ruling** — **evidence only; AD-25 stays
OPEN**. Each row says *what the seven sheets jointly demand* and *why it matters*.

| Priority | Challenge (source) | Why it matters for AD-25 | Sheets demanding it |
| --- | --- | --- | --- |
| **1** | **C1 Sovereign/root role** (+ RV0 composition) | Four monarchies and three civic/league roots all need an explicit **grantor of the government configuration**; without it the model is Rome-shaped | Ptolemaic, Seleucid, Macedon, Epirus, Syracuse, Carthage, Rome |
| **2** | **C2 Revocable / at-pleasure tenure** | Ptolemaic and Seleucid offices have **no term**; term-only tenure cannot express them | Ptolemaic, Seleucid, Macedon |
| **3** | **N4/RV3 Tiered, grantable, local citizenship** + **RV2 obligation fields** | Citizenship is **layered or absent** in 5 of 7; obligations fall on **different tiers than rights** | Rome, Carthage, Ptolemaic, Seleucid, Macedon, Epirus, Syracuse |
| **4** | **N6 Subordinate-community tiers** + **RV1 indirect-influence tier** | All large polities contain non-central institutions; the direct/indirect distinction is a **spectrum** the model must hold | Rome, Carthage, Ptolemaic, Seleucid, Macedon, Epirus, Syracuse |
| **5** | **N1 Corporate grant bodies** | Assemblies (army/citizen) **grant/acclaim** — not only individuals do | Macedon, Epirus, Syracuse, Rome, Carthage |
| **6** | **N2 Dual (hereditary + acclamatory) succession** | Succession is a **combination**; 278 Macedon is the live case | Macedon, Carthage, Ptolemaic |
| **7** | **C3 Capability-less roles** | Court "Friends" and social rank confer **standing without capability** | Ptolemaic, Rome, Carthage |
| **8** | **C4 Explicit veto independent of rank** | The tribune case; also Carthaginian collegiate block | Rome, Carthage |
| **9** | **C7 Conditional / fallback body authority** | Carthaginian assembly; Macedonian army in crisis | Carthage, Macedon, Epirus, Syracuse |
| **10** | **C9 Formal authority vs. conventional deference** | The Roman Senate; the league assembly vs. the king | Rome, Epirus, Macedon |
| **11** | **N7 Corporate economic holder** (hand to AD-26) | Temple estates hold land+people+dues | Ptolemaic, Seleucid |

**Cheap/safe first adoptions if any:** **C3, C4, C12** (validate/lightly
generalise the model); then **C1/C2/N4–N6** (required by the monarchies and the
tiered societies).

## 7. Recommended disposition

- **Do not change AD-25 in this pass.** This review is **evidence**; it changes no
  code, closes no decision.
- **Highest-leverage for the next AD-25 ruling:** **C1, C2, and N4/RV3** — without
  them the model cannot represent monarchies (C1/C2) or the **layered/absent
  citizenship** that five of seven sheets document (N4/RV3).
- **Keep AD-25 OPEN.** RV0–RV3 are now **recorded** in
  [`r16-model-challenges.md`](r16-model-challenges.md) §3.2 and the taxonomy's §8
  as proposals (2026-10-14).
- **Next research (backlog item 4):** the two most structurally distinct T2
  entities — the **Aetolian League** (a federal league with **dual citizenship**
  and no king) and the **Maurya Empire** (a large non-Mediterranean monarchy) —
  to test whether F1–F7 and C/N/RV still hold outside the Mediterranean set.

## 8. Presentation consistency (minor)

All seven sheets now carry the extended areas **J.1** (citizenship/social classes
/participation) and **J.2** (subordinate communities) between §J and §K. The three
retrofitted sheets (Rome, Carthage, Ptolemaic) present them as **tables**; the
four T1 sheets present them as **bullet lists**. The content is equivalent and
**area 8/9 coverage is uniform** across all seven (see the coverage matrix); the
table/bullet difference is cosmetic and harmonisation is **optional**, not a
consistency gap in the taxonomy sense.
