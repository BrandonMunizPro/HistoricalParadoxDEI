import { describe, expect, it } from 'vitest';
import type { SeededRandomSource } from '../src/domain/random/index.js';
import type { SameInstantOrderKey, ScenarioCalendar, SimTime } from '../src/domain/time/index.js';
import { simTime, simTimeScalar } from '../src/domain/time/index.js';

/** Test calendar date standing in for the representation E1 will choose with N-29. */
interface TestCalendarDate {
  readonly position: number;
}

class FakeScenarioCalendar implements ScenarioCalendar<TestCalendarDate> {
  toCalendarDate(value: SimTime): TestCalendarDate {
    return { position: simTimeScalar(value) };
  }
}

/** Deterministic seeded source standing in for the algorithm a later epic supplies. */
class FakeSeededRandomSource implements SeededRandomSource {
  #state: number;

  constructor(seed: number) {
    this.#state = seed >>> 0;
  }

  nextUint32(): number {
    this.#state = (Math.imul(this.#state, 1664525) + 1013904223) >>> 0;
    return this.#state;
  }
}

interface WorkItem {
  readonly id: string;
  readonly due: SimTime;
  readonly orderingTag: string;
}

function orderWork(items: readonly WorkItem[]): readonly string[] {
  const orderKey: SameInstantOrderKey<WorkItem, string> = (work) => work.orderingTag;
  return [...items]
    .sort((left, right) => {
      const leftKey = orderKey(left);
      const rightKey = orderKey(right);
      if (leftKey < rightKey) return -1;
      if (leftKey > rightKey) return 1;
      return 0;
    })
    .map((work) => work.id);
}

describe('ScenarioCalendar seam (ADR-0003 A3)', () => {
  it('is implementable with no scale or conversion constant in the domain', () => {
    const calendar = new FakeScenarioCalendar();
    expect(calendar.toCalendarDate(simTime(0))).toEqual({ position: 0 });
    expect(calendar.toCalendarDate(simTime(1200))).toEqual({ position: 1200 });
  });

  it('conversion is a pure function of the SimTime scalar', () => {
    const calendar = new FakeScenarioCalendar();
    for (let round = 0; round < 4; round += 1) {
      expect(calendar.toCalendarDate(simTime(444))).toEqual({ position: 444 });
    }
  });

  it('rejects a wrong date shape at compile time', () => {
    // @ts-expect-error the seam's date representation is the implementing side's type
    const wrongShape: ScenarioCalendar<number> = { toCalendarDate: (value: SimTime) => ({ position: simTimeScalar(value) }) };
    expect(wrongShape.toCalendarDate(simTime(7))).toEqual({ position: 7 });
  });
});

describe('SeededRandomSource seam (ADR-0008)', () => {
  it('two sources from the same seed produce the same sequence', () => {
    const left = new FakeSeededRandomSource(12345);
    const right = new FakeSeededRandomSource(12345);
    const drawsLeft = Array.from({ length: 10 }, () => left.nextUint32());
    const drawsRight = Array.from({ length: 10 }, () => right.nextUint32());
    expect(drawsLeft).toEqual(drawsRight);
    expect(new Set(drawsLeft).size).toBeGreaterThan(1);
  });

  it('different seeds produce different sequences, all in unsigned 32-bit range', () => {
    const left = new FakeSeededRandomSource(1);
    const right = new FakeSeededRandomSource(2);
    const draws = [...Array.from({ length: 8 }, () => left.nextUint32())];
    const other = [...Array.from({ length: 8 }, () => right.nextUint32())];
    expect(draws).not.toEqual(other);
    for (const draw of [...draws, ...other]) {
      expect(Number.isInteger(draw)).toBe(true);
      expect(draw).toBeGreaterThanOrEqual(0);
      expect(draw).toBeLessThanOrEqual(0xffffffff);
    }
  });

  it('rejects an implementation that does not satisfy the seam at compile time', () => {
    // @ts-expect-error nextUint32 is required
    const incomplete: SeededRandomSource = {};
    expect(incomplete).toEqual({});
  });
});

describe('SameInstantOrderKey seam (ADR-0003 A5)', () => {
  const instant = simTime(100);
  const items: readonly WorkItem[] = [
    { id: 'alpha', due: instant, orderingTag: 'd' },
    { id: 'bravo', due: instant, orderingTag: 'b' },
    { id: 'charlie', due: instant, orderingTag: 'a' },
    { id: 'delta', due: instant, orderingTag: 'c' },
  ];

  it('orders same-instant work deterministically regardless of arrival order', () => {
    const rotated = [...items.slice(1), items[0] as WorkItem];
    const reversed = [...items].reverse();
    const arrangements = [items, rotated, reversed];
    const results = arrangements.map((arrangement) => orderWork(arrangement));
    expect(results[0]).toBeDefined();
    for (const result of results) {
      expect(result).toEqual(results[0]);
    }
  });

  it('ordering comes from the key, not from SimTime: all items share one instant', () => {
    expect(new Set(items.map((item) => simTimeScalar(item.due))).size).toBe(1);
    expect(orderWork(items)).toEqual(['charlie', 'bravo', 'delta', 'alpha']);
  });

  it('the key type is separate from SimTime at compile time', () => {
    // @ts-expect-error a SimTime is not a string ordering key
    const keyIsNotSimTime: SameInstantOrderKey<WorkItem, string> = (work) => work.due;
    expect(typeof keyIsNotSimTime).toBe('function');
  });
});
