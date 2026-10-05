# ADR-0006: Legal action and proposal validation architecture

- Status: **Approved architectural direction** (approved 2026-10-04). The action
  vocabulary is deliberately **not** approved.
- Date: 2026-10-04
- Analysis: [../architecture/legal-action-architecture.md](../architecture/legal-action-architecture.md)
- Related: [ADR-0001](0001-campaign-military-representation-vs-dei-tactical.md), [ADR-0011](0011-legitimacy-claims-and-internal-conflict.md), [ADR-0012](0012-therev-ai-sdk-boundary.md)

## Context

The simulation, not the AI, decides what is legal and what actually happens.
Autonomous characters, AI factions, the player and eventually Jev all need a
single, typed way to propose an action that the simulation validates and then
applies.

## Decision

**Approved as an architectural direction.** The conceptual flow is fixed:

```
Actor (player | deterministic AI | TheRev/Jev via the TheRev boundary)
   │
   ▼
ProposedAction
   │
   ▼
ActionValidator ── reject ──▶ explicit, explainable reasons
   │ accept
   ▼
Owning simulation system applies the accepted action
   │
   ▼
Authoritative state mutation
   │
   ▼
Domain event(s) emitted
```

1. A single `LegalActionProposal` shape (actor, action type, parameters, intent
   provenance, knowledge basis) submitted by any source.
2. A single `ActionValidator` gate that decides legality against authoritative
   state at a SimTime.
3. **The validator judges legality/possibility. It never performs world
   mutation.** Accepted actions are applied by the owning system's command path,
   which emits domain events.
4. Rejection is explicit and explainable, feeding the "player can perceive why"
   design law.
5. Action types are introduced alongside the systems that require them.
6. TheRev/Jev propose through the same gate, using only information the character
   is entitled to, and never bypass it
   ([ADR-0012](0012-therev-ai-sdk-boundary.md)).
7. **Amendment (Deltas 2, 4, 5):** three action families are now recognised as
   belonging to this boundary, with vocabulary still deferred —
   *pre-battle command and control decisions* (who commands, which forces are
   player-controlled; explicitly **not** tactical orders during the battle, see
   [ADR-0015](0015-campaign-command-hierarchy-and-tactical-control.md));
   *responses to displacement* (accept, restrict, redirect, settle, exploit,
   enslave where appropriate, support, expel; culture-dependent, see
   [ADR-0017](0017-population-cohorts-migration-and-displacement.md)); and
   *attempts at political transformation*, where power enables but does not
   guarantee acceptance
   ([ADR-0018](0018-mutable-government-and-political-transformation.md)).

### What this approval does **not** lock

- the action vocabulary, which grows with each system;
- costs, cooldowns and resource semantics;
- political, diplomatic, criminal, coordinated or rebellion action sets.

## Consequences of approval

- One chokepoint for legality; no source bypasses it.
- Civil conflict emerges from validated pressure-driven actions rather than a
  random standalone roll.
- AI and Jev become interchangeable proposal sources, which keeps the AI from
  becoming authoritative.
- Legality checks are testable in isolation with recorded rejection reasons.

## Rejected alternatives

| Alternative | Why not |
| --- | --- |
| AI mutates state directly | Violates the hard AI boundary |
| Event bus bypasses validation | Lets any system corrupt world state |
| Defining the full action vocabulary now | Explicitly premature; grows with each system |

## Unresolved

- **Unresolved:** the action vocabulary itself, by system.
- **Unresolved:** action costs, cooldowns and resource semantics.
- **Unresolved:** authority/provenance for diplomatic commitments.
- **Unresolved:** multi-actor coordinated actions and coalitions.
- **Unresolved:** legality versus "illegal but possible" acts, and whether some
  actions are crimes rather than invalid actions.
- **Unresolved:** whether validation is strictly a pure function of a state
  snapshot.
