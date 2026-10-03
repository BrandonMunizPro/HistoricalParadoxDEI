# Catalog Handoff — Rome II / DeI DB Extraction

Working area: `C:\Users\brand\HistoricalGame\research\rome2-dei`
Catalog output: `...\catalogs\` (6 JSON files). Source tables: `...\extracted\`. Tools/scripts: `...\tools\`.

## 1. Constraints and non-goals
- Read-only against Rome II and DeI install dirs; never edited/replaced any pack.
- No execution of assemblies/DB clients; nothing imported into the game.
- Battle POC not implemented. No Lua overrides. No runtime work.
- Inventory-based pack scans (`pfh_*` scripts) produced file lists only; RPFM did all structured decoding.

## 2. Pipeline (high level)
1. Inventory packs with `pfh_ls2.js` (`indexType`, file count, sum check) and `pfh_diag.js`.
   - Files: `data.pack` (PFH4, indexType=1), `terrain2.pack` (PFH4, indexType=1), DeI `*_part1/9/10.pack` (PFH4, indexType=3).
   - DeI part1 = 36,442 entries; terrain2 476 `terrain\battles\*` paths. See `dei1_list.txt`, `rome2_data_list.txt`, `rome2_terrain2_list.txt`.
2. Launch RPFM 5.1.0 (`rpfm_server.exe`, listens 127.0.0.1:45127); drive it through `/mcp`.
3. Deserialize DB tables to JSON:
   `set_game_selected(rome_2, rebuild_dependencies=false)` → `update_schemas` → `is_schema_loaded=true`
   → `open_packfiles(...)` → `open_pack_info` → `decode_packed_file(source:'PackFile')` per table path →
   zip row cells against `fields_processed(definition)` → normalized row objects → `*.json` per shard in `extracted/`, plus `_manifest.json`.
   Both DeI (`PackFile`) and vanilla (`PackFile` against `data.pack`) use the same path. Vanilla dependencies cache (`rebuild_dependencies=true`) is **avoidable** — it was the source of an earlier hard stall; do NOT enable it.
4. Compile the 6 catalogs from `extracted/_manifest.json` and each table JSON with FK/junction joins; write validation notes to `catalog_build_report.json`.

## 3. Key facts
- Normalized table JSON shape: `{ table_name, version, source_pack, fields:[...], row_count, rows:[ {field: value, ...} ] }`.
- Rows are aligned to `fields_processed(definition)`, i.e. split colour fields are merged; do NOT zip against the raw `definition.fields`.
- Manifest entries: `{pack, path, table_name, version, row_count, fields_count, out, guid}`; failures have `error`.

## 4. The six catalogs

### `dei_units.json`
- `meta` (notes/packs), reference rows arrays: `category_rows`, `class_rows`, `mounts`, `mount_variants`, `armour_types`, `shield_types`, `spacings`, `groupings_military`, `unit_abilities_rows`, `special_abilities_rows`, `attributes`, `attribute_groups`, `technology_unit_upgrades`, `unit_sets_rows`, `unit_set_members`.
- `unit_count`, `units:[...]`. Each unit: `key, source_pack, source_table, raw:{...}`, `main_unit` (row or null from `main_units_tables` via `land_unit`/`naval_unit`), `category` (row|null), `classRecord` (row|null), `mount` (row|null), `mount_variants`, `armour`, `shield`, `primary_melee_weapon`, `primary_missile_weapon`, `projectile`, `officers`, `spacing`, `attribute_group` (raw key|null), `abilities`, `military_groupings` ({`military_group`, `grouping`}), `exclusive_factions` (factions allowed), `faction_rebellion` (facts from rebellion junction), `custom_battle_permissions`, `variants`, `technology_upgrades`.

### `dei_factions.json`
- `factions:[{key, raw, groups:[{faction_group_key,row}], campaigns, civil_war_setups, banners, uniform_colours, rebellion_units, source_pack}]`, `faction_groups`, `campaigns`, `political_party_edges`, `rebellion_unit_edges`, `faction_count`.

### `dei_unit_relationships.json`
- `note`, then adjacing edge arrays verbatim: `unit_ability_edges`, `unit_military_group_edges`, `unit_exclusive_faction_edges`, `unit_custom_battle_edges`, `unit_faction_rebellion_edges`, `unit_variant_edges`, `unit_variant_colour_edges`, `unit_mounting_edges`, `unit_technology_upgrade_edges`, `unit_set_member_edges`, `building_allowed_unit_edges`, `armed_citizenry_unit_group_edges`.

### `rome2_battlefields.json`
- `battles:[{key, raw, battle_type, setup_limits_for_type, skys:[{sky_key,row}], derived_battle_terrain_links}]`, `battle_types`, `battle_type_setup_limits`, `climates_index`, `derived_battle_terrain_links`.

### `rome2_environments.json`
- Reference lookups + geographic layers: `climates`, `ground_types`, `campaign_ground_types`, `battle_climate_weather_descriptions`, `battle_weather_types`, `battle_weather_effects`, `battle_sky_types`, `seasons`, `sea_surfaces`, `terrain_tilesets`, `fort_underlay_climate_jct`, `regions`, `provinces` (region_to_province rows), `campaigns`, `campaign_map_regions`, `campaign_map_settlements`, `campaign_map_roads`, `campaign_map_attritions`, `region_groups`, `region_campaign_overrides`.

### `catalog_build_report.json`
- `source_tables_used`, `joins_performed[]`, `derived_relationships[]`, `unresolved_or_partial[]`, `counts`, `dangling[]`, `warnings[]`.

## 5. Known unresolved / validation notes (strictly preserved in-report)
- `land_units_tables.attribute_group` → `unit_attributes_groups_tables`: **0/4313 resolve**; `attribute_group` retained as raw key.
- `campaign_ground_types_tables.type` vs `ground_types_tables.type`: **0 matches**; treated as distinct namespaces; no auto-link.
- `land_units_tables.officers` → officers: 1302 dangling; `spacing`='animals' dangling; 66 mount misses; 5 units (mainly artillery/chariots/supply) without category/class.
- 7 vanilla tables fail decode ("no definition for this version / table empty"): `sea_climate_details`, `campaign_map_slots`, `campaign_map_towns_and_ports`, `battle_unit_permission_junctions`, `battle_sequences`, `small_vegetation_climates_jct`, `battle_type_faction_presets` — recorded as empty.
- `battles_tables.specification` paths (`terrain/battles/...`, `Script\...\*.xml`) are derived, non-authoritative links to assets still inside `terrain*.pack` / `data.pack` — NOT decoded.
- Historical battles (Cannae/Alesia) are schema references only; never selection logic.
- `unit_abilities_tables` has ~5 DeI placeholder rows; junction keys mostly resolve by key only (see report).

## 6. Regenerating later
```bash
node -v                                # requires Node 22+
# 1) Extract (fresh pack open + one-pass decode; pass --resume to skip table_names already complete)
node "C:\Users\brand\HistoricalGame\research\rome2-dei\tools\rpfm_extract.js" [--resume]
# 2) Inspect a table: schema + rows (uses decoded JSON in extracted/)
node "C:\Users\brand\HistoricalGame\research\rome2-dei\tools\inspect.js" all
node "C:\Users\brand\HistoricalGame\research\rome2-dei\tools\inspect.js" name <table_name>
node "C:\Users\brand\HistoricalGame\research\rome2-dei\tools\inspect.js" values <table_name> <column>
# 3) Compile the 6 catalogs from extracted/
node "C:\Users\brand\HistoricalGame\research\rome2-dei\tools\build_catalogs.js"
# 4) Sanity-check outputs
node "C:\Users\brand\HistoricalGame\research\rome2-dei\tools\check_built.js"
node "C:\Users\brand\HistoricalGame\research\rome2-dei\tools\check2.js"
```
Required server state: `rpfm_server.exe` is v5.1.0 (portable from `Frodo45127/rpfm`), kept **external** to the repository (e.g. `C:\tools\rpfm\`); do NOT bundle the binary. Start it once per extraction session — it is shared by all scripts above. Do not use `rpfm_server.exe --help/--version` for CLI work (the old stdio CLI was removed; only `/mcp` over `127.0.0.1:45127`). Never call `save_packfile`/`save_pack_as`/`save_*` or `delete_*` MCP tools.

## 7. Not done
- No battle POC, no TypeScript adapter, no runtime/Lua deployment, no UI.

If a future task needs exact field names per table, consult `extracted/_manifest.json` + each table JSON's `fields` (same schema as the rows) rather than re-running pack scans.
