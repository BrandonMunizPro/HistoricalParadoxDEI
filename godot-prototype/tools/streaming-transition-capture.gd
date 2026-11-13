extends "res://tools/streaming-optimization-profile.gd"
## Qualitative capture pass, separate from performance measurements. Screenshot
## readback/encoding pauses rendering; timestamps disclose actual elapsed time.
func run():
	for arg in OS.get_cmdline_user_args():
		if arg.begins_with("--stage="):stage=arg.trim_prefix("--stage=")
	output="res://evidence/streaming-optimization/"+stage+"-transition"
	DirAccess.make_dir_recursive_absolute(ProjectSettings.globalize_path(output))
	RenderingServer.render_loop_enabled=false;process_frame.connect(draw)
	world=load("res://world.tscn").instantiate();root.add_child(world);world.capture_done=true;world.automation_input_locked=true
	Engine.max_fps=0;DisplayServer.window_set_vsync_mode(DisplayServer.VSYNC_DISABLED)
	world.scenery.cache_signature+="-capture-"+stage+"-"+str(Time.get_unix_time_from_system())
	world.focus=Vector2(2.3,46.6);world.goal_focus=world.focus;world.pitch=38.;world.yaw=0.;world.distance=300.;world.goal_distance=300.;world.queue_tiles()
	var start=Time.get_ticks_msec()
	while Time.get_ticks_msec()-start<2500:await process_frame
	start=Time.get_ticks_msec();var crossed=-1;var frames=[];var targets=[0,3000,10000]
	while frames.size()<targets.size():
		var elapsed=Time.get_ticks_msec()-start
		world.goal_distance=300.*pow(12./300.,min(1.,elapsed/6000.))
		await process_frame
		var now=Time.get_ticks_msec()
		if crossed<0 and world.distance<32.:crossed=now
		if crossed>=0 and now-crossed>=targets[frames.size()]:
			var filename="frame-%d.png"%frames.size()
			var ready=0
			for node in world.scenery.local_roots.values():
				if node.get_meta("ready",false):ready+=1
			frames.append({"file":filename,"afterThresholdMs":now-crossed,"distanceKm":world.distance,"readyLocalCells":ready,"centralReady":central_ready()})
			root.get_texture().get_image().save_png(output+"/"+filename)
	FileAccess.open(output+"/capture.json",FileAccess.WRITE).store_string(JSON.stringify({"stage":stage,"region":"gaul","method":"Separate qualitative capture pass. Empty placement cache; same camera trajectory. PNG readback pauses rendering, so these are not benchmark timings.","frames":frames},"  "))
	world.distance=3000.;world.goal_distance=3000.
	var cleanup=Time.get_ticks_msec()
	while world.scenery.busy and Time.get_ticks_msec()-cleanup<30000:await process_frame
	world.queue_free()
	for i in 4:await process_frame
	print("STREAMING_CAPTURE_DONE ",stage)
	quit()
