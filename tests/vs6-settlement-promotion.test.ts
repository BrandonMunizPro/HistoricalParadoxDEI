import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import {
  promoteSettlements,
  settlementResearchDigest,
} from '../src/infrastructure/settlement-promotion.js';
import type {
  ResearchCandidate,
  SettlementReview,
} from '../src/infrastructure/settlement-promotion.js';
import type { SettlementAtlasRecord } from '../src/infrastructure/settlement-atlas.js';
import { settlementAtlasIdentity } from '../src/infrastructure/settlement-atlas.js';
import {
  canopyOpacity,
  envelopeHaze,
} from '../src/presentation/terrain-presentation.js';
const existing = (
  JSON.parse(readFileSync('public/data/settlement-atlas.json', 'utf8')) as {
    records: SettlementAtlasRecord[];
  }
).records;
function fixture(): { candidate: ResearchCandidate; review: SettlementReview } {
  const candidate: ResearchCandidate = {
    proposedId: 'test-only-not-history',
    key: 'synthetic-fixture',
    historicalName: 'Synthetic fixture',
    alternateNames: [],
    coordinates: { lon: 20, lat: 40 },
    presence278Bce: 'attested',
    sources: ['https://example.invalid/test-only'],
  };
  const proof = {
    conclusion: 'verified' as const,
    sourceUrl: 'https://pleiades.stoa.org/places/999000001',
    locator: 'SYNTHETIC TEST ONLY',
    finding: 'No historical claim: synthetic test review',
  };
  const review: SettlementReview = {
    candidateId: candidate.proposedId,
    candidateSha256: settlementResearchDigest(candidate),
    decision: 'approved',
    reviewer: 'Synthetic test reviewer',
    reviewedOn: '2026-10-14',
    approvalReference: 'TEST ONLY',
    pleiadesId: '999000001',
    definition: {
      ...structuredClone(existing[0]!),
      key: candidate.key,
      historicalName: candidate.historicalName,
      alternateNames: [],
      coordinates: candidate.coordinates,
      culturalContext: 'Unsupported test culture',
      earliestEvidence: {
        ...existing[0]!.earliestEvidence,
        fromBce: 700,
        toBce: 600,
      },
      presence278Bce: 'attested',
      coordinateEvidence: {
        source: proof.sourceUrl,
        precision: 'synthetic',
        accuracyMetres: 100,
      },
      politicalContext: { claim: null, source: null, confidence: null },
      sources: [proof.sourceUrl],
    },
    verification: {
      identity: proof,
      location: proof,
      existence: proof,
      chronology: proof,
    },
    occupation: { fromBce: 700, toBce: 100 },
  };
  return { candidate, review };
}
describe('historical settlement promotion boundary', () => {
  it('compares Unicode aliases without collapsing distinct Greek names', () => {
    const { candidate, review } = fixture();
    const registry = [
      {
        ...existing[0]!,
        coordinates: { lon: 20.2, lat: 40 },
        alternateNames: ['\u03a3\u03c0\u03ac\u03c1\u03c4\u03b7'],
      },
    ];
    const greek = {
      ...review,
      definition: {
        ...review.definition,
        alternateNames: ['\u0391\u03b8\u03ae\u03bd\u03b1'],
      },
    };
    expect(promoteSettlements([candidate], [greek], registry).issues).toEqual(
      [],
    );
    expect(
      promoteSettlements(
        [candidate],
        [greek],
        [
          {
            ...registry[0]!,
            alternateNames: ['\u0391\u03b8\u03b7\u03bd\u03b1'],
          },
        ],
      ).issues.some((i) => i.code === 'duplicate-review-required'),
    ).toBe(true);
  });
  it('does not promote research readiness or unreviewed records', () => {
    const { candidate } = fixture();
    const ready = {
      ...candidate,
      integrationReadiness: 'ready-for-atlas-integration',
    };
    expect(promoteSettlements([ready], [], existing).approved).toEqual([]);
  });
  it('exports stable geography with unknown ownership and immutable source snapshots', () => {
    const { candidate, review } = fixture(),
      before = structuredClone(existing),
      result = promoteSettlements([candidate], [review], existing);
    expect(result.issues).toEqual([]);
    expect(result.approved[0]!.atlas.id).toBe(
      settlementAtlasIdentity(review.pleiadesId).id,
    );
    expect(result.approved[0]!.initialControl).toBeNull();
    expect(result.approved[0]!.geographicDefinition.existence).toBe('active');
    expect(result.approved[0]!.atlas).not.toBe(review.definition);
    expect(existing).toEqual(before);
    expect(result.approved[0]!.provenance.reviewSha256).toBe(
      settlementResearchDigest(review),
    );
  });
  it.each(['identity', 'location', 'existence', 'chronology'] as const)(
    'requires independent %s verification',
    (dimension) => {
      const { candidate, review } = fixture();
      const changed = {
        ...review,
        verification: {
          ...review.verification,
          [dimension]: {
            ...review.verification[dimension],
            conclusion: 'unverified' as const,
          },
        },
      };
      expect(
        promoteSettlements([candidate], [changed], existing).issues.some(
          (i) => i.code === 'unverified-' + dimension,
        ),
      ).toBe(true);
    },
  );
  it.each([
    [-13, 40],
    [76, 40],
    [20, 11],
    [20, 63],
    [NaN, 40],
  ])('rejects out-of-envelope coordinates %s/%s', (lon, lat) => {
    const { candidate, review } = fixture();
    expect(
      promoteSettlements(
        [candidate],
        [
          {
            ...review,
            definition: { ...review.definition, coordinates: { lon, lat } },
          },
        ],
        existing,
      ).issues.some((i) => i.code === 'coordinate-bounds'),
    ).toBe(true);
  });
  it('rejects stale review hashes', () => {
    const { candidate, review } = fixture();
    expect(
      promoteSettlements(
        [{ ...candidate, historicalName: 'changed' }],
        [review],
        existing,
      ).issues.some((i) => i.code === 'stale-review'),
    ).toBe(true);
  });
  it('rejects unlocated records even with a claimed review', () => {
    const { candidate, review } = fixture(),
      c = { ...candidate, coordinates: null, presence278Bce: 'unlocated' };
    expect(
      promoteSettlements(
        [c],
        [{ ...review, candidateSha256: settlementResearchDigest(c) }],
        existing,
      ).issues.some((i) => i.code === 'unlocated'),
    ).toBe(true);
  });
  it('rejects a later foundation and a campaign occupation gap', () => {
    for (const occupation of [
      { fromBce: 200, toBce: 100 },
      { fromBce: 700, toBce: 300 },
    ]) {
      const { candidate, review } = fixture();
      expect(
        promoteSettlements([candidate], [{ ...review, occupation }], existing)
          .approved,
      ).toEqual([]);
    }
  });
  it('requires explicit approval and reviewer provenance', () => {
    const { candidate, review } = fixture();
    expect(
      promoteSettlements(
        [candidate],
        [{ ...review, decision: 'blocked' }],
        existing,
      ).issues[0]!.code,
    ).toBe('unapproved');
    expect(
      promoteSettlements([candidate], [{ ...review, reviewer: '' }], existing)
        .approved,
    ).toEqual([]);
  });
  it('rejects reused IDs, keys, aliases and nearby places including deferred atlas sites', () => {
    for (const patch of [
      {
        pleiadesId: existing[0]!.coordinateEvidence.source
          .split('/')
          .filter(Boolean)
          .at(-1)!,
      },
      { definition: { ...fixture().review.definition, key: existing[0]!.key } },
      {
        definition: {
          ...fixture().review.definition,
          alternateNames: [existing[0]!.historicalName],
          coordinates: {
            lon: existing[0]!.coordinates!.lon + 0.1,
            lat: existing[0]!.coordinates!.lat,
          },
        },
      },
      {
        definition: {
          ...fixture().review.definition,
          coordinates: existing[0]!.coordinates,
        },
      },
    ]) {
      const { candidate, review } = fixture();
      expect(
        promoteSettlements([candidate], [{ ...review, ...patch }], existing)
          .approved,
      ).toEqual([]);
    }
  });
  it('permits independently identified distant homonyms', () => {
    const { candidate, review } = fixture();
    expect(
      promoteSettlements(
        [candidate],
        [
          {
            ...review,
            definition: {
              ...review.definition,
              alternateNames: [existing[0]!.historicalName],
            },
          },
        ],
        existing,
      ).issues,
    ).toEqual([]);
  });
  it('replays approved records idempotently and retains prior definitions without reimport', () => {
    const { candidate, review } = fixture();
    const first = promoteSettlements([candidate], [review], existing).approved;
    expect(
      promoteSettlements([candidate], [review], existing, first).approved,
    ).toEqual(first);
    expect(
      promoteSettlements([candidate], [], existing, first).approved,
    ).toEqual(first);
  });
  it('blocks silent amendments to previously published definitions', () => {
    const { candidate, review } = fixture();
    const first = promoteSettlements([candidate], [review], existing).approved;
    const result = promoteSettlements(
      [candidate],
      [{ ...review, reviewer: 'Changed reviewer' }],
      existing,
      first,
    );
    expect(result.approved).toEqual([]);
    expect(result.issues[0]!.code).toBe('amendment-required');
  });
  it('reports malformed research and review handles', () => {
    expect(
      promoteSettlements([null] as unknown as ResearchCandidate[], [], existing)
        .issues[0]!.code,
    ).toBe('candidate-schema');
    expect(
      promoteSettlements([], [null] as unknown as SettlementReview[], existing)
        .issues[0]!.code,
    ).toBe('review-schema');
  });
  it('rejects duplicate candidate/review handles and never partially publishes', () => {
    const { candidate, review } = fixture();
    expect(
      promoteSettlements([candidate, candidate], [review], existing).approved,
    ).toEqual([]);
    expect(
      promoteSettlements([candidate], [review, review], existing).approved,
    ).toEqual([]);
  });
  it('reports malformed definitions rather than throwing an opaque exception', () => {
    const { candidate, review } = fixture();
    expect(
      promoteSettlements(
        [candidate],
        [{ ...review, definition: undefined } as unknown as SettlementReview],
        existing,
      ).issues[0]!.code,
    ).toBe('invalid-definition');
  });
  it('hashes object key order consistently, including review-bound extra research fields', () => {
    expect(settlementResearchDigest({ b: 2, a: 1 })).toBe(
      settlementResearchDigest({ a: 1, b: 2 }),
    );
    expect(settlementResearchDigest({ a: 1, readiness: 'ready' })).not.toBe(
      settlementResearchDigest({ a: 1 }),
    );
  });
});
describe('terrain presentation ranges', () => {
  it('fades symbolic vegetation before strategic dots form and preserves regional canopy', () => {
    expect(canopyOpacity(1000)).toBe(0);
    expect(canopyOpacity(2)).toBe(0);
    expect(canopyOpacity(50)).toBe(1);
    expect(canopyOpacity(300)).toBeGreaterThan(0);
    expect(canopyOpacity(300)).toBeLessThan(1);
  });
  it('only obscures the geographic data edge at low viewing angles', () => {
    expect(envelopeHaze(0)).toBe(0);
    expect(envelopeHaze(0.6)).toBe(0);
    expect(envelopeHaze(1.4)).toBe(1);
    expect(() => envelopeHaze(NaN)).toThrow();
    expect(() => canopyOpacity(-1)).toThrow();
  });
});
