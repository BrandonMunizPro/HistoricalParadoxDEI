# ADR-0017: Population cohorts, migration and displacement

- Status: **Approved** (2026-10-04) as an architectural boundary. Cohort schema
  remains **Proposal/Unresolved**; historical availability per culture remains
  **Research-dependent**. Neither is locked by this approval.
- Date: 2026-10-04
- Related: [ADR-0005](0005-event-taxonomy-and-historical-significance.md),
  [../architecture/knowledge model in domain-model.md](../architecture/domain-model.md)

## Context

Population must not be only a static settlement number, and it must not become
one `Character` per civilian. Conquest, siege destruction, occupation policy,
enslavement and insecurity displace people; where they go changes regions,
economies, politics and information. The consequences must travel through the
existing causal systems rather than becoming a single relation modifier.

## Decision

1. **Ordinary population remains aggregated** for performance. Individual
   civilians are not simulated as characters.
2. **Population cohorts / groups can move between locations.** A cohort is a
   first-class simulation object with a destination, not a settlement modifier.
3. **Candidate cohort state (Proposal):** origin, current location, size,
   culture, religion, social composition, displacement cause, and important
   collective historical memories or attitudes. Exact schema **Unresolved**.
4. **Cohorts are carriers of information and history.** Design principle: *when
   people move, history moves with them.* Eyewitness observation, testimony and
   reports travel with the cohort and enter the knowledge system through the same
   channels as scouts or merchants.
5. **The consequence chain is causal, not a modifier:**
   `HistoricalEvent → displacement → cohort movement → observation/testimony/
   reports → knowledge → interpretation → political or diplomatic action`.
   It is explicitly **not** "Rome conquered a Greek city → relation −10".
6. **Candidate destination consequences:** population growth, labour changes,
   food and housing pressure, economic change, political pressure, local faction
   formation, patronage, social tension, military recruitment, trade change,
   cultural and religious composition change, information propagation.
7. **Government responses are legal actions, not scripted outcomes.** Candidate
   responses include accept, restrict, redirect, settle, exploit, enslave where
   historically and systemically appropriate, support, expel. Vocabulary and
   historical availability are culture- and government-dependent and
   **Unresolved**.
8. **Generational consequences exist but are not hardcoded.** Migration may have
   multi-generational effects; no arbitrary generation count is fixed.
9. **Promotion path:** historically important individuals may be promoted to
   `Character` entities when appropriate. Promotion criteria are **Unresolved**.
10. **Scope rule preserved:** simulate consequences deeply without simulating
    every atom.

## Consequences

- The knowledge system gains a channel: cohort testimony
  ([ADR-0005](0005-event-taxonomy-and-historical-significance.md) information
  tier).
- Settlement and population systems must support inbound population pressure as
  well as production and growth.
- Movement volume from migration is a scheduler and spatial-partition concern
  ([ADR-0004](0004-simulation-scheduling-and-bounded-computation.md)): cohorts
  move in bulk, not as individuals.
- Displacement is a candidate source of historically significant events
  (sieges, sacks, enslavement programmes, expulsions).

## Rejected alternatives

| Alternative | Why not |
| --- | --- |
| One `Character` per civilian | Unscaleable, and civilians are not the subject |
| Settlement population number only | Cannot express movement or its consequences |
| Faction relation modifier for conquest | Collapses a causal chain into a number; violates the design law that effects must be explicable |
| Scripted "refugee event" | Bypasses the causal systems |

## Unresolved

- **Unresolved:** cohort schema, size granularity and merge/split behaviour.
- **Unresolved:** movement resolution (routes, speed, attrition, seasonal
  effects).
- **Unresolved:** assimilation and integration modelling over generations.
- **Unresolved:** promotion criteria from cohort to `Character`.
- **Unresolved:** action vocabulary for government responses, and which
  responses are historically available per polity.
- **Research-dependent:** historical ranges of displacement magnitudes and
  settlement absorption capacity per region and period.
