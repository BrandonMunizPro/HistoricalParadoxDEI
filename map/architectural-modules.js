import * as THREE from 'three';
import { selectArchitecturalAssets } from '../src/presentation/settlement-development.ts';

/** Original archetypes, not named excavated buildings. Dimensions in km. */
export function createArchitecturalModules(context, snapshot, ground) {
  const selected = selectArchitecturalAssets(context, snapshot),
    group = new THREE.Group();
  const stone = new THREE.MeshStandardMaterial({
    color: context.culture === 'greek' ? '#d6c9ae' : '#a89b7f',
    roughness: 0.92,
  });
  const roof = new THREE.MeshStandardMaterial({
    color: context.culture === 'italic' ? '#79664d' : '#9b5138',
    roughness: 0.9,
  });
  const wood = new THREE.MeshStandardMaterial({
    color: '#68503a',
    roughness: 1,
  });
  const foliage = new THREE.MeshStandardMaterial({
    color: '#465b35',
    roughness: 1,
  });
  const box = new THREE.BoxGeometry(1, 1, 1);
  const roofGeometry = new THREE.BufferGeometry(),
    points = [
      [-0.5, 0, -0.5],
      [0.5, 0, -0.5],
      [0, 0.5, -0.5],
      [-0.5, 0, 0.5],
      [0.5, 0, 0.5],
      [0, 0.5, 0.5],
    ],
    vertices = [];
  for (const tri of [
    [0, 2, 1],
    [3, 4, 5],
    [0, 3, 5],
    [0, 5, 2],
    [1, 2, 5],
    [1, 5, 4],
  ])
    for (const i of tri) vertices.push(...points[i]);
  roofGeometry.setAttribute(
    'position',
    new THREE.Float32BufferAttribute(vertices, 3),
  );
  roofGeometry.computeVertexNormals();
  const add = (geo, material, x, y, z, sx, sy, sz) => {
    const mesh = new THREE.Mesh(geo, material);
    mesh.position.set(x, ground(x, z) + y, z);
    mesh.scale.set(sx, sy, sz);
    mesh.castShadow = mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  };
  const building = (x, z, w, d, h) => {
    add(box, stone, x, h / 2, z, w, h, d);
    add(roofGeometry, roof, x, h, z, w * 1.1, 0.012, d * 1.1);
  };
  selected.forEach((asset) => {
    const slots = {
      civic: [0, 0],
      religious: [0.13, -0.13],
      commercial: [-0.13, -0.13],
      military: [-0.14, 0.13],
      agricultural: [0.14, 0.13],
      maritime: [0, 0.23],
    };
    const [sx, sz] = slots[asset.category],
      x = sx + (asset.variant - 1.5) * 0.004,
      z = sz;
    if (asset.condition === 'ruined') {
      for (let i = 0; i < 8; i++)
        add(
          box,
          stone,
          x + (i % 4) * 0.009,
          0.002,
          z + Math.floor(i / 4) * 0.018,
          0.007,
          0.004,
          0.007,
        );
      return;
    }
    if (asset.category === 'religious') {
      add(box, stone, x, 0.002, z, 0.06, 0.004, 0.085);
      building(x, z + 0.012, 0.027, 0.04, 0.014);
      const rows = context.culture === 'greek' ? 6 : 3;
      for (let i = 0; i < rows; i++)
        for (const side of [-1, 1]) {
          const zz = z + (i - (rows - 1) / 2) * 0.012;
          add(
            new THREE.CylinderGeometry(0.0015, 0.0019, 1, 8),
            stone,
            x + side * 0.024,
            0.012,
            zz,
            1,
            0.019,
            1,
          );
          add(box, stone, x + side * 0.024, 0.022, zz, 0.005, 0.003, 0.005);
        }
      add(roofGeometry, roof, x, 0.027, z, 0.064, 0.014, 0.09);
    } else if (asset.category === 'military') {
      for (const side of [-1, 1])
        building(x + side * 0.035, z, 0.022, 0.085, 0.009);
      for (let i = 0; i < 6; i++)
        add(
          new THREE.CylinderGeometry(0.001, 0.001, 1, 5),
          wood,
          x + (i - 3) * 0.009,
          0.006,
          z,
          1,
          0.012,
          1,
        );
    } else if (asset.category === 'commercial') {
      for (let i = 0; i < 8; i++) {
        const xx = x + ((i % 4) - 1.5) * 0.017,
          zz = z + Math.floor(i / 4) * 0.025;
        add(box, wood, xx, 0.003, zz, 0.012, 0.006, 0.01);
        add(box, roof, xx, 0.009, zz, 0.014, 0.001, 0.014);
      }
    } else if (asset.category === 'agricultural') {
      for (let i = 0; i < 12; i++) {
        const xx = x + (i % 4) * 0.017,
          zz = z + Math.floor(i / 4) * 0.02;
        add(
          new THREE.CylinderGeometry(0.001, 0.0015, 1, 5),
          wood,
          xx,
          0.004,
          zz,
          1,
          0.008,
          1,
        );
        add(
          new THREE.IcosahedronGeometry(1, 1),
          foliage,
          xx,
          0.012,
          zz,
          0.009,
          0.008,
          0.009,
        );
      }
    } else if (asset.category === 'maritime') {
      // A storehouse archetype only. No invented harbor basin, coastline change or pier on dry land.
      building(x, z, 0.035, 0.075, 0.011);
    } else {
      building(x, z, 0.06, 0.035, 0.012);
      for (let i = 0; i < 5; i++)
        add(
          new THREE.CylinderGeometry(0.0015, 0.0018, 1, 6),
          stone,
          x + (i - 2) * 0.011,
          0.01,
          z - 0.024,
          1,
          0.016,
          1,
        );
    }
  });
  group.userData.selection = selected;
  group.userData.dispose = () => {
    const geometries = new Set(),
      materials = new Set();
    group.traverse((o) => {
      if (o.isMesh) {
        geometries.add(o.geometry);
        materials.add(o.material);
      }
    });
    for (const g of geometries) g.dispose();
    for (const m of materials) m.dispose();
  };
  return group;
}
