extends "res://tools/reset-profile.gd"
## Supplemental presentation-oriented driver. Not OS-level PresentMon telemetry.
func force_render():RenderingServer.force_draw(true)
func run():
	Engine.max_fps=60;RenderingServer.render_loop_enabled=false;process_frame.connect(force_render)
	output="res://evidence/settlement-identities-20261028/swap-60"
	for arg in OS.get_cmdline_user_args():
		if arg.begins_with("--output="):output=arg.trim_prefix("--output=")
	var begin=Time.get_ticks_usec();world=load("res://world.tscn").instantiate();root.add_child(world);world.capture_done=true;world.ui_panel.visible=false
	# The production scene sets its configured cap during _ready; apply afterwards.
	Engine.max_fps=60
	var ui
	for child in world.get_children():
		if child.name=="SettlementDevelopmentUI":ui=child
	var models=world.get_meta("identity_models")
	var report={"method":"Supplemental 60 FPS capped driver, one forced GPU draw with buffer swap requested per frame, automatic render loop disabled. 1200 settled intervals per view. Hidden-window control, not OS scan-out/PresentMon measurements. Retained shader caches, no quality reductions.","actualFrameCap":Engine.max_fps,"sceneInstantiationMs":(Time.get_ticks_usec()-begin)/1000.,"views":[]}
	for definition in [["roma-city","roma",.48,0],["aricia-city","aricia",.48,0],["farm-3","aricia",.26,3]]:
		var model=models[definition[1]];model.reset();ui.use_model(model)
		if definition[3]>0:model.set_level(model.settlement.slots[0].id,definition[3])
		var site
		for s in world.sites:
			if s.key==definition[1]:site=s
		var center=world.project(site.lon,site.lat)
		if definition[3]>0:center+=Vector3(model.settlement.slots[0].anchorM[0]*.001,0,model.settlement.slots[0].anchorM[1]*.001)
		world.focus=world.unproject(center);world.goal_focus=world.focus;world.distance=definition[2];world.goal_distance=world.distance;world.pitch=42.;world.yaw=15.;world.queue_tiles()
		var first=[];var previous=Time.get_ticks_usec();var start=previous;var frames=0
		while Time.get_ticks_usec()-start<120000000:
			await process_frame;frames+=1;var now=Time.get_ticks_usec();first.append((now-previous)/1000.);previous=now
			if frames>=120 and world.is_settled():break
		assert(world.is_settled())
		var values=[];var gpu=[];previous=Time.get_ticks_usec()
		assert(Engine.max_fps==60,"Production scene must not override benchmark cap")
		for i in 1200:
			await process_frame;var now=Time.get_ticks_usec();values.append((now-previous)/1000.);previous=now;gpu.append(RenderingServer.viewport_get_measured_render_time_gpu(root.get_viewport_rid()))
		var result={"name":definition[0],"steady":statistics(values),"firstFrames":statistics(first),"frameSamplesMs":values,"gpu":world.sample_stats(gpu),"drawCalls":Performance.get_monitor(Performance.RENDER_TOTAL_DRAW_CALLS_IN_FRAME)};report.views.append(result);print("IDENTITY_SWAP ",JSON.stringify(result.steady))
		var file=FileAccess.open(output+"/performance.json",FileAccess.WRITE);file.store_string(JSON.stringify(report,"  "));file.close()
	quit()
