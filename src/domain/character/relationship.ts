/**
 * Multi-facet relationships (blueprint 4.1; VS-4 / E4).
 *
 * A relationship is a **directed** edge `from -> to` carrying one or more
 * simultaneous facet tags. The storage shape for multi-axis relationships is
 * an open modelling question (domain-model 7); this slice chooses a
 * representation — a facet **set** on a directed edge — that keeps the
 * blueprint's "multi-axis simultaneously" property without inventing the
 * numeric psychology ranges that remain blocked on design.
 *
 * Facet vocabulary is content, not a closed enum: facet tags are branded
 * strings so callers cannot confuse them with ids. The facet constants below
 * are convenience content used by the kinship helpers and tests, not domain
 * rules.
 *
 * Direction semantics used by the kinship helpers:
 * - `parent`   on `from -> to` means **from is a parent of to**.
 * - `mentor`   on `from -> to` means **from mentors to**.
 * - `spouse`   is treated as symmetric regardless of which direction stores it.
 *
 * Sibling and student/teacher inverses are derived, never stored twice.
 */
import type { CanonicalId } from '../identity/index.js';
import { isCanonicalId } from '../identity/index.js';

declare const relationshipFacetBrand: unique symbol;

/**
 * A relationship facet tag. Content-supplied and branded so it can never be
 * interchanged with a canonical id or event id.
 */
export type RelationshipFacet = string & { readonly [relationshipFacetBrand]: 'RelationshipFacet' };

export function relationshipFacet(value: string): RelationshipFacet {
  return requireRelationshipFacet(value) as RelationshipFacet;
}

function requireRelationshipFacet(value: unknown): string {
  if (typeof value !== 'string') {
    throw new RangeError('A relationship facet must be a primitive string (ADR-0007).');
  }
  if (value.length === 0) {
    throw new RangeError('A relationship facet must not be empty (ADR-0007).');
  }
  return value;
}

/** Kinship/social facet content used by the slice and its tests. */
export const FACET_PARENT = relationshipFacet('parent');
export const FACET_SPOUSE = relationshipFacet('spouse');
export const FACET_MENTOR = relationshipFacet('mentor');
export const FACET_AFFECTION = relationshipFacet('affection');
export const FACET_TRUST = relationshipFacet('trust');
export const FACET_RIVALRY = relationshipFacet('rivalry');
export const FACET_OBLIGATION = relationshipFacet('obligation');

export interface Relationship {
  readonly from: CanonicalId;
  readonly to: CanonicalId;
  /** Simultaneous facets, sorted and unique. Never empty. */
  readonly facets: readonly RelationshipFacet[];
}

export interface RelationshipInput {
  readonly from: CanonicalId;
  readonly to: CanonicalId;
  readonly facets: readonly (RelationshipFacet | string)[];
}

function requireCanonical(value: unknown, what: string): CanonicalId {
  if (!isCanonicalId(value)) {
    throw new RangeError(`A relationship ${what} must be a canonical identity (ADR-0009).`);
  }
  return value;
}

function requireFacets(value: unknown): RelationshipFacet[] {
  if (!Array.isArray(value)) {
    throw new RangeError('A relationship facets list must be an array (ADR-0007).');
  }
  const owned = new Set<RelationshipFacet>();
  for (const entry of value as readonly unknown[]) {
    owned.add(requireRelationshipFacet(entry) as RelationshipFacet);
  }
  if (owned.size === 0) {
    throw new RangeError('A relationship must carry at least one facet (ADR-0007).');
  }
  return [...owned].sort();
}

/** Build an owned, frozen relationship. A self-edge is rejected. */
export function createRelationship(input: RelationshipInput): Relationship {
  const from = requireCanonical(input.from, 'from');
  const to = requireCanonical(input.to, 'to');
  if (from === to) {
    throw new RangeError('A relationship cannot connect a character to itself (ADR-0007).');
  }
  const facets = Object.freeze(requireFacets(input.facets));
  return Object.freeze({ from, to, facets });
}

/** Whether the edge carries `facet`. */
export function hasFacet(relationship: Relationship, facet: RelationshipFacet): boolean {
  return relationship.facets.includes(facet);
}

/** Whether two edges address the same ordered pair. */
export function isSameEdge(relationship: Relationship, from: CanonicalId, to: CanonicalId): boolean {
  return relationship.from === from && relationship.to === to;
}
