import type { CanonicalId } from '../identity/canonical-id.js';

/** Geographic identity never contains political ownership or renderer units. */
export interface GeographicLocation {
  readonly id: CanonicalId;
  readonly regionId: CanonicalId;
  readonly name: string;
  readonly terrain: 'plain' | 'hill' | 'mountain' | 'coast';
}

export interface GeographicConnection {
  readonly id?: CanonicalId;
  readonly from: CanonicalId;
  readonly to: CanonicalId;
  readonly traversalCost: number;
  readonly kind: 'route' | 'river-crossing' | 'pass';
}

export interface GeographicRegion {
  readonly id: CanonicalId;
  readonly worldId: CanonicalId;
  readonly name: string;
  readonly districtIds: readonly CanonicalId[];
}

export interface GeographicDistrict {
  readonly id: CanonicalId;
  readonly regionId: CanonicalId;
  readonly locationIds: readonly CanonicalId[];
}

/** Existence and identity are independent of conquest; historical references survive destruction. */
export interface GeographicSettlement {
  readonly id: CanonicalId;
  readonly locationId: CanonicalId;
  readonly name: string;
  readonly existence: 'active' | 'destroyed' | 'abandoned';
  readonly sourceReferences: readonly string[];
  readonly populationReference?: CanonicalId;
  readonly resourceReferences?: readonly CanonicalId[];
}

export interface TerrainCell {
  readonly id: CanonicalId;
  readonly districtId: CanonicalId;
  readonly context: GeographicContext;
  readonly terrain: GeographicLocation['terrain'];
}

/** Coordinates are optional imported metadata pending the canonical G2 decision. */
export interface GeographicContext {
  readonly locationId: CanonicalId;
  readonly elevationMetres?: number;
  readonly slope?: number;
  readonly forestCoverage?: number;
  readonly waterFeatures?: readonly string[];
  readonly nearbySettlementIds?: readonly CanonicalId[];
  readonly connectionIds?: readonly string[];
}

/** Undirected prototype route graph. No movement rates or army mechanics implied. */
export function leastCostRoute(
  locations: readonly GeographicLocation[],
  connections: readonly GeographicConnection[],
  from: CanonicalId,
  to: CanonicalId,
  terrainFactors: Readonly<Record<GeographicLocation['terrain'], number>> = {
    plain: 1,
    hill: 1,
    mountain: 1,
    coast: 1,
  },
):
  | { readonly locationIds: readonly CanonicalId[]; readonly cost: number }
  | undefined {
  validateGeographicGraph(locations, connections);
  if (
    !(['plain', 'hill', 'mountain', 'coast'] as const).every(
      (terrain) =>
        Number.isFinite(terrainFactors[terrain]) && terrainFactors[terrain] > 0,
    )
  ) {
    throw new RangeError('Invalid traversal terrain factors');
  }
  const locationById = new Map(
    locations.map((location) => [location.id, location]),
  );
  const adjacency = new Map<
    CanonicalId,
    { readonly id: CanonicalId; readonly cost: number }[]
  >();
  for (const location of locations) adjacency.set(location.id, []);
  for (const edge of connections) {
    const a = locationById.get(edge.from),
      b = locationById.get(edge.to);
    if (!a || !b) throw new RangeError('Unknown edge endpoint');
    const cost =
      (edge.traversalCost *
        (terrainFactors[a.terrain] + terrainFactors[b.terrain])) /
      2;
    if (!Number.isFinite(cost) || cost <= 0)
      throw new RangeError('Traversal cost overflow');
    adjacency.get(edge.from)?.push({ id: edge.to, cost });
    adjacency.get(edge.to)?.push({ id: edge.from, cost });
  }
  const pending = new Set(locations.map((location) => location.id).sort());
  if (!pending.has(from) || !pending.has(to))
    throw new RangeError('Unknown route endpoint');
  const costs = new Map<CanonicalId, number>([[from, 0]]);
  const previous = new Map<CanonicalId, CanonicalId>();
  while (pending.size) {
    let next: CanonicalId | undefined;
    let best = Infinity;
    for (const candidate of pending) {
      const cost = costs.get(candidate) ?? Infinity;
      if (cost < best) {
        best = cost;
        next = candidate;
      }
    }
    if (next === undefined) return undefined;
    if (next === to) {
      const path = [to];
      let cursor = to;
      while (cursor !== from) {
        const parent = previous.get(cursor);
        if (parent === undefined) throw new Error('Broken route predecessor');
        path.unshift(parent);
        cursor = parent;
      }
      return { locationIds: path, cost: best };
    }
    pending.delete(next);
    for (const edge of adjacency.get(next) ?? []) {
      const neighbor = edge.id;
      if (!pending.has(neighbor)) continue;
      const cost = best + edge.cost;
      if (cost < (costs.get(neighbor) ?? Infinity)) {
        costs.set(neighbor, cost);
        previous.set(neighbor, next);
      }
    }
  }
  return undefined;
}

export function validateGeographicGraph(
  locations: readonly GeographicLocation[],
  connections: readonly GeographicConnection[],
): void {
  const ids = new Set(locations.map((location) => location.id));
  if (ids.size !== locations.length)
    throw new RangeError('Duplicate geographic identity');
  for (const edge of connections) {
    if (
      !ids.has(edge.from) ||
      !ids.has(edge.to) ||
      edge.from === edge.to ||
      !Number.isFinite(edge.traversalCost) ||
      edge.traversalCost <= 0
    ) {
      throw new RangeError('Invalid geographic connection');
    }
  }
}
