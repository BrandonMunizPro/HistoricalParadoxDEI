# Regional cartography rollout

User direction: keep the accepted Godot style and improve the regular map one area at a time. Complete Italy and Sicily first; Illyria and Greece follow. This queue is a work plan, not permission to modify every region in one pass.

## Working agreement

- One active regional batch. Split it into smaller geographic passes when needed; finish its review artifacts before moving on. Illyria and mainland Greece form the current user-requested batch.
- Work in the normal campaign instance. An isolated screenshot harness supplies evidence, not a second product version.
- Carry forward the existing style: visible relief, restrained political replacement, clean borders and shore clipping, readable settlements, screen-facing faction emblems.
- Preserve approved settlement coordinates, research records and stable identities. Review documented corrections separately. Never generate arbitrary political boundaries or capitals to fill a quota.
- Political geometry, ownership and visual work-area masks remain distinct. Presentation masks never determine settlement membership or sovereignty.
- Do not introduce conquest, combat, siege, garrison, messenger, military AI or other gameplay systems as part of this rollout.
- Avoid unrelated global tuning. A regional fix must keep its scope explicit and maintain working views outside the wave.

## Sequence

| Wave | Area | Smaller passes | Status |
|---|---|---|---|
| 01 | Italy and Sicily | North/Po/Alps; central peninsula/Apennines; south/Apulia/Calabria; Sicily | Visual coverage implemented; expanded screenshots ready for review. Historical subdivisions still pending. |
| 02 | Illyria | Eastern Adriatic coast; islands; inland barriers; Epirus interface | Current requested batch with Greece |
| 03 | Greece | Macedonia/Thessaly; central Greece; Peloponnese | Current requested batch with Illyria |
| 04 | Aegean | Crete; island chains; western Anatolian coast | Queued |
| 05 | Thrace and Danube | Thrace; lower Danube; western Black Sea | Queued |
| 06 | Anatolia and Caucasus | Anatolian interior; Armenia; Caucasus | Queued |
| 07 | Levant | Syria; Phoenicia/Judaea; Cyprus | Queued |
| 08 | Nile and Cyrenaica | Delta/Nile; Cyrenaica; Nubia/Kush | Queued |
| 09 | Punic Africa and western islands | Punic Africa; Numidia/Mauretania; Sardinia/Corsica; smaller central Mediterranean islands | Queued |
| 10 | Iberia | Mediterranean coast; Atlantic coast; interior; Balearics | Queued |
| 11 | Gaul | Southern coast; interior; western Alpine approaches | Queued |
| 12 | Britain and Ireland | Southern Britain; northern Britain; Ireland | Queued |
| 13 | Inner Europe | Germania; central Europe; eastern Alpine approaches | Queued |
| 14 | Pontic steppe | Crimea/Bosporus; northern Black Sea; steppe | Queued |
| 15 | Mesopotamia | Upper Mesopotamia; Babylonia | Queued |
| 16 | Iran and Arabia | Iranian plateau; north Arabia; south Arabia/Gulf | Queued |
| 17 | Central Asia | Bactria; Sogdiana/Margiana; Chorasmia | Queued |
| 18 | Indus frontier | Gandhara; Indus valley; Mauryan frontier | Queued |

These are presentation/research work areas, not new administrative or political divisions. Later queue order can be adjusted without rewriting the map. Large waves are explicitly broken into separate sessions rather than worked worldwide at once.

## Repeatable pass

1. **Inspect:** source geometry and dates, current owner lookup, approved settlements, terrain/water masks, camera presets and previous issues. Reuse the existing audit; research only new or unresolved claims.
2. **Capture baseline:** strategic, regional and close/oblique cameras. Include a difficult coast/barrier and an adjoining completed area.
3. **Correct foundations:** document confirmed errors, retain uncertain history as provisional, and seek approval for unsupported boundary/centre changes. Reuse existing region IDs and palette architecture.
4. **Polish within scope:** relief visibility, texture noise, source-aligned water/coasts, high-resolution identity rasterization, identity-based antialiased borders, label/emblem hierarchy. No new art direction.
5. **Verify:** exact matched cameras; owner-change isolation; unchanged source hashes; native validation; existing test suite; normal campaign startup. Inspect images manually and record performance changes.
6. **Deliver:** update the wave report and side-by-side review; distinguish implemented improvements, unresolved historical geography, visual issues and rendering cost. Stop at the review boundary.

## Review gate

Passing tests alone is insufficient. The images must visibly improve the active area, owner changes must remain localized, existing views must remain usable, and performance changes must be disclosed. Approval of visual style does not silently approve historical borders, capitals or dependent settlements. No later wave activates merely because it appears in this plan.

## Current entry points

- Normal campaign: `godot-prototype/world.tscn` and the existing `run.ps1` launcher.
- Work-area/style settings: `godot-prototype/data/cartographic-rollout.json`.
- Shared scope helper: `godot-prototype/cartography_rollout.gd`.
- Italy review: `docs/map-rollout/REVIEW.html` and `ITALY-SICILY.md`.
- Previous identity foundation and pending geography: `docs/geographic-foundation/REPORT.md` and `REGION-REVIEW.md`.

Next-session instruction: **Continue Wave 02, Illyria, using this plan and the accepted Italy/Sicily visual reference. Capture its baseline before making changes.** Greece remains Wave 03; do not combine the whole eastern Mediterranean into that session.

Alpine follow-up to Wave 01: sourced crest detail and high-elevation snow are now integrated. See [Alpine comparison](../alpine-correction/REVIEW.html) and [findings/limitations](../alpine-correction/REPORT.md). Illyria and Greece remain next in the queue.


Alpine snow appearance is deferred at the user's request. Its existing assets and surface treatment are unchanged by this batch.
