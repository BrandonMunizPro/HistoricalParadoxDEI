/**
 * RFC 4122 UUID version 5: name-based, deterministic, SHA-1-derived.
 *
 * The representation approved by ADR-0009 5a. A UUIDv5 value is a pure
 * function of a namespace UUID and a name, which is what makes canonical
 * identity deterministic by construction (ADR-0009 5) with no seeded stream,
 * database, counter, wall-clock or ambient randomness.
 *
 * SHA-1 here is a naming hash for collision resistance, not a security
 * primitive; see sha1.ts.
 */
import { sha1Digest } from './sha1.js';

/** Canonical textual form: lowercase hex in five dash-separated groups. */
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

function assertUuid(value: string): void {
  if (!UUID_PATTERN.test(value)) {
    throw new RangeError(`Expected a lowercase canonical UUID string, received: ${value}`);
  }
}

function uuidToBytes(value: string): Uint8Array {
  assertUuid(value);
  const hex = value.replaceAll('-', '');
  const bytes = new Uint8Array(16);
  for (let index = 0; index < 16; index += 1) {
    bytes[index] = Number.parseInt(hex.slice(index * 2, index * 2 + 2), 16);
  }
  return bytes;
}

function toHex(byte: number): string {
  return byte.toString(16).padStart(2, '0');
}

/**
 * Derive the UUIDv5 for `name` under `namespaceUuid`.
 *
 * Pure and deterministic: identical inputs always yield the identical
 * canonical UUID string. The result encodes no domain meaning (ADR-0009 1.13).
 */
export function uuidV5(namespaceUuid: string, name: string): string {
  const namespace = uuidToBytes(namespaceUuid);
  const nameBytes = new TextEncoder().encode(name);
  const combined = new Uint8Array(namespace.length + nameBytes.length);
  combined.set(namespace);
  combined.set(nameBytes, namespace.length);

  const digest = sha1Digest(combined);
  // Set the version (5) and RFC 4122 variant bits on the first 16 bytes.
  digest[6] = ((digest[6] ?? 0) & 0x0f) | 0x50;
  digest[8] = ((digest[8] ?? 0) & 0x3f) | 0x80;

  const groups: string[] = [];
  for (let index = 0; index < 16; index += 1) {
    groups.push(toHex(digest[index] ?? 0));
  }
  // Canonical 8-4-4-4-12 grouping over the 16 digest bytes.
  return [
    groups.slice(0, 4).join(''),
    groups.slice(4, 6).join(''),
    groups.slice(6, 8).join(''),
    groups.slice(8, 10).join(''),
    groups.slice(10, 16).join(''),
  ].join('-');
}
