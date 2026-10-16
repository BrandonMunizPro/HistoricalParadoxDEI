import process from 'node:process';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import {
  promoteSettlements,
  settlementResearchDigest,
} from '../dist/infrastructure/settlement-promotion.js';
import { settlementAtlasIdentity } from '../dist/infrastructure/settlement-atlas.js';
const out = 'docs/vs6-1/pilot-review';
const read = async (path) => JSON.parse(await readFile(path, 'utf8'));
const protectedPaths = [
  'docs/vs6/verification/pilot-verification.json',
  'docs/vs6/verification/pilot-verification.md',
  'docs/research/r16-settlement-roster.batch1.json',
  'data/settlement-integration/reviews.json',
  'public/data/approved-settlements.json',
  'public/data/settlement-atlas.json',
];
const hash = async (path) =>
  createHash('sha256')
    .update(await readFile(path))
    .digest('hex');
const before = await Promise.all(protectedPaths.map(hash));
const packet = await read(protectedPaths[0]),
  batch = await read(protectedPaths[2]),
  active = await read(protectedPaths[3]),
  published = await read(protectedPaths[4]),
  atlas = await read(protectedPaths[5]),
  audit = await read('docs/vs6/settlement-audit.json');
assert.equal(packet.status, 'EVIDENCE_ONLY_NOT_APPROVAL');
assert.equal(packet.candidates.length, 12);
assert.equal(new Set(packet.candidates.map((c) => c.candidateId)).size, 12);
const reviews = [],
  checks = [];
for (const c of packet.candidates) {
  const source = batch.records.find((r) => r.proposedId === c.candidateId);
  assert.ok(source, c.candidateId);
  const digest = settlementResearchDigest(source);
  assert.equal(digest, c.candidateSha256);
  assert.equal(
    audit.candidateStatuses.find((r) => r.candidateId === c.candidateId)
      .candidateSha256,
    digest,
  );
  assert.deepEqual(
    settlementAtlasIdentity(c.pleiadesId),
    c.derivedCanonicalIds,
  );
  assert.deepEqual(c.definition.coordinates, c.reviewedCoordinates);
  assert.equal(
    c.definition.coordinateEvidence.source,
    `https://pleiades.stoa.org/places/${c.pleiadesId}`,
  );
  for (const key of ['decision', 'reviewer', 'reviewedOn', 'approvalReference'])
    assert.equal(c[key], undefined);
  reviews.push({
    candidateId: c.candidateId,
    candidateSha256: digest,
    decision: 'blocked',
    reviewer: '',
    reviewedOn: '',
    approvalReference: '',
    pleiadesId: c.pleiadesId,
    verification: c.verification,
    occupation: c.occupation,
    definition: c.definition,
  });
  checks.push({
    candidateId: c.candidateId,
    hashMatchesCurrentAndAudit: true,
    canonicalIdsMatch: true,
    reviewedCoordinates: c.reviewedCoordinates,
    coordinateSource: c.definition.coordinateEvidence,
    occupationIntervalContains278:
      c.occupation.fromBce >= 278 &&
      c.occupation.toBce <= 278 &&
      c.occupation.toBce >= 0,
    topostext: c.topostext.url,
    ownership:
      'Unknown: initialControl stays null; political prose is not ownership',
    caveats: c.caveats,
  });
}
// Ephemeral positive-path schema probes only. No approval or promoted definition
// from this process is written to an authoritative file or returned to gameplay.
const probes = reviews.map((r) => ({
  ...r,
  decision: 'approved',
  reviewer: 'SCHEMA PROBE ONLY - NOT AN APPROVER',
  reviewedOn: '2026-10-15',
  approvalReference: 'urn:validation-only:no-user-approval',
}));
const structural = promoteSettlements(
  batch.records,
  probes,
  atlas.records,
  published.records,
);
assert.deepEqual(structural.issues, []);
assert.equal(structural.approved.length, 12 + published.records.length);
for (const p of structural.approved) assert.equal(p.initialControl, null);
const blocked = promoteSettlements(
  batch.records,
  reviews,
  atlas.records,
  published.records,
);
assert.equal(blocked.approved.length, 0);
assert.equal(blocked.issues.filter((i) => i.code === 'unapproved').length, 12);
const stale = globalThis.structuredClone(probes);
stale[0].candidateSha256 = '0'.repeat(64);
assert.ok(
  promoteSettlements(
    batch.records,
    stale,
    atlas.records,
    published.records,
  ).issues.some((i) => i.code === 'stale-review'),
);
const chronology = globalThis.structuredClone(probes);
chronology[0].occupation.toBce = 300;
assert.ok(
  promoteSettlements(
    batch.records,
    chronology,
    atlas.records,
    published.records,
  ).issues.some((i) => i.code === 'chronology'),
);
const duplicate = globalThis.structuredClone(probes);
duplicate[1].pleiadesId = duplicate[0].pleiadesId;
duplicate[1].verification.identity.sourceUrl =
  duplicate[0].verification.identity.sourceUrl;
assert.ok(
  promoteSettlements(
    batch.records,
    duplicate,
    atlas.records,
    published.records,
  ).issues.some((i) => i.code === 'duplicate-identity'),
);
assert.deepEqual(await Promise.all(protectedPaths.map(hash)), before);
await mkdir(out, { recursive: true });
await writeFile(
  `${out}/pending-reviews.json`,
  JSON.stringify(
    {
      schemaVersion: 1,
      status: 'AWAITING_EXPLICIT_USER_APPROVAL',
      evidencePacketSha256: before[0],
      notice:
        'Non-active SettlementReview drafts. blocked is a safety hold, not rejection. Blank approval provenance must be supplied only after explicit user approval. This file is not consumed by the importer.',
      reviews,
    },
    null,
    2,
  ) + '\n',
);
await writeFile(
  `${out}/validation.json`,
  JSON.stringify(
    {
      status: 'Prepared, not approved or promoted',
      candidateCount: 12,
      structuralIssues: structural.issues,
      pendingGuardIssues: blocked.issues,
      negativeGuards: [
        'stale hash rejected',
        'duplicate canonical identity rejected',
        'chronology outside 278 BCE rejected',
        'unknown initial ownership retained',
      ],
      checks,
      protectedFiles: protectedPaths.map((path, i) => ({
        path,
        sha256: before[i],
        unchanged: true,
      })),
      activeReviewCount: active.reviews.length,
      publishedCount: published.records.length,
      limits: [
        'Pleiades live JSON unavailable in this session; packet-reported representative points retained with provenance',
        'Broad period attestation supports but does not alone establish exact-year continuous occupation',
        'Political prose is not approved controller state',
      ],
    },
    null,
    2,
  ) + '\n',
);
process.stdout.write(
  JSON.stringify({
    candidates: 12,
    structuralIssues: structural.issues,
    unapprovedGuards: 12,
    activeReviews: active.reviews.length,
    published: published.records.length,
    protectedFilesUnchanged: true,
  }) + '\n',
);
