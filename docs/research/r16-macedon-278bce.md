# R-16 research sheet — Macedon at 278 BCE

**Status: Research sheet (2026-10-14), part of R-16.** Produced with
[`political-institution-research-template.md`](political-institution-research-template.md),
including the extended areas **J.1** and **J.2**. Research evidence only; see
**§M** for candidate refinements. Parent program:
[`r16-world-political-institutions-program.md`](r16-world-political-institutions-program.md).

## A. Record header

- **Polity:** Macedon (the Macedonian kingdom).
- **Date of record:** 278 BCE — a **kingship in contest**. Ptolemy Keraunos,
  king 281–279, was **killed fighting the Gauls** (279); Meleager and Antipater
  Etesias followed briefly; **Sosthenes** held effective power as commander
  (279–277) without taking the crown; **Antigonus II Gonatas** — son of
  Demetrius Poliorcetes, grandson of Antigonus I — was **not yet securely king**
  (he takes firm power and the title about 277/276, after defeating the Gauls at
  Lysimachia in 277). The Gallic invasion is the dominant fact.
- **Government summary:** the **traditional Macedonian kingship** — a personal
  monarchy whose king is acclaimed and, in crisis, made and unmade by the
  **assembly of Macedonians in arms** — supported by **Companions** (*hetairoi*),
  **Friends**, royal **pages** (*basilikoi paides*), a court, and the army. There
  is **no fixed institutional check** on the king; the *army assembly* is the
  decisive practical constraint, especially in a succession crisis.
- **Scope at the date:** the Macedonian homeland (with its cities), with claims
  over Thessaly, the Thracian coast, and Greece; the "fetters of Greece"
  (Corinth, Chalcis, Demetrias) are the strategic prizes of the Antigonid
  position. In 278 the homeland is **fragmented and raided**, not the stable
  Kingdom of the later Antigonids.
- **Evidence base:** literary (Diodorus, Justin, Plutarch *Demetrius/Pyrrhus*,
  Polybius on the Antigonid settlement); **inscriptions** (civic decrees, the
  "diagramma" of Philip V is **later**); **coins**. **Date-drift warning:** much
  detail on Antigonid institutions (the *diagramma*, the royal administration)
  is **Hellenistic-late**; the 278 court is reconstructed from earlier practice.
- **Sheet author / date:** R-16 research, 2026-10-14.

## B. Government structure (the bodies)

| Body / cluster | What it is | Composition | Selection | Function | Confidence |
| --- | --- | --- | --- | --- | --- |
| **The king** (*basileus*) | Sovereign war-leader and sacral head of the Macedonians | One | **Hereditary** within the royal house, **confirmed/acclaimed by the army assembly** | Command, law, foreign policy, patronage | **Attested** |
| **Army assembly** (*to plēthos tōn Makedonōn* — "Macedonians in arms") | The political body of the Macedonian people under arms | Adult male Macedonians mustered | Mustered by the king/commander | **Acclaims the king**; decides on major matters (treason, major policy) | **Attested** (its exact 278 role reconstructed) |
| **Companions / Friends** (*hetairoi* / *philoi*) | Elite warrior-aristocracy and court circle | Nobles | Royal favour + birth | Command, advice, court presence | **Attested** |
| **Royal pages** (*basilikoi paides*) | Sons of nobles serving the king | Young nobles | Selection by the king | Court service; a **school of the elite** | **Attested** |
| **Royal council** | Advisers the king summons | *Philoi* | Summoned | Deliberation | **Reconstructed** |
| **City civic bodies** (of Pella, Thessalonica, etc.) | *Polis* institutions inside the kingdom | Citizens of each city | Local civic organs | Local self-government | **Likely** (Antigonid city model mainly later) |

## C. Offices (the central table)

| Office | Role kind | Seats | Selection | Tenure | Legal capabilities | Checks | Confidence |
| --- | --- | --- | --- | --- | --- | --- | --- |
| *basileus* — king | Political office (sovereign root) | 1 | **Hereditary + army acclamation** | Life | Command army, foreign policy, appoint, judge, legislate | Army assembly (practical); rival claimants | **Attested** |
| *strategos* / *hegemon* — commander | Military command | Varies | Royal appointment | Campaign/at pleasure | Command forces in a theatre | The king | **Attested** |
| *hetairos / philos* — Companion/Friend | Social rank (court) | Many | Royal favour | At pleasure | Advise, fight, be eligible for command | The king | **Attested** |
| *basilikos pais* — royal page | Institutional membership | Corps | Royal selection | Youth/term | Court service | The king | **Attested** |
| city magistracies | Political office (local) | Varies | Local | Usually annual | Local governance | Civic bodies; the king | **Likely** |
| **priest/religious official** | Religious office | Varies | Appointment/hereditary | Varies | Cult | — | **Attested** (kingship is itself sacral) |

## D. Selection mechanisms

- **Kingship:** **hereditary** claim within the royal house **plus acclamation
  by the Macedonians in arms** — in a dispute or minority the army's voice is
  decisive (witness 279–277: several claimants, and a general who ruled without
  the title). This is a **dual (dynastic + popular-army) selection** that the
  architecture must express as more than plain hereditary succession.
- **Governors/commanders:** **royal appointment**.
- **Court and pages:** **royal selection**.
- **Cities:** local civic selection.

## E. Tenure, terms and re-entry

- **King:** life (ends by death or deposition — deposition is a live mode in
  278).
- **Commands and court posts:** at the king's pleasure.
- No annual magistracy of the Roman kind; the **army assembly** met on major
  occasions, not on a calendar.

## F. Legal powers (capabilities)

- **King:** `command_army`, `declare_war`, `ratify_treaty`, `levy_tax`(? — mainly
  royal domain + mines), `authorise_spending`, `appoint_office`, `judge`,
  `conduct_ritual`. Sovereignty root = the king-as-head-of-the-Macedonians.
- **Assembly of arms:** `acclaim_king` (a **grant** capability) and concurrence
  on certain capital/ treason questions — a corporate capability distinct from
  any individual magistrate's.
- **Commanders:** delegated `command_army` only.

## G. Institutional checks

- The **army assembly** is the one real institutional check, and only at
  moments of crisis (succession, treason). Otherwise the king is unchecked
  except by **practical** forces: noble factions, the army's willingness to
  follow, and rival dynasts. (Model the assembly's role as a **conditional
  capability**, not a permanent veto.)

## H. Military command authority

- War is the king's defining function. **The army *is* the political nation**:
  *hetairoi* cavalry, the **phalanx** (pezetairoi), hypaspists, mercenaries,
  light troops, and (from Alexander) elephants. In 278 the army is **fighting
  the Gauls**. Command authority is fused with kingship; generals are delegates.

## I. Financial authority

- Royal fisc from the **royal domain**, **mines** (the Pangaion/Thracian
  gold-silver), **timber**, **harbour dues**, and taxes/contributions from the
  cities and subject districts. "Treasury = state" is unsafe: the royal house,
  the temples, and the cities are distinct holders. **Spending is the king's.**

## J. Informal political influence

- Noble birth and *hetairos* standing; proximity in the **royal pages**/court;
  **military prowess**; command of a region or mercenary band; family networks
  among the **successor houses** (Antigonid ↔ Ptolemaic ↔ Seleucid marriages).
  Strictly separate from legal authority.

## J.1 Citizenship, social classes and political participation

- **"The Macedonians"** are the political people: adult males who serve as
  heavy infantry have the political voice of the **army assembly**. Below/around
  them: the **nobility** (*hetairoi*); **free non-Macedonian subjects** and
  **city Greeks**; large **subject populations** (Thracians, Paeonians, others);
  and **slaves**. Greek cities within the kingdom hold **local citizenship**.
  There is **no imperial electorate**; belonging to Macedon is ethnic/obedient,
  not a franchise.

## J.2 Relationships with subordinate communities

- **Macedonian cities** (*poleis*): local self-government under the king.
- **Subject districts and peoples** (Thracian, Paeonian, Illyrian border
  groups): tribute/levies.
- **Thessaly (claimed)**: a *koinon* under Macedonian hegemony.
- **Greek states (Corinth, Chalcis, Demetrias)**: garrisons and alliances — the
  "fetters of Greece" — an **alliance/garrison** tier rather than annexation.
- **Allied kings/dynasts** on the borders.

## K. Formal vs. practical power (the honesty table)

| Office / body | Formal power | Practical power | Gap source | Confidence |
| --- | --- | --- | --- | --- |
| King | Absolute | Limited by the army's willingness and noble factions | Personal kingship; no bureaucracy | Attested |
| Army assembly | Acclaims king; decides major matters | Decisive at succession; silent otherwise | Not a standing body | Attested |
| *Hetairoi* | Companionship | Command of armies, court weight | Birth + royal favour | Attested |
| City | Local autonomy | Real but subordinate to royal need | King's military demands | Likely |

**Fit verdicts:** king = **clean** (sovereignty root) · army assembly =
**clean-with-gloss** (needs a *grant* capability held by a corporate body) ·
*hetairoi* = **clean** (social rank + military command) · cities = **clean**
(local tier).

## L. Mapping to RoleDefinition / RoleHolding / Authority

| Institution | RoleDefinition kind… | Held by… | Key derived capabilities | Fit problems |
| --- | --- | --- | --- | --- |
| King | Political office (**root**) | the *basileus* | all | Root-grantor field (C1) |
| Army assembly | Institutional membership (**grant body**) | Macedonians in arms | `acclaim_king`, concur | Corporate grant capability (proposal) |
| *Hetairos*/*philos* | Social rank + military command | nobles | advise, command | Dual kind typical |
| *Basilikos pais* | Institutional membership | young nobles | court access | — |
| City magistracy | Political office (local) | civic citizens | local gov | tier |

## M. Model challenges and refinement recommendations

| # | Evidence | Model strain | Candidate refinement (proposal only) |
| --- | --- | --- | --- |
| M1 | King acclaimed by the **army assembly** | Model treats succession as dynastic only | Support **dual selection** (hereditary claim + corporate acclamation) |
| M2 | A **corporate body holds a grant capability** | Only individual holding-grants assumed | Allow **institutional membership** to hold a `grant_role`/`acclaim` capability |
| M3 | Kingship legitimately **contested/deposed** in 278 | Legitimacy often boolean | Contested authority as **degraded-but-legal** (ADR-0011, already supported) |
| M4 | No term; "at pleasure" posts | Term model | **Revocable tenure** (C2) |

## N. Anachronism checks (Macedon, 278 BCE)

- **Do not treat Macedon as a stable Antigonid kingdom at 278.** The kingship
  is **in contest**; the Gallic invasion is ongoing; do not presuppose Antigonus
  Gonatas as secure king or place a settled court.
- **No Philip V-era *diagramma*** or formalised royal administration (later).
- **No Argead dynasty** (extinct); the Antigonid claim is Heraclid but not yet
  institutionally fixed.
- **No Roman province, no *imperium* vocabulary.** Use Macedonian kingship
  terms.
- **No permanent standing bureaucracy**; the court is personal.

## O. Sources

- Primary literary: Diodorus Siculus; Justin; Plutarch (*Demetrius*, *Pyrrhus*);
  Polybius (later Antigonid settlement).
- Contemporary documentary: royal and civic inscriptions; royal coinage.
- Modern scholarship: Antigonid Macedon; the Gallic invasion of 279–277;
  Macedonian kingship and the army assembly.
- Web references consulted: discovery references only (program §2).

## P. Open gaps / `needs-research`

- The **exact 278 power-holder** and whether a regnal title was in force
  (Sosthenes ruled without the crown; sequencing of claimants is contested).
- The **composition/competence** of the army assembly at 278 (largely
  reconstructed).
- The state of the **royal administration** before the later Antigonid
  settlement.
- City-by-city autonomy at 278.
