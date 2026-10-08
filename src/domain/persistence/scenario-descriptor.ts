/**
 * Scenario descriptor (ADR-0010, AD-9; E17a).
 *
 * The authoritative calendar is **scenario data**, not a rebuildable
 * projection (ADR-0003 A3): a load must reconstruct the exact
 * `ScenarioCalendar` from durable rows if deterministic continuation is to
 * reproduce the same dates. Every calendar calibration value the domain
 * already validates through `createScenarioCalendar` is mirrored here as a
 * plain descriptor, plus the scenario's canonical identity and display name.
 *
 * The descriptor is created and validated on write, and recreated and
 * revalidated on read, so a checkpoint can never smuggle a calendar the
 * domain itself would have rejected. Revalidation runs the domain's own
 * calendar constructor as the oracle; a corrupted or edited row therefore
 * fails a load loudly instead of producing a subtly different calendar.
 */
import type { ScenarioCalendarConfig } from '../calendar/index.js';
import { createScenarioCalendar } from '../calendar/index.js';
import { isCanonicalId } from '../identity/index.js';
import type { CanonicalId } from '../identity/index.js';
import { hasUnpairedSurrogate } from '../time/index.js';

export interface ScenarioDescriptor<MonthId extends string>
  extends ScenarioCalendarConfig<MonthId> {
  readonly scenarioId: CanonicalId;
  /** Campaign display name; content, never an identity. */
  readonly name: string;
}

function requireText(value: unknown, what: string): string {
  if (typeof value !== 'string') {
    throw new RangeError(`A scenario ${what} must be a primitive string (ADR-0010).`);
  }
  if (value.length === 0) {
    throw new RangeError(`A scenario ${what} must not be empty (ADR-0010).`);
  }
  if (hasUnpairedSurrogate(value)) {
    throw new RangeError(
      `A scenario ${what} must be well-formed Unicode with no unpaired surrogate code units (ADR-0010).`,
    );
  }
  return value;
}

function requireSafeIntegerMember(value: unknown, what: string): number {
  if (typeof value !== 'number' || !Number.isSafeInteger(value)) {
    throw new RangeError(
      `A scenario ${what} must be a safe integer, received ${String(value)} (ADR-0010).`,
    );
  }
  return value;
}

/**
 * Validate an unknown descriptor strictly and return an owned, frozen copy. A
 * persisted descriptor must never round-trip differently from what the
 * calendar constructor accepted, so validation re-runs `createScenarioCalendar`
 * as the oracle.
 */
export function requireScenarioDescriptor(value: unknown): ScenarioDescriptor<string> {
  if (typeof value !== 'object' || value === null) {
    throw new RangeError('A scenario descriptor must be an object (ADR-0010).');
  }
  const source = value as Partial<ScenarioDescriptor<string>>;
  if (!isCanonicalId(source.scenarioId)) {
    throw new RangeError(
      'A scenario descriptor scenarioId must be a canonical identity (ADR-0009).',
    );
  }
  const name = requireText(source.name, 'name');
  const unitsPerDay = requireSafeIntegerMember(source.unitsPerDay, 'unitsPerDay');
  if (unitsPerDay <= 0) {
    throw new RangeError('A scenario descriptor unitsPerDay must be positive (ADR-0010).');
  }
  const epochSimTime = source.epochSimTime;
  if (typeof epochSimTime !== 'number' || !Number.isSafeInteger(epochSimTime)) {
    throw new RangeError(
      'A scenario descriptor epochSimTime must be a safe-integer SimTime (ADR-0003).',
    );
  }
  const epochDayNumber = requireSafeIntegerMember(source.epochDayNumber, 'epochDayNumber');
  const era = source.era;
  if (typeof era !== 'object' || era === null) {
    throw new RangeError('A scenario descriptor era must be an object (ADR-0010).');
  }
  const eraName = requireText(era.name, 'era name');
  if (era.yearNumberDirection !== 'ascending' && era.yearNumberDirection !== 'descending') {
    throw new RangeError(
      'A scenario descriptor era yearNumberDirection must be ascending or descending (ADR-0010).',
    );
  }
  const firstYearNumber = requireSafeIntegerMember(era.firstYearNumber, 'era firstYearNumber');
  const firstYearStartDayNumber = requireSafeIntegerMember(
    era.firstYearStartDayNumber,
    'era firstYearStartDayNumber',
  );
  const monthSource = era.monthSequence;
  if (!Array.isArray(monthSource)) {
    throw new RangeError(
      'A scenario descriptor era monthSequence must be an array (ADR-0010).',
    );
  }
  const monthIds = new Set<string>();
  const ownedMonths: { readonly id: string; readonly days: number }[] = [];
  for (let index = 0; index < monthSource.length; index += 1) {
    const month = monthSource[index] as unknown;
    if (typeof month !== 'object' || month === null) {
      throw new RangeError(
        `A scenario descriptor month at index ${index} must be an object (ADR-0010).`,
      );
    }
    const record = month as { readonly id: unknown; readonly days: unknown };
    const id = requireText(record.id, 'month id');
    const days = requireSafeIntegerMember(record.days, `month days for '${id}'`);
    if (days <= 0) {
      throw new RangeError(
        `A scenario descriptor month days for '${id}' must be positive (ADR-0010).`,
      );
    }
    if (monthIds.has(id)) {
      throw new RangeError(
        `A scenario descriptor month id '${id}' is declared more than once (ADR-0010).`,
      );
    }
    monthIds.add(id);
    ownedMonths.push({ id, days });
  }

  const owned: ScenarioDescriptor<string> = Object.freeze({
    scenarioId: source.scenarioId,
    name,
    unitsPerDay,
    epochSimTime,
    epochDayNumber,
    era: Object.freeze({
      name: eraName,
      yearNumberDirection: era.yearNumberDirection,
      firstYearNumber,
      firstYearStartDayNumber,
      monthSequence: Object.freeze(ownedMonths),
    }),
  });

  // The calendar constructor is the validation oracle: whatever it accepts is
  // a calendar the domain can rebuild with the same dates.
  createScenarioCalendar(owned);
  return owned;
}

/**
 * Build an owned, frozen `ScenarioDescriptor<string>` from a known-good
 * plain input (as persisted rows are not; those go through
 * `requireScenarioDescriptor` on read).
 */
export function createScenarioDescriptor<MonthId extends string>(
  input: ScenarioDescriptor<MonthId>,
): ScenarioDescriptor<MonthId> {
  requireScenarioDescriptor(input);
  return input;
}