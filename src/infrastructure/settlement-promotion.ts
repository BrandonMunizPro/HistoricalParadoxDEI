import { createHash } from 'node:crypto';
import {
  settlementAtlasIdentity,
  validateSettlementAtlas,
} from './settlement-atlas.js';
import type { SettlementAtlasRecord } from './settlement-atlas.js';
import type { GeographicSettlement } from '../domain/geography/geography.js';

/** Research handles/readiness are never canonical identity or approval. */
export interface ResearchCandidate {
  readonly proposedId: string;
  readonly key: string;
  readonly historicalName: string;
  readonly alternateNames: readonly string[];
  readonly coordinates: { readonly lon: number; readonly lat: number } | null;
  readonly presence278Bce: string;
  readonly sources: readonly string[];
}
export interface SettlementReview {
  readonly candidateId: string;
  readonly candidateSha256: string;
  readonly decision: 'approved' | 'blocked';
  readonly reviewer: string;
  readonly reviewedOn: string;
  readonly approvalReference: string;
  readonly pleiadesId: string;
  /** Reviewed definition, not a mechanical translation of the research draft. */
  readonly definition: Omit<
    SettlementAtlasRecord,
    'id' | 'locationId' | 'selection'
  >;
  readonly verification: Readonly<
    Record<
      'identity' | 'location' | 'existence' | 'chronology',
      {
        readonly conclusion: 'verified' | 'unverified';
        readonly sourceUrl: string;
        readonly locator: string;
        readonly finding: string;
      }
    >
  >;
  /** Interval established by evidence, not earliest occupation alone. */
  readonly occupation: { readonly fromBce: number; readonly toBce: number };
}
export interface PromotedSettlement {
  readonly atlas: SettlementAtlasRecord;
  readonly geographicDefinition: GeographicSettlement;
  readonly initialControl: null;
  readonly provenance: {
    readonly candidateId: string;
    readonly candidateSha256: string;
    readonly reviewSha256: string;
    readonly reviewer: string;
    readonly reviewedOn: string;
    readonly approvalReference: string;
    readonly verifiedIdentityUrl: string;
  };
}
export interface PromotionIssue {
  readonly candidateId: string;
  readonly code: string;
  readonly message: string;
}
function canonical(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonical);
  if (value !== null && typeof value === 'object')
    return Object.fromEntries(
      Object.entries(value)
        .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
        .map(([k, v]) => [k, canonical(v)]),
    );
  return value;
}
export function settlementResearchDigest(record: unknown): string {
  return createHash('sha256')
    .update(JSON.stringify(canonical(record)))
    .digest('hex');
}
const validUrl = (s: string): boolean => {
  try {
    return new URL(s).protocol === 'https:';
  } catch {
    return false;
  }
};
const normalized = (s: string): string =>
  s
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]/gu, '');

/** Transactional, immutable export: any validation issue prevents the entire batch publishing. */
export function promoteSettlements(
  candidates: readonly ResearchCandidate[],
  reviews: readonly SettlementReview[],
  existing: readonly SettlementAtlasRecord[],
  previous: readonly PromotedSettlement[] = [],
): {
  readonly approved: readonly PromotedSettlement[];
  readonly issues: readonly PromotionIssue[];
} {
  validateSettlementAtlas([...existing, ...previous.map((p) => p.atlas)]);
  const issues: PromotionIssue[] = [],
    staged: PromotedSettlement[] = structuredClone([...previous]),
    byId = new Map<string, ResearchCandidate>();
  const issue = (candidateId: string, code: string, message: string): void => {
    issues.push({ candidateId, code, message });
  };
  for (const c of candidates) {
    if (!c || typeof c.proposedId !== 'string' || typeof c.key !== 'string') {
      issue(
        '<invalid>',
        'candidate-schema',
        'Candidate handle and key are required',
      );
      continue;
    }
    if (byId.has(c.proposedId))
      issue(
        c.proposedId,
        'duplicate-candidate',
        'Research handle appears more than once',
      );
    byId.set(c.proposedId, c);
  }
  const seenReviews = new Set<string>(),
    definitions = [...existing, ...previous.map((p) => p.atlas)];
  for (const review of reviews) {
    if (!review || typeof review.candidateId !== 'string') {
      issue(
        '<invalid>',
        'review-schema',
        'Review candidate handle is required',
      );
      continue;
    }
    const id = review.candidateId,
      c = byId.get(id),
      start = issues.length;
    if (seenReviews.has(id)) {
      issue(id, 'duplicate-review', 'Only one review per candidate is allowed');
      continue;
    }
    seenReviews.add(id);
    if (!c) {
      issue(id, 'unknown-candidate', 'Review does not match a research record');
      continue;
    }
    const published = previous.find((p) => p.provenance.candidateId === id);
    if (published) {
      if (
        published.provenance.reviewSha256 ===
          settlementResearchDigest(review) &&
        published.provenance.candidateSha256 === settlementResearchDigest(c)
      )
        continue;
      issue(
        id,
        'amendment-required',
        'Published identities require an explicit reviewed amendment; research changes do not rewrite simulation definitions',
      );
      continue;
    }
    if (review.decision !== 'approved') {
      issue(id, 'unapproved', 'Explicit independent approval is required');
      continue;
    }
    if (review.candidateSha256 !== settlementResearchDigest(c))
      issue(
        id,
        'stale-review',
        'Reviewed candidate digest does not match the current complete research record',
      );
    if (
      typeof review.reviewer !== 'string' ||
      !review.reviewer.trim() ||
      typeof review.approvalReference !== 'string' ||
      !review.approvalReference.trim() ||
      typeof review.reviewedOn !== 'string' ||
      !/^\d{4}-\d{2}-\d{2}$/.test(review.reviewedOn) ||
      !Number.isFinite(Date.parse(review.reviewedOn))
    )
      issue(
        id,
        'approval-provenance',
        'Reviewer, date and durable approval reference are required',
      );
    if (
      typeof review.pleiadesId !== 'string' ||
      !/^[1-9]\d*$/.test(review.pleiadesId)
    )
      issue(
        id,
        'unverified-identity',
        'A verified Pleiades identifier is required by this first adapter',
      );
    for (const dimension of [
      'identity',
      'location',
      'existence',
      'chronology',
    ] as const) {
      const proof = review.verification?.[dimension];
      if (
        !proof ||
        proof.conclusion !== 'verified' ||
        !validUrl(proof.sourceUrl) ||
        typeof proof.locator !== 'string' ||
        !proof.locator.trim() ||
        typeof proof.finding !== 'string' ||
        !proof.finding.trim()
      )
        issue(
          id,
          'unverified-' + dimension,
          'Independent ' +
            dimension +
            ' evidence requires an HTTPS source, locator and reviewed finding',
        );
    }
    const identityUrl = 'https://pleiades.stoa.org/places/' + review.pleiadesId;
    if (
      (typeof review.verification?.identity?.sourceUrl === 'string'
        ? review.verification.identity.sourceUrl.replace(/\/$/, '')
        : null) !== identityUrl
    )
      issue(
        id,
        'identity-mismatch',
        'Identity evidence must refer to the verified gazetteer record',
      );
    const d = review.definition;
    if (
      !d ||
      typeof d.key !== 'string' ||
      typeof d.historicalName !== 'string' ||
      !Array.isArray(d.alternateNames) ||
      !d.alternateNames.every((n) => typeof n === 'string') ||
      !Array.isArray(d.sources) ||
      !d.coordinateEvidence
    ) {
      issue(
        id,
        'invalid-definition',
        'A complete reviewed atlas definition is required',
      );
      continue;
    }
    const p = d.coordinates;
    if (typeof d.culturalContext !== 'string' || !d.culturalContext.trim())
      issue(
        id,
        'culture-missing',
        'Reviewed cultural context is required; do not default to Roman architecture',
      );
    if (
      d.earliestEvidence?.fromBce !== null &&
      d.earliestEvidence?.fromBce !== undefined &&
      d.earliestEvidence.fromBce < 278
    )
      issue(
        id,
        'chronology-conflict',
        'Earliest evidence contradicts verified campaign presence',
      );
    if (!c.coordinates || c.presence278Bce === 'unlocated')
      issue(id, 'unlocated', 'Unlocated candidates cannot be promoted');
    if (
      !p ||
      !Number.isFinite(p.lon) ||
      !Number.isFinite(p.lat) ||
      p.lon < -12 ||
      p.lon > 75 ||
      p.lat < 12 ||
      p.lat > 62
    )
      issue(
        id,
        'coordinate-bounds',
        'Reviewed WGS84 coordinates must lie inside the campaign envelope',
      );
    if (
      d.presence278Bce !== 'attested' ||
      !Number.isFinite(review.occupation?.fromBce) ||
      !Number.isFinite(review.occupation?.toBce) ||
      review.occupation.fromBce < 278 ||
      review.occupation.toBce > 278 ||
      review.occupation.toBce < 0 ||
      review.occupation.fromBce < review.occupation.toBce
    )
      issue(
        id,
        'chronology',
        'Verified occupation must include 278 BCE; earliest founding alone is insufficient',
      );
    if (
      d.key !== c.key ||
      !d.sources.length ||
      !validUrl(d.coordinateEvidence.source)
    )
      issue(
        id,
        'definition-provenance',
        'Reviewed definition must retain the candidate key and sourced coordinates',
      );
    if (issues.length !== start) continue;
    const identity = settlementAtlasIdentity(review.pleiadesId),
      names = new Set(
        [d.historicalName, ...d.alternateNames].map(normalized).filter(Boolean),
      );
    for (const old of definitions) {
      if (
        old.id === identity.id ||
        old.locationId === identity.locationId ||
        old.key === d.key
      )
        issue(
          id,
          'duplicate-identity',
          'An atlas identity, geographic location or key already exists: ' +
            old.key,
        );
      const nameMatch = [old.historicalName, ...old.alternateNames].some((n) =>
        names.has(normalized(n)),
      );
      const separation =
        p && old.coordinates
          ? Math.hypot(
              (p.lon - old.coordinates.lon) * Math.cos((p.lat * Math.PI) / 180),
              p.lat - old.coordinates.lat,
            ) * 111.195
          : Infinity;
      if ((nameMatch && separation < 50) || separation < 1)
        issue(
          id,
          'duplicate-review-required',
          'Potential historical alias or co-located entity requires duplicate resolution: ' +
            old.key,
        );
    }
    if (issues.length !== start) continue;
    const atlas: SettlementAtlasRecord = {
      ...structuredClone(d),
      ...identity,
      selection: 'expansion',
    };
    try {
      validateSettlementAtlas([atlas]);
    } catch (error) {
      issue(id, 'invalid-definition', String(error));
      continue;
    }
    definitions.push(atlas);
    staged.push({
      atlas,
      geographicDefinition: {
        id: atlas.id,
        locationId: atlas.locationId,
        name: atlas.historicalName,
        existence: 'active',
        sourceReferences: [...atlas.sources],
      },
      initialControl: null,
      provenance: {
        candidateId: id,
        candidateSha256: review.candidateSha256,
        reviewSha256: settlementResearchDigest(review),
        reviewer: review.reviewer,
        reviewedOn: review.reviewedOn,
        approvalReference: review.approvalReference,
        verifiedIdentityUrl: identityUrl,
      },
    });
  }
  return { approved: issues.length ? [] : staged, issues };
}
