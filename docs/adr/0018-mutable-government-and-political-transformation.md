# ADR-0018: Mutable government and political transformation

- Status: **Approved** (2026-10-04) as an architectural boundary. Transformation
  vocabulary, eligibility, thresholds and mechanics remain **Unresolved** /
  **Research-dependent** and are not locked by this approval.
- Date: 2026-10-04
- Extends: [ADR-0011](0011-legitimacy-claims-and-internal-conflict.md),
  [ADR-0013](0013-content-data-cultures-religions-governments.md)
- Related: [ADR-0006](0006-legal-action-and-proposal-validation.md)

## Context

Government type is not immutable faction configuration, but neither is it a free
menu respec, a universal tech/progression tree, or a prestige threshold that
converts directly into a new form. Political transformation is a contested
process between power blocs, institutions and society.

## Decision

1. **Government is mutable authoritative state.** A faction's government may
   change through simulation.
2. **Modelling distinction (important):** `GovernmentType` remains a *data
   definition* — a culturally scoped set of roles, offices, permissions and
   expectations ([ADR-0013](0013-content-data-cultures-religions-governments.md)).
   `Faction.government` is *mutable state* — the type currently in force plus its
   institutional configuration. Changing government changes the second, and may
   change the referenced type.
3. **Transformation is attempted through a validated legal action**
   ([ADR-0006](0006-legal-action-and-proposal-validation.md)) by a character,
   house, dynasty, political faction, coalition or military bloc that has
   accumulated some combination of prestige, legitimacy, influence, institutional
   control, elite support, popular support, military support, provincial support,
   relationships and claims.
4. **Power makes transformation possible; it does not guarantee acceptance.**
   Existing institutions and other actors retain agency. Candidate consequences:
   institutional resistance, elite opposition, popular support or opposition,
   army loyalty shifts, provincial recognition or refusal, political compromise,
   hybrid political arrangements, new offices and titles, weakening of old
   institutions, formation of new ones, plots, assassination attempts,
   rebellion, civil conflict, succession crises, foreign recognition disputes.
5. **There is no universal Republic → Monarchy → Empire tree.** Different
   political systems have different possible transformations, including
   republican institutions centralising around an extraordinary leader, a
   monarchy losing power to competing institutions or elites, a confederation
   centralising around a prestigious leader and then fragmenting, oligarchic
   capture of a city-state, dynasty replacement, and successor-state
   fragmentation.
6. **Foreign actors learn about transformation through information channels and
   interpret it** by their interests, relationships, culture, government,
   claims, alliances, rivalries, strategic position and knowledge. Candidate
   responses: recognise, refuse recognition, support exiles, support claimants,
   renegotiate treaties, exploit instability, intervene, remain neutral, seek
   alliance. **No universal foreign relation modifier.**
   `WORLD TRUTH → INFORMATION → INTERPRETATION → ACTION`.
7. **Succession consequence.** A political system centred on one extraordinary
   person may not survive that person's death: personal prestige disappears,
   relationships change, army loyalty may fragment, old institutions may reassert
   themselves, family members compete, provincial actors reconsider allegiance,
   foreign powers may support alternatives. The simulation should be able to
   answer: *did this character create a durable new political order, or was the
   state held together by one extraordinary person?*
8. **Transformation connects to the existing causal systems:** causal ledger
   ([ADR-0002](0002-authoritative-state-causal-ledger-snapshots.md)),
   legitimacy/claims ([ADR-0011](0011-legitimacy-claims-and-internal-conflict.md)),
   internal crisis, legal actions, succession, diplomacy, institutions
   ([ADR-0013](0013-content-data-cultures-religions-governments.md)), and
   knowledge ([ADR-0005](0005-event-taxonomy-and-historical-significance.md)).
9. **No thresholds or transformation formulas are defined.** Political
   transformation must remain historically and culturally plausible.

## Consequences

- Government is now a mutable aggregate touched by politics, diplomacy,
  institutions and succession — not static configuration.
- Recognition becomes a first-class diplomatic/knowledge flow rather than a
  faction attribute.
- Epic ordering places political transformation **after** legitimacy/claims,
  institutions and internal-crisis work, because it integrates all of them.
- Event catalogue gains transformation and recognition event kinds.

## Rejected alternatives

| Alternative | Why not |
| --- | --- |
| Government as immutable faction config | Contradicts the simulation's own premise |
| "Reach prestige X → Become Monarchy" | Power is necessary, not sufficient; institutions have agency |
| Universal government progression tree | Not historically universal; violates shared-primitives rule |
| Foreign universal relation modifier on regime change | Collapses interpretation into a number |

## Unresolved

- **Unresolved:** transformation action vocabulary per polity type.
- **Unresolved:** who is eligible to attempt, and how eligibility is expressed as
  data by culture/religion/government.
- **Unresolved:** how hybrid arrangements are represented.
- **Unresolved:** recognition rules and refusal consequences.
- **Unresolved:** modelling charisma-dependent durability versus institutional
  durability after a leader's death.
- **Research-dependent:** historically plausible transformation sets per polity
  and period.
