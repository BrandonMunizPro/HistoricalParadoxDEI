extends "res://tools/reset-profile.gd"
func draw():
	if reference_candidate and not revision and world!=null:
		RenderingServer.global_shader_parameter_set("political_blend",.28)
	if world!=null and not capture_basis.is_empty():
		world.camera.basis=Basis(Vector3(capture_basis[0.0],capture_basis[1.0],capture_basis[2.0]),Vector3(capture_basis[3.0],capture_basis[4.0],capture_basis[5.0]),Vector3(capture_basis[6.0],capture_basis[7.0],capture_basis[8.0]))
	RenderingServer.force_draw(true)
var capture_basis=[]
var reference_candidate=false
var revision=true
func run():
	root.gui_disable_input=true # Keep transient hover tooltips out of matched captures.
	output="res://evidence/northern-expansion/before"
	var only="";var reference={}
	for arg in OS.get_cmdline_user_args():
		if arg=="--candidate":reference_candidate=true
		if arg=="--revision":revision=true;reference_candidate=true
		if arg.begins_with("--output="):output=arg.trim_prefix("--output=")
		if arg.begins_with("--only="):only=arg.trim_prefix("--only=")
		if arg.begins_with("--reference="):
			for v in JSON.parse_string(FileAccess.get_file_as_string(arg.trim_prefix("--reference="))).views:reference[v.name]=v
	RenderingServer.render_loop_enabled=false;process_frame.connect(draw)
	DirAccess.make_dir_recursive_absolute(ProjectSettings.globalize_path(output))
	world=load("res://world.tscn").instantiate()
	world.set_script(load("res://northern_italy_world.gd" if revision else "res://world.gd"))
	root.add_child(world);world.capture_done=true
	FileAccess.open(output+"/terrain-shader.txt",FileAccess.WRITE).store_string(world.base_material.shader.code)
	Engine.max_fps=0;DisplayServer.window_set_vsync_mode(DisplayServer.VSYNC_DISABLED)
	for c in world.get_children():
		if c is CanvasLayer and c.name!="FactionCartography":c.visible=false
	var views={"gaul-overview":[2.5,46.5,1500,60,0],"massif-central":[2.8,45.2,180,43,20],"armorica":[-3.5,48.2,200,45,0],"loire-basin":[1,47.3,300,48,0],"rhone":[4.7,44.5,170,43,15],"pyrenees-seam":[.5,43,230,45,0],"alps-seam":[6,45.5,230,45,0],"britannia-overview":[-3,54.5,1300,60,0],"highlands":[-4.8,57.2,180,43,20],"pennines":[-2.2,54,150,43,10],"wales":[-3.8,52.8,150,43,10],"chalk-downs":[-.6,51,170,43,0],"ireland":[-8,53.4,300,48,0],"italy-control":[12.5,42.3,430,48,0],"sicily-control":[14.2,37.6,520,57,0],"illyria-control":[19.2,42.2,270,45,0],"greece-control":[22.4,38.2,250,42,0],"anatolia-control":[32.3,37.1,90,30,35],"egypt-control":[31.1,29.8,360,48,0],"libya-control":[22,32.1,340,45,0]}
	var records=[]
	for name in views:
		if only!="" and not name in only.split(","):continue
		var v=views[name]
		world.comparison_camera={};world.focus=Vector2(float(v[0.0]),float(v[1.0]));world.goal_focus=world.focus;world.distance=float(v[2.0]);world.goal_distance=float(v[2.0]);world.pitch=float(v[3.0]);world.yaw=float(v[4.0]);world.queue_tiles()
		if reference.has(name):world.comparison_camera={"position":reference[name].camera.position,"distance":float(v[2.0]),"pitch":float(v[3.0]),"yaw":float(v[4.0])}
		capture_basis=reference[name].camera.basis if reference.has(name) else []
		var start=Time.get_ticks_msec()
		for i in 30000:
			await process_frame
			if i>=120 and world.is_settled():break
			assert(Time.get_ticks_msec()-start<120000)
		var samples=[];var gpu=[];var prev=Time.get_ticks_usec()
		for i in 30:
			await process_frame;var now=Time.get_ticks_usec();samples.append((now-prev)/1000.);prev=now;gpu.append(RenderingServer.viewport_get_measured_render_time_gpu(root.get_viewport_rid()))
		if reference_candidate:
			world.sun.light_energy=1.35
			world.sun.rotation_degrees=Vector3(-24,-62.0,0)
		world.water_animation_enabled=false;world.water_time=0.;world.water_material.set_shader_parameter("water_time",0.)
		await world.ocean_renderer.capture_time(0.);await process_frame
		draw();assert(root.get_texture().get_image().save_png(output+"/"+name+".png")==OK)
		var camera=world.camera
		records.append({"name":name,"preset":v,"camera":{"position":[camera.position.x,camera.position.y,camera.position.z],"basis":[camera.basis.x.x,camera.basis.x.y,camera.basis.x.z,camera.basis.y.x,camera.basis.y.y,camera.basis.y.z,camera.basis.z.x,camera.basis.z.y,camera.basis.z.z],"fov":camera.fov,"near":camera.near,"far":camera.far},"steady":statistics(samples),"gpu":world.sample_stats(gpu),"frameSamplesMs":samples,"drawCalls":Performance.get_monitor(Performance.RENDER_TOTAL_DRAW_CALLS_IN_FRAME),"resident":world.resident.keys(),"political":world.political_map.blend})
		records[-1]["cpuStagesMs"]=world.previous_cpu_stages.duplicate(true)
		records[-1]["regionalCpuMs"]=world.regional_cpu_ms.duplicate(true)
		records[-1]["easternResidency"]={}
		for surface in world.eastern_surfaces:records[-1].easternResidency[surface.region]=surface.resident.size()
		records[-1]["sceneryInstances"]=world.scenery.resident_instances()
		records[-1]["staticMemoryBytes"]=OS.get_static_memory_usage()
		records[-1]["videoMemoryBytes"]=RenderingServer.get_rendering_info(RenderingServer.RENDERING_INFO_VIDEO_MEM_USED)
		records[-1]["labelDrawMs"]=world.reference_labels.last_draw_ms
		records[-1]["renderCpuMs"]=RenderingServer.viewport_get_measured_render_time_cpu(root.get_viewport_rid())
		FileAccess.open(output+"/views.json",FileAccess.WRITE).store_string(JSON.stringify({"views":records,"method":"30 uncapped controlled submitted wall intervals per settled view; VSync off; hidden-window force_draw, not a sustained benchmark or scan-out."},"  "))
		print("MAP_AUDIT_CAPTURE ",name)
		world.water_animation_enabled=true;world.ocean_renderer.resume_animation()
	for i in 30000:
		await process_frame
		if i>90 and world.is_settled():break
	world.queue_free()
	for i in 10:await process_frame
	quit()
