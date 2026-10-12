/**
 * Life history and memory projection (ADR-0002; S1; VS-4 / E4).
 *
 * A character's life history is a **pure projection over the ledger alone**
 * (ADR-0002 6): the events whose `participants` include the character's
 * canonical identity, ordered deterministically by `occurredAtSimTime` then
 * event id. It reads no character state, so it can be rebuilt from the ledger
 * without replaying anything into authoritative state (ADR-0002 5).
 *
 * Memories are the character's curated references to specific ledger events.
 * Resolving them is a separate projection; a memory that references an event
 * the ledger does not record is a data-integrity error and throws rather than
 * silently dropping the reference — the same discipline the causal trace uses
 * (ADR-0002).
 */
import type { LedgerEvent, LedgerEventId } from '../ledger/index.js';
import { compare } from '../time/index.js';
import type { CanonicalId } from '../identity/index.js';
import type { Character } from './character.js';

function compareEvents(left: LedgerEvent, right: LedgerEvent): number {
  const byTime = compare(left.occurredAtSimTime, right.occurredAtSimTime);
  if (byTime !== 0) return byTime;
  return left.id < right.id ? -1 : left.id > right.id ? 1 : 0;
}

/**
 * The character's life history: every recorded event it participated in,
 * ordered deterministically. Derived from the ledger, independent of the
 * character aggregate's own state.
 */
export function composeLifeHistory(
  characterId: CanonicalId,
  events: readonly LedgerEvent[],
): readonly LedgerEvent[] {
  return Object.freeze(
    events.filter((event) => event.participants.includes(characterId)).sort(compareEvents),
  );
}

/**
 * Resolve the character's memory references to the events they name. A memory
 * with no matching recorded event throws (dangling reference, ADR-0002).
 */
export function composeRememberedEvents(
  character: Character,
  events: readonly LedgerEvent[],
): readonly LedgerEvent[] {
  const byId = new Map<LedgerEventId, LedgerEvent>(events.map((event) => [event.id, event]));
  const remembered: LedgerEvent[] = [];
  for (const memory of character.memories) {
    const event = byId.get(memory);
    if (event === undefined) {
      throw new RangeError(
        `Character '${character.id}' remembers ledger event '${memory}', which is not recorded (ADR-0002).`,
      );
    }
    remembered.push(event);
  }
  return Object.freeze(remembered.sort(compareEvents));
}
