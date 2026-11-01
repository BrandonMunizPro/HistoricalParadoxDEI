extends "res://tools/reset-profile.gd"
func force_render():RenderingServer.force_draw(true)
func run():
	RenderingServer.render_loop_enabled=false;process_frame.connect(force_render)
	output="res://evidence/ocean-20261028/before"
	var reference={}
	var only=""
	for arg in OS.get_cmdline_user_args():
		if arg.begins_with("--only="):only=arg.trim_prefix("--only=")
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
	for view in [{"name":"campaign","focus":[14.5,37.7],"distance":520.,"pitch":57.,"yaw":0.},{"name":"tarquinii-region","focus":[11.65,42.22],"distance":32.,"pitch":42.,"yaw":-65.},{"name":"tarquinii-coast","focus":[11.65,42.22],"distance":.8,"pitch":15.,"yaw":-70.},{"name":"offshore","focus":[13.,39.5],"distance":1.6,"pitch":12.,"yaw":30.},{"name":"sicily","focus":[14.2,37.6],"distance":180.,"pitch":50.,"yaw":0.},{"name":"messina","focus":[15.59,38.20],"distance":12.,"pitch":42.,"yaw":50.},{"name":"archipelago","focus":[9.35,41.2],"distance":18.,"pitch":42.,"yaw":30.},{"name":"surface","focus":[13.,39.5],"distance":.12,"pitch":8.,"yaw":30.}]:
		if (view.name=="surface")!=OS.get_cmdline_user_args().has("--surface"):continue
		if only!="" and view.name!=only:continue
		if OS.get_cmdline_user_args().has("--quick") and view.name not in ["tarquinii-coast","offshore","surface"]:continue
		if world.has_meta("ocean_renderer"):world.get_meta("ocean_renderer").resume_animation()
		world.focus=Vector2(view.focus[0],view.focus[1]);world.goal_focus=world.focus;world.distance=view.distance;world.goal_distance=world.distance;world.pitch=view.pitch;world.yaw=view.yaw;world.queue_tiles()
		if reference.has(view.name):world.comparison_camera={"position":reference[view.name].camera.position,"pitch":view.pitch,"yaw":view.yaw,"distance":view.distance}
		if OS.get_cmdline_user_args().has("--freeze-ocean") and world.has_meta("ocean_renderer"):await world.get_meta("ocean_renderer").capture_time(0.)
		var begin=Time.get_ticks_usec();var previous=begin;var first=[];var frames=0
		while Time.get_ticks_usec()-begin<120000000:
			await process_frame;frames+=1;var now=Time.get_ticks_usec();first.append((now-previous)/1000.);previous=now
			if frames>=180 and world.is_settled():break
		assert(world.is_settled(),"Readiness timed out")
		assert(Engine.max_fps==0 and DisplayServer.window_get_vsync_mode()==DisplayServer.VSYNC_DISABLED)
		var ready=(Time.get_ticks_usec()-begin)/1000.;var samples=[];var gpu=[];previous=Time.get_ticks_usec()
		var measurement_begin=Time.get_ticks_usec()
		var count=90 if OS.get_cmdline_user_args().has("--quick") else 600
		for arg in OS.get_cmdline_user_args():
			if arg.begins_with("--samples="):count=int(arg.trim_prefix("--samples="))
		while samples.size()<count or (OS.get_cmdline_user_args().has("--sustain") and Time.get_ticks_usec()-measurement_begin<60000000):
			await process_frame;var now=Time.get_ticks_usec();samples.append((now-previous)/1000.);previous=now;gpu.append(RenderingServer.viewport_get_measured_render_time_gpu(root.get_viewport_rid()))
		world.water_time=0.;world.water_material.set_shader_parameter("water_time",0.)
		if world.has_meta("ocean_renderer"):
			await world.get_meta("ocean_renderer").capture_time(0.)
		RenderingServer.force_draw(true);assert(root.get_texture().get_image().save_png(output+"/"+view.name+".png")==OK)
		var record={"view":view,"camera":{"position":[world.camera.position.x,world.camera.position.y,world.camera.position.z],"basis":[world.camera.basis.x.x,world.camera.basis.x.y,world.camera.basis.x.z,world.camera.basis.y.x,world.camera.basis.y.y,world.camera.basis.y.z,world.camera.basis.z.x,world.camera.basis.z.y,world.camera.basis.z.z],"focus":[world.focus.x,world.focus.y],"fov":world.camera.fov,"near":world.camera.near,"far":world.camera.far},"steady":statistics(samples),"readinessMs":ready,"firstFrames":statistics(first),"frameSamplesMs":samples,"firstFrameSamplesMs":first,"gpu":world.sample_stats(gpu),"videoMemoryBytes":RenderingServer.get_rendering_info(RenderingServer.RENDERING_INFO_VIDEO_MEM_USED),"drawCalls":Performance.get_monitor(Performance.RENDER_TOTAL_DRAW_CALLS_IN_FRAME),"primitives":Performance.get_monitor(Performance.RENDER_TOTAL_PRIMITIVES_IN_FRAME),"residentTiles":world.resident.size(),"tileLoadsMs":world.loading_ms.duplicate(),"river":world.river_profile.duplicate(true),"ocean":world.get_meta("ocean_renderer").metrics.duplicate(true) if world.has_meta("ocean_renderer") else {"mode":"legacy"}}
		report.views.append(record);print("OCEAN_CAPTURE ",view.name," ",JSON.stringify(record.steady))
		var file=FileAccess.open(output+"/performance.json",FileAccess.WRITE);file.store_string(JSON.stringify(report,"  "));file.close()
		if view.name in ["offshore","surface"] and world.has_meta("ocean_renderer"):
			await world.get_meta("ocean_renderer").capture_time(4.)
			RenderingServer.force_draw(true);assert(root.get_texture().get_image().save_png(output+"/"+view.name+"-t4.png")==OK)
	if not OS.get_cmdline_user_args().has("--quick") and not OS.get_cmdline_user_args().has("--sustain") and not OS.get_cmdline_user_args().has("--ground"):
		world.comparison_camera={}
		if world.has_meta("ocean_renderer"):world.get_meta("ocean_renderer").resume_animation()
		var motion=[];var previous=Time.get_ticks_usec();var transitions=[]
		for i in 900:
			var t=float(i)/899.
			world.focus=Vector2(11.5,42.18).lerp(Vector2(11.70,42.25),t);world.goal_focus=world.focus
			world.distance=exp(lerp(log(32.),log(.8),t));world.goal_distance=world.distance;world.pitch=lerp(42.,15.,t);world.yaw=lerp(-110.,-40.,t)
			await process_frame;var now=Time.get_ticks_usec();motion.append((now-previous)/1000.);previous=now
			if i%30==0:transitions.append({"frame":i,"distance":world.distance,"resident":world.resident.keys(),"settled":world.is_settled()})
		var motion_report={"route":"Tarquinian coast pan/rotate, 32 km to 800 m, 900 uncapped submitted frames; streaming included","steady":statistics(motion),"frameSamplesMs":motion,"transitions":transitions}
		FileAccess.open(output+"/motion.json",FileAccess.WRITE).store_string(JSON.stringify(motion_report,"  "))
	FileAccess.open(output+"/diagnostics.json",FileAccess.WRITE).store_string(JSON.stringify({"bootStagesMs":world.boot_stages,"maxCpuStageMs":world.stage_maxima,"slowFrames":world.frame_stages,"materialLoads":world.material_loads,"tileLoadsMs":world.loading_ms,"river":world.river_profile,"scenery":world.scenery.work_profile},"  "))
	quit()
