extends "res://tools/reset-profile.gd"
func force_render():RenderingServer.force_draw(true)
func run():
	RenderingServer.render_loop_enabled=false;process_frame.connect(force_render)
	output="res://evidence/terrain-water-20261028/before"
	var reference={}
	for arg in OS.get_cmdline_user_args():
		if arg.begins_with("--output="):output=arg.trim_prefix("--output=")
		if arg.begins_with("--reference-before="):
			for v in JSON.parse_string(FileAccess.get_file_as_string(arg.trim_prefix("--reference-before="))).views:reference[v.view.name]=v
	DirAccess.make_dir_recursive_absolute(ProjectSettings.globalize_path(output))
	var start=Time.get_ticks_usec();world=load("res://world.tscn").instantiate();root.add_child(world);world.capture_done=true
	Engine.max_fps=0;DisplayServer.window_set_vsync_mode(DisplayServer.VSYNC_DISABLED)
	for child in world.get_children():
		if child is CanvasLayer:child.visible=false
	world.marker_root.visible=false
	var report={"engine":Engine.get_version_info(),"adapter":RenderingServer.get_video_adapter_name(),"backend":RenderingServer.get_current_rendering_method(),"sceneInstantiationMs":(Time.get_ticks_usec()-start)/1000.,"frameCap":Engine.max_fps,"vsync":DisplayServer.window_get_vsync_mode(),"method":"600 settled wall intervals per view, forced GPU draw with buffer swap, automatic render loop disabled, engine cap zero and VSync disabled after world initialization. Hidden-window controlled submission, not OS PresentMon/scan-out. Retained shader caches; no clean-cache claims.","views":[]}
	for view in [{"name":"campaign","focus":[12.56,41.81],"distance":45.,"pitch":48.,"yaw":0.},{"name":"roma-region","focus":[12.49,41.895],"distance":4.5,"pitch":45.,"yaw":25.},{"name":"aricia-region","focus":[12.69,41.74],"distance":4.5,"pitch":48.,"yaw":-25.},{"name":"aricia-terrain","focus":[12.702,41.725],"distance":.65,"pitch":35.,"yaw":-15.},{"name":"roma-terrain","focus":[12.505,41.903],"distance":.65,"pitch":35.,"yaw":20.},{"name":"tiber-close","focus":[12.477226,41.886671],"distance":.30,"pitch":42.,"yaw":35.},{"name":"roma-ground","focus":[12.491258174554883,41.8899769864849],"distance":.65,"pitch":50.,"yaw":20.},{"name":"aricia-ground","focus":[12.67334715,41.72139965],"distance":.65,"pitch":50.,"yaw":-15.}]:
		if view.name.ends_with("-ground")!=OS.get_cmdline_user_args().has("--ground"):continue
		if OS.get_cmdline_user_args().has("--sustain") and view.name!="roma-terrain":continue
		if OS.get_cmdline_user_args().has("--quick") and view.name not in ["aricia-terrain","tiber-close"]:continue
		world.focus=Vector2(view.focus[0],view.focus[1]);world.goal_focus=world.focus;world.distance=view.distance;world.goal_distance=world.distance;world.pitch=view.pitch;world.yaw=view.yaw;world.queue_tiles()
		if reference.has(view.name):world.comparison_camera={"position":reference[view.name].camera.position,"pitch":view.pitch,"yaw":view.yaw,"distance":view.distance}
		var begin=Time.get_ticks_usec();var previous=begin;var first=[];var frames=0
		while Time.get_ticks_usec()-begin<120000000:
			await process_frame;frames+=1;var now=Time.get_ticks_usec();first.append((now-previous)/1000.);previous=now
			if frames>=180 and world.is_settled():break
		assert(world.is_settled(),"Readiness timed out")
		assert(Engine.max_fps==0 and DisplayServer.window_get_vsync_mode()==DisplayServer.VSYNC_DISABLED)
		var ready=(Time.get_ticks_usec()-begin)/1000.;var samples=[];var gpu=[];previous=Time.get_ticks_usec()
		var measurement_begin=Time.get_ticks_usec()
		var count=60 if OS.get_cmdline_user_args().has("--quick") else 600
		while samples.size()<count or (OS.get_cmdline_user_args().has("--sustain") and Time.get_ticks_usec()-measurement_begin<60000000):
			await process_frame;var now=Time.get_ticks_usec();samples.append((now-previous)/1000.);previous=now;gpu.append(RenderingServer.viewport_get_measured_render_time_gpu(root.get_viewport_rid()))
		world.water_time=0.;world.water_material.set_shader_parameter("water_time",0.)
		if world.has_meta("landscape_quality"):world.get_meta("landscape_quality").freeze_water(0.)
		RenderingServer.force_draw(true);assert(root.get_texture().get_image().save_png(output+"/"+view.name+".png")==OK)
		var record={"view":view,"camera":{"position":[world.camera.position.x,world.camera.position.y,world.camera.position.z],"basis":[world.camera.basis.x.x,world.camera.basis.x.y,world.camera.basis.x.z,world.camera.basis.y.x,world.camera.basis.y.y,world.camera.basis.y.z,world.camera.basis.z.x,world.camera.basis.z.y,world.camera.basis.z.z],"focus":[world.focus.x,world.focus.y],"fov":world.camera.fov,"near":world.camera.near,"far":world.camera.far},"steady":statistics(samples),"readinessMs":ready,"firstFrames":statistics(first),"frameSamplesMs":samples,"firstFrameSamplesMs":first,"gpu":world.sample_stats(gpu),"videoMemoryBytes":RenderingServer.get_rendering_info(RenderingServer.RENDERING_INFO_VIDEO_MEM_USED),"drawCalls":Performance.get_monitor(Performance.RENDER_TOTAL_DRAW_CALLS_IN_FRAME),"primitives":Performance.get_monitor(Performance.RENDER_TOTAL_PRIMITIVES_IN_FRAME),"residentTiles":world.resident.size(),"tileLoadsMs":world.loading_ms.duplicate(),"river":world.river_profile.duplicate(true)}
		report.views.append(record);print("LANDSCAPE_CAPTURE ",view.name," ",JSON.stringify(record.steady))
		var file=FileAccess.open(output+"/performance.json",FileAccess.WRITE);file.store_string(JSON.stringify(report,"  "));file.close()
		if view.name=="tiber-close" and world.has_meta("landscape_quality"):
			world.get_meta("landscape_quality").freeze_water(8.)
			RenderingServer.force_draw(true);assert(root.get_texture().get_image().save_png(output+"/tiber-flow-t8.png")==OK)
	if not OS.get_cmdline_user_args().has("--quick") and not OS.get_cmdline_user_args().has("--sustain") and not OS.get_cmdline_user_args().has("--ground"):
		world.comparison_camera={}
		var motion=[];var previous=Time.get_ticks_usec();var transitions=[]
		for i in 900:
			var t=float(i)/899.
			world.focus=Vector2(12.49,41.895).lerp(Vector2(12.702,41.725),t);world.goal_focus=world.focus
			world.distance=exp(lerp(log(45.),log(.65),t));world.goal_distance=world.distance;world.pitch=42.;world.yaw=lerp(25.,-15.,t)
			await process_frame;var now=Time.get_ticks_usec();motion.append((now-previous)/1000.);previous=now
			if i%30==0:transitions.append({"frame":i,"distance":world.distance,"resident":world.resident.keys(),"settled":world.is_settled()})
		var motion_report={"route":"Roma to Aricia, 45 km to 650 m, 900 uncapped submitted frames; streaming included","steady":statistics(motion),"frameSamplesMs":motion,"transitions":transitions}
		FileAccess.open(output+"/motion.json",FileAccess.WRITE).store_string(JSON.stringify(motion_report,"  "))
	quit()
