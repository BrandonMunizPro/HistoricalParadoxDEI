import { barycentricWeights } from './terrain-style.js';
import { projectLocalMapMetres, unprojectLocalMapMetres } from '../infrastructure/world-geography.js';
import type { GeographicBounds, GeographicCoordinate } from '../infrastructure/world-geography.js';
/** Conservative geographic inset for straight mesh chords in a curved projection.
 * Clip the underlying mesh only where the replacement is guaranteed to exist.
 * A half-sample underlap also covers rasterization at different mesh/LOD
 * resolutions; depth bias gives the detailed surface priority there. */
export function terrainCoverageInset(bounds: GeographicBounds, size: number, origin: GeographicCoordinate): readonly [
  number,
  number
] {
  let lonError = 0, latError = 0;
  const b = bounds;
  for (const [a, c] of [
    [[b.west, b.south], [b.east, b.south]], [[b.west, b.north], [b.east, b.north]],
    [[b.west, b.south], [b.west, b.north]], [[b.east, b.south], [b.east, b.north]],
  ] as const)
    for (let i = 0; i < size - 1; i++) {
      const points = [i / (size - 1), (i + 1) / (size - 1)].map(t => projectLocalMapMetres({ lon: a[0] + (c[0] - a[0]) * t, lat: a[1] + (c[1] - a[1]) * t }, origin));
      const mid = unprojectLocalMapMetres((points[0]!.east + points[1]!.east) / 2, (points[0]!.north + points[1]!.north) / 2, origin);
      const t = (i + 0.5) / (size - 1);
      lonError = Math.max(lonError, Math.abs(mid.lon - (a[0] + (c[0] - a[0]) * t)));
      latError = Math.max(latError, Math.abs(mid.lat - (a[1] + (c[1] - a[1]) * t)));
    }
  return [lonError * 2 + (b.east - b.west) / (size - 1) * 0.5 + 0.0002,
    latError * 2 + (b.north - b.south) / (size - 1) * 0.5 + 0.0002];
}
/** Locate the actual projected triangle, rather than bilinear DEM sampling.
 * The caller supplies animated vertices, so anchors follow LOD morph/reveal. */
export function projectedTriangleHeight(point: readonly [
  number,
  number
], triangles: readonly (readonly [
  number,
  number,
  number
])[], vertex: (id: number) => readonly [
  number,
  number,
  number
]): number | undefined {
  for (const ids of triangles) {
    const v = ids.map(vertex);
    const weights = barycentricWeights(point, v.map(p => [p[0], p[2]]));
    if (weights.every(w => w >= -1e-6 && w <= 1 + 1e-6))
      return v.reduce((sum, p, i) => sum + p[1] * weights[i]!, 0);
  }
  return undefined;
}
