extends SceneTree
func _initialize():call_deferred("run")
func run():
	Engine.max_fps=120
	var world=load("res://world.tscn").instantiate();root.add_child(world)
	world.capture_done=true;world.focus=Vector2(32.3,37.1);world.goal_focus=world.focus;world.distance=90.;world.goal_distance=90.;world.queue_tiles()
	for i in 6000:
		await process_frame
		if i>30 and world.is_settled():break
	var surface=world.anatolia_surface
	assert(surface!=null and surface.resident.size()>0 and surface.resident.size()<=24)
	var count=surface.resident.size()
	# A sampled mesh vertex and CPU label height must agree in the close terrain.
	for id in surface.resident:
		var d=surface.resident[id].descriptor;var b=d.bounds;var geo=Vector2((b.west+b.east)*.5,(b.south+b.north)*.5)
		if world.cartographic_rollout.anatolia_weight(geo)<.001:continue # Clipped-out padding is not displayed.
		var file=FileAccess.open("res://"+d.mesh,FileAccess.READ);file.seek(8+(64*129+64)*12+4);var height=file.get_float()
		assert(abs(surface.elevation(geo,0.)-height)<.0001,"Label/terrain height mismatch at "+id+": "+str(surface.elevation(geo,0.))+" versus "+str(height))
	world.focus=Vector2(12.5,42.3);world.goal_focus=world.focus;world.distance=430.;world.goal_distance=430.
	for i in 5:await process_frame
	assert(surface.resident.is_empty() and surface.pending.is_empty())
	# Finish/cancel asynchronous scenery and settlement work before teardown.
	for i in 6000:
		await process_frame
		if i>120 and world.is_settled():break
	assert(world.is_settled())
	FileAccess.open("res://evidence/anatolia-rollout/streaming-verification.json",FileAccess.WRITE).store_string(JSON.stringify({"closeTiles":count,"maximumAllowed":24,"heightAlignment":true,"releasedOnLeavingRegion":true},"  "))
	print("ANATOLIA_STREAMING_OK close tiles=",count,"; CPU label heights match mesh; tiles released outside region")
	world.queue_free()
	for i in 10:await process_frame
	quit()
