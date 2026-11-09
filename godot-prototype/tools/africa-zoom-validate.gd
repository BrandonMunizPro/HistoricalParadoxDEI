extends SceneTree
func _initialize():call_deferred("run")
func run():
	Engine.max_fps=120
	var world=load("res://world.tscn").instantiate();root.add_child(world);world.capture_done=true
	var surfaces=[world.anatolia_surface];surfaces.append_array(world.eastern_surfaces)
	assert(surfaces.size()>=3)
	var results=[]
	for distance in [3290.,3310.,8500.,30000.]:
		world.focus=Vector2(29.,37.);world.goal_focus=world.focus;world.distance=distance;world.goal_distance=distance;world.queue_tiles()
		var start=Time.get_ticks_msec()
		for i in 30000:
			await process_frame
			if i>120 and world.is_settled():break
			if Time.get_ticks_msec()-start>120000:push_error("Zoom validation timed out");quit(1);return
		for surface in surfaces:
			assert(surface.node.visible,"Regional backdrop disappears at "+str(distance))
			assert(surface.resident.is_empty() and surface.pending.is_empty(),"Close terrain retained at world zoom")
			assert(surface.material.get_shader_parameter("camera_distance")==distance)
			assert(not surface.material.shader.code.contains("camera_distance>=3300."),"Shader still discards region at overview")
		results.append({"distanceKm":distance,"visibleRegionalBackdrops":surfaces.size(),"closeRegionalTiles":0})
	var code=world.base_material.shader.code
	assert(code.contains("if(anatolia_detail_enabled&&anatolia_scope(coast_geo)>.001)discard;"))
	for region in ["levant","egypt"]:assert(code.contains("if(%s_enabled&&%s_scope(coast_geo)>.001)discard;"%[region,region]))
	FileAccess.open("res://evidence/africa-expansion/zoom-native.json",FileAccess.WRITE).store_string(JSON.stringify({"passed":true,"views":results,"parentClippingHasNoDistanceCutoff":true},"  "))
	print("AFRICA_ZOOM_OK ",JSON.stringify(results));world.queue_free()
	for i in 10:await process_frame
	quit()
