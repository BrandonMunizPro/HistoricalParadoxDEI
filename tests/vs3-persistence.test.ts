import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { describe, expect, it } from 'vitest';
import Database from 'better-sqlite3';
import { createScenarioCalendar } from '../src/domain/calendar/index.js';
import type { CalendarMonth, ScenarioCalendarConfig } from '../src/domain/calendar/index.js';
import { deriveAuthoredCanonicalId } from '../src/domain/identity/index.js';
import { createLedgerEvent, ledgerEventId } from '../src/domain/ledger/index.js';
import type { LedgerEventId } from '../src/domain/ledger/index.js';
import {
  CheckpointIntegrityError,
  UnsupportedCheckpointVersionError,
  checkpointSlotId,
  createScenarioDescriptor,
  createWorkKindRegistry,
} from '../src/domain/persistence/index.js';
import type { CampaignStore, ScenarioDescriptor, WorkKindRegistry } from '../src/domain/persistence/index.js';
import {
  WorkClassRank,
  createClock,
  simTime,
  simTimeScalar,
  workIdentifier,
} from '../src/domain/time/index.js';
import type { ScheduledWork } from '../src/domain/time/index.js';
import { createSqlitePersistence } from '../src/persistence/index.js';
import type { EncodeWork } from '../src/simulation/persistent-scenario-run.js';
import {
  createPersistentScenario,
  loadPersistentScenario,
  serializeScenarioTrace,
} from '../src/simulation/persistent-scenario-run.js';

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

const monthSequence: readonly CalendarMonth<MonthId>[] = Array.from({ length: 12 }, (_, index) => ({
  id: `m-${String(index + 1).padStart(2, '0')}` as MonthId,
  days: 30,
}));

function calendarConfig(): ScenarioCalendarConfig<MonthId> {
  return {
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
  };
}

function scenarioDescriptor(): ScenarioDescriptor<string> {
  return createScenarioDescriptor({
    scenarioId: deriveAuthoredCanonicalId({ sourceNamespace: 'vs3-fixture', sourceKey: 'campaign' }),
    name: 'vs3-acceptance',
    ...calendarConfig(),
  });
}

function tempWorkspace(label: string): string {
  return mkdtempSync(join(tmpdir(), `histgame-${label}-`));
}

function contentId(key: string): ReturnType<typeof deriveAuthoredCanonicalId> {
  return deriveAuthoredCanonicalId({ sourceNamespace: 'vs3-content', sourceKey: key });
}

const NATION_ID = contentId('nation');
const ENEMY_ID = contentId('enemy-legion');
const BATTLE_OUTCOME = 'decisive';
const BATTLE_EVENT_ID = ledgerEventId(`battle-${BATTLE_OUTCOME}`);
const ECHO_EVENT_ID = ledgerEventId('echo');

type CampaignWork =
  | { readonly kind: 'monthly-advance'; readonly month: number }
  | { readonly kind: 'battle'; readonly outcome: string }
  | { readonly kind: 'echo'; readonly outcome: string };

function encodeWork(work: CampaignWork): EncodeWork {
  if (work.kind === 'monthly-advance') {
    return { workKind: 'monthly-advance', payload: { month: work.month } };
  }
  return { workKind: work.kind, payload: { outcome: work.outcome } };
}

function asPayload(payload: unknown): Record<string, unknown> {
  if (payload === null || typeof payload !== 'object') {
    throw new RangeError('persisted work requires a JSON-safe object payload');
  }
  return payload as Record<string, unknown>;
}

function fullRegistry(): WorkKindRegistry<CampaignWork> {
  const registry = createWorkKindRegistry<CampaignWork>();
  registry.register('monthly-advance', (payload) => ({
    kind: 'monthly-advance',
    month: needNumber(asPayload(payload)['month'], 'month'),
  }));
  registry.register('battle', (payload) => ({
    kind: 'battle',
    outcome: needString(asPayload(payload)['outcome'], 'outcome'),
  }));
  registry.register('echo', (payload) => ({
    kind: 'echo',
    outcome: needString(asPayload(payload)['outcome'], 'outcome'),
  }));
  return registry;
}

function needNumber(value: unknown, what: string): number {
  if (typeof value !== 'number') throw new RangeError(`persisted payload '${what}' must be a number`);
  return value;
}

function needString(value: unknown, what: string): string {
  if (typeof value !== 'string') throw new RangeError(`persisted payload '${what}' must be a string`);
  return value;
}

function scheduled(
  due: number,
  rank: WorkClassRank,
  id: string,
  work: CampaignWork,
): ScheduledWork<CampaignWork> {
  return { dueSimTime: simTime(due), classRank: rank, workIdentifier: workIdentifier(id), work };
}

function monthAdvances(): readonly ScheduledWork<CampaignWork>[] {
  return Array.from({ length: 12 }, (_, month) =>
    scheduled(month * 720, WorkClassRank.world, `month-${month}`, { kind: 'monthly-advance', month }),
  );
}

function battleScript(): readonly ScheduledWork<CampaignWork>[] {
  return [
    scheduled(1440, WorkClassRank.battleResult, 'battle', { kind: 'battle', outcome: BATTLE_OUTCOME }),
    scheduled(1440, WorkClassRank.world, 'echo', { kind: 'echo', outcome: BATTLE_OUTCOME }),
  ];
}

/** The campaign content that runs inside each step transaction (VS-3 fixture). */
function stepContent(campaign: CampaignStore, freeze: () => void): (entry: ScheduledWork<CampaignWork>) => void {
  return (entry) => {
    const work = entry.work;
    if (work.kind === 'monthly-advance') {
      campaign.world.upsertEntity({ id: NATION_ID, kind: 'polity', scalarState: work.month });
      campaign.ledger.appendEvent(
        createLedgerEvent({
          id: `monthly-advance-${work.month}`,
          occurredAtSimTime: entry.dueSimTime,
          type: 'monthly-advance',
          participants: [NATION_ID],
          causes: [],
          magnitude: work.month,
        }),
      );
    } else if (work.kind === 'battle') {
      campaign.world.upsertEntity({ id: ENEMY_ID, kind: 'legion', scalarState: 666 });
      campaign.ledger.appendEvent(
        createLedgerEvent({
          id: BATTLE_EVENT_ID,
          occurredAtSimTime: entry.dueSimTime,
          type: 'battle',
          participants: [NATION_ID, ENEMY_ID],
          causes: [],
          magnitude: 3,
        }),
      );
      freeze();
    } else {
      campaign.ledger.appendEvent(
        createLedgerEvent({
          id: ECHO_EVENT_ID,
          occurredAtSimTime: entry.dueSimTime,
          type: 'battle-echo',
          participants: [NATION_ID],
          causes: [BATTLE_EVENT_ID],
        }),
      );
      campaign.ledger.appendConsequence({ sourceId: BATTLE_EVENT_ID, consequenceId: ECHO_EVENT_ID });
      campaign.world.upsertEntity({ id: ENEMY_ID, kind: 'legion', scalarState: 666 });
      campaign.world.markEntityEnded(ENEMY_ID);
    }
  };
}

function sortedEventIds(events: readonly { readonly id: LedgerEventId }[]): readonly string[] {
  return [...events].map((event) => String(event.id)).sort();
}

describe('VS-3: save at a frozen stop point and continue after destroy-load (E2 + E17a)', () => {
  it('a save -> destroy -> load -> continue reproduces the byte-identical stable trace', () => {
    const dir = tempWorkspace('acceptance');
    const slotsDirectory = join(dir, 'slots');
    const firstLive = createSqlitePersistence({
      databasePath: join(dir, 'live', 'campaign.db'),
      slotsDirectory,
    });
    firstLive.campaign.initializeScenario(scenarioDescriptor());

    const calendar = createScenarioCalendar<MonthId>(calendarConfig());
    const clock = createClock(simTime(0));
    const scenario = createPersistentScenario<CampaignWork, MonthId>({
      clock,
      calendar,
      campaign: firstLive.campaign,
      checkpoints: firstLive.checkpoints,
      encodeWork,
    });
    const content = stepContent(firstLive.campaign, () => scenario.freeze());
    for (const entry of monthAdvances()) scenario.schedule(entry);
    for (const entry of battleScript()) scenario.schedule(entry);

    const held = scenario.runUntilHeld(content);
    expect(held.map((step) => step.workIdentifier)).toEqual(['month-0', 'month-1', 'battle']);
    expect(simTimeScalar(clock.now())).toBe(1440);
    expect(clock.isFrozen()).toBe(true);

    const save = scenario.save('stop-point', 'manual');
    expect(save.ok).toBe(true);
    if (!save.ok) return;
    expect(simTimeScalar(save.savedAtSimTime)).toBe(1440);
    expect(firstLive.campaign.pendingWork.readPendingWork()).toHaveLength(11);

    const loadedSnapshot = firstLive.checkpoints.load(checkpointSlotId('stop-point'));
    expect(loadedSnapshot.savedAtSimTime).toEqual(simTime(1440));
    expect(loadedSnapshot.pendingWork.map((entry) => entry.workKind).sort()).toEqual(
      ['echo', ...Array.from({ length: 10 }, () => 'monthly-advance')].sort(),
    );
    expect(loadedSnapshot.entities.map((entity) => String(entity.id)).sort()).toEqual(
      [String(NATION_ID), String(ENEMY_ID)].sort(),
    );
    expect(sortedEventIds(loadedSnapshot.ledgerEvents)).toEqual(
      ['monthly-advance-0', 'monthly-advance-1', 'battle-decisive'].sort(),
    );

    // Run A continues live to the end; its post-save steps become the oracle.
    scenario.unfreeze();
    scenario.runUntilHeld(content);
    const oracleTrace = scenario.trace();
    expect(oracleTrace).toHaveLength(14);
    expect(simTimeScalar(firstLive.campaign.world.readCurrentSimTime())).toBe(7920);

    // Destroy the live database (as after a cold process exit); only the slot remains.
    firstLive.close();
    rmSync(join(dir, 'live'), { recursive: true, force: true });

    // Continue into a brand-new live database from the immutable slot.
    const secondLive = createSqlitePersistence({
      databasePath: join(dir, 'live2', 'campaign.db'),
      slotsDirectory,
    });
    const loaded = loadPersistentScenario<CampaignWork, MonthId>({
      checkpoints: secondLive.checkpoints,
      slotId: checkpointSlotId('stop-point'),
      campaign: secondLive.campaign,
      workKinds: fullRegistry(),
      monthIds: (id) => id as MonthId,
      encodeWork,
    });

    expect(loaded.snapshot.schemaVersion).toBe(1);
    expect(loaded.snapshot.saveKind).toBe('manual');
    expect(loaded.continuation.clock.isFrozen()).toBe(false);
    expect(loaded.continuation.pendingCount()).toBe(11);
    expect(loaded.continuation.clock.now()).toEqual(simTime(1440));
    expect(secondLive.campaign.readScenario()).toEqual(loadedSnapshot.scenario);

    const echoed = loaded.continuation.runUntilHeld(
      stepContent(secondLive.campaign, () => loaded.continuation.freeze()),
    );
    expect(echoed.map((step) => step.workIdentifier)).toEqual([
      'echo',
      ...Array.from({ length: 10 }, (_, index) => `month-${index + 2}`),
    ]);
    expect(simTimeScalar(secondLive.campaign.world.readCurrentSimTime())).toBe(7920);

    // Byte-identical stable trace through the save boundary.
    expect(serializeScenarioTrace(loaded.continuation.trace())).toBe(
      serializeScenarioTrace(oracleTrace.slice(3)),
    );

    // Deterministic world + ledger continuation, not just a matching trace.
    expect(secondLive.campaign.world.getEntity(NATION_ID)?.scalarState).toBe(11);
    expect(secondLive.campaign.world.getEntity(ENEMY_ID)?.ended).toBe(true);
    const expectedBEvents = [
      ...sortedEventIds(loadedSnapshot.ledgerEvents),
      'echo',
      ...Array.from({ length: 10 }, (_, index) => `monthly-advance-${index + 2}`),
    ].sort();
    expect(sortedEventIds(secondLive.campaign.ledger.events())).toEqual(expectedBEvents);
    expect(secondLive.campaign.ledger.consequenceLinks()).toEqual([
      { sourceId: BATTLE_EVENT_ID, consequenceId: ECHO_EVENT_ID },
    ]);

    // The immutable slot is untouched even though live time has far advanced.
    expect(secondLive.checkpoints.load(checkpointSlotId('stop-point')).savedAtSimTime).toEqual(
      simTime(1440),
    );

    // A fresh continuation can publish new, independent slots on top of the old ones.
    const followup = secondLive.checkpoints.save(checkpointSlotId('follow-up'), 'autosave');
    expect(followup.ok).toBe(true);
    expect(secondLive.checkpoints.listSlots()).toEqual([
      checkpointSlotId('follow-up'),
      checkpointSlotId('stop-point'),
    ]);
    expect(simTimeScalar(secondLive.checkpoints.load(checkpointSlotId('follow-up')).savedAtSimTime)).toBe(7920);

    secondLive.close();
    rmSync(dir, { recursive: true, force: true });
  });

  it('rejects a load whose pending work references an unregistered work kind', () => {
    const dir = tempWorkspace('unregistered');
    const slotsDirectory = join(dir, 'slots');
    const firstLive = createSqlitePersistence({
      databasePath: join(dir, 'live', 'campaign.db'),
      slotsDirectory,
    });
    firstLive.campaign.initializeScenario(scenarioDescriptor());
    const scenario = createPersistentScenario<CampaignWork, MonthId>({
      clock: createClock(simTime(0)),
      calendar: createScenarioCalendar<MonthId>(calendarConfig()),
      campaign: firstLive.campaign,
      checkpoints: firstLive.checkpoints,
      encodeWork,
    });
    for (const entry of battleScript()) scenario.schedule(entry);
    scenario.runUntilHeld(stepContent(firstLive.campaign, () => scenario.freeze()));
    const save = scenario.save('stop-point', 'manual');
    expect(save.ok).toBe(true);
    if (!save.ok) return;
    firstLive.close();

    const secondLive = createSqlitePersistence({
      databasePath: join(dir, 'live2', 'campaign.db'),
      slotsDirectory,
    });
    const registry = createWorkKindRegistry<CampaignWork>();
    registry.register('monthly-advance', (payload) => ({
      kind: 'monthly-advance',
      month: needNumber(asPayload(payload)['month'], 'month'),
    }));

    expect(() =>
      loadPersistentScenario<CampaignWork, MonthId>({
        checkpoints: secondLive.checkpoints,
        slotId: checkpointSlotId('stop-point'),
        campaign: secondLive.campaign,
        workKinds: registry,
        monthIds: (id) => id as MonthId,
        encodeWork,
      }),
    ).toThrow(/No work factory is registered for kind 'echo'/);

    secondLive.close();
    rmSync(dir, { recursive: true, force: true });
  });

  it('rejects a slot carrying a different schema version', () => {
    const dir = tempWorkspace('bad-version');
    const slotsDirectory = join(dir, 'slots');
    const slot = checkpointSlotId('v2');
    const path = join(slotsDirectory, `${slot}.db`);
    craftSlot(path, [
      ['schema_version', '2'],
      ['save_kind', 'manual'],
      ['current_sim_time', '0'],
    ]);

    const composed = createSqlitePersistence({
      databasePath: join(dir, 'live', 'campaign.db'),
      slotsDirectory,
    });
    try {
      expect(() => composed.checkpoints.load(slot)).toThrow(UnsupportedCheckpointVersionError);
    } finally {
      composed.close();
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('rejects a slot that is a valid database but missing its save_kind stamp', () => {
    const dir = tempWorkspace('no-stamp');
    const slotsDirectory = join(dir, 'slots');
    const slot = checkpointSlotId('unstamped');
    craftSlot(join(slotsDirectory, `${slot}.db`), [
      ['schema_version', '1'],
      ['current_sim_time', '0'],
    ]);

    const composed = createSqlitePersistence({
      databasePath: join(dir, 'live', 'campaign.db'),
      slotsDirectory,
    });
    try {
      expect(() => composed.checkpoints.load(slot)).toThrow(CheckpointIntegrityError);
    } finally {
      composed.close();
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('a failed manual save leaves a pre-existing slot byte-for-byte untouched', () => {
    const dir = tempWorkspace('failed-save');
    const slotsDirectory = join(dir, 'slots');
    const slot = checkpointSlotId('garbage');
    const path = join(slotsDirectory, `${slot}.db`);
    mkdirSync(slotsDirectory, { recursive: true });
    writeFileSync(path, 'not-a-sqlite-database');

    const composed = createSqlitePersistence({
      databasePath: join(dir, 'live', 'campaign.db'),
      slotsDirectory,
    });
    try {
      const result = composed.checkpoints.save(slot, 'manual');
      expect(result.ok).toBe(false);
      if (result.ok) return;
      expect(result.reason).toMatch(/already exists/i);
      expect(readFileSync(path, 'utf8')).toBe('not-a-sqlite-database');
    } finally {
      composed.close();
      rmSync(dir, { recursive: true, force: true });
    }
  });
});

function craftSlot(path: string, rows: readonly [string, string][]): void {
  mkdirSync(dirname(path), { recursive: true });
  const db = new Database(path);
  try {
    db.exec('CREATE TABLE meta (key TEXT PRIMARY KEY, value TEXT NOT NULL);');
    const insert = db.prepare('INSERT INTO meta (key, value) VALUES (?, ?)');
    for (const [key, value] of rows) insert.run(key, value);
  } finally {
    db.close();
  }
}

describe('VS-3 remediation regressions (Codex H1/H4/H5, M2)', () => {
  it('H1: a save immediately after scheduling preserves the pending work', () => {
    const dir = tempWorkspace('pending-after-schedule');
    const first = createSqlitePersistence({
      databasePath: join(dir, 'live', 'campaign.db'),
      slotsDirectory: join(dir, 'slots'),
    });
    first.campaign.initializeScenario(scenarioDescriptor());
    const scenario = createPersistentScenario<CampaignWork, MonthId>({
      clock: createClock(simTime(0)),
      calendar: createScenarioCalendar<MonthId>(calendarConfig()),
      campaign: first.campaign,
      checkpoints: first.checkpoints,
      encodeWork,
    });

    scenario.schedule(
      scheduled(10, WorkClassRank.world, 'early', { kind: 'monthly-advance', month: 0 }),
    );

    const save = scenario.save('early-save', 'manual');
    expect(save.ok).toBe(true);
    if (!save.ok) return;
    expect(simTimeScalar(save.savedAtSimTime)).toBe(0);
    expect(first.campaign.pendingWork.readPendingWork()).toHaveLength(1);

    const second = createSqlitePersistence({
      databasePath: join(dir, 'live2', 'campaign.db'),
      slotsDirectory: join(dir, 'slots'),
    });
    const loaded = loadPersistentScenario<CampaignWork, MonthId>({
      checkpoints: second.checkpoints,
      slotId: checkpointSlotId('early-save'),
      campaign: second.campaign,
      workKinds: fullRegistry(),
      monthIds: (id) => id as MonthId,
      encodeWork,
    });
    try {
      expect(loaded.continuation.pendingCount()).toBe(1);
      expect(loaded.snapshot.pendingWork[0]!.dueSimTime).toEqual(simTime(10));
      expect(loaded.snapshot.pendingWork[0]!.workKind).toBe('monthly-advance');
      expect(loaded.snapshot.pendingWork[0]!.payload).toEqual({ month: 0 });
      const executed = loaded.continuation.runUntilHeld(
        stepContent(second.campaign, () => loaded.continuation.freeze()),
      );
      expect(executed.map((step) => step.workIdentifier)).toEqual(['early']);
      expect(simTimeScalar(loaded.continuation.clock.now())).toBe(10);
    } finally {
      first.close();
      second.close();
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('H4: a throwing or rejecting admission leaves the scheduler and mirror unchanged', () => {
    const dir = tempWorkspace('atomic-admission');
    const composed = createSqlitePersistence({
      databasePath: join(dir, 'live', 'campaign.db'),
      slotsDirectory: join(dir, 'slots'),
    });
    composed.campaign.initializeScenario(scenarioDescriptor());
    const scenario = createPersistentScenario<CampaignWork, MonthId>({
      clock: createClock(simTime(0)),
      calendar: createScenarioCalendar<MonthId>(calendarConfig()),
      campaign: composed.campaign,
      checkpoints: composed.checkpoints,
      encodeWork: (work) => {
        if (work.kind === 'monthly-advance') throw new RangeError('refusing to encode');
        return encodeWork(work);
      },
    });
    try {
      expect(() =>
        scenario.schedule(
          scheduled(10, WorkClassRank.world, 'm', { kind: 'monthly-advance', month: 1 }),
        ),
      ).toThrow(/refusing to encode/);
      expect(scenario.pendingCount()).toBe(0);
      expect(scenario.pendingEntries()).toEqual([]);

      scenario.schedule(
        scheduled(10, WorkClassRank.battleResult, 'battle', {
          kind: 'battle',
          outcome: 'decisive',
        }),
      );
      expect(scenario.pendingCount()).toBe(1);
      // A duplicate identifier must reject without touching the mirror.
      expect(() =>
        scenario.schedule(
          scheduled(10, WorkClassRank.battleResult, 'battle', {
            kind: 'battle',
            outcome: 'decisive',
          }),
        ),
      ).toThrow(/Duplicate/);
      expect(scenario.pendingCount()).toBe(1);
      expect(scenario.pendingEntries()).toHaveLength(1);
    } finally {
      composed.close();
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('H4: the mirror captures exactly the envelope the scheduler accepted (changing getters)', () => {
    const dir = tempWorkspace('capture-once');
    const composed = createSqlitePersistence({
      databasePath: join(dir, 'live', 'campaign.db'),
      slotsDirectory: join(dir, 'slots'),
    });
    composed.campaign.initializeScenario(scenarioDescriptor());
    const scenario = createPersistentScenario<CampaignWork, MonthId>({
      clock: createClock(simTime(0)),
      calendar: createScenarioCalendar<MonthId>(calendarConfig()),
      campaign: composed.campaign,
      checkpoints: composed.checkpoints,
      encodeWork,
    });
    try {
      let reads = 0;
      const hostile = {
        get workIdentifier() {
          reads += 1;
          return workIdentifier(reads === 1 ? 'origin' : 'second-identity');
        },
        dueSimTime: simTime(10),
        classRank: WorkClassRank.world,
        work: { kind: 'battle' as const, outcome: 'decisive' },
      };
      const accepted = scenario.schedule(hostile);
      expect(reads).toBe(1);
      expect(accepted.workIdentifier).toBe(workIdentifier('origin'));
      expect(scenario.pendingEntries()[0]!.workIdentifier).toBe(workIdentifier('origin'));
    } finally {
      composed.close();
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('H5: a failed step rolls back its transaction and permanently invalidates the continuation', () => {
    const dir = tempWorkspace('invalidated');
    const composed = createSqlitePersistence({
      databasePath: join(dir, 'live', 'campaign.db'),
      slotsDirectory: join(dir, 'slots'),
    });
    composed.campaign.initializeScenario(scenarioDescriptor());
    const scenario = createPersistentScenario<CampaignWork, MonthId>({
      clock: createClock(simTime(0)),
      calendar: createScenarioCalendar<MonthId>(calendarConfig()),
      campaign: composed.campaign,
      checkpoints: composed.checkpoints,
      encodeWork,
    });
    scenario.schedule(
      scheduled(0, WorkClassRank.world, 'ok', { kind: 'monthly-advance', month: 1 }),
    );
    scenario.schedule(
      scheduled(720, WorkClassRank.world, 'boom', { kind: 'monthly-advance', month: 2 }),
    );
    try {
      expect(() =>
        scenario.runUntilHeld((entry) => {
          if (String(entry.workIdentifier) === 'boom') {
            composed.campaign.world.upsertEntity({ id: NATION_ID, kind: 'polity', scalarState: 999 });
            throw new RangeError('boom inside the step');
          }
          composed.campaign.world.upsertEntity({ id: NATION_ID, kind: 'polity', scalarState: 1 });
        }),
      ).toThrow(/boom inside the step/);
      // The successful step committed; the failing one fully rolled back.
      expect(scenario.trace()).toHaveLength(1);
      expect(composed.campaign.world.getEntity(NATION_ID)?.scalarState).toBe(1);

      // The continuation is permanently invalid: no schedule, run or save.
      expect(() => scenario.save('x', 'autosave')).toThrow(/invalid/i);
      expect(() => scenario.runUntilHeld()).toThrow(/invalid/i);
      expect(() =>
        scenario.schedule(
          scheduled(1440, WorkClassRank.world, 'later', {
            kind: 'monthly-advance',
            month: 3,
          }),
        ),
      ).toThrow(/invalid/i);
      expect(composed.checkpoints.listSlots()).toEqual([]);
    } finally {
      composed.close();
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('H6: a non-JSON-safe encoded payload rejects the schedule leaving scheduler and mirror untouched', () => {
    const dir = tempWorkspace('unsafe-payload');
    const composed = createSqlitePersistence({
      databasePath: join(dir, 'live', 'campaign.db'),
      slotsDirectory: join(dir, 'slots'),
    });
    composed.campaign.initializeScenario(scenarioDescriptor());
    const customEncode = (work: CampaignWork): { readonly workKind: string; readonly payload: unknown } => {
      switch (work.kind) {
        case 'battle':
          return { workKind: 'battle', payload: { outcome: new Date(0) } };
        case 'monthly-advance':
          return { workKind: 'monthly-advance', payload: { month: work.month } };
        case 'echo':
          return { workKind: 'echo', payload: { outcome: work.outcome } };
      }
    };
    const scenario = createPersistentScenario<CampaignWork, MonthId>({
      clock: createClock(simTime(0)),
      calendar: createScenarioCalendar<MonthId>(calendarConfig()),
      campaign: composed.campaign,
      checkpoints: composed.checkpoints,
      encodeWork: customEncode,
    });
    try {
      // A Date stringifies successfully but is not a JSON-safe plain payload.
      expect(() =>
        scenario.schedule(scheduled(0, WorkClassRank.battleResult, 'battle', { kind: 'battle', outcome: 'x' })),
      ).toThrow(/JSON-safe|Date|binary/i);
      expect(scenario.pendingCount()).toBe(0);
      expect(scenario.pendingEntries()).toHaveLength(0);

      // The scheduler is still usable after the refused admission.
      scenario.schedule(
        scheduled(0, WorkClassRank.world, 'month-0', { kind: 'monthly-advance', month: 0 }),
      );
      expect(scenario.pendingCount()).toBe(1);
      expect(scenario.pendingEntries()).toHaveLength(1);
      const [only] = scenario.pendingEntries();
      expect(only).toBeDefined();
      expect(only?.payload).toEqual({ month: 0 });
    } finally {
      composed.close();
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('M2: an asynchronous (thenable) step result invalidates the continuation', async () => {
    const dir = tempWorkspace('thenable');
    const composed = createSqlitePersistence({
      databasePath: join(dir, 'live', 'campaign.db'),
      slotsDirectory: join(dir, 'slots'),
    });
    composed.campaign.initializeScenario(scenarioDescriptor());
    const scenario = createPersistentScenario<CampaignWork, MonthId>({
      clock: createClock(simTime(0)),
      calendar: createScenarioCalendar<MonthId>(calendarConfig()),
      campaign: composed.campaign,
      checkpoints: composed.checkpoints,
      encodeWork,
    });
    scenario.schedule(
      scheduled(0, WorkClassRank.world, 'async', { kind: 'monthly-advance', month: 1 }),
    );
    try {
      expect(() => scenario.runUntilHeld(() => ({ then: () => undefined }))).toThrow(/thenable|asynchronous/i);
      expect(scenario.trace()).toHaveLength(0);
      expect(() => scenario.save('x', 'autosave')).toThrow(/invalid/i);
    } finally {
      composed.close();
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('H1: a save attempted during dispatch is rejected and the step fails instead', () => {
    const dir = tempWorkspace('save-during-dispatch');
    const composed = createSqlitePersistence({
      databasePath: join(dir, 'live', 'campaign.db'),
      slotsDirectory: join(dir, 'slots'),
    });
    composed.campaign.initializeScenario(scenarioDescriptor());
    const scenario = createPersistentScenario<CampaignWork, MonthId>({
      clock: createClock(simTime(0)),
      calendar: createScenarioCalendar<MonthId>(calendarConfig()),
      campaign: composed.campaign,
      checkpoints: composed.checkpoints,
      encodeWork,
    });
    scenario.schedule(
      scheduled(0, WorkClassRank.world, 'step', { kind: 'monthly-advance', month: 1 }),
    );
    try {
      expect(() =>
        scenario.runUntilHeld(() => {
          scenario.save('mid-dispatch', 'autosave');
        }),
      ).toThrow(/dispatched/);
      expect(() => scenario.save('later', 'autosave')).toThrow(/invalid/i);
      expect(composed.checkpoints.listSlots()).toEqual([]);
    } finally {
      composed.close();
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('acceptance: an older save resumes into an independent alternate future', () => {
    const dir = tempWorkspace('alternate-future');
    const firstLive = createSqlitePersistence({
      databasePath: join(dir, 'live', 'campaign.db'),
      slotsDirectory: join(dir, 'slots'),
    });
    firstLive.campaign.initializeScenario(scenarioDescriptor());
    const calendar = createScenarioCalendar<MonthId>(calendarConfig());
    const scenario = createPersistentScenario<CampaignWork, MonthId>({
      clock: createClock(simTime(0)),
      calendar,
      campaign: firstLive.campaign,
      checkpoints: firstLive.checkpoints,
      encodeWork,
    });
    const content = stepContent(firstLive.campaign, () => scenario.freeze());
    for (const entry of monthAdvances()) scenario.schedule(entry);
    for (const entry of battleScript()) scenario.schedule(entry);
    scenario.runUntilHeld(content);
    const oracleSave = scenario.save('stop-point', 'manual');
    expect(oracleSave.ok).toBe(true);
    if (!oracleSave.ok) return;
    scenario.unfreeze();
    scenario.runUntilHeld(content);
    const oracleTrace = scenario.trace();
    firstLive.close();
    rmSync(join(dir, 'live'), { recursive: true, force: true });

    const secondLive = createSqlitePersistence({
      databasePath: join(dir, 'live2', 'campaign.db'),
      slotsDirectory: join(dir, 'slots'),
    });
    const loaded = loadPersistentScenario<CampaignWork, MonthId>({
      checkpoints: secondLive.checkpoints,
      slotId: checkpointSlotId('stop-point'),
      campaign: secondLive.campaign,
      workKinds: fullRegistry(),
      monthIds: (id) => id as MonthId,
      encodeWork,
    });
    try {
      // The alternate continuation schedules genuinely new work.
      loaded.continuation.schedule(
        scheduled(2160, WorkClassRank.world, 'month-extra', {
          kind: 'monthly-advance',
          month: 50,
        }),
      );
      loaded.continuation.unfreeze();
      const alternate = loaded.continuation.runUntilHeld(
        stepContent(secondLive.campaign, () => loaded.continuation.freeze()),
      );
      expect(serializeScenarioTrace(loaded.continuation.trace())).not.toBe(
        serializeScenarioTrace(oracleTrace),
      );
      expect(alternate.map((step) => step.workIdentifier)).toContain('month-extra');
      // 14 oracle steps total, 3 before the save, 11 after, plus the extra work.
      expect(loaded.continuation.trace()).toHaveLength(oracleTrace.length - 2);

      // The immutable slot the continuation came from is untouched.
      expect(
        simTimeScalar(secondLive.checkpoints.load(checkpointSlotId('stop-point')).savedAtSimTime),
      ).toBe(1440);
    } finally {
      secondLive.close();
      rmSync(dir, { recursive: true, force: true });
    }
  });
});