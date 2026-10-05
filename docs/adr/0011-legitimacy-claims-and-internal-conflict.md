# ADR-0011: Legitimacy, claims and internal conflict pressure

- Status: **Architecture only; gameplay mechanics unresolved**
- Date: 2026-10-04
- Related: [ADR-0006](0006-legal-action-and-proposal-validation.md), blueprint §7 and §11.1

## Context

The blueprint is emphatic that civil wars must emerge from accumulated political
and military pressures rather than from a random standalone event, and names the
interacting factors: legitimacy, succession, claims, family rivalry, military
prestige, army loyalty, political institutions, provincial support,
relationships, culture, religion and historical events.

## Decision

Deferred as to mechanics. The architectural requirements are firm:

1. **No standalone "civil war" event roll.** Civil conflict is entered through
   validated legal actions whose preconditions derive from accumulated causal
   state.
2. **Pressure terms are derived from ledger-recorded causes**, not from ad hoc
   counters incremented by unrelated systems.
3. **Crisis detection is a pure, inspectable predicate** over authoritative
   state, so the simulation can explain why a crisis is or is not active.
4. **Escalation is a chain of validated actions and events**, each recorded, so
   the onset of a civil war traces back through the ledger to contributing
   causes.
5. **Context matters.** The same underlying state may matter greatly for the
   player's dynasty and little elsewhere; significance is contextual
   ([ADR-0005](0005-event-taxonomy-and-historical-significance.md)).
6. **Amendment (Delta 5): legitimacy, claims and offices are the raw material of
   political transformation.** Legitimacy, claims, family rivalry, military
   prestige, army loyalty, political institutions and provincial support are the
   same pressures from which a transformation attempt derives its feasibility
   ([ADR-0018](0018-mutable-government-and-political-transformation.md)).
   Transformation is therefore not a separate prestige system layered on top of
   this one; it consumes this state through a validated legal action
   ([ADR-0006](0006-legal-action-and-proposal-validation.md)).
7. **Amendment (Delta 5): succession is a transformation test.** A system whose
   legitimacy depends heavily on one extraordinary person may not survive their
   death. Succession therefore probes whether a political order is
   **institutionally durable** or **personally held**: personal prestige
   disappears, relationships and army loyalty may fragment, old institutions may
   reassert themselves, family members compete for the claim, provinces may
   reconsider allegiance, and foreign powers may back alternatives. This makes
   succession a first-class probe of political durability, not only an
   inheritance mechanic.

## Explicitly not decided

- **Unresolved:** any threshold, formula, weight or decay rate.
- **Unresolved:** which pressures are global versus per-faction, per-character
  or per-region.
- **Unresolved:** how military prestige, army loyalty, provincial support and
  elite opposition convert into pressure.
- **Unresolved:** the escalation ladder's action vocabulary.
- **Unresolved:** how suppressed or failed rebellions feed back.
- **Unresolved:** how personal-dependence of legitimacy is represented and
  measured for the succession durability test
  ([ADR-0018](0018-mutable-government-and-political-transformation.md)).
- **Unresolved:** whether institutional durability is a first-class aggregate or
  an emergent property of offices, claims and personnel.

## Anti-goal

Any design that lets a single random check produce a civil war, or that lets one
system write "civil war" into another system's state without a validated action
and a causal trace, is out of bounds.
