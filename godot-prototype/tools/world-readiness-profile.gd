extends "res://tools/reset-profile.gd"
## Identical bounded route before/after; image readbacks excluded from timings.
var stage="before"
var cache_mode="cold"
func draw():RenderingServer.force_draw(true)
func run():
	for arg in OS.get_cmdline_user_args():
		if arg.begins_with("--stage="):stage=arg.trim_prefix("--stage=")
		if arg.begins_with("--cache="):cache_mode=arg.trim_prefix("--cache=")
	output="res://evidence/world-readiness/"+stage+"-"+cache_mode
	DirAccess.make_dir_recursive_absolute(ProjectSettings.globalize_path(output))
	root.mode=Window.MODE_WINDOWED;root.size=Vector2i(1280,720)
	RenderingServer.render_loop_enabled=false;process_frame.connect(draw)
	var start=Time.get_ticks_msec()
	var scene_path="res://evidence/world-readiness/baseline-source/world.tscn" if stage=="before" and FileAccess.file_exists("res://evidence/world-readiness/baseline-source/world.tscn") else "res://world.tscn"
	world=load(scene_path).instantiate();root.add_child(world)
	root.size=Vector2i(1280,720)
	world.capture_done=true;world.automation_input_locked=true;world.startup_preparation_requested=true
	var cache_file="res://evidence/world-readiness/"+stage+"-cache-namespace.txt"
	if cache_mode=="cold":
		world.scenery.cache_signature+="-world-readiness-v1-"+str(Time.get_ticks_usec())
		FileAccess.open(cache_file,FileAccess.WRITE).store_string(world.scenery.cache_signature)
	elif FileAccess.file_exists(cache_file):world.scenery.cache_signature=FileAccess.get_file_as_string(cache_file)
	var constructed=Time.get_ticks_msec()-start
	Engine.max_fps=0;DisplayServer.window_set_vsync_mode(DisplayServer.VSYNC_DISABLED)
	while world.detail_loading.covering and Time.get_ticks_msec()-start<300000:await process_frame
	assert(not world.detail_loading.covering,"Startup exceeded 300 seconds")
	var report={"stage":stage,"cache":cache_mode,"adapter":RenderingServer.get_video_adapter_name(),"constructedMs":constructed,"startupMs":Time.get_ticks_msec()-start,"startup":world.detail_loading.metrics.duplicate(true),"routes":[],"method":"Native GPU, 1280x720, same teleport/zoom route; 8-second navigation windows. PNG readbacks occur outside frame measurements. Cold means unique placement-cache namespace, not flushed OS or driver caches."}
	report["viewportSize"]=[root.size.x,root.size.y];report["cacheNamespace"]=world.scenery.cache_signature
	await RenderingServer.frame_post_draw;root.get_texture().get_image().save_png(output+"/startup.png")
	var views=world.read_json("data/world-coast-views.json")
	# Source segment in the eastern Black Sea, without modifying any geography.
	var target=world.project(41.64,41.64);var best=INF;var chosen=Vector2(41.64,41.64)
	for y in range(-10,11):
		for x in range(-10,11):
			for id in world.coastal_focus.catalog.ids_at(Vector2(target.x+x,target.z+y)):
				var s=world.coastal_focus.catalog.segment(id);var p=Vector2((s[0]+s[2])*.5,(s[1]+s[3])*.5);var d=p.distance_squared_to(Vector2(target.x,target.z))
				if d<best:best=d;chosen=world.unproject(Vector3(p.x,0,p.y))
	views["blacksea"]=[chosen.x,chosen.y,1.2,25.,0.]
	for name in ["tarquinii","delta","aegean","blacksea","brittany","delta"]:
		var v=views[name];world.focus=Vector2(v[0],v[1]);world.goal_focus=world.focus;world.distance=v[2];world.goal_distance=v[2];world.pitch=v[3];world.yaw=v[4];world.queue_tiles()
		var frames=[];var began=Time.get_ticks_usec();var previous=began;var ready=-1;var arrival={}
		while Time.get_ticks_usec()-began<8000000:
			await process_frame
			var now=Time.get_ticks_usec();frames.append((now-previous)/1000.);previous=now
			var coast=world.coastal_focus
			if frames.size()==1:arrival={"baseline":coast.get("baseline_ready")==true,"detailActive":coast.active,"detailBusy":coast.busy,"terrainPending":world.queue.size()}
			if ready<0 and coast.is_ready():ready=(now-began)/1000.
		var terrain=world.get("streaming_metrics")
		var row={"name":name,"focus":[v[0],v[1]],"arrival":arrival,"coastReadyMs":ready,"frames":statistics(frames),"coast":world.coastal_focus.metrics.duplicate(true),"terrain":terrain.duplicate(true) if terrain!=null else null,"staticBytes":OS.get_static_memory_usage(),"videoBytes":RenderingServer.get_rendering_info(RenderingServer.RENDERING_INFO_VIDEO_MEM_USED)}
		report.routes.append(row)
		await RenderingServer.frame_post_draw;root.get_texture().get_image().save_png(output+"/"+str(report.routes.size())+"-"+name+".png")
		world.distance=2800.;world.goal_distance=2800.;await process_frame
		FileAccess.open(output+"/profile.json",FileAccess.WRITE).store_string(JSON.stringify(report,"  "))
		print("READINESS_ROUTE ",name," ready_ms=",ready," frame_mean=",row.frames.meanMs)
	world.distance=2800.;world.goal_distance=2800.
	var cleanup=Time.get_ticks_msec()
	while (world.scenery.busy or world.coastal_focus.busy) and Time.get_ticks_msec()-cleanup<60000:await process_frame
	world.queue_free();for i in 12:await process_frame
	print("WORLD_READINESS_PROFILE_DONE ",stage," ",cache_mode);quit()
