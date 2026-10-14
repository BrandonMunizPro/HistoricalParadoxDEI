import * as THREE from 'three';
import {
  cameraSettings,
  cameraInputBlocked,
  edgeScrollVector,
  advanceCameraMotion,
  cameraZoomDistance,
  boundedCameraTarget,
} from '../src/presentation/campaign-camera.ts';
import { unprojectLocalMapMetres } from '../src/infrastructure/world-geography.ts';

export function createCampaignControls(
  camera,
  controls,
  canvas,
  bounds,
  origin,
  terrainHeight,
  cancelPreset,
  resetStrategic,
) {
  let settings;
  try {
    settings = cameraSettings(
      JSON.parse(
        window.localStorage.getItem('historicalgame.camera.v1') ?? '{}',
      ),
    );
  } catch {
    settings = cameraSettings({});
  }
  let velocity = { x: 0, forward: 0 },
    pointer = null,
    edgeStarted = 0,
    dragging = false,
    goal = null,
    zoomPointer = null;
  const keys = new Set(),
    ray = new THREE.Raycaster(),
    plane = new THREE.Plane(new THREE.Vector3(0, 1, 0)),
    point = new THREE.Vector3();
  canvas.tabIndex = 0;
  canvas.setAttribute(
    'aria-label',
    'Campaign map: WASD pan, Q/E rotate, R/F tilt, wheel zoom, Home strategic view',
  );
  controls.enableZoom = false;
  controls.screenSpacePanning = false;
  controls.maxPolarAngle = Math.PI * 0.44;
  function apply() {
    controls.mouseButtons.LEFT = THREE.MOUSE.ROTATE;
    controls.mouseButtons.MIDDLE =
      settings.middleDrag === 'pan' ? THREE.MOUSE.PAN : THREE.MOUSE.ROTATE;
    controls.mouseButtons.RIGHT = THREE.MOUSE.PAN;
    controls.panSpeed = settings.movement;
    controls.rotateSpeed = settings.rotation;
  }
  function stop() {
    keys.clear();
    velocity = { x: 0, forward: 0 };
    goal = null;
    zoomPointer = null;
    pointer = null;
    edgeStarted = 0;
  }
  function blocked(e) {
    const a = document.activeElement;
    return cameraInputBlocked(
      a?.tagName ?? '',
      !!a?.isContentEditable,
      e.ctrlKey || e.metaKey || e.altKey,
    );
  }
  const recognized = new Set([
    'KeyW',
    'KeyA',
    'KeyS',
    'KeyD',
    'ArrowUp',
    'ArrowLeft',
    'ArrowDown',
    'ArrowRight',
    'KeyQ',
    'KeyE',
    'KeyR',
    'KeyF',
    'KeyZ',
    'KeyX',
    'KeyV',
    'KeyC',
    'ShiftLeft',
    'ShiftRight',
    'Home',
  ]);
  window.addEventListener('keydown', (e) => {
    if (!recognized.has(e.code) || blocked(e)) return;
    e.preventDefault();
    if (e.code === 'Home') {
      stop();
      resetStrategic();
      return;
    }
    keys.add(e.code);
    cancelPreset();
  });
  window.addEventListener('keyup', (e) => keys.delete(e.code));
  window.addEventListener('blur', () => {
    stop();
    dragging = false;
  });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stop();
  });
  window.addEventListener('pointermove', (e) => {
    pointer = { x: e.clientX, y: e.clientY };
    const edge =
      e.clientX < settings.edgeWidth ||
      e.clientX > innerWidth - settings.edgeWidth ||
      e.clientY < settings.edgeWidth ||
      e.clientY > innerHeight - settings.edgeWidth;
    if (!edge) edgeStarted = 0;
    else if (!edgeStarted) edgeStarted = performance.now();
  });
  document.addEventListener('pointerleave', () => {
    pointer = null;
    edgeStarted = 0;
  });
  canvas.addEventListener('pointerdown', () => {
    canvas.focus({ preventScroll: true });
    goal = null;
    zoomPointer = null;
  });
  controls.addEventListener('start', () => {
    dragging = true;
    cancelPreset();
    goal = null;
    velocity = { x: 0, forward: 0 };
  });
  controls.addEventListener('end', () => {
    dragging = false;
  });
  function groundAt(screen) {
    camera.updateMatrixWorld(true);
    ray.setFromCamera(
      new THREE.Vector2(
        (screen.x / innerWidth) * 2 - 1,
        1 - (screen.y / innerHeight) * 2,
      ),
      camera,
    );
    if (ray.ray.direction.y >= -0.06) return null;
    let y = controls.target.y;
    for (let i = 0; i < 3; i++) {
      plane.constant = -y;
      if (!ray.ray.intersectPlane(plane, point)) return null;
      const g = unprojectLocalMapMetres(
        point.x * 1000,
        -point.z * 1000,
        origin,
      );
      if (
        g.lon < bounds.west ||
        g.lon > bounds.east ||
        g.lat < bounds.south ||
        g.lat > bounds.north
      )
        return null;
      y = terrainHeight(g.lon, g.lat);
    }
    return point.clone();
  }
  canvas.addEventListener(
    'wheel',
    (e) => {
      e.preventDefault();
      cancelPreset();
      const pixels =
        e.deltaY *
        (e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? innerHeight : 1);
      goal = cameraZoomDistance(
        goal ?? camera.position.distanceTo(controls.target),
        pixels,
        settings.zoom,
        controls.minDistance,
        controls.maxDistance,
      );
      zoomPointer = settings.cursorZoom ? { x: e.clientX, y: e.clientY } : null;
    },
    { passive: false },
  );
  function translate(x, z) {
    controls.target.x += x;
    controls.target.z += z;
    camera.position.x += x;
    camera.position.z += z;
  }
  function constrain(dt) {
    const p = boundedCameraTarget(
      controls.target.x,
      controls.target.z,
      bounds,
      origin,
    );
    if (p.clamped) {
      translate(p.x - controls.target.x, p.z - controls.target.z);
      velocity = { x: 0, forward: 0 };
    }
    if (camera.position.distanceTo(controls.target) < 150) {
      const lift =
        (terrainHeight(p.lon, p.lat) - controls.target.y) *
        (1 - Math.exp(-10 * dt));
      controls.target.y += lift;
      camera.position.y += lift;
    }
    const eye = unprojectLocalMapMetres(
      camera.position.x * 1000,
      -camera.position.z * 1000,
      origin,
    );
    const inside =
      eye.lon >= bounds.west &&
      eye.lon <= bounds.east &&
      eye.lat >= bounds.south &&
      eye.lat <= bounds.north;
    camera.position.y = Math.max(
      camera.position.y,
      (inside ? terrainHeight(eye.lon, eye.lat) : 0) + 0.025,
    );
  }
  apply();
  const ui = document.querySelector('#camera-settings');
  for (const input of ui.querySelectorAll('[data-camera]')) {
    const name = input.dataset.camera;
    if (input.type === 'checkbox') input.checked = settings[name];
    else input.value = String(settings[name]);
    input.addEventListener('input', () => {
      settings = cameraSettings({
        ...settings,
        [name]:
          input.type === 'checkbox'
            ? input.checked
            : input.tagName === 'SELECT'
              ? input.value
              : Number(input.value),
      });
      apply();
      stop();
      try {
        window.localStorage.setItem(
          'historicalgame.camera.v1',
          JSON.stringify(settings),
        );
      } catch {
        /* Preferences still work in memory. */
      }
    });
  }
  return {
    stop,
    update(dt, now, presetActive) {
      if (presetActive) {
        velocity = { x: 0, forward: 0 };
        goal = null;
        return;
      }
      const focused = document.activeElement,
        blockedFocus = cameraInputBlocked(
          focused?.tagName ?? '',
          !!focused?.isContentEditable,
          false,
        );
      if (blockedFocus) {
        keys.clear();
        velocity = { x: 0, forward: 0 };
      }
      const allowed =
        pointer &&
        !dragging &&
        !blockedFocus &&
        document.hasFocus() &&
        document.elementFromPoint(pointer.x, pointer.y) === canvas;
      const edge = pointer
        ? edgeScrollVector(
            pointer.x,
            pointer.y,
            innerWidth,
            innerHeight,
            settings,
            allowed,
            now - edgeStarted,
          )
        : [0, 0];
      const input = {
        x:
          (keys.has('KeyD') || keys.has('ArrowRight') ? 1 : 0) -
          (keys.has('KeyA') || keys.has('ArrowLeft') ? 1 : 0) +
          edge[0],
        forward:
          (keys.has('KeyW') || keys.has('ArrowUp') ? 1 : 0) -
          (keys.has('KeyS') || keys.has('ArrowDown') ? 1 : 0) +
          edge[1],
      };
      if (input.x || input.forward) cancelPreset();
      const motion = advanceCameraMotion(
        velocity,
        input,
        dt,
        camera.position.distanceTo(controls.target),
        settings.movement,
        keys.has('ShiftLeft') || keys.has('ShiftRight'),
      );
      velocity = motion.velocity;
      const azimuth = controls.getAzimuthalAngle(),
        c = Math.cos(azimuth),
        s = Math.sin(azimuth);
      translate(
        c * motion.displacement.x - s * motion.displacement.forward,
        -s * motion.displacement.x - c * motion.displacement.forward,
      );
      const rotation = (keys.has('KeyE') ? 1 : 0) - (keys.has('KeyQ') ? 1 : 0),
        tilt =
          (keys.has('KeyF') || keys.has('KeyC') ? 1 : 0) -
          (keys.has('KeyR') || keys.has('KeyV') ? 1 : 0);
      if (rotation || tilt) {
        const offset = new THREE.Spherical().setFromVector3(
          camera.position.clone().sub(controls.target),
        );
        offset.theta += rotation * dt * settings.rotation;
        offset.phi = THREE.MathUtils.clamp(
          offset.phi + tilt * dt * 0.65 * settings.rotation,
          0.04,
          controls.maxPolarAngle,
        );
        camera.position
          .copy(controls.target)
          .add(new THREE.Vector3().setFromSpherical(offset));
      }
      const keyboardZoom =
        (keys.has('KeyX') ? 1 : 0) - (keys.has('KeyZ') ? 1 : 0);
      if (keyboardZoom) {
        goal = cameraZoomDistance(
          goal ?? camera.position.distanceTo(controls.target),
          keyboardZoom * dt * 850,
          settings.zoom,
          controls.minDistance,
          controls.maxDistance,
        );
        zoomPointer = null;
      }
      if (goal !== null) {
        const before = zoomPointer ? groundAt(zoomPointer) : null,
          distance = camera.position.distanceTo(controls.target),
          next = THREE.MathUtils.lerp(
            distance,
            goal,
            1 - Math.exp(-14 * Math.min(dt, 0.05)),
          );
        camera.position
          .sub(controls.target)
          .multiplyScalar(next / distance)
          .add(controls.target);
        controls.update();
        const after = before ? groundAt(zoomPointer) : null;
        if (before && after) translate(before.x - after.x, before.z - after.z);
        if (Math.abs(next - goal) < Math.max(0.0001, goal * 0.0001))
          goal = null;
      }
      constrain(Math.min(0.05, dt));
      controls.update();
    },
    snapshot() {
      const p = unprojectLocalMapMetres(
        controls.target.x * 1000,
        -controls.target.z * 1000,
        origin,
      );
      return {
        target: {
          ...p,
          x: controls.target.x,
          y: controls.target.y,
          z: controls.target.z,
        },
        position: camera.position.toArray(),
        distance: camera.position.distanceTo(controls.target),
        azimuth: controls.getAzimuthalAngle(),
        polar: controls.getPolarAngle(),
        settings,
        velocity,
        zooming: goal !== null,
      };
    },
  };
}
