# Event taxonomy and historical significance

- Status: **Approved architectural direction** (ADR-0005, approved 2026-10-04).
  Significance formulas and thresholds are **not** approved and remain
  **Unresolved**. Candidate kinds added by ADR-0015 through ADR-0018 and
  ADR-0020.
- Decision record: [ADR-0005](../adr/0005-event-taxonomy-and-historical-significance.md)
- Catalogue: [../events/event-catalogue-v0.md](../events/event-catalogue-v0.md)
- Related: [ADR-0002](../adr/0002-authoritative-state-causal-ledger-snapshots.md), [ADR-0016](../adr/0016-military-cohesion-and-post-battle-survival.md), [ADR-0017](../adr/0017-population-cohorts-migration-and-displacement.md), [ADR-0018](../adr/0018-mutable-government-and-political-transformation.md), blueprint §11

## 1. Context

The blueprint's canonical `HistoricalEvent` ledger is the backbone of causality.
But the simulation continuously produces routine occurrences — an observation
made, a report arriving, an order changed, a price moving, a detachment reaching
a waypoint. Treating all of them as permanent chronicle entries buries the
signal. Treating none of them as historical breaks "explain why".

## 2. Design principle: one envelope, four classifications

Overengineering four separate event systems would be worse than the problem. The
proposal is a **single event envelope** with a **classification** that selects
the persistence and notification policy.

```
DomainEventEnvelope
  id            stable identity
  simTime       when it occurred (finer than the command period)
  kind          catalogue discriminator, e.g. "observation.made"
  tier          simulation | information | canonicalHistorical | playerNotification
  actors[]      characters / factions / formations involved
  locations[]   where
  payload       kind-specific data
  causes[]      event ids that led here (causality spine)
  provenance    origin: which system/choreography produced it
```

## 3. The four classifications

| Tier | What it is | Persisted to ledger? | Player-facing? | Examples |
| --- | --- | --- | --- | --- |
| `simulation` | Transient intra-period causal occurrence | No (debug log / in-window cause graph) | No | movement step, order change, routine economic tick, construction progress, cohort movement step, pre-battle command/control assignment |
| `information` | Knowledge or reputation delta with provenance | Only when later significance demands | Indirectly | observation made, report departing/arriving, rumor mutation, belief update, reputation shift, **cohort testimony** |
| `canonicalHistorical` | Historically meaningful occurrence | **Yes** — append-only | Often | battle, ruler death, institution founded, succession crisis onset, treaty, consequential marriage, **army disintegration**, **mass displacement**, **government transformation**, **regime recognition or refusal** |
| `playerNotification` | Presentation projection | No | Yes | "your army is engaged", "a report arrived" |

Rules:

- A `playerNotification` is **derived** from the other three; it is never
  authoritative and can be queued, coalesced or suppressed.
- `simulation` and `information` events still carry `causes[]`, so a causal chain
  can be assembled in-window and later promoted to the ledger when it turns out
  to matter.
- `information` events keep provenance chains (observation → report → rumor →
  belief) which is what makes knowledge honest and traceable.
- **Cohort testimony (ADR-0017) is a first-class `information` source.**
  Displaced people carry eyewitness accounts with them, so provenance chains may
  originate from a moving `PopulationCohort` rather than from a scout or merchant
  in the same place as the event.
- **Significance is contextual, not global (ADR-0016, ADR-0017, ADR-0018).** The
  loss of cohesion in one background formation may be routine; the same event in
  the player's army, or a cohort of displaced people crossing into a rival's
  territory, is not. Candidate `canonicalHistorical` classes added by the delta:
  organisational survival after battle, displacement and cohort movement,
  political transformation, and regime recognition.

## 4. Deciding significance

Significance is **not** a formula and is deliberately not specified now. Two
supported paths:

1. **Emitter classification (default).** The system that produces an occurrence
   classifies it, because only it knows the context.
2. **Optional `HistoricalSignificancePolicy` port (later).** A pluggable policy
   could elevate an event after the fact (for example, a minor marriage that
   turns out to change a succession).

Significance is **contextual**. The same occurrence class may be chronicle-worthy
for the player's dynasty and routine elsewhere. Examples to keep in mind when
designing the policy:

- a ruler's death is normally canonical;
- a marriage is canonical when it changes succession or alliance, routine
  otherwise;
- a battle is canonical; the resulting political aftermath may generate further
  canonical events;
- an observation is normally `information`; it becomes notable only if it
  explains a major decision.

## 5. Worked example: battle to civil conflict (blueprint §11.1)

```
BattleResult
  → canonicalHistorical: battle.resolved
      causes: battle.prepared, battle.launched
  → simulation: casualty, injury, death applied
  → canonicalHistorical: character.prestige_changed (military prestige up)
  → information: rival characters/player receive reports of the victory
  → autonomous decision (belief-based): rival proposes recall / investigation /
        office denial / coalition / propaganda
  → legal action validation (ADR-0006)
  → accepted: canonicalHistorical: character.officer_recalled (or refused)
  → information: further reports propagate
  → canonicalHistorical: legitimacy pressure changed
  → crisis predicate evaluated (ADR-0011) → if active, further legal actions
        (negotiation / defiance / rebellion) may follow
  → canonicalHistorical: civil conflict onset, with causes[] tracing back
        through prestige, loyalty, claims and institutions
```

The civil conflict is a **consequence with a full causal trace**, never a random
roll and never a standalone event type.

## 5.1 Worked example: conquest to displacement to political consequence

Required by ADR-0017 (**Approved direction**). Note that no faction relation
value is written at any step:

```
BattleResult / siege outcome
  → canonicalHistorical: settlement.sacked  or  population.displaced
      causes: battle.resolved, siege.resolved
  → canonicalHistorical: population.cohort_moved
      (cohort carries origin, size, culture, religion, displacement cause)
  → simulation: cohort movement steps, attrition, arrival
  → information: cohort_testimony generated and propagated
                   (origin: cohort, not local observer)
  → information: reports reach neighbouring powers and interested characters
  → derived views: knowledge index, reputation toward the perpetrator
  → autonomous decisions (belief-based): a government decides to accept,
      restrict, redirect, settle, exploit, enslave, support or expel
  → legal action validation (ADR-0006)
  → canonicalHistorical: refugees.arrived  → destination consequences
      (growth, labour, food pressure, unrest, recruitment, trade, composition)
  → canonicalHistorical: government.transformation_attempted
      causes: legitimacy/claims, elite support, army loyalty, institutional
              resistance, provincial support  (ADR-0011 → ADR-0018)
  → institutional response: accepted | hybrid arrangement | resisted
  → information: foreign powers learn of the change and interpret it
  → canonicalHistorical: regime.recognized  or  regime.recognition_refused
  → consequences: treaty renegotiation, alliance offers, exile support,
      intervention, or continued non-recognition
```

## 5.2 Worked example: geographic projection of a battle

Per ADR-0020 (**Approved principle**), the campaign asks what is objectively true
about a location; the adapter asks which battlefield representation best matches.
The projection itself is an adapter-side computation, and **derived match scores
are not historical events**:

```
canonicalHistorical: battle.encountered
    location: authoritative campaign geography (coordinates, terrain,
              river/coast, elevation, season, weather)
  → simulation: geographic context assembled from campaign state
  → TacticalLocationContext (domain-owned facts only)
  → BattlefieldResolver (ADAPTER): consult researched Rome II / DeI metadata,
       derive compatibility scores, select battlefield representation
  → canonicalHistorical: battle.prepared  causes: battle.encountered
  → battle.launched → battle.resolved
  → simulation: casualties applied
  → canonicalHistorical: army.cohesion_changed
  → canonicalHistorical: army.fragmented | formation.scattered | army.surrendered
      (organisational outcome computed campaign-side, ADR-0016)
```

## 6. Representative causal chains (verified after the 2026-10-04 approvals)

These four chains were re-checked against the approved architecture. In each, the
owning system is named so that no step is ambiguous about authority.

### 6.1 Military

```
campaign movement (military/geography, scheduler-driven)
  → observation (intelligence)
  → report travel (information, delayed, distortable)
  → commander knowledge (derived view)
  → reaction (decision layer → legal action gate)
  → encounter (military)
  → geographic projection (geography → adapter resolver, ADR-0020)
  → Rome II / DeI battle (engine owns tactical behaviour only)
  → BattleResult (only inbound channel from the engine)
  → casualties + cohesion consequences (campaign applies, ADR-0016)
  → army survival / fragmentation (organisational outcome, campaign-side)
  → HistoricalEvent (causal ledger)
  → knowledge propagation (information)
  → political consequences (via the legal action gate)
```

Ownership check: the engine contributes a result, never a cause; the adapter
selects a representation, never a fact; the campaign applies every consequence.

### 6.2 Population

```
conquest / famine / insecurity (settlement/military/politics)
  → displacement (population)
  → cohort movement (population, bulk aggregate)
  → destination settlement effects (settlement/economy/politics)
  → eyewitness information (information, cohort testimony)
  → reports / rumors (information)
  → character knowledge (derived view)
  → interpretation (character/faction)
  → political or diplomatic action (legal action gate)
```

Ownership check: no step writes a conquest directly into a faction relation
value. Displacement is an event with causes; consequences travel through the
systems above.

### 6.3 Political

```
victory (canonical event)
  → commander prestige (characters/politics)
  → army loyalty (military/politics)
  → family or power-bloc influence (kinship/politics)
  → rival or institutional fear (relationships/knowledge)
  → recall / office denial / negotiation (decision layer → legal action gate)
  → compliance or defiance (politics)
  → legitimacy pressure (derived view)
  → transformation attempt or internal crisis (legal action gate, ADR-0018/0011)
  → validated action
  → possible civil conflict (emergent, traced)
```

Ownership check: pressure is derived from recorded causes; crisis onset requires a
validated action. No standalone "civil war" roll exists.

### 6.4 Character intelligence

```
HistoricalEvent (ledger)
  → information propagation (information)
  → character knowledge (derived view)
  → CharacterContext (assembled from knowledge only)
  → TheRev integration boundary (external, ADR-0012)
  → Jev / local model / cloud provider (external, outside this repository)
  → dialogue, reasoning, proposed intent (returned response)
  → HistoricalGame validation (legal action gate)
  → legal world action (owning system applies)
  → new HistoricalEvent
```

Ownership check: the boundary is one-directional in authority. Context flows out
filtered; intent flows back as a proposal; only HistoricalGame mutates state.

**No circular ownership exists in any chain.** Adapters, providers and
presentation are downstream consumers or translators; none can become
authoritative over simulation state.

## 7. Consequence for the ledger

Because only `canonicalHistorical` events append to the ledger, the ledger stays
proportional to history that matters while still supporting causality traversal,
character life histories, memory sources, reputation justification, chronicles
and player explanations (ADR-0002).

## 8. Open decisions (**Unresolved**)

- Contextual significance policy details (never a formula until designed).
- Whether classification can be revised after the fact.
- Which `information` events, if any, are ledger-worthy beyond causal support.
- Chronicle presentation and audience.
- Notification coalescing and interruption policy (touches ADR-0003 pause rules).
- Whether derived tactical compatibility scores are ever recorded at all, and if
  so whether they are debug-only or part of the chronicle
  ([ADR-0020](../adr/0020-campaign-geography-and-tactical-battlefield-projection.md)).
- Whether testimony from a cohort is a distinct `information` kind or an
  `Observation` variant with a cohort origin ([ADR-0017](../adr/0017-population-cohorts-migration-and-displacement.md)).
