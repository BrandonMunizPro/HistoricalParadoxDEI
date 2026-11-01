extends SceneTree
var world
func _initialize():call_deferred("run")
func run():
	var output="res://evidence/ocean-20261028/animation"
	DirAccess.make_dir_recursive_absolute(ProjectSettings.globalize_path(output))
	RenderingServer.render_loop_enabled=false
	process_frame.connect(func():RenderingServer.force_draw(true))
	world=load("res://world.tscn").instantiate();root.add_child(world);world.capture_done=true
	Engine.max_fps=0;DisplayServer.window_set_vsync_mode(DisplayServer.VSYNC_DISABLED)
	world.focus=Vector2(11.65,42.22);world.goal_focus=world.focus;world.distance=.16;world.goal_distance=.16;world.pitch=10.;world.yaw=-70.;world.queue_tiles()
	for child in world.get_children():
		if child is CanvasLayer:child.visible=false
	world.marker_root.visible=false
	for i in 1800:
		await process_frame
		if i>=90 and world.is_settled():break
	assert(world.is_settled())
	world.water_animation_enabled=false
	var renderer=world.get_meta("ocean_renderer")
	var frames=[]
	for i in 120:
		var t=float(i)/24.
		var movement=smoothstep(0.,1.,clamp(float(i-48)/71.,0.,1.))
		world.distance=exp(lerp(log(.16),log(2.2),movement));world.goal_distance=world.distance
		world.pitch=lerp(10.,30.,movement);world.yaw=lerp(-70.,-40.,movement)
		await renderer.capture_time(t)
		await process_frame
		RenderingServer.force_draw(true)
		var path="frame-%03d.webp" % i
		var image=root.get_texture().get_image();assert(image.get_width()==960 and image.get_height()==540)
		assert(image.save_webp(output+"/"+path,false,.78)==OK)
		frames.append({"file":path,"waterTimeSeconds":t,"distanceKm":world.distance,"pitch":world.pitch,"yaw":world.yaw})
	FileAccess.open(output+"/frames.json",FileAccess.WRITE).store_string(JSON.stringify({"fps":24,"frames":frames,"notice":"Deterministic native Godot frames, 960x540, first fixed low-water view then zoom/rotation. Not a real-time performance recording."},"  "))
	print("OCEAN_ANIMATION_OK 120 native frames");quit()
