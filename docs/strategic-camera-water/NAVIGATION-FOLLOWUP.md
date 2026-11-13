# Navigation follow-up — 9 November 2026

The earlier coverage guard reduced camera distance whenever the viewport approached
the map boundary. Panning towards Hispania or the far east therefore zoomed in
without wheel input, and overwrote the requested distance even after returning
to the centre.

The zoom limit is now independent of focus, orbit and aspect ratio. The existing
2,800 km ceiling still prevents the old extreme zoom-out; panning retains the
chosen scale. Focus bounds and zoom/pitch easing remain in place. At a coverage
edge the viewport can extend past the terrain instead of forcing a closer view.
This supersedes the location-dependent frustum limit in REPORT.md.

The native camera validation exercises west/east/centre traversal at 520, 1,700
and 2,800 km, four headings, and 4:3, 16:9 and 21:9 viewport shapes (144 checks),
alongside existing preset, wheel, orbit, zoom easing and settlement selection
checks. Results are written to `evidence/strategic-camera-navigation.json`.
