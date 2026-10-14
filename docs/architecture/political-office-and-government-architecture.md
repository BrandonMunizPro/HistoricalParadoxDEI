# Political office and government architecture

**Status: Proposal (2026-10-14).** This document decomposes *political office and
government* for the deeper political layer. It extends the intent of **E9**
(Offices, legitimacy, claims), **E10** (Culture/religion/government) and **E18**
(Mutable government and political transformation). It amends nothing already
approved and depends on **ADR-0011** (legitimacy, claims, internal conflict),
**ADR-0013** (content data for cultures, religions, government types),
**ADR-0018** (mutable government) and **ADR-0006** (single legal-action gate).

Open decision **AD-25** (office model shape) blocks implementation of anything
below; research **R-16** (per-polity institutions at 278 BCE) blocks content.

> **Direction approved 2026-10-14; decisions remain open.** The architectural
> direction — **RoleDefinition + RoleHolding + derived Authority** — is approved,
> with a refinement incorporated in **§4.1**: **legal authority** is explicitly
> distinguished from **informal political influence**, **economic leverage** and
> **military coercive power**. **AD-25 is not closed** until the schemas and the
> role-kind/capability vocabulary are finalised.

## 1. The problem this solves

The existing epic rows say offices are "world entities" with "eligibility
data-driven" (E9) and that two contrasting cultures must "express
authority/education/events via the same primitives" (E10). What has been missing
is the decomposition: **what is an office, what does holding one actually give a
character, and how does the same machinery express a Roman consulship, a
Carthaginian suffet, a Ptolemaic court title and a tribal war-leader without
special-casing any of them?**

## 2. Three distinct concepts (do not collapse them)

| Concept | What it is | Lifetime | Example |
| --- | --- | --- | --- |
| **Role definition** | Culture- and government-scoped *data* describing a role: its name(s), kind, eligibility rules, granting authority, term, powers granted, and whether it is collegiate, elective, hereditary or appointed | Immutable scenario content | "Roman consul", "Carthaginian suffet", "Ptolemaic *dioiketes*", "tribal war-leader" |
| **Role holding** | A **state record**: this character holds this role definition, from this SimTime, granted by this authority, under these conditions, until it ends | Mutable world state, with a life cycle | "Fabricius is consul for year X" |
| **Authority** | A **derived** capability vector: what this character can legally do *right now*, computed from all roles held plus government configuration, law, relationships and circumstances | Never stored as a single "power" number; derived on demand | "May raise a legion" / "May spend public money up to X" / "May convene the assembly" |

**Rule.** A role definition never grants anything by itself; only the **derived
authority** from the holdings a character actually has, evaluated against the
legal-action gate (ADR-0006), ever authorises an action.

## 3. Role kinds are *not* interchangeable

The political layer requires several kinds of role, and the engine must not treat
them as one thing. The kinds below are the proposed vocabulary (names
illustrative; AD-25 fixes them):

| Role kind | Nature | Typical length | Distinct behaviour |
| --- | --- | --- | --- |
| **Political office** | Elected or appointed public magistracy | Office-specific (annual for Rome/Carthage) | Confers legal authority; competes for a finite number of seats |
| **Military command** | Delegated command of forces | Campaign- or term-bound | Separate authority from office; often but not always held with one |
| **Religious office** | Sacral/priestly authority (pontifex, augur, flamen; temple offices) | Often for life | Confers sacral authority and legitimacy; not a route to military command |
| **Administrative appointment** | Delegated civil duty (fiscal, provincial, scribal) | Delegated, revocable | Delegated authority bounded by the grantor |
| **Social rank** | Standing by birth/class (patrician/plebeian, noble, citizen, metic, foreigner) | From birth | Gates eligibility for other roles; not "held" and not resignable |
| **Property / landholding** | Landed estates, mines, ships, trade shares | Alienable | Economic authority (see `economic-authority-architecture.md`); carries political weight |
| **Institutional membership** | Senate seat, council of elders, guild, *comitia* membership, gymnasium | Membership-bound | Source of voting/consultative authority (E13 institutions) |

**Consequence.** A single character can hold several kinds at once (consul +
imperium + augurate + landed wealth + Senate membership). Resignation, death or
loss of one kind does not automatically remove the others, and the engine must
compute the *resulting* authority rather than store "this person is powerful".

## 4. Authority derivation

**Proposal.** Authority is a **pure derivation** (a function, with projections
cached for performance only) over:

1. every role holding the character currently has, of every kind;
2. the faction's **government type** configuration (ADR-0013) and current laws;
3. the character's claimed/recognised **legitimacy** status (ADR-0011);
4. relationships and factional alignment (allies, patrons, dependants);
5. circumstances (in office? alive? physically present? at war?).

Output is a **capability set**: named capabilities such as
`raise_forces`, `command_army`, `declare_war`, `ratify_treaty`, `levy_tax`,
`authorise_spending(scope, limit)`, `convene_assembly`, `veto`, `propose_law`,
`conduct_ritual`, `appoint_office(role)`. Each capability is then the input the
legal-action gate (ADR-0006) uses to accept or reject a proposed action.

**Explainability is mandatory.** For any granted or refused capability the system
must be able to answer *why*: "allowed because holding R under government G with
law L", or "refused because the office is collegiate and the colleague has
not concurred". This is the perceivability law — power must never be an opaque
score.

**Non-interchangeability is enforced by the derivation, not by content.**
A war-leader's authority over warriors is not a magistrate's authority over
citizens; a priest's authority is not a general's. The same code path derives
both from different role definitions and government configurations.

### 4.1 Legal authority is not the only form of power (refinement 2026-10-14)

The four concepts below must be represented **separately** and never collapsed
into one "influence" or "power" score. Only the first feeds the legal-action gate.

| Concept | What it is | Where it lives | What it does | Does it authorise an action? |
| --- | --- | --- | --- | --- |
| **Legal authority** | Capabilities derived from role holdings + government configuration + law (ADR-0006) | Derivation over role holdings (§4) | The **only** input that makes an action legally valid | **Yes — it is the gate** |
| **Informal political influence** | Support, popularity, prestige, patronage networks, factional alignment, personal standing | Character/relationship state, factional blocs (E9/E14) | Changes *whether others obey, support or resist*; makes an otherwise-legal action politically easy, contested or dangerous | **No** — it cannot authorise; it conditions reaction |
| **Economic leverage** | Wealth, property, the ability to fund, pay, bribe, patronise | The economic layer (see `economic-authority-architecture.md`) | Provides the **material means** for an action and can buy influence/relationships; a legally authorised levy with no funds still cannot be paid | **No** — it enables or constrains means, not permission |
| **Military coercive power** | Command over forces plus their disposition to obey | Military command holdings (a role kind) + cohesion/loyalty (ADR-0016) | Can be used to act **outside** legality (a coup, intimidation); resolved by the gate as an **illegal/criminal** action (N-12), not as legitimate authority | **No** — coercion is a route around the gate, not through it |

**Rules that follow from the distinction**

1. **Only legal authority authorises.** A character can be the most influential,
   richest and best-armed person in the room and still be **refused** by the
   legal-action gate if they lack the role holding that grants the capability.
   Conversely, a poor, unpopular magistrate **can** lawfully act — and may fail
   in practice because influence and means are absent.
2. **Influence, wealth and coercion are inputs to *outcomes and reactions*, not
   permissions.** They determine whether others comply, whether a decree holds,
   whether troops march, and whether a rival can be bought or cowed — all of
   which are consequences computed *after* legality, not substitutes for it.
3. **Coercion is modelled as illegal action, not as a capability.** A general who
   overthrows the state is exercising military power *against* the gate; the gate
   classifies it under N-12 (illegal vs criminal actions). It must never be
   represented as a granted capability, or the game would confuse might with
   right.
4. **Contested authority is still legal authority, degraded.** A holding granted
   by a vacillating or illegitimate authority is a **legal** holding whose
   *recognised* strength is discounted per ADR-0011 — this is distinct from
   influence, which is not a holding at all.

**Explainability requirement (restated).** For any action the system must be able
to say which of the four was decisive: "refused — no legal authority", "allowed —
legal authority held, but support is low and it may be resisted", or "undertaken
outside the gate as an illegal action".

### 4.2 Four dimensions of a subordinate relationship (R-16 RV1/RV2/RV4)

R-16's seven sheets show that subordination is **not one variable**. When a polity
**contains** another community, the model must keep **four dimensions separate**,
exactly as §4.1 keeps four forms of power separate:

| Dimension | Question it answers | Where it lives |
| --- | --- | --- |
| **Legal authority** | Whose rule is *recognised as valid* over the community? | Role holdings + government configuration (§4, §5); the legal-action gate |
| **Political influence** | Does the community actually *comply, support or resist*? | Character/relationship/factional state (§4.1); never a holding |
| **Geographic control** | Who physically *holds, garrisons or administers the ground*? | Mutable world state, separate from geographic **identity** (ADR-0020; `geography-integration-requirements.md` §3) |
| **Economic obligations / flows** | What *tribute, dues or trade* moves, and by whose authorisation? | The economic layer (AD-26) |

**Rules that follow.**

1. **Recognition ≠ control ≠ compliance.** A suzerain may hold a **legal claim**
   over a community it does not **control** and whose people do not **comply**;
   and ground may be **controlled** (occupation, uprising) with no recognised
   legal authority at all. Identity / ownership / control stay separate, mirroring
   geography (ADR-0020).
2. **Obligations are duties, not capabilities.** A tribute or troop levy is a
   **duty imposed by the relationship**, recorded on the tier (R-16 RV2); it is
   enforced through the legal-action gate and the economic layer, and is never a
   capability *held* by either side.
3. **Do not assume Roman-style administration or one franchise.** Direct
   provincial administration is **one mode among several** — direct / hegemonic /
   corporate (R-16 RV1); and political membership is **scoped, tiered and
   grantable**, not a single citizen flag (R-16 RV3).

The concrete proposed vocabulary for these dimensions — administration-mode
tiers, obligation/privilege classes, and membership attributes — lives in the
research taxonomy,
[`../research/r16-institutional-taxonomy.md`](../research/r16-institutional-taxonomy.md)
§6.1–§6.4, **as a proposal to this decision, not a decision**.

## 5. Government as configuration, not as a class hierarchy

**Proposal.** A **government type** is scenario content (ADR-0013) consisting of:

- the set of role definitions available under it;
- for each role: **tenure** (annual, fixed-term, lifetime, hereditary),
  **collegiality** (how many seats), **selection** (election body, appointment
  authority, succession rule), **eligibility** (social rank, age, prior roles,
  term limits), and **powers granted**;
- the **decision bodies** that authorise corporate actions (a senate, an
  assembly, a court, a royal council), how they are convened, and which
  capabilities require their concurrence;
- the polity's **subordinate-community relationships** — each with an
  **administration mode** (direct / hegemonic / corporate) and its **obligation
  and privilege classes** (§4.2; R-16 RV1/RV2);
- the polity's **political-membership tiers** — what political rights, civil
  privileges, civic and military obligations, and office eligibility each tier
  carries, and how a tier is granted or changed (§4.2; R-16 RV3);
- the **rules for how it can change** (ADR-0018): which transformations are
  reachable, what institutional resistance exists, and recognition consequences.

This deliberately avoids a class hierarchy like "Republic → Rome". Rome and
Carthage both express as *oligarchic republics with annually elected
collegiate chief magistrates*, but their role definitions, decision bodies and
military-familial strand differ. **Shared primitives, culturally specific
expression** (blueprint §6).

## 6. Worked expressions (period-correct, R-16-dependent)

All three examples below must survive R-16 (anachronism-checked) before content
is authored. They are structural illustrations, not authored data.

### 6.1 Roman Republic at 278 BCE

- **Role definitions:** consul (2, annual, collegiate, elected by *comitia
  centuriata*), praetor, quaestor, censor (2, periodic), curule and plebeian
  aedile, tribune of the plebs (10, sacrosanct, veto), pontifex/augur/flamen,
  dictator (emergency, uncollegial, time-limited).
- **Decision bodies:** Senate (advisory but decisive in practice for foreign
  policy and finance), *comitia centuriata* (war, senior magistrates),
  *comitia tributa* / *concilium plebis* (laws, plebeian officers).
- **Distinctive capability:** **collegial veto** — a co-holder or tribune can
  block a capability. Model the veto as a capability-level concurrency rule, not
  as a special case of the consul role.
- **Anachronism guards (enforced at content level):** no codified cursus honorum
  ladder, no minimum-age sequence law, no permanent "province" magistracy (see
  `campaign-start-and-historical-timeline.md` §7).

### 6.2 Carthage at 278 BCE

- **Role definitions:** two **suffetes** ( annually elected chief magistrates ),
  military **generals** (separate, frequently dynastic in the Barcid era), the
  **council of elders** (*gerousia*), and the tribunal commonly called the
  **Hundred and Four**.
- **Distinctive feature:** a **quasi-dynastic military strand** where command
  and family prestige coexist with republican forms. Model as a normal set of
  role definitions plus strong property/kinship authority — not as a bespoke
  "Carthage class".
- **Uncertainty:** the *gerousia* and Hundred-and-Four descriptions come largely
  from a 4th-century-BCE Aristotle and later sources; their precise 278-BCE form
  is **uncertain** (R-16).

### 6.3 Ptolemaic Egypt at 278 BCE

- **Role definitions:** the **king** (uncollegial, sacral), court **"Friends"**
  (*philoi*) and bodyguards (*somatophylakes*), the **dioiketes** (finance
  minister — attested in the 3rd century; date of first office-holder needs
  R-16), nome **strategoi** / governors and royal **scribes**, plus **temple**
  and **priestly** bodies with their own estates.
- **Distinctive feature:** spending and fiscal authority flow **from the crown**,
  exercised by delegated appointees — i.e. the same capability model, but the
  grantor is the king rather than a senate. This is exactly why the economic
  layer must not assume "treasury = state" (see the economic document).
- **Greek civic layer:** Alexandria, Naucratis and (later) Ptolemais have
  *polis* institutions such as the gymnasium and *boule*; the model must allow a
  polity to contain **institution types that are not the central government**.

## 7. Life cycle of a role holding

A holding is created, evolves and ends through **validated legal actions**
(ADR-0006), never by a direct state write:

1. **Grant** — election, appointment, inheritance, co-option or usurpation,
   each a validated action with a granting authority and a provenance record.
2. **Exercise** — the derivation exposes capabilities; actions taken cite the
   holding that authorised them.
3. **Change** — promotion, resignation, prorogation (extension), suspension,
   loss of a prerequisite (e.g. loss of citizenship or faction membership).
4. **End** — term expiry (a state-reading scheduled trigger), death, deposition,
   government transformation (ADR-0018) or conquest. Ended holdings stay
   referenceable forever (ADR-0009 §3); they are never deleted.

**A grant model worth calling out:** appointments granted under a **vacillating
or illegitimate** authority remain records, but their *derived* authority is
reduced or contested per ADR-0011. The engine computes *how contested*, not a
boolean "legal/illegal".

## 8. Interaction with other systems

| System | Interaction |
| --- | --- |
| **E9 legitimacy/claims** (ADR-0011) | Office holding is a major *source* of legitimacy; competing claims arise from contested holdings |
| **E11 diplomacy** | Treaties/declarations require a capability from §4 and a provenance record |
| **E18 mutable government** (ADR-0018) | Government types *are* the role/decision-body configuration; transformation rewrites configuration, never character history |
| **E13 institutions** | Institutional membership is one role kind; institutions survive their founders |
| **E12 / economic authority** | Offices grant **spending authority** over defined treasuries/scopes (linked document); a subordinate tier's **tribute/dues** are economic **obligations**, distinct from legal authority (§4.2) |
| **E3 geography / control** | A tier's **geographic control** (who holds/garrisons the ground) is mutable world state, separate from legal authority and from geographic **identity** (ADR-0020) |
| **E5 knowledge** | Holding an office can grant **access to information** (a governor knows provincial intelligence); this is a knowledge-filter input, never a truth mutation |
| **E6 military** | Military command is a role kind distinct from political office (ADR-0015 command hierarchy) |
| **E16 Jev** | Jev may *reason* about offices and legitimacy; it may never grant a role or mutate authority |

## 9. Open decisions and research opened by this document

| ID | Item | Blocks |
| --- | --- | --- |
| **AD-25** | Office model shape: the exact Role-definition / Role-holding / derived-authority schemas, the role-kind vocabulary, how collegiality, veto and term expiry are represented, **the representation that keeps legal authority distinct from informal influence, economic leverage and coercive power (§4.1)**, and **the representation of subordinate-community relationships and political-membership tiers keeping legal authority / political influence / geographic control / economic obligations separate (§4.2)**. Direction approved 2026-10-14; **not closed** | E9, E10, E18 |
| **R-16** | Per-polity institutions at 278 BCE with anachronism checks; its subordinate-tier and membership refinement proposals (**RV1–RV3**, taxonomy **§6.1–§6.4**) feed §4.2 and §5 | E9, E10, content |
| **AD-26** | (linked) spending-authority representation shared with the economic layer; **tier tribute/dues as economic obligations** (§4.2) | E12, E19 |

## 10. Non-goals

- No implementation; no `src/` or `tests/` change.
- No approved ADR is rewritten; this is a proposal that depends on them.
- No forced government class hierarchy.
- No content authored before R-16 and AD-25.
- No "power score" stored in world state; authority stays derived.
