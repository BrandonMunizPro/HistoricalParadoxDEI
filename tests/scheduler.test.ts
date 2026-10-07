import { describe, expect, it } from 'vitest';
import type { Clock, ScheduledWork, SimTime, WorkIdentifier } from '../src/domain/time/index.js';
import {
  compareWorkIdentifiers,
  createDueWorkScheduler,
  PastDueSchedulingError,
  requireWellFormedIdentifier,
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

  it('frozen: every due entry is held regardless of class until the clock unfreezes', () => {
    const clock = new RecordingClock(1440);
    const scheduler = createDueWorkScheduler<string>(clock);
    scheduler.schedule(entry('echo', 2000, WorkClassRank.world));
    scheduler.schedule(entry('apply', 1440, WorkClassRank.battleResult));
    scheduler.schedule(entry('month-02', 1440, WorkClassRank.world));
    clock.freeze();
    expect(executedIds(scheduler.runAll((current) => current.work))).toEqual([]);
    expect(simTimeScalar(clock.now())).toBe(1440);
    expect(clock.isFrozen()).toBe(true);
    expect(scheduler.pendingCount()).toBe(3);
    clock.unfreeze();
    expect(executedIds(scheduler.runAll((current) => current.work))).toEqual(['apply', 'month-02', 'echo']);
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

describe('DueWorkScheduler frozen holding semantics (orchestration-driven, amendment B2)', () => {
  it('holds every due entry at the frozen instant, then orchestration unfreeze lets the comparator proceed in rank order', () => {
    const clock = new RecordingClock(1440);
    const scheduler = createDueWorkScheduler<string>(clock);
    scheduler.schedule(entry('campaign', 1440, WorkClassRank.world));
    scheduler.schedule(entry('month-02', 1440, WorkClassRank.world));
    clock.freeze();

    expect(executedIds(scheduler.runAll((current) => current.work))).toEqual([]);
    expect(scheduler.pendingCount()).toBe(2);
    expect(simTimeScalar(clock.now())).toBe(1440);
    expect(clock.advancedTo()).toEqual([]);

    scheduler.schedule(entry('battle-result-apply', 1440, WorkClassRank.battleResult));
    expect(scheduler.runNext((current) => current.work)).toBeUndefined();
    expect(scheduler.pendingCount()).toBe(3);

    clock.unfreeze();
    let state = 'pending';
    const executed: string[] = [];
    const rest = scheduler.runAll((current) => {
      if (current.work === 'battle-result-apply') state = 'post-battle';
      executed.push(current.work);
    });
    expect(executed).toEqual(['battle-result-apply', 'campaign', 'month-02']);
    expect(rest.map((current) => current.work)).toEqual(['battle-result-apply', 'campaign', 'month-02']);
    expect(state).toBe('post-battle');
    expect(scheduler.pendingCount()).toBe(0);
    expect(clock.advancedTo()).toEqual([1440, 1440, 1440]);
  });

  it('entries sharing a rank receive no magical execution permission while frozen', () => {
    const clock = new RecordingClock(1440);
    const scheduler = createDueWorkScheduler<string>(clock);
    scheduler.schedule(entry('result-a', 1440, WorkClassRank.battleResult));
    scheduler.schedule(entry('result-b', 1440, WorkClassRank.battleResult));
    scheduler.schedule(entry('result-c', 1440, WorkClassRank.battleResult));
    clock.freeze();
    expect(scheduler.runNext((current) => current.work)).toBeUndefined();
    expect(scheduler.pendingCount()).toBe(3);
    expect(clock.advancedTo()).toEqual([]);
    clock.unfreeze();
    expect(executedIds(scheduler.runAll((current) => current.work))).toEqual([
      'result-a',
      'result-b',
      'result-c',
    ]);
    expect(clock.advancedTo()).toEqual([1440, 1440, 1440]);
  });
});

describe('DueWorkScheduler snapshots the scheduling envelope (amendment B2/N-30)', () => {
  it('caller mutation of a scheduled entry cannot reorder the pending set', () => {
    const clock = new RecordingClock(0);
    const scheduler = createDueWorkScheduler<string>(clock);
    const alpha = entry('alpha', 300);
    const beta = entry('beta', 200);
    scheduler.schedule(alpha);
    scheduler.schedule(beta);
    const mutateAlpha = alpha as { dueSimTime: SimTime; workIdentifier: WorkIdentifier };
    mutateAlpha.dueSimTime = simTime(1000);
    mutateAlpha.workIdentifier = workIdentifier('rewritten');
    const mutateBeta = beta as { classRank: WorkClassRank };
    mutateBeta.classRank = WorkClassRank.battleResult;
    expect(executedIds(scheduler.runAll((current) => current.work))).toEqual(['beta', 'alpha']);
    expect(clock.advancedTo()).toEqual([200, 300]);
  });

  it('the object returned from schedule is an owned snapshot, not a live heap reference', () => {
    const clock = new RecordingClock(0);
    const scheduler = createDueWorkScheduler<string>(clock);
    const expectedBeta = scheduler.schedule(entry('beta', 200));
    const returned = scheduler.schedule(entry('alpha', 100));
    const mutate = returned as { dueSimTime: SimTime };
    mutate.dueSimTime = simTime(999);
    expect(executedIds(scheduler.runAll((current) => current.work))).toEqual(['alpha', 'beta']);
    expect(clock.advancedTo()).toEqual([100, 200]);
    expect(expectedBeta.work).toBe('beta');
  });

  it('keeps the duplicate reservation keyed to the schedule-time identifier', () => {
    const clock = new RecordingClock(0);
    const scheduler = createDueWorkScheduler<string>(clock);
    const alpha = entry('alpha', 100);
    scheduler.schedule(alpha);
    const mutate = alpha as { workIdentifier: WorkIdentifier };
    mutate.workIdentifier = workIdentifier('rewritten');
    expect(() => scheduler.schedule(entry('alpha', 200))).toThrow(RangeError);
    expect(() => scheduler.schedule(entry('rewritten', 200))).not.toThrow();
    expect(scheduler.pendingCount()).toBe(2);
  });

  it('callbacks receive an immutable frozen view, never the private envelope, and runNext returns the original keys', () => {
    const clock = new RecordingClock(0);
    const scheduler = createDueWorkScheduler<string>(clock);
    scheduler.schedule(entry('alpha', 100, WorkClassRank.world));
    scheduler.schedule(entry('beta', 200, WorkClassRank.world));
    let seenPendingCountDuringCallback = 0;
    const returned = scheduler.runNext((current) => {
      seenPendingCountDuringCallback = scheduler.pendingCount();
      const rewrite = current as unknown as {
        dueSimTime: SimTime;
        classRank: WorkClassRank;
        workIdentifier: WorkIdentifier;
      };
      expect(() => {
        rewrite.dueSimTime = simTime(999);
      }).toThrow(TypeError);
      expect(() => {
        rewrite.classRank = 1;
      }).toThrow(TypeError);
      expect(() => {
        rewrite.workIdentifier = workIdentifier('rewritten');
      }).toThrow(TypeError);
      expect(() => {
        (current as { work: string }).work = 'mutated-payload';
      }).toThrow(TypeError);
      return 'callback-result';
    });
    expect(returned).toEqual(
      expect.objectContaining({ dueSimTime: simTime(100), classRank: WorkClassRank.world }),
    );
    expect(returned?.workIdentifier).toBe(workIdentifier('alpha'));
    expect(returned?.work).toBe('alpha');
    expect(seenPendingCountDuringCallback).toBe(1);
    expect(clock.advancedTo()).toEqual([100]);
    const next = scheduler.runNext((view) => view.work);
    expect(next?.work).toBe('beta');
    expect(clock.advancedTo()).toEqual([100, 200]);
  });
});

describe('DueWorkScheduler captures each caller-controlled value exactly once (amendment B2)', () => {
  it('reads dueSimTime, classRank, workIdentifier and work exactly once on schedule', () => {
    const clock = new RecordingClock(0);
    const scheduler = createDueWorkScheduler<string>(clock);
    const reads = { dueSimTime: 0, classRank: 0, workIdentifier: 0, work: 0 };
    let dueIndex = 0;
    let idIndex = 0;
    const accessor: unknown = {
      get dueSimTime() {
        dueIndex += 1;
        reads.dueSimTime += 1;
        return simTime(dueIndex === 1 ? 300 : 900);
      },
      get classRank() {
        reads.classRank += 1;
        return WorkClassRank.world;
      },
      get workIdentifier() {
        idIndex += 1;
        reads.workIdentifier += 1;
        return workIdentifier(idIndex === 1 ? 'alpha' : 'rewritten');
      },
      get work() {
        reads.work += 1;
        return 'payload';
      },
    };
    const scheduled = scheduler.schedule(accessor as ScheduledWork<string>);
    expect(reads).toEqual({ dueSimTime: 1, classRank: 1, workIdentifier: 1, work: 1 });
    expect(scheduled.dueSimTime).toEqual(simTime(300));
    expect(scheduled.workIdentifier).toBe(workIdentifier('alpha'));
    expect(scheduled.work).toBe('payload');
    expect(scheduler.nextDueTime()).toEqual(simTime(300));
  });

  it('reserves the duplicate key against the first captured identifier, never a later re-read', () => {
    const clock = new RecordingClock(0);
    const scheduler = createDueWorkScheduler<string>(clock);
    scheduler.schedule(entry('alpha', 100));
    let idReads = 0;
    const hostile: unknown = {
      dueSimTime: simTime(200),
      classRank: WorkClassRank.world,
      work: 'x',
      get workIdentifier() {
        idReads += 1;
        return idReads === 1 ? workIdentifier('alpha') : workIdentifier('rewritten');
      },
    };
    expect(() => scheduler.schedule(hostile as ScheduledWork<string>)).toThrow(RangeError);
    expect(idReads).toBe(1);
    expect(scheduler.pendingCount()).toBe(1);
    expect(clock.advancedTo()).toEqual([]);
  });

  it('validates only the captured identifier value, never a re-read', () => {
    const clock = new RecordingClock(0);
    const scheduler = createDueWorkScheduler<string>(clock);
    let idReads = 0;
    const hostile: unknown = {
      dueSimTime: simTime(100),
      classRank: WorkClassRank.world,
      work: 'x',
      get workIdentifier() {
        idReads += 1;
        return idReads === 1 ? (Object('boxed-string') as unknown) : workIdentifier('later-fresh');
      },
    };
    expect(() => scheduler.schedule(hostile as ScheduledWork<string>)).toThrow(RangeError);
    expect(idReads).toBe(1);
    expect(scheduler.pendingCount()).toBe(0);
    expect(clock.advancedTo()).toEqual([]);
  });
});

describe('DueWorkScheduler dispatch is synchronous and non-reentrant (ADR-0008)', () => {
  it('rejects a nested dispatch from inside an execute callback', () => {
    const clock = new RecordingClock(0);
    const scheduler = createDueWorkScheduler<string>(clock);
    scheduler.schedule(entry('alpha', 100));
    scheduler.schedule(entry('beta', 200));
    let error: unknown;
    try {
      scheduler.runAll((current) => {
        if (current.work === 'alpha') {
          scheduler.runNext((nested) => nested.work);
        }
      });
    } catch (caught) {
      error = caught;
    }
    expect(error).toBeInstanceOf(RangeError);
    let resumed: ScheduledWork<string> | undefined;
    expect(() => {
      resumed = scheduler.runNext((current) => current.work);
    }).not.toThrow();
    expect(resumed?.work).toBe('beta');
  });

  it('permanently invalidates the scheduler when a callback returns an asynchronous thenable', () => {
    const clock = new RecordingClock(0);
    const scheduler = createDueWorkScheduler<string>(clock);
    scheduler.schedule(entry('alpha', 100));
    scheduler.schedule(entry('beta', 200));
    const asyncResult = (): unknown => Promise.resolve();
    let error: unknown;
    try {
      scheduler.runNext((current) => {
        void current;
        return asyncResult();
      });
    } catch (caught) {
      error = caught;
    }
    expect(error).toBeInstanceOf(RangeError);
    expect(scheduler.pendingCount()).toBe(1);
    expect(simTimeScalar(clock.now())).toBe(100);
    expect(clock.advancedTo()).toEqual([100]);
    for (const attempt of [
      () => scheduler.runNext((current) => current.work),
      () => scheduler.runAll((current) => current.work),
      () => scheduler.schedule(entry('gamma', 100)),
    ]) {
      expect(attempt).toThrow(RangeError);
    }
    expect(scheduler.pendingCount()).toBe(1);
    expect(clock.advancedTo()).toEqual([100]);
  });

  it('permanently invalidates the scheduler when thenability inspection itself throws', () => {
    const clock = new RecordingClock(0);
    const scheduler = createDueWorkScheduler<string>(clock);
    scheduler.schedule(entry('alpha', 100));
    const hostile: unknown = {};
    Object.defineProperty(hostile, 'then', {
      get() {
        throw new RangeError('then accessor exploded');
      },
    });
    expect(() => {
      scheduler.runNext((current) => {
        void current;
        return hostile;
      });
    }).toThrow(RangeError);
    expect(scheduler.pendingCount()).toBe(0);
    expect(clock.advancedTo()).toEqual([100]);
    expect(() => scheduler.runNext((current) => current.work)).toThrow(RangeError);
    expect(() => scheduler.runAll((current) => current.work)).toThrow(RangeError);
    expect(() => scheduler.schedule(entry('gamma', 100))).toThrow(RangeError);
    expect(scheduler.pendingCount()).toBe(0);
    expect(clock.advancedTo()).toEqual([100]);
  });

  it('permanently invalidates the scheduler when a callback returns a custom non-promise thenable', () => {
    const clock = new RecordingClock(0);
    const scheduler = createDueWorkScheduler<string>(clock);
    scheduler.schedule(entry('alpha', 100));
    const customThenable = { then: (): void => undefined };
    expect(() => {
      scheduler.runNext((current) => {
        void current;
        return customThenable;
      });
    }).toThrow(RangeError);
    expect(scheduler.pendingCount()).toBe(0);
    expect(clock.advancedTo()).toEqual([100]);
    expect(() => scheduler.runNext((current) => current.work)).toThrow(RangeError);
    expect(scheduler.pendingCount()).toBe(0);
    expect(clock.advancedTo()).toEqual([100]);
  });

  it('the reentrancy guard release never restores usability after invalidation', () => {
    const clock = new RecordingClock(0);
    const scheduler = createDueWorkScheduler<string>(clock);
    scheduler.schedule(entry('alpha', 100));
    expect(() => {
      scheduler.runNext((current) => {
        void current;
        return { then: (): void => undefined };
      });
    }).toThrow(RangeError);
    expect(() => scheduler.runAll((current) => current.work)).toThrow(RangeError);
    expect(() => scheduler.schedule(entry('beta', 200))).toThrow(RangeError);
    expect(() => scheduler.runNext((current) => current.work)).toThrow(RangeError);
    expect(scheduler.pendingCount()).toBe(0);
    expect(clock.advancedTo()).toEqual([100]);
  });
});

describe('DueWorkScheduler work class rank runtime validation (amendment B2, N-30, ADR-0008)', () => {
  it('rejects undeclared, negative, fractional, non-finite or NaN ranks before mutating any state', () => {
    const clock = new RecordingClock(0);
    const scheduler = createDueWorkScheduler<string>(clock);
    for (const bad of [
      2,
      -1,
      100,
      0.5,
      Number.NaN,
      Number.POSITIVE_INFINITY,
      Number.NEGATIVE_INFINITY,
    ]) {
      const forged: ScheduledWork<string> = {
        dueSimTime: simTime(100),
        classRank: bad,
        workIdentifier: workIdentifier(`rank-${String(bad)}`),
        work: 'x',
      };
      expect(() => scheduler.schedule(forged)).toThrow(RangeError);
    }
    expect(scheduler.pendingCount()).toBe(0);
    expect(clock.advancedTo()).toEqual([]);
    scheduler.schedule(entry('declared', 100, WorkClassRank.world));
    expect(scheduler.pendingCount()).toBe(1);
  });

  it('preserves the battleResult first precedence instead of widening the axis', () => {
    const clock = new RecordingClock(0);
    const scheduler = createDueWorkScheduler<string>(clock);
    scheduler.schedule(entry('a-world', 100, WorkClassRank.world));
    scheduler.schedule(entry('battle', 100, WorkClassRank.battleResult));
    expect(executedIds(scheduler.runAll((current) => current.work))).toEqual(['battle', 'a-world']);
  });
});

describe('WorkIdentifier rejects ill-formed Unicode (amendment B2, N-30)', () => {
  it('workIdentifier rejects lone and mispaired surrogate code units', () => {
    for (const bad of ['\uD800', '\uDFFF', '\uD83D', 'a\uD800b', '\uD83D\uD800', 'tail\uDFFF']) {
      expect(() => workIdentifier(bad)).toThrow(RangeError);
    }
  });

  it('accepts well-formed supplementary and precomposed/combining text', () => {
    expect(workIdentifier('\u{10000}')).toBe('\u{10000}');
    expect(requireWellFormedIdentifier(workIdentifier('a\u0301b'))).toBe('a\u0301b');
    expect(workIdentifier('\u{1F600}\u{10FFFF}').length).toBe(4);
  });

  it('schedule rejects a forged malformed identifier before mutating scheduler state', () => {
    const clock = new RecordingClock(0);
    const scheduler = createDueWorkScheduler<string>(clock);
    const forged = {
      dueSimTime: simTime(100),
      classRank: WorkClassRank.world,
      workIdentifier: 'lone-\uD800' as WorkIdentifier,
      work: 'x',
    };
    expect(() => scheduler.schedule(forged)).toThrow(RangeError);
    expect(scheduler.pendingCount()).toBe(0);
    expect(clock.advancedTo()).toEqual([]);
  });

  it('requireWellFormedIdentifier accepts unknown and rejects every non-primitive string representation', () => {
    const counterexamples: unknown[] = [
      '',
      7,
      Object('boxed'),
      {},
      { toString: (): string => 'forged' },
      { [Symbol.toPrimitive]: (): string => 'forged' },
      null,
      undefined,
      Symbol('alpha'),
      (): string => 'fn',
      ['alpha'],
      '\uD800',
      'tail\uDFFF',
    ];
    for (const bad of counterexamples) {
      expect(() => requireWellFormedIdentifier(bad), String(bad)).toThrow(RangeError);
    }
    expect(requireWellFormedIdentifier('alpha')).toBe('alpha');
    expect(requireWellFormedIdentifier(' ')).toBe(' ');
    expect(requireWellFormedIdentifier('\u{1F600}')).toBe('\u{1F600}');
  });

  it('a boxed string can never falsify a primitive duplicate reservation', () => {
    const clock = new RecordingClock(0);
    const scheduler = createDueWorkScheduler<string>(clock);
    scheduler.schedule(entry('alpha', 100));
    const boxed: unknown = Object('alpha');
    expect(typeof boxed).toBe('object');
    expect(() => scheduler.schedule(entry('alpha', 200))).toThrow(RangeError);
    const hostile = {
      dueSimTime: simTime(200),
      classRank: WorkClassRank.world,
      workIdentifier: boxed as WorkIdentifier,
      work: 'x',
    };
    expect(() => scheduler.schedule(hostile)).toThrow(RangeError);
    expect(scheduler.pendingCount()).toBe(1);
    expect(clock.advancedTo()).toEqual([]);
  });

  it('the comparator agrees with an independent UTF-8 byte-order oracle on supplementary text', () => {
    const samples = ['a', 'A', '\uFFFD', '\uFFFF', '\u{10000}', '\u{10400}', '\u{1D11E}', '\u{1F600}', '\u{10FFFF}'];
    const identifiers = samples.map((sample) => workIdentifier(sample));
    const encoder = new TextEncoder();
    const utf8Order = (left: string, right: string): number => {
      const leftBytes = encoder.encode(left);
      const rightBytes = encoder.encode(right);
      const shared = Math.min(leftBytes.length, rightBytes.length);
      for (let index = 0; index < shared; index += 1) {
        const leftByte = leftBytes[index] as number;
        const rightByte = rightBytes[index] as number;
        if (leftByte !== rightByte) return leftByte < rightByte ? -1 : 1;
      }
      if (leftBytes.length < rightBytes.length) return -1;
      if (leftBytes.length > rightBytes.length) return 1;
      return 0;
    };
    for (const left of identifiers) {
      for (const right of identifiers) {
        expect(compareWorkIdentifiers(left, right)).toBe(utf8Order(left, right));
      }
    }
  });
});