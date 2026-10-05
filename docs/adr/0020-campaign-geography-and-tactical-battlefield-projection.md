# ADR-0020: Campaign geography authority and tactical battlefield projection

- Status: **Approved** (2026-10-04) as an architectural boundary. Representation,
  resolver algorithm and matching details remain **Unresolved**; datasets and
  engine capabilities remain **Research-dependent**. None are locked by this
  approval, and no mass battlefield mapping is authorised.
- Date: 2026-10-04
- Geographic analogue of: [ADR-0001](0001-campaign-military-representation-vs-dei-tactical.md)
- Related: [../architecture/domain-model.md](../architecture/domain-model.md),
  [research handoff](../../research/rome2-dei/HANDOFF.md)

## Context

The game will eventually have its own grand campaign map, conceptually closer to
a modern grand-strategy map than to a tactical battlefield. That map is the
simulation's own geography. Because Rome II / DeI is the tactical engine, a battle
location in our world must translate into a geographically appropriate Rome II /
DeI battlefield — but our strategic simulation must never depend on Rome II's
campaign geography.

## Decision

1. **Design principle (Approved):** *the campaign world owns location; the
   tactical adapter owns translation; Rome II owns the battlefield
   representation.* Rome II / DeI is a tactical projection of our world, not the
   definition of our world.
2. **Four distinct layers must not be conflated:**
   - **campaign geography** — authoritative simulation state (our coordinates,
     regions, terrain, elevation, rivers, coasts, passes, roads, biome, and
     season/weather context);
   - **visual campaign map** — presentation of that authoritative geography;
   - **tactical geographic projection** — the boundary translation between them;
   - **Rome II / DeI battlefield representation** — engine-side battlefield.
3. **Conceptual pipeline (illustrative, not a locked API):**
   `BattleEncounter → world location → geographic context → TacticalLocationContext
   → BattlefieldResolver → Rome II / DeI battlefield key / preset / configuration
   → tactical battle`.
4. **Question asymmetry:** the campaign asks *"what is objectively true about this
   location?"* The adapter asks *"given this context, which Rome II / DeI
   battlefield representation is the best available match?"*
5. **Three kinds of knowledge must stay separated:** (1) authoritative
   geographic facts from our world; (2) researched Rome II / DeI battlefield
   metadata; (3) derived compatibility/matching scores computed adapter-side.
   Inferred geography is never treated as authoritative historical data.
6. **Tactical continuity is a requirement, not a detail.** A river crossing in
   northern Italy must not resolve to a dry desert battlefield. Mountain passes,
   coastal plains, river crossings, forests, open agricultural plains, settlement
   outskirts and arid terrain should each resolve appropriately where the
   battlefield catalogue permits. Season and weather should remain consistent with
   campaign state where Rome II permits it. Reinforcement arrival direction should
   derive from campaign geography and movement where technically possible, and
   approach heading may influence deployment orientation where permitted.
   **No engine capability may be claimed until verified.**
7. **Research basis already available (no new archaeology in this pass):**
   `rome2_battlefields.json` (38 battles with battle type, setup limits, skies and
   *derived* terrain links) and `rome2_environments.json` (regions, provinces,
   campaign-map settlements, ground types, campaign ground types, climates,
   weather, seasons). Research caveats carried forward from the handoff:
   derived battle-terrain links are non-authoritative, and the campaign versus
   battle ground-type namespaces do **not** overlap.
8. **Map data sourcing:** modern GIS/elevation datasets may provide physical
   geography foundations where legally reusable. Historical borders, settlements,
   roads, territories, administrative divisions and cultural distributions must be
   researched separately for the chosen start period. Modern political borders are
   not evidence for the ancient world.
9. **Purity rule extends:** Rome II / DeI map and battlefield keys stay adapter
   side, exactly as unit keys do.
10. **The POC must prove projection, not just launching.** The first round trip
    should be able to: create an encounter at a known campaign location, give it
    geographic properties, project it into `BattleState`, resolve geography
    through the tactical abstraction, select a battlefield, launch, receive
    `BattleResult`, and apply the result back to the same campaign location and
    participants. A deliberately small known mapping set is acceptable for the
    first proof.

## Consequences

- E3 Geography must not be designed as abstract graph adjacency alone; it must
  retain a path to real coordinates and terrain properties while starting from
  the cheapest representation that can prove a vertical slice.
- `BattlefieldResolver` is an adapter-side port; the domain never asks "what Rome
  II map am I standing on?".
- E7 acceptance criteria expand from "an arbitrary battle launches" to "our
  campaign context produces the tactical battle configuration".
- The tactical POC gains the mixed player/AI allied control validation
  ([ADR-0015](0015-campaign-command-hierarchy-and-tactical-control.md)) and the
  geographic projection proof.

## Rejected alternatives

| Alternative | Why not |
| --- | --- |
| Reuse the Rome II campaign map as authoritative world | Creates dual strategic truth; violates the tactical-only role of the engine |
| Leaking Rome II battlefield keys into the domain | Breaks engine agnosticism and adapter replaceability |
| Locking a battlefield resolver API now | Algorithm and inputs are unresolved |
| Choosing a campaign renderer now | Unresolved; presentation is a separate track (ADR-0019) |
| Building the whole Mediterranean mapping before any proof | Explicitly unnecessary for proving the architecture |

## Unresolved

- **Unresolved:** canonical coordinate system and geometry representation for
  campaign locations.
- **Unresolved:** which geographic dimensions participate in matching
  (coordinates, terrain, biome, elevation, slope, river presence and orientation,
  coast proximity, settlement proximity/type, road context, season, weather,
  vegetation, historical region).
- **Unresolved:** resolver algorithm — exact mappings, regional mappings, terrain
  classification, scored candidates, or fallback battlefield classes.
- **Unresolved:** fidelity-versus-effort trade-off for the first campaign map.
- **Research-dependent:** whether Rome II / DeI permits terrain-, season- or
  weather-consistent battlefield selection, and reinforcement/orientation
  control from campaign state.
- **Research-dependent:** reusable modern GIS/elevation datasets and licensing;
  historical border/settlement/road datasets for the chosen start period.
