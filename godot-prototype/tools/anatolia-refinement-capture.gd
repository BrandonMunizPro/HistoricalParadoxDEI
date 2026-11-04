extends "res://tools/reset-profile.gd"
func draw():
	if reference_candidate and not revision and world!=null:
		RenderingServer.global_shader_parameter_set("political_blend",.28)
	if world!=null and not capture_basis.is_empty():
		world.camera.basis=Basis(Vector3(capture_basis[0.0],capture_basis[1.0],capture_basis[2.0]),Vector3(capture_basis[3.0],capture_basis[4.0],capture_basis[5.0]),Vector3(capture_basis[6.0],capture_basis[7.0],capture_basis[8.0]))
	RenderingServer.force_draw(true)
var capture_basis=[]
var reference_candidate=false
var revision=true
func run():
	output="res://evidence/factions-20261030/before"
	var only="";var reference={}
	for arg in OS.get_cmdline_user_args():
		if arg=="--candidate":reference_candidate=true
		if arg=="--revision":revision=true;reference_candidate=true
		if arg.begins_with("--output="):output=arg.trim_prefix("--output=")
		if arg.begins_with("--only="):only=arg.trim_prefix("--only=")
		if arg.begins_with("--reference="):
			for v in JSON.parse_string(FileAccess.get_file_as_string(arg.trim_prefix("--reference="))).views:reference[v.name]=v
	RenderingServer.render_loop_enabled=false;process_frame.connect(draw)
	DirAccess.make_dir_recursive_absolute(ProjectSettings.globalize_path(output))
	world=load("res://world.tscn").instantiate()
	world.set_script(load("res://northern_italy_world.gd" if revision else "res://world.gd"))
	root.add_child(world);world.capture_done=true
	FileAccess.open(output+"/terrain-shader.txt",FileAccess.WRITE).store_string(world.base_material.shader.code)
	Engine.max_fps=0;DisplayServer.window_set_vsync_mode(DisplayServer.VSYNC_DISABLED)
	for c in world.get_children():
		if c is CanvasLayer and c.name!="FactionCartography":c.visible=false
	var views={"anatolia-strategic":[33.0,39.0,1150.0,55.0,0.0],"ionian-coast":[27.7,38.4,300.0,45.0,-15.0],"lycian-coast":[29.5,36.8,150.0,38.0,30.0],"taurus-oblique":[32.3,37.1,90.0,30.0,35.0],"cappadocia":[35.0,38.7,230.0,45.0,0.0],"pontic-mountains":[38.5,40.7,150.0,40.0,-20.0],"bithynia":[29.6,40.6,180.0,42.0,0.0],"eastern-anatolia":[41.0,39.0,340.0,50.0,0.0],"greece-control":[22.4,38.2,250.0,42.0,0.0],"italy-control":[12.5,42.3,430.0,48.0,0.0],"sicily-control":[14.2,37.6,520.0,57.0,0.0],"rhodes":[28.08,36.3,130.0,45.0,0.0],"pamphylia-side":[31.39,36.77,120.0,40.0,0.0],"lydia":[28.2,38.6,200.0,45.0,0.0],"vegetation-close":[32.3,37.1,18.0,32.0,35.0]}
	var records=[]
	for name in views:
		if only!="" and not name in only.split(","):continue
		var v=views[name]
		world.comparison_camera={};world.focus=Vector2(v[0.0],v[1.0]);world.goal_focus=world.focus;world.distance=v[2.0];world.goal_distance=v[2.0];world.pitch=v[3.0];world.yaw=v[4.0];world.queue_tiles()
		if reference.has(name):world.comparison_camera={"position":reference[name].camera.position,"distance":v[2.0],"pitch":v[3.0],"yaw":v[4.0]}
		capture_basis=reference[name].camera.basis if reference.has(name) else []
		var start=Time.get_ticks_msec()
		for i in 30000:
			await process_frame
			if i>=120 and world.is_settled():break
			assert(Time.get_ticks_msec()-start<120000)
		var samples=[];var gpu=[];var prev=Time.get_ticks_usec()
		for i in 120:
			await process_frame;var now=Time.get_ticks_usec();samples.append((now-prev)/1000.);prev=now;gpu.append(RenderingServer.viewport_get_measured_render_time_gpu(root.get_viewport_rid()))
		if reference_candidate:
			world.sun.light_energy=1.35
			world.sun.rotation_degrees=Vector3(-24,-62.0,0)
		world.water_animation_enabled=false;world.water_time=0.;world.water_material.set_shader_parameter("water_time",0.)
		await world.ocean_renderer.capture_time(0.);await process_frame
		draw();assert(root.get_texture().get_image().save_png(output+"/"+name+".png")==OK)
		var camera=world.camera
		records.append({"name":name,"preset":v,"camera":{"position":[camera.position.x,camera.position.y,camera.position.z],"basis":[camera.basis.x.x,camera.basis.x.y,camera.basis.x.z,camera.basis.y.x,camera.basis.y.y,camera.basis.y.z,camera.basis.z.x,camera.basis.z.y,camera.basis.z.z],"fov":camera.fov,"near":camera.near,"far":camera.far},"steady":statistics(samples),"gpu":world.sample_stats(gpu),"frameSamplesMs":samples,"drawCalls":Performance.get_monitor(Performance.RENDER_TOTAL_DRAW_CALLS_IN_FRAME),"resident":world.resident.keys(),"political":world.political_map.blend})
		records[-1]["cpuStagesMs"]=world.previous_cpu_stages.duplicate(true)
		records[-1]["regionalCpuMs"]=world.regional_cpu_ms.duplicate(true)
		records[-1]["labelDrawMs"]=world.reference_labels.last_draw_ms
		records[-1]["politicalIdentitiesVisible"]=world.anatolia_identities.last_drawn.keys() if world.anatolia_identities!=null and world.uses_northern_labels() else []
		records[-1]["renderCpuMs"]=RenderingServer.viewport_get_measured_render_time_cpu(root.get_viewport_rid())
		FileAccess.open(output+"/views.json",FileAccess.WRITE).store_string(JSON.stringify({"views":records,"method":"120 uncapped controlled submitted wall intervals per settled view; VSync off; hidden-window force_draw, not a sustained benchmark or scan-out."},"  "))
		print("MAP_AUDIT_CAPTURE ",name)
		world.water_animation_enabled=true;world.ocean_renderer.resume_animation()
	if OS.get_cmdline_user_args().has("--verify-foundation"):await verify_foundation()
	for i in 30000:
		await process_frame
		if i>90 and world.is_settled():break
	world.queue_free()
	for i in 10:await process_frame
	quit()
func verify_foundation():
	capture_basis=[]
	var faction=world.political_map.factions;var model=faction.regions
	var original=model.export_state();var definitions=JSON.stringify(model.definitions)
	var raster=faction.ids.get_image().get_data();var local=faction.world.base_material.get_shader_parameter("reference_local_ids").get_image().get_data()
	var sicily=faction.world.base_material.get_shader_parameter("reference_sicily_ids").get_image().get_data()
	var balkans=faction.world.base_material.get_shader_parameter("reference_balkans_ids").get_image().get_data()
	var anatolia=world.anatolia_surface.textures.region_ids.get_image().get_data()
	var a=model.legacy_ids["territory:bithynia"];var b=model.legacy_ids["territory:paphlagonia"]
	assert(faction.set_region_owner(a,"paphlagonia"))
	var palette_before=faction.palette_image.get_data();var owners_before=model.owners.duplicate(true)
	assert(faction.set_region_owner(a,"rome"))
	var palette_after=faction.palette_image.get_data();var changed=[]
	for i in faction.palette_image.get_width():
		if palette_before.slice(i*4,i*4+4)!=palette_after.slice(i*4,i*4+4):changed.append(i)
	assert(changed==[int(model.definitions[a].rasterIndex)])
	assert(model.owners[b]==owners_before[b] and model.owners[a]=="rome")
	assert(JSON.stringify(model.definitions)==definitions and faction.ids.get_image().get_data()==raster and faction.world.base_material.get_shader_parameter("reference_local_ids").get_image().get_data()==local)
	assert(faction.world.base_material.get_shader_parameter("reference_sicily_ids").get_image().get_data()==sicily)
	assert(faction.world.base_material.get_shader_parameter("reference_balkans_ids").get_image().get_data()==balkans)
	assert(world.anatolia_surface.textures.region_ids.get_image().get_data()==anatolia)
	assert(not faction.set_region_owner(a,"missing") and not faction.set_region_owner("missing","rome"))
	var snapshot=model.export_state();var corrupt=snapshot.duplicate(true);corrupt.owners[a]="missing"
	assert(not model.restore_state(corrupt) and model.export_state()==snapshot)
	# Restore through the presentation adapter, never leave test owners active.
	assert(faction.restore_region_state(original))
	world.comparison_camera={};world.focus=Vector2(31.6,40.4);world.goal_focus=world.focus;world.distance=630.;world.goal_distance=630.;world.pitch=55.;world.yaw=0.;world.queue_tiles()
	for i in 30000:
		await process_frame
		if i>120 and world.is_settled():break
	faction.layer.visible=false
	assert(faction.set_region_owner(a,"paphlagonia"))
	for i in 4:await process_frame
	faction.layer.visible=false;draw();var before=root.get_texture().get_image();before.save_png(output+"/ownership-diagnostic-before.png")
	var p=world.project(30.1,40.9);p.y=world.elevation(30.1,40.9);var inside=world.camera.unproject_position(p)
	var q=world.project(33.4,41.2);q.y=world.elevation(33.4,41.2);var neighbor=world.camera.unproject_position(q)
	assert(faction.set_region_owner(a,"rome"))
	for i in 4:await process_frame
	faction.layer.visible=false;draw();var after=root.get_texture().get_image();after.save_png(output+"/ownership-diagnostic-after.png")
	var inside_delta=color_distance(before.get_pixelv(Vector2i(inside)),after.get_pixelv(Vector2i(inside)))
	var neighbor_delta=color_distance(before.get_pixelv(Vector2i(neighbor)),after.get_pixelv(Vector2i(neighbor)))
	assert(inside_delta>.005 and neighbor_delta<.001)
	for id in original.owners:assert(faction.set_region_owner(id,original.owners[id]))
	faction.layer.visible=true
	FileAccess.open(output+"/foundation-verification.json",FileAccess.WRITE).store_string(JSON.stringify({"changedPaletteEntries":changed,"geometryUnchanged":true,"sharedOwnerNeighborPreserved":true,"invalidStateRejectedAtomically":true,"insidePixelDelta":inside_delta,"neighborPixelDelta":neighbor_delta,"diagnosticNotice":"Nonhistorical temporary owner assignments for locality verification only; original owners restored."},"  "))
func color_distance(a:Color,b:Color):return Vector3(a.r,a.g,a.b).distance_to(Vector3(b.r,b.g,b.b))



