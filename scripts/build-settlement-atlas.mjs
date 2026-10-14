import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import process from 'node:process';
import { TextDecoder } from 'node:util';
import {
  candidates,
  additionalEvidence,
  economicInterpretations,
} from '../data/geography/italy-candidates.mjs';
import {
  settlementAtlasIdentity,
  validateSettlementAtlas,
} from '../dist/infrastructure/settlement-atlas.js';

const cache = 'data/geography/source-cache';
await mkdir(cache, { recursive: true });
await mkdir('public/data', { recursive: true });
let oldManifest = { sources: [] };
try {
  oldManifest = JSON.parse(
    await readFile('data/geography/atlas-manifest.json', 'utf8'),
  );
} catch (error) {
  if (error.code !== 'ENOENT') throw error;
}
const expected = new Map(
  oldManifest.sources.map((source) => [source.url, source.sha256]),
);
const sources = [],
  records = [];
const risDiscovery = JSON.parse(
  await readFile('data/geography/ris-discovery.json', 'utf8'),
);
const risReferences = new Map(
  risDiscovery.references.map((reference) => [reference.key, reference.url]),
);
for (const [
  key,
  pid,
  historicalName,
  tier,
  category,
  selection,
  presence,
  fromBce,
  toBce,
  earliest,
  culture,
  features,
  importance,
] of candidates) {
  const url = `https://pleiades.stoa.org/places/${pid}/json`;
  let bytes;
  try {
    bytes = await readFile(`${cache}/pleiades-${pid}.json`);
  } catch {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`${response.status}: ${url}`);
    bytes = new Uint8Array(await response.arrayBuffer());
    await writeFile(`${cache}/pleiades-${pid}.json`, bytes);
  }
  const sha256 = createHash('sha256').update(bytes).digest('hex');
  if (expected.has(url) && expected.get(url) !== sha256)
    throw new Error(`Atlas source changed: ${url}`);
  sources.push({ url, sha256 });
  const place = JSON.parse(new TextDecoder().decode(bytes));
  const nameToken = key === 'diana-nemi' ? 'diana' : key;
  if (!place.title.toLowerCase().includes(nameToken))
    throw new Error(
      `Atlas identity mismatch: ${key} resolves to ${place.title}`,
    );
  const coordinates =
    Array.isArray(place.reprPoint) && place.reprPoint.length === 2
      ? { lon: place.reprPoint[0], lat: place.reprPoint[1] }
      : null;
  if (
    coordinates &&
    (coordinates.lon < 10 ||
      coordinates.lon > 19 ||
      coordinates.lat < 37 ||
      coordinates.lat > 44)
  )
    throw new Error(
      `Candidate outside Italy: ${key} resolves to ${place.title}`,
    );
  const source = `https://pleiades.stoa.org/places/${pid}`;
  const politicalClaim = [
    'roma',
    'fregellae',
    'minturnae',
    'venusia',
    'norba',
    'setia',
    'tarracina',
  ].includes(key)
    ? key === 'roma'
      ? 'Roman Republic civic center'
      : 'Roman/Latin colonial relationship attested before campaign; legal status is not a territorial control polygon'
    : null;
  records.push({
    ...settlementAtlasIdentity(pid),
    key,
    historicalName,
    alternateNames: [
      ...new Set([
        place.title,
        ...(place.names ?? []).map((name) => name.title).filter(Boolean),
      ]),
    ],
    coordinates,
    coordinateEvidence: {
      source,
      precision: coordinates
        ? 'Pleiades representative point; digit count does not imply archaeological accuracy'
        : 'Unlocated in gazetteer',
      accuracyMetres: null,
    },
    category,
    suggestedTier: tier,
    earliestEvidence: {
      fromBce,
      toBce,
      description: earliest,
      source: additionalEvidence[key]?.[0] ?? source,
      confidence: fromBce === null ? 'low' : 'medium',
      dateMeaning:
        'Occupation, attestation and colonial refoundation must be distinguished; see description',
    },
    presence278Bce: presence,
    evidence: earliest,
    confidence:
      presence === 'attested'
        ? 'high'
        : presence === 'probable'
          ? 'medium'
          : 'low',
    culturalContext: culture,
    politicalContext: {
      claim: politicalClaim,
      source: politicalClaim ? source : null,
      confidence: politicalClaim ? 'medium' : null,
    },
    geographicFeatures: features,
    importance: {
      strategic: importance,
      economic:
        economicInterpretations[key] ??
        (presence === 'uncertain' || presence === 'absent'
          ? 'Economic role at campaign start unresolved; no output initialized.'
          : category === 'port'
            ? 'Coastal or river exchange potential inferred from location; ancient capacity is unverified.'
            : 'Local hinterland exchange potential inferred from geography; production and resources are unverified.'),
      political:
        politicalClaim ??
        'Independent political research pending; not imported from RIS.',
      status: 'qualitative-research-not-simulation-values',
    },
    sources: [source, ...(additionalEvidence[key] ?? [])],
    discoveryReference: risReferences.get(key) ?? null,
    selection,
    attribution: {
      license: 'https://creativecommons.org/licenses/by/3.0/',
      contributors: [...(place.creators ?? []), ...(place.contributors ?? [])],
    },
    description: place.description,
  });
}
validateSettlementAtlas(records);
function markdown(value) {
  return String(value).replaceAll('|', '\\|').replaceAll('\n', ' ');
}
const table = [
  '# Italian settlement candidate comparison',
  '',
  'Generated from the independently authored atlas. Numeric evidence ranges may describe attestation or colonial refoundation; they are not automatically initial founding dates. Stable settlement and location UUIDs, aliases, cultural/political context, features, importance and contributor attribution are in [the atlas JSON](../../public/data/settlement-atlas.json).',
  '',
  '| Campaign name / key | Latitude, longitude | Category / tier | Presence in 278 BCE / confidence | Selection | Evidence range | Primary source |',
  '|---|---|---|---|---|---|---|',
];
for (const record of records) {
  const p = record.coordinates,
    dates = record.earliestEvidence;
  const range =
    dates.fromBce === null
      ? 'Undated'
      : `${dates.fromBce}${dates.toBce === dates.fromBce ? '' : `–${dates.toBce}`} BCE`;
  table.push(
    `| ${markdown(record.historicalName)} (${record.key}) | ${p ? `${p.lat.toFixed(5)}, ${p.lon.toFixed(5)}` : '**Unlocated**'} | ${record.category} / ${record.suggestedTier} | ${record.presence278Bce} / ${record.confidence} | ${record.selection} | ${range} | [Pleiades](${record.coordinateEvidence.source}) |`,
  );
}
table.push(
  '',
  'Coordinates are gazetteer representative points, not surveyed building locations. Precise founding dates and historical shorelines remain uncertain where recorded. The 23 active sites comprise seven originals and sixteen additions; twelve candidates are deferred and one is excluded.',
  '',
);
await writeFile('docs/vs5/italian-settlement-candidates.md', table.join('\n'));
await writeFile(
  'public/data/settlement-atlas.json',
  JSON.stringify({ schemaVersion: 1, campaignYearBce: 278, records }, null, 2),
);
await writeFile(
  'data/geography/atlas-manifest.json',
  JSON.stringify(
    {
      sources,
      risDiscovery: {
        url: 'https://rtr-imperium-surrectum.github.io/ris-wiki/regions.html',
        documentedCount: 1305,
        reuse:
          'No declared repository license found; names/links used for discovery only. No RIS assets, ownership, population or environmental database imported.',
        matchedCandidates: records.filter((record) => record.discoveryReference)
          .length,
      },
      counts: {
        total: records.length,
        existing: records.filter((record) => record.selection === 'existing')
          .length,
        expansion: records.filter((record) => record.selection === 'expansion')
          .length,
        deferred: records.filter((record) => record.selection === 'deferred')
          .length,
        excluded: records.filter((record) => record.selection === 'excluded')
          .length,
      },
      historicalCaveat:
        'Confidence for presence does not establish exact founding, culture homogeneity, current political ownership, or representative-point accuracy.',
    },
    null,
    2,
  ),
);
process.stdout.write(
  `Atlas: ${records.length} researched candidates; ${records.filter((r) => r.selection === 'expansion').length} selected expansion records.\n`,
);
