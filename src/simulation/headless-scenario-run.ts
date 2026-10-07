/**
 * Headless scenario driver (VS-2 / E1 acceptance seam).
 *
 * Orchestrates a deterministic campaign over the domain clock, calendar and
 * due-work scheduler without any UI, persistence or battle content. A script
 * schedules consequences; the driver advances the clock directly to each due
 * instant, derives the calendar date for each executed step, and records a
 * stable trace (which is byte-identical for identical scheduling, regardless
 * of insertion order — ADR-0003 A5, amendment B2/N-30).
 *
 * Pause and freeze are the simulation clock's capabilities (decision 7,
 * A10/A11): runUntilHeld stops when the scheduler holds (paused, or frozen
 * with the next work beyond the frozen instant) and resumes from the same
 * SimTime — handoff time is never consumed or rewritten.
 */
import type { CalendarDate, ScenarioCalendar } from '../domain/calendar/index.js';
import { simTimeScalar } from '../domain/time/index.js';
import type { Clock, DueWorkScheduler, ScheduledWork, SimTime, WorkClassRank } from '../domain/time/index.js';
import { createDueWorkScheduler } from '../domain/time/index.js';

export interface ScenarioTraceStep<MonthId extends string> {
  readonly workIdentifier: string;
  readonly classRank: WorkClassRank;
  readonly dueSimTime: SimTime;
  readonly calendarDate: CalendarDate<MonthId>;
}

export interface HeadlessScenario<TWork, MonthId extends string> {
  readonly clock: Clock;
  readonly calendar: ScenarioCalendar<MonthId>;
  schedule(entry: ScheduledWork<TWork>): ScheduledWork<TWork>;
  pause(): void;
  resume(): void;
  freeze(): void;
  unfreeze(): void;
  /** Number of held or ready entries; unaffected by pause and freeze. */
  pendingCount(): number;
  /** Advance until the scheduler holds or empties; returns newly executed steps. */
  runUntilHeld(
    execute?: (entry: ScheduledWork<TWork>) => void,
  ): readonly ScenarioTraceStep<MonthId>[];
  trace(): readonly ScenarioTraceStep<MonthId>[];
}

export function createHeadlessScenario<TWork, MonthId extends string>(
  clock: Clock,
  calendar: ScenarioCalendar<MonthId>,
): HeadlessScenario<TWork, MonthId> {
  const scheduler: DueWorkScheduler<TWork> = createDueWorkScheduler<TWork>(clock);
  const steps: ScenarioTraceStep<MonthId>[] = [];

  function runUntilHeld(
    execute?: (entry: ScheduledWork<TWork>) => void,
  ): readonly ScenarioTraceStep<MonthId>[] {
    const before = steps.length;
    scheduler.runAll((entry) => {
      steps.push({
        workIdentifier: String(entry.workIdentifier),
        classRank: entry.classRank,
        dueSimTime: entry.dueSimTime,
        calendarDate: calendar.toCalendarDate(entry.dueSimTime),
      });
      execute?.(entry);
    });
    return steps.slice(before);
  }

  return {
    clock,
    calendar,
    schedule: (entry: ScheduledWork<TWork>): ScheduledWork<TWork> => scheduler.schedule(entry),
    pause: (): void => {
      clock.pause();
    },
    resume: (): void => {
      clock.resume();
    },
    freeze: (): void => {
      clock.freeze();
    },
    unfreeze: (): void => {
      clock.unfreeze();
    },
    pendingCount: (): number => scheduler.pendingCount(),
    runUntilHeld,
    trace: (): readonly ScenarioTraceStep<MonthId>[] => steps,
  };
}

/** Stable, byte-for-byte reproducible rendering of an executed trace. */
export function serializeScenarioTrace<MonthId extends string>(
  steps: readonly ScenarioTraceStep<MonthId>[],
): string {
  return steps
    .map((step) => {
      const date = step.calendarDate;
      return [
        String(simTimeScalar(step.dueSimTime)),
        String(step.classRank),
        step.workIdentifier,
        date.era,
        String(date.yearNumber),
        String(date.monthId),
        String(date.monthIndex),
        String(date.dayOfMonth),
      ].join('|');
    })
    .join('\n');
}