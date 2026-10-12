/**
 * Character aggregate (ADR-0007 candidate partition; ADR-0009; VS-4 / E4).
 *
 * The smallest authoritative character state the S1 slice needs: a canonical
 * identity, when the character was born and (if applicable) died, an
 * **authored/authoritative** successor designation, and ledger-event memory
 * references. It deliberately carries **no** psychology facets, traits, skills,
 * offices or claims: those are blocked on design or belong to later epics
 * (E9), and S1 does not require them.
 *
 * The record is immutable and frozen; domain functions return a new value
 * rather than mutating. Ending existence never erases identity: a dead
 * character stays permanently referenceable (ADR-0009 3).
 *
 * `designatedSuccessor` is **never derived**. It is present only when some
 * authoritative source set it; the aggregate must not select an eldest child,
 * a spouse or the nearest relative, and must not invent a succession decision.
 * See `succession.ts` for the event that records a reaction to a death.
 */
import type { CanonicalId } from '../identity/index.js';
import { isCanonicalId } from '../identity/index.js';
import type { LedgerEventId } from '../ledger/index.js';
import { requireLedgerEventId } from '../ledger/index.js';
import type { SimTime } from '../time/index.js';

export interface Character {
  /** Canonical identity (ADR-0009); valid even after death (ADR-0009 3). */
  readonly id: CanonicalId;
  /** Absolute SimTime at which the character was born. */
  readonly bornAtSimTime: SimTime;
  /** Absolute SimTime of death, or `null` while the character is alive. */
  readonly diedAtSimTime: SimTime | null;
  /**
   * An **authoritative** successor designation, or `null`. Never computed by
   * the domain; absent until an authoritative source records one.
   */
  readonly designatedSuccessor: CanonicalId | null;
  /** Ledger event memories; references only, sorted and unique (ADR-0002). */
  readonly memories: readonly LedgerEventId[];
}

export interface CharacterInput {
  readonly id: CanonicalId;
  readonly bornAtSimTime: SimTime;
  readonly designatedSuccessor?: CanonicalId | null;
  readonly memories?: readonly (LedgerEventId | string)[];
}

function requireCanonical(value: unknown, what: string): CanonicalId {
  if (!isCanonicalId(value)) {
    throw new RangeError(`A character ${what} must be a canonical identity (ADR-0009).`);
  }
  return value;
}

function requireSimTime(value: unknown, what: string): SimTime {
  if (typeof value !== 'number' || !Number.isSafeInteger(value)) {
    throw new RangeError(`A character ${what} must be a safe-integer SimTime (ADR-0003).`);
  }
  return value as SimTime;
}

/** Own, validate, deduplicate and sort memory references deterministically. */
function requireMemories(value: unknown): LedgerEventId[] {
  if (value === undefined) return [];
  if (!Array.isArray(value)) {
    throw new RangeError('A character memories list must be an array of ledger event ids (ADR-0002).');
  }
  const owned = new Set<LedgerEventId>();
  for (const entry of value as readonly unknown[]) {
    owned.add(requireLedgerEventId(entry) as LedgerEventId);
  }
  return [...owned].sort();
}

function requireSuccessor(value: unknown): CanonicalId | null {
  if (value === null || value === undefined) return null;
  return requireCanonical(value, 'designatedSuccessor');
}

/**
 * Build an owned, frozen `Character`. Every caller-controlled field is read
 * exactly once and validated; later caller mutation cannot change the record.
 */
export function createCharacter(input: CharacterInput): Character {
  const id = requireCanonical(input.id, 'id');
  const bornAtSimTime = requireSimTime(input.bornAtSimTime, 'bornAtSimTime');
  const designatedSuccessor = requireSuccessor(input.designatedSuccessor);
  if (designatedSuccessor === id) {
    throw new RangeError('A character cannot designate itself as its own successor (ADR-0009).');
  }
  const memories = Object.freeze(requireMemories(input.memories));
  return Object.freeze({
    id,
    bornAtSimTime,
    diedAtSimTime: null,
    designatedSuccessor,
    memories,
  });
}

/** Whether the character is still alive. */
export function isAlive(character: Character): boolean {
  return character.diedAtSimTime === null;
}

/**
 * Record a death at `atSimTime`. Refuses a second death or a time before
 * birth: the timeline is monotonic and a death is not reversible (ADR-0003 A2).
 */
export function recordDeath(character: Character, atSimTime: SimTime): Character {
  if (character.diedAtSimTime !== null) {
    throw new RangeError(`Character '${character.id}' is already dead; a death is recorded once (ADR-0002).`);
  }
  const diedAtSimTime = requireSimTime(atSimTime, 'diedAtSimTime');
  if (diedAtSimTime < character.bornAtSimTime) {
    throw new RangeError(
      `A character cannot die before it is born (${diedAtSimTime} < ${character.bornAtSimTime}) (ADR-0003 A2).`,
    );
  }
  return Object.freeze({ ...character, diedAtSimTime });
}

/**
 * Record an **authoritative** successor designation. This does not implement
 * any inheritance rule; it stores a decision made elsewhere, for the death
 * reaction to reference (see `succession.ts`).
 */
export function designateSuccessor(character: Character, successor: CanonicalId): Character {
  const owned = requireCanonical(successor, 'designatedSuccessor');
  if (owned === character.id) {
    throw new RangeError('A character cannot designate itself as its own successor (ADR-0009).');
  }
  return Object.freeze({ ...character, designatedSuccessor: owned });
}

/** Add one ledger event reference to the character's memories. */
export function rememberEvent(character: Character, eventId: LedgerEventId | string): Character {
  const owned = requireLedgerEventId(eventId) as LedgerEventId;
  if (character.memories.includes(owned)) return character;
  const memories = Object.freeze([...character.memories, owned].sort());
  return Object.freeze({ ...character, memories });
}

/** Rebuild a `Character` from already-validated parts (persistence reads). */
export function characterFromParts(parts: {
  readonly id: CanonicalId;
  readonly bornAtSimTime: SimTime;
  readonly diedAtSimTime: SimTime | null;
  readonly designatedSuccessor: CanonicalId | null;
  readonly memories: readonly LedgerEventId[];
}): Character {
  const base = createCharacter({
    id: parts.id,
    bornAtSimTime: parts.bornAtSimTime,
    designatedSuccessor: parts.designatedSuccessor,
    memories: parts.memories,
  });
  if (parts.diedAtSimTime === null) return base;
  return recordDeath(base, parts.diedAtSimTime);
}
