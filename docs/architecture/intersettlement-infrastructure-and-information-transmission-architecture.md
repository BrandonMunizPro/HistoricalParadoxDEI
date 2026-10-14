# Intersettlement infrastructure and information transmission architecture

**Status: Proposal (2026-10-14).** This document proposes how *intersettlement
infrastructure* (roads, bridges, passes, ferries, ports and river transport) and
*physical information transmission* (observers, messengers, delivery, delayed
orders) exist as **authoritative simulation state**. It uses **Napoleon: Total
War's upgradeable roads** as a *design reference only* and develops a historically
appropriate system for the **278 BCE** start.

It implements **no code**, changes **no `src/` or `tests/`**, narrows **no ADR**,
and does **not touch** the in-flight **VS-5** geography work. Everything here is a
**Proposal** and stays **OPEN**.

- Date: 2026-10-14
- Coordinates with: [ADR-0020](../adr/0020-campaign-geography-and-tactical-battlefield-projection.md)
  (campaign geography — already names **roads** as authoritative geography),
  [ADR-0003](../adr/0003-strategic-command-periods-simtime-pause.md) (SimTime,
  elapsed durations, no retroactive execution),
  [ADR-0002](../adr/0002-authoritative-state-causal-ledger-snapshots.md) (causal
  ledger), [ADR-0005](../adr/0005-event-taxonomy-and-historical-significance.md)
  (event taxonomy), [ADR-0006](../adr/0006-legal-action-and-proposal-validation.md)
  (legal-action gate), [ADR-0009](../adr/0009-identity-model.md) (canonical
  identity), [ADR-0017](../adr/0017-population-cohorts-migration-and-displacement.md)
  (population cohorts — corvée, testimony), [ADR-0019](../adr/0019-presentation-boundary-and-visual-design-track.md)
  (presentation boundary).
- Related: [geography-integration-requirements.md](geography-integration-requirements.md),
  [military-architecture.md](military-architecture.md),
  [economic-authority-architecture.md](economic-authority-architecture.md),
  [political-office-and-government-architecture.md](political-office-and-government-architecture.md),
  [event-taxonomy.md](event-taxonomy.md),
  [legal-action-architecture.md](legal-action-architecture.md),
  [character-interaction-and-event-architecture.md](character-interaction-and-event-architecture.md),
  [system-dependency-graph.md](system-dependency-graph.md).

## 1. Purpose and scope

The simulation needs one place that states how **the physical network that links
settlements** — the thing along which armies, goods, orders and news all move —
exists as **authoritative state**, and how that one network serves **four
different consumers** without becoming four systems. It also states how
**information physically travels** that network, so that knowledge is *delivered*,
*delayed*, *lost*, *intercepted* or *distorted*, rather than teleported.

**In scope:** authoritative infrastructure state and its layers; route-quality
and condition models; construction, maintenance and deterioration as simulation
changes; bridges, passes, ferries, ports and river transport as infrastructure
nodes; the four consumers of one network; the information-transmission model
(events, observers, knowledge holders, messengers, delivery, reliability,
interception, delayed orders); ownership boundaries; relevant ADRs and open
decisions.

**Out of scope (this pass):**

- no implementation, and no `src/`/`tests/` change;
- no interference with Codex's active **VS-5** geography work, and no reopening of
  **AD-19** (coordinates) or **G1/G2** geography scope;
- no renderer, map-art, road-mesh or port-model design (presentation track;
  ADR-0019, **AD-18**);
- no historical travel-speed, messenger-rate or courier-numbers **values** (that
  is content + research: **[R-12](assumptions-and-open-decisions.md)** and the new
  **R-17** proposed here; standing constraint 15 — geography owns no rates);
- no new unit taxonomy, no engine keys, no Rome II / DeI identifiers in the
  domain (ADR-0001, ADR-0020).

## 2. Design reference: Napoleon: Total War's roads (borrow / do not borrow)

Napoleon: Total War's campaign map gives each region a **road tier** that the
player can **upgrade** (roughly dirt → improved → paved); higher tiers increase
**movement range** and **trade income**, and **ports** are upgradeable nodes.

**Borrow (as concepts, not assets):**

- roads as a **tiered, upgradeable property of geography**, not decoration;
- an **upgrade is a build action** that costs resources and time;
- better roads help **both movement and economy** at once (one network, several
  effects);
- **ports are nodes** with their own level/capability.

**Do not borrow:**

- a **three-tier linear** ladder as the model (real 278 BCE roads are a *spectrum*
  with qualitatively different kinds — see §4);
- **instant, purely-visual** upgrades (here an upgrade changes **simulation
  state**, §5);
- **default paved highways** everywhere (at 278 BCE, monumental paved roads are
  rare and regionally specific — §4; anachronism guards in §12);
- engine art, icons or "region development" abstractions.

## 3. The layers that must stay distinct

The same failure mode the military architecture guards against applies here:
conflating these layers is the defect this document exists to prevent.

| # | Layer | What it is | Who owns it |
| --- | --- | --- | --- |
| 1 | **Authoritative geographic identity** | Immutable: *what a place or edge is* (canonical ID, terrain, river/coast, elevation, slope; the graph) | Geography (E3); ADR-0020, `geography-integration-requirements.md` §2–3 |
| 2 | **Authoritative infrastructure state** | **Mutable**: route quality/condition of an edge; existence and state of a bridge, ford, ferry, pass, port or river-transport link; who maintains it; current traffic capacity modifiers | **Infrastructure system (proposed, E20)** |
| 3 | **Authoritative information state** | Observations, reports in transit, beliefs held, and the messengers carrying reports | Knowledge system (E5) |
| 4 | **Movement / delivery derivation** | Path cost and elapsed **SimTime** for movement and report travel, computed from layers 1–3 | Movement (E6) and knowledge travel (E5) |
| 5 | **Presentation** | How roads, bridges, ports and messengers are *drawn*; how quality/condition are *shown* | Presentation track (ADR-0019) |

Layer 1 **never changes** because a road is built; layer 2 changes. Building or
upgrading a road **never mints a new place identity** (ADR-0009). The rendered
road is a presentation of layer 2, exactly as the rendered army is a presentation
of military state (ADR-0019, `military-architecture.md` §9).

### 3.1 The geography / infrastructure sub-boundary (ADR-0020 coordination)

ADR-0020 decision 2 already lists **roads** among *campaign geography*
(authoritative simulation state), and `geography-integration-requirements.md` §2
defines a `GeographicConnection` edge with a **kind** (route / river-crossing /
pass). This proposal refines that boundary **without contradicting it**:

- **Immutable geographic facts** stay geography's: *there is an edge here, of this
  kind, over this terrain.*
- **Mutable infrastructure facts** are a **separate record keyed to the same
  canonical edge/node identity**: *the route's current quality and condition; the
  bridge's state; the ferry's operation; the port's works.*
- Geography therefore owns the **possible** network; infrastructure owns the
  **current** network. Movement and information-travel read **both**.

**Rule.** Infrastructure is **mutable state on top of immutable geography** —
never a rewrite of the geographic graph and never a second geography.

## 4. Authoritative infrastructure state (layer 2)

### 4.1 Route quality — a spectrum, not a ladder

A **route segment** is infrastructure state attached to a geographic edge. Its
**quality class** is content (ADR-0013), proposed for 278 BCE as a spectrum
(not every region has every class):

| Quality class (proposed) | Historical anchor at 278 BCE | Traffic | Season exposure |
| --- | --- | --- | --- |
| **Footpath / track** | unmade paths, mountain paths | foot, pack animal | high (weather-dependent) |
| **Wagon / cart road** | *hamaxitos*; gravelled *viae glareatae*; Persian/Seleucid and Mauryan trunk routes in unmade stretches | carts, wagons, small bodies | moderate |
| **Engineered / paved road** | *viae munitae* (e.g. the Via Appia begun 312); Greek processional ways; certain royal highways | all-weather, columns, wheeled traffic | low |
| **State post road** (optional, rare) | relay/station roads (Persian *Royal Road* tradition; **not** the Roman *cursus publicus*, which postdates 278) | couriers, relays, officials | low |

Right-of-passage and **route quality** are properties of the segment. Terrains
that force a **bottleneck** (a pass, a bridge, a ford, a crossing) convert a
segment into a **node** with its own state (below).

### 4.2 Infrastructure node kinds (bridges, passes, ferries, ports, rivers)

| Node kind | State it carries | Historical anchor at 278 BCE | Failure mode |
| --- | --- | --- | --- |
| **Ford** | passable depth/season | most river crossings | floods make it impassable |
| **Bridge** | type (pontoons / timber / stone), span, condition | timber bridges; **few** stone bridges this early; boat bridges | washed out, burned, decayed |
| **Ferry** | operation, capacity, season | river and strait ferries | stopped by weather/ice/enemy |
| **Pass / defile** | seasonal passability; fortification state | Thermopylae, Cilician Gates, Zagros passes, Hindu Kush passes | snow closure, blockade |
| **Port / harbour** | class (open roadstead / sheltered / built works / naval base), draught, capacity | Alexandria, Carthage, Piraeus, Rhodes, Syracuse | storm, siege, silting |
| **River-transport link** | navigability, directionality, season | Nile, Tigris–Euphrates, Po, Rhône, Danube approaches | low/high water, currents |

**Asymmetries that must be modelled:** a river is **cheaper downstream than
upstream**; a pass is **cheaper (or closed) by season**; a ferry crossing adds a
**service delay**; a port enables a **distinct transport mode** (sea) with its own
risk profile.

### 4.3 Ownership, control, maintenance (never conflated)

Mirroring the economic layer (ADR-0026 / `economic-authority-architecture.md` §2)
and the political layer:

| Concept | Answers | Example at 278 BCE |
| --- | --- | --- |
| **Ownership** | *Whose is the road/bridge/port by right?* | a *via publica* is public; a temple's processional way is sacral |
| **Control (custody / administration)** | *Who maintains or holds it now?* | a censor's road works; a garrison holding a pass; an occupier holding a bridge |
| **Maintenance authority** | *Who may legally spend to keep it up?* | a magistrate's *cura viarum* competence; a king's corvée decree; a city's liturgy |
| **Tolls / passage charges** | *Who may levy passage?* | customs at a port; a bridge toll (where attested) |

**Rule.** A road's **quality/condition is formed by maintenance actions over
time**, not set by ownership. Control (custody) and maintenance authority are
**separate** from ownership (as with assets and spending authority elsewhere).

## 5. Construction, maintenance and deterioration are simulation changes

**Road upgrades change simulation infrastructure state — not visual assets.**
This is a primary requirement (§11 invariant). Proposed mechanics (shape only;
values are content/research):

- **Build / upgrade**: a **legal action** (ADR-0006) that cites a maintenance
  authority and a **spending authorization** (AD-26). It costs resources and
  consumes **elapsed SimTime** (a work item progresses over time, not instantly),
  and when complete it **changes the segment's quality class** in layer 2.
- **Maintain**: a recurring action that restores **condition**; neglect lets it
  fall. Iterated maintenance is how a road *stays* good.
- **Deteriorate**: condition decays from **neglect, weather (season), floods,
  war, and traffic** — a *derived* process, not a scripted event (mirroring
  corruption-as-derived-discrepancy in E19).
- **Damage / deny**: bridges can be **burned or demolished**, passes **blocked**,
  ports **silting** or **blockaded**; a **scorched-earth** action denies a route.
- **Repair / restore**: the inverse, again a legal action with a cost and a
  duration.

Every one of these emits events through the **event taxonomy** (ADR-0005):
the **change** to simulation state is authoritative and canonical-when-significant
(`infrastructure.built` / `upgraded` / `damaged` / `lost`), while per-tick progress
is a `simulation`-tier occurrence until it matters.

> **Invariant (restated from §3).** A build/upgrade **mutates layer 2**. The
> presentation layer may then *draw* it, but the presentation layer never grants
> the benefit: movement and economy read the **state**, never the art.

## 6. One network, four consumers

The same geographic network serves four consumers. They **share the substrate**
and **do not each own a copy**:

| Consumer | What it reads from infrastructure | Owning epic / layer |
| --- | --- | --- |
| **Military logistics & movement** | route quality/condition → march cost; passes/ports → strategic options; supply along a route | E6 (+ E3), supply/depots (military) |
| **Economic transport** | route/bridge/ferry/port availability → the cost and reach of moving goods; tolls; trade routes | E12 / E19 (economy, financial ledger) |
| **Political administration** | reach and speed of a polity's writ; governor↔centre links; military roads for control | E9/E18 (offices, government) |
| **Information transmission** | route quality/season → **report delivery time**; messengers travel the network; interception | **E5** (knowledge) + this proposal |

**Rule.** The four consumers read the **same** layer-2 state. Geography supplies
distance/cost **inputs**; infrastructure supplies a **quality/condition input**;
the *time* a movement or a report consumes is derived as **elapsed SimTime**
(ADR-0003 A13/A14) — **no historical rate is embedded in geography or
infrastructure** (standing constraint 15; **[R-12]** supplies rates as content).

## 7. Information transmission model

This extends the approved **E5** chain (`Observation → Report → Rumor → Belief`,
`event-taxonomy.md` §3, `vertical-slices-and-epics.md` E5) with the **physical,
infrastructure-dependent** parts. Every element is **authoritative simulation
state** or a **derived view**; none is presentation.

### 7.1 The elements to distinguish

| Element | Definition | Authority |
| --- | --- | --- |
| **Event (world fact)** | What actually happened — a canonical or simulation occurrence at a place and SimTime | World truth (ADR-0002/0005) |
| **Observer** | Whoever **directly perceived** a fact: a character, a scouting formation, a settlement watch, a **population cohort** (testimony, ADR-0017), a ship's crew, a merchant | Simulation |
| **Observation** | The recorded act of perceiving a fact by an observer (who/what/where/when, fidelity) | Knowledge system |
| **Knowledge holder** | A character, faction, house or institution that **holds a belief**, with a **lens** (bias, standing reliability, prior knowledge) | Knowledge system (beliefs are per-holder, never truth) |
| **Report** | An observation **encoded for transmission** by a messenger: origin, subject, stated content, claimed provenance | Knowledge system |
| **Messenger** | A **moving entity** (runner, rider, ship, caravan, herald) carrying one or more reports along the network; has a position, a route, a speed basis, and a vulnerability | Knowledge system (an entity with canonical ID) |
| **Relay / station** | An infrastructure node enabling a **change of mount or carrier** (post road) — optional, rare at 278 | Infrastructure (layer 2) + knowledge |
| **Delivery** | The arrival of a report at a knowledge holder → a **belief update** | Knowledge system; arrival time derived (SimTime) |
| **Reliability / fidelity** | How faithful the delivered belief is: the observer's accuracy × transmission mutation × messenger reliability | Knowledge system (recorded) |
| **Interception** | A third party **seizing or reading** a messenger/report in transit; the interceptor gains knowledge; the sender may never learn | Knowledge system + military |
| **Delayed order** | An **instruction** sent to a subordinate that arrives **later** than issued and may be **obsolete** by delivery | Command/e6 proposes; knowledge delivers |

### 7.2 The transmission chain (extension of E5)

```
world event (authoritative fact, at a place + SimTime)
  → observation.made            (an observer perceives it; fidelity recorded)
  → report.encoded              (a message is prepared for a messenger)
  → messenger.dispatched        (a moving entity enters the infrastructure network)
  → [ travel along route segments/nodes, consuming elapsed SimTime,
      subject to route quality, season, and interception ]
  → messenger.arrived | messenger.lost | messenger.intercepted
  → delivery.arrived            (a knowledge holder's belief updates)
  → report.rumored              (further spreading mutates fidelity)
  → character/faction belief    (derived view; E5)
```

**Rules.**

1. **Observation is not knowledge.** A fact exists whether or not anyone saw it;
   only observations create beliefs (`military-architecture.md` chain, E5).
2. **Beliefs are per-holder and may be wrong.** Reputation, legitimacy and rumor
   are perceiver beliefs, never truth (`character-interaction-and-event-architecture.md` §2).
3. **Delivery takes elapsed SimTime** and is a function of the route (quality,
   nodes), the messenger's mode, and season — **never an event count** (ADR-0003).
4. **Orders are knowledge too.** A command issued at the centre reaches a
   subordinate only when the report/order is delivered; until then the subordinate
   acts on **stale** knowledge. "Acting on information it could not yet hold" is
   forbidden (`assumptions-and-open-decisions.md` A-58).
5. **Interception and loss are first-class.** A messenger can be captured,
   killed, shipwrecked or the report read; the information may then reach an
   unintended holder, and the sender may remain unaware (until, perhaps, a
   counter-report — which is *also* delayed).
6. **Deception** is a report of a **false stated content** — a normal report whose
   content is false, with provenance (who issued it, knowingly or not). Fidelity
   and truthfulness are **separate** attributes.

### 7.3 Infrastructural dependence

Information transmission is **not** a separate network in the domain — it
**travels the same layer-2 network** as everyone else:

- Route quality / condition → **report travel time** (better roads, faster news).
- A **blocked pass / burned bridge / closed port** delays or reroutes **news as
  well as armies and goods**.
- A **post road** (relay stations) is the only case where information uses
  *infrastructure specialised for it* — a rare, high-tier, historically specific
  facility.
- **Season** affects passes, ferries and sea routes for news exactly as for
  movement.

This is the design payoff: **news, troops, goods and governance all ride the same
roads**, so a single investment (or a single sabotage) changes all four.

## 8. Movement consequences (how infrastructure changes movement)

The movement system (E6) computes **path cost** as a **pure function of graph +
terrain** (`geography-integration-requirements.md` §2, E3 acceptance). This
proposal **does not change** that purity rule; it adds a **declared input**:

- Geography supplies the graph, distance and terrain cost **inputs**.
- Infrastructure supplies a **route quality/condition input** for each traversed
  segment/node.
- Movement combines them into a **cost**, and derives **elapsed SimTime** from
  that cost via the (content) rate model — **no rate lives in geography or
  infrastructure**.

**Effect direction (illustrative only, values are content):** a paved segment
costs less than a track; a pass costs more and may be closed; a ferry adds a
service delay; a river is cheaper downstream; a destroyed bridge forces a detour
or a crossing elsewhere. A higher route class changes **state**, which changes
**cost**, which changes **SimTime** — an upgrade that only changes art changes
nothing.

## 9. Ownership boundaries and coordination

| Concern | Owner | This proposal's relationship |
| --- | --- | --- |
| Immutable geography, graph, terrain | **E3** (ADR-0020) | Adds a mutable overlay keyed to the same identities; does not change geography |
| **Mutable infrastructure state** | **New epic E20 (proposed)** | This document |
| Movement cost → SimTime | **E6** (ADR-0003) | Supplies a quality input; consumes elapsed-time primitive |
| Knowledge / reports / beliefs | **E5** | Extends E5 with messengers, delivery, interception, delayed orders |
| Economic transport, tolls, spending | **E12 / E19** (AD-26) | Construction/maintenance are spending actions; transport reads routes |
| Offices / maintenance authority | **E9/E18** (AD-25) | Maintenance authority is a capability from the office model |
| Population cohorts | **E12** (ADR-0017) | Corvée labour and cohort testimony link to infrastructure and information |
| Legal action gate | **ADR-0006** | Build/maintain/damage/scorch are proposals into the single gate |
| Event ledger / taxonomy | **ADR-0002 / ADR-0005** | Changes are classified events; causal chains preserved |
| Identity | **ADR-0009** | Road segments/nodes/messengers have canonical IDs; upgrades never mint identity |
| Presentation | **ADR-0019** (AD-18) | Reads layer 2; never authorises |

## 10. Relevant ADRs and open decisions

**Governing (approved) ADRs:** ADR-0002 (ledger), ADR-0003 (SimTime/elapsed
durations/no retroactivity), ADR-0005 (event taxonomy), ADR-0006 (legal gate),
ADR-0009 (identity), ADR-0017 (cohorts), ADR-0019 (presentation), ADR-0020
(geography; already names roads as authoritative geography).

**Existing open decisions this touches:**

- **AD-19** canonical coordinate system — infrastructure edges want coordinates
  eventually; **deferred**, and this proposal does not need it (opaque IDs are
  sufficient, G0/G1).
- **AD-25** office model — **maintenance authority** (a *cura viarum*-like
  competence) and **passage/toll** authority are office capabilities.
- **AD-26** economic authority — construction/maintenance **spending
  authorization**, and tolls as flows.
- **AD-18** presentation — how roads/ports/messengers are drawn.
- **[R-12]** historical travel/courier and report-transmission rates — supplies
  the *content* for the elapsed-time derivations.

**New open decisions proposed (OPEN, not opened silently):**

- **AD-31 — Infrastructure and route-quality model.** Representation of road
  segments and nodes (bridges/fords/ferries/passes/ports/river links); the
  quality-class spectrum and condition/deterioration model; ownership vs. control
  vs. maintenance authority; and construction/upgrade/maintenance/damage as
  simulation changes. **Blocks E20.** Does not block the simulation; does not
  change VS-5.
- **AD-32 — Information transmission model.** Messenger entities, delivery
  scheduling over the infrastructure network, reliability/mutation, interception,
  delayed orders and deception. **Extends E5.** Blocks full E5 / E20 information
  work only.

**New research proposed:**

- **R-17 — ancient infrastructure evidence at 278 BCE.** Attested road networks,
  bridges, fords, ferries, passes, ports and river-transport practices per region
  (Roman Italy, Carthaginian Africa, Ptolemaic Egypt, the Seleucid realm, Maurya
  India, the Greek leagues and poleis), with quality/season facts. Feeds E20
  content. (Complements **R-7** roads/borders and **R-12** rates.)
- **R-18 — ancient messenger/courier and interception evidence.** Attested relay
  systems, courier practices, dispatch loss/interception and "delayed order"
  incidents at or near 278 BCE. Feeds E5/AD-32 content. (Complements **R-12**.)

**New epic proposed:** **E20 — Intersettlement infrastructure and information
transmission** (roads/bridges/ferries/passes/ports/river transport + the physical
transmission layer of E5), coordinating E3, E5, E6, E12, E19. Roadmap placement
is a follow-up once AD-31/AD-32 are ruled.

## 11. The invariant: infrastructure state drives simulation; art never does

1. **Upgrades change simulation state.** A road upgrade mutates layer 2; the
   benefit is real only because movement/economy read that state.
2. **Presentation derives from state.** Roads, ports and messengers are drawn
   from authoritative state; no drawn feature is a gameplay fact.
3. **No second geography.** Infrastructure overlays immutable geography; it never
   rewrites place identity (ADR-0009, ADR-0020).
4. **No embedded rates.** Geography and infrastructure supply **cost/quality
   inputs**; elapsed **SimTime** is derived by movement/knowledge (ADR-0003;
   standing constraint 15).
5. **One gate.** Every construction/maintenance/sabotage/scorch order is a legal
   action (ADR-0006).
6. **News obeys the same world.** Information cannot arrive faster than the
   network allows, and cannot precede the fact it reports (A-58; E5).

## 12. Non-goals and purity

- No implementation, no renderer, no art, no road meshes, no port models.
- No domain change; no `src/`/`tests/` change; **no VS-5 change**.
- No historical rates or courier numbers in the domain (R-12/R-17/R-18 = content).
- No engine keys, no Rome II / DeI identifiers in `src/domain` (ADR-0001/0020).
- **Anachronism guards (278 BCE):** no Roman *cursus publicus* (Augustan); no
  widespread monumental stone bridges (mostly fords/ferries/timber/pontoons); no
  "paved highway" default; no Roman province road administration; no medieval/
  modern road, canal, turnpike or post-office concepts; no instant building.

## 13. Open questions carried by this proposal

- The exact infrastructure schema and quality/condition model (**AD-31**).
- The messenger/delivery/reliability/interception schema (**AD-32**).
- Whether a messenger is a distinct entity kind or a specialised formation/cohort
  (**AD-32**).
- How route quality and season compose into a cost input without embedding a rate
  (**AD-31** + R-12/R-17).
- Whether **post roads / relay stations** are modelled at 278 BCE at all
  (**AD-31**; historically rare).
- Presentation fidelity of roads/ports/messengers (**AD-18**).
- Coordinates for infrastructure edges (**AD-19**, deferred).

## Unresolved

- **AD-31** infrastructure/route-quality model — **OPEN** (proposed here).
- **AD-32** information transmission model — **OPEN** (proposed here).
- **R-17** infrastructure evidence; **R-18** messenger/interception evidence —
  **research-dependent**.
- Guidance for the presentation track (ADR-0019 / **AD-18**) — **Unresolved**.
