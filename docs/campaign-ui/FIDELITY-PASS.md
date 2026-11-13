# Asset-backed visual fidelity pass

Both requests were implemented together: fidelity to the approved concept and
integration of licensed historical sculpture. The reference remains
`design-references/campaign-ui-concept.png`; it is not used as a map or UI overlay.

## Missing assets and their replacements

The previous implementation lacked sculptural corner ornaments, a dimensional
marble frame, a genuine bust, a photographic frieze, burgundy material and
substantial icons. Its procedural lines and geometric figures could not supply
the reference's visual depth. The live interface now uses:

- A locally stored, original raster marble frame with modeled cornices, Greek
  key carving, pilasters and mirrored winged griffin endcaps. Nine-part drawing
  preserves the ends while accommodating viewport width.
- A dark burgundy damask/painted-stone material, sampled without stretching its
  pattern, replacing the bright solid header and utility rail backgrounds.
- A real photograph of the ancient Pyrrhus portrait in Naples, by Marie-Lan
  Nguyen, CC BY 2.5. Its photographic background was extracted with the built-in
  image tool. The source image remains unmodified and its published checksum
  matches. The transparent derivative is fitted into the upper-left architectural
  frame and warm-toned at runtime; it has no input handling.
- Marie-Lan Nguyen's public-domain photograph of a Roman relief in the Louvre,
  cropped, toned and feathered into the header. It replaces the geometric stick
  figure frieze. Its later date and decorative use are disclosed in credits.
- An original 12-cell antique bronze icon atlas replacing the thin outline icons.
  Navigation captions are separate controls, preventing icon/text overlap.
- Circular gold-edged crimson pull tabs with visible arrows, retaining separate
  header and HUD state, reduced motion and keyboard focus.

All images are local under `godot-prototype/ui/assets/`. Attribution appears in
Campaign menu → Artwork & licenses and in [ATTRIBUTION.md](../../godot-prototype/ui/assets/ATTRIBUTION.md).
The built-in image tool was used, with the exact [prompt set retained locally](../../godot-prototype/ui/assets/GENERATION-PROMPTS.md).

## Comparison and iteration

Actual game captures were made at **1672×941**, the reference image's dimensions,
as well as 1920×1080 and 1000×700. See [the visual review](FIDELITY-REVIEW.html).

The first captured asset integration showed overlapping icon captions, hidden
tab arrows and stretched material sampling. Those were corrected and the game
was recaptured. The final header uses an 84px burgundy banner over a 48px marble
register, with title positions adjusted against the reference. HUD content begins
after the architectural endcap rather than at the viewport edge. Burgundy color,
marble material, shadows, typography, icons and framing were reviewed directly
against the concept, rather than treating the build result as visual acceptance.

The geographic register contains only the actual 35 approved sites and 687
reference records. The concept's fictional resource counters are not implemented.
The left rail contains supported camera presets and research-marker visibility,
not new game systems or duplicates of the bottom management navigation.

## Scope and changed files

- `ui/asset_frame.gd`: reusable image-backed header, HUD, windows, rail and pull tabs.
- `ui/relief.gdshader`: non-interactive frieze masking and color treatment.
- `ui/campaign_ui.gd`: asset integration, responsive positions, captions and credits.
- `ui/campaign_theme.gd`: restrained palette and icon atlas access.
- `ui/assets/`: six local images including the two original licensed photographs;
  attribution, generation prompts and hashed asset manifest.
- `tools/campaign-ui-assets-validate.mjs`: source checksum, transparency, provenance
  and image-resolution checks.
- `tools/campaign-ui-validate.gd`: existing UI regressions plus decorative input
  exclusion, credits availability and exact-reference-size capture.
- `docs/campaign-ui/`: review page and delivery notes.

`world.gd` was not edited during this pass. Geography, camera algorithms, terrain,
political colors, markers, coordinates, research datasets and simulation data were
not changed. Existing management panels, tabs, settlement selection, modal focus,
Escape, scrolling, settings and independent collapse behavior are retained.

## Verification

- Application type checks and build pass.
- All **514 existing tests across 37 files** pass.
- Native UI integration reports **PASS**, including independent collapse/expand,
  rapid toggle interruption, real pull-tab pointer routing, scrolling, resized
  icon bounds, panel/tab actions, canonical selection, camera blocking, modal focus
  trapping/restoration and enabled/disabled menu actions.
- Asset verification and targeted JavaScript lint pass. Both cutouts have real
  transparency; the original Pyrrhus source matches Commons' SHA-1 checksum.
- Final game logs contain no script or renderer errors. Existing renderer warnings
  about loading some unrelated raw images for export remain.

## Remaining differences

This is substantially closer in material and composition; it is not a pixel-exact
copy. The Pyrrhus portrait, relief scene and griffin carvings differ from the
concept's exact artworks. Fonts use installed classical serif faces with fallbacks.
The resource strip uses geographic facts instead of invented campaign statistics.
The real map's framing, terrain and political presentation are deliberately
unchanged. At smaller desktop widths the command bar scrolls. There is no claim
of an export build, sustained GPU benchmark or screen-reader certification.
