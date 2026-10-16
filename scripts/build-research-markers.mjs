import { readFile, writeFile, readdir, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { researchLocations } from '../dist/presentation/research-markers.js';
const records = [];
const sources = [];
const batches = (await readdir('docs/research'))
  .filter(name => /^r16-settlement-roster\.batch\d+\.json$/.test(name))
  .sort((a,b) => Number(a.match(/batch(\d+)/)[1])-Number(b.match(/batch(\d+)/)[1]));
if (!batches.length) throw Error('No research batches found');
for (const name of batches) {
  const path = `docs/research/${name}`;
  const bytes = await readFile(path);
  sources.push({
    path,
    sha256: createHash('sha256').update(bytes).digest('hex'),
  });
  const batch = JSON.parse(bytes.toString('utf8'));
  for (const r of batch.records)
    records.push({
      proposedId: r.proposedId,
      historicalName: r.historicalName,
      coordinates: r.coordinates,
      locationConfidence: r.locationConfidence,
      presence278Bce: r.presence278Bce,
      identityConfidence: r.identityConfidence,
      alternateNames: r.alternateNames,
      sources: r.sources,
      pleiadesId: r.pleiadesId,
      sourceFile: path,
    });
}
await writeFile(
  'public/data/research-locations.json',
  JSON.stringify(
    {
      status: 'Unapproved research references; never simulation state',
      source:
        `R-16 ${batches.length} research batches; coordinates not independently verified`,
      sources,
      records,
    },
    null,
    2,
  ) + '\n',
);
const approved = JSON.parse(await readFile('public/data/approved-settlements.json', 'utf8')).records;
const promoted = new Set(approved.map(r=>r.provenance.candidateId));
const audit = researchLocations(records.filter(r=>!promoted.has(r.proposedId)));
await mkdir('docs/living-world', {recursive:true});
await writeFile('docs/living-world/settlement-audit.json', JSON.stringify({
  sourceRecords:records.length, batches:batches.length,
  sourceCoordinateRecords:records.filter(r=>Number.isFinite(r.coordinates?.lon)&&Number.isFinite(r.coordinates?.lat)).length,
  uniqueResearchHandles:new Set(records.map(r=>r.proposedId)).size,
  approvedRegistry:approved.length, suppressedPromoted:records.filter(r=>promoted.has(r.proposedId)).length,
  displayableResearchLocations:audit.locations.length,
  disputed:audit.locations.filter(r=>r.uncertainty==='disputed').length,
  excluded:audit.excluded, duplicates:audit.duplicates, possibleDuplicates:audit.possibleDuplicates,
  sources,
}, null, 2)+'\n');
