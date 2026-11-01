extends "res://tools/reset-profile.gd"
var model
var ui
func force_render():RenderingServer.force_draw(false)
func run():
	RenderingServer.render_loop_enabled=false;process_frame.connect(force_render)
	output="res://evidence/settlement-development-20261028/after"
	for arg in OS.get_cmdline_user_args():
		if arg.begins_with("--output="):output=arg.trim_prefix("--output=")
	DirAccess.make_dir_recursive_absolute(ProjectSettings.globalize_path(output))
	var begin=Time.get_ticks_usec();world=load("res://world.tscn").instantiate();root.add_child(world);world.capture_done=true;world.ui_panel.visible=false
	var report={"engine":Engine.get_version_info(),"adapter":RenderingServer.get_video_adapter_name(),"backend":RenderingServer.get_current_rendering_method(),"sceneInstantiationMs":(Time.get_ticks_usec()-begin)/1000.,"method":"600 settled wall intervals, one forced GPU draw per interval, hidden window/no swap, input locked, retained shader caches. Rendered comparison, not presented-frame FPS.","views":[]}
	var enabled=world.has_meta("settlement_development")
	if enabled:
		model=world.get_meta("settlement_development")
		for child in world.get_children():
			if child.name=="SettlementDevelopmentUI":ui=child
		assert(ui!=null)
	var views=[{"name":"city","distance":.48,"focus":[45,0],"level":0,"slot":0}]
	if enabled:
		for slot in [0,1]:
			for level in range(1,4):views.append({"name":("civic" if slot==0 else "grain")+"-"+str(level),"distance":.125 if slot==0 else .12,"focus":[47,-22] if slot==0 else [111,55],"level":level,"slot":slot})
		for level in range(1,4):views.append({"name":"strategic-"+str(level),"distance":45.,"focus":[0,0],"level":level,"slot":0})
	else:views.append({"name":"strategic","distance":45.,"focus":[0,0],"level":0,"slot":0})
	for view in views:
		var previous=Time.get_ticks_usec();var first=[];var first_begin=previous
		if enabled:
			model.reset();ui.select_slot(model.settlement.slots[view.slot].id)
			if view.level>0:
				# Exercise the actual UI callback/signal, not a separate screenshot fixture.
				ui.level_buttons[view.level-1].pressed.emit()
				assert(model.levels[ui.selected]==view.level)
				if view.name.begins_with("strategic"):assert(model.set_level("roma-slot-2",view.level))
		var anchor=world.project(12.491258174554883,41.8899769864849)
		world.focus=world.unproject(anchor+Vector3(view.focus[0]*.001,0,view.focus[1]*.001));world.goal_focus=world.focus
		world.distance=view.distance;world.goal_distance=view.distance;world.pitch=34. if view.distance<.2 else 42.;world.yaw=15.;world.queue_tiles()
		var frames=0
		while Time.get_ticks_usec()-first_begin<120000000:
			await process_frame;frames+=1
			var now=Time.get_ticks_usec();first.append((now-previous)/1000.);previous=now
			if frames>=180 and world.is_settled():break
		assert(world.is_settled(),"Scene readiness timeout")
		var readiness=(Time.get_ticks_usec()-first_begin)/1000.;var intervals=[];var gpu=[];previous=Time.get_ticks_usec()
		for i in 600:
			await process_frame
			var now=Time.get_ticks_usec();intervals.append((now-previous)/1000.);previous=now;gpu.append(RenderingServer.viewport_get_measured_render_time_gpu(root.get_viewport_rid()))
		RenderingServer.force_draw(false);assert(root.get_texture().get_image().save_png(output+"/"+view.name+".png")==OK)
		var rendered={}
		if enabled:
			for node in world.settlements.nodes.values():
				var found=node.find_child("DevelopmentSlots",true,false)
				if found!=null:rendered=found.rendered_levels.duplicate(true)
			assert(rendered.size()==2)
			for id in model.levels:assert(rendered[id].level==model.levels[id] and not rendered[id].missing)
		var result={"view":view,"camera":{"position":[world.camera.position.x,world.camera.position.y,world.camera.position.z],"focus":[world.focus.x,world.focus.y],"fov":world.camera.fov,"near":world.camera.near,"far":world.camera.far},"steady":statistics(intervals),"firstFrames":statistics(first),"readyMs":readiness,"frameSamplesMs":intervals,"firstFrameSamplesMs":first,"gpu":world.sample_stats(gpu),"videoMemoryBytes":RenderingServer.get_rendering_info(RenderingServer.RENDERING_INFO_VIDEO_MEM_USED),"drawCalls":Performance.get_monitor(Performance.RENDER_TOTAL_DRAW_CALLS_IN_FRAME),"renderedSlots":rendered}
		report.views.append(result);print("DEVELOPMENT_CAPTURE ",view.name," ",JSON.stringify(result.steady))
		var f=FileAccess.open(output+"/performance.json",FileAccess.WRITE);f.store_string(JSON.stringify(report,"  "));f.close()
	if enabled:
		model.reset();assert(model.levels["roma-slot-1"]==3 and model.levels["roma-slot-2"]==2)
		ui.select_slot("roma-slot-3");assert(ui.level_buttons[0].disabled)
		var original=model.catalog.visuals[0].near;model.catalog.visuals[0].near="res://assets/settlement-development/missing-test.res"
		ui.select_slot("roma-slot-1");ui.level_buttons[0].pressed.emit()
		assert(ui.details.text.contains("unavailable"))
		var missing=false
		for node in world.settlements.nodes.values():
			var view=node.find_child("DevelopmentSlots",true,false)
			if view!=null:missing=view.rendered_levels["roma-slot-1"].missing
		assert(missing,"Missing resource must preserve state and display an explicit art gap")
		model.catalog.visuals[0].near=original;model.reset()
		var f=FileAccess.open(output+"/runtime-validation.json",FileAccess.WRITE);f.store_string(JSON.stringify({"passed":true,"realUiButtonsExercised":true,"renderedLevelsMatchState":true,"emptySlotsDisabled":true,"startingDataRestored":true,"missingAssetShowsGap":true}));f.close()
	quit()
