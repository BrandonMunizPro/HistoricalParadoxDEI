# R-16 proposed institutional taxonomy

**Status: Proposal (2026-10-14), part of R-16.** The **stable interface** between
the world research and the AD-25 architecture: a small set of **government
families** (configurations of shared primitives) and **role-kind usages** that
let every 278 entity be expressed as a *combination*, never as a bespoke engine.
This document changes **no** architecture and **closes no** decision; every "new
primitive" is phrased as a proposal.

Related: [`r16-world-political-institutions-program.md`](r16-world-political-institutions-program.md),
[`r16-regional-coverage-matrix.md`](r16-regional-coverage-matrix.md),
[`r16-sheet-consistency-review.md`](r16-sheet-consistency-review.md) (the audit
that validated F1–F7 against all seven sheets),
[`r16-model-challenges.md`](r16-model-challenges.md),
[`political-institution-research-template.md`](political-institution-research-template.md),
[`../architecture/political-office-and-government-architecture.md`](../architecture/political-office-and-government-architecture.md)
(AD-25 — the concepts this taxonomy instantiates).

## 1. Purpose and rules

The architecture says (AD-25 §5): a **government type** is *configuration*, not a
class hierarchy; "shared primitives, culturally specific expression." This
taxonomy supplies the proposed set of **families and primitives** so that adding
a polity is choosing/combining them.

Rules, mirroring AD-25:

1. A **family** is not a class a polity "isa"; it is a **configuration preset**
   that a polity's role definitions, decision bodies and selection rules follow.
2. Everything here is expressed in AD-25's vocabulary:
   **RoleDefinition · RoleHolding · derived Authority**; role kinds
   (§3 of AD-25); capabilities (§4 of AD-25).
3. A genuinely new primitive is a **proposal to AD-25**, not a silent addition.
4. **No one-engine-per-culture.** New polities reuse these presets or extend
   them by combination.

## 2. Government families (configuration presets)

| Family | Defining primitives | 278 examples | Notable variants |
| --- | --- | --- | --- |
| **F1 — Collegiate republic** | Annually elected **collegiate** chief magistrates; a **council** (senate/elders); a **popular assembly** with defined competences; accountability trials | **Rome**, **Carthage**, Rhodes (maritime variant) | Conditional assembly sovereignty (Carthage); sacrosanct veto-holder outside the magistrate order (Roman tribune) |
| **F2 — Royal (personal) monarchy** | An **uncollegial, sacral or charismatic head**; a **court** (*philoi*, *hetairoi*); **delegated governors/appointees**; a royal army | **Ptolemaic Egypt**, **Seleucid Empire**, **Macedon**, Bithynia, Pontus, Cappadocia, Armenia, Atropatene, Bosporan Kingdom, Kush/Meroe, Maurya | Army-assembly king-making (Macedon); crown-as-grantor (Ptolemaic); satrapal delegation (Seleucid) |
| **F3 — Federal league / *koinon*** | **Member communities keep internal government**; a **federal assembly** (*synedrion*/*ekklesia*); **federal magistrates**; shared citizenship | **Epirote League**, **Aetolian League**, **Achaean League**, Boeotian *koinon*, Thessalian *koinon* | League *under* a king (Epirus); isopolity/dual citizenship (Aetolian/Achaean) |
| **F4 — Civic *polis*** | **Assembly-primary**; a **council** (*boule*); **elected magistrates/generals** (*strategoi*); civic cult and gymnasium | **Syracuse**, **Sparta** (dual-kingship variant), Athens (garrisoned variant), Tarentum, Massalia, Byzantion, Cretan and Ionian cities | Garrisoned/dependent polis (Athens, Corinth); tyrant/strongman layer (Syracuse, historically) |
| **F5 — Tribal kingship / chiefdom** | A **leader** (hereditary or charismatic); a **council of elders/notables**; an **assembly of arms**; kin/gentilician blocs | Numidian kingdoms (Masaesyli/Massylii), Illyrian Ardiaei/Taulantii, Odrysian Thrace, Galatian and Gallic *civitates*, Bastarnae | Dual kingship (Numidia is single; Sparta is the dual case); war-leader vs. peace-chief |
| **F6 — Imperial province / satrapy** | A **subordinate governor** (satrap/strategos/proconsul) under a monarchy or republic; delegated, revocable authority; tribute and garrison | Seleucid satrapies, Persis *frataraka*, Judaea/Yehud, Roman *provincia* (only from 241) | Dynastic vassal vs. appointed governor (Cappadocia/Armenia vs. a satrapy) |
| **F7 — Sacred / cult association** | A **cult league or sanctuary** with religious authority but **no sovereignty**; amphictyony, oracular centre | Delphic Amphictyony, Ionian *koinon* | Never grants military/fiscal capability — used for legitimacy and ritual only |

> **Not listed as families (by design):** "empire", "republic", "monarchy" as
> *classes*, and any one-culture engine. A polity may sit between families and
> **change family** over time (ADR-0018) — the configuration is data.

## 3. Role-kind usage per family

Which AD-25 role kinds (§3) each family typically uses — the evidence every
sheet supplies. (● = core, ○ = present, — = not typical.)

| Family | Political office | Military command | Religious office | Admin. appointment | Social rank | Property/land | Institutional membership |
| --- | --- | --- | --- | --- | --- | --- | --- |
| F1 Collegiate republic | ● | ○ (often separate) | ○ | ○ | ● | ○ | ● (senate/assembly) |
| F2 Royal monarchy | ● (court) | ● (king + generals) | ● (sacral king) | ● | ● (nobility/philoi) | ○ (royal domain) | ○ (royal council) |
| F3 Federal league | ● (federal) | ● (federal *strategos*) | ○ | ○ | ● (per-member) | ○ | ● (federal + member) |
| F4 Civic *polis* | ● | ○ | ● | ○ | ● | ○ | ● (assembly/council) |
| F5 Tribal kingship | ○ | ● (war-leader) | ○ | ○ | ● (kin/rank) | ○ | ● (elders/assembly of arms) |
| F6 Imperial province | ○ (governor) | ● (if militarised) | ○ | ● | — | — | ○ |
| F7 Cult association | ○ | — | ● | ○ | — | ○ (temple land) | ● |

## 4. Sovereignty root (the grantor)

Every family has a **root grantor** from which role holdings descend — this is
the most load-bearing primitive for AD-25 and the top item in
[`r16-model-challenges.md`](r16-model-challenges.md) (C1):

| Family | Sovereignty root | Who grants the top roles |
| --- | --- | --- |
| F1 | The **citizen body** (populus / assembly), mediated by council | Assembly/electoral body; council for some |
| F2 | The **king** (the state and the crown are fused) | The king; the court ranks descend from him |
| F3 | The **member communities** (the *koinon* is their creation) | Federal assembly; members retain theirs |
| F4 | The **citizen assembly** | Assembly; council; sometimes a strongman |
| F5 | The **people-in-arms / kin group** (leader is first among) | Kin/assembly; sometimes usurped by the leader |
| F6 | An **external sovereign** (the parent monarchy/republic) | The parent state, via the governor |
| F7 | *(none — non-sovereign)* | — |

## 5. Cross-cutting primitives (the reusable parts)

These appear across families and are the vocabulary AD-25's schema must cover.
Each is stated as evidence, with the archetype where it is clearest:

| Primitive | Meaning | Where it appears |
| --- | --- | --- |
| **Collegiality** | Multiple equal seats; a co-holder's concurrence may be required | Rome (2 consuls), Carthage (2 suffetes) |
| **Mutual veto / *intercessio*** | A co-holder (or specific office) can block a capability | Rome (consul↔consul; tribune over magistrates) |
| **Conditional (fallback) assembly competence** | The popular assembly is sovereign **only** when the council/chiefs disagree | Carthage (Aristotle's *Politics* II) |
| **Revocable, indefinite, at-pleasure tenure** | Appointment ends only by revocation/death | Ptolemaic offices |
| **Army-assembly king-making** | "Macedonians in arms" acclaim/confirm the king | Macedon |
| **Federal dual citizenship / isopolity** | Member citizens gain league citizenship | Aetolian/Achaean League |
| **Sacral kingship** | The ruler holds religious authority fused to office | Ptolemaic, Seleucid (cult), Odrysian |
| **Hereditary vs. appointed succession** | Office passes by birth or by grant | Dynastic monarchy vs. satrapy |
| **Kin/gentilician bloc** | Family/clan is a political actor independent of office | Rome (*gentes*), Carthage (Barcids), tribal families |
| **Subordinate-community tiers** | Institution types *not* the central government (§6) | All large polities |
| **Indirect influence / hegemony** | A dominant polity's **non-administrative** pre-eminence (alliance, protectorate, sphere, naval hegemony) in which internal government stays with the subordinate (RV1, §6.1) | Ptolemaic Aegean; Roman Italy's non-provincial hegemony |
| **Tiered political membership** | Membership **scoped, tiered and grantable**, with rights, obligations and eligibility stored **separately** (RV3, §6.3) | Rome's ladder; Epirus's dual citizenship |
| **Obligation classes distinct from rights** | Tribute / military levy / garrison / alignment / labour recorded **separately** from any privilege (RV2, §6.2) | all sheets §J.2 |

## 6. Subordinate-community tier types (area 9 made concrete)

A polity **contains** other communities. This section supplies the "institution
types that are not the central government" vocabulary AD-25 §6.3 requires. It
states **researched evidence** (from the sheets) and the **proposed simulation
mechanism** separately; nothing here is implemented.

### 6.1 Tier types by administration mode (RV1)

The tier list is grouped by **administration mode**, because the load-bearing
distinction is *direct administration vs. indirect hegemony vs. corporate
containment* — not a single "ally/subject" axis. RV1 adds the explicit
**indirect-influence** row.

| Mode | Tier type | Relationship | Obligations / privileges | 278 examples (evidence) |
| --- | --- | --- | --- | --- |
| **Direct administration** | Satrapy / province / nome | Governor under the sovereign; territory administered | Tribute, troops, garrison / local administration | Seleucid satrapies; Ptolemaic nome; Carthaginian Africa; Roman *provincia* (post-241) |
| **Direct administration** | Subject city | City administered by a kingdom/republic, often garrisoned | Tribute, garrison / charter, internal law | Greek cities under a hegemony; Etruscan towns |
| **Hegemonic (indirect)** | **Indirect influence / hegemony (RV1)** | **Alliance, protectorate, sphere of influence or maritime hegemony in which the dominant polity does NOT administer the subordinate's internal government** | Usually alignment and access rather than fixed tribute / protection; internal autonomy | Ptolemaic Aegean (Nesiotic); Roman Italy's *socii* system as a whole; Cyrenaica under Magas (278, drifting) |
| **Hegemonic (indirect)** | Allied community (*socius* / *foederatus*) | Nominal ally bound by treaty | Troops (*socii*), no tribute / internal autonomy | Rome's Italian *socii*; Numidian allies |
| **Hegemonic (indirect)** | Vassal / client kingdom | Client ruler under a suzerain; rules internally | Tribute, troops / internal rule | Cappadocia, Armenia (Seleucid orbit); Numidian kingdoms |
| **Hegemonic (indirect)** | Colony | Settler community tied to the founder | Military service / ties to the founder | Greek and Punic colonies; Roman/Latin colonies |
| **Corporate containment** | `polis` inside a kingdom | Civic body within a monarchy | Taxes / civic self-government, gymnasium | Alexandria, Naucratis |
| **Corporate containment** | Temple estate | Priestly corporation with land and people | Dues / sacral autonomy, land | Egyptian and Seleucid temples |
| **Corporate containment** | Tribal subdivision | Kin/territorial unit within a people | Levies / internal custom | Gallic/Iberian *pagi*, Libyan tribes |

**Proposed mechanism.** A subordinate tier is modelled as a **relationship record
on the parent polity** (administration mode + the obligations/privileges of §6.2)
**plus** the tier's **own government** (its internal role definitions, §2/§3) — it
is not flattened into the parent's government. Direct / indirect / corporate is a
**spectrum**, and a tier may **move along it** (a friendly ally annexed into a
province; a client kingdom regaining independence — Cyrenaica ~276).

### 6.2 Obligation and privilege vocabulary (RV2)

Every sheet's §J.2 distinguishes **tribute**, **troops** and **garrison**
obligations from rights. RV2 makes that explicit. An **obligation** is a duty
imposed by a relationship; a **privilege** is a right the tier retains; both are
recorded **separately from legal authority** (which authorises actions) and
**separately from economic leverage** (which supplies means).

**Obligation classes (proposed):**

| Class | Nature | 278 evidence |
| --- | --- | --- |
| **Economic / tribute** | Fixed tribute, levied levy, tithe, dues, monopoly share | Libyan *epikrateia* tribute; Seleucid *phoros*; temple *apomoira* |
| **Military levy** | Quota of troops, ships or cavalry owed by treaty or subjection | Roman *socii* *auxilia*; Numidian cavalry; Carthaginian Libyan levies |
| **Garrison / access** | Garrison rights, transit, port or naval-base access, hostages | Ptolemaic garrisons; Roman colonies; Cyprus naval base |
| **Political alignment** | No independent war or foreign policy; "friends of X" | Roman *socii*; client kingdoms |
| **Labour / corvée** | Irrigation, road or palace labour | Egyptian *laoi* corvée |
| **Cult / ritual** | Cult dues, festival participation | temple dues |

**Privilege classes (proposed):** internal autonomy and **own law/forum**; own
magistrates and coinage; trade/port access and protection; **citizenship or
isopolity** (or a *path* to it, §6.3); land rights and tax exemptions.

**Why separate.** Obligations fall on **different tiers from rights**: a people
may owe troops while holding no citizenship; a city may keep its own law while
paying tribute. Collapsing them into one "subject" tag loses exactly the
distinction the sheets document.

### 6.3 Political membership and citizenship (RV3)

**Evidence (researched).** Citizenship is **layered or absent**, not one flag:
Rome's ladder (citizen / *sine suffragio* / Latin / *socius* / *dediticius*),
Carthage's sharp citizen/subject split, Ptolemaic Egypt's **no imperial
electorate** (membership is **local/`polis` or corporate/temple**, with the
applicable **law keyed to status**), Seleucid local/subject layering, Macedon's
ethnic/assembly basis, Epirus's **federal dual citizenship**, Syracuse's **civic,
grantable** membership. **Five of the seven** sheets cannot be represented by a
single citizenship flag.

**Proposed mechanism (proposal to AD-25, extends N4/N5):** a
**political-membership model** that is *scoped, tiered and grantable*, never a
binary citizen flag.

1. **Scoped.** Membership is membership **of a specific community** (a city, a
   league, a kingdom, a tribe), not of a global "faction". A character may hold
   **several** memberships at once — **nested** (tribe + league; `polis` +
   kingdom) with rights at each level (supports N4/N5). **Do not assume
   Roman-style territorial administration or one franchise.**
2. **Tiered.** A community defines ordered or side-by-side **membership tiers**
   (full member, limited member, resident, subject, non-member).
3. **Attributes stored separately per tier** — the distinction the model must not
   collapse:
   - **Political rights** — vote (with weight/method), hold office, assemble,
     petition;
   - **Civil privileges** — applicable law/forum, property/trade (*commercium*),
     marriage (*connubium*), protection/appeal;
   - **Civic obligations** — registration/census, tax liability, liturgy;
   - **Military obligations** — service class (levy/naval/none) and basis;
   - **Office eligibility** — **distinct from political rights** (a person may
     vote yet be ineligible for office, e.g. a freedman);
   - **Applicable legal order** (supports C8 — parallel legal orders).
4. **Grantable and changeable.** Acquisition by birth, decree/enfranchisement,
   migration, manumission or grant; loss by *deditio*, enslavement, defection or
   lapse — each a **validated action** with provenance (ADR-0006), never a silent
   flag flip (supports N4).
5. **Rights ≠ obligations ≠ eligibility.** The model must represent a tier that
   has some and not others: citizenship without the vote; *commercium* without
   office; subjection with a heavy military obligation.

**Proposal, not closure.** The exact membership schema is **not** decided here.

### 6.4 Keep four dimensions separate

A subordinate relationship — and a membership tier — has **four distinct
dimensions** that must never collapse into one "subject/ally" value:

| Dimension | Question it answers | Where it lives |
| --- | --- | --- |
| **Legal authority** | Whose rule is recognised as valid over the tier? | Role holdings + government configuration (§4); the legal-action gate |
| **Political influence** | Does the tier actually comply, support or resist? | Character/relationship/factional state (§4.1 of AD-25); not a holding |
| **Geographic control** | Who physically holds, garrisons or administers the ground? | Mutable world state, separate from geographic *identity* (ADR-0020; `geography-integration-requirements.md` §3) |
| **Economic obligations/flows** | What tribute, dues or trade moves, and by whose authorisation? | The economic layer (AD-26) |

This mirrors the **identity / ownership / control** separation already applied to
geography, and keeps legal authority distinct from geographic control and from
economic obligation.

## 7. How the taxonomy stays stable (expandability)

- **New polity = pick a family + set configuration + list its subordinate
  tiers.** No new engine.
- **New institution = a new primitive proposal to AD-25**, recorded here and in
  [`r16-model-challenges.md`](r16-model-challenges.md), never a silent patch.
- **New date = a new sheet**, the taxonomy unchanged unless a genuinely new
  primitive is proven.
- **The families are deliberately few (F1–F7)** and overlap by design: real
  polities are **combinations** (e.g. a royal monarchy with a Greek `polis` tier
  = F2 + tier "`polis` inside a kingdom").

## 8. Open questions this taxonomy raises for AD-25 (proposals only)

1. **Sovereignty root** (§4) should be an explicit field of a government type —
   it is what decides *who may grant the top roles* (supports C1).
2. **Revocable/at-pleasure tenure** (§5) must be a first-class term value, not a
   missing/zero term (supports C2).
3. **Conditional assembly competence** is a **capability precondition** (assembly
   authority active only when a condition holds), not a separate body.
4. **Subordinate-community tiers** (§6) are relationships + delegated holdings on
   the *parent* polity's side, and the *tier's own* government on its side.
5. **Collegiality/veto** is a capability-level concurrency rule (AD-25 §6.1),
   reused for suffetes, archons, and any co-holder.
6. **Families compose** (RV0). A government type may be a **combination** of
   families — Epirus (**F3 + F2**), Syracuse (**F4** + a temporary crisis
   **F2**-like command) — making explicit what AD-25 §5 already implies: the
   **configuration**, not a single family, is the type.
7. **Indirect-influence / hegemony tier** (RV1, now proposed concretely in
   **§6.1**). The tier vocabulary must model not only **administration**
   (satrapy/province/nome) but an explicit
   **alliance/treaty/protectorate-without-administration** tier — a sphere or
   maritime hegemony where internal government stays with the subordinate.
8. **Tier obligation and privilege vocabulary** (RV2, now proposed concretely in
   **§6.2**). Subordinate tiers carry explicit **tribute / military-levy /
   garrison / access / alignment / labour** obligations and separate
   **privileges**, distinct from rights — the substance of subordination
   previously had no vocabulary.
9. **Tiered, local, grantable political membership** (RV3, now proposed
   concretely in **§6.3**). Separate **political rights / civil privileges /
   civic obligations / military obligations / office eligibility / applicable
   legal order** as distinct attributes of a **scoped** membership tier; a single
   citizenship flag is false for **five of the seven** detailed sheets.
10. **Four dimensions of subordination kept separate** (RV1/RV2/RV3, **§6.4**):
    **legal authority · political influence · geographic control · economic
    obligations** must never collapse into one "subject/ally" value.

> Every item above is a **proposal**. None is implemented; AD-25 remains open.
