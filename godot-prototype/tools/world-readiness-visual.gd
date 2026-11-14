extends "res://tools/reset-profile.gd"
## First-draw captures, separate from performance samples.
var failures=[]
var checks=0
func check(value,message):
	checks+=1
	if not value:failures.append(message);push_error(message)
func draw():RenderingServer.force_draw(true)
func place(point,distance):
	world.focus=point;world.goal_focus=point;world.distance=distance;world.goal_distance=distance;world.queue_tiles()
func run():
	output="res://evidence/world-readiness/immediate";DirAccess.make_dir_recursive_absolute(ProjectSettings.globalize_path(output))
	root.mode=Window.MODE_WINDOWED;root.size=Vector2i(1280,720)
	RenderingServer.render_loop_enabled=false;process_frame.connect(draw)
	world=load("res://world.tscn").instantiate();root.add_child(world);root.size=Vector2i(1280,720)
	world.capture_done=true;world.automation_input_locked=true;world.startup_preparation_requested=true
	if OS.get_cmdline_user_args().has("--baseline-only"):
		# A shorter geometry-only diagnostic for interrupted runs. Normal startup
		# policy is measured separately by world-readiness-profile.gd.
		world.startup_preparation_requested=false
		await world.coastal_focus.prepare_baseline(self)
		world.detail_loading.allow_background_detail=true
	var begin=Time.get_ticks_msec()
	while world.detail_loading.covering and Time.get_ticks_msec()-begin<300000:await process_frame
	check(not world.detail_loading.covering,"Startup cover opens")
	check(world.coastal_focus.baseline_ready,"Complete source coast baseline prepared")
	check(world.geographical_baseline_ready(),"Persistent world and regional terrain and water available")
	check(world.coastal_focus.baseline.metrics.instances==2757887,"All source coast segments have persistent instances")
	check(world.coastal_focus.field_preparation_done,"Detail compute preparation completed under cover")
	var arrivals=[];var views=world.read_json("data/world-coast-views.json")
	for name in ["delta","aegean","fjord","india","arabia","pellaro"]:
		var v=views[name];place(Vector2(v[0],v[1]),1.2);world.pitch=v[3];world.yaw=v[4]
		await process_frame;await RenderingServer.frame_post_draw
		check(world.coastal_focus.baseline_ready and world.coastal_focus.baseline.detail_enabled,"Worldwide coast baseline active on first arrival: "+name)
		check(world.geographical_baseline_ready(),"Terrain coverage survives first arrival: "+name)
		check(not world.detail_loading.covering,"No recurring loading screen: "+name)
		root.get_texture().get_image().save_png(output+"/"+name+"-arrival.png")
		arrivals.append({"name":name,"detailActive":world.coastal_focus.active,"detailBusy":world.coastal_focus.busy,"baseline":world.coastal_focus.baseline_ready})
	# Large jumps, inland-to-coast travel, and repeated LOD threshold crossings.
	for distance in [2800.,250.,189.,38.,11.9,5.,1.2,8.,40.,190.,2800.]:
		place(Vector2(15.+distance*.0002,38.),distance)
		for i in 4:await process_frame;check(world.geographical_baseline_ready(),"Coverage during repeated zoom")
	place(Vector2(30.,38.),2800.);await process_frame;await RenderingServer.frame_post_draw
	root.get_texture().get_image().save_png(output+"/world-overview.png")
	check(world.terrain_mesh_bytes<=world.terrain_mesh_budget,"Terrain cache within byte budget")
	check(world.coastal_focus.patch_cache.size()<=4,"Coast patch cache bounded")
	check(world.coastal_focus.field.fields.size()<=6,"Coast field pool bounded")
	var report={"passed":failures.is_empty(),"checks":checks,"failures":failures,"arrivals":arrivals,"coast":world.coastal_focus.metrics,"terrain":world.streaming_metrics,"videoBytes":RenderingServer.get_rendering_info(RenderingServer.RENDERING_INFO_VIDEO_MEM_USED),"staticBytes":OS.get_static_memory_usage(),"notice":"First completed draw after each teleport; no wait for destination terrain, vegetation, beach mesh or compute refinement. Screenshots require visual inspection; readiness assertions alone do not prove pixel correctness."}
	FileAccess.open(output+"/validation.json",FileAccess.WRITE).store_string(JSON.stringify(report,"  "))
	world.distance=2800.;world.goal_distance=2800.;var cleanup=Time.get_ticks_msec()
	while (world.scenery.busy or world.coastal_focus.busy) and Time.get_ticks_msec()-cleanup<60000:await process_frame
	world.queue_free();for i in 12:await process_frame
	print("WORLD_READINESS_VISUAL ","PASS" if failures.is_empty() else failures);quit(0 if failures.is_empty() else 1)
