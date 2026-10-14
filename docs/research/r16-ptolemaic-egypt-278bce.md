# R-16 research sheet — the Ptolemaic Kingdom at 278 BCE

**Status: Research sheet (2026-10-14), part of R-16.** Produced with
[`political-institution-research-template.md`](political-institution-research-template.md).
**Retrofitted 2026-10-14** with the extended areas **§J.1** and **§J.2**. This is
**research evidence**, not game content and not architecture. See **§M** for
candidate refinements. Parent plan:
[`../architecture/start-world-research-plan.md`](../architecture/start-world-research-plan.md).

## A. Record header

- **Polity:** the Ptolemaic Kingdom (Egypt under the Macedonian dynasty of the
  Ptolemies) — a **Hellenistic monarchy**.
- **Date of record:** 278 BCE, under **Ptolemy II Philadelphus** (co-regent 284,
  sole ruler 282). The **first Ptolemaia festival** (quadrennial, in honour of
  the deified Ptolemy I) falls at **279/278**. Greek and Egyptian legal practice
  begin to be formally "received" around this period.
- **Government summary:** a **personal monarchy** in which **the king *is* the
  state**: all offices are his grants, held **at his pleasure, without fixed
  terms**, exercised by an appointed bureaucracy and a royal court of "Friends,"
  over a subject population administered under **separate Greek and Egyptian
  legal orders**.
- **Scope at the date:** Egypt, Cyprus, Cyrenaica (influence), and Aegean
  possessions; a top-tier navy; rivalry with the Seleukids (the First Syrian War
  is a few years off).
- **Political community at the date:** **no imperial citizenship** — the king
  and house; a Greco-Macedonian elite/court; **local *polis* citizens** (Greek
  cities); Egyptian priests; and the mass of Egyptian **subjects**, all under a
  **plural legal order** keyed to status/ethnicity. See **§J.1** (membership)
  and **§J.2** (subordinate communities/tiers).
- **Evidence base:** contemporary **papyri** (the **Zenon archive**, 260s–250s —
  **date-drift**), inscriptions, coins; court poetry (Theocritus, Callimachus);
  later literary sources. Most administrative detail is reconstructed from the
  **mid-3rd century** and later, so claims about 278 carry a date-drift flag.
- **Sheet author / date:** R-16 research, 2026-10-14.

## B. Government structure (the bodies)

| Body / cluster | What it is | Composition | Selection | Convenes / is convened by | Core function | Confidence |
| --- | --- | --- | --- | --- | --- | --- |
| **The king** (*basileus*) | Sovereign | 1 (Ptolemy II) | Hereditary + co-regency + acclamation of the army/priests | — | Source of all authority; commander-in-chief; lawgiver | **Attested** |
| **The queen** (*basilissa*) | Royal consort | 1 (Arsinoe I at 278; Arsinoe II at court) | Royal marriage | — | Court influence, cult role; **no defined office** | **Attested / Contested** (which sister) |
| **The court "Friends"** (*philoi*) | Royal court / council of the king | Courtiers, generals, "kinsmen" | **Royal grant** | Summoned by the king | Advice, offices, command; honour | **Attested** |
| **Central administration** | Royal bureaucracy | *dioiketes*, *epistolographos*, *hypomnematographos*, *epi ton prostagmaton* | **Royal grant** | — | Finance, correspondence, edicts | **Reconstructed** (dated mainly to later 3rd c.) |
| **Nome (provincial) administration** | Local government | *strategos*, *oikonomos*, *nomarch*, *basilikos grammateus* | **Royal grant** | report to the king/dioiketes | Military, finance, agriculture, land records | **Reconstructed** (Zenon archive) |
| **Greek civic bodies** | *poleis* | Alexandria, (Naucratis; Ptolemais) | — | — | Civic life of Greek communities | **Attested / Reconstructed** |
| **Egyptian priesthoods** | Temple estates | Priests, synods | Hereditary, temple-based | — | Cult, landholding, local law | **Attested** |
| **Legal fora** | Courts | *dikasteria* (Greek); *laokritai* (Egyptian); *chrematistai* (royal — **later**) | appointed | — | Adjudication by population/order | **Attested / Reconstructed** |

## C. Offices (the central table)

| Office (native) | Office (translated) | Role kind | Seats / collegiality | Selection | Eligibility | Tenure | Legal capabilities | Checks on it | Confidence |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| *basileus* | king | **Sovereign (root role)** | 1 | Heredity + co-regency + acclamation | Royal house | **Lifetime** | All capabilities; grants every office | No formal check | **Attested** |
| *basilissa* | queen | Social rank / court role | 1 | Marriage | Royal house | Marriage-bound | None formal (influence only) | — | **Attested / Contested** |
| *philos* (pl. *philoi*) | "Friend" (court) | Social rank (court honour) | Many | **Royal grant** | Greek elite, often | At the king's pleasure | **None of its own** (access to office) | King | **Attested** |
| *dioiketes* | chief finance minister | Administrative appointment | 1 | **Royal grant** | Greek, senior | **Indefinite; revocable** | `authorise_spending` (within royal economy), `supervise_provinces` | King | **Attested** (office) / **Gap** (holder in 278: the better-known *Apollonius* served c. 262–245) |
| *oikonomos* | nome finance officer | Administrative appointment | 1 per nome | Royal grant | Greek | Indefinite; revocable | `levy_tax`, disbursement in the nome | **Mutual check** with *nomarch* and *basilikos grammateus* | **Reconstructed** |
| *nomarch* | nome agriculture officer | Administrative appointment | 1 per nome | Royal grant | Greek/Egyptian | Indefinite; revocable | `manage_land`, agricultural supervision | Mutual check | **Reconstructed** |
| *basilikos grammateus* | royal scribe | Administrative appointment | 1 per nome | Royal grant | Egyptian/local | Indefinite; revocable | `keep_land_records`, `keep_registers` | Mutual check | **Reconstructed** |
| *strategos* | nome governor | Administrative appointment + military command | 1 per nome | **Royal grant** | Greek, often military | Indefinite; revocable | `command_army` (nome troops), civil governorship | The king directly | **Reconstructed** (formalised mainly later; the 2nd-c. system is the date-drift caution) |
| *archisomatophylax / somatophylax* | chief bodyguard / bodyguard | Court office (military) | Few | Royal grant | Court elite | At the king's pleasure | Command of the guard; `protect(king)` | King | **Attested** |
| Priest (*hiereus*) | Egyptian/state priest | Religious office | Many | Heredity/temple | Egyptian | Hereditary/lifetime | `conduct_ritual`, temple estate | Synods | **Attested** |

**Aulic-titulature warning:** the full ranked ladder of court titles
(*syggeneus*, *homotimos*, *protos philos*, *diadochos*, etc.) is **formalised
later** (2nd century, esp. under Ptolemy V, 204–181). At 278, "Friends" and
"bodyguards" exist as **real functions**, not yet as a fixed honour ladder.

## D. Selection mechanisms

- **Everything is a royal grant.** Appointment to every office — court, central,
  provincial, military — is by the **king's unilateral decision**. There is **no
  election** of Ptolemaic officials, **no co-option**, and no citizen assembly
  with binding power over the central government.
- **The kingship itself** passes by **heredity**, reinforced by **co-regency**
  (Ptolemy II was co-regent from 284) and by **acclamation** of the army/priests.
- **Priesthoods** and some local roles are **hereditary/temple-based**.
- There is no *cursus honorum*, no minimum age, no fixed sequence: a royal
  favourite or a competent Greek could be granted a great office directly.

## E. Tenure, terms and re-entry

- **Indefinite and revocable:** Ptolemaic offices have **no fixed term**; they are
  held **at the king's pleasure** and can be revoked or reassigned at will. (This
  is the sharpest contrast with Rome's annual magistracies and Carthage's annual
  sufetes.)
- **Lifetime** for the king and (effectively) for priests.
- There is no iteration rule and no tenure limit, because there is no tenure.

## F. Legal powers (capabilities)

- **King:** the source of **all** capabilities — `command_army`, `declare_war`,
  `ratify_treaty`, `levy_tax`, `authorise_spending`, `propose_law` (as royal
  *prostagmata*), `appoint_office(any role)`, `conduct_ritual` (as head of the
  dynastic cult), `grant_status`.
- **Delegation:** every other office holds its capabilities **only as a
  delegation from the king** (`dioiketes` for finance, `strategos` for nome
  command, `dikastes` for judging, etc.). Capabilities are therefore **derived
  from the royal grant**, not from a fixed constitutional rank.

## G. Institutional checks

- **No check on the king.** There is no veto, no tribune, no assembly, no court
  above him.
- **Horizontal bureaucratic checks:** in each nome the *oikonomos*,
  *nomarch*, and *basilikos grammateus* are **equal-rank mutual checks**
  (finance/agriculture/records), each able to report independently — a
  **non-ranked** check among administrative appointees.
- **The army and the priesthood** are the real (extra-legal) constraints: revolt,
  a powerful general, or priestly/nativist discontent could constrain a king —
  modelled as **influence/coercion**, not legal authority (§4.1, N-12).
- **Legal pluralism** means a person is judged in the **forum of their order**
  (Greek *dikasterion* vs. Egyptian *laokritai*), a fact derived from the
  person/population, not a ranked court hierarchy.

## H. Military command authority

- The **king is commander-in-chief**; he delegates to *strategoi*, *philoi*, and
  the guard. Command is a **grant**, not an elected magistracy.
- Forces include **Macedonian/Greek and mercenary troops plus *kleruchoi***
  (military settlers holding land for service).
- A commander who acted against the king would be acting **outside legality**
  (architecture §4.1, N-12) — there is no granted capability to usurp.

## I. Financial authority

- **"Treasury = state" is *false* here.** The **royal economy** (*basilikon*) is
  the **king's household** finance, managed by the *dioiketes*; it is **not** a
  public treasury in the Roman sense.
- **Distinct funds** coexist: the royal treasury, **temple estates**, *kleruchic*
  land, and **private estates/business** (e.g. the Zenon archive's private
  accounts). The multi-account view is essential.
- Revenue: taxation (huge and varied), **royal monopolies**, land, and customs.

## J. Informal political influence

- **Court proximity and the king's favour** — the *philoi*, the guard, the royal
  household.
- **Kinship with the king** (the queen, the *syggeneis*) — a royal relative could
  be the most powerful person with **no office at all**. This is the clearest
  case for architecture §4.1: **influence without legal authority.**
- **Ethnicity (Greek vs. Egyptian)** as a practical gate to high office and to
  the applicable legal forum.
- **Wealth, landholding, and military command** as levers.
- **Priestly/nativist prestige** as a counterweight.

## J.1 Citizenship, social classes and political participation

**There is no Ptolemaic "citizenship" of the empire — and no imperial
electorate.** The kingdom is a **monarchy over heterogeneous populations**;
political membership is **local (of a *polis*) or corporate (a temple, a
*politeuma*)**, and above those the population is **subjects**. This is the
strongest counter-example to assuming a single citizenship flag.

| Status / order | Who | Political participation (**legal**) | Law / forum | Obligations | Confidence |
| --- | --- | --- | --- | --- | --- |
| **King & royal house** | The dynasty (Ptolemy II) | Sovereign — no participation, it *is* the state | Royal law | — | **Attested** |
| **Greek *polis* citizen** | Citizens of **Alexandria** (and Naucratis; Ptolemais later) | **Local civic** bodies (assembly/council/magistrates, gymnasium) — **under royal supervision** | **Greek law** (*dikasterion*) | Civic liturgy; loyalty | **Attested / Reconstructed** |
| **Greco-Macedonian elite / officeholders / *philoi*** | Court and bureaucracy | None at imperial level (royal grant) | Greek law | Service to the crown | **Attested** |
| ***Kleruchoi*** (military settlers) | Soldiers holding land for service | None | Greek (often) | **Military service for land** | **Reconstructed** |
| **Egyptian priests** | Hereditary temple caste | Internal temple/synod governance | Egyptian law (*laokritai*); temple courts | Cult; some dues (and privileges) | **Attested** |
| **Egyptian native (*laoi* / royal peasants)** | The mass of the population | **None** | **Egyptian law** | **Taxes, corvée/irrigation labour**, land dues | **Attested / Reconstructed** |
| **Other *politeumata*** (Jews, later groups) | Semi-autonomous associations | Internal (later evidence) | Own custom + royal law | Taxes, loyalty | **Uncertain** (mostly later) |
| **Slave** | Property | None | — | Labour | **Attested** |

**Participation** (area 8): the only real political participation is **civic and
local** — the **Greek *poleis***' assemblies and councils, and the **temple
order** — and both operate **within royal limits** (garrisons, royal officials,
the *strategos* as the king's man, royal approval). There is **no central
assembly** with binding authority over the crown.

**Legal privilege = which law applies.** The defining "privilege" is **forum**:
a person is judged by the **order/ethnicity** they belong to — **Greek
*dikasteria*** vs. **Egyptian *laokritai*** (and, later, the *chrematistai*).
Privilege is therefore **status-derived**, not a citizenship bundle (see §G,
§M/R4).

**Obligations are layered and unequal:** heavy, varied **taxation** and **corvée
labour** fall on Egyptian *laoi*; **military service** falls on Macedonians/
Greeks and *kleruchoi* (with native troops increasingly used later); **priests**
enjoy substantial exemptions and land. **Rights, obligations, and eligibility
sit on different orders**, and **eligibility for high office is a *practical*
(Greek/loyalty) matter, not a legal citizenship test** — the clearest example of
legal eligibility vs. practical access.

## J.2 Relationships with subordinate communities

The Ptolemaic kingdom **contains** many institution types that are **not** its
central government: cities, temple estates, military settlements, and overseas
hegemonies. Direct administration covers **Egypt**; **everything else is
hegemonic, garrisoned, or corporate**.

| Tier | Relationship type | How governed | Obligations | Privileges | Confidence |
| --- | --- | --- | --- | --- | --- |
| **Royal domain (*chora*) — Egypt** | **Direct administration** | **Nome bureaucracy**: *strategos*, *oikonomos*, *nomarch*, *basilikos grammateus* (royal appointees) | Taxes, corvée, land dues, troops | — (subjects) | **Reconstructed** (main evidence 260s–250s) |
| **Alexandria** | **Greek *polis* inside the kingdom** | Own civic bodies **under royal authority** + royal officials and garrison | Civic burdens; loyalty | **Local citizenship**; gymnasium; Greek law | **Attested / Reconstructed** |
| **Naucratis / (Ptolemais)** | **Greek *polis*** | Own civic bodies under royal oversight | Civic burdens | Local citizenship, trade | **Attested / Reconstructed** |
| **Egyptian temples** | **Corporate estate order** | Priestly synods, temple law, land; crown as patron/benefactor | Cult; dues (esp. the *apomoira*) | Land, exemptions, sacral authority | **Attested** |
| ***Kleruchic* land / military settlements** | **Land-for-service** grants | Royal grant to soldiers | **Military service** | Landholding | **Reconstructed** |
| **Cyprus** | **Overseas territory (direct-ish)** | Ptolemaic officials/garrisons; the island's cities as *poleis* | Tribute, troops, naval base | City autonomy | **Attested** |
| **Cyrenaica** (at 278) | **Dependent territory / hegemony — in flux** | Ptolemaic hegemony via a viceroy (**Magas**, Ptolemy's stepson); the Greek cities (Cyrene, Barca) | Tribute/alignment | City autonomy | **Attested / Contested** (**Magas breaks away c. 276**) |
| **Aegean / island possessions** | **Indirect (naval hegemony)** | Allied/garrisoned Greek cities; the *Nesiotic* sphere | Alliance, tribute, naval access | Local autonomy, protection | **Attested / Reconstructed** |

**Direct vs. indirect** (the required distinction): **direct administration =
Egypt** (via the nome bureaucracy); **indirect = Cyprus, Cyrenaica, and the
Aegean** (garrisons, viceroys, allied cities, naval hegemony); **corporate =
temples and *poleis* within Egypt**, which are **contained institutions**, not
government tiers. **Cyrenaica is the live uncertainty**: nominally Ptolemaic at
278, it is about to become independent under Magas (~276) — a case where
**political identity and actual control diverge** (relevant to the VS-5
identity≠control split).

**Uncertainty / date-drift.** The **Zenon archive (260s–250s)** is the main
administrative evidence and is **later** than 278; the *strategos/nomarch/
oikonomos* system at 278 is **Reconstructed**. The **Cyrene situation** is
**Contested**.

## K. Formal vs. practical power (the honesty table)

| Office / body | Formal power (rules) | Practical power (operation) | Source of the gap | Confidence |
| --- | --- | --- | --- | --- |
| **The king** | Sovereign; source of all authority | All real power (subject only to revolt) | Personal monarchy | **Attested** |
| **The queen** | No defined office | **High influence** via marriage and kin; can shape policy and succession | Court/kin influence (§4.1) | **Attested** |
| **The *dioiketes*** | Finance minister | Near–chief minister; could dominate the kingdom's administration | Control of the royal economy | **Attested** |
| **Nome officials** | Delegated local functions | Real local power, checked by peers, removable at will | Delegation + revocability | **Reconstructed** |
| **The *philoi*** | Court honour, no office | Access to the king → access to every office | Proximity | **Attested** |
| **Priests** | Cult and estates | Local authority and legitimacy; can mobilise natives | Land, cult, nativism | **Attested** |

## L. Mapping to RoleDefinition / RoleHolding / Authority

| Institution | RoleDefinition of kind… | Held by… | Key derived capabilities | Fit verdict |
| --- | --- | --- | --- | --- |
| The king | **Sovereign root role** | One | Everything; the **grantor** of all other roles | **Strained** — see R1 |
| The queen | Social rank (kin) | One | **None** formal; influence only | **Clean-with-gloss** (validates §4.1) |
| *Philoi* / court titles | Social rank (honour) | Many | **None** of their own | **Strained** — needs *capability-less* roles; see R3 |
| *Dioiketes* / *oikonomos* / *strategos* etc. | Administrative appointment | One each | Delegated capabilities (`authorise_spending`, `command_army`, `levy_tax` …) | **Strained** on tenure — see R2 |
| Priests | Religious office | Many | `conduct_ritual`, estate management | **Clean** |
| Legal fora (*dikasterion* / *laokritai*) | Judicial bodies | appointed judges | `judge(person)` per **order/population** | **Strained** — see R4 |
| Greek *polis* / Egyptian temple | Sub-state institutions | — | Contained, not central government | **Clean** (a polity may contain institution types that are not its government) |

## M. Model challenges and refinement recommendations

| # | Evidence | Model strain | Candidate refinement (proposal to AD-25 only) |
| --- | --- | --- | --- |
| R1 | The king is the **source** of all authority and the **grantor** of every office, not a holder derived from a government configuration (**Attested**) | A model that derives every role from a configuration has no place for a **root sovereign** | Allow a **sovereign/root role** that is the *grantor* of the government configuration itself, with **no external granting authority** (and whose source is history/succession) |
| R2 | Ptolemaic offices are **indefinite and revocable at the king's pleasure**, with no fixed term (**Attested**) | Tenure is modelled as terms (annual, lifetime, etc.) | Add a **tenure kind: "at the grantor's discretion (indefinite, revocable)"** |
| R3 | Court "Friends"/titles carry **status but no legal capability** (**Attested**) | Roles are often assumed to confer some capability | Permit **capability-less roles** (pure social rank / honour) as first-class RoleDefinitions |
| R4 | The kingdom runs **parallel legal orders** (Greek *dikasteria*, Egyptian *laokritai*; *chrematistai* later) (**Attested/Reconstructed**) | A single legal system is implicitly assumed | Allow a polity to hold **multiple legal orders keyed to population/status**, with the applicable forum a **derived fact** about the person and matter |
| R5 | The queen and royal kin wield **power with no office** (**Attested**) | — | **Validation:** architecture §4.1 already separates informal influence from legal authority; this is its strongest historical case |
| R6 | Nome officials are **equal-rank mutual checks** (**Reconstructed**) | Checks may be assumed to follow rank | Allow **non-ranked horizontal checks** between peer administrative appointees |
| R7 | **One grantor grants many roles, unilaterally and at will** (**Attested**) | Selection is modelled around election/co-option/custom | Support **unilateral grant** as a first-class selection route, with one grantor granting arbitrarily many roles |

## N. Anachronism checks (Ptolemaic Egypt, 278 BCE)

- **Do not** assume the **sibling marriage** of Ptolemy II and Arsinoe II
  (c. 273/2) or the **Theoi Adelphoi** dynastic cult (272/1); at 278 the dynastic
  cult honours Alexander and the **Theoi Soteres** (Ptolemy I), and **Arsinoe I**
  is (probably) still queen while **Arsinoe II has only just returned** (c. 279).
- **Do not** place **Apollonius** as *dioiketes* (c. 262–245) — he is later.
- The ***chrematistai*** are **not attested until 254** — do not include them.
- **Do not** impose the **2nd-century aulic-titulature ladder** (*syggeneus*,
  *homotimos*, etc.; formalised under Ptolemy V).
- The ***strategos*/*nomarch*/*oikonomos* system is documented mainly from the
  **260s–250s** (Zenon archive) — flag as date-drift.
- No **Roman-style offices**, no *imperium*, no *provocatio*, no senate, no
  "constitution."
- No **denarius**; use Ptolemaic coinage (gold, silver tetradrachms of the
  Ptolemy I type, bronze).

## O. Sources

- **Contemporary documentary:** the **Zenon archive** (*P.Cair.Zen.* and
  related) — nome administration, dated 260s–250s; Ptolemaic inscriptions and
  coins.
- **Primary literary:** **Theocritus, *Idyll* 17** (encomium of Ptolemy II —
  court ideology); Callimachus; Diodorus; later Justin/Pausanias.
- **Modern scholarship:** C. Préaux, *L'économie royale des Lagides*; M.
  Rostovtzeff, *The Social and Economic History of the Hellenistic World*; A.
  Bowman, *Egypt After the Pharaohs*; J. Manning, *Land and Power in Ptolemaic
  Egypt*; G. Hölbl, *A History of the Ptolemaic Empire*; E. Turner, *Ptolemaic
  Egypt*; J. Modrzejewski (Ptolemaic law); A. Samuel, *Ptolemaic Chronology*.
- **Web references consulted:** Wikipedia "Ptolemaic Kingdom", "Ptolemy II
  Philadelphus", "Dioiketes", "Arsinoe I / Arsinoe II"; Livius.org Ptolemaic
  articles.

## P. Open gaps / `needs-research`

- **Who held the *dioiketes*** at 278 (Apollonius is later).
- Whether **Arsinoe I** was still queen or already displaced in 278.
- The precise stage of the **nome administrative system** in 278 (the evidence is
  mainly 260s–250s).
- The **court-title hierarchy** actually in use at 278 (before its later
  formalisation).
- The **status of Egyptian law** at 278 (the "reception" is dated around this
  period but the exact mechanism is debated).
- The **exact civic constitution** of **Alexandria** at 278 (assembly/council/
  magistrates are attested in outline; details are reconstructed).
- The precise **taxation and corvée obligations** falling on Egyptian *laoi* at
  278 (the Zenon archive is later).
- **Cyrenaica's exact status** at 278 (Ptolemaic hegemony vs. near-independence
  before Magas' break c. 276).
