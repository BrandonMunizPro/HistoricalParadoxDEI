# Presentation requirements

- Status: **Proposal** (seed document for the future Visual Design Bible)
- Date: 2026-10-04
- Authority: [ADR-0019](../adr/0019-presentation-boundary-and-visual-design-track.md)

## Purpose

This document seeds the parallel visual design track. It exists so presentation
work can proceed without blocking simulation architecture, and so the simulation
knows what it must eventually be able to explain. It is **not** an
implementation plan and contains no renderer choice.

## Non-negotiable rules

1. **Shared UI grammar, culturally specific visual expression.** Interface
   concepts are reusable across cultures; their visual language is researched per
   culture.
2. **No invented motifs.** A visual convention becomes canonical only with
   historical grounding. Generic "ancient" stereotypes are forbidden.
3. **No simulation contamination.** Presentation reads simulation state; it
   never writes it. `playerNotification` is a projection, not authority
   ([ADR-0005](../adr/0005-event-taxonomy-and-historical-significance.md)).
4. **Renderer undecided.** Unity, Three.js or other are all open. The TypeScript
   simulation remains authoritative regardless.

## Shared interface grammar (illustrative names only)

- `CharacterPortrait`
- `RelationshipCard`
- `OfficeCard`
- `PoliticalGroup`
- `ArmyCommandCard`
- `SettlementPanel`
- `FamilyTree`
- `GovernmentScreen`
- Historical event view
- `InfluenceIndicator`
- `EntityLink`

## Cultural expression starting points (research required)

| Culture / polity | Expression direction (not a design) |
| --- | --- |
| Rome | Republican civic and inscriptional register; office, lineage, military glory |
| Carthage | Punic/Phoenician maritime and mercantile register |
| Hellenistic states | Shared Hellenic ancestry expressed as **distinct** states (Ptolemaic, Seleucid, Antigonid, Epirote), not one skin |
| Ptolemaic Egypt | Hybrid Egyptian-Greek political and cultural environment as it actually was |
| Gallic, Germanic, Iberian, Iranian, Central Asian, nomadic | Researched presentations; no stereotype defaults |

## Visual campaign map vs authoritative geography

The rendered campaign map is a **presentation of authoritative simulation
geography**, not a second source of truth, and is conceptually separate from the
tactical battlefield projection ([ADR-0020](../adr/0020-campaign-geography-and-tactical-battlefield-projection.md)).

## Simulation requirements presentation creates

Because of the perceivability design law, presentation depends on the simulation
being able to answer:

- why did this happen? (causal traversal from the ledger, ADR-0002)
- what does this character believe, and how do they know it? (provenance chains,
  ADR-0005)
- who commanded this force, and why did the army disintegrate?
  ([ADR-0015](../adr/0015-campaign-command-hierarchy-and-tactical-control.md),
  [ADR-0016](../adr/0016-military-cohesion-and-post-battle-survival.md))
- where did these people go, and what did they carry with them?
  ([ADR-0017](../adr/0017-population-cohorts-migration-and-displacement.md))
- who recognises this government, and who refuses?
  ([ADR-0018](../adr/0018-mutable-government-and-political-transformation.md))

These are simulation API requirements, not UI features.

## Expected Visual Design Bible scope

- typography feel, panel grammar, portrait treatment, iconography
- maps, borders and materials
- information hierarchy
- selection, warning and event states
- cultural variation rules

## Candidate menu / screen concepts

campaign HUD; characters; family, marriage and succession; government and
politics; army hierarchy; pre-battle command; movement and orders; intelligence
and reports; diplomacy; settlement management; population and migration; economy
and trade; religion and culture; institutions and education; relationships;
chronicle and history; war overview; faction overview; events and decisions.

## Unresolved

- **Unresolved:** Visual Design Bible ownership, authoring process and
  sequencing.
- **Unresolved:** renderer, map presentation technology, art pipeline.
- **Unresolved:** accessibility, density and platform requirements.
- **Research-dependent:** historical visual grounding per culture, and whether
  research sources exist at usable fidelity for each candidate playable faction.
