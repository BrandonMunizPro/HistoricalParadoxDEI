/**
 * Ledger store (ADR-0002, E2; ADR-0010, E17a).
 *
 * The append-only store of historically meaningful domain events. The port
 * intentionally exposes **no update or delete surface**: once appended, an
 * event row is immutable. Consequences that become known later are appended as
 * separate `LedgerConsequenceLink`s rather than editing an already-recorded
 * event.
 *
 * The store is a data port, not an event bus: appending records the event; it
 * does not dispatch consequences. Cross-system traffic remains domain-event
 * driven (assumption A-1). Because the ledger is not canonical world state, a
 * load never replays these events (ADR-0002; AD-9).
 */
import type {
  LedgerConsequenceLink,
} from '../ledger/index.js';
import type { LedgerEvent, LedgerEventId } from '../ledger/index.js';

export interface LedgerStore {
  /**
   * Append one event. Throws a `RangeError` when an event with the same id is
   * already recorded (append-only: a duplicate is a data-integrity failure,
   * never a silent overwrite or ignore).
   */
  appendEvent(event: LedgerEvent): LedgerEvent;
  /**
   * Append one consequence link. Requires both events to exist and
   * `sourceId !== consequenceId`; throws on any violation.
   */
  appendConsequence(link: LedgerConsequenceLink): void;
  eventById(id: LedgerEventId): LedgerEvent | null;
  /** All recorded events; ordering is not significant (resolvers order it). */
  events(): readonly LedgerEvent[];
  consequenceLinks(): readonly LedgerConsequenceLink[];
}