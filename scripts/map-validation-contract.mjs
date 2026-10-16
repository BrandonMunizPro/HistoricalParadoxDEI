import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
const read = async (path) => JSON.parse(await readFile(path, 'utf8'));
const original = (await read('public/data/world-terrain/context.json'))
  .settlements;
const atlas = (await read('public/data/settlement-atlas.json')).records;
export const approved = (await read('public/data/approved-settlements.json'))
  .records;
export const expectedMapSettlementCount = original.length + approved.length;
/** Preserve the original identity/coordinate checks while accepting registry additions. */
export async function assertMapSettlementCatalog(page) {
  const actual = await page.evaluate(() => ({
    sites: window.__campaignMap.settlements,
    prototype: window.__campaignMap.prototypeSettlementCount,
    control: window.__campaignMap.controlForValidation(),
    approved: window.__campaignMap.approvedSitesForValidation,
  }));
  assert.equal(original.length, 23);
  assert.equal(actual.prototype, 23);
  assert.equal(actual.sites.length, expectedMapSettlementCount);
  assert.equal(
    new Set(actual.sites.map((s) => s.id)).size,
    expectedMapSettlementCount,
  );
  for (const s of original) {
    const found = actual.sites.find((a) => a.key === s.key);
    assert.ok(found);
    assert.equal(found.id, atlas.find((a) => a.key === s.key).id);
    assert.equal(found.lon, s.lon);
    assert.equal(found.lat, s.lat);
  }
  for (const r of approved) {
    const found = actual.sites.find((a) => a.id === r.atlas.id);
    assert.ok(found);
    assert.equal(found.lon, r.atlas.coordinates.lon);
    assert.equal(found.lat, r.atlas.coordinates.lat);
    assert.ok(!actual.control.some(([id]) => id === r.atlas.id));
  }
  assert.equal(actual.control.length, 23);
  assert.equal(actual.approved.length, approved.length);
}
