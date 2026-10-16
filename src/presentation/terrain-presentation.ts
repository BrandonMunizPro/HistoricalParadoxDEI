/** Display only; elevations remain metres in source data. Shared by geometry, normals and anchors. */
export const TERRAIN_HEIGHT_SCALE = 1.5;
const smooth = (a: number, b: number, x: number): number => {
  const t = Math.max(0, Math.min(1, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};
/** Existing symbolic groves fade before becoming subpixel strategic dots. */
export function canopyOpacity(distanceKm: number): number {
  if (!Number.isFinite(distanceKm) || distanceKm < 0)
    throw new RangeError('Invalid camera distance');
  return smooth(6, 15, distanceKm) * (1 - smooth(180, 350, distanceKm));
}
/** Only the low-angle presentation obscures the hard data edge with neutral haze. */
export function envelopeHaze(polarRadians: number): number {
  if (
    !Number.isFinite(polarRadians) ||
    polarRadians < 0 ||
    polarRadians > Math.PI
  )
    throw new RangeError('Invalid camera angle');
  return smooth(1.05, 1.33, polarRadians);
}
