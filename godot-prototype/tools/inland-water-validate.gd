extends "res://tools/map-repair-validate.gd"
func freeze_at(time):
	world.water_animation_enabled=false;world.water_time=time
	await world.ocean_renderer.capture_time(time)
	for i in 4:await process_frame
func run():
	directory="res://evidence/inland-water-20261029/native"
	for arg in OS.get_cmdline_user_args():
		if arg.begins_with("--output="):directory=arg.trim_prefix("--output=")
	DirAccess.make_dir_recursive_absolute(ProjectSettings.globalize_path(directory))
	RenderingServer.render_loop_enabled=false;process_frame.connect(draw)
	world=load("res://world.tscn").instantiate();root.add_child(world);world.capture_done=true
	Engine.max_fps=0;DisplayServer.window_set_vsync_mode(DisplayServer.VSYNC_DISABLED)
	for child in world.get_children():
		if child is CanvasLayer:child.visible=false
	await pose(1.2,Vector2(50.,42.),132.,28.)
	var ocean=world.ocean_renderer;var inland=world.inland_water_material
	check("Inland shares the existing FFT normal texture",inland.get_shader_parameter("fft_ready")==true and inland.get_shader_parameter("fft_normal").get_rid()==world.water_material.get_shader_parameter("fft_normal").get_rid())
	check("Inland shares FFT history and cascade scales",inland.get_shader_parameter("fft_previous_normal").get_rid()==world.water_material.get_shader_parameter("fft_previous_normal").get_rid() and inland.get_shader_parameter("cascade_scales")==world.water_material.get_shader_parameter("cascade_scales"))
	check("No extra ocean meshes or simulation receivers",ocean.materials.size()==2 and ocean.wave_receivers.size()>=3 and ocean.wave_receivers.count(inland)==1)
	var expected=PackedVector3Array();var levels=world.read_json("data/regional/lake-levels.json")
	for lake in world.read_json("data/lakes.json"):
		for index in lake.indices:
			var p=lake.vertices[index];expected.append(Vector3(p[0],levels.get(str(lake.id),p[1]),p[2]))
	var matching=false;var geometry_error=INF;var actual_count=0
	for node in world.get_children():
		if node is MeshInstance3D and node.mesh!=null and node.mesh.get_surface_count()>0 and node.mesh.surface_get_material(0)==inland:
			var actual=node.mesh.get_faces();actual_count=actual.size()
			if actual.size()==expected.size():
				geometry_error=0.
				for i in expected.size():geometry_error=max(geometry_error,actual[i].distance_to(expected[i]))
				matching=geometry_error<.001
	check("All lake triangle positions and levels match original source",matching,{"vertices":expected.size(),"actualVertices":actual_count,"maximumRoundtripErrorKm":geometry_error})
	await freeze_at(0.);var first=image_now();first.save_png(directory+"/lake-t0.png")
	await freeze_at(2.);var second=image_now();second.save_png(directory+"/lake-t2.png")
	var delta=difference(first,second,Rect2i(200,200,800,400))
	check("Actual inland wave animation changes water pixels",delta.mean>.0001,delta)
	check("Shared pausable water clock reaches inland surface",inland.get_shader_parameter("water_time")==world.water_time and world.water_time==2.)
	ocean.resume_animation();world.set_water_animation(false)
	for i in 5:await process_frame
	var before_count=ocean.metrics.computeUpdates;first=image_now();var clock=world.water_time
	for i in 60:await process_frame
	second=image_now();delta=difference(first,second,Rect2i(200,200,800,400))
	check("Reduced motion freezes FFT scheduling and inland appearance",before_count==ocean.metrics.computeUpdates and world.water_time==clock and delta.mean<.000001,delta)
	world.water_animation_enabled=true
	await pose(1800.,Vector2(50.,44.),0.,65.)
	check("Inland uses approved full political presentation",world.political_map.blend==1. and inland.shader.code.contains("political_water_color"))
	var count=ocean.metrics.computeUpdates;ocean.resume_animation();world.water_animation_enabled=true
	for i in 30:await process_frame
	check("Political view retains suspended FFT updates",ocean.metrics.computeUpdates==count)
	await pose(1.2,Vector2(31.23,30.05),0.,38.)
	check("Nile material shares FFT receiver without duplicate registration",world.nile_material!=null and world.nile_material.shader==inland.shader and ocean.wave_receivers.count(world.nile_material)==1 and world.nile_material.get_shader_parameter("fft_ready")==true)
	world.validate_geography();check("Geography and research remain intact",world.sites.size()==35 and world.research.size()==687)
	var success=checks.all(func(c):return c.passed)
	print("INLAND_WATER_NATIVE ",success," checks=",checks.size())
	for i in 20000:
		await process_frame
		if i>90 and world.is_settled():break
	world.queue_free()
	for i in 10:await process_frame
	quit(0 if success else 1)
