extends SceneTree
var world
var output="res://evidence/environment/navigation"
var samples=[]
func _initialize():call_deferred("run")
func settle():
	var begin=Time.get_ticks_msec();var last_distance=world.distance
	var max_step=0.0;var max_frame=0.0;var last_clock=Time.get_ticks_usec()
	while Time.get_ticks_msec()-begin<90000:
		await process_frame
		var now=Time.get_ticks_usec();max_frame=max(max_frame,(now-last_clock)/1000.0);last_clock=now
		max_step=max(max_step,abs(world.distance-last_distance)/max(last_distance,.001));last_distance=world.distance
		assert(world.resident.size()<=13 and world.scenery.local_roots.size()<=9 and world.scenery.roots.size()<=12)
		if world.is_settled() and abs(world.distance-world.goal_distance)<.0001 and world.focus.distance_to(world.goal_focus)<.00001 and world.settled_frame_times.size()>=180:
			assert(max_step<=.080001)
			return {"ready":true,"maxFrameMs":max_frame,"maxRelativeZoomStep":max_step,"elapsedMs":Time.get_ticks_msec()-begin}
	return {"ready":false}
func record(name):
	var transition=await settle()
	assert(transition.ready,"Environmental navigation timed out: "+name)
	world.navigation_trace=transition
	# world.capture() deliberately quits after a single screenshot. A continuous
	# navigation tour must save its own evidence without invoking that exit path.
	world.capture_done=true
	root.get_texture().get_image().save_png(output+"/godot-"+name+".png")
	var data={"settledFrameStats":world.sample_stats(world.settled_frame_times),"settledGpuStats":world.sample_stats(world.settled_gpu),"sceneryComposition":world.scenery.resident_composition(),"sceneryWork":world.scenery.work_profile.duplicate(true),"evidence":world.evidence_metadata(),"cameraPath":world.camera_path,"cameraDistanceKm":world.distance,"transition":transition}
	var evidence_file=FileAccess.open(output+"/godot-"+name+".json",FileAccess.WRITE)
	data["settlementPresentation"]=world.settlements.stats.duplicate(true)
	evidence_file.store_string(JSON.stringify(data,"  "))
	samples.append({"view":name,"cameraPath":world.camera_path,"cameraDistanceKm":world.distance,"transition":transition,"settled":data.settledFrameStats,"gpu":data.settledGpuStats,"scenery":data.sceneryComposition,"work":data.sceneryWork,"tiles":world.resident.size(),"evidence":world.evidence_metadata()})
func run():
	world=load("res://world.tscn").instantiate();root.add_child(world)
	output=world.capture_dir;DirAccess.make_dir_recursive_absolute(ProjectSettings.globalize_path(output))
	# Existing WDBII Nile vertex: accepted-bank exclusion is tested against the
	# same projection used by the river ribbons, without changing its geography.
	var bank=world.project(31.2925,29.843061)
	assert(world.presentation.over_river(Vector2(bank.x,bank.z),31.2925,29.843061))
	var away=world.unproject(bank+Vector3(.4,0,0))
	assert(not world.presentation.over_river(Vector2(bank.x+.4,bank.z),away.x,away.y))
	assert((await settle()).ready)
	for view in ["greece","anatolia","egypt","mesopotamia","persia"]:
		assert(world.jump(view));await record("production-"+view)
	world.camera_path="environment-approach-diagnostic";world.resolved_view=""
	world.goal_focus=Vector2(48.5,33.5);world.pitch=34;world.yaw=15
	for distance in [200.0,70.0,8.0]:
		world.goal_distance=distance;await record("zagros-"+str(int(distance)))
	# Exercise cancellation while generation is in flight, then require readiness.
	world.jump("greece")
	for frame in 30:await process_frame
	world.jump("egypt")
	for frame in 30:await process_frame
	world.jump("persia");await record("production-cancellation-recovery")
	var file=FileAccess.open(output+"/navigation.json",FileAccess.WRITE)
	file.store_string(JSON.stringify({"passed":true,"bankClearanceValidated":true,"samples":samples,"evidence":world.evidence_metadata()},"  "))
	print("ENVIRONMENT_NAVIGATION_OK stages=",samples.size()," residency<=13 zoom_step<=.08")
	quit()
