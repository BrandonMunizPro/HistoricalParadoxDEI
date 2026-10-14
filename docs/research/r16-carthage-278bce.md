# R-16 research sheet — Carthage at 278 BCE

**Status: Research sheet (2026-10-14), part of R-16.** Produced with
[`political-institution-research-template.md`](political-institution-research-template.md).
**Retrofitted 2026-10-14** with the extended areas **§J.1** and **§J.2**. This is
**research evidence**, not game content and not architecture. See **§M** for
candidate refinements. Parent plan:
[`../architecture/start-world-research-plan.md`](../architecture/start-world-research-plan.md).

## A. Record header

- **Polity:** Carthage (*Qart-ḥadašt*), a commercial city-state with a maritime
  empire (North Africa, western Sicily, Sardinia, Iberian coasts).
- **Date of record:** 278 BCE — during the war with Syracuse/Pyrrhus. Carthage
  **besieged Syracuse** by land and sea in 278 and withdrew when Pyrrhus landed
  (Diodorus 22). The same years saw a Carthago-Roman accord (279/278) to aid each
  other against Pyrrhus and not to make separate peace.
- **Government summary:** a **mercantile-aristocratic republic** ruled by two
  annually elected chief magistrates (the *sufetes*), a powerful Senate, a
  self-co-opting **Council of One Hundred and Four** (high court and overseer),
  and a **popular assembly** that is normally bypassed but whose authority is
  triggered when the chief magistrates and the elders disagree.
- **Scope at the date:** the city and its *epikrateia*; directly ruled Libyans,
  subject cities, and allies (*socii*); a navy larger than Rome's.
- **Political community at the date:** a **citizen city** over a **subject
  dominion** — Carthaginian citizens (with a dominant "better sort"), then
  **non-citizen** Libyans, subject-city inhabitants, allied/clients (incl. the
  Numidians), and slaves. See **§J.1** (membership) and **§J.2** (the
  subordinate tiers).
- **Evidence base:** primary literary (Aristotle, *Politics* II.11 — **c. 330
  BCE date-drift**; Polybius 6.51–56 — **mid-2nd-century date-drift**; Diodorus;
  Justin); very few contemporary Punic documents. Every claim about the
  Carthaginian *constitution at 278* is at best **Reconstructed** from a 4th- or
  2nd-century description.
- **Sheet author / date:** R-16 research, 2026-10-14.

## B. Government structure (the bodies)

| Body / cluster | What it is | Composition | Selection | Convenes / is convened by | Core function | Confidence |
| --- | --- | --- | --- | --- | --- | --- |
| **Sufetes** (*špṭm*, "judges") | Two chief civil magistrates | 2, collegiate | **Elected by the popular assembly** | — | Head the state, preside, judicial head | **Attested** (Aristotle); **Contested** as to how much changed by 278 |
| **Senate** (*gerousia* / "the council") | Aristocratic council | Large (size not reliably attested) | From the "better sort" / ex-magistrates | Summoned by the sufetes | Deliberates; foreign policy, finance | **Attested** |
| **Council of One Hundred and Four** (the "Hundred") | High tribunal + oversight body | 104, chosen from the "better sort" | **Chosen by the pentarchies** | — | Judges generals after a campaign; supervises | **Attested** (Aristotle) |
| **Pentarchies** | Boards of five | Several boards of 5 | **Self-co-opting** ("they co-opt their own members") | — | Appoint the Hundred and "most of the great officers" | **Attested** (Aristotle) |
| **Popular assembly** | Citizen assembly | Citizens | — | Summoned by sufetes/senate | Decides **when** sufetes and elders disagree; elects sufetes and generals; sovereign when consulted | **Attested** |
| **Generals** (*rabbim* / Greek *stratēgoi*) | Military commanders | Varies | **Elected separately** by the assembly | — | Command armies/fleets, often abroad | **Attested** |

## C. Offices (the central table)

| Office (native) | Office (translated) | Role kind | Seats / collegiality | Selection | Eligibility | Tenure | Legal capabilities | Checks on it | Confidence |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| *špṭ* (pl. *špṭm*) | **sufes** (Greek *basileus*, "king"; Latin *rex* — both misleading) | Political office | **2**, collegiate | Elected by the popular assembly | Aristocratic/wealthy in practice | **Annual** | Civil head, judicial, presides, some religious | Colleague; Senate; assembly trigger | **Attested** |
| *rab* (pl. *rabbim*) | **general** | Military command | Varies | **Elected separately** by the assembly | Could rise from outside the elite | Campaign / indefinite | `command_army`, `command_fleet` | **Hundred and Four** (crucifixion on failure); recall | **Attested** |
| **Senator** | member of the council | Institutional membership / social rank | Large | Co-option/wealth | "Better sort" | Probably **lifetime** | `deliberate`, `advise` | — | **Attested / Reconstructed** |
| **Member of the Hundred** | judge/overseer | Judicial office (membership) | 104 | **By the pentarchies** | "Better sort" | Unknown (probably lifetime) | `judge`, `audit_officeholders` | Pentarchies / Senate | **Attested** |
| **Pentarch** | board member | Institutional membership | 5 per board | **Self-co-opting** | Leading families | Unknown | `appoint_office` (the Hundred and great offices) | None external | **Attested** |

**Gloss warning:** the Greek and Latin words for the *sufes* (*basileus*, *rex*,
"king") are **not** accurate translations — the office is annual and collegiate,
which no kingship is. Use the native term.

## D. Selection mechanisms

- **Sufetes and generals:** *elected* by the popular assembly (Aristotle). The
  generalship is **elected separately from the sufetate** — Carthage does **not**
  fuse civil and military headship the way Rome's consulship does.
- **The Hundred:** *chosen* by the **pentarchies**, not by the assembly.
- **Pentarchies:** *self-co-opting* — the boards fill their own vacancies.
  **This is the key structural oddity:** appointment to these bodies has **no
  external grantor**; the body grants itself.
- **The assembly's role is conditional:** Aristotle says that when the sufetes
  and the elders **agree**, the assembly is not consulted; when they **differ**,
  **the people decide**. So the popular sovereign is a *tie-breaker / final
  court* of last resort, not a routinely legislating body.
- **Voting method:** not reliably attested for the date.

## E. Tenure, terms and re-entry

- **Sufetes:** **annual**, collegiate (two).
- **Generals:** held for the duration of a command; not a fixed annual term.
- **The Hundred / pentarchies:** tenure **not reliably attested**; probably
  long/lifetime. **Uncertain / gap.**
- Re-entry and iteration rules are **not attested** at the date.

## F. Legal powers (capabilities)

- **Sufes:** `convene_senate`, `convene_assembly`, `propose_measure`,
  `iurisdictio`, civil headship; some religious function.
- **Senate:** `deliberate`, `advise`, `authorise_spending` (with the sufetes),
  foreign policy.
- **Hundred and Four:** `judge` (esp. `audit_officeholders` / try generals after
  a campaign).
- **Pentarchies:** `appoint_office` (the Hundred and "most of the great
  officers").
- **Generals:** `command_army`, `command_fleet`, `raise_forces` (subject to
  home authorisation).
- **Popular assembly:** `elect_office` (sufetes, generals), `decide` **when
  sufetes and elders disagree**.

## G. Institutional checks

- **Collegiality** of the sufetes (mutual block).
- **The Hundred and Four** as an **accountability court** over generals — the
  notorious mechanism by which a defeated commander could be condemned to
  **crucifixion**.
- **Pentarchies over appointments**, giving a small self-perpetuating group
  control of who reaches the great offices.
- **The assembly as a constitutional court of last resort** on elite deadlock.
- There is **no attested tribune-like popular officer** and no *provocatio*.

## H. Military command authority

- Command is **separate from civil headship**: generals are elected on their own.
- Commanders are **supervised from home by the Hundred and Four**, under threat
  of capital punishment. The command relation thus includes a **severe
  accountability consequence**.
- The **navy is the senior arm**; the 278 Syracuse operations and the 279 Ostia
  embassy (a fleet of ~120 ships) show naval primacy.
- Coercion by a commander against Carthage itself would be outside legality
  (architecture §4.1, N-12).

## I. Financial authority

- Revenues: **customs/port dues, tribute from subject Libyans and Sardinians,
  the "tithe of the harbours," and commerce**. The state's finances and the
  wealthy merchant houses' private fortunes are **distinct** — again the
  multi-account view, not "treasury = state."

## J. Informal political influence

- **Great families and merchant houses** dominate office (later the Magonids and
  then the Barcids; at 278 the leading houses of the Hanno/Hamilcar factions).
- **Wealth from trade** as the practical gate to the sufetate and the "better
  sort."
- **Faction** (pro-Roman vs. anti-Roman, Syracusan-war parties) and the
  **assembly's crowd** as a lever when elites split.
- **Military reputation** (esp. naval) as a route to influence and to the
  generalship.
- Keep all of this **separate from legal authority** (architecture §4.1).

## J.1 Citizenship, social classes and political participation

**Carthage has a sharp citizen/subject split.** *Carthaginian citizenship* is
the franchise of the **city** (Qart-ḥadašt) only; the **overwhelming majority of
the people it ruled — the Libyans, the subject cities, and the overseas
populations — were NOT citizens** but tributaries and levies. This is the
opposite of a universal-franchise assumption.

| Status | Who | Political rights (**legal**) | Obligations | Eligibility for office | Confidence |
| --- | --- | --- | --- | --- | --- |
| **Carthaginian citizen** | The citizen body of the city | Vote in the **popular assembly** (elects sufetes and generals; decides on elite deadlock) | Civic service; naval/garrison duty in some form | **Yes** (in practice, the wealthy/"better sort") | **Attested** (Aristotle) |
| **The "better sort"** | Wealthy elite of leading families | Same franchise; **dominates** the Senate, Hundred, and pentarchies | Liturgies of command and office | **Yes — effectively the pool** | **Attested / Reconstructed** |
| **Freedmen / clients / dependents** | Manumitted and dependent populations tied to elite households | **None** (dependent) | Service to patrons | **No** | **Uncertain** (later evidence) |
| **Resident foreigner / metic** | Greek and Italian traders, resident aliens | **None** | — | **No** | **Uncertain** |
| **Libyan subject** (*epikrateia*) | Indigenous North Africans of the ruled territory | **None** | **Tribute** (heavy) and **troop levies** | **No** | **Attested / Reconstructed** |
| **Subject-city inhabitant** | Utica, Hippo, Hadrumetum, the Punic/Sicilian/Sardinian towns | **No** Carthaginian vote (their own local government remains) | **Tribute**, ships, troops | **No** (Carthaginian office) | **Attested / Reconstructed** |
| **Allied peoples (*socii*) & Numidian communities** | Treaty/client tribes and kingdoms (Numidians, etc.) | **None** Carthaginian | **Troops** (especially cavalry) by treaty/clientage | **No** | **Attested** |
| **Slave** | Property | **None** | Labour | **No** | **Attested** |

**Political participation** (area 8): the **only** channel is the **popular
assembly**, and it is **conditional** — Aristotle says it is sovereign when the
sufetes and the elders **disagree** (a fallback court), and it also **elects the
sufetes and generals**. So participation is real but **not routine**; there is no
standing legislative role. **Carthage has no attested procedure resembling
Roman *provocatio*, and no tribune-like popular officer** (see §G).

**The military dimension is the crux** (and a key contrast with Rome): Carthage
at 278 relied above all on **mercenaries**, **Libyan levies**, and **allied /
Numidian troops**, with **Carthaginian citizens** concentrated at sea and in
command. So **military obligation falls heavily on non-citizens**, while
political rights do not — a structural tension that later explodes in the
**Mercenary War / Libyan revolt (241–237)**. **Civic rights, civil privileges,
and military obligations lie on different tiers** — the distinction the model
must hold.

> **Anti-assumption note.** Do **not** import Roman franchise vocabulary: there
> is no "Carthaginian citizenship for Italy" analogue. The Libyans are **tribute
> subjects**, not citizens; the Numidians are **allies/clients**, not subjects.

## J.2 Relationships with subordinate communities

Carthage is the **clearest two-tier extractive state** in the 278 set: a
citizen **city** ruling a **dominion** (*epikrateia*) of tributary populations
and allied/subject cities, **directly in Africa and indirectly overseas**.
Unlike Rome, its rule was **not** extended through a franchise ladder; it was
**tribute + troops + monopoly**, without integration.

| Tier | Relationship type | How governed | Obligations | Privileges | Confidence |
| --- | --- | --- | --- | --- | --- |
| **The city of Carthage** | The sovereign citizen-state | Own magistrates (sufetes), Senate, Hundred, assembly | — | Full citizenship | **Attested** |
| **Libyan *epikrateia*** (Africa) | **Direct domination** | Carthaginian officials/overseers; land worked under Carthaginian claim | **Tribute** (heavy), **troop levies**, land burdens | None (subjects) | **Attested / Reconstructed** |
| **Punic subject cities** (Utica, Hippo, Hadrumetum, etc.) | **Dependent city** | Own local government **under** Carthaginian hegemony | Tribute, ships, troops | Internal autonomy; local cult/law | **Attested** |
| **Allied communities (*socii*)** | **Treaty/client** | Own government | Troops/ships by treaty | Autonomy; trade access | **Attested / Reconstructed** |
| **Numidian peoples/kingdoms** (Masaesyli, Massylii) | **Allies / clients** (sometimes rivals) | **Independent** rulers | **Cavalry** and alliance; diplomatic alignment | Sovereignty; marriage/dynastic ties to Carthage | **Attested** |
| **Western Sicily** (Punic *epikrateia*) | **Direct/indirect mix** | Punic officials, garrisons, and subordinate Greek/Elymian/Sican communities | Tribute, troops, port access | Local self-rule where retained | **Attested** (Diodorus) |
| **Sardinia** | **Direct control + subject interior** | Punic coastal cities + control of interior peoples | Tribute, grain, troops | — | **Attested / Reconstructed** |
| **Balearics / Iberian coastal colonies** (Gades et al.) | **Trading outposts / allies** | Punic/commercial settlements | Trade, naval access | Commerce | **Reconstructed** |
| **Tripolitanian emporia** (Oea, Lepcis, Sabratha) | **Dependent/allied trading towns** | Local rule under Punic commercial dominance | Tribute/trade | Trade | **Reconstructed** |

**Direct vs. indirect** (the required distinction): Carthage **administers
directly** only in **Africa (the *epikrateia*)** (and, more loosely, parts of
western Sicily and Sardinia); it rules **indirectly** through **subject cities**,
**allied communities**, and **client/tributary peoples and kings** (the
Numidians). The relationship is sustained by **tribute, trade monopoly, and
military levies**, not by shared citizenship — which is why the system was
**extractive, brittle, and prone to revolt**. At 278 it is intact and funding
the war against Syracuse/Pyrrhus.

**Uncertainty.** There is **no contemporary Punic document** describing the 278
imperial administration; the structure is inferred from **Aristotle (c. 330,
date-drift)**, **Polybius (2nd-c. date-drift)**, **Diodorus**, and the *later*
revolt evidence. Every tier's precise 278 form is **Reconstructed** (see §P).

## K. Formal vs. practical power (the honesty table)

| Office / body | Formal power (rules) | Practical power (operation) | Source of the gap | Confidence |
| --- | --- | --- | --- | --- |
| **Sufetes** | Chief civil/judicial magistrates | Powerful but hedged by the Senate and by the Hundred | Collegiality, elite council, oversight | **Attested** |
| **Senate** | Deliberative council | The real steering body; brokers appointments through the pentarchies' orbit | Wealth, lifelong membership, "better sort" | **Attested / Reconstructed** |
| **The Hundred** | Court/oversight | Feared instrument of accountability over generals | Power to try and execute commanders | **Attested** |
| **Pentarchies** | Boards of five | **Control the great appointments** via self-co-option — a hidden oligarchic core | Self-perpetuation, no external grantor | **Attested** |
| **Popular assembly** | Sovereign in deadlock; elects sufetes/generals | Usually passive; decisive only when elites split; can be swayed | Conditional authority, elite brokerage | **Attested** |
| **Generals** | Elected commanders | Autonomous in the field, but answerable with their lives at home | Distance + Hundred's tribunal | **Attested** |

## L. Mapping to RoleDefinition / RoleHolding / Authority

| Institution | RoleDefinition of kind… | Held by… | Key derived capabilities | Fit verdict |
| --- | --- | --- | --- | --- |
| Sufes | Political office (2 seats, annual, elected) | Two per year | `iurisdictio`, `convene_senate`, `convene_assembly` | **Clean** |
| General | **Military command** (separately elected) | One per command | `command_army`, `command_fleet` | **Clean** (validates a distinct military-command kind) |
| Senate | Decision body | Members | Corporate deliberation/concurrence | **Clean** |
| The Hundred | Decision body **+ judicial office** (membership) | 104 | `judge`, `audit_officeholders` | **Clean-with-gloss** (one body is both tribunal and overseer) |
| Pentarchies | **Self-granting appointment body** | 5 per board | `appoint_office(the Hundred, great offices)` | **Strained** — see R2 |
| Popular assembly | Decision body with **conditional** authority | Citizens | `elect_office`, `decide_on_deadlock` | **Strained** — see R3 |
| Great family / merchant house | Social rank / influence (not a legal role) | From birth | Gates practical access to office | **Clean** (influence, §4.1) |

## M. Model challenges and refinement recommendations

| # | Evidence | Model strain | Candidate refinement (proposal to AD-25 only) |
| --- | --- | --- | --- |
| R1 | The **generalship is elected separately** from the sufetate; there is no consular fusion of civil + military headship (**Attested**) | A model that assumes "chief magistrate = army commander" would mis-describe Carthage | **Validation + explicit note:** keep civil office and military command as **distinct role kinds**; never derive military command from civil office as a rule |
| R2 | The **pentarchies co-opt their own members** and appoint the Hundred and most great officers (**Attested**) | The architecture's granting model presumes an external granting authority | Allow a RoleDefinition whose **granting authority is the same body that holds it** (self-co-option) — a first-class "co-optation" selection route with no external grantor |
| R3 | The **popular assembly** is sovereign **only when the sufetes and elders disagree** (**Attested**) | A decision body is usually modelled as unconditionally competent | Allow a decision body's authority to be **conditional on another body's deadlock** (a triggered/fallback competence) |
| R4 | The Hundred may condemn a defeated general to **death** (**Attested**) | Accountability is modelled, but the *severity* and *mechanism* of an oversight tribunal may not be | Represent oversight courts as bodies/offices with `audit_officeholders` and an extreme consequence — **content**, not mechanic |
| R5 | Generals could rise from **outside the elite** (**Attested / Reconstructed**) | Eligibility is often assumed to be elite-bound | Keep eligibility **permissive** where the evidence permits; elite access is an *influence* fact, not a legal gate |
| R6 | Greek *basileus* / Latin *rex* are **wrong glosses** for *sufes* (**Attested mistranslation in the sources**) | Naming and content could import kingship or the consulship by accident | **Content hygiene:** store the native name; forbid consular/regal glosses in authored content |

## N. Anachronism checks (Carthage, 278 BCE)

- Do **not** call the sufetes **kings** (*rex*/*basileus*) or **consuls**.
- Do **not** call the Hundred the **Senate**, or the Senate the Roman Senate.
- Do **not** assume the later **Barcid** ascendancy (Hamilcar/Hannibal is
  decades later); at 278 the parties are earlier ones.
- Do **not** import **Roman vocabulary** (*imperium*, *provocatio*, tribunes,
  provinces) onto Carthage.
- No **written law code** is attested at the date; treat law as customary.
- **Do not** present 278 institutions as certainly unchanged from Aristotle's
  c. 330 account (date-drift) or Polybius' 2nd-century one.

## O. Sources

- **Primary literary:** **Aristotle, *Politics* II.11 (1272b–1273b)** — the core
  description (Hundred and Four "like the ephors," self-co-opting boards of
  five, assembly deciding on disagreement, election of "kings" and generals);
  **Polybius 6.51–56** (the decline narrative — date-drift); **Diodorus** 22
  (the 278 Syracuse campaign); **Justin** 24.
- **Modern scholarship:** B. H. Warmington, *Carthage*; S. Lancel, *Carthage: A
  History*; D. Hoyos, *The Carthaginians*; R. Miles, *Carthage Must Be
  Destroyed*; W. Huss, *Geschichte der Karthager*.
- **Web references consulted:** Wikipedia "Ancient Carthage"; "Suffet";
  Livius.org "Carthage" articles.

## P. Open gaps / `needs-research`

- The **exact composition and size of the Senate** at the date.
- The **tenure** of the Hundred and of the pentarchies.
- Whether the **c. 330 structure** (Aristotle) still obtained in **278**.
- The **name of the Carthaginian commander** at the 278 siege of Syracuse (the
  ancient source does not name him).
- The precise **voting procedure** in the popular assembly.
- The **exact administrative machinery of the *epikrateia*** at 278 (officials,
  tribute rates, land claims) — inferred from later evidence; **no contemporary
  Punic document** describes it.
- The precise **status of the Numidian kingdoms** relative to Carthage in 278
  (ally vs. client vs. tributary varies over time and by group).
- Whether **Libyan subjects** owed a fixed tribute rate at 278 (the later
  half-of-produce figure is 241–237 evidence and may not back-date).
