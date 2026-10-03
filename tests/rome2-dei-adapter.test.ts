import { describe, expect, it } from 'vitest';
import type { BattleAdapter, BattleState } from '../src/domain/battles/index.js';
import { Rome2DeIAdapter } from '../src/tactical/adapters/rome2-dei/index.js';
import { NotImplementedError } from '../src/shared/not-implemented-error.js';

const state: BattleState = { battleId: 'battle-1', locationId: 'location-1' };

describe('Rome2DeIAdapter', () => {
  it('satisfies the adapter contract', () => {
    const adapter: BattleAdapter = new Rome2DeIAdapter();

    expect(typeof adapter.prepareBattle).toBe('function');
    expect(typeof adapter.launchBattle).toBe('function');
    expect(typeof adapter.waitForResult).toBe('function');
    expect(typeof adapter.cleanup).toBe('function');
  });

  it('reports each stage as unimplemented instead of guessing behaviour', async () => {
    const adapter = new Rome2DeIAdapter();

    await expect(adapter.prepareBattle(state)).rejects.toBeInstanceOf(NotImplementedError);
    await expect(
      adapter.launchBattle({ battleId: 'battle-1', handle: 'handle' }),
    ).rejects.toBeInstanceOf(NotImplementedError);
    await expect(adapter.waitForResult('battle-1')).rejects.toBeInstanceOf(NotImplementedError);
    await expect(adapter.cleanup('battle-1')).rejects.toBeInstanceOf(NotImplementedError);
  });

  it('names the missing stage in the error message', async () => {
    const adapter = new Rome2DeIAdapter();

    await expect(adapter.prepareBattle(state)).rejects.toThrow(/Rome2DeIAdapter\.prepareBattle/);
  });
});
