# ADR-0013: Content data for cultures, religions and government types

- Status: **Research-dependent**
- Date: 2026-10-04
- Related: blueprint §6, ADR-0001, research handoff

## Context

The simulation must express authority, education, prestige, political conflict,
knowledge transmission and events differently across societies using shared
primitives, without becoming a Roman simulation with different portraits. The
implementation rule in the blueprint is that culture-specific behaviour should
usually be expressed through data, rules, event conditions, roles, weights,
permissions and decision models built on shared primitives; bespoke mechanics are
allowed only where a society genuinely requires them.

## Decision

Deferred, and explicitly research-dependent. Two rules are firm:

1. **No culture-specific mechanics may be implemented from stereotypes or
   guessed history.** Content must cite research or be flagged as placeholder.
2. **The engine side must stay generic.** Differences belong in data and rules,
   not in per-culture branches of engine code.

## Content domains implied by the blueprint

- authority roles (council, kingship, clan, religious authority, court office);
- education/instruction channels (household tutoring, military mentorship,
  priestly instruction, apprenticeship, oral tradition, formal school);
- prestige sources (triumph, office, lineage, religious standing, patronage,
  wealth, battlefield reputation);
- political conflict patterns;
- kinship and succession rules;
- event conditions and consequences.

## Amendments from the design delta

3. **`GovernmentType` is a data definition; `Faction.government` is mutable
   state** ([ADR-0018](0018-mutable-government-and-political-transformation.md)).
   Content must therefore also describe *possible transformations*: which
   government types a polity may plausibly move between, what offices and
   permissions differ, what institutional resistance exists, and how foreign
   recognition is granted or refused. A government type is not a terminal
   configuration.
4. **Playable packages are a content scope decision, not a simulation scope
   decision** ([ADR-0014](0014-single-player-mvp-scope.md)). A limited set of
   factions may receive handcrafted playable packages while **all** factions
   continue to be simulated. Candidate playable coverage, explicitly
   research-dependent and not a commitment:
   Rome, Carthage, one Iberian polity, Ptolemaic Egypt, Seleucid Empire,
   Antigonid Macedonia, Epirus, one Gallic polity, one Germanic polity, Parthia,
   and Bactria or one nomadic polity. The playable set exists to *prove* the
   simulation expresses many cultures through shared primitives — it is not the
   set of cultures the simulation knows.
5. **Cultural visual expression is separate content.** Presentation varies per
   culture while interface grammar stays shared
   ([ADR-0019](0019-presentation-boundary-and-visual-design-track.md)); visual
   content is researched, never generated from generic ancient stereotypes.
6. **Geography content has two distinct research tracks** ([ADR-0020](0020-campaign-geography-and-tactical-battlefield-projection.md)):
   physical geography (potentially reusable modern GIS/elevation data) and
   historical geography (borders, settlements, roads, territories for the chosen
   start period), which must be researched separately. Modern political borders
   are not evidence for the ancient world.

## Unresolved

- **Unresolved:** which institutions are generic engine concepts and which need
  bespoke mechanics.
- **Unresolved:** V1 government types and factions required for the first
  playable vertical slice.
- **Unresolved:** which family/kinship rules must be culture or religion
  specific at launch.
- **Unresolved:** the government-type transition graph per polity and period, and
  how hybrid political arrangements are described in data.
- **Unresolved:** the actual playable faction list for V1 and what a "playable
  package" must minimally contain.
- **Research-dependent:** historical grounding for every culture-specific rule
  set shipped.
- **Research-dependent:** which candidate playable factions are actually
  implementable at acceptable content cost for the chosen start period.
