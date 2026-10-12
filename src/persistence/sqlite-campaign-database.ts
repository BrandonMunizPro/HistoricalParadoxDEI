/**
 * SQLite-backed live campaign store (ADR-0010, AD-9; E17a).
 *
 * Implements `CampaignStore` (and thus the change-aware world, pending-work
 * and ledger mirrors) over a better-sqlite3 connection and Drizzle's sync
 * query surface. Opening gates existing databases before connecting; only fresh
 * databases receive migrations and the supported schema stamp (AD-9). Scenario/calendar
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
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
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
import type { Character, Relationship } from '../domain/character/index.js';
import { requireAcyclicParentGraph } from '../domain/character/index.js';
import type { LedgerConsequenceLink, LedgerEvent, LedgerEventId } from '../domain/ledger/index.js';
import { createLedgerEvent, requireLedgerEventId } from '../domain/ledger/index.js';
import { parseSimTimeStableString, simTimeToStableString } from '../domain/time/index.js';
import type { SimTime } from '../domain/time/index.js';
import type { CanonicalId } from '../domain/identity/index.js';
import {
  characterRowToCharacter,
  characterToRow,
  entityRowToWorldEntity,
  ledgerEventRowToLedgerEvent,
  ledgerEventToRow,
  ledgerLinkRowToLink,
  pendingWorkRowToPersisted,
  persistedWorkEntryToRow,
  readMetaValue,
  relationshipRowToRelationship,
  relationshipToRow,
  scenarioDescriptorToCalendarMonthRows,
  scenarioDescriptorToScenarioRow,
  scenarioRowsToDescriptor,
} from './conversions.js';
import {
  calendarMonthTable,
  characterTable,
  entityTable,
  ledgerConsequenceTable,
  ledgerEventTable,
  metaTable,
  pendingWorkTable,
  relationshipTable,
  scenarioTable,
  META_SCHEMA_VERSION,
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

/**
 * SQLite may recover/checkpoint WAL and remove sidecars even when opening just
 * to inspect metadata. Never connect to the source until compatibility passes.
 * Recover an owned main-file/WAL copy instead; SHM is a rebuildable index and
 * is deliberately not copied. A rollback journal or changing source fails
 * closed: this opener does not repair or coordinate external writers.
 */
function inspectCompatibility(databasePath: string): boolean {
  if (databasePath === ':memory:') return true;
  const walPath = databasePath + '-wal';
  const journalPath = databasePath + '-journal';
  if (existsSync(journalPath)) {
    throw new RangeError('Cannot safely inspect a campaign database with a rollback journal; no files were modified.');
  }
  if (!existsSync(databasePath)) {
    if (existsSync(walPath) || existsSync(databasePath + '-shm')) {
      throw new RangeError('Cannot safely inspect campaign recovery sidecars without a main database; no files were modified.');
    }
    return true;
  }
  const mainBytes = readFileSync(databasePath);
  const walBytes = existsSync(walPath) ? readFileSync(walPath) : null;
  const inspectionDirectory = mkdtempSync(join(tmpdir(), 'historical-game-preflight-'));
  let inspection: Database.Database | undefined;
  try {
    const inspectionPath = join(inspectionDirectory, 'campaign.db');
    writeFileSync(inspectionPath, mainBytes);
    if (walBytes !== null) writeFileSync(inspectionPath + '-wal', walBytes);
    inspection = new Database(inspectionPath);
    const sqlite = inspection;
    const db = drizzle(sqlite);
    const existingTables = sqlite
      .prepare("SELECT name FROM sqlite_master WHERE type = 'table'")
      .all()
      .map((row) => (row as { readonly name: string }).name);
    const fresh = existingTables.length === 0;
    if (!fresh) {
      if (!existingTables.includes('meta')) {
        throw new RangeError(
          `The live campaign database carries tables but no '${META_SCHEMA_VERSION}' metadata, so its schema version cannot be identified; this build supports ${SCHEMA_VERSION} and never repairs or auto-migrates (ADR-0010, AD-9).`,
        );
      }
      const recorded = readMetaValue(db, META_SCHEMA_VERSION);
      if (recorded === undefined) {
        throw new RangeError(
          `The live campaign database's '${META_SCHEMA_VERSION}' metadata is empty, so its schema version cannot be identified; this build supports ${SCHEMA_VERSION} and never repairs or auto-migrates (ADR-0010, AD-9).`,
        );
      }
      if (recorded !== String(SCHEMA_VERSION)) {
        throw new RangeError(
          `The live campaign database uses schema version ${recorded}; this build supports ${SCHEMA_VERSION}.`,
        );
      }
    }
    if (
      !readFileSync(databasePath).equals(mainBytes) ||
      existsSync(walPath) !== (walBytes !== null) ||
      (walBytes !== null && !readFileSync(walPath).equals(walBytes)) ||
      existsSync(journalPath)
    ) {
      throw new RangeError('Campaign database changed during compatibility inspection; no files were modified.');
    }
    return fresh;
  } finally {
    try {
      inspection?.close();
    } finally {
      rmSync(inspectionDirectory, { recursive: true, force: true });
    }
  }
}

export function openSqliteCampaignDatabase(databasePath: string): OpenedSqliteCampaignDatabase {
  if (typeof databasePath !== 'string' || databasePath.length === 0) {
    throw new RangeError('A campaign store databasePath must be a nonempty string (ADR-0010).');
  }
  const fresh = inspectCompatibility(databasePath);
  mkdirSync(dirname(databasePath), { recursive: true });
  const sqlite = new Database(databasePath);
  const db = drizzle(sqlite);
  try {
    // Only now, on a proven-fresh or proven-supported database, does the open
    // write: WAL journal mode, then (for a fresh database) forward-only
    // migrations plus the schema-version stamp.
    sqlite.pragma('journal_mode = WAL');
    if (fresh) {
      migrate(db, { migrationsFolder });
      writeMeta(META_SCHEMA_VERSION, String(SCHEMA_VERSION));
    }
  } catch (error) {
    sqlite.close();
    throw error;
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

  function readCharacter(id: CanonicalId): Character | null {
    const row = db.select().from(characterTable).where(eq(characterTable.id, id)).get();
    return row === undefined ? null : characterRowToCharacter(row);
  }

  function readRelationship(from: CanonicalId, to: CanonicalId): Relationship | null {
    const row = db
      .select()
      .from(relationshipTable)
      .where(and(eq(relationshipTable.fromId, from), eq(relationshipTable.toId, to)))
      .get();
    return row === undefined ? null : relationshipRowToRelationship(row);
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
    characters: {
      getCharacter(id: CanonicalId): Character | null {
        return readCharacter(id);
      },
      allCharacters(): readonly Character[] {
        return db
          .select()
          .from(characterTable)
          .orderBy(characterTable.id)
          .all()
          .map(characterRowToCharacter);
      },
      putCharacter(character: Character): Character {
        const row = characterToRow(character);
        const captured = characterRowToCharacter(row);
        const existing = readCharacter(captured.id);
        if (existing !== null) {
          // A recorded death is irreversible: the mirror refuses both a stale
          // live snapshot that would resurrect the character and a conflicting
          // rewrite of an already-recorded death instant. Identical writes
          // (e.g. the death reaction re-upserting memories on the dead
          // character) stay accepted.
          if (existing.diedAtSimTime !== null && captured.diedAtSimTime === null) {
            throw new RangeError(
              `Character '${captured.id}' is already dead in the mirror (died at ${existing.diedAtSimTime}); a stale live snapshot cannot resurrect it (ADR-0002).`,
            );
          }
          if (
            existing.diedAtSimTime !== null &&
            captured.diedAtSimTime !== null &&
            existing.diedAtSimTime !== captured.diedAtSimTime
          ) {
            throw new RangeError(
              `Character '${captured.id}' already died at ${existing.diedAtSimTime}; a recorded death cannot be rewritten to ${captured.diedAtSimTime} (ADR-0002).`,
            );
          }
        }
        db.insert(characterTable)
          .values(row)
          .onConflictDoUpdate({
            target: characterTable.id,
            set: {
              bornSimTime: row.bornSimTime,
              diedSimTime: row.diedSimTime,
              designatedSuccessor: row.designatedSuccessor,
              memories: row.memories,
            },
          })
          .run();
        const stored = readCharacter(captured.id);
        if (stored === null) {
          throw new Error(
            'The live campaign database lost a character mirror immediately after writing it.',
          );
        }
        return stored;
      },
      getRelationship(from: CanonicalId, to: CanonicalId): Relationship | null {
        return readRelationship(from, to);
      },
      allRelationships(): readonly Relationship[] {
        return db
          .select()
          .from(relationshipTable)
          .orderBy(relationshipTable.fromId, relationshipTable.toId)
          .all()
          .map(relationshipRowToRelationship);
      },
      putRelationship(relationship: Relationship): Relationship {
        const row = relationshipToRow(relationship);
        const captured = relationshipRowToRelationship(row);
        // A write that would make the FACET_PARENT ancestry graph cyclic is
        // refused before any row is touched: parenthood is directed ancestry
        // (relationship.ts) and cannot reverse time (ADR-0007).
        const storedUntilNow = db
          .select()
          .from(relationshipTable)
          .all()
          .map(relationshipRowToRelationship)
          .filter((existing) => !(existing.from === captured.from && existing.to === captured.to));
        requireAcyclicParentGraph([...storedUntilNow, captured]);
        db.insert(relationshipTable)
          .values(row)
          .onConflictDoUpdate({
            target: [relationshipTable.fromId, relationshipTable.toId],
            set: { facets: row.facets },
          })
          .run();
        const stored = readRelationship(captured.from, captured.to);
        if (stored === null) {
          throw new Error(
            'The live campaign database lost a relationship mirror immediately after writing it.',
          );
        }
        return stored;
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
        db.insert(ledgerConsequenceTable).values({ sourceId, consequenceId }).run();
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
