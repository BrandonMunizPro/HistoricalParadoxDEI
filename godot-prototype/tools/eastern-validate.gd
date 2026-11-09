extends SceneTree
func _initialize():call_deferred("run")
func run():
	Engine.max_fps=120
	var world=load("res://world.tscn").instantiate();root.add_child(world);world.capture_done=true
	var records=[]
	for region in ["levant","egypt"]:
		var surface=null
		for candidate in world.eastern_surfaces:
			if candidate.region==region:surface=candidate
		if surface==null:continue
		for geo in [Vector2(12.5,42.3),Vector2(14.2,37.6),Vector2(19.2,42.2),Vector2(22.4,38.2),Vector2(32.3,37.1),Vector2(33.9,35.1)]:assert(surface.weight(geo)==0.,"Completed region/Cyprus scope overlap")
		world.focus=Vector2(35.9,33.9) if region=="levant" else Vector2(32.65,25.75);world.goal_focus=world.focus;world.distance=65.;world.goal_distance=65.;world.queue_tiles()
		var start=Time.get_ticks_msec()
		for i in 30000:
			await process_frame
			if i>120 and world.is_settled():break
			assert(Time.get_ticks_msec()-start<180000,"Native readiness timeout")
		assert(world.is_settled() and surface.resident.size()>0 and surface.resident.size()<=24)
		var checked=0
		for id in surface.resident:
			var b=surface.resident[id].descriptor.bounds;var geo=Vector2((b.west+b.east)*.5,(b.south+b.north)*.5)
			if surface.weight(geo)<.01:continue
			var file=FileAccess.open("res://"+surface.resident[id].descriptor.mesh,FileAccess.READ);var count=file.get_32();file.seek(8+(64*129+64)*12+4);var h=file.get_float()
			assert(abs(surface.elevation(geo,0.)-h)<.0003,"Label/terrain mismatch "+id)
			file.seek(8+count*40+(64*129+64)*16);var parent=file.get_float();assert(abs(parent-surface.sample_height(geo))<.0003,"Morph parent mismatch "+id);checked+=1
		if region=="levant":
			assert(surface.sample_height(Vector2(35.5,32.1),true)<0.,"Jordan depression flattened")
			assert(not surface.land_at(Vector2(35.5,31.5)),"Dead Sea missing")
			assert(not surface.land_at(Vector2(35.58,32.83)),"Galilee missing")
		else:
			assert(world.presentation.climate(32.8,27.5).b>.8,"Eastern Desert too wet")
			assert(world.presentation.climate(32.65,25.75).g>.3,"Nile corridor lost")
			assert(world.presentation.climate(31.,30.8).g>.6,"Delta plain lost")
			assert(world.presentation.climate(29.1667,25.5167).g>.3,"Researched Dakhla habitat lost")
			assert(surface.weight(Vector2(34.9,32.))==0.,"Egypt overlaps validated Levant")
		records.append({"region":region,"heightSamples":checked,"resident":surface.resident.size(),"readinessMs":Time.get_ticks_msec()-start})
	world.focus=Vector2(12.5,42.3);world.goal_focus=world.focus;world.distance=430.;world.goal_distance=430.;world.queue_tiles()
	for i in 30000:
		await process_frame
		if i>120 and world.is_settled():break
	assert(world.is_settled())
	for surface in world.eastern_surfaces:assert(surface.resident.is_empty() and surface.pending.is_empty())
	FileAccess.open("res://evidence/eastern-expansion/native-validation.json",FileAccess.WRITE).store_string(JSON.stringify({"regions":records,"completedRegionScopeZero":true,"sourceDepressionPreserved":true,"heightAndMorphAlignment":true,"residencyBoundedAndReleased":true},"  "))
	print("EASTERN_NATIVE_OK ",JSON.stringify(records));world.queue_free()
	for i in 10:await process_frame
	quit()
