import { describe, expect, it } from 'vitest';
import { FrameWorkQueue } from '../src/presentation/frame-work-queue.js';
import { advanceCameraMotion } from '../src/presentation/campaign-camera.js';
import {
  terrainTopology,
  terrainTopologySteps,
} from '../src/presentation/terrain-topology.js';
import {
  parentTerrainSamples,
  parentTerrainSamplesSteps,
} from '../src/presentation/terrain-transition.js';

describe('cooperative terrain preparation', () => {
  it('yields preparation across frames while camera integration continues', async () => {
    let clock = 0,
      completed = false,
      position = 0,
      velocity = { x: 0, forward: 0 };
    const queue = new FrameWorkQueue(() => clock);
    const done = queue.run(
      (function* () {
        for (let i = 0; i < 100; i++) {
          clock += 0.5;
          yield;
        }
        completed = true;
        return 'ready';
      })(),
    );
    for (let frame = 0; frame < 10; frame++) {
      const before = clock;
      queue.pump(2);
      expect(clock - before).toBeLessThanOrEqual(2);
      const movement = advanceCameraMotion(
        velocity,
        { x: 1, forward: 0 },
        1 / 60,
        100,
        1,
        false,
      );
      velocity = movement.velocity;
      position += movement.displacement.x;
    }
    expect(position).toBeGreaterThan(0);
    expect(completed).toBe(false);
    while (queue.size) queue.pump(2);
    expect(await done).toBe('ready');
    expect(completed).toBe(true);
  });
  it('serializes activation and recovers from a failed job', async () => {
    let clock = 0;
    const order: string[] = [],
      queue = new FrameWorkQueue(() => clock);
    const first = queue.run(
      (function* () {
        clock++;
        yield;
        order.push('prepared');
        return 1;
      })(),
    );
    const rejected = queue
      .run(
        (function* () {
          yield;
          throw Error('bad tile');
        })(),
      )
      .catch((e: unknown) => e);
    const last = queue.run(
      (function* () {
        yield;
        order.push('activated');
        return 2;
      })(),
    );
    queue.pump(2);
    expect(await first).toBe(1);
    expect(await rejected).toBeInstanceOf(Error);
    expect(await last).toBe(2);
    expect(order).toEqual(['prepared', 'activated']);
    expect(queue.size).toBe(0);
  });
  it('keeps cooperative topology and parent interpolation numerically identical', () => {
    const topology = terrainTopologySteps(17, 2);
    let t = topology.next(),
      yields = 0;
    while (!t.done) {
      yields++;
      t = topology.next();
    }
    expect(yields).toBeGreaterThan(0);
    expect(t.value).toEqual(terrainTopology(17, 2));
    const parent = parentTerrainSamplesSteps(17, 4);
    let p = parent.next();
    while (!p.done) p = parent.next();
    expect(p.value).toEqual(parentTerrainSamples(17, 4));
    expect(p.value).toHaveLength(289);
  });
});
