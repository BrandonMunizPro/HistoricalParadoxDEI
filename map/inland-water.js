import * as THREE from 'three';
import {
  waterPolygon,
  estimateWaterLevel,
  inlandWaterMask,
  subtractInlandWater,
  insideWater,
} from '../src/presentation/inland-water.ts';
import { sampleElevation } from '../src/infrastructure/geographic-dataset.ts';
import { TERRAIN_HEIGHT_SCALE } from '../src/presentation/terrain-presentation.ts';

export async function loadInlandWater(data) {
  const response = await fetch('/data/inland-water/polygons.json');
  if (!response.ok)
    throw Error(
      'Inland-water source catalogue missing; run node scripts/build-inland-water.mjs',
    );
  const source = await response.json();
  const lakes = source.records.map((r) => {
    const polygon = waterPolygon(r.rings),
      estimate = estimateWaterLevel(polygon, data);
    if (!estimate.samples) {
      const shore = r.rings[0]
        .map((p) => sampleElevation(data, ...p))
        .sort((a, b) => a - b);
      estimate.metres = shore[Math.floor(shore.length / 2)];
      estimate.method =
        'shore-median-fallback; insufficient interior source coverage';
    }
    return { ...r, polygon, estimate };
  });
  const polygons = lakes.map((l) => l.polygon);
  return {
    polygons,
    surfaceHeight(lon,lat) {
      const lake=lakes.find(l=>lon>=l.polygon.bounds.west&&lon<=l.polygon.bounds.east&&lat>=l.polygon.bounds.south&&lat<=l.polygon.bounds.north&&insideWater(lon,lat,l.polygon));
      return lake ? lake.estimate.metres/1000*TERRAIN_HEIGHT_SCALE : undefined;
    },
    contains(lon,lat) {
      return polygons.some(p=>lon>=p.bounds.west&&lon<=p.bounds.east&&lat>=p.bounds.south&&lat<=p.bounds.north&&insideWater(lon,lat,p));
    },
    maskLand(pixels, bounds, size) {
      subtractInlandWater(pixels, inlandWaterMask(bounds, size, polygons));
    },
    diagnostics() {
      return {
        renderPolicy:
          'Ocean backdrop writes no depth; inland water and terrain share signed source heights',
        source: source.source,
        islandHoles: source.islandHoles,
        lakes: lakes.map((l) => ({
          id: l.id,
          sourceIndex: l.sourceIndex,
          bounds: l.polygon.bounds,
          level: l.estimate,
          displayHeight: (l.estimate.metres / 1000) * TERRAIN_HEIGHT_SCALE,
        })),
      };
    },
    addToScene(scene, project) {
      const material = new THREE.MeshStandardMaterial({
        color: '#315b6c',
        roughness: 0.95,
        metalness: 0,
      });
      const group = new THREE.Group();
      group.name = 'source-inland-water';
      scene.add(group);
      for (const l of lakes) {
        const path = (ring) =>
          ring.map(([lon, lat]) => {
            const [x, z] = project(lon, lat);
            return new THREE.Vector2(x, -z);
          });
        const shape = new THREE.Shape(path(l.rings[0]));
        for (const ring of l.rings.slice(1))
          shape.holes.push(new THREE.Path(path(ring)));
        const mesh = new THREE.Mesh(new THREE.ShapeGeometry(shape), material);
        mesh.rotation.x = -Math.PI / 2;
        mesh.position.y = (l.estimate.metres / 1000) * TERRAIN_HEIGHT_SCALE;
        mesh.renderOrder = -5;
        mesh.name = l.id;
        group.add(mesh);
      }
      return group;
    },
  };
}
