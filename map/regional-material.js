import * as THREE from 'three';
import {
  climateFamily,
  ecologyGridPoint,
} from '../src/presentation/regional-ecology.ts';

export async function loadRegionalMaterial(origin) {
  const response = await fetch('/data/regional-ecology/manifest.json');
  if (!response.ok) throw Error('Regional ecology manifest unavailable');
  const manifest = await response.json(),
    loader = new THREE.TextureLoader();
  const [surface, classes] = await Promise.all([
    loader.loadAsync(manifest.outputs.surface.url),
    loader.loadAsync(manifest.outputs.climate.url),
  ]);
  surface.colorSpace = THREE.SRGBColorSpace;
  surface.anisotropy = 4;
  const canvas = document.createElement('canvas');
  canvas.width = manifest.width;
  canvas.height = manifest.height;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(classes.image, 0, 0);
  const pixels = ctx.getImageData(0, 0, manifest.width, manifest.height).data;
  const codes = new Uint8Array(manifest.width * manifest.height);
  for (let i = 0; i < codes.length; i++) codes[i] = pixels[i * 4];
  classes.dispose();
  canvas.width = canvas.height = 1;
  function sample(lon, lat) {
    const [x, y] = ecologyGridPoint(manifest, lon, lat),
      code = codes[Math.round(y) * manifest.width + Math.round(x)];
    return {
      code,
      family: climateFamily(code),
      period: '1991-2020',
      historicalReconstruction: false,
    };
  }
  const b = manifest.bounds;
  function decorate(shader, reveal = { value: 1 }) {
    shader.uniforms.ecologicalSurface = { value: surface };
    shader.uniforms.ecologicalBounds = {
      value: new THREE.Vector4(b.west, b.south, b.east, b.north),
    };
    shader.uniforms.ecologicalSize = {
      value: new THREE.Vector2(manifest.width, manifest.height),
    };
    shader.uniforms.ecologicalOrigin = {
      value: new THREE.Vector2(
        (origin.lon * Math.PI) / 180,
        (origin.lat * Math.PI) / 180,
      ),
    };
    shader.uniforms.terrainReveal = reveal;
    shader.vertexShader = shader.vertexShader
      .replace(
        '#include <common>',
        `#include <common>
attribute vec3 parentPosition;
attribute vec3 parentNormal;
attribute float lodThreshold;
attribute float contextHeight;
attribute vec3 contextNormal;
uniform float terrainReveal;
varying vec3 ecologicalWorld;
float regionalMorphWeight(){
  float lodDistance=distance(cameraPosition,(modelMatrix*vec4(0.0,0.0,0.0,1.0)).xyz);
  return smoothstep(lodThreshold*.76,lodThreshold*.92,lodDistance);
}
`,
      )
      .replace(
        '#include <beginnormal_vertex>',
        `#include <beginnormal_vertex>
objectNormal=normalize(mix(contextNormal,mix(normal,parentNormal,regionalMorphWeight()),terrainReveal));
`,
      )
      .replace(
        '#include <begin_vertex>',
        `#include <begin_vertex>
float morph=regionalMorphWeight();
transformed=mix(position,parentPosition,morph);
transformed.y=mix(contextHeight,transformed.y,terrainReveal);
`,
      )
      .replace(
        '#include <project_vertex>',
        `#include <project_vertex>
ecologicalWorld=(modelMatrix*vec4(transformed,1.0)).xyz;
`,
      );
    shader.fragmentShader = shader.fragmentShader
      .replace(
        '#include <common>',
        `#include <common>
uniform sampler2D ecologicalSurface;
uniform vec4 ecologicalBounds;
uniform vec2 ecologicalSize;
uniform vec2 ecologicalOrigin;
varying vec3 ecologicalWorld;
vec2 regionalGeographicDegrees(){
  vec2 en=vec2(ecologicalWorld.x,-ecologicalWorld.z);
  float rho=max(length(en),.000001),arc=rho/6371.0088;
  float latitude=asin(clamp(cos(arc)*sin(ecologicalOrigin.y)+en.y*sin(arc)*cos(ecologicalOrigin.y)/rho,-1.0,1.0));
  float longitude=ecologicalOrigin.x+atan(en.x*sin(arc),rho*cos(ecologicalOrigin.y)*cos(arc)-en.y*sin(ecologicalOrigin.y)*sin(arc));
  return vec2(longitude,latitude)*57.295779513;
}
`,
      )
      .replace(
        '#include <color_fragment>',
        `#include <color_fragment>
vec2 uv=(regionalGeographicDegrees()-ecologicalBounds.xy)/(ecologicalBounds.zw-ecologicalBounds.xy);
uv=(clamp(uv,0.0,1.0)*(ecologicalSize-1.0)+.5)/ecologicalSize;
vec3 sourceColor=texture2D(ecologicalSurface,uv).rgb;
// Display rock on steep/elevated terrain; source geography supplies all lowland color.
float exposed=smoothstep(5.1,11.4,ecologicalWorld.y)*.32;
diffuseColor.rgb*=mix(sourceColor,vec3(.43,.41,.35),exposed);
`,
      );
  }
  return {
    manifest,
    sample,
    decorate,
    textureBytes: (manifest.width * manifest.height * 4 * 4) / 3,
  };
}

export function stationaryTransitionAttributes(geometry, threshold = 1e12) {
  geometry.setAttribute('contextNormal', geometry.attributes.normal.clone());
  geometry.setAttribute('parentPosition', geometry.attributes.position.clone());
  geometry.setAttribute('parentNormal', geometry.attributes.normal.clone());
  geometry.setAttribute(
    'lodThreshold',
    new THREE.Float32BufferAttribute(
      new Float32Array(geometry.attributes.position.count).fill(threshold),
      1,
    ),
  );
  geometry.setAttribute(
    'contextHeight',
    new THREE.Float32BufferAttribute(
      Array.from({ length: geometry.attributes.position.count }, (_, i) =>
        geometry.attributes.position.getY(i),
      ),
      1,
    ),
  );
}
