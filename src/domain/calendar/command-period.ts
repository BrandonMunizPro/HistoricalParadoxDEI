/**
 * CommandPeriod (ADR-0003 decision 1, A6).
 *
 * Approximately a half-year strategic command/planning horizon, two each
 * year and configurable. The month is the normal player-facing progression
 * cadence within a period; periods derive deterministically from the
 * calendar position of an instant.
 */
import type { CalendarDate } from './scenario-calendar.js';

export interface CommandPeriodConfig {
  readonly monthsPerCommandPeriod: number;
}

export interface CommandPeriod {
  readonly era: string;
  readonly yearNumber: number;
  readonly periodNumber: number;
}

export function createCommandPeriodConfig(monthsPerCommandPeriod: number): CommandPeriodConfig {
  if (!Number.isSafeInteger(monthsPerCommandPeriod) || monthsPerCommandPeriod <= 0) {
    throw new RangeError(
      `Command period months must be a positive safe integer, received ${monthsPerCommandPeriod}.`,
    );
  }
  return { monthsPerCommandPeriod };
}

export function commandPeriodOf<const MonthId extends string>(
  config: CommandPeriodConfig,
  date: CalendarDate<MonthId>,
): CommandPeriod {
  const periodNumber = Math.floor(date.monthIndex / config.monthsPerCommandPeriod) + 1;
  return { era: date.era, yearNumber: date.yearNumber, periodNumber };
}