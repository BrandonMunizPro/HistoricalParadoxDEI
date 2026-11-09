import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { PNG } from 'pngjs';
import { execFileSync } from 'node:child_process';

const root = fileURLToPath(new URL('../../', import.meta.url));
const evidence = resolve(root, 'godot-prototype/evidence/neapolis-composition');
const read = (path) => JSON.parse(readFileSync(resolve(evidence, path), 'utf8'));
const before = read('before/views.json').views;
const after = read('accepted/views.json').views;
if (before.length !== 6 || after.length !== 6) throw new Error('Incomplete captures');
const rows = after.map((view) => {
  const original = before.find((item) => item.name === view.name);
  if (JSON.stringify(view.camera) !== JSON.stringify(original.camera)) {
    throw new Error(`Camera mismatch: ${view.name}`);
  }
  const a = PNG.sync.read(readFileSync(resolve(evidence, `before/${view.name}.png`)));
  const b = PNG.sync.read(readFileSync(resolve(evidence, `accepted/${view.name}.png`)));
  if (a.width !== b.width || a.height !== b.height) throw new Error('Resolution mismatch');
  let changed = 0;
  let maxChannelDifference = 0;
  for (let i = 0; i < a.data.length; i += 4) {
    let delta = 0;
    for (let channel = 0; channel < 3; channel++) {
      delta = Math.max(delta, Math.abs(a.data[i + channel] - b.data[i + channel]));
    }
    if (delta > 0) changed++;
    maxChannelDifference = Math.max(maxChannelDifference, delta);
  }
  return {
    name: view.name,
    exactCameraMatch: true,
    beforeGpuMs: original.gpu.meanMs,
    afterGpuMs: view.gpu.meanMs,
    gpuChangePercent: (view.gpu.meanMs / original.gpu.meanMs - 1) * 100,
    beforeSceneDrawCalls: original.drawCalls.meanMs,
    afterSceneDrawCalls: view.drawCalls.meanMs,
    beforeSettlementTriangles: original.geometry.instancedTriangles ?? null,
    afterSettlementTriangles: view.geometry.instancedTriangles ?? null,
    construction: view.geometry.compositionVersion ? view.geometry : null,
    changedPixels: changed,
    changedPixelPercent: changed / (a.width * a.height) * 100,
    maxChannelDifference,
    exactPixelMatch: changed === 0,
  };
});
const protectedPaths = [
  'public/data', 'research', 'godot-prototype/data',
  'godot-prototype/world.gd', 'godot-prototype/northern_italy_world.gd',
  'godot-prototype/regional_scenery.gd', 'godot-prototype/ocean',
  'godot-prototype/navigation.gd', 'godot-prototype/roma_settlement.gd',
  'godot-prototype/inland_water.gdshader',
];
execFileSync('git', ['diff', '--exit-code', 'HEAD', '--', ...protectedPaths], { cwd: root });
const report = {
  baselineCommit: execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim(),
  method: '180 uncapped submitted intervals per exact recorded camera; GPU timings are diagnostic, not sustained gameplay FPS. Draw-call fields in capture stats use the generic meanMs key but contain counts.',
  protectedTrackedPathsUnchanged: protectedPaths,
  views: rows,
};
writeFileSync(resolve(evidence, 'comparison.json'), `${JSON.stringify(report, null, 2)}\n`);
console.table(rows.map((row) => ({
  view: row.name,
  beforeGpuMs: row.beforeGpuMs.toFixed(2),
  afterGpuMs: row.afterGpuMs.toFixed(2),
  beforeDraws: row.beforeSceneDrawCalls,
  afterDraws: row.afterSceneDrawCalls,
  changedPixels: row.changedPixels,
})));
