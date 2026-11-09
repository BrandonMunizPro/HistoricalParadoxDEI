extends "res://tools/reset-profile.gd"
func draw():
	RenderingServer.force_draw(true)
func run():
	output="user://ws2-before"
	var only=""
	for arg in OS.get_cmdline_user_args():
		if arg.begins_with("--output="):output=arg.trim_prefix("--output=")
		elif arg.begins_with("--only="):only=arg.trim_prefix("--only=")
	RenderingServer.render_loop_enabled=false;process_frame.connect(draw)
	DirAccess.make_dir_recursive_absolute(ProjectSettings.globalize_path(output))
	world=load("res://world.tscn").instantiate()
	root.add_child(world);world.capture_done=true
	Engine.max_fps=0;DisplayServer.window_set_vsync_mode(DisplayServer.VSYNC_DISABLED)
	for c in world.get_children():
		if c is CanvasLayer and c.name!="FactionCartography":c.visible=false
	var views=[
		{"name":"ws2-170","focus":[22.4,38.2],"distance":170.0,"pitch":42.0,"yaw":0.0},
		{"name":"ws2-200","focus":[22.4,38.2],"distance":200.0,"pitch":42.0,"yaw":0.0},
		{"name":"ws2-250","focus":[22.4,38.2],"distance":250.0,"pitch":42.0,"yaw":0.0},
		{"name":"ws2-520","focus":[14.2,37.6],"distance":520.0,"pitch":57.0,"yaw":0.0}
	]
	var records=[]
	for v in views:
		if only!="" and v.name!=only:continue
		world.comparison_camera={};world.focus=Vector2(v.focus[0],v.focus[1]);world.goal_focus=world.focus;world.distance=v.distance;world.goal_distance=v.distance;world.pitch=v.pitch;world.yaw=v.yaw;world.queue_tiles()
		var start=Time.get_ticks_msec()
		for i in 30000:
			await process_frame
			if i>=120 and world.is_settled():break
			assert(Time.get_ticks_msec()-start<120000)
		var settled=world.is_settled()
		var samples=[];var gpu=[];var prev=Time.get_ticks_usec()
		for i in 120:
			await process_frame;var now=Time.get_ticks_usec();samples.append((now-prev)/1000.);prev=now;gpu.append(RenderingServer.viewport_get_measured_render_time_gpu(root.get_viewport_rid()))
		draw()
		var image=root.get_texture().get_image()
		if image!=null:image.save_png(output+"/"+v.name+".png")
		records.append({"name":v.name,"preset":[v.focus[0],v.focus[1],v.distance,v.pitch,v.yaw],"distance":world.distance,"settled":settled,"sceneryReady":world.scenery.is_ready(),"pendingScenery":world.scenery.pending_cells(),"sceneryRoots":world.scenery.roots.size(),"localRoots":world.scenery.local_roots.size(),"vegetationInstances":world.scenery.resident_instances(),"sceneryWork":world.scenery.work_profile.duplicate(true),"settlementStats":world.settlements.stats.duplicate(true),"settlementNodes":world.settlements.nodes.size(),"politicalBlend":world.political_map.blend,"politicalWeight":world.political_map.weight_at(world.distance),"terrainTiles":world.resident.size(),"steady":statistics(samples),"gpu":world.sample_stats(gpu),"drawCalls":Performance.get_monitor(Performance.RENDER_TOTAL_DRAW_CALLS_IN_FRAME)})
		FileAccess.open(output+"/views.json",FileAccess.WRITE).store_string(JSON.stringify({"views":records,"method":"120 uncapped controlled submitted wall intervals per settled view; VSync off; hidden-window force_draw, not a sustained benchmark or scan-out."},"  "))
		print("WS2_CAPTURE ",v.name," distance=",world.distance," settled=",settled," sceneryRoots=",world.scenery.roots.size()," localRoots=",world.scenery.local_roots.size()," settlementNodes=",world.settlements.nodes.size())
	world.queue_free()
	for i in 10:await process_frame
	quit()
