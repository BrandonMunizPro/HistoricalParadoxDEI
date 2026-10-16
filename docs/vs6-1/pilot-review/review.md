# Twelve pilot settlements — prepared for human approval

**Status: pending explicit user approval. Zero approvals or promotions have been published.**

The [pending review entries](pending-reviews.json) supply every `SettlementReview` field. `decision: "blocked"` is a safety hold, not a historical rejection. Reviewer, review date and approval reference remain blank because no approval has been given. This file is outside the active importer input and is not loaded by gameplay. After explicit approval, those four fields can be populated from the real approval and the selected entries submitted through the existing importer. Do not copy the validation-only probe provenance into an approval.

## Technical validation

`node scripts/prepare-pilot-reviews.mjs` recomputes all twelve complete-record digests and compares them to both Pickle's packet and the current audit; all match. It verifies canonical settlement/location IDs, reviewed coordinate equality and source URLs. An isolated **in-memory schema probe**, with conspicuous non-approval provenance, exercises the actual `promoteSettlements` positive path: twelve definitions pass, zero issues. No resulting definition or probe approval is saved to the authoritative registry. Pending entries themselves are rejected as unapproved, as required. Negative probes confirm stale digests, duplicate canonical identities and invalid occupation intervals are rejected. The pipeline compares the pilot against all 36 atlas records, prior publications and other pilot entries, including alias/nearby-site safeguards.

All twelve occupation intervals contain 278 BCE. Coordinates are representative points, not surveyed buildings; no reviewed point was moved to match the old research marker. Gazeteer-to-gazetteer disagreement reaches 1.843 km at Arretium. Political prose is not assigned ownership: **every future promotion initially exports `initialControl: null`** unless a separate authoritative political initialization is approved.

The [validation result](validation.json) records protected-file hashes. Pickle's two evidence files, the research batch, active reviews, published registry and atlas are unchanged. The active review count and published promotion count remain zero. The existing 23 simulated settlements and optional research references are untouched. Existing promotion tests: **26 passed**. The new preparation script passes ESLint. No renderer or simulation change required a browser/build rerun for this preparation-only task.

## Independent source checks and limitations

All twelve Pleiades HTML URLs were attempted and returned Anubis challenges. Direct JSON fetches failed in this restricted environment; web JSON attempts were also inaccessible. This is **not** treated as a historical rejection or a prerequisite to another manual HTML check. Pickle's independently assembled evidence remains available; this pass does not falsely claim it re-downloaded those JSON records.

Eleven ToposText pages were accessible directly, corroborating the listed site identity and approximate coordinates. The Ancona and Alba links resolve to the specified Pleiades identifiers even though their link labels omit the numeric ID. Akragas direct requests timed out; its indexed [ToposText entry](https://topostext.org/place/373136PAkr) corroborates the site/point and [Brill's SEG place index](https://scholarlyeditions.brill.com/sego/places/) corroborates Pleiades 462086. See [web-review.json](web-review.json) for access limits and references. ToposText incorporates other gazetteers and PECS; matching gazetteer records are corroboration, not necessarily independent archaeological observations.

**Chronology caveat for all twelve:** a name-attestation period covering approximately 330–30 BCE is compatible with 278 BCE, but does not alone demonstrate continuous occupation in every year. Pickle supplies continuity findings and reviewed intervals; the human decision should accept these historical inferences, not treat the broad period label as exact-year archaeological proof. Earliest-evidence dates and interval endpoints are approximate review horizons, not newly verified exact founding/abandonment dates. Some ToposText pages have no narrative description, so this pass cannot claim it independently reproduced every underlying occupation argument. Nothing in the live checks contradicts these sites' campaign-era existence, but machine/schema eligibility is distinct from independent historical certification.

Political metadata requires particular restraint. [Caere's PECS narrative](https://topostext.org/place/420121UAgy) gives alternative loss-of-independence dates of 293 or 273 BCE, straddling the campaign date. Ancona's accessible gazetteer does not establish Roman ownership in 278. For Alba Fucens, [Livy 10.1.1–2](https://www.perseus.tufts.edu/hopper/text?doc=10&fromdoc=Perseus%3Atext%3A1999.02.0155) places the colony in Aequian country; the packet's Marsi/Aequi wording is a regional caveat, not a basis for a controller assignment. These are review annotations, not edits to Pickle's evidence.

## Human review table

Coordinates below are **latitude, longitude**, rounded to five decimals for comparison. Full packet precision is retained in the entries without claiming matching archaeological accuracy. “Context” is the packet's proposed historical relationship, not a simulation faction assignment. Every row remains pending approval.

| Candidate | Reviewed location | Proposed political context | Remaining caveat |
| --- | --- | --- | --- |
| Tarquinii (`r16-ita-tarquinii`) | 42.25725, 11.79145 | Etruscan; Roman sphere, provisional | Ally/subject status; Graviscae shoreline/port |
| Caere (`r16-ita-caere`) | 42.00249, 12.10778 | Roman civic relationship | Legal-status chronology disputed |
| Arretium (`r16-ita-arretium`) | 43.47127, 11.86305 | Etruscan; proposed Roman alignment | Gazetteer points differ 1.843 km; alignment provisional |
| Populonia (`r16-ita-populonia`) | 42.98824, 10.48965 | Etruscan; proposed Roman hegemony | Ancient harbour/shoreline reconstruction |
| Volaterrae (`r16-ita-volaterrae`) | 43.40160, 10.86006 | Etruscan; proposed Roman orbit | Precise control not established |
| Iguvium (`r16-ita-iguvium`) | 43.35546, 12.57344 | Umbrian; proposed Roman orbit | Legal/military status unresolved |
| Ancona (`r16-ita-ancona`) | 43.61899, 13.51607 | Greek/Picentine; controller unknown | Foundation/control debated; Roman claim not established |
| Tusculum (`r16-ita-tusculum`) | 41.79808, 12.70721 | Roman citizen community, per packet | Shared chronology/representative-point caveats |
| Velitrae (`r16-ita-velitrae`) | 41.68743, 12.77721 | Roman control, per packet | Colonial status; medium ToposText confidence |
| Alba Fucens (`r16-ita-alba-fucens`) | 42.07990, 13.41118 | Latin colony in Roman system | Regional Marsi/Aequi wording; approximate founding date |
| Akragas (`r16-ita-akragas`) | 37.29059, 13.58548 | Contested; controller unknown | Carthage/Syracuse/Pyrrhus; exact campaign date matters |
| Catana (`r16-ita-catana`) | 37.50296, 15.08814 | Proposed Syracusan orbit | Syracusan/independent status; medium location confidence |

The old “no verification packet supplied” pilot blocker is superseded by Pickle's new packet and this review. Explicit approval is still missing. Approval of historical identities/locations need not approve disputed political claims or convert political metadata into ownership. After approval, application registration and map verification must still be implemented through existing geographic contracts; this preparation does not bypass those dependencies or resolve OPEN architecture decisions.

No commits or pushes.
