import { describe, expect, it } from 'vitest';
import type {
  CalendarMonth,
  CommandPeriod,
  ScenarioCalendar,
  ScenarioCalendarConfig,
} from '../src/domain/calendar/index.js';
import {
  commandPeriodOf,
  createCommandPeriodConfig,
  createScenarioCalendar,
} from '../src/domain/calendar/index.js';
import { simTime } from '../src/domain/time/index.js';
import type { SimTime } from '../src/domain/time/index.js';

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

describe('ScenarioCalendar consumes an immutable configuration snapshot (ADR-0003 A3)', () => {
  it('later mutation of the caller config cannot change the calendar', () => {
    const daysCopy = monthSequence.map((month) => ({ ...month }));
    const config = {
      unitsPerDay: 24,
      epochSimTime: simTime(0),
      epochDayNumber: 0,
      era: {
        name: 'Snap',
        yearNumberDirection: 'ascending' as const,
        firstYearNumber: 1,
        firstYearStartDayNumber: 0,
        monthSequence: daysCopy,
      },
    };
    const calendar = createScenarioCalendar<MonthId>(config);
    config.unitsPerDay = 1;
    config.epochDayNumber = 999;
    config.era.name = 'Mutated';
    config.era.firstYearStartDayNumber = 500;
    (config.era.monthSequence[0] as { id: string; days: number }).days = 2;
    expect(calendar.unitsPerDay).toBe(24);
    expect(calendar.yearLengthInDays).toBe(360);
    expect(calendar.dayNumberFor(simTime(23))).toBe(0);
    expect(calendar.dayNumberFor(simTime(24))).toBe(1);
    expect(calendar.toCalendarDate(simTime(0))).toEqual({
      era: 'Snap',
      yearNumber: 1,
      monthIndex: 0,
      monthId: 'm-01',
      dayOfMonth: 1,
    });
  });

  it('freezes the exposed metadata the calendar owns', () => {
    const calendar = standardAscending();
    expect(Object.isFrozen(calendar.monthLengthsInDays)).toBe(true);
    expect(() => (calendar.monthLengthsInDays as number[]).push(1)).toThrow(TypeError);
    expect(calendar.monthLengthsInDays).toHaveLength(12);
    expect(() => {
      (calendar as { unitsPerDay: number }).unitsPerDay = 1;
    }).toThrow(TypeError);
    expect(() => {
      (calendar as { yearLengthInDays: number }).yearLengthInDays = 1;
    }).toThrow(TypeError);
    expect(calendar.unitsPerDay).toBe(24);
    expect(calendar.yearLengthInDays).toBe(360);
  });
});

describe('ScenarioCalendar exact integer arithmetic (amendment B1, ADR-0008)', () => {
  it('floors consistently for values before the epoch instead of truncating toward zero', () => {
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
    expect(offset.dayNumberFor(simTime(76))).toBe(49);
    expect(offset.dayNumberFor(simTime(99))).toBe(49);
    expect(offset.dayNumberFor(simTime(100))).toBe(50);
    expect(offset.dayNumberFor(simTime(123))).toBe(50);
    expect(offset.dayNumberFor(simTime(124))).toBe(51);
    expect(offset.dayNumberFor(simTime(148))).toBe(52);
    expect(offset.toCalendarDate(simTime(76))).toEqual({
      era: 'Offset',
      yearNumber: 1,
      monthIndex: 1,
      monthId: 'm-02',
      dayOfMonth: 20,
    });
    expect(offset.toCalendarDate(simTime(-24))).toEqual({
      era: 'Offset',
      yearNumber: 1,
      monthIndex: 1,
      monthId: 'm-02',
      dayOfMonth: 15,
    });
  });

  it('stays exact at the safe-integer boundary of the scalar axis', () => {
    const far = createScenarioCalendar<MonthId>({
      unitsPerDay: 24,
      epochSimTime: simTime(Number.MIN_SAFE_INTEGER),
      epochDayNumber: Number.MIN_SAFE_INTEGER,
      era: {
        name: 'Far',
        yearNumberDirection: 'ascending',
        firstYearNumber: 1,
        firstYearStartDayNumber: Number.MIN_SAFE_INTEGER,
        monthSequence,
      },
    });
    expect(far.dayNumberFor(simTime(Number.MIN_SAFE_INTEGER))).toBe(Number.MIN_SAFE_INTEGER);
    expect(far.dayNumberFor(simTime(Number.MIN_SAFE_INTEGER + 23))).toBe(Number.MIN_SAFE_INTEGER);
    expect(far.dayNumberFor(simTime(Number.MIN_SAFE_INTEGER + 24))).toBe(Number.MIN_SAFE_INTEGER + 1);
    expect(far.toCalendarDate(simTime(Number.MIN_SAFE_INTEGER))).toEqual({
      era: 'Far',
      yearNumber: 1,
      monthIndex: 0,
      monthId: 'm-01',
      dayOfMonth: 1,
    });
    expect(far.toCalendarDate(simTime(Number.MIN_SAFE_INTEGER + 720))).toEqual({
      era: 'Far',
      yearNumber: 1,
      monthIndex: 1,
      monthId: 'm-02',
      dayOfMonth: 1,
    });
    expect(far.toCalendarDate(simTime(Number.MIN_SAFE_INTEGER + 8640))).toEqual({
      era: 'Far',
      yearNumber: 2,
      monthIndex: 0,
      monthId: 'm-01',
      dayOfMonth: 1,
    });
  });

  it('rejects day numbers that leave the exact safe-integer output range instead of rounding', () => {
    const calendar = createScenarioCalendar<MonthId>({
      unitsPerDay: 1,
      epochSimTime: simTime(0),
      epochDayNumber: Number.MAX_SAFE_INTEGER,
      era: {
        name: 'Full',
        yearNumberDirection: 'ascending',
        firstYearNumber: 1,
        firstYearStartDayNumber: 0,
        monthSequence,
      },
    });
    expect(calendar.dayNumberFor(simTime(0))).toBe(Number.MAX_SAFE_INTEGER);
    expect(() => calendar.dayNumberFor(simTime(Number.MAX_SAFE_INTEGER))).toThrow(RangeError);
  });

  it('rejects configuration whose composed year length overflows the exact range', () => {
    expect(() =>
      createScenarioCalendar<MonthId>({
        unitsPerDay: 24,
        epochSimTime: simTime(0),
        epochDayNumber: 0,
        era: {
          name: 'Huge',
          yearNumberDirection: 'ascending',
          firstYearNumber: 1,
          firstYearStartDayNumber: 0,
          monthSequence: [
            { id: 'm-01', days: Number.MAX_SAFE_INTEGER },
            { id: 'm-02', days: Number.MAX_SAFE_INTEGER },
          ],
        },
      }),
    ).toThrow(RangeError);
  });

  it('rejects a non-safe-integer epoch SimTime scalar explicitly', () => {
    expect(() =>
      createScenarioCalendar<MonthId>({
        ...baseConfig(),
        epochSimTime: (Number.MAX_SAFE_INTEGER + 1) as unknown as SimTime,
      }),
    ).toThrow(RangeError);
  });
});

describe('ScenarioCalendar captures each caller-controlled config value exactly once (amendments F3/B2)', () => {
  it('reads every configuration field exactly once before validation and construction', () => {
    const sends = {
      unitsPerDay: 0,
      epochSimTime: 0,
      epochDayNumber: 0,
      era: 0,
      eraName: 0,
      yearNumberDirection: 0,
      firstYearNumber: 0,
      firstYearStartDayNumber: 0,
      monthSequence: 0,
    };
    const eraObject: ScenarioCalendarConfig<MonthId>['era'] = {
      get name() {
        sends.eraName += 1;
        return 'Base';
      },
      get yearNumberDirection(): 'ascending' {
        sends.yearNumberDirection += 1;
        return 'ascending';
      },
      get firstYearNumber() {
        sends.firstYearNumber += 1;
        return 1;
      },
      get firstYearStartDayNumber() {
        sends.firstYearStartDayNumber += 1;
        return 0;
      },
      get monthSequence() {
        sends.monthSequence += 1;
        return monthSequence;
      },
    };
    const accessorConfig: ScenarioCalendarConfig<MonthId> = {
      get unitsPerDay() {
        sends.unitsPerDay += 1;
        return 24;
      },
      get epochSimTime() {
        sends.epochSimTime += 1;
        return simTime(0);
      },
      get epochDayNumber() {
        sends.epochDayNumber += 1;
        return 0;
      },
      get era() {
        sends.era += 1;
        return eraObject;
      },
    };
    const calendar = createScenarioCalendar<MonthId>(accessorConfig);
    expect(sends).toEqual({
      unitsPerDay: 1,
      epochSimTime: 1,
      epochDayNumber: 1,
      era: 1,
      eraName: 1,
      yearNumberDirection: 1,
      firstYearNumber: 1,
      firstYearStartDayNumber: 1,
      monthSequence: 1,
    });
    expect(calendar.unitsPerDay).toBe(24);
    expect(calendar.yearLengthInDays).toBe(360);
    expect(calendar.monthLengthsInDays).toHaveLength(12);
    expect(calendar.toCalendarDate(simTime(720))).toEqual({
      era: 'Base',
      yearNumber: 1,
      monthIndex: 1,
      monthId: 'm-02',
      dayOfMonth: 1,
    });
  });

  it('builds exclusively from the first captured values when later reads would differ', () => {
    let unitsPerDayReads = 0;
    let nameReads = 0;
    const hostileConfig: ScenarioCalendarConfig<MonthId> = {
      get unitsPerDay() {
        unitsPerDayReads += 1;
        return unitsPerDayReads === 1 ? 24 : 1_000_000;
      },
      epochSimTime: simTime(0),
      epochDayNumber: 0,
      era: {
        get name() {
          nameReads += 1;
          return nameReads === 1 ? 'Held' : 'Later';
        },
        yearNumberDirection: 'ascending',
        firstYearNumber: 1,
        firstYearStartDayNumber: 0,
        monthSequence,
      },
    };
    const calendar = createScenarioCalendar<MonthId>(hostileConfig);
    expect(unitsPerDayReads).toBe(1);
    expect(nameReads).toBe(1);
    expect(calendar.unitsPerDay).toBe(24);
    expect(calendar.toCalendarDate(simTime(720))).toEqual({
      era: 'Held',
      yearNumber: 1,
      monthIndex: 1,
      monthId: 'm-02',
      dayOfMonth: 1,
    });
  });

  it('never invokes caller-supplied array iteration methods or re-read scales when establishing the owned snapshot', () => {
    let daysReads = 0;
    const forgedMonths: Array<{ id: string; get days(): number }> = [
      {
        id: 'm',
        get days() {
          daysReads += 1;
          return daysReads === 1 ? 30 : 0;
        },
      },
    ];
    (forgedMonths as unknown as { map: () => Array<{ id: string; get days(): number }> }).map = () => forgedMonths;
    const calendar = createScenarioCalendar<'m'>({
      unitsPerDay: 24,
      epochSimTime: simTime(0),
      epochDayNumber: 0,
      era: {
        name: 'Snap',
        yearNumberDirection: 'ascending',
        firstYearNumber: 1,
        firstYearStartDayNumber: 0,
        monthSequence: forgedMonths as readonly CalendarMonth<'m'>[],
      },
    });
    expect(daysReads).toBe(1);
    expect(calendar.yearLengthInDays).toBe(30);
    expect(calendar.monthLengthsInDays).toEqual([30]);
    expect(calendar.toCalendarDate(simTime(24))).toEqual({
      era: 'Snap',
      yearNumber: 1,
      monthIndex: 0,
      monthId: 'm',
      dayOfMonth: 2,
    });
  });

  it('rejects a non-array month sequence explicitly', () => {
    expect(() =>
      createScenarioCalendar<MonthId>({
        ...baseConfig(),
        era: {
          ...baseConfig().era,
          monthSequence: {} as unknown as readonly CalendarMonth<MonthId>[],
        },
      }),
    ).toThrow(RangeError);
  });
});