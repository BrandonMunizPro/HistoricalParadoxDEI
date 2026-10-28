extends SceneTree
var world
var results=[]
var output
func _initialize():call_deferred("run")
func settle(measure=false):
	var begin=Time.get_ticks_msec();var last=Time.get_ticks_usec();var frames=[]
	while Time.get_ticks_msec()-begin<90000:
		await process_frame
		var now=Time.get_ticks_usec();frames.append((now-last)/1000.0);last=now
		assert(world.resident.size()<=13)
		if world.is_settled() and abs(world.distance-world.goal_distance)<.0001 and world.focus.distance_to(world.goal_focus)<.00001 and world.settled_frame_times.size()>=180:
			return {"ready":true,"elapsedMs":Time.get_ticks_msec()-begin,"frames":frames,"statistics":world.sample_stats(frames),"distance":world.distance,"scenery":world.scenery.work_profile.duplicate(true),"roma":world.settlements.roma_visual.stats.duplicate(true),"steady":world.sample_stats(world.settled_frame_times)}
	return {"ready":false}
func run():
	var start=Time.get_ticks_usec()
	world=load("res://world.tscn").instantiate();root.add_child(world)
	var initialization=(Time.get_ticks_usec()-start)/1000.0
	world.capture_done=true;world.camera_path="roma-repeatable-navigation"
	output=world.capture_dir;DirAccess.make_dir_recursive_absolute(ProjectSettings.globalize_path(output))
	world.focus=Vector2(12.491258174554883,41.8899769864849);world.goal_focus=world.focus
	world.pitch=45.0;world.yaw=0.0;world.distance=45.0;world.goal_distance=45.0;world.queue_tiles()
	var initial=await settle();assert(initial.ready)
	# Warm every LOD and its shaders before measuring the identical round-trip.
	for d in [7.2,1.2,45.0]:
		world.goal_distance=d;assert((await settle()).ready)
	for d in [7.2,1.2,7.2,45.0]:
		world.goal_distance=d
		var sample=await settle(true);assert(sample.ready);results.append(sample)
	# Small real pan and orbit, then recover the exact site anchor.
	world.goal_focus+=Vector2(.001,.001);world.yaw=20.0
	var movement=await settle(true);assert(movement.ready);results.append(movement)
	var times=[]
	for r in results:times.append_array(r.frames)
	var summary=world.sample_stats(times)
	var sorted=times.duplicate();sorted.sort();var tail=sorted.slice(floori(sorted.size()*.99));var total=0.0
	for t in tail:total+=t
	var file=FileAccess.open(output+"/navigation.json",FileAccess.WRITE)
	file.store_string(JSON.stringify({"passed":true,"evidence":world.evidence_metadata(),"romaPrototypeEnabled":world.settlements.roma_enabled,"romaLandscapeEnabled":world.settlements.roma_visual.landscape.enabled,"initializationMs":initialization,"firstReadiness":initial,"stages":results,"warmStatistics":summary,"onePercentLowFps":1000.0/(total/tail.size()),"videoMemoryBytes":RenderingServer.get_rendering_info(RenderingServer.RENDERING_INFO_VIDEO_MEM_USED),"samples":times.size(),"residentTiles":world.resident.size(),"maxResidentSettlements":world.settlements.tuning.max_resident},"  "))
	print("ROMA_NAVIGATION_OK enabled=",world.settlements.roma_enabled," frames=",times.size()," statistics=",summary)
	quit()
