# Sicily and northern Italy: geographic and visual foundation

Status: first implementation stage, available in the regular Godot campaign. Visual changes are scoped to the two reference areas. Smaller permanent historical regions remain pending review; no new boundary coordinates, capitals, settlement memberships or starting ownership assignments have been activated.

## Delivered architecture

`godot-prototype/geographic_regions.gd` separates definitions from political owner state. Definitions have stable UUIDv5 migration identities, geometry digests, optional larger-group identity, settlement membership and control-centre slots. Initial owners live separately in `data/geographic-regions/initial-owners.json`. GPU raster indices are migration/rendering metadata, not save identities.

The initial catalog deliberately retains the existing 128 envelopes, marked `legacy_envelope`. It does **not** relabel them as approved conquest regions. A region may contain multiple settlements. The validator rejects duplicate membership, nonexistent approved settlement IDs, a settlement centre at the wrong location, and active memberships/centres on unapproved definitions. A non-city centre must reference a location explicitly listed in the approved definition. Research handles are not promoted to canonical settlement IDs.

`faction_cartography.gd.set_region_owner(region_id, faction_id)` updates one definition's political state and palette entry. `set_region_controller(legacy_id, faction_id)` remains a compatibility adapter. `restore_region_state()` validates and restores state plus the presentation lookup. These are state/presentation primitives, not conquest commands. Export/restore envelopes are versioned; this stage does not wire a new campaign save slot or database schema.

The additional controller-ID texture separates border identity from display RGB. Similar-colored owners remain distinguishable; regions sharing an owner do not gain a false faction border. Neither ownership changes nor faction color changes regenerate geometry.

Builder: `node godot-prototype/tools/region-foundation-build.mjs`. It creates migration records and rerasterizes existing Sicilian polygons at 2048×1536 over 12–16 E / 36–39 N. It does not generate polygon coordinates, divide existing territories or infer regions from settlement anchors. Existing northern Italy geometry/raster and the global fallback are retained.

## Approval boundary and historical work remaining

`REGION-REVIEW.md` and `data/geographic-regions/proposals.json` contain six inactive research groupings: Mediolanum, Brixia, Patavium, Syracuse, Lilybaeum and Panormus. The source references are preserved in the proposal JSON. Each has `requires_approval` status and no boundary. These are proposed research subjects, not assertions of proven regional administration or dependent towns.

The accepted hybrid architecture does not itself approve these particular boundaries, capitals or memberships. The user's explicit instruction requires approval where historical uncertainty remains. Accordingly, all active membership arrays are empty and active control centres are null until individual dossiers are approved. Multiple-settlement membership and centre validation are exercised with synthetic in-memory fixtures only.

Important unresolved questions: the Boian regional centre; Verona's regional relationship to Brixia; the political status of Mantua; Sicilian administrative dependencies and the precise start date during the Pyrrhic intervention; and how to replace the broad Carthaginian coastal envelope and the unassigned Sicilian interior. Smoother rendering does not make these source polygons historically correct. No arbitrary subdivisions were added to fill the gaps.

## Visual changes

- Four subpixel edge samples provide coverage-based antialiasing inside the reference areas. Border decisions use controller identities. Reference regions bypass the legacy engraved-rim calculation instead of doing both edge paths.
- Sicily uses a higher-resolution ID raster of the same source polygons, removing much of the earlier large raster stair-stepping. Straight/angular segments in the source reconstruction remain straight/angular.
- Sicily now uses restrained political replacement and the existing regional surface-noise reduction. Source-derived terrain normals remain active. No height exaggeration, saturation boost, decorative effect or alternate map mode was introduced.
- Screen-facing faction emblems accompany the northern faction labels and Syracuse label. They stay upright when the camera rotates; visibility still depends on the anchor being inside the viewport and passing collision checks. No claim is made that offscreen anchors should stay visible.
- Approved settlement coordinates take precedence over research-marker coordinates. Research markers remain visibly separate from approved settlement identities in data. Settlement/faction/geographic text uses distinct sizes and tones. Duplicate native settlement labels are suppressed only while the reference overlay is active.
- Existing coastline, water surface, lake elevations, shoreline masks and previously reviewed lake reconstruction are retained. The new political raster follows the existing land clipping. This stage improves geographic readability; it does not claim new hydrographic survey detail or ancient coastline reconstruction.

## Verification and evidence

`REVIEW.html` presents six before/after pairs at 1920×1080: northern Italy strategic, Po Valley, Alpine terrain, Sicily strategic, Sicily regional and a low-angle oblique Etna/coast view. `verify.mjs` checks exact equality of focus/distance/pitch/yaw presets and recorded position, basis, FOV and clipping planes. These are matched submissions through the existing capture harness; camera controls and default startup framing are unchanged.

The ownership diagnostic intentionally assigns the Boian envelope the same owner as a neighboring envelope, then changes only its owner. These are explicitly nonhistorical temporary test assignments; they are restored before exit and are not written to scenario data. Exactly one palette entry changes. The target rendered RGB probe changes by approximately 0.0865; the neighbor probe remains identical. Global, northern and Sicilian ID rasters and definitions remain byte-identical during the operation. Invalid IDs and invalid restored state are rejected without partial mutation. See `foundation-verification.json` beside the final images.

`region-foundation-validate.gd` verifies multiple settlements in a synthetic approved region, centre identity validation, duplicate membership rejection, the approval gate and state round trip. No synthetic definition is saved to the campaign catalog.

Existing Vitest suite: **37 files / 514 tests passed**. The initial screenshot harness run exposed a Color API error in the harness; it was corrected before usable captures. Native validation passed. Final render logs are checked for script and shader errors. Existing resource-as-image/export warnings remain; packaged export is not certified by these source-project captures.

Protected SHA-256 checks confirm that approved sites, research locations, canonical faction scenario and original lake mesh data remain unchanged. Geometry digests and initial ownership also match the pre-existing northern scenario. See `verification.json` for current checks and capture timings.

## Manual inspection and limits

The inspected images show clearly improved Sicilian terrain visibility, less distracting border stepping, readable named settlements and restored northern faction emblems. They also show incomplete historical cartography, regional override seams, sparse river contrast, coarse terrain meshes and vegetation patterns, angular source lake/shore segments, and some tiny legacy research labels in the close oblique view. At closer terrain scale political colors become weak; readability there remains a review item.

Measured frame intervals increased compared with the baseline, especially in Sicily, because terrain material shading now runs beneath political fields and edge coverage uses more texture samples. Redundant legacy border work was removed after the initial measurement. Current before/after means are in `verification.json`; 120 controlled frames per view are indicative, not a sustained gameplay benchmark. This performance cost remains an acceptance consideration rather than a hidden regression.

Acceptance remains **partial**: the identity/state foundation and ownership locality are demonstrated, and the existing style is visibly improved in the reference views. New smaller regions, approved memberships and approved control centres are not complete. The geographic review and screenshots require manual approval before extending the approach beyond these areas. No conquest, combat, siege, garrison, military coordination, information propagation or AI mechanics were implemented.

Normal campaign startup passed with engine exit code 0. Final measured frame means: northern strategic 20.12 to 20.94 ms; Po Valley 18.72 to 19.97 ms; Alpine 8.72 to 8.71 ms; Sicily strategic 5.16 to 9.90 ms; Sicily regional 5.43 to 12.80 ms; Sicily oblique 8.88 to 8.58 ms. These figures expose the remaining Sicily rendering cost; they are not a claim of sustained frame-rate acceptance.

