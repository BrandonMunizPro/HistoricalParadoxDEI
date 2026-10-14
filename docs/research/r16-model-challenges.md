# R-16 — consolidated model challenges and refinement recommendations

**Status: Proposal (2026-10-14), part of R-16.** This consolidates the
"model challenges" sections of the three R-16 sheets into one place. It is a
**proposal to AD-25 only** — it changes no architecture, closes no decision, and
implements nothing. AD-25 remains **OPEN**.

Sources: [`r16-rome-278bce.md`](r16-rome-278bce.md) (R1–R6),
[`r16-carthage-278bce.md`](r16-carthage-278bce.md) (R1–R6),
[`r16-ptolemaic-egypt-278bce.md`](r16-ptolemaic-egypt-278bce.md) (R1–R7), and
(from 2026-10-14) the four T1 sheets:
[`r16-seleucid-278bce.md`](r16-seleucid-278bce.md) (S1–S5),
[`r16-macedon-278bce.md`](r16-macedon-278bce.md) (M1–M4),
[`r16-epirus-278bce.md`](r16-epirus-278bce.md) (E1–E4),
[`r16-syracuse-278bce.md`](r16-syracuse-278bce.md) (Y1–Y4), and the cross-sheet
audit [`r16-sheet-consistency-review.md`](r16-sheet-consistency-review.md)
(RV0–RV3). The
model being tested: [`../architecture/political-office-and-government-architecture.md`](../architecture/political-office-and-government-architecture.md)
(RoleDefinition / RoleHolding / derived Authority).

## 1. Why these three polities

| Polity | Why load-bearing for AD-25 |
| --- | --- |
| **Rome** | The hardest case for collegiality, veto and term rules; the source of most modern intuitions the model must *not* over-apply. |
| **Carthage** | A non-Roman republic with a **civil/military split**, self-co-opting bodies, and a conditional assembly — tests assumptions the Rome case cannot. |
| **Ptolemaic Egypt** | A **personal monarchy** with revocable offices, honour-without-office, and parallel legal orders — the strongest contrast to both republics. |

## 2. What the model already handles (validations)

| # | Finding (across sheets) | Verdict |
| --- | --- | --- |
| V1 | A person may hold **several roles at once** (consul + augur; general + courtier) | §3 already supports it — **no change** |
| V2 | **Informal influence** (patronage, court/favour, kin) is non-authorising | §4.1 already separates it — Rome §J, Carthage §J, Ptolemaic R5 |
| V3 | **Social rank** gates eligibility (patrician/plebeian; Greek/Egyptian "better sort") | Social-rank kind already exists — **no change** |
| V4 | **Prorogation** (Rome) extends a holding rather than creating a role | §7 already names it — **no change** |

## 3. Candidate refinements (proposals to AD-25, not changes)

Ordered roughly by how load-bearing they are. "Source" points to the sheet §M row.

| # | Candidate refinement | Evidence for it | Source |
| --- | --- | --- | --- |
| **C1** | **Sovereign / root role.** Allow a role that is the **grantor of the government configuration itself**, with no external granting authority (source = succession/history). | Ptolemy II: king is the source of all authority and grantor of every office. | Ptolemaic R1 |
| **C2** | **Tenure: "at the grantor's discretion" (indefinite, revocable).** Add a tenure kind for offices with **no fixed term**, held and revoked at the grantor's will. | Ptolemaic offices are all revocable, indefinite. | Ptolemaic R2 |
| **C3** | **Capability-less roles.** Permit pure **social-rank / honour** RoleDefinitions that confer **no legal capability** (the *philoi*, court titles; also patrician/plebeian). | Ptolemaic court "Friends"; Roman social rank. | Ptolemaic R3 |
| **C4** | **Explicit veto capability, independent of rank.** `veto` is an **explicitly granted capability** whose scope/strength is data on the definition, **not** a function of office precedence. | Roman tribune (no magisterial rank) vetoes every magistrate. | Rome R1 |
| **C5** | **Unilateral grant as a first-class selection route.** One grantor may grant arbitrarily many roles, unilaterally, at will. | Ptolemaic appointments; also covers Roman appointment of a dictator. | Ptolemaic R7 |
| **C6** | **Self-granting (co-optation) with no external grantor.** A RoleDefinition may be granted by **the same body that holds it** (self-co-option). | Carthaginian pentarchies co-opt their own members. | Carthage R2 |
| **C7** | **Conditional / fallback decision-body authority.** A decision body's competence may be **conditional on another body's deadlock**. | Carthaginian assembly decides only when sufetes and elders disagree. | Carthage R3 |
| **C8** | **Parallel legal orders.** A polity may hold **multiple legal orders keyed to population/status**, with the applicable forum a **derived fact** about person + matter. | Greek *dikasteria* vs. Egyptian *laokritai*. | Ptolemaic R4 |
| **C9** | **Formal authority vs. conventional deference.** The government configuration should distinguish a body's **formal** concurrence from **conventional deference** (de facto binding via convention). | The Roman Senate is formally advisory, practically decisive. | Rome R2 |
| **C10** | **Non-ranked horizontal checks.** Permit **peer** administrative appointees to check one another without a rank ordering. | Ptolemaic *oikonomos* / *nomarch* / *basilikos grammateus*. | Ptolemaic R6 |
| **C11** | **Capability tokens carried by holdings.** A power such as Roman *imperium* is a **token attached to a holding** (prorogable), not a role and not a stored score. | *Imperium* is a power, prorogued separately from office. | Rome R3 |
| **C12** | **Legal eligibility distinct from practical electability.** Keep legal eligibility as data; treat "who can actually win" as an **influence input**. | Customary Roman *cursus*; Carthaginian non-elite generals. | Rome R4, Carthage R5 |
| **C13** | **Selection-method attribute** (bloc/open vs. individual/secret) as **content** on a RoleDefinition. | Rome votes by bloc, openly, with no secret ballot at 278. | Rome R5 |

## 3.1 T1 sheet additions (Seleucid, Macedon, Epirus, Syracuse)

The four T1 sheets (2026-10-14) largely **reinforce C1/C2/C3** and add a small
number of genuinely new challenges. They are grouped below; where a new challenge
is the same primitive re-observed, it is noted as **supports**.

| # | Candidate refinement (proposal only) | Evidence | Source |
| --- | --- | --- | --- |
| **N1** | **Corporate grant bodies.** An **institutional membership** (army assembly, citizen assembly) must be able to **hold a `grant_role` / `acclaim` capability** — grants are not only individual actions. | Macedonian army acclaims the king; Epirote/Syracusan assemblies grant citizenship and emergency command. | M2, E1, Y1 |
| **N2** | **Dual (hereditary + acclamatory) succession.** Succession may combine a **dynastic claim** with **corporate acclamation/confirmation**, either being decisive. | Macedon 279–277 (claimants + army voice). | M1 |
| **N3** | **Granted, revocable, crisis-scoped extraordinary office.** A decision body may **grant** a supreme, temporary office and **revoke** it. | Syracuse grants Pyrrhus supreme command (278). | Y1 |
| **N4** | **Grantable, tiered citizenship.** Citizenship is **locally scoped** and can be **granted by decree**; a polity may have **no imperial electorate**, only subjection above the civic tier. | Epirote federal citizenship grants; Syracusan enfranchisements; Seleucid layering (Greek *polis* vs. native subject). | E1, Y2, S4 |
| **N5** | **Nested / two-level membership.** One character may hold membership in a **tribe and a league** (or a *polis* and a kingdom) simultaneously, with rights at each level. | Epirote tribal + federal citizenship. | E3 |
| **N6** | **Subordinate-community tiers as first-class relationships.** Provinces/satrapies, subject cities, allied communities, colonies, *poleis*-within-kingdoms, temple estates, vassal kingdoms and tribal subdivisions are **institution types that are not the central government** and need a shared vocabulary. | Seleucid realm (all tiers); Rome's *socii*; Cyrenaica; Syracuse's Sicilian domain. | S3, E-none, Y4 |
| **N7** | **Corporate holder spanning economy + institution.** A **temple estate** holds land, people and dues — a holder that is simultaneously an institutional membership and an economic actor (AD-26 overlap). | Egyptian temple estates; Seleucid temple estates. | S5 |

> **Reconciliation.** N1 refines C5 (unilateral grant) by adding a **corporate**
> grantor; N2 refines C1 (succession); N3 refines C2 (revocable tenure) into a
> **crisis-scoped grant/revoke**; N4/N5 refine area-8 citizenship; N6 is the
> taxonomy's §6 tiers; N7 is handed to AD-26. **C7 (conditional body authority)**
> is now additionally supported by the **Macedonian army assembly** acting only in
> crisis, and **C9 (formal vs. conventional)** by the same case.

## 3.2 Review additions (seven-sheet consistency review, 2026-10-14)

The [`r16-sheet-consistency-review.md`](r16-sheet-consistency-review.md) audited
all seven detailed sheets against the taxonomy and added four challenges.

| # | Candidate refinement (proposal only) | Evidence | Source |
| --- | --- | --- | --- |
| **RV0** | **Families compose.** A government type may combine several taxonomy families (a royal head over a federal league; a civic body granting supreme command). | Epirus (F3+F2); Syracuse (F4 + crisis F2). | review §1/§5 |
| **RV1** | **Indirect-influence / hegemony tier.** Add a subordinate tier for **alliance/treaty/protectorate/sphere/naval hegemony without administration**, distinct from administration tiers (satrapy/nome). Elaborated concretely as the administration-mode tier list in taxonomy **§6.1**. | Ptolemaic Aegean; Roman Italy's *socii*; Cyrenaica. | review §3/§5 |
| **RV2** | **Tier obligation and privilege vocabulary.** Subordinate tiers carry explicit **tribute / military levy / garrison / access / alignment / labour** obligations and separate **privileges**, distinct from rights. Elaborated concretely in taxonomy **§6.2**. | all sheets' §J.2. | review §3/§5 |
| **RV3** | **Tiered/grantable/local political membership** with **separate political rights, civil privileges, civic obligations, military obligations, office eligibility and applicable legal order**. Elaborated concretely as a scoped, tiered, grantable membership model in taxonomy **§6.3**. | Rome (4+ tiers), Carthage (citizen/subject), Egypt (none/local), Seleucid (local/subject), Macedon (ethnic/assembly), Epirus (dual+grantable), Syracuse (civic+grantable). | review §5 |
| **RV4** | **Four dimensions of subordination kept separate.** A subordinate relationship (or membership tier) has **legal authority · political influence · geographic control · economic obligations** as four distinct dimensions, never one "ally/subject" value. Mirrors the identity/ownership/control split (ADR-0020). Elaborated in taxonomy **§6.4**. | all sheets (tiers span recognised rule, actual compliance, physical control and tribute). | review §3/§5 (derived) |

> **Validation from the review.** All seven sheets use the same **seven role
> kinds** and map to **F1–F7** (or a combination); **no new role kind and no new
> family** is required. The gaps are the **composition rule (RV0)**, the
> **indirect tier (RV1)**, **obligation fields (RV2)**, **tiered citizenship
> (RV3)** and **the four separate dimensions of subordination (RV4)** — all
> recorded here as proposals. **RV1–RV3 were elaborated into concrete proposed
> vocabulary on 2026-10-14** (taxonomy **§6.1–§6.4**); they remain proposals and
> change no decision.

## 4. Content-hygiene recommendations (not architecture)

| # | Recommendation | Source |
| --- | --- | --- |
| H1 | **Store native office names**; forbid misleading glosses (sufes ≠ "king", ≠ "consul"; the Hundred ≠ "the Senate"). | Carthage R6 / §D |
| H2 | Model the **accountability consequence** of an oversight tribunal (the Hundred may execute a general) as **content**, not mechanic. | Carthage R4 |
| H3 | Keep eligibility **permissive** where the evidence allows; elite access is an **influence** fact, not a legal gate. | Carthage R5 |
| H4 | Enforce the per-polity **anachronism lists** (each sheet §N) as authoring guards. | all sheets §N |

## 5. Recommended disposition

- **Do not change AD-25 in this pass.** C1–C13 are *evidence-backed proposals*;
  they should be weighed when AD-25 is next ruled.
- **Highest priority for AD-25 review:** **C1 (sovereign root role)** and
  **C2 (revocable tenure)** — without these, the Ptolemaic (and any monarchical)
  case is not representable, and the model would be silently Rome-shaped. **N1
  (corporate grant bodies) and N2 (dual succession)** are now close behind them,
  being required by Macedon, Epirus and Syracuse.
- **Cheap and safe:** **C3, C4, C12** largely *validate* or lightly generalise
  what the model already implies, and should be adopted first if any are adopted.
- **Now evidenced (were deferred until these sheets existed):** **C7
  (conditional body authority)** and **C9 (formal vs. conventional deference)**
  are supported by the **Macedonian army assembly** (M1/M3) and the **Epirote
  league** (E3); revisit them at the next AD-25 review. **C13** (vote method)
  remains Roman-evidenced only.
- **New, for the next review:** **N1–N7** (corporate grants, dual succession,
  crisis-scoped office, tiered citizenship, nested membership, subordinate-
  community tiers, corporate economic holders). N7 is handed to AD-26.
- **Now elaborated concretely (2026-10-14):** **RV1–RV3** were turned into
  proposed vocabulary in the taxonomy — administration-mode tiers incl. an
  **indirect-influence tier** (§6.1), an **obligation/privilege vocabulary**
  (§6.2), and a **scoped, tiered, grantable political-membership model** (§6.3).
  **RV4** records the rule that **legal authority · political influence ·
  geographic control · economic obligations** stay four separate dimensions
  (§6.4). These remain **proposals**; **AD-25 stays OPEN**. If any are adopted
  next, RV3 (membership attributes) and RV4 (dimension separation) are the
  **load-bearing** ones for content, because they decide whether a polity can be
  represented without a Rome-shaped citizen flag.

> Reminder: research changes no decision status. This document is the R-16
> *evidence output* for AD-25, not a closure of it.
