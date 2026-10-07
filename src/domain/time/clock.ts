/**
 * Clock (ADR-0003 decision 7, A2, A10).
 *
 * The authoritative campaign clock. It owns the current SimTime and is
 * strictly monotonic: it never moves backwards, and neither pause nor freeze
 * can produce a value that could rewind it (ADR-0003 A2).
 *
 * - **Pause** holds campaign progression while the player manages
 *   interfaces. State is a boolean plus the current instant; nothing else is
 *   stored, so resuming continues from the same SimTime (decision 7).
 * - **Freeze** holds the clock at the current instant across an interactive
 *   tactical handoff. Work due at that exact instant still executes (that is
 *   how the encounter result and remaining work at the instant resolve),
 *   while progression past the instant is refused until `unfreeze` (A10).
 *
 * Real-world battle duration therefore consumes zero campaign SimTime: only
 * the stored instant matters, and it never changes during a freeze.
 * Background battles never freeze this clock (A11); no such path exists here.
 *
 * No wall clock, no timers, no ambient time: everything is deterministic
 * simulated state (ADR-0008).
 */
import type { SimTime } from './sim-time.js';
import { compare } from './sim-time.js';

export interface Clock {
  /** Current authoritative instant. */
  now(): SimTime;
  /** Move forward to `to`; equal is a no-op; earlier is rejected. */
  advance(to: SimTime): SimTime;
  /** Hold progression; stores nothing that could rewind the clock. */
  pause(): void;
  /** Release a pause; the clock continues from the same instant. */
  resume(): void;
  isPaused(): boolean;
  /** Hold the clock at the current instant (interactive handoff). */
  freeze(): void;
  /** Release a freeze; progression past the instant resumes. */
  unfreeze(): void;
  isFrozen(): boolean;
}

export function createClock(initial: SimTime): Clock {
  let current = initial;
  let paused = false;
  let frozen = false;

  function advance(to: SimTime): SimTime {
    const order = compare(to, current);
    if (order < 0) {
      throw new RangeError(
        'The clock never moves backwards: SimTime is absolute and monotonic (ADR-0003 A2).',
      );
    }
    if (order > 0 && paused) {
      throw new RangeError(
        'Cannot advance a paused clock: pause holds progression and stores nothing that could rewind it (ADR-0003 decision 7).',
      );
    }
    if (order > 0 && frozen) {
      throw new RangeError(
        'Cannot advance past a frozen instant: the clock holds at a fixed SimTime across a tactical handoff (ADR-0003 A10).',
      );
    }
    current = to;
    return current;
  }

  return {
    now: (): SimTime => current,
    advance,
    pause: (): void => {
      paused = true;
    },
    resume: (): void => {
      paused = false;
    },
    isPaused: (): boolean => paused,
    freeze: (): void => {
      frozen = true;
    },
    unfreeze: (): void => {
      frozen = false;
    },
    isFrozen: (): boolean => frozen,
  };
}
