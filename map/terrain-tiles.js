import { TERRAIN_HEIGHT_SCALE } from '../src/presentation/terrain-presentation.ts';
import { FrameWorkQueue } from '../src/presentation/frame-work-queue.ts';
import { streamProfile } from './stream-profile.js';
import * as THREE from 'three';
import { terrainDetailFamily } from '../src/presentation/world-navigation.ts';
import { unprojectLocalMapMetres } from '../src/infrastructure/world-geography.ts';
import { smoothTerrainReveal } from '../src/presentation/regional-ecology.ts';
import { parentTerrainSamplesSteps } from '../src/presentation/terrain-transition.ts';
import { stationaryTransitionAttributes } from './regional-material.js';
import { sourceTerrainHeight } from '../src/presentation/inland-water.ts';
import { barycentricWeights } from '../src/presentation/terrain-style.ts';
import { terrainCoverageInset, projectedTriangleHeight } from '../src/presentation/terrain-surface.ts';
import { terrainMorphWeight } from '../src/presentation/terrain-transition.ts';

import { terrainTopologySteps } from '../src/presentation/terrain-topology.ts';
import { validateTerrainTile } from '../src/infrastructure/terrain-tile.ts';

export function sampleTile(tile, lon, lat) {
  const n = tile.width - 1,
    b = tile.bounds;
  const x = Math.max(0, Math.min(n, ((lon - b.west) / (b.east - b.west)) * n));
  const y = Math.max(
    0,
    Math.min(n, ((b.north - lat) / (b.north - b.south)) * n),
  );
  const c = Math.floor(x),
    r = Math.floor(y),
    fx = x - c,
    fy = y - r;
  const at = (a, b) =>
    tile.elevations[Math.min(n, b) * tile.width + Math.min(n, a)];
  return (
    (at(c, r) * (1 - fx) + at(c + 1, r) * fx) * (1 - fy) +
    (at(c, r + 1) * (1 - fx) + at(c + 1, r + 1) * fx) * fy
  );
}

/** Bounded residency, requested in camera order. Offline files, no source network in play. */
export function createTerrainTiles(
  scene,
  material,
  project,
  elevation,
  manifest,
  contextMaterial,
  contextCoastMask,
  contextSurface,
  contextLod,
  decorateMaterial,
  prepareGpu,
  inlandWater,
) {
  const workQueue = new FrameWorkQueue();
  let coverQueued = false;
  function queueCover() {
    if (coverQueued) return;
    coverQueued = true;
    void workQueue
      .run(
        (function* () {
          try {
            yield* cover();
          } finally {
            coverQueued = false;
          }
        })(),
      )
      .catch((error) => {
        window.__terrainError = String(error);
      });
  }
  const inactive = new Map();
  function dispose(entry) {
    for (const { object } of entry.lod.levels) object.geometry.dispose();
    entry.texture.dispose();
    entry.material.dispose();
  }
  const resident = new Map(),
    pending = new Set(),
    failed = new Set();
  const limit = 12,
    group = new THREE.Group();
  scene.add(group);
  const coverage = {
    value: Array.from({ length: limit }, () => new THREE.Vector4(0, 0, 0, 0)),
  };
  const coverageCount = { value: 0 };
  const coverageInsets = {value:Array.from({length:limit},()=>new THREE.Vector2())};
  const packedContext = atob(contextCoastMask.bits),
    contextPixels = new Uint8Array(contextCoastMask.size ** 2);
  for (let i = 0; i < contextPixels.length; i++)
    contextPixels[i] =
      packedContext.charCodeAt(i >> 3) & (1 << (i % 8)) ? 255 : 0;
  inlandWater.maskLand(
    contextPixels,
    manifest.contextBounds,
    contextCoastMask.size,
  );
  const contextShore = new THREE.DataTexture(
    contextPixels,
    contextCoastMask.size,
    contextCoastMask.size,
    THREE.RedFormat,
  );
  contextShore.minFilter = contextShore.magFilter = THREE.LinearFilter;
  contextShore.needsUpdate = true;
  const cityCoverage = {
      value: Array.from({ length: 12 }, () => new THREE.Vector4(0, 0, 0, 0)),
    },
    cityCount = { value: 0 };
  const cityInsets={value:Array.from({length:12},()=>new THREE.Vector2())};
  contextMaterial.onBeforeCompile = (shader) => {
    decorateMaterial(shader);
    shader.uniforms.tileCoverage = coverage;
    shader.uniforms.tileCoverageCount = coverageCount;
    shader.uniforms.tileCoverageInsets = coverageInsets;
    shader.uniforms.contextShore = { value: contextShore };
    const cb = manifest.contextBounds;
    shader.uniforms.contextGeoBounds = {
      value: new THREE.Vector4(cb.west, cb.south, cb.east, cb.north),
    };
    shader.vertexShader = shader.vertexShader
      .replace(
        '#include <common>',
        '#include <common>\nattribute vec2 contextUv; varying vec2 contextCoordinate;',
      )
      .replace(
        '#include <begin_vertex>',
        '#include <begin_vertex>\ncontextCoordinate=contextUv;',
      );
    shader.fragmentShader = shader.fragmentShader
      .replace(
        '#include <common>',
        '#include <common>\nvarying vec2 contextCoordinate; uniform vec4 tileCoverage[12]; uniform vec2 tileCoverageInsets[12]; uniform int tileCoverageCount; uniform sampler2D contextShore; uniform vec4 contextGeoBounds;',
      )
      .replace(
        '#include <clipping_planes_fragment>',
        '#include <clipping_planes_fragment>\nvec2 coverageUv=(regionalGeographicDegrees()-contextGeoBounds.xy)/(contextGeoBounds.zw-contextGeoBounds.xy);vec2 maskSize=vec2(textureSize(contextShore,0));vec2 maskUv=(vec2(coverageUv.x,1.0-coverageUv.y)*(maskSize-1.0)+.5)/maskSize;diffuseColor.a*=texture2D(contextShore,maskUv).r;for(int i=0;i<12;i++){if(i>=tileCoverageCount)break;vec4 b=tileCoverage[i];vec2 inset=tileCoverageInsets[i]/(contextGeoBounds.zw-contextGeoBounds.xy);if(coverageUv.x>b.x+inset.x&&coverageUv.x<b.z-inset.x&&coverageUv.y>b.y+inset.y&&coverageUv.y<b.w-inset.y)discard;}',
      );
  };
  contextMaterial.alphaToCoverage = true;
  contextMaterial.alphaTest = 0.5;
  contextMaterial.needsUpdate = true;
  const bounds = manifest.contextBounds;
  function* cover(...args) {
    const iterator = coverWork(...args);
    while (true) {
      const next = streamProfile.measure(
        'cover',
        () => iterator.next(),
        args[0]?.id ?? args[0]?.data?.id ?? '',
      );
      if (next.done) return next.value;
      yield;
    }
  }
  function* coverWork() {
    let i = 0,
      j = 0;
    const entries = [...resident.values()].sort(
      (a, b) => Number(a.data.kind === 'city') - Number(b.data.kind === 'city'),
    );
    for (const entry of entries) {
      const t = entry.data,
        b = t.bounds;
      coverageInsets.value[i].set(...entry.clipInset);
      coverage.value[i++].set(
        (b.west - bounds.west) / (bounds.east - bounds.west),
        (b.south - bounds.south) / (bounds.north - bounds.south),
        (b.east - bounds.west) / (bounds.east - bounds.west),
        (b.north - bounds.south) / (bounds.north - bounds.south),
      );
      if (t.kind === 'city') {
        cityInsets.value[j].set(...entry.clipInset);
        cityCoverage.value[j++].set(b.west, b.south, b.east, b.north);
        yield* blendWindow(entry);
      } else yield* blendContextEdge(entry);
    }
    coverageCount.value = i;
    cityCount.value = j;
  }
  function* blendWindow(...args) {
    const iterator = blendWindowWork(...args);
    while (true) {
      const next = streamProfile.measure(
        'blendWindow',
        () => iterator.next(),
        args[0]?.id ?? args[0]?.data?.id ?? '',
      );
      if (next.done) return next.value;
      yield;
    }
  }
  function* blendWindowWork(entry) {
    const b = entry.data.bounds,
      parent = [...resident.values()].find(
        (e) =>
          e.data.kind !== 'city' &&
          e.data.kind !== 'world-regional' &&
          e.data.bounds.west <= b.west &&
          e.data.bounds.east >= b.east &&
          e.data.bounds.south <= b.south &&
          e.data.bounds.north >= b.north,
      );
    const signature = parent
      ? parent.data.id + ':' + parent.edgeSignature
      : 'context:' + contextLod();
    if (entry.windowParent === signature) return;
    entry.windowParent = signature;
    entry.revealParentId = parent?.data.id ?? null;
    let lookup;
    if (parent) {
      const fine = parent.lod.levels[0].object.geometry,
        n = parent.data.width;
      lookup = new Uint32Array(n * n);
      for (let i = 0; i < fine.attributes.position.count; i++)
        lookup[
          Math.round(fine.attributes.coastUv.getY(i) * (n - 1)) * n +
            Math.round(fine.attributes.coastUv.getX(i) * (n - 1))
        ] = i;
    }
    function surface(lon, lat) {
      if (!parent) return contextSurface(lon, lat);
      const t = parent.data,
        n = t.width,
        g = parent.lod.levels[0].object.geometry,
        u = ((lon - t.bounds.west) / (t.bounds.east - t.bounds.west)) * (n - 1),
        v =
          ((t.bounds.north - lat) / (t.bounds.north - t.bounds.south)) *
          (n - 1),
        c = Math.min(n - 2, Math.floor(u)),
        r = Math.min(n - 2, Math.floor(v)),
        fx = u - c,
        fy = v - r;
      const indices = (
        fx >= fy
          ? [r * n + c, (r + 1) * n + c + 1, r * n + c + 1]
          : [r * n + c, (r + 1) * n + c, (r + 1) * n + c + 1]
      ).map((i) => lookup[i]);
      const triangle = indices.map((i) => [
        g.attributes.position.getX(i) + parent.lod.position.x,
        g.attributes.position.getZ(i) + parent.lod.position.z,
      ]);
      const weights = barycentricWeights(project(lon, lat), triangle),
        blend = (a, k) =>
          indices.reduce(
            (s, i, j) => s + g.attributes[a].array[i * 3 + k] * weights[j],
            0,
          );
      return {
        height: blend('position', 1),
        normal: [0, 1, 2].map((k) => blend('normal', k)),
      };
    }
    const midpoint = {
      lon: (b.west + b.east) / 2,
      lat: (b.south + b.north) / 2,
    };
    entry.revealDiagnostic = {
      previousGlobalHeight: contextSurface(midpoint.lon, midpoint.lat).height,
      parentHeight: surface(midpoint.lon, midpoint.lat).height,
    };
    for (const { object } of entry.lod.levels) {
      const g = object.geometry;
      for (let i = 0; i < g.attributes.position.count; i++) {
        if (i % 256 === 0) yield;
        const x = g.attributes.coastUv.getX(i),
          y = g.attributes.coastUv.getY(i),
          edge = Math.min(x, y, 1 - x, 1 - y),
          t = Math.min(1, edge * 8),
          blend = t * t * (3 - 2 * t);
        const s = surface(
          b.west + x * (b.east - b.west),
          b.north - y * (b.north - b.south),
        );
        g.attributes.contextHeight.setX(i, s.height);
        if (x === 0.5 && y === 0.5)
          entry.revealDiagnostic.appliedCenterHeight =
            g.attributes.contextHeight.getX(i);
        g.attributes.contextNormal.setXYZ(i, ...s.normal);
        if (blend === 1) continue;
        g.attributes.position.setY(
          i,
          s.height * (1 - blend) + g.userData.originalHeights[i] * blend,
        );
        for (let k = 0; k < 3; k++)
          g.attributes.normal.array[i * 3 + k] =
            s.normal[k] * (1 - blend) +
            g.userData.originalNormals[i * 3 + k] * blend;
      }
      g.attributes.position.needsUpdate = true;
      g.attributes.normal.needsUpdate = true;
      g.attributes.contextHeight.needsUpdate = true;
      g.attributes.contextNormal.needsUpdate = true;
      g.userData.revealPrepared = true;
      g.computeBoundingSphere();
    }
    yield* refreshTransitions(entry);
  }
  function* blendContextEdge(...args) {
    const iterator = blendContextEdgeWork(...args);
    while (true) {
      const next = streamProfile.measure(
        'blendContextEdge',
        () => iterator.next(),
        args[0]?.id ?? args[0]?.data?.id ?? '',
      );
      if (next.done) return next.value;
      yield;
    }
  }
  function* blendContextEdgeWork(entry) {
    const b = entry.data.bounds,
      neighbors = [false, false, false, false];
    for (const { data: t } of resident.values()) {
      if (t.kind === 'city') continue;
      const c = t.bounds;
      if (c.north === b.north) {
        if (c.east === b.west) neighbors[0] = true;
        if (c.west === b.east) neighbors[1] = true;
      }
      if (c.west === b.west) {
        if (c.south === b.north) neighbors[2] = true;
        if (c.north === b.south) neighbors[3] = true;
      }
    }
    const signature = neighbors.join(':') + ':' + contextLod();
    if (entry.edgeSignature === signature) return;
    entry.edgeSignature = signature;
    for (const { object } of entry.lod.levels) {
      const g = object.geometry,
        uv = g.attributes.coastUv,
        p = g.attributes.position;
      for (let i = 0; i < p.count; i++) {
        if (i % 256 === 0) yield;
        const x = uv.getX(i),
          y = uv.getY(i),
          edge = Math.min(
            neighbors[0] ? 1 : x,
            neighbors[1] ? 1 : 1 - x,
            neighbors[2] ? 1 : y,
            neighbors[3] ? 1 : 1 - y,
          ),
          v = Math.min(1, edge * 8),
          blend = v * v * (3 - 2 * v);
        if (blend >= 1) {
          p.setY(i, g.userData.originalHeights[i]);
          for (let k = 0; k < 3; k++) {
            g.attributes.normal.array[i * 3 + k] =
              g.userData.originalNormals[i * 3 + k];
            g.userData.baseColors[i * 3 + k] =
              g.userData.originalColors[i * 3 + k];
          }
          continue;
        }
        const surface = contextSurface(
            b.west + x * (b.east - b.west),
            b.north - y * (b.north - b.south),
          ),
          low = surface.height;
        p.setY(i, low * (1 - blend) + g.userData.originalHeights[i] * blend);
        for (let k = 0; k < 3; k++) {
          g.attributes.normal.array[i * 3 + k] =
            surface.normal[k] * (1 - blend) +
            g.userData.originalNormals[i * 3 + k] * blend;
          g.userData.baseColors[i * 3 + k] =
            surface.color[k] * (1 - blend) +
            g.userData.originalColors[i * 3 + k] * blend;
        }
      }
      p.needsUpdate = true;
      g.attributes.normal.needsUpdate = true;
      g.computeBoundingSphere();
    }
    yield* refreshTransitions(entry);
    paint(entry);
  }
  function* refreshTransitions(...args) {
    const iterator = refreshTransitionsWork(...args);
    while (true) {
      const next = streamProfile.measure(
        'refreshTransitions',
        () => iterator.next(),
        args[0]?.id ?? args[0]?.data?.id ?? '',
      );
      if (next.done) return next.value;
      yield;
    }
  }
  function* refreshTransitionsWork(entry) {
    const n = entry.data.width,
      fine = entry.lod.levels[0].object.geometry,
      lookup = new Uint32Array(n * n);
    for (let i = 0; i < fine.attributes.position.count; i++) {
      const x = Math.round(fine.attributes.coastUv.getX(i) * (n - 1)),
        y = Math.round(fine.attributes.coastUv.getY(i) * (n - 1));
      lookup[y * n + x] = i;
    }
    for (let level = 0; level < entry.lod.levels.length; level++) {
      const g = entry.lod.levels[level].object.geometry,
        parent =
          level < 2
            ? yield* parentTerrainSamplesSteps(n, level === 0 ? 2 : 4)
            : null;
      const next =
        level === 0
          ? entry.data.kind === 'world-regional'
            ? 2000
            : 260
          : level === 1
            ? entry.data.kind === 'world-regional'
              ? 6000
              : 550
            : 1e12;
      for (let i = 0; i < g.attributes.position.count; i++) {
        if (i % 256 === 0) yield;
        const x = Math.round(g.attributes.coastUv.getX(i) * (n - 1)),
          y = Math.round(g.attributes.coastUv.getY(i) * (n - 1));
        const sample = parent?.[y * n + x];
        for (let k = 0; k < 3; k++) {
          g.attributes.parentPosition.array[i * 3 + k] = sample
            ? sample.ids.reduce(
                (s, id, j) =>
                  s +
                  fine.attributes.position.array[lookup[id] * 3 + k] *
                    sample.weights[j],
                0,
              )
            : g.attributes.position.array[i * 3 + k];
          g.attributes.parentNormal.array[i * 3 + k] = sample
            ? sample.ids.reduce(
                (s, id, j) =>
                  s +
                  fine.attributes.normal.array[lookup[id] * 3 + k] *
                    sample.weights[j],
                0,
              )
            : g.attributes.normal.array[i * 3 + k];
        }
        g.attributes.lodThreshold.setX(i, next);
        if (!g.userData.revealPrepared) {
          const b = entry.data.bounds;
          const surface = contextSurface(
            b.west + (x / (n - 1)) * (b.east - b.west),
            b.north - (y / (n - 1)) * (b.north - b.south),
          );
          g.attributes.contextHeight.setX(i, surface.height);
          g.attributes.contextNormal.setXYZ(i, ...surface.normal);
        }
      }
      g.userData.revealPrepared = true;
      for (const key of [
        'parentPosition',
        'parentNormal',
        'lodThreshold',
        'contextHeight',
        'contextNormal',
      ])
        g.attributes[key].needsUpdate = true;
    }
  }
  function* geometry(...args) {
    const iterator = geometryWork(...args);
    while (true) {
      const next = streamProfile.measure(
        'geometry',
        () => iterator.next(),
        args[0]?.id ?? args[0]?.data?.id ?? '',
      );
      if (next.done) return next.value;
      yield;
    }
  }
  function* geometryWork(t, stride) {
    const { vertices, indices } = yield* terrainTopologySteps(t.width, stride);
    const p = [],
      colors = [],
      uv = [],
      normals = [],
      coastUv = [];
    let vertexIndex = 0;
    for (const [c, r] of vertices) {
      if (vertexIndex++ % 256 === 0) yield;
      const lon =
          t.bounds.west + (c / (t.width - 1)) * (t.bounds.east - t.bounds.west),
        lat =
          t.bounds.north -
          (r / (t.height - 1)) * (t.bounds.north - t.bounds.south),
        [x, z] = project(lon, lat);
      const e = sampleTile(t, lon, lat);
      p.push(x, sourceTerrainHeight(e), z);
      uv.push(x / 250, -z / 250);
      coastUv.push(c / (t.width - 1), r / (t.height - 1));
      const color = new THREE.Color().setRGB(1, 1, 1, THREE.SRGBColorSpace);
      colors.push(color.r, color.g, color.b);
      // Shared geographic derivative avoids normal seams; coarse context derivative is deliberate.
      const dx =
        ((elevation(lon + 0.006, lat) - elevation(lon - 0.006, lat)) / 1000) *
        TERRAIN_HEIGHT_SCALE;
      const dz =
        ((elevation(lon, lat - 0.006) - elevation(lon, lat + 0.006)) / 1000) *
        TERRAIN_HEIGHT_SCALE;
      const epsilon = Math.min(
        0.003,
        ((t.bounds.east - t.bounds.west) / (t.width - 1)) * 0.5,
        ((t.bounds.north - t.bounds.south) / (t.height - 1)) * 0.5,
      );
      const fineDx =
        ((sampleTile(t, lon + epsilon, lat) -
          sampleTile(t, lon - epsilon, lat)) /
          1000) *
        TERRAIN_HEIGHT_SCALE;
      const fineDz =
        ((sampleTile(t, lon, lat - epsilon) -
          sampleTile(t, lon, lat + epsilon)) /
          1000) *
        TERRAIN_HEIGHT_SCALE;
      const edge = Math.min(c, r, t.width - 1 - c, t.height - 1 - r),
        blend = Math.min(1, edge / 4),
        eastStep =
          (6371.0088 * Math.cos((lat * Math.PI) / 180) * Math.PI) / 180,
        northStep = (6371.0088 * Math.PI) / 180;
      const slopeX =
        (dx / (eastStep * 0.012)) * (1 - blend) +
        (fineDx / (eastStep * epsilon * 2)) * blend;
      const slopeZ =
        (dz / (northStep * 0.012)) * (1 - blend) +
        (fineDz / (northStep * epsilon * 2)) * blend;
      const n = new THREE.Vector3(-slopeX, 1, -slopeZ).normalize();
      normals.push(n.x, n.y, n.z);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(p, 3));
    g.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
    g.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    g.setAttribute('coastUv', new THREE.Float32BufferAttribute(coastUv, 2));
    g.setIndex(indices);
    // Small spatial buckets avoid raycasting every triangle for every marker.
    const buckets = new Map();
    for(let i=0;i<indices.length;i+=3) {
      if(i%1536===0) yield;
      const ids=indices.slice(i,i+3);
      const x=Math.floor(Math.min(...ids.map(id=>vertices[id][0]))/stride);
      const y=Math.floor(Math.min(...ids.map(id=>vertices[id][1]))/stride);
      const key=`${x}:${y}`, list=buckets.get(key) ?? [];
      list.push(ids);buckets.set(key,list);
    }
    g.userData.surfaceBuckets=buckets;
    g.userData.stride=stride;
    g.computeBoundingSphere();
    g.userData.originalColors = colors.slice();
    g.userData.baseColors = colors.slice();
    g.userData.originalNormals = normals.slice();
    g.userData.originalHeights = p.filter((_, i) => i % 3 === 1);
    return g;
  }
  let political = false,
    colorAt = () => null;
  function paint(entry) {
    for (const { object } of entry.lod.levels) {
      const g = object.geometry,
        colors = g.attributes.color,
        coords = g.attributes.coastUv,
        original = g.userData.baseColors,
        b = entry.data.bounds;
      if (!political) {
        colors.array.set(original);
        colors.needsUpdate = true;
        continue;
      }
      for (let i = 0; i < colors.count; i++) {
        const lon = b.west + coords.getX(i) * (b.east - b.west),
          lat = b.north - coords.getY(i) * (b.north - b.south),
          tint = political ? colorAt(lon, lat) : null;
        const c = new THREE.Color().fromArray(original, i * 3);
        if (tint) c.lerp(new THREE.Color(tint), 0.56);
        colors.setXYZ(i, c.r, c.g, c.b);
      }
      colors.needsUpdate = true;
    }
  }
  let lastContextLod = -1;
  let wanted = new Set(),
    last = 0;
  async function load(descriptor) {
    pending.add(descriptor.id);
    try {
      const cached = inactive.get(descriptor.id);
      if (cached) {
        inactive.delete(descriptor.id);
        await workQueue.run(
          (function* () {
            if (!wanted.has(descriptor.id)) {
              dispose(cached);
              return;
            }
            cached.born = performance.now();
            cached.edgeSignature = '';
            cached.windowParent = '';
            resident.set(descriptor.id, cached);
            group.add(cached.lod);
            paint(cached);
            yield* cover();
          })(),
        );
        streamProfile.record('cache-hit', 0, descriptor.id);
        return;
      }
      const loadStart = performance.now();
      const response = await fetch(descriptor.url);
      streamProfile.record(
        'network',
        performance.now() - loadStart,
        descriptor.id,
      );
      if (!response.ok) throw Error(`Terrain ${response.status}`);
      const decodeStart = performance.now();
      const data = await response.json();
      streamProfile.record(
        'decode',
        performance.now() - decodeStart,
        descriptor.id,
      );
      const buildStart = performance.now();
      validateTerrainTile(data);
      if (!wanted.has(descriptor.id)) return;
      const entry = await workQueue.run(
        (function* () {
          const packed = atob(data.coastMask.bits),
            size = data.coastMask.size,
            mask = new Uint8Array(size * size);
          for (let i = 0; i < mask.length; i++)
            mask[i] = packed.charCodeAt(i >> 3) & (1 << (i % 8)) ? 255 : 0;
          inlandWater.maskLand(mask, data.bounds, size);
          const texture = new THREE.DataTexture(
            mask,
            size,
            size,
            THREE.RedFormat,
          );
          texture.minFilter = texture.magFilter = THREE.LinearFilter;
          texture.needsUpdate = true;
          const tileMaterial = material.clone();
          tileMaterial.alphaToCoverage = true;
          tileMaterial.alphaTest = 0.5;
          // Small underlaps close clipping precision cracks; depth bias gives detailed terrain priority.
          tileMaterial.polygonOffset = data.kind !== 'city';
          tileMaterial.polygonOffsetFactor = 1;
          tileMaterial.polygonOffsetUnits = 1;
          tileMaterial.customProgramCacheKey = () =>
            `coast-${data.kind === 'city' ? 'city' : 'regional'}`;
          const reveal = { value: 0 };
          tileMaterial.onBeforeCompile = (shader) => {
            decorateMaterial(shader, reveal);
            shader.uniforms.shoreMask = { value: texture };
            shader.uniforms.cityCoverage = cityCoverage;
            shader.uniforms.cityCount = cityCount;
            shader.uniforms.cityInsets = cityInsets;
            shader.uniforms.tileBounds = {
              value: new THREE.Vector4(
                data.bounds.west,
                data.bounds.south,
                data.bounds.east,
                data.bounds.north,
              ),
            };
            shader.vertexShader = shader.vertexShader
              .replace(
                '#include <common>',
                '#include <common>\nattribute vec2 coastUv; varying vec2 shoreUv;',
              )
              .replace(
                '#include <begin_vertex>',
                '#include <begin_vertex>\nshoreUv=coastUv;',
              );
            shader.fragmentShader = shader.fragmentShader
              .replace(
                '#include <common>',
                '#include <common>\nvarying vec2 shoreUv; uniform sampler2D shoreMask; uniform vec4 cityCoverage[12];uniform vec2 cityInsets[12];uniform int cityCount;uniform vec4 tileBounds;',
              )
              .replace(
                '#include <clipping_planes_fragment>',
                '#include <clipping_planes_fragment>\nvec2 maskSize=vec2(textureSize(shoreMask,0));vec2 geographicUv=(regionalGeographicDegrees()-tileBounds.xw)/(tileBounds.zy-tileBounds.xw);diffuseColor.a*=texture2D(shoreMask,(geographicUv*(maskSize-1.0)+.5)/maskSize).r;' +
                  (data.kind === 'city'
                    ? ''
                    : '\nvec2 geo=regionalGeographicDegrees();for(int i=0;i<12;i++){if(i>=cityCount)break;vec4 b=cityCoverage[i];vec2 inset=cityInsets[i];if(geo.x>b.x+inset.x&&geo.x<b.z-inset.x&&geo.y>b.y+inset.y&&geo.y<b.w-inset.y)discard;}'),
              );
          };
          const lod = new THREE.LOD();
          for (const [stride, distance] of [
            [1, 0],
            [2, data.kind === 'world-regional' ? 2000 : 260],
            [4, data.kind === 'world-regional' ? 6000 : 550],
          ]) {
            const mesh = new THREE.Mesh(
              yield* geometry(data, stride),
              tileMaterial,
            );
            mesh.receiveShadow = true;
            stationaryTransitionAttributes(mesh.geometry);
            lod.addLevel(mesh, distance, 0.08);
          }
          // LOD distance is measured from the tile center, not the origin of the world.
          const [cx, cz] = project(
            (data.bounds.west + data.bounds.east) / 2,
            (data.bounds.north + data.bounds.south) / 2,
          );
          for (const level of lod.levels)
            level.object.geometry.translate(-cx, 0, -cz);
          lod.position.set(cx, 0, cz);

          const entry = {
            data,
            lod,
            texture,
            material: tileMaterial,
            reveal,
            born: performance.now(),
            clipInset: terrainCoverageInset(data.bounds,data.width,{lon:13.5,lat:41.5}),
          };
          yield* refreshTransitions(entry);
          return entry;
        })(),
      );
      if (!wanted.has(descriptor.id)) {
        dispose(entry);
        return;
      }
      await prepareGpu(entry.lod, entry.texture);
      await workQueue.run(
        (function* () {
          if (!wanted.has(descriptor.id)) {
            dispose(entry);
            return;
          }
          entry.born = performance.now();
          group.add(entry.lod);
          resident.set(data.id, entry);
          paint(entry);
          yield* cover();
        })(),
      );
      streamProfile.record(
        'build-activate',
        performance.now() - buildStart,
        descriptor.id,
      );
      streamProfile.record(
        'tile-total',
        performance.now() - loadStart,
        descriptor.id,
      );
    } catch (error) {
      failed.add(descriptor.id);
      window.__terrainError = String(error);
    } finally {
      pending.delete(descriptor.id);
    }
  }
  let activeCamera = null;
  function surfaceHeight(lon, lat) {
    const lakeHeight=inlandWater.surfaceHeight(lon,lat);
    if(lakeHeight!==undefined) return lakeHeight;
    const entries=[...resident.values()].filter(({data:t})=>lon>=t.bounds.west&&lon<=t.bounds.east&&lat>=t.bounds.south&&lat<=t.bounds.north)
      .sort((a,b)=>(a.data.bounds.east-a.data.bounds.west)*(a.data.bounds.north-a.data.bounds.south)-(b.data.bounds.east-b.data.bounds.west)*(b.data.bounds.north-b.data.bounds.south));
    const [px,pz]=project(lon,lat);
    for(const e of entries) {
      const g=e.lod.levels[e.lod.getCurrentLevel()].object.geometry, b=e.data.bounds;
      const size=e.data.coastMask.size;
      const mx=Math.max(0,Math.min(size-1,Math.round((lon-b.west)/(b.east-b.west)*(size-1))));
      const my=Math.max(0,Math.min(size-1,Math.round((b.north-lat)/(b.north-b.south)*(size-1))));
      if(!e.texture.image.data[my*size+mx]) return 0;
      const stride=g.userData.stride;
      const col=Math.min(e.data.width-2,Math.floor((lon-b.west)/(b.east-b.west)*(e.data.width-1)));
      const row=Math.min(e.data.height-2,Math.floor((b.north-lat)/(b.north-b.south)*(e.data.height-1)));
      const cx=Math.floor(col/stride),cy=Math.floor(row/stride),triangles=[];
      for(let y=cy-1;y<=cy+1;y++) for(let x=cx-1;x<=cx+1;x++)
        triangles.push(...(g.userData.surfaceBuckets.get(`${x}:${y}`) ?? []));
      const morph=activeCamera ? terrainMorphWeight(activeCamera.position.distanceTo(e.lod.position),g.attributes.lodThreshold.getX(0)) : 0;
      const height=projectedTriangleHeight([px-e.lod.position.x,pz-e.lod.position.z],triangles,id=>{
        const a=g.attributes;
        const x=THREE.MathUtils.lerp(a.position.getX(id),a.parentPosition.getX(id),morph);
        const y=THREE.MathUtils.lerp(a.position.getY(id),a.parentPosition.getY(id),morph);
        const z=THREE.MathUtils.lerp(a.position.getZ(id),a.parentPosition.getZ(id),morph);
        return [x,THREE.MathUtils.lerp(a.contextHeight.getX(id),y,e.reveal.value),z];
      });
      if(height!==undefined) return height;
    }
    const size=contextCoastMask.size;
    const mx=Math.max(0,Math.min(size-1,Math.round((lon-bounds.west)/(bounds.east-bounds.west)*(size-1))));
    const my=Math.max(0,Math.min(size-1,Math.round((bounds.north-lat)/(bounds.north-bounds.south)*(size-1))));
    return contextPixels[my*size+mx] ? contextSurface(lon,lat).height : 0;
  }
  return {
    surfaceHeight,
    setVisible(visible) { group.visible=visible; },
    update(camera, target, now) {
      activeCamera=camera;
      streamProfile.measure('preparation-slice', () => workQueue.pump(3));
      for (const entry of resident.values()) {
        entry.reveal.value = smoothTerrainReveal(now - entry.born);
        entry.lod.update(camera);
      }
      if (now - last < 350) return;
      last = now;
      const coordinate = unprojectLocalMapMetres(
        target.x * 1000,
        -target.z * 1000,
        { lon: 13.5, lat: 41.5 },
      );
      const family = terrainDetailFamily(
        coordinate.lon,
        coordinate.lat,
        camera.position.distanceTo(target),
        manifest.detailAreas ?? [],
      );
      const sorted = manifest.tiles
        .filter((t) =>
          family === 'context'
            ? false
            : family === 'world'
              ? t.kind === 'world-regional'
              : t.kind !== 'world-regional' &&
                (t.detailArea ?? 'italy') === family,
        )
        .map((t) => {
          const [x, z] = project(
            (t.bounds.west + t.bounds.east) / 2,
            (t.bounds.north + t.bounds.south) / 2,
          );
          return {
            t,
            d: t.kind === 'city' ? -1 : Math.hypot(x - target.x, z - target.z),
          };
        })
        .sort((a, b) => a.d - b.d)
        .slice(0, limit);
      wanted = new Set(sorted.map(({ t }) => t.id));
      let evicted = false;
      for (const [id, entry] of resident)
        if (!wanted.has(id)) {
          group.remove(entry.lod);
          inactive.set(id, entry);
          while (inactive.size > 4) {
            const oldest = inactive.keys().next().value;
            dispose(inactive.get(oldest));
            inactive.delete(oldest);
          }
          resident.delete(id);
          evicted = true;
        }
      if (evicted || lastContextLod !== contextLod()) {
        lastContextLod = contextLod();
        queueCover();
      }
      for (const { t } of sorted)
        if (
          pending.size < 3 &&
          !resident.has(t.id) &&
          !pending.has(t.id) &&
          !failed.has(t.id)
        )
          void load(t);
      group.updateMatrixWorld();
      for (const { lod } of resident.values()) lod.update(camera);
    },
    sample(lon, lat) {
      let best = null,
        area = Infinity;
      for (const { data } of resident.values())
        if (
          lon >= data.bounds.west &&
          lon <= data.bounds.east &&
          lat >= data.bounds.south &&
          lat <= data.bounds.north
        ) {
          const a =
            (data.bounds.east - data.bounds.west) *
            (data.bounds.north - data.bounds.south);
          if (a < area) {
            area = a;
            best = data;
          }
        }
      if (best) return sampleTile(best, lon, lat);
      return elevation(lon, lat);
    },
    applyCoverage(otherMaterial) {
      otherMaterial.onBeforeCompile = contextMaterial.onBeforeCompile;
      otherMaterial.needsUpdate = true;
    },
    setPolitical(enabled, lookup) {
      political = enabled;
      colorAt = lookup;
      for (const entry of resident.values()) paint(entry);
    },
    diagnostics() {
      return {
        controlColor: Array.from(
          resident
            .get('local-capua')
            ?.lod.levels[0].object.geometry.attributes.color.array.slice(
              0,
              3,
            ) ?? [],
        ),
        revealParents: [...resident.values()]
          .filter((e) => e.data.kind === 'city')
          .map((e) => ({
            id: e.data.id,
            parentId: e.revealParentId ?? null,
            diagnostic: e.revealDiagnostic ?? null,
          })),
        cached: [...inactive.keys()],
        cacheLimit: 4,
        preparationJobs: workQueue.size,
        limit,
        resident: [...resident.keys()],
        pending: [...pending],
        failed: [...failed],
        lods: [...resident.values()].map(({ data, lod }) => ({
          id: data.id,
          level: lod.getCurrentLevel(),
        })),
        heightBytes: [...resident.values()].reduce(
          (n, { data }) => n + data.elevations.length * 8,
          0,
        ),
        transitions: {
          morphing: 'GPU parent-triangle position and normal interpolation',
          minimumReveal: resident.size
            ? Math.min(...[...resident.values()].map((e) => e.reveal.value))
            : 1,
          revealing: [...resident.values()].filter((e) => e.reveal.value < 1)
            .length,
        },
      };
    },
  };
}
