import type {
  BattleAdapter,
  BattleResult,
  BattleState,
  PreparedBattle,
} from '../src/domain/battles/index.js';
import { describe, expect, it } from 'vitest';

const state: BattleState = { battleId: 'battle-1', locationId: 'location-1' };

/** In-memory adapter used to prove the domain contract is implementable without any engine. */
class FakeBattleAdapter implements BattleAdapter {
  readonly calls: string[] = [];

  async prepareBattle(battle: BattleState): Promise<PreparedBattle> {
    this.calls.push(`prepareBattle:${battle.battleId}`);
    return { battleId: battle.battleId, handle: `fake/${battle.locationId}` };
  }

  async launchBattle(battle: PreparedBattle): Promise<void> {
    this.calls.push(`launchBattle:${battle.handle}`);
  }

  async waitForResult(battleId: string): Promise<BattleResult> {
    this.calls.push(`waitForResult:${battleId}`);
    return { battleId, outcome: 'defender_victory' };
  }

  async cleanup(battleId: string): Promise<void> {
    this.calls.push(`cleanup:${battleId}`);
  }
}

describe('BattleAdapter', () => {
  it('is satisfied by a fake implementation with no engine dependency', async () => {
    const adapter: BattleAdapter = new FakeBattleAdapter();

    const prepared = await adapter.prepareBattle(state);
    expect(prepared.battleId).toBe('battle-1');

    await adapter.launchBattle(prepared);
    const result = await adapter.waitForResult(prepared.battleId);
    await adapter.cleanup(prepared.battleId);

    expect(result).toEqual({ battleId: 'battle-1', outcome: 'defender_victory' });
  });

  it('keeps the domain battle types minimal and engine-agnostic', () => {
    const keys: readonly (keyof BattleState)[] = ['battleId', 'locationId'];
    expect(keys).toHaveLength(2);

    // @ts-expect-error engine-specific fields must not be accepted by the domain
    const polluted: BattleState = { battleId: 'battle-1', locationId: 'location-1', unitKey: 'x' };
    void polluted;
  });
});
