extends "res://tools/map-repair-validate.gd"
func run():
	directory="res://evidence/shoreline-repair-20261029/native"
	for arg in OS.get_cmdline_user_args():
		if arg.begins_with("--output="):directory=arg.trim_prefix("--output=")
	DirAccess.make_dir_recursive_absolute(ProjectSettings.globalize_path(directory))
	RenderingServer.render_loop_enabled=false;process_frame.connect(draw)
	world=load("res://world.tscn").instantiate();root.add_child(world);world.capture_done=true
	Engine.max_fps=0;DisplayServer.window_set_vsync_mode(DisplayServer.VSYNC_DISABLED)
	for child in world.get_children():
		if child is CanvasLayer:child.visible=false
	var current=world.water_material.shader
	var previous=Shader.new();previous.code=FileAccess.get_file_as_string("res://evidence/shoreline-repair-20261029/before-ocean_surface.gdshader")
	var coast=Image.load_from_file("res://data/tiles/context-coast.png")
	var reproduced=0;var results=[]
	for v in [[1087.3,18.,0.,50.,44.],[1087.3,30.,0.,50.,44.],[1087.3,35.,30.,49.,44.],[1087.3,18.,-30.,49.,44.],[785.6,12.,0.,50.,45.],[785.6,30.,0.,50.,45.],[785.6,45.,45.,50.,45.],[180.,8.,0.,49.,46.],[3300.,65.,0.,50.,44.],[8500.,65.,0.,50.,44.]]:
		await pose(v[0],Vector2(v[3],v[4]),v[2],v[1])
		var after=land_samples(image_now(),coast)
		for mat in world.ocean_renderer.materials:mat.shader=previous
		for i in 4:await process_frame
		var before=land_samples(image_now(),coast)
		var name="%s-%s-%s"%[v[0],v[1],v[2]]
		if before.waterColoredLandProbes>before.sourceLandProbes*.05 and before.sourceLandProbes>100:
			reproduced+=1
			image_now().save_png(directory+"/reproduced-"+name+".png")
		results.append({"pose":v,"before":before,"after":after})
		check("Source land remains visible at "+name,after.sourceLandProbes>100 and after.waterColoredLandProbes<after.sourceLandProbes*.02,results[-1])
		for mat in world.ocean_renderer.materials:mat.shader=current
		if before.waterColoredLandProbes>before.sourceLandProbes*.05:
			for i in 4:await process_frame
			image_now().save_png(directory+"/repaired-"+name+".png")
	check("Reproduced previous low-angle defect",reproduced>0,{"reproducedPoses":reproduced})
	await pose(1.2,Vector2(11.65,42.22),132.,28.)
	var after=image_now()
	for mat in world.ocean_renderer.materials:mat.shader=previous
	for i in 4:await process_frame
	var before=image_now();var delta=difference(before,after,Rect2i(200,200,800,400))
	check("Close wave appearance preserved",delta.mean<.0001,delta)
	for mat in world.ocean_renderer.materials:mat.shader=current
	world.validate_geography();check("Geography preserved",world.sites.size()==35 and world.research.size()==687)
	FileAccess.open(directory+"/poses.json",FileAccess.WRITE).store_string(JSON.stringify(results,"  "))
	var success=checks.all(func(c):return c.passed)
	print("SHORELINE_REPAIR_NATIVE ",success," checks=",checks.size())
	for i in 20000:
		await process_frame
		if i>90 and world.is_settled():break
	world.queue_free()
	for i in 10:await process_frame
	quit(0 if success else 1)
