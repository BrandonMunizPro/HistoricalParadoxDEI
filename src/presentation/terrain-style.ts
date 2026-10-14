/** Shared geographic material ramp; no political or simulated resource interpretation. */
export function barycentricWeights(
  point: readonly [number, number],
  triangle: readonly (readonly [number, number])[],
): readonly [number, number, number] {
  const [a, b, c] = triangle;
  if (!a || !b || !c || ![...point, ...a, ...b, ...c].every(Number.isFinite))
    throw new RangeError('Invalid context triangle');
  const denominator =
    (b[1] - c[1]) * (a[0] - c[0]) + (c[0] - b[0]) * (a[1] - c[1]);
  if (Math.abs(denominator) < 1e-12)
    throw new RangeError('Degenerate context triangle');
  const u =
      ((b[1] - c[1]) * (point[0] - c[0]) + (c[0] - b[0]) * (point[1] - c[1])) /
      denominator,
    v =
      ((c[1] - a[1]) * (point[0] - c[0]) + (a[0] - c[0]) * (point[1] - c[1])) /
      denominator;
  return [u, v, 1 - u - v];
}
export function terrainAlbedo(
  elevationMetres: number,
): readonly [number, number, number] {
  if (!Number.isFinite(elevationMetres))
    throw new RangeError('Invalid material elevation');
  const stops: readonly (readonly [number, number, number, number])[] = [
    [0, 0.43, 0.48, 0.29],
    [180, 0.32, 0.41, 0.24],
    [650, 0.28, 0.37, 0.23],
    [1200, 0.35, 0.38, 0.29],
    [1900, 0.49, 0.47, 0.4],
    [2900, 0.64, 0.62, 0.55],
  ];
  const e = Math.max(0, elevationMetres);
  for (let i = 1; i < stops.length; i++) {
    const a = stops[i - 1]!,
      b = stops[i]!;
    if (e <= b[0]) {
      const t = Math.max(0, Math.min(1, (e - a[0]) / (b[0] - a[0])));
      return [
        a[1] + (b[1] - a[1]) * t,
        a[2] + (b[2] - a[2]) * t,
        a[3] + (b[3] - a[3]) * t,
      ];
    }
  }
  return [0.64, 0.62, 0.55];
}
