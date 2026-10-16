import type { PromotedSettlement } from '../infrastructure/settlement-promotion.js';
import {
  settlementAtlasIdentity,
  validateSettlementAtlas,
} from '../infrastructure/settlement-atlas.js';
import type { SettlementAtlasRecord } from '../infrastructure/settlement-atlas.js';
import { WORLD_RENDER_BOUNDS } from './world-navigation.js';

/** Imported geographic sites, not political fixtures or movement graph nodes. */
export function approvedMapSites(
  records: readonly PromotedSettlement[],
  existing: readonly SettlementAtlasRecord[],
): readonly {
  key: string;
  id: PromotedSettlement['atlas']['id'];
  locationId: PromotedSettlement['atlas']['locationId'];
  name: string;
  lon: number;
  lat: number;
  tier: number;
  source: string;
  geographicOnly: true;
  candidateId: string;
}[] {
  validateSettlementAtlas([...existing, ...records.map((r) => r.atlas)]);
  const handles = new Set<string>();
  return records.map((r) => {
    const a = r.atlas,
      p = a.coordinates,
      g = r.geographicDefinition;
    if (
      !p ||
      p.lon < WORLD_RENDER_BOUNDS.west ||
      p.lon > WORLD_RENDER_BOUNDS.east ||
      p.lat < WORLD_RENDER_BOUNDS.south ||
      p.lat > WORLD_RENDER_BOUNDS.north ||
      !Number.isFinite(p.lon) ||
      !Number.isFinite(p.lat)
    )
      throw new RangeError(
        'Approved map site has invalid coordinates: ' + a.key,
      );
    if (
      r.initialControl !== null ||
      g.existence !== 'active' ||
      g.id !== a.id ||
      g.locationId !== a.locationId ||
      g.populationReference !== undefined ||
      g.resourceReferences !== undefined
    )
      throw new RangeError(
        'Geography-only registry contract violated: ' + a.key,
      );
    const url = r.provenance.verifiedIdentityUrl,
      match = /^https:\/\/pleiades.stoa.org\/places\/([1-9]\d*)$/.exec(url);
    if (
      !match ||
      a.id !== settlementAtlasIdentity(match[1]!).id ||
      a.locationId !== settlementAtlasIdentity(match[1]!).locationId ||
      !r.provenance.approvalReference ||
      !r.provenance.reviewer ||
      handles.has(r.provenance.candidateId)
    )
      throw new RangeError(
        'Approved map site identity/provenance mismatch: ' + a.key,
      );
    handles.add(r.provenance.candidateId);
    return {
      key: a.key,
      id: a.id,
      locationId: a.locationId,
      name: a.historicalName,
      lon: p.lon,
      lat: p.lat,
      tier: a.suggestedTier,
      source: url,
      geographicOnly: true as const,
      candidateId: r.provenance.candidateId,
    };
  });
}

export function remainingResearchReferences<
  T extends { readonly proposedId: string },
>(
  records: readonly T[],
  promotedCandidateIds: ReadonlySet<string>,
): readonly T[] {
  return records.filter((r) => !promotedCandidateIds.has(r.proposedId));
}
