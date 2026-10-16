import process from 'node:process';
import { readFile, mkdir, writeFile, rename } from 'node:fs/promises';
import {
  promoteSettlements,
  settlementResearchDigest,
} from '../dist/infrastructure/settlement-promotion.js';
const batches = [];
for (let i = 1; i <= 9; i++) {
  const path = `docs/research/r16-settlement-roster.batch${i}.json`,
    data = JSON.parse(await readFile(path, 'utf8'));
  batches.push({
    path,
    sha256: settlementResearchDigest(data),
    records: data.records,
  });
}
const candidates = batches.flatMap((b) => b.records),
  existing = JSON.parse(
    await readFile('public/data/settlement-atlas.json', 'utf8'),
  ).records;
const reviews = JSON.parse(
  await readFile('data/settlement-integration/reviews.json', 'utf8'),
).reviews;
let previous = [];
try {
  previous = JSON.parse(
    await readFile('public/data/approved-settlements.json', 'utf8'),
  ).records;
} catch (error) {
  if (error.code !== 'ENOENT') throw error;
}
const result = promoteSettlements(candidates, reviews, existing, previous),
  ids = new Set(
    reviews.filter((r) => r.decision === 'approved').map((r) => r.candidateId),
  );
const pilotKeys = [
  'tarquinii',
  'caere',
  'arretium',
  'populonia',
  'volaterrae',
  'iguvium',
  'ancona',
  'tusculum',
  'velitrae',
  'alba-fucens',
  'akragas',
  'catana',
];
const audit = {
  schemaVersion: 1,
  checkpoint: 'a00ac258e815c265c38c5d2102e2aa4902e6ca76',
  researchCandidates: candidates.length,
  researchStatistics: {
    presenceCounts: Object.fromEntries(
      [...new Set(candidates.map((c) => c.presence278Bce))].map((k) => [
        k,
        candidates.filter((c) => c.presence278Bce === k).length,
      ]),
    ),
    readinessCounts: Object.fromEntries(
      [...new Set(candidates.map((c) => c.integrationReadiness))].map((k) => [
        k,
        candidates.filter((c) => c.integrationReadiness === k).length,
      ]),
    ),
    unlocated: candidates.filter(
      (c) => !c.coordinates || c.presence278Bce === 'unlocated',
    ).length,
  },
  candidateStatuses: candidates.map((c) => ({
    candidateId: c.proposedId,
    candidateSha256: settlementResearchDigest(c),
    status: result.approved.some(
      (p) => p.provenance.candidateId === c.proposedId,
    )
      ? 'published-approved'
      : 'not-approved',
  })),
  existingActive: existing.filter((r) =>
    ['existing', 'expansion'].includes(r.selection),
  ).length,
  existingAtlas: existing.length,
  batches: batches.map((b) => ({
    path: b.path,
    sha256: b.sha256,
    count: b.records.length,
  })),
  approved: result.approved.map((r) => r.atlas.key),
  issues: result.issues,
  pilot: candidates
    .filter((c) => pilotKeys.includes(c.key))
    .map((c) => ({
      candidateId: c.proposedId,
      historicalName: c.historicalName,
      coordinates: c.coordinates,
      candidateSha256: settlementResearchDigest(c),
      researchReadiness: c.integrationReadiness,
      status: ids.has(c.proposedId) ? 'review-supplied' : 'blocked',
      blockers: ids.has(c.proposedId)
        ? []
        : [
            'No independent identity/location/278 BCE verification packet',
            'No explicit promotion approval; research readiness is not approval',
          ],
      researchSources: c.sources,
      politicalControl: 'No ownership inferred',
    })),
};
await mkdir('docs/vs6', { recursive: true });
await writeFile(
  'docs/vs6/settlement-audit.json',
  JSON.stringify(audit, null, 2) + '\n',
);
// No partial publication: failed reviews leave the last published file untouched.
if (result.issues.length) {
  process.stderr.write(JSON.stringify(result.issues, null, 2) + '\n');
  process.exitCode = 1;
} else {
  await writeFile(
    'public/data/approved-settlements.json.tmp',
    JSON.stringify(
      {
        schemaVersion: 1,
        campaignYearBce: 278,
        policy:
          'Only explicitly approved independently reviewed records; initial control remains unknown',
        records: result.approved,
      },
      null,
      2,
    ) + '\n',
  );
  await rename(
    'public/data/approved-settlements.json.tmp',
    'public/data/approved-settlements.json',
  );
  process.stdout.write(
    JSON.stringify({
      candidates: candidates.length,
      pilot: audit.pilot.length,
      approved: result.approved.length,
      blocked: audit.pilot.filter((p) => p.status === 'blocked').length,
    }) + '\n',
  );
}
