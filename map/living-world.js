import * as THREE from 'three';
import { projectLocalMapMetres, unprojectLocalMapMetres } from '../src/infrastructure/world-geography.ts';

// Generated once, with transparent gaps. No downloads or per-frame uploads.
function cloudTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  for (const [x,y,radius] of [[48,70,33],[78,60,40],[112,53,42],[145,64,38],[180,59,35],[211,74,25],[124,81,30]]) {
    const gradient = ctx.createRadialGradient(x,y,0,x,y,radius);
    gradient.addColorStop(0,'rgba(249,247,229,.65)');
    gradient.addColorStop(0.42,'rgba(240,244,232,.38)');
    gradient.addColorStop(1,'rgba(235,242,232,0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(x-radius,y-radius,radius*2,radius*2);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export function createLivingWorld(scene, origin, surfaceHeight, suitableHabitat, atmosphere) {
  const count = 12, positions = new Float32Array(count * 4 * 3);
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3).setUsage(THREE.DynamicDrawUsage));
  const material = new THREE.LineBasicMaterial({ color: '#f0e6cb', transparent: true, opacity: 0.9, depthWrite: false });
  const birds = new THREE.LineSegments(geometry, material);
  birds.frustumCulled = false;
  birds.visible = false;
  scene.add(birds);
  const projected = (lon,lat) => {
    const p = projectLocalMapMetres({lon,lat},origin);
    return new THREE.Vector3(p.east/1000,0,-p.north/1000);
  };
  const flockAnchors = [[12.5,41.9],[23,38],[9,40.5]].map(([lon,lat]) => ({
    point:projected(lon,lat), height:surfaceHeight(lon,lat), suitable:suitableHabitat(lon,lat),
  }));
  const cloudMaterial = new THREE.SpriteMaterial({map:cloudTexture(),transparent:true,opacity:0.42,depthWrite:false});
  const clouds = [[6,43,360],[17,42,300],[26,35,330],[2,34,320],[34,41,300],[30,29,280],[19,33,300],[38,36,280]].map(([lon,lat,width],i) => {
    const sprite = new THREE.Sprite(cloudMaterial), anchor = projected(lon,lat);
    sprite.position.copy(anchor);
    sprite.position.y = 18+i*2;
    sprite.scale.set(width,width*0.5,1);
    scene.add(sprite);
    return {sprite,anchor,phase:i*1.9};
  });
  const toggle = document.querySelector('#living-world');
  const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
  let enabled = toggle.checked && !preference.matches, time = 0, lastBirdUpdate = -Infinity;
  let localAnchor = null, visibleBirds = 0, visibleClouds = 0, birdSpanPixels = 0;
  toggle.checked = enabled;
  toggle.addEventListener('change', () => { enabled = toggle.checked; });
  preference.addEventListener('change', e => { enabled = !e.matches; toggle.checked = enabled; });
  const inView = (point,camera) => {
    const p = point.clone().project(camera);
    return Math.abs(p.x)<0.96 && Math.abs(p.y)<0.75 && p.z>-1 && p.z<1;
  };
  return {
    update(camera, target, dt, distance) {
      const running = enabled && !document.hidden;
      if (running)
        time += Math.min(0.05, dt);
      atmosphere.time.value = time;
      // Retain atmosphere at the Mediterranean opening scale.
      atmosphere.strength.value = running ? THREE.MathUtils.smoothstep(distance,20,120) : 0;
      cloudMaterial.opacity = running ? 0.42*THREE.MathUtils.smoothstep(distance,250,1200) : 0;
      visibleClouds = 0;
      for (const {sprite,anchor,phase} of clouds) {
        sprite.visible = cloudMaterial.opacity > 0;
        sprite.position.x = anchor.x+Math.sin(time*0.006+phase)*80;
        sprite.position.z = anchor.z+Math.cos(time*0.004+phase)*35;
        if (sprite.visible && inView(sprite.position,camera)) visibleClouds++;
      }
      if (!running || distance >= 9000) {
        birds.visible = false;
        visibleBirds = 0;
        return time;
      }
      if (time - lastBirdUpdate < 1 / 30) return time;
      lastBirdUpdate = time;
      const local = distance < 40;
      if (local && (!localAnchor || target.distanceTo(localAnchor.point)>2)) {
        const g = unprojectLocalMapMetres(target.x * 1000, -target.z * 1000, origin);
        localAnchor = {point:target.clone(),height:surfaceHeight(g.lon,g.lat),suitable:suitableHabitat(g.lon,g.lat)};
      }
      // Tiny map accents: bound the screen footprint at strategic zoom.
      const kmPerPixel = 2*distance*Math.tan(THREE.MathUtils.degToRad(camera.fov/2))/innerHeight;
      const wing = Math.max(0.0025,kmPerPixel*3.2);
      const spread = Math.max(0.012,kmPerPixel*8);
      birdSpanPixels = wing*2/kmPerPixel;
      visibleBirds = 0;
      for (let i = 0; i < count; i++) {
        const flock = Math.floor(i / 4), rank = i % 4, angle = time * 0.055 + flock * 2.1;
        const anchor = local ? localAnchor : flockAnchors[flock];
        const radius = local ? 0.25 : 55;
        const x = anchor.point.x+Math.cos(angle)*radius+rank*spread;
        const z = anchor.point.z+Math.sin(angle)*radius*0.7+(rank%2)*spread;
        const y = anchor.height+(local?0.075:12)+flock*0.009;
        const visible = anchor.suitable && inView(new THREE.Vector3(x,y,z),camera);
        if (visible) visibleBirds++;
        const flap = Math.sin(time*4.2+i)*wing*0.5;
        positions.set(visible ? [x-wing,y+flap,z+wing*.5,x,y,z,x,y,z,x+wing,y+flap,z+wing*.5] : Array(12).fill(0), i*12);
      }
      birds.visible = visibleBirds > 0;
      geometry.attributes.position.needsUpdate = true;
      return time;
    },
    diagnostics: () => ({ enabled, reducedMotion:preference.matches, birdsVisible:birds.visible, birdCount:visibleBirds, birdSpanPixels, cloudsVisible:visibleClouds, cloudOpacity:cloudMaterial.opacity, cloudShadowStrength:atmosphere.strength.value*0.10, time }),
  };
}
