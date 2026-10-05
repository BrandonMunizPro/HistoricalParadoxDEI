# Event catalogue v0

- Status: **Proposal**. A naming and classification skeleton to make the event
  layer concrete enough to reason about. No event is implemented.
- Related: [ADR-0002](../adr/0002-authoritative-state-causal-ledger-snapshots.md), [ADR-0005](../adr/0005-event-taxonomy-and-historical-significance.md), [ADR-0016](../adr/0016-military-cohesion-and-post-battle-survival.md), [ADR-0017](../adr/0017-population-cohorts-migration-and-displacement.md), [ADR-0018](../adr/0018-mutable-government-and-political-transformation.md), [ADR-0015](../adr/0015-campaign-command-hierarchy-and-tactical-control.md), [ADR-0020](../adr/0020-campaign-geography-and-tactical-battlefield-projection.md), [event taxonomy analysis](../architecture/event-taxonomy.md)

## How to read this

| Column | Meaning |
| --- | --- |
| Kind | Discriminator on the event envelope (`kind` field) |
| Tier | `simulation` / `information` / `canonicalHistorical` / `playerNotification` |
| Emitter | Owning system; the only writer that produces it |
| Ledger | Default: does it append to the causal ledger? (`yes` / `conditional` / `no`) |
| Causal role | What it usually causes |
| Status | Design maturity |

Tiers are the mechanism from the event taxonomy ADR: one envelope, four
classifications. `conditional` means the emitter decides based on context
(significance); no formula is defined.

Every row below carries the envelope's shared rules: `id` is a **canonical
identity** (ADR-0009 — unique, immutable, permanently referenceable, never
reused, survives end of life) and `simTime` is **absolute, monotonic,
fixed-point elapsed simulation time** whose difference to another `simTime` is
the elapsed duration between them (ADR-0003). `simTime` is never an event count,
scheduler sequence, frame count or fidelity density, and never carries
same-instant ordering. Fixed-point **scale** is **Unresolved** (N-29).

## Kernel and time

| Kind | Tier | Emitter | Ledger | Causal role | Status |
| --- | --- | --- | --- | --- | --- |
| `period.started` | simulation | clock | no | opens a command period window | proposed |
| `period.closed` | simulation | clock | conditional | boundary synchronisation | proposed |
| `time.season_changed` | simulation | calendar | conditional | seasonal context | proposed |
| `time.paused` / `time.resumed` | simulation | clock | no | interaction state | proposed |
| `time.frozen` / `time.thawed` | simulation | clock | no | campaign clock held at a fixed SimTime for an **interactive** external tactical handoff; real-world battle duration consumes zero campaign SimTime (ADR-0003 A10) | proposed |

> `time.season_changed` and any future date display derive from
> `SimTime + ScenarioCalendar`, an **immutable authoritative scenario dataset**.
> The scalar always increases forward; era and BCE display direction never
> reverse it (ADR-0003).

## Geography and movement

| Kind | Tier | Emitter | Ledger | Causal role | Status |
| --- | --- | --- | --- | --- | --- |
| `formation.moved` | simulation | military | conditional | position change, contact opportunity | proposed |
| `formation.detached` / `formation.joined` | simulation | military | conditional | army composition | proposed |
| `encounter.detected` | simulation | military | conditional | creates a battle candidate | proposed |
| `settlement.founded` / `settlement.declined` | canonicalHistorical | geography/settlement | yes | population, institutions | proposed |
| `battle.encountered` | canonicalHistorical | geography/military | conditional | records the authoritative location at which a battle occurred; input to geographic projection (ADR-0020) | proposed |
| `geography.context_resolved` | simulation | geography | no | assembles domain-owned geographic facts for a battle site; never contains engine identifiers | proposed |

## Command and control (ADR-0015)

| Kind | Tier | Emitter | Ledger | Causal role | Status |
| --- | --- | --- | --- | --- | --- |
| `command.assigned` | simulation | military | conditional | who commands a force or command element | proposed |
| `command.element_formed` | simulation | military | conditional | formations grouped under a command element | proposed |
| `command.control_assigned` | simulation | military | conditional | which participating forces are player-controlled vs AI-controlled; domain fact mapped by the adapter | proposed |
| `command.stability_changed` | simulation | military | conditional | command structure holding or fragmenting | proposed |

> **Explicitly absent:** any event representing a tactical order issued during a
> battle ("attack left", "hold the centre"). No such action type exists
> (ADR-0015).

## Military organisation (ADR-0016)

| Kind | Tier | Emitter | Ledger | Causal role | Status |
| --- | --- | --- | --- | --- | --- |
| `army.cohesion_changed` | simulation → conditional canonical | military | conditional | organisational integrity change (battle, campaign or both) | proposed |
| `formation.cohesion_changed` | simulation → conditional canonical | military | conditional | per-formation organisational state, if granularity is per formation | proposed |
| `army.fragmented` | canonicalHistorical | military | conditional | part of the army's organisation broke down | proposed |
| `formation.scattered` | canonicalHistorical | military | conditional | individual formation lost cohesion | proposed |
| `army.disintegrated` | canonicalHistorical | military | conditional | the army ceased to exist as an army | proposed |
| `army.surrendered` | canonicalHistorical | military | conditional | capitulation; prisoners, legitimacy, politics | proposed |
| `army.retreated` / `army.routed` | canonicalHistorical | military | conditional | ordered vs disorderly withdrawal | proposed |
| `cohort.remobilised` | simulation | military | conditional | remnants regrouped around surviving commanders | proposed |

## Information and knowledge

| Kind | Tier | Emitter | Ledger | Causal role | Status |
| --- | --- | --- | --- | --- | --- |
| `observation.made` | information | intelligence | no | report origin | proposed |
| `report.dispatched` | information | intelligence | no | information in transit | proposed |
| `report.received` | information | intelligence | conditional | updates knowledge entries | proposed |
| `rumor.mutated` | information | intelligence | no | distorted information | proposed |
| `knowledge.updated` | information | knowledge | no | belief state change | proposed |
| `reputation.shifted` | information | reputation | conditional | audience-dependent standing | proposed |
| `testimony.cohort_offered` | information | population/knowledge | conditional | eyewitness account originating from a displaced cohort (ADR-0017) | proposed |

## Population, migration and displacement (ADR-0017)

| Kind | Tier | Emitter | Ledger | Causal role | Status |
| --- | --- | --- | --- | --- | --- |
| `population.displaced` | canonicalHistorical | population | conditional | conquest, siege, sack, policy or insecurity created displaced people; origin of a cohort | proposed |
| `population.cohort_moved` | canonicalHistorical | population | conditional | a cohort changed location, carrying its culture, religion and history | proposed |
| `population.cohort_merged` / `population.cohort_split` | simulation | population | conditional | aggregate bookkeeping as cohorts combine or divide | proposed |
| `population.cohort_arrived` | canonicalHistorical | population | conditional | arrival at a destination; triggers local consequences | proposed |
| `refugees.arrived` | canonicalHistorical | population | conditional | destination growth, labour, pressure, composition | proposed |
| `population.cohort_promoted` | canonicalHistorical | population/characters | conditional | historically important individuals become `Character` entities (criteria unresolved) | proposed |
| `displacement.response_chosen` | canonicalHistorical | population/politics | conditional | a government accepted, restricted, redirected, settled, exploited, enslaved, supported or expelled (vocabulary culture-dependent) | proposed |
| `settlement.absorbed_population` | simulation | settlement | conditional | inbound population pressure | proposed |

## Characters, families and institutions

| Kind | Tier | Emitter | Ledger | Causal role | Status |
| --- | --- | --- | --- | --- | --- |
| `character.born` | canonicalHistorical | characters | yes | family, succession | proposed |
| `character.died` | canonicalHistorical | characters | yes | succession, loyalty, relationships | proposed |
| `character.married` | canonicalHistorical | characters | conditional | alliance, legitimacy | proposed |
| `character.office_changed` | canonicalHistorical | politics | conditional | power, legitimacy | proposed |
| `character.prestige_changed` | canonicalHistorical | characters/politics | conditional | status, reactions | proposed |
| `character.memory_formed` | information | characters | conditional | belief and future choices | proposed |
| `institution.founded` | canonicalHistorical | institutions | yes | legacy, prestige | proposed |
| `institution.leader_changed` | simulation | institutions | conditional | continuity | proposed |

## Politics, legitimacy and internal conflict

| Kind | Tier | Emitter | Ledger | Causal role | Status |
| --- | --- | --- | --- | --- | --- |
| `claim.asserted` | canonicalHistorical | politics | yes | succession pressure | proposed |
| `legitimacy.pressure_changed` | simulation | politics | conditional | crisis predicate input | proposed |
| `crisis.detected` | canonicalHistorical | politics | conditional | opens escalation options | proposed |
| `character.defied` | canonicalHistorical | politics | yes | escalation step | proposed |
| `conflict.civil_begun` | canonicalHistorical | politics | yes | emergent civil conflict (traced) | proposed |
| `treaty.signed` / `treaty.broken` | canonicalHistorical | diplomacy | yes | alliance, legitimacy | proposed |

## Government and political transformation (ADR-0018)

| Kind | Tier | Emitter | Ledger | Causal role | Status |
| --- | --- | --- | --- | --- | --- |
| `government.transformation_attempted` | canonicalHistorical | politics | yes | a validated legal action was attempted; records actor, target type and basis | proposed |
| `government.transformation_resisted` | canonicalHistorical | politics | conditional | institutional or elite resistance; the attempt failed or was compromised | proposed |
| `government.transformed` | canonicalHistorical | politics | yes | the in-force government changed; records the resulting configuration | proposed |
| `government.hybrid_formed` | canonicalHistorical | politics | conditional | compromise arrangement rather than a clean transition | proposed |
| `government.institution_changed` | canonicalHistorical | politics | conditional | offices, permissions or titles altered | proposed |
| `regime.recognized` | canonicalHistorical | diplomacy | conditional | a foreign polity accepted the new government as legitimate | proposed |
| `regime.recognition_refused` | canonicalHistorical | diplomacy | conditional | a foreign polity declined to recognise it | proposed |
| `regime.exile_supported` | canonicalHistorical | diplomacy | conditional | foreign support for a deposed claimant or exile | proposed |
| `character.durability_tested` | simulation | politics | conditional | succession probe: did the order survive the founder's death, or was it personally held | proposed |

## Settlement, economy, supply

| Kind | Tier | Emitter | Ledger | Causal role | Status |
| --- | --- | --- | --- | --- | --- |
| `settlement.production_changed` | simulation | economy | no | goods | proposed |
| `settlement.price_changed` | simulation | economy | no | unrest, growth | proposed |
| `settlement.unrest_changed` | simulation | politics/economy | conditional | local pressure | proposed |
| `supply.changed` | simulation | logistics | conditional | army capability | proposed |

## Tactical boundary

The rows below are the **interactive** path: the player takes part, the campaign
clock is **frozen** at the encounter SimTime, and the handoff goes through the
adapter (ADR-0003 A10).

| Kind | Tier | Emitter | Ledger | Causal role | Status |
| --- | --- | --- | --- | --- | --- |
| `battle.prepared` | simulation | tactical | no | handshake with adapter | proposed |
| `battle.launched` | canonicalHistorical | tactical | conditional | arms a battle | proposed |
| `battle.resolved` | canonicalHistorical | tactical | yes | casualties, prestige, memory | proposed |
| `formation.mapped_to_tactical` | simulation | adapter | no | formation → DeI representation | proposed |
| `battlefield.resolved` | simulation | adapter | no | campaign geographic context → engine battlefield representation; derived, **not** a historical fact | proposed |
| `battle.failed` | simulation | adapter | conditional | structured failure | proposed |

> Adapter-side geographic selection and derived compatibility scores are
> deliberately **not** `canonicalHistorical`. They are an implementation of how the
> tactical battle was staged, not something that happened in the world
> (ADR-0020). Whether they are recorded at all is **Unresolved**.

### Background battle path

A **background battle** is an AI-versus-AI engagement resolved internally by
HistoricalGame. There is no adapter stage and **no clock freeze**; the world
continues under normal scheduling (ADR-0003 A11). It still emits the
outcome-shaped historical events below, so the two paths converge on one
campaign-side `BattleResult` boundary (ADR-0003 A12).

| Kind | Tier | Emitter | Ledger | Causal role | Status |
| --- | --- | --- | --- | --- | --- |
| `battle.background_encountered` | canonicalHistorical | military | conditional | AI-vs-AI contact that HistoricalGame resolves itself | proposed |
| `battle.background_resolved` | canonicalHistorical | military | yes | outcome of a background engagement | proposed |

> The background path's internal formulas are **Unresolved** (N-34), and the
> complete shared `BattleResult` schema is **Unresolved** (N-35). Whether
> `battle.prepared` / `battle.launched` / `formation.mapped_to_tactical` /
> `battlefield.resolved` / `battle.failed` exist for the background path is
> **Unresolved** — the clock behaviour and authority split are decided, only the
> event shape is open.
>
> On either path, the result is applied **as the first due work at the encounter
> SimTime** while the clock is still frozen, and remaining work at that instant
> executes against post-battle state (ADR-0003 A10). Whether battle consequences
> consume any campaign SimTime is **Unresolved** (N-33).

## Education and institutions

| Kind | Tier | Emitter | Ledger | Causal role | Status |
| --- | --- | --- | --- | --- | --- |
| `character.taught` | simulation | institutions | conditional | skill/knowledge transfer | proposed |
| `character.student_of` | canonicalHistorical | institutions | conditional | teacher relationship | proposed |
| `tradition.rivaled` | canonicalHistorical | institutions | conditional | doctrinal split | proposed |

## Player-facing notifications (tier = `playerNotification`)

| Kind | Causal role | Status |
| --- | --- | --- |
| `notify.army_engaged` | a **player-relevant** army faces an encounter; may pause | proposed |
| `notify.report_arrived` | information reached the player | proposed |
| `notify.ruler_died` | significant character death | proposed |
| `notify.crisis_active` | internal crisis became active | proposed |
| `notify.institution_progress` | legacy development | proposed |
| `notify.army_fragmented` | an army lost cohesion or broke up (ADR-0016) | proposed |
| `notify.refugees_arrived` | a displaced population reached a settlement (ADR-0017) | proposed |
| `notify.government_changed` | a faction's government changed, or an attempt failed (ADR-0018) | proposed |
| `notify.regime_unrecognised` | a foreign power refused recognition (ADR-0018) | proposed |

## Notes

- **No event counts time.** Every `simTime` in this catalogue is an absolute,
  monotonic, fixed-point measure of **elapsed simulation time**; the difference
  between two `simTime` values is the elapsed duration between them. A
  catalogue row count, an event's index, or a scheduler sequence must never be
  used as a duration (ADR-0003 A1).
- Work due at the **same** `simTime` is ordered by a separate deterministic
  mechanism, not by the timestamp (ADR-0003 A5).
- A **background AI battle** never produces `time.frozen` and never requires the
  player to be notified: combat elsewhere in the world is ordinary simulation
  (ADR-0003 A11).
- Casualty/injury/death detail events are intentionally folded into
  `character.died` and battle consequences at this stage; the catalogue will be
  refined when E8 is designed.
- The full list is expected to grow with each epic; it is a living document.
- No significance formulas are defined. Classification is contextual and
  emitter-led until a `HistoricalSignificancePolicy` is designed.
- Kind names added by the delta (ADR-0003/0015/0016/0017/0018/0020) are
  **proposals**. Names, granularity and exact tiering may change when the owning
  epic is designed; the *causal chain* they participate in is what is approved.
- `cohort` in this catalogue means an **aggregated population cohort** (ADR-0017),
  not a military cohort formation. If the word becomes ambiguous, the population
  sense should be renamed.
- Referenced `id` values are canonical identities (ADR-0009). A ledger reference
  to a dead character, ended institution or disintegrated formation stays
  resolvable forever, and is never rewritten because its target ended.
