extends SceneTree
var failures=[]
var checks=0
var output="res://evidence/startup-preparation"
func draw():RenderingServer.force_draw(true)
func _initialize():call_deferred("run")
func check(value,message):
	checks+=1
	if not value:failures.append(message);push_error(message)
func run():
	RenderingServer.render_loop_enabled=false;process_frame.connect(draw)
	DirAccess.make_dir_recursive_absolute(ProjectSettings.globalize_path(output))
	var boot=load("res://campaign_boot.tscn").instantiate();root.add_child(boot)
	check(boot.get_child_count()>0 and boot.get_child(0).covering,"Boot paints a loading cover before campaign instantiation")
	await process_frame;await RenderingServer.frame_post_draw
	root.get_texture().get_image().save_png(output+"/startup-loading.png")
	var start=Time.get_ticks_msec()
	while not boot.has_node("CampaignWorld") and Time.get_ticks_msec()-start<60000:await process_frame
	check(boot.has_node("CampaignWorld"),"Boot instantiates the existing campaign scene")
	if boot.has_node("CampaignWorld"):
		var world=boot.get_node("CampaignWorld");world.capture_done=true
		check(world.should_prepare_startup([]),"Normal project launch requests preparation")
		check(world.should_prepare_startup(["res://world.tscn"]),"Direct scene launch requests preparation")
		check(not world.should_prepare_startup(["--script","res://tools/capture.gd"]),"Camera-owning diagnostic scripts remain opt-in")
		if OS.get_cmdline_user_args().has("--startup-cache-cold"):
			check(not world.detail_loading.preparation_started,"Cold-cache namespace selected before preparation")
			world.scenery.cache_signature+="-startup-cold-"+str(Time.get_ticks_usec())
		var frames=0
		while world.detail_loading.covering and Time.get_ticks_msec()-start<240000:
			await process_frame;frames+=1
			if frames%120==0:print("BOOT_WAIT ",world.detail_loading.pending_reason())
		check(not world.detail_loading.covering,"Initial campaign opens after render readiness")
		check(world.detail_loading.startup_complete and not world.detail_loading.is_processing(),"Startup screen permanently retires after opening")
		check(world.detail_loading.metrics.screens==1,"Exactly one campaign loading screen")
		check(world.detail_loading.metrics.get("startupPreparation",{}).get("warmedVariants",0)>=60,"Shared foliage and outcrop variants warmed before play")
		check(world.detail_loading.metrics.get("startupPreparation",{}).get("coastMaterials",0)==2,"Coast and surf material families submitted during startup")
		check(world.scenery.quality.sprite_cache.size()==world.scenery.quality.variant_count*2,"Every regional local and coarse vegetation atlas variant loaded")
		check(world.coastal_focus.catalog.source_pinned and world.coastal_focus.catalog.chunks.size()==world.coastal_focus.catalog.manifest.chunks.size(),"Every worldwide coastline source chunk remains resident")
		check(world.scenery.local_roots.size()>=9 and world.scenery.startup_pins.size()>=9,"Opening-area vegetation remains cached at strategic zoom")
		check(world.distance==1100. and world.goal_distance==1100. and world.focus==Vector2(13,42),"Startup restores the configured campaign camera")
		check(world.sites.size()==35 and world.research.size()==687,"Geographic records remain loaded")
		world.detail_loading.metrics["startupStaticBytes"]=OS.get_static_memory_usage()
		world.detail_loading.metrics["startupVideoBytes"]=RenderingServer.get_rendering_info(RenderingServer.RENDERING_INFO_VIDEO_MEM_USED)
		await RenderingServer.frame_post_draw;root.get_texture().get_image().save_png(output+"/startup-ready.png")
		var had_pending=false
		for view in [[Vector2(13,42),2.],[Vector2(2.3,46.6),12.],[Vector2(15.55,38.18),2.],[Vector2(15.644,38.024),1.2]]:
			world.focus=view[0];world.goal_focus=view[0];world.distance=view[1];world.goal_distance=view[1];world.queue_tiles()
			for i in 16:
				await process_frame
				had_pending=had_pending or not world.queue.is_empty() or not world.scenery.pending_cells().is_empty()
				check(not world.detail_loading.covering and not world.detail_loading.screen.visible,"Moving camera never reopens loading")
			check(world.scenery.roots.size()<=19 and world.scenery.local_roots.size()<=world.scenery.local_cache_capacity+1,"Retained opening cells respect regional cache limits")
		check(had_pending,"Camera regression exercised uncached background work")
		var event=InputEventMouseMotion.new();event.relative=Vector2(20,0);event.button_mask=MOUSE_BUTTON_MASK_RIGHT;var yaw=world.yaw
		world.automation_input_locked=false;world._unhandled_input(event)
		check(world.yaw!=yaw,"Map orbit remains available while detail streams")
		var loading_count=world.detail_loading.metrics.screens
		check(loading_count==1,"No additional loading screens after multiple regions and zoom levels")
		FileAccess.open(output+"/preparation.json",FileAccess.WRITE).store_string(JSON.stringify(world.detail_loading.metrics,"  "))
		world.distance=600.;world.goal_distance=600.
		while world.scenery.busy:await process_frame
	FileAccess.open(output+"/validation.json",FileAccess.WRITE).store_string(JSON.stringify({"passed":failures.is_empty(),"checks":checks,"failures":failures},"  "))
	boot.queue_free();for i in 20:await process_frame
	print("DETAIL_BOOT_VALIDATION ","PASS" if failures.is_empty() else failures);quit(0 if failures.is_empty() else 1)
