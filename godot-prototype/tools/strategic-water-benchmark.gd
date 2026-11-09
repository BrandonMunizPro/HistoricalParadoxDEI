extends "res://tools/reset-profile.gd"
func draw():RenderingServer.force_draw(true)
func run():
	root.gui_disable_input=true
	output="res://evidence/strategic-camera-water/benchmark"
	DirAccess.make_dir_recursive_absolute(ProjectSettings.globalize_path(output))
	RenderingServer.render_loop_enabled=false;process_frame.connect(draw)
	world=load("res://world.tscn").instantiate();root.add_child(world);world.capture_done=true
	Engine.max_fps=0;DisplayServer.window_set_vsync_mode(DisplayServer.VSYNC_DISABLED)
	for child in world.get_children():
		if child is CanvasLayer and child.name!="FactionCartography":child.visible=false
	var rows=[]
	for view in [["regional",96.6,15.2,37.4,45.],["strategic",520.,15.2,37.4,48.],["basin",1200.,18.,38.5,52.],["maximum",2800.,29.,37.,57.]]:
		world.focus=Vector2(view[2],view[3]);world.goal_focus=world.focus;world.distance=view[1];world.goal_distance=view[1];world.pitch=view[4];world.yaw=0.;world.queue_tiles()
		for i in 18000:
			await process_frame
			if i>=120 and world.is_settled():break
		assert(world.is_settled())
		for strength in [0.,1.]:
			for mat in world.ocean_renderer.materials:mat.set_shader_parameter("overview_strength",strength)
			for i in 90:await process_frame
			var samples=[];var gpu=[];var previous=Time.get_ticks_usec()
			for i in 240:
				await process_frame;var now=Time.get_ticks_usec();samples.append((now-previous)/1000.);previous=now
				gpu.append(RenderingServer.viewport_get_measured_render_time_gpu(root.get_viewport_rid()))
			rows.append({"view":view[0],"distanceKm":world.distance,"waterVariant":"original" if strength==0. else "distance-aware","steady":statistics(samples),"gpu":world.sample_stats(gpu),"drawCalls":Performance.get_monitor(Performance.RENDER_TOTAL_DRAW_CALLS_IN_FRAME),"samplesMs":samples})
			print("WATER_COST ",view[0]," ",strength," ",JSON.stringify(rows[-1].steady))
	FileAccess.open(output+"/performance.json",FileAccess.WRITE).store_string(JSON.stringify({"method":"Same-process original/distance-aware water response; identical camera/geometry; 90 warm frames then 240 uncapped force_draw wall intervals. Hidden window, not sustained interactive FPS.","views":rows},"  "))
	# Keep geometry, lighting, political blend and pose fixed across the shader endpoints.
	var boundaries=[]
	for boundary in [24.,520.]:
		var images=[]
		for distance in [boundary-.1,boundary,boundary+.1]:
			for mat in world.ocean_renderer.materials:mat.set_shader_parameter("camera_distance",distance)
			draw();images.append(root.get_texture().get_image())
		var max_change=0
		for side in [0,2]:
			var a=images[1].get_data();var b=images[side].get_data()
			for i in a.size():max_change=max(max_change,abs(int(a[i])-int(b[i])))
		assert(max_change<=2,"Discontinuous water endpoint")
		boundaries.append({"distanceKm":boundary,"halfStepKm":.1,"maximumChannelChange":max_change})
	FileAccess.open(output+"/transitions.json",FileAccess.WRITE).store_string(JSON.stringify(boundaries,"  "))
	world.focus=Vector2(15.12,37.49);world.goal_focus=world.focus;world.distance=1.2;world.goal_distance=1.2;world.pitch=36.;world.yaw=-22.;world.queue_tiles()
	for i in 18000:
		await process_frame
		if i>=120 and world.is_settled():break
	world.water_animation_enabled=false
	for time in [0.,8.]:
		world.water_time=time
		for mat in world.ocean_renderer.materials:mat.set_shader_parameter("water_time",time)
		await world.ocean_renderer.capture_time(time);draw();root.get_texture().get_image().save_png(output+"/close-time-"+str(int(time))+".png")
	print("STRATEGIC_WATER_BENCHMARK_OK")
	world.queue_free()
	for i in 10:await process_frame
	quit()
