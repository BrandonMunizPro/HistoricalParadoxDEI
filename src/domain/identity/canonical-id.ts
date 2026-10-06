/**
 * Canonical identity: ADR-0009 (identity model), ADR-0009 5a (representation).
 *
 * A canonical ID is an RFC 4122 UUIDv5 value presented in its canonical string
 * form and wrapped in a branded type so IDs cannot be interchanged by accident.
 * The brand is a compile-time discipline; it does not change the value.
 *
 * Derivation contract (ADR-0009 5a):
 *
 *     canonicalId = UUIDv5(applicationNamespaceUUID, stableName)
 *
 * - `applicationNamespaceUUID` is the fixed, version-controlled constant below.
 *   It is a namespace, not an identity, and carries no meaning. It must never
 *   change once published: regenerating it would change every derived ID.
 * - `stableName` is built only from stable identity inputs. It never includes
 *   display names, mutable domain state, wall-clock time, database values, or
 *   any identifier owned by an external engine or content source.
 *
 * Two derivation paths, both deterministic (ADR-0009 5):
 *
 * - **Authored** entities derive from their stable source namespace/key. The
 *   source identity remains separately representable provenance and is a
 *   derivation input only; revising authored content does not change the ID.
 * - **Procedurally generated** entities derive from scenario identity, the
 *   deterministic seed and a deterministic creation discriminator (role plus
 *   creation index), so identical run inputs yield identical IDs.
 *
 * Name parts are length-prefixed before concatenation so no two distinct input
 * tuples can ever compose to the same stable name.
 */
import { uuidV5 } from './uuid-v5.js';

declare const canonicalIdBrand: unique symbol;

/**
 * An RFC 4122 UUIDv5 in canonical lowercase string form: globally unique in
 * representation, opaque, immutable, never reused, and independent of entity
 * end of life (ADR-0009 1.1-1.4, 1.13).
 */
export type CanonicalId = string & { readonly [canonicalIdBrand]: 'CanonicalId' };

/**
 * The fixed application namespace UUID (ADR-0009 5a, derivation contract).
 *
 * Generated once when canonical identity was introduced and frozen as a
 * version-controlled project constant. Never regenerate, replace or derive it
 * from anything mutable.
 */
export const APPLICATION_NAMESPACE_UUID = '340babd5-3b85-4bad-af76-76da0ac3961d';

/** Canonical textual form of a UUIDv5, lowercase, with variant bits set. */
const CANONICAL_ID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-5[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

/** Origin tag for authored names; a stable structural input, not domain meaning. */
const AUTHORED_TAG = 'authored';
/** Origin tag for procedural names; a stable structural input, not domain meaning. */
const PROCEDURAL_TAG = 'procedural';

/**
 * Compose a stable name from ordered parts, length-prefixed so the
 * composition is unambiguous: ('ab', 'c') and ('a', 'bc') can never collide.
 */
function stableNameFrom(parts: readonly string[]): string {
  return parts.map((part) => `${part.length}:${part}`).join('');
}

function requireNonEmpty(value: string, what: string): void {
  if (value.length === 0) {
    throw new RangeError(`Canonical identity ${what} must not be empty.`);
  }
}

/**
 * Stable source identity of an authored entity: a stable source namespace and
 * stable source key (ADR-0009 2). This remains separately representable as
 * provenance; it is a derivation input, not part of the canonical ID value.
 */
export interface AuthoredSourceIdentity {
  /** Stable namespace identifying the authored source dataset. */
  readonly sourceNamespace: string;
  /** Stable key of the authored entity within that namespace. */
  readonly sourceKey: string;
}

/**
 * Deterministic creation inputs of a procedurally generated entity
 * (ADR-0009 5a, ADR-0008): scenario identity, deterministic seed, and a
 * creation discriminator identifying which generated entity is meant.
 */
export interface ProceduralIdentityInputs {
  /** Identity of the scenario these run inputs belong to. */
  readonly scenarioIdentity: string;
  /** The deterministic seed of the run. */
  readonly deterministicSeed: string;
  /** The role this entity was created under. */
  readonly creationRole: string;
  /** Zero-based creation index of this entity within its role. */
  readonly creationIndex: number;
}

/**
 * Derive the canonical ID of an authored entity from its stable source
 * namespace and key. Pure and stateless: identical source identity always
 * yields the identical canonical ID, regardless of mutable content
 * (ADR-0009 5).
 */
export function deriveAuthoredCanonicalId(source: AuthoredSourceIdentity): CanonicalId {
  requireNonEmpty(source.sourceNamespace, 'source namespace');
  requireNonEmpty(source.sourceKey, 'source key');
  const stableName = stableNameFrom([AUTHORED_TAG, source.sourceNamespace, source.sourceKey]);
  return uuidV5(APPLICATION_NAMESPACE_UUID, stableName) as CanonicalId;
}

/**
 * Derive the canonical ID of a procedurally generated entity from its
 * deterministic creation inputs. Identical run inputs always yield the
 * identical canonical ID across equivalent runs (ADR-0009 5, ADR-0008).
 */
export function deriveProceduralCanonicalId(inputs: ProceduralIdentityInputs): CanonicalId {
  requireNonEmpty(inputs.scenarioIdentity, 'scenario identity');
  requireNonEmpty(inputs.deterministicSeed, 'deterministic seed');
  requireNonEmpty(inputs.creationRole, 'creation role');
  if (!Number.isSafeInteger(inputs.creationIndex) || inputs.creationIndex < 0) {
    throw new RangeError(
      `Canonical identity creation index must be a non-negative safe integer, received ${inputs.creationIndex}.`,
    );
  }
  const stableName = stableNameFrom([
    PROCEDURAL_TAG,
    inputs.scenarioIdentity,
    inputs.deterministicSeed,
    inputs.creationRole,
    String(inputs.creationIndex),
  ]);
  return uuidV5(APPLICATION_NAMESPACE_UUID, stableName) as CanonicalId;
}

/**
 * Whether `value` is a canonical ID in canonical serialised form: a lowercase
 * UUIDv5 with RFC 4122 variant bits. Canonical IDs are never regenerated
 * during load; this check exists to validate values read back from storage or
 * across boundaries (ADR-0009 5).
 */
export function isCanonicalId(value: string): value is CanonicalId {
  return CANONICAL_ID_PATTERN.test(value);
}
