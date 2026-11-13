extends "res://tools/reset-profile.gd"
var report={}
var stage="before"
var region="italy"
var samples=[]
var last_sample=0
var capture_at=0
func draw():RenderingServer.force_draw(true)
func _initialize():call_deferred("run")
func snapshot():
	var pipelines={}
	for key in ClassDB.class_get_integer_constant_list("RenderingServer"):
		if key.begins_with("RENDERING_INFO_PIPELINE_COMPILATIONS"):
			pipelines[key]=RenderingServer.get_rendering_info(ClassDB.class_get_integer_constant("RenderingServer",key))
	return {"pipelines":pipelines,"staticBytes":OS.get_static_memory_usage(),"videoBytes":RenderingServer.get_rendering_info(RenderingServer.RENDERING_INFO_VIDEO_MEM_USED),"drawCalls":Performance.get_monitor(Performance.RENDER_TOTAL_DRAW_CALLS_IN_FRAME),"instances":world.scenery.resident_instances(),"composition":world.scenery.resident_composition(),"localCells":world.scenery.local_roots.size(),"coarseCells":world.scenery.roots.size(),"cacheHits":world.scenery.cache_hits,"work":world.scenery.work_profile.duplicate(true)}
func central_ready():
	var x=floori(world.focus.x/.05);var y=floori(world.focus.y/.05);var key="local|%d|%d"%[x,y]
	return world.scenery.local_roots.has(key) and world.scenery.local_roots[key].get_meta("ready",false)
func local_ready():
	var center=Vector2i(floori(world.focus.x/.05),floori(world.focus.y/.05))
	for y in [-1,0,1]:
		for x in [-1,0,1]:
			var key="local|%d|%d"%[center.x+x,center.y+y]
			if not world.scenery.local_roots.has(key) or not world.scenery.local_roots[key].get_meta("ready",false):return false
	return true
func sample_frame():
	await process_frame
	var now=Time.get_ticks_usec();samples.append((now-last_sample)/1000.);last_sample=now
func placements():
	var result={}
	var keys=world.scenery.local_roots.keys();keys.sort()
	for key in keys:
		var node=world.scenery.local_roots[key]
		if not node.get_meta("ready",false):continue
		var hashes=[]
		for child in node.get_children():
			var hash=HashingContext.new();hash.start(HashingContext.HASH_SHA256);hash.update(child.multimesh.buffer.to_byte_array());hashes.append(hash.finish().hex_encode())
		result[key]={"plants":node.get_meta("plants",0),"rocks":node.get_meta("rocks",0),"buffers":hashes}
	return result
func trial(name):
	var phase_start=Time.get_ticks_msec();var crossed=-1;var first=-1;var complete=-1;var terrain=-1
	world.distance=300.;world.goal_distance=300.;world.queue_tiles()
	var start=Time.get_ticks_msec()
	while Time.get_ticks_msec()-start<2500:await process_frame
	samples=[];last_sample=Time.get_ticks_usec();phase_start=Time.get_ticks_msec()
	while Time.get_ticks_msec()-phase_start<180000:
		var elapsed=Time.get_ticks_msec()-phase_start
		# Same six-second logarithmic goal trajectory, using normal camera easing.
		world.goal_distance=300.*pow(12./300.,min(1.,elapsed/6000.))
		await sample_frame()
		elapsed=Time.get_ticks_msec()-phase_start
		if terrain<0 and world.queue.is_empty():terrain=elapsed
		if crossed<0 and world.distance<32.:crossed=elapsed
		if crossed>=0 and first<0 and central_ready():
			var key="local|%d|%d"%[floori(world.focus.x/.05),floori(world.focus.y/.05)]
			var node=world.scenery.local_roots[key]
			if node.visible and node.get_meta("reveal",0.)>.2:first=elapsed
		if crossed>=0 and local_ready():complete=elapsed;break
	if complete>=0:
		var settle=Time.get_ticks_msec()
		while Time.get_ticks_msec()-settle<1100:await sample_frame()
	var loading=samples.duplicate();var before=snapshot();var steady=[];last_sample=Time.get_ticks_usec()
	for i in 90:await sample_frame();steady.append(samples[-1])
	var record={"name":name,"crossedLocalThresholdMs":crossed,"firstCentralVisibleMs":first,"firstVisibleDelayMs":max(0,first-crossed) if first>=0 else -1,"allLocalReadyDelayMs":max(0,complete-crossed) if complete>=0 else -1,"timedOut":complete<0,"terrainQueueEmptyMs":terrain,"loading":statistics(loading),"steady":statistics(steady),"frameSamplesMs":loading,"metrics":before,"placements":placements(),"tilePreparationMs":world.loading_ms.duplicate()}
	root.get_texture().get_image().save_png(output+"/"+name+"-settled.png")
	report.trials.append(record);save_report();print("STREAMING_TRIAL ",name," first_ms=",record.firstVisibleDelayMs," full_ms=",record.allLocalReadyDelayMs)
func save_report():FileAccess.open(output+"/profile.json",FileAccess.WRITE).store_string(JSON.stringify(report,"  "))
func run():
	for arg in OS.get_cmdline_user_args():
		if arg.begins_with("--stage="):stage=arg.trim_prefix("--stage=")
		if arg.begins_with("--region="):region=arg.trim_prefix("--region=")
	output="res://evidence/streaming-optimization/"+stage+"-"+region
	DirAccess.make_dir_recursive_absolute(ProjectSettings.globalize_path(output))
	RenderingServer.render_loop_enabled=false;process_frame.connect(draw)
	var begin=Time.get_ticks_msec();world=load("res://world.tscn").instantiate();root.add_child(world);world.capture_done=true;world.automation_input_locked=true
	var boot=Time.get_ticks_msec()-begin
	Engine.max_fps=0;DisplayServer.window_set_vsync_mode(DisplayServer.VSYNC_DISABLED)
	# Isolated empty placement-cache namespace; OS/driver cache is not flushed.
	world.scenery.cache_signature+="-streaming-"+stage+"-"+region+"-"+str(Time.get_unix_time_from_system())
	world.focus=Vector2(12.67,41.73) if region=="italy" else Vector2(2.3,46.6);world.goal_focus=world.focus
	world.pitch=38.;world.yaw=0.;world.distance=300.;world.goal_distance=300.;world.queue_tiles()
	report={"stage":stage,"region":region,"bootMs":boot,"engine":Engine.get_version_info(),"adapter":RenderingServer.get_video_adapter_name(),"resolution":[1920,1080],"trials":[],"method":"Real forced GPU frames, uncapped/VSync off, normal camera easing. Cold = empty isolated placement cache, not flushed OS/driver caches. Same six-second logarithmic zoom goals. No density or quality override."}
	await trial("cold")
	await trial("warm-reentry")
	samples=[];last_sample=Time.get_ticks_usec()
	var start=Time.get_ticks_msec();var old=world.scenery.work_profile.cellsBuilt
	for value in [181.,179.,185.,175.,225.,215.,235.,205.,300.,180.,12.]:
		world.distance=value;world.goal_distance=value
		for i in 6:await sample_frame()
	report.repeatedZoom={"frames":statistics(samples),"elapsedMs":Time.get_ticks_msec()-start,"cellsBuilt":world.scenery.work_profile.cellsBuilt-old,"metrics":snapshot()}
	samples=[];last_sample=Time.get_ticks_usec()
	var initial=world.focus;start=Time.get_ticks_msec()
	for point in [initial+Vector2(.15,.1),initial+Vector2(-.15,-.1),initial]:
		world.focus=point;world.goal_focus=point;world.queue_tiles()
		var wait=Time.get_ticks_msec()
		while Time.get_ticks_msec()-wait<2000:await sample_frame()
	report.rapidMovement={"frames":statistics(samples),"elapsedMs":Time.get_ticks_msec()-start,"metrics":snapshot()};save_report()
	world.distance=3000.;world.goal_distance=3000.
	var wait=Time.get_ticks_msec()
	while world.scenery.busy and Time.get_ticks_msec()-wait<30000:await process_frame
	world.queue_free()
	for i in 30:await process_frame
	print("STREAMING_PROFILE_DONE ",stage," ",region);quit()
