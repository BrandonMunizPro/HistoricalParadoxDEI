extends "res://tools/reset-profile.gd"
## Matched before/after camera and performance capture, including an inspection view.
func run():
	RenderingServer.render_loop_enabled=false
	process_frame.connect(force_render)
	var enabled=OS.get_cmdline_user_args().has("--roma-showcase")
	var stage="after" if enabled else "before"
	output="res://evidence/roma-showcase-20261028/"+stage
	for arg in OS.get_cmdline_user_args():
		if arg.begins_with("--output="):output=arg.trim_prefix("--output=")
	DirAccess.make_dir_recursive_absolute(ProjectSettings.globalize_path(output))
	var start=Time.get_ticks_usec();world=load("res://world.tscn").instantiate();root.add_child(world);world.capture_done=true
	var report={"candidateEnabled":enabled,"engine":Engine.get_version_info(),"adapter":RenderingServer.get_video_adapter_name(),"backend":RenderingServer.get_current_rendering_method(),"resolution":[1920,1080],"initializationMs":(Time.get_ticks_usec()-start)/1000.0,"vsync":DisplayServer.window_get_vsync_mode(),"frameCap":Engine.max_fps,"views":[],"method":"600 wall-clock intervals per settled view, one forced GPU render per interval with automatic render loop disabled and no buffer swap. Prevents hidden-window logic-only FPS. 1% low averages slowest six intervals. Sequential views, retained shader caches; not a cold-cache or presented-frame benchmark."}
	for view in [{"name":"close","distance":.42,"pitch":38.,"yaw":65.},{"name":"regional","distance":7.2,"pitch":45.,"yaw":0.},{"name":"strategic","distance":45.,"pitch":45.,"yaw":0.},{"name":"inspection","distance":.16,"pitch":28.,"yaw":15.}]:
		world.focus=Vector2(12.491258174554883,41.8899769864849)
		if view.name=="inspection":
			var center=world.project(world.focus.x,world.focus.y);world.focus=world.unproject(center+Vector3(-.04,0,-.04))
			for child in world.get_children():
				if child is CanvasLayer:child.visible=false
			world.marker_root.visible=false
		world.goal_focus=world.focus;world.distance=view.distance;world.goal_distance=view.distance;world.pitch=view.pitch;world.yaw=view.yaw;world.queue_tiles()
		var begin=Time.get_ticks_usec();var previous=begin;var first=[]
		while Time.get_ticks_usec()-begin<120000000:
			await process_frame
			var now=Time.get_ticks_usec();first.append((now-previous)/1000.);previous=now
			if world.is_settled() and world.settled_frame_times.size()>=180:break
		assert(world.is_settled(),"Readiness timeout")
		var readiness=(Time.get_ticks_usec()-begin)/1000.;var samples=[];var gpu=[];var cpu=[];previous=Time.get_ticks_usec()
		for i in 600:
			await process_frame
			var now=Time.get_ticks_usec();samples.append((now-previous)/1000.);previous=now
			gpu.append(RenderingServer.viewport_get_measured_render_time_gpu(root.get_viewport_rid()));cpu.append(RenderingServer.viewport_get_measured_render_time_cpu(root.get_viewport_rid()))
		RenderingServer.force_draw();assert(root.get_texture().get_image().save_png(output+"/"+view.name+".png")==OK)
		report.views.append({"view":view,"camera":{"position":[world.camera.position.x,world.camera.position.y,world.camera.position.z],"focus":[world.focus.x,world.focus.y],"fov":world.camera.fov,"nearKm":world.camera.near,"farKm":world.camera.far},"steady":statistics(samples),"readinessMs":readiness,"firstRender":statistics(first),"frameSamplesMs":samples,"firstRenderSamplesMs":first,"gpu":world.sample_stats(gpu),"renderCpu":world.sample_stats(cpu),"videoMemoryBytes":RenderingServer.get_rendering_info(RenderingServer.RENDERING_INFO_VIDEO_MEM_USED),"engineMemoryBytes":OS.get_static_memory_usage(),"drawCalls":Performance.get_monitor(Performance.RENDER_TOTAL_DRAW_CALLS_IN_FRAME),"primitives":Performance.get_monitor(Performance.RENDER_TOTAL_PRIMITIVES_IN_FRAME),"residentTiles":world.resident.size(),"settlements":world.sites.size(),"research":world.research.size(),"roma":world.settlements.roma_visual.stats.duplicate(true)})
		print("SHOWCASE_PROFILE ",stage," ",view.name," ",JSON.stringify(report.views[-1].steady))
	var file=FileAccess.open(output+"/performance.json",FileAccess.WRITE);file.store_string(JSON.stringify(report,"  "));file.close();quit()
func force_render():RenderingServer.force_draw(false)
