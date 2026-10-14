import * as THREE from 'three';
import { createArchitecturalModules } from './architectural-modules.js';

function gable() {
  const g = new THREE.BufferGeometry();
  const a = [
      [-0.5, 0, -0.5],
      [0.5, 0, -0.5],
      [0, 0.35, -0.5],
      [-0.5, 0, 0.5],
      [0.5, 0, 0.5],
      [0, 0.35, 0.5],
    ],
    p = [];
  for (const tri of [
    [0, 2, 1],
    [3, 4, 5],
    [0, 3, 5],
    [0, 5, 2],
    [1, 2, 5],
    [1, 5, 4],
  ])
    for (const i of tri) p.push(...a[i]);
  g.setAttribute('position', new THREE.Float32BufferAttribute(p, 3));
  const uv = [];
  for (let i = 0; i < p.length; i += 3) uv.push(p[i] + 0.5, p[i + 2] + 0.5);
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.computeVertexNormals();
  return g;
}
const random = (i) => {
  const x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

/** Original procedural art, not an archaeological survey or simulation population. Units: km. */
export function createSettlementAssets(
  settlements,
  project,
  elevation,
  terrainAt,
  developmentContexts = new Map(),
  developmentSnapshots = new Map(),
) {
  const detail = new THREE.Group(),
    far = new THREE.Group(),
    anchors = [],
    cities = [];
  const stone = new THREE.MeshStandardMaterial({
    color: '#d4c5a2',
    roughness: 0.95,
  });
  const plaster = new THREE.MeshStandardMaterial({
    color: '#d8c6a8',
    roughness: 0.95,
  });
  const roof = new THREE.MeshStandardMaterial({
    color: '#ad654b',
    roughness: 0.88,
  });
  const tileCanvas = document.createElement('canvas');
  tileCanvas.width = tileCanvas.height = 128;
  const tileContext = tileCanvas.getContext('2d');
  tileContext.fillStyle = '#d1b5a0';
  tileContext.fillRect(0, 0, 128, 128);
  for (let y = 0; y < 128; y += 8) {
    tileContext.fillStyle = '#775640';
    tileContext.fillRect(0, y, 128, 1);
    for (let x = 0; x < 128; x += 8) {
      tileContext.fillStyle = (x + y) % 16 ? '#c0a48c' : '#dcc0a6';
      tileContext.fillRect(x + 1, y + 1, 6, 6);
    }
  }
  roof.map = new THREE.CanvasTexture(tileCanvas);
  roof.map.colorSpace = THREE.SRGBColorSpace;
  roof.bumpMap = roof.map;
  roof.bumpScale = 0.00012;
  const timber = new THREE.MeshStandardMaterial({
    color: '#65513c',
    roughness: 1,
  });
  const italicRoof = new THREE.MeshStandardMaterial({
    color: '#756248',
    roughness: 1,
  });
  const paving = new THREE.MeshStandardMaterial({
    color: '#b3a587',
    roughness: 1,
  });
  const box = new THREE.BoxGeometry(1, 1, 1),
    roofGeometry = gable();
  let buildingCount = 0,
    fieldCount = 0;
  for (let si = 0; si < settlements.length; si++) {
    const s = settlements[si],
      [x, z] = project((s.renderAnchor ?? s).lon, (s.renderAnchor ?? s).lat);
    const special = ['roma', 'capua', 'neapolis', 'norba'].includes(s.key);
    const radius = s.tier === 1 ? 0.8 : s.tier === 2 ? 0.55 : 0.3;
    const y =
      terrainAt(x, z) ?? Math.max(0.002, (elevation(s.lon, s.lat) / 1000) * 3);
    const group = new THREE.Group();
    group.position.set(x, y, z);
    detail.add(group);
    const batches = new Map();
    const add = (kind, px, pz, sx, sy, sz, angle = 0, lift = 0) => {
      if (!batches.has(kind)) batches.set(kind, []);
      const ground = terrainAt(x + px, z + pz);
      if (ground === null) return;
      batches
        .get(kind)
        .push({ px, pz, sx, sy, sz, angle, py: ground - y + sy / 2 + lift });
    };
    const count =
      s.key === 'norba'
        ? 240
        : special
          ? s.key === 'roma'
            ? 1100
            : s.key === 'capua'
              ? 850
              : 480
          : s.tier === 1
            ? 90
            : s.tier === 2
              ? 55
              : s.tier === 3
                ? 24
                : 8;
    const greek = s.key === 'neapolis';
    const occupied = new Map();
    for (let i = 0; i < count; i++) {
      let px, pz, angle;
      if (greek) {
        const row = Math.floor(i / 20),
          col = i % 20;
        px = (col - 9.5) * 0.047;
        pz = (row - 8.5) * 0.055;
        angle = -0.25;
        const ox = px;
        px = ox * Math.cos(angle) - pz * Math.sin(angle);
        pz = ox * Math.sin(angle) + pz * Math.cos(angle);
      } else if (s.key === 'roma') {
        // Uneven neighborhoods, not a radial enclosure; all footprints are artistic reconstruction.
        const centers = [
          [0.15, -0.1],
          [-0.15, 0.2],
          [-0.65, -0.7],
          [-0.15, -1.05],
          [0.45, -0.6],
          [0.6, 0.05],
          [0.05, 0.45],
          [-0.55, 0.55],
          [-0.45, -0.05],
        ];
        const [cx, cz] = centers[i % centers.length],
          a = random(i + 901) * Math.PI * 2,
          r = Math.sqrt(random(i + 411)) * 0.37;
        px = cx + Math.cos(a) * r;
        pz = cz + Math.sin(a) * r;
        angle = 0.3 + Math.sin(px * 4 + pz * 2) * 0.55;
      } else {
        const a = random(i + si * 109) * Math.PI * 2,
          r = Math.sqrt(random(i + 700 + si * 79)) * radius;
        px = Math.cos(a) * r;
        pz = Math.sin(a) * r;
        angle =
          s.key === 'capua'
            ? 0.15 + (random(i + 21) - 0.5) * 0.35
            : random(i + 31) * Math.PI;
      }
      // Civic/open ground is reconstructive, never a claimed excavated footprint.
      if (Math.abs(px) < 0.09 && Math.abs(pz) < 0.15) continue;
      const cellX = Math.floor(px / 0.04),
        cellZ = Math.floor(pz / 0.04);
      let collision = false;
      for (let dx = -1; dx <= 1; dx++)
        for (let dz = -1; dz <= 1; dz++)
          for (const [a, b] of occupied.get(`${cellX + dx}/${cellZ + dz}`) ??
            [])
            if (Math.hypot(px - a, pz - b) < 0.034) collision = true;
      if (collision) continue;
      const cellKey = `${cellX}/${cellZ}`;
      if (!occupied.has(cellKey)) occupied.set(cellKey, []);
      occupied.get(cellKey).push([px, pz]);
      const sx = 0.016 + random(i + 42) * 0.011,
        sz = 0.021 + random(i + 13) * 0.014,
        sy = 0.007 + random(i + 62) * 0.005;
      const corners = [
        [-sx / 2, -sz / 2],
        [sx / 2, -sz / 2],
        [sx / 2, sz / 2],
        [-sx / 2, sz / 2],
      ].map(([a, b]) => terrainAt(x + px + a, z + pz + b));
      // Ambient house decoration only: do not put a flat house across a cliff.
      if (
        corners.some((v) => v === null) ||
        Math.max(...corners) - Math.min(...corners) > 0.009
      )
        continue;
      add('body', px, pz, sx, sy, sz, angle);
      add('roof', px, pz, sx * 1.12, 0.014, sz * 1.12, angle, sy * 0.6);
      add(
        'door',
        px + Math.sin(angle) * sz * 0.51,
        pz + Math.cos(angle) * sz * 0.51,
        0.004,
        0.005,
        0.001,
        angle,
      );
      if (special && i % 4 === 0) {
        for (const side of [-1, 1]) {
          add('body', px + side * 0.019, pz, 0.008, 0.006, 0.04, angle);
          add('roof', px + side * 0.019, pz, 0.01, 0.011, 0.043, angle, 0.004);
        }
      }
      buildingCount++;
    }
    if (special) {
      for (let i = -5; i <= 5; i++) {
        const angle = greek ? -0.25 : 0.1;
        if (greek) add('road', i * 0.09, 0, 0.008, 0.001, 1.04, angle);
        else if (i === 0 || (i === 3 && s.key !== 'norba'))
          add('road', 0, i * 0.12, radius * 1.8, 0.001, 0.008, angle);
      }
      // Defenses attested at Rome and Neapolis, not an invented universal enclosure.
      if (s.key === 'roma' || s.key === 'neapolis') {
        const path = greek
          ? [
              [-0.5, -0.42],
              [0.05, -0.51],
              [0.52, -0.38],
              [0.56, 0.18],
            ]
          : [
              [-0.7, -0.3],
              [-0.48, -0.73],
              [0.15, -0.87],
              [0.68, -0.48],
              [0.77, 0.03],
            ];
        for (let i = 0; i < path.length - 1; i++) {
          const [ax, az] = path[i],
            [bx, bz] = path[i + 1],
            len = Math.hypot(bx - ax, bz - az),
            steps = Math.ceil(len / 0.018);
          for (let j = 0; j < steps; j++)
            add(
              'wall',
              ax + ((bx - ax) * (j + 0.5)) / steps,
              az + ((bz - az) * (j + 0.5)) / steps,
              len / steps,
              0.013,
              0.006,
              Math.atan2(-(bz - az), bx - ax),
            );
        }
      }
      for (let i = 0; i < 24; i++) {
        const a = i * 2.399,
          r = radius + 0.25 + random(i + si) * 0.45,
          px = Math.cos(a) * r,
          pz = Math.sin(a) * r;
        const heights = [
          [-0.04, -0.07],
          [0.04, -0.07],
          [0.04, 0.07],
          [-0.04, 0.07],
        ].map(([a, b]) => terrainAt(x + px + a, z + pz + b));
        if (
          heights.some((v) => v === null) ||
          Math.max(...heights) - Math.min(...heights) > 0.005
        )
          continue;
        add('field', px, pz, 0.08, 0.001, 0.14, a);
        fieldCount++;
      }
      for (let i = 0; i < 90; i++) {
        const a = i * 2.399,
          r = 0.85 + random(i + si * 17) * 0.55,
          px = Math.cos(a) * r,
          pz = Math.sin(a) * r;
        add('trunk', px, pz, 0.002, 0.006, 0.002);
        add('crown', px, pz, 0.015, 0.014, 0.013, 0, 0.006);
      }
    }
    const materials = {
      body: plaster,
      roof: s.key === 'norba' ? italicRoof : roof,
      door: timber,
      wall: stone,
      column: stone,
      stone,
      road: paving,
      field: new THREE.MeshStandardMaterial({ color: '#8b9860', roughness: 1 }),
      trunk: timber,
      crown: new THREE.MeshStandardMaterial({ color: '#62744c', roughness: 1 }),
    };
    for (const [kind, instances] of batches) {
      if (kind === 'field' || kind === 'road') {
        const vertices = [];
        for (const p of instances) {
          const point = (u, v) => {
            const dx = (u - 0.5) * p.sx,
              dz = (v - 0.5) * p.sz,
              px = p.px + dx * Math.cos(p.angle) - dz * Math.sin(p.angle),
              pz = p.pz + dx * Math.sin(p.angle) + dz * Math.cos(p.angle);
            return [px, (terrainAt(x + px, z + pz) ?? y) - y + 0.001, pz];
          };
          const nu =
              kind === 'field' ? 8 : Math.max(1, Math.ceil(p.sx / 0.015)),
            nv = kind === 'field' ? 8 : Math.max(1, Math.ceil(p.sz / 0.015));
          for (let r = 0; r < nv; r++)
            for (let c = 0; c < nu; c++) {
              const ps = [
                point(c / nu, r / nv),
                point((c + 1) / nu, r / nv),
                point((c + 1) / nu, (r + 1) / nv),
                point(c / nu, (r + 1) / nv),
              ];
              for (const index of [0, 2, 1, 0, 3, 2])
                vertices.push(...ps[index]);
            }
        }
        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute(
          'position',
          new THREE.Float32BufferAttribute(vertices, 3),
        );
        geometry.computeVertexNormals();
        group.add(new THREE.Mesh(geometry, materials[kind]));
        continue;
      }
      const g =
        kind === 'roof'
          ? roofGeometry
          : kind === 'crown'
            ? new THREE.IcosahedronGeometry(0.5, 1)
            : kind === 'column'
              ? new THREE.CylinderGeometry(0.5, 0.58, 1, 6)
              : box;
      const mesh = new THREE.InstancedMesh(
        g,
        materials[kind],
        instances.length,
      );
      const m = new THREE.Matrix4(),
        q = new THREE.Quaternion();
      for (let i = 0; i < instances.length; i++) {
        const p = instances[i];
        q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), p.angle);
        m.compose(
          new THREE.Vector3(p.px, p.py, p.pz),
          q,
          new THREE.Vector3(p.sx, p.sy, p.sz),
        );
        mesh.setMatrixAt(i, m);
        if (kind === 'body' || kind === 'roof')
          mesh.setColorAt(
            i,
            new THREE.Color().setHSL(
              kind === 'body' ? 0.1 : 0.045,
              0.23 + random(i) * 0.17,
              0.48 + random(i + 7) * 0.23,
            ),
          );
      }
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      group.add(mesh);
    }
    const proxy = new THREE.Group();
    proxy.position.set(x, y + 0.08, z);
    far.add(proxy);
    const n = s.tier === 1 ? 20 : s.tier === 2 ? 12 : 6;
    const silhouette = new THREE.InstancedMesh(roofGeometry, roof, n),
      proxyMatrix = new THREE.Matrix4();
    for (let i = 0; i < n; i++) {
      proxyMatrix.makeScale(0.5, 0.6, 0.7);
      proxyMatrix.setPosition(
        ((i % 5) - 2) * 0.65,
        0.15 + (i % 3) * 0.1,
        (Math.floor(i / 5) - 1) * 0.8,
      );
      silhouette.setMatrixAt(i, proxyMatrix);
    }
    proxy.add(silhouette);
    anchors.push({ s, x, y, z, radius: Math.max(1.1, radius) });
    const context = developmentContexts.get(s.id),
      snapshot = developmentSnapshots.get(s.id);
    const city = { group, proxy, s, x, y, z, context, modules: null };
    if (context && snapshot) {
      city.modules = createArchitecturalModules(
        context,
        snapshot,
        (px, pz) => (terrainAt(x + px, z + pz) ?? y) - y + 0.001,
      );
      group.add(city.modules);
    }
    cities.push(city);
  }
  return {
    detail,
    far,
    anchors,
    buildingCount,
    fieldCount,
    applyDevelopmentSnapshot(snapshot) {
      const city = cities.find((c) => c.s.id === snapshot.settlementId);
      if (!city?.context)
        throw new RangeError(
          'No architectural context supplied for settlement',
        );
      const next = createArchitecturalModules(
        city.context,
        snapshot,
        (px, pz) =>
          (terrainAt(city.x + px, city.z + pz) ?? city.y) - city.y + 0.001,
      );
      if (city.modules) {
        city.group.remove(city.modules);
        city.modules.userData.dispose();
      }
      city.modules = next;
      city.group.add(next);
      return next.userData.selection;
    },
    selections() {
      return cities
        .filter((c) => c.modules)
        .map((c) => ({ id: c.s.id, assets: c.modules.userData.selection }));
    },
    update(camera, distance) {
      for (const c of cities) {
        const d = Math.hypot(
          camera.position.x - c.x,
          camera.position.y - c.y,
          camera.position.z - c.z,
        );
        c.group.visible = distance < 80 && d < 100;
        c.proxy.visible = !c.group.visible;
      }
    },
  };
}
