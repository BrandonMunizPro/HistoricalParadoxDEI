extends "res://tools/reset-profile.gd"
func force_render():RenderingServer.force_draw(true)
func run():
	output="res://evidence/political-map-20261029/before"
	var reference={}
	for arg in OS.get_cmdline_user_args():
		if arg.begins_with("--output="):output=arg.trim_prefix("--output=")
		if arg.begins_with("--reference="):
			for v in JSON.parse_string(FileAccess.get_file_as_string(arg.trim_prefix("--reference="))).views:reference[v.name]=v
	DirAccess.make_dir_recursive_absolute(ProjectSettings.globalize_path(output))
	RenderingServer.render_loop_enabled=false;process_frame.connect(force_render)
	var start=Time.get_ticks_usec();world=load("res://world.tscn").instantiate();root.add_child(world);world.capture_done=true
	Engine.max_fps=0;DisplayServer.window_set_vsync_mode(DisplayServer.VSYNC_DISABLED)
	for c in world.get_children():
		if c is CanvasLayer:c.visible=false
	var report={"engine":Engine.get_version_info(),"adapter":RenderingServer.get_video_adapter_name(),"sceneInstantiationMs":(Time.get_ticks_usec()-start)/1000.,"method":"300 uncapped VSync-off forced GPU submissions per settled view, wall timing; not scan-out or a clean-cache test.","views":[]}
	for view in [{"name":"close","focus":[11.65,42.22],"distance":1.2,"pitch":28.,"yaw":132.},{"name":"geographic","focus":[11.65,42.22],"distance":59.3,"pitch":48.,"yaw":-48.},{"name":"transition","focus":[12.5,41.7],"distance":120.,"pitch":48.,"yaw":0.},{"name":"political","focus":[12.5,41.7],"distance":180.,"pitch":48.,"yaw":0.},{"name":"sicily","focus":[14.5,37.7],"distance":520.,"pitch":57.,"yaw":0.},{"name":"campaign","focus":[13.,42.],"distance":1100.,"pitch":42.,"yaw":0.},{"name":"overview","focus":[23.,38.],"distance":5200.,"pitch":78.,"yaw":0.},{"name":"alps","focus":[10.,46.],"distance":260.,"pitch":48.,"yaw":35.},{"name":"egypt","focus":[31.,28.],"distance":800.,"pitch":55.,"yaw":0.}]:
		world.comparison_camera={};world.focus=Vector2(view.focus[0],view.focus[1]);world.goal_focus=world.focus;world.distance=view.distance;world.goal_distance=world.distance;world.pitch=view.pitch;world.yaw=view.yaw;world.queue_tiles()
		if reference.has(view.name):world.comparison_camera={"position":reference[view.name].camera.position,"pitch":view.pitch,"yaw":view.yaw,"distance":view.distance}
		start=Time.get_ticks_usec();var prev=start;var first=[]
		for i in 30000:
			await process_frame;var now=Time.get_ticks_usec();first.append((now-prev)/1000.);prev=now
			if i>=179 and world.is_settled():break
			assert(Time.get_ticks_usec()-start<120000000)
		var ready=(Time.get_ticks_usec()-start)/1000.;var samples=[];var gpu=[];prev=Time.get_ticks_usec()
		for i in 300:
			await process_frame;var now=Time.get_ticks_usec();samples.append((now-prev)/1000.);prev=now;gpu.append(RenderingServer.viewport_get_measured_render_time_gpu(root.get_viewport_rid()))
		world.water_animation_enabled=false;world.water_time=0.;world.water_material.set_shader_parameter("water_time",0.)
		if world.has_meta("ocean_renderer"):await world.ocean_renderer.capture_time(0.)
		await process_frame;RenderingServer.force_draw(true)
		assert(root.get_texture().get_image().save_png(output+"/"+view.name+".png")==OK)
		var record={"name":view.name,"view":view,"camera":{"position":[world.camera.position.x,world.camera.position.y,world.camera.position.z],"basis":[world.camera.basis.x.x,world.camera.basis.x.y,world.camera.basis.x.z,world.camera.basis.y.x,world.camera.basis.y.y,world.camera.basis.y.z,world.camera.basis.z.x,world.camera.basis.z.y,world.camera.basis.z.z],"fov":world.camera.fov,"near":world.camera.near,"far":world.camera.far},"steady":statistics(samples),"gpu":world.sample_stats(gpu),"frameSamplesMs":samples,"readinessMs":ready,"initial":statistics(first),"initialSamplesMs":first,"drawCalls":Performance.get_monitor(Performance.RENDER_TOTAL_DRAW_CALLS_IN_FRAME),"videoMemoryBytes":RenderingServer.get_rendering_info(RenderingServer.RENDERING_INFO_VIDEO_MEM_USED),"visibleApprovedLabels":world.markers.filter(func(m):return m.label.visible).size(),"political":world.political_map.metrics.duplicate(true) if world.has_meta("political_map") else {"blend":0.}}
		report.views.append(record);FileAccess.open(output+"/performance.json",FileAccess.WRITE).store_string(JSON.stringify(report,"  "));print("POLITICAL_CAPTURE ",view.name," ",JSON.stringify(record.steady))
		world.water_animation_enabled=true
		if world.has_meta("ocean_renderer"):world.ocean_renderer.resume_animation()
	world.comparison_camera={};var motion=[];var states=[];var prev=Time.get_ticks_usec()
	for i in 900:
		var t=float(i)/899.;var q=sin(PI*t)
		world.distance=exp(lerp(log(45.),log(260.),q));world.goal_distance=world.distance;world.focus=Vector2(12.3+t*.25,41.6+t*.1);world.goal_focus=world.focus;world.pitch=48.;world.yaw=t*100.
		await process_frame;var now=Time.get_ticks_usec();motion.append((now-prev)/1000.);prev=now
		if i%15==0:states.append({"distance":world.distance,"blend":world.political_map.blend if world.has_meta("political_map") else 0.})
	FileAccess.open(output+"/motion.json",FileAccess.WRITE).store_string(JSON.stringify({"statistics":statistics(motion),"frameSamplesMs":motion,"states":states,"route":"45→260→45 km, pan and rotate, 900 uncapped frames; streaming included"},"  "))
	for i in 30000:
		await process_frame
		if i>90 and world.is_settled():break
	world.queue_free()
	for i in 10:await process_frame
	quit()
