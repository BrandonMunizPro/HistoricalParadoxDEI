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
  return requireWellFormedIdentifier(value) as WorkIdentifier;
}

/**
 * True when `value` contains a lone (unpaired) UTF-16 surrogate, i.e. text
 * that is not well-formed Unicode. Ill-formed text has no code-point
 * interpretation, so it has no stable scalar order and cannot be part of the
 * deterministic total order (amendment B2/N-30).
 */
export function hasUnpairedSurrogate(value: string): boolean {
  for (let index = 0; index < value.length; index += 1) {
    const codeUnit = value.charCodeAt(index);
    if (codeUnit >= 0xd800 && codeUnit <= 0xdbff) {
      const next = value.charCodeAt(index + 1);
      if (!(next >= 0xdc00 && next <= 0xdfff)) return true;
      index += 1;
    } else if (codeUnit >= 0xdc00 && codeUnit <= 0xdfff) {
      return true;
    }
  }
  return false;
}

/**
 * The one strict runtime validator a work identifier passes before it may
 * enter the ordering key (amendment B2/N-30).
 *
 * It accepts `unknown` and requires exactly a **primitive nonempty,
 * well-formed Unicode string**: nothing else is a valid identifier — numbers,
 * objects, boxed `String` instances, forged string-like objects, functions,
 * symbols and lone-surrogate text all are rejected. Because `WorkIdentifier`
 * is a branded type that any cast can forge, the scheduler must apply this
 * validator to the identifier it **already captured** before touching the
 * identifier set or the heap. The comparator therefore only ever receives
 * values that passed this validator.
 */
export function requireWellFormedIdentifier(value: unknown): string {
  if (typeof value !== 'string') {
    throw new RangeError(
      'A work identifier must be a primitive string, received a non-string representation (ADR-0003 amendment B2).',
    );
  }
  if (value.length === 0) {
    throw new RangeError('A work identifier must not be empty (ADR-0003 amendment B2).');
  }
  requireWellFormedUnicode(value);
  return value;
}

function requireWellFormedUnicode(value: string): void {
  if (hasUnpairedSurrogate(value)) {
    throw new RangeError(
      'A work identifier must be well-formed Unicode text with no unpaired surrogate code units (ADR-0003 amendment B2).',
    );
  }
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
