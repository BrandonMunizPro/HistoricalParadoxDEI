/**
 * SimTime: the absolute simulation timeline (ADR-0003 A1, A2 - approved).
 *
 * SimTime represents **elapsed simulation time and nothing else**. The
 * defining property (A1):
 *
 * > The difference between SimTime A and SimTime B represents the elapsed
 * > simulation duration between them.
 *
 * SimTime must never represent a number of events processed, scheduler
 * sequence, fidelity or work density, presentation frames, or any counter -
 * the intra-month ordinal interpretation is a recorded rejection (A1), and
 * `Duration` being a distinct type is how that rejection is enforced here.
 *
 * Representation (A2): absolute, monotonic, fixed-point. Fixed-point arithmetic
 * is exact and reproducible: values are safe integers, so no floating-point
 * drift can enter history. The concrete **scale is deliberately absent** -
 * no ticks-per-unit constant, no conversion constant, no unit vocabulary
 * exists in this module. Choosing the scale is N-29 and belongs to E1
 * (ADR-0003 A3, A14).
 *
 * Monotonicity (A2): the timeline never decreases. `advance` refuses to move a
 * SimTime backwards, which makes rewind structurally impossible at the value
 * level; E1's scheduler additionally rejects work requested into the past
 * (ADR-0003 A13).
 */

declare const simTimeBrand: unique symbol;

/**
 * An absolute point on the simulation timeline, as a fixed-point value in the
 * (not yet chosen) simulation scale. Not an ordinal, not a sequence number.
 */
export type SimTime = number & { readonly [simTimeBrand]: 'SimTime' };

declare const durationBrand: unique symbol;

/**
 * An elapsed duration in the simulation timeline's own unit. Produced only by
 * differencing two SimTime values (A1): a difference between SimTimes is a
 * Duration, never a SimTime and never a bare count.
 */
export type Duration = number & { readonly [durationBrand]: 'Duration' };

function assertFixedPointValue(value: number, what: string): void {
  if (!Number.isSafeInteger(value)) {
    throw new RangeError(
      `${what} must be a safe integer fixed-point value, received ${value}.`,
    );
  }
}

/**
 * Construct a SimTime from its raw fixed-point value.
 *
 * The value carries no unit, no scale and no calendar meaning; those arrive
 * only when N-29 (E1) fixes the scale and supplies calendar conversion
 * (ADR-0003 A3). Integer input preserves the exact, reproducible arithmetic
 * A2 requires.
 */
export function simTime(rawValue: number): SimTime {
  assertFixedPointValue(rawValue, 'SimTime');
  return rawValue as SimTime;
}

/**
 * Construct a Duration from its raw fixed-point value, in the timeline's own
 * unit. Positive values are forward elapsed time; negative values are used
 * only to describe a difference direction, never to move the clock.
 */
export function duration(rawValue: number): Duration {
  assertFixedPointValue(rawValue, 'Duration');
  return rawValue as Duration;
}

/**
 * The raw fixed-point scalar of a SimTime. This is the seam for E1's calendar
 * conversion (ADR-0003 A3: dates are a pure function of the SimTime scalar and
 * authoritative scenario calendar data) and for persistence. The scalar has no
 * meaning until N-29 fixes the scale.
 */
export function simTimeScalar(value: SimTime): number {
  return value;
}

/** The raw fixed-point scalar of a Duration, in the timeline's own unit. */
export function durationScalar(value: Duration): number {
  return value;
}

/**
 * The elapsed duration between two SimTime values: `left - right`, signed
 * (A1). Differencing never moves any clock; scheduling consequences are
 * separate (ADR-0003 A13).
 *
 * The result is validated so exactness (A2) cannot silently degrade past the
 * safe-integer range.
 */
export function difference(left: SimTime, right: SimTime): Duration {
  const elapsed = left - right;
  assertFixedPointValue(elapsed, 'SimTime difference');
  return elapsed as Duration;
}

/**
 * Move a SimTime forward by an elapsed duration: `value + elapsed`.
 *
 * Refuses negative durations, so this function can never rewind the timeline
 * (monotonicity, A2). Also refuses any result that would leave the exact
 * fixed-point range.
 */
export function advance(value: SimTime, elapsed: Duration): SimTime {
  if (elapsed < 0) {
    throw new RangeError(
      'SimTime advance refuses a negative duration: the simulation timeline never moves backwards (ADR-0003 A2).',
    );
  }
  const next = value + elapsed;
  assertFixedPointValue(next, 'Advanced SimTime');
  return next as SimTime;
}

/** Total order over the timeline: -1, 0 or 1. Pure comparison; moves nothing. */
export function compare(left: SimTime, right: SimTime): -1 | 0 | 1 {
  if (left < right) return -1;
  if (left > right) return 1;
  return 0;
}
