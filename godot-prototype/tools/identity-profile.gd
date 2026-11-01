extends "res://tools/reset-profile.gd"
var ui
var models={}
func force_render():RenderingServer.force_draw(false)
func run():
	RenderingServer.render_loop_enabled=false;process_frame.connect(force_render)
	output="res://evidence/settlement-identities-20261028/before"
	for arg in OS.get_cmdline_user_args():
		if arg.begins_with("--output="):output=arg.trim_prefix("--output=")
	DirAccess.make_dir_recursive_absolute(ProjectSettings.globalize_path(output))
	var begin=Time.get_ticks_usec();world=load("res://world.tscn").instantiate();root.add_child(world);world.capture_done=true;world.ui_panel.visible=false
	var report={"engine":Engine.get_version_info(),"adapter":RenderingServer.get_video_adapter_name(),"sceneInstantiationMs":(Time.get_ticks_usec()-begin)/1000.,"method":"600 settled wall intervals with a forced GPU draw, automatic render loop off, hidden window/no swap; retained shader caches; rendered comparison, not presented FPS.","views":[]}
	for child in world.get_children():
		if child.name=="SettlementDevelopmentUI":ui=child
	var enabled=OS.get_cmdline_user_args().has("--settlement-identities")
	if enabled:models=world.get_meta("identity_models")
	var views=[]
	for key in ["roma","aricia"]:
		views.append({"name":key+"-city","site":key,"distance":.48,"offset":[0,0],"slot":0,"level":0})
		views.append({"name":key+"-strategic","site":key,"distance":45.,"offset":[0,0],"slot":0,"level":0})
	if enabled:
		for spec in [["civic","roma",0],["religion","roma",2],["farm","aricia",0]]:
			for level in range(1,4):views.append({"name":spec[0]+"-"+str(level),"site":spec[1],"distance":.26,"offset":models[spec[1]].settlement.slots[spec[2]].anchorM,"slot":spec[2],"level":level})
		for spec in [["civic","roma",0],["religion","roma",2],["farm","aricia",0]]:views.append({"name":spec[0]+"-detail","site":spec[1],"distance":.125,"offset":models[spec[1]].settlement.slots[spec[2]].anchorM,"slot":spec[2],"level":3})
		views.append({"name":"spectacle-detail","site":"roma","distance":.14,"offset":models.roma.settlement.slots[4].anchorM,"slot":4,"level":3})
	for view in views:
		var previous=Time.get_ticks_usec();var first=[];var first_begin=previous
		var site
		for r in world.sites:
			if r.key==view.site:site=r
		assert(site!=null)
		if enabled:
			for model in models.values():model.reset()
			ui.use_model(models[view.site]);ui.select_slot(ui.state.settlement.slots[view.slot].id)
			if view.level>0:ui.level_buttons[view.level-1].pressed.emit()
		elif ui!=null:ui.visible=view.site=="roma"
		var anchor=world.project(site.lon,site.lat)
		world.focus=world.unproject(anchor+Vector3(view.offset[0]*.001,0,view.offset[1]*.001));world.goal_focus=world.focus
		world.distance=view.distance;world.goal_distance=view.distance;world.pitch=36. if view.distance<.2 else 42.;world.yaw=15.;world.queue_tiles()
		var frames=0
		while Time.get_ticks_usec()-first_begin<120000000:
			await process_frame;frames+=1
			var now=Time.get_ticks_usec();first.append((now-previous)/1000.);previous=now
			if frames>=180 and world.is_settled():break
		assert(world.is_settled(),"Readiness timeout")
		var ready=(Time.get_ticks_usec()-first_begin)/1000.;var samples=[];var gpu=[];previous=Time.get_ticks_usec()
		for i in 600:
			await process_frame
			var now=Time.get_ticks_usec();samples.append((now-previous)/1000.);previous=now;gpu.append(RenderingServer.viewport_get_measured_render_time_gpu(root.get_viewport_rid()))
		RenderingServer.force_draw(false);assert(root.get_texture().get_image().save_png(output+"/"+view.name+".png")==OK)
		var slots={}
		if enabled:
			var node=world.settlements.nodes[site.id];var found=node.find_child("DevelopmentSlots",true,false);assert(found!=null)
			slots=found.rendered_levels.duplicate(true)
			for slot_id in ui.state.levels:assert(slots[slot_id].level==ui.state.levels[slot_id] and not slots[slot_id].missing)
		var result={"view":view,"camera":{"position":[world.camera.position.x,world.camera.position.y,world.camera.position.z],"focus":[world.focus.x,world.focus.y],"near":world.camera.near,"far":world.camera.far,"fov":world.camera.fov},"steady":statistics(samples),"readinessMs":ready,"firstFrames":statistics(first),"frameSamplesMs":samples,"firstFrameSamplesMs":first,"gpu":world.sample_stats(gpu),"videoMemoryBytes":RenderingServer.get_rendering_info(RenderingServer.RENDERING_INFO_VIDEO_MEM_USED),"drawCalls":Performance.get_monitor(Performance.RENDER_TOTAL_DRAW_CALLS_IN_FRAME),"renderedSlots":slots}
		report.views.append(result);print("IDENTITY_CAPTURE ",view.name," ",JSON.stringify(result.steady))
		var f=FileAccess.open(output+"/performance.json",FileAccess.WRITE);f.store_string(JSON.stringify(report,"  "));f.close()
	if enabled:
		# Exercise real selector signals and state isolation, then restore starts.
		ui.selector.item_selected.emit(0);assert(ui.state==models.roma and ui.slots_box.get_child_count()==6)
		ui.select_slot(models.roma.settlement.slots[0].id);ui.level_buttons[1].pressed.emit();assert(models.roma.levels[ui.selected]==2)
		ui.selector.item_selected.emit(1);assert(ui.state==models.aricia and ui.slots_box.get_child_count()==4)
		ui.level_buttons[2].pressed.emit();assert(models.aricia.levels[ui.selected]==3)
		assert(models.roma.levels[models.roma.settlement.slots[0].id]==2)
		ui.reset_selected();assert(models.aricia.levels[ui.selected]==2)
		ui.select_slot(models.aricia.settlement.slots[-1].id);assert(ui.level_buttons[0].disabled)
		ui.selector.item_selected.emit(0);ui.reset_selected();assert(models.roma.levels[ui.selected]==3)
		var f=FileAccess.open(output+"/runtime-validation.json",FileAccess.WRITE);f.store_string(JSON.stringify({"passed":true,"twoSettlementSelector":true,"slotCounts":[6,4],"independentPreviewState":true,"emptySlotsPreserved":true,"startingDataRestored":true,"renderedLevelsCheckedBeforeEveryCapture":true}));f.close()
	quit()
