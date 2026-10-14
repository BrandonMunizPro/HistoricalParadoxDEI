/** Rendering topology only: unchanged simulation coordinates and terrain identity. */
export interface TerrainTopology {
  readonly vertices: readonly (readonly [number, number])[];
  readonly indices: readonly number[];
}

/** Keep every boundary sample, even when a tile's interior uses a coarser LOD. */
const topologyCache = new Map<string, TerrainTopology>();
export function terrainTopology(size: number, stride: number): TerrainTopology {
  const steps = terrainTopologySteps(size, stride);
  let next = steps.next();
  while (!next.done) next = steps.next();
  return next.value;
}
export function* terrainTopologySteps(
  size: number,
  stride: number,
): Generator<void, TerrainTopology> {
  if (
    !Number.isSafeInteger(size) ||
    size < 3 ||
    !Number.isSafeInteger(stride) ||
    stride < 1 ||
    (size - 1) % stride !== 0
  ) {
    throw new RangeError('LOD stride must divide the tile edge');
  }
  const key = size + ':' + stride,
    previous = topologyCache.get(key);
  if (previous) return previous;
  const vertices: [number, number][] = [],
    indices: number[] = [],
    lookup = new Map<string, number>();
  const vertex = (x: number, y: number): number => {
    const key = `${x}/${y}`,
      existing = lookup.get(key);
    if (existing !== undefined) return existing;
    const index = vertices.length;
    lookup.set(key, index);
    vertices.push([x, y]);
    return index;
  };
  for (let y = 0; y < size - 1; y += stride)
    for (let x = 0; x < size - 1; x += stride) {
      if ((y * (size - 1) + x) % 512 === 0) yield;
      const ring: [number, number][] = [[x, y]];
      const topStep = y === 0 ? 1 : stride,
        rightStep = x + stride === size - 1 ? 1 : stride;
      const bottomStep = y + stride === size - 1 ? 1 : stride,
        leftStep = x === 0 ? 1 : stride;
      for (let i = topStep; i <= stride; i += topStep) ring.push([x + i, y]);
      for (let i = rightStep; i <= stride; i += rightStep)
        ring.push([x + stride, y + i]);
      for (let i = bottomStep; i <= stride; i += bottomStep)
        ring.push([x + stride - i, y + stride]);
      for (let i = leftStep; i < stride; i += leftStep)
        ring.push([x, y + stride - i]);
      if (ring.length === 4) {
        const ids = ring.map(([a, b]) => vertex(a, b));
        indices.push(ids[0]!, ids[2]!, ids[1]!, ids[0]!, ids[3]!, ids[2]!);
      } else {
        const center = vertex(x + stride / 2, y + stride / 2);
        for (let i = 0; i < ring.length; i++)
          indices.push(
            center,
            vertex(...ring[(i + 1) % ring.length]!),
            vertex(...ring[i]!),
          );
      }
    }
  const result = { vertices, indices };
  topologyCache.set(key, result);
  if (topologyCache.size > 16)
    topologyCache.delete(topologyCache.keys().next().value!);
  return result;
}
