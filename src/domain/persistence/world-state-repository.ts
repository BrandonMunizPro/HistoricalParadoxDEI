/**
 * World state repository (ADR-0010, AD-9; E17a).
 *
 * The **change-aware** write side of authoritative canonical state. The
 * running simulation stays authoritative in memory; this port persists its
 * durable mirror **incrementally** — a row per entity, one transaction per
 * executed step — never a whole-world rewrite on each mutation (ADR-0002
 * snapshots; AD-9).
 *
 * The mirror carries **no real game schemas** in VS-3: `WorldEntity` is the
 * smallest representative authoritative state (an identity, a kind, one scalar
 * and an ended flag), precisely enough to prove change-aware persistence and
 * deterministic continuation. Characters, armies, settlements and the rest
 * arrive in later epics.
 *
 * The port also mirrors the authoritative **current SimTime** so a checkpoint
 * copy is internally coherent: world state, pending work, ledger and the
 * persisted SimTime are committed in the same transaction, and the exact
 * SimTime round-trips on load (ADR-0003, N-29 serializer). Live SimTime may
 * exceed the latest saved SimTime; nothing here pretends they must match.
 */
import type { CanonicalId } from '../identity/index.js';
import type { SimTime } from '../time/index.js';

declare const worldEntityKindBrand: unique symbol;

export type WorldEntityKind = string & { readonly [worldEntityKindBrand]: 'WorldEntityKind' };

export interface WorldEntity {
  readonly id: CanonicalId;
  /** Stable kind tag; the fixture uses a single representative kind. */
  readonly kind: WorldEntityKind;
  /** One mutable scalar of authoritative state; null when none is set. */
  readonly scalarState: number | null;
  /** Ends are permanent: an ended entity stays referenceable (ADR-0009 3). */
  readonly ended: boolean;
}

export interface WorldEntityInput {
  readonly id: CanonicalId;
  readonly kind: WorldEntityKind | string;
  readonly scalarState: number | null;
}

export function worldEntityKind(value: string): WorldEntityKind {
  if (typeof value !== 'string' || value.length === 0) {
    throw new RangeError(
      'A world entity kind must be a nonempty primitive string (ADR-0010).',
    );
  }
  return value as WorldEntityKind;
}

export interface WorldStateRepository {
  /** The mirrored authoritative SimTime (written in the same transaction as state). */
  readCurrentSimTime(): SimTime;
  /** Advance the mirrored SimTime; called from the driver within a step transaction. */
  writeCurrentSimTime(next: SimTime): void;
  getEntity(id: CanonicalId): WorldEntity | null;
  allEntities(): readonly WorldEntity[];
  /** Create or update one entity's scalar state (change-aware, never a rewrite). */
  upsertEntity(input: WorldEntityInput): WorldEntity;
  /** Mark ended permanently; the entity remains readable and referenceable. */
  markEntityEnded(id: CanonicalId): WorldEntity;
}