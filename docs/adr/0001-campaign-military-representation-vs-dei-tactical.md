# ADR-0001: Campaign military representation vs DeI tactical representation

- Status: **Approved** (resolves prior AD1)
- Date: 2026-10-04
- Affects: domain model, tactical adapter boundary, purity rule, `BattleState` shape
- Related: [ADR-0002](0002-authoritative-state-causal-ledger-snapshots.md), [../architecture/domain-model.md](../architecture/domain-model.md)

## Context

Divide et Impera already supplies extensive, historically grounded tactical
vocabulary. The completed research catalogues contain 4,462 units, 909 factions
and 12 relationship edge tables (unit abilities, military groupings, exclusive
factions, custom battle permissions, faction rebellion, variants, variant colours,
mountings, technology upgrades, unit set membership, building-allowed units,
armed citizenry groups).

Building a parallel historical unit taxonomy in the domain would duplicate that
work, drift from it, and create two competing tactical truths. Conversely,
adopting DeI identifiers as domain identity would make the campaign simulation
dependent on one external engine's vocabulary and break domain purity.

## Decision

1. **The campaign simulation owns persistent military formations.** A formation
   is a domain entity with stable domain identity and persistent campaign state,
   including as-designed-by-other-systems: formation identity, faction, culture
   and home region where appropriate, manpower, experience, morale, fatigue,
   equipment state, army membership, detachment membership, commander
   relationships, strategic position, history, loyalty, and supply state.
2. **The domain does not define a historical unit taxonomy that mirrors DeI.**
   The domain models campaign truth (soldiers, experience, equipment state,
   command, position) only at the granularity the simulation actually needs.
3. **DeI identifiers and catalog schema stay adapter-side.** The
   `Rome2DeIAdapter` maps campaign formations onto appropriate DeI factions and
   DeI unit keys using the extracted catalogs and relationships.
4. **`BattleState` carries campaign truth and domain formation references only.**
   It contains no DeI keys. Resolution from campaign formations to DeI
   representation happens inside the adapter at battle preparation.
5. **Representation is resolved per battle, identity is not.** The same
   persistent campaign formation changes state throughout its history and is
   re-resolved to the appropriate DeI tactical representation each time a battle
   begins.
6. **Purity rule extended:** DeI keys, catalog field names and catalog structures
   are forbidden in the domain, exactly as Rome II types already are.
7. **Amendment (Delta 2): the campaign owns the command hierarchy.** Campaign
   formations are organised as `Army → command hierarchy → command
   elements/detachments → commanders → formations`, expressed through shared
   military primitives rather than universally Roman structures. The campaign
   decides who commands what, which forces arrive and when, and which
   participating forces are player-controlled; it does **not** issue tactical
   orders during the battle. See
   [ADR-0015](0015-campaign-command-hierarchy-and-tactical-control.md).
8. **Amendment (Delta 3): cohesion is first-class campaign state.** Formation
   campaign state additionally includes **cohesion** (organisational integrity,
   distinct from morale) and command stability. Post-battle organisational
   survival is derived campaign-side. See
   [ADR-0016](0016-military-cohesion-and-post-battle-survival.md).
9. **Amendment (Delta 8): geographic analogue.** Just as DeI keys do not become
   domain identity, Rome II / DeI map and battlefield keys do not become domain
   geography. Our campaign world owns location; the adapter owns translation. See
   [ADR-0020](0020-campaign-geography-and-tactical-battlefield-projection.md).
10. **Amendment (2026-10-05): canonical identity is domain-owned.** Every
    campaign formation, army, command element and detachment holds a **canonical
    ID** governed by
    [ADR-0009](0009-identity-model.md): globally unique, immutable,
    permanently referenceable, never reused, independent of display names,
    independent of mutable domain state, independent of Rome II / DeI keys and
    of external catalog identifiers, and carrying no authoritative chronology.
    Canonical identity is distinct from authored **source** identity; an authored
    source key is content-side provenance and is not the runtime ID. Engine and
    catalog keys are resolved from canonical identity **at the boundary** and
    never become, replace or persist as domain identity.
11. **Amendment (2026-10-05): identity survives end of life.** A formation,
    army, command element or detachment ceasing to exist as an **active/extant**
    world entity does not erase, recycle or invalidate its canonical ID. Identity
    and extant state are separate concepts; the ID stays permanently
    referenceable so ledger entries, memories and chronicles keep resolving.
    Whether a specific fragmentation, split, merge or reorganization is
    continuation or creation is **left to the owning epic** (ADR-0016).
12. **Amendment (2026-10-05): one campaign-side battle outcome boundary.** A
    battle may be resolved by either of two paths, and both must produce the
    same conceptual campaign-side boundary:
    - **background non-interactive battle** — resolved by HistoricalGame's own
      campaign battle simulation; the world clock continues under normal
      scheduling rules; or
    - **interactive player tactical battle** — handed to Rome II / DeI through
      the adapter, with the campaign clock **frozen** at the encounter SimTime
      (ADR-0003 A10).
    In both cases the result crosses the existing **`BattleResult`**
    abstraction, which is sufficient for HistoricalGame to apply authoritative
    consequences. HistoricalGame **remains owner of persistent world state**.
    The complete `BattleResult` schema is **deliberately not frozen**, the two
    resolution paths are **not** required to have identical internal mechanics,
    and Rome II's representation is **never** canonical. See
    [ADR-0003](0003-strategic-command-periods-simtime-pause.md) A11/A12.

## Consequences

- Formation identity is stable across representation changes, campaigns and
  engine swaps.
- The tactical catalogs remain replaceable infrastructure; removing or
  regenerating them does not invalidate campaign state.
- Battle preparation becomes a real adapter responsibility with a mapping step
  that does not exist yet.
- The domain needs campaign-level concepts (manpower, experience, equipment
  state) but must resist the temptation to describe tactical composition.
- Canonical identity is a separate, approved concern (ADR-0009) with its own
  determinism guarantee and deliberately undecided encoding. The tactical
  boundary must never be the place where a canonical ID is minted or renamed.
- Because background battles resolve campaign-side and interactive battles
  resolve adapter-side, `BattleResult` becomes the single seam through which all
  battle consequences enter authoritative state. That keeps post-battle
  organisational survival (ADR-0016) identical in shape whichever path resolved
  the battle.
- The purity test in `tests/domain-purity.test.ts` should eventually assert the
  absence of formation-mapping vocabulary in `src/domain`.

## Rejected alternatives

| Alternative | Why rejected |
| --- | --- |
| DeI unit keys as domain unit identity | Couples campaign truth to one engine; breaks purity and engine replaceability |
| Full parallel historical unit taxonomy in domain | Duplicates DeI, guarantees drift, creates two tactical truths |
| Storing DeI-native battle payloads in domain state | Rome II would become a second authoritative strategic store |
| Ignoring DeI entirely and inventing generic units | Loses historically grounded vocabulary that already exists |

## Unresolved

- **Unresolved:** mapping fidelity — how campaign experience, manpower, morale
  and equipment state influence which DeI unit is chosen, and with what
  modifiers. Gameplay mechanic; adapter-side.
- **Unresolved:** equipment modelling granularity in the domain (aggregate
  stockpile vs per-unit-type equipment state).
- **Unresolved:** whether auxiliaries, mercenaries and regional/period units
  require distinct domain contracts beyond "formation with an attachment
  contract".
- **Research-dependent:** whether DeI's regional and period units are
  historically adequate as the source for V1 start-world formations. The
  research handoff flags unresolved catalog fields (`attribute_group` 0/4313
  resolved; campaign vs battle ground-type namespaces do not overlap), so those
  specific fields must not underpin mechanics.
- **Research-dependent:** Rome II / DeI support for mixed player/AI control of
  allied armies in one battle (see
  [ADR-0015](0015-campaign-command-hierarchy-and-tactical-control.md)).
- **Research-dependent:** Rome II / DeI support for terrain-, season- or
  weather-consistent battlefield selection from campaign geography (see
  [ADR-0020](0020-campaign-geography-and-tactical-battlefield-projection.md)).
- **Unresolved:** the complete `BattleResult` schema, and the internal mechanics
  of HistoricalGame's own background battle resolution. Only the shared
  campaign-side boundary is approved (decision 12;
  [ADR-0003](0003-strategic-command-periods-simtime-pause.md) A12).
- **Unresolved:** per-domain rules for whether a specific fragmentation, split,
  merge or reorganization of a formation, army or command element is continuation
  or creation. The canonical identity principle is approved
  ([ADR-0009](0009-identity-model.md) §4); the rules are not, and belong to
  ADR-0016 mechanics design.
