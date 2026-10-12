/**
 * Character repository (ADR-0010, AD-9; VS-4 / E4).
 *
 * The **change-aware** durable mirror of authoritative character state and its
 * relationships, as a sibling of `WorldStateRepository` under the campaign
 * store. It is pure domain code: rows never cross this boundary, and the
 * concrete store is the composition root's choice.
 *
 * A character is stored whole (identity, birth/death SimTime, authoritative
 * successor designation and memory references) and relationships are stored
 * as directed, multi-facet edges keyed by `(from, to)`. Loading restores this
 * state **directly** — a character is never reconstructed by replaying the
 * ledger (ADR-0002 5; the S1 acceptance for VS-4).
 */
import type { Character, Relationship } from '../character/index.js';
import type { CanonicalId } from '../identity/index.js';

export interface CharacterRepository {
  /** The mirrored character, or `null`. A dead character remains readable. */
  getCharacter(id: CanonicalId): Character | null;
  /** Every mirrored character, ordered deterministically by canonical id. */
  allCharacters(): readonly Character[];
  /** Create or replace one character (change-aware, never a whole-world rewrite). */
  putCharacter(character: Character): Character;
  /** The stored edge for an ordered pair, or `null`. */
  getRelationship(from: CanonicalId, to: CanonicalId): Relationship | null;
  /** Every mirrored relationship, ordered deterministically by `(from, to)`. */
  allRelationships(): readonly Relationship[];
  /** Create or replace one directed relationship edge. */
  putRelationship(relationship: Relationship): Relationship;
}
