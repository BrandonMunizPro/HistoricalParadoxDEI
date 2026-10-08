/**
 * SQLite-backed live campaign store (ADR-0010, AD-9; E17a).
 *
 * Implements `CampaignStore` (and thus the change-aware world, pending-work
 * and ledger mirrors) over a better-sqlite3 connection and Drizzle's sync
 * query surface. Opening a store applies forward-only migrations, then gates
 * the database on the supported schema version (AD-9). Scenario/calendar
 * identity is authored once by `initializeScenario`.
 *
 * Every executed step is written through `runInTransaction`, so world rows,
 * the pending-set rewrite, ledger appends and the mirrored SimTime commit
 * together — a checkpoint taken by `SqliteCheckpointStore` between steps is
 * therefore coherent by construction.
 *
 * This is the composition root's storage choice; the domain knows nothing
 * about it (ports are in `src/domain/persistence`).
 */
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import Database from 'better-sqlite3';
import { and, eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import type { CampaignStore } from '../domain/persistence/campaign-store.js';
import type { ScenarioDescriptor } from '../domain/persistence/scenario-descriptor.js';
import { requireScenarioDescriptor } from '../domain/persistence/scenario-descriptor.js';
import type { PersistedWorkEntry } from '../domain/persistence/scheduled-work-repository.js';
import type { WorldEntity } from '../domain/persistence/world-state-repository.js';
import type { WorldEntityInput } from '../domain/persistence/world-state-repository.js';
import type { LedgerConsequenceLink, LedgerEvent, LedgerEventId } from '../domain/ledger/index.js';
import { createLedgerEvent, requireLedgerEventId } from '../domain/ledger/index.js';
import { parseSimTimeStableString, simTimeToStableString } from '../domain/time/index.js';
import type { SimTime } from '../domain/time/index.js';
import type { CanonicalId } from '../domain/identity/index.js';
import {
  entityRowToWorldEntity,
  ledgerEventRowToLedgerEvent,
  ledgerEventToRow,
  ledgerLinkRowToLink,
  ledgerLinkToRow,
  pendingWorkRowToPersisted,
  persistedWorkEntryToRow,
  readMetaValue,
  scenarioDescriptorToCalendarMonthRows,
  scenarioDescriptorToScenarioRow,
  scenarioRowsToDescriptor,
} from './conversions.js';
import {
  calendarMonthTable,
  entityTable,
  ledgerConsequenceTable,
  ledgerEventTable,
  metaTable,
  pendingWorkTable,
  scenarioTable,
  SCHEMA_VERSION,
} from './schema.js';

const migrationsFolder = fileURLToPath(new URL('./migrations', import.meta.url));

export interface SqliteCampaignStoreOptions {
  /** Filesystem path of the live campaign database file; parent is created. */
  readonly databasePath: string;
}

export interface OpenedSqliteCampaignDatabase {
  readonly sqlite: Database.Database;
  readonly store: CampaignStore;
}

export function createSqliteCampaignStore(options: SqliteCampaignStoreOptions): CampaignStore {
  return openSqliteCampaignDatabase(options.databasePath).store;
}

export function openSqliteCampaignDatabase(databasePath: string): OpenedSqliteCampaignDatabase {
  if (typeof databasePath !== 'string' || databasePath.length === 0) {
    throw new RangeError('A campaign store databasePath must be a nonempty string (ADR-0010).');
  }
  mkdirSync(dirname(databasePath), { recursive: true });
  const sqlite = new Database(databasePath);
  const db = drizzle(sqlite);
  try {
    sqlite.pragma('journal_mode = WAL');
    migrate(db, { migrationsFolder });
    ensureSchemaVersion(db);
  } catch (error) {
    sqlite.close();
    throw error;
  }

  function ensureSchemaVersion(database: ReturnType<typeof drizzle>): void {
    const recorded = readMetaValue(database, 'schema_version');
    if (recorded === undefined) {
      writeMeta('schema_version', String(SCHEMA_VERSION));
      return;
    }
    if (recorded !== String(SCHEMA_VERSION)) {
      throw new RangeError(
        `The live campaign database uses schema version ${recorded}; this build supports ${SCHEMA_VERSION}.`,
      );
    }
  }

  function writeMeta(key: string, value: string): void {
    db.insert(metaTable)
      .values({ key, value })
      .onConflictDoUpdate({ target: metaTable.key, set: { value } })
      .run();
  }

  function readMeta(key: string): string | undefined {
    return readMetaValue(db, key);
  }

  function readEntity(id: CanonicalId): WorldEntity | null {
    const row = db.select().from(entityTable).where(eq(entityTable.id, id)).get();
    return row === undefined ? null : entityRowToWorldEntity(row);
  }

  function readLedgerEvent(id: LedgerEventId): LedgerEvent | null {
    const row = db.select().from(ledgerEventTable).where(eq(ledgerEventTable.id, id)).get();
    return row === undefined ? null : ledgerEventRowToLedgerEvent(row);
  }

  function writePendingWork(entries: readonly PersistedWorkEntry[]): void {
    const rows = entries.map(persistedWorkEntryToRow);
    sqlite.transaction(() => {
      db.delete(pendingWorkTable).run();
      if (rows.length > 0) {
        db.insert(pendingWorkTable).values(rows).run();
      }
    })();
  }

  const store: CampaignStore = {
    world: {
      readCurrentSimTime(): SimTime {
        const value = readMeta('current_sim_time');
        if (value === undefined) {
          throw new RangeError(
            'The live campaign database carries no current_sim_time mirror (ADR-0010).',
          );
        }
        return parseSimTimeStableString(value);
      },
      writeCurrentSimTime(next: SimTime): void {
        writeMeta('current_sim_time', simTimeToStableString(next));
      },
      getEntity(id: CanonicalId): WorldEntity | null {
        return readEntity(id);
      },
      allEntities(): readonly WorldEntity[] {
        return db
          .select()
          .from(entityTable)
          .orderBy(entityTable.id)
          .all()
          .map(entityRowToWorldEntity);
      },
      upsertEntity(input: WorldEntityInput): WorldEntity {
        db.insert(entityTable)
          .values({
            id: input.id,
            kind: input.kind,
            scalarState: input.scalarState,
            ended: 0,
          })
          .onConflictDoUpdate({
            target: entityTable.id,
            set: {
              kind: input.kind,
              scalarState: input.scalarState,
            },
          })
          .run();
        const entity = readEntity(input.id);
        if (entity === null) {
          throw new Error(
            'The live campaign database lost an entity mirror immediately after writing it.',
          );
        }
        return entity;
      },
      markEntityEnded(id: CanonicalId): WorldEntity {
        const result = db
          .update(entityTable)
          .set({ ended: 1 })
          .where(eq(entityTable.id, id))
          .run();
        if (result.changes === 0) {
          throw new RangeError(
            `Cannot end entity '${id}': no such entity is mirrored (ADR-0009 3).`,
          );
        }
        const entity = readEntity(id);
        if (entity === null) {
          throw new Error(
            'The live campaign database lost an entity mirror immediately after ending it.',
          );
        }
        return entity;
      },
    },
    pendingWork: {
      writePendingWork,
      readPendingWork(): readonly PersistedWorkEntry[] {
        return db
          .select()
          .from(pendingWorkTable)
          .orderBy(pendingWorkTable.workIdentifier)
          .all()
          .map(pendingWorkRowToPersisted);
      },
    },
    ledger: {
      appendEvent(event: LedgerEvent): LedgerEvent {
        const owned = createLedgerEvent(event);
        if (readLedgerEvent(owned.id) !== null) {
          throw new RangeError(
            `A ledger event with id '${event.id}' is already recorded: the ledger is append-only (ADR-0002).`,
          );
        }
        for (const cause of owned.causes) {
          if (readLedgerEvent(cause) === null) {
            throw new RangeError(
              `A ledger event cannot reference cause '${cause}' before it is recorded: the ledger is append-only and events append in causal order (ADR-0002).`,
            );
          }
        }
        db.insert(ledgerEventTable).values(ledgerEventToRow(owned)).run();
        return owned;
      },
      appendConsequence(link: LedgerConsequenceLink): void {
        const sourceId = requireLedgerEventId(link.sourceId) as LedgerEventId;
        const consequenceId = requireLedgerEventId(link.consequenceId) as LedgerEventId;
        if (sourceId === consequenceId) {
          throw new RangeError(
            `A ledger consequence link cannot reference itself ('${sourceId}') (ADR-0002).`,
          );
        }
        if (readLedgerEvent(sourceId) === null || readLedgerEvent(consequenceId) === null) {
          throw new RangeError(
            `A ledger consequence link requires both events to exist ('${sourceId}', '${consequenceId}') (ADR-0002).`,
          );
        }
        const existing = db
          .select()
          .from(ledgerConsequenceTable)
          .where(and(
            eq(ledgerConsequenceTable.sourceId, sourceId),
            eq(ledgerConsequenceTable.consequenceId, consequenceId),
          ))
          .get();
        if (existing !== undefined) {
          throw new RangeError(
            `A ledger consequence link '${sourceId}' -> '${consequenceId}' is already recorded (ADR-0002).`,
          );
        }
        db.insert(ledgerConsequenceTable).values(ledgerLinkToRow(link)).run();
      },
      eventById(id: LedgerEventId): LedgerEvent | null {
        return readLedgerEvent(id);
      },
      events(): readonly LedgerEvent[] {
        return db
          .select()
          .from(ledgerEventTable)
          .all()
          .map(ledgerEventRowToLedgerEvent)
          .sort((left, right) => {
            const byTime = left.occurredAtSimTime - right.occurredAtSimTime;
            if (byTime !== 0) return byTime;
            return left.id < right.id ? -1 : left.id > right.id ? 1 : 0;
          });
      },
      consequenceLinks(): readonly LedgerConsequenceLink[] {
        return db
          .select()
          .from(ledgerConsequenceTable)
          .orderBy(ledgerConsequenceTable.sourceId, ledgerConsequenceTable.consequenceId)
          .all()
          .map(ledgerLinkRowToLink);
      },
    },
    initializeScenario(descriptor: ScenarioDescriptor<string>): void {
      const owned = requireScenarioDescriptor(descriptor);
      if (store.readScenario() !== null) {
        throw new RangeError(
          'This campaign store already carries a scenario: a live campaign is created from one descriptor, never from several (ADR-0010).',
        );
      }
      sqlite.transaction(() => {
        db.insert(scenarioTable).values(scenarioDescriptorToScenarioRow(owned)).run();
        const months = scenarioDescriptorToCalendarMonthRows(owned);
        if (months.length > 0) {
          db.insert(calendarMonthTable).values(months).run();
        }
        writeMeta('current_sim_time', simTimeToStableString(owned.epochSimTime));
      })();
    },
    readScenario(): ScenarioDescriptor<string> | null {
      const scenarioRow = db.select().from(scenarioTable).get();
      if (scenarioRow === undefined) return null;
      const months = db
        .select()
        .from(calendarMonthTable)
        .orderBy(calendarMonthTable.monthIndex)
        .all();
      return scenarioRowsToDescriptor(scenarioRow, months);
    },
    runInTransaction<T>(work: () => T): T {
      return sqlite.transaction(work)();
    },
  };

  return { sqlite, store };
}
