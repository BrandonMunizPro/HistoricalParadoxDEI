# R-16 research sheet — Syracuse at 278 BCE

**Status: Research sheet (2026-10-14), part of R-16.** Produced with
[`political-institution-research-template.md`](political-institution-research-template.md),
including the extended areas **J.1** and **J.2**. Research evidence only; see
**§M** for candidate refinements. Parent program:
[`r16-world-political-institutions-program.md`](r16-world-political-institutions-program.md).

## A. Record header

- **Polity:** **Syracuse** (Greek *polis*), the leading Greek city of Sicily.
- **Date of record:** 278 BCE — Syracuse is **besieged by Carthage**, and the
  Syracusans (led by **Thoenon** and **Sostratus**) **invite Pyrrhus** to take
  command; he crosses from Italy in 278, is made **commander/king**
  (*strategos autokrator* / basileus in effect), and drives the Carthaginians
  back. The **Mamertines** (Campanian mercenaries) hold **Messana**. **Hiero II**
  is **not yet** in power (he rises after 275).
- **Government summary:** a Greek **civic *polis*** — an **assembly**
  (*ekklesia*), a **council** (*boule*), and **elected magistrates** including
  **generals** (*strategoi*) — with a long history of **tyranny interrupted by
  civic government**. After the death of the tyrant **Agathocles** (289) the
  city returned to a **republican/oligarchic** regime; at 278 it is unstable,
  faction-ridden, and under external siege, and it resolves the crisis by
  **appointing an external strongman** (Pyrrhus). This is the archetypal **civic
  *polis* + emergency autocracy** pattern (taxonomy F4 with a temporary F2-like
  layer).
- **Scope at the date:** Syracuse and a **Sicilian domain** over other Greek
  cities (and, historically, subject/garrisoned towns), contested with Carthage
  in the west and the Mamertines in the north-east.
- **Evidence base:** literary (Diodorus, Plutarch *Pyrrhus*, Justin, Polybius,
  later Cicero *Verrines* on the province — **date-drift**); **coins**; sparse
  inscriptions. **Date-drift warning:** much Syracusan constitutional detail
  comes from **earlier** (5th–4th c.) and **later** (Roman-period) sources; the
  278 form is reconstructed.
- **Sheet author / date:** R-16 research, 2026-10-14.

## B. Government structure (the bodies)

| Body / cluster | What it is | Composition | Selection | Function | Confidence |
| --- | --- | --- | --- | --- | --- |
| **Assembly** (*ekklesia*) | Citizen body in assembly | Adult male citizens | — | Elects magistrates/generals; decides major matters | **Likely** (inferred from general *polis* practice + narrative) |
| **Council** (*boule*) | Deliberative council | Selected citizens | Rotation/election | Prepares business; deliberation | **Likely** |
| **Generals** (*strategoi*) | Military commanders with civil weight | Elected | **Election by assembly** | Command; in crisis, supreme power | **Attested** (Pyrrhus made commander) |
| **Other magistrates** | Civic officers | Elected | Election | Finance, cult, law | **Reconstructed** |
| **Emergency command** (*strategos autokrator*) | Special plenipotentiary command | One | **Granted by the city** | Supreme military/civil authority in crisis | **Attested** (Pyrrhus) |
| **Priesthoods / cult** | Sacral offices | Priests | Hereditary/elected | Cult | **Likely** |

## C. Offices (the central table)

| Office | Role kind | Seats | Selection | Tenure | Legal capabilities | Checks | Confidence |
| --- | --- | --- | --- | --- | --- | --- | --- |
| *strategos autokrator* — supreme commander | Political office (extraordinary) + military command | 1 | **Granted by the assembly** | Crisis-bound (revocable in principle) | Command all forces; civil primacy in the emergency | The assembly that granted it | **Attested** (Pyrrhus) |
| *strategoi* — generals | Military command (+ political office) | Several | Election | Annual | Command, civic weight | Assembly; colleagues | **Attested** |
| *boule* membership | Institutional membership | Council body | Rotation/election | Term-bound | Deliberation, prepare decrees | — | **Likely** |
| assembly participant | Institutional membership | Citizen body | Birth (citizenship) | — | Vote, elect, decide | — | **Likely** |
| other magistrates (treasurers, *agoranomoi*, etc.) | Administrative/political | Varies | Election | Annual | local governance | Assembly | **Reconstructed** |
| priest | Religious office | Varies | Hereditary/elected | Varies | cult | — | **Likely** |

## D. Selection mechanisms

- **Generals and magistrates:** **elected** by the citizen assembly (the defining
  civic mechanism).
- **Emergency commander:** appointed by the **assembly/council** in a crisis
  (Pyrrhus), i.e. a **grant** of extraordinary power by the city — the same body
  that can, in principle, end it.
- **Council:** by rotation/election.
- **Citizenship:** hereditary and (importantly) **grantable** (mercenaries,
  metics, and whole communities were enfranchised historically — a recurring
  Syracusan tool).

## E. Tenure, terms and re-entry

- Ordinary magistracies: **annual**.
- Emergency command: **crisis-bound**, in principle revocable by the granting
  body.
- Tyranny (the older mode) is **not** the 278 form; the city is civic, but the
  emergency appointment is a **path** toward personal rule (as indeed happens
  later with Hiero II).

## F. Legal powers (capabilities)

- **Assembly:** `propose_law`, `convene_assembly`, `elect_office`, and
  `grant_emergency_command` (a notable capability — conferring the
  *autokrator*/*basileus*-like authority).
- **Emergency commander:** (temporary) full `command_army`, foreign policy,
  fiscal control — **delegated by the city**.
- **Generals:** `command_army` within limits.
- **Council:** prepare/concur; `propose_law`.
- **Priests:** `conduct_ritual`.

## G. Institutional checks

- The **assembly** and **council** are the institutional checks; in the crisis
  the city *chooses* to concentrate power (an act that later enables tyranny).
  Model the emergency grant as a **capability granted and revocable by the
  city**, and the tension between civic restraint and crisis concentration as
  ordinary politics — not a special "tyrant class".

## H. Military command authority

- Command lies with **elected generals**, superseded in 278 by the **supreme
  commander** (Pyrrhus). Forces: Syracusan citizen levies, **professional
  mercenaries** (a standing Syracusan feature), allied/subject Sicilian cities,
  and Pyrrhus' expeditionary army (Epirotes, Macedonians, elephants). Mercenaries
  are central to Syracusan military power and to its politics.

## I. Financial authority

- Revenue: civic taxation, harbour dues (Syracuse is a major port), the
  **Sicilian domain** (cities under Syracuse), mercenary pay from the fisc,
  and the famous Syracusan wealth. "Treasury = state" is unsafe-ish: civic
  treasury vs. royal/tyrant funds vs. temple (the great sanctuary of Athena/
  Demeter) are distinct — and the mercenary payroll is a distinct claim on
  funds. Feeds AD-26/R-15.

## J. Informal political influence

- Factional blocs (civic families), **mercenary commanders** and their
  clienteles, wealth, **demagogic** standing in the assembly, kinship to
  Agathocles' survivors, and the prestige of dealing with Carthage. Strictly
  separate from legal authority.

## J.1 Citizenship, social classes and political participation

- **Citizens** (male, adult) hold the franchise and eligibility; the body is
  **civic and local**, and is **expandable by decree** (Syracuse repeatedly
  **enfranchised** mercenaries and others). Classes/statuses: the **citizen
  body**; a wealthy **elite**; **metics/foreign residents**; large numbers of
  **mercenaries** (some enrolled as citizens); **non-citizens in the domain
  cities** (their own citizenship or none); and **slaves**. The **assembly** is
  the participation channel. This is a *polis* citizenship, not an imperial one.

## J.2 Relationships with subordinate communities

- **Sicilian Greek cities under Syracuse** (the Syracusan domain): varying
  degrees of autonomy, tribute, garrison, and citizenship grants — a
  **hegemony/tier** relationship, not a central government.
- **Subject towns and *katoikiai***: dependencies.
- **Allied Greek cities** (e.g. Akragas at times): alliance, not annexation.
- **The sanctuary/treasury of Athena/Demeter**: a distinct sacral institution.
- **Non-Greek populations** (Sicels/Sicanians; Carthaginian west): neighbours
  and enemies, not members.

## K. Formal vs. practical power (the honesty table)

| Office / body | Formal power | Practical power | Gap source | Confidence |
| --- | --- | --- | --- | --- |
| Assembly | Elect, decide | Real, but swayed by factions and crisis | Demagoguery; emergency | Likely |
| Elected generals | Command | Dominant in war; a path to personal rule | Military command + mercenaries | Attested |
| Emergency commander | Delegated supreme | Effectively king-like in the crisis | Necessity; concentration of command | Attested |
| Council | Deliberate | Real but secondary in crisis | — | Likely |
| Mercenaries | (no legal power) | Decisive coercive weight | Pay + commanders | Attested |

**Fit verdicts:** civic offices = **clean** (annual elective offices) · assembly/
council = **clean** (decision bodies) · emergency command = **clean-with-gloss**
(a **granted, revocable** extraordinary office) · mercenary weight = modelled as
**influence/coercion**, never authority.

## L. Mapping to RoleDefinition / RoleHolding / Authority

| Institution | RoleDefinition kind… | Held by… | Key derived capabilities | Fit problems |
| --- | --- | --- | --- | --- |
| Assembly | Institutional membership (**decision body**) | citizens | `propose_law`, `elect_office`, `grant_emergency_command` | Corporate grant capability |
| Council | Institutional membership | councillors | deliberate, prepare law | — |
| *Strategos autokrator* | Political office (extraordinary) + military | Pyrrhus | full command, delegated | Needs **grant+revoke** by the city (proposal) |
| *Strategoi* | Military command | elected generals | command | — |
| Other magistrates | Political/admin offices | elected citizens | local gov | — |

## M. Model challenges and refinement recommendations

| # | Evidence | Model strain | Candidate refinement (proposal only) |
| --- | --- | --- | --- |
| Y1 | City **grants extraordinary supreme command** | Grants are of ordinary offices | Support a **granted, revocable, crisis-scoped extraordinary office** |
| Y2 | **Citizenship is granted** by decree (enfranchisement) | Single membership flag | Grantable/tiered citizenship (area 8) |
| Y3 | Mercenaries are decisive but hold **no legal authority** | Coercion risk | Model as influence/coercion (AD-25 §4.1) — never capability |
| Y4 | Domain cities under Syracuse | Only central govt modeled | Subordinate-community tiers (taxonomy §6) |

## N. Anachronism checks (Syracuse, 278 BCE)

- **Hiero II is not yet ruler** (he is elected general later, made king ~269/
  265); do not place his kingship or his long regime at 278.
- **No Roman province of Sicily** (only from 241) and no Roman institutions.
- **Not a Carthaginian city** — it is the Greek city *resisting* Carthage.
- **No Mamertine control of Syracuse**; the Mamertines hold **Messana**.
- **Do not read the Roman-era *Verrine* civic picture** backwards to 278.
- **Pyrrhus' position is a crisis command**, not a settled hereditary kingship
  of Syracuse.

## O. Sources

- Primary literary: Diodorus Siculus; Plutarch, *Pyrrhus*; Justin; Polybius;
  (careful) Cicero, *Verrines*.
- Contemporary documentary: Syracusan and Sicilian coinage; sparse inscriptions.
- Modern scholarship: Sicilian Greek cities; Agathocles and the aftermath;
  Pyrrhus in Sicily; Hiero II's rise.
- Web references consulted: discovery references only (program §2).

## P. Open gaps / `needs-research`

- The **exact 278 constitution** (assembly/council composition and competences)
  — reconstructed from earlier and later evidence.
- The identity/roles of **Thoenon and Sostratus** and the factions they led.
- The **precise relationship** of Syracuse to its Sicilian domain cities at 278.
- Whether Pyrrhus held a formal title (king vs. *strategos autokrator*) at
  Syracuse in 278.
