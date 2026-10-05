# ADR-0015: Campaign command hierarchy and tactical control boundary

- Status: **Approved** (2026-10-04) as an architectural boundary. Engine
  capabilities inside it remain **Research-dependent**; no mechanics are locked.
- Date: 2026-10-04
- Extends: [ADR-0001](0001-campaign-military-representation-vs-dei-tactical.md)
- Related: [ADR-0020](0020-campaign-geography-and-tactical-battlefield-projection.md),
  [../architecture/domain-model.md](../architecture/domain-model.md)

## Context

The campaign simulation owns military command hierarchy. There is a real risk of
inventing a fictional tactical instruction protocol — the campaign supreme
commander sending orders such as "attack the left", "hold until X" or "support
the center" to subordinate player commanders — that the tactical engine does not
support and that would create a second, imaginary battlefield.

Rome II / DeI **is** the tactical battlefield.

## Decision

1. **The campaign owns the command hierarchy:**
   `Army → command hierarchy → command elements / detachments → commanders →
   formations`. Command elements may include supreme/main command, vanguard, main
   body, rearguard, supply train, independent detachments and reinforcements.
2. **These are shared military primitives, not universally Roman structures.**
   Cultures and armies may organise themselves differently using the same
   primitives.
3. **The campaign determines, before the battle:**
   - who commands each participating force;
   - which formations belong to which command element;
   - which forces arrive, their arrival direction and arrival timing;
   - pre-battle campaign state (manpower, experience, morale, cohesion, fatigue,
     supply, equipment state, loyalty);
   - **which participating forces are player-controlled and which are
     AI-controlled.**
4. **No custom tactical instruction protocol.** The campaign supreme commander
   does not send invented tactical orders to player-controlled subordinate
   forces during the battle.
5. **Once the battle begins, the tactical engine controls tactical behaviour for
   AI-controlled allied forces.** The player controls only the forces mapped to
   their control and reacts to what allied AI forces actually do on the
   battlefield.
6. **No invented AI intent after the battle.** We know what occurred tactically,
   not why the engine chose a manoeuvre. Post-battle interpretation must not
   assert engine intent as historical fact.
7. **Total War style full control is possible only if the engine permits it.**
   When the player's character holds supreme command and Rome II allows control
   of all participating friendly armies, that style of control may be available.
   This is an engine capability, not an assumption.
8. **Mixed player/AI allied army control must be validated in the tactical POC.**

Worked intent example (not a design of engine behaviour): with Labienus as
supreme/main command, Gnaeus commanding the vanguard and Varus the rearguard, if
the engine supports it the player controls Varus's tactical force only. The
player observes allied AI conduct and reacts; the player never receives invented
orders from Labienus.

## Consequences

- The tactical projection must carry a **command and control mapping** as domain
  fact (who commands, who is player-controlled), which the adapter maps onto
  engine-side player/AI control.
- Campaign command hierarchy remains highly significant for authority, prestige,
  promotion, army loyalty, politics, relationships, battle participation,
  reinforcement ownership and post-battle consequences — even though it issues
  no tactical orders.
- The tactical POC gains a required validation: player-controlled and
  AI-controlled allied army combinations.

## Rejected alternatives

| Alternative | Why not |
| --- | --- |
| Fictional tactical order protocol to the player | Rome II is the battlefield; the protocol would be imaginary |
| Assuming the player always commands everything | Engine capability, unverified |
| Inferring why the engine's AI manoeuvred | Would fabricate history |
| Roman-only command structures as engine primitives | Violates shared-primitives rule (blueprint §6/§9) |

## Unresolved

- **Research-dependent:** whether and how Rome II / DeI supports mixed
  player/AI control of allied armies, and full control of all friendly armies.
- **Unresolved:** control-mapping granularity — per tactical army, per command
  element, or per formation.
- **Unresolved:** whether the player's character always commands a force in a
  battle they participate in, and what happens when it does not.
- **Unresolved:** command stability as distinct state from commander prestige.
