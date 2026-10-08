/**
 * Checkpoint store (ADR-0010, AD-9; E17a).
 *
 * The **immutable-save** side of persistence. A save is an independent,
 * Rome-II-style immutable slot: it is a coherent, verified copy of the live
 * campaign database (world state, pending scheduler work and ledger all
 * committed at one SimTime boundary), and **loading or continuing never
 * writes into it** (ADR-0010 amendment Delta 1).
 *
 * The store speaks only domain types. It has no knowledge of filesystem paths
 * (those belong to the composition root in `src/persistence`), no wall clock
 * and no JS `Date`: checkpoints carry **SimTime**, never a wall-clock
 * timestamp (ADR-0003, ADR-0008).
 *
 * Integrity rules (AD-9): a save reports success **only after** it has been
 * fully produced and verified; a failed save leaves the previous valid save
 * for that slot untouched; a load verifies the slot's integrity and schema
 * version before returning a snapshot, and reconstruction never silently
 * repairs a corrupt checkpoint.
 */
import type { LedgerConsequenceLink } from '../ledger/index.js';
import type { LedgerEvent } from '../ledger/index.js';
import { hasUnpairedSurrogate } from '../time/index.js';
import type { SimTime } from '../time/index.js';
import type { ScenarioDescriptor } from './scenario-descriptor.js';
import type { PersistedWorkEntry } from './scheduled-work-repository.js';
import type { WorldEntity } from './world-state-repository.js';

declare const checkpointSlotIdBrand: unique symbol;

/**
 * Opaque identity of an immutable save slot. Caller-supplied from stable
 * content in the same spirit as `WorkIdentifier`; validated strictly so a slot
 * name can never smuggle path or storage vocabulary across a boundary.
 */
export type CheckpointSlotId = string & { readonly [checkpointSlotIdBrand]: 'CheckpointSlotId' };

export function checkpointSlotId(value: string): CheckpointSlotId {
  return requireCheckpointSlotId(value) as CheckpointSlotId;
}

/**
 * The one strict runtime validator a slot id passes before it may address a
 * checkpoint. Beyond the well-formed-identifier rules (mirroring amendment
 * B2/N-30) a slot id must be safe to render as a single filename segment
 * (ADR-0010): no path separators (either slash), no drive/user/pipe/host
 * markers, and not the relative names `.` or `..`, so it can never address a
 * file outside the save directory. The domain layer knows nothing about
 * storage or filesystems; it only rejects names that are unsafe everywhere.
 */
export function requireCheckpointSlotId(value: unknown): string {
  if (typeof value !== 'string') {
    throw new RangeError(
      'A checkpoint slot id must be a primitive string, received a non-string representation (ADR-0010).',
    );
  }
  if (value.length === 0) {
    throw new RangeError('A checkpoint slot id must not be empty (ADR-0010).');
  }
  if (hasUnpairedSurrogate(value)) {
    throw new RangeError(
      'A checkpoint slot id must be well-formed Unicode with no unpaired surrogate code units (ADR-0010).',
    );
  }
  if (value === '.' || value === '..') {
    throw new RangeError(
      `Checkpoint slot id '${value}' is a reserved relative name and can never name a save slot (ADR-0010).`,
    );
  }
  if (value.startsWith('~') || /[. ]$/.test(value) ||
      /^(?:con|prn|aux|nul|com[1-9¹²³]|lpt[1-9¹²³])(?:\.|$)/i.test(value)) {
    throw new RangeError('A checkpoint slot id must not use a reserved or aliased filename (ADR-0010).');
  }
  for (const char of value) {
    const code = char.codePointAt(0);
    if (
      char === '/' ||
      char === '\\' ||
      char === ':' ||
      '<>"|?*'.includes(char) ||
      char === '\u0000' ||
      (code !== undefined && (code < 32 || code === 127))
    ) {
      throw new RangeError(
        `Checkpoint slot id '${value}' contains a character that is unsafe in a filename ('${char}'), so it can never name a save slot (ADR-0010).`,
      );
    }
  }
  return value;
}

/** What kind of save produced a slot. Autosave may be overwritten by the next autosave. */
export type CheckpointSaveKind = 'manual' | 'autosave';

/** Structured result of a save; success is only ever reported after verification. */
export type CheckpointSaveResult =
  | {
      readonly ok: true;
      readonly slotId: CheckpointSlotId;
      readonly savedAtSimTime: SimTime;
    }
  | {
      readonly ok: false;
      readonly slotId: CheckpointSlotId;
      readonly reason: string;
    };

/** Raised when a requested slot does not exist. */
export class CheckpointNotFoundError extends Error {
  readonly slotId: CheckpointSlotId;

  constructor(slotId: CheckpointSlotId) {
    super(`Checkpoint slot '${slotId}' does not exist (ADR-0010).`);
    this.name = 'CheckpointNotFoundError';
    this.slotId = slotId;
  }
}

/** Raised when a slot fails integrity or coherence verification (ADR-0008). */
export class CheckpointIntegrityError extends Error {
  readonly slotId: CheckpointSlotId;

  constructor(slotId: CheckpointSlotId, detail: string) {
    super(`Checkpoint slot '${slotId}' failed integrity verification: ${detail} (ADR-0008).`);
    this.name = 'CheckpointIntegrityError';
    this.slotId = slotId;
  }
}

/** Raised when a slot carries a schema version this build cannot read (AD-9). */
export class UnsupportedCheckpointVersionError extends Error {
  readonly slotId: CheckpointSlotId;
  readonly foundVersion: number;
  readonly supportedVersion: number;

  constructor(slotId: CheckpointSlotId, foundVersion: number, supportedVersion: number) {
    super(
      `Checkpoint slot '${slotId}' uses schema version ${foundVersion}; this build supports ${supportedVersion} (AD-9).`,
    );
    this.name = 'UnsupportedCheckpointVersionError';
    this.slotId = slotId;
    this.foundVersion = foundVersion;
    this.supportedVersion = supportedVersion;
  }
}

/**
 * Everything a load must hand a driver so it can rebuild a deterministic
 * continuation without touching storage again: exact SimTime, the full
 * scenario/calendar identity, world state, pending scheduler work and the
 * append-only ledger. All fields are domain types; rows never cross this
 * boundary.
 */
export interface CampaignSnapshot {
  readonly scenario: ScenarioDescriptor<string>;
  readonly savedAtSimTime: SimTime;
  readonly schemaVersion: number;
  readonly saveKind: CheckpointSaveKind;
  readonly entities: readonly WorldEntity[];
  readonly pendingWork: readonly PersistedWorkEntry[];
  readonly ledgerEvents: readonly LedgerEvent[];
  readonly ledgerConsequenceLinks: readonly LedgerConsequenceLink[];
}

export interface CheckpointStore {
  /**
   * Publish an independent immutable save slot from the current live campaign.
   * Returns `{ ok: false }` (never throws) on any failure, leaving any
   * previous valid slot untouched and reporting nothing to the console.
   */
  save(slotId: CheckpointSlotId, saveKind: CheckpointSaveKind): CheckpointSaveResult;
  /**
   * Open the immutable slot read-only, verify integrity and schema version,
   * and return the full domain-typed snapshot. Throws
   * `CheckpointNotFoundError`, `CheckpointIntegrityError` or
   * `UnsupportedCheckpointVersionError` on a problem; nothing is silently
   * repaired.
   */
  load(slotId: CheckpointSlotId): CampaignSnapshot;
  /** Identifiers of all published slots, in a stable order. */
  listSlots(): readonly CheckpointSlotId[];
}
