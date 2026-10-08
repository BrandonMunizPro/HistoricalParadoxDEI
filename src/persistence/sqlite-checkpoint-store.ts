/**
 * SQLite-backed immutable checkpoint store (ADR-0010 Delta 1, AD-9; E17a).
 *
 * Publishes and reads **independent, immutable save slots**: a coherent,
 * verified copy of the live campaign database at one SimTime boundary.
 * Saves never mutate the source (they are snapshots, taken between committed
 * steps); loads never write into a slot (they open read-only and verify
 * before returning); and loading and continuing always happen in a fresh
 * continuation, never by mutating the slot (Rome-II semantics, AD-9).
 *
 * The snapshot is produced with the engine's own consistent copy command
 * (`VACUUM INTO` a fresh file — never a raw file copy of a live WAL
 * database, which could silently omit un-checkpointed frames). The staged
 * copy is then stamped with its save kind, integrity-checked, and
 * **atomically renamed** into the slot: a failed save leaves the previous
 * valid slot untouched, and success is only ever reported after verification.
 */
import { existsSync, mkdirSync, readdirSync, renameSync, unlinkSync } from 'node:fs';
import { join, resolve, sep } from 'node:path';
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import type { LedgerConsequenceLink, LedgerEvent } from '../domain/ledger/index.js';
import { orderLedgerEventsForImport } from '../domain/ledger/index.js';
import type {
  CampaignSnapshot,
  CheckpointSaveKind,
  CheckpointSaveResult,
  CheckpointSlotId,
  CheckpointStore,
} from '../domain/persistence/index.js';
import {
  CheckpointIntegrityError,
  CheckpointNotFoundError,
  UnsupportedCheckpointVersionError,
  requireCheckpointSlotId,
} from '../domain/persistence/index.js';
import { parseSimTimeStableString } from '../domain/time/index.js';
import type { SimTime } from '../domain/time/index.js';
import {
  entityRowToWorldEntity,
  ledgerEventRowToLedgerEvent,
  ledgerLinkRowToLink,
  pendingWorkRowToPersisted,
  readAllRows,
  readMetaValue,
  scenarioRowsToDescriptor,
} from './conversions.js';
import { SCHEMA_VERSION } from './schema.js';

export interface SqliteCheckpointStoreOptions {
  /** Directory that will hold one `.db` file per slot; created if missing. */
  readonly slotsDirectory: string;
  /** The live campaign database connection this store snapshots from. */
  readonly source: Database.Database;
}

function messageOf(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error);
}

/** Escape a path for a SQLite string literal (single quotes doubled). */
function sqlLiteral(text: string): string {
  return text.replace(/'/g, "''");
}

/**
 * Belt-and-braces containment guard on top of the strict slot-id validator:
 * whatever a slot spells, its final and staging files must resolve inside the
 * slots directory. Impossible via the validator (ADR-0010); enforced here so a
 * regression in id validation can never become a path escape.
 */
function resolvedPathInside(directory: string, candidate: string): void {
  const base = resolve(directory);
  const target = resolve(candidate);
  if (target !== base && !target.startsWith(base + sep)) {
    throw new RangeError(
      `A checkpoint path '${candidate}' escaped its save directory '${directory}' (ADR-0010).`,
    );
  }
}

export function createSqliteCheckpointStore(options: SqliteCheckpointStoreOptions): CheckpointStore {
  const source = options.source;
  const slotsDirectory = options.slotsDirectory;
  if (typeof slotsDirectory !== 'string' || slotsDirectory.length === 0) {
    throw new RangeError('A checkpoint store slotsDirectory must be a nonempty string (ADR-0010).');
  }
  mkdirSync(slotsDirectory, { recursive: true });

  function slotPath(slotId: CheckpointSlotId): string {
    const candidate = join(slotsDirectory, `${slotId}.db`);
    resolvedPathInside(slotsDirectory, candidate);
    return candidate;
  }

  function stagedPath(slotId: CheckpointSlotId): string {
    const candidate = join(slotsDirectory, `~${slotId}.tmp.db`);
    resolvedPathInside(slotsDirectory, candidate);
    return candidate;
  }

  /**
   * Read the save-kind stamp of an existing slot. Returns `null` when the
   * slot cannot be identified (corrupt, unstamped, wrong format), which callers
   * treat as "never overwrite".
   */
  function readSlotSaveKind(databasePath: string): 'manual' | 'autosave' | null {
    try {
      const handle = new Database(databasePath, { readonly: true, fileMustExist: true });
      try {
        const row = handle
          .prepare('SELECT value FROM meta WHERE key = ?')
          .get('save_kind') as { readonly value?: unknown } | undefined;
        const kind = row?.value;
        return kind === 'manual' ? 'manual' : kind === 'autosave' ? 'autosave' : null;
      } finally {
        handle.close();
      }
    } catch {
      return null;
    }
  }

  function verifyLedgerCoherence(
    slotId: CheckpointSlotId,
    events: readonly LedgerEvent[],
    links: readonly LedgerConsequenceLink[],
  ): void {
    orderLedgerEventsForImport(events);
    const present = new Set(events.map((event) => event.id));
    for (const event of events) {
      for (const cause of event.causes) {
        if (!present.has(cause)) {
          throw new CheckpointIntegrityError(
            slotId,
            `ledger event '${String(event.id)}' references cause '${String(cause)}', which is not recorded in this save`,
          );
        }
      }
    }
    for (const link of links) {
      if (!present.has(link.sourceId)) {
        throw new CheckpointIntegrityError(
          slotId,
          `ledger consequence link references source '${String(link.sourceId)}', which is not recorded in this save`,
        );
      }
      if (!present.has(link.consequenceId)) {
        throw new CheckpointIntegrityError(
          slotId,
          `ledger consequence link references consequence '${String(link.consequenceId)}', which is not recorded in this save`,
        );
      }
    }
  }

  function readVerifiedSnapshot(slotId: CheckpointSlotId, databasePath: string): CampaignSnapshot {
    const handle = new Database(databasePath, { readonly: true, fileMustExist: true });
    try {
      handle.pragma('query_only = ON');
      const integrity = handle.prepare('PRAGMA integrity_check').pluck().all();
      if (integrity.length !== 1 || integrity[0] !== 'ok') {
        throw new CheckpointIntegrityError(slotId, 'integrity_check reported corruption');
      }
      const db = drizzle(handle);
      const versionText = readMetaValue(db, 'schema_version');
      const foundSchemaVersion =
        typeof versionText === 'string' && /^\d+$/.test(versionText) ? Number(versionText) : NaN;
      if (!Number.isSafeInteger(foundSchemaVersion) || foundSchemaVersion !== SCHEMA_VERSION) {
        throw new UnsupportedCheckpointVersionError(slotId, foundSchemaVersion, SCHEMA_VERSION);
      }
      const saveKind = readMetaValue(db, 'save_kind');
      if (saveKind !== 'manual' && saveKind !== 'autosave') {
        throw new CheckpointIntegrityError(slotId, `missing or invalid save_kind '${String(saveKind)}'`);
      }
      const savedAtText = readMetaValue(db, 'current_sim_time');
      if (savedAtText === undefined) {
        throw new CheckpointIntegrityError(slotId, 'missing current_sim_time');
      }
      const savedAtSimTime = decodeSavedSimTime(slotId, savedAtText);
      const rows = readAllRows(db);
      const ledgerEvents = rows.ledgerEvents.map(ledgerEventRowToLedgerEvent);
      const ledgerConsequenceLinks = rows.ledgerLinks.map(ledgerLinkRowToLink);
      verifyLedgerCoherence(slotId, ledgerEvents, ledgerConsequenceLinks);
      return {
        scenario: scenarioRowsToDescriptor(rows.scenario, rows.months),
        savedAtSimTime,
        schemaVersion: SCHEMA_VERSION,
        saveKind,
        entities: rows.entities.map(entityRowToWorldEntity),
        pendingWork: rows.pending.map(pendingWorkRowToPersisted),
        ledgerEvents,
        ledgerConsequenceLinks,
      };
    } finally {
      handle.close();
    }
  }

  function decodeSavedSimTime(slotId: CheckpointSlotId, text: string): SimTime {
    try {
      return parseSimTimeStableString(text);
    } catch (error) {
      throw new CheckpointIntegrityError(
        slotId,
        `invalid current_sim_time '${text}': ${messageOf(error)}`,
      );
    }
  }

  function stampSaveKind(databasePath: string, slotId: CheckpointSlotId, saveKind: CheckpointSaveKind): void {
    const handle = new Database(databasePath);
    try {
      handle
        .prepare(
          'INSERT INTO meta (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value',
        )
        .run('save_kind', saveKind);
    } catch (error) {
      throw new CheckpointIntegrityError(slotId, `could not stamp save_kind: ${messageOf(error)}`);
    } finally {
      handle.close();
    }
  }

  return {
    save(slotId: CheckpointSlotId, saveKind: CheckpointSaveKind): CheckpointSaveResult {
      const id = requireCheckpointSlotId(slotId) as CheckpointSlotId;
      const finalPath = slotPath(id);
      if (existsSync(finalPath)) {
        const existingKind = readSlotSaveKind(finalPath);
        if (saveKind === 'manual') {
          return {
            ok: false,
            slotId: id,
            reason:
              'A manual save slot with this id already exists: saves are independent and never overwrite one another (ADR-0010).',
          };
        }
        if (existingKind !== 'autosave') {
          return {
            ok: false,
            slotId: id,
            reason:
              'An autosave may replace only another autosave: this slot is a manual save (or is not verifiably an autosave), so it is left untouched (ADR-0010).',
          };
        }
      }
      const stagingPath = stagedPath(id);
      try {
        if (existsSync(stagingPath)) {
          unlinkSync(stagingPath);
        }
        source.exec(`VACUUM INTO '${sqlLiteral(stagingPath)}'`);
        stampSaveKind(stagingPath, id, saveKind);
        const snapshot = readVerifiedSnapshot(id, stagingPath);
        renameSync(stagingPath, finalPath);
        return { ok: true, slotId: id, savedAtSimTime: snapshot.savedAtSimTime };
      } catch (error) {
        try {
          if (existsSync(stagingPath)) {
            unlinkSync(stagingPath);
          }
        } catch {
          // Best effort: a leftover staging file is inert, never a published slot.
        }
        return { ok: false, slotId: id, reason: messageOf(error) };
      }
    },

    load(slotId: CheckpointSlotId): CampaignSnapshot {
      const id = requireCheckpointSlotId(slotId) as CheckpointSlotId;
      const finalPath = slotPath(id);
      if (!existsSync(finalPath)) {
        throw new CheckpointNotFoundError(id);
      }
      try {
        return readVerifiedSnapshot(id, finalPath);
      } catch (error) {
        if (
          error instanceof CheckpointNotFoundError ||
          error instanceof CheckpointIntegrityError ||
          error instanceof UnsupportedCheckpointVersionError
        ) {
          throw error;
        }
        throw new CheckpointIntegrityError(id, messageOf(error));
      }
    },

    listSlots(): readonly CheckpointSlotId[] {
      return readdirSync(slotsDirectory)
        .filter((fileName) => fileName.endsWith('.db') && !fileName.startsWith('~'))
        .map((fileName) => fileName.slice(0, -'.db'.length))
        .filter((name): name is CheckpointSlotId => {
          try {
            requireCheckpointSlotId(name);
            return true;
          } catch {
            return false;
          }
        })
        .sort();
    },
  };
}
