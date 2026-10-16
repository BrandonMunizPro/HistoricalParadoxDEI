# VS6 Pilot Settlement Verification

**Status:** evidence only — this is **not** an approval.
**Campaign year:** 278 BCE.
**Machine-readable packet:** [`pilot-verification.json`](./pilot-verification.json).
**Date:** 2026-10-15.

This packet independently verifies the twelve shortlisted VS6 pilot settlement
candidates named in `docs/vs6/settlement-promotion.md` and supplies a reviewed
atlas definition for each. It deliberately contains **no approval fields**
(`decision`, `reviewer`, `reviewedOn`, `approvalReference`). Turning an eligible
candidate into an approved `SettlementReview` is the job of an authorized
approver, not of this evidence.

## Scope

For each of the twelve pilot keys (`tarquinii`, `caere`, `arretium`,
`populonia`, `volaterrae`, `iguvium`, `ancona`, `tusculum`, `velitrae`,
`alba-fucens`, `akragas`, `catana`) the packet records four independent
verification dimensions, a reviewed occupation interval that must straddle
278 BCE, and a reviewed definition draft:

- **identity** — the historical place maps to a specific Pleiades identifier;
- **location** — the coordinates are corroborated by a second gazetteer;
- **existence** — the place was an occupied settlement, not a road station or
  an unlocated name;
- **chronology** — occupation includes the campaign year 278 BCE.

## Method and sources

- **Pleiades** — the authoritative published record for each identifier, read via
  the public JSON endpoint `https://pleiades.stoa.org/places/<id>/json`. The
  companion HTML pages are currently behind the Anubis anti-bot layer, so a
  one-time human confirmation of each HTML URL is recommended before final
  approval. The JSON endpoint returned the published record without challenge.
- **ToposText** — `https://topostext.org/place/<id>` independently lists the same
  Pleiades identifier and coordinates for all twelve places, and reproduces the
  DARE / Princeton Encyclopedia narrative for `tarquinii`, `caere`,
  `volaterrae`, `akragas`, and `catana`.
- **Research drafts** — `docs/research/r16-settlement-roster.batch1.json`.
- **Reviewed coordinates** use the Pleiades representative point, matching the
  existing atlas convention (`public/data/settlement-atlas.json`).

## Result summary

All twelve candidates are **eligible for approval**. Every dimension resolves to
`verified`, every occupation interval straddles 278 BCE, and none of the twelve
collides with the existing 36-record atlas.

| key | Pleiades | title | BAtlas | reviewed lon,lat | draft Δ km | ToposText Δ km | occupation BCE |
| --- | --- | --- | --- | --- | --- | --- | --- |
| tarquinii | 413332 | Tarchna/Tarquinii | 42 B4 | 11.79145, 42.25725 | 2.859 | 0.852 | 750–100 |
| caere | 422859 | Caere | 43 A1 | 12.10778, 42.00249 | 0.700 | 0.810 | 750–100 |
| arretium | 413032 | Arretium | 42 B2 | 11.86305, 43.47127 | 1.520 | 1.843 | 750–100 |
| populonia | 403212 | Fufluna/Populonium | 41 C4 | 10.48965, 42.98824 | 0.197 | 0.006 | 750–100 |
| volaterrae | 403292 | Velathri/Volaterrae | 41 D3 | 10.86006, 43.40160 | 0.178 | 0.211 | 750–100 |
| iguvium | 413174 | Iguvium | 42 D2 | 12.57344, 43.35546 | 0.807 | 0.008 | 550–100 |
| ancona | 413014 | Ancon(a) | 42 F1 | 13.51607, 43.61899 | 0.502 | 1.113 | 400–100 |
| tusculum | 423108 | Tusculum | 43 C2 | 12.70721, 41.79808 | 0.232 | 0.274 | 750–100 |
| velitrae | 423117 | Velitrae | 43 D3 | 12.77721, 41.68743 | 0.172 | 0.132 | 750–100 |
| alba-fucens | 413005 | Alba Fucens | 42 E4 | 13.41118, 42.07990 | 0.098 | 0.015 | 303–100 |
| akragas | 462086 | Akragas/Agrigentum | 47 D4 | 13.58548, 37.29059 | 2.212 | 0.002 | 580–100 |
| catana | 462270 | Katane/Catina | 47 G3 | 15.08814, 37.50296 | 0.368 | 0.006 | 729–100 |

All Pleiades records carry the `hellenistic-republican` name-attestation period
(c. 330–30 BCE), which spans 278 BCE. The largest research-draft coordinate
discrepancy is ~2.9 km (Tarquinii); the independent ToposText points agree with
Pleiades to within ~1.8 km in every case.

## Duplicate and identity checks

- The twelve `candidateSha256` values were recomputed over the complete batch
  records and match `docs/vs6/settlement-audit.json` exactly.
- Canonical ids and location ids were derived with the ADR-0009 UUIDv5 rules
  (`settlementAtlasIdentity`); none collide with the existing 36 atlas records.
- No name/alias match within 50 km and no coordinate within 1 km of any existing
  atlas record.

## Pipeline compatibility

As a format check only, the twelve definitions were run through the real
`promoteSettlements` implementation (with throwaway probe approvals in a scratch
process, not committed anywhere): **12 approved, 0 issues**, and every
`candidateSha256` matched the full-record digest. The evidence below is therefore
directly consumable by `scripts/audit-settlement-promotion.mjs`.

## Coordination note for the VS6 implementation (Sol)

`src/infrastructure/settlement-promotion.ts` defines `SettlementReview`. This
packet already supplies every **evidence** field of that interface per candidate:

- `candidateId` ← `candidateId`
- `candidateSha256` ← `candidateSha256`
- `pleiadesId` ← `pleiadesId`
- `verification` ← `verification` (identity/location/existence/chronology)
- `occupation` ← `occupation`
- `definition` ← `definition`

The four **approval** fields are intentionally absent and must be supplied by an
authorized approver before promotion:

- `decision` (must be `"approved"`)
- `reviewer`
- `reviewedOn` (`YYYY-MM-DD`)
- `approvalReference`

To publish, an approver combines each candidate's evidence fields above with the
four approval fields into a `SettlementReview` and writes the collection to
`data/settlement-integration/reviews.json`. This evidence packet does not, and
must not, be treated as that approval. No implementation file was modified while
producing it.

## Limitations

- Pleiades HTML pages are Anubis-protected; records were read via the public JSON
  API. Confirm each `https://pleiades.stoa.org/places/<id>` page once by hand
  before final approval.
- The reviewed earliest-evidence date is a conservative floor. It does not by
  itself establish campaign presence; the occupation interval does.
- Political control in 278 BCE is uncertain for some candidates (notably
  `akragas` and `catana`, recorded at medium confidence); this does not affect
  existence or location.

## Caveats per candidate

- **tarquinii** — legal status (socius vs subject) in 278; reconstructed ancient
  shoreline and Graviscae port extent.
- **caere** — `civitas sine suffragio` is attested from 353 BCE and may still be
  evolving at 278.
- **populonia** — ancient coastline and harbour partly submerged/reconstructed.
- **iguvium** — precise legal/military status at 278 is not securely attested.
- **ancona** — founding date (traditionally 387 BCE) and degree of Greek vs
  Picentine control at 278 are debated.
- **velitrae** — precise colonial status at 278 is not fully resolved.
- **akragas** — political control at 278 (Carthaginian vs Syracusan vs Pyrrhic)
  uncertain.
- **catana** — political control at 278 (Syracusan vs independent) not fully
  resolved.

All twelve nevertheless satisfy identity, location, existence, and chronology.
