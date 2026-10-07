import { describe, expect, it } from 'vitest';
import type { CommandPeriod, CalendarMonth, ScenarioCalendar } from '../src/domain/calendar/index.js';
import { commandPeriodOf, createCommandPeriodConfig, createScenarioCalendar } from '../src/domain/calendar/index.js';
import type { ScheduledWork } from '../src/domain/time/index.js';
import {
  createClock,
  parseSimTimeStableString,
  parseSimTimeWithContext,
  serializeSimTimeWithContext,
  simTime,
  simTimeScalar,
  simTimeToStableString,
  WorkClassRank,
  workIdentifier,
} from '../src/domain/time/index.js';
import type { ScenarioTraceStep } from '../src/simulation/headless-scenario-run.js';
import { createHeadlessScenario, serializeScenarioTrace } from '../src/simulation/headless-scenario-run.js';

type MonthId =
  | 'm-01'
  | 'm-02'
  | 'm-03'
  | 'm-04'
  | 'm-05'
  | 'm-06'
  | 'm-07'
  | 'm-08'
  | 'm-09'
  | 'm-10'
  | 'm-11'
  | 'm-12';

function entry(id: string, dueScalar: number, rank: WorkClassRank = WorkClassRank.world): ScheduledWork<string> {
  return {
    dueSimTime: simTime(dueScalar),
    classRank: rank,
    workIdentifier: workIdentifier(id),
    work: id,
  };
}

const monthId = (number: number): string => `month-${String(number).padStart(2, '0')}`;

const monthSequence: readonly CalendarMonth<MonthId>[] = [
  { id: 'm-01', days: 30 },
  { id: 'm-02', days: 30 },
  { id: 'm-03', days: 30 },
  { id: 'm-04', days: 30 },
  { id: 'm-05', days: 30 },
  { id: 'm-06', days: 30 },
  { id: 'm-07', days: 30 },
  { id: 'm-08', days: 30 },
  { id: 'm-09', days: 30 },
  { id: 'm-10', days: 30 },
  { id: 'm-11', days: 30 },
  { id: 'm-12', days: 30 },
];

function calendarFor(era: {
  readonly name: string;
  readonly yearNumberDirection: 'ascending' | 'descending';
  readonly firstYearNumber: number;
}): ScenarioCalendar<MonthId> {
  return createScenarioCalendar<MonthId>({
    unitsPerDay: 24,
    epochSimTime: simTime(0),
    epochDayNumber: 0,
    era: {
      name: era.name,
      yearNumberDirection: era.yearNumberDirection,
      firstYearNumber: era.firstYearNumber,
      firstYearStartDayNumber: 0,
      monthSequence,
    },
  });
}

function standardAscending(): ScenarioCalendar<MonthId> {
  return calendarFor({ name: 'Standard', yearNumberDirection: 'ascending', firstYearNumber: 1 });
}

function standardDescending(): ScenarioCalendar<MonthId> {
  return calendarFor({ name: 'BCE', yearNumberDirection: 'descending', firstYearNumber: 300 });
}

describe('VS-2: a scripted world advances by command periods (E1)', () => {
  it('resolves a frozen tactical handoff at SimTime and holds the rest of the instant', () => {
    const calendar = standardAscending();
    const clock = createClock(simTime(0));
    const scenario = createHeadlessScenario<string, MonthId>(clock, calendar);

    for (let month = 0; month < 19; month += 1) {
      scenario.schedule(entry(monthId(month), month * 720, WorkClassRank.world));
    }
    scenario.schedule(entry('battle-handoff', 1440, WorkClassRank.battleResult));
    scenario.schedule(entry('battle-result-apply', 1440, WorkClassRank.battleResult));
    scenario.schedule(entry('battle-echo', 1440, WorkClassRank.world));

    const frozenSteps = scenario.runUntilHeld((current) => {
      if (String(current.workIdentifier) === 'battle-handoff') {
        scenario.freeze();
      }
    });

    expect(frozenSteps.map((step) => step.workIdentifier)).toEqual([
      monthId(0),
      monthId(1),
      'battle-handoff',
      'battle-result-apply',
      'battle-echo',
      monthId(2),
    ]);
    expect(simTimeScalar(clock.now())).toBe(1440);
    expect(clock.isFrozen()).toBe(true);
    expect(scenario.pendingCount()).toBe(16);

    const handoff = frozenSteps.find((step) => step.workIdentifier === 'battle-handoff');
    expect(handoff?.dueSimTime).toEqual(simTime(1440));
    expect(handoff?.calendarDate).toEqual({
      era: 'Standard',
      yearNumber: 1,
      monthIndex: 2,
      monthId: 'm-03',
      dayOfMonth: 1,
    });

    scenario.unfreeze();
    const resumed = scenario.runUntilHeld();
    expect(resumed.map((step) => step.workIdentifier)).toEqual(
      Array.from({ length: 16 }, (_, index) => monthId(index + 3)),
    );
    expect(scenario.pendingCount()).toBe(0);
    expect(simTimeScalar(clock.now())).toBe(18 * 720);
    expect(clock.isFrozen()).toBe(false);

    const fullTrace = scenario.trace();
    expect(fullTrace.map((step) => step.workIdentifier)).toEqual([
      monthId(0),
      monthId(1),
      'battle-handoff',
      'battle-result-apply',
      'battle-echo',
      monthId(2),
      ...Array.from({ length: 16 }, (_, index) => monthId(index + 3)),
    ]);

    let previousDay = -1;
    for (const step of fullTrace) {
      const day = calendar.dayNumberFor(step.dueSimTime);
      expect(day).toBeGreaterThanOrEqual(previousDay);
      previousDay = day;
      expect(calendar.toCalendarDate(step.dueSimTime)).toEqual(step.calendarDate);
    }
  });

  it('pause holds progression without consuming or rewriting time', () => {
    const calendar = standardAscending();
    const clock = createClock(simTime(0));
    const scenario = createHeadlessScenario<string, MonthId>(clock, calendar);
    scenario.schedule(entry('single', 100));
    scenario.pause();
    expect(scenario.runUntilHeld()).toEqual([]);
    expect(scenario.pendingCount()).toBe(1);
    expect(scenario.trace()).toEqual([]);
    expect(simTimeScalar(clock.now())).toBe(0);
    scenario.resume();
    const steps = scenario.runUntilHeld();
    expect(steps.map((step) => step.workIdentifier)).toEqual(['single']);
    expect(simTimeScalar(clock.now())).toBe(100);
    expect(scenario.trace()).toHaveLength(1);
  });

  it('the stable trace is byte-reproducible and its scalar column round-trips', () => {
    const calendar = standardAscending();
    const clock = createClock(simTime(0));
    const scenario = createHeadlessScenario<string, MonthId>(clock, calendar);
    for (let month = 0; month < 19; month += 1) {
      scenario.schedule(entry(monthId(month), month * 720));
    }
    scenario.schedule(entry('battle-echo', 1440, WorkClassRank.battleResult));
    scenario.runUntilHeld();

    const rendered = serializeScenarioTrace(scenario.trace());
    const lines = rendered.split('\n');
    expect(lines).toHaveLength(20);
    for (const line of lines) {
      const fields = line.split('|');
      const [scalar] = fields;
      expect(fields).toHaveLength(8);
      expect(parseSimTimeStableString(scalar as string)).toEqual(simTime(Number(scalar)));
    }
    expect(serializeScenarioTrace(scenario.trace())).toBe(rendered);
  });

  it('command periods advance one per half-year, restarting each year', () => {
    const calendar = standardAscending();
    const clock = createClock(simTime(0));
    const scenario = createHeadlessScenario<string, MonthId>(clock, calendar);
    for (let month = 0; month < 19; month += 1) {
      scenario.schedule(entry(monthId(month), month * 720));
    }
    scenario.runUntilHeld();
    const config = createCommandPeriodConfig(6);
    const periods: CommandPeriod[] = scenario.trace().map((step) => commandPeriodOf(config, step.calendarDate));
    expect(periods[5]).toEqual({ era: 'Standard', yearNumber: 1, periodNumber: 1 });
    expect(periods[6]).toEqual({ era: 'Standard', yearNumber: 1, periodNumber: 2 });
    expect(periods[11]).toEqual({ era: 'Standard', yearNumber: 1, periodNumber: 2 });
    expect(periods[12]).toEqual({ era: 'Standard', yearNumber: 2, periodNumber: 1 });
    expect(periods[17]).toEqual({ era: 'Standard', yearNumber: 2, periodNumber: 1 });
    expect(periods[18]).toEqual({ era: 'Standard', yearNumber: 2, periodNumber: 2 });
  });

  it('derives dates correctly on a descending (BCE-style) era while time only advances', () => {
    const calendar = standardDescending();
    const clock = createClock(simTime(0));
    const scenario = createHeadlessScenario<string, MonthId>(clock, calendar);
    for (const month of [0, 5, 6, 11, 12, 17, 18]) {
      scenario.schedule(entry(monthId(month), month * 720));
    }
    scenario.runUntilHeld();
    const dates = scenario.trace().map((step) => step.calendarDate);
    expect(dates.map((date) => date.yearNumber)).toEqual([300, 300, 300, 300, 299, 299, 299]);
    expect(dates.every((date) => date.era === 'BCE')).toBe(true);
    expect(simTimeScalar(clock.now())).toBe(18 * 720);
  });
});

describe('VS-2: SimTime serialization stays exact and scalar-only (N-29, amendment B1)', () => {
  it('round-trips canonical decimal integer strings losslessly', () => {
    for (const value of [0, 1, 100, 527, 12960, 720 * 18, -1, 100000, -12345, Number.MAX_SAFE_INTEGER]) {
      const text = simTimeToStableString(simTime(value));
      expect(text).toBe(String(value));
      expect(parseSimTimeStableString(text)).toEqual(simTime(value));
    }
  });

  it('rejects anything that is not a canonical exact integer', () => {
    for (const bad of ['', '5.5', '+7', '007', '-0', '1e3', ' 5', '5 ', '0x10']) {
      expect(() => parseSimTimeStableString(bad)).toThrow(RangeError);
    }
    expect(() => parseSimTimeStableString(String(Number.MAX_SAFE_INTEGER + 1))).toThrow(RangeError);
  });

  it('keeps calendar metadata explicit on the boundary, never inside the scalar', () => {
    const value = simTime(12960);
    const metadata = { unitsPerDay: 24, calendar: '12x30', era: 'ascending' };
    const serialized = serializeSimTimeWithContext(value, metadata);
    expect(serialized.scalar).toBe('12960');
    expect(serialized.metadata).toEqual(metadata);
    expect(parseSimTimeWithContext(serialized)).toEqual(value);
    expect(serialized.scalar).toBe(simTimeToStableString(value));
  });

  it('the trace type keeps the calendar date adjacent to each scalar', () => {
    const step: ScenarioTraceStep<MonthId> = {
      workIdentifier: 'single',
      classRank: WorkClassRank.world,
      dueSimTime: simTime(100),
      calendarDate: {
        era: 'Standard',
        yearNumber: 1,
        monthIndex: 0,
        monthId: 'm-01',
        dayOfMonth: 5,
      },
    };
    const rendered = serializeScenarioTrace([step]);
    expect(rendered).toBe('100|1|single|Standard|1|m-01|0|5');
    expect(parseSimTimeStableString(rendered.split('|')[0] as string)).toEqual(simTime(100));
  });
});