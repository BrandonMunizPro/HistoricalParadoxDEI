import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import type { AuthoredSourceIdentity, CanonicalId, ProceduralIdentityInputs } from '../src/domain/identity/index.js';
import {
  APPLICATION_NAMESPACE_UUID,
  deriveAuthoredCanonicalId,
  deriveProceduralCanonicalId,
  isCanonicalId,
} from '../src/domain/identity/index.js';
import { sha1Digest } from '../src/domain/identity/sha1.js';
import { uuidV5 } from '../src/domain/identity/uuid-v5.js';

const utf8 = (value: string): Uint8Array => new TextEncoder().encode(value);
const hex = (bytes: Uint8Array): string => Buffer.from(bytes).toString('hex');

/** RFC 4122 UUIDv5 canonical form: lowercase, version 5, RFC variant bits. */
const CANONICAL_ID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-5[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

const URL_NAMESPACE = '6ba7b811-9dad-11d1-80b4-00c04fd430c8';
const DNS_NAMESPACE = '6ba7b810-9dad-11d1-80b4-00c04fd430c8';

const AUTHORED_SOURCE: AuthoredSourceIdentity = {
  sourceNamespace: 'historical-settlements-v1',
  sourceKey: 'rome',
};

const PROCEDURAL_INPUTS: ProceduralIdentityInputs = {
  scenarioIdentity: 'antiquity-01',
  deterministicSeed: '424242',
  creationRole: 'army',
  creationIndex: 0,
};

/** Reference UUIDv5 built independently from node:crypto, as an oracle. */
function referenceUuidV5(namespaceUuid: string, name: string): string {
  const namespace = Buffer.from(namespaceUuid.replaceAll('-', ''), 'hex');
  const digest = createHash('sha1')
    .update(Buffer.concat([namespace, Buffer.from(name, 'utf8')]))
    .digest();
  digest[6] = ((digest[6] ?? 0) & 0x0f) | 0x50;
  digest[8] = ((digest[8] ?? 0) & 0x3f) | 0x80;
  const raw = digest.subarray(0, 16).toString('hex');
  return [
    raw.slice(0, 8),
    raw.slice(8, 12),
    raw.slice(12, 16),
    raw.slice(16, 20),
    raw.slice(20, 32),
  ].join('-');
}

/** Deterministic pseudo-random generator so oracle failures are reproducible. */
function lcg(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state;
  };
}

const CHARSET = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-_:()[]{}, 中文ΣΩ';

describe('sha1 (RFC 4122 UUIDv5 hashing primitive)', () => {
  it('matches the FIPS 180-4 published vectors', () => {
    const vectors: readonly (readonly [string, string])[] = [
      ['', 'da39a3ee5e6b4b0d3255bfef95601890afd80709'],
      ['abc', 'a9993e364706816aba3e25717850c26c9cd0d89d'],
      [
        'abcdbcdecdefdefgefghfghighijhijkijkljklmklmnlmnomnopnopq',
        '84983e441c3bd26ebaae4aa1f95129e5e54670f1',
      ],
    ];
    for (const [message, expected] of vectors) {
      expect(hex(sha1Digest(utf8(message)))).toBe(expected);
    }
  });

  it('agrees with an independent node:crypto oracle on varied inputs', () => {
    const next = lcg(0x5eed);
    for (let index = 0; index < 64; index += 1) {
      const length = next() % 96;
      let message = '';
      for (let position = 0; position < length; position += 1) {
        message += CHARSET[next() % CHARSET.length] ?? '';
      }
      const expected = createHash('sha1').update(Buffer.from(message, 'utf8')).digest('hex');
      expect(hex(sha1Digest(utf8(message)))).toBe(expected);
    }
  });

  it('is pure: identical input bytes always produce identical output bytes', () => {
    for (let round = 0; round < 5; round += 1) {
      expect(hex(sha1Digest(utf8('determinism-probe')))).toBe(
        hex(sha1Digest(utf8('determinism-probe'))),
      );
    }
  });
});

describe('uuidV5 (RFC 4122 name-based derivation)', () => {
  it('reproduces the published uuidjs/uuid reference vector', () => {
    // Reference: uuidjs/uuid README, uuidv5('https://www.w3.org/', uuidv5.URL).
    expect(uuidV5(URL_NAMESPACE, 'https://www.w3.org/')).toBe(
      'c106a26a-21bb-5538-8bf2-57095d1976c1',
    );
  });

  it('agrees with an independent node:crypto oracle across namespaces and names', () => {
    const next = lcg(0xc0ffee);
    const namespaces = [APPLICATION_NAMESPACE_UUID, DNS_NAMESPACE, URL_NAMESPACE];
    for (const namespaceUuid of namespaces) {
      for (let index = 0; index < 16; index += 1) {
        const length = next() % 64;
        let name = '';
        for (let position = 0; position < length; position += 1) {
          name += CHARSET[next() % CHARSET.length] ?? '';
        }
        expect(uuidV5(namespaceUuid, name)).toBe(referenceUuidV5(namespaceUuid, name));
      }
    }
  });

  it('always emits canonical lowercase form with version 5 and RFC variant bits', () => {
    const next = lcg(0xabcdef);
    for (let index = 0; index < 32; index += 1) {
      let name = '';
      for (let position = 0; position < (next() % 40) + 1; position += 1) {
        name += CHARSET[next() % CHARSET.length] ?? '';
      }
      expect(uuidV5(APPLICATION_NAMESPACE_UUID, name)).toMatch(CANONICAL_ID_PATTERN);
    }
  });

  it('rejects a namespace that is not a canonical UUID string', () => {
    expect(() => uuidV5('not-a-namespace', 'name')).toThrow(RangeError);
    expect(() => uuidV5('C106A26A-21BB-5538-8BF2-57095D1976C1', 'name')).toThrow(RangeError);
  });
});

describe('canonical identity (ADR-0009 5a)', () => {
  it('pins the application namespace as a frozen project constant', () => {
    // Never regenerate: changing this value would change every derived ID
    // (ADR-0009 5a, derivation contract).
    expect(APPLICATION_NAMESPACE_UUID).toBe('340babd5-3b85-4bad-af76-76da0ac3961d');
    expect(isUuid(APPLICATION_NAMESPACE_UUID)).toBe(true);
  });

  it('derives the documented authored reference identity', () => {
    expect(deriveAuthoredCanonicalId(AUTHORED_SOURCE)).toBe('120eeb7a-e1fa-5704-a446-fae07ed044db');
  });

  it('derives the documented procedural reference identities', () => {
    expect(deriveProceduralCanonicalId(PROCEDURAL_INPUTS)).toBe(
      '90fb9d22-7cb9-5438-96e1-2a2de83816d7',
    );
    expect(deriveProceduralCanonicalId({ ...PROCEDURAL_INPUTS, creationIndex: 1 })).toBe(
      '98049f70-b070-5abc-94c3-53103f8164d0',
    );
    expect(deriveProceduralCanonicalId({ ...PROCEDURAL_INPUTS, deterministicSeed: '424243' })).toBe(
      'eabba3fe-38a8-5952-ad6f-428e857bdc41',
    );
  });

  it('is deterministic: identical run inputs always yield identical IDs', () => {
    const authoredRuns = Array.from({ length: 16 }, () => deriveAuthoredCanonicalId(AUTHORED_SOURCE));
    expect(new Set(authoredRuns).size).toBe(1);
    const proceduralRuns = Array.from({ length: 16 }, () =>
      deriveProceduralCanonicalId(PROCEDURAL_INPUTS),
    );
    expect(new Set(proceduralRuns).size).toBe(1);
  });

  it('depends only on stable source identity, never on mutable content', () => {
    const plain = deriveAuthoredCanonicalId(AUTHORED_SOURCE);
    const withMutableContent = deriveAuthoredCanonicalId({
      ...AUTHORED_SOURCE,
      population: 40000,
      displayName: 'The Eternal City',
      lastRenamedAt: 'any wall-clock stamp',
    } as AuthoredSourceIdentity);
    expect(withMutableContent).toBe(plain);
  });

  it('cannot collide across ambiguous source splits (length-prefixed composition)', () => {
    const splitA = deriveAuthoredCanonicalId({ sourceNamespace: 'ab', sourceKey: 'c' });
    const splitB = deriveAuthoredCanonicalId({ sourceNamespace: 'a', sourceKey: 'bc' });
    expect(splitA).not.toBe(splitB);
  });

  it('keeps authored and procedural name spaces apart', () => {
    const authored = deriveAuthoredCanonicalId({ sourceNamespace: 'army', sourceKey: '0' });
    const procedural = deriveProceduralCanonicalId({
      ...PROCEDURAL_INPUTS,
      creationRole: 'army',
      creationIndex: 0,
    });
    expect(authored).not.toBe(procedural);
  });

  it('rejects empty identity inputs and invalid creation discriminators', () => {
    expect(() => deriveAuthoredCanonicalId({ sourceNamespace: '', sourceKey: 'k' })).toThrow(
      RangeError,
    );
    expect(() => deriveAuthoredCanonicalId({ sourceNamespace: 'ns', sourceKey: '' })).toThrow(
      RangeError,
    );
    expect(() => deriveProceduralCanonicalId({ ...PROCEDURAL_INPUTS, scenarioIdentity: '' })).toThrow(
      RangeError,
    );
    expect(() => deriveProceduralCanonicalId({ ...PROCEDURAL_INPUTS, deterministicSeed: '' })).toThrow(
      RangeError,
    );
    expect(() => deriveProceduralCanonicalId({ ...PROCEDURAL_INPUTS, creationRole: '' })).toThrow(
      RangeError,
    );
    for (const creationIndex of [-1, 1.5, Number.NaN, Number.POSITIVE_INFINITY, 2 ** 53]) {
      expect(() => deriveProceduralCanonicalId({ ...PROCEDURAL_INPUTS, creationIndex })).toThrow(
        RangeError,
      );
    }
  });

  it('validates canonical form: lowercase UUIDv5 only', () => {
    expect(isCanonicalId(deriveAuthoredCanonicalId(AUTHORED_SOURCE))).toBe(true);
    expect(isCanonicalId(deriveProceduralCanonicalId(PROCEDURAL_INPUTS))).toBe(true);
    expect(isCanonicalId(deriveAuthoredCanonicalId(AUTHORED_SOURCE).toUpperCase())).toBe(false);
    expect(isCanonicalId('123e4567-e89b-42d3-a456-426614174000')).toBe(false);
    expect(isCanonicalId('not-a-uuid')).toBe(false);
    expect(isCanonicalId('')).toBe(false);
  });

  it('brand and required-field boundaries are compile-time enforced', () => {
    const derive = deriveAuthoredCanonicalId;
    // @ts-expect-error sourceKey is required to derive an authored identity
    const incomplete: AuthoredSourceIdentity = { sourceNamespace: 'ns' };
    // @ts-expect-error creationIndex must be a number, not a string
    const wrongIndexType: ProceduralIdentityInputs = { scenarioIdentity: 's', deterministicSeed: 'd', creationRole: 'r', creationIndex: '0' };
    // @ts-expect-error a canonical ID is branded; arbitrary strings are not IDs
    const unbranded: CanonicalId = 'not-an-id';
    expect(typeof derive).toBe('function');
    expect(incomplete).toEqual({ sourceNamespace: 'ns' });
    expect(wrongIndexType.creationIndex).toBe('0');
    expect(unbranded).toBe('not-an-id');
  });
});

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(value);
}
