/**
 * Persistent scenario driver (VS-3 / E2+E17a acceptance seam, AD-9).
 *
 * The VS-2 headless driver plus the durable mirror: every executed step is
 * committed atomically through `CampaignStore.runInTransaction` — the
 * schedule-time-fixed envelopes of the scheduler's live pending set, the
 * mirrored SimTime, plus whatever world and ledger writes campaign content
 * performs in the step callback. A save therefore always captures a
 * coherent database; a load rebuilds the exact in-memory continuation.
 *
 * The scheduler is **never serialized as closures**: persistence records the
 * scheduling envelope plus a `workKind` registration key and a JSON-safe
 * payload (ADR-0010). This driver mirrors the scheduler's *accepted* pending
 * set (schedule-time-fixed content, N-30) and reconstructs work on load
 * through the domain `WorkKindRegistry`, then feeds each entry back through
 * `scheduler.schedule()` so every scheduler invariant re-validates —
 * including the past-due rejection, which can never fire on a coherent save
 * (ADR-0008, A13).
 *
 * Loading and continuing starts a **fresh continuation**: it never writes
 * into the immutable slot (Rome-II semantics, AD-9); the caller supplies a
 * new live `CampaignStore` to continue into.
 */
import type { ScenarioCalendar } from '../domain/calendar/index.js';
import { createScenarioCalendar } from '../domain/calendar/index.js';
import { orderLedgerEventsForImport } from '../domain/ledger/index.js';
import type {
  CampaignStore,
  CheckpointSaveKind,
  CheckpointSaveResult,
  CheckpointSlotId,
  CheckpointStore,
  PersistedWorkEntry,
} from '../domain/persistence/index.js';
import { createPersistedWorkEntry } from '../domain/persistence/index.js';
import type { CampaignSnapshot } from '../domain/persistence/index.js';
import type { WorkKindRegistry } from '../domain/persistence/index.js';
import type { Clock, DueWorkScheduler, ScheduledWork } from '../domain/time/index.js';
import { createClock, createDueWorkScheduler } from '../domain/time/index.js';
import type { WorkIdentifier } from '../domain/time/index.js';
import type { ScenarioTraceStep } from './headless-scenario-run.js';
import { serializeScenarioTrace } from './headless-scenario-run.js';

export interface EncodeWork {
  /** Stable registration key plus a JSON-safe payload for one work value. */
  readonly workKind: string;
  readonly payload: unknown;
}

function messageOf(value: unknown): string {
  if (value instanceof Error && value.message.length > 0) return value.message;
  return String(value);
}

function isThenable(value: unknown): boolean {
  if (value === null) return false;
  if (typeof value !== 'object' && typeof value !== 'function') return false;
  return typeof (value as { then?: unknown }).then === 'function';
}

export interface PersistentScenarioOptions<TWork, MonthId extends string> {
  readonly clock: Clock;
  readonly calendar: ScenarioCalendar<MonthId>;
  readonly campaign: CampaignStore;
  readonly checkpoints?: CheckpointStore;
  /** Maps a work value to the persistable envelope (kind key + JSON payload). */
  readonly encodeWork: (work: TWork) => EncodeWork;
  /**
   * The scheduler's pending set at entry, as when resuming a loaded
   * continuation; defaults to empty for a fresh campaign.
   */
  readonly initialPending?: readonly PersistedWorkEntry[];
  /** A pre-populated scheduler to reuse; defaults to a fresh one over `clock`. */
  readonly scheduler?: DueWorkScheduler<TWork>;
}

export interface PersistentScenario<TWork, MonthId extends string> {
  readonly clock: Clock;
  readonly calendar: ScenarioCalendar<MonthId>;
  readonly campaign: CampaignStore;
  schedule(entry: ScheduledWork<TWork>): ScheduledWork<TWork>;
  pause(): void;
  resume(): void;
  freeze(): void;
  unfreeze(): void;
  /** Number of held or ready entries; unchanged by pause and freeze. */
  pendingCount(): number;
  /**
   * Advance until the scheduler holds or empties. Each executed step commits
   * atomically: step content, pending-set mirror, SimTime, plus the content's
   * own world and ledger writes. Returns the newly executed steps.
   */
  runUntilHeld(
    execute?: (entry: ScheduledWork<TWork>) => void,
  ): readonly ScenarioTraceStep<MonthId>[];
  trace(): readonly ScenarioTraceStep<MonthId>[];
  /** Publish an immutable save slot; success is reported only after verification. */
  save(slotId: string, saveKind: CheckpointSaveKind): CheckpointSaveResult;
  /** The mirror of the scheduler's accepted pending set (envelope + payload). */
  pendingEntries(): readonly PersistedWorkEntry[];
}

export function createPersistentScenario<TWork, MonthId extends string>(
  options: PersistentScenarioOptions<TWork, MonthId>,
): PersistentScenario<TWork, MonthId> {
  const scheduler: DueWorkScheduler<TWork> =
    options.scheduler ?? createDueWorkScheduler<TWork>(options.clock);
  const steps: ScenarioTraceStep<MonthId>[] = [];
  const mirror = new Map<WorkIdentifier, PersistedWorkEntry>();
  for (const entry of options.initialPending ?? []) {
    mirror.set(entry.workIdentifier, createPersistedWorkEntry(entry));
  }

  let invalidated: string | null = null;
  let dispatching = false;

  function failIfInvalidated(): void {
    if (invalidated !== null) {
      throw new RangeError(
        `This persistent scenario is invalid because ${invalidated}; no further scheduling, execution or saving is permitted (ADR-0008).`,
      );
    }
  }

  /**
   * Admission is atomic with respect to the mirror: the persistent
   * representation is fully validated and captured from one owned snapshot of
   * the caller's envelope (capture-once, N-30, H4), the scheduler accepts it,
   * and only then does the mirror change. Any failure leaves both unchanged.
   */
  function schedule(entry: ScheduledWork<TWork>): ScheduledWork<TWork> {
    failIfInvalidated();
    const snapshot = {
      dueSimTime: entry.dueSimTime,
      classRank: entry.classRank,
      workIdentifier: entry.workIdentifier,
      work: entry.work,
    };
    const encoded = options.encodeWork(snapshot.work);
    const persisted = createPersistedWorkEntry({
      workIdentifier: snapshot.workIdentifier,
      classRank: snapshot.classRank,
      dueSimTime: snapshot.dueSimTime,
      workKind: encoded.workKind,
      payload: encoded.payload,
    });
    const accepted = scheduler.schedule(snapshot);
    mirror.set(accepted.workIdentifier, persisted);
    return accepted;
  }

  return {
    clock: options.clock,
    calendar: options.calendar,
    campaign: options.campaign,
    schedule,
    pause: (): void => {
      options.clock.pause();
    },
    resume: (): void => {
      options.clock.resume();
    },
    freeze: (): void => {
      options.clock.freeze();
    },
    unfreeze: (): void => {
      options.clock.unfreeze();
    },
    pendingCount: (): number => scheduler.pendingCount(),
    runUntilHeld(
      execute?: (entry: ScheduledWork<TWork>) => void,
    ): readonly ScenarioTraceStep<MonthId>[] {
      failIfInvalidated();
      if (dispatching) {
        throw new RangeError('Persistent scenario dispatch is synchronous and non-reentrant (ADR-0008).');
      }
      const before = steps.length;
      dispatching = true;
      try {
        scheduler.runAll((entry) => {
          // The scheduler has consumed this identifier. Remove its old mirror
          // before content may reuse it for a new consequence.
          mirror.delete(entry.workIdentifier);
          options.campaign.runInTransaction(() => {
            const result = execute?.(entry) as unknown;
            if (isThenable(result)) {
              throw new RangeError(
                'An execute callback returned an asynchronous/thenable value: the continuation can no longer be deterministic, so this persistent scenario is invalid (ADR-0008).',
              );
            }
            options.campaign.world.writeCurrentSimTime(entry.dueSimTime);
            options.campaign.pendingWork.writePendingWork([...mirror.values()]);
          });
          // Only completed transactions contribute to the successful trace.
          steps.push({
            workIdentifier: String(entry.workIdentifier),
            classRank: entry.classRank,
            dueSimTime: entry.dueSimTime,
            calendarDate: options.calendar.toCalendarDate(entry.dueSimTime),
          });
        });
      } catch (error) {
        invalidated = `an executed step failed (${messageOf(error)})`;
        throw error;
      } finally {
        dispatching = false;
      }
      return steps.slice(before);
    },
    trace: (): readonly ScenarioTraceStep<MonthId>[] => steps,
    save(slotId: string, saveKind: CheckpointSaveKind): CheckpointSaveResult {
      failIfInvalidated();
      if (dispatching) {
        throw new RangeError(
          'A save cannot be taken while a step is being dispatched: a checkpoint must capture a coherent boundary between steps (ADR-0010).',
        );
      }
      if (options.checkpoints === undefined) {
        return { ok: false, slotId: slotId as CheckpointSlotId, reason: 'No checkpoint store is wired to this scenario.' };
      }
      try {
        // Synchronize the durable mirror (pending set + authoritative SimTime)
        // with the live scheduler before the checkpoint is copied, so a save
        // taken between steps never loses freshly scheduled work (ADR-0010).
        options.campaign.runInTransaction(() => {
          options.campaign.pendingWork.writePendingWork([...mirror.values()]);
          options.campaign.world.writeCurrentSimTime(options.clock.now());
        });
      } catch (error) {
        return {
          ok: false,
          slotId: slotId as CheckpointSlotId,
          reason: `Could not synchronize the durable mirror before saving: ${messageOf(error)}`,
        };
      }
      return options.checkpoints.save(slotId as CheckpointSlotId, saveKind);
    },
    pendingEntries: (): readonly PersistedWorkEntry[] => [...mirror.values()],
  };
}

export interface LoadedPersistentScenario<TWork, MonthId extends string> {
  readonly snapshot: CampaignSnapshot;
  readonly calendar: ScenarioCalendar<MonthId>;
  readonly continuation: PersistentScenario<TWork, MonthId>;
}

export interface LoadPersistentScenarioOptions<TWork, MonthId extends string> {
  readonly checkpoints: CheckpointStore;
  readonly slotId: CheckpointSlotId;
  /** The fresh live store the continuation will mirror into (never the slot). */
  readonly campaign: CampaignStore;
  /** Rebuilds `TWork` from a persisted envelope; throws for unregistered kinds. */
  readonly workKinds: WorkKindRegistry<TWork>;
  /**
   * Maps a loaded month id (a plain string from the descriptor) to the
   * content's `MonthId`; the domain calendar constructor validates the rest.
   */
  readonly monthIds: (id: string) => MonthId;
  readonly encodeWork: (work: TWork) => EncodeWork;
}

/**
 * Load an immutable slot into a fresh continuation: verify + read the
 * snapshot, rebuild the calendar, clock, scheduler and regulator, revalidate
 * every pending envelope through the scheduler, and mirror the snapshot into
 * the fresh `CampaignStore` through the domain ports (re-validating again).
 * Throws (never repairs) on any inconsistency (ADR-0008).
 */
export function loadPersistentScenario<TWork, MonthId extends string>(
  options: LoadPersistentScenarioOptions<TWork, MonthId>,
): LoadedPersistentScenario<TWork, MonthId> {
  const snapshot = options.checkpoints.load(options.slotId);
  const calendar = createScenarioCalendar<MonthId>({
    unitsPerDay: snapshot.scenario.unitsPerDay,
    epochSimTime: snapshot.scenario.epochSimTime,
    epochDayNumber: snapshot.scenario.epochDayNumber,
    era: {
      name: snapshot.scenario.era.name,
      yearNumberDirection: snapshot.scenario.era.yearNumberDirection,
      firstYearNumber: snapshot.scenario.era.firstYearNumber,
      firstYearStartDayNumber: snapshot.scenario.era.firstYearStartDayNumber,
      monthSequence: snapshot.scenario.era.monthSequence.map((month) => ({
        id: options.monthIds(month.id),
        days: month.days,
      })),
    },
  });
  const clock = createClock(snapshot.savedAtSimTime);
  const scheduler: DueWorkScheduler<TWork> = createDueWorkScheduler<TWork>(clock);

  for (const entry of snapshot.pendingWork) {
    const work = options.workKinds.reconstruct(entry.workKind, entry.payload);
    scheduler.schedule({
      dueSimTime: entry.dueSimTime,
      classRank: entry.classRank,
      workIdentifier: entry.workIdentifier,
      work,
    });
  }

  options.campaign.initializeScenario(snapshot.scenario);
  options.campaign.runInTransaction(() => {
    options.campaign.world.writeCurrentSimTime(snapshot.savedAtSimTime);
    for (const entity of snapshot.entities) {
      options.campaign.world.upsertEntity({
        id: entity.id,
        kind: entity.kind,
        scalarState: entity.scalarState,
      });
      if (entity.ended) {
        options.campaign.world.markEntityEnded(entity.id);
      }
    }
    for (const event of orderLedgerEventsForImport(snapshot.ledgerEvents)) {
      options.campaign.ledger.appendEvent(event);
    }
    for (const link of snapshot.ledgerConsequenceLinks) {
      options.campaign.ledger.appendConsequence(link);
    }
    options.campaign.pendingWork.writePendingWork(snapshot.pendingWork);
  });

  const continuation = createPersistentScenario({
    clock,
    calendar,
    campaign: options.campaign,
    checkpoints: options.checkpoints,
    scheduler,
    encodeWork: options.encodeWork,
    initialPending: snapshot.pendingWork,
  });

  return { snapshot, calendar, continuation };
}

export { serializeScenarioTrace };
