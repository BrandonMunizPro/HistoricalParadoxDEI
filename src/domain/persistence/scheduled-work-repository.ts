/**
 * Persisted scheduler work (ADR-0010, AD-9; E17a).
 *
 * The scheduler is **never serialized as closures or callbacks**. What the
 * durable mirror records is exactly the scheduling envelope – due instant,
 * class rank, work identifier – plus a **registration key** (`workKind`) and a
 * JSON-safe `payload`. A load reconstructs each entry through the domain's
 * `WorkKindRegistry` and then feeds it back through `scheduler.schedule()`, so
 * every scheduler invariant (well-formed identifier, declared rank, duplicate
 * rejection, past-due rejection — never clamped) re-validates at load time
 * (ADR-0003 B2/N-30, A13).
 *
 * `pendingCount` lives on the in-memory heap only; this port mirrors the
 * pending set so a checkpoint copy is a coherent, reconstructable picture of
 * the scheduler at the exact persisted SimTime.
 */
import type { SimTime } from '../time/index.js';
import type { WorkClassRank } from '../time/index.js';
import type { WorkIdentifier } from '../time/index.js';
import { requireDeclaredWorkClassRank } from '../time/index.js';
import { hasUnpairedSurrogate } from '../time/index.js';
import { requireWellFormedIdentifier } from '../time/index.js';

/** A pending scheduler entry as the durable mirror records it. */
export interface PersistedWorkEntry {
  readonly workIdentifier: WorkIdentifier;
  readonly classRank: WorkClassRank;
  readonly dueSimTime: SimTime;
  /** Registration key for the domain dispatch that rebuilds the work payload. */
  readonly workKind: string;
  /** JSON-safe payload consumed by the registered factory for `workKind`. */
  readonly payload: unknown;
}

export interface PersistedWorkEntryInput {
  readonly workIdentifier: WorkIdentifier | string;
  readonly classRank: WorkClassRank;
  readonly dueSimTime: SimTime;
  readonly workKind: string;
  readonly payload: unknown;
}

/**
 * The supported serialization subset is strict JSON data (ADR-0010): no
 * functions, `Date` or class instances, `bigint`, symbols, `undefined` and no
 * lossy numbers (`NaN`, `±Infinity`, `-0`). Arrays and objects are deep-copied
 * and frozen so a caller's later mutation can never change what a save means.
 */
export function captureJsonSafePayload(value: unknown, what = 'payload'): unknown {
  const visited = new Set<object>();
  function capture(entry: unknown): unknown {
    if (typeof entry === 'string') {
      if (hasUnpairedSurrogate(entry)) {
        throw new RangeError(
          `A persisted work ${what} string must be well-formed Unicode with no unpaired surrogate code units (ADR-0010).`,
        );
      }
      return entry;
    }
    if (entry === null) return null;
    if (typeof entry === 'boolean') return entry;
    if (typeof entry === 'number') {
      if (!Number.isFinite(entry)) {
        throw new RangeError(
          `A persisted work ${what} must not contain ${String(entry)}: JSON has no such number (ADR-0010).`,
        );
      }
      if (Object.is(entry, -0)) {
        throw new RangeError(
          `A persisted work ${what} must not contain -0: JSON serialization would lose its sign (ADR-0010).`,
        );
      }
      return entry;
    }
    if (typeof entry !== 'object') {
      throw new RangeError(
        `A persisted work ${what} must contain only JSON-safe data, received a ${typeof entry} (ADR-0010).`,
      );
    }
    if (visited.has(entry)) {
      throw new RangeError(
        `A persisted work ${what} must not contain a cyclic reference (ADR-0010).`,
      );
    }
    visited.add(entry);
    if (Object.getOwnPropertySymbols(entry).length !== 0) {
      throw new RangeError(`A persisted work ${what} must not contain symbol keys (ADR-0010).`);
    }
    if (Array.isArray(entry)) {
      if (Object.getPrototypeOf(entry) !== Array.prototype) {
        throw new RangeError(`A persisted work ${what} must contain only ordinary JSON arrays (ADR-0010).`);
      }
      const owned: unknown[] = [];
      if (Object.getOwnPropertyNames(entry).length !== entry.length + 1) {
        throw new RangeError(`A persisted work ${what} array must be dense and have no extra properties (ADR-0010).`);
      }
      for (let index = 0; index < entry.length; index += 1) {
        const descriptor = Object.getOwnPropertyDescriptor(entry, String(index));
        if (descriptor === undefined || !('value' in descriptor) || !descriptor.enumerable) {
          throw new RangeError(`A persisted work ${what} array must contain only ordinary data elements (ADR-0010).`);
        }
        owned.push(capture(descriptor.value));
      }
      visited.delete(entry);
      return Object.freeze(owned);
    }
    if (entry instanceof Date || entry instanceof ArrayBuffer || ArrayBuffer.isView(entry)) {
      throw new RangeError(
        `A persisted work ${what} must contain only JSON-safe data, received a Date or binary view (ADR-0010).`,
      );
    }
    const proto = Object.getPrototypeOf(entry) as object | null;
    if (proto !== Object.prototype && proto !== null) {
      throw new RangeError(
        `A persisted work ${what} must contain only plain JSON objects, received a class instance (ADR-0010).`,
      );
    }
    const owned = Object.create(null) as Record<string, unknown>;
    for (const key of Object.getOwnPropertyNames(entry)) {
      if (hasUnpairedSurrogate(key)) {
        throw new RangeError(`A persisted work ${what} key must be well-formed Unicode (ADR-0010).`);
      }
      const descriptor = Object.getOwnPropertyDescriptor(entry, key);
      if (descriptor === undefined || !('value' in descriptor) || !descriptor.enumerable) {
        throw new RangeError(`A persisted work ${what} object must contain only enumerable data properties (ADR-0010).`);
      }
      const element: unknown = descriptor.value;
      if (element === undefined) {
        throw new RangeError(
          `A persisted work ${what} key '${key}' must not map to undefined: JSON would drop it (ADR-0010).`,
        );
      }
      owned[key] = capture(element);
    }
    visited.delete(entry);
    return Object.freeze(owned);
  }
  return capture(value);
}

/**
 * Build a validated, owned `PersistedWorkEntry`. Identifiers and ranks pass
 * the same strict validators the scheduler applies, so a mirrored entry can
 * never record something the scheduler itself would have rejected.
 */
export function createPersistedWorkEntry(input: PersistedWorkEntryInput): PersistedWorkEntry {
  const workIdentifier = requireWellFormedIdentifier(input.workIdentifier) as WorkIdentifier;
  const classRank = input.classRank;
  requireDeclaredWorkClassRank(classRank);
  const dueSimTime = input.dueSimTime;
  if (typeof dueSimTime !== 'number' || !Number.isSafeInteger(dueSimTime)) {
    throw new RangeError(
      `A persisted work entry due time must be a safe-integer SimTime, received ${String(dueSimTime)} (ADR-0010).`,
    );
  }
  const workKind = input.workKind;
  if (typeof workKind !== 'string' || workKind.length === 0) {
    throw new RangeError(
      'A persisted work entry workKind must be a nonempty primitive string (ADR-0010).',
    );
  }
  if (hasUnpairedSurrogate(workKind)) {
    throw new RangeError(
      'A persisted work entry workKind must be well-formed Unicode (ADR-0010).',
    );
  }
  const payload = captureJsonSafePayload(input.payload);
  return Object.freeze({
    workIdentifier,
    classRank,
    dueSimTime,
    workKind,
    payload,
  });
}

export interface PendingWorkRepository {
  /** Replace the durable pending-set mirror (the scheduler owns the live heap). */
  writePendingWork(entries: readonly PersistedWorkEntry[]): void;
  /** Read the pending set back for reconstruction; never used to mutate the scheduler. */
  readPendingWork(): readonly PersistedWorkEntry[];
}
