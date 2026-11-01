extends "res://tools/reset-profile.gd"
func draw():RenderingServer.force_draw(true)
func run():
	for arg in OS.get_cmdline_user_args():
		if arg.begins_with("--output="):output=arg.trim_prefix("--output=")
	DirAccess.make_dir_recursive_absolute(ProjectSettings.globalize_path(output))
	RenderingServer.render_loop_enabled=false;process_frame.connect(draw)
	var begin=Time.get_ticks_usec()
	world=load("res://world.tscn").instantiate();root.add_child(world);world.capture_done=true
	var scene_ms=(Time.get_ticks_usec()-begin)/1000.
	Engine.max_fps=0;DisplayServer.window_set_vsync_mode(DisplayServer.VSYNC_DISABLED)
	world.focus=Vector2(12.67,41.73);world.goal_focus=world.focus;world.distance=1.2;world.goal_distance=1.2;world.pitch=38.;world.yaw=0.;world.queue_tiles()
	var samples=[];var previous=Time.get_ticks_usec();var start=previous
	for i in 30000:
		await process_frame
		var now=Time.get_ticks_usec();samples.append((now-previous)/1000.);previous=now
		if i>=120 and world.is_settled():break
	assert(world.is_settled())
	FileAccess.open(output+"/load.json",FileAccess.WRITE).store_string(JSON.stringify({"sceneInstantiationMs":scene_ms,"firstResidencyMs":(Time.get_ticks_usec()-start)/1000.,"firstFrames":statistics(samples),"frameSamplesMs":samples,"engineVideoMemoryBytes":RenderingServer.get_rendering_info(RenderingServer.RENDERING_INFO_VIDEO_MEM_USED),"engineStaticMemoryBytes":OS.get_static_memory_usage(),"method":"Scene creation and first Aricia residency with warm disk/driver caches, uncapped forced submissions. Not a cold-start test; includes existing world initialization/streaming, not just vegetation."},"  "))
	world.queue_free()
	for i in 10:await process_frame
	quit()
