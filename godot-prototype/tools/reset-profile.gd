extends SceneTree
## Audit-only: no changes to campaign art, camera controls, or geography.
var world
var output="res://evidence/visual-reset-20261028/baseline"
func _initialize():call_deferred("run")
func statistics(values):
	var sorted=values.duplicate();sorted.sort()
	var sum=0.0
	for t in sorted:sum+=t
	var tail=sorted.slice(floori(sorted.size()*.99));var tail_sum=0.0
	for t in tail:tail_sum+=t
	return {"samples":sorted.size(),"averageFps":1000.0/(sum/sorted.size()),"onePercentLowFps":1000.0/(tail_sum/tail.size()),"meanMs":sum/sorted.size(),"p99Ms":sorted[floori(sorted.size()*.99)],"maxMs":sorted[-1],"over16_67ms":sorted.filter(func(t):return t>16.667).size(),"over33_33ms":sorted.filter(func(t):return t>33.333).size()}
func run():
	DirAccess.make_dir_recursive_absolute(ProjectSettings.globalize_path(output))
	var start=Time.get_ticks_usec()
	world=load("res://world.tscn").instantiate();root.add_child(world)
	world.capture_done=true
	var boot=(Time.get_ticks_usec()-start)/1000.0
	var report={"status":"Baseline only; no visual overhaul delivered","engine":Engine.get_version_info(),"adapter":RenderingServer.get_video_adapter_name(),"renderingMethod":RenderingServer.get_current_rendering_method(),"resolution":[1920,1080],"bootSceneMs":boot,"views":[],"method":"600 process-frame wall intervals per settled view; 1% low = reciprocal mean of slowest 1%. Sequential views in one process. Visible-window presentation and OS scheduling included; not GPU-only timings."}
	for view in [{"name":"close","distance":.42,"pitch":38.0,"yaw":65.0},{"name":"regional","distance":7.2,"pitch":45.0,"yaw":0.0},{"name":"strategic","distance":45.0,"pitch":45.0,"yaw":0.0}]:
		world.focus=Vector2(12.491258174554883,41.8899769864849);world.goal_focus=world.focus
		world.distance=view.distance;world.goal_distance=view.distance;world.pitch=view.pitch;world.yaw=view.yaw;world.queue_tiles()
		var wait_start=Time.get_ticks_usec();var previous=wait_start;var first=[]
		while Time.get_ticks_usec()-wait_start<90000000:
			await process_frame
			var now=Time.get_ticks_usec();first.append((now-previous)/1000.0);previous=now
			if world.is_settled() and world.settled_frame_times.size()>=180:break
		assert(world.is_settled(),"Readiness timeout")
		var readiness_ms=(Time.get_ticks_usec()-wait_start)/1000.0
		var samples=[];previous=Time.get_ticks_usec()
		for i in 600:
			await process_frame
			var now=Time.get_ticks_usec();samples.append((now-previous)/1000.0);previous=now
		RenderingServer.force_draw()
		assert(root.get_texture().get_image().save_png(output+"/"+view.name+".png")==OK)
		var record={"view":view,"cameraPosition":[world.camera.position.x,world.camera.position.y,world.camera.position.z],"focus":[world.focus.x,world.focus.y],"fov":world.camera.fov,"nearKm":world.camera.near,"farKm":world.camera.far,"steady":statistics(samples),"readinessAndFirstRender":statistics(first),"readinessMs":readiness_ms,"wallFrameSamplesMs":samples,"firstRenderSamplesMs":first,"engineVideoMemoryBytes":RenderingServer.get_rendering_info(RenderingServer.RENDERING_INFO_VIDEO_MEM_USED),"engineStaticMemoryBytes":OS.get_static_memory_usage(),"drawCalls":Performance.get_monitor(Performance.RENDER_TOTAL_DRAW_CALLS_IN_FRAME),"primitives":Performance.get_monitor(Performance.RENDER_TOTAL_PRIMITIVES_IN_FRAME),"residentTiles":world.resident.size(),"sceneryInstances":world.scenery.resident_instances(),"roma":world.settlements.roma_visual.stats.duplicate(true)}
		report.views.append(record)
		print("RESET_BASELINE ",view.name," ",JSON.stringify(record.steady))
	var file=FileAccess.open(output+"/performance.json",FileAccess.WRITE);file.store_string(JSON.stringify(report,"  "));file.close()
	quit()
