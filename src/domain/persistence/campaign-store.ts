/**
 * Campaign store (ADR-0010, AD-9; E17a).
 *
 * The **aggregate durable-mirror port** for one live campaign: world state,
 * pending scheduler work, the append-only ledger and the scenario/calendar
 * identity, plus the exclusive per-step transaction boundary that keeps them
 * coherent.
 *
 * The running simulation stays authoritative in memory; the store mirrors it
 * change-aware and **one step at a time**. The driver applies an executed step
 * inside `runInTransaction`, so world rows, the pending-work rewrite, appended
 * ledger rows and the mirrored SimTime are committed atomically — and a
 * checkpoint copied by `CheckpointStore.save` at any SimTime boundary is
 * therefore internally coherent by construction (ADR-0010; AD-9). Live SimTime
 * may exceed the last saved SimTime; nothing here pretends they must match.
 *
 * This port is pure domain code: the rows are mirrored behind the boundary
 * and never leak, and the concrete store implementation is the composition
 * root's choice, not this interface.
 */
import type { LedgerStore } from './ledger-store.js';
import type { ScenarioDescriptor } from './scenario-descriptor.js';
import type { PendingWorkRepository } from './scheduled-work-repository.js';
import type { WorldStateRepository } from './world-state-repository.js';

export interface CampaignStore {
  readonly world: WorldStateRepository;
  readonly pendingWork: PendingWorkRepository;
  readonly ledger: LedgerStore;
  /**
   * Author the scenario/calendar identity (and epoch SimTime) exactly once.
   * Throws if the store already carries a scenario: a live campaign is created
   * from one descriptor, never from several.
   */
  initializeScenario(descriptor: ScenarioDescriptor<string>): void;
  /** The authored scenario descriptor, or `null` before initialization. */
  readScenario(): ScenarioDescriptor<string> | null;
  /**
   * Run a step's writes in one atomic transaction. The `work` callback runs
   * with no caller-visible handle: it captures the store's repositories via
   * closure and every write it performs commits together or not at all.
   */
  runInTransaction<T>(work: () => T): T;
}