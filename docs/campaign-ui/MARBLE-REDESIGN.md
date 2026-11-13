# Ivory marble campaign interface

The approved reference is preserved at `design-references/campaign-ui-concept.png`.
It guides composition and materials; it is never used as a game texture or map.

## Implementation

- `godot-prototype/ui/campaign_theme.gd`: reusable ivory, parchment, crimson,
  bronze and gold tokens; classical font hierarchy; carved separators, focus
  rings, selected states and original line icons.
- `godot-prototype/ui/stone.gdshader`: procedural marble veins and fine grain.
  This material belongs exclusively to the interface.
- `godot-prototype/ui/carved_frame.gd`: reusable vector meander borders, corner
  lozenges, a laurel wreath and a restrained geometric procession relief.
- `godot-prototype/ui/campaign_ui.gd`: slim crimson header, continuous marble HUD
  with stacked icon/label navigation, independent pull-tab controls, parchment
  side panels and centered marble modal shell. The narrow crimson utility rail
  invokes only campaign overview and the existing research-marker toggle.
- `godot-prototype/world.gd`: marker exclusions consult the current UI rectangles
  so retracting either bar releases its map area. Rendering and camera algorithms
  are otherwise retained. Existing actions and canonical selection data remain
  the integration boundary.
- `godot-prototype/tools/campaign-ui-validate.gd`: native interaction regression
  checks and screenshots at 1920×1080 and 1000×700.

Top and bottom chrome have independent state and independent tweens. Each pull
tab remains available after its bar retracts. Hidden bars leave keyboard focus
on the visible pull tab. Reduced motion applies immediately. Resizing settles
the bars at their correct viewport edges and preserves both collapsed states.
Side panels expand into released vertical space; the scene camera is not resized,
reframed or replaced. The HUD scrolls horizontally on smaller desktop windows.

No resource counters, faction control, populations, military data, historical
events or simulation actions were introduced. Unsupported systems retain their
explicit placeholders. Existing search, management tabs, settlement details,
menu, session settings, focus trap and Escape behavior are preserved.

## Verification and review

Native verification writes its report and actual game captures to
`godot-prototype/evidence/campaign-ui-marble/`. The runner covers independent
collapse/expand combinations, rapid animation interruption, real pull-tab pointer
routing, released map space, scrolling, resized icon bounds, navigation and tabs,
canonical settlement focus, modal focus trapping/restoration and map input blocking.

Application type checking, build and all 514 existing tests pass. Raw-image export
warnings from the existing renderer remain. This work does not certify an exported
game, sustained performance, screen-reader behavior or every desktop resolution.

## Visual limits

The design uses original procedural stone and vector carvings. It does not contain
the reference's sculpted portrait busts, griffins or detailed figurative relief
artwork. Font appearance depends on available Palatino/Georgia fonts with DejaVu
fallbacks. The reference's fictional resource strip is deliberately omitted.
Map terrain, colors, political presentation, camera framing and marker content
remain those of the actual game, so the geographic scene differs from the concept.
