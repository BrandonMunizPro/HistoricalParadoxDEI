/**
 * Stable SimTime serialization (ADR-0003 amendment B1, N-29).
 *
 * The canonical cross-language representation of a SimTime is an **exact
 * decimal integer string of the scalar** — no floating point, no Unix epoch,
 * no JavaScript `Date`, no wall clock (N-29).
 *
 * The scalar itself carries **no calendar semantics and no scale**: those are
 * metadata that a serialization *boundary* must associate explicitly with the
 * surrounding representation (see `serializeSimTimeWithContext`). Nothing in
 * this module embeds calendar meaning into a SimTime.
 *
 * Parsing validates exactness: only canonical decimal integers within the
 * safe fixed-point range round-trip, so a boundary can never silently
 * reintroduce precision loss (ADR-0003 A2).
 */
import type { SimTime } from './sim-time.js';
import { simTime, simTimeScalar } from './sim-time.js';

/**
 * A serialized SimTime plus the explicit surrounding metadata a boundary
 * must carry (scale, scenario calendar identity, era policy). The metadata
 * stays associated with the representation; it is never folded into the
 * scalar.
 */
export interface SerializedSimTime<TMetadata> {
  readonly scalar: string;
  readonly metadata: TMetadata;
}

/** Exact decimal integer string of the SimTime scalar. */
export function simTimeToStableString(value: SimTime): string {
  return String(simTimeScalar(value));
}

/**
 * Parse a stable string back to a SimTime. Rejects anything that is not a
 * canonical decimal integer inside the exact fixed-point range, so
 * round-tripping is lossless in both directions.
 */
export function parseSimTimeStableString(text: string): SimTime {
  if (!/^-?\d+$/.test(text)) {
    throw new RangeError(
      'A serialized SimTime must be a canonical decimal integer string (ADR-0003 amendment B1).',
    );
  }
  const parsed = simTime(Number(text));
  if (simTimeToStableString(parsed) !== text) {
    throw new RangeError(
      'A serialized SimTime must round-trip exactly: leading zeros, sign-only forms and precision loss are rejected (ADR-0003 amendment B1).',
    );
  }
  return parsed;
}

/** Pair a SimTime with the metadata its serialization boundary carries. */
export function serializeSimTimeWithContext<TMetadata>(
  value: SimTime,
  metadata: TMetadata,
): SerializedSimTime<TMetadata> {
  return { scalar: simTimeToStableString(value), metadata };
}

/** Recover the SimTime from a contextual representation; metadata passes through. */
export function parseSimTimeWithContext<TMetadata>(
  serialized: SerializedSimTime<TMetadata>,
): SimTime {
  return parseSimTimeStableString(serialized.scalar);
}
