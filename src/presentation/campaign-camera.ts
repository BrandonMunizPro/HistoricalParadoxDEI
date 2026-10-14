import {
  projectLocalMapMetres,
  unprojectLocalMapMetres,
} from '../infrastructure/world-geography.js';

export interface CampaignCameraSettings {
  readonly movement: number;
  readonly rotation: number;
  readonly zoom: number;
  readonly edgeScroll: boolean;
  readonly edgeWidth: number;
  readonly edgeDelayMs: number;
  readonly middleDrag: 'pan' | 'rotate';
  readonly cursorZoom: boolean;
}
export const DEFAULT_CAMERA_SETTINGS: CampaignCameraSettings = {
  movement: 1,
  rotation: 1,
  zoom: 1,
  edgeScroll: true,
  edgeWidth: 20,
  edgeDelayMs: 180,
  middleDrag: 'pan',
  cursorZoom: true,
};
export function cameraSettings(
  value: Partial<CampaignCameraSettings>,
): CampaignCameraSettings {
  const number = (
    v: unknown,
    fallback: number,
    min: number,
    max: number,
  ): number =>
    typeof v === 'number' && Number.isFinite(v)
      ? Math.max(min, Math.min(max, v))
      : fallback;
  return {
    movement: number(value.movement, 1, 0.2, 3),
    rotation: number(value.rotation, 1, 0.2, 3),
    zoom: number(value.zoom, 1, 0.2, 3),
    edgeScroll: typeof value.edgeScroll === 'boolean' ? value.edgeScroll : true,
    edgeWidth: number(value.edgeWidth, 20, 4, 60),
    edgeDelayMs: number(value.edgeDelayMs, 180, 0, 1000),
    middleDrag: value.middleDrag === 'rotate' ? 'rotate' : 'pan',
    cursorZoom: typeof value.cursorZoom === 'boolean' ? value.cursorZoom : true,
  };
}
export function cameraInputBlocked(
  tag: string,
  editable: boolean,
  modified: boolean,
): boolean {
  return (
    modified ||
    editable ||
    ['INPUT', 'TEXTAREA', 'SELECT', 'BUTTON', 'SUMMARY'].includes(
      tag.toUpperCase(),
    )
  );
}
export function edgeScrollVector(
  x: number,
  y: number,
  width: number,
  height: number,
  settings: CampaignCameraSettings,
  allowed: boolean,
  elapsedMs: number,
): readonly [number, number] {
  if (
    !allowed ||
    !settings.edgeScroll ||
    elapsedMs < settings.edgeDelayMs ||
    x < 0 ||
    y < 0 ||
    x >= width ||
    y >= height
  )
    return [0, 0];
  const axis = (p: number, size: number): number =>
    p < settings.edgeWidth
      ? -(1 - p / settings.edgeWidth)
      : p > size - settings.edgeWidth
        ? 1 - (size - p) / settings.edgeWidth
        : 0;
  return [axis(x, width), -axis(y, height) || 0];
}
export interface CameraVelocity {
  readonly x: number;
  readonly forward: number;
}
/** Exact exponential integration for predictable acceleration/deceleration at any frame rate. */
export function advanceCameraMotion(
  velocity: CameraVelocity,
  input: CameraVelocity,
  elapsedSeconds: number,
  distance: number,
  sensitivity: number,
  fast = false,
): { velocity: CameraVelocity; displacement: CameraVelocity } {
  const dt = Math.max(0, Math.min(0.05, elapsedSeconds)),
    length = Math.max(1, Math.hypot(input.x, input.forward));
  const speed =
      Math.max(0.12, Math.min(6000, distance * 0.32)) *
      sensitivity *
      (fast ? 2.5 : 1),
    rate = 12,
    decay = Math.exp(-rate * dt);
  const integrate = (v: number, axis: number): readonly [number, number] => {
    const goal = (axis / length) * speed;
    return [
      goal + (v - goal) * decay,
      goal * dt + ((v - goal) * (1 - decay)) / rate,
    ];
  };
  const [x, dx] = integrate(velocity.x, input.x),
    [forward, df] = integrate(velocity.forward, input.forward);
  return { velocity: { x, forward }, displacement: { x: dx, forward: df } };
}
export function cameraZoomDistance(
  distance: number,
  wheelPixels: number,
  sensitivity: number,
  min = 1.2,
  max = 30000,
): number {
  return Math.max(
    min,
    Math.min(
      max,
      distance *
        Math.exp(
          Math.max(-600, Math.min(600, wheelPixels)) * 0.0015 * sensitivity,
        ),
    ),
  );
}
export function boundedCameraTarget(
  x: number,
  z: number,
  b: { west: number; east: number; south: number; north: number },
  origin: { lon: number; lat: number },
): { x: number; z: number; lon: number; lat: number; clamped: boolean } {
  const p = unprojectLocalMapMetres(x * 1000, -z * 1000, origin),
    lon = Math.max(b.west, Math.min(b.east, p.lon)),
    lat = Math.max(b.south, Math.min(b.north, p.lat));
  const clamped = lon !== p.lon || lat !== p.lat;
  if (!clamped) return { x, z, lon, lat, clamped };
  const q = projectLocalMapMetres({ lon, lat }, origin);
  return { x: q.east / 1000, z: -q.north / 1000, lon, lat, clamped };
}
