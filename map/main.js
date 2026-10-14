import * as THREE from 'three';
import {
  loadRegionalMaterial,
  stationaryTransitionAttributes,
} from './regional-material.js';
import {
  regularParentSample,
  terrainMorphWeight,
} from '../src/presentation/terrain-transition.ts';
import {
  REGION_VIEWS,
  WORLD_RENDER_BOUNDS,
  syntheticMarkerFixture,
  GeographicMarkerIndex,
} from '../src/presentation/world-navigation.ts';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { deriveAuthoredCanonicalId } from '../src/domain/identity/canonical-id.ts';
import { validateGeographicGraph } from '../src/domain/geography/geography.ts';
import { transferSettlementControl } from '../src/simulation/campaign-map-state.ts';
import {
  validateGeographicDataset,
  sampleElevation,
} from '../src/infrastructure/geographic-dataset.ts';
import {
  projectLocalMapMetres,
  unprojectLocalMapMetres,
} from '../src/infrastructure/world-geography.ts';
import { validateSettlementAtlas } from '../src/infrastructure/settlement-atlas.ts';
import {
  layoutSettlementLabels,
  settlementDetailBand,
} from '../src/presentation/settlement-label-layout.ts';
import { createTerrainTiles, sampleTile } from './terrain-tiles.js';
import { barycentricWeights } from '../src/presentation/terrain-style.ts';
import { createSettlementAssets } from './settlement-assets.js';

const host = document.querySelector('#map');
async function boot() {
  const response = await fetch('/data/world-terrain/context.json');
  if (!response.ok)
    throw new Error('Geographic dataset missing. Run npm run map:terrain.');
  const data = await response.json();
  validateGeographicDataset(data);
  const atlas = await (await fetch('/data/settlement-atlas.json')).json();
  const presentation = await (
    await fetch('/data/settlement-presentation.json')
  ).json();
  const visualFixtures = await (
    await fetch('/data/development-visual-fixtures.json')
  ).json();
  const diagnosticData = await (
    await fetch('/data/geographic-diagnostics.json')
  ).json();
  validateSettlementAtlas(atlas.records);
  const atlasByKey = new Map(
    atlas.records.map((record) => [record.key, record]),
  );
  const { bounds: b, width: w, height: h, elevations } = data;
  const viewOrigin = {
    lon: 13.5,
    lat: 41.5,
  };
  const project = (lon, lat) => {
    const p = projectLocalMapMetres({ lon, lat }, viewOrigin);
    return [p.east / 1000, -p.north / 1000];
  };
  const ecologicalMaterial = await loadRegionalMaterial(viewOrigin);
  const tileManifest = await (
    await fetch('/data/world-terrain/manifest.json')
  ).json();
  const cityTerrain = await Promise.all(
    [
      'local-roma',
      'local-capua',
      'local-neapolis',
      'local-norba',
      'N41E12',
      'N41E14',
      'N40E14',
    ].map(async (id) =>
      (await fetch('/data/italy-terrain/' + id + '.json')).json(),
    ),
  );
  function elevation(lon, lat) {
    const tile = cityTerrain.find(
      (t) =>
        lon >= t.bounds.west &&
        lon <= t.bounds.east &&
        lat >= t.bounds.south &&
        lat <= t.bounds.north,
    );
    return tile
      ? sampleTile(tile, lon, lat)
      : sampleElevation(
          data,
          Math.max(b.west, Math.min(b.east, lon)),
          Math.max(b.south, Math.min(b.north, lat)),
        );
  }
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#79999c');
  scene.fog = new THREE.FogExp2('#83948d', 0.00012);
  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    logarithmicDepthBuffer: true,
  });
  renderer.setSize(innerWidth, innerHeight);
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.02;
  renderer.shadowMap.enabled = false;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.shadowMap.autoUpdate = false;
  renderer.shadowMap.needsUpdate = true;
  host.appendChild(renderer.domElement);
  const camera = new THREE.PerspectiveCamera(
    42,
    innerWidth / innerHeight,
    0.002,
    40000,
  );
  camera.setViewOffset(
    innerWidth,
    innerHeight,
    -Math.min(155, innerWidth * 0.1),
    -20,
    innerWidth,
    innerHeight,
  );
  camera.position.set(30, 275, 310);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.minDistance = 1.2;
  controls.maxDistance = 30000;
  controls.maxPolarAngle = Math.PI * 0.45;
  controls.target.set(20, 0, 5);
  scene.add(new THREE.HemisphereLight('#dce7ee', '#273221', 1.15));
  const sun = new THREE.DirectionalLight('#fff0d6', 2.2);
  sun.position.set(-150, 200, -120);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.left = -220;
  sun.shadow.camera.right = 220;
  sun.shadow.camera.top = 220;
  sun.shadow.camera.bottom = -220;
  sun.shadow.camera.near = 1;
  sun.shadow.camera.far = 650;
  sun.shadow.bias = -0.0003;
  sun.shadow.normalBias = 0.15;
  scene.add(sun);
  const isLand = (lon, lat) => {
    const t =
      cityTerrain.find(
        (t) =>
          lon >= t.bounds.west &&
          lon <= t.bounds.east &&
          lat >= t.bounds.south &&
          lat <= t.bounds.north,
      ) ?? data;
    const c = Math.max(
      0,
      Math.min(
        t.width - 1,
        Math.round(
          ((lon - t.bounds.west) / (t.bounds.east - t.bounds.west)) *
            (t.width - 1),
        ),
      ),
    );
    const r = Math.max(
      0,
      Math.min(
        t.height - 1,
        Math.round(
          ((t.bounds.north - lat) / (t.bounds.north - t.bounds.south)) *
            (t.height - 1),
        ),
      ),
    );
    return t.land[r * t.width + c];
  };
  const geometry = new THREE.PlaneGeometry(1, 1, w - 1, h - 1);
  geometry.rotateX(-Math.PI / 2);
  const positions = geometry.attributes.position;
  geometry.setAttribute('contextUv', geometry.attributes.uv.clone());
  const colors = [];
  const land = [];
  for (let i = 0; i < positions.count; i++) {
    const col = i % w,
      row = Math.floor(i / w),
      lon = b.west + (col / (w - 1)) * (b.east - b.west),
      lat = b.north - (row / (h - 1)) * (b.north - b.south);
    const dry = data.land[i];
    const projected = project(lon, lat);
    positions.setX(i, projected[0]);
    positions.setZ(i, projected[1]);
    geometry.attributes.uv.setXY(i, projected[0] / 250, -projected[1] / 250);
    land.push(dry);
    const e = Math.max(0, elevations[i]);
    positions.setY(i, Math.max(0.002, (e / 1000) * 3));
    const c = new THREE.Color(1, 1, 1);
    colors.push(c.r, c.g, c.b);
  }
  const textureCanvas = document.createElement('canvas');
  textureCanvas.width = 512;
  textureCanvas.height = 512;
  const ctx = textureCanvas.getContext('2d');
  const pixels = ctx.createImageData(512, 512);
  for (let i = 0; i < 512 * 512; i++) {
    const x = i % 512,
      y = Math.floor(i / 512),
      grain = Math.sin(i * 127.1) * 43758.5453;
    const patch =
      Math.sin(x * 0.047 + Math.sin(y * 0.023) * 2.1) * 0.6 +
      Math.cos(y * 0.061 + x * 0.019) * 0.4;
    const v = THREE.MathUtils.clamp(
      220 + (grain - Math.floor(grain)) * 28 + patch * 15,
      0,
      255,
    );
    pixels.data.set([v, v, v, 255], i * 4);
  }
  ctx.putImageData(pixels, 0, 0);
  const terrainTexture = new THREE.CanvasTexture(textureCanvas);
  terrainTexture.wrapS = terrainTexture.wrapT = THREE.RepeatWrapping;
  terrainTexture.repeat.set(12, 12);
  terrainTexture.anisotropy = renderer.capabilities.getMaxAnisotropy();
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  geometry.computeVertexNormals();
  const material = new THREE.MeshStandardMaterial({
    vertexColors: true,
    map: terrainTexture,
    roughness: 0.95,
    polygonOffset: true,
    polygonOffsetFactor: 2,
    polygonOffsetUnits: 2,
  });
  const terrainMesh = new THREE.Mesh(geometry, material);
  // Coarse context must not cast shadows onto a different-resolution surface.
  terrainMesh.castShadow = false;
  terrainMesh.receiveShadow = true;
  const coarseGeometry = new THREE.PlaneGeometry(1, 1, 128, 128);
  coarseGeometry.setAttribute(
    'contextUv',
    coarseGeometry.attributes.uv.clone(),
  );
  coarseGeometry.rotateX(-Math.PI / 2);
  const coarseColors = [];
  for (let row = 0; row <= 128; row++)
    for (let col = 0; col <= 128; col++) {
      const sourceIndex = row * 4 * w + col * 4,
        index = row * 129 + col;
      coarseGeometry.attributes.position.setY(
        index,
        positions.getY(sourceIndex),
      );
      coarseGeometry.attributes.position.setX(
        index,
        positions.getX(sourceIndex),
      );
      coarseGeometry.attributes.position.setZ(
        index,
        positions.getZ(sourceIndex),
      );
      coarseGeometry.attributes.uv.setXY(
        index,
        positions.getX(sourceIndex) / 250,
        -positions.getZ(sourceIndex) / 250,
      );
      coarseColors.push(
        colors[sourceIndex * 3],
        colors[sourceIndex * 3 + 1],
        colors[sourceIndex * 3 + 2],
      );
    }
  coarseGeometry.setAttribute(
    'color',
    new THREE.Float32BufferAttribute(coarseColors, 3),
  );
  coarseGeometry.computeVertexNormals();
  stationaryTransitionAttributes(geometry, 450);
  stationaryTransitionAttributes(coarseGeometry);
  for (let row = 0; row < h; row++)
    for (let col = 0; col < w; col++) {
      const i = row * w + col,
        sample = regularParentSample(w, 4, col, row);
      for (let k = 0; k < 3; k++) {
        geometry.attributes.parentPosition.array[i * 3 + k] = sample.ids.reduce(
          (sum, id, j) =>
            sum +
            coarseGeometry.attributes.position.array[id * 3 + k] *
              sample.weights[j],
          0,
        );
        geometry.attributes.parentNormal.array[i * 3 + k] = sample.ids.reduce(
          (sum, id, j) =>
            sum +
            coarseGeometry.attributes.normal.array[id * 3 + k] *
              sample.weights[j],
          0,
        );
      }
    }
  const terrainLod = new THREE.LOD();
  terrainLod.addLevel(terrainMesh, 0);
  terrainLod.addLevel(new THREE.Mesh(coarseGeometry, material), 450, 0.05);
  scene.add(terrainLod);
  const tileMaterial = material.clone();
  const terrainTiles = createTerrainTiles(
    scene,
    tileMaterial,
    project,
    // One-sided derivative at the coverage edge; never query fabricated terrain beyond it.
    (lon, lat) =>
      sampleElevation(
        data,
        Math.max(b.west, Math.min(b.east, lon)),
        Math.max(b.south, Math.min(b.north, lat)),
      ),
    tileManifest,
    material,
    data.coastMask,
    (lon, lat) => {
      const grid =
          terrainLod.getCurrentLevel() === 0 ? geometry : coarseGeometry,
        n = terrainLod.getCurrentLevel() === 0 ? w : 129;
      const u = THREE.MathUtils.clamp(
          ((lon - b.west) / (b.east - b.west)) * (n - 1),
          0,
          n - 1 - 0.000001,
        ),
        v = THREE.MathUtils.clamp(
          ((b.north - lat) / (b.north - b.south)) * (n - 1),
          0,
          n - 1 - 0.000001,
        ),
        c = Math.floor(u),
        r = Math.floor(v),
        fx = u - c,
        fy = v - r;
      const ids =
        fx + fy <= 1
          ? [r * n + c, (r + 1) * n + c, r * n + c + 1]
          : [(r + 1) * n + c, (r + 1) * n + c + 1, r * n + c + 1];
      const [x, z] = project(lon, lat),
        a = ids.map((i) => [
          grid.attributes.position.getX(i),
          grid.attributes.position.getZ(i),
        ]);
      const weights = barycentricWeights([x, z], a);
      const morph =
        grid === geometry
          ? terrainMorphWeight(camera.position.length(), 450)
          : 0;
      const blend = (attribute, k) =>
        ids.reduce(
          (sum, i, j) =>
            sum +
            (grid.attributes[attribute].array[i * 3 + k] * (1 - morph) +
              grid.attributes[
                attribute === 'position'
                  ? 'parentPosition'
                  : attribute === 'normal'
                    ? 'parentNormal'
                    : attribute
              ].array[i * 3 + k] *
                morph) *
              weights[j],
          0,
        );
      return {
        height: blend('position', 1),
        normal: [0, 1, 2].map((k) => blend('normal', k)),
        color: [0, 1, 2].map((k) => blend('color', k)),
      };
    },
    () =>
      `${terrainLod.getCurrentLevel()}:${Math.floor(terrainMorphWeight(camera.position.length(), 450) * 4)}`,
    ecologicalMaterial.decorate,
  );
  const waterTime = { value: 0 };
  const seaDepthPixels = new Uint8Array(w * h);
  for (let row = 0; row < h; row++)
    for (let col = 0; col < w; col++)
      seaDepthPixels[(h - 1 - row) * w + col] = Math.round(
        255 *
          THREE.MathUtils.clamp(
            -(data.bathymetry ?? elevations)[row * w + col] / 1600,
            0,
            1,
          ),
      );
  const seaDepthTexture = new THREE.DataTexture(
    seaDepthPixels,
    w,
    h,
    THREE.RedFormat,
    THREE.UnsignedByteType,
  );
  seaDepthTexture.minFilter = seaDepthTexture.magFilter = THREE.LinearFilter;
  seaDepthTexture.needsUpdate = true;
  const water = new THREE.Mesh(
    new THREE.PlaneGeometry(50000, 50000),
    new THREE.MeshPhysicalMaterial({
      color: '#214f62',
      roughness: 0.3,
      metalness: 0.2,
    }),
  );
  water.rotation.x = -Math.PI / 2;
  water.position.y = 0;
  water.material.onBeforeCompile = (shader) => {
    shader.uniforms['mapTime'] = waterTime;
    shader.uniforms['mapSeaDepth'] = { value: seaDepthTexture };
    shader.uniforms.mapGeoOrigin = {
      value: new THREE.Vector2(
        (viewOrigin.lon * Math.PI) / 180,
        (viewOrigin.lat * Math.PI) / 180,
      ),
    };
    shader.uniforms.mapGeoBounds = {
      value: new THREE.Vector4(b.west, b.south, b.east, b.north),
    };
    shader.uniforms['mapShallow'] = { value: new THREE.Color('#538b91') };
    shader.uniforms['mapDeep'] = { value: new THREE.Color('#325f77') };
    shader.vertexShader = shader.vertexShader
      .replace(
        '#include <common>',
        '#include <common>\nvarying vec2 mapWaterPosition;',
      )
      .replace(
        '#include <begin_vertex>',
        '#include <begin_vertex>\nmapWaterPosition=position.xy;',
      );
    shader.fragmentShader = shader.fragmentShader
      .replace(
        '#include <common>',
        '#include <common>\nuniform vec2 mapGeoOrigin;uniform vec4 mapGeoBounds;uniform float mapTime; varying vec2 mapWaterPosition; uniform sampler2D mapSeaDepth; uniform vec3 mapShallow; uniform vec3 mapDeep;',
      )
      .replace(
        '#include <normal_fragment_begin>',
        '#include <normal_fragment_begin>\nfloat waveA=sin(dot(mapWaterPosition,vec2(0.85,0.6))+mapTime); float waveB=sin(dot(mapWaterPosition,vec2(-0.72,1.11))-mapTime*0.8); normal=normalize(normal+vec3(waveA*0.003,waveB*0.003,0.0));',
      );
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <color_fragment>',
      '#include <color_fragment>\nfloat rho=max(length(mapWaterPosition),0.00001);float cc=rho/6371.0088;float p0=mapGeoOrigin.y;float lat=asin(cos(cc)*sin(p0)+mapWaterPosition.y*sin(cc)*cos(p0)/rho);float lon=mapGeoOrigin.x+atan(mapWaterPosition.x*sin(cc),rho*cos(p0)*cos(cc)-mapWaterPosition.y*sin(p0)*sin(cc));vec2 geo=vec2(lon,lat)*57.295779513;vec2 seaUV=(geo-mapGeoBounds.xy)/(mapGeoBounds.zw-mapGeoBounds.xy);float depth=texture2D(mapSeaDepth,clamp(seaUV,0.0,1.0)).r;bool outside=any(lessThan(seaUV,vec2(0.0)))||any(greaterThan(seaUV,vec2(1.0)));diffuseColor.rgb=outside?vec3(0.045,0.063,0.068):mix(mapShallow,mapDeep,smoothstep(0.0,0.28,depth));',
    );
  };
  scene.add(water);
  const coverageEdge = [];
  for (const [a, c] of [
    [
      [b.west, b.south],
      [b.east, b.south],
    ],
    [
      [b.east, b.south],
      [b.east, b.north],
    ],
    [
      [b.east, b.north],
      [b.west, b.north],
    ],
    [
      [b.west, b.north],
      [b.west, b.south],
    ],
  ])
    for (let i = 0; i <= 128; i++) {
      const t = i / 128,
        [x, z] = project(a[0] + (c[0] - a[0]) * t, a[1] + (c[1] - a[1]) * t);
      coverageEdge.push(new THREE.Vector3(x, 30, z));
    }
  const coverageLine = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints(coverageEdge),
    new THREE.LineDashedMaterial({
      color: '#c3b485',
      dashSize: 20,
      gapSize: 14,
      transparent: true,
      opacity: 0.65,
    }),
  );
  coverageLine.computeLineDistances();
  scene.add(coverageLine);
  const riverSegments = [];
  let collectingRivers = true;
  function line(coords, color, yOffset = 0.003, dashed = false) {
    const dense = [];
    for (let i = 0; i < coords.length - 1; i++) {
      const a = coords[i],
        c = coords[i + 1],
        nearCity = [
          [12.49, 41.89],
          [14.25, 41.086],
          [14.257, 40.852],
        ].some(
          ([x, y]) =>
            Math.abs((a[0] + c[0]) / 2 - x) < 0.1 &&
            Math.abs((a[1] + c[1]) / 2 - y) < 0.1,
        ),
        steps = Math.max(
          1,
          Math.ceil(
            Math.hypot(c[0] - a[0], c[1] - a[1]) * (nearCity ? 5000 : 120),
          ),
        );
      for (let j = 0; j < steps; j++)
        dense.push([
          a[0] + ((c[0] - a[0]) * j) / steps,
          a[1] + ((c[1] - a[1]) * j) / steps,
        ]);
    }
    if (coords.length) dense.push(coords.at(-1));
    const points = dense.map(([lon, lat]) => {
      const [x, z] = project(lon, lat);
      return new THREE.Vector3(
        x,
        (Math.max(0, elevation(lon, lat)) / 1000) * 3 + yOffset,
        z,
      );
    });
    if (points.length < 2) return;
    if (collectingRivers) {
      for (let i = 1; i < points.length; i++)
        riverSegments.push(...points[i - 1].toArray(), ...points[i].toArray());
      return;
    }
    const g = new THREE.BufferGeometry().setFromPoints(points);
    const m = dashed
      ? new THREE.LineDashedMaterial({ color, dashSize: 1.2, gapSize: 0.7 })
      : new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.8 });
    const mesh = new THREE.Line(g, m);
    mesh.computeLineDistances();
    scene.add(mesh);
    return mesh;
  }
  for (const f of data.features.rivers_lake_centerlines) {
    const lines =
      f.geometry.type === 'MultiLineString'
        ? f.geometry.coordinates
        : [f.geometry.coordinates];
    for (const coords of lines)
      line(
        coords.filter(
          ([lon, lat]) =>
            lon >= b.west && lon <= b.east && lat >= b.south && lat <= b.north,
        ),
        '#83bdc5',
      );
  }
  collectingRivers = false;
  const riverGeometry = new THREE.BufferGeometry();
  riverGeometry.setAttribute(
    'position',
    new THREE.Float32BufferAttribute(riverSegments, 3),
  );
  scene.add(
    new THREE.LineSegments(
      riverGeometry,
      new THREE.LineBasicMaterial({
        color: '#72aeb6',
        transparent: true,
        opacity: 0.8,
      }),
    ),
  );
  for (const f of data.features.lakes) {
    const ps =
      f.geometry.type === 'MultiPolygon'
        ? f.geometry.coordinates
        : [f.geometry.coordinates];
    for (const p of ps) {
      const shape = new THREE.Shape(
        p[0].map(([lon, lat]) => {
          const [x, z] = project(lon, lat);
          return new THREE.Vector2(x, -z);
        }),
      );
      const lake = new THREE.Mesh(
        new THREE.ShapeGeometry(shape),
        new THREE.MeshStandardMaterial({ color: '#4d8a96', roughness: 0.3 }),
      );
      lake.rotation.x = -Math.PI / 2;
      const center = p[0][0];
      lake.position.y = (Math.max(0, elevation(...center)) / 1000) * 3 + 0.003;
      scene.add(lake);
    }
  }
  // Deterministic decorative coverage, explicitly not historical forest evidence.
  const trees = new THREE.InstancedMesh(
    new THREE.ConeGeometry(0.22, 0.18, 7),
    new THREE.MeshStandardMaterial({ color: '#354f35', roughness: 1 }),
    5000,
  );
  const matrix = new THREE.Matrix4();
  const broadleaf = new THREE.InstancedMesh(
    new THREE.IcosahedronGeometry(0.2, 1),
    new THREE.MeshStandardMaterial({ color: '#52613b', roughness: 1 }),
    2000,
  );
  const trunks = new THREE.InstancedMesh(
    new THREE.CylinderGeometry(0.015, 0.02, 0.08, 5),
    new THREE.MeshStandardMaterial({ color: '#65533a', roughness: 1 }),
    2000,
  );
  let broadleafCount = 0;
  let treeCount = 0;
  const random = (i) => {
    const n = Math.sin(i * 127.1 + 311.7) * 43758.5453;
    return n - Math.floor(n);
  };
  for (let i = 0; i < 50000 && treeCount < 5000; i++) {
    const lon = 10 + random(i + 111) * 9,
      lat = 37 + random(i + 999) * 8;
    const [x, z] = project(lon, lat),
      e = elevation(lon, lat),
      cluster = Math.sin(x * 0.07 + Math.cos(z * 0.08)) * Math.cos(z * 0.06);
    if (!isLand(lon, lat) || e < 160 || e > 1550 || cluster < 0.2) continue;
    const y = Math.max(0.002, (e / 1000) * 3),
      scale = 0.3 + random(i + 44) * 0.7;
    matrix.makeScale(scale, scale, scale);
    matrix.setPosition(x, y + 0.08 * scale, z);
    if (random(i + 9) > 0.5 && broadleafCount < 2000) {
      trunks.setMatrixAt(broadleafCount, matrix);
      matrix.setPosition(x, y + 0.12 * scale, z);
      broadleaf.setMatrixAt(broadleafCount, matrix);
      broadleaf.setColorAt(
        broadleafCount++,
        new THREE.Color().setHSL(
          0.22 + random(i + 11) * 0.05,
          0.25,
          0.32 + random(i + 12) * 0.12,
        ),
      );
    } else trees.setMatrixAt(treeCount++, matrix);
  }
  trees.count = treeCount;
  broadleaf.count = trunks.count = broadleafCount;
  trees.castShadow = broadleaf.castShadow = true;
  scene.add(trees, broadleaf, trunks);
  const settlements = data.settlements.map((s) => ({
    ...s,
    // Pleiades describes the wider Naples/Parthenope place. Greek-core rendering anchor is provisional.
    ...(presentation.profiles.find((p) => p.key === s.key)?.renderAnchor
      ? {
          renderAnchor: presentation.profiles.find((p) => p.key === s.key)
            .renderAnchor,
          gazetteerCoordinate: { lon: s.lon, lat: s.lat },
        }
      : {}),
    id: deriveAuthoredCanonicalId({
      sourceNamespace: 'pleiades',
      sourceKey: s.source.split('/').filter(Boolean).at(-1),
    }),
    locationId: deriveAuthoredCanonicalId({
      sourceNamespace: 'historicalgame.location',
      sourceKey: `place-${s.source.split('/').filter(Boolean).at(-1)}`,
    }),
    regionId: deriveAuthoredCanonicalId({
      sourceNamespace: 'historicalgame.geography',
      sourceKey: 'central-italy',
    }),
    terrain:
      elevation(s.lon, s.lat) > 750
        ? 'mountain'
        : elevation(s.lon, s.lat) > 180
          ? 'hill'
          : 'plain',
  }));
  const connections = [
    ['roma', 'ostia'],
    ['roma', 'tibur'],
    ['roma', 'praeneste'],
    ['praeneste', 'norba'],
    ['roma', 'tarracina'],
    ['norba', 'tarracina'],
    ['tarracina', 'capua'],
  ].map(([from, to]) => ({
    id: deriveAuthoredCanonicalId({
      sourceNamespace: 'historicalgame.routes',
      sourceKey: `central-italy-${from}-${to}`,
    }),
    from: settlements.find((s) => s.key === from).locationId,
    to: settlements.find((s) => s.key === to).locationId,
    kind: 'route',
    traversalCost: 1,
  }));
  const locations = settlements.map((s) => ({
    id: s.locationId,
    regionId: s.regionId,
    name: s.name,
    terrain: s.terrain,
  }));
  validateGeographicGraph(locations, connections);
  const romanId = deriveAuthoredCanonicalId({
    sourceNamespace: 'historicalgame.scenario',
    sourceKey: 'roman-republic',
  });
  const alliedId = deriveAuthoredCanonicalId({
    sourceNamespace: 'historicalgame.scenario',
    sourceKey: 'allied-communities',
  });
  const { createPrototypeMapState } =
    await import('../src/simulation/central-italy-map-scenario.ts');
  const unknownId = deriveAuthoredCanonicalId({
    sourceNamespace: 'historicalgame.scenario',
    sourceKey: 'unresearched-control',
  });
  let state = createPrototypeMapState(
    settlements,
    romanId,
    alliedId,
    unknownId,
  );
  const markerMeshes = [],
    labels = [],
    politicalGroup = new THREE.Group();
  scene.add(politicalGroup);
  politicalGroup.visible = false;
  let selected = null,
    mode = 'geographic';
  function owner(s) {
    return state.factions.find(
      (f) => f.id === state.settlementControl.get(s.id),
    );
  }
  const settlementAssets = createSettlementAssets(
    settlements,
    project,
    elevation,
    (x, z) => {
      const p = unprojectLocalMapMetres(x * 1000, -z * 1000, viewOrigin);
      if (
        p.lon < b.west ||
        p.lon > b.east ||
        p.lat < b.south ||
        p.lat > b.north ||
        !isLand(p.lon, p.lat)
      )
        return null;
      return Math.max(0.002, (elevation(p.lon, p.lat) / 1000) * 3);
    },
    new Map(
      visualFixtures.records.map((f) => {
        const s = settlements.find((s) => s.key === f.key);
        return [
          s.id,
          {
            settlementId: s.id,
            culture: f.culture,
            yearBce: 278,
            tier: s.tier,
            geography: f.geography,
          },
        ];
      }),
    ),
    new Map(
      visualFixtures.records.map((f) => {
        const s = settlements.find((s) => s.key === f.key);
        return [
          s.id,
          {
            settlementId: s.id,
            revision: 'presentation-fixture-1',
            structures: f.structures,
          },
        ];
      }),
    ),
  );
  scene.add(settlementAssets.detail, settlementAssets.far);
  for (const { s, x, y, z, radius } of settlementAssets.anchors) {
    const hit = new THREE.Mesh(
      new THREE.SphereGeometry(radius + 0.6, 8, 8),
      new THREE.MeshBasicMaterial({ visible: false }),
    );
    hit.position.set(x, y + 0.2, z);
    hit.userData.settlement = s;
    scene.add(hit);
    markerMeshes.push(hit);
    const label = document.createElement('div');
    label.className = 'label';
    label.textContent = s.name;
    label.dataset.key = s.key;
    label.dataset.tier = String(s.tier);
    document.querySelector('#labels').appendChild(label);
    labels.push({ s, label, point: new THREE.Vector3(x, y + 0.4, z) });
    const button = document.createElement('button');
    button.textContent = s.name;
    button.dataset.key = s.key;
    button.addEventListener('click', () => select(s));
    document.querySelector('#settlements').appendChild(button);
  }
  // Influence cells are presentation estimates, never authoritative historical borders.
  const nearestIds = [];
  const projectedSettlements = new Map(
    settlements.map((s) => [s.id, project(s.lon, s.lat)]),
  );
  for (let i = 0; i < positions.count; i++) {
    const x = positions.getX(i),
      z = positions.getZ(i);
    let nearest = settlements[0],
      distance = Infinity;
    for (const s of settlements) {
      const p = projectedSettlements.get(s.id),
        d = (p[0] - x) ** 2 + (p[1] - z) ** 2;
      if (d < distance) {
        nearest = s;
        distance = d;
      }
    }
    nearestIds.push(nearest.id);
  }
  const overlay = geometry.clone();
  for (let i = 0; i < positions.count; i++)
    overlay.attributes.position.setY(i, positions.getY(i) + 0.12);
  const overlayMesh = new THREE.Mesh(
    overlay,
    new THREE.MeshBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0.48,
      depthWrite: false,
    }),
  );
  politicalGroup.add(overlayMesh);
  // The political context must yield to detailed tiles exactly as the physical context does.
  // Its UVs use geographic coverage rather than terrain-material UVs.
  for (let i = 0; i < overlay.attributes.uv.count; i++)
    overlay.attributes.uv.setXY(
      i,
      (i % w) / (w - 1),
      1 - Math.floor(i / w) / (h - 1),
    );
  terrainTiles.applyCoverage(overlayMesh.material);
  function politicalColorAt(lon, lat) {
    const [x, z] = project(lon, lat);
    let nearest = null,
      distance = 90;
    for (const s of settlements) {
      const p = projectedSettlements.get(s.id),
        d = Math.hypot(p[0] - x, p[1] - z);
      if (d < distance) {
        distance = d;
        nearest = s;
      }
    }
    return nearest ? owner(nearest).color : null;
  }
  let boundary;
  function refreshPolitical() {
    const politicalColors = [],
      segments = [];
    for (let i = 0; i < positions.count; i++) {
      const faction = state.factions.find(
        (f) => f.id === state.settlementControl.get(nearestIds[i]),
      );
      const c = new THREE.Color(faction.color);
      const near = settlements.some((s) => {
        const p = projectedSettlements.get(s.id);
        return (
          Math.hypot(p[0] - positions.getX(i), p[1] - positions.getZ(i)) < 90
        );
      });
      politicalColors.push(
        near ? c.r : colors[i * 3],
        near ? c.g : colors[i * 3 + 1],
        near ? c.b : colors[i * 3 + 2],
      );
      if (!land[i] || !near) continue;
      for (const j of [i + 1, i + w]) {
        if (j >= positions.count || !land[j] || (j === i + 1 && j % w === 0))
          continue;
        if (
          state.settlementControl.get(nearestIds[i]) !==
          state.settlementControl.get(nearestIds[j])
        ) {
          segments.push(
            positions.getX(i),
            positions.getY(i) + 0.3,
            positions.getZ(i),
            positions.getX(j),
            positions.getY(j) + 0.3,
            positions.getZ(j),
          );
        }
      }
    }
    overlay.setAttribute(
      'color',
      new THREE.Float32BufferAttribute(politicalColors, 3),
    );
    if (boundary) {
      politicalGroup.remove(boundary);
      boundary.geometry.dispose();
      boundary.material.dispose();
    }
    boundary = new THREE.LineSegments(
      new THREE.BufferGeometry().setAttribute(
        'position',
        new THREE.Float32BufferAttribute(segments, 3),
      ),
      new THREE.LineBasicMaterial({ color: '#f0d191' }),
    );
    politicalGroup.add(boundary);
  }
  refreshPolitical();
  const roma = settlements.find((s) => s.key === 'roma'),
    capua = settlements.find((s) => s.key === 'capua');
  const route = [
    [roma.lon, roma.lat],
    [12.65, 41.73],
    [13.05, 41.44],
    [13.25, 41.29],
    [13.427, 41.355],
    [13.611, 41.256],
    [13.768, 41.241],
    [13.886, 41.155],
    [14.216, 41.105],
    [capua.lon, capua.lat],
  ];
  line(route, '#e0c18b', 0.003, true);
  function select(s) {
    selected = s.id;
    document.querySelector('#development-demo').disabled =
      !visualFixtures.records.some((f) => f.key === s.key);
    document.querySelector('#place-name').textContent = s.name;
    const record = atlasByKey.get(s.key);
    document.querySelector('#description').textContent = record.evidence;
    const dl = document.querySelector('#details');
    dl.replaceChildren();
    for (const [key, value] of [
      ['Control (scenario fixture)', owner(s).name],
      [
        'Atlas classification',
        `${record.category} · tier ${record.suggestedTier} · ${record.presence278Bce} in 278 BCE`,
      ],
      ['Atlas position', `${s.lat.toFixed(4)}° N · ${s.lon.toFixed(4)}° E`],
      ['Elevation sample', `${Math.round(elevation(s.lon, s.lat))} m`],
      ['Gazetteer', s.source],
      [
        'Visual reconstruction',
        'Schematic architecture and development; not an excavated 278 BCE plan.',
      ],
      ...(s.gazetteerCoordinate
        ? [
            [
              'Visual anchor (provisional)',
              `${s.renderAnchor.lat.toFixed(4)}° N · ${s.renderAnchor.lon.toFixed(4)}° E; uncertainty ${s.renderAnchor.uncertaintyMetres} m. Atlas point retained.`,
            ],
          ]
        : []),
    ]) {
      const dt = document.createElement('dt'),
        dd = document.createElement('dd');
      dt.textContent = key;
      dd.textContent = value;
      dl.append(dt, dd);
    }
    window.__campaignMap.selectedId = selected;
    window.__campaignMap.selectedRegionId = null;
    for (const button of document.querySelectorAll('#settlements button'))
      button.setAttribute('aria-pressed', String(button.dataset.key === s.key));
  }
  function selectRegion(point) {
    const { lon, lat } = unprojectLocalMapMetres(
      point.x * 1000,
      -point.z * 1000,
      viewOrigin,
    );
    // Only the existing authored prototype region is selectable; context is not a new region model.
    if (lon < 11.6 || lon > 15.2 || lat < 40.3 || lat > 43.1) return;
    if (!isLand(lon, lat)) return;
    selected = null;
    document.querySelector('#place-name').textContent = 'Central Italy';
    document.querySelector('#description').textContent =
      'Selected geographic region. Physical terrain is shared by both map modes; political influence areas remain provisional.';
    document.querySelector('#details').replaceChildren();
    const dt = document.createElement('dt'),
      dd = document.createElement('dd');
    dt.textContent = 'Terrain at selected position';
    dd.textContent = `${lat.toFixed(4)}° N · ${lon.toFixed(4)}° E · ${Math.round(elevation(lon, lat))} m`;
    document.querySelector('#details').append(dt, dd);
    window.__campaignMap.selectedId = null;
    window.__campaignMap.selectedRegionId = settlements[0].regionId;
  }
  function setMode(next) {
    mode = next;
    terrainTiles.setPolitical(mode === 'political', politicalColorAt);
    politicalGroup.visible = mode === 'political';
    for (const name of ['geographic', 'political'])
      document
        .querySelector(`#${name}`)
        .setAttribute('aria-pressed', String(mode === name));
    window.__campaignMap.mode = mode;
  }
  for (const name of ['geographic', 'political'])
    document
      .querySelector(`#${name}`)
      .addEventListener('click', () => setMode(name));
  document.querySelector('#reset').addEventListener('click', () => {
    cameraTransition = null;
    camera.position.set(30, 275, 310);
    controls.target.set(20, 0, 5);
  });
  document
    .querySelector('#wide')
    .addEventListener('click', () => window.__campaignMap.wideForValidation());
  for (const key of ['roma', 'capua', 'neapolis'])
    document
      .querySelector('#focus-' + key)
      .addEventListener('click', () =>
        window.__campaignMap.focusForValidation(
          key,
          key === 'neapolis' ? 2 : 6,
        ),
      );
  const raycaster = new THREE.Raycaster();
  let down;
  renderer.domElement.addEventListener('pointerdown', (e) => {
    down = [e.clientX, e.clientY];
  });
  renderer.domElement.addEventListener('pointerup', (e) => {
    if (!down || Math.hypot(e.clientX - down[0], e.clientY - down[1]) > 5)
      return;
    raycaster.setFromCamera(
      new THREE.Vector2(
        (e.clientX / innerWidth) * 2 - 1,
        (-e.clientY / innerHeight) * 2 + 1,
      ),
      camera,
    );
    const hit = raycaster.intersectObjects(markerMeshes)[0];
    if (hit) select(hit.object.userData.settlement);
    else {
      const terrainHit = raycaster.intersectObject(terrainMesh)[0];
      if (terrainHit) selectRegion(terrainHit.point);
    }
  });
  addEventListener('resize', () => {
    camera.aspect = innerWidth / innerHeight;
    camera.setViewOffset(
      innerWidth,
      innerHeight,
      -Math.min(155, innerWidth * 0.1),
      -20,
      innerWidth,
      innerHeight,
    );
    camera.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight);
  });
  let cameraTransition = null;
  const sceneIdentity = scene.uuid;
  function navigateWorld(key, animated = true) {
    window.__campaignMap.setDiagnostic?.(false);
    let target, position;
    if (key === 'world') {
      const points = [];
      for (let i = 0; i <= 100; i++) {
        const t = i / 100;
        for (const [lon, lat] of [
          [b.west + t * (b.east - b.west), b.south],
          [b.west + t * (b.east - b.west), b.north],
          [b.west, b.south + t * (b.north - b.south)],
          [b.east, b.south + t * (b.north - b.south)],
        ])
          points.push(project(lon, lat));
      }
      const xs = points.map((p) => p[0]),
        zs = points.map((p) => p[1]);
      const left = Math.min(...xs),
        right = Math.max(...xs),
        top = Math.min(...zs),
        bottom = Math.max(...zs);
      const distance =
        Math.max(
          (bottom - top) / 2 / Math.tan(THREE.MathUtils.degToRad(21)),
          (right - left) /
            2 /
            Math.tan(THREE.MathUtils.degToRad(21)) /
            camera.aspect,
        ) * 1.48;
      target = new THREE.Vector3((left + right) / 2, 0, (top + bottom) / 2);
      position = target.clone().add(new THREE.Vector3(0, distance, 0.01));
    } else {
      const view = REGION_VIEWS[key];
      if (!view) throw new Error('Unknown geographic view');
      const [x, z] = project(view.lon, view.lat);
      target = new THREE.Vector3(x, 0, z);
      position = target.clone().add(new THREE.Vector3(0, view.distance, 0.01));
    }
    cameraTransition = animated
      ? {
          start: performance.now(),
          from: camera.position.clone(),
          fromTarget: controls.target.clone(),
          target,
          position,
        }
      : null;
    if (!animated) {
      camera.position.copy(position);
      controls.target.copy(target);
      controls.update();
    }
    window.__campaignMap.viewPreset = key;
    document.querySelector('#world-view').value = key;
    const names = {
      world: 'Campaign envelope',
      iberia: 'Iberia',
      italy: 'Italy',
      greece: 'Greece',
      egypt: 'Egypt',
      anatolia: 'Anatolia',
      mesopotamia: 'Mesopotamia',
      east: 'Eastern coverage edge',
      northAfrica: 'North Africa',
    };
    document.querySelector('#place-name').textContent = names[key];
    document.querySelector('#description').textContent =
      'Geographic camera view. Modern source relief and hydrography; historical settlement research outside Italy is pending. The dashed line marks data coverage, not ancient territory.';
    document.querySelector('#details').replaceChildren();
  }
  let syntheticCount = 700;
  let syntheticIndex = new GeographicMarkerIndex(
    syntheticMarkerFixture(syntheticCount),
  );
  const syntheticMesh = new THREE.InstancedMesh(
    new THREE.ConeGeometry(1, 2, 4),
    new THREE.MeshBasicMaterial({ color: '#ef58db' }),
    1000,
  );
  syntheticMesh.visible = false;
  syntheticMesh.frustumCulled = false;
  scene.add(syntheticMesh);
  const syntheticMatrix = new THREE.Matrix4();
  function updateSynthetic() {
    if (!syntheticMesh.visible) return;
    const p = unprojectLocalMapMetres(
      controls.target.x * 1000,
      -controls.target.z * 1000,
      viewOrigin,
    );
    const distance = camera.position.distanceTo(controls.target),
      span = distance / 70;
    const visible = syntheticIndex.query(
      distance > 6000
        ? WORLD_RENDER_BOUNDS
        : {
            west: p.lon - span,
            east: p.lon + span,
            south: p.lat - span,
            north: p.lat + span,
          },
    );
    const scale = Math.max(0.06, distance / 550);
    visible.forEach((m, i) => {
      const [x, z] = project(m.lon, m.lat);
      syntheticMatrix.makeScale(scale, scale, scale);
      syntheticMatrix.setPosition(
        x,
        (Math.max(0, elevation(m.lon, m.lat)) / 1000) * 3 + scale,
        z,
      );
      syntheticMesh.setMatrixAt(i, syntheticMatrix);
    });
    syntheticMesh.count = visible.length;
    syntheticMesh.instanceMatrix.needsUpdate = true;
    window.__campaignMap.synthetic = {
      enabled: true,
      total: syntheticCount,
      visible: visible.length,
      authoritative: false,
    };
  }
  window.__campaignMap = {
    sceneIdentity,
    ecologyForValidation: ecologicalMaterial.sample,
    ecologyMetadata: {
      bounds: ecologicalMaterial.manifest.bounds,
      textureBytesEstimate: ecologicalMaterial.textureBytes,
      period: '1991-2020',
      historicalReconstruction: false,
    },
    bounds: b,
    navigateForValidation: navigateWorld,
    zoomForValidation(distance) {
      if (
        !Number.isFinite(distance) ||
        distance < controls.minDistance ||
        distance > controls.maxDistance
      )
        throw new RangeError('Camera distance outside navigation limits');
      cameraTransition = null;
      camera.position
        .sub(controls.target)
        .normalize()
        .multiplyScalar(distance)
        .add(controls.target);
      controls.update();
    },
    synthetic: { enabled: false, total: 0, visible: 0, authoritative: false },
    setSyntheticForValidation(enabled, count = 700) {
      if (![700, 1000].includes(count))
        throw new RangeError('Benchmark supports 700 or 1000 fixtures');
      syntheticCount = count;
      syntheticIndex = new GeographicMarkerIndex(syntheticMarkerFixture(count));
      syntheticMesh.visible = enabled;
      if (enabled) updateSynthetic();
      else
        window.__campaignMap.synthetic = {
          enabled: false,
          total: syntheticCount,
          visible: 0,
          authoritative: false,
        };
    },
    ready: true,
    mode,
    selectedId: null,
    selectedRegionId: null,
    samples: elevations.length,
    treeCount: treeCount + broadleafCount,
    atlasCount: atlas.records.length,
    buildingCount: settlementAssets.buildingCount,
    frames: [],
    metrics: {},
    settlements: settlements.map((s) => ({
      key: s.key,
      id: s.id,
      lon: s.lon,
      lat: s.lat,
      renderAnchor: s.renderAnchor ?? null,
    })),
    controlForValidation() {
      return [...state.settlementControl];
    },
    screenPositions: {},
    applyDevelopmentSnapshot(snapshot) {
      const result = settlementAssets.applyDevelopmentSnapshot(snapshot);
      window.__campaignMap.architecturalSelections =
        settlementAssets.selections();
      renderer.shadowMap.needsUpdate = true;
      return result;
    },
    architecturalSelections: settlementAssets.selections(),
    overheadForValidation() {
      cameraTransition = null;
      controls.target.set(-70, 0, 10);
      camera.position.set(-70, 1900, 10.01);
      camera.up.set(0, 1, 0);
    },
    focusForValidation(key, distance = 95) {
      cameraTransition = null;
      window.__campaignMap.setDiagnostic?.(false);
      const s = settlements.find((s) => s.key === key),
        p = s.renderAnchor ?? s,
        [x, z] = project(p.lon, p.lat);
      controls.target.set(
        x,
        Math.max(0.002, (elevation(p.lon, p.lat) / 1000) * 3),
        z,
      );
      camera.position.set(
        x + distance * (key === 'norba' ? -0.65 : 0.3),
        controls.target.y + distance * 0.72,
        z + distance * 0.7,
      );
      select(s);
    },
    wideForValidation() {
      cameraTransition = null;
      window.__campaignMap.setDiagnostic?.(false);
      controls.target.set(30, 0, 60);
      camera.position.set(30, 850, 880);
    },
    projectForValidation(lon, lat) {
      const [x, z] = project(lon, lat);
      const p = new THREE.Vector3(
        x,
        (elevation(lon, lat) / 1000) * 3,
        z,
      ).project(camera);
      return {
        x: (p.x / 2 + 0.5) * innerWidth,
        y: (-p.y / 2 + 0.5) * innerHeight,
      };
    },
    transferForValidation(key) {
      const s = settlements.find((s) => s.key === key);
      state = transferSettlementControl(state, s.id, romanId);
      refreshPolitical();
      terrainTiles.setPolitical(mode === 'political', politicalColorAt);
      select(s);
      return { id: s.id, owner: owner(s).name };
    },
  };
  const diagnosticGroup = new THREE.Group();
  scene.add(diagnosticGroup);
  diagnosticGroup.visible = false;
  // A separate non-political graticule; altitude is cartographic, not terrain evidence.
  for (const axis of ['lon', 'lat'])
    for (
      let v = axis === 'lon' ? 6 : 35;
      v <= (axis === 'lon' ? 19 : 47);
      v++
    ) {
      const points = [];
      for (let i = 0; i <= 120; i++) {
        const lon = axis === 'lon' ? v : 6 + (i / 120) * 13,
          lat = axis === 'lat' ? v : 35 + (i / 120) * 12,
          [x, z] = project(lon, lat);
        points.push(new THREE.Vector3(x, 10, z));
      }
      diagnosticGroup.add(
        new THREE.Line(
          new THREE.BufferGeometry().setFromPoints(points),
          new THREE.LineBasicMaterial({
            color: '#d6d4be',
            transparent: true,
            opacity: 0.25,
            depthTest: false,
          }),
        ),
      );
    }
  const diagnosticSvg = document.createElementNS(
    'http://www.w3.org/2000/svg',
    'svg',
  );
  diagnosticSvg.setAttribute('class', 'diagnostic-leaders');
  document.querySelector('#labels').appendChild(diagnosticSvg);
  const captionOffsets = [
    [-80, -55],
    [100, 75],
    [150, 15],
    [-150, 0],
    [160, -65],
    [110, 25],
    [-90, 20],
    [-70, -30],
    [-80, 65],
  ];
  const diagnosticLabels = diagnosticData.landmarks.map((d, index) => {
    const record = d.key ? atlasByKey.get(d.key) : null,
      p = record?.coordinates ?? d,
      [x, z] = project(p.lon, p.lat);
    const label = document.createElement('div');
    label.className = 'label diagnostic';
    label.textContent = `${d.name} | ${p.lat.toFixed(3)} N ${p.lon.toFixed(3)} E`;
    label.style.display = 'none';
    document.querySelector('#labels').appendChild(label);
    const leader = document.createElementNS(
      'http://www.w3.org/2000/svg',
      'line',
    );
    leader.setAttribute('stroke', '#c8d9d7');
    leader.setAttribute('stroke-width', '1');
    diagnosticSvg.appendChild(leader);
    return {
      label,
      leader,
      offset: captionOffsets[index],
      point: new THREE.Vector3(x, 10, z),
      ...d,
      lon: p.lon,
      lat: p.lat,
    };
  });
  window.__campaignMap.diagnosticLandmarks = diagnosticLabels.map((d) => ({
    name: d.name,
    lon: d.lon,
    lat: d.lat,
    source: d.source,
    precision: d.precision ?? 'Atlas representative coordinate',
  }));
  window.__campaignMap.setDiagnostic = (enabled) => {
    diagnosticGroup.visible = enabled;
    window.__campaignMap.diagnostic = enabled;
  };
  document.querySelector('#overhead').addEventListener('click', () => {
    window.__campaignMap.overheadForValidation();
    window.__campaignMap.setDiagnostic(true);
  });
  document.querySelector('#focus-norba').addEventListener('click', () => {
    window.__campaignMap.setDiagnostic(false);
    window.__campaignMap.focusForValidation('norba', 2.3);
  });
  document.querySelector('#development-demo').addEventListener('click', () => {
    const s = settlements.find((s) => s.id === selected);
    if (!s || !visualFixtures.records.some((f) => f.key === s.key)) return;
    const f = visualFixtures.records.find((f) => f.key === s.key);
    window.__campaignMap.applyDevelopmentSnapshot({
      settlementId: s.id,
      revision: 'external-preview-2',
      structures: [
        ...f.structures,
        {
          id: 'external-training-yard',
          category: 'military',
          level: 1,
          condition: 'active',
        },
      ],
    });
    document.querySelector('#development-status').textContent =
      'External preview applied: training yard. Simulation unchanged.';
  });
  let previous = performance.now(),
    lastStats = previous;
  const shadowTarget = new THREE.Vector3(Infinity, Infinity, Infinity);
  const measureContext = document.createElement('canvas').getContext('2d');
  document
    .querySelector('#world-view')
    .addEventListener('change', (e) => navigateWorld(e.target.value));
  document
    .querySelector('#world-overhead')
    .addEventListener('click', () => navigateWorld('world'));
  document
    .querySelector('#synthetic-markers')
    .addEventListener('change', (e) =>
      window.__campaignMap.setSyntheticForValidation(e.target.checked),
    );
  controls.addEventListener('start', () => {
    cameraTransition = null;
  });
  navigateWorld('world', false);
  function animate(now) {
    if (cameraTransition) {
      const t = Math.min(1, (now - cameraTransition.start) / 1200),
        v = t * t * (3 - 2 * t);
      camera.position.lerpVectors(
        cameraTransition.from,
        cameraTransition.position,
        v,
      );
      controls.target.lerpVectors(
        cameraTransition.fromTarget,
        cameraTransition.target,
        v,
      );
      if (t === 1) cameraTransition = null;
    }
    updateSynthetic();
    scene.fog.density = Math.min(
      0.00012,
      0.12 / Math.max(1, camera.position.distanceTo(controls.target)),
    );
    requestAnimationFrame(animate);
    controls.update();
    diagnosticSvg.style.display = diagnosticGroup.visible ? 'block' : 'none';
    for (const d of diagnosticLabels) {
      const p = d.point.clone().project(camera),
        x = (p.x / 2 + 0.5) * innerWidth,
        y = (-p.y / 2 + 0.5) * innerHeight,
        dx = d.offset[0],
        dy = d.offset[1];
      d.label.style.left = `${x + dx}px`;
      d.label.style.top = `${y + dy}px`;
      d.label.style.display =
        diagnosticGroup.visible && p.z > -1 && p.z < 1 ? 'block' : 'none';
      d.leader.setAttribute('x1', x);
      d.leader.setAttribute('y1', y);
      d.leader.setAttribute('x2', x + dx);
      d.leader.setAttribute('y2', y + dy);
    }
    waterTime.value = now / 1000;
    window.__campaignMap.cameraDistance = camera.position.distanceTo(
      controls.target,
    );
    // City-scale near plane at strategic distance destroys depth precision at the coast.
    camera.near = Math.max(
      0.002,
      Math.min(0.5, window.__campaignMap.cameraDistance / 1000),
    );
    camera.updateProjectionMatrix();
    const band = settlementDetailBand(window.__campaignMap.cameraDistance);
    settlementAssets.update(camera, window.__campaignMap.cameraDistance);
    trees.visible =
      broadleaf.visible =
      trunks.visible =
        window.__campaignMap.cameraDistance > 30;
    const close = window.__campaignMap.cameraDistance < 40;
    if (renderer.shadowMap.enabled !== close) {
      renderer.shadowMap.enabled = close;
      renderer.shadowMap.needsUpdate = true;
    }
    if (close && shadowTarget.distanceTo(controls.target) > 0.05) {
      shadowTarget.copy(controls.target);
      sun.target.position.copy(controls.target);
      scene.add(sun.target);
      sun.position.copy(controls.target).add(new THREE.Vector3(-2, 3, -1.5));
      Object.assign(sun.shadow.camera, {
        left: -2.5,
        right: 2.5,
        top: 2.5,
        bottom: -2.5,
        near: 0.1,
        far: 10,
      });
      sun.shadow.camera.updateProjectionMatrix();
      sun.shadow.bias = -0.00005;
      sun.shadow.normalBias = 0.0002;
      renderer.shadowMap.needsUpdate = true;
    }
    terrainTiles.update(camera, controls.target, now);
    window.__campaignMap.tiles = terrainTiles.diagnostics();
    renderer.render(scene, camera);
    const dt = now - previous;
    previous = now;
    const frames = window.__campaignMap.frames;
    frames.push(dt);
    if (frames.length > 600) frames.shift();
    const candidates = [];
    for (const { s, label, point } of labels) {
      const p = point.clone().project(camera),
        sx = (p.x / 2 + 0.5) * innerWidth,
        sy = (-p.y / 2 + 0.5) * innerHeight;
      label.style.left = `${sx}px`;
      label.style.top = `${sy}px`;
      label.style.display = p.z < 1 && p.z > -1 ? 'block' : 'none';
      label.classList.toggle('selected', selected === s.id);
      label.classList.toggle('major', s.tier === 1);
      measureContext.font = `${selected === s.id ? 16 : s.tier === 1 ? 14 : 12}px Georgia`;
      const width =
          measureContext.measureText(s.name).width + s.name.length + 12,
        height = selected === s.id ? 29 : 25;
      if (p.z < 1 && p.z > -1)
        candidates.push({
          id: s.id,
          tier: s.tier,
          selected: selected === s.id,
          x: sx - width / 2,
          y: sy - height,
          width,
          height,
        });
      window.__campaignMap.screenPositions[s.key] = { x: sx, y: sy + 10 };
    }
    const blockers = [
      document.querySelector('header'),
      document.querySelector('aside'),
      document.querySelector('footer'),
    ].map((element) => element.getBoundingClientRect());
    const visible = new Set(
      layoutSettlementLabels(
        candidates,
        { x: 0, y: 0, width: innerWidth, height: innerHeight },
        blockers,
        band,
      ),
    );
    for (const { s, label } of labels)
      label.style.display =
        !diagnosticGroup.visible && visible.has(s.id) ? 'block' : 'none';
    window.__campaignMap.visibleLabels = candidates.filter((candidate) =>
      visible.has(candidate.id),
    );
    window.__campaignMap.detailBand = band;
    if (now - lastStats > 1000) {
      lastStats = now;
      const fps = 1000 / (frames.reduce((a, c) => a + c, 0) / frames.length);
      const heap = performance.memory?.usedJSHeapSize;
      window.__campaignMap.metrics = {
        fps,
        heapBytes: heap ?? null,
        drawCalls: renderer.info.render.calls,
        triangles: renderer.info.render.triangles,
        geometries: renderer.info.memory.geometries,
        textures: renderer.info.memory.textures,
        terrainLod: terrainLod.getCurrentLevel(),
      };
      document.querySelector('#stats').textContent =
        `${fps.toFixed(0)} FPS · ${renderer.info.render.calls} draws · ${heap ? (heap / 1048576).toFixed(0) + ' MB JS heap' : 'heap unavailable'}`;
    }
  }
  requestAnimationFrame(animate);
}
boot().catch((error) => {
  document.querySelector('#stats').textContent = error.message;
  document.querySelector('#description').textContent = error.message;
});
