extends "res://tools/strategic-ocean-profile.gd"
var checks=[]
func check(name,ok,details={}):
	checks.append({"test":name,"passed":ok,"details":details});assert(ok,name)
func image_now():
	RenderingServer.force_draw(true);return root.get_texture().get_image()
func delta(a,b,rect):
	var total=0.;var largest=0.;var changed=0
	for y in range(rect.position.y,rect.end.y):
		for x in range(rect.position.x,rect.end.x):
			var c=a.get_pixel(x,y);var d=b.get_pixel(x,y)
			var difference=max(abs(c.r-d.r),max(abs(c.g-d.g),abs(c.b-d.b)))
			total+=difference;largest=max(largest,difference)
			if difference>1./255.:changed+=1
	return {"meanMaxChannel":total/rect.get_area(),"maxChannel":largest,"pixelsOverOneByte":changed}
func pose(distance,yaw=132.):
	world.comparison_camera={};world.focus=Vector2(11.65,42.22);world.goal_focus=world.focus;world.distance=distance;world.goal_distance=distance;world.pitch=28. if distance<=1.2 else 48.;world.yaw=yaw;world.queue_tiles()
	for i in 20000:
		await process_frame
		if i>=120 and world.is_settled():break
	assert(world.is_settled())
func sample(count):
	var frames=[];var gpu=[];var prev=Time.get_ticks_usec()
	for i in count:
		await process_frame;var now=Time.get_ticks_usec();frames.append((now-prev)/1000.);prev=now;gpu.append(RenderingServer.viewport_get_measured_render_time_gpu(root.get_viewport_rid()))
	return {"wall":statistics(frames),"gpu":world.sample_stats(gpu),"frameSamplesMs":frames}
func run():
	output="res://evidence/strategic-ocean-20261029/native"
	for arg in OS.get_cmdline_user_args():
		if arg.begins_with("--output="):output=arg.trim_prefix("--output=")
	DirAccess.make_dir_recursive_absolute(ProjectSettings.globalize_path(output))
	RenderingServer.render_loop_enabled=false;process_frame.connect(force_render)
	world=load("res://world.tscn").instantiate();root.add_child(world);world.capture_done=true
	Engine.max_fps=0;DisplayServer.window_set_vsync_mode(DisplayServer.VSYNC_DISABLED)
	for c in world.get_children():
		if c is CanvasLayer:c.visible=false
	world.marker_root.visible=false;renderer=world.get_meta("ocean_renderer")
	await pose(1.2)
	await set_clock(0.)
	var current_shader=renderer.materials[0].shader
	var original_shader=Shader.new();original_shader.code=FileAccess.get_file_as_string("res://evidence/strategic-ocean-20261029/before-ocean_surface.gdshader")
	for mat in renderer.materials:mat.shader=original_shader
	for i in 5:await process_frame
	var original=image_now();original.save_png(output+"/close-original.png")
	for mat in renderer.materials:mat.shader=current_shader
	for i in 5:await process_frame
	var current=image_now();current.save_png(output+"/close-current.png")
	var close_delta=delta(original,current,Rect2i(80,100,800,400))
	check("1.2 km original/current sunlight and wave pixels identical",close_delta.maxChannel==0.,close_delta)
	# Both materials retain the same world clock, including the local patch.
	check("Background and patch share the existing water clock",renderer.materials.all(func(m):return abs(float(m.get_shader_parameter("water_time"))-world.water_time)<.00001))
	await pose(59.3,-48.)
	for mat in renderer.materials:mat.set_shader_parameter("strategic_strength",1.)
	await set_clock(0.);var t0=image_now();t0.save_png(output+"/strategic-t0.png")
	await set_clock(12.);var t12=image_now();t12.save_png(output+"/strategic-t12.png")
	var animation_delta=delta(t0,t12,Rect2i(60,380,840,130))
	check("Strategic water visibly changes over 12 simulated seconds",animation_delta.pixelsOverOneByte>1000,animation_delta)
	var paused_time=world.water_time;var updates=renderer.metrics.computeUpdates
	world.set_water_animation(false)
	for i in 30:await process_frame
	var still=image_now();var pause_delta=delta(t12,still,Rect2i(60,380,840,130))
	check("Reduced motion holds world clock and wind-field pixels",world.water_time==paused_time and pause_delta.maxChannel==0.,pause_delta)
	check("Reduced motion does not schedule FFT work",renderer.metrics.computeUpdates==updates)
	world.set_water_animation(true);renderer.resume_animation()
	for i in 45:await process_frame
	check("Animation resumes existing FFT and shared clock",world.water_time>paused_time and renderer.metrics.computeUpdates>updates)
	# Same process, ABBA ordering limits thermal/order bias for incremental cost.
	root.size=Vector2i(1920,1080)
	for i in 90:await process_frame
	assert(root.get_texture().get_image().get_width()==1920)
	var abba=[]
	for enabled in [false,true,true,false]:
		for mat in renderer.materials:mat.set_shader_parameter("strategic_strength",1. if enabled else 0.)
		for i in 90:await process_frame
		var s=await sample(300);s["strategicEnabled"]=enabled;s["resolution"]=[1920,1080];abba.append(s)
	FileAccess.open(output+"/abba-performance.json",FileAccess.WRITE).store_string(JSON.stringify(abba,"  "))
	root.size=Vector2i(960,540)
	for i in 30:await process_frame
	for mat in renderer.materials:mat.set_shader_parameter("strategic_strength",1.)
	# Examine rendering either side of the new fade and old normal-path switches.
	world.water_animation_enabled=false
	var boundaries=[]
	for boundary in [4.,5.,8.,10.,24.]:
		var images=[]
		for offset in [-.001,.001]:
			world.distance=boundary+offset;world.goal_distance=world.distance
			await set_clock(0.);images.append(image_now())
		var d=delta(images[0],images[1],Rect2i(60,380,840,130));boundaries.append({"distanceKm":boundary,"delta":d})
		check("Continuous rendering around %s km" % boundary,d.meanMaxChannel<.02,d)
	# Native frames: fixed strategic ocean followed by zoom/pan/rotation.
	var folder=output+"/animation";DirAccess.make_dir_recursive_absolute(ProjectSettings.globalize_path(folder))
	var frames=[]
	await pose(59.3,-48.)
	world.water_animation_enabled=false
	for i in 144:
		var t=float(i)/12.
		if i>=96:
			var fraction=float(i-96)/47.
			world.distance=exp(lerp(log(59.3),log(1.2),fraction));world.goal_distance=world.distance;world.pitch=lerp(48.,28.,fraction);world.yaw=lerp(-48.,132.,fraction)
		await set_clock(t)
		var name="frame-%03d.webp" % i
		assert(image_now().save_webp(folder+"/"+name,false,.88)==OK)
		frames.append({"file":name,"distanceKm":world.distance,"yaw":world.yaw,"waterTime":t})
	FileAccess.open(folder+"/frames.json",FileAccess.WRITE).store_string(JSON.stringify({"fps":12,"frames":frames,"notice":"Native 960x540 deterministic Godot samples, 12 frames per simulated second. Not a real-time performance video. First 8 seconds fixed at 59.3 km; then zoom/rotation."},"  "))
	FileAccess.open(output+"/validation.json",FileAccess.WRITE).store_string(JSON.stringify({"passed":true,"checks":checks,"notice":"Rendering continuity and preservation, not artistic approval."},"  "))
	print("STRATEGIC_NATIVE_OK ",checks.size()," checks; 144 native frames");quit()
