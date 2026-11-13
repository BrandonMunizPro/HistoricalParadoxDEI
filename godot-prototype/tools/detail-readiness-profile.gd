extends SceneTree
## Timing runner only. Startup-only camera behavior is validated by detail-boot-validate.gd.
## Native, real-GPU cold/warm routes; no historical inputs are written.
var world
var phase="before"
var output=""
var report={}
func _initialize():call_deferred("run")
func draw():RenderingServer.force_draw(true)
func stats(values):
	if values.is_empty():return {}
	var sorted=values.duplicate();sorted.sort();var sum=0.
	for value in sorted:sum+=value
	return {"samples":sorted.size(),"meanMs":sum/sorted.size(),"p99Ms":sorted[mini(sorted.size()-1,int(sorted.size()*.99))],"maxMs":sorted[-1]}
func local_complete():
	var center=Vector2i(floori(world.focus.x/.05),floori(world.focus.y/.05))
	for y in [-1,0,1]:
		for x in [-1,0,1]:
			var key="local|%d|%d"%[center.x+x,center.y+y]
			if not world.scenery.local_roots.has(key):return false
			var node=world.scenery.local_roots[key]
			if not node.get_meta("ready",false) or node.get_meta("reveal",0.)<.99:return false
	return true
func coast_complete():
	var coast=world.coastal_focus
	if coast==null or world.distance>=12.:return true
	var p=world.project(world.focus.x,world.focus.y)
	if coast.local_contains(Vector2(p.x,p.z)):return coast.is_ready() and coast.built and coast.active
	return coast.is_ready() and coast.patch_key!=""
func save():FileAccess.open(output+"/profile.json",FileAccess.WRITE).store_string(JSON.stringify(report,"  "))
func trial(name,point,warm):
	world.focus=point;world.goal_focus=point;world.distance=300.;world.goal_distance=300.;world.pitch=38.;world.yaw=0.;world.queue_tiles()
	var wait=Time.get_ticks_msec()
	while Time.get_ticks_msec()-wait<1500:await process_frame
	var start=Time.get_ticks_msec();var previous=Time.get_ticks_usec();var frames=[];var threshold=-1;var local_ready=-1;var coast_threshold=-1;var coast_ready=-1;var stable=0;var exposed_missing_frames=0;var loading_frames=0
	while Time.get_ticks_msec()-start<120000:
		var elapsed=Time.get_ticks_msec()-start
		world.goal_distance=300.*pow(2./300.,min(1.,elapsed/6000.))
		await process_frame
		var now=Time.get_ticks_usec();frames.append((now-previous)/1000.);previous=now;elapsed=Time.get_ticks_msec()-start
		if threshold<0 and world.distance<32.:threshold=elapsed
		if threshold>=0 and local_ready<0 and local_complete():local_ready=elapsed
		if coast_threshold<0 and world.distance<12.:coast_threshold=elapsed
		if coast_threshold>=0 and coast_ready<0 and coast_complete():coast_ready=elapsed
		var covered=world.get("detail_loading")!=null and world.detail_loading.covering
		if covered:loading_frames+=1
		if ((world.distance<32. and not local_complete()) or (world.distance<12. and not coast_complete())) and not covered:exposed_missing_frames+=1
		stable=stable+1 if world.is_settled() and local_complete() and coast_complete() and not covered else 0
		if elapsed>6500 and stable>=8:break
	var row={"name":name,"warm":warm,"elapsedMs":Time.get_ticks_msec()-start,"localThresholdMs":threshold,"allLocalReadyMs":local_ready,"localDelayMs":maxi(0,local_ready-threshold) if local_ready>=0 else -1,"coastThresholdMs":coast_threshold,"coastReadyMs":coast_ready,"coastDelayMs":maxi(0,coast_ready-coast_threshold) if coast_ready>=0 else -1,"exposedMissingFrames":exposed_missing_frames,"loadingFrames":loading_frames,"timedOut":stable<8,"frames":stats(frames),"staticBytes":OS.get_static_memory_usage(),"videoBytes":RenderingServer.get_rendering_info(RenderingServer.RENDERING_INFO_VIDEO_MEM_USED),"drawCalls":Performance.get_monitor(Performance.RENDER_TOTAL_DRAW_CALLS_IN_FRAME),"instances":world.scenery.resident_instances(),"tilePreparationMs":world.loading_ms.duplicate(),"coast":world.coastal_focus.metrics.duplicate(true),"scenery":world.scenery.work_profile.duplicate(true)}
	if world.get("detail_loading")!=null:row["loading"]=world.detail_loading.metrics.duplicate(true)
	report.trials.append(row);save();print("DETAIL_READINESS_TRIAL ",name," ",JSON.stringify(row))
	await RenderingServer.frame_post_draw;root.get_texture().get_image().save_png(output+"/"+name+".png")
func run():
	for arg in OS.get_cmdline_user_args():
		if arg.begins_with("--phase="):phase=arg.trim_prefix("--phase=")
	output="res://evidence/detail-readiness/"+phase;DirAccess.make_dir_recursive_absolute(ProjectSettings.globalize_path(output))
	RenderingServer.render_loop_enabled=false;process_frame.connect(draw)
	world=load("res://world.tscn").instantiate();root.add_child(world);world.capture_done=true;world.automation_input_locked=true
	Engine.max_fps=0;DisplayServer.window_set_vsync_mode(DisplayServer.VSYNC_DISABLED)
	world.scenery.cache_signature+="-detail-profile-"+phase+"-"+str(Time.get_ticks_usec())
	report={"phase":phase,"engine":Engine.get_version_info(),"adapter":RenderingServer.get_video_adapter_name(),"method":"Native GPU frames at 1920x1080; six-second eased zoom from 300 to 2 km. Cold = isolated empty placement cache, not flushed driver/OS caches. Capture occurs after timed trial. Missing-frame counter tests all nine local cells and close coast readiness, not screenshot image analysis.","trials":[]}
	await trial("italy-cold",Vector2(12.67,41.73),false)
	await trial("italy-warm",Vector2(12.67,41.73),true)
	await trial("messina-cold",Vector2(15.55,38.18),false)
	await trial("messina-warm",Vector2(15.55,38.18),true)
	world.goal_distance=600.;world.distance=600.
	while world.scenery.busy:await process_frame
	world.queue_free();for i in 15:await process_frame
	print("DETAIL_READINESS_DONE ",phase);quit()
