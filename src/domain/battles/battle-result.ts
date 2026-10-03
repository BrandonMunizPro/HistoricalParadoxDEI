/**
 * Provisional outcome vocabulary for a resolved battle. Deliberately coarse:
 * the simulation interprets the result against its own state, so no tactical
 * detail is carried here.
 */
export type BattleOutcome = 'attacker_victory' | 'defender_victory' | 'indecisive';

/**
 * The result a tactical engine returns to the campaign simulation once it has
 * finished resolving a battle.
 */
export interface BattleResult {
  /** Identifier of the battle this result belongs to. */
  readonly battleId: string;
  /** Coarse outcome; the simulation decides what it means. */
  readonly outcome: BattleOutcome;
}
