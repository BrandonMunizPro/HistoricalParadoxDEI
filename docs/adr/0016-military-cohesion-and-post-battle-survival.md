# ADR-0016: Military cohesion and post-battle organisational survival

- Status: **Approved** (2026-10-04) as an architectural boundary. Formulas,
  thresholds and cohesion granularity remain **Unresolved** and are not locked by
  this approval.
- Date: 2026-10-04
- Extends: [ADR-0001](0001-campaign-military-representation-vs-dei-tactical.md)
- Related: [../events/event-catalogue-v0.md](../events/event-catalogue-v0.md),
  [../architecture/vertical-slices-and-epics.md](../architecture/vertical-slices-and-epics.md)

## Context

Reducing a battle's aftermath to `starting soldiers − casualties = remaining
soldiers` cannot explain why two armies with similar casualty percentages have
radically different futures. Whether an army remains an army is itself simulated
state.

## Decision

1. **Cohesion is a first-class military concept, distinct from morale.**
   - Morale: willingness to continue fighting.
   - Cohesion: ability of a formation, command element or army to remain
     organised and function as a military body.
2. **Candidate military state now includes:** manpower, morale, **cohesion**,
   fatigue, supply, loyalty, **command stability**, experience, equipment state.
3. **Cohesion granularity is unresolved.** Candidate levels: formation, command
   element / detachment, army. Storage shape is not decided.
4. **No formulas or thresholds are defined.** Candidate inputs to
   post-battle organisational outcomes are listed below purely as design
   surface, not as a model.
5. **Post-battle resolution must eventually model more than casualty
   subtraction.** Candidate outcomes: organised retreat, disorganised retreat,
   scattered formations, desertion, capture, surrender, units regrouping around
   surviving commanders, partial army fragmentation, complete army
   disintegration.
6. **Cohesion also moves outside battle.** Campaign circumstances — forced
   marches, poor supply, command disputes, long campaigns, defeats, disease — may
   damage organisational cohesion. Rest, leadership, victory, experienced
   command and stable supply may preserve or rebuild it.
7. **Design principle:** *An army is not merely the sum of surviving soldiers.
   Its ability to remain an army is itself simulated state.*
8. **Disintegration has downstream historical consequences** which flow through
   existing systems rather than a special path: veterans returning home,
   deserters, refugees and camp followers, stories of defeat, family casualties,
   political blame, recruitment problems, revenge pressure, and changes in
   commander reputation.

### Candidate inputs to organisational outcomes (not a formula)

Commander survival; subcommander/officer survival; commander reputation; recent
victories and defeats; veteran composition; fatigue; supply; loyalty;
encirclement; terrain and escape routes; retreat orderliness; contingent
tensions; unpaid troops; disease; political crisis.

## Consequences

- Organisational survival is a **campaign-side domain concern**. `BattleResult`
  carries only what the engine knows; the army's organisational fate is derived
  from campaign state, not asked of the engine.
- Cohesion appears in the domain model as military state, and in events as
  cohesion change and organisational outcomes.
- Command element membership (ADR-0015) interacts with fragmentation: an army can
  lose parts of its organisation while retaining a core.
- Post-battle consequences connect to characters, families, settlements,
  recruitment, reputation and the causal ledger.

## Rejected alternatives

| Alternative | Why not |
| --- | --- |
| Casualties-only resolution | Cannot explain divergent post-battle futures |
| Morale and cohesion as one value | They are distinct concepts with distinct causes |
| Asking the tactical engine to compute cohesion | The engine does not own campaign organisation |

## Unresolved

- **Unresolved:** cohesion formulas, thresholds and decay/recovery rates.
- **Unresolved:** cohesion granularity and storage shape.
- **Unresolved:** how organisational outcomes are decided, including whether the
  player may pre-emptively order a retreat or disengagement as a campaign action.
- **Unresolved:** which `BattleResult` data, if any, may legitimately inform
  organisational outcomes.
- **Unresolved:** how fragmented remnants map onto new formations, armies or
  settlements over time.
