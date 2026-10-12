/**
 * Death and its character-owned successor reaction (S1; VS-4 / E4).
 *
 * ## What this is
 *
 * When a character dies the character system records **two** ledger events:
 *
 * 1. `character.died` — the death itself (emitter: characters; ledger: yes).
 * 2. `character.succession_reacted` — a character-owned **reaction** to the
 *    death: it records that the death occurred, which related characters it
 *    concerns, and, when an authoritative designation already exists, it
 *    references that designated successor. It is caused by the death (a
 *    ledger consequence link / `causes` entry).
 *
 * ## What this is NOT (the distinction the slice must preserve)
 *
 * This is **not** a political claim and **not** a succession decision. It does
 * not assert a claim, decide legitimacy, transfer an office or title, choose
 * an heir, or inherit anything. The domain never selects an eldest child, a
 * spouse or a nearest relative as the legitimate successor; if no
 * authoritative designation exists, the reaction is recorded **without**
 * inventing one, referencing only the death and the reacting relations.
 *
 * The political act of asserting a claim is `claim.asserted`, which is owned
 * by the **politics** emitter and belongs to **E9** (excluded from VS-4). The
 * character reaction is the raw material a future E9 system consumes; it is
 * not that system.
 *
 * Everything here is deterministic: identifiers are caller-supplied from
 * schedule-time-fixed content (N-30), participant and witness lists are sorted
 * and deduplicated, and no wall clock or ambient randomness is consulted.
 */
import type { CanonicalId } from '../identity/index.js';
import { isCanonicalId } from '../identity/index.js';
import type { LedgerEvent, LedgerEventId } from '../ledger/index.js';
import { createLedgerEvent, requireLedgerEventId } from '../ledger/index.js';
import type { SimTime } from '../time/index.js';
import type { Character } from './character.js';

/** Event type recorded when a character dies (ADR-0005 taxonomy content). */
export const CHARACTER_DIED_EVENT = 'character.died';

/**
 * Event type recorded for the character-owned reaction to a death. Distinct
 * from the politics-owned `claim.asserted` (E9); see the module documentation.
 */
export const CHARACTER_SUCCESSION_REACTED_EVENT = 'character.succession_reacted';

export interface DeathEventInput {
  readonly id: LedgerEventId | string;
  readonly character: Character;
  /** Already-recorded events this death is a consequence of (e.g. a battle). */
  readonly causes?: readonly (LedgerEventId | string)[];
}

function requireCanonicalList(value: unknown, what: string): CanonicalId[] {
  if (value === undefined) return [];
  if (!Array.isArray(value)) {
    throw new RangeError(`A death reaction ${what} must be an array of canonical identities (ADR-0009).`);
  }
  const owned = new Set<CanonicalId>();
  for (const entry of value as readonly unknown[]) {
    if (!isCanonicalId(entry)) {
      throw new RangeError(`A death reaction ${what} must contain only canonical identities (ADR-0009).`);
    }
    owned.add(entry);
  }
  return [...owned].sort();
}

function confirmedDeathTime(character: Character): SimTime {
  if (character.diedAtSimTime === null) {
    throw new RangeError(
      `Character '${character.id}' is still alive; a death event requires a recorded death (ADR-0002).`,
    );
  }
  return character.diedAtSimTime;
}

/** Build the `character.died` ledger event for a dead character. */
export function createDeathEvent(input: DeathEventInput): LedgerEvent {
  const occurredAtSimTime = confirmedDeathTime(input.character);
  return createLedgerEvent({
    id: input.id,
    occurredAtSimTime,
    type: CHARACTER_DIED_EVENT,
    participants: [input.character.id],
    ...(input.causes === undefined ? {} : { causes: input.causes }),
  });
}

export interface SuccessionReactionInput {
  readonly id: LedgerEventId | string;
  readonly character: Character;
  /** The already-recorded `character.died` event this reaction is caused by. */
  readonly diedEventId: LedgerEventId | string;
  /** Related characters the reaction concerns (e.g. from `relatedCharacterIds`). */
  readonly relatedCharacterIds: readonly CanonicalId[];
}

/**
 * Build the `character.succession_reacted` ledger event. Participants are the
 * dead character plus any **authoritative** designated successor; witnesses are
 * the related characters (minus the dead character and any successor). No
 * successor is ever invented.
 */
export function createSuccessionReactionEvent(input: SuccessionReactionInput): LedgerEvent {
  const character = input.character;
  const occurredAtSimTime = confirmedDeathTime(character);
  const diedEventId = requireLedgerEventId(input.diedEventId) as LedgerEventId;
  const successor = character.designatedSuccessor;

  const participants = new Set<CanonicalId>([character.id]);
  if (successor !== null) participants.add(successor);
  const orderedParticipants = [...participants].sort();

  const witnesses = requireCanonicalList(input.relatedCharacterIds, 'witnesses').filter(
    (related) => related !== character.id && related !== successor,
  );

  return createLedgerEvent({
    id: input.id,
    occurredAtSimTime,
    type: CHARACTER_SUCCESSION_REACTED_EVENT,
    participants: orderedParticipants,
    witnesses,
    causes: [diedEventId],
  });
}
