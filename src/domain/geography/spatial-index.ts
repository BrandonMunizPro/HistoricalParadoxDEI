import type { CanonicalId } from '../identity/canonical-id.js';
import type { GeographicConnection, GeographicLocation } from './geography.js';
import { validateGeographicGraph } from './geography.js';

/** Graph locality now; a future coordinate index can implement a separate query port. */
export interface GeographicSpatialIndex {
  neighbors(locationId: CanonicalId): readonly CanonicalId[];
  withinHops(locationId: CanonicalId, hops: number): readonly CanonicalId[];
}

export function createGeographicSpatialIndex(
  locations: readonly GeographicLocation[],
  connections: readonly GeographicConnection[],
): GeographicSpatialIndex {
  validateGeographicGraph(locations, connections);
  const adjacency = new Map<CanonicalId, Set<CanonicalId>>();
  for (const location of locations) adjacency.set(location.id, new Set());
  for (const edge of connections) {
    adjacency.get(edge.from)?.add(edge.to);
    adjacency.get(edge.to)?.add(edge.from);
  }
  function neighbors(locationId: CanonicalId): readonly CanonicalId[] {
    const connected = adjacency.get(locationId);
    if (!connected) throw new RangeError('Unknown locality query location');
    return [...connected].sort();
  }
  return {
    neighbors,
    withinHops(locationId, hops) {
      if (!Number.isSafeInteger(hops) || hops < 0)
        throw new RangeError('Invalid locality radius');
      neighbors(locationId);
      const visited = new Set([locationId]);
      let frontier = [locationId];
      for (let hop = 0; hop < hops && frontier.length; hop++) {
        const next: CanonicalId[] = [];
        for (const current of frontier)
          for (const neighbor of neighbors(current)) {
            if (!visited.has(neighbor)) {
              visited.add(neighbor);
              next.push(neighbor);
            }
          }
        frontier = next;
      }
      visited.delete(locationId);
      return [...visited].sort();
    },
  };
}
