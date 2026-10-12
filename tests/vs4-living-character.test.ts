/**
 * VS-4 / E4 (S1): the living character slice.
 *
 * Acceptance coverage in this file:
 *  - character lifecycle: creation, death, authoritative successor
 *    designation, memory references, and the validators that guard them;
 *  - multi-facet relationships and the pure kinship/mentorship derivations;
 *  - life history and remembered events as pure projections over the ledger;
 *  - the death + `character.succession_reacted` reaction, its determinism,
 *    and the documented distinction from the politics-owned `claim.asserted`;
 *  - persistence round-trip: characters and relationships are restored from a
 *    snapshot **directly, without replaying any ledged character event**;
 *  - scheduled character work resolves authoritative state at **execution**
 *    (never a captured object), same-instant reactions stay causally linked,
 *    failed steps leave no partial state and an invalidated continuation, and
 *    checkpoint verification gates character memory + relationship coherence;
 *  - schema-version handling is explicit: fresh databases are created at the
 *    current schema and other-version saves are rejected, never repaired.
 *
 * Remediation coverage (Codex review findings):
 *  - production character death/succession work in `src/simulation`: the death
 *    schedules its causally linked reaction through the scheduler, never as a
 *    pre-scheduled step, identifiers are derived from the character, and
 *    identifiers sorting reaction-before-death only fail if scheduled by hand;
 *  - a recorded death is irreversible in persistence (no resurrection, no
 *    death-time rewrite; identical writes stay accepted) and enforced inside a
 *    transaction;
 *  - the FACET_PARENT ancestry graph is enforced acyclic at the store boundary
 *    and at checkpoint verification (direct and multi-generation cycles);
 *  - opening an existing database inspects the schema **before** any migration
 *    or journal write: unsupported or unidentifiable databases are rejected
 *    byte-for-byte unchanged, while fresh creation still works;
 *  - a character's designated successor must resolve inside the save;
 *  - a continuation saved while the death is pending, then destroyed and
 *    restored, reaches exactly the uninterrupted oracle state.
 */
import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { describe, expect, it } from 'vitest';
import Database from 'better-sqlite3';
import { createScenarioCalendar } from '../src/domain/calendar/index.js';
import type { CalendarMonth, ScenarioCalendarConfig } from '../src/domain/calendar/index.js';
import { deriveAuthoredCanonicalId } from '../src/domain/identity/index.js';
import type { CanonicalId } from '../src/domain/identity/index.js';
import {
  CHARACTER_DIED_EVENT,
  CHARACTER_SUCCESSION_REACTED_EVENT,
  FACET_AFFECTION,
  FACET_MENTOR,
  FACET_PARENT,
  FACET_RIVALRY,
  FACET_SPOUSE,
  FACET_TRUST,
  childrenOf,
  composeLifeHistory,
  composeRememberedEvents,
  createCharacter,
  createDeathEvent,
  createRelationship,
  createSuccessionReactionEvent,
  designateSuccessor,
  isAlive,
  mentorsOf,
  parentsOf,
  recordDeath,
  relatedCharacterIds,
  rememberEvent,
  requireAcyclicParentGraph,
  siblingsOf,
  spousesOf,
  studentsOf,
} from '../src/domain/character/index.js';
import { createLedgerEvent, ledgerEventId } from '../src/domain/ledger/index.js';
import {
  CheckpointIntegrityError,
  UnsupportedCheckpointVersionError,
  checkpointSlotId,
  createScenarioDescriptor,
  createWorkKindRegistry,
} from '../src/domain/persistence/index.js';
import type { CampaignStore } from '../src/domain/persistence/index.js';
import { WorkClassRank, createClock, simTime, workIdentifier } from '../src/domain/time/index.js';
import { createSqlitePersistence, openSqliteCampaignDatabase, SCHEMA_VERSION } from '../src/persistence/index.js';
import {
  CHARACTER_DEATH_WORK_KIND,
  createCharacterWorkDispatcher,
  characterDeathEventId,
  characterDeathWork,
  characterDeathWorkIdentifier,
  characterEncodeWork,
  characterReactionEventId,
  characterReactionWork,
  characterReactionWorkIdentifier,
  registerCharacterWorkKinds,
} from '../src/simulation/character-work.js';
import type { CharacterWork } from '../src/simulation/character-work.js';
import {
  createPersistentScenario,
  loadPersistentScenario,
  serializeScenarioTrace,
} from '../src/simulation/persistent-scenario-run.js';

type MonthId = 'm-01';

const monthSequence: readonly CalendarMonth<MonthId>[] = [{ id: 'm-01', days: 30 }];

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

function scenarioDescriptor() {
  return createScenarioDescriptor({
    scenarioId: deriveAuthoredCanonicalId({ sourceNamespace: 'vs4-fixture', sourceKey: 'campaign' }),
    name: 'vs4-acceptance',
    ...calendarConfig(),
  });
}

function characterId(key: string) {
  return deriveAuthoredCanonicalId({ sourceNamespace: 'vs4-fixture', sourceKey: key });
}

const PATRICIAN = characterId('patrician');
const CHILD = characterId('child');
const SPOUSE = characterId('spouse');
const MENTOR = characterId('mentor');
const STRANGER = characterId('stranger');

function tempWorkspace(label: string): string {
  return mkdtempSync(join(tmpdir(), `histgame-vs4-${label}-`));
}

/**
 * A complete character death environment: campaign + scenario + three
 * characters + kinship/spouse relationships + a prior battle ledger event, a
 * persistent scenario over the production character work, and the work
 * dispatcher bound to it.
 */
function deathTestEnv(dir: string, slotsDirectory: string) {
  const persistence = createSqlitePersistence({
    databasePath: join(dir, 'live', 'campaign.db'),
    slotsDirectory,
  });
  persistence.campaign.initializeScenario(scenarioDescriptor());
  persistence.campaign.characters.putCharacter(
    createCharacter({ id: PATRICIAN, bornAtSimTime: simTime(0) }),
  );
  persistence.campaign.characters.putCharacter(
    createCharacter({ id: CHILD, bornAtSimTime: simTime(200) }),
  );
  persistence.campaign.characters.putCharacter(
    createCharacter({ id: SPOUSE, bornAtSimTime: simTime(150) }),
  );
  persistence.campaign.characters.putRelationship({ from: PATRICIAN, to: CHILD, facets: [FACET_PARENT] });
  persistence.campaign.characters.putRelationship({ from: SPOUSE, to: PATRICIAN, facets: [FACET_SPOUSE] });
  persistence.campaign.ledger.appendEvent(
    createLedgerEvent({
      id: ledgerEventId('battle-ambush'),
      occurredAtSimTime: simTime(500),
      type: 'battle.engaged',
      participants: [PATRICIAN],
    }),
  );
  const run = createPersistentScenario<CharacterWork, MonthId>({
    clock: createClock(simTime(0)),
    calendar: createScenarioCalendar<MonthId>(calendarConfig()),
    campaign: persistence.campaign,
    checkpoints: persistence.checkpoints,
    encodeWork: characterEncodeWork,
  });
  const dispatch = createCharacterWorkDispatcher({ campaign: persistence.campaign, schedule: (entry) => run.schedule(entry) });
  return { persistence, run, dispatch };
}

function characterWorkRegistry() {
  const registry = createWorkKindRegistry<CharacterWork>();
  registerCharacterWorkKinds(registry);
  return registry;
}

describe('character lifecycle', () => {
  it('creates an alive, frozen character with sorted unique memories and no successor', () => {
    const character = createCharacter({
      id: PATRICIAN,
      bornAtSimTime: simTime(100),
      memories: [ledgerEventId('death-2'), ledgerEventId('death-1'), ledgerEventId('death-2')],
    });
    expect(character.id).toBe(PATRICIAN);
    expect(character.bornAtSimTime).toEqual(simTime(100));
    expect(character.diedAtSimTime).toBeNull();
    expect(character.designatedSuccessor).toBeNull();
    expect(character.memories).toEqual([ledgerEventId('death-1'), ledgerEventId('death-2')]);
    expect(Object.isFrozen(character)).toBe(true);
    expect(Object.isFrozen(character.memories)).toBe(true);
    expect(isAlive(character)).toBe(true);
  });

  it('rejects a non-canonical id, a non-safe-integer birth, and a self-designating successor', () => {
    expect(() => createCharacter({ id: 'not-canonical' as never, bornAtSimTime: simTime(0) })).toThrow(
      RangeError,
    );
    expect(() =>
      createCharacter({ id: PATRICIAN, bornAtSimTime: 12.5 as never }),
    ).toThrow(/safe-integer SimTime/);
    expect(() =>
      createCharacter({ id: PATRICIAN, bornAtSimTime: simTime(0), designatedSuccessor: PATRICIAN }),
    ).toThrow(/itself as its own successor/);
  });

  it('records a death once, and never before birth', () => {
    const character = createCharacter({ id: PATRICIAN, bornAtSimTime: simTime(100) });
    const dead = recordDeath(character, simTime(750));
    expect(dead.diedAtSimTime).toEqual(simTime(750));
    expect(Object.isFrozen(dead)).toBe(true);
    expect(isAlive(dead)).toBe(false);
    expect(() => recordDeath(dead, simTime(760))).toThrow(/already dead/);
    expect(() => recordDeath(character, simTime(50))).toThrow(/cannot die before it is born/);
    expect(() => recordDeath(character, simTime(100))).not.toThrow();
  });

  it('records an authoritative successor designation without deriving one', () => {
    const designated = designateSuccessor(
      createCharacter({ id: PATRICIAN, bornAtSimTime: simTime(0) }),
      CHILD,
    );
    expect(designated.designatedSuccessor).toBe(CHILD);
    expect(() => designateSuccessor(designated, PATRICIAN)).toThrow(/itself as its own successor/);
  });

  it('adds memory references deterministically and ignores duplicates', () => {
    const remembered = rememberEvent(
      rememberEvent(createCharacter({ id: PATRICIAN, bornAtSimTime: simTime(0) }), ledgerEventId('b')),
      ledgerEventId('a'),
    );
    expect(remembered.memories).toEqual([ledgerEventId('a'), ledgerEventId('b')]);
  });
});

describe('relationships and kinship', () => {
  const relationships = Object.freeze([
    createRelationship({ from: PATRICIAN, to: CHILD, facets: [FACET_PARENT, FACET_AFFECTION] }),
    createRelationship({ from: MENTOR, to: PATRICIAN, facets: [FACET_MENTOR] }),
    createRelationship({ from: SPOUSE, to: PATRICIAN, facets: [FACET_SPOUSE, FACET_TRUST] }),
    createRelationship({ from: STRANGER, to: CHILD, facets: [FACET_RIVALRY] }),
  ]);

  it('builds an owned, frozen directed edge with sorted unique facets', () => {
    const edge = createRelationship({
      from: PATRICIAN,
      to: CHILD,
      facets: [FACET_AFFECTION, 'affection', FACET_PARENT],
    });
    expect(edge.facets).toEqual([FACET_AFFECTION, FACET_PARENT]);
    expect(Object.isFrozen(edge)).toBe(true);
    expect(Object.isFrozen(edge.facets)).toBe(true);
  });

  it('rejects a self-edge, an empty facet set, and non-string facets', () => {
    expect(() =>
      createRelationship({ from: PATRICIAN, to: PATRICIAN, facets: [FACET_PARENT] }),
    ).toThrow(/cannot connect a character to itself/);
    expect(() => createRelationship({ from: PATRICIAN, to: CHILD, facets: [] })).toThrow(
      /at least one facet/,
    );
    expect(() =>
      createRelationship({ from: PATRICIAN, to: CHILD, facets: [123 as never] }),
    ).toThrow(/must be a primitive string/);
  });

  it('derives parents, children, siblings, spouses and mentors deterministically', () => {
    expect(parentsOf(CHILD, relationships)).toEqual([PATRICIAN]);
    expect(childrenOf(PATRICIAN, relationships)).toEqual([CHILD]);
    expect(siblingsOf(CHILD, relationships)).toEqual([]);
    expect(spousesOf(PATRICIAN, relationships)).toEqual([SPOUSE]);
    expect(spousesOf(SPOUSE, relationships)).toEqual([PATRICIAN]);
    expect(mentorsOf(PATRICIAN, relationships)).toEqual([MENTOR]);
    expect(studentsOf(MENTOR, relationships)).toEqual([PATRICIAN]);
  });

  it('derives the deterministic related-character set a death reaction may witness', () => {
    const related = relatedCharacterIds(PATRICIAN, relationships);
    expect(related).toEqual([CHILD, MENTOR, SPOUSE].sort());
    expect(related).toEqual([...new Set(related)].sort());
  });
});

describe('life history and remembered events (pure ledger projections)', () => {
  it('composes life history from participants alone, ordered by (time, id)', () => {
    const unrelated = createLedgerEvent({
      id: ledgerEventId('unrelated'),
      occurredAtSimTime: simTime(50),
      type: 'festival',
      participants: [STRANGER],
    });
    const victory = createLedgerEvent({
      id: ledgerEventId('victory'),
      occurredAtSimTime: simTime(100),
      type: 'battle.won',
      participants: [PATRICIAN, MENTOR],
    });
    const battle = createLedgerEvent({
      id: ledgerEventId('battle'),
      occurredAtSimTime: simTime(200),
      type: 'battle.engaged',
      participants: [PATRICIAN],
    });
    const history = composeLifeHistory(PATRICIAN, [battle, unrelated, victory]);
    expect(history.map((event) => event.id)).toEqual([ledgerEventId('victory'), ledgerEventId('battle')]);
    expect(Object.isFrozen(history)).toBe(true);
  });

  it('resolves remembered references chronologically and rejects dangling memories', () => {
    const victory = createLedgerEvent({
      id: ledgerEventId('victory'),
      occurredAtSimTime: simTime(100),
      type: 'battle.won',
      participants: [PATRICIAN],
    });
    const battle = createLedgerEvent({
      id: ledgerEventId('battle'),
      occurredAtSimTime: simTime(200),
      type: 'battle.engaged',
      participants: [PATRICIAN],
    });
    const character = createCharacter({
      id: PATRICIAN,
      bornAtSimTime: simTime(0),
      memories: [ledgerEventId('battle'), ledgerEventId('victory')],
    });
    expect(composeRememberedEvents(character, [victory, battle]).map((event) => event.id)).toEqual([
      ledgerEventId('victory'),
      ledgerEventId('battle'),
    ]);
    const haunted = rememberEvent(character, ledgerEventId('ghost'));
    expect(() => composeRememberedEvents(haunted, [victory, battle])).toThrow(RangeError);
  });
});

describe('death and the character-owned successor reaction', () => {
  const relationships = Object.freeze([
    createRelationship({ from: PATRICIAN, to: CHILD, facets: [FACET_PARENT] }),
    createRelationship({ from: SPOUSE, to: PATRICIAN, facets: [FACET_SPOUSE] }),
  ]);
  const alive = createCharacter({ id: PATRICIAN, bornAtSimTime: simTime(0) });
  const dead = recordDeath(alive, simTime(900));

  it('records character.died for a dead character only', () => {
    expect(() => createDeathEvent({ id: ledgerEventId('died'), character: alive })).toThrow(
      /still alive/,
    );
    const died = createDeathEvent({ id: ledgerEventId('died'), character: dead });
    expect(died.type).toBe(CHARACTER_DIED_EVENT);
    expect(died.participants).toEqual([PATRICIAN]);
    expect(died.occurredAtSimTime).toEqual(simTime(900));
  });

  it('records a reaction without inventing a successor when none is designated', () => {
    const died = createDeathEvent({ id: ledgerEventId('died'), character: dead });
    const reaction = createSuccessionReactionEvent({
      id: ledgerEventId('reacted'),
      character: dead,
      diedEventId: died.id,
      relatedCharacterIds: relatedCharacterIds(PATRICIAN, relationships),
    });
    expect(reaction.type).toBe(CHARACTER_SUCCESSION_REACTED_EVENT);
    expect(reaction.type).not.toBe('claim.asserted');
    // No succession decision is invented: only the dead character participates.
    expect(reaction.participants).toEqual([PATRICIAN]);
    expect([...reaction.witnesses].sort()).toEqual([CHILD, SPOUSE].sort());
    expect(reaction.causes).toEqual([died.id]);
    expect(reaction.occurredAtSimTime).toEqual(simTime(900));
  });

  it('references an authoritative designated successor when one exists', () => {
    const designated = designateSuccessor(dead, CHILD);
    const died = createDeathEvent({ id: ledgerEventId('died-2'), character: designated });
    const reaction = createSuccessionReactionEvent({
      id: ledgerEventId('reacted-2'),
      character: designated,
      diedEventId: died.id,
      relatedCharacterIds: relatedCharacterIds(PATRICIAN, relationships),
    });
    expect([...reaction.participants].sort()).toEqual([CHILD, PATRICIAN].sort());
    // The successor is excluded from the witness list.
    expect(reaction.witnesses).toEqual([SPOUSE]);
    expect(reaction.causes).toEqual([died.id]);
  });

  it('is deterministic: identical inputs yield identical reactions', () => {
    const died = createDeathEvent({ id: ledgerEventId('died-3'), character: dead });
    const input = {
      id: ledgerEventId('reacted-3'),
      character: dead,
      diedEventId: died.id,
      relatedCharacterIds: relatedCharacterIds(PATRICIAN, relationships),
    };
    expect(createSuccessionReactionEvent(input)).toEqual(createSuccessionReactionEvent(input));
  });
});

describe('VS-4 acceptance: persistence round-trip restores characters without ledger replay', () => {
  const encodeWork = (value: number) => ({ workKind: 'scalar', payload: value });

  it('mirrors characters and relationships into a fresh continuation directly', () => {
    const dir = tempWorkspace('roundtrip');
    const slotsDirectory = join(dir, 'slots');

    const first = createSqlitePersistence({
      databasePath: join(dir, 'live', 'campaign.db'),
      slotsDirectory,
    });
    first.campaign.initializeScenario(scenarioDescriptor());
    const calendar = createScenarioCalendar<MonthId>(calendarConfig());
    const clock = createClock(simTime(0));
    const run = createPersistentScenario<number, MonthId>({
      clock,
      calendar,
      campaign: first.campaign,
      checkpoints: first.checkpoints,
      encodeWork,
    });

    const parent = designateSuccessor(
      rememberEvent(createCharacter({ id: PATRICIAN, bornAtSimTime: simTime(50) }), ledgerEventId('charter')),
      CHILD,
    );
    const dead = recordDeath(parent, simTime(900));
    const child = createCharacter({ id: CHILD, bornAtSimTime: simTime(400) });
    first.campaign.characters.putCharacter(dead);
    first.campaign.characters.putCharacter(child);
    first.campaign.characters.putRelationship({
      from: PATRICIAN,
      to: CHILD,
      facets: [FACET_PARENT],
    });
    first.campaign.ledger.appendEvent(
      createLedgerEvent({
        id: ledgerEventId('charter'),
        occurredAtSimTime: simTime(60),
        type: 'land.chartered',
        participants: [PATRICIAN],
      }),
    );

    expect(first.campaign.characters.getCharacter(PATRICIAN)?.diedAtSimTime).toEqual(simTime(900));
    expect(first.campaign.characters.allCharacters()).toHaveLength(2);
    expect(first.campaign.characters.allRelationships()).toHaveLength(1);

    const save = run.save('checkpoint', 'manual');
    expect(save.ok).toBe(true);
    // No character-lifecycle event was ever ledged: the character *state* mirror must come
    // from the snapshot directly, never from replaying character events.
    expect(
      first.campaign.ledger.events().filter((event) => event.type.startsWith('character.')),
    ).toHaveLength(0);

    const loadedSnapshot = first.checkpoints.load(checkpointSlotId('checkpoint'));
    expect(loadedSnapshot.characters).toHaveLength(2);
    expect(loadedSnapshot.characters.map((character) => character.id).sort()).toEqual(
      [CHILD, PATRICIAN].sort(),
    );
    expect(loadedSnapshot.relationships).toHaveLength(1);

    first.close();
    rmSync(join(dir, 'live'), { recursive: true, force: true });

    const second = createSqlitePersistence({
      databasePath: join(dir, 'live2', 'campaign.db'),
      slotsDirectory,
    });
    const registry = createWorkKindRegistry<number>();
    const loaded = loadPersistentScenario<number, MonthId>({
      checkpoints: second.checkpoints,
      slotId: checkpointSlotId('checkpoint'),
      campaign: second.campaign,
      workKinds: registry,
      monthIds: (id) => id as MonthId,
      encodeWork,
    });

    expect(loaded.snapshot.characters).toHaveLength(2);
    expect(loaded.snapshot.ledgerEvents.map((event) => event.id)).toEqual([ledgerEventId('charter')]);

    const restoredParent = second.campaign.characters.getCharacter(PATRICIAN);
    expect(restoredParent?.diedAtSimTime).toEqual(simTime(900));
    expect(restoredParent?.designatedSuccessor).toBe(CHILD);
    expect(restoredParent?.memories).toEqual([ledgerEventId('charter')]);
    expect(second.campaign.characters.getCharacter(CHILD)?.diedAtSimTime).toBeNull();
    expect(second.campaign.characters.getRelationship(PATRICIAN, CHILD)?.facets).toEqual([FACET_PARENT]);
    expect(second.campaign.characters.allCharacters().map((character) => character.id).sort()).toEqual(
      [CHILD, PATRICIAN].sort(),
    );

    // Kinship queries work over the restored relationship set (derived, never stored),
    // and life history / memories reconstruct from the restored ledger alone.
    const restoredParentId = second.campaign.characters.getCharacter(PATRICIAN)!.id;
    expect(parentsOf(CHILD, second.campaign.characters.allRelationships())).toEqual([restoredParentId]);
    const restoredLedger = second.campaign.ledger.events();
    const restoredHistory = composeLifeHistory(PATRICIAN, restoredLedger);
    expect(restoredHistory.map((event) => event.id)).toEqual([ledgerEventId('charter')]);
    expect(
      composeRememberedEvents(second.campaign.characters.getCharacter(PATRICIAN)!, restoredLedger).map(
        (event) => event.id,
      ),
    ).toEqual([ledgerEventId('charter')]);
    expect(loaded.continuation.clock.now()).toEqual(simTime(0));

    // A dependency cycle in the ledger is impossible for atomic consequence links; a
    // dangling relationship endpoint or memory is rejected at load (ADR-0008, never repair).
    expect(() =>
      composeRememberedEvents(
        rememberEvent(second.campaign.characters.getCharacter(PATRICIAN)!, ledgerEventId('ghost')),
        restoredLedger,
      ),
    ).toThrow(RangeError);

    second.close();
    rmSync(dir, { recursive: true, force: true });
  });
});

describe('production character death work and its causally linked reaction (Codex finding 1)', () => {
  it('schedules only a death; execution derives identifiers and schedules the same-instant causally linked reaction that round-trips', () => {
    const dir = tempWorkspace('death-cause');
    const slotsDirectory = join(dir, 'slots');
    const { persistence: first, run, dispatch } = deathTestEnv(dir, slotsDirectory);

    const scheduled = dispatch.scheduleDeath(PATRICIAN, simTime(900), [ledgerEventId('battle-ambush')]);
    expect(String(scheduled.workIdentifier)).toBe(characterDeathWorkIdentifier(PATRICIAN));

    // The reaction is never pre-scheduled: it is this death execution's consequence.
    expect(run.pendingEntries()).toHaveLength(1);
    expect(run.pendingEntries()[0]!.workKind).toBe(CHARACTER_DEATH_WORK_KIND);
    expect(run.pendingEntries()[0]!.workIdentifier).toBe(characterDeathWorkIdentifier(PATRICIAN));

    // A save taken before execution captures a still-alive character plus the pending death.
    expect(run.save('checkpoint', 'manual').ok).toBe(true);
    const before = first.checkpoints.load(checkpointSlotId('checkpoint'));
    expect(before.characters.find((c) => c.id === PATRICIAN)!.diedAtSimTime).toBeNull();
    expect(before.pendingWork.map((entry) => entry.workKind)).toEqual([CHARACTER_DEATH_WORK_KIND]);

    const steps = run.runUntilHeld(dispatch.execute);
    expect(steps.map((step) => step.workIdentifier)).toEqual([
      characterDeathWorkIdentifier(PATRICIAN),
      characterReactionWorkIdentifier(PATRICIAN),
    ]);

    const events = first.campaign.ledger.events();
    const deathEvent = events.find((event) => event.id === characterDeathEventId(PATRICIAN));
    const reaction = events.find((event) => event.id === characterReactionEventId(PATRICIAN));
    expect(deathEvent?.type).toBe(CHARACTER_DIED_EVENT);
    expect(deathEvent?.occurredAtSimTime).toEqual(simTime(900));
    expect(deathEvent?.causes).toEqual([ledgerEventId('battle-ambush')]);
    expect(reaction?.type).toBe(CHARACTER_SUCCESSION_REACTED_EVENT);
    expect(reaction?.occurredAtSimTime).toEqual(simTime(900));
    expect(reaction?.causes).toEqual([characterDeathEventId(PATRICIAN)]);
    expect(reaction?.participants).toEqual([PATRICIAN]);
    expect([...reaction!.witnesses].sort()).toEqual([CHILD, SPOUSE].sort());
    const deadPatrician = first.campaign.characters.getCharacter(PATRICIAN);
    expect(deadPatrician?.diedAtSimTime).toEqual(simTime(900));
    expect(deadPatrician?.memories).toEqual([characterDeathEventId(PATRICIAN)]);
    expect(run.pendingCount()).toBe(0);
    expect(run.runUntilHeld(dispatch.execute)).toEqual([]);

    first.close();
    rmSync(join(dir, 'live'), { recursive: true, force: true });

    const second = createSqlitePersistence({ databasePath: join(dir, 'live2', 'campaign.db'), slotsDirectory });
    const loaded = loadPersistentScenario<CharacterWork, MonthId>({
      checkpoints: second.checkpoints,
      slotId: checkpointSlotId('checkpoint'),
      campaign: second.campaign,
      workKinds: characterWorkRegistry(),
      monthIds: (id) => id as MonthId,
      encodeWork: characterEncodeWork,
    });

    // The saved continuation still holds only the pending death of a still-alive character.
    expect(loaded.snapshot.characters.find((c) => c.id === PATRICIAN)!.diedAtSimTime).toBeNull();
    expect(loaded.continuation.pendingEntries()).toHaveLength(1);
    expect(loaded.continuation.pendingEntries()[0]!.workKind).toBe(CHARACTER_DEATH_WORK_KIND);

    const restoredDispatch = createCharacterWorkDispatcher({
      campaign: second.campaign,
      schedule: (entry) => loaded.continuation.schedule(entry),
    });
    const restoredSteps = loaded.continuation.runUntilHeld(restoredDispatch.execute);
    expect(serializeScenarioTrace(restoredSteps)).toBe(serializeScenarioTrace(steps));

    const restoredParent = second.campaign.characters.getCharacter(PATRICIAN);
    expect(restoredParent?.diedAtSimTime).toEqual(simTime(900));
    expect(restoredParent?.memories).toEqual([characterDeathEventId(PATRICIAN)]);
    expect(
      second.campaign.ledger.events().find((event) => event.id === characterReactionEventId(PATRICIAN))!
        .causes,
    ).toEqual([characterDeathEventId(PATRICIAN)]);
    expect(loaded.continuation.pendingCount()).toBe(0);

    second.close();
    rmSync(dir, { recursive: true, force: true });
  });

  it('executors guard against double death, unmirrored characters and reactions on still-alive characters', () => {
    const dir = tempWorkspace('death-guards');
    const slotsDirectory = join(dir, 'slots');
    const { persistence: first, run, dispatch } = deathTestEnv(dir, slotsDirectory);

    dispatch.scheduleDeath(PATRICIAN, simTime(900));
    expect(() => dispatch.scheduleDeath(MENTOR, simTime(900))).toThrow(/not mirrored/);
    run.runUntilHeld(dispatch.execute);
    expect(first.campaign.characters.getCharacter(PATRICIAN)?.diedAtSimTime).toEqual(simTime(900));
    // A death is recorded once: scheduling or executing a second death fails loudly.
    expect(() => dispatch.scheduleDeath(PATRICIAN, simTime(910))).toThrow(/already died/);
    run.schedule({
      workIdentifier: workIdentifier('second-death'),
      dueSimTime: simTime(920),
      classRank: WorkClassRank.world,
      work: characterDeathWork(PATRICIAN),
    });
    expect(() => run.runUntilHeld(dispatch.execute)).toThrow(/already died/);
    first.close();
    rmSync(dir, { recursive: true, force: true });

    // A reaction for a still-alive character is meaningless and rejected loudly.
    const dir2 = tempWorkspace('death-guards-reaction');
    const second = deathTestEnv(dir2, join(dir2, 'slots'));
    second.run.schedule({
      workIdentifier: workIdentifier('orphan-reaction'),
      dueSimTime: simTime(900),
      classRank: WorkClassRank.world,
      work: characterReactionWork(SPOUSE),
    });
    expect(() => second.run.runUntilHeld(second.dispatch.execute)).toThrow(/still alive/);
    second.persistence.close();
    rmSync(dir2, { recursive: true, force: true });
  });

  it('regression: an independently pre-scheduled reaction sorting before its death fires too early and fails; the dispatcher never relies on identifier arrangement', () => {
    const dir = tempWorkspace('ordering-naive');
    const { persistence: first, run, dispatch } = deathTestEnv(dir, join(dir, 'slots'));
    // A hand-scheduled reaction whose identifier sorts BEFORE the death identifier at
    // the same instant runs first, on a still-alive character, under the scheduler's
    // own total order -- proving causality cannot come from identifier order alone.
    run.schedule({
      workIdentifier: workIdentifier('a-reaction'),
      dueSimTime: simTime(900),
      classRank: WorkClassRank.world,
      work: characterReactionWork(PATRICIAN),
    });
    run.schedule({
      workIdentifier: workIdentifier('z-death'),
      dueSimTime: simTime(900),
      classRank: WorkClassRank.world,
      work: characterDeathWork(PATRICIAN),
    });
    expect(() => run.runUntilHeld(dispatch.execute)).toThrow(/still alive/);
    expect(() => run.runUntilHeld(dispatch.execute)).toThrow(/invalid/);
    expect(first.campaign.characters.getCharacter(PATRICIAN)?.diedAtSimTime).toBeNull();
    first.close();
    rmSync(dir, { recursive: true, force: true });

    // Causal scheduling through the dispatcher needs no such arrangement: the death
    // schedules its reaction, and derived identifiers put death before reaction.
    const causalDir = tempWorkspace('ordering-causal');
    const { persistence: causalPersistence, run: causalRun, dispatch: causalDispatch } = deathTestEnv(
      causalDir,
      join(causalDir, 'slots'),
    );
    causalDispatch.scheduleDeath(PATRICIAN, simTime(900));
    const steps = causalRun.runUntilHeld(causalDispatch.execute);
    expect(steps.map((step) => step.workIdentifier)).toEqual([
      characterDeathWorkIdentifier(PATRICIAN),
      characterReactionWorkIdentifier(PATRICIAN),
    ]);
    expect(causalPersistence.campaign.characters.getCharacter(PATRICIAN)?.diedAtSimTime).toEqual(simTime(900));
    causalPersistence.close();
    rmSync(causalDir, { recursive: true, force: true });
  });
});

describe('persistence treats a recorded death as irreversible (Codex finding 2)', () => {
  const scalarEncode = (value: number) => ({ workKind: 'scalar', payload: value });

  it('validates the captured death once, despite a changing accessor', () => {
    const dir = tempWorkspace('death-accessor');
    const { sqlite, store } = openSqliteCampaignDatabase(join(dir, 'live.db'));
    try {
      const alive = createCharacter({ id: PATRICIAN, bornAtSimTime: simTime(0) });
      const dead = recordDeath(alive, simTime(900));
      store.characters.putCharacter(dead);
      for (const capturedDeath of [null, simTime(901)]) {
        let reads = 0;
        const hostile = {
          ...alive,
          get diedAtSimTime() {
            return ++reads === 1 ? capturedDeath : simTime(900);
          },
        };
        expect(() => store.characters.putCharacter(hostile)).toThrow(
          capturedDeath === null ? /resurrect/ : /cannot be rewritten/,
        );
        expect(reads).toBe(1);
        expect(store.characters.getCharacter(PATRICIAN)).toEqual(dead);
      }
      let reads = 0;
      expect(store.characters.putCharacter({
        ...dead,
        get diedAtSimTime() { return ++reads === 1 ? simTime(900) : null; },
      })).toEqual(dead);
      expect(reads).toBe(1);
    } finally {
      sqlite.close();
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('a stale live snapshot cannot resurrect a dead character', () => {
    const dir = tempWorkspace('resurrect');
    const first = createSqlitePersistence({
      databasePath: join(dir, 'live', 'campaign.db'),
      slotsDirectory: join(dir, 'slots'),
    });
    first.campaign.initializeScenario(scenarioDescriptor());
    const dead = recordDeath(createCharacter({ id: PATRICIAN, bornAtSimTime: simTime(0) }), simTime(900));
    first.campaign.characters.putCharacter(dead);
    expect(() =>
      first.campaign.characters.putCharacter(createCharacter({ id: PATRICIAN, bornAtSimTime: simTime(0) })),
    ).toThrow(/resurrect/);
    expect(first.campaign.characters.getCharacter(PATRICIAN)?.diedAtSimTime).toEqual(simTime(900));
    first.close();
    rmSync(dir, { recursive: true, force: true });
  });

  it('a recorded death cannot be rewritten to a different instant, while identical writes stay accepted', () => {
    const dir = tempWorkspace('death-rewrite');
    const first = createSqlitePersistence({
      databasePath: join(dir, 'live', 'campaign.db'),
      slotsDirectory: join(dir, 'slots'),
    });
    first.campaign.initializeScenario(scenarioDescriptor());
    const dead = recordDeath(createCharacter({ id: PATRICIAN, bornAtSimTime: simTime(0) }), simTime(900));
    first.campaign.characters.putCharacter(dead);
    expect(() =>
      first.campaign.characters.putCharacter(
        recordDeath(createCharacter({ id: PATRICIAN, bornAtSimTime: simTime(0) }), simTime(901)),
      ),
    ).toThrow(/cannot be rewritten/);
    // The death reaction re-upserts the same dead character with its new memory:
    // an identical death write must stay accepted.
    expect(() => first.campaign.characters.putCharacter(dead)).not.toThrow();
    expect(first.campaign.characters.getCharacter(PATRICIAN)?.diedAtSimTime).toEqual(simTime(900));
    first.close();
    rmSync(dir, { recursive: true, force: true });
  });

  it.each([false, true])('an attempted resurrection rolls back and invalidates continuation (changing accessor: %s)', (changingAccessor) => {
    const dir = tempWorkspace('resurrect-step');
    const first = createSqlitePersistence({
      databasePath: join(dir, 'live', 'campaign.db'),
      slotsDirectory: join(dir, 'slots'),
    });
    first.campaign.initializeScenario(scenarioDescriptor());
    first.campaign.characters.putCharacter(
      recordDeath(createCharacter({ id: PATRICIAN, bornAtSimTime: simTime(0) }), simTime(900)),
    );
    const run = createPersistentScenario<number, MonthId>({
      clock: createClock(simTime(0)),
      calendar: createScenarioCalendar<MonthId>(calendarConfig()),
      campaign: first.campaign,
      encodeWork: scalarEncode,
    });
    run.schedule({
      workIdentifier: workIdentifier('zombie'),
      dueSimTime: simTime(1000),
      classRank: WorkClassRank.world,
      work: 1,
    });
    const pendingBefore = first.campaign.pendingWork.readPendingWork();
    let deathReads = 0;
    expect(() =>
      run.runUntilHeld(() => {
        first.campaign.world.writeCurrentSimTime(simTime(777));
        first.campaign.characters.putCharacter(createCharacter({ id: CHILD, bornAtSimTime: simTime(0) }));
        const stale = createCharacter({ id: PATRICIAN, bornAtSimTime: simTime(0) });
        first.campaign.characters.putCharacter(changingAccessor ? {
          ...stale,
          get diedAtSimTime() { return ++deathReads === 1 ? null : simTime(900); },
        } : stale);
      }),
    ).toThrow(/resurrect/);
    if (changingAccessor) expect(deathReads).toBe(1);
    expect(first.campaign.characters.getCharacter(PATRICIAN)?.diedAtSimTime).toEqual(simTime(900));
    expect(first.campaign.characters.getCharacter(CHILD)).toBeNull();
    expect(first.campaign.world.readCurrentSimTime()).toEqual(simTime(0));
    expect(first.campaign.pendingWork.readPendingWork()).toEqual(pendingBefore);
    expect(() => run.runUntilHeld()).toThrow(/invalid/);
    expect(() => run.save('never', 'manual')).toThrow(/invalid/);
    first.close();
    rmSync(dir, { recursive: true, force: true });
  });
});

describe('the FACET_PARENT ancestry graph stays acyclic everywhere it enters the system (Codex finding 3)', () => {
  const A = characterId('ancestor-a');
  const B = characterId('ancestor-b');
  const C = characterId('ancestor-c');
  const parentEdge = (from: CanonicalId, to: CanonicalId) =>
    createRelationship({ from, to, facets: [FACET_PARENT] });

  it('domain: rejects direct and multi-generation parent cycles, accepts acyclic and non-parent graphs', () => {
    expect(() => requireAcyclicParentGraph([parentEdge(A, B), parentEdge(B, A)])).toThrow(/acyclic/);
    expect(() => requireAcyclicParentGraph([parentEdge(A, B), parentEdge(B, C), parentEdge(C, A)])).toThrow(
      /acyclic/,
    );
    expect(() => requireAcyclicParentGraph([parentEdge(A, B), parentEdge(B, C), parentEdge(A, C)])).not.toThrow();
    // Spouse edges are not ancestry edges and may be reciprocal.
    expect(() =>
      requireAcyclicParentGraph([
        createRelationship({ from: A, to: B, facets: [FACET_SPOUSE] }),
        createRelationship({ from: B, to: A, facets: [FACET_SPOUSE] }),
      ]),
    ).not.toThrow();
    expect(() => requireAcyclicParentGraph([])).not.toThrow();
  });

  it('store: rejects the captured parent facet before SQLite sees a changing accessor cycle', () => {
    const dir = tempWorkspace('ancestry-accessor');
    const { sqlite, store } = openSqliteCampaignDatabase(join(dir, 'live.db'));
    try {
      for (const id of [A, B]) {
        store.characters.putCharacter(createCharacter({ id, bornAtSimTime: simTime(0) }));
      }
      store.characters.putRelationship(parentEdge(A, B));
      const changesBefore = sqlite.prepare('SELECT total_changes() AS count').get();
      let reads = 0;
      expect(() => store.characters.putRelationship({
        from: B,
        to: A,
        get facets() { return ++reads === 1 ? [FACET_PARENT, FACET_TRUST] : [FACET_SPOUSE]; },
      })).toThrow(/acyclic/);
      expect(reads).toBe(1);
      expect(sqlite.prepare('SELECT total_changes() AS count').get()).toEqual(changesBefore);
      expect(store.characters.getRelationship(B, A)).toBeNull();
      const facets = [FACET_MENTOR, FACET_TRUST];
      let endpointReads = 0;
      const stored = store.characters.putRelationship({
        get from() { return ++endpointReads === 1 ? B : A; },
        to: A,
        facets,
      });
      facets.push(FACET_PARENT);
      expect(endpointReads).toBe(1);
      expect(stored).toEqual(createRelationship({ from: B, to: A, facets: [FACET_MENTOR, FACET_TRUST] }));
      expect(store.characters.getRelationship(B, A)).toEqual(stored);
    } finally {
      sqlite.close();
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('store: refuses a write that would introduce a parent cycle and leaves no partial row', () => {
    const dir = tempWorkspace('ancestry-store');
    const first = createSqlitePersistence({
      databasePath: join(dir, 'live', 'campaign.db'),
      slotsDirectory: join(dir, 'slots'),
    });
    first.campaign.initializeScenario(scenarioDescriptor());
    for (const id of [A, B, C]) {
      first.campaign.characters.putCharacter(createCharacter({ id, bornAtSimTime: simTime(0) }));
    }
    first.campaign.characters.putRelationship(parentEdge(A, B));
    first.campaign.characters.putRelationship(parentEdge(B, C));
    first.campaign.characters.putRelationship(parentEdge(A, C));
    expect(() => first.campaign.characters.putRelationship(parentEdge(C, A))).toThrow(/acyclic/);
    expect(first.campaign.characters.getRelationship(C, A)).toBeNull();
    expect(first.campaign.characters.allRelationships()).toHaveLength(3);
    first.close();
    rmSync(dir, { recursive: true, force: true });
  });

  it('checkpoint: refuses to load a published slot whose parent graph is cyclic', () => {
    const dir = tempWorkspace('ancestry-checkpoint');
    const slotsDirectory = join(dir, 'slots');
    const first = createSqlitePersistence({ databasePath: join(dir, 'live', 'campaign.db'), slotsDirectory });
    first.campaign.initializeScenario(scenarioDescriptor());
    for (const id of [A, B]) {
      first.campaign.characters.putCharacter(createCharacter({ id, bornAtSimTime: simTime(0) }));
    }
    first.campaign.characters.putRelationship(parentEdge(A, B));
    expect(first.checkpoints.save(checkpointSlotId('acyclic'), 'manual').ok).toBe(true);
    // A hand-edited slot closes the ancestor cycle: verification must refuse it.
    const edited = new Database(join(slotsDirectory, `${checkpointSlotId('acyclic')}.db`));
    edited
      .prepare('INSERT INTO relationship (from_id, to_id, facets) VALUES (?, ?, ?)')
      .run(String(B), String(A), JSON.stringify([FACET_PARENT]));
    edited.close();
    expect(() => first.checkpoints.load(checkpointSlotId('acyclic'))).toThrow(CheckpointIntegrityError);
    first.close();
    rmSync(dir, { recursive: true, force: true });
  });
});

describe('designated successor references resolve within the save (Codex finding 5)', () => {
  it('refuses to publish a save whose character designates a successor that is not in the save', () => {
    const dir = tempWorkspace('successor-ghost');
    const first = createSqlitePersistence({
      databasePath: join(dir, 'live', 'campaign.db'),
      slotsDirectory: join(dir, 'slots'),
    });
    first.campaign.initializeScenario(scenarioDescriptor());
    first.campaign.characters.putCharacter(
      createCharacter({ id: PATRICIAN, bornAtSimTime: simTime(0), designatedSuccessor: CHILD }),
    );
    const save = first.checkpoints.save(checkpointSlotId('checkpoint'), 'manual');
    expect(save.ok).toBe(false);
    if (!save.ok) expect(save.reason).toMatch(/designates .* not a character in this save/);
    expect(first.checkpoints.listSlots()).toEqual([]);
    first.close();
    rmSync(dir, { recursive: true, force: true });
  });

  it('a designation referencing another character in the save survives save and restore', () => {
    const dir = tempWorkspace('successor-valid');
    const slotsDirectory = join(dir, 'slots');
    const first = createSqlitePersistence({ databasePath: join(dir, 'live', 'campaign.db'), slotsDirectory });
    first.campaign.initializeScenario(scenarioDescriptor());
    first.campaign.characters.putCharacter(
      designateSuccessor(createCharacter({ id: PATRICIAN, bornAtSimTime: simTime(0) }), CHILD),
    );
    first.campaign.characters.putCharacter(createCharacter({ id: CHILD, bornAtSimTime: simTime(200) }));
    expect(first.checkpoints.save(checkpointSlotId('checkpoint'), 'manual').ok).toBe(true);
    const snapshot = first.checkpoints.load(checkpointSlotId('checkpoint'));
    expect(snapshot.characters.find((c) => c.id === PATRICIAN)?.designatedSuccessor).toBe(CHILD);
    first.close();
    rmSync(dir, { recursive: true, force: true });
  });
});

describe('opening an existing unsupported database never migrates or modifies it (Codex finding 4)', () => {
  function leaveCommittedWal(path: string, sql: string): void {
    const script = [
      "import Database from 'better-sqlite3';",
      'const sqlite = new Database(process.argv[1]);',
      "sqlite.pragma('journal_mode = WAL');",
      "sqlite.pragma('wal_autocheckpoint = 0');",
      'sqlite.exec(process.argv[2]);',
      'process.exit(0);', // Deliberately bypass SQLite close/checkpoint.
    ].join('\n');
    execFileSync(process.execPath, ['--input-type=module', '-e', script, path, sql], { cwd: process.cwd() });
  }

  it.each([false, true])('rejects unsupported WAL without changing main, WAL or SHM (supported base file: %s)', (supportedBase) => {
    const dir = tempWorkspace('legacy-pending-wal');
    const path = join(dir, 'live.db');
    try {
      if (supportedBase) {
        const initial = openSqliteCampaignDatabase(path);
        initial.sqlite.close();
        leaveCommittedWal(path, "UPDATE meta SET value = '1' WHERE key = 'schema_version';");
      } else {
        leaveCommittedWal(path, "CREATE TABLE meta (key TEXT PRIMARY KEY NOT NULL, value TEXT NOT NULL); INSERT INTO meta VALUES ('schema_version', '1');");
      }
      const names = readdirSync(dir).sort();
      expect(names).toEqual(['live.db', 'live.db-shm', 'live.db-wal']);
      const before = names.map((name) => readFileSync(join(dir, name)));
      expect(before[2]!.length).toBeGreaterThan(32);
      for (let attempt = 0; attempt < 2; attempt++) {
        expect(() => openSqliteCampaignDatabase(path)).toThrow(/schema version 1/);
        expect(readdirSync(dir).sort()).toEqual(names);
        expect(names.map((name) => readFileSync(join(dir, name)))).toEqual(before);
      }
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('opens a supported database with committed WAL using its recovered metadata and state', () => {
    const dir = tempWorkspace('supported-pending-wal');
    const path = join(dir, 'live.db');
    try {
      const initial = openSqliteCampaignDatabase(path);
      initial.store.initializeScenario(scenarioDescriptor());
      // Only the committed WAL restores the supported schema stamp.
      initial.sqlite.prepare("UPDATE meta SET value = '1' WHERE key = 'schema_version'").run();
      initial.sqlite.close();
      leaveCommittedWal(path, "UPDATE meta SET value = '" + SCHEMA_VERSION + "' WHERE key = 'schema_version'; UPDATE meta SET value = '720' WHERE key = 'current_sim_time';");
      expect(readdirSync(dir)).toContain('live.db-wal');
      const reopened = openSqliteCampaignDatabase(path);
      try {
        expect(reopened.store.world.readCurrentSimTime()).toBe(simTime(720));
        expect(reopened.store.readScenario()).toEqual(scenarioDescriptor());
      } finally {
        reopened.sqlite.close();
      }
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('fails closed on a rollback journal without touching database or journal bytes', () => {
    const dir = tempWorkspace('rollback-journal');
    const path = join(dir, 'live.db');
    try {
      const initial = openSqliteCampaignDatabase(path);
      initial.sqlite.close();
      writeFileSync(path + '-journal', 'unresolved recovery state');
      const names = readdirSync(dir).sort();
      const before = names.map((name) => readFileSync(join(dir, name)));
      expect(() => openSqliteCampaignDatabase(path)).toThrow(/rollback journal/);
      expect(readdirSync(dir).sort()).toEqual(names);
      expect(names.map((name) => readFileSync(join(dir, name)))).toEqual(before);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('rejects an older-schema live database before any migration, leaving bytes, schema and sidecars untouched', () => {
    const dir = tempWorkspace('legacy-live');
    const path = join(dir, 'live.db');
    const crafted = new Database(path);
    crafted.exec('CREATE TABLE meta (key TEXT PRIMARY KEY NOT NULL, value TEXT NOT NULL)');
    crafted.exec('CREATE TABLE scenario (id TEXT PRIMARY KEY NOT NULL)');
    crafted.prepare('INSERT INTO meta (key, value) VALUES (?, ?)').run('schema_version', '1');
    crafted.close();
    const bytesBefore = readFileSync(path);
    const entriesBefore = readdirSync(dir);

    expect(() => openSqliteCampaignDatabase(path)).toThrow(/schema version 1/);
    expect(readFileSync(path)).toEqual(bytesBefore);
    expect(readdirSync(dir)).toEqual(entriesBefore);

    const inspected = new Database(path);
    try {
      const names = inspected
        .prepare("SELECT name FROM sqlite_master WHERE type = 'table'")
        .all()
        .map((row) => (row as { readonly name: string }).name);
      expect(names).not.toContain('character');
      expect(names).not.toContain('relationship');
      expect(names).not.toContain('__drizzle_migrations');
      const version = inspected
        .prepare("SELECT value FROM meta WHERE key = 'schema_version'")
        .get() as { value: string };
      expect(version.value).toBe('1');
    } finally {
      inspected.close();
    }
    rmSync(dir, { recursive: true, force: true });
  });

  it('rejects a database carrying tables but no schema_version without modification', () => {
    const dir = tempWorkspace('versionless');
    const path = join(dir, 'live.db');
    const crafted = new Database(path);
    crafted.exec('CREATE TABLE scenario (id TEXT PRIMARY KEY NOT NULL)');
    crafted.close();
    const bytesBefore = readFileSync(path);

    expect(() => openSqliteCampaignDatabase(path)).toThrow(/cannot be identified/);
    expect(readFileSync(path)).toEqual(bytesBefore);

    const inspected = new Database(path);
    try {
      const names = inspected
        .prepare("SELECT name FROM sqlite_master WHERE type = 'table'")
        .all()
        .map((row) => (row as { readonly name: string }).name);
      expect(names).not.toContain('character');
      expect(names).not.toContain('relationship');
      expect(names).not.toContain('__drizzle_migrations');
    } finally {
      inspected.close();
    }
    rmSync(dir, { recursive: true, force: true });
  });
});

describe('pending character continuation proof (Codex finding 6)', () => {
  function finalState(campaign: CampaignStore) {
    return {
      characters: campaign.characters.allCharacters().map((c) => ({
        id: c.id,
        bornAtSimTime: c.bornAtSimTime,
        diedAtSimTime: c.diedAtSimTime,
        designatedSuccessor: c.designatedSuccessor,
        memories: [...c.memories],
      })),
      relationships: campaign.characters.allRelationships().map((r) => ({
        from: r.from,
        to: r.to,
        facets: [...r.facets],
      })),
      events: campaign.ledger.events().map((e) => ({
        id: e.id,
        occurredAtSimTime: e.occurredAtSimTime,
        type: e.type,
        participants: [...e.participants],
        witnesses: [...e.witnesses],
        causes: [...e.causes],
      })),
    };
  }

  it('a save taken while the death is pending, then destroyed and restored, reaches exactly the uninterrupted oracle', () => {
    // Uninterrupted oracle in its own environment.
    const oracleDir = tempWorkspace('oracle');
    const oracle = deathTestEnv(oracleDir, join(oracleDir, 'slots'));
    oracle.dispatch.scheduleDeath(PATRICIAN, simTime(700), [ledgerEventId('battle-ambush')]);
    const oracleSteps = oracle.run.runUntilHeld(oracle.dispatch.execute);
    const oracleFinal = finalState(oracle.persistence.campaign);
    expect(oracle.run.pendingCount()).toBe(0);

    // Persist track: identical setup, but save while the death is pending and
    // never execute; then destroy the environment and continue from a fresh restore.
    const dir = tempWorkspace('pending-continuation');
    const slotsDirectory = join(dir, 'slots');
    const env = deathTestEnv(dir, slotsDirectory);
    env.dispatch.scheduleDeath(PATRICIAN, simTime(700), [ledgerEventId('battle-ambush')]);
    expect(env.run.pendingEntries()).toHaveLength(1);
    expect(env.run.save('checkpoint', 'manual').ok).toBe(true);
    const before = env.persistence.checkpoints.load(checkpointSlotId('checkpoint'));
    expect(before.characters.find((c) => c.id === PATRICIAN)!.diedAtSimTime).toBeNull();
    expect(before.pendingWork.map((entry) => entry.workKind)).toEqual([CHARACTER_DEATH_WORK_KIND]);

    env.persistence.close();
    rmSync(join(dir, 'live'), { recursive: true, force: true });

    const second = createSqlitePersistence({ databasePath: join(dir, 'live2', 'campaign.db'), slotsDirectory });
    const loaded = loadPersistentScenario<CharacterWork, MonthId>({
      checkpoints: second.checkpoints,
      slotId: checkpointSlotId('checkpoint'),
      campaign: second.campaign,
      workKinds: characterWorkRegistry(),
      monthIds: (id) => id as MonthId,
      encodeWork: characterEncodeWork,
    });
    expect(loaded.continuation.clock.now()).toEqual(simTime(0));
    expect(loaded.continuation.pendingEntries()).toHaveLength(1);
    expect(loaded.continuation.pendingEntries()[0]!.workKind).toBe(CHARACTER_DEATH_WORK_KIND);

    const restoredDispatch = createCharacterWorkDispatcher({
      campaign: second.campaign,
      schedule: (entry) => loaded.continuation.schedule(entry),
    });
    const restoredSteps = loaded.continuation.runUntilHeld(restoredDispatch.execute);
    expect(loaded.continuation.pendingCount()).toBe(0);

    // The interrupted-and-restored run matches the uninterrupted oracle exactly:
    // deterministic trace, character state, relationships, memories, ledger
    // (including the causally linked death -> reaction), and pending work.
    expect(serializeScenarioTrace(restoredSteps)).toBe(serializeScenarioTrace(oracleSteps));
    expect(finalState(second.campaign)).toEqual(oracleFinal);
    expect(
      finalState(second.campaign).events.find((e) => e.id === characterReactionEventId(PATRICIAN))!.causes,
    ).toEqual([characterDeathEventId(PATRICIAN)]);

    second.close();
    rmSync(dir, { recursive: true, force: true });
    oracle.persistence.close();
    rmSync(oracleDir, { recursive: true, force: true });
  });
});

describe('transactional correctness on failure (constraint 8)', () => {
  const encodeWork = (value: number) => ({ workKind: 'scalar', payload: value });

  it('a failed step leaves no character state, no ledger rows, and an invalid continuation', () => {
    const dir = tempWorkspace('rollback');
    const first = createSqlitePersistence({
      databasePath: join(dir, 'live', 'campaign.db'),
      slotsDirectory: join(dir, 'slots'),
    });
    first.campaign.initializeScenario(scenarioDescriptor());
    const run = createPersistentScenario<number, MonthId>({
      clock: createClock(simTime(0)),
      calendar: createScenarioCalendar<MonthId>(calendarConfig()),
      campaign: first.campaign,
      encodeWork,
    });
    run.schedule({
      workIdentifier: workIdentifier('boom'),
      dueSimTime: simTime(10),
      classRank: WorkClassRank.world,
      work: 1,
    });

    expect(() =>
      run.runUntilHeld(() => {
        first.campaign.characters.putCharacter(createCharacter({ id: PATRICIAN, bornAtSimTime: simTime(0) }));
        first.campaign.ledger.appendEvent(
          createLedgerEvent({
            id: ledgerEventId('partial'),
            occurredAtSimTime: simTime(10),
            type: 'boom',
            participants: [PATRICIAN],
          }),
        );
        throw new Error('boom');
      }),
    ).toThrow('boom');

    // The atomic step failed: nothing partial is visible anywhere.
    expect(first.campaign.characters.getCharacter(PATRICIAN)).toBeNull();
    expect(first.campaign.characters.allCharacters()).toHaveLength(0);
    expect(first.campaign.characters.allRelationships()).toHaveLength(0);
    expect(first.campaign.ledger.events()).toHaveLength(0);

    // The in-memory continuation is not "apparently valid": it refuses further
    // execution and saving, and a would-be checkpoint is refused too.
    expect(() => run.runUntilHeld(() => {})).toThrow(/invalid/);
    expect(() => run.save('checkpoint', 'manual')).toThrow(/invalid/);
    expect(first.campaign.pendingWork.readPendingWork()).toEqual([]);

    first.close();
    rmSync(dir, { recursive: true, force: true });
  });
});

describe('snapshot verification covers character state (constraint 2)', () => {
  it('refuses to publish a save whose character memory does not resolve in the ledger', () => {
    const dir = tempWorkspace('verify-memory');
    const first = createSqlitePersistence({
      databasePath: join(dir, 'live', 'campaign.db'),
      slotsDirectory: join(dir, 'slots'),
    });
    first.campaign.initializeScenario(scenarioDescriptor());
    first.campaign.characters.putCharacter(
      createCharacter({
        id: PATRICIAN,
        bornAtSimTime: simTime(0),
        memories: [ledgerEventId('ghost')],
      }),
    );
    const save = first.checkpoints.save(checkpointSlotId('checkpoint'), 'manual');
    expect(save.ok).toBe(false);
    if (!save.ok) expect(save.reason).toMatch(/remembers ledger event/);
    expect(first.checkpoints.listSlots()).toEqual([]);

    first.close();
    rmSync(dir, { recursive: true, force: true });
  });

  it('refuses to publish a save whose relationship references a missing character', () => {
    const dir = tempWorkspace('verify-relationship');
    const first = createSqlitePersistence({
      databasePath: join(dir, 'live', 'campaign.db'),
      slotsDirectory: join(dir, 'slots'),
    });
    first.campaign.initializeScenario(scenarioDescriptor());
    first.campaign.characters.putCharacter(
      createCharacter({ id: PATRICIAN, bornAtSimTime: simTime(0) }),
    );
    first.campaign.characters.putRelationship({
      from: PATRICIAN,
      to: CHILD,
      facets: [FACET_PARENT],
    });
    const save = first.checkpoints.save(checkpointSlotId('checkpoint'), 'manual');
    expect(save.ok).toBe(false);
    if (!save.ok) expect(save.reason).toMatch(/not a character in this save/);
    expect(first.checkpoints.listSlots()).toEqual([]);

    first.close();
    rmSync(dir, { recursive: true, force: true });
  });
});

describe('schema version handling (constraint 9)', () => {
  it('creates a fresh database at the current schema with the character tables', () => {
    const dir = tempWorkspace('schema-fresh');
    const opened = openSqliteCampaignDatabase(join(dir, 'live.db'));
    try {
      opened.store.initializeScenario(scenarioDescriptor());
      const tables = opened.sqlite
        .prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name IN ('character', 'relationship')")
        .all()
        .map((row) => (row as { name: string }).name)
        .sort();
      expect(tables).toEqual(['character', 'relationship']);
      const version = opened.sqlite
        .prepare("SELECT value FROM meta WHERE key = 'schema_version'")
        .get() as { value: string };
      expect(version.value).toBe(String(SCHEMA_VERSION));
    } finally {
      opened.sqlite.close();
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('rejects saves recorded under another schema version explicitly (no silent repair)', () => {
    const dir = tempWorkspace('schema-legacy-save');
    const path = join(dir, 'slots', `${checkpointSlotId('legacy-1')}.db`);
    mkdirSync(dirname(path), { recursive: true });
    const crafted = new Database(path);
    crafted.exec('CREATE TABLE meta (key TEXT PRIMARY KEY NOT NULL, value TEXT NOT NULL)');
    const insert = crafted.prepare('INSERT INTO meta (key, value) VALUES (?, ?)');
    insert.run('schema_version', '1');
    insert.run('save_kind', 'manual');
    insert.run('current_sim_time', '0');
    crafted.close();

    const composed = createSqlitePersistence({
      databasePath: join(dir, 'live', 'campaign.db'),
      slotsDirectory: join(dir, 'slots'),
    });
    try {
      expect(() => composed.checkpoints.load(checkpointSlotId('legacy-1'))).toThrow(
        UnsupportedCheckpointVersionError,
      );
    } finally {
      composed.close();
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
// The nearby ledger link boundary had the same validate-then-reread mismatch.
describe('captured ledger consequence endpoints', () => {
  it('persists exactly the endpoints validated once, despite changing accessors', () => {
    const dir = tempWorkspace('link-accessor');
    const { sqlite, store } = openSqliteCampaignDatabase(join(dir, 'live.db'));
    try {
      const sourceId = ledgerEventId('accessor-source');
      const consequenceId = ledgerEventId('accessor-consequence');
      for (const id of [sourceId, consequenceId]) {
        store.ledger.appendEvent(createLedgerEvent({
          id, occurredAtSimTime: simTime(0), type: 'test', participants: [], causes: [],
        }));
      }
      let sourceReads = 0;
      let consequenceReads = 0;
      store.ledger.appendConsequence({
        get sourceId() { return ++sourceReads === 1 ? sourceId : ledgerEventId('missing'); },
        get consequenceId() { return ++consequenceReads === 1 ? consequenceId : sourceId; },
      });
      expect([sourceReads, consequenceReads]).toEqual([1, 1]);
      expect(store.ledger.consequenceLinks()).toEqual([{ sourceId, consequenceId }]);
    } finally {
      sqlite.close();
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
