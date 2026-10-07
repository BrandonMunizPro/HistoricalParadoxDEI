/**
 * WorkIdentifier (ADR-0003 amendment B2, N-30).
 *
 * The final component of the same-instant ordering key. It must be
 * deterministic, stable, unique within a pending set, and immutable. It is
 * **never** derived from insertion order, a runtime counter, mutable content,
 * randomness, wall clock or collection iteration order.
 *
 * The identifier is therefore supplied by the scheduling caller from
 * schedule-time-fixed domain content. The scheduler never mints one.
 */
declare const workIdentifierBrand: unique symbol;

export type WorkIdentifier = string & { readonly [workIdentifierBrand]: 'WorkIdentifier' };

export function workIdentifier(value: string): WorkIdentifier {
  if (value.length === 0) {
    throw new RangeError('A work identifier must not be empty (ADR-0003 amendment B2).');
  }
  return value as WorkIdentifier;
}

/**
 * Language-neutral total order over work identifiers used as the final
 * same-instant key component (ADR-0003 amendment B2 sentences 1 and 11).
 *
 * The comparator walks Unicode **code points**, so the total order is exactly
 * Unicode code-point order, which is the same as UTF-8 byte lexicographic
 * order: the one order a save, a replay, developer tooling and a future
 * engine in any language can reproduce from the identifier text itself. It is
 * locale-free — no collation rules, casing folds or locale-sensitive
 * comparison — and independent of insertion order, hash iteration, mutable
 * state and every runtime object behavior.
 *
 * For the ASCII identifiers the domain emits this is ordinary byte order.
 * For broader Unicode it deliberately orders by scalar value: an astral
 * character (surrogate pair) sorts after every BMP character with a smaller
 * code point, mirroring its UTF-8 first byte, rather than by JavaScript
 * UTF-16 code units.
 */
export function compareWorkIdentifiers(left: WorkIdentifier, right: WorkIdentifier): number {
  let leftIndex = 0;
  let rightIndex = 0;
  while (leftIndex < left.length && rightIndex < right.length) {
    const leftPoint = left.codePointAt(leftIndex);
    const rightPoint = right.codePointAt(rightIndex);
    if (leftPoint === undefined || rightPoint === undefined) {
      break;
    }
    if (leftPoint !== rightPoint) {
      return leftPoint < rightPoint ? -1 : 1;
    }
    leftIndex += leftPoint > 0xffff ? 2 : 1;
    rightIndex += rightPoint > 0xffff ? 2 : 1;
  }
  const leftRemaining = left.length - leftIndex;
  const rightRemaining = right.length - rightIndex;
  if (leftRemaining === rightRemaining) return 0;
  return leftRemaining < rightRemaining ? -1 : 1;
}
