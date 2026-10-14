import {
  deriveAuthoredCanonicalId,
  isCanonicalId,
} from '../domain/identity/canonical-id.js';
import type { CanonicalId } from '../domain/identity/canonical-id.js';
import type { GeographicCoordinate } from './world-geography.js';

export type SettlementTier = 1 | 2 | 3 | 4;
export type EvidenceConfidence = 'high' | 'medium' | 'low';
export type CampaignPresence = 'attested' | 'probable' | 'absent' | 'uncertain';

/** Research/import record, separate from political control and simulation aggregates. */
export interface SettlementAtlasRecord {
  readonly id: CanonicalId;
  readonly locationId: CanonicalId;
  readonly key: string;
  readonly historicalName: string;
  readonly alternateNames: readonly string[];
  readonly coordinates: GeographicCoordinate | null;
  readonly coordinateEvidence: {
    readonly source: string;
    readonly precision: string;
    readonly accuracyMetres: number | null;
  };
  readonly category:
    'city' | 'town' | 'port' | 'fort' | 'sanctuary' | 'village';
  readonly suggestedTier: SettlementTier;
  readonly earliestEvidence: {
    readonly fromBce: number | null;
    readonly toBce: number | null;
    readonly description: string;
    readonly source: string;
    readonly confidence: EvidenceConfidence;
    readonly dateMeaning: string;
  };
  readonly presence278Bce: CampaignPresence;
  readonly evidence: string;
  readonly confidence: EvidenceConfidence;
  readonly culturalContext: string;
  readonly politicalContext: {
    readonly claim: string | null;
    readonly source: string | null;
    readonly confidence: EvidenceConfidence | null;
  };
  readonly geographicFeatures: readonly string[];
  readonly importance: {
    readonly strategic: string;
    readonly economic: string;
    readonly political: string;
    readonly status: 'qualitative-research-not-simulation-values';
  };
  readonly sources: readonly string[];
  readonly discoveryReference: string | null;
  readonly selection: 'existing' | 'expansion' | 'deferred' | 'excluded';
}

/** Preserve every identity used by the approved seven-place prototype. */
export function settlementAtlasIdentity(pleiadesId: string): {
  readonly id: CanonicalId;
  readonly locationId: CanonicalId;
} {
  return {
    id: deriveAuthoredCanonicalId({
      sourceNamespace: 'pleiades',
      sourceKey: pleiadesId,
    }),
    locationId: deriveAuthoredCanonicalId({
      sourceNamespace: 'historicalgame.location',
      sourceKey: `place-${pleiadesId}`,
    }),
  };
}

export function validateSettlementAtlas(
  records: readonly SettlementAtlasRecord[],
): void {
  const ids = new Set<CanonicalId>(),
    locations = new Set<CanonicalId>(),
    keys = new Set<string>();
  for (const record of records) {
    if (
      !isCanonicalId(record.id) ||
      !isCanonicalId(record.locationId) ||
      ids.has(record.id) ||
      locations.has(record.locationId) ||
      keys.has(record.key) ||
      !record.key ||
      !record.historicalName ||
      record.id === record.locationId ||
      !record.sources.length ||
      ![1, 2, 3, 4].includes(record.suggestedTier)
    )
      throw new RangeError('Invalid or duplicate atlas identity');
    if (
      !['city', 'town', 'port', 'fort', 'sanctuary', 'village'].includes(
        record.category,
      ) ||
      !['attested', 'probable', 'absent', 'uncertain'].includes(
        record.presence278Bce,
      ) ||
      !['existing', 'expansion', 'deferred', 'excluded'].includes(
        record.selection,
      ) ||
      !['high', 'medium', 'low'].includes(record.confidence)
    )
      throw new RangeError('Invalid atlas classification');
    ids.add(record.id);
    locations.add(record.locationId);
    keys.add(record.key);
    if (
      record.coordinates &&
      (!Number.isFinite(record.coordinates.lon) ||
        !Number.isFinite(record.coordinates.lat) ||
        Math.abs(record.coordinates.lon) > 180 ||
        Math.abs(record.coordinates.lat) > 90)
    )
      throw new RangeError('Invalid atlas coordinates');
    if (
      ['existing', 'expansion'].includes(record.selection) &&
      (!record.coordinates ||
        !['attested', 'probable'].includes(record.presence278Bce))
    )
      throw new RangeError(
        'Unresolved or absent site cannot enter the active map',
      );
    const dates = record.earliestEvidence;
    if (
      [dates.fromBce, dates.toBce].some(
        (value) => value !== null && (!Number.isFinite(value) || value <= 0),
      )
    )
      throw new RangeError('Invalid BCE evidence date');
    if (
      dates.fromBce !== null &&
      dates.toBce !== null &&
      dates.fromBce < dates.toBce
    )
      throw new RangeError('BCE interval ordering must run older to younger');
    if (
      record.politicalContext.claim !== null &&
      !record.politicalContext.source
    )
      throw new RangeError('Political research claim needs a source');
  }
}
