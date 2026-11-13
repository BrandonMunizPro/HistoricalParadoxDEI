# Campaign command interface

The current asset-backed fidelity pass and licensed Pyrrhus sculpture integration
are documented in [FIDELITY-PASS.md](FIDELITY-PASS.md), with
[actual screenshots and reference comparison](FIDELITY-REVIEW.html).

The current ivory-marble redesign follows the approved art direction. See
[visual review](MARBLE-REVIEW.html) and [redesign implementation](MARBLE-REDESIGN.md).
The original bronze interface notes below describe the preceding iteration.

Implemented in the production Godot campaign (`world.tscn`). The separate web
geography atlas is unchanged. No framework, dependencies or external artwork added.

## Shared design system

`ui/campaign_theme.gd` defines charcoal #181b19, stone #252824, bronze #8d7147,
weathered gold #ddc38b, parchment #e9e1cf, muted text #b5b4a4 and crimson #713c32.
Body type uses Segoe UI with DejaVu Sans fallback; historical headings use
Palatino/Georgia with DejaVu Serif fallback. Body is 17px, headings 30px, status
13px. Spacing uses 8/12/16/20/28px; frames have square corners, a heavier upper
edge, thin bronze rules and layered dark shadows. Procedural stone grain uses
`ui/stone.gdshader`. Eleven original SVG line icons share a gold stroke. Panels
slide and fade over 160ms; session settings can disable UI motion.

## Components and integration

- `CampaignUI` owns UI state only: one primary panel, current tab, modal and
  focus return target. It constructs the HUD, side-panel shell, modal shell,
  campaign menu, settlement panel and reusable sections/buttons.
- `world.gd` initializes the controller and forwards existing site selection.
  The existing `select_site`, `jump`, water-animation and reference-marker
  methods remain the action boundary. Map keyboard polling respects UI focus;
  modal input blocks camera events. Marker bounds now use the current viewport
  and panel rectangle instead of the old fixed 1920px exclusions.
- All eight management areas have functional tabs. Geographic province presets,
  searchable approved settlements and record counts use existing data. Diplomacy,
  decisions and the campaign notice use centered modal shells. No historical
  events or gameplay results are invented.
- Save, Load, New Campaign and Exit are explicitly disabled. Continue closes the
  menu. Settings offer session-only reduced UI motion, animated water and existing
  research-marker visibility. OS window controls remain available for quitting.
- Settlement details contain canonical name, coordinates, ID, sources and any
  available region/notes. Ownership, garrison, population, buildings, culture and
  trade are reserved sections. No political control is assigned.

Native controls provide keyboard navigation and focus indications. Modal Tab and
Shift+Tab wrap within enabled controls; Escape closes the modal before the panel,
and restores focus. Ordinary management content scrolls vertically; the HUD
scrolls horizontally when its complete labels cannot fit. Pointer blocking uses
Godot's GUI event routing, leaving the uncovered map interactive.

## Verification

Run `Godot --path godot-prototype --script res://tools/campaign-ui-validate.gd`.
The native integration runner exercises every management navigation item and tab,
settlement selection/canonical camera focus, search and empty state, disabled menu
entries, modal Tab/focus restoration, Escape order, camera blocking and release,
and a smaller viewport. It writes evidence under `evidence/campaign-ui/`.
The runner also checks that interrupting a panel entrance with a modal cannot
leave the panel faded out. The final native run passes with no script errors.

Desktop (1920×1080), smaller window (1000×700), and smaller-window settings-modal
screenshots were captured and inspected. Terrain and existing markers render in
these views. This is representative interaction coverage, not screen-reader
certification or testing every geographic view. GPU performance is not benchmarked.

TypeScript checking, application build and all 514 existing tests pass
(`vitest run --maxWorkers=2 --testTimeout=30000`). Godot import and script parsing
also completed. Existing raw-image export warnings remain; a first integration
test shutdown also reported renderer resource leaks while terrain work was active.
The final bounded cleanup run has no renderer errors.
No export build or save/load behavior is claimed. Protected datasets, settlement
and political research, simulations and terrain shaders were not edited.
