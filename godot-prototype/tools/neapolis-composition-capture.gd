extends "res://tools/neapolis-free-capture.gd"
func run():
	output="res://evidence/neapolis-composition/before"
	var references={}
	for arg in OS.get_cmdline_user_args():
		if arg.begins_with("--output="):output=arg.trim_prefix("--output=")
		if arg.begins_with("--reference="):
			for r in JSON.parse_string(FileAccess.get_file_as_string(arg.trim_prefix("--reference="))).views:references[r.name]=r
	DirAccess.make_dir_recursive_absolute(ProjectSettings.globalize_path(output))
	RenderingServer.render_loop_enabled=false;process_frame.connect(draw)
	world=load("res://world.tscn").instantiate();root.add_child(world);world.capture_done=true
	Engine.max_fps=0;DisplayServer.window_set_vsync_mode(DisplayServer.VSYNC_DISABLED)
	for c in world.get_children():
		if c is CanvasLayer and c.name!="FactionCartography":c.visible=false
	var views={"close":[14.25287,40.839995,1.5,45.,0.],"oblique":[14.25287,40.839995,.8,32.,45.],"district":[14.25287,40.839995,.65,65.,0.],"regional":[14.25287,40.839995,4.,45.,0.],"roma-control":[12.491258174554883,41.8899769864849,12.,45.,0.],"catana-control":[15.088142,37.502959,12.,45.,0.]}
	var records=[]
	for name in views:
		fixed_camera={};world.comparison_camera={}
		var v=views[name];world.focus=Vector2(v[0],v[1]);world.goal_focus=world.focus;world.distance=v[2];world.goal_distance=v[2];world.pitch=v[3];world.yaw=v[4];world.queue_tiles()
		if references.has(name):
			fixed_camera=references[name].camera
			world.comparison_camera={"position":fixed_camera.position,"distance":v[2],"pitch":v[3],"yaw":v[4]}
		for i in 30000:
			await process_frame
			if i>120 and world.is_settled():break
		assert(world.is_settled())
		world.water_animation_enabled=false;world.water_time=0.;world.water_material.set_shader_parameter("water_time",0.);await world.ocean_renderer.capture_time(0.)
		var samples=[];var gpu=[];var draws=[];var cpu=[];var prev=Time.get_ticks_usec()
		for i in 180:
			await process_frame;var now=Time.get_ticks_usec();samples.append((now-prev)/1000.);prev=now
			gpu.append(RenderingServer.viewport_get_measured_render_time_gpu(root.get_viewport_rid()));draws.append(Performance.get_monitor(Performance.RENDER_TOTAL_DRAW_CALLS_IN_FRAME));cpu.append(world.previous_cpu_stages.get("settlements",0.))
		draw();assert(root.get_texture().get_image().save_png(output+"/"+name+".png")==OK)
		if references.has(name):assert(cameras_match(camera_record(),references[name].camera))
		var node=world.settlements.nodes.get("1f50fd31-a377-5df8-b182-d84e962aed97")
		records.append({"name":name,"camera":camera_record(),"submitted":world.sample_stats(samples),"gpu":world.sample_stats(gpu),"settlementCpu":world.sample_stats(cpu),"drawCalls":world.sample_stats(draws),"textureMemoryBytes":Performance.get_monitor(Performance.RENDER_TEXTURE_MEM_USED),"geometry":node.get_meta("neapolis_geometry",{}) if node!=null else {}})
		FileAccess.open(output+"/views.json",FileAccess.WRITE).store_string(JSON.stringify({"views":records,"notice":"180 uncapped submitted intervals, hidden-window GPU/CPU diagnostics; not sustained interactive FPS."},"  "))
		print("COMPOSITION_CAPTURE_OK ",name)
	world.queue_free()
	for i in 30:await process_frame
	quit()
