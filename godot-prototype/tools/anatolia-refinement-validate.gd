extends SceneTree
func _initialize():call_deferred("run")
func run():
	Engine.max_fps=120
	var world=load("res://world.tscn").instantiate();root.add_child(world);world.capture_done=true
	world.focus=Vector2(33.,39.);world.goal_focus=world.focus;world.distance=1150.;world.goal_distance=1150.;world.queue_tiles()
	for i in 6000:
		await process_frame
		if i>120 and world.is_settled():break
	assert(world.is_settled())
	var identities=world.anatolia_identities;var factions=world.political_map.factions
	assert(identities.records.size()==7)
	assert(identities.by_id["rhodian-state"].factionId=="rhodes")
	assert(identities.by_id["pontic-kingdom"].factionId=="pontus")
	assert(identities.by_id["cappadocian-dynasts"].relation=="allegiance_uncertain")
	assert(identities.by_id["sidetan-polis"].relation=="control_unresolved_278")
	var lydia=identities.by_id["lydian-administration"]
	assert(identities.control_id(lydia)=="seleucids")
	var state=factions.regions.export_state();var geometry=JSON.stringify(factions.regions.definitions)
	var pixels=world.anatolia_surface.textures.region_ids.get_image().get_data()
	var region=factions.regions.legacy_ids["territory:seleucids"]
	assert(factions.set_region_owner(region,"rome"))
	assert(identities.control_id(lydia)=="rome" and lydia.name=="LYDIA")
	assert(identities.subtitle(lydia).contains("Rome"))
	assert(world.anatolia_surface.textures.region_ids.get_image().get_data()==pixels)
	assert(JSON.stringify(factions.regions.definitions)==geometry)
	assert(factions.restore_region_state(state))
	assert(identities.control_id(lydia)=="seleucids")
	var scenery=world.scenery;var id="global|32|37";var payload=scenery.read_cache(id)
	assert(payload!=null and payload.signature==scenery.cache_signature)
	assert(payload.batches.size()==28 and payload.plants>0 and payload.rocks>0)
	var again=scenery.read_cache(id)
	assert(var_to_bytes(payload)==var_to_bytes(again))
	var result={"identities":7,"identitySurvivesOwnerChange":true,"geometryUnchanged":true,"originalOwnersRestored":true,"uncertaintyDistinctFromConflict":true,"cacheSignature":scenery.cache_signature,"cacheReadDeterministic":true,"cachedVariants":payload.batches.size()}
	FileAccess.open("res://evidence/anatolia-refinement/identity-verification.json",FileAccess.WRITE).store_string(JSON.stringify(result,"  "))
	print("ANATOLIA_IDENTITIES_OK ",JSON.stringify(result))
	world.queue_free()
	for i in 10:await process_frame
	quit()
