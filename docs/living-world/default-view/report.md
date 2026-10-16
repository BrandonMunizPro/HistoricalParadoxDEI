# Default campaign visibility follow-up

## Diagnosis before editing

Both running frontends were inspected on a fresh browser page: development at `http://127.0.0.1:5173` and production preview at `http://127.0.0.1:4173`. Both loaded the previous implementation and reported 35 selectable sites and 660 available research references. Both actually rendered **zero research buttons, zero birds and zero cloud-shadow strength** on launch. The atmosphere checkbox was on, but the distance gates disabled its effects. This was primarily a default presentation failure, not a missing research export or a second renderer.

Evidence: [development baseline](default-before-5173.png), [production baseline](default-before-4173.png), and their accompanying JSON diagnostics.

The code paths are:

- `scripts/build-research-markers.mjs` discovers all ten research batches and generates `public/data/research-locations.json` (687 raw references). `map/research-layer.js` fetches this file, suppresses the twelve promoted representations, then calls `researchLocations` in `src/presentation/research-markers.ts`. Missing/out-of-bounds coordinates and exact repeated representations leave 660 research locations. No research or export files were changed in this follow-up.
- Previously, `index.html` left the research checkbox unchecked and `map/research-layer.js` independently initialized `enabled = false`. All 660 projected coordinate objects existed, but marker buttons were created only after enabling the layer or selecting a research search result.
- The old layer used 64-pixel clusters capped at 180 buttons, with at most twelve names and only below 700 km. The cap could omit sparse groups. Research was not a default visible population of the map.
- `index.html` loads `map/main.js`. That module loads `regional-material.js`, `terrain-tiles.js`, `inland-water.js`, `research-layer.js` and `living-world.js`; the render loop updates them. The improved water gradient, source coast masks and mild relief shader were active, but distant framing hid much of their visual benefit.
- Startup called `navigateWorld('world', false)`: the default camera was approximately **13,199 km** away, showing the entire curved rendering envelope. The old atmosphere disabled cloud shadows above 3,500 km and birds above 16 km. It implemented cloud shadows only, not cloud formations.

The implementation order was: enable and expose historical places; frame the Mediterranean; make atmosphere legible at that scale; validate the actual untouched startup view and preserve selection/navigation behavior.

## Implemented

- Historical locations are **on by default**. Layer controls, a legend, and the count of visible locations appear near the top of the sidebar.
- All 660 geographic anchors enter the render layer. Every unobstructed on-screen coordinate is plotted in a single SVG path. Accessible buttons group nearby coordinates; cell size expands when necessary instead of silently dropping groups. There are at most 180 buttons, updated at 150 ms intervals, and at most 36 collision-managed names at campaign scale. Screen/UI occlusion still applies; off-screen locations appear when panning.
- Research symbols use a pale green palette distinct from the existing gold approved sites. Existing settlement hit areas have priority. The 35 original/approved sites retain IDs, selection, map modes and established behavior.
- Clicking a group opens its names directly on the map. A location can be inspected without search; a separate action zooms to the group. Co-located references remain individually accessible. Group display names use alphabetical order, not invented historical importance.
- Startup now uses a Mediterranean preset at 5,200 km, making coastlines, rivers, relief and the historical location network readable. The full rendering envelope remains accessible through Home and the world preset. This change does not narrow geographic coverage.
- Eight lightweight, translucent cloud sprites share one generated texture and material; seven are visible in the 1440 × 1000 opening capture. Broad cloud shadows remain active at campaign scale with a maximum 10% darkening. Clouds add no opaque mask and never change terrain/water classification.
- Twelve birds in three flocks remain one reused line buffer with updates capped at 30 Hz. At campaign scale they are approximately 6.4-pixel atmospheric accents. This is deliberate symbolic scaling for readability, not a claim that their rendered world dimensions are physical bird sizes. Birds disappear at full-envelope distances and unsuitable local habitat. Clouds fade out for close inspection. The toggle and reduced-motion preference stop atmospheric effects.
- Directional relief contrast is stronger. Terrain height, source geography, simulation, research, and the rendering architecture are unchanged. No dependencies were added.

## Actual default-view evidence

The primary acceptance screenshot was taken from a fresh **production** page without changing camera position, entering search, selecting a site or toggling a layer:

- [Default campaign, 1440 × 1000](default-after.png): **501 plotted reference coordinates, 113 clickable groups, 36 names, seven clouds and twelve small birds**. Existing gold markers and Roma remain visible.
- [Default campaign, 1366 × 768](default-laptop.png): **502 plotted references, 29 names, eight clouds and twelve birds**. Differences come from viewport proportions and occlusion.
- [Same default view five seconds later](default-motion.png).
- [Atmosphere disabled at the same camera](default-atmosphere-off.png). The automated comparison found 5,365 unobstructed map pixels changing by at least 12/255 in a color channel (0.66% of the sampled map rectangle), in addition to the runtime motion checks. This comparison includes shadows, clouds, birds and water animation; it is not an isolated measurement of each effect.
- [Direct map location chooser](default-map-location-list.png).

The default and laptop screenshots were visually inspected. Historical locations and labels, cloud patches and stronger terrain relief are clearly apparent compared with the baseline. Birds are deliberately small; their white silhouettes are visible around the central Mediterranean, with motion easier to perceive in the running view than in a still image.

`validation.json` records the served production entry path and SHA-256 and verifies that its response bytes equal the current local build. The verified bundle is `/assets/index-CE9pTKDa.js`; this is stronger evidence than merely detecting a new DOM control.

## Validation and performance

- `npm run validate`: **34 test files, 475 tests passed**, typecheck, ESLint, simulation build and smoke checks passed. The test count increases because existing navigation tests enumerate the additional preset.
- `npm run map:build`: passed. The main chunk remains above Vite's 500 kB warning threshold (approximately 713 kB minified); no new dependency accounts for that existing warning.
- `node scripts/verify-default-campaign.mjs`: passed. It asserts default visibility, every plotted reference's membership in an interactive group, bounded names/buttons, direct inspection without search, no simulation mutation, effect toggles, reduced motion, a visible pixel difference and the served bundle hash. No browser/shader/loading errors were reported.
- Existing settlement verifier: all **35 sites physically selected** with research enabled at startup; empty registry still preserves the original 23; no changes to political control, architecture or building counts. See `selection/validation.json`.
- Existing camera verifier: all **nine assertions passed**. See `controls/camera-controls.json`.
- Existing world verifier passed full-envelope coverage, eight regional/world views, 700/1,000-marker synthetic checks and local navigation, with no browser errors. See `world-regression/`.
- [Preservation hashes](preservation.json): **417 files unchanged**, covering protected catalogs, registries and geographic assets plus the research export.

Short default-view production samples on the existing desktop environment averaged **142.9 FPS with atmosphere / 142.4 FPS without**, with a **7.1 ms p95 frame** in both cases. Atmosphere adds nine draw calls (119 versus 110); sampled JS heap was approximately 270 MiB versus 259 MiB. These refresh-limited samples do not establish lower-end hardware performance, and JS heap excludes GPU memory. Research markers remain enabled in both measurements.

An initial lint failure in the new verifier was resolved by explicitly importing `URL` from `node:url`; final validation passes.

## Exact changed files in this follow-up

Modified:

```text
index.html
map/main.js
map/research-layer.js
map/living-world.js
map/regional-material.js
map/style.css
src/presentation/world-navigation.ts
scripts/verify-world-map.mjs
eslint.config.js
```

Created: `scripts/verify-default-campaign.mjs`, this report, and the screenshot/JSON evidence under `docs/living-world/default-view/` enumerated in `files.json`. `verify-world-map.mjs` now explicitly selects the world preset before its existing full-envelope checks; those checks no longer assume the launch preset is the full envelope.

The older `docs/living-world/implementation-report.md` and `files.json` describe the preceding implementation. This report supersedes their statements about default visibility and atmosphere. All work remains uncommitted; unrelated changes were retained.

## Still incomplete / intentionally bounded

- All 660 research anchors are available, but they cannot all be individually labeled in one Mediterranean frame. Off-screen/UI-covered locations require panning; dense areas use groups. Their uncertainty remains visible and they are not newly playable settlements.
- This is a presentation follow-up, not new terrain reconstruction. Modern coastlines/reservoirs, coarse close-view terrain outside detail areas, estimated lake datums and the previously isolated local Nile window seam remain limitations.
- Clouds are lightweight formations with independent broad shadows, not simulated volumetric weather. Birds are small ambient symbols at campaign scale. Neither effect is intended to dominate the strategic map.
- The proof covers local development and production-preview URLs. An already-open tab must reload; an independently hosted copy requires the rebuilt `dist-map` assets to be deployed. No remote deployment was performed.
