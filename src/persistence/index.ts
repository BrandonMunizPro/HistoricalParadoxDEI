/**
 * Persistence composition root (ADR-0010, AD-9; E17a).
 *
 * Binds the domain ports (`CampaignStore`, `CheckpointStore`) to the
 * better-sqlite3 + Drizzle implementation. Nothing outside `src/persistence`
 * may import this module; the domain layer only knows the ports in
 * `src/domain/persistence`.
 */
import type { CampaignStore } from '../domain/persistence/index.js';
import type { CheckpointStore } from '../domain/persistence/index.js';
import { createSqliteCheckpointStore } from './sqlite-checkpoint-store.js';
import { openSqliteCampaignDatabase } from './sqlite-campaign-database.js';

export interface SqlitePersistenceOptions {
  /** Filesystem path of the live campaign database file; parent is created. */
  readonly databasePath: string;
  /** Directory that will hold one `.db` file per immutable save slot. */
  readonly slotsDirectory: string;
}

export interface SqlitePersistence {
  readonly campaign: CampaignStore;
  readonly checkpoints: CheckpointStore;
  /** Release the live database connection (composition-level, not a domain port). */
  readonly close: () => void;
}

/** One composition root for a live campaign database plus its save slots. */
export function createSqlitePersistence(options: SqlitePersistenceOptions): SqlitePersistence {
  const opened = openSqliteCampaignDatabase(options.databasePath);
  let checkpoints: CheckpointStore;
  try {
    checkpoints = createSqliteCheckpointStore({
      slotsDirectory: options.slotsDirectory,
      source: opened.sqlite,
    });
  } catch (error) {
    opened.sqlite.close();
    throw error;
  }
  return {
    campaign: opened.store,
    checkpoints,
    close: (): void => {
      opened.sqlite.close();
    },
  };
}

export { createSqliteCampaignStore, openSqliteCampaignDatabase } from './sqlite-campaign-database.js';
export { createSqliteCheckpointStore } from './sqlite-checkpoint-store.js';
export type { SqliteCampaignStoreOptions } from './sqlite-campaign-database.js';
export type { SqliteCheckpointStoreOptions } from './sqlite-checkpoint-store.js';
export { SCHEMA_VERSION } from './schema.js';
