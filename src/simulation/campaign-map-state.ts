import type { CanonicalId } from '../domain/identity/canonical-id.js';

/** Thin political read model; faction/government mechanics remain deferred. */
export interface MapFaction {
  readonly id: CanonicalId;
  readonly name: string;
  readonly color: string;
}

export interface CampaignMapState {
  readonly factions: readonly MapFaction[];
  readonly settlementControl: ReadonlyMap<CanonicalId, CanonicalId>;
}

/** Simulation operation: geographic identity survives a control transfer. */
export function transferSettlementControl(
  state: CampaignMapState,
  settlementId: CanonicalId,
  factionId: CanonicalId,
): CampaignMapState {
  if (!state.settlementControl.has(settlementId))
    throw new RangeError('Unknown settlement');
  if (!state.factions.some((faction) => faction.id === factionId))
    throw new RangeError('Unknown faction');
  const settlementControl = new Map(state.settlementControl);
  settlementControl.set(settlementId, factionId);
  return { factions: state.factions, settlementControl };
}
