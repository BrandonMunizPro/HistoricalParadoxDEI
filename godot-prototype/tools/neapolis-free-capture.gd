extends "res://tools/reset-profile.gd"
var fixed_camera={}
func draw():
	if world!=null and not fixed_camera.is_empty():
		var p=fixed_camera.position;var b=fixed_camera.basis
		world.camera.position=Vector3(p[0],p[1],p[2]);world.camera.basis=Basis(Vector3(b[0],b[1],b[2]),Vector3(b[3],b[4],b[5]),Vector3(b[6],b[7],b[8]))
	RenderingServer.force_draw(true)
func camera_record():
	var c=world.camera;var b=c.basis
	return {"position":[c.position.x,c.position.y,c.position.z],"basis":[b.x.x,b.x.y,b.x.z,b.y.x,b.y.y,b.y.z,b.z.x,b.z.y,b.z.z],"fov":c.fov,"near":c.near,"far":c.far}
func cameras_match(a,b):
	for key in ["position","basis"]:
		for i in a[key].size():
			if abs(a[key][i]-b[key][i])>1e-9:return false
	for key in ["fov","near","far"]:
		if abs(a[key]-b[key])>1e-9:return false
	return true
func run():
	output="res://evidence/neapolis-free/before";var references={};var candidate=false
	for arg in OS.get_cmdline_user_args():
		if arg=="--candidate":candidate=true
		if arg.begins_with("--output="):output=arg.trim_prefix("--output=")
		if arg.begins_with("--reference="):
			for r in JSON.parse_string(FileAccess.get_file_as_string(arg.trim_prefix("--reference="))).views:references[r.name]=r
	DirAccess.make_dir_recursive_absolute(ProjectSettings.globalize_path(output))
	RenderingServer.render_loop_enabled=false;process_frame.connect(draw)
	world=load("res://world.tscn").instantiate();root.add_child(world);world.capture_done=true
	world.settlements.set_neapolis_trial(candidate)
	Engine.max_fps=0;DisplayServer.window_set_vsync_mode(DisplayServer.VSYNC_DISABLED)
	for c in world.get_children():
		if c is CanvasLayer and c.name!="FactionCartography":c.visible=false
	var views={"strategic":[14.25287,40.839995,60.,45.,0.],"regional":[14.25287,40.839995,12.,45.,0.],"close":[14.25287,40.839995,1.5,45.,0.],"oblique":[14.25287,40.839995,.8,32.,45.],"roma-control":[12.491258174554883,41.8899769864849,12.,45.,0.],"catana-control":[15.088142,37.502959,12.,45.,0.]}
	var records=[]
	for name in views:
		fixed_camera={};world.comparison_camera={}
		var v=views[name];world.focus=Vector2(v[0],v[1]);world.goal_focus=world.focus;world.distance=v[2];world.goal_distance=v[2];world.pitch=v[3];world.yaw=v[4];world.queue_tiles()
		if references.has(name):
			fixed_camera=references[name].camera
			world.comparison_camera={"position":fixed_camera.position,"distance":v[2],"pitch":v[3],"yaw":v[4]}
		var start=Time.get_ticks_msec()
		print("NEAPOLIS_VIEW_BEGIN ",name)
		for i in 30000:
			await process_frame
			if i>120 and world.is_settled():break
			assert(Time.get_ticks_msec()-start<600000,"Readiness timeout")
		assert(world.is_settled())
		world.water_animation_enabled=false;world.water_time=0.;world.water_material.set_shader_parameter("water_time",0.);await world.ocean_renderer.capture_time(0.)
		var samples=[];var gpu=[];var render_cpu=[];var settlement_cpu=[];var draws=[];var prev=Time.get_ticks_usec()
		for i in 180:
			await process_frame;var now=Time.get_ticks_usec();samples.append((now-prev)/1000.);prev=now
			gpu.append(RenderingServer.viewport_get_measured_render_time_gpu(root.get_viewport_rid()));render_cpu.append(RenderingServer.viewport_get_measured_render_time_cpu(root.get_viewport_rid()))
			settlement_cpu.append(world.previous_cpu_stages.get("settlements",world.previous_cpu_stages.get("city",0.)));draws.append(Performance.get_monitor(Performance.RENDER_TOTAL_DRAW_CALLS_IN_FRAME))
		draw();assert(root.get_texture().get_image().save_png(output+"/"+name+".png")==OK)
		if references.has(name):assert(cameras_match(camera_record(),references[name].camera),"Camera comparison mismatch")
		var target={}
		for id in world.settlements.nodes:
			var n=world.settlements.nodes[id]
			if n.get_meta("anchor",Vector2.ZERO).distance_to(Vector2(14.25287,40.839995))<.00001:
				target={"id":id,"slotCount":n.multimesh.instance_count,"geometry":n.get_meta("neapolis_geometry",{}),"transformHash":n.get_meta("neapolis_slot_hash","baseline-not-instrumented")}
		records.append({"name":name,"preset":v,"camera":camera_record(),"submitted":world.sample_stats(samples),"gpu":world.sample_stats(gpu),"renderCpu":world.sample_stats(render_cpu),"settlementCpu":world.sample_stats(settlement_cpu),"drawCalls":world.sample_stats(draws),"textureMemoryBytes":Performance.get_monitor(Performance.RENDER_TEXTURE_MEM_USED),"target":target,"settlementStats":world.settlements.stats.duplicate(true),"cpuStages":world.previous_cpu_stages.duplicate(true)})
		FileAccess.open(output+"/views.json",FileAccess.WRITE).store_string(JSON.stringify({"views":records,"candidate":candidate,"notice":"180 uncapped hidden-window submitted intervals per settled camera; GPU/CPU diagnostics separate; not sustained interactive FPS."},"  "))
		print("NEAPOLIS_CAPTURE_OK ",name)
	if candidate:await motion_review()
	world.queue_free()
	for i in 30:await process_frame
	quit()
func motion_review():
	var all=[];var baseline=[]
	DirAccess.make_dir_recursive_absolute(ProjectSettings.globalize_path(output+"/motion"))
	for trial in [false,true]:
		fixed_camera={};world.comparison_camera={};world.settlements.set_neapolis_trial(trial)
		world.focus=Vector2(14.25287,40.839995);world.goal_focus=world.focus;world.distance=36.;world.goal_distance=36.;world.pitch=45.;world.yaw=0.;world.queue_tiles()
		for i in 30000:
			await process_frame
			if i>120 and world.is_settled():break
		assert(world.is_settled())
		var previous=Time.get_ticks_usec()
		for i in 120:
			var u=float(i)/119.;world.distance=36.*pow(.8/36.,u);world.goal_distance=world.distance;world.pitch=lerp(45.,32.,u);world.yaw=45.*u;world.queue_tiles()
			if trial:fixed_camera=baseline[i].camera
			await process_frame;draw()
			var now=Time.get_ticks_usec();var frame={"candidate":trial,"frame":i,"camera":camera_record(),"distance":world.distance,"intervalMs":(now-previous)/1000.,"gpuMs":RenderingServer.viewport_get_measured_render_time_gpu(root.get_viewport_rid()),"settled":world.is_settled()};previous=now
			if trial:assert(cameras_match(frame.camera,baseline[i].camera))
			else:baseline.append(frame)
			all.append(frame)
			if i%20==0 or i==119:
				root.get_texture().get_image().save_png(output+"/motion/%s-%03d.png"%["candidate" if trial else "baseline",i])
		print("NEAPOLIS_MOTION_OK ",trial)
	FileAccess.open(output+"/motion.json",FileAccess.WRITE).store_string(JSON.stringify({"frames":all,"notice":"Frame-indexed scripted zoom and rotation from 36 to 0.8 km, identical recorded transforms. One submitted frame per step, including live streaming/LOD construction; frame timing is diagnostic, not sustained FPS."},"  "))
