extends "res://tools/reset-profile.gd"
var readback=PackedFloat32Array()
var readback_done=false
func on_readback(data):readback=data;readback_done=true
func draw():RenderingServer.force_draw(true)
func run():
	output="res://evidence/world-coasts/iteration";var only="tarquinii";var complete=false
	for arg in OS.get_cmdline_user_args():
		if arg.begins_with("--only="):only=arg.trim_prefix("--only=")
		if arg.begins_with("--output="):output=arg.trim_prefix("--output=")
		if arg=="--complete":complete=true
	DirAccess.make_dir_recursive_absolute(ProjectSettings.globalize_path(output));root.gui_disable_input=true
	RenderingServer.render_loop_enabled=false;process_frame.connect(draw)
	world=load("res://world.tscn").instantiate();root.add_child(world);world.capture_done=true;world.automation_input_locked=true
	Engine.max_fps=0;DisplayServer.window_set_vsync_mode(DisplayServer.VSYNC_DISABLED)
	for child in world.get_children():
		if child is CanvasLayer:child.visible=false
	var views=world.read_json("data/world-coast-views.json");var records=[]
	for name in views:
		if not name in only.split(","):continue
		var view=views[name];world.focus=Vector2(view[0],view[1]);world.goal_focus=world.focus;world.distance=view[2];world.goal_distance=view[2];world.pitch=view[3];world.yaw=view[4];world.queue_tiles()
		var start=Time.get_ticks_msec();var diagnostic=30000
		for i in 60000:
			await process_frame
			var coast=world.coastal_focus
			if i>180 and coast!=null and coast.built and coast.active and not coast.busy and world.queue.is_empty() and (not complete or world.is_settled()):break
			if Time.get_ticks_msec()-start>diagnostic:print("WORLD_COAST_WAIT ",name," coast_busy=",coast.busy," active=",coast.active," built=",coast.built," scenery=",world.scenery.pending_cells());diagnostic+=30000
			if Time.get_ticks_msec()-start>480000:push_error("Coast view readiness timeout: "+name);quit(1);return
		world.water_animation_enabled=false
		var contact_checks=[]
		if complete and world.coastal_focus.global_mode:
			readback_done=false;RenderingServer.call_on_render_thread(world.coastal_focus.field.validation_readback.bind(Callable(self,"on_readback")))
			while not readback_done:await process_frame
			assert(readback.size()==1024*1024*4)
			var center=world.project(world.focus.x,world.focus.y);var nearest=world.coastal_focus.catalog.nearest(Vector2(center.x,center.z));assert(nearest!=null)
			for offset in [-.08,.08]:
				var point=nearest.coast_point+nearest.normal*offset;var cpu=world.coastal_focus.catalog.nearest(point)
				var bounds=world.coastal_focus.patch_bounds;var q=(point-Vector2(bounds.x,bounds.y))/Vector2(bounds.z,bounds.w)
				var x=clampi(roundi(q.x*1023),0,1023);var y=clampi(roundi(q.y*1023),0,1023);var value=readback[(y*1024+x)*4]
				assert(is_finite(value) and abs(value)<.3)
				if cpu!=null and abs(cpu.distance)>.02:assert(sign(value)==sign(cpu.distance),"GPU coast field reverses sea and land")
				contact_checks.append({"offsetKm":offset,"gpuSignedDistanceKm":value,"cpuSignedDistanceKm":cpu.distance if cpu!=null else null})
		for time in [0.,2.5]:
			world.water_time=time;world.coastal_focus.beach.material_override.set_shader_parameter("water_time",time);world.coastal_focus.surf.material_override.set_shader_parameter("water_time",time)
			await world.ocean_renderer.capture_time(time);await process_frame;draw()
			assert(root.get_texture().get_image().save_png(output+"/"+name+"-"+str(time)+".png")==OK)
		records.append({"name":name,"preset":view,"readyMs":Time.get_ticks_msec()-start,"settled":world.is_settled(),"contactChecks":contact_checks,"coast":world.coastal_focus.metrics.duplicate(true),"gpuMs":RenderingServer.viewport_get_measured_render_time_gpu(root.get_viewport_rid())})
		FileAccess.open(output+"/views.json",FileAccess.WRITE).store_string(JSON.stringify({"completeReadinessRequired":complete,"views":records},"  "));print("WORLD_COAST_CAPTURE ",name)
		world.water_animation_enabled=true;world.ocean_renderer.resume_animation()
	world.distance=30.;world.goal_distance=30.
	for i in 40:await process_frame
	assert(not world.coastal_focus.active and not world.coastal_focus.beach.visible and not world.coastal_focus.surf.visible)
	if world.coastal_focus.global_mode:assert(world.coastal_focus.global_meshes.is_empty() and world.coastal_focus.beach.mesh==null)
	print("WORLD_COAST_RELEASE_OK");world.queue_free();for i in 10:await process_frame
	quit()
