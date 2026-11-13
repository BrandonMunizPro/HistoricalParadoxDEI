extends SceneTree
var world
var stage="before"
var output=""
var report={}
var production=false
func _initialize():call_deferred("run")
func draw():RenderingServer.force_draw(true)
func stats(values):
	values.sort();var total=0.
	for value in values:total+=value
	return {"meanMs":total/maxi(1,values.size()),"p99Ms":values[mini(values.size()-1,int(values.size()*.99))],"maxMs":values[-1]}
func centre_ready():
	var key="local|%d|%d"%[floori(world.focus.x/.05),floori(world.focus.y/.05)]
	return world.scenery.local_roots.has(key) and world.scenery.local_roots[key].get_meta("ready",false) and world.scenery.local_roots[key].get_meta("reveal",0.)>=.99
func local_ready():
	var center=Vector2i(floori(world.focus.x/.05),floori(world.focus.y/.05))
	for y in [-1,0,1]:
		for x in [-1,0,1]:
			var key="local|%d|%d"%[center.x+x,center.y+y]
			if not world.scenery.local_roots.has(key) or not world.scenery.local_roots[key].get_meta("ready",false) or world.scenery.local_roots[key].get_meta("reveal",0.)<.99:return false
	return true
func trial(name,point):
	world.focus=point;world.goal_focus=point;world.distance=100.;world.goal_distance=100.;world.pitch=38.;world.yaw=0.;world.queue_tiles()
	var start=Time.get_ticks_msec();var previous=Time.get_ticks_usec();var crossed=-1;var centre=-1;var complete=-1;var frames=[]
	while Time.get_ticks_msec()-start<90000:
		var elapsed=Time.get_ticks_msec()-start
		world.goal_distance=100.*pow(.02,min(1.,elapsed/4000.))
		await process_frame
		var now=Time.get_ticks_usec();frames.append((now-previous)/1000.);previous=now;elapsed=Time.get_ticks_msec()-start
		if crossed<0 and world.distance<32.:crossed=elapsed
		if crossed>=0 and centre<0 and centre_ready():centre=elapsed
		if crossed>=0 and local_ready():complete=elapsed;break
	var plants=0;var rocks=0
	var draw_calls=RenderingServer.get_rendering_info(RenderingServer.RENDERING_INFO_TOTAL_DRAW_CALLS_IN_FRAME)
	for key in world.scenery.local_roots:
		plants+=int(world.scenery.local_roots[key].get_meta("plants",0));rocks+=int(world.scenery.local_roots[key].get_meta("rocks",0))
	var row={"name":name,"thresholdMs":crossed,"centreDelayMs":maxi(0,centre-crossed) if centre>=0 else -1,"allNineDelayMs":maxi(0,complete-crossed) if complete>=0 else -1,"timedOut":complete<0,"frames":stats(frames),"plantsResident":plants,"rocksResident":rocks,"instancesResident":world.scenery.resident_instances(),"staticBytes":OS.get_static_memory_usage(),"videoBytes":RenderingServer.get_rendering_info(RenderingServer.RENDERING_INFO_VIDEO_MEM_USED),"work":world.scenery.work_profile.duplicate(true)}
	row["drawCallsAtReady"]=draw_calls
	row["loadingScreens"]=world.detail_loading.metrics.screens if world.detail_loading!=null else 0
	report.trials.append(row);FileAccess.open(output+"/profile.json",FileAccess.WRITE).store_string(JSON.stringify(report,"  "));print("CLOSE_VEGETATION_TRIAL ",JSON.stringify(row))
	await RenderingServer.frame_post_draw;root.get_texture().get_image().save_png(output+"/"+name+".png")
func run():
	for arg in OS.get_cmdline_user_args():
		if arg.begins_with("--stage="):stage=arg.trim_prefix("--stage=")
		if arg=="--production-startup":production=true
	output="res://evidence/close-vegetation/"+stage;DirAccess.make_dir_recursive_absolute(ProjectSettings.globalize_path(output))
	RenderingServer.render_loop_enabled=false;process_frame.connect(draw)
	world=load("res://world.tscn").instantiate();world.startup_preparation_requested=production;root.add_child(world);world.capture_done=true;world.automation_input_locked=true
	Engine.max_fps=0;DisplayServer.window_set_vsync_mode(DisplayServer.VSYNC_DISABLED)
	if not production:await world.coastal_focus.catalog.preload_all(self)
	while world.detail_loading!=null and world.detail_loading.covering:await process_frame
	world.scenery.cache_signature+="-close-profile-"+stage+"-"+str(Time.get_ticks_usec())
	report={"stage":stage,"adapter":RenderingServer.get_video_adapter_name(),"method":"Native Forward+ 1920x1080. Whole coast source catalog preloaded. Isolated empty placement cache; driver/OS caches not flushed. Four-second eased zoom from 100 to 2 km. Centre/all-nine include existing reveal fade. Captures occur after timed intervals. Travel between routes does not wait for obsolete coarse jobs.","productionStartup":production,"trials":[]}
	if production:report["startup"]=world.detail_loading.metrics.duplicate(true)
	await trial("italy-cold",Vector2(12.67,41.73))
	await trial("gaul-cold",Vector2(2.3,46.6))
	await trial("messina-cold",Vector2(15.55,38.18))
	if stage.begins_with("final"):
		await trial("gaul-resident-revisit",Vector2(2.3,46.6))
		await trial("italy-resident-revisit",Vector2(12.67,41.73))
		await trial("baltic-cold",Vector2(24.7,59.45))
		await trial("nile-cold",Vector2(31.18,30.13))
	world.distance=600.;world.goal_distance=600.
	while world.scenery.busy:await process_frame
	world.queue_free();for i in 20:await process_frame
	print("CLOSE_VEGETATION_DONE ",stage);quit()
