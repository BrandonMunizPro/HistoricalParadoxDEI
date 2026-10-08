/**
 * Causal traversal over the immutable ledger (ADR-0002, E2).
 *
 * The ledger records causes at event creation and consequences as
 * separately appended `LedgerConsequenceLink`s. Traversal is a **pure
 * derivation**: it composes the read-only event set into an ordered,
 * deterministic provenance chain and never mutates or reorders the records
 * themselves (a derived projection, rebuilt from state).
 *
 * Ordering is deterministic: ties break on `occurredAtSimTime` and then the
 * event id, so identical stored data always yields the identical chain,
 * independent of storage iteration order (ADR-0008).
 */
import type { LedgerEvent, LedgerEventId } from './ledger-event.js';
import { compare } from '../time/index.js';

/** A recorded consequence link: `consequenceId` was caused by `sourceId`. */
export interface LedgerConsequenceLink {
  readonly sourceId: LedgerEventId;
  readonly consequenceId: LedgerEventId;
}

/**
 * The read-only ledger content a resolver composes over. The implementing
 * store supplies events and links; the resolver adds no storage vocabulary.
 */
export interface LedgerGraph {
  readonly eventById: ReadonlyMap<LedgerEventId, LedgerEvent>;
  readonly consequenceLinks: readonly LedgerConsequenceLink[];
}

/** Order historical records for import, without executing any domain effects. */
export function orderLedgerEventsForImport(events: readonly LedgerEvent[]): readonly LedgerEvent[] {
  const byId = new Map(events.map((event) => [event.id, event]));
  if (byId.size !== events.length) throw new RangeError('Duplicate ledger event identity (ADR-0002).');
  const visiting = new Set<LedgerEventId>();
  const imported = new Set<LedgerEventId>();
  const ordered: LedgerEvent[] = [];
  function visit(id: LedgerEventId): void {
    if (imported.has(id)) return;
    if (visiting.has(id)) throw new RangeError('A ledger cause graph must not contain cycles (ADR-0002).');
    const event = byId.get(id);
    if (event === undefined) throw new RangeError(`Ledger cause '${id}' is not recorded (ADR-0002).`);
    visiting.add(id);
    for (const cause of [...event.causes].sort()) visit(cause);
    visiting.delete(id);
    imported.add(id);
    ordered.push(event);
  }
  for (const id of [...byId.keys()].sort()) visit(id);
  return Object.freeze(ordered);
}

function compareEvents(left: LedgerEvent, right: LedgerEvent): number {
  const byTime = compare(left.occurredAtSimTime, right.occurredAtSimTime);
  if (byTime !== 0) return byTime;
  return left.id < right.id ? -1 : left.id > right.id ? 1 : 0;
}

function requireEvent(graph: LedgerGraph, id: LedgerEventId, via: string): LedgerEvent {
  const event = graph.eventById.get(id);
  if (event === undefined) {
    throw new RangeError(
      `Ledger reference '${id}' (${via}) is dangling: it must resolve to a recorded event (ADR-0002).`,
    );
  }
  return event;
}

function walkCauses(id: LedgerEventId, graph: LedgerGraph, visited: Set<LedgerEventId>): LedgerEvent[] {
  const collected: LedgerEvent[] = [];
  if (visited.has(id)) return collected;
  visited.add(id);
  const event = requireEvent(graph, id, 'cause');
  for (const cause of event.causes) {
    collected.push(...walkCauses(cause, graph, visited));
  }
  collected.push(event);
  return collected;
}

/**
 * Deterministic provenance chain for `eventId`: the event itself plus the
 * transitive closure of its causes, ordered from the deepest root toward the
 * event. A multi-cause (diamond) history resolves sibling order by
 * `occurredAtSimTime` then id. Dangling cause references are a data-integrity
 * error and throw rather than silently dropping a link.
 */
export function composeCausalTrace(
  eventId: LedgerEventId,
  graph: LedgerGraph,
): readonly LedgerEvent[] {
  const chain = walkCauses(eventId, graph, new Set<LedgerEventId>());
  chain.sort(compareEvents);
  return Object.freeze(chain);
}

function walkConsequences(
  id: LedgerEventId,
  graph: LedgerGraph,
  linksBySource: ReadonlyMap<LedgerEventId, readonly LedgerEventId[]>,
  visited: Set<LedgerEventId>,
): LedgerEvent[] {
  const collected: LedgerEvent[] = [];
  if (visited.has(id)) return collected;
  visited.add(id);
  const event = requireEvent(graph, id, 'consequence');
  collected.push(event);
  for (const consequenceId of linksBySource.get(id) ?? []) {
    collected.push(...walkConsequences(consequenceId, graph, linksBySource, visited));
  }
  return collected;
}

/**
 * Deterministic consequence chain for `eventId`: the event itself plus every
 * event reachable by following `LedgerConsequenceLink`s forward. Ordering and
 * integrity rules mirror `composeCausalTrace`.
 */
export function composeConsequenceChain(
  eventId: LedgerEventId,
  graph: LedgerGraph,
): readonly LedgerEvent[] {
  const linksBySource = new Map<LedgerEventId, readonly LedgerEventId[]>();
  for (const link of graph.consequenceLinks) {
    const list = linksBySource.get(link.sourceId);
    if (list === undefined) {
      linksBySource.set(link.sourceId, [link.consequenceId]);
    } else {
      linksBySource.set(link.sourceId, [...list, link.consequenceId]);
    }
  }
  const chain = walkConsequences(eventId, graph, linksBySource, new Set<LedgerEventId>());
  chain.sort(compareEvents);
  return Object.freeze(chain);
}
