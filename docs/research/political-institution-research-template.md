# Historical political institution research template (R-16)

**Status: Proposal (2026-10-14).** A reusable template for documenting a polity's
political institutions at a fixed date of record, in a form that (a) stays
historically honest about what is attested, and (b) can be mapped onto the
proposed **RoleDefinition / RoleHolding / derived Authority** architecture
(AD-25) **without changing that architecture**.

This template implements **no code**, authors **no game content**, and **closes
no decision**. It is a research instrument. It exists so that every R-16 sheet is
directly comparable and so that model challenges surface as *evidence*, not as
opinions.

Related: [`../architecture/start-world-research-plan.md`](../architecture/start-world-research-plan.md)
(the plan), [`r16-world-political-institutions-program.md`](r16-world-political-institutions-program.md)
(the world program), [`../architecture/political-office-and-government-architecture.md`](../architecture/political-office-and-government-architecture.md)
(the architecture being mapped to), and
[`../architecture/assumptions-and-open-decisions.md`](../architecture/assumptions-and-open-decisions.md)
(R-16).

## The ten research areas (every sheet covers all ten)

| # | Research area | Template section |
| --- | --- | --- |
| 1 | Government structure and political institutions | §B |
| 2 | Offices, officeholders and appointments | §C, §D |
| 3 | Succession, elections and term limits | §D, §E |
| 4 | Legal authority and institutional checks | §F, §G |
| 5 | Informal influence and elite power | §J |
| 6 | Military command and mobilisation | §H |
| 7 | Treasury, taxation and spending authority | §I |
| 8 | Citizenship, social classes and political participation | §J.1 |
| 9 | Relationships with subordinate communities | §J.2 |
| 10 | Historical evidence, uncertainty and anachronism risks | §N, §O, §P (and the confidence labels throughout) |

## 0. How to use this template

1. Copy the section skeleton into a new file named
   `r16-<polity>-<year>bce.md` **inside this `docs/research/` directory**. The
   sheets are a **set** and live together; the start-world plan references them.
2. Fix a single **date of record** (here **278 BCE**) and refuse all evidence
   from a different date without an explicit *date-drift* note. Institutions
   change; a 4th-century description is not a 278 description.
3. Tag every claim with a **confidence label** (§0.1) and a source. A claim with
   no label is a defect.
4. Fill **§K (formal vs. practical power)** and **§M (model challenges)** honestly.
   These are the sections the architecture work depends on; do not soften them to
   fit the model.
5. In **§L (mapping)** describe how each institution *would* be expressed by the
   current architecture. If it cannot be expressed, say so in §M — do **not**
   redesign the architecture here.

### 0.1 Confidence vocabulary (use exactly these)

| Label | Meaning |
| --- | --- |
| **Attested** | A surviving ancient source states it, or it is directly evidenced by contemporary documents (papyri, inscriptions, coins). Cite the source. |
| **Reconstructed** | A modern scholarly inference from indirect evidence. Cite the scholar/argument. |
| **Contested** | Sources disagree, or scholars disagree about the reading. State both. |
| **Uncertain / gap** | Not resolvable from existing evidence. Mark `needs-research`; do **not** place it in the start-world. |
| **Anachronism risk** | A later institution, office, term or object that must **not** be back-projected to the date of record. |

### 0.2 Source-type vocabulary

Primary literary (e.g. Aristotle, Polybius, Livy, Diodorus, Plutarch, Justin);
contemporary documentary (papyri, inscriptions, coins); later literary (may
reflect later reality — flag it); modern scholarship (secondary — never the sole
basis for an **Attested** label).

## A. Record header

- **Polity:** <name, and the regime it currently is>
- **Date of record:** 278 BCE
- **Government summary (one sentence):** <e.g. "oligarchic republic with annually
  elected collegiate chief magistrates and a strong aristocratic council">
- **Territorial/structural scope at the date:** <what the polity is, what it
  contains, without importing later borders>
- **Evidence base:** <which source types carry the record, and their date-drift
  caveats>
- **Sheet author / date:** <name, 2026-10-14>

## B. Government structure (the bodies)

List every identifiable decision body and office-cluster, and how they relate
(who convenes whom, who is checked by whom). Distinguish the **central
government** from **sub-state institutions** the polity contains (civic bodies,
temple estates, allied communities) — a polity may contain institution types that
are *not* its central government.

| Body / cluster | What it is | Composition | Selection | Convenes / is convened by | Core function | Confidence |
| --- | --- | --- | --- | --- | --- | --- |

## C. Offices (the central table)

One row per office. `Kind` uses the proposed role-kind vocabulary (political
office / military command / religious office / administrative appointment /
social rank / institutional membership / property) — if a role does not fit any
kind, say so in §M rather than forcing it.

| Office (native name) | Office (translated) | Role kind | Seats / collegiality | Selection | Eligibility | Tenure | Legal capabilities | Checks on it | Confidence |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |

### C.1 Per-office detail (repeat per office that matters)

- **Native name(s) / translation:** <and any misleading Greek/Latin gloss to avoid>
- **Role kind:**
- **Selection (granted by whom, how):**
- **Eligibility (rank, age, prior office, wealth, kin):**
- **Tenure / term limit / re-entry:**
- **Collegiality (seat count; are holders equal?):**
- **Legal capabilities it confers:** <map to the §F capability names where possible>
- **Checks / vetoes / accountability it is subject to:**
- **Military command?** <yes/no/how>
- **Financial authority?** <yes/no/scope>
- **Informal influence it typically carries (separate from legal power):**
- **Confidence + sources:**
- **Anachronism notes:**

## D. Selection mechanisms

For each route to a role — election (and by which body, and how the vote was
taken), appointment, co-option, lot, inheritance, acclamation, usurpation —
describe it and who controls it. Note any **voting method** (open voice, division,
bloc/century/tribe) and any **secret-ballot** anachronism risk.

## E. Tenure, terms and re-entry

State tenures precisely where attested (annual, fixed-term, lifetime, at the
grantor's pleasure, hereditary), plus iteration/re-entry rules, and **explicitly
what is *not* attested at 278** (e.g. age ladders that postdate the record).

## F. Legal powers (capabilities)

Enumerate the concrete legal capabilities each office confers, using the
architecture's names where they fit: `raise_forces`, `command_army`,
`declare_war`, `ratify_treaty`, `levy_tax`, `authorise_spending(scope, limit)`,
`convene_assembly`, `veto`, `propose_law`, `conduct_ritual`,
`appoint_office(role)`, and any others needed. A capability is **legal
permission** only; note separately who/what supplies the *means* (§I) and the
*compliance* (§J).

## G. Institutional checks (veto, intercession, accountability, courts)

Describe: mutual veto between colleagues; intercession by a body or officer
(including officers of *lower* rank who nonetheless outrank others in a specific
way — note this, it matters for §L); the accountability regime for officials
(trial, audit, removal, capital consequences); and the courts/legal fora.

## H. Military command authority

Who holds command; is it unified with, or separate from, civil office; how
commanders are chosen; command duration; supervision from home; how coercive
force relates to legal authority (recall §4.1 of the architecture: coercion is a
route around the gate, not through it).

## I. Financial authority

Who authorises spending, who holds/custodies funds, who audits; whether
"treasury = state" is a safe assumption for this polity (usually it is **not**);
distinct public vs. royal vs. temple vs. private funds; revenue sources at the
date.

## J. Informal political influence

The extra-legal sources of power: noble families / gentilician blocs, patronage
and clientela, wealth, court proximity, kinship with the ruler, factional
alliances, military reputation, popular following, the crowd of the city. Keep
this **strictly separate** from legal authority (architecture §4.1).

## J.1 Citizenship, social classes and political participation

Who counts as a **member** of the political community, and on what terms: the
citizen body (and its degrees — full citizen, half-citizen, metic, freed,
slave), the franchise and how it is exercised; aristocratic/elite classes
(*patres*, *nobiles*, *Eupatridae*, the "better sort", the *philoi*); the
legal-status categories that gate office (area 2/8); non-citizen residents and
foreigners; and the distinction between **political participation** (voting,
assembly, office) and mere **residence or subjecthood**. Record who is *in*,
who is *out*, and by what rule — this is the eligibility substrate AD-25 needs.

## J.2 Relationships with subordinate communities

How the polity **contains** other communities, and what institution types exist
that are **not** its central government: provinces/satrapies and their governors;
subject cities and their charters; allied communities (*socii*, *foederati*);
tributary peoples; temple estates and their populations; *poleis* inside a
kingdom; tribal subdivisions. State the **obligations** (tribute, troops,
garrison) and **privileges** (internal autonomy, law, coinage) each tier holds,
and the mechanism by which the relationship is created, changed and ended. This
is the "a polity may contain institution types that are not its central
government" rule made concrete.

## K. Formal vs. practical power (the required honesty table)

The heart of the sheet. For each office/body, contrast what the *rules* say with
how power *actually* worked at the date.

| Office / body | Formal power (rules) | Practical power (in operation) | Where the gap comes from | Confidence |
| --- | --- | --- | --- | --- |

## L. Mapping to RoleDefinition / RoleHolding / Authority

State how each institution **would** be represented by the current architecture,
using its three concepts:

- **RoleDefinition** — name(s), kind, eligibility, granting authority, term,
  collegiality, powers, selection.
- **RoleHolding** — the mutable record (this character holds this definition,
  from when, granted by whom, until when).
- **Derived Authority** — the capability set computed on demand from holdings +
  government configuration + law + relationships + circumstances.

| Institution | Would be a RoleDefinition of kind… | Held by… | Key derived capabilities | Notes / fit problems |
| --- | --- | --- | --- | --- |

Close with a **fit verdict** per institution: *clean / clean-with-gloss /
strained / not-representable*.

## M. Model challenges and refinement recommendations

List every place the historical evidence pushes against the current model, and
for each: the evidence, why the model strains, and a **candidate refinement** —
phrased as a proposal to AD-25, never as a change made here.

| # | Evidence (attested/contested) | Model strain | Candidate refinement (proposal only) |
| --- | --- | --- | --- |

## N. Anachronism checks

The explicit list of later things that must not appear at the date of record for
this polity (institutions, offices, titles, objects, voting methods, legal
ladders, iconography). Add period-specific ones beyond the campaign-wide guards.

## O. Sources

- Primary literary: <author, work, passage>
- Contemporary documentary: <papyrus/inscription/coin>
- Modern scholarship: <author, work>
- Web references consulted: <links>

## P. Open gaps / `needs-research`

Everything that stayed **Uncertain / gap**, so the start-world generator knows
what not to assert.
