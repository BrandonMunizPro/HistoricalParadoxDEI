# Geography integration requirements (for the Codex / VS-5 track)

**Status: Proposal (2026-10-14).** This document states what the *simulation*
requires from the campaign-geography track, and the interfaces it must expose,
so that the Codex/VS-5 work and the domain stay aligned. It implements **no
code** and narrows **no ADR**; it is a requirements statement written *ahead of*
the geography track so the track can be built against a stated contract.

Authority: **ADR-0020** (campaign geography authority and tactical projection)
governs the boundary. **AD-19** (canonical coordinate system) is **deferred** —
nothing here re-opens it; G1 is explicitly built on **opaque IDs + adjacency +
terrain properties**, which is the approved migration path toward coordinates.

## 1. Scope boundary (what G1/VS-5 is and is not)

**Is:** the *authoritative campaign geography* — a set of locations with
identity, adjacency, traversal costs and terrain properties, plus a spatial query
capability — sufficient to make movement, path cost and locality queries real for
the first vertical slice (S2, Army in a Real World).

**Is not (explicit non-goals):**
- not a renderer or a visual campaign map (ADR-0019; presentation is a separate
  track and must never become a second source of geographic truth);
- not coordinates, elevations, GIS import, or borders as canonical identity
  (AD-19 deferred; **modern political borders are not evidence for the ancient
  world**);
- not settlements/population/economy (those live in E12 aggregates and reference
  a location; a `Location` is not a settlement);
- not political ownership — a location's *identity* never contains who holds it
  (see §3);
- not a competing tactical engine, and no engine campaign map is authoritative.

## 2. Required data shape

The current `src/domain/geography/geography.ts` already models the right
primitive shape and is consistent with this contract. Requirements it must keep
satisfying:

| Requirement | Rationale |
| --- | --- |
| `GeographicLocation` has a **canonical identity** (UUIDv5, ADR-0009), a `regionId`, a name and a coarse **terrain** | Identity is globally unique, immutable, never reused |
| `GeographicConnection` is an **edge** with a positive traversal cost and a kind (route / river-crossing / pass) | Movement path cost must be a pure function of the graph (E3 acceptance) |
| `GeographicContext` carries optional physical attributes (elevation, slope, forest, water features, nearby settlements, connections) | A location must retain enough facts to be projected to a battlefield later (ADR-0020) |
| Coordinates (when they exist, post-AD-19) are **optional imported metadata**, not identity | AD-19 stays deferred; migration path preserved |
| Validation rejects duplicate identities, self-edges, non-finite/negative costs | Determinism (ADR-0008); no silent bad data |

**Movement duration is not geography's to decide.** Geography exposes distance /
cost inputs; the *time* those costs consume is derived by the movement system as
elapsed **SimTime** (ADR-0003 A13/A14). Geography must not embed historical travel
or courier rates (standing constraint 15).

## 3. The hard rule: identity vs. ownership vs. control

The three must never be conflated, and this is the most likely place for VS-5 to
go wrong:

1. **Identity** — *what this place is* (immutable; no politics, no owner, no
   renderer keys).
2. **Ownership / control** — *who currently holds it* (mutable world state,
   owned by the polity/political layer, changing by conquest, treaty, revolt).
3. **Presentation** — *how it is drawn* (presentation track only).

A location is not "Roman" by identity because Rome holds it this decade. Control
is a **separate, mutable record** that references the location by canonical ID.
This is the same identity/ownership separation the game already applies to
characters (ADR-0009) and factions.

## 4. Interfaces the simulation needs from geography

These are **domain ports** (pure, engine-agnostic, no Rome II keys), not a
concrete API lock. Named here so the geography track and the domain agree:

| Port | Capability | Consumed by |
| --- | --- | --- |
| **Adjacency / graph query** | Neighbours of a location; the connections out of it | Movement (E6), knowledge (report routes, E5) |
| **Path-cost evaluation** | A **pure function** over the graph + terrain producing a traversal cost for a movement context | Movement (E6); no all-pairs scans |
| **Locality / spatial query** | "What is near here?" (bounded) | Encounter creation (E6), migration (E12), observation (E5) |
| **Terrain/attribute read** | The authoritative terrain and physical facts of a location | Movement, tactical projection (adapter side, ADR-0020) |
| **Battlefield context projection** (adapter-side, later) | Campaign location + geographic context → `TacticalLocationContext` | E7 tactical adapter — **not** G1 scope |

**Purity and performance invariants:**
- Domain geography code contains **no** Rome II / DeI map keys, battlefield
  identifiers, catalog field names or filesystem paths (standing constraint 7).
- Locality and path queries **must not** be all-vs-all; a spatial index is a
  port (E3 acceptance criterion), not an afterthought.
- Everything is deterministic and reproducible (ADR-0008).

## 5. Identity and the deferred coordinate decision

G1 uses **opaque canonical IDs + adjacency + terrain properties**. When AD-19 is
decided (triggered at G2/G3), coordinates become imported **metadata** on
locations; identities do **not** change and nothing downstream that referenced a
location by ID breaks. The geography track must not pre-commit to a coordinate
system, a projection, or a GIS schema, and must not import modern political
borders as ancient territory.

## 6. Relationship to the rest of the world

Geography is **referenced** by other systems, never the reverse owner:

- A **Settlement** (E12) sits *at* a location; the location does not own the
  settlement's population or economy.
- An **Army / Formation** (E6) is *positioned at* a location; movement changes
  that reference through validated actions.
- A **Character** is *present at* a location; presence is world state.
- A **polity / faction** *controls* locations and settlements; that control is
  mutable political state, never baked into geographic identity.
- An **institution** (E13) is tied to a settlement/location and survives its
  founder.
- A **province / administrative unit** is a **political** grouping a polity
  defines over locations; geography supplies regions and territory *containers*,
  and the polity supplies the administrative meaning. Do not hard-code provinces
  as geographic identity.

## 7. Note on the current tree state

The Codex/VS-5 track has uncommitted work in `src/domain/geography/` and
`src/simulation/campaign-map-state.ts`, and has added `three` to `package.json`.
Two things must be flagged:

1. **The `three` dependency is a presentation concern.** ADR-0019 records the
   renderer as **Unresolved**, and the standing constraint is that presentation
   never blocks or leaks into the simulation. A 3D exploration of the map is a
   legitimate *presentation-track experiment*, but it must not become the
   authoritative geography, must not put engine/renderer types into
   `src/domain/`, and its presence in `package.json` should be treated as a
   **presentation-track dependency decision**, not a domain one. If it is only an
   experiment it should live behind the presentation boundary.
2. **`campaign-map-state.ts` must respect the identity/ownership split** (§3)
   and the purity rules (§4) before it is committed as domain state.

This is a **sequencing/authority observation**, not a defect report; it is
recorded here so the geography track is built against the contract rather than
discovering the boundaries late.

## 8. Open decisions carried by geography

| ID | Item | Trigger |
| --- | --- | --- |
| **AD-19** | Canonical coordinate system and geometry representation | G2/G3 |
| **AD-20** | `BattlefieldResolver` algorithm | Stage 7 |
| **N-35** | `BattleResult` schema | E7/E8 |
| **R-6 / R-7** | GIS/elevation licensing; historical border/settlement/road datasets for the start period | G2 entry |

## 9. Non-goals of this requirements document

- No implementation; no `src/` or `tests/` change.
- No renderer choice; no Visual Design Bible content (ADR-0019).
- No mass Mediterranean mapping; a deliberately small known geography is
  acceptable for the first proof.
- No re-opening of AD-19, and no claim that any particular coordinate system or
  dataset is chosen.

## 10. Coordination response to the VS-5 prototype (2026-10-14)

The geography track has produced
[`docs/vs5/central-italy-prototype.md`](../vs5/central-italy-prototype.md)
(central-Italy G1 graph plus a bounded presentation experiment, with screenshots
and `evidence/metrics.json`). From the simulation/architecture side this is the
intended **contract-conforming prototype**, not a defect. Assessment:

**Confirmed satisfied.**

1. **Identity vs. ownership (§3).** The prototype keeps geographic **identity**
   (location/settlement UUIDs) separate from mutable **political ownership**
   (`CampaignMapState.settlementControl: settlementId → factionId`), and states
   that influence areas are **not authoritative territory** and that "geographic
   identity and political ownership have separate lifetimes." That is exactly the
   §3 rule.
2. **Purity (§4).** The hierarchy types live in `src/domain/geography`; engine/
   renderer concerns stay at the infrastructure/presentation boundary; no Rome II
   / DeI keys, no foreign game assets, and no second identity system were
   introduced. The renderer "is not a separate political authority."
3. **Movement duration is not geography's (§2).** Route edges carry **neutral
   placeholder costs**, explicitly "not historical travel times," and the WGS84
   projection/units are labelled **presentation-only** — consistent with standing
   constraint 15 and ADR-0003 A13/A14.
4. **AD-19/AD-20 stay open.** The prototype recommends a WGS84 + local metric
   path for a *future* AD-19 decision without silently closing it, and does not
   implement AD-20's resolver. It also correctly defers economy/population,
   provinces-as-administration, and a general global GIS topology tool.
5. **VS1–VS4 preserved.** The prototype reports those systems and tests intact
   and does not modify VS4 character tables. `npm run validate` is green with the
   added geographic tests.

**Disposition of the two flags in §7.**

- **§7 item 1 (`three`): now treated as an accepted presentation-track prototype
  decision.** A 3D exploration behind the presentation boundary is legitimate
  under ADR-0019. This does **not** close ADR-0019 (the renderer stays
  **Unresolved**), must not put renderer types into `src/domain/`, and must not
  make the renderer a second source of geographic truth. The prototype's own
  statement — "a prototype choice, not a permanent engine decision … no technical
  need to migrate" — matches that boundary. No objection to the dependency, on
  the condition that it stays presentation-side.
- **§7 item 2 (`campaign-map-state.ts`): satisfied.** It owns a thin **control
  snapshot** and a pure transfer operation, references settlement IDs (not
  location IDs) for control, and preserves UUIDs through transfer. The identity/
  ownership split holds.

**What the simulation side still expects before this becomes authoritative
saved-campaign state** (not blockers to the prototype, but gates to promotion):

- **Repository ports + migration** for geography and control when an
  authoritative running campaign adopts them, without altering VS4 character
  tables or weakening snapshot guarantees (ADR-0010).
- **No historical precision smuggled in.** Placeholder route costs, provisional
  Appian-corridor waypoints and nearest-settlement influence remain *unresolved
  content* until R-7/R-13/R-16 supply sourced values; they must not harden into
  "ancient facts."
- **Status wording.** The prototype is recorded as a **functioning prototype**
  (G1 + bounded presentation experiment), not shipped VS-5, and not an
  authorisation to author production geography or production art.

**Thanks and next hand-off.** The contract in §§1–8 held; the two flags in §7 are
resolved above. The geography track's "Next focused work" items 1–5 are the right
sequence; item 4 (independent faction/control and 278 BCE territory research)
now links to **R-13/R-16** in
[`start-world-research-plan.md`](start-world-research-plan.md).
