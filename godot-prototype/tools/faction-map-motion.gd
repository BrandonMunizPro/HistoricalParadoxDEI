extends "res://tools/map-repair-validate.gd"
func run():
	directory="res://evidence/factions-20261030/motion"
	for arg in OS.get_cmdline_user_args():
		if arg.begins_with("--output="):directory=arg.trim_prefix("--output=")
	DirAccess.make_dir_recursive_absolute(ProjectSettings.globalize_path(directory))
	RenderingServer.render_loop_enabled=false;process_frame.connect(draw)
	world=load("res://world.tscn").instantiate();root.add_child(world);world.capture_done=true
	Engine.max_fps=0;DisplayServer.window_set_vsync_mode(DisplayServer.VSYNC_DISABLED)
	await pose(180.,Vector2(12.5,41.7),0.,60.)
	var samples=[];var previous=Time.get_ticks_usec();var smooth=true;var observed=[]
	for step in 360:
		var phase=float(step)/359.;var sweep=sin(phase*PI)
		world.distance=59.3+1640.7*sweep;world.goal_distance=world.distance
		world.focus=Vector2(12.5+1.5*sin(phase*TAU),41.7+.5*sin(phase*TAU));world.goal_focus=world.focus
		world.yaw=phase*90.;world.comparison_camera={}
		await process_frame
		var now=Time.get_ticks_usec();samples.append((now-previous)/1000.);previous=now
		var expected=smoothstep(60.,180.,world.distance)
		smooth=smooth and abs(world.political_map.blend-expected)<.0001
		if step%60==0:observed.append({"distanceKm":world.distance,"blend":world.political_map.blend,"yaw":world.yaw})
	check("Political transition follows continuous distance blend while zooming, panning and rotating both directions",smooth,{"samples":observed})
	check("Returning below threshold restores geographic presentation",world.political_map.blend<.001)
	FileAccess.open(directory+"/performance.json",FileAccess.WRITE).store_string(JSON.stringify({"method":"360 uncapped moving-camera submitted wall intervals; includes streaming, existing UI and new faction overlay; not sustained scan-out","frames":statistics(samples),"frameSamplesMs":samples,"engineVideoMemoryBytes":RenderingServer.get_rendering_info(RenderingServer.RENDERING_INFO_VIDEO_MEM_USED),"engineStaticMemoryBytes":OS.get_static_memory_usage()},"  "))
	for i in 20000:
		await process_frame
		if i>90 and world.is_settled():break
	world.queue_free()
	for i in 10:await process_frame
	print("FACTION_MAP_MOTION_OK")
	quit()
