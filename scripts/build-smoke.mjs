import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
// Compiled-runtime smoke: imports the built entry point (dist), never TS src.
import { deriveAuthoredCanonicalId } from '../dist/domain/identity/index.js';
import {
  checkpointSlotId,
  createScenarioDescriptor,
} from '../dist/domain/persistence/index.js';
import { simTime, simTimeScalar, workIdentifier, WorkClassRank } from '../dist/domain/time/index.js';
import { createSqlitePersistence } from '../dist/persistence/index.js';

const dir = mkdtempSync(join(tmpdir(), 'histgame-build-smoke-'));
let close = () => {};
try {
  const composed = createSqlitePersistence({
    databasePath: join(dir, 'live', 'campaign.db'),
    slotsDirectory: join(dir, 'slots'),
  });
  close = composed.close;
  const descriptor = createScenarioDescriptor({
    scenarioId: deriveAuthoredCanonicalId({
      sourceNamespace: 'build-smoke',
      sourceKey: 'campaign',
    }),
    name: 'build-smoke',
    unitsPerDay: 24,
    epochSimTime: simTime(0),
    epochDayNumber: 0,
    era: {
      name: 'Standard',
      yearNumberDirection: 'ascending',
      firstYearNumber: 1,
      firstYearStartDayNumber: 0,
      monthSequence: [
        { id: 'm-01', days: 30 },
        { id: 'm-02', days: 31 },
      ],
    },
  });
  composed.campaign.initializeScenario(descriptor);
  composed.campaign.runInTransaction(() => {
    composed.campaign.pendingWork.writePendingWork([
      {
        workIdentifier: workIdentifier('smoke-work'),
        classRank: WorkClassRank.world,
        dueSimTime: simTime(720),
        workKind: 'smoke',
        payload: { step: 1 },
      },
    ]);
    composed.campaign.world.writeCurrentSimTime(simTime(720));
  });
  const slot = checkpointSlotId('smoke');
  const saved = composed.checkpoints.save(slot, 'manual');
  if (!saved.ok || simTimeScalar(saved.savedAtSimTime) !== 720) {
    throw new Error('Compiled persistence save did not report the mirrored SimTime');
  }
  const loaded = composed.checkpoints.load(slot);
  if (loaded.pendingWork.length !== 1 || simTimeScalar(loaded.savedAtSimTime) !== 720) {
    throw new Error('Compiled persistence load did not reconstruct the checkpoint');
  }
} finally {
  close();
  rmSync(dir, { recursive: true, force: true });
}
