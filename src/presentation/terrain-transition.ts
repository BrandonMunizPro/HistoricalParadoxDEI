import { terrainTopology } from './terrain-topology.js';
import { barycentricWeights } from './terrain-style.js';

export interface ParentSample {
  readonly ids: readonly [number, number, number];
  readonly weights: readonly [number, number, number];
}
const cached = new Map<string, readonly ParentSample[]>();
/** Exact parent triangle interpolation, including the retained full-resolution perimeter. */
export function parentTerrainSamples(
  size: number,
  stride: number,
): readonly ParentSample[] {
  const key = `${size}:${stride}`,
    previous = cached.get(key);
  if (previous) return previous;
  const topology = terrainTopology(size, stride),
    result: Array<ParentSample | undefined> = Array.from(
      { length: size * size },
      () => undefined,
    );
  for (let i = 0; i < topology.indices.length; i += 3) {
    const vertices = [
      topology.vertices[topology.indices[i]!]!,
      topology.vertices[topology.indices[i + 1]!]!,
      topology.vertices[topology.indices[i + 2]!]!,
    ] as const;
    const xs = vertices.map((p) => p[0]),
      ys = vertices.map((p) => p[1]);
    for (let y = Math.ceil(Math.min(...ys)); y <= Math.max(...ys); y++)
      for (let x = Math.ceil(Math.min(...xs)); x <= Math.max(...xs); x++) {
        const weights = barycentricWeights([x, y], vertices);
        if (weights.some((w) => w < -1e-9)) continue;
        const ids = vertices.map(([x, y]) => y * size + x) as [
          number,
          number,
          number,
        ];
        result[y * size + x] = { ids, weights };
      }
  }
  if (result.some((v) => !v) || result.filter(Boolean).length !== size * size)
    throw new RangeError('Incomplete parent surface');
  const complete = result as ParentSample[];
  cached.set(key, complete);
  return complete;
}

/** Finish before Three.LOD's hysteretic switch in either direction. */
export function terrainMorphWeight(
  distance: number,
  nextThreshold: number,
): number {
  if (
    !Number.isFinite(distance) ||
    !Number.isFinite(nextThreshold) ||
    nextThreshold <= 0
  )
    throw new RangeError('Invalid terrain morph range');
  const t = Math.max(0, Math.min(1, (distance / nextThreshold - 0.76) / 0.16));
  return t * t * (3 - 2 * t);
}

/** Three.PlaneGeometry's diagonal differs from the regional fan topology. */
export function regularParentSample(
  size: number,
  stride: number,
  x: number,
  y: number,
): ParentSample {
  if (
    !Number.isSafeInteger(size) ||
    size < 3 ||
    !Number.isSafeInteger(stride) ||
    stride < 1 ||
    (size - 1) % stride !== 0 ||
    !Number.isFinite(x) ||
    !Number.isFinite(y) ||
    x < 0 ||
    y < 0 ||
    x > size - 1 ||
    y > size - 1
  )
    throw new RangeError('Invalid regular parent sample');
  const n = (size - 1) / stride + 1,
    c = Math.min(n - 2, Math.floor(x / stride)),
    r = Math.min(n - 2, Math.floor(y / stride)),
    fx = x / stride - c,
    fy = y / stride - r;
  return fx + fy <= 1
    ? {
        ids: [r * n + c, (r + 1) * n + c, r * n + c + 1],
        weights: [1 - fx - fy, fy, fx],
      }
    : {
        ids: [(r + 1) * n + c, (r + 1) * n + c + 1, r * n + c + 1],
        weights: [1 - fx, fx + fy - 1, 1 - fy],
      };
}
