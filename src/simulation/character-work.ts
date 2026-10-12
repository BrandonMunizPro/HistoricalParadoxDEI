/**
 * Production character death consequence work (VS-4 / E4 S1; remediated).
 *
 * Campaign content owns how a recorded death becomes work the scheduler can
 * carry, save and resume. This module is that content, implemented against the
 * scheduler discipline of amendment B2/N-30:
 *
 * - **Nothing is pre-scheduled by the caller.** The reaction is **not** an
 *   independent pending step whose identifier accidentally sorts after the
 *   death's; it is scheduled by the death's own execution at the same instant
 *   through the scheduler. Causality is therefore structural, never reliant on
 *   the caller arranging identifier order (ADR-0003 B2, A5).
 * - **Identifiers are derived from schedule-time-fixed content.** The death and
 *   its reaction share identifiers derivable purely from the character's
 *   canonical identity, so a save, a load and an uninterrupted run all meet the
 *   same ids. The derived values put the death before its reaction at a shared
 *   instant (`character.death.*` < `character.succession_reacted.*`).
 * - **Authoritative state is resolved at execution**, never captured at
 *   schedule time (ADR-0008): the executor reads the character mirror, and the
 *   reaction verifies that the ledger actually records the expected death event
 *   at the expected instant before reacting.
 *
 * The reaction is the `character.succession_reacted` consequence (see
 * `src/domain/character/succession.ts`) and is **not** a political
 * claim/inheritance decision (E9); it never invents a successor.
 */
import type { CanonicalId } from '../domain/identity/index.js';
import { isCanonicalId } from '../domain/identity/index.js';
import {
  CHARACTER_DIED_EVENT,
  createDeathEvent,
  createSuccessionReactionEvent,
  recordDeath,
  relatedCharacterIds,
  rememberEvent,
} from '../domain/character/index.js';
import type { LedgerEventId } from '../domain/ledger/index.js';
import { ledgerEventId, requireLedgerEventId } from '../domain/ledger/index.js';
import type { CampaignStore, WorkKindRegistry } from '../domain/persistence/index.js';
import type { SimTime, ScheduledWork } from '../domain/time/index.js';
import { WorkClassRank, workIdentifier } from '../domain/time/index.js';
import type { EncodeWork } from './persistent-scenario-run.js';

/** Work-kind registration key for the character death consequence. */
export const CHARACTER_DEATH_WORK_KIND = 'character.death';
/** Work-kind registration key for the character-owned reaction to a death. */
export const CHARACTER_SUCCESSION_REACTION_WORK_KIND = 'character.succession_reacted';

/** Deterministic ledger-event id of a character's own death. */
export function characterDeathEventId(characterId: CanonicalId): LedgerEventId {
  return ledgerEventId(`character.died.${characterId}`);
}

/** Deterministic ledger-event id of a character's succession reaction. */
export function characterReactionEventId(characterId: CanonicalId): LedgerEventId {
  return ledgerEventId(`character.succession_reacted.${characterId}`);
}

/**
 * Deterministic scheduler identifier of a death consequence. Sorts before the
 * reaction identifier at a shared instant, so the same-instant total order
 * (due -> rank -> id) runs the death before its reaction without any caller
 * arrangement.
 */
export function characterDeathWorkIdentifier(characterId: CanonicalId): string {
  return String(workIdentifier(`character.death.${characterId}`));
}

/** Deterministic scheduler identifier of a death reaction consequence. */
export function characterReactionWorkIdentifier(characterId: CanonicalId): string {
  return String(workIdentifier(`character.succession_reacted.${characterId}`));
}

export interface CharacterDeathWork {
  readonly kind: 'character.death';
  readonly characterId: CanonicalId;
  /** Already-recorded ledger event ids this death is a consequence of. */
  readonly causes: readonly string[];
}

export interface CharacterReactionWork {
  readonly kind: 'character.succession_reacted';
  readonly characterId: CanonicalId;
}

export type CharacterWork = CharacterDeathWork | CharacterReactionWork;

function ownedCharacterId(value: unknown, what: string): CanonicalId {
  if (!isCanonicalId(value)) {
    throw new RangeError(`A character work ${what} must be a canonical identity (ADR-0009).`);
  }
  return value;
}

function ownedCauses(value: unknown): readonly string[] {
  if (value === undefined) return Object.freeze([]);
  if (!Array.isArray(value)) {
    throw new RangeError('A character death work causes list must be an array of ledger event ids (ADR-0002).');
  }
  const own = new Set<string>();
  for (const entry of value as readonly unknown[]) {
    own.add(requireLedgerEventId(entry));
  }
  return Object.freeze([...own].sort());
}

/** Build an owned, frozen death work value for a character. */
export function characterDeathWork(
  characterId: CanonicalId,
  causes?: readonly (LedgerEventId | string)[],
): CharacterDeathWork {
  const id = ownedCharacterId(characterId, 'id');
  return Object.freeze({ kind: CHARACTER_DEATH_WORK_KIND, characterId: id, causes: ownedCauses(causes) });
}

/** Build an owned, frozen reaction work value for a character. */
export function characterReactionWork(characterId: CanonicalId): CharacterReactionWork {
  const id = ownedCharacterId(characterId, 'id');
  return Object.freeze({ kind: CHARACTER_SUCCESSION_REACTION_WORK_KIND, characterId: id });
}

function reconstructDeathWork(payload: unknown): CharacterDeathWork {
  const record = payload as { readonly kind?: unknown; readonly characterId?: unknown; readonly causes?: unknown };
  if (record === null || typeof record !== 'object') {
    throw new RangeError(`A '${CHARACTER_DEATH_WORK_KIND}' work payload must be an object (ADR-0010).`);
  }
  if (record.kind !== CHARACTER_DEATH_WORK_KIND) {
    throw new RangeError(`A '${CHARACTER_DEATH_WORK_KIND}' work payload must carry its own kind (ADR-0010).`);
  }
  return characterDeathWork(ownedCharacterId(record.characterId, 'characterId'), ownedCauses(record.causes));
}

function reconstructReactionWork(payload: unknown): CharacterReactionWork {
  const record = payload as { readonly kind?: unknown; readonly characterId?: unknown };
  if (record === null || typeof record !== 'object') {
    throw new RangeError(`A '${CHARACTER_SUCCESSION_REACTION_WORK_KIND}' work payload must be an object (ADR-0010).`);
  }
  if (record.kind !== CHARACTER_SUCCESSION_REACTION_WORK_KIND) {
    throw new RangeError(
      `A '${CHARACTER_SUCCESSION_REACTION_WORK_KIND}' work payload must carry its own kind (ADR-0010).`,
    );
  }
  return characterReactionWork(ownedCharacterId(record.characterId, 'characterId'));
}

/** Register the character death and reaction factories on a work-kind registry. */
export function registerCharacterWorkKinds(registry: WorkKindRegistry<CharacterWork>): void {
  registry.register(CHARACTER_DEATH_WORK_KIND, reconstructDeathWork);
  registry.register(CHARACTER_SUCCESSION_REACTION_WORK_KIND, reconstructReactionWork);
}

/** Map a character work value to its persistable scheduling envelope. */
export function characterEncodeWork(work: CharacterWork): EncodeWork {
  switch (work.kind) {
    case CHARACTER_DEATH_WORK_KIND:
      return {
        workKind: CHARACTER_DEATH_WORK_KIND,
        payload: { kind: work.kind, characterId: work.characterId, causes: work.causes },
      };
    case CHARACTER_SUCCESSION_REACTION_WORK_KIND:
      return {
        workKind: CHARACTER_SUCCESSION_REACTION_WORK_KIND,
        payload: { kind: work.kind, characterId: work.characterId },
      };
  }
}

export interface CharacterWorkDispatcher {
  /**
   * Schedule a death for `characterId` at `atSimTime`. Only the death is ever
   * scheduled here; its causally linked reaction is scheduled by the death's
   * own execution through the injected scheduler.
   */
  scheduleDeath(
    characterId: CanonicalId,
    atSimTime: SimTime,
    causes?: readonly (LedgerEventId | string)[],
  ): ScheduledWork<CharacterWork>;
  /**
   * Execute a character work entry (death or reaction). Resolves authoritative
   * character state from the campaign store at execution time (ADR-0008).
   */
  execute: (this: void, entry: ScheduledWork<CharacterWork>) => void;
}

export interface CharacterWorkDispatcherOptions {
  readonly campaign: CampaignStore;
  /** The scenario's scheduler admission function (persistent-scenario-run.schedule). */
  readonly schedule: (entry: ScheduledWork<CharacterWork>) => ScheduledWork<CharacterWork>;
}

function requireSimTime(value: unknown, what: string): SimTime {
  if (typeof value !== 'number' || !Number.isSafeInteger(value)) {
    throw new RangeError(`A ${what} must be a safe-integer SimTime (ADR-0003).`);
  }
  return value as SimTime;
}

export function createCharacterWorkDispatcher(
  options: CharacterWorkDispatcherOptions,
): CharacterWorkDispatcher {
  const campaign = options.campaign;

  function scheduleDeath(
    characterId: CanonicalId,
    atSimTime: SimTime,
    causes?: readonly (LedgerEventId | string)[],
  ): ScheduledWork<CharacterWork> {
    const id = ownedCharacterId(characterId, 'id');
    const dueSimTime = requireSimTime(atSimTime, 'death SimTime');
    const character = campaign.characters.getCharacter(id);
    if (character === null) {
      throw new RangeError(`Cannot schedule a death for '${id}': the character is not mirrored (ADR-0008).`);
    }
    if (character.diedAtSimTime !== null) {
      throw new RangeError(
        `Cannot schedule a death for '${id}': the character already died at ${character.diedAtSimTime} (ADR-0002).`,
      );
    }
    if (dueSimTime < character.bornAtSimTime) {
      throw new RangeError(
        `Cannot schedule a death for '${id}' before its birth (${dueSimTime} < ${character.bornAtSimTime}) (ADR-0003 A2).`,
      );
    }
    return options.schedule({
      workIdentifier: workIdentifier(characterDeathWorkIdentifier(id)),
      dueSimTime,
      classRank: WorkClassRank.world,
      work: characterDeathWork(id, causes),
    });
  }

  function execute(entry: ScheduledWork<CharacterWork>): void {
    const work = entry.work;
    if (work.kind === CHARACTER_DEATH_WORK_KIND) {
      executeDeath(entry);
      return;
    }
    if (work.kind === CHARACTER_SUCCESSION_REACTION_WORK_KIND) {
      executeReaction(entry);
      return;
    }
    throw new RangeError(`Unknown character work kind '${String(work)}' (ADR-0010).`);
  }

  function executeDeath(entry: ScheduledWork<CharacterWork>): void {
    const work = entry.work as CharacterDeathWork;
    const character = campaign.characters.getCharacter(work.characterId);
    if (character === null) {
      throw new RangeError(`Character '${work.characterId}' is not mirrored; a death cannot execute (ADR-0008).`);
    }
    if (character.diedAtSimTime !== null) {
      throw new RangeError(
        `Character '${work.characterId}' already died at ${character.diedAtSimTime}; a death is recorded once (ADR-0002).`,
      );
    }
    const dead = recordDeath(character, entry.dueSimTime);
    campaign.characters.putCharacter(dead);
    const deathEventId = characterDeathEventId(dead.id);
    campaign.ledger.appendEvent(
      createDeathEvent({ id: deathEventId, character: dead, causes: work.causes }),
    );
    // The reaction is this execution's consequence: schedule it through the
    // scheduler at the same instant. It is never a pre-scheduled pending step.
    options.schedule({
      workIdentifier: workIdentifier(characterReactionWorkIdentifier(dead.id)),
      dueSimTime: entry.dueSimTime,
      classRank: WorkClassRank.world,
      work: characterReactionWork(dead.id),
    });
  }

  function executeReaction(entry: ScheduledWork<CharacterWork>): void {
    const work = entry.work as CharacterReactionWork;
    const character = campaign.characters.getCharacter(work.characterId);
    if (character === null) {
      throw new RangeError(
        `Character '${work.characterId}' is not mirrored; a death reaction cannot execute (ADR-0008).`,
      );
    }
    if (character.diedAtSimTime === null) {
      throw new RangeError(
        `Reaction for '${work.characterId}' fired while the character is still alive: a death reaction requires the death to have committed first (ADR-0003 B2).`,
      );
    }
    const deathEventId = characterDeathEventId(character.id);
    const deathEvent = campaign.ledger.eventById(deathEventId);
    if (deathEvent === null) {
      throw new RangeError(
        `Reaction for '${work.characterId}' requires death event '${String(deathEventId)}', which is not recorded (ADR-0002).`,
      );
    }
    if (deathEvent.type !== CHARACTER_DIED_EVENT || deathEvent.occurredAtSimTime !== character.diedAtSimTime) {
      throw new RangeError(
        `The recorded death event for '${work.characterId}' does not match the character's death (${deathEvent.occurredAtSimTime} vs ${character.diedAtSimTime}) (ADR-0002).`,
      );
    }
    const reaction = createSuccessionReactionEvent({
      id: characterReactionEventId(character.id),
      character,
      diedEventId: deathEventId,
      relatedCharacterIds: relatedCharacterIds(character.id, campaign.characters.allRelationships()),
    });
    campaign.ledger.appendEvent(reaction);
    campaign.characters.putCharacter(rememberEvent(character, deathEventId));
  }

  return { scheduleDeath, execute };
}