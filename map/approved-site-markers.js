import * as THREE from 'three';

/** Neutral cartographic symbols: one draw call, no culture/development assumptions. */
export function createApprovedSiteMarkers(
  scene,
  sites,
  project,
  surfaceHeight,
) {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 64;
  const ctx = canvas.getContext('2d');
  ctx.beginPath();
  ctx.arc(32, 32, 22, 0, Math.PI * 2);
  ctx.fillStyle = '#263e48';
  ctx.fill();
  ctx.lineWidth = 5;
  ctx.strokeStyle = '#e7d3a1';
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(32, 32, 5, 0, Math.PI * 2);
  ctx.fillStyle = '#f9ecd1';
  ctx.fill();
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const mesh = new THREE.InstancedMesh(
    new THREE.PlaneGeometry(1, 1),
    new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      alphaTest: 0.05,
      depthTest: false,
      depthWrite: false,
      toneMapped: false,
    }),
    sites.length,
  );
  mesh.frustumCulled = false;
  mesh.renderOrder = 15;
  scene.add(mesh);
  const anchors = sites.map((s) => {
    const [x, z] = project(s.lon, s.lat);
    return { s, point: new THREE.Vector3(x, 0, z) };
  });
  const matrix = new THREE.Matrix4(),
    scale = new THREE.Vector3(), tint=new THREE.Color();
  return {
    anchors,
    update(camera, viewportHeight, visible, selectedId, hoveredId) {
      mesh.visible = visible;
      for (let i = 0; i < anchors.length; i++) {
        const a = anchors[i];
        a.point.y =
          surfaceHeight(a.s.lon, a.s.lat) + 0.003;
        const size =
          ((a.s.id===selectedId ? 23 : a.s.id===hoveredId ? 21 : 18) *
            2 *
            a.point.distanceTo(camera.position) *
            Math.tan(THREE.MathUtils.degToRad(camera.fov / 2))) /
          viewportHeight;
        matrix.compose(a.point, camera.quaternion, scale.setScalar(size));
        mesh.setMatrixAt(i, matrix);
        mesh.setColorAt(i,tint.set(a.s.id===selectedId ? '#ffd586' : a.s.id===hoveredId ? '#fff2cb' : '#ffffff'));
      }
      mesh.instanceMatrix.needsUpdate = true;
      if(mesh.instanceColor) mesh.instanceColor.needsUpdate=true;
      mesh.computeBoundingSphere();
    },
    pick(raycaster) {
      if (!mesh.visible) return null;
      const hit = raycaster.intersectObject(mesh)[0];
      return hit ? { ...hit, settlement: sites[hit.instanceId] } : null;
    },
  };
}
