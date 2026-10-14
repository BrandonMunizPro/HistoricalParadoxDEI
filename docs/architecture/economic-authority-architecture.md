# Economic authority and financial audit architecture

**Status: Proposal (2026-10-14).** This document decomposes *economic authority*:
who owns what, who may direct it, how money moves, and how corruption is a
*derivable discrepancy* rather than a scripted event. It extends **E12**
(Settlements, population and migration — economy) and the political layer in
`political-office-and-government-architecture.md`.

It introduces **one new epic, E19 (Economic authority and financial audit)**,
proposed in `vertical-slices-and-epics.md` and sequenced in
`execution-roadmap.md` §J. E19 depends on E12 (economy mechanisms exist),
E9 (offices/spending authority), E13 (institutions own funds) and E19's own
dependency on the office model in AD-25.

Open decision **AD-26** (economic authority schema) blocks implementation.
Research **R-15** (ancient economy/treasury evidence) blocks content values.

> **Direction approved 2026-10-14; decisions remain open.** The multi-account,
> append-only transaction ledger direction is approved, with a refinement
> incorporated below: **ownership, control and spending authorization are three
> separate things** (§2), and **no part of the economic system is implemented
> during VS-5** (§10.1). **AD-26 is not closed** until the schema is finalised.

## 1. The problem this solves

E12 already intends production → prices → population health → unrest as events.
What it does not yet separate is **ownership**, **control** and **spending
authorization**: a character *owning* a warehouse is not the same as a steward
who *controls* it day to day, which is again not the same as a magistrate
*authorised to commit* public funds; and a temple's income is not the state's
money even when the state is pious. A single "treasury" number per faction
cannot represent the ancient Mediterranean world.

## 2. Ownership, control, spending authorization and flows (never conflated)

**Refinement 2026-10-14 — keep these separate.**

| Concept | Owns the truth | Answers | Example at 278 BCE |
| --- | --- | --- | --- |
| **Ownership** | Which assets exist and who **legally holds** them (title) | *Whose is X?* | "The Fabricii own 400 iugera in Latium"; "the temple at Locri owns its treasure" |
| **Control (possession / administration)** | Who **physically custodies or administers** an asset or account, which may differ from the owner | *Who holds/administers X right now?* | "A steward manages the estate"; "a garrison holds the treasury building"; "a satrap administers the royal lands" |
| **Spending authorization** | Who may **legally commit** funds out of an account (a capability from the political layer, §7) | *Who may spend from Y?* | "Only the quaestor may disburse from the public treasury"; "only the king may authorise a royal grant"; "only the Senate may vote the war levy" |
| **Flows** | Recorded **transactions** moving value between accounts | *What moved, when, why, and by whose authorization?* | "4,000 from the treasury to the consul's military chest, authorised by decree" |

These are four **separate** concepts and must never collapse into one flag:

- A person can **own** an asset they do **not** control (a child's inheritance;
  an absentee landlord).
- A person can **control** an asset they do **not** own (a custodian, a conqueror
  in occupation, a regent) — control is a *fact*, ownership is a *right*.
- A person can own **and** control an asset yet have **no spending
  authorization** over it (a private estate; a temple treasury the state may not
  legally draw on).
- **Spending authorization is legal permission only** (a capability, §7); it says
  nothing about whether the money exists in the account or who holds it.

**Rule.** A balance is **derived from flows**, never hand-edited. Any change to a
balance is a validated transaction, and every transaction is append-only and
traceable (consistent with ADR-0002's append-only causal ledger philosophy; the
financial ledger is a **separate** store that links to the causal ledger, so the
historical record stays proportionate).

## 3. Accounts and assets

**Proposal.** An **account** is a named holder of value with a single currency
unit:

- **Personal** (a character's wealth)
- **Household/estate** (a family's patrimony — distinct from any one member)
- **State public treasury** (Rome's *aerarium*; a Ptolemaic royal treasury)
- **Provincial/departmental chest** (a commander's war chest; a nomothete's
  local funds)
- **Institutional** (a temple, a guild, an institution from E13)
- **Faction/coalition** (informal pools held by a patron for a network)

An **asset** is a non-monetary holding: land, building, ship, herd, mine, trade
share, or a stock of goods. Assets have an estimated value, a **legal owner**,
and — separately — a **controller/custodian** who may differ from the owner, and
may be pledged, seized or alienated by transaction.

**A treasury is not "the faction".** Two factions can each hold several
treasuries. A character can be rich while their faction's treasury is empty.
This distinction is the whole point.

## 4. Transactions: the flow primitive

Every movement of value is a **transaction**:

```
Transaction {
  id              // canonical UUIDv5
  simTime
  fromAccount     // account debited
  toAccount       // account credited
  amount          // integer, in currency minor-units
  currency        // scenario currency id
  kind            // e.g. tax, tribute, trade, pay, gift, bribe, booties, loan, temple-offering
  authorisingActor// character or body that authorised
  authoritySource // the role holding / capability that permitted it (political layer)
  causeEventId    // optional link to a causal-ledger event
  memo            // data, not free text
}
```

- **Integer, fixed-point amounts only.** No floats, no rounding drift
  (consistent with ADR-0008 determinism).
- A transaction is applied through the **legal-action gate** (ADR-0006): the
  authorising actor must hold a capability that permits this outflow from this
  account. No silent writes.
- A **transaction that fails validation** never mutates state; it becomes a
  proposal rejection, not a half-applied balance.

## 5. Audit and corruption as derived discrepancy

**Proposal.** Corruption and mismanagement are **not** a flag and **not** a
scripted event. They are **derived from the flow layer by pure audit queries**:

- **Unexplained gap.** `revenue assessed` − `revenue remitted` = a discrepancy
  that is *not* matched by any recorded expenditure or transfer. A provincial
  governor's district that collects and remits less than assessed — with no
  compensating ledger entry — is the signature of a skim.
- **Circularity.** Funds routed through a series of accounts and returned to a
  related party (patronage, a "loan" that is never repaid). Auditable as a cycle
  in the flow graph.
- **Disproportion.** A character's **personal** account grows faster than any
  recorded lawful income can explain (pay, gifts, booty all recorded). Wealth
  without provenance.
- **Unauthorised direction.** A transaction whose `authoritySource` is absent,
  expired or mismatched to the account it debits — i.e. someone spent from a pot
  they had no capability over.

Any audit finding becomes a **proposal** to an investigative or judicial event
(presented below), not an automatic penalty. Whether anyone *notices* depends on
the knowledge system (E5): an audit only produces a consequence if some actor
observes the gap and has the capability to act on it.

**This is a design win, not a detail.** It satisfies "meaningful financial
discrepancy, not a scripted event", and it makes the political layer matter: the
auditor's *authority to audit* is itself a derived capability (see §7).

## 6. Anachronism guard (period-correct money)

The start-world money model must not import later Roman currency. At 278 BCE:

- **No denarius.** The silver denarius begins ~211 BCE. Roman money at the start
  is the **didrachm / quadrigatus** and **bronze *aes*** (see
  `campaign-start-and-historical-timeline.md` §7).
- **Multi-currency is the norm.** Rome (bronze + silver), Carthage (shekels),
  the Ptolemaic and Seleukid realms (Attic-standard drachma/talent) do not share
  a currency. The internal unit may be abstract, but **content and conversion
  must be scenario data**; a global single-currency abstraction must not leak
  into player-facing values. (AD-26 must settle how far multi-currency is modelled.)

## 7. Spending authorization (the political link)

**Proposal.** Spending is authorized by **capability** derived from the political
layer, and is **scoped**. Spending authorization is *legal permission only* — it
is distinct from ownership (title) and from control (who holds the funds): a
person may control money they are not authorized to spend, and be authorized to
spend money that is not there.

- Which **account** may be drawn, and up to what **scope/limit**, is part of a
  role definition's granted powers (see
  `political-office-and-government-architecture.md` §4, `authorise_spending(scope, limit)`).
- A Roman **quaestor** may disburse public funds for a defined purpose; a
  **consul** commands a war chest for the campaign but cannot simply annex the
  treasury; a **Carthaginian general** may draw on assigned revenue; a
  **Ptolemaic dioiketes** administers the crown's money on the **king's**
  delegated authority.
- **Corporate authorisation.** Some outflows require a decision body's concurrence
  (a senate decree, an assembly vote, a royal order). The transaction records the
  authorising body, not just an individual.
- **A rich faction with an empty treasury still cannot spend** — spending
  authorization does not mint money. Conversely, money present but unauthorised
  cannot move.

## 8. Economic → political consequences (the loop back)

The economic layer is not a terminal sink; it feeds politics and legitimacy:

- **Unpaid armies** lose cohesion (ADR-0016) and their commanders gain or lose
  personal authority over them — the classic Roman and successor-kingdom danger.
- **Patronage** from a personal account buys relationships, dependants and
  political support (E9/E16 character networks), which are themselves authority
  inputs.
- **Public poverty or a visible fiscal gap** erodes legitimacy and can be an
  eligibility input to internal crisis (E14).
- **Bribery** and election spending convert wealth into office, closing the loop
  to the political layer; whether that is *legal* is a per-government content
  decision (R-16).

Each consequence is an **event in the causal ledger**, traced to its financial
cause, not a silent modifier.

## 9. Persistence and determinism

- The financial ledger is **append-only** and persists through the existing
  SQLite/Drizzle repository pattern (ADR-0010), as its own port with its own
  store, **linked** to causal-ledger events by ID — not folded into the
  historical ledger, to keep that proportional (E2 significance gate).
- Balances are **derived** at query time from the ledger (or cached projections
  that are always reconcilable to the ledger).
- Determinism: integer amounts, ordered flow application, UUIDv5 transaction
  identities (ADR-0009).

## 10. Phasing (deliberately late)

Economy values are **content-tuning** concerns; the *mechanism* (accounts,
control, spending authorization, flows, audit) is architecture. Per the
classification rule in `assumptions-and-open-decisions.md`, E19 is sequenced
after the political office model and after E12's minimum economy exists — it must
not block E0–E8 or the geography track.

### 10.1 Explicitly not in VS-5 (refinement 2026-10-14)

**No part of the economic system is implemented during VS-5.** VS-5 is the
geography track (G1) plus its bounded presentation experiment; the economy is
not in its scope. Concretely, VS-5 must **not** introduce accounts, assets,
transaction machinery, treasuries, control/custody state, spending
authorization, audit queries or economic content. Geography and political
ownership may *reference* future account/asset IDs as seams only. Building any of
this now would (a) exceed the VS-5 slice, (b) pre-empt AD-26, and (c) put
economy values ahead of the R-15 evidence. E19 remains a **future** epic.

## 11. Open decisions and research

| ID | Item | Blocks |
| --- | --- | --- |
| **AD-26** | Economic authority schema: account/asset/transaction shapes, the separate representation of **ownership vs. control vs. spending authorization**, currency model (single vs multi), how far multi-currency is modelled, and the audit-query vocabulary. Direction approved 2026-10-14; **not closed** | E19, E12 economy tuning |
| **R-15** | Ancient economy/treasury evidence per polity at 278 BCE (revenue sources, tithe systems, minting, military pay, temple treasuries) | E19 content, E12 values |
| **AD-25** | (dependency) office/capability model from which spending authority is derived | E9, E10, E18, and §7 above |

## 12. Non-goals

- No implementation; no `src/` or `tests/` change.
- No balance-sheets authored before R-15.
- No prices or economic constants invented; placeholders are content-tuning, not
  architecture.
- No rewriting of ADR-0010 or ADR-0002; the financial ledger is a new **linked**
  store, not a change to their ownership.
