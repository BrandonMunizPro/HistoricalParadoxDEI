# ADR-0019: Presentation boundary and visual design track

- Status: **Approved** (2026-10-04) as an architectural/presentation boundary.
  Renderer choice and Visual Design Bible scope remain **Unresolved** and are not
  locked by this approval.
- Date: 2026-10-04
- Related: blueprint §1.1 (perceivability), §1.2 (rendering candidate),
  [../architecture/vertical-slices-and-epics.md](../architecture/vertical-slices-and-epics.md)

## Context

The game must present a shared interface grammar while expressing each played
culture's own historical visual language. Presentation also risks leaking into
the simulation, and it risks blocking architecture work.

## Decision

1. **Shared UI grammar, culturally specific visual expression.** Reusable
   interface concepts (illustrative names only): `CharacterPortrait`,
   `RelationshipCard`, `OfficeCard`, `PoliticalGroup`, historical event view,
   `InfluenceIndicator`, `EntityLink`, `ArmyCommandCard`, `SettlementPanel`,
   `FamilyTree`, `GovernmentScreen`.
2. **Visual presentation varies by faction and culture**, informed by historical
   research: republican civic and inscriptional influence for Rome; Punic/Phoenician
   maritime and mercantile language for Carthage; shared Hellenic ancestry
   expressed as *distinct* Hellenistic states rather than one skin; Ptolemaic
   Egypt reflecting its actual hybrid cultural and political environment; and
   researched rather than stereotyped Gallic, Germanic, Iberian, Iranian, Central
   Asian and nomadic presentations.
   **Rule: shared UI grammar, culturally specific expression. No invented visual
   motif becomes canonical design.**
3. **Presentation is a parallel design track.** It must not block simulation
   architecture unless a simulation feature requires player perception or
   explanation. The perceivability design law (blueprint §1.1) is the coupling
   point: the simulation must be able to explain why, and presentation must be
   able to show it.
4. **The visual campaign map and the authoritative simulation geography are
   conceptually separate** (see
   [ADR-0020](0020-campaign-geography-and-tactical-battlefield-projection.md)).
   Rendering technology is **Unresolved** (Unity, Three.js or other); the
   TypeScript simulation remains authoritative regardless of presentation
   technology unless a future ADR changes that.
5. **Nothing is built in this pass.** No UI, no menu concepts, no renderer
   choice.

## Where the Visual Design Bible belongs

`docs/presentation/` — seeded by
[../presentation/presentation-requirements.md](../presentation/presentation-requirements.md).
The future Visual Design Bible is expected to cover typography feel, panel
grammar, portrait treatment, iconography, maps, borders and materials,
information hierarchy, selection/warning/event states, and cultural variation
rules, plus menu concepts for: campaign HUD, characters, family/marriage/
succession, government/politics, army hierarchy, pre-battle command, movement and
orders, intelligence and reports, diplomacy, settlement management, population
and migration, economy and trade, religion and culture, institutions and
education, relationships, chronicle/history, war overview, faction overview, and
events/decisions.

## Consequences

- Presentation depends on simulation explanation APIs (chronicle, causality
  traversal); those APIs become a design requirement of E2/E8 rather than a UI
  afterthought.
- Cultural expression lives in data and art direction, not in engine branches.
- The simulation must not import presentation concepts; domain stays engine and
  presentation agnostic.

## Rejected alternatives

| Alternative | Why not |
| --- | --- |
| One visual language reskinned per culture | Violates culturally specific expression and research grounding |
| Choosing a renderer now | Unresolved; would constrain simulation for no current benefit |
| Implementing UI as part of system epics | Would block architecture on presentation work |
| Generating motifs from generic ancient stereotypes | Explicitly forbidden |

## Unresolved

- **Unresolved:** Visual Design Bible scope, ownership and sequencing.
- **Unresolved:** renderer and map presentation technology.
- **Unresolved:** portrait and icon art pipeline.
- **Unresolved:** accessibility and information-density requirements.
- **Research-dependent:** historical visual-language grounding per culture.
