import { describe, expect, it } from 'vitest';
import { createClock } from '../src/domain/time/index.js';
import { simTime, simTimeScalar } from '../src/domain/time/index.js';

describe('Clock (ADR-0003 decision 7, A2, A10)', () => {
  it('starts on the constructed instant and advances monotonically', () => {
    const clock = createClock(simTime(0));
    expect(clock.now()).toEqual(simTime(0));
    expect(simTimeScalar(clock.advance(simTime(5)))).toBe(5);
    expect(clock.now()).toEqual(simTime(5));
    expect(clock.advance(simTime(5))).toEqual(simTime(5));
    expect(clock.now()).toEqual(simTime(5));
    expect(simTimeScalar(clock.advance(simTime(1440)))).toBe(1440);
  });

  it('never moves backwards, and a rejected move changes nothing', () => {
    const clock = createClock(simTime(5));
    expect(() => clock.advance(simTime(4))).toThrow(RangeError);
    expect(() => clock.advance(simTime(-10))).toThrow(RangeError);
    expect(clock.now()).toEqual(simTime(5));
  });

  it('pause holds progression and stores nothing that could rewind the clock', () => {
    const clock = createClock(simTime(0));
    clock.pause();
    expect(clock.isPaused()).toBe(true);
    expect(() => clock.advance(simTime(10))).toThrow(RangeError);
    expect(clock.now()).toEqual(simTime(0));
    clock.resume();
    expect(clock.isPaused()).toBe(false);
    expect(simTimeScalar(clock.advance(simTime(10)))).toBe(10);
  });

  it('freeze holds the clock at one instant across a tactical handoff (A10)', () => {
    const clock = createClock(simTime(0));
    clock.freeze();
    expect(clock.isFrozen()).toBe(true);
    expect(() => clock.advance(simTime(1))).toThrow(RangeError);
    expect(clock.now()).toEqual(simTime(0));
    expect(clock.advance(simTime(0))).toEqual(simTime(0));
    clock.unfreeze();
    expect(clock.isFrozen()).toBe(false);
    expect(simTimeScalar(clock.advance(simTime(1)))).toBe(1);
  });

  it('pause and freeze are independent capabilities', () => {
    const clock = createClock(simTime(0));
    clock.pause();
    clock.freeze();
    expect(clock.isPaused()).toBe(true);
    expect(clock.isFrozen()).toBe(true);
    clock.resume();
    expect(clock.isPaused()).toBe(false);
    expect(clock.isFrozen()).toBe(true);
    clock.unfreeze();
    expect(clock.isPaused()).toBe(false);
    expect(clock.isFrozen()).toBe(false);
  });
});