extends "res://tools/reset-profile.gd"
## Real-map integration/capture harness. Fixture states are visual tests, not history.
var failures=[]
func check(value,message):
	if not value:failures.append(message);push_error(message)
func run():
	var preview=OS.get_cmdline_user_args().has("--settlement-visual-slice")
	var full_startup=OS.get_cmdline_user_args().has("--full-startup")
	var mode="preview" if preview else "legacy"
	if full_startup:mode+="-startup"
	output="res://evidence/roman-settlement-slice/"+mode
	DirAccess.make_dir_recursive_absolute(ProjectSettings.globalize_path(output))
	root.mode=Window.MODE_WINDOWED;root.size=Vector2i(1280,720)
	var start=Time.get_ticks_msec()
	world=load("res://world.tscn").instantiate();world.startup_preparation_requested=full_startup;root.add_child(world)
	world.capture_done=true;world.automation_input_locked=true
	var pipeline=world.settlements.visual_pipeline
	if full_startup:
		while world.detail_loading.covering and Time.get_ticks_msec()-start<300000:await process_frame
		check(not world.detail_loading.covering,"Actual startup cover completes")
	else:
		await world.coastal_focus.catalog.preload_all(self)
		await world.coastal_focus.prepare_baseline(self)
		await pipeline.prepare_baselines(self)
		world.detail_loading.allow_background_detail=true
	var startup_ms=Time.get_ticks_msec()-start
	check(pipeline.active==preview,"Explicit development opt-in")
	if preview:
		check(pipeline.stats.baselines==pipeline.entries.size(),"All registered baselines available before navigation")
	var views=[]
	for fixture in pipeline.fixtures.cases:
		var site={}
		for candidate in world.sites:
			if candidate.id==fixture.input.settlementId:site=candidate;break
		for distance in [.65,4.,35.,500.]:
			world.focus=Vector2(site.lon,site.lat);world.goal_focus=world.focus;world.distance=distance;world.goal_distance=distance;world.pitch=48.;world.yaw=0.;world.queue_tiles()
			await process_frame
			var begin=Time.get_ticks_msec()
			if preview:
				while (pipeline.busy or not pipeline.queue.is_empty()) and Time.get_ticks_msec()-begin<60000:await process_frame
				check(not pipeline.busy,"Bounded async settlement refresh")
				check(pipeline.owns(site.id),"Retained baseline "+site.name)
			# Same short settling window for both modes; excludes endless scenery refinement.
			for i in 12:await process_frame
			var samples=[];var previous=Time.get_ticks_usec()
			for i in 60:
				await process_frame
				var now=Time.get_ticks_usec();samples.append((now-previous)/1000.);previous=now
			await RenderingServer.frame_post_draw
			var file=fixture.caseId+"-"+str(distance)+".png"
			root.get_texture().get_image().save_png(output+"/"+file)
			views.append({"case":fixture.caseId,"distanceKm":distance,"settlementRefreshMs":Time.get_ticks_msec()-begin,"frames":statistics(samples),"drawCalls":Performance.get_monitor(Performance.RENDER_TOTAL_DRAW_CALLS_IN_FRAME),"videoBytes":RenderingServer.get_rendering_info(RenderingServer.RENDERING_INFO_VIDEO_MEM_USED),"staticBytes":OS.get_static_memory_usage(),"screenshot":file})
			print("SETTLEMENT_RUNTIME_VIEW ",fixture.caseId," ",distance)
	if preview:
		var first=pipeline.entries.values()[0];var input=pipeline.contexts[first.state.settlementId].duplicate(true)
		var revision=first.revision;input.damage="damaged";pipeline.register_input(input)
		check(first.revision==revision+1,"Gameplay visual state invalidation")
		var before=pipeline.stats.rebuilds
		await pipeline.rebuild(first.state.settlementId,first.lod)
		check(pipeline.stats.rebuilds==before,"Condition change preserves geometry")
		check(pipeline.cached_bytes<=pipeline.mesh_budget,"Bounded mesh cache")
	var report={"passed":failures.is_empty(),"productionQualityPassed":false,"failures":failures,"mode":mode,"adapter":RenderingServer.get_video_adapter_name(),"renderer":RenderingServer.get_current_rendering_method(),"startupMs":startup_ms,"fullStartup":full_startup,"loading":world.detail_loading.metrics,"pipeline":pipeline.snapshot(),"views":views,"method":"1280x720 native GPU. 60 process-frame wall intervals/view after 12 frames; includes scheduling and streaming, not GPU-only time. Isolated mode explicitly bypasses ordinary loading-screen preparation. Test states are synthetic. Missing art cannot pass visual quality acceptance. Passed means integration checks only, not successful terrain/harbor placement or visual acceptance; inspect per-entry rejections."}
	FileAccess.open(output+"/runtime.json",FileAccess.WRITE).store_string(JSON.stringify(report,"  "))
	print("SETTLEMENT_RUNTIME_COMPLETE ",mode," failures=",failures)
	quit(0 if failures.is_empty() else 1)
