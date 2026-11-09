extends SceneTree
func _initialize():call_deferred("run")
func run():
	Engine.max_fps=120
	var world=load("res://world.tscn").instantiate();root.add_child(world);world.capture_done=true
	var records=[];var regions=[]
	for surface in world.eastern_surfaces:
		if surface.region.begins_with("africa_"):regions.append(surface)
	assert(not regions.is_empty())
	var controls=[Vector2(12.5,42.3),Vector2(14.2,37.6),Vector2(19.2,42.2),Vector2(22.4,38.2),Vector2(32.3,37.1),Vector2(31.1,29.8),Vector2(36.,34.),Vector2(-5.,37.),Vector2(40.,23.)]
	for surface in regions:
		for point in controls:assert(surface.weight(point)==0.,"Africa overlaps preserved region "+surface.region+" "+str(point))
		var chosen=null
		for d in surface.manifest.details:
			var b=d.bounds;var point=Vector2((b.west+b.east)*.5,(b.south+b.north)*.5)
			if surface.weight(point)>.99 and surface.land_at(point):chosen=point;break
		assert(chosen!=null)
		world.focus=chosen;world.goal_focus=chosen;world.distance=65.;world.goal_distance=65.;world.queue_tiles()
		var start=Time.get_ticks_msec()
		for i in 30000:
			await process_frame
			if i>120 and world.is_settled():break
			if Time.get_ticks_msec()-start>180000:push_error("Africa readiness timeout");quit(1);return
		assert(world.is_settled() and surface.resident.size()>0 and surface.resident.size()<=24)
		var checked=0
		for entry in surface.resident.values():
			var b=entry.descriptor.bounds;var point=Vector2((b.west+b.east)*.5,(b.south+b.north)*.5)
			if surface.weight(point)<.01:continue
			var file=FileAccess.open("res://"+entry.descriptor.mesh,FileAccess.READ);var count=file.get_32();file.seek(8+(64*129+64)*12+4);var height=file.get_float()
			assert(abs(surface.elevation(point,0.)-height)<.0003,"Africa label/mesh mismatch")
			file.seek(8+count*40+(64*129+64)*16);assert(abs(file.get_float()-surface.sample_height(point))<.0003,"Africa parent/morph mismatch");checked+=1
		records.append({"region":surface.region,"heightSamples":checked,"closeTiles":surface.resident.size(),"readinessMs":Time.get_ticks_msec()-start})
	world.focus=Vector2(12.,25.);world.goal_focus=world.focus;world.distance=8500.;world.goal_distance=8500.;world.queue_tiles()
	for i in 30000:
		await process_frame
		if i>120 and world.is_settled():break
	assert(world.is_settled())
	for surface in regions:assert(surface.node.visible and surface.resident.is_empty())
	FileAccess.open("res://evidence/africa-expansion/native.json",FileAccess.WRITE).store_string(JSON.stringify({"passed":true,"regions":records,"preservedRegionsExcluded":true,"backdropsAtWorldZoom":true,"closeTilesReleased":true},"  "))
	print("AFRICA_NATIVE_OK ",JSON.stringify(records));world.queue_free()
	for i in 10:await process_frame
	quit()
