extends "res://tools/reset-profile.gd"
var frame_reference={}
func draw():
	if world!=null and not frame_reference.is_empty():
		var p=frame_reference.position;var b=frame_reference.basis
		world.camera.position=Vector3(p[0],p[1],p[2]);world.camera.basis=Basis(Vector3(b[0],b[1],b[2]),Vector3(b[3],b[4],b[5]),Vector3(b[6],b[7],b[8]))
	RenderingServer.force_draw(true)
func camera_record():
	var c=world.camera;var b=c.basis
	return {"position":[c.position.x,c.position.y,c.position.z],"basis":[b.x.x,b.x.y,b.x.z,b.y.x,b.y.y,b.y.z,b.z.x,b.z.y,b.z.z],"fov":c.fov,"near":c.near,"far":c.far}
func run():
	output="res://evidence/anatolia-refinement/zoom-before";var references={}
	for arg in OS.get_cmdline_user_args():
		if arg.begins_with("--output="):output=arg.trim_prefix("--output=")
		if arg.begins_with("--reference="):
			for r in JSON.parse_string(FileAccess.get_file_as_string(arg.trim_prefix("--reference="))).frames:references[int(r.frame)]=r
	DirAccess.make_dir_recursive_absolute(ProjectSettings.globalize_path(output))
	RenderingServer.render_loop_enabled=false;process_frame.connect(draw)
	world=load("res://world.tscn").instantiate();root.add_child(world);world.capture_done=true
	Engine.max_fps=60;DisplayServer.window_set_vsync_mode(DisplayServer.VSYNC_DISABLED)
	for c in world.get_children():
		if c is CanvasLayer:c.visible=false
	world.focus=Vector2(32.3,37.1);world.goal_focus=world.focus;world.pitch=32.;world.yaw=35.;world.distance=360.;world.goal_distance=360.;world.queue_tiles()
	for i in 1800:
		await process_frame
		if i>120 and world.is_settled():break
	world.water_animation_enabled=false;world.water_time=0.;world.water_material.set_shader_parameter("water_time",0.);await world.ocean_renderer.capture_time(0.)
	var frames=[]
	for i in 181:
		var distance=exp(lerp(log(360.),log(18.),float(i)/180.))
		world.distance=distance;world.goal_distance=distance;world.queue_tiles()
		await process_frame
		if i%4!=0:continue
		frame_reference=references[i].camera if references.has(i) else {}
		draw();var file="zoom-%03d.png"%i
		assert(root.get_texture().get_image().save_png(output+"/"+file)==OK)
		var ready=0;var opacity=0.;var pending=world.scenery.pending_cells().size()
		for group in [world.scenery.roots,world.scenery.local_roots]:
			for node in group.values():
				if node.get_meta("ready",false):ready+=1;opacity+=float(node.get_meta("reveal",1.))
		frames.append({"frame":i,"distance":distance,"camera":camera_record(),"file":file,"readyCells":ready,"pendingCells":pending,"sumCellReveal":opacity})
	FileAccess.open(output+"/frames.json",FileAccess.WRITE).store_string(JSON.stringify({"frames":frames,"method":"Same 181 input steps, captures every fourth step; frozen sea. Playback is frame-indexed, not a measured real-time FPS comparison."},"  "))
	print("ANATOLIA_ZOOM_REVIEW_OK frames=",frames.size())
	world.queue_free()
	for i in 10:await process_frame
	quit()
