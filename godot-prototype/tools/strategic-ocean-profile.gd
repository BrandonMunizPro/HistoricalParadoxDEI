extends "res://tools/reset-profile.gd"
var renderer
var report={}
var sample_count=300
func force_render():RenderingServer.force_draw(true)
func write_report():FileAccess.open(output+"/performance.json",FileAccess.WRITE).store_string(JSON.stringify(report,"  "))
func set_clock(t):
	world.water_animation_enabled=false
	world.water_time=t;world.water_material.set_shader_parameter("water_time",t)
	await renderer.capture_time(t)
	await process_frame
func shot(name):
	RenderingServer.force_draw(true)
	assert(root.get_texture().get_image().save_png(output+"/"+name+".png")==OK)
func run():
	output="res://evidence/strategic-ocean-20261029/before"
	var only="";var reference={}
	for arg in OS.get_cmdline_user_args():
		if arg.begins_with("--output="):output=arg.trim_prefix("--output=")
		if arg.begins_with("--only="):only=arg.trim_prefix("--only=")
		if arg.begins_with("--samples="):sample_count=int(arg.trim_prefix("--samples="))
		if arg.begins_with("--reference="):
			for v in JSON.parse_string(FileAccess.get_file_as_string(arg.trim_prefix("--reference="))).views:reference[v.name]=v
	DirAccess.make_dir_recursive_absolute(ProjectSettings.globalize_path(output))
	RenderingServer.render_loop_enabled=false;process_frame.connect(force_render)
	var begin=Time.get_ticks_usec();world=load("res://world.tscn").instantiate();root.add_child(world);world.capture_done=true
	Engine.max_fps=0;DisplayServer.window_set_vsync_mode(DisplayServer.VSYNC_DISABLED)
	for c in world.get_children():
		if c is CanvasLayer:c.visible=false
	world.marker_root.visible=false;renderer=world.get_meta("ocean_renderer")
	if OS.get_cmdline_user_args().has("--strategic-off"):
		for mat in renderer.materials:mat.set_shader_parameter("strategic_strength",0.)
	report={"engine":Engine.get_version_info(),"adapter":RenderingServer.get_video_adapter_name(),"resolution":[root.size.x,root.size.y],"sceneInstantiationMs":(Time.get_ticks_usec()-begin)/1000.,"method":"Uncapped VSync-off hidden-window force_draw(true) wall intervals; retained caches, not PresentMon. 1% low = reciprocal mean of slowest 1%. Same world, sequential views; initial streaming separate.","views":[]}
	for distance in [1.2,10.,30.,59.3,30000.]:
		for yaw in [-48.,42.,132.]:
			var name="d%s-y%s" % [str(distance).replace(".","p"),str(yaw).replace("-","m").replace(".","p")]
			if only!="" and name!=only:continue
			renderer.resume_animation();world.water_animation_enabled=true;world.comparison_camera={}
			world.focus=Vector2(11.65,42.22) if distance<30000 else Vector2(14.5,37.7);world.goal_focus=world.focus
			world.distance=distance;world.goal_distance=distance;world.pitch=28. if distance==1.2 else (55. if distance>=30000 else 48.);world.yaw=yaw;world.queue_tiles()
			if reference.has(name):world.comparison_camera={"position":reference[name].camera.position,"pitch":world.pitch,"yaw":yaw,"distance":distance}
			var start=Time.get_ticks_usec();var prev=start;var first=[]
			for i in 20000:
				await process_frame;var now=Time.get_ticks_usec();first.append((now-prev)/1000.);prev=now
				if i>=179 and world.is_settled():break
				assert(Time.get_ticks_usec()-start<120000000,"Streaming readiness timeout")
			var samples=[];var gpu=[];prev=Time.get_ticks_usec()
			for i in sample_count:
				await process_frame;var now=Time.get_ticks_usec();samples.append((now-prev)/1000.);prev=now;gpu.append(RenderingServer.viewport_get_measured_render_time_gpu(root.get_viewport_rid()))
			var record={"name":name,"distance":distance,"yaw":yaw,"pitch":world.pitch,"steady":statistics(samples),"gpu":world.sample_stats(gpu),"frameSamplesMs":samples,"readinessMs":(Time.get_ticks_usec()-start)/1000.,"initial":statistics(first),"initialSamplesMs":first,"drawCalls":Performance.get_monitor(Performance.RENDER_TOTAL_DRAW_CALLS_IN_FRAME),"videoMemoryBytes":RenderingServer.get_rendering_info(RenderingServer.RENDERING_INFO_VIDEO_MEM_USED),"camera":{"position":[world.camera.position.x,world.camera.position.y,world.camera.position.z],"basis":[world.camera.basis.x.x,world.camera.basis.x.y,world.camera.basis.x.z,world.camera.basis.y.x,world.camera.basis.y.y,world.camera.basis.y.z,world.camera.basis.z.x,world.camera.basis.z.y,world.camera.basis.z.z],"near":world.camera.near,"far":world.camera.far,"fov":world.camera.fov},"ocean":renderer.metrics.duplicate(true)}
			await set_clock(0.);shot(name)
			await set_clock(12.);shot(name+"-t12")
			report.views.append(record);write_report();print("STRATEGIC_CAPTURE ",name," ",JSON.stringify(record.steady))
	FileAccess.open(output+"/diagnostics.json",FileAccess.WRITE).store_string(JSON.stringify({"boot":world.boot_stages,"maxCpuStages":world.stage_maxima,"slowFrames":world.frame_stages},"  "))
	quit()
