# Approved geographical integration — 12 pilot sites

**Implemented locally; no commits or pushes.** The campaign map now loads **35 approved sites: the original 23 plus 12 registry-backed geographic sites**. The additions are persistent imported geographical definitions and selectable neutral symbols, not research references or new population/economic/political aggregates.

## Publication and authority

The user's [explicit scope approval](approval.md#scope) supplies the approval authority. Big Pickle's `docs/vs6/verification/pilot-verification.json` remains the historical evidence source. All twelve pending entries were compared against the packet's identity, digest, verification, occupation and definition fields; the complete candidate digests were recomputed against current research. The packet file digest also matched the pending artifact. The existing `promoteSettlements` pipeline then validated the full batch against the original 36-record atlas, earlier publications and the other pilot entries before publishing.

`data/settlement-integration/reviews.json` contains the twelve real scoped approval entries. `public/data/approved-settlements.json` contains the twelve exported definitions with canonical settlement/location IDs, `existence: active`, `initialControl: null`, and candidate/review provenance. Re-running the normal audit/import succeeds idempotently with twelve publications, not twenty-four. No ownership, population, governors, characters, resource assignments, or economic state was introduced. Political-context prose remains historical metadata.

The earlier pending artifact is marked reconciled/published while retaining its original draft snapshots for traceability. Its snapshots are not active importer input. Prior evidence, chronology caveats and representative-point uncertainty remain applicable. No Pickle verification/research source record was modified.

## Registry-driven rendering

`src/presentation/approved-map-sites.ts` validates and projects the published registry into a presentation read model. It rejects duplicate identities, invalid/out-of-coverage coordinates, mismatched canonical/location identities, missing approval provenance, non-null initial control and demographic/resource references. It does not assign a region, owner or development snapshot.

`map/main.js` fetches `/data/approved-settlements.json` separately from terrain data. The original 23-site array remains the sole input to the existing political fixture, procedural settlement assets and authored route graph. A combined catalogue supplies the 35 map selections, labels, evidence panels and camera-focus targets. No pilot-name list is embedded in the renderer or terrain loader.

`map/approved-site-markers.js` draws neutral cartographic circles as a single instanced billboard draw, draped vertically to available source terrain while preserving the exact representative longitude/latitude. Markers stay readable at multiple zooms; the existing priority/collision label layout controls names. Sidebar buttons focus new sites and provide evidence tooltips. All twelve have “Political control: Not assigned,” and development preview is disabled. They remain visible and selectable in geographic and political modes. These are deliberately symbols, not invented Greek/Etruscan/Roman architectural plans.

Selection uses a shared raycast decision between existing model hit volumes and neutral instances. Owner display paths tolerate absent control; political influence continues to consult only the original fixture. The validation transfer path explicitly rejects geographic-only sites before mutation. No placeholder “unknown” faction is attached to a promoted site.

Research references are filtered by the registry's original candidate handles before clustering. All twelve promoted handles are suppressed; the source research records remain intact. There are **633 eligible optional references**, with the same **13 excluded** (three missing coordinate pairs and ten beyond coverage). This suppression automatically follows future registry batches.

## Verification and evidence

The dedicated production-browser check physically clicked and selected **all 35 sites**, after deliberately selecting another site without moving the camera. It checked reviewed coordinates/IDs, evidence panels, new-site focus buttons, disabled development previews, independent toggles, political-mode visibility, unchanged original control/architecture/building count, and bounded tile residency. An isolated browser intercepted the registry with an empty response and rendered exactly the original **23** sites, with no Catana entry. This proves registry-driven inclusion without editing an authoritative file.

See [dedicated browser assertions and selection coordinates](evidence/validation.json), and [the regression check results](checks.json).

Screenshot examples:

- [World geography](evidence/world-geographic.png)
- [Italian peninsula and registry markers](evidence/italy-registry-sites.png)
- [Tarquinii](evidence/tarquinii-geographic.png)
- [Arretium](evidence/arretium-geographic.png)
- [Akragas, geography](evidence/akragas-geographic.png) and [political mode](evidence/akragas-political.png)
- [Catana](evidence/catana-geographic.png)
- [Original Rome](evidence/roma-geographic.png)

These screenshots were inspected in the actual browser output. They show neutral locations and evidence panels with no assigned control. The previous terrain-quality defects are not claimed fixed by this integration: finite coverage edges, coast rasterization, low-angle horizon and schematic vegetation remain tracked in the VS6.1 visual report.

Automated validation: **458 tests across 31 files**, including all 26 original promotion tests and six new registry-adapter tests; typecheck, lint, simulation build/smoke and production Vite build pass. The production build retains its existing large-chunk warning. Browser validators now use a shared catalogue assertion instead of assuming 23 total sites: it still requires exactly 23 original fixture sites/control entries, checks their original coordinates/IDs against the unchanged terrain/atlas inputs, and validates every approved addition against the actual registry. This expands the meaningful check rather than deleting it.

The evidence records frame-rate/heap/draw-call observations and terrain diagnostics. These are short browser regression observations, not a controlled before/after performance benchmark. There is one instanced draw for the twelve symbols, no added development meshes, and the existing 12-resident/3-request/4-cache streaming limits remain intact. JavaScript heap does not measure GPU memory. The separate world check retains the 700/1000 synthetic-marker benchmark; it is not historical settlement simulation.

Measured on Chrome 155 headless, 1440x1000, i7-11800H, 16 GB RAM and RTX 3060 Laptop GPU through ANGLE/D3D11: world, Italy, Greece, Egypt and local Rome idle samples each averaged approximately 143.9 FPS with 7.1 ms p95 frame time (three-second, browser/display-limited samples). World/Italy/Greece/Egypt/local draw calls were 183/87/26/18/57, and JS heap approximately 206/261/244/261/260 MB. Resident tiles were zero at world zoom and twelve for the settled regional/local samples. While loading, the movement regression observed worst sampled frames of 21.0 ms in Greece, 13.9 ms in Egypt and 14.3 ms in Italy; movement steps stayed within the existing bound. These observations do not establish cold-cache hitch elimination or a memory-leak guarantee.

## Files changed in this integration

- Approval/publication: `data/settlement-integration/reviews.json`, `public/data/approved-settlements.json`, generated `docs/vs6/settlement-audit.json`; archival reconciliation metadata in `docs/vs6-1/pilot-review/pending-reviews.json`.
- Adapter/rendering: new `src/presentation/approved-map-sites.ts`, new `map/approved-site-markers.js`; updated `map/main.js`, `map/research-layer.js`.
- Validation: new `tests/approved-map-sites.test.ts`, `scripts/verify-approved-sites.mjs`, `scripts/map-validation-contract.mjs`; updated existing map, Italy, world, campaign-detail, streaming and VS6 presentation validators to retain original-23 checks while accepting approved additions. The research validator now accepts an output directory to preserve previous evidence. `eslint.config.js` registers the new browser harnesses and JavaScript helper.
- Documentation/evidence: this directory and the scoped approval record. Terrain datasets, original atlas, original development fixtures and research/verification packet source files are unchanged.

## Remaining boundaries

The twelve definitions are **active imported geographic sites**, but are not yet registered movement-graph nodes: accurate region/district membership and adjacency remain separate work. Sicily is not assigned to Central Italy. No roads, settlement development snapshots, population systems or political initializers were invented, and no OPEN architecture decision was resolved. `existence: active` is the imported starting definition; future mutable lifecycle state must remain separate from research.

Further batches use the same promotion registry and generic renderer adapter; terrain files require no settlement edits. Approved-marker clustering beyond this small pilot can be added when density warrants it; present labels already have zoom filtering/collision handling and markers share one draw. Existing 23 models and their development-driven selection remain unchanged.

Run `npm run validate`, `npm run map:build`, and `npm run map:preview -- --port 4173`; then `node scripts/verify-approved-sites.mjs`. Historical promotion audits use `npm run atlas:audit`. Preparation-only historical draft artifacts remain archived; do not replace real approvals with schema probes.
