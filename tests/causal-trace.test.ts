import { describe, expect, it } from 'vitest';
import type { CanonicalId } from '../src/domain/identity/index.js';
import { deriveAuthoredCanonicalId } from '../src/domain/identity/index.js';
import type { LedgerEvent } from '../src/domain/ledger/index.js';
import {
  composeCausalTrace,
  composeConsequenceChain,
  createLedgerEvent,
  ledgerEventId,
} from '../src/domain/ledger/index.js';
import { compare, simTime } from '../src/domain/time/index.js';

const ALPHA = 'alpha';
const BETA = 'beta';
const GAMMA = 'gamma';

function entity(name: string): CanonicalId {
  return deriveAuthoredCanonicalId({ sourceNamespace: 'fixture', sourceKey: name });
}

const ACTOR = entity('actor');
const ARMY = entity('army');
const REGION = entity('region');

function event(id: string, atScalar: number, causes: readonly string[] = []): LedgerEvent {
  return createLedgerEvent({
    id: ledgerEventId(id),
    occurredAtSimTime: simTime(atScalar),
    type: id.includes('civil') ? 'civil-conflict-onset' : 'domain-event',
    participants: [ACTOR],
    factions: [],
    locations: [REGION],
    witnesses: [],
    magnitude: id === 'battle' ? 4 : null,
    causes: causes.map((cause) => ledgerEventId(cause)),
  });
}

function graphOf(events: readonly LedgerEvent[], links: readonly [string, string][] = []) {
  return {
    eventById: new Map(events.map((entry) => [entry.id, entry] as const)),
    consequenceLinks: links.map(([sourceId, consequenceId]) => ({
      sourceId: ledgerEventId(sourceId),
      consequenceId: ledgerEventId(consequenceId),
    })),
  };
}

describe('ledger event creation (ADR-0002, E2)', () => {
  it('records the blueprint shape and freezes an owned snapshot', () => {
    const created = event(ALPHA, 720);
    expect(created).toEqual({
      id: ledgerEventId(ALPHA),
      occurredAtSimTime: simTime(720),
      type: 'domain-event',
      participants: [ACTOR],
      factions: [],
      locations: [REGION],
      magnitude: null,
      causes: [],
      witnesses: [],
    });
    expect(Object.isFrozen(created)).toBe(true);
    expect(Object.isFrozen(created.participants)).toBe(true);
    expect(Object.isFrozen(created.causes)).toBe(true);
  });

  it('reads caller-controlled fields exactly once (capture-once)', () => {
    const causes = [ledgerEventId(BETA)];
    const participants = [ACTOR];
    const created = createLedgerEvent({
      id: 'captured',
      occurredAtSimTime: simTime(10),
      type: 'wave',
      participants,
      causes,
    });
    causes.push(ledgerEventId(GAMMA));
    participants.push(ARMY);
    expect(created.causes).toEqual([ledgerEventId(BETA)]);
    expect(created.participants).toEqual([ACTOR]);
  });

  it('rejects ill-formed ids, empty types and non-safe magnitudes', () => {
    expect(() => event('', 0)).toThrow(RangeError);
    expect(() =>
      createLedgerEvent({ id: 'bad\uD800', occurredAtSimTime: simTime(0), type: 'x' }),
    ).toThrow(RangeError);
    expect(() =>
      createLedgerEvent({ id: 'x', occurredAtSimTime: simTime(0), type: '' }),
    ).toThrow(RangeError);
    expect(() =>
      createLedgerEvent({ id: 'x', occurredAtSimTime: simTime(0), type: 'x', magnitude: 1.5 }),
    ).toThrow(RangeError);
    expect(() =>
      createLedgerEvent({ id: 'x', occurredAtSimTime: simTime(0), type: 'x', magnitude: -1 }),
    ).toThrow(RangeError);
  });

  it('rejects non-canonical referenced identities and unsafe SimTime', () => {
    expect(() =>
      createLedgerEvent({
        id: 'x',
        occurredAtSimTime: simTime(0),
        type: 'x',
        participants: ['not-a-uuid' as CanonicalId],
      }),
    ).toThrow(RangeError);
    expect(() =>
      createLedgerEvent({ id: 'x', occurredAtSimTime: 1.5 as never, type: 'x' }),
    ).toThrow(RangeError);
  });

  it('rejects self-causation and duplicated causes', () => {
    expect(() => event(ALPHA, 0, [ALPHA])).toThrow(/self/);
    expect(() => event(ALPHA, 0, [BETA, BETA])).toThrow(/twice/);
  });
});

describe('causal trace (ADR-0002, E2)', () => {
  it('walks a provenance chain from root to the current event', () => {
    const events = [event(ALPHA, 0), event(BETA, 100, [ALPHA]), event(GAMMA, 200, [BETA])];
    const trace = composeCausalTrace(ledgerEventId(GAMMA), graphOf(events));
    expect(trace.map((entry) => entry.id)).toEqual([
      ledgerEventId(ALPHA),
      ledgerEventId(BETA),
      ledgerEventId(GAMMA),
    ]);
    expect(trace.map((entry) => entry.occurredAtSimTime)).toEqual([simTime(0), simTime(100), simTime(200)]);
  });

  it('resolves sibling causes in deterministic (time, id) order', () => {
    const x = event('x', 30);
    const y = event('y', 30);
    const onset = event('onset', 60, [x.id, y.id]);
    const trace = composeCausalTrace(onset.id, graphOf([x, y, onset]));
    expect(trace.length).toBe(3);
    expect(compare(trace[0]!.occurredAtSimTime, trace[1]!.occurredAtSimTime)).toBe(0);
    expect(trace.at(-1)).toBe(onset);
  });

  it('follows consequence links that arrive after the event (append-only link table)', () => {
    const onset = event('onset', 60);
    const response = event('response', 300);
    const chain = composeConsequenceChain(
      onset.id,
      graphOf([onset, response], [['onset', 'response']]),
    );
    expect(chain.map((entry) => entry.id)).toEqual([onset.id, response.id]);
  });

  it('rejects a dangling cause reference instead of dropping it', () => {
    const broken = event('broken', 100, [ALPHA]);
    expect(() => composeCausalTrace(broken.id, graphOf([broken]))).toThrow(/dangling/);
  });

  it('guards against cycles by visiting each event at most once', () => {
    // createLedgerEvent rejects self-causation but not mutual causation, so a
    // malformed stored graph could close a cycle; the resolver must terminate.
    const a = event(ALPHA, 0);
    const b = event(BETA, 5, [ALPHA]);
    const c = event(GAMMA, 10, [BETA]);
    const mutual = event('mutual', 20, [c.id]);
    const cyclic = graphOf([a, b, c, mutual]);
    const trace = composeCausalTrace(mutual.id, cyclic);
    expect(trace.length).toBe(4);
    expect(trace.at(-1)!.id).toBe(mutual.id);
  });
});