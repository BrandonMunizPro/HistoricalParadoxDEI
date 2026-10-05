# Legal action and proposal validation architecture

- Status: **Approved architectural direction** (ADR-0006, approved 2026-10-04).
  The single-gate boundary is approved; the vocabulary is intentionally deferred
  and remains **Unresolved**.
- Decision record: [ADR-0006](../adr/0006-legal-action-and-proposal-validation.md)
- Related: [ADR-0011](../adr/0011-legitimacy-claims-and-internal-conflict.md), [ADR-0012](../adr/0012-therev-ai-sdk-boundary.md), [ADR-0015](../adr/0015-campaign-command-hierarchy-and-tactical-control.md), [ADR-0017](../adr/0017-population-cohorts-migration-and-displacement.md), [ADR-0018](../adr/0018-mutable-government-and-political-transformation.md), blueprint §7, §14

## 1. Principle

The simulation, not any actor, decides what is legal and what becomes true. Every
actor — the player, an autonomous character, an AI faction, and external
intelligence (Jev via TheRev, ADR-0012) — proposes; the simulation disposes.
There is exactly one gate, and no actor has a back door.

## 2. Shapes (documentation, not implemented code)

```
LegalActionProposal
  actor            character | faction | house | formation (validated reference)
  actionType       registered action type, e.g. "army.march_order"
  parameters       action-specific, validated by the owning system
  intentSource     player | autonomous_ai | external_intelligence (TheRev/Jev)
  knowledgeBasis   the knowledge entries this actor relied on (AI must match)
  justification    optional natural-language rationale (dialogue, memory)

ActionValidationResult
  accepted         boolean
  reasons[]        explicit rejection / warning reasons (explainable to the player)
  derivedIntent    optional normalisation performed by the owning system

AppliedActionOutcome
  resultingEvents[] domain events emitted by the owning system
  stateRefs[]      authoritative records touched
```

## 3. Flow

```
actor (player | autonomous | TheRev/Jev)
   │  proposal (typed, knowledge-scoped)
   ▼
ActionValidator  ── reads an immutable view of authoritative state at SimTime
   │                + knowledge-filtered context
   ├── reject → explicit reasons (never silent) ──► actor/player feedback
   ▼ accept
Owning system command handler (the only writer of its own state)
   │
   ▼
Domain events emitted  ──►  other systems react via the event layer
   │
   ├── classification (ADR-0005) decides ledger / notification policy
   └── causal chain extends (causes[])
```

## 4. Rules

1. **Single gate.** Player, deterministic AI and TheRev/Jev share the validator.
   No exceptions.
2. **Validator does not mutate.** It judges; the owning system's command handler
   applies and emits events.
3. **Explicit rejection.** Every rejection carries a reason, feeding the design
   law that the player must be able to perceive why.
4. **Action types arrive with systems.** The registry grows as systems are
   designed; it is not designed up front.
5. **Knowledge-scoped.** A proposal may only be justified by knowledge its actor
   legitimately holds. This is what keeps Jev and AI from acting on secrets.
6. **Emergent civil conflict.** Acts such as defiance or rebellion are *legal
   actions whose preconditions derive from accumulated pressure*; the crisis
   becomes active through a validated action and a causal trace, never a random
   event (ADR-0011).
7. **External intelligence cannot authoritatively mutate world state.** TheRev /
   Jev output is a proposal that enters this same gate, across the game-side
   intelligence seam (ADR-0012). The game performs no provider orchestration.
8. **Command and control decisions are campaign legal actions, not tactical
   orders** (ADR-0015). Assigning command, forming command elements, deciding
   which forces arrive and who controls which force are all validated *before* a
   battle. "Attack the left" is **not** an action type: no tactical instruction
   crosses this gate during a battle.
9. **Displacement responses are legal actions with culture-dependent vocabulary**
   (ADR-0017). Accept, restrict, redirect, settle, exploit, enslave (only where
   historically and systemically appropriate), support, expel. Which of these
   exist for a given government, culture and period is data, not a hardcoded list.
10. **Political transformation is attempted through this gate, and acceptance is
    not automatic** (ADR-0018). Power — prestige, legitimacy, influence,
    institutional control, elite or popular support, military or provincial
    support, relationships, claims — makes an attempt *possible*. Institutions
    and other actors retain agency in whether it succeeds.
11. **Recognition is a separate action.** Refusing recognition, or supporting
    exiles and rival claimants, are decisions made from belief about a
    transformation, not automatic reactions to it.

## 5. Why not let actions be "events" directly

If any system could emit an effect directly, the validator would be bypassable
and both the AI boundary and the "explain why" guarantee would erode. Keeping
proposal and application as distinct steps is what makes legality auditable and
testable in isolation.

## 6. Open decisions (**Unresolved**)

- The action vocabulary itself, per system.
- Costs, cooldowns and resource semantics of actions.
- Authority/provenance for diplomatic commitments (who may bind a polity).
- Multi-actor coordinated actions and coalitions.
- The line between "illegal" (rejected) and "criminal" (legal to attempt,
  punishable if caught).
- Whether validation is strictly a pure function of a state snapshot.
- Who may attempt a political transformation, and how eligibility is expressed as
  data per culture, religion and government type (ADR-0018).
- How hybrid political arrangements are validated: one action with an outcome, or
  several distinct legal states (ADR-0018).
- Whether the player may order a campaign-side retreat or disengagement as a
  legal action before or during an engagement (ADR-0016).
- Per-culture displacement response vocabulary and its historical availability
  (ADR-0017).
