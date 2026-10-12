export {
  characterFromParts,
  createCharacter,
  designateSuccessor,
  isAlive,
  recordDeath,
  rememberEvent,
} from './character.js';
export type { Character, CharacterInput } from './character.js';
export {
  FACET_AFFECTION,
  FACET_MENTOR,
  FACET_OBLIGATION,
  FACET_PARENT,
  FACET_RIVALRY,
  FACET_SPOUSE,
  FACET_TRUST,
  createRelationship,
  hasFacet,
  isSameEdge,
  relationshipFacet,
} from './relationship.js';
export type { Relationship, RelationshipFacet, RelationshipInput } from './relationship.js';
export {
  childrenOf,
  hasEdge,
  mentorsOf,
  parentsOf,
  relatedCharacterIds,
  relationshipsInvolving,
  requireAcyclicParentGraph,
  siblingsOf,
  spousesOf,
  studentsOf,
} from './kinship.js';
export { composeLifeHistory, composeRememberedEvents } from './life-history.js';
export {
  CHARACTER_DIED_EVENT,
  CHARACTER_SUCCESSION_REACTED_EVENT,
  createDeathEvent,
  createSuccessionReactionEvent,
} from './succession.js';
export type { DeathEventInput, SuccessionReactionInput } from './succession.js';
