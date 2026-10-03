/**
 * Canonical description of a single engagement that the campaign simulation has
 * decided must be fought.
 *
 * This type belongs to the domain and must stay free of any tactical engine
 * detail: no engine unit identifiers, reference data keys, file paths or
 * scenario formats. The campaign simulation owns strategic truth; a tactical
 * engine only ever receives this small, engine-agnostic description.
 *
 * Intentionally minimal. Participants, objectives, terrain intent and stakes
 * are deferred until the game design defines them.
 */
export interface BattleState {
  /** Stable identifier assigned by the campaign simulation. */
  readonly battleId: string;
  /** Opaque identifier of the location, owned by the campaign world model. */
  readonly locationId: string;
}
