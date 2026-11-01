extends SceneTree
func _initialize():call_deferred("run")
func run():
	var world=load("res://world.tscn").instantiate();root.add_child(world)
	world.capture_done=true;world.focus=Vector2(12.491258174554883,41.8899769864849);world.goal_focus=world.focus;world.distance=1.2;world.goal_distance=1.2;world.queue_tiles()
	var begin=Time.get_ticks_msec()
	while not world.is_settled() and Time.get_ticks_msec()-begin<90000:await process_frame
	assert(world.is_settled());world.validate_geography();world.set_process(false)
	var roma=world.settlements.roma_visual;var candidate=roma.showcase
	assert(candidate!=null);assert(candidate.layout.size()==50)
	assert(roma.stats.archetypes==15);assert(world.resident.size()<=13)
	var signatures={}
	for b in candidate.layout:
		assert(not signatures.has(b.point));signatures[b.point]=true
		assert(ResourceLoader.exists(candidate.DIR+b.kind+".res"));assert(ResourceLoader.exists(candidate.DIR+b.kind+"-far.res"))
		var geo=world.unproject(roma.center+b.point);assert(world.is_land(geo.x,geo.y))
	var shared=world.base_material.get_shader_parameter("roma_showcase_ground")
	assert(is_equal_approx(shared.z,.210))
	# A changed terrain resident signature must invalidate cached heights before reuse.
	var cached_mesh=candidate.ground_mesh
	candidate.last_terrain="validation-invalidation-probe";roma.height_cache[Vector2(9,9)]=999.0
	var node=await candidate.create(1.2);world.add_child(node)
	assert(not roma.height_cache.has(Vector2(9,9)))
	assert(candidate.ground_mesh==cached_mesh);assert(candidate.geometry_cache.size()<=2)
	assert(node.get_meta("archetypes")==15)
	var data={"passed":true,"sites":world.sites.size(),"research":world.research.size(),"residentTiles":world.resident.size(),"authoredVisualRoles":15,"structures":candidate.layout.size(),"allCandidateAnchorsOnLand":true,"nearAndFarMeshesPresent":true,"heightCacheInvalidationVerified":true,"surfaceCacheReuseVerified":true,"surfaceCacheBound":2,"artisticAcceptance":"not established by validation","scope":"Roma-only flag; no simulation fields"}
	var output="res://evidence/roma-showcase-20261028/validation";DirAccess.make_dir_recursive_absolute(ProjectSettings.globalize_path(output));var file=FileAccess.open(output+"/precinct.json",FileAccess.WRITE);file.store_string(JSON.stringify(data,"  "));file.close()
	node.queue_free();print("SHOWCASE_VALIDATION_OK ",JSON.stringify(data));quit()
