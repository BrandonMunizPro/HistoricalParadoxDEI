# Neapolis residential prototype: acquisition gate and implementation plan

Checked 2026-11-04. Status: **awaiting licensed source files; campaign implementation has not started**.

## Selected asset and availability

Only the requested [JuanChee, Asset Pack Vol 4 — Modular Ancient Greek Poor House on RenderHub](https://www.renderhub.com/juanchee/asset-pack-vol-4-modular-ancient-greek-poor-house) is selected. The public listing is live, displays $6.00 and identifies the Extended Use License. It advertises a 219.9 MB download, three building prefabs, 37 parts, 27,470 triangles across the parts collection, 15,919 vertices, 1024-square diffuse/roughness/normal/AO/height maps, and GLB/FBX/Blend/OBJ formats. These are seller specifications, not measurements of delivered files. Checkout price and successful delivery are unverified. No free source download or local entitlement was established.

No matching pack/model files were found in the workspace asset/data/research/runtime searches, including ignored asset files, or among matching top-level Downloads entries. This does not assert that the asset is absent from every directory or another account. No purchase, paid download, substitution, login or contact with the seller was performed.

## Licence verification

The [RenderHub 3D Content Licensing Agreement](https://www.renderhub.com/info/3d-content-licensing), particularly III, IV and V.2, permits modification and commercial games under Extended Use. It covers one licensee entity and specified collaborator sharing with access controls. Standalone resale, unauthorized source redistribution and competing asset-library distribution are restricted; copyright is not transferred. Preserve the acquisition record, applicable terms and included notices. This is verification of the published terms, not a purchased entitlement or a guarantee of the seller's underlying rights.

## Action needed to unblock

1. If already owned, retrieve the original archive from the purchasing RenderHub account. Otherwise the user must purchase the exact selected listing; this agent has no authorization to purchase it.
2. Keep the full original archive and supplied textures/source files together. Include any licence/readme files and retain proof identifying the licensee, product and purchase date. Payment details and account credentials are unnecessary for integration.
3. Suggested private staging location: `C:\Users\brand\Downloads\Antiquity-Neapolis-JuanChee\`. This directory has not been created. Alternatively provide the actual existing local archive path. Do not put the purchased archive in a public repository.
4. If checkout or delivery fails, stop and resolve that issue with the account/seller; do not switch storefronts or products automatically.

Once files are available, the existing authorization covers the following bounded implementation, conditional on inspection. No extra gameplay systems or architectural redesign are proposed.

## Inspect the delivered files before campaign changes

Record the archive SHA-256 and actual file inventory. Work in staging first and do not run bundled scripts. Check:

* Actual assemblies/parts, indexed triangle counts by surface and detail level, vertex counts, duplicate/interior faces, normals, tangents and UVs.
* Texture dimensions, channels, colour spaces, normal-map convention, alpha modes, material counts and missing dependencies. Report compressed GPU allocation separately from archive size, decoded image memory and mipmap overhead.
* Units, axis orientation, applied transforms, ground pivots and bounding boxes. Test the complete assembly before normalization; do not assume a GLB is already in metres or that every part shares a suitable origin.
* Whether up to three distinct residential assemblies are genuinely available. Prefer supplied prefabs if suitable. Do not fabricate a courtyard, workshop function or historical reconstruction merely to reach three assemblies.
* Suitability for an inhabited early Hellenistic settlement: roof form, openings, materials, architectural details, weathering and proportions. Reject unsuitable components rather than changing the campaign's presentation to suit them. Record historical uncertainty separately from technical defects.

Material slots, actual prefab complexity, LODs, dimensions, pivots and historical acceptance are currently unknown.

## Fixed scope and baseline

Target only approved Neapolis:

* Settlement ID: `1f50fd31-a377-5df8-b182-d84e962aed97`.
* Geographic location ID: `46772382-2dd6-58be-87f0-4331e98ae01e`.
* Existing position: longitude `14.25287`, latitude `40.839995`.

Read these values from the existing record at implementation time; never create a duplicate or rewrite the record. Political owners, research, terrain, vegetation and regional appearance remain unchanged. Roma and Catana keep their existing rendering paths.

Before changing campaign code, capture the existing Neapolis cluster and record deterministic slot transforms, counts and relevant source hashes. Use the current ordinary settlement renderer as the reversible baseline. A prototype comparison switch should select baseline/candidate through the same renderer, with the default baseline retained until manual review. No second settlement renderer or alternate game presentation is introduced.

## Minimal integration into the existing renderer

Relevant code:

* `godot-prototype/neutral_settlement.gd:25`, `layout(seed_value,count)`: deterministic slots and orientation.
* `godot-prototype/settlement_population.gd:46`, `tick()`: selection/rebuild scheduling.
* `godot-prototype/settlement_population.gd:58`, `build(request)`: residency, detail selection, grounding and budgeted construction.
* `godot-prototype/settlement_population.gd:100`: current single-mesh MultiMesh construction.
* `godot-prototype/data/foundation-settings.json`: existing residency, detail, proxy-scale and generation budgets.

1. Convert verified asset units to kilometres; for metre-based geometry the conversion is 0.001. Bake part transforms into at most three reusable building meshes and consolidate compatible materials. No runtime node per wall. Derive simplified detail representations if none are supplied and inspect their silhouettes.
2. Preserve the current slot seed, slot positions, angles and overall cluster footprint. Select assemblies with a separate deterministic hash of settlement/slot identity, without consuming the layout RNG. Use asset dimensions to fit existing slot envelopes; do not multiply metre-sized buildings directly by transforms designed for a unit-box house or indiscriminately distort proportions.
3. Extend `build()` narrowly for the selected Neapolis comparison mode: group existing slots by assembly into up to three MultiMeshes, with shared resources and the existing per-frame construction budget. Other settlements retain their current mesh path.
4. Keep existing geographic projection, elevation/land sampling, proxy scaling and shadow/detail conventions. Check foundation contact across each building footprint; never flatten terrain or move the settlement to hide a contact problem.
5. Include the selected asset version/comparison/detail state in rebuild/cache checks, so changing the view cannot reuse an incompatible node. Preserve expected parent metadata and label behaviour when the Neapolis container owns several MultiMesh children. Do not assume every existing consumer can accept that container without checking.
6. Reuse distance-based selection and Godot mesh LOD where practical, retaining the baseline at strategic distance if the imported silhouettes are not yet validated there. Document any representation switch and inspect transitions during motion.

## Verification once implementation exists

Capture baseline/candidate from one fixed run configuration, with exact camera position, basis, FOV, clipping planes, viewport, lighting and water time. Initial proposed focus is the approved Neapolis point. Proposed camera distances are 60 km strategic, 12 km regional and 1.5 km close, at 45 degrees pitch/0 yaw; validate framing on the baseline first and then lock all transforms. Include an oblique rotation and a repeated zoom sequence through detail thresholds.

Inspect terrain contact, silhouettes, building coherence, labels, political visibility, overlap, LOD transitions, upload stalls and motion. Check wider Italy and unchanged Roma/Catana controls. Proposed budgets are review targets, not measurements or automatic acceptance: no more than 150,000 candidate residential triangles at the close view and 32 MiB additional compressed texture allocation for the curated subset. Disclose overruns and actual surface/pass counts instead of hiding them behind pack-wide polygon figures.

Record:

| Measurement | Required evidence |
|---|---|
| Geometry | Unique mesh triangles and instanced/submitted triangles, by detail level |
| Textures | Actual imported formats, dimensions, mip levels, shared allocations and incremental memory |
| Draw submissions | Per-assembly surfaces, main/shadow/depth passes where observable, and total viewport submissions |
| CPU | Selection/build/upload CPU time plus frame-time median/p95/p99, separating warm movement from first load |
| GPU | Renderer-reported GPU timing with hardware, resolution and settings; do not substitute CPU submission intervals for GPU time |
| Regression | Exact geography/owner/research hashes, deterministic slot checks, unaffected settlement presentation and control screenshots |

Use relevant existing settlement/LOD native validators after checking their actual entry points, the existing automated suite (`npm.cmd test -- --reporter=dot --maxWorkers=4`), and targeted Neapolis tests for scope, baseline reversibility, metadata, deterministic placement and material/resource reuse. Passing tests does not establish historical or visual acceptance.

## This turn's result

Only this acquisition/implementation document was added. No campaign code, data or art was changed. Source-file inspection, actual geometry/memory/performance measurements, automated tests and matched before/after captures have **not** been performed: the licensed asset files are unavailable. Work stops at this gate as requested.
