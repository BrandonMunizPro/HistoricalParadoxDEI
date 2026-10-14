import * as THREE from 'three';
import { terrainAlbedo } from '../src/presentation/terrain-style.ts';

import { terrainTopology } from '../src/presentation/terrain-topology.ts';
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
) {
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
  const packedContext = atob(contextCoastMask.bits),
    contextPixels = new Uint8Array(contextCoastMask.size ** 2);
  for (let i = 0; i < contextPixels.length; i++)
    contextPixels[i] =
      packedContext.charCodeAt(i >> 3) & (1 << (i % 8)) ? 255 : 0;
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
  contextMaterial.onBeforeCompile = (shader) => {
    shader.uniforms.tileCoverage = coverage;
    shader.uniforms.tileCoverageCount = coverageCount;
    shader.uniforms.contextShore = { value: contextShore };
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
        '#include <common>\nvarying vec2 contextCoordinate; uniform vec4 tileCoverage[12]; uniform int tileCoverageCount; uniform sampler2D contextShore;',
      )
      .replace(
        '#include <clipping_planes_fragment>',
        '#include <clipping_planes_fragment>\nif(texture2D(contextShore,vec2(contextCoordinate.x,1.0-contextCoordinate.y)).r<0.5)discard;for(int i=0;i<12;i++){if(i>=tileCoverageCount)break;vec4 b=tileCoverage[i];if(contextCoordinate.x>b.x&&contextCoordinate.x<b.z&&contextCoordinate.y>b.y&&contextCoordinate.y<b.w)discard;}',
      );
  };
  contextMaterial.needsUpdate = true;
  const bounds = manifest.contextBounds;
  function cover() {
    let i = 0,
      j = 0;
    for (const entry of resident.values()) {
      const t = entry.data,
        b = t.bounds;
      coverage.value[i++].set(
        (b.west - bounds.west) / (bounds.east - bounds.west),
        (b.south - bounds.south) / (bounds.north - bounds.south),
        (b.east - bounds.west) / (bounds.east - bounds.west),
        (b.north - bounds.south) / (bounds.north - bounds.south),
      );
      if (t.kind === 'city')
        cityCoverage.value[j++].set(b.west, b.south, b.east, b.north);
      else blendContextEdge(entry);
    }
    coverageCount.value = i;
    cityCount.value = j;
  }
  function blendContextEdge(entry) {
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
    for (const { object } of entry.lod.levels) {
      const g = object.geometry,
        uv = g.attributes.coastUv,
        p = g.attributes.position;
      for (let i = 0; i < p.count; i++) {
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
        const surface = contextSurface(b.west + x, b.north - y),
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
    paint(entry);
  }
  function geometry(t, stride) {
    const { vertices, indices } = terrainTopology(t.width, stride),
      p = [],
      colors = [],
      uv = [],
      normals = [],
      coastUv = [];
    for (const [c, r] of vertices) {
      const lon =
          t.bounds.west + (c / (t.width - 1)) * (t.bounds.east - t.bounds.west),
        lat =
          t.bounds.north -
          (r / (t.height - 1)) * (t.bounds.north - t.bounds.south),
        [x, z] = project(lon, lat);
      const e = sampleTile(t, lon, lat);
      p.push(x, Math.max(0.002, (e / 1000) * 3), z);
      uv.push(x / 250, -z / 250);
      coastUv.push(c / (t.width - 1), r / (t.height - 1));
      const color = new THREE.Color().setRGB(
        ...terrainAlbedo(e),
        THREE.SRGBColorSpace,
      );
      colors.push(color.r, color.g, color.b);
      // Shared geographic derivative avoids normal seams; coarse context derivative is deliberate.
      const dx =
        ((elevation(lon + 0.006, lat) - elevation(lon - 0.006, lat)) / 1000) *
        3;
      const dz =
        ((elevation(lon, lat - 0.006) - elevation(lon, lat + 0.006)) / 1000) *
        3;
      const epsilon = Math.min(
        0.003,
        ((t.bounds.east - t.bounds.west) / (t.width - 1)) * 0.5,
        ((t.bounds.north - t.bounds.south) / (t.height - 1)) * 0.5,
      );
      const fineDx =
        ((sampleTile(t, lon + epsilon, lat) -
          sampleTile(t, lon - epsilon, lat)) /
          1000) *
        3;
      const fineDz =
        ((sampleTile(t, lon, lat - epsilon) -
          sampleTile(t, lon, lat + epsilon)) /
          1000) *
        3;
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
      const response = await fetch(descriptor.url);
      if (!response.ok) throw Error(`Terrain ${response.status}`);
      const data = await response.json();
      validateTerrainTile(data);
      if (!wanted.has(descriptor.id)) return;
      const packed = atob(data.coastMask.bits),
        size = data.coastMask.size,
        mask = new Uint8Array(size * size);
      for (let i = 0; i < mask.length; i++)
        mask[i] = packed.charCodeAt(i >> 3) & (1 << (i % 8)) ? 255 : 0;
      const texture = new THREE.DataTexture(mask, size, size, THREE.RedFormat);
      texture.minFilter = texture.magFilter = THREE.LinearFilter;
      texture.needsUpdate = true;
      const tileMaterial = material.clone();
      tileMaterial.customProgramCacheKey = () =>
        `coast-${data.kind === 'city' ? 'city' : 'regional'}`;
      tileMaterial.onBeforeCompile = (shader) => {
        shader.uniforms.shoreMask = { value: texture };
        shader.uniforms.cityCoverage = cityCoverage;
        shader.uniforms.cityCount = cityCount;
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
            '#include <common>\nvarying vec2 shoreUv; uniform sampler2D shoreMask; uniform vec4 cityCoverage[12];uniform int cityCount;uniform vec4 tileBounds;',
          )
          .replace(
            '#include <clipping_planes_fragment>',
            '#include <clipping_planes_fragment>\nif(texture2D(shoreMask,shoreUv).r<0.5)discard;' +
              (data.kind === 'city'
                ? ''
                : '\nvec2 geo=mix(tileBounds.xw,tileBounds.zy,shoreUv);for(int i=0;i<12;i++){if(i>=cityCount)break;vec4 b=cityCoverage[i];if(geo.x>b.x&&geo.x<b.z&&geo.y>b.y&&geo.y<b.w)discard;}'),
          );
      };
      const lod = new THREE.LOD();
      for (const [stride, distance] of [
        [1, 0],
        [2, 260],
        [4, 550],
      ]) {
        const mesh = new THREE.Mesh(geometry(data, stride), tileMaterial);
        mesh.receiveShadow = true;
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
      group.add(lod);
      const entry = { data, lod, texture, material: tileMaterial };
      resident.set(data.id, entry);
      paint(entry);
      cover();
    } catch (error) {
      failed.add(descriptor.id);
      window.__terrainError = String(error);
    } finally {
      pending.delete(descriptor.id);
    }
  }
  return {
    update(camera, target, now) {
      if (now - last < 350) return;
      last = now;
      const sorted = manifest.tiles
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
          for (const { object } of entry.lod.levels) object.geometry.dispose();
          entry.texture.dispose();
          entry.material.dispose();
          resident.delete(id);
          evicted = true;
        }
      if (evicted || lastContextLod !== contextLod()) {
        lastContextLod = contextLod();
        cover();
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
      for (const { data } of resident.values())
        if (
          lon >= data.bounds.west &&
          lon <= data.bounds.east &&
          lat >= data.bounds.south &&
          lat <= data.bounds.north
        )
          return sampleTile(data, lon, lat);
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
      };
    },
  };
}
