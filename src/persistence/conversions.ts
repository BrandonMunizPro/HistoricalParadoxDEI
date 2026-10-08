/**
 * Row-to-domain and domain-to-row conversions (ADR-0010, AD-9; E17a).
 *
 * Conversion is the enforcement point of ADR-0008 on the persistence side:
 * every row read back into the domain passes the same strict validators the
 * scheduler, ledger and world model apply, so a corrupt, hand-edited or
 * simplified row fails loudly instead of silently becoming a number that
 * round-trips differently. Rows go in both directions but never across the
 * port boundary in either form.
 *
 * Array-shaped ledger fields are JSON text in the mirror; SimTime is a stable
 * decimal integer string (N-29/amendment B1). Both encodings are lossless and
 * re-validated on every read.
 */
import type { drizzle } from 'drizzle-orm/better-sqlite3';
import { eq } from 'drizzle-orm';
import { isCanonicalId } from '../domain/identity/index.js';
import type { CanonicalId } from '../domain/identity/index.js';
import { createLedgerEvent, requireLedgerEventId } from '../domain/ledger/index.js';
import type { LedgerConsequenceLink, LedgerEvent, LedgerEventId } from '../domain/ledger/index.js';
import {
  createScenarioCalendar,
} from '../domain/calendar/index.js';
import type { ScenarioCalendar } from '../domain/calendar/index.js';
import {
  parseSimTimeStableString,
  simTimeToStableString,
} from '../domain/time/index.js';
import {
  requireScenarioDescriptor,
} from '../domain/persistence/scenario-descriptor.js';
import type { ScenarioDescriptor } from '../domain/persistence/scenario-descriptor.js';
import {
  createPersistedWorkEntry,
} from '../domain/persistence/scheduled-work-repository.js';
import type { PersistedWorkEntry } from '../domain/persistence/scheduled-work-repository.js';
import {
  worldEntityKind,
} from '../domain/persistence/world-state-repository.js';
import type { WorldEntity } from '../domain/persistence/world-state-repository.js';
import {
  calendarMonthTable,
  entityTable,
  ledgerConsequenceTable,
  ledgerEventTable,
  metaTable,
  pendingWorkTable,
  scenarioTable,
} from './schema.js';
import type {
  CalendarMonthRow,
  EntityRow,
  LedgerConsequenceRow,
  LedgerEventRow,
  PendingWorkRow,
  ScenarioRow,
} from './schema.js';

export type DomainDatabase = ReturnType<typeof drizzle>;

function requireSafeIntegerMember(value: unknown, what: string): number {
  if (typeof value !== 'number' || !Number.isSafeInteger(value)) {
    throw new RangeError(
      `A persisted ${what} must be a safe integer, received ${String(value)} (ADR-0008).`,
    );
  }
  return value;
}

function encodeJson(value: unknown): string {
  const encoded = JSON.stringify(value);
  if (encoded === undefined) {
    throw new RangeError('A persisted value could not be encoded as JSON (ADR-0010).');
  }
  return encoded;
}

function decodeJson(text: string, what: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    throw new RangeError(`A persisted ${what} is not valid JSON (ADR-0008).`);
  }
}

// ---------------------------------------------------------------------------
// meta
// ---------------------------------------------------------------------------

export function readMetaValue(db: DomainDatabase, key: string): string | undefined {
  const row = db.select().from(metaTable).where(eq(metaTable.key, key)).get();
  return row?.value;
}

export function writeMetaValue(db: DomainDatabase, key: string, value: string): void {
  db.insert(metaTable)
    .values({ key, value })
    .onConflictDoUpdate({ target: metaTable.key, set: { value } })
    .run();
}

// ---------------------------------------------------------------------------
// world entities
// ---------------------------------------------------------------------------

export function worldEntityToRow(entity: WorldEntity): typeof entityTable.$inferInsert {
  return {
    id: entity.id,
    kind: entity.kind,
    scalarState: entity.scalarState,
    ended: entity.ended ? 1 : 0,
  };
}

export function entityRowToWorldEntity(row: EntityRow): WorldEntity {
  if (!isCanonicalId(row.id)) {
    throw new RangeError(
      `A persisted entity id '${row.id}' is not a canonical identity (ADR-0008).`,
    );
  }
  if (row.ended !== 0 && row.ended !== 1) {
    throw new RangeError(
      `A persisted entity '${row.id}' has ended '${String(row.ended)}', expected 0 or 1 (ADR-0008).`,
    );
  }
  const scalarState = row.scalarState === null ? null : requireSafeIntegerMember(row.scalarState, 'entity scalarState');
  return {
    id: row.id,
    kind: worldEntityKind(row.kind),
    scalarState,
    ended: row.ended === 1,
  };
}

// ---------------------------------------------------------------------------
// pending scheduler work
// ---------------------------------------------------------------------------

export function persistedWorkEntryToRow(
  entry: PersistedWorkEntry,
): typeof pendingWorkTable.$inferInsert {
  const captured = createPersistedWorkEntry(entry);
  return {
    workIdentifier: String(captured.workIdentifier),
    classRank: Number(captured.classRank),
    dueSimTime: simTimeToStableString(captured.dueSimTime),
    workKind: String(captured.workKind),
    payload: encodeJson(captured.payload),
  };
}

export function pendingWorkRowToPersisted(row: PendingWorkRow): PersistedWorkEntry {
  return createPersistedWorkEntry({
    workIdentifier: row.workIdentifier,
    classRank: row.classRank,
    dueSimTime: parseSimTimeStableString(row.dueSimTime),
    workKind: row.workKind,
    payload: decodeJson(row.payload, 'work payload'),
  });
}

// ---------------------------------------------------------------------------
// ledger
// ---------------------------------------------------------------------------

export function ledgerEventToRow(event: LedgerEvent): typeof ledgerEventTable.$inferInsert {
  return {
    id: event.id,
    occurredAtSimTime: simTimeToStableString(event.occurredAtSimTime),
    eventType: event.type,
    participants: encodeJson(event.participants),
    factions: encodeJson(event.factions),
    locations: encodeJson(event.locations),
    magnitude: event.magnitude,
    causes: encodeJson(event.causes),
    witnesses: encodeJson(event.witnesses),
  };
}

export function ledgerEventRowToLedgerEvent(row: LedgerEventRow): LedgerEvent {
  const participants = decodeJson(row.participants, 'ledger event participants');
  const factions = decodeJson(row.factions, 'ledger event factions');
  const locations = decodeJson(row.locations, 'ledger event locations');
  const causes = decodeJson(row.causes, 'ledger event causes');
  const witnesses = decodeJson(row.witnesses, 'ledger event witnesses');
  if (
    !Array.isArray(participants) ||
    !Array.isArray(factions) ||
    !Array.isArray(locations) ||
    !Array.isArray(causes) ||
    !Array.isArray(witnesses)
  ) {
    throw new RangeError('A persisted ledger event array field is not an array (ADR-0008).');
  }
  const magnitude = row.magnitude === null ? null : requireSafeIntegerMember(row.magnitude, 'ledger event magnitude');
  if (magnitude !== null && magnitude < 0) {
    throw new RangeError(
      `A persisted ledger event magnitude must be non-negative, received ${magnitude} (ADR-0008).`,
    );
  }
  return createLedgerEvent({
    id: row.id,
    occurredAtSimTime: parseSimTimeStableString(row.occurredAtSimTime),
    type: row.eventType,
    participants: participants as CanonicalId[],
    factions: factions as CanonicalId[],
    locations: locations as CanonicalId[],
    magnitude,
    causes: causes as string[],
    witnesses: witnesses as CanonicalId[],
  });
}

export function ledgerLinkToRow(
  link: LedgerConsequenceLink,
): typeof ledgerConsequenceTable.$inferInsert {
  return { sourceId: link.sourceId, consequenceId: link.consequenceId };
}

export function ledgerLinkRowToLink(row: LedgerConsequenceRow): LedgerConsequenceLink {
  const sourceId = requireLedgerEventId(row.sourceId) as LedgerEventId;
  const consequenceId = requireLedgerEventId(row.consequenceId) as LedgerEventId;
  if (sourceId === consequenceId) {
    throw new RangeError(
      `A persisted ledger consequence link cannot reference itself ('${sourceId}') (ADR-0008).`,
    );
  }
  return Object.freeze({ sourceId, consequenceId });
}

// ---------------------------------------------------------------------------
// scenario and calendar
// ---------------------------------------------------------------------------

export function scenarioDescriptorToScenarioRow(
  descriptor: ScenarioDescriptor<string>,
): typeof scenarioTable.$inferInsert {
  return {
    id: descriptor.scenarioId,
    name: descriptor.name,
    unitsPerDay: descriptor.unitsPerDay,
    epochSimTime: simTimeToStableString(descriptor.epochSimTime),
    epochDayNumber: descriptor.epochDayNumber,
    eraName: descriptor.era.name,
    eraDirection: descriptor.era.yearNumberDirection,
    eraFirstYearNumber: descriptor.era.firstYearNumber,
    eraFirstYearStartDayNumber: descriptor.era.firstYearStartDayNumber,
  };
}

export function scenarioDescriptorToCalendarMonthRows(
  descriptor: ScenarioDescriptor<string>,
): typeof calendarMonthTable.$inferInsert[] {
  return descriptor.era.monthSequence.map((month, index) => ({
    monthIndex: index,
    id: month.id,
    days: month.days,
  }));
}

export function scenarioRowsToDescriptor(
  scenarioRow: ScenarioRow,
  monthRows: readonly CalendarMonthRow[],
): ScenarioDescriptor<string> {
  const orderedMonths = [...monthRows].sort((left, right) => left.monthIndex - right.monthIndex);
  if (orderedMonths.length !== new Set(orderedMonths.map((month) => month.monthIndex)).size) {
    throw new RangeError(
      'A persisted scenario calendar month sequence repeats an index (ADR-0008).',
    );
  }
  let eraDirection: 'ascending' | 'descending';
  if (scenarioRow.eraDirection === 'ascending' || scenarioRow.eraDirection === 'descending') {
    eraDirection = scenarioRow.eraDirection;
  } else {
    throw new RangeError(
      `A persisted scenario era direction '${scenarioRow.eraDirection}' is neither ascending nor descending (ADR-0008).`,
    );
  }
  return requireScenarioDescriptor({
    scenarioId: scenarioRow.id,
    name: scenarioRow.name,
    unitsPerDay: scenarioRow.unitsPerDay,
    epochSimTime: parseSimTimeStableString(scenarioRow.epochSimTime),
    epochDayNumber: scenarioRow.epochDayNumber,
    era: {
      name: scenarioRow.eraName,
      yearNumberDirection: eraDirection,
      firstYearNumber: scenarioRow.eraFirstYearNumber,
      firstYearStartDayNumber: scenarioRow.eraFirstYearStartDayNumber,
      monthSequence: orderedMonths.map((month) => ({ id: month.id, days: month.days })),
    },
  });
}

/**
 * Rebuild a domain calendar from a descriptor, reusing the domain constructor
 * so the loaded run derives exactly the same dates as the original run.
 */
export function scenarioCalendarFromDescriptor<MonthId extends string>(
  descriptor: ScenarioDescriptor<string>,
): ScenarioCalendar<MonthId> {
  return createScenarioCalendar<MonthId>({
    unitsPerDay: descriptor.unitsPerDay,
    epochSimTime: descriptor.epochSimTime,
    epochDayNumber: descriptor.epochDayNumber,
    era: descriptor.era as ScenarioDescriptor<MonthId>['era'],
  });
}

// ---------------------------------------------------------------------------
// bulk reads used by checkpoint load
// ---------------------------------------------------------------------------

export interface CheckpointRows {
  readonly scenario: ScenarioRow;
  readonly months: readonly CalendarMonthRow[];
  readonly entities: readonly EntityRow[];
  readonly pending: readonly PendingWorkRow[];
  readonly ledgerEvents: readonly LedgerEventRow[];
  readonly ledgerLinks: readonly LedgerConsequenceRow[];
}

/** Read all rows of an immutable slot (or live database) for reconstruction. */
export function readAllRows(db: DomainDatabase): CheckpointRows {
  const scenario = db.select().from(scenarioTable).get();
  if (scenario === undefined) {
    throw new RangeError('A persisted campaign holds no scenario row (ADR-0008).');
  }
  return {
    scenario,
    months: db.select().from(calendarMonthTable).orderBy(calendarMonthTable.monthIndex).all(),
    entities: db.select().from(entityTable).orderBy(entityTable.id).all(),
    pending: db.select().from(pendingWorkTable).orderBy(pendingWorkTable.workIdentifier).all(),
    ledgerEvents: db.select().from(ledgerEventTable).orderBy(ledgerEventTable.id).all(),
    ledgerLinks: db
      .select()
      .from(ledgerConsequenceTable)
      .orderBy(ledgerConsequenceTable.sourceId, ledgerConsequenceTable.consequenceId)
      .all(),
  };
}
