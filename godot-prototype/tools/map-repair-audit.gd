extends "res://tools/reset-profile.gd"
func draw():RenderingServer.force_draw(true)
func run():
	output="res://evidence/map-repair-20261029/before"
	var only="";var reference={}
	for arg in OS.get_cmdline_user_args():
		if arg.begins_with("--output="):output=arg.trim_prefix("--output=")
		if arg.begins_with("--only="):only=arg.trim_prefix("--only=")
		if arg.begins_with("--reference="):
			for v in JSON.parse_string(FileAccess.get_file_as_string(arg.trim_prefix("--reference="))).views:reference[v.name]=v
	RenderingServer.render_loop_enabled=false;process_frame.connect(draw)
	DirAccess.make_dir_recursive_absolute(ProjectSettings.globalize_path(output))
	world=load("res://world.tscn").instantiate();root.add_child(world);world.capture_done=true
	Engine.max_fps=0;DisplayServer.window_set_vsync_mode(DisplayServer.VSYNC_DISABLED)
	for c in world.get_children():
		if c is CanvasLayer:c.visible=false
	var views=world.navigation.presets.duplicate(true)
	views.merge({"caspian":[50.,44.,1800.,65.,0.],"caspian-2800":[50.,44.,2800.,65.,0.],"caspian-3300":[50.,44.,3300.,65.,0.],"caspian-4000":[50.,44.,4000.,65.,0.],"aral":[60.,45.,900.,65.,0.],"crete":[24.9,35.2,180.,55.,0.],"messina":[15.59,38.20,12.,42.,50.],"tarquinii-close":[11.65,42.22,1.2,28.,132.],"mediterranean":[20.,37.,3800.,65.,0.],"maximum":[20.,37.,30000.,65.,0.],"roma-transition":[12.5,41.7,120.,48.,0.]})
	var records=[]
	for name in views:
		if only!="" and not name in only.split(","):continue
		var v=views[name]
		world.comparison_camera={};world.focus=Vector2(v[0],v[1]);world.goal_focus=world.focus;world.distance=v[2];world.goal_distance=v[2];world.pitch=v[3];world.yaw=v[4];world.queue_tiles()
		if reference.has(name):world.comparison_camera={"position":reference[name].camera.position,"distance":v[2],"pitch":v[3],"yaw":v[4]}
		var start=Time.get_ticks_msec()
		for i in 30000:
			await process_frame
			if i>=120 and world.is_settled():break
			assert(Time.get_ticks_msec()-start<120000)
		var samples=[];var gpu=[];var prev=Time.get_ticks_usec()
		for i in 120:
			await process_frame;var now=Time.get_ticks_usec();samples.append((now-prev)/1000.);prev=now;gpu.append(RenderingServer.viewport_get_measured_render_time_gpu(root.get_viewport_rid()))
		world.water_animation_enabled=false;world.water_time=0.;world.water_material.set_shader_parameter("water_time",0.)
		await world.ocean_renderer.capture_time(0.);await process_frame
		draw();assert(root.get_texture().get_image().save_png(output+"/"+name+".png")==OK)
		var camera=world.camera
		records.append({"name":name,"preset":v,"camera":{"position":[camera.position.x,camera.position.y,camera.position.z],"basis":[camera.basis.x.x,camera.basis.x.y,camera.basis.x.z,camera.basis.y.x,camera.basis.y.y,camera.basis.y.z,camera.basis.z.x,camera.basis.z.y,camera.basis.z.z],"fov":camera.fov,"near":camera.near,"far":camera.far},"steady":statistics(samples),"gpu":world.sample_stats(gpu),"frameSamplesMs":samples,"drawCalls":Performance.get_monitor(Performance.RENDER_TOTAL_DRAW_CALLS_IN_FRAME),"resident":world.resident.keys(),"political":world.political_map.blend})
		FileAccess.open(output+"/views.json",FileAccess.WRITE).store_string(JSON.stringify({"views":records,"method":"120 uncapped controlled submitted wall intervals per settled view; VSync off; hidden-window force_draw, not a sustained benchmark or scan-out."},"  "))
		print("MAP_AUDIT_CAPTURE ",name)
		world.water_animation_enabled=true;world.ocean_renderer.resume_animation()
	for i in 30000:
		await process_frame
		if i>90 and world.is_settled():break
	world.queue_free()
	for i in 10:await process_frame
	quit()
