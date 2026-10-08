/**
 * Ledger events (ADR-0002; E2).
 *
 * An append-only record of a historically meaningful domain event. The shape
 * follows the blueprint's `HistoricalEvent` (blueprint §11,
 * `docs/architecture/domain-model.md`): `id`, `date`, `type`, `participants[]`,
 * `factions[]`, `locations[]`, `magnitude`, `causes[]`, `witnesses[]`.
 *
 * Two deliberate VS-3 restrictions:
 *
 * - **`causes[]` only, no `consequences[]` on the event.** Consequences are
 *   *discovered later*, so they live in a separate append-only
 *   `LedgerConsequenceLink` table rather than being written into an
 *   already-appended event, which would violate append-only rows (ADR-0002).
 * - **References are canonical identities** (ADR-0009): participants, factions,
 *   locations and witnesses are `CanonicalId` values that never become
 *   unresolvable because the referenced entity ended (ADR-0009 3).
 *
 * The ledger is **not** canonical world state and is never the load path: no
 * event sourcing, no replay (ADR-0002; assumption AD4).
 *
 * Creation follows the domain's capture-once discipline (N-30): every
 * caller-controlled field is read exactly once into an owned local, validated,
 * and frozen, so hostile accessors or later caller mutation cannot reorder,
 * corrupt or alias a recorded event. Consequences and causality are queried by
 * composing this immutable record set, never by mutating events.
 */
import type { CanonicalId } from '../identity/index.js';
import { isCanonicalId } from '../identity/index.js';
import type { SimTime } from '../time/index.js';
import { hasUnpairedSurrogate } from '../time/index.js';

declare const ledgerEventIdBrand: unique symbol;

/**
 * Stable identity of a ledger event within the ledger.
 *
 * Supplied by the creating caller from schedule-time-fixed domain content, in
 * the same spirit as `WorkIdentifier` (N-30): never minted from insertion
 * order, counters, randomness or collection iteration. It is a branded
 * primitive string so it cannot be interchanged with a `CanonicalId` or a
 * `WorkIdentifier`.
 */
export type LedgerEventId = string & { readonly [ledgerEventIdBrand]: 'LedgerEventId' };

export interface LedgerEvent {
  /** Stable identity of this event, unique within the ledger. */
  readonly id: LedgerEventId;
  /** Absolute monotonic SimTime at which this event occurred (ADR-0003). */
  readonly occurredAtSimTime: SimTime;
  /** Type in the event taxonomy (ADR-0005); taxonomy vocabulary is content. */
  readonly type: string;
  /** Canonical identities of involved actors/entities (ADR-0009). */
  readonly participants: readonly CanonicalId[];
  /** Canonical identities of involved factions (ADR-0009). */
  readonly factions: readonly CanonicalId[];
  /** Opaque canonical location identities (ADR-0020 G0). */
  readonly locations: readonly CanonicalId[];
  /** Non-negative safe integer severity; null when the event carries none. */
  readonly magnitude: number | null;
  /** Ids of already-recorded events this event is a consequence of. */
  readonly causes: readonly LedgerEventId[];
  /** Canonical identities of credible witnesses (ADR-0009). */
  readonly witnesses: readonly CanonicalId[];
}

export function ledgerEventId(value: string): LedgerEventId {
  return requireLedgerEventId(value) as LedgerEventId;
}

/**
 * The one strict runtime validator a ledger event id passes before it may enter
 * a recorded event or a consequence link (mirroring `requireWellFormedIdentifier`,
 * amendment B2/N-30). Accepts `unknown` and requires exactly a primitive,
 * nonempty, well-formed Unicode string.
 */
export function requireLedgerEventId(value: unknown): string {
  if (typeof value !== 'string') {
    throw new RangeError(
      'A ledger event id must be a primitive string, received a non-string representation (ADR-0002).',
    );
  }
  if (value.length === 0) {
    throw new RangeError('A ledger event id must not be empty (ADR-0002).');
  }
  if (hasUnpairedSurrogate(value)) {
    throw new RangeError(
      'A ledger event id must be well-formed Unicode with no unpaired surrogate code units (ADR-0002).',
    );
  }
  return value;
}

export interface LedgerEventInput {
  readonly id: LedgerEventId | string;
  readonly occurredAtSimTime: SimTime;
  readonly type: string;
  readonly participants?: readonly CanonicalId[];
  readonly factions?: readonly CanonicalId[];
  readonly locations?: readonly CanonicalId[];
  readonly witnesses?: readonly CanonicalId[];
  readonly magnitude?: number | null;
  readonly causes?: readonly LedgerEventId[] | readonly string[];
}

function requireType(value: unknown): string {
  if (typeof value !== 'string') {
    throw new RangeError('A ledger event type must be a primitive string (ADR-0002).');
  }
  if (value.length === 0) {
    throw new RangeError('A ledger event type must not be empty (ADR-0002).');
  }
  if (hasUnpairedSurrogate(value)) {
    throw new RangeError(
      'A ledger event type must be well-formed Unicode with no unpaired surrogate code units (ADR-0002).',
    );
  }
  return value;
}

function requireCanonicalReferences(value: unknown, what: string): CanonicalId[] {
  if (value === undefined) return [];
  if (!Array.isArray(value)) {
    throw new RangeError(`A ledger event's ${what} must be an array of canonical identities (ADR-0009).`);
  }
  const owned: CanonicalId[] = [];
  for (const entry of value as readonly unknown[]) {
    if (!isCanonicalId(entry)) {
      throw new RangeError(
        `A ledger event's ${what} must contain only canonical identities (ADR-0009); received ${String(entry)}.`,
      );
    }
    owned.push(entry);
  }
  return owned;
}

function requireCauses(value: unknown): LedgerEventId[] {
  if (value === undefined) return [];
  if (!Array.isArray(value)) {
    throw new RangeError("A ledger event's causes must be an array of ledger event ids (ADR-0002).");
  }
  const owned: LedgerEventId[] = [];
  for (const entry of value as readonly unknown[]) {
    owned.push(requireLedgerEventId(entry) as LedgerEventId);
  }
  return owned;
}

function requireMagnitude(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < 0) {
    throw new RangeError(
      `A ledger event magnitude must be a non-negative safe integer or null, received ${renderRejectedValue(value)} (ADR-0002).`,
    );
  }
  return value;
}

function renderRejectedValue(value: unknown): string {
  if (value === null) return 'null';
  return Object.prototype.toString.call(value);
}

/**
 * Build an owned, frozen `LedgerEvent` from caller-controlled input, reading
 * every field exactly once (capture-once, N-30). The returned event and all of
 * its arrays are frozen; later caller mutation or hostile getters cannot change
 * what was recorded.
 */
export function createLedgerEvent(input: LedgerEventInput): LedgerEvent {
  const id = requireLedgerEventId(input.id) as LedgerEventId;
  const occurredAtSimTime = input.occurredAtSimTime;
  if (typeof occurredAtSimTime !== 'number' || !Number.isSafeInteger(occurredAtSimTime)) {
    throw new RangeError(
      `A ledger event's occurredAtSimTime must be a safe-integer SimTime, received ${String(occurredAtSimTime)} (ADR-0003).`,
    );
  }
  const type = requireType(input.type);
  const participants = Object.freeze(requireCanonicalReferences(input.participants, 'participants'));
  const factions = Object.freeze(requireCanonicalReferences(input.factions, 'factions'));
  const locations = Object.freeze(requireCanonicalReferences(input.locations, 'locations'));
  const witnesses = Object.freeze(requireCanonicalReferences(input.witnesses, 'witnesses'));
  const magnitude = requireMagnitude(input.magnitude);
  const causes = Object.freeze(requireCauses(input.causes));

  if (causes.includes(id)) {
    throw new RangeError(
      `A ledger event cannot be its own cause: '${id}' references itself (ADR-0002).`,
    );
  }
  if (new Set(causes).size !== causes.length) {
    throw new RangeError('A ledger event must not list the same cause twice (ADR-0002).');
  }

  return Object.freeze({
    id,
    occurredAtSimTime,
    type,
    participants,
    factions,
    locations,
    magnitude,
    causes,
    witnesses,
  });
}