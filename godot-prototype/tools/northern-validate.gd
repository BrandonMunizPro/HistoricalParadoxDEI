extends SceneTree
func _initialize():call_deferred("run")
func run():
	Engine.max_fps=120
	var world=load("res://world.tscn").instantiate();root.add_child(world);world.capture_done=true;world.automation_input_locked=true
	var records=[];var regions=[]
	for surface in world.eastern_surfaces:
		if surface.region in ["gaul","britannia"]:regions.append(surface)
	assert(regions.size()==2)
	var controls=[Vector2(12.5,42.3),Vector2(14.2,37.6),Vector2(19.2,42.2),Vector2(22.4,38.2),Vector2(32.3,37.1),Vector2(31.1,29.8),Vector2(36,34),Vector2(-5,33),Vector2(22,32.1),Vector2(-3,40),Vector2(.1,42.65)]
	assert(world.alpine_surface.regional_replacement and not world.alpine_surface.node.visible)
	for surface in regions:
		if surface.region=="gaul":
			for alpine_point in [Vector2(7,45),Vector2(9,46),Vector2(7.7,47.7)]:assert(surface.weight(alpine_point)>.99)
	for surface in regions:
		for point in controls:assert(surface.weight(point)==0.,"Northern terrain overlaps preserved region "+str(point))
		var chosen=Vector2(2.8,45.2) if surface.region=="gaul" else Vector2(-4.8,57.2)
		assert(surface.weight(chosen)>.99 and surface.land_at(chosen))
		world.focus=chosen;world.goal_focus=chosen;world.distance=65.;world.goal_distance=65.;world.queue_tiles()
		var start=Time.get_ticks_msec()
		for i in 30000:
			await process_frame
			if i>120 and world.is_settled():break
			if Time.get_ticks_msec()-start>180000:push_error("Northern readiness timeout");quit(1);return
		assert(world.is_settled() and surface.resident.size()>0 and surface.resident.size()<=24)
		var checked=0
		for entry in surface.resident.values():
			var b=entry.descriptor.bounds;var point=Vector2((b.west+b.east)*.5,(b.south+b.north)*.5)
			if surface.weight(point)<.01:continue
			var file=FileAccess.open("res://"+entry.descriptor.mesh,FileAccess.READ);var count=file.get_32();file.seek(8+(64*129+64)*12+4);var height=file.get_float()
			assert(abs(surface.elevation(point,0.)-height)<.0003,"Northern label/mesh mismatch")
			file.seek(8+count*40+(64*129+64)*16);assert(abs(file.get_float()-surface.sample_height(point))<.0003,"Northern morph-parent mismatch");checked+=1
		assert(checked>0)
		records.append({"region":surface.region,"heightSamples":checked,"closeTiles":surface.resident.size(),"readinessMs":Time.get_ticks_msec()-start})
	for distance in [520.,1200.,2800.]:
		world.distance=distance;world.goal_distance=distance;world.queue_tiles()
		for i in 240:await process_frame
		for surface in regions:
			assert(surface.node.visible and surface.resident.is_empty() and surface.pending.is_empty())
			assert(surface.material.get_shader_parameter("camera_distance")==distance)
	var faction=world.read_json("data/factions/scenario-278.json")
	assert(faction.dateBce==278)
	FileAccess.open("res://evidence/northern-expansion/native.json",FileAccess.WRITE).store_string(JSON.stringify({"passed":true,"regions":records,"preservedRegionsExcluded":controls.size(),"backdropsAtProductionZoom":true,"closeTilesReleased":true},"  "))
	print("NORTHERN_NATIVE_OK ",JSON.stringify(records));world.queue_free()
	for i in 10:await process_frame
	quit()
