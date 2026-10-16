# VS6 settlement promotion pipeline and pilot audit

Continues coordinated checkpoint `a00ac258e815c265c38c5d2102e2aa4902e6ca76`. Local HEAD and origin/main ref files both matched that SHA. Git status was blocked by the repository ownership check even with command-scoped safe-directory options; global configuration was left unchanged. No commits or pushes. Research files and OPEN decisions were not edited.

## Result

All nine R-16 batches were read: **658 research candidates**. The existing atlas has 36 entries: 23 active sites, 12 deferred and one excluded site. **Twelve pilot candidates were shortlisted; zero were promoted.** No independently verified approval packets were available. Existing readiness labels, coordinates, gazetteer references and claims marked attested were not accepted as independent verification.

The complete [audit JSON](settlement-audit.json) records batch digests, every candidate's status and digest, research-confidence/readiness counts, and the pilot's existing claims and source references. These are an audit of research inputs, not a new historical truth dataset.

| Pilot candidate | Research handle | Integration status |
| --- | --- | --- |
| Tarquinii | r16-ita-tarquinii | Blocked: verification and approval absent |
| Caere | r16-ita-caere | Blocked: verification and approval absent |
| Arretium | r16-ita-arretium | Blocked: verification and approval absent |
| Populonia | r16-ita-populonia | Blocked: verification and approval absent |
| Volaterrae | r16-ita-volaterrae | Blocked: verification and approval absent |
| Iguvium | r16-ita-iguvium | Blocked: verification and approval absent |
| Ancona | r16-ita-ancona | Blocked: verification and approval absent |
| Tusculum | r16-ita-tusculum | Blocked: verification and approval absent |
| Velitrae | r16-ita-velitrae | Blocked: verification and approval absent |
| Alba Fucens | r16-ita-alba-fucens | Blocked: verification and approval absent |
| Akragas | r16-ita-akragas | Blocked: verification and approval absent |
| Catana | r16-ita-catana | Blocked: verification and approval absent |

This is a triage shortlist in Italy and Sicily, not an approved pilot list. No new historical settlement markers or architecture appear on the map. The original 23 researched sites remain the only active sites. Part C's new-pilot rendering remains conditional on approved records; unsupported cultures must use neutral markers rather than default Roman architecture.

## Run

`npm run atlas:audit` builds the TypeScript adapter, reads all nine research batches and the existing atlas, reads `data/settlement-integration/reviews.json`, and writes the audit. A validation failure returns nonzero and leaves the last published definition file intact. Successful runs publish `public/data/approved-settlements.json`; it currently contains an empty approved registry. Running it repeatedly preserves previously published definitions and identities rather than removing them when no new reviews are supplied.

The review file is separate from Big Pickle's research. It is intentionally empty. Supply actual independent review/approval records using the exported [SettlementReview contract](../../src/infrastructure/settlement-promotion.ts). Do not copy a research readiness field into `decision`.

## Validation boundary

Each review must bind to the complete candidate through a canonical-JSON SHA-256 digest. Object keys sort deterministically; extra research fields participate in the digest. This is an application digest format, not a claim of RFC 8785 compliance. An updated research record needs a fresh review. Proposed research IDs only identify the review target; they never become canonical geographic IDs.

Approval requires a reviewer, review date and durable approval reference. Four separate evidence findings must be explicitly verified: identity, location, existence and chronology. Each needs an HTTPS source, a locator and a finding. The first adapter requires a confirmed Pleiades numeric identifier and corresponding identity URL, preserving the existing atlas UUIDv5 minting convention. Other gazetteer adapters can be added later without changing existing IDs; unverified IDs are not guessed here.

A reviewed atlas definition is supplied explicitly, including coordinates, category/tier, culture, sources, evidence precision and chronology. It is not automatically derived from the research draft's roles, ownership claims or architecture prose. The occupation interval must include 278 BCE; founding before 278 alone does not prove survival into the campaign. Unlocated records, out-of-coverage/non-finite coordinates, unsupported presence, missing evidence and malformed definitions are rejected with candidate IDs and error codes. The coordinate guard uses the current provisional rendering envelope (-12 to 75 E, 12 to 62 N), not an assertion that those are final historical campaign margins.

Duplicate guards compare canonical settlement/location IDs and keys against the entire existing atlas, including deferred/excluded entries and prior published promotions. Matching aliases within 50 km and any sites within approximately 1 km require duplicate resolution. Distinct, independently identified distant homonyms are allowed. Those distance checks are conservative review triggers, not archaeological entity matching. A deferred site's activation or a published definition amendment needs an explicit reviewed migration; this first adapter does not silently recreate it under another ID.

All proposed additions validate before the batch publishes. An identical review replay is idempotent. Prior approved definitions remain in the output when no new review is supplied. Changed reviews for already published identities are blocked as amendments, keeping research editing separate from simulation lifecycle changes. The validator checks evidence structure, review provenance and consistency; it does **not** establish historical truth by downloading a URL or cryptographically authenticate a reviewer. Independent historical verification remains a human research responsibility.

## Simulation and renderer integration

A successful promotion exports an existing `SettlementAtlasRecord` plus an existing `GeographicSettlement` definition, with stable settlement/location UUIDs and source references. The explicit `initialControl: null` conveys unknown control without inventing factions or converting political-confidence prose into ownership. Political research remains sourced descriptive metadata.

These are immutable import snapshots, not mutable live simulation state. Founding, abandonment, destruction, conquest and development continue to belong to application/domain systems. Re-running research imports does not perform any of those operations. Definitions do not carry new economic, demographic or construction rules.

The current empty approved registry does not change the start-world loader. Once Big Pickle supplies approved packets, an application adapter must register their geographic locations in approved region/district definitions and consume the exported definitions. That mapping and unresolved authoritative architecture contracts are dependencies; this milestone does not invent regions, close G2/AD-33 or bypass OPEN decisions. Development snapshots remain separate presentation inputs. New-culture architectural eligibility needs an approved context or neutral representation; no generic Latin fallback was introduced.

## Tests

Synthetic review records live only in tests, use conspicuous test names and provenance, and are never published. Coverage includes approval/readiness separation, four verification dimensions, source/digest provenance, chronology, geographic bounds, duplicate IDs/keys/nearby aliases, distant homonyms, malformed input, unknown political ownership, stable IDs, idempotent replay, preservation of prior approved definitions, and rejection of silent amendments.

See the [terrain and performance report](terrain-presentation.md) for browser validation and current implementation limits.

Research labels across all 658 records: 453 attested, 177 probable, 25 uncertain and three unlocated. Readiness labels: 52 ready-for-atlas-integration, 445 ready-with-caveats, 147 needs-research and 14 provisional. These counts describe the draft, not independent evidence quality; all remain outside the approved registry.

Final validation: 443 tests passed with typecheck, lint, builds and browser regressions. No approved candidate packets were supplied during this milestone. The generated approved registry remains empty; initial new-settlement rendering and application registration therefore remain blocked. Existing 23-site selection, map modes and development-driven visuals passed regression checks. No commits or pushes.
