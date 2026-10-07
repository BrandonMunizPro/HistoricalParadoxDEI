/**
 * DueWorkScheduler (ADR-0003 A4, A9, A13; amendment B2/N-30; ADR-0004).
 *
 * A due-work, event-driven scheduler over a **single pending set** of
 * scheduled consequences. The clock advances **directly to the next due
 * SimTime** — with work due at T=100 and the next work at T=527 the clock
 * jumps straight across; there is no whole-world sweep of intermediate
 * values (A4).
 *
 * Same-instant ordering is a **separate deterministic mechanism**, never
 * encoded into SimTime (A5). The total order is lexicographic ascending:
 *
 *   `dueSimTime -> workClassRank -> workIdentifier`
 *
 * All three components are fixed at schedule time, so shuffled insertion
 * order yields an identical execution order. Identifiers are unique within
 * the pending set, which is enforced here so the order can never fall back
 * to insertion order, a runtime counter, hash iteration or any other
 * nondeterministic tiebreak (N-30).
 *
 * Past-due scheduling requests are **rejected with an explicit error and
 * never clamped** (A13): silently moving them to now would be retroactive
 * execution. Work created while an instant is being processed joins the same
 * pending set immediately and competes under the same static key — there is
 * no wave, generation or eligibility cohort.
 *
 * A paused or frozen clock **holds** pending work: it is neither processed
 * nor cancelled, and no time passes (decision 7; A10).
 *
 * Freezing is a **generic orchestration primitive**: while frozen, every due
 * entry is held, regardless of work class. The scheduler has no tactical
 * knowledge — it never grants execution permission based on a class. The
 * simulation (orchestration) unfreezes the clock exactly when it is ready to
 * continue, and the total order then decides which entry runs next; a result
 * class runs first at the frozen instant purely because rank order says so,
 * never because the scheduler looked its rank up. The single pending set is
 * preserved: result work is enqueued through the ordinary channel and
 * competes under the same static key.
 *
 * The scheduling envelope (due instant, class rank, identifier) is **captured
 * exactly once** at schedule time: every caller-controlled value is read into
 * an owned local before any validation, and only those captured values are
 * validated. The scheduler owns the immutable key it orders by, never a live
 * reference to caller-owned memory, so mutation or hostile accessors cannot
 * reorder, duplicate or corrupt the pending set (N-30).
 *
 * Dispatch is deliberately synchronous and non-reentrant: an execute callback
 * may `schedule()` new work at the current instant, but it must never enter
 * the scheduler again while an entry is being dispatched. It receives a
 * **frozen copy** of the scheduling envelope — never the scheduler's owned
 * node — and it must never return an asynchronous (thenable) value. By the
 * time such a value is observed the callback has already started, so its
 * continuation is loose in the microtask queue and can no longer be trusted
 * deterministically; the scheduler therefore transitions to a **permanently
 * invalid** state. Every later `schedule`, `runNext` or `runAll` then fails
 * deterministically without touching scheduler state or the clock, and no
 * error, unwinding, or reentrancy reset can restore usability (ADR-0008).
 */
import type { Clock } from './clock.js';
import { compare, simTimeScalar } from './sim-time.js';
import type { SimTime } from './sim-time.js';
import type { WorkClassRank } from './work-class-rank.js';
import { requireDeclaredWorkClassRank, workClassRankOrder } from './work-class-rank.js';
import type { WorkIdentifier } from './work-identifier.js';
import { compareWorkIdentifiers, requireWellFormedIdentifier } from './work-identifier.js';

export interface ScheduledWork<TWork> {
  readonly dueSimTime: SimTime;
  readonly classRank: WorkClassRank;
  readonly workIdentifier: WorkIdentifier;
  readonly work: TWork;
}

/** Raised when a scheduling request targets a SimTime before the clock's now. */
export class PastDueSchedulingError extends Error {
  readonly requested: SimTime;
  readonly current: SimTime;

  constructor(requested: SimTime, current: SimTime) {
    super(
      `Past-due scheduling request for SimTime ${simTimeScalar(requested)} is before the current clock ${simTimeScalar(current)}: rejected, never clamped (ADR-0003 A13).`,
    );
    this.name = 'PastDueSchedulingError';
    this.requested = requested;
    this.current = current;
  }
}

export interface DueWorkScheduler<TWork> {
  /** Enqueue a scheduled consequence; rejects past-due requests. */
  schedule(entry: ScheduledWork<TWork>): ScheduledWork<TWork>;
  /** Earliest due SimTime in the pending set, or undefined when empty. */
  nextDueTime(): SimTime | undefined;
  /** Number of held or ready entries; unchanged by pause and freeze. */
  pendingCount(): number;
  /**
   * Advance the clock to the earliest due SimTime and execute exactly that
   * entry. Returns undefined when nothing is pending or the clock holds
   * (paused, or frozen — which holds every due entry regardless of class
   * until the orchestration unfreezes).
   */
  runNext(execute: (entry: ScheduledWork<TWork>) => void): ScheduledWork<TWork> | undefined;
  /**
   * Repeatedly `runNext` until the pending set empties or the clock holds.
   * Returns the executed entries in execution order.
   */
  runAll(execute: (entry: ScheduledWork<TWork>) => void): readonly ScheduledWork<TWork>[];
}

function compareScheduledWork<TWork>(
  left: ScheduledWork<TWork>,
  right: ScheduledWork<TWork>,
): number {
  const byDue = compare(left.dueSimTime, right.dueSimTime);
  if (byDue !== 0) return byDue;
  const byRank = workClassRankOrder(left.classRank) - workClassRankOrder(right.classRank);
  if (byRank !== 0) return byRank;
  return compareWorkIdentifiers(left.workIdentifier, right.workIdentifier);
}

function isThenable(value: unknown): boolean {
  if (value === null) return false;
  if (typeof value !== 'object' && typeof value !== 'function') return false;
  return typeof (value as { then?: unknown }).then === 'function';
}

function messageOf(value: unknown): string {
  if (value instanceof Error && value.message.length > 0) return value.message;
  return String(value);
}

export function createDueWorkScheduler<TWork>(clock: Clock): DueWorkScheduler<TWork> {
  const heap: ScheduledWork<TWork>[] = [];
  const pendingIdentifiers = new Set<WorkIdentifier>();
  let dispatching = false;
  let invalidated = false;

  function cloneEntry(entry: ScheduledWork<TWork>): ScheduledWork<TWork> {
    return {
      dueSimTime: entry.dueSimTime,
      classRank: entry.classRank,
      workIdentifier: entry.workIdentifier,
      work: entry.work,
    };
  }

  function failIfInvalidated(): void {
    if (invalidated) {
      throw new RangeError(
        'The scheduler is permanently invalid because an execute callback returned an asynchronous result (ADR-0008); no further scheduling or dispatch is permitted.',
      );
    }
  }

  function throwInvalidated(message: string): never {
    invalidated = true;
    throw new RangeError(message);
  }

  function siftUp(startIndex: number): void {
    let index = startIndex;
    while (index > 0) {
      const parentIndex = (index - 1) >> 1;
      const parent = heap[parentIndex];
      const child = heap[index];
      if (parent === undefined || child === undefined) return;
      if (compareScheduledWork(child, parent) >= 0) return;
      heap[parentIndex] = child;
      heap[index] = parent;
      index = parentIndex;
    }
  }

  function siftDown(startIndex: number): void {
    let index = startIndex;
    for (;;) {
      const leftIndex = index * 2 + 1;
      const rightIndex = leftIndex + 1;
      const current = heap[index];
      if (current === undefined) return;
      let smallest = index;
      const left = heap[leftIndex];
      if (left !== undefined && compareScheduledWork(left, current) < 0) {
        smallest = leftIndex;
      }
      const smallestEntry = heap[smallest];
      const right = heap[rightIndex];
      if (
        right !== undefined &&
        smallestEntry !== undefined &&
        compareScheduledWork(right, smallestEntry) < 0
      ) {
        smallest = rightIndex;
      }
      if (smallest === index) return;
      const swapped = heap[smallest];
      if (swapped === undefined) return;
      heap[index] = swapped;
      heap[smallest] = current;
      index = smallest;
    }
  }

  function schedule(entry: ScheduledWork<TWork>): ScheduledWork<TWork> {
    failIfInvalidated();
    const dueSimTime = entry.dueSimTime;
    const classRank = entry.classRank;
    const capturedIdentifier = entry.workIdentifier;
    const work = entry.work;

    requireDeclaredWorkClassRank(classRank);
    const identifier = requireWellFormedIdentifier(capturedIdentifier) as WorkIdentifier;
    if (compare(dueSimTime, clock.now()) < 0) {
      throw new PastDueSchedulingError(dueSimTime, clock.now());
    }
    if (pendingIdentifiers.has(identifier)) {
      throw new RangeError(
        `Duplicate work identifier '${identifier}' in the pending set: identifiers must be unique for the total order (ADR-0003 amendment B2).`,
      );
    }
    const snapshot = { dueSimTime, classRank, workIdentifier: identifier, work };
    pendingIdentifiers.add(identifier);
    heap.push(snapshot);
    siftUp(heap.length - 1);
    return cloneEntry(snapshot);
  }

  function pop(): ScheduledWork<TWork> | undefined {
    const top = heap[0];
    if (top === undefined) return undefined;
    const last = heap.pop();
    if (heap.length > 0 && last !== undefined) {
      heap[0] = last;
      siftDown(0);
    }
    pendingIdentifiers.delete(top.workIdentifier);
    return top;
  }

  function runNext(execute: (entry: ScheduledWork<TWork>) => void): ScheduledWork<TWork> | undefined {
    failIfInvalidated();
    if (dispatching) {
      throw new RangeError(
        'The scheduler rejects a nested dispatch from inside an execute callback: dispatch is synchronous and non-reentrant, while schedule() at the current instant stays allowed (ADR-0008).',
      );
    }
    dispatching = true;
    try {
      const earliest = heap[0];
      if (earliest === undefined) return undefined;
      if (clock.isPaused()) return undefined;
      if (clock.isFrozen()) return undefined;
      clock.advance(earliest.dueSimTime);
      const entry = pop();
      if (entry === undefined) return undefined;
      const callbackView = Object.freeze(cloneEntry(entry));
      const result = execute(callbackView) as unknown;
      let returnedThenable: boolean;
      try {
        returnedThenable = isThenable(result);
      } catch (caught) {
        throwInvalidated(
          `Inspecting an execute callback result for asynchrony failed (${messageOf(caught)}): the continuation cannot be trusted, so the scheduler is permanently invalid (ADR-0008).`,
        );
      }
      if (returnedThenable) {
        throwInvalidated(
          'An execute callback returned an asynchronous/thenable value: its continuation is already scheduled, so the scheduler can no longer be deterministic and is permanently invalid (ADR-0008).',
        );
      }
      return cloneEntry(entry);
    } finally {
      dispatching = false;
    }
  }

  function runAll(
    execute: (entry: ScheduledWork<TWork>) => void,
  ): readonly ScheduledWork<TWork>[] {
    const executed: ScheduledWork<TWork>[] = [];
    for (;;) {
      const entry = runNext(execute);
      if (entry === undefined) break;
      executed.push(entry);
    }
    return executed;
  }

  return {
    schedule,
    nextDueTime: (): SimTime | undefined => heap[0]?.dueSimTime,
    pendingCount: (): number => heap.length,
    runNext,
    runAll,
  };
}