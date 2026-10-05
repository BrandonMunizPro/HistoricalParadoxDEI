# Domain relationship model

- Status: **Proposal**. Contains approved parts (marked) and unresolved parts.
- Related: [ADR-0001](../adr/0001-campaign-military-representation-vs-dei-tactical.md), [ADR-0002](../adr/0002-authoritative-state-causal-ledger-snapshots.md), [ADR-0003](../adr/0003-strategic-command-periods-simtime-pause.md), [ADR-0015](../adr/0015-campaign-command-hierarchy-and-tactical-control.md), [ADR-0016](../adr/0016-military-cohesion-and-post-battle-survival.md), [ADR-0017](../adr/0017-population-cohorts-migration-and-displacement.md), [ADR-0018](../adr/0018-mutable-government-and-political-transformation.md), [ADR-0020](../adr/0020-campaign-geography-and-tactical-battlefield-projection.md), [glossary](../domain/glossary.md)

Names and shapes below are proposals for design discussion. Items marked
**[B]** are dictated by blueprint text. Nothing here is implemented.

## 1. Standing rules

1. The TypeScript simulation owns strategic truth.
2. Rome II / DeI temporarily owns tactical battle resolution only.
3. Jev/TheRev may reason about character state but never authoritatively mutate
   world state. They live outside this repository; only knowledge-filtered
   context crosses the boundary and every proposal returns through the legal
   action gate (ADR-0012, ADR-0006).
4. Domain code contains no Rome II / DeI keys, catalog schema, XML, Lua or
   filesystem paths.
5. DeI supplies historically grounded tactical vocabulary and representation; the
   simulation supplies persistent campaign reality (**Approved**, ADR-0001).
6. The campaign world owns location; the adapter owns translation to a tactical
   battlefield; Rome II / DeI owns the battlefield representation (**Approved**,
   ADR-0020). Geography analogue of rule 4: no Rome II / DeI map or battlefield
   key enters the domain.
7. Playable scope is a content decision. All factions in the world are simulated;
   only a limited candidate set receives handcrafted playable packages
   (**Approved**, ADR-0014, ADR-0013).
8. The campaign owns the command hierarchy but issues **no** tactical orders
   during a battle (**Approved**, ADR-0015).
9. Every entity carries a **canonical identity** governed by ADR-0009:
   globally unique, immutable, permanently referenceable, never reused,
   independent of display names, mutable domain state, Rome II / DeI keys and
   external catalog identifiers, and carrying no authoritative chronology.
   Ending active existence does **not** erase or invalidate it
   (**Approved**, ADR-0009).
10. The historical calendar is **authoritative scenario data**; calendar dates
    derive mechanically from `SimTime + immutable ScenarioCalendar`. SimTime is
    **absolute and monotonic**, and display direction (including BCE) never
    reverses it (**Approved**, ADR-0003 A3).
11. SimTime is **elapsed** simulation time. It is not an event count, a scheduler
    sequence, a fidelity density, a frame count or a causal-operation count.
    Simulation is **due-work driven**; there is no fixed-step whole-world sweep
    (**Approved**, ADR-0003 A1/A4).
12. Only an **interactive external tactical handoff** freezes the campaign clock.
    Background AI-versus-AI battles are resolved by HistoricalGame internally and
    do **not** freeze the world (**Approved**, ADR-0003 A11).

## 2. Kernel primitives

| Concept | Role | Status |
| --- | --- | --- |
| `SimTime` | **Absolute, monotonic, fixed-point measure of elapsed simulation time**; independent of the command period; difference between two values is the elapsed duration between them | **Approved** (ADR-0003 A1–A2). Fixed-point **scale** **Unresolved** (**N-29**) |
| `ScenarioCalendar` | Authoritative immutable scenario calendar data (epoch, era, year numbering direction, month sequence, month boundaries/lengths, units-per-calendar-unit); calendar dates derive mechanically from `SimTime + ScenarioCalendar` | **Approved direction** (ADR-0003 A3). Numeric conversion constant **Unresolved** (**N-29**) |
| `CommandPeriod` | Approx. half-year strategic command/planning horizon, two per year, configurable; **month is the normal player-facing progression cadence within it** | **Approved** (ADR-0003 decision 1, A6) |
| Canonical entity identity | Stable, globally unique, immutable, permanently referenceable, never reused, storage-independent, serialization-safe, save/load-stable reference for characters, houses, factions, settlements, locations, formations, institutions, events; carries no mutable or chronological meaning | Contract **Approved** (ADR-0009). Representation **Approved**: **RFC 4122 UUIDv5** (ADR-0009 §5a) |
| Extant state | Whether an entity is currently an active/extant world entity. **Separate from identity**: ending existence never erases, recycles or invalidates canonical identity | **Approved** (ADR-0009 §3) |
| Source identity (`sourceKey`) | Stable authored source identifier/key used to identify an authored source entity and as an input to canonical identity derivation. **Not** the canonical runtime ID, and **separately representable** from it | **Approved** as a distinct concept (ADR-0009 §2, §5a). Field name/shape **Unresolved** and non-blocking (**N-28r**) |
| Same-instant ordering | Deterministic scheduler mechanism deciding what resolves first among work due at one SimTime. **Separate from SimTime**; independent of wall clock, hash order, presentation and fidelity tier | Properties **Approved** (ADR-0003 A5). Final key shape **Unresolved** (**N-30**) |
| Ledger event | Append-only causal record for significant occurrences | **Approved** (ADR-0002) |
| Snapshot | Durability unit for authoritative state | **Approved**; cadence **Unresolved** |
| Campaign location | Authoritative geographic position of the simulation world | **Approved** that the campaign owns location (ADR-0020); coordinate system and representation **Unresolved** |
| `BattleResult` | The single campaign-side outcome seam through which **both** battle resolution paths deliver a campaign-authoritative outcome: HistoricalGame-internal background battles, and the Rome II / DeI adapter | Boundary **Approved** (ADR-0003 A12, ADR-0001 decision 12). Complete schema **Unresolved** (**N-35**) |

## 3. Entity groups

| Group | Proposed entities | Notes |
| --- | --- | --- |
| Kernel | `SimTime` (absolute monotonic fixed-point elapsed time), `ScenarioCalendar`, `CommandPeriod`, canonical ids (ADR-0009), separate same-instant ordering, seeded RNG streams | SimTime/calendar semantics **Approved** (ADR-0003); id contract **Approved**, encoding open (ADR-0009); ordering/RNG constraints **Proposed** (ADR-0008) |
| Ledger | `HistoricalEvent` **[B §11]**: `id`, `date`, `type`, `participants[]`, `factions[]`, `locations[]`, `magnitude`, `causes[]`, `consequences[]`, `witnesses[]` | Append-only; causal traversal required |
| Geography | `Location` (region, settlement site, sea, pass, river), adjacency edges, terrain/water/road references; real-world coordinates and terrain properties where the map requires them | Feeds movement, supply, trade, intelligence, battle. Must retain a path to real geography, not adjacency alone (ADR-0020) |
| Settlement | `Settlement` (civic entity: population aggregate, production, buildings, garrisons, local authority, institutions) | Blueprint lists settlements under both Geography and their own system; separation **Assumption** |
| Polity | `Faction` (government type, institutions, laws, treasury, culture, religion, territory), `GovernmentType` (data), `GovernmentConfiguration` (mutable in-force configuration) | `GovernmentType` is a data definition; `Faction.government` is **mutable state** (ADR-0018) |
| Characters | `Character` (identity, psychology facets, traits/skills, offices, claims, wealth, prestige, influence, legitimacy, popularity, elite support, army loyalty, knowledge references, memories) | Field list **[B §4.1]** |
| Kinship | `House`/`Family`, `KinshipEdge`, `Marriage`, `LineageBranch` | Branches carry player continuity **[B §2]** |
| Social | `Relationship` (affection, trust, fear, respect, rivalry, obligation + memory references) | Multi-axis simultaneously **[B §4.1]**; storage shape **Unresolved** |
| Authority | `Office`, `Title`, `MilitaryCommand`, `Claim` (character or house, with legitimacy basis) | Offices/commands belong to the world **[B §7]** |
| Institutions | `Institution` **[B §5.2]** | Blueprint-given shape |
| Military | `Army`, `CommandElement` (supreme/main command, vanguard, main body, rearguard, supply train, independent detachments), `Formation` (campaign truth), `Detachment` | Formation content **Approved** (ADR-0001); command hierarchy **Approved** (ADR-0015); **shared primitives, not Roman-specific structures** |
| Information | `Observation`, `Report`, `Rumor` (lineage, mutations), `KnowledgeEntry` (belief), `Testimony` (cohort-sourced) | Truth/report/rumor/belief separation **[B §8]**; cohort testimony channel **Approved direction** (ADR-0017) |
| Reputation | `Reputation` (subject, audience, standing) | Audience-dependent **[B §8, §13]** |
| Economy | `PopulationAggregate`, `PopulationCohort` (mobile aggregated population carrying culture, religion, displacement cause and collective history), `Production`, `PriceIndex`, settlement-scoped `Unrest` | Cohorts **Approved direction** (ADR-0017); cohort schema **Proposal/Unresolved**; settlement granularity **[B §1.2 unresolved]** |
| Political transformation | `TransformationAttempt`, `RegimeRecognition` (recognising/refusing actor, target, basis) | **Approved direction** (ADR-0018); vocabulary and thresholds **Unresolved** |

### 3.1 Formation: the campaign/tactical boundary entity

Per ADR-0001 (**Approved**), a `Formation` holds persistent campaign state:

- formation identity, faction, culture, home region where appropriate;
- manpower, experience, morale, fatigue, **cohesion**;
- equipment state;
- army membership, detachment membership, **command element membership**;
- commander and subordinate commander references, plus their relationship links;
- strategic position (location);
- supply and loyalty state, **command stability**;
- history (ledger references).

`Cohesion` (**Approved concept**, ADR-0016) is organisational integrity and is
distinct from morale, which is willingness to continue fighting. Cohesion
granularity (formation / command element / army) is **Unresolved**.

It deliberately does **not** hold DeI unit keys, tactical composition taxonomy, or
catalog field names. At battle preparation, the adapter resolves the formation
to DeI factions and unit keys inside `src/tactical/adapters/rome2-dei`, and
`BattleState` carries only campaign truth plus formation references.

> BattleState (domain) → Rome2DeIAdapter → resolution using extracted catalogs
> → Rome II / DeI → BattleResult → simulation applies consequences

The same formation may resolve to different DeI representation at different
points in its history as campaign state changes. Mapping fidelity is
**Unresolved**.

Every formation, army, command element and detachment holds a **canonical ID**
per ADR-0009 (**Approved**): immutable, permanently referenceable, never reused,
and independent of DeI keys and external catalog identifiers. Authored content
may carry a stable `sourceKey` used as an input to derivation, but that is **not**
the canonical runtime ID. Engine keys are resolved from canonical identity at the
boundary and never become, replace or persist as domain identity.

### 3.2 Command hierarchy: campaign authority, no tactical orders

Per ADR-0015 (**Approved**):

```
Army ──▶ CommandElement (supreme/main command, vanguard, main body,
        │  rearguard, supply train, independent detachment)
        └──▶ Commander (character)
              └──▶ Detachment ──▶ Formation
```

- These are **shared military primitives**, not universally Roman structures.
  Cultures and polities organise themselves differently with the same primitives.
- The campaign determines, **before** the battle: who commands each force, which
  formations belong to which command element, which forces arrive and when, and
  **which participating forces are player-controlled versus AI-controlled**.
- The campaign issues **no tactical orders** during the battle. There is no
  "attack left", "hold the centre" or "support here" protocol, and no invented AI
  tactical intent is inferred after the battle.
- The control mapping is authoritative campaign fact; the adapter maps it onto
  engine-side player/AI control. Whether Rome II / DeI supports mixed player/AI
  allied control is **Research-dependent**.

### 3.3 Post-battle organisational survival

Per ADR-0016 (**Approved concept**), a battle result is not reduced to
`start − casualties = remaining`. Organisational outcomes are derived
campaign-side: organised retreat, disorganised retreat, scattered formations,
desertion, capture, surrender, regrouping around surviving commanders, partial
fragmentation, or complete disintegration. Candidate inputs include commander
survival, subcommander survival, reputation, recent results, veteran composition,
fatigue, supply, loyalty, encirclement, terrain and escape routes, retreat
orderliness, contingent tensions, disease and political crisis.

**No formulas, thresholds, decay or recovery rates are decided.** Whether the
player may order a campaign-side retreat or disengagement is **Unresolved**.

Organisational survival is computed campaign-side on **both** battle paths. A
battle is resolved either by HistoricalGame internally (a background
AI-versus-AI battle, with the world clock continuing) or by Rome II / DeI through
the interactive handoff (with the clock **frozen** at the encounter SimTime). In
both cases the outcome crosses the same `BattleResult` boundary and consequences
are applied by the campaign, never requested from the engine (ADR-0003 A11/A12,
ADR-0016 decision 9).

An army that disintegrates, scatters or is disbanded ceases to be an
**active/extant** entity but **keeps a permanently referenceable canonical ID**,
so later ledger entries, memories, reputations and chronicles keep resolving to
it (ADR-0009 §3). Whether a given fragmentation produces a *new* canonical ID is
a **domain rule still Unresolved** (ADR-0009 §4, ADR-0016; register **N-36**).

### 3.4 Battle resolution paths: background vs interactive

Per ADR-0003 (**Approved**), a battle has two resolution paths that differ in
clock behaviour but converge on one outcome seam:

```
BACKGROUND NON-INTERACTIVE BATTLE (AI vs AI, no handoff)
  encounter at SimTime T
    → HistoricalGame internal battle simulation uses authoritative campaign
      military state (composition, strength, quality, commanders, formation,
      morale, cohesion, fatigue, supply, terrain, positioning, reinforcement
      state, operational circumstances, bounded deterministic/random factors)
    → BattleResult
    → campaign applies organisational survival and consequences (ADR-0016)
    → world clock continues under normal scheduling; no freeze

INTERACTIVE PLAYER TACTICAL BATTLE (external handoff)
  encounter at SimTime T
    → HistoricalGame freezes the shared campaign clock at T
    → BattleState (campaign truth only, no DeI keys)
    → Rome2DeIAdapter → Rome II / DeI resolves tactically
    → BattleResult
    → HistoricalGame applies BattleResult as first due work at T
    → remaining due work at T executes against post-battle state
    → campaign resumes from T
```

- Real-world tactical duration consumes **zero** campaign SimTime (ADR-0003 A10).
- Arrival and reinforcement timing are campaign-side commitments expressed as
  offsets from `T`, counted down after resume (ADR-0015 amendment 2026-10-05).
- The **complete `BattleResult` schema is not frozen** (**N-35**) and the two
  paths are **not** required to have identical internal mechanics. Rome II's
  representation is never canonical.
- Internal background battle formulas are **not designed** here (**N-34**).
- **The freeze is bound to the interactive handoff, not to the existence of a
  battle.** Because every faction is simulated regardless (ADR-0014), freezing
  per battle would make the campaign stutter indefinitely.

## 4. Relationships

```
House ──kinship/marriage──▶ House
Character ──kinship/marriage──▶ Character
Character ──social (multi-facet)──▶ Character
Character/House ──holds──▶ Office | Title | MilitaryCommand
Character/House ──claims──▶ Claim            (legitimacy basis recorded)
Character ──commands──▶ CommandElement ──subordinateTo──▶ CommandElement
CommandElement ──belongsTo──▶ Army ──contains──▶ Detachment ──positionedAt──▶ Location
Detachment ──memberOf──▶ Formation           (ADR-0001)
Faction ──governedBy──▶ GovernmentType      (data, culture/religion scoped)
Faction ──hasGovernment──▶ GovernmentConfiguration  (MUTABLE state, ADR-0018)
Faction ──attemptedTransformation──▶ TransformationAttempt ──target──▶ GovernmentType
Faction ──recognisedBy / refusedBy──▶ Faction  (RegimeRecognition, ADR-0018)
Faction ──treaty/war/alliance/trade/marriage──▶ Faction   (+ authority provenance)
Settlement ──at──▶ Location
Settlement ──hosts──▶ Institution
Settlement ──garrisonedBy──▶ Detachment
Settlement ◀──hosts── PopulationCohort        (aggregated movers, ADR-0017)
PopulationCohort ──movesTo──▶ Location | Settlement
PopulationCohort ──carries──▶ Testimony ──feeds──▶ KnowledgeEntry
Observation ──reportedAs──▶ Report ──mayDistortInto──▶ Rumor ──believedAs──▶ KnowledgeEntry
Reputation ──audience──▶ Faction | Settlement | Culture
Any system change ──emits──▶ Domain event ──causes──▶ Domain event
  ├─ classification: simulation | information | canonicalHistorical | playerNotification
  └─ canonicalHistorical entries append to the causal ledger (ADR-0002)
BattleEncounter ──at──▶ Location ──▶ geographic context ──▶ TacticalLocationContext
  ──▶ BattlefieldResolver (adapter) ──▶ Rome II / DeI battlefield ──▶ BattleResult
  └─ BattleState ──▶ BattleAdapter ──▶ BattleResult ──appliedAs──▶ canonicalHistorical event
```

Battle outcome convergence (**Approved**, ADR-0003 A12 / ADR-0001 decision 12):

```
Background AI-vs-AI battle ──▶ HistoricalGame internal resolution ──┐
                                                                  ├──▶ BattleResult
Interactive handoff: BattleState ──▶ BattleAdapter ──▶ result ────┘        │
                                                                          ▼
                                        HistoricalGame applies authoritative consequences
                                        and remains owner of persistent world state
```

Consequence chain required by ADR-0017 (**Approved direction**), and explicitly
**not** a faction relation modifier:

```
Displacement ──▶ cohort movement ──▶ observation / testimony / reports
              ──▶ knowledge ──▶ interpretation ──▶ political or diplomatic action
```

## 5. Aggregate boundaries (discussion only; ADR-0007 deferred)

| Candidate aggregate | Contains | Known risk |
| --- | --- | --- |
| World/time | clock, period boundary, registry | Must not become a world manager |
| Faction political | government, offices, claims, legitimacy/pressure terms | Needed cohesion for crisis detection; now also owns mutable `Faction.government` (ADR-0018) |
| Character | facets, offices, claims, relationships it owns, memory refs | Large fan-out at maturity scale |
| House/kinship | family graph, marriages, branches | Cross-house queries |
| Army | army, command elements, commanders, orders, supply, position, cohesion | Prevents two writers of campaign movement |
| Formation | campaign military state incl. cohesion, command element membership | Large fan-out at maturity scale; per-command-period updates |
| Geography | locations, adjacency, coordinates, terrain properties | Mostly read model; spatial partitioning for cohorts and armies (ADR-0004) |
| Settlement | civic state, aggregates, production, garrisons | Cross-system writes must go via events |
| Population cohort | cohort size, origin, current location, culture/religion, displacement cause | Long-distance movement and multi-generation residence (**Unresolved**) |
| Institution | founder, leader, teachers, students, prestige | Long-lived entities spanning many periods |
| Knowledge | derived projections per actor | Derived; never authoritative |

## 6. Cross-system mutation rule

Systems do not write each other's state directly. Cross-system consequences are
emitted as domain events (ADR-0002, ADR-0005), which are what the ledger records
when significant, what knowledge propagation reacts to, and what the player-facing
"why" explanation traverses.

## 7. Open modelling questions

- Storage shape for multi-axis relationships (facets versus separate edges).
- Whether `Settlement` and `Location` are separate aggregates (**Assumption**).
- Whether army loyalty is per-army, per-commander, or both.
- How `Claim` legitimacy differs from `Office` legitimacy.
- Whether reputation is stored or purely derived from ledger history.
- Whether observations are immutable facts or re-observable events.
- How culture itself changes over time (§6 treats culture as context).
- **Unresolved:** cohesion granularity and storage shape; whether cohesion is an
  aggregate value or an emergent property of command structure and morale
  (ADR-0016).
- **Unresolved:** `PopulationCohort` schema, size granularity, merge/split
  behaviour, movement resolution, assimilation over generations, and promotion
  criteria to `Character` (ADR-0017).
- **Unresolved:** whether `GovernmentConfiguration` is a distinct entity or a
  field set on `Faction`, and how hybrid political arrangements are represented
  (ADR-0018).
- **Unresolved:** canonical coordinate system and geometry for campaign
  locations, and which geographic dimensions participate in tactical matching
  (ADR-0020).
- **Unresolved:** control-mapping granularity for allied forces — per tactical
  army, per command element, or per formation (ADR-0015).
- **Unresolved:** concrete representation of the `sourceKey` field itself, and
  whether a runtime UUID dependency is added or RFC 4122 v5 derivation is
  implemented directly. The canonical ID **type and derivation specification are
  Approved** (ADR-0009 §5a); these are non-blocking implementation and content
  details.
- **Unresolved:** whether a specific fragmentation, split, merge, succession or
  reorganization is continuation, survival, termination or creation. The general
  principle is **Approved** (ADR-0009 §4); no universal merge/split rule was
  created deliberately.
- **Unresolved:** SimTime fixed-point scale and the numeric value of the
  scenario calendar's units-per-calendar-unit constant (ADR-0003 A3).
- **Unresolved:** the final shape of the same-instant ordering key
  (ADR-0003 A5). Retroactive execution is **Resolved: no** (ADR-0003 A13).
- **Unresolved:** internal formulas for HistoricalGame's background battle
  resolution, and the complete shared `BattleResult` schema (ADR-0003 A11/A12).
