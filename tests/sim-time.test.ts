import { describe, expect, it } from 'vitest';
import type { Duration, SimTime } from '../src/domain/time/index.js';
import {
  advance,
  compare,
  difference,
  duration,
  durationScalar,
  simTime,
  simTimeScalar,
} from '../src/domain/time/index.js';

describe('SimTime construction (ADR-0003 A1, A2)', () => {
  it('accepts any safe-integer fixed-point value and round-trips its scalar', () => {
    for (const value of [0, 1, -1, 42, -42, 1000, -1000, Number.MAX_SAFE_INTEGER, -Number.MAX_SAFE_INTEGER]) {
      const time = simTime(value);
      expect(simTimeScalar(time)).toBe(value);
    }
  });

  it('rejects values that would break exact fixed-point arithmetic', () => {
    for (const value of [1.5, -0.25, Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY, 2 ** 53, Number.MAX_SAFE_INTEGER + 1]) {
      expect(() => simTime(value)).toThrow(RangeError);
      expect(() => duration(value)).toThrow(RangeError);
    }
  });

  it('type boundaries are compile-time enforced (A1: no ordinal or bare-number use)', () => {
    // @ts-expect-error a raw number is not a SimTime
    const rawNumber: SimTime = 5;
    // @ts-expect-error a Duration is not a SimTime
    const mistakenForTime: SimTime = duration(5);
    // @ts-expect-error subtracting SimTimes yields a number, not a Duration
    const notADuration: Duration = simTime(10) - simTime(5);
    // @ts-expect-error SimTime plus Duration yields a number, not a SimTime
    const notAnAdvancedTime: SimTime = simTime(1) + duration(1);
    // @ts-expect-error an ordinal count is not a SimTime
    const notAnOrdinal: SimTime = 42;
    expect(rawNumber).toBe(5);
    expect(mistakenForTime).toBe(5);
    expect(notADuration).toBe(5);
    expect(notAnAdvancedTime).toBe(2);
    expect(notAnOrdinal).toBe(42);
  });
});

describe('SimTime difference is elapsed duration (ADR-0003 A1)', () => {
  it('computes signed elapsed duration between two points', () => {
    expect(durationScalar(difference(simTime(10), simTime(4)))).toBe(6);
    expect(durationScalar(difference(simTime(4), simTime(10)))).toBe(-6);
    expect(durationScalar(difference(simTime(7), simTime(7)))).toBe(0);
  });

  it('differencing moves no clock: it is a pure function of its two inputs', () => {
    const before = simTime(900);
    for (let round = 0; round < 4; round += 1) {
      expect(durationScalar(difference(before, simTime(650)))).toBe(250);
    }
    expect(simTimeScalar(before)).toBe(900);
  });

  it('refuses a difference that would leave the exact safe-integer range', () => {
    expect(() => difference(simTime(Number.MAX_SAFE_INTEGER), simTime(-Number.MAX_SAFE_INTEGER))).toThrow(
      RangeError,
    );
  });
});

describe('advance (ADR-0003 A2 monotonicity)', () => {
  it('moves forward by the elapsed duration', () => {
    expect(simTimeScalar(advance(simTime(4), duration(6)))).toBe(10);
    expect(simTimeScalar(advance(simTime(4), duration(0)))).toBe(4);
  });

  it('never moves the timeline backwards', () => {
    expect(() => advance(simTime(5), duration(-1))).toThrow(RangeError);
    expect(simTimeScalar(simTime(5))).toBe(5);
  });

  it('refuses to leave the exact safe-integer range', () => {
    expect(() => advance(simTime(Number.MAX_SAFE_INTEGER), duration(1))).toThrow(RangeError);
    expect(() => advance(simTime(-Number.MAX_SAFE_INTEGER), duration(1))).not.toThrow();
  });

  it('difference and advance round-trip exactly', () => {
    const samples: readonly (readonly [number, number])[] = [
      [0, 0],
      [100, 25],
      [-50, 12],
      [1000, 300],
      [Number.MAX_SAFE_INTEGER - 1000, 999],
    ];
    for (const [start, elapsed] of samples) {
      const start2 = simTime(start);
      const step = duration(elapsed);
      expect(durationScalar(difference(advance(start2, step), start2))).toBe(elapsed);
    }
  });
});

describe('comparison and determinism', () => {
  it('orders points totally as -1, 0 or 1', () => {
    expect(compare(simTime(1), simTime(2))).toBe(-1);
    expect(compare(simTime(2), simTime(1))).toBe(1);
    expect(compare(simTime(2), simTime(2))).toBe(0);
  });

  it('is deterministic: identical operations yield identical results', () => {
    const run = (): readonly [number, number, number] => [
      simTimeScalar(advance(simTime(120), duration(30))),
      durationScalar(difference(simTime(200), simTime(55))),
      compare(simTime(3), simTime(9)),
    ];
    const first = run();
    for (let round = 0; round < 5; round += 1) {
      expect(run()).toEqual(first);
    }
  });
});
