import type { CanonicalId } from '../domain/identity/canonical-id.js';
import type { CampaignMapState } from './campaign-map-state.js';

/** Explicit provisional fixture, not a reconstruction of ancient sovereignty. */
export function createPrototypeMapState(
  settlements: readonly { readonly id: CanonicalId; readonly key: string }[],
  romanId: CanonicalId,
  alliedId: CanonicalId,
  unknownId?: CanonicalId,
): CampaignMapState {
  return {
    factions: [
      { id: romanId, name: 'Roman Republic', color: '#a84f40' },
      {
        id: alliedId,
        name: 'Allied communities (provisional)',
        color: '#b9a45e',
      },
      ...(unknownId
        ? [
            {
              id: unknownId,
              name: 'Control not yet researched',
              color: '#64847b',
            },
          ]
        : []),
    ],
    settlementControl: new Map(
      settlements.map((settlement) => [
        settlement.id,
        ['roma', 'ostia', 'tarracina', 'norba'].includes(settlement.key)
          ? romanId
          : unknownId &&
              !['capua', 'tibur', 'praeneste'].includes(settlement.key)
            ? unknownId
            : alliedId,
      ]),
    ),
  };
}
