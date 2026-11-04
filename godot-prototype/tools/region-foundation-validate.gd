extends SceneTree
## Synthetic identity/membership fixtures only; no geographic assignments are saved.
func _initialize():
	var source=JSON.parse_string(FileAccess.get_file_as_string("res://data/geographic-regions/definitions.json"))
	var initial=JSON.parse_string(FileAccess.get_file_as_string("res://data/geographic-regions/initial-owners.json"))
	var factions=JSON.parse_string(FileAccess.get_file_as_string("res://data/factions/scenario-278.json")).factions
	var sites=JSON.parse_string(FileAccess.get_file_as_string("res://data/sites.json"))
	var model=load("res://geographic_regions.gd").new()
	assert(model.configure(source,initial,factions,sites))
	var fixture=source.duplicate(true);var region=fixture.regions[0]
	region.definitionStatus="approved";region.settlementIds=[sites[0].id,sites[1].id]
	region.controlCentre={"locationId":sites[0].locationId,"settlementId":sites[0].id}
	assert(model.configure(fixture,initial,factions,sites))
	assert(model.definitions[region.id].settlementIds.size()==2)
	var saved=model.export_state();assert(model.restore_state(saved))
	var bad=fixture.duplicate(true);bad.regions[1].definitionStatus="approved";bad.regions[1].settlementIds=[sites[0].id];bad.regions[1].controlCentre=region.controlCentre
	assert(not model.configure(bad,initial,factions,sites))
	assert(model.definitions[region.id].settlementIds.size()==2)
	bad=fixture.duplicate(true);bad.regions[0].controlCentre.locationId="unknown"
	assert(not model.configure(bad,initial,factions,sites))
	bad=fixture.duplicate(true);bad.regions[0].definitionStatus="requires_approval"
	assert(not model.configure(bad,initial,factions,sites))
	assert(model.export_state()==saved)
	print("REGION_FOUNDATION_OK multi-settlement membership; centre identity; duplicate membership rejection; approval gate; atomic restore")
	quit()
