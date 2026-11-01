extends "res://tools/map-repair-validate.gd"
func run():
	directory="res://evidence/vegetation-quality-20261030/native"
	for arg in OS.get_cmdline_user_args():
		if arg.begins_with("--output="):directory=arg.trim_prefix("--output=")
	DirAccess.make_dir_recursive_absolute(ProjectSettings.globalize_path(directory))
	RenderingServer.render_loop_enabled=false;process_frame.connect(draw)
	world=load("res://world.tscn").instantiate();root.add_child(world);world.capture_done=true
	Engine.max_fps=0;DisplayServer.window_set_vsync_mode(DisplayServer.VSYNC_DISABLED)
	for child in world.get_children():
		if child is CanvasLayer:child.visible=false
	await pose(1.2,Vector2(12.67,41.73),0.,38.)
	var quality=world.scenery.quality
	check("Trial is bounded to central Italy",quality.contains(12.5,41.9) and quality.contains(12.67,41.73) and not quality.contains(24.7,59.45) and not quality.contains(31.,30.))
	var catalog=JSON.parse_string(FileAccess.get_file_as_string(quality.ROOT+"catalog.json"))
	check("Twenty original generated variants and three detailed LODs",catalog.records.size()==20 and catalog.records.all(func(r):return r.triangles.size()==3 and r.triangles[2]<r.triangles[1] and r.triangles[1]<r.triangles[0]))
	var valid=true
	for i in 20:
		var mesh=quality.mesh_for(i);var stand=quality.mesh_for(i,true)
		valid=valid and mesh.get_surface_count()==1 and mesh.surface_get_arrays(0)[Mesh.ARRAY_INDEX].size()==6 and stand.surface_get_arrays(0)[Mesh.ARRAY_INDEX].size()==72
	check("Campaign uses two triangles per tree and twelve-tree stand impostors",valid)
	check("Unsupported palm/rock assets retain legacy fallback",quality.mesh_for(20)==null and quality.mesh_for(24)==null)
	check("Twenty directional atlases have eight azimuths and three elevations",quality.impostors.size()==20 and quality.textures["oak-0-atlas"].get_width()==2048 and quality.textures["oak-0-atlas"].get_height()==768)
	check("Detailed generated meshes remain usable in Godot",quality.detail_mesh_for(0).get_surface_count()==2)
	world.set_water_animation(false)
	for i in 4:await process_frame
	var first=image_now()
	for i in 30:await process_frame
	var delta=difference(first,image_now(),Rect2i(200,200,800,400))
	check("Shared reduced-motion clock freezes tree shading",delta.mean<.000001,delta)
	var samples=[];var previous=Time.get_ticks_usec()
	for i in 240:
		world.yaw=float(i)/239.*360.
		await process_frame
		var now=Time.get_ticks_usec();samples.append((now-previous)/1000.);previous=now
	FileAccess.open(directory+"/motion.json",FileAccess.WRITE).store_string(JSON.stringify({"statistics":statistics(samples),"frameSamplesMs":samples,"route":"One 360-degree Aricia orbit, 240 uncapped forced submitted frames. Screenshots captured separately after measurement. Not a sustained benchmark."},"  "))
	check("Camera rotation and all intermediate atlas directions render",samples.size()==240 and world.is_settled())
	for angle in [0.,90.,180.,270.]:
		world.yaw=angle
		for i in 4:await process_frame
		image_now().save_png(directory+"/orbit-"+str(int(angle))+".png")
	for distance in [8.,15.,32.,59.3,180.,1.2]:
		await pose(distance,Vector2(12.67,41.73),0.,38.)
	check("Local/coarse/political transitions return to close geography",world.political_map.blend==0. and world.distance==1.2 and world.is_settled())
	world.validate_geography();check("Protected geography and records remain intact",world.sites.size()==35 and world.research.size()==687)
	var success=checks.all(func(c):return c.passed)
	print("VEGETATION_QUALITY_NATIVE ",success," checks=",checks.size())
	for i in 20000:
		await process_frame
		if i>90 and world.is_settled():break
	world.queue_free()
	for i in 10:await process_frame
	quit(0 if success else 1)
