import type { BattleResult } from './battle-result.js';
import type { BattleState } from './battle-state.js';
import type { PreparedBattle } from './prepared-battle.js';

/**
 * Boundary between the authoritative campaign simulation and a tactical battle
 * engine.
 *
 * The simulation owns strategic truth. A tactical engine temporarily owns battle
 * resolution for the duration of one engagement and reports back a
 * {@link BattleResult}; it never becomes a second source of campaign truth.
 *
 * Implementations live outside the domain (see `src/tactical/adapters`). The
 * domain depends on this interface only, never on an engine.
 */
export interface BattleAdapter {
  prepareBattle(battle: BattleState): Promise<PreparedBattle>;
  launchBattle(battle: PreparedBattle): Promise<void>;
  waitForResult(battleId: string): Promise<BattleResult>;
  cleanup(battleId: string): Promise<void>;
}
