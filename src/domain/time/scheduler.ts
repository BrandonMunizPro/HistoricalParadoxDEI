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
 */
import type { Clock } from './clock.js';
import type { SimTime } from './sim-time.js';
import { compare, simTimeScalar } from './sim-time.js';
import type { WorkClassRank } from './work-class-rank.js';
import { workClassRankOrder } from './work-class-rank.js';
import type { WorkIdentifier } from './work-identifier.js';
import { compareWorkIdentifiers } from './work-identifier.js';

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
   * (paused, or frozen with the next work beyond the frozen instant).
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

export function createDueWorkScheduler<TWork>(clock: Clock): DueWorkScheduler<TWork> {
  const heap: ScheduledWork<TWork>[] = [];
  const pendingIdentifiers = new Set<WorkIdentifier>();

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
    if (compare(entry.dueSimTime, clock.now()) < 0) {
      throw new PastDueSchedulingError(entry.dueSimTime, clock.now());
    }
    if (pendingIdentifiers.has(entry.workIdentifier)) {
      throw new RangeError(
        `Duplicate work identifier '${String(entry.workIdentifier)}' in the pending set: identifiers must be unique for the total order (ADR-0003 amendment B2).`,
      );
    }
    pendingIdentifiers.add(entry.workIdentifier);
    heap.push(entry);
    siftUp(heap.length - 1);
    return entry;
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
    const earliest = heap[0];
    if (earliest === undefined) return undefined;
    if (clock.isPaused()) return undefined;
    if (clock.isFrozen() && compare(earliest.dueSimTime, clock.now()) > 0) return undefined;
    clock.advance(earliest.dueSimTime);
    const entry = pop();
    if (entry === undefined) return undefined;
    execute(entry);
    return entry;
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
