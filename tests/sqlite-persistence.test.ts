import { mkdirSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import Database from 'better-sqlite3';
import type { CalendarMonth, ScenarioCalendarConfig } from '../src/domain/calendar/index.js';
import { deriveAuthoredCanonicalId } from '../src/domain/identity/index.js';
import { createLedgerEvent, ledgerEventId } from '../src/domain/ledger/index.js';
import { checkpointSlotId, createScenarioDescriptor } from '../src/domain/persistence/index.js';
import type { ScenarioDescriptor } from '../src/domain/persistence/index.js';
import {
  CheckpointIntegrityError,
  CheckpointNotFoundError,
} from '../src/domain/persistence/index.js';
import { simTime, simTimeScalar, workIdentifier, WorkClassRank } from '../src/domain/time/index.js';
import { createSqlitePersistence, openSqliteCampaignDatabase, SCHEMA_VERSION } from '../src/persistence/index.js';

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

function testScenarioDescriptor(): ScenarioDescriptor<string> {
  return createScenarioDescriptor({
    scenarioId: deriveAuthoredCanonicalId({ sourceNamespace: 'vs3-fixture', sourceKey: 'campaign' }),
    name: 'test-campaign',
    ...calendarConfig(),
  });
}

function entityId(key: string): ReturnType<typeof deriveAuthoredCanonicalId> {
  return deriveAuthoredCanonicalId({ sourceNamespace: 'vs3-fixture', sourceKey: key });
}

function tempWorkspace(label: string): string {
  return mkdtempSync(join(tmpdir(), `histgame-${label}-`));
}

describe('VS-3 persistence: live campaign store (ports over SQLite)', () => {
  it('initializes a scenario exactly once and mirrors the epoch SimTime', () => {
    const dir = tempWorkspace('init');
    const { campaign, close } = createSqlitePersistence({
      databasePath: join(dir, 'live', 'campaign.db'),
      slotsDirectory: join(dir, 'slots'),
    });
    try {
      const owned = testScenarioDescriptor();
      expect(campaign.readScenario()).toBe(null);
      campaign.initializeScenario(owned);
      expect(campaign.readScenario()).toEqual(owned);
      expect(simTimeScalar(campaign.world.readCurrentSimTime())).toBe(0);
      expect(() => campaign.initializeScenario(owned)).toThrow(RangeError);
    } finally {
      close();
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('upserts entities change-aware and keeps ends permanent', () => {
    const dir = tempWorkspace('entities');
    const { campaign, close } = createSqlitePersistence({
      databasePath: join(dir, 'live', 'campaign.db'),
      slotsDirectory: join(dir, 'slots'),
    });
    try {
      campaign.initializeScenario(testScenarioDescriptor());
      const id = entityId('legion-x');
      campaign.world.upsertEntity({ id, kind: 'legion', scalarState: 42 });
      const pulled = campaign.world.getEntity(id);
      expect(pulled).not.toBe(null);
      expect(pulled?.scalarState).toBe(42);
      expect(pulled?.ended).toBe(false);

      campaign.world.upsertEntity({ id, kind: 'legion', scalarState: 55 });
      expect(campaign.world.getEntity(id)?.scalarState).toBe(55);
      expect(campaign.world.allEntities()).toHaveLength(1);

      expect(campaign.world.markEntityEnded(id).ended).toBe(true);
      expect(campaign.world.getEntity(id)?.ended).toBe(true);
    } finally {
      close();
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('keeps the ledger append-only and rejects dangling consequence links', () => {
    const dir = tempWorkspace('ledger');
    const { campaign, close } = createSqlitePersistence({
      databasePath: join(dir, 'live', 'campaign.db'),
      slotsDirectory: join(dir, 'slots'),
    });
    try {
      campaign.initializeScenario(testScenarioDescriptor());
      const event = createLedgerEvent({
        id: ledgerEventId('e-1'),
        occurredAtSimTime: simTime(100),
        type: 'battle-won',
        participants: [],
        magnitude: 3,
        causes: [],
      });
      campaign.ledger.appendEvent(event);
      expect(campaign.ledger.eventById(ledgerEventId('e-1'))).not.toBe(null);
      expect(() => campaign.ledger.appendEvent(event)).toThrow(RangeError);

      const link = { sourceId: event.id, consequenceId: ledgerEventId('e-2') };
      expect(() => campaign.ledger.appendConsequence(link)).toThrow(RangeError);

      const followUp = createLedgerEvent({
        id: ledgerEventId('e-2'),
        occurredAtSimTime: simTime(200),
        type: 'territory-annexed',
        participants: [],
        causes: [event.id],
      });
      campaign.ledger.appendEvent(followUp);
      campaign.ledger.appendConsequence(link);
      expect(() => campaign.ledger.appendConsequence(link)).toThrow(RangeError);

      expect(campaign.ledger.events().map((item) => String(item.id))).toEqual(['e-1', 'e-2']);
      expect(campaign.ledger.consequenceLinks()).toEqual([link]);
    } finally {
      close();
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('commits pending-work mirror and SimTime atomically in runInTransaction', () => {
    const dir = tempWorkspace('pending');
    const { campaign, close } = createSqlitePersistence({
      databasePath: join(dir, 'live', 'campaign.db'),
      slotsDirectory: join(dir, 'slots'),
    });
    try {
      campaign.initializeScenario(testScenarioDescriptor());
      const entries = [
        {
          workIdentifier: workIdentifier('monthly-01'),
          classRank: WorkClassRank.world,
          dueSimTime: simTime(720),
          workKind: 'monthly-advance',
          payload: { month: 1 },
        },
        {
          workIdentifier: workIdentifier('battle-apply'),
          classRank: WorkClassRank.battleResult,
          dueSimTime: simTime(1440),
          workKind: 'battle-result-apply',
          payload: { outcome: 'decisive' },
        },
      ];
      campaign.runInTransaction(() => {
        campaign.pendingWork.writePendingWork(entries);
        campaign.world.writeCurrentSimTime(simTime(1440));
      });
      const byIdentifier = (left: { readonly workIdentifier: unknown }, right: { readonly workIdentifier: unknown }): number =>
        String(left.workIdentifier).localeCompare(String(right.workIdentifier));
      expect([...campaign.pendingWork.readPendingWork()].sort(byIdentifier)).toEqual([...entries].sort(byIdentifier));
      expect(simTimeScalar(campaign.world.readCurrentSimTime())).toBe(1440);

      campaign.pendingWork.writePendingWork([entries[0]!]);
      expect(campaign.pendingWork.readPendingWork()).toEqual([entries[0]]);
    } finally {
      close();
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('reopens the same live database with schema version intact', () => {
    const dir = tempWorkspace('version');
    const databasePath = join(dir, 'live', 'campaign.db');
    const slotsDirectory = join(dir, 'slots');
    const first = createSqlitePersistence({ databasePath, slotsDirectory });
    first.campaign.initializeScenario(testScenarioDescriptor());
    first.close();

    const reopened = createSqlitePersistence({ databasePath, slotsDirectory });
    expect(simTimeScalar(reopened.campaign.world.readCurrentSimTime())).toBe(0);
    reopened.close();
    rmSync(dir, { recursive: true, force: true });
  });
});

describe('VS-3 persistence: immutable checkpoint store', () => {
  it('saves a verified slot and loads a faithful snapshot read-only', () => {
    const dir = tempWorkspace('checkpoints');
    const composed = createSqlitePersistence({
      databasePath: join(dir, 'live', 'campaign.db'),
      slotsDirectory: join(dir, 'slots'),
    });
    const { campaign, checkpoints, close } = composed;
    try {
      campaign.initializeScenario(testScenarioDescriptor());
      const unit = entityId('unit-x');

      campaign.runInTransaction(() => {
        campaign.world.upsertEntity({ id: unit, kind: 'unit', scalarState: 10 });
        campaign.world.writeCurrentSimTime(simTime(720));
        campaign.ledger.appendEvent(
          createLedgerEvent({
            id: ledgerEventId('e-step-1'),
            occurredAtSimTime: simTime(720),
            type: 'frontier-advanced',
            participants: [unit],
            causes: [],
          }),
        );
        campaign.pendingWork.writePendingWork([
          {
            workIdentifier: workIdentifier('next-move'),
            classRank: WorkClassRank.world,
            dueSimTime: simTime(1440),
            workKind: 'move',
            payload: { target: 1 },
          },
        ]);
      });

      const slot = checkpointSlotId('slot-snapshot');
      const result = checkpoints.save(slot, 'manual');
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(simTimeScalar(result.savedAtSimTime)).toBe(720);

      expect(checkpoints.listSlots()).toEqual([slot]);

      const loaded = checkpoints.load(slot);
      expect(loaded.savedAtSimTime).toEqual(simTime(720));
      expect(loaded.schemaVersion).toBe(SCHEMA_VERSION);
      expect(loaded.saveKind).toBe('manual');
      expect(loaded.entities.map((entity) => entity.scalarState)).toEqual([10]);
      expect(loaded.ledgerEvents.map((event) => String(event.id))).toEqual(['e-step-1']);
      expect(loaded.pendingWork).toHaveLength(1);
      expect(loaded.scenario.scenarioId).toBe(testScenarioDescriptor().scenarioId);

      // A manual save never overwrites an existing immutable slot.
      const second = checkpoints.save(slot, 'manual');
      expect(second.ok).toBe(false);

      // An autosave owns only its own slot and may overwrite it.
      const autoslot = checkpointSlotId('autosave');
      const third = checkpoints.save(autoslot, 'autosave');
      expect(third.ok).toBe(true);
      const fourth = checkpoints.save(autoslot, 'autosave');
      expect(fourth.ok).toBe(true);
      expect(checkpoints.listSlots()).toEqual([autoslot, slot]);
    } finally {
      close();
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('raises CheckpointNotFoundError for a missing slot', () => {
    const dir = tempWorkspace('checkpoints-missing');
    const composed = createSqlitePersistence({
      databasePath: join(dir, 'live', 'campaign.db'),
      slotsDirectory: join(dir, 'slots'),
    });
    const { checkpoints, close } = composed;
    try {
      expect(() => checkpoints.load(checkpointSlotId('nope'))).toThrow(CheckpointNotFoundError);
    } finally {
      close();
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('exposes the live store alone for a campaign without save slots', () => {
    const dir = tempWorkspace('live-only');
    const opened = openSqliteCampaignDatabase(join(dir, 'campaign.db'));
    try {
      opened.store.initializeScenario(testScenarioDescriptor());
      expect(simTimeScalar(opened.store.world.readCurrentSimTime())).toBe(0);
    } finally {
      opened.sqlite.close();
      rmSync(dir, { recursive: true, force: true });
    }
  });
});

describe('VS-3 remediation regressions (Codex H2/H3, M1) and acceptance', () => {
  it('H2: an autosave never replaces a manual slot, and a manual never replaces anything', () => {
    const dir = tempWorkspace('slot-collisions');
    const composed = createSqlitePersistence({
      databasePath: join(dir, 'live', 'campaign.db'),
      slotsDirectory: join(dir, 'slots'),
    });
    const { campaign, checkpoints, close } = composed;
    try {
      campaign.initializeScenario(testScenarioDescriptor());
      campaign.world.writeCurrentSimTime(simTime(50));

      const manualSlot = checkpointSlotId('shared');
      expect(checkpoints.save(manualSlot, 'manual').ok).toBe(true);

      const autosaveOverManual = checkpoints.save(manualSlot, 'autosave');
      expect(autosaveOverManual.ok).toBe(false);
      if (!autosaveOverManual.ok) {
        expect(autosaveOverManual.reason).toMatch(/manual|autosave/i);
      }
      const manualAfter = checkpoints.load(manualSlot);
      expect(manualAfter.saveKind).toBe('manual');
      expect(simTimeScalar(manualAfter.savedAtSimTime)).toBe(50);

      const autoSlot = checkpointSlotId('other');
      expect(checkpoints.save(autoSlot, 'autosave').ok).toBe(true);
      const manualOverAutosave = checkpoints.save(autoSlot, 'manual');
      expect(manualOverAutosave.ok).toBe(false);
      expect(checkpoints.load(autoSlot).saveKind).toBe('autosave');

      // Autosave still replaces its own autosave slot (existing behaviour).
      campaign.world.writeCurrentSimTime(simTime(120));
      expect(checkpoints.save(autoSlot, 'autosave').ok).toBe(true);
      expect(simTimeScalar(checkpoints.load(autoSlot).savedAtSimTime)).toBe(120);
      expect(checkpoints.listSlots()).toEqual([checkpointSlotId('other'), checkpointSlotId('shared')]);
    } finally {
      close();
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('H3: path-traversal slot ids are rejected by the domain validator', () => {
    const unsafe = [
      '../escaped',
      '..\\escaped',
      'a/b',
      'a\\b',
      'a:b',
      '..',
      '.',
      'x\u0000y',
      '',
    ] as const;
    for (const value of unsafe) {
      expect(() => checkpointSlotId(value)).toThrow(RangeError);
    }
    expect(() => checkpointSlotId('stop-point')).not.toThrow();
    expect(() => checkpointSlotId('a b-c_d')).not.toThrow();
  });

  it('H3: the storage layer refuses traversal slot ids before touching the filesystem', () => {
    const dir = tempWorkspace('traversal');
    const composed = createSqlitePersistence({
      databasePath: join(dir, 'live', 'campaign.db'),
      slotsDirectory: join(dir, 'slots'),
    });
    const { checkpoints, close } = composed;
    try {
      expect(() => checkpoints.save(checkpointSlotId('../evil'), 'manual')).toThrow(RangeError);
      expect(() => checkpoints.load(checkpointSlotId('../evil'))).toThrow(RangeError);
      expect(checkpoints.listSlots()).toEqual([]);
    } finally {
      close();
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('M1: a ledger event cannot reference a cause that is not recorded yet', () => {
    const dir = tempWorkspace('dangling-cause');
    const { campaign, close } = createSqlitePersistence({
      databasePath: join(dir, 'live', 'campaign.db'),
      slotsDirectory: join(dir, 'slots'),
    });
    try {
      campaign.initializeScenario(testScenarioDescriptor());
      campaign.ledger.appendEvent(
        createLedgerEvent({
          id: 'before',
          occurredAtSimTime: simTime(0),
          type: 'prelude',
          causes: [],
        }),
      );
      expect(() =>
        campaign.ledger.appendEvent(
          createLedgerEvent({
            id: 'after',
            occurredAtSimTime: simTime(10),
            type: 'consequence',
            causes: [ledgerEventId('never-recorded')],
          }),
        ),
      ).toThrow(/before it is recorded/);

      campaign.ledger.appendEvent(
        createLedgerEvent({
          id: 'after',
          occurredAtSimTime: simTime(10),
          type: 'consequence',
          causes: [ledgerEventId('before')],
        }),
      );
      expect(campaign.ledger.eventById(ledgerEventId('before'))).not.toBe(null);
      expect(campaign.ledger.eventById(ledgerEventId('after'))).not.toBe(null);
    } finally {
      close();
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('M1: checkpoint verification rejects a slot whose ledger has dangling causes', () => {
    const dir = tempWorkspace('slot-dangling-cause');
    const composed = createSqlitePersistence({
      databasePath: join(dir, 'live', 'campaign.db'),
      slotsDirectory: join(dir, 'slots'),
    });
    const { campaign, checkpoints, close } = composed;
    try {
      campaign.initializeScenario(testScenarioDescriptor());
      campaign.ledger.appendEvent(
        createLedgerEvent({
          id: 'a-1',
          occurredAtSimTime: simTime(0),
          type: 'step',
          causes: [],
        }),
      );
      const slot = checkpointSlotId('coherent');
      expect(checkpoints.save(slot, 'manual').ok).toBe(true);

      const path = join(dir, 'slots', `${slot}.db`);
      const handle = new Database(path);
      try {
        handle
          .prepare(
            `INSERT INTO ledger_event
             (id, occurred_at_sim_time, event_type, participants, factions, locations,
              magnitude, causes, witnesses)
             VALUES ('ghost', '0', 'ghost-event', '[]', '[]', '[]', NULL, '["missing"]', '[]')`,
          )
          .run();
      } finally {
        handle.close();
      }
      expect(() => checkpoints.load(slot)).toThrow(CheckpointIntegrityError);
    } finally {
      close();
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('M2-checkpoint: loading restores canonical state from the entity rows, never by replaying the ledger', () => {
    const dir = tempWorkspace('no-replay');
    const composed = createSqlitePersistence({
      databasePath: join(dir, 'live', 'campaign.db'),
      slotsDirectory: join(dir, 'slots'),
    });
    const { campaign, checkpoints, close } = composed;
    try {
      campaign.initializeScenario(testScenarioDescriptor());
      const unit = entityId('unit-x');
      campaign.runInTransaction(() => {
        campaign.world.upsertEntity({ id: unit, kind: 'unit', scalarState: 10 });
        campaign.ledger.appendEvent(
          createLedgerEvent({
            id: 'monthly-advance-0',
            occurredAtSimTime: simTime(0),
            type: 'monthly-advance',
            participants: [unit],
            magnitude: 10,
            causes: [],
          }),
        );
        campaign.world.writeCurrentSimTime(simTime(100));
      });
      const slot = checkpointSlotId('noreplay');
      expect(checkpoints.save(slot, 'manual').ok).toBe(true);

      // Adversarially edit the immutable slot so the entity row disagrees with
      // what a ledger replay would produce. Loading must honour the entity rows.
      const path = join(dir, 'slots', `${slot}.db`);
      const handle = new Database(path);
      try {
        handle.prepare('UPDATE entity SET scalar_state = ? WHERE id = ?').run(99, String(unit));
      } finally {
        handle.close();
      }
      const loaded = checkpoints.load(slot);
      expect(loaded.entities.find((entity) => entity.id === unit)?.scalarState).toBe(99);
      expect(loaded.ledgerEvents.map((event) => String(event.id))).toEqual(['monthly-advance-0']);
      expect(simTimeScalar(loaded.savedAtSimTime)).toBe(100);
    } finally {
      close();
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('acceptance: a mid-save autosave failure preserves the previous valid autosave slot', () => {
    const dir = tempWorkspace('failed-autosave');
    const composed = createSqlitePersistence({
      databasePath: join(dir, 'live', 'campaign.db'),
      slotsDirectory: join(dir, 'slots'),
    });
    const { campaign, checkpoints, close } = composed;
    try {
      campaign.initializeScenario(testScenarioDescriptor());
      campaign.runInTransaction(() => {
        campaign.pendingWork.writePendingWork([
          {
            workIdentifier: workIdentifier('move'),
            classRank: WorkClassRank.world,
            dueSimTime: simTime(1440),
            workKind: 'move',
            payload: { target: 1 },
          },
        ]);
        campaign.world.writeCurrentSimTime(simTime(900));
      });
      const slot = checkpointSlotId('autosave');
      const first = checkpoints.save(slot, 'autosave');
      expect(first.ok).toBe(true);
      if (!first.ok) return;

      // Force a mid-save failure: the staging path is presented as a directory,
      // so VACUUM INTO cannot create the staged copy.
      mkdirSync(join(dir, 'slots', '~autosave.tmp.db'), { recursive: true });
      const second = checkpoints.save(slot, 'autosave');
      expect(second.ok).toBe(false);
      if (!second.ok) {
        expect(second.reason.length).toBeGreaterThan(0);
      }

      const surviving = checkpoints.load(slot);
      expect(surviving.saveKind).toBe('autosave');
      expect(simTimeScalar(surviving.savedAtSimTime)).toBe(900);
      expect(surviving.pendingWork).toHaveLength(1);
      expect(checkpoints.listSlots()).toEqual([slot]);
    } finally {
      close();
      rmSync(dir, { recursive: true, force: true });
    }
  });
});