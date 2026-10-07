/**
 * ScenarioCalendar (ADR-0003 A3; N-29).
 *
 * The historical calendar is **authoritative scenario data**, not a
 * presentation cache and not a rebuildable projection. Dates are derived
 * mechanically as a pure function of the SimTime scalar plus this immutable
 * data, so conversion is total and deterministic.
 *
 * N-29 fixed the calibration as a `ScenarioCalendar` property: one SimTime
 * unit is one simulated hour and `unitsPerDay` lives on the calendar value
 * (fixtures author `24`). The calendar is authored naturally in epoch, era,
 * year numbering direction, month sequence and month lengths in days; the
 * conversion uses **exact integer arithmetic** and keeps month boundaries on
 * day boundaries (ADR-0003 amendment B1).
 *
 * The SimTime scalar always increases forward; a descending (BCE-style) era
 * displays decreasing year numbers while the timeline itself never reverses
 * (ADR-0003 A2, A3).
 *
 * The calendar **snapshots its configuration at construction**: every
 * caller-controlled value is captured exactly once before any validation or
 * state construction, it owns every value it converts with, and exposes only
 * frozen metadata, so later mutation (or hostile accessor behavior) of the
 * caller's config cannot change a calendar once created. Arithmetic is
 * performed in BigInt so division, accumulation and modulo are exact for any
 * safe-integer SimTime; results that would leave the exact safe-integer range
 * are **rejected with an explicit error, never silently rounded**.
 *
 * No JavaScript `Date` and no Gregorian-only assumption are invented.
 */
import type { SimTime } from '../time/sim-time.js';
import { simTimeScalar } from '../time/sim-time.js';
import type { ScenarioCalendar as ScenarioCalendarTimeSeam } from '../time/time-seams.js';

export type YearNumberDirection = 'ascending' | 'descending';

export interface CalendarMonth<MonthId extends string> {
  readonly id: MonthId;
  readonly days: number;
}

export interface CalendarEra<MonthId extends string> {
  readonly name: string;
  readonly yearNumberDirection: YearNumberDirection;
  /** Year number of the era's first year. */
  readonly firstYearNumber: number;
  /** Absolute day label of the first day of the era's first year. */
  readonly firstYearStartDayNumber: number;
  readonly monthSequence: readonly CalendarMonth<MonthId>[];
}

export interface ScenarioCalendarConfig<MonthId extends string> {
  /** Simulation units per calendar day; the N-29 calibration. */
  readonly unitsPerDay: number;
  /** Instant at which the epoch day begins. */
  readonly epochSimTime: SimTime;
  /** Absolute day label of that instant. */
  readonly epochDayNumber: number;
  readonly era: CalendarEra<MonthId>;
}

export interface CalendarDate<MonthId extends string> {
  readonly era: string;
  readonly yearNumber: number;
  readonly monthId: MonthId;
  /** Zero-based index of the month within the era's year. */
  readonly monthIndex: number;
  /** One-based day within the month. */
  readonly dayOfMonth: number;
}

export interface ScenarioCalendar<MonthId extends string>
  extends ScenarioCalendarTimeSeam<CalendarDate<MonthId>> {
  readonly unitsPerDay: number;
  readonly monthLengthsInDays: readonly number[];
  readonly yearLengthInDays: number;
  /** Absolute day label of the day containing the given SimTime. */
  dayNumberFor(value: SimTime): number;
}

const maxSafeInteger = BigInt(Number.MAX_SAFE_INTEGER);
const minSafeInteger = BigInt(Number.MIN_SAFE_INTEGER);

function requireSafeInteger(value: number, what: string): void {
  if (!Number.isSafeInteger(value)) {
    throw new RangeError(`${what} must be a safe integer, received ${value}.`);
  }
}

function requirePositiveSafeInteger(value: number, what: string): void {
  requireSafeInteger(value, what);
  if (value <= 0) {
    throw new RangeError(`${what} must be positive, received ${value}.`);
  }
}

function requireNonEmptyText(value: string, what: string): void {
  if (value.length === 0) {
    throw new RangeError(`${what} must not be empty.`);
  }
}

/** Exact floor division for a positive divisor (BigInt; no rounding drift). */
function floorDivBig(dividend: bigint, divisor: bigint): bigint {
  const quotient = dividend / divisor;
  const remainder = dividend % divisor;
  return remainder < 0n ? quotient - 1n : quotient;
}

/** Exact non-negative remainder modulo a positive divisor (BigInt). */
function positiveModuloBig(dividend: bigint, divisor: bigint): bigint {
  const remainder = dividend % divisor;
  return remainder < 0n ? remainder + divisor : remainder;
}

/**
 * Convert an exact BigInt result back to a number, rejecting values outside
 * the exact safe-integer range instead of silently rounding.
 */
function asSafeNumber(value: bigint, what: string): number {
  if (value < minSafeInteger || value > maxSafeInteger) {
    throw new RangeError(
      `${what} ${value.toString()} is outside the exact safe-integer output range: rejected rather than silently rounded.`,
    );
  }
  return Number(value);
}

export function createScenarioCalendar<const MonthId extends string>(
  config: ScenarioCalendarConfig<MonthId>,
): ScenarioCalendar<MonthId> {
  // Capture every caller-controlled configuration value exactly once before
  // any validation or state construction: the scheduler never validates one
  // read and stores another, because an accessor could return a different
  // value on every read.
  const era = config.era;
  const unitsPerDay = config.unitsPerDay;
  const epochScalar = simTimeScalar(config.epochSimTime);
  const epochDayNumber = config.epochDayNumber;
  const eraName = era.name;
  const yearNumberDirection = era.yearNumberDirection;
  const firstYearNumber = era.firstYearNumber;
  const firstYearStartDayNumber = era.firstYearStartDayNumber;
  const monthSource = era.monthSequence;
  if (!Array.isArray(monthSource)) {
    throw new RangeError('A scenario calendar era month sequence must be an array.');
  }
  const capturedSource = monthSource as readonly CalendarMonth<MonthId>[];
  // Establish the owned snapshot with an explicit indexed loop, never a
  // caller-supplied iteration method: the caller can override `.map`, and a
  // caller month field can be an accessor that changes per read. The snapshot
  // is built from a single read of `length`, a single read of each indexed
  // month reference, and a single read of each required month field.
  const sequenceLength = capturedSource.length;
  const months: CalendarMonth<MonthId>[] = [];
  for (let index = 0; index < sequenceLength; index += 1) {
    const month = capturedSource[index];
    if (month === undefined) {
      throw new RangeError('A scenario calendar era month sequence must not contain holes.');
    }
    months.push({ id: month.id, days: month.days });
  }

  // Validate only the captured values.
  requirePositiveSafeInteger(unitsPerDay, 'unitsPerDay');
  requireSafeInteger(epochScalar, 'epoch SimTime scalar');
  requireSafeInteger(epochDayNumber, 'epoch day number');
  requireNonEmptyText(eraName, 'era name');
  requireSafeInteger(firstYearNumber, 'era first year number');
  requireSafeInteger(firstYearStartDayNumber, 'era first year start day number');
  if (months.length === 0) {
    throw new RangeError('A scenario calendar era must define at least one month.');
  }
  const monthIds = new Set<string>();
  for (const month of months) {
    requireNonEmptyText(month.id, 'month id');
    requirePositiveSafeInteger(month.days, `month days for '${month.id}'`);
    if (monthIds.has(month.id)) {
      throw new RangeError(`A scenario calendar month id '${month.id}' is declared more than once.`);
    }
    monthIds.add(month.id);
  }

  // Owned immutable-plain snapshots; nothing below reads the caller config again.
  const unitsPerDayBig = BigInt(unitsPerDay);
  const epochScalarBig = BigInt(epochScalar);
  const epochDayNumberBig = BigInt(epochDayNumber);
  const firstYearStartDayNumberBig = BigInt(firstYearStartDayNumber);
  const monthSequence: readonly CalendarMonth<MonthId>[] = months;
  const monthLengthsInDays = months.map((month) => month.days);
  const yearLengthInDaysBig = months.reduce((total, month) => total + BigInt(month.days), 0n);
  const yearLengthInDays = asSafeNumber(yearLengthInDaysBig, 'era year length in days');
  const directionMultiplier = yearNumberDirection === 'ascending' ? 1n : -1n;

  function rawDayNumberBig(scalar: number): bigint {
    const elapsedUnits = BigInt(scalar) - epochScalarBig;
    const elapsedDays = floorDivBig(elapsedUnits, unitsPerDayBig);
    return epochDayNumberBig + elapsedDays;
  }

  function dayNumberFor(value: SimTime): number {
    const scalar = simTimeScalar(value);
    requireSafeInteger(scalar, 'SimTime scalar');
    return asSafeNumber(rawDayNumberBig(scalar), 'day number');
  }

  function toCalendarDate(value: SimTime): CalendarDate<MonthId> {
    const scalar = simTimeScalar(value);
    requireSafeInteger(scalar, 'SimTime scalar');
    const localDay = rawDayNumberBig(scalar) - firstYearStartDayNumberBig;
    const yearSequence = floorDivBig(localDay, yearLengthInDaysBig);
    const dayInYear = positiveModuloBig(localDay, yearLengthInDaysBig);

    let remaining = dayInYear;
    let monthIndex = 0;
    for (const [index, month] of monthSequence.entries()) {
      const days = BigInt(month.days);
      if (remaining < days) {
        monthIndex = index;
        break;
      }
      remaining -= days;
    }
    const selectedMonth = monthSequence[monthIndex];
    if (selectedMonth === undefined) {
      throw new Error('A scenario calendar could not resolve a month for the given instant.');
    }
    const yearNumber = asSafeNumber(
      BigInt(firstYearNumber) + directionMultiplier * yearSequence,
      'era year number',
    );
    return {
      era: eraName,
      yearNumber,
      monthIndex,
      monthId: selectedMonth.id,
      dayOfMonth: asSafeNumber(remaining + 1n, 'day of month'),
    };
  }

  return Object.freeze({
    unitsPerDay,
    monthLengthsInDays: Object.freeze(monthLengthsInDays),
    yearLengthInDays,
    dayNumberFor,
    toCalendarDate,
  });
}