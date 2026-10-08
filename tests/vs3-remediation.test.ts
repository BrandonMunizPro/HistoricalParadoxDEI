import { mkdtempSync, readFileSync, readdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import Database from 'better-sqlite3';
import { createScenarioCalendar } from '../src/domain/calendar/index.js';
import { deriveAuthoredCanonicalId } from '../src/domain/identity/index.js';
import { createLedgerEvent } from '../src/domain/ledger/index.js';
import {
  captureJsonSafePayload, checkpointSlotId, createPersistedWorkEntry,
  createScenarioDescriptor, createWorkKindRegistry,
} from '../src/domain/persistence/index.js';
import type { CampaignStore, CheckpointSlotId } from '../src/domain/persistence/index.js';
import { createClock, simTime, workIdentifier, WorkClassRank } from '../src/domain/time/index.js';
import type { ScheduledWork } from '../src/domain/time/index.js';
import { createSqlitePersistence, createSqliteCheckpointStore, openSqliteCampaignDatabase } from '../src/persistence/index.js';
import { createPersistentScenario, loadPersistentScenario } from '../src/simulation/persistent-scenario-run.js';

const descriptor = createScenarioDescriptor({
  scenarioId: deriveAuthoredCanonicalId({ sourceNamespace: 'remediation', sourceKey: 'scenario' }),
  name: 'remediation', unitsPerDay: 24, epochSimTime: simTime(0), epochDayNumber: 0,
  era: { name: 'era', yearNumberDirection: 'ascending', firstYearNumber: 1,
    firstYearStartDayNumber: 0, monthSequence: [{ id: 'month', days: 30 }] },
});
const entityId = deriveAuthoredCanonicalId({ sourceNamespace: 'remediation', sourceKey: 'entity' });
const cleanup: (() => void)[] = [];
afterEach(() => {
  vi.restoreAllMocks();
  for (const release of cleanup.splice(0).reverse()) release();
});
function workspace(): string {
  const directory = mkdtempSync(join(tmpdir(), 'historicalgame-remediation-'));
  cleanup.push(() => rmSync(directory, { recursive: true, force: true }));
  return directory;
}
function persistence(directory: string, name = 'live') {
  const result = createSqlitePersistence({ databasePath: join(directory, `${name}.db`), slotsDirectory: join(directory, 'slots') });
  cleanup.push(result.close);
  return result;
}
function work(id: string, due = 10, value = 1): ScheduledWork<number> {
  return { workIdentifier: workIdentifier(id), dueSimTime: simTime(due), classRank: WorkClassRank.world, work: value };
}
const encodeWork = (value: number) => ({ workKind: 'scalar', payload: value });
function scenario(directory: string, campaignOverride?: (campaign: CampaignStore) => CampaignStore) {
  const live = persistence(directory);
  live.campaign.initializeScenario(descriptor);
  const run = createPersistentScenario({
    clock: createClock(simTime(0)), calendar: createScenarioCalendar(descriptor),
    campaign: campaignOverride?.(live.campaign) ?? live.campaign, checkpoints: live.checkpoints, encodeWork,
  });
  return { live, run };
}
function load(directory: string, slot = 'checkpoint', name = 'loaded') {
  const live = persistence(directory, name);
  const registry = createWorkKindRegistry<number>();
  registry.register('scalar', (value) => {
    if (typeof value !== 'number') throw new RangeError('Expected scalar payload');
    return value;
  });
  const loaded = loadPersistentScenario({ checkpoints: live.checkpoints, slotId: checkpointSlotId(slot),
    campaign: live.campaign, workKinds: registry, monthIds: (id) => id, encodeWork });
  return { live, ...loaded };
}

describe('VS3 narrow boundary regressions', () => {
  it('H1: work scheduled after a committed step survives a save at exact live time', () => {
    const directory = workspace();
    const { live, run } = scenario(directory);
    run.schedule(work('first', 10));
    run.runUntilHeld();
    run.schedule(work('second', 20, 2));
    expect(run.save('checkpoint', 'manual')).toMatchObject({ ok: true, savedAtSimTime: 10 });
    const restored = load(directory);
    expect(restored.continuation.clock.now()).toBe(simTime(10));
    const executed: number[] = [];
    restored.continuation.runUntilHeld((entry) => { executed.push(entry.work); });
    expect(executed).toEqual([2]);
    expect(live.checkpoints.load(checkpointSlotId('checkpoint')).pendingWork).toHaveLength(1);
  });

  it('H4: every caller-controlled envelope field is read once', () => {
    const { run } = scenario(workspace());
    const reads = { due: 0, rank: 0, id: 0, value: 0 };
    const accepted = run.schedule({
      get dueSimTime() { return simTime(++reads.due === 1 ? 10 : 999); },
      get classRank() { return ++reads.rank === 1 ? WorkClassRank.world : WorkClassRank.battleResult; },
      get workIdentifier() { return workIdentifier(++reads.id === 1 ? 'first' : 'changed'); },
      get work() { return ++reads.value; },
    });
    expect(reads).toEqual({ due: 1, rank: 1, id: 1, value: 1 });
    expect(accepted).toEqual(work('first'));
    expect(run.pendingEntries()[0]).toMatchObject({ dueSimTime: 10, classRank: WorkClassRank.world, workIdentifier: 'first', payload: 1 });
  });

  it('H5: reusing a consumed identifier keeps its new pending descriptor across restart', () => {
    const directory = workspace();
    const { run } = scenario(directory);
    run.schedule(work('repeat', 10));
    run.runUntilHeld(() => {
      run.schedule(work('repeat', 10, 2));
      run.freeze();
    });
    expect(run.pendingCount()).toBe(1);
    expect(run.pendingEntries()).toHaveLength(1);
    expect(run.save('checkpoint', 'manual').ok).toBe(true);
    const restored = load(directory);
    const executed: number[] = [];
    restored.continuation.runUntilHeld((entry) => { executed.push(entry.work); });
    expect(executed).toEqual([2]);
  });

  it('H5: a failure after callback completion rolls back SQLite and invalidates execution/save', () => {
    const { run, live } = scenario(workspace(), (campaign) => ({ ...campaign,
      runInTransaction: <T>(callback: () => T): T => campaign.runInTransaction(() => {
        callback();
        throw new Error('forced transaction completion failure');
      }),
    }));
    run.schedule(work('failed'));
    expect(() => run.runUntilHeld(() => {
      live.campaign.world.upsertEntity({ id: entityId, kind: 'unit', scalarState: 100 });
    })).toThrow(/transaction completion/);
    expect(live.campaign.world.getEntity(entityId)).toBeNull();
    expect(live.campaign.world.readCurrentSimTime()).toBe(simTime(0));
    expect(run.trace()).toEqual([]);
    expect(() => run.runUntilHeld()).toThrow(/invalid/);
    expect(() => run.save('failed', 'manual')).toThrow(/invalid/);
  });

  it('H5: rejected nested dispatch does not allow a save inside the outer callback', () => {
    const { run } = scenario(workspace());
    run.schedule(work('outer'));
    run.runUntilHeld(() => {
      expect(() => run.runUntilHeld()).toThrow(/non-reentrant/);
      expect(() => run.save('nested', 'manual')).toThrow(/dispatched/);
    });
    expect(run.save('after', 'manual').ok).toBe(true);
  });

  it('H6: payload ownership preserves nested values and __proto__ through SQLite', () => {
    const directory = workspace();
    const live = persistence(directory);
    live.campaign.initializeScenario(descriptor);
    const payload = JSON.parse('{"nested":{"value":1},"__proto__":{"tag":"kept"}}') as { nested: { value: number } };
    const run = createPersistentScenario({ clock: createClock(simTime(0)), calendar: createScenarioCalendar(descriptor),
      campaign: live.campaign, checkpoints: live.checkpoints, encodeWork: () => ({ workKind: 'object', payload }) });
    run.schedule(work('owned'));
    payload.nested.value = 999;
    const pending = run.pendingEntries()[0]!;
    expect(Object.isFrozen(pending)).toBe(true);
    expect(Object.isFrozen(pending.payload)).toBe(true);
    expect(() => { (pending.payload as { nested: { value: number } }).nested.value = 3; }).toThrow();
    expect(run.save('owned', 'manual').ok).toBe(true);
    expect(live.checkpoints.load(checkpointSlotId('owned')).pendingWork[0]!.payload).toEqual(
      JSON.parse('{"nested":{"value":1},"__proto__":{"tag":"kept"}}'),
    );
  });

  const unsupported: unknown[] = [NaN, Infinity, -Infinity, -0, undefined, 1n, Symbol('value'), () => 1,
    { value: undefined }, [undefined], new Array(1), new Date(0), new Map(),
    Object.assign([1], { extra: 2 }), { [Symbol('key')]: 1 },
    Object.defineProperty({}, 'hidden', { value: 1 }), { get value() { return 1; } },
  ];
  it.each(unsupported.map((value, index) => ({ value, index })))('H6: rejects lossy payload case $index before scheduler admission', ({ value }) => {
    const { live } = scenario(workspace());
    const run = createPersistentScenario({ clock: createClock(simTime(0)), calendar: createScenarioCalendar(descriptor),
      campaign: live.campaign, encodeWork: () => ({ workKind: 'bad', payload: value }) });
    expect(() => run.schedule(work('bad'))).toThrow(RangeError);
    expect(run.pendingCount()).toBe(0);
    expect(run.pendingEntries()).toEqual([]);
    expect(() => live.campaign.pendingWork.writePendingWork([{ ...work('bad'), workKind: 'bad', payload: value }])).toThrow(RangeError);
  });

  it('H6: rejects cycles while allowing repeated JSON subtrees', () => {
    const cyclic: { self?: unknown } = {};
    cyclic.self = cyclic;
    expect(() => captureJsonSafePayload(cyclic)).toThrow(/cyclic/);
    const shared = { value: 1 };
    expect(captureJsonSafePayload([shared, shared])).toEqual([{ value: 1 }, { value: 1 }]);
  });

  it.each(['CON', 'con.txt', 'NUL', 'PRN', 'AUX', 'COM1', 'LPT9', 'COM¹', 'trailing.', 'trailing ',
    'a<b', 'a>b', 'a"b', 'a|b', 'a?b', 'a*b', '~hidden', '../escape', '..\\escape'])('H3: rejects unsafe slot %s at both boundaries', (id) => {
    const { live } = scenario(workspace());
    expect(() => checkpointSlotId(id)).toThrow(RangeError);
    expect(() => live.checkpoints.save(id as CheckpointSlotId, 'manual')).toThrow(RangeError);
    expect(() => live.checkpoints.load(id as CheckpointSlotId)).toThrow(RangeError);
    expect(live.checkpoints.listSlots()).toEqual([]);
  });

  it.each(['manual', 'autosave'] as const)('acceptance: post-copy verification failure preserves valid slots (%s)', (kind) => {
    const directory = workspace();
    const opened = openSqliteCampaignDatabase(join(directory, 'live.db'));
    cleanup.push(() => opened.sqlite.close());
    opened.store.initializeScenario(descriptor);
    const checkpoints = createSqliteCheckpointStore({ source: opened.sqlite, slotsDirectory: join(directory, 'slots') });
    const slot = checkpointSlotId('existing');
    expect(checkpoints.save(slot, kind).ok).toBe(true);
    const original = readFileSync(join(directory, 'slots', 'existing.db'));
    // The copy and stamp succeed, then verification refuses the staged version.
    opened.sqlite.prepare("UPDATE meta SET value = '2' WHERE key = 'schema_version'").run();
    const failed = checkpoints.save(checkpointSlotId(kind === 'autosave' ? 'existing' : 'new'), kind);
    expect(failed.ok).toBe(false);
    if (!failed.ok) expect(failed.reason).toMatch(/schema version 2/);
    expect(readFileSync(join(directory, 'slots', 'existing.db'))).toEqual(original);
    expect(checkpoints.load(slot).savedAtSimTime).toBe(simTime(0));
    expect(readdirSync(join(directory, 'slots'))).toEqual(['existing.db']);
  });

  it.each(['backup', 'stamp'] as const)('acceptance: forced %s failure preserves the previous autosave bytes', (phase) => {
    const directory = workspace();
    const opened = openSqliteCampaignDatabase(join(directory, 'live.db'));
    cleanup.push(() => opened.sqlite.close());
    opened.store.initializeScenario(descriptor);
    const checkpoints = createSqliteCheckpointStore({ source: opened.sqlite, slotsDirectory: join(directory, 'slots') });
    const slot = checkpointSlotId('autosave');
    expect(checkpoints.save(slot, 'autosave').ok).toBe(true);
    const original = readFileSync(join(directory, 'slots', 'autosave.db'));
    if (phase === 'backup') {
      // SQLite forbids VACUUM INTO on a connection with an open transaction.
      opened.sqlite.exec('BEGIN IMMEDIATE');
      opened.store.world.writeCurrentSimTime(simTime(50));
    } else {
      // This trigger is copied into the staged database and rejects its stamp.
      opened.sqlite.exec("CREATE TRIGGER reject_save_stamp BEFORE INSERT ON meta WHEN NEW.key = 'save_kind' BEGIN SELECT RAISE(ABORT, 'forced stamp failure'); END");
    }
    try {
      const failed = checkpoints.save(slot, 'autosave');
      expect(failed.ok).toBe(false);
      if (!failed.ok) expect(failed.reason).toMatch(phase === 'backup' ? /transaction/i : /forced stamp failure/);
    } finally {
      if (opened.sqlite.inTransaction) opened.sqlite.exec('ROLLBACK');
    }
    expect(readFileSync(join(directory, 'slots', 'autosave.db'))).toEqual(original);
    expect(checkpoints.load(slot).savedAtSimTime).toBe(simTime(0));
    expect(readdirSync(join(directory, 'slots'))).toEqual(['autosave.db']);
  });

  it('M1 and acceptance: imports causal history in dependency order and restores in-memory canonical state without replay', () => {
    const directory = workspace();
    const { live, run } = scenario(directory);
    live.campaign.ledger.appendEvent(createLedgerEvent({ id: 'z-cause', occurredAtSimTime: simTime(0), type: 'set', magnitude: 1 }));
    live.campaign.ledger.appendEvent(createLedgerEvent({ id: 'a-effect', occurredAtSimTime: simTime(0), type: 'set', magnitude: 2, causes: ['z-cause'] }));
    const authoritative = new Map([[entityId, 99]]);
    live.campaign.world.upsertEntity({ id: entityId, kind: 'unit', scalarState: authoritative.get(entityId)! });
    run.schedule(work('increment', 10, 3));
    expect(run.save('checkpoint', 'manual').ok).toBe(true);
    authoritative.clear();
    const restored = load(directory);
    const inMemoryWorld = new Map(restored.snapshot.entities.map((entity) => [entity.id, entity.scalarState!]));
    expect(inMemoryWorld.get(entityId)).toBe(99);
    // No event handlers execute on load; the entity row, rather than ledger magnitudes, is authoritative.
    const stateReads = vi.spyOn(restored.live.campaign.world, 'getEntity');
    restored.continuation.runUntilHeld((entry) => {
      const next = inMemoryWorld.get(entityId)! + entry.work;
      inMemoryWorld.set(entityId, next);
      restored.live.campaign.world.upsertEntity({ id: entityId, kind: 'unit', scalarState: next });
    });
    expect(stateReads).not.toHaveBeenCalled();
    expect(inMemoryWorld.get(entityId)).toBe(102);
    expect(restored.live.campaign.world.getEntity(entityId)?.scalarState).toBe(102);
    expect(restored.live.campaign.ledger.events()).toHaveLength(2);
  });

  it('M2: native async callbacks and throwing then accessors invalidate the continuation', async () => {
    const { run } = scenario(workspace());
    run.schedule(work('async'));
    // Intentionally pass an async callback to exercise the runtime rejection.
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    expect(() => run.runUntilHeld(async () => { await Promise.resolve(); })).toThrow(/thenable/);
    await Promise.resolve();
    expect(() => run.save('async', 'manual')).toThrow(/invalid/);
    const other = scenario(workspace());
    other.run.schedule(work('getter'));
    expect(() => other.run.runUntilHeld(() => ({ get then() { throw new Error('hostile then'); } }))).toThrow(/hostile then/);
    expect(() => other.run.runUntilHeld()).toThrow(/invalid/);
  });

  it('exact SQLite SimTime round trips at both safe integer boundaries', () => {
    const { live } = scenario(workspace());
    for (const scalar of [Number.MIN_SAFE_INTEGER, Number.MAX_SAFE_INTEGER]) {
      live.campaign.world.writeCurrentSimTime(simTime(scalar));
      live.campaign.pendingWork.writePendingWork([createPersistedWorkEntry({
        workIdentifier: 'edge', classRank: WorkClassRank.world, dueSimTime: simTime(scalar), workKind: 'scalar', payload: 1,
      })]);
      const slot = checkpointSlotId(scalar < 0 ? 'minimum' : 'maximum');
      expect(live.checkpoints.save(slot, 'manual').ok).toBe(true);
      const saved = live.checkpoints.load(slot);
      expect(saved.savedAtSimTime).toBe(scalar);
      expect(saved.pendingWork[0]!.dueSimTime).toBe(scalar);
    }
  });

  it('M1: rejects a cyclic cause graph in a corrupt checkpoint', () => {
    const directory = workspace();
    const { live, run } = scenario(directory);
    live.campaign.ledger.appendEvent(createLedgerEvent({ id: 'a', occurredAtSimTime: simTime(0), type: 'x' }));
    live.campaign.ledger.appendEvent(createLedgerEvent({ id: 'b', occurredAtSimTime: simTime(0), type: 'x', causes: ['a'] }));
    expect(run.save('checkpoint', 'manual').ok).toBe(true);
    const edited = new Database(join(directory, 'slots', 'checkpoint.db'));
    try { edited.prepare('UPDATE ledger_event SET causes = ? WHERE id = ?').run('["b"]', 'a'); }
    finally { edited.close(); }
    expect(() => live.checkpoints.load(checkpointSlotId('checkpoint'))).toThrow(/cycles/);
  });

  it('acceptance: older-save branches keep different canonical state and histories in independent slots', () => {
    const directory = workspace();
    const { run, live } = scenario(directory);
    const firstWorld = new Map([[entityId, 0]]);
    live.campaign.world.upsertEntity({ id: entityId, kind: 'unit', scalarState: 0 });
    run.schedule(work('shared', 10, 1));
    expect(run.save('checkpoint', 'manual').ok).toBe(true);
    const originalBytes = readFileSync(join(directory, 'slots', 'checkpoint.db'));
    run.runUntilHeld((entry) => {
      const next = firstWorld.get(entityId)! + entry.work;
      firstWorld.set(entityId, next);
      live.campaign.world.upsertEntity({ id: entityId, kind: 'unit', scalarState: next });
      live.campaign.ledger.appendEvent(createLedgerEvent({ id: entry.workIdentifier, occurredAtSimTime: entry.dueSimTime, type: 'increment' }));
    });
    expect(run.save('future-a', 'manual').ok).toBe(true);
    firstWorld.clear();
    live.close();
    // The first connection is already released; avoid closing it again at cleanup.
    cleanup.splice(cleanup.indexOf(live.close), 1);
    const restored = load(directory);
    const alternateWorld = new Map(restored.snapshot.entities.map((entity) => [entity.id, entity.scalarState!]));
    restored.continuation.schedule(work('alternate', 20, 10));
    restored.continuation.runUntilHeld((entry) => {
      const next = alternateWorld.get(entityId)! + entry.work;
      alternateWorld.set(entityId, next);
      restored.live.campaign.world.upsertEntity({ id: entityId, kind: 'unit', scalarState: next });
      restored.live.campaign.ledger.appendEvent(createLedgerEvent({ id: entry.workIdentifier, occurredAtSimTime: entry.dueSimTime, type: 'increment' }));
    });
    expect(restored.continuation.save('future-b', 'manual').ok).toBe(true);
    const first = restored.live.checkpoints.load(checkpointSlotId('future-a'));
    const second = restored.live.checkpoints.load(checkpointSlotId('future-b'));
    expect(first.entities[0]!.scalarState).toBe(1);
    expect(second.entities[0]!.scalarState).toBe(11);
    expect(first.ledgerEvents.map((event) => event.id)).toEqual(['shared']);
    expect(second.ledgerEvents.map((event) => event.id)).toEqual(['alternate', 'shared']);
    expect(readFileSync(join(directory, 'slots', 'checkpoint.db'))).toEqual(originalBytes);
    expect(restored.live.checkpoints.load(checkpointSlotId('checkpoint')).entities[0]!.scalarState).toBe(0);
    expect(restored.live.checkpoints.listSlots()).toEqual(['checkpoint', 'future-a', 'future-b']);
  });

  it('releases acquired database handles on version and composition failures', () => {
    const directory = workspace();
    const path = join(directory, 'version.db');
    const first = openSqliteCampaignDatabase(path);
    first.sqlite.prepare("UPDATE meta SET value = '2' WHERE key = 'schema_version'").run();
    first.sqlite.close();
    const closes = vi.spyOn(Database.prototype, 'close');
    expect(() => openSqliteCampaignDatabase(path)).toThrow(/schema version 2/);
    expect(closes).toHaveBeenCalledTimes(1);
    expect(() => createSqlitePersistence({ databasePath: join(directory, 'composition.db'), slotsDirectory: '' })).toThrow(/slotsDirectory/);
    expect(closes).toHaveBeenCalledTimes(2);
  });
});
