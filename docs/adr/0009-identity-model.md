# ADR-0009: Canonical identity model

- Status: **Approved** (identity contract amended 2026-10-05; **representation
  resolved 2026-10-05** — RFC 4122 **UUIDv5**). Source-identity property naming
  and re-import reconciliation remain **Unresolved**.
- Date: 2026-10-04
- Amended: 2026-10-05 (contract), 2026-10-05 (representation)
- Affects: domain model, ledger, snapshots, relationships, all entity types,
  save/load, scenario setup, adapter boundaries
- Related: [ADR-0001](0001-campaign-military-representation-vs-dei-tactical.md), [ADR-0002](0002-authoritative-state-causal-ledger-snapshots.md), [ADR-0008](0008-determinism-and-reproducibility.md), [ADR-0015](0015-campaign-command-hierarchy-and-tactical-control.md), [ADR-0016](0016-military-cohesion-and-post-battle-survival.md), [ADR-0017](0017-population-cohorts-migration-and-displacement.md), [../architecture/domain-model.md](../architecture/domain-model.md)

## Context

Thousands of characters, families, settlements, regions, formations and events
must be referenced stably across snapshots, across the causal ledger, across
save/load, and (per ADR-0001) independently of any tactical engine's
identifiers.

The causal ledger must support character life histories, memories, reputation
justification, chronicles and player-facing explanations (ADR-0002). It follows
directly that a reference to a *dead* character, a *destroyed* army or a
*disbanded* cohort must remain resolvable for the whole life of a campaign. The
identity question is therefore not only "how do I name a live entity" but "what
happens to the name when the entity stops being a live entity".

## Decision

**Approved: the canonical identity contract and its representation.**

### 1. Canonical identity properties

A canonical ID is:

1. **Globally unique** within the canonical HistoricalGame identity system.
2. **Immutable** — it never changes for the life of the identity.
3. **Permanently referenceable** — see §3.
4. **Never reused** — no identity is ever recycled, reclaimed or reissued.
5. **Independent of database presence** — identity is a domain property, not a
   storage artefact. Deleting, rebuilding or migrating a store does not mint or
   retire identities.
6. **Serialization safe** — it survives being written to and read back from any
   durable representation without loss or reinterpretation.
7. **Stable across save/load** — a loaded campaign resolves exactly the
   identities it saved.
8. **Suitable for reference** — usable as a causal ledger reference, a
   relationship edge endpoint, a snapshot reference, a history entry and a
   cross-system reference.
9. **Independent of display names** — renaming an entity never touches its ID.
10. **Independent of mutable domain state** — location, ownership, strength,
    extent, government and any other changing property are state, not identity.
11. **Independent of Rome II / DeI identifiers** — engine keys stay adapter-side
    (ADR-0001, ADR-0020).
12. **Independent of external catalog identifiers** — catalog keys are adapter
    resources, never domain identity (ADR-0001).
13. **Not authoritative chronology** — an ID carries no ordering, no timestamp
    and no version information. Creation order, if it is needed, is a separate
    property.

An ID additionally implies **no domain semantics**: an ID must not encode kind,
faction, location, era or validity period.

### 2. Canonical identity is distinct from authored/source identity

Authored historical content may carry a **stable source identifier or source
key** that identifies the authored source entity.

- Source identity is **content-side provenance**. It is *not* the canonical
  runtime ID.
- Source identity may be used as an **input** to canonical identity derivation
  (see §5) and for content tooling, import matching and re-import
  reconciliation.
- Source identity and canonical identity must be stored and queried as distinct
  things so that content revisions cannot silently rewrite runtime identity.

### 3. Entity end of life: identity and extant state are separate concepts

**An entity ceasing to exist as an active/extant world entity does not erase,
recycle, invalidate or replace its canonical identity.**

- Identity and **extant state** are separate concepts. "Ended" is a value of
  extant state, not a terminal state of identity.
- A dead `Character` remains permanently referenceable.
- A disintegrated `Army` remains permanently referenceable.
- An ended `PopulationCohort` remains permanently referenceable.
- `HistoricalEvent` ledger entries may permanently reference entities that no
  longer actively exist, including `participants[]`, `witnesses[]`,
  `causes[]` and `consequences[]` targets.
- Canonical IDs are **never recycled**, so identity can never be garbage
  collected. No tombstone, purge or reclamation policy exists or may be
  introduced for canonical identity.
- **Historical references must never be rewritten merely because the referenced
  entity ended.** A ledger entry written while an entity was extant keeps
  referring to that same identity forever.

Extant status is modelled as ordinary domain state, not as an identity
transition. No universal `active` flag is mandated here; where a domain needs
one, the owning epic designs it.

### 4. Transformations: the general principle only

**No single universal merge/split identity rule is decided.** Only this general
principle is approved:

- If an operation represents **continuation** of the same historical entity,
  identity survives.
- If an operation genuinely **creates** a new historical entity, that new entity
  receives a **new** canonical identity.
- Old entities that ended remain permanently referenceable (§3).

Domain-specific rules determine whether a particular **fragmentation, split,
merge, succession, reorganization or transformation** represents continuation,
survival, termination or creation. Those rules are **not** decided here and may
be resolved in the epic that owns the relevant mechanic — for example army
fragmentation and remnants (ADR-0016), or cohort merge/split (ADR-0017).

### 5. Deterministic identity guarantee

**The guarantee is locked, and §5a satisfies it structurally.**

Given:

- the same **scenario identity**;
- the same **source datasets**, each identified through a stable source
  identifier;
- the same **simulation version and configuration**;
- the same **deterministic seed**;

then the same authored entity and the same deterministically generated initial
entity must receive the **same canonical identity across equivalent runs**.

Canonical identity generation must **not** depend on:

- wall-clock time;
- ambient randomness;
- database-generated identity;
- mutable display data.

Additional requirements:

- **Authored identity derivation depends on a stable source namespace/key, not
  on mutable content.** Editing a settlement's population must not change that
  settlement's canonical ID, or every ledger reference to it breaks.
- **Once assigned, canonical IDs are persisted and are never regenerated during
  load.** A loaded campaign reads stored identity; it does not re-derive it.
- A deterministic generator must not roll back its sequence such that a later,
  different entity is issued an identity that was already used (this follows
  from "never reused" in §1.4).

### 5a. Representation: RFC 4122 UUIDv5 (name-based, deterministic)

**Approved.** A canonical ID is an **RFC 4122 UUID version 5** value — a
128-bit, name-based, SHA-1-derived identifier — presented as the canonical
string form.

### Why UUIDv5

The player has **no product requirement** for human-readable ID appearance. That
removes the only real reason to prefer a debuggable format, so the decision
reduces to: which representation satisfies §1–§6 most simply and most
reliably?

- **Deterministic by construction.** The value is a pure function of a canonical
  namespace and a stable name input. It satisfies §5 without needing a seeded
  stream, a database, a counter, or any run-time state.
- **Offline and stateless.** No wall clock, no ambient randomness, no storage
  involvement — all three explicitly forbidden by §5.
- **Opaque output.** The 128-bit result encodes **no** kind, faction, location,
  era, display name, validity period or chronology, satisfying §1.13 and the
  "no domain semantics" rule directly and structurally, rather than by
  convention.
- **Globally unique by construction** (§1.1), because it is drawn from the
  UUID name space under an application-chosen namespace.

### Why not the alternatives

| Alternative | Why rejected |
| --- | --- |
| UUIDv4 | Random. Violates the §5 deterministic guarantee outright |
| UUIDv7 | Time-ordered, so its value leaks wall-clock information into identity and implies a chronology §1.13 forbids. Also not deterministic without an injected clock |
| ULID | Same chronological-leak problem as UUIDv7, plus monotonic-counter coordination |
| Monotonic per-kind counters | Needs coordination across merge, import and concurrent allocation; couples identity to a storage/coordination story |
| Prefixed hybrid (`kind:counter`) | Encodes **kind** into the value, which §1's "no domain semantics" rule and the adapter-purity boundary both reject |
| Content hash of mutable attributes | Breaks every existing reference on any content edit (§5, Rejected alternatives) |

### Derivation contract

```
canonicalId = UUIDv5( applicationNamespaceUUID , stableName )
```

- **`applicationNamespaceUUID`** is a fixed, version-controlled constant owned by
  this project. It is a namespace, not an identity, and carries no meaning.
- **`stableName`** is a deterministic, canonical string built **only** from
  stable identity inputs. It must never include display names, mutable domain
  state, wall-clock time, database values, Rome II / DeI identifiers or
  external catalog identifiers.

Two cases, both permitted, both deterministic:

- **Authored entities.** The name is derived from the authored entity's
  **stable source namespace/key** (§2). That source identity remains
  **separately representable** and is not merged into the canonical ID; it is
  provenance and a derivation input. Revising authored content therefore does
  not change the canonical ID, provided the stable source key is preserved.
- **Procedurally generated entities.** The name is derived from the deterministic
  simulation guarantees already approved in [ADR-0008](0008-determinism-and-reproducibility.md):
  the scenario identity, the deterministic seed, and a **deterministic creation
  discriminator** identifying which generated entity is meant (for example the
  entity's role plus its deterministic creation index). The same run inputs must
  therefore yield the same canonical IDs on every equivalent run.

Because the name space is never reused, a deterministic generator cannot reissue
an identity already in use, which is what §1.4 requires.

### Boundaries of this decision

- **Presentation.** The UUID string form is the canonical serialised form. Domain
  code should still wrap it in a branded type so that IDs of different entity
  kinds cannot be interchanged by accident; the brand is a compile-time
  discipline and does not change the value.
- **Implementation detail not settled here.** Whether to add a vetted runtime
  UUID dependency or to implement RFC 4122 v5 name-based derivation directly is
  an implementation choice for the owning epic. This record fixes the
  **specification**, not the library.
- **Migration.** No existing canonical data exists to migrate.

## 6. Global uniqueness in form, world-scoped meaning

Canonical IDs may be **globally unique in representation** while their
**historical meaning belongs to a particular world or scenario history**.

An ID carried across a scenario fork, mod or re-import carries no claim about
the other world. Nothing may interpret an identity in a world that did not
create it. This is why uniqueness in representation does not make identity
portable across divergent histories.

### 7. External identity remains an adapter mapping

Rome II / DeI identifiers and external catalog identifiers are **adapter
mappings only**. They are resolved from canonical identity at the boundary and
never become, replace or persist as domain identity (ADR-0001, ADR-0020).

## What this approval deliberately does **not** lock

- The `sourceKey` property name, shape, or the number of provenance slots. The
  *concept* of a separately representable stable source identity is decided
  (§2, §5a); the field naming on authored aggregates is not, and does not block
  implementing the canonical ID type or its derivation function.
- Whether the derived value is computed at load, at build time, or on demand.
- Domain-specific continuation/creation rules (§4).
- Re-import and start-world regeneration reconciliation, and per-domain creation
  semantics. Both are deliberately out of scope for the decision that unblocks
  the foundations epic.
- The library or code used to compute a UUIDv5 value (§5a).

## Consequences

- Every ledger entry, relationship edge, snapshot reference and memory source
  can be written without worrying whether the target will later become
  unresolvable.
- Content tooling may revise authored data freely, provided the stable source key
  is preserved.
- Save/load round-trips identity without re-derivation, so replay and
  benchmarking are unaffected by identity representation choices.
- Replay and bug reproduction require canonical identity to be reproducible,
  which couples this contract to
  [ADR-0008](0008-determinism-and-reproducibility.md).
- Encapsulating canonical IDs in domain-specific branded types remains
  available, and is independent of the derivation.
- Choosing UUIDv5 removes the previous asymmetry where determinism was a
  *guarantee to be satisfied* by an unspecified encoding. Determinism is now a
  **structural property** of the representation rather than an implementation
  obligation.

## Options considered for the representation

| Option | Outcome |
| --- | --- |
| **UUIDv5 (name-based, SHA-1)** | **Selected.** Deterministic by construction, offline, stateless, opaque output that encodes no kind/chronology/display data (§5a) |
| UUIDv4 | Rejected: random, so it cannot satisfy the §5 determinism guarantee |
| UUIDv7 | Rejected: time-ordered, so the value leaks wall-clock information and implies a chronology §1.13 forbids; not deterministic without an injected clock |
| ULID | Rejected: same chronological leak as UUIDv7, plus monotonic-counter coordination |
| Monotonic per-kind counters | Rejected: coordination across merge, import and concurrent allocation; couples identity to a storage story |
| Prefixed hybrid (kind + counter) | Rejected: encodes **kind** into the value, against the "no domain semantics" rule and adapter purity |
| Derived from a content hash of mutable attributes | Rejected: any content edit breaks every existing reference |

## Rejected alternatives

| Alternative | Why rejected |
| --- | --- |
| Reusing or recycling IDs after an entity ends | Breaks every historical reference to that entity |
| Deriving identity from a content hash of mutable attributes | Editing content silently breaks every reference |
| Using database-generated identity (autoincrement) | Couples identity to storage; breaks merge, import and re-import |
| Adopting Rome II / DeI keys as domain identity | Couples campaign truth to one engine; breaks purity (ADR-0001) |
| Encoding chronology or kind into the ID | Turns identity into an implicit, unmaintainable second source of truth |
| Requiring human-readable or debuggable IDs | No product requirement exists; the complexity buys nothing |

## Unresolved

- **Unresolved:** the `sourceKey` property name and shape, and how many
  provenance slots an authored entity carries. The **concept** of separately
  representable source identity is decided (§2, §5a); the field naming is not,
  and it does not block implementing the canonical ID type.
- **Unresolved:** whether start-world data regeneration or scenario re-import
  should reconcile against existing canonical IDs, produce new ones for changed
  source entities, or require an explicit operator decision. Deliberately out of
  scope for the decision that unblocks the foundations epic. The *identity
  contract* in §1–§6 applies either way.
- **Unresolved (delegated):** per-domain rules deciding whether a specific
  fragmentation, split, merge, succession or reorganization is continuation,
  survival, termination or creation. See §4, ADR-0016 and ADR-0017.
- **Unresolved:** whether to add a runtime UUID dependency or implement RFC 4122
  v5 derivation directly. An implementation choice for the owning epic; the
  specification is fixed.
