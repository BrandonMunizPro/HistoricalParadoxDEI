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

function positiveModulo(dividend: number, divisor: number): number {
  return ((dividend % divisor) + divisor) % divisor;
}

export function createScenarioCalendar<const MonthId extends string>(
  config: ScenarioCalendarConfig<MonthId>,
): ScenarioCalendar<MonthId> {
  requirePositiveSafeInteger(config.unitsPerDay, 'unitsPerDay');
  requireSafeInteger(config.epochDayNumber, 'epoch day number');
  requireNonEmptyText(config.era.name, 'era name');
  requireSafeInteger(config.era.firstYearNumber, 'era first year number');
  requireSafeInteger(
    config.era.firstYearStartDayNumber,
    'era first year start day number',
  );
  if (config.era.monthSequence.length === 0) {
    throw new RangeError('A scenario calendar era must define at least one month.');
  }
  const monthIds = new Set<string>();
  for (const month of config.era.monthSequence) {
    requireNonEmptyText(month.id, 'month id');
    requirePositiveSafeInteger(month.days, `month days for '${month.id}'`);
    if (monthIds.has(month.id)) {
      throw new RangeError(`A scenario calendar month id '${month.id}' is declared more than once.`);
    }
    monthIds.add(month.id);
  }

  const monthLengthsInDays = config.era.monthSequence.map((month) => month.days);
  const yearLengthInDays = monthLengthsInDays.reduce((total, days) => total + days, 0);
  const epochScalar = simTimeScalar(config.epochSimTime);

  function dayNumberFor(value: SimTime): number {
    const elapsedUnits = simTimeScalar(value) - epochScalar;
    const elapsedDays = Math.floor(elapsedUnits / config.unitsPerDay);
    return config.epochDayNumber + elapsedDays;
  }

  function toCalendarDate(value: SimTime): CalendarDate<MonthId> {
    const localDay = dayNumberFor(value) - config.era.firstYearStartDayNumber;
    const yearSequence = Math.floor(localDay / yearLengthInDays);
    const dayInYear = positiveModulo(localDay, yearLengthInDays);

    let remaining = dayInYear;
    let monthIndex = 0;
    for (const [index, month] of config.era.monthSequence.entries()) {
      if (remaining < month.days) {
        monthIndex = index;
        break;
      }
      remaining -= month.days;
    }
    const selectedMonth = config.era.monthSequence[monthIndex];
    if (selectedMonth === undefined) {
      throw new Error('A scenario calendar could not resolve a month for the given instant.');
    }
    const directionMultiplier = config.era.yearNumberDirection === 'ascending' ? 1 : -1;
    const yearNumber = config.era.firstYearNumber + directionMultiplier * yearSequence;
    return {
      era: config.era.name,
      yearNumber,
      monthIndex,
      monthId: selectedMonth.id,
      dayOfMonth: remaining + 1,
    };
  }

  return {
    unitsPerDay: config.unitsPerDay,
    monthLengthsInDays,
    yearLengthInDays,
    dayNumberFor,
    toCalendarDate,
  };
}