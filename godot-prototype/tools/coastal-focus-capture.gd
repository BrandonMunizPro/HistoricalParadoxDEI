extends "res://tools/reset-profile.gd"
func draw():RenderingServer.force_draw(true)
func run():
	output="res://evidence/coastal-focus/iteration";var complete=false
	for arg in OS.get_cmdline_user_args():
		if arg.begins_with("--output="):output=arg.trim_prefix("--output=")
		if arg=="--complete":complete=true
	DirAccess.make_dir_recursive_absolute(ProjectSettings.globalize_path(output))
	RenderingServer.render_loop_enabled=false;process_frame.connect(draw);root.gui_disable_input=true
	world=load("res://world.tscn").instantiate();root.add_child(world);world.capture_done=true;world.automation_input_locked=true
	Engine.max_fps=0;DisplayServer.window_set_vsync_mode(DisplayServer.VSYNC_DISABLED)
	for child in world.get_children():
		if child is CanvasLayer:child.visible=false
	world.focus=Vector2(15.644,38.024);world.goal_focus=world.focus;world.distance=1.2;world.goal_distance=1.2;world.pitch=22.;world.yaw=-125.;world.queue_tiles()
	var start=Time.get_ticks_msec();var next_log=30000
	for i in 60000:
		await process_frame
		var coastal_ready=world.coastal_focus==null or world.coastal_focus.built
		if i>180 and coastal_ready and world.queue.is_empty() and (not complete or world.is_settled()):break
		if Time.get_ticks_msec()-start>next_log:print("COAST_CAPTURE_WAIT ",next_log," scenery=",world.scenery.pending_cells());next_log+=30000
		if Time.get_ticks_msec()-start>600000:push_error("Coastal capture readiness timeout");quit(1);return
	world.water_animation_enabled=false
	var records=[]
	var times=[0.,1.8,3.6,5.4]
	if complete and not OS.get_cmdline_user_args().has("--coast-baseline"):
		times=[]
		for i in 48:times.append(float(i)/8.)
	for time in times:
		world.water_time=time;world.water_material.set_shader_parameter("water_time",time)
		if world.coastal_focus!=null:
			world.coastal_focus.beach.material_override.set_shader_parameter("water_time",time)
			world.coastal_focus.surf.material_override.set_shader_parameter("water_time",time)
		await world.ocean_renderer.capture_time(time);await process_frame;draw()
		assert(root.get_texture().get_image().save_png(output+"/frame-%03d.png"%records.size())==OK)
		records.append({"time":time,"cameraPosition":[world.camera.position.x,world.camera.position.y,world.camera.position.z],"focus":[world.focus.x,world.focus.y],"coastalActive":world.coastal_focus!=null and world.coastal_focus.active,"settled":world.is_settled(),"gpuMs":RenderingServer.viewport_get_measured_render_time_gpu(root.get_viewport_rid())})
	var checks={}
	if complete and world.coastal_focus!=null:
		world.distance=20.;world.goal_distance=20.
		for i in 40:await process_frame
		checks["disabledWhenZoomedOut"]=not world.coastal_focus.active and not world.coastal_focus.beach.visible and not world.coastal_focus.surf.visible
		assert(checks.disabledWhenZoomedOut)
		world.focus=Vector2(13.,39.5);world.goal_focus=world.focus;world.distance=1.2;world.goal_distance=1.2
		for i in 40:await process_frame
		checks["disabledOutsideFocus"]=not world.coastal_focus.active
		assert(checks.disabledOutsideFocus)
	FileAccess.open(output+"/capture.json",FileAccess.WRITE).store_string(JSON.stringify({"completeReadinessRequired":complete,"readinessMs":Time.get_ticks_msec()-start,"views":records,"checks":checks},"  "))
	print("COAST_CAPTURE_OK ",output);world.queue_free();for i in 10:await process_frame
	quit()
