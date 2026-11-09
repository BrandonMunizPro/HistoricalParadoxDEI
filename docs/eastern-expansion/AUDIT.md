# Regional geography audit, 5 November 2026

The regular scene uses `northern_italy_world.gd`. Older README checkpoints describe several superseded candidates; passing their validators does not establish current visual quality.

| Area/system | Implemented before this task | Observed or documented remaining work |
|---|---|---|
| Italy/Sicily | Bounded cartographic rollout, source coast masks, local lake beds, dedicated Italian terrain, deterministic vegetation | Stylized settlement/vegetation assets; shoreline and elevation source resolution limits |
| Alps | Dedicated source-derived terrain and rock treatment | Latest Anatolia report still defers Alpine snow; earlier README describes a snow candidate. Preserve implementation, do not equate either report with final acceptance |
| Illyria/Greece | Dedicated Balkans terrain, coast/lake masks, bounded close streaming | Source-limited close terrain; loading stalls documented in previous work |
| Anatolia | Continuous source mesh, streamed near terrain, source normals/horizon visibility, source coast/lake masks | Provisional political polygons, modern shoreline proxies, stylized vegetation; no changes authorized to identity/ownership data here |
| Levant | Coarse world mesh; generic global ecology, water and vegetation | Baseline Godot images show soft Lebanon relief, stepped coast and strategic political fill obscuring geography; negative terrain clamped above zero |
| Egypt/North Africa | Prior regional desert/alluvium shading, sparse scrub/palms/outcrops, Nile material | Explicitly coarse 2–19 km terrain; modern hydrology; no verified ancient Delta branches or agricultural boundaries |
| Water | Source river ribbons and triangulated lake polygons; separate ocean masks | WDBII subset has no Jordan or Orontes. Local Natural Earth has Jordan and Galilee, but no Orontes. River widths are presentation estimates |
| Vegetation | Existing assets, deterministic cells, caches, bounded residency, staged prefetch/dissolve | Geographic input changes must invalidate caches; existing asset style is retained |

Before evidence: `godot-prototype/evidence/eastern-expansion/before/`. Source snapshot: `audit-hashes.json`. The first baseline attempt had integer camera input errors; the corrected attempt produced the reviewed images, but its shared stderr log contains output from the abandoned process. Final runs use separate clean logs. No screenshot from the failed attempt is relied upon without a corrected camera record.

No canonical settlements, research, faction data, owner palettes, political polygons or gameplay systems are in the authorized edit scope. River/lake supplements are presentation derivatives with source provenance, separate from approved settlement research.
