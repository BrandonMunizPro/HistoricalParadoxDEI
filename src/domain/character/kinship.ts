/**
 * Kinship and mentorship queries over a relationship set (S1; VS-4 / E4).
 *
 * All queries are **pure derivations**: siblings and teacher/student inverses
 * are computed, never stored twice, so the relationship set cannot hold two
 * contradictory copies of the same fact. Every result is returned in a
 * deterministic (code-unit ascending) order with duplicates removed, so a
 * caller that serializes or hashes the result gets the same bytes every run
 * (ADR-0008).
 *
 * Direction semantics: see `relationship.ts`.
 */
import type { CanonicalId } from '../identity/index.js';
import type { Relationship } from './relationship.js';
import {
  FACET_MENTOR,
  FACET_PARENT,
  FACET_SPOUSE,
  hasFacet,
  isSameEdge,
} from './relationship.js';

function sortedUnique(ids: readonly CanonicalId[]): readonly CanonicalId[] {
  return [...new Set(ids)].sort();
}

/** Every edge whose `from` or `to` is `id`. */
export function relationshipsInvolving(
  id: CanonicalId,
  relationships: readonly Relationship[],
): readonly Relationship[] {
  return relationships.filter((relationship) => relationship.from === id || relationship.to === id);
}

/** Characters who are parents of `id` (edges `parent -> id` carrying `parent`). */
export function parentsOf(id: CanonicalId, relationships: readonly Relationship[]): readonly CanonicalId[] {
  return sortedUnique(
    relationships
      .filter((relationship) => relationship.to === id && hasFacet(relationship, FACET_PARENT))
      .map((relationship) => relationship.from),
  );
}

/** Characters who are children of `id` (edges `id -> child` carrying `parent`). */
export function childrenOf(id: CanonicalId, relationships: readonly Relationship[]): readonly CanonicalId[] {
  return sortedUnique(
    relationships
      .filter((relationship) => relationship.from === id && hasFacet(relationship, FACET_PARENT))
      .map((relationship) => relationship.to),
  );
}

/** Characters sharing at least one parent with `id` (excluding `id`). */
export function siblingsOf(id: CanonicalId, relationships: readonly Relationship[]): readonly CanonicalId[] {
  const collected: CanonicalId[] = [];
  for (const parent of parentsOf(id, relationships)) {
    collected.push(...childrenOf(parent, relationships));
  }
  return sortedUnique(collected.filter((sibling) => sibling !== id));
}

/** Spouses of `id`, whichever direction stores the `spouse` facet. */
export function spousesOf(id: CanonicalId, relationships: readonly Relationship[]): readonly CanonicalId[] {
  const collected: CanonicalId[] = [];
  for (const relationship of relationships) {
    if (!hasFacet(relationship, FACET_SPOUSE)) continue;
    if (relationship.from === id) collected.push(relationship.to);
    else if (relationship.to === id) collected.push(relationship.from);
  }
  return sortedUnique(collected);
}

/** Characters who mentor `id` (edges `mentor -> id` carrying `mentor`). */
export function mentorsOf(id: CanonicalId, relationships: readonly Relationship[]): readonly CanonicalId[] {
  return sortedUnique(
    relationships
      .filter((relationship) => relationship.to === id && hasFacet(relationship, FACET_MENTOR))
      .map((relationship) => relationship.from),
  );
}

/** Characters whom `id` mentors (edges `id -> student` carrying `mentor`). */
export function studentsOf(id: CanonicalId, relationships: readonly Relationship[]): readonly CanonicalId[] {
  return sortedUnique(
    relationships
      .filter((relationship) => relationship.from === id && hasFacet(relationship, FACET_MENTOR))
      .map((relationship) => relationship.to),
  );
}

/**
 * Every character directly connected to `id` by any relationship, from either
 * endpoint. This is the deterministic set a death reaction may record as
 * witnesses (see `succession.ts`).
 */
export function relatedCharacterIds(
  id: CanonicalId,
  relationships: readonly Relationship[],
): readonly CanonicalId[] {
  const collected: CanonicalId[] = [];
  for (const relationship of relationships) {
    if (relationship.from === id) collected.push(relationship.to);
    else if (relationship.to === id) collected.push(relationship.from);
  }
  return sortedUnique(collected.filter((other) => other !== id));
}

/** True when an edge addressing exactly `(from, to)` exists. */
export function hasEdge(
  relationships: readonly Relationship[],
  from: CanonicalId,
  to: CanonicalId,
): boolean {
  return relationships.some((relationship) => isSameEdge(relationship, from, to));
}

/**
 * Enforce that the `FACET_PARENT` edges form an **acyclic graph** (an ancestry
 * graph cannot reverse time). Runs depth-first over the parent edges only; a
 * direct pair `A -> B -> A`, a multi-generation `A -> B -> C -> A`, or any
 * longer closed walk throws a deterministic `RangeError` listing the cycle. An
 * empty graph and every acyclic parent graph (including a graph with multiple
 * parents, roots and disconnected families) pass.
 *
 * Spouse and mentor facets are deliberately ignored: only parenthood carries
 * the ancestry-direction semantics (relationship.ts), so adding a spouse or
 * mentor edge can never create an ancestry cycle.
 *
 * The traversal is deterministic (nodes and adjacency lists are visited in
 * code-unit ascending order), so the reported cycle — and therefore its error
 * text — is byte-stable across runs and save/load boundaries (ADR-0008).
 */
export function requireAcyclicParentGraph(relationships: readonly Relationship[]): void {
  const children = new Map<CanonicalId, CanonicalId[]>();
  const nodes = new Set<CanonicalId>();
  for (const relationship of relationships) {
    if (!hasFacet(relationship, FACET_PARENT)) continue;
    const list = children.get(relationship.from);
    if (list === undefined) children.set(relationship.from, [relationship.to]);
    else list.push(relationship.to);
    nodes.add(relationship.from);
    nodes.add(relationship.to);
  }
  for (const list of children.values()) list.sort();

  const state = new Map<CanonicalId, 0 | 1 | 2>();
  const stack: CanonicalId[] = [];

  function visit(node: CanonicalId): void {
    const current = state.get(node);
    if (current === 2) return;
    if (current === 1) {
      const cycle = [...stack.slice(stack.indexOf(node)), node];
      throw new RangeError(
        `The FACET_PARENT ancestor graph must be acyclic, but would contain a cycle ${cycle.join(' -> ')} (ADR-0007).`,
      );
    }
    state.set(node, 1);
    stack.push(node);
    for (const child of children.get(node) ?? []) visit(child);
    stack.pop();
    state.set(node, 2);
  }

  for (const node of [...nodes].sort()) visit(node);
}
