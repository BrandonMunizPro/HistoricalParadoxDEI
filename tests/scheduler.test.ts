import { describe, expect, it } from 'vitest';
import type { Clock, ScheduledWork, SimTime } from '../src/domain/time/index.js';
import {
  compareWorkIdentifiers,
  createDueWorkScheduler,
  PastDueSchedulingError,
  WorkClassRank,
  workIdentifier,
} from '../src/domain/time/index.js';
import { compare, simTime, simTimeScalar } from '../src/domain/time/index.js';

/** Clock that records every direct advance, proving the scheduler never sweeps. */
class RecordingClock implements Clock {
  #current: SimTime;
  #advancedTo: number[] = [];
  #paused = false;
  #frozen = false;

  constructor(initialScalar: number) {
    this.#current = simTime(initialScalar);
  }

  now(): SimTime {
    return this.#current;
  }

  advance(to: SimTime): SimTime {
    this.#advancedTo.push(simTimeScalar(to));
    const order = compare(to, this.#current);
    if (order < 0) {
      throw new RangeError('backwards');
    }
    if (order > 0 && this.#paused) {
      throw new RangeError('paused');
    }
    if (order > 0 && this.#frozen) {
      throw new RangeError('frozen');
    }
    this.#current = to;
    return to;
  }

  pause(): void {
    this.#paused = true;
  }

  resume(): void {
    this.#paused = false;
  }

  isPaused(): boolean {
    return this.#paused;
  }

  freeze(): void {
    this.#frozen = true;
  }

  unfreeze(): void {
    this.#frozen = false;
  }

  isFrozen(): boolean {
    return this.#frozen;
  }

  advancedTo(): number[] {
    return this.#advancedTo;
  }
}

function entry(id: string, dueScalar: number, rank: WorkClassRank = WorkClassRank.world): ScheduledWork<string> {
  return {
    dueSimTime: simTime(dueScalar),
    classRank: rank,
    workIdentifier: workIdentifier(id),
    work: id,
  };
}

function executedIds(result: readonly ScheduledWork<string>[]): string[] {
  return result.map((scheduled) => scheduled.work);
}

describe('DueWorkScheduler advances directly (ADR-0003 A4)', () => {
  it('jumps straight from one due instant to the next with no sweep', () => {
    const clock = new RecordingClock(0);
    const scheduler = createDueWorkScheduler<string>(clock);
    scheduler.schedule(entry('alpha', 100));
    scheduler.schedule(entry('omega', 527));
    expect(executedIds(scheduler.runAll((current) => current.work))).toEqual(['alpha', 'omega']);
    expect(clock.advancedTo()).toEqual([100, 527]);
    expect(scheduler.pendingCount()).toBe(0);
    expect(scheduler.nextDueTime()).toBeUndefined();
  });
});

describe('DueWorkScheduler same-instant ordering (ADR-0003 A5, amendment B2/N-30)', () => {
  it('is stable regardless of insertion order', () => {
    const arrangements: readonly (readonly string[])[] = [
      ['alpha', 'beta', 'delta', 'gamma'],
      ['delta', 'alpha', 'gamma', 'beta'],
      ['gamma', 'delta', 'beta', 'alpha'],
    ];
    for (const arrangement of arrangements) {
      const clock = new RecordingClock(0);
      const scheduler = createDueWorkScheduler<string>(clock);
      for (const id of arrangement) {
        scheduler.schedule(entry(id, 120));
      }
      expect(executedIds(scheduler.runAll((current) => current.work))).toEqual([
        'alpha',
        'beta',
        'delta',
        'gamma',
      ]);
    }
  });

  it('total order is dueSimTime, then class rank, then identifier', () => {
    const clock = new RecordingClock(0);
    const scheduler = createDueWorkScheduler<string>(clock);
    scheduler.schedule(entry('aaa-world', 200, WorkClassRank.world));
    scheduler.schedule(entry('zzz-battle', 200, WorkClassRank.battleResult));
    scheduler.schedule(entry('bbb-world', 100, WorkClassRank.world));
    expect(executedIds(scheduler.runAll((current) => current.work))).toEqual([
      'bbb-world',
      'zzz-battle',
      'aaa-world',
    ]);
  });

  it('breaks same-instant, same-class ties by identifier', () => {
    const clock = new RecordingClock(0);
    const scheduler = createDueWorkScheduler<string>(clock);
    scheduler.schedule(entry('middle', 100));
    scheduler.schedule(entry('first', 100));
    scheduler.schedule(entry('last', 100));
    scheduler.schedule(entry('ahead', 100, WorkClassRank.battleResult));
    expect(executedIds(scheduler.runAll((current) => current.work))).toEqual([
      'ahead',
      'first',
      'last',
      'middle',
    ]);
  });
});

describe('DueWorkScheduler past-due requests (ADR-0003 A13)', () => {
  it('rejects rather than clamping, and changes neither the clock nor the set', () => {
    const clock = new RecordingClock(100);
    const scheduler = createDueWorkScheduler<string>(clock);
    let error: unknown;
    try {
      scheduler.schedule(entry('late', 99));
    } catch (caught) {
      error = caught;
    }
    expect(error).toBeInstanceOf(PastDueSchedulingError);
    if (error instanceof PastDueSchedulingError) {
      expect(simTimeScalar(error.requested)).toBe(99);
      expect(simTimeScalar(error.current)).toBe(100);
      expect(error.message).toContain('never clamped');
    }
    expect(scheduler.pendingCount()).toBe(0);
    expect(scheduler.runAll((current) => current.work)).toEqual([]);
    expect(clock.advancedTo()).toEqual([]);
  });

  it('allows scheduling exactly at the current instant', () => {
    const clock = new RecordingClock(100);
    const scheduler = createDueWorkScheduler<string>(clock);
    scheduler.schedule(entry('now', 100));
    expect(scheduler.pendingCount()).toBe(1);
  });
});

describe('DueWorkScheduler single pending set (N-30)', () => {
  it('rejects a duplicate identifier until it has executed', () => {
    const clock = new RecordingClock(0);
    const scheduler = createDueWorkScheduler<string>(clock);
    scheduler.schedule(entry('alpha', 10));
    expect(() => scheduler.schedule(entry('alpha', 20))).toThrow(RangeError);
    expect(scheduler.pendingCount()).toBe(1);
    expect(executedIds(scheduler.runAll((current) => current.work))).toEqual(['alpha']);
    expect(() => scheduler.schedule(entry('alpha', 30))).not.toThrow();
  });

  it('work created mid-instant joins the same set under its static key', () => {
    const clock = new RecordingClock(0);
    const scheduler = createDueWorkScheduler<string>(clock);
    scheduler.schedule(entry('alpha', 100));
    scheduler.schedule(entry('beta', 100));
    let gammaScheduled = false;
    const executed: string[] = [];
    scheduler.runAll((current) => {
      if (current.work === 'alpha' && !gammaScheduled) {
        gammaScheduled = true;
        scheduler.schedule(entry('gamma', 100));
      }
      executed.push(current.work);
    });
    expect(executed).toEqual(['alpha', 'beta', 'gamma']);

    const clock2 = new RecordingClock(0);
    const scheduler2 = createDueWorkScheduler<string>(clock2);
    for (const id of ['alpha', 'beta', 'gamma']) {
      scheduler2.schedule(entry(id, 100));
    }
    expect(executedIds(scheduler2.runAll((current) => current.work))).toEqual(['alpha', 'beta', 'gamma']);
  });
});

describe('DueWorkScheduler single pending set, adversary mid-instant (amendment B2 sentence 6)', () => {
  it('A(100) creates C(200) at T; C immediately competes with pending B(300) in static key order', () => {
    const clock = new RecordingClock(0);
    const scheduler = createDueWorkScheduler<string>(clock);
    scheduler.schedule(entry('100', 1440, WorkClassRank.world));
    scheduler.schedule(entry('300', 1440, WorkClassRank.world));

    const executed: string[] = [];
    let cInserted = false;
    const first = scheduler.runNext((current) => {
      executed.push(current.work);
      if (current.work === '100' && !cInserted) {
        cInserted = true;
        scheduler.schedule(entry('200', 1440, WorkClassRank.world));
        expect(scheduler.nextDueTime()).toEqual(simTime(1440));
      }
    });

    expect(first?.work).toBe('100');
    expect(executed).toEqual(['100']);
    expect(scheduler.pendingCount()).toBe(2);

    const rest = scheduler.runAll((current) => {
      executed.push(current.work);
    });
    expect(rest.map((current) => current.work)).toEqual(['200', '300']);
    expect(executed).toEqual(['100', '200', '300']);
  });

  it('consequence-creation at T is term-by-term identical to a pre-scheduled T sibling', () => {
    const adversarial = (): readonly string[] => {
      const clock = new RecordingClock(0);
      const scheduler = createDueWorkScheduler<string>(clock);
      scheduler.schedule(entry('100', 1440));
      scheduler.schedule(entry('300', 1440));
      const done: string[] = [];
      scheduler.runAll((current) => {
        if (current.work === '100') {
          scheduler.schedule(entry('200', 1440));
        }
        done.push(current.work);
      });
      return done;
    };
    const prescheduled = (): readonly string[] => {
      const clock = new RecordingClock(0);
      const scheduler = createDueWorkScheduler<string>(clock);
      for (const id of ['100', '200', '300']) {
        scheduler.schedule(entry(id, 1440));
      }
      return scheduler.runAll((current) => current.work).map((current) => current.work);
    };
    const once = adversarial();
    const twice = adversarial();
    expect(once).toEqual(['100', '200', '300']);
    expect(twice).toEqual(once);
    expect(prescheduled()).toEqual(once);
  });
});

describe('workIdentifier order is a language-neutral total order (amendment B2 sentences 1, 11)', () => {
  it('ordered by the same scalar code points in every language, not by JS code units', () => {
    const astral = '\u{10000}';
    const bmpTail = '\uFFFD';
    expect(astral.length).toBe(2);
    expect(compareWorkIdentifiers(workIdentifier(bmpTail), workIdentifier(astral))).toBe(-1);
    expect(compareWorkIdentifiers(workIdentifier(astral), workIdentifier(bmpTail))).toBe(1);
    expect(astral < bmpTail).toBe(true);
  });

  it('is locale-free: pure code-point comparison, never collation or casing order', () => {
    expect(compareWorkIdentifiers(workIdentifier('B'), workIdentifier('a'))).toBe(-1);
    expect(compareWorkIdentifiers(workIdentifier('a'), workIdentifier('B'))).toBe(1);
    expect(compareWorkIdentifiers(workIdentifier('ä'), workIdentifier('z'))).toBe(1);
    expect(compareWorkIdentifiers(workIdentifier('z'), workIdentifier('ä'))).toBe(-1);
  });

  it('equals ASCII byte order for domain identifiers, and is prefix-consistent', () => {
    for (const [left, right, expected] of [
      ['100', '200', -1],
      ['200', '300', -1],
      ['image-12', 'image-9', -1],
      ['a', 'aa', -1],
      ['alpha', 'alpha', 0],
      ['alpha', 'alpha-1', -1],
      ['battle-echo', 'battle-handoff', -1],
    ] as const) {
      expect(compareWorkIdentifiers(workIdentifier(left), workIdentifier(right))).toBe(expected);
    }
  });

  it('is antisymmetric, transitive and stable across repeated calls', () => {
    const samples = ['100', '300', '200', 'alpha', 'a', 'aa', 'battle-echo', '\uFFFD', '\u{10000}'];
    const identifiers = samples.map((sample) => workIdentifier(sample));
    for (const left of identifiers) {
      for (const right of identifiers) {
        expect(compareWorkIdentifiers(left, left)).toBe(0);
        expect(compareWorkIdentifiers(left, right) + compareWorkIdentifiers(right, left)).toBe(0);
        const first = compareWorkIdentifiers(left, right);
        const second = compareWorkIdentifiers(left, right);
        expect(second).toBe(first);
      }
    }
  });
});

describe('DueWorkScheduler holds while the clock is paused or frozen (decision 7, A10)', () => {
  it('paused: nothing is processed, nothing is cancelled, nothing rewinds', () => {
    const clock = new RecordingClock(0);
    const scheduler = createDueWorkScheduler<string>(clock);
    scheduler.schedule(entry('held', 100));
    clock.pause();
    expect(scheduler.runAll((current) => current.work)).toEqual([]);
    expect(scheduler.pendingCount()).toBe(1);
    expect(simTimeScalar(clock.now())).toBe(0);
    expect(clock.advancedTo()).toEqual([]);
    clock.resume();
    expect(executedIds(scheduler.runAll((current) => current.work))).toEqual(['held']);
    expect(clock.advancedTo()).toEqual([100]);
  });

  it('frozen: the instant is processed, later work is held and time is not consumed', () => {
    const clock = new RecordingClock(1440);
    const scheduler = createDueWorkScheduler<string>(clock);
    scheduler.schedule(entry('echo', 2000, WorkClassRank.world));
    scheduler.schedule(entry('apply', 1440, WorkClassRank.battleResult));
    scheduler.schedule(entry('month-02', 1440, WorkClassRank.world));
    clock.freeze();
    expect(executedIds(scheduler.runAll((current) => current.work))).toEqual(['apply', 'month-02']);
    expect(simTimeScalar(clock.now())).toBe(1440);
    expect(clock.isFrozen()).toBe(true);
    expect(scheduler.pendingCount()).toBe(1);
    clock.unfreeze();
    expect(executedIds(scheduler.runAll((current) => current.work))).toEqual(['echo']);
    expect(clock.advancedTo()).toEqual([1440, 1440, 2000]);
  });

  it('runNext reports nothing when empty or held', () => {
    const clock = new RecordingClock(0);
    const scheduler = createDueWorkScheduler<string>(clock);
    expect(scheduler.runNext((current) => current.work)).toBeUndefined();
    scheduler.schedule(entry('alpha', 100));
    expect(scheduler.nextDueTime()).toEqual(simTime(100));
    clock.pause();
    expect(scheduler.runNext((current) => current.work)).toBeUndefined();
    clock.resume();
    expect(scheduler.runNext((current) => current.work)).toEqual(expect.objectContaining({ dueSimTime: simTime(100) }));
  });
});