import { describe, it, expect } from 'vitest';
import {
  DEFAULT_CAMERA_SETTINGS,
  cameraSettings,
  cameraInputBlocked,
  edgeScrollVector,
  advanceCameraMotion,
  cameraZoomDistance,
  boundedCameraTarget,
} from '../src/presentation/campaign-camera.js';
import { projectLocalMapMetres } from '../src/infrastructure/world-geography.js';

describe('campaign camera input and motion', () => {
  it('validates configurable settings without trusting stored preferences', () => {
    expect(cameraSettings({})).toEqual(DEFAULT_CAMERA_SETTINGS);
    const s = cameraSettings({
      movement: 100,
      rotation: NaN,
      zoom: -1,
      edgeWidth: 1000,
      edgeScroll: false,
      middleDrag: 'rotate',
    });
    expect(s.movement).toBe(3);
    expect(s.rotation).toBe(1);
    expect(s.zoom).toBe(0.2);
    expect(s.edgeWidth).toBe(60);
    expect(s.edgeScroll).toBe(false);
    expect(s.middleDrag).toBe('rotate');
  });
  it.each(['INPUT', 'TEXTAREA', 'SELECT', 'BUTTON', 'SUMMARY'])(
    'leaves %s keyboard handling to UI',
    (tag) => expect(cameraInputBlocked(tag, false, false)).toBe(true),
  );
  it('preserves browser shortcuts and editable elements', () => {
    expect(cameraInputBlocked('CANVAS', false, false)).toBe(false);
    expect(cameraInputBlocked('DIV', true, false)).toBe(true);
    expect(cameraInputBlocked('BODY', false, true)).toBe(true);
  });
  it('gates edge scrolling by delay, focus, UI hit testing and preference', () => {
    const s = DEFAULT_CAMERA_SETTINGS;
    expect(edgeScrollVector(1, 500, 1440, 1000, s, true, 500)[0]).toBeLessThan(
      0,
    );
    for (const [allowed, elapsed] of [
      [false, 500],
      [true, 50],
    ] as const)
      expect(edgeScrollVector(1, 1, 1440, 1000, s, allowed, elapsed)).toEqual([
        0, 0,
      ]);
    expect(
      edgeScrollVector(
        1,
        1,
        1440,
        1000,
        { ...s, edgeScroll: false },
        true,
        500,
      ),
    ).toEqual([0, 0]);
    expect(edgeScrollVector(700, 500, 1440, 1000, s, true, 500)).toEqual([
      0, 0,
    ]);
    expect(edgeScrollVector(-1, 500, 1440, 1000, s, true, 500)).toEqual([0, 0]);
  });
  it('accelerates, decelerates, normalizes diagonals and scales speed with zoom', () => {
    const a = advanceCameraMotion(
        { x: 0, forward: 0 },
        { x: 1, forward: 0 },
        0.016,
        100,
        1,
      ),
      b = advanceCameraMotion(
        { x: 0, forward: 0 },
        { x: 1, forward: 1 },
        0.016,
        100,
        1,
      );
    expect(Math.hypot(b.velocity.x, b.velocity.forward)).toBeCloseTo(
      a.velocity.x,
      10,
    );
    expect(a.velocity.x).toBeGreaterThan(0);
    expect(a.velocity.x).toBeLessThan(32);
    expect(
      advanceCameraMotion(a.velocity, { x: 0, forward: 0 }, 0.016, 100, 1)
        .velocity.x,
    ).toBeLessThan(a.velocity.x);
    expect(
      advanceCameraMotion(
        { x: 0, forward: 0 },
        { x: 1, forward: 0 },
        0.016,
        1000,
        1,
      ).displacement.x,
    ).toBeGreaterThan(a.displacement.x * 9);
  });
  it('integrates consistently at 60 and 120 FPS, and clamps stalled frames', () => {
    const run = (n: number): number => {
      let v = { x: 0, forward: 0 },
        x = 0;
      for (let i = 0; i < n; i++) {
        const m = advanceCameraMotion(v, { x: 1, forward: 0 }, 1 / n, 100, 1);
        v = m.velocity;
        x += m.displacement.x;
      }
      return x;
    };
    expect(run(60)).toBeCloseTo(run(120), 9);
    expect(
      advanceCameraMotion(
        { x: 0, forward: 0 },
        { x: 1, forward: 0 },
        10,
        100,
        1,
      ),
    ).toEqual(
      advanceCameraMotion(
        { x: 0, forward: 0 },
        { x: 1, forward: 0 },
        0.05,
        100,
        1,
      ),
    );
  });
  it('uses bounded exponential zoom', () => {
    expect(cameraZoomDistance(100, -100, 1)).toBeLessThan(100);
    expect(cameraZoomDistance(100, 100, 1)).toBeGreaterThan(100);
    expect(cameraZoomDistance(1.2, -600, 3)).toBe(1.2);
    expect(cameraZoomDistance(30000, 600, 3)).toBe(30000);
  });
  it.each([
    [-20, 40, -12, 40],
    [85, 40, 75, 40],
    [20, 70, 20, 62],
    [20, 0, 20, 12],
  ] as const)(
    'clamps geographic target %s,%s without changing the projection',
    (lon, lat, wantLon, wantLat) => {
      const origin = { lon: 13.5, lat: 41.5 },
        b = { west: -12, east: 75, south: 12, north: 62 },
        p = projectLocalMapMetres({ lon, lat }, origin),
        q = boundedCameraTarget(p.east / 1000, -p.north / 1000, b, origin);
      expect(q.lon).toBeCloseTo(wantLon, 8);
      expect(q.lat).toBeCloseTo(wantLat, 8);
      expect(q.clamped).toBe(true);
    },
  );
});
