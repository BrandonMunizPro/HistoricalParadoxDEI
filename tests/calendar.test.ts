import { describe, expect, it } from 'vitest';
import type { CalendarMonth, CommandPeriod, ScenarioCalendar } from '../src/domain/calendar/index.js';
import {
  commandPeriodOf,
  createCommandPeriodConfig,
  createScenarioCalendar,
} from '../src/domain/calendar/index.js';
import { simTime } from '../src/domain/time/index.js';

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

function baseConfig() {
  return {
    unitsPerDay: 24,
    epochSimTime: simTime(0),
    epochDayNumber: 0,
    era: {
      name: 'Base',
      yearNumberDirection: 'ascending' as const,
      firstYearNumber: 1,
      firstYearStartDayNumber: 0,
      monthSequence,
    },
  };
}

function standardAscending(): ScenarioCalendar<MonthId> {
  return createScenarioCalendar<MonthId>({
    unitsPerDay: 24,
    epochSimTime: simTime(0),
    epochDayNumber: 0,
    era: {
      name: 'Standard',
      yearNumberDirection: 'ascending',
      firstYearNumber: 1,
      firstYearStartDayNumber: 0,
      monthSequence,
    },
  });
}

function standardDescending(): ScenarioCalendar<MonthId> {
  return createScenarioCalendar<MonthId>({
    unitsPerDay: 24,
    epochSimTime: simTime(0),
    epochDayNumber: 0,
    era: {
      name: 'BCE',
      yearNumberDirection: 'descending',
      firstYearNumber: 300,
      firstYearStartDayNumber: 0,
      monthSequence,
    },
  });
}

describe('ScenarioCalendar construction (ADR-0003 A3, N-29)', () => {
  it('reports the authored calibration metadata', () => {
    const calendar = standardAscending();
    expect(calendar.unitsPerDay).toBe(24);
    expect(calendar.monthLengthsInDays).toHaveLength(12);
    expect(calendar.monthLengthsInDays.every((days) => days === 30)).toBe(true);
    expect(calendar.yearLengthInDays).toBe(360);
  });

  it('rejects invalid calibration and era data', () => {
    expect(() => createScenarioCalendar<MonthId>({ ...baseConfig(), unitsPerDay: 0 })).toThrow(RangeError);
    expect(() => createScenarioCalendar<MonthId>({ ...baseConfig(), unitsPerDay: -24 })).toThrow(RangeError);
    expect(() => createScenarioCalendar<MonthId>({ ...baseConfig(), unitsPerDay: 24.5 })).toThrow(RangeError);
    expect(() => createScenarioCalendar<MonthId>({ ...baseConfig(), epochDayNumber: 0.5 })).toThrow(RangeError);
    expect(() => createScenarioCalendar<MonthId>({ ...baseConfig(), era: { ...baseConfig().era, name: '' } })).toThrow(
      RangeError,
    );
    expect(() =>
      createScenarioCalendar<MonthId>({ ...baseConfig(), era: { ...baseConfig().era, monthSequence: [] } }),
    ).toThrow(RangeError);
    expect(() =>
      createScenarioCalendar<MonthId>({
        ...baseConfig(),
        era: { ...baseConfig().era, monthSequence: [{ id: 'm-01', days: 0 }] },
      }),
    ).toThrow(RangeError);
    expect(() =>
      createScenarioCalendar<MonthId>({
        ...baseConfig(),
        era: { ...baseConfig().era, monthSequence: [monthSequence[0] as CalendarMonth<MonthId>, monthSequence[1] as CalendarMonth<MonthId>] },
      }),
    ).not.toThrow();
    expect(() =>
      createScenarioCalendar<MonthId>({
        ...baseConfig(),
        era: { ...baseConfig().era, monthSequence: [monthSequence[0] as CalendarMonth<MonthId>, monthSequence[0] as CalendarMonth<MonthId>] },
      }),
    ).toThrow(RangeError);
  });
});

describe('ScenarioCalendar day math (ADR-0003 amendment B1)', () => {
  const calendar = standardAscending();

  it('keeps month boundaries exactly on day boundaries under N-29 unitsPerDay', () => {
    expect(calendar.dayNumberFor(simTime(0))).toBe(0);
    expect(calendar.dayNumberFor(simTime(23))).toBe(0);
    expect(calendar.dayNumberFor(simTime(24))).toBe(1);
    expect(calendar.dayNumberFor(simTime(719))).toBe(29);
    expect(calendar.dayNumberFor(simTime(720))).toBe(30);

    expect(calendar.toCalendarDate(simTime(0))).toEqual({
      era: 'Standard',
      yearNumber: 1,
      monthIndex: 0,
      monthId: 'm-01',
      dayOfMonth: 1,
    });
    expect(calendar.toCalendarDate(simTime(719))).toEqual({
      era: 'Standard',
      yearNumber: 1,
      monthIndex: 0,
      monthId: 'm-01',
      dayOfMonth: 30,
    });
    expect(calendar.toCalendarDate(simTime(720))).toEqual({
      era: 'Standard',
      yearNumber: 1,
      monthIndex: 1,
      monthId: 'm-02',
      dayOfMonth: 1,
    });
  });

  it('crosses year boundaries exactly', () => {
    expect(calendar.toCalendarDate(simTime(8616))).toEqual({
      era: 'Standard',
      yearNumber: 1,
      monthIndex: 11,
      monthId: 'm-12',
      dayOfMonth: 30,
    });
    expect(calendar.toCalendarDate(simTime(8640))).toEqual({
      era: 'Standard',
      yearNumber: 2,
      monthIndex: 0,
      monthId: 'm-01',
      dayOfMonth: 1,
    });
  });

  it('honours an offset epoch: the epoch day can start anywhere on the absolute label axis', () => {
    const offset = createScenarioCalendar<MonthId>({
      unitsPerDay: 24,
      epochSimTime: simTime(100),
      epochDayNumber: 50,
      era: {
        name: 'Offset',
        yearNumberDirection: 'ascending',
        firstYearNumber: 1,
        firstYearStartDayNumber: 0,
        monthSequence,
      },
    });
    expect(offset.dayNumberFor(simTime(99))).toBe(49);
    expect(offset.dayNumberFor(simTime(100))).toBe(50);
    expect(offset.dayNumberFor(simTime(123))).toBe(50);
    expect(offset.dayNumberFor(simTime(124))).toBe(51);
  });

  it('derives dates monotonically across a multi-year sweep', () => {
    let previousDay = -1;
    for (let scalar = 0; scalar <= 8640 * 4; scalar += 120) {
      const day = calendar.dayNumberFor(simTime(scalar));
      expect(day).toBeGreaterThan(previousDay);
      previousDay = day;
      const date = calendar.toCalendarDate(simTime(scalar));
      expect(date.era).toBe('Standard');
      expect(date.monthIndex).toBeGreaterThanOrEqual(0);
      expect(date.monthIndex).toBeLessThanOrEqual(11);
      expect(date.dayOfMonth).toBeGreaterThanOrEqual(1);
      expect(date.dayOfMonth).toBeLessThanOrEqual(30);
    }
    expect(calendar.toCalendarDate(simTime(8640 * 4)).yearNumber).toBe(5);
  });
});

describe('ScenarioCalendar era direction (ADR-0003 A2, A3)', () => {
  const calendar = standardDescending();

  it('displays decreasing year numbers while the timeline only advances', () => {
    expect(calendar.toCalendarDate(simTime(0)).yearNumber).toBe(300);
    expect(calendar.toCalendarDate(simTime(8640)).yearNumber).toBe(299);
    expect(calendar.toCalendarDate(simTime(8640 * 2)).yearNumber).toBe(298);
    expect(calendar.toCalendarDate(simTime(8640 * 3)).yearNumber).toBe(297);
    expect(calendar.dayNumberFor(simTime(8640 * 3))).toBe(1080);
  });

  it('keeps month mechanics identical regardless of year numbering direction', () => {
    const date = calendar.toCalendarDate(simTime(4296));
    expect(date.yearNumber).toBe(300);
    expect(date.monthIndex).toBe(5);
    expect(date.monthId).toBe('m-06');
    expect(date.dayOfMonth).toBe(30);
  });
});

describe('CommandPeriod (ADR-0003 decision 1, A6)', () => {
  it('splits a twelve-month year into two half-year periods', () => {
    const calendar = standardAscending();
    const config = createCommandPeriodConfig(6);
    const periods: CommandPeriod[] = [];
    for (let month = 0; month < 12; month += 1) {
      const date = calendar.toCalendarDate(simTime(720 * month));
      periods.push(commandPeriodOf(config, date));
    }
    expect(periods.map((period) => period.periodNumber)).toEqual([1, 1, 1, 1, 1, 1, 2, 2, 2, 2, 2, 2]);
    expect(periods.every((period) => period.era === 'Standard')).toBe(true);
    expect(periods.every((period) => period.yearNumber === 1)).toBe(true);
  });

  it('periods restart per year and are configurable', () => {
    const calendar = standardAscending();
    const config = createCommandPeriodConfig(6);
    expect(commandPeriodOf(config, calendar.toCalendarDate(simTime(720 * 12)))).toEqual({
      era: 'Standard',
      yearNumber: 2,
      periodNumber: 1,
    });

    const quarters = createCommandPeriodConfig(3);
    expect(commandPeriodOf(quarters, calendar.toCalendarDate(simTime(720 * 2))).periodNumber).toBe(1);
    expect(commandPeriodOf(quarters, calendar.toCalendarDate(simTime(720 * 3))).periodNumber).toBe(2);
    expect(commandPeriodOf(quarters, calendar.toCalendarDate(simTime(720 * 11))).periodNumber).toBe(4);
  });

  it('rejects a non-positive or non-integer period length', () => {
    expect(() => createCommandPeriodConfig(0)).toThrow(RangeError);
    expect(() => createCommandPeriodConfig(-2)).toThrow(RangeError);
    expect(() => createCommandPeriodConfig(1.5)).toThrow(RangeError);
  });
});