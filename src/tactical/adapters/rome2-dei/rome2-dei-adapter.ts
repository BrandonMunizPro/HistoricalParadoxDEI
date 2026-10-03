import type {
  BattleAdapter,
  BattleResult,
  BattleState,
  PreparedBattle,
} from '../../../domain/battles/index.js';
import { NotImplementedError } from '../../../shared/not-implemented-error.js';

/**
 * Battle adapter shell for Total War: Rome II / Divide et Impera.
 *
 * This class exists only to establish the dependency direction: the campaign
 * simulation talks to a `BattleAdapter`, and this is the Rome II / DeI
 * implementation of that contract. No engine knowledge leaks into the domain.
 *
 * Nothing is implemented yet. There is no game launching, no scenario XML
 * generation, no Lua integration and no result extraction; each stage throws
 * {@link NotImplementedError} naming what is missing.
 */
export class Rome2DeIAdapter implements BattleAdapter {
  prepareBattle(_battle: BattleState): Promise<PreparedBattle> {
    return Promise.reject(
      new NotImplementedError(
        'Rome2DeIAdapter.prepareBattle (translate BattleState into a Rome II scenario)',
      ),
    );
  }

  launchBattle(_battle: PreparedBattle): Promise<void> {
    return Promise.reject(
      new NotImplementedError('Rome2DeIAdapter.launchBattle (start the battle in Rome II)'),
    );
  }

  waitForResult(_battleId: string): Promise<BattleResult> {
    return Promise.reject(
      new NotImplementedError('Rome2DeIAdapter.waitForResult (collect the resolved outcome)'),
    );
  }

  cleanup(_battleId: string): Promise<void> {
    return Promise.reject(
      new NotImplementedError('Rome2DeIAdapter.cleanup (remove temporary battle artefacts)'),
    );
  }
}
