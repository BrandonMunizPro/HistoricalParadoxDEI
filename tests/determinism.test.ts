import { describe, expect, it } from 'vitest';
import { createDueWorkScheduler } from '../src/domain/time/index.js';
import { createClock, simTime, WorkClassRank, workIdentifier } from '../src/domain/time/index.js';

/** Deterministic LCG for permutation-only tests; never used by the domain. */
class Lcg {
  state: number;

  constructor(seed: number) {
    this.state = seed >>> 0;
  }

  next(): number {
    this.state = (Math.imul(this.state, 1664525) + 1013904223) >>> 0;
    return this.state;
  }

  pick(maxExclusive: number): number {
    return this.next() % maxExclusive;
  }
}

function permuted(lcg: Lcg, ids: readonly string[]): string[] {
  const result = [...ids];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = lcg.pick(index + 1);
    const current = result[index];
    const other = result[swapIndex];
    if (current === undefined || other === undefined) continue;
    result[index] = other;
    result[swapIndex] = current;
  }
  return result;
}

const ids = Array.from({ length: 40 }, (_, index) => `w-${String(index).padStart(3, '0')}`);

function runInOrder(insertionOrder: readonly string[]): readonly string[] {
  const clock = createClock(simTime(0));
  const scheduler = createDueWorkScheduler<string>(clock);
  for (const id of insertionOrder) {
    scheduler.schedule({
      dueSimTime: simTime(120),
      classRank: WorkClassRank.world,
      workIdentifier: workIdentifier(id),
      work: id,
    });
  }
  return scheduler.runAll((current) => current.work).map((current) => current.work);
}

describe('Deterministic scheduler output (ADR-0003 A5; ADR-0008)', () => {
  it('shuffled insertion order never changes the executed sequence', () => {
    const sorted = [...ids].sort();
    const seed42 = permuted(new Lcg(42), ids);
    const seed42again = permuted(new Lcg(42), ids);
    const seed7 = permuted(new Lcg(7), ids);

    expect(seed42).toEqual(seed42again);
    expect(seed42).not.toEqual(seed7);

    expect(runInOrder(seed42)).toEqual(sorted);
    expect(runInOrder(seed42again)).toEqual(sorted);
    expect(runInOrder(seed7)).toEqual(sorted);
  });

  it('the byte-identical output string is identical across seeds and runs', () => {
    const serialize = (result: readonly string[]): string => result.join('\n');
    const seed42 = permuted(new Lcg(42), ids);
    const seed42again = permuted(new Lcg(42), ids);
    const seed7 = permuted(new Lcg(7), ids);
    expect(serialize(runInOrder(seed42))).toBe(serialize(runInOrder(seed42again)));
    expect(serialize(runInOrder(seed42))).toBe(serialize(runInOrder(seed7)));
  });

  it('due instant dominates the ordering axis even when insertion interleaves the classes', () => {
    const items = [
      ...Array.from({ length: 8 }, (_, index) => ({ id: `early-${String(8 - index).padStart(3, '0')}`, due: 100 })),
      ...Array.from({ length: 8 }, (_, index) => ({ id: `late-${String(index).padStart(3, '0')}`, due: 200 })),
    ];
    const names = items.map((item) => item.id);
    const order = permuted(new Lcg(42), names);
    const clock = createClock(simTime(0));
    const scheduler = createDueWorkScheduler<string>(clock);
    for (const name of order) {
      const item = items.find((candidate) => candidate.id === name);
      if (item === undefined) throw new Error('missing fixture item');
      scheduler.schedule({
        dueSimTime: simTime(item.due),
        classRank: WorkClassRank.world,
        workIdentifier: workIdentifier(name),
        work: name,
      });
    }
    const expected = [...items]
      .sort((left, right) => left.due - right.due || left.id.localeCompare(right.id))
      .map((item) => item.id);
    const executed = scheduler.runAll((current) => current.work).map((current) => current.work);
    expect(executed).toEqual(expected);
  });
});