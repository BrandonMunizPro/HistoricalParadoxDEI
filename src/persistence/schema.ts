/**
 * Relational schema for the durable campaign mirror (ADR-0010, AD-9; E17a).
 *
 * One live campaign database mirrors the authoritative in-memory world
 * change-aware: a row per entity, the scheduler pending-set envelope, the
 * append-only ledger, and a `meta` table that carries the schema version and
 * the mirrored SimTime. Immutable save slots are byte-independent copies of
 * this schema plus a `save_kind` stamp (ADR-0010 Delta 1).
 *
 * SimTime is stored as a stable decimal integer string (`simTimeToStableString`),
 * never a float and never a wall-clock representation (N-29). Array-forming
 * ledger fields are stored as JSON text; JSON is the mirror's interchange
 * shape for canonical-id arrays, causes and witness lists (ADR-0008).
 */
import { integer, primaryKey, sqliteTable, text } from 'drizzle-orm/sqlite-core';

/** The one schema version this build can read and produce (AD-9). */
export const SCHEMA_VERSION = 1;

export const META_SCHEMA_VERSION = 'schema_version';
export const META_CURRENT_SIM_TIME = 'current_sim_time';
/** Stamped into an immutable slot copy at publish time; never a live row. */
export const META_SAVE_KIND = 'save_kind';

export const metaTable = sqliteTable('meta', {
  key: text('key').primaryKey(),
  value: text('value').notNull(),
});

export const scenarioTable = sqliteTable('scenario', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  unitsPerDay: integer('units_per_day').notNull(),
  epochSimTime: text('epoch_sim_time').notNull(),
  epochDayNumber: integer('epoch_day_number').notNull(),
  eraName: text('era_name').notNull(),
  eraDirection: text('era_direction').notNull(),
  eraFirstYearNumber: integer('era_first_year_number').notNull(),
  eraFirstYearStartDayNumber: integer('era_first_year_start_day_number').notNull(),
});

export const calendarMonthTable = sqliteTable('calendar_month', {
  monthIndex: integer('month_index').primaryKey(),
  id: text('id').notNull(),
  days: integer('days').notNull(),
});

export const entityTable = sqliteTable('entity', {
  id: text('id').primaryKey(),
  kind: text('kind').notNull(),
  scalarState: integer('scalar_state'),
  ended: integer('ended').notNull(),
});

export const pendingWorkTable = sqliteTable('pending_work', {
  workIdentifier: text('work_identifier').primaryKey(),
  classRank: integer('class_rank').notNull(),
  dueSimTime: text('due_sim_time').notNull(),
  workKind: text('work_kind').notNull(),
  payload: text('payload').notNull(),
});

export const ledgerEventTable = sqliteTable('ledger_event', {
  id: text('id').primaryKey(),
  occurredAtSimTime: text('occurred_at_sim_time').notNull(),
  eventType: text('event_type').notNull(),
  participants: text('participants').notNull(),
  factions: text('factions').notNull(),
  locations: text('locations').notNull(),
  magnitude: integer('magnitude'),
  causes: text('causes').notNull(),
  witnesses: text('witnesses').notNull(),
});

export const ledgerConsequenceTable = sqliteTable(
  'ledger_consequence',
  {
    sourceId: text('source_id').notNull(),
    consequenceId: text('consequence_id').notNull(),
  },
  (table) => [primaryKey({ columns: [table.sourceId, table.consequenceId] })],
);

export type MetaRow = typeof metaTable.$inferSelect;
export type ScenarioRow = typeof scenarioTable.$inferSelect;
export type CalendarMonthRow = typeof calendarMonthTable.$inferSelect;
export type EntityRow = typeof entityTable.$inferSelect;
export type PendingWorkRow = typeof pendingWorkTable.$inferSelect;
export type LedgerEventRow = typeof ledgerEventTable.$inferSelect;
export type LedgerConsequenceRow = typeof ledgerConsequenceTable.$inferSelect;