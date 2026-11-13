extends SceneTree
func _initialize():call_deferred("run")
func run():
	Engine.max_fps=60
	var world=load("res://world.tscn").instantiate();root.add_child(world);world.capture_done=true;world.automation_input_locked=true
	# Drive terrain adapters directly. Rapid test teleports must not accumulate
	# unrelated scenery/settlement work; the GPU captures exercise full readiness.
	world.set_process(false)
	assert(world.alpine_surface.regional_replacement and not world.alpine_surface.node.visible)
	var rows=[];var expected=preload("res://frontier_regions.gd").settings().order
	for region in expected:
		var surface=null
		for entry in world.eastern_surfaces:
			if entry.region==region:surface=entry;break
		assert(surface!=null,"Missing terrain section "+region)
		var chosen=null
		for d in surface.manifest.details:
			var b=d.bounds
			for offset in [Vector2(.5,.5),Vector2(.25,.25),Vector2(.75,.75),Vector2(.5,0),Vector2(.5,1),Vector2(0,.5),Vector2(1,.5)]:
				var p=Vector2(b.west+offset.x,b.south+offset.y)
				if surface.weight(p)>.99 and surface.land_at(p):chosen=p;break
			if chosen!=null:break
		if chosen==null:
			rows.append({"region":region,"noFullyCoveredLandProbe":true,"descriptors":surface.manifest.details.size()});continue
		world.focus=chosen;world.goal_focus=chosen;world.distance=65.;world.goal_distance=65.;world.queue_tiles()
		var start=Time.get_ticks_msec()
		for i in 1800:
			surface.tick()
			await process_frame
			if i>30 and surface.is_ready() and not surface.resident.is_empty():break
			if Time.get_ticks_msec()-start>90000:push_error("Terrain readiness timeout "+region);quit(1);return
		assert(surface.is_ready() and surface.resident.size()>0 and surface.resident.size()<=24)
		var samples=0
		for entry in surface.resident.values():
			var b=entry.descriptor.bounds;var point=Vector2((b.west+b.east)*.5,(b.south+b.north)*.5)
			if surface.weight(point)<.99:
				if chosen.x<b.west or chosen.x>b.east or chosen.y<b.south or chosen.y>b.north:continue
				point=chosen
			var vertex=roundi((b.north-point.y)*128)*129+roundi((point.x-b.west)*128)
			var f=FileAccess.open("res://"+entry.descriptor.mesh,FileAccess.READ);var count=f.get_32();f.seek(8+vertex*12+4);var h=f.get_float()
			assert(abs(surface.elevation(point,0.,true)-h)<.0003,"Height contact mismatch "+region)
			f.seek(8+count*40+vertex*16);assert(abs(f.get_float()-surface.sample_height(point))<.0003,"Morph-parent mismatch "+region);samples+=1
		assert(samples>0)
		rows.append({"region":region,"closeTiles":surface.resident.size(),"heightSamples":samples,"terrainReadyMs":Time.get_ticks_msec()-start})
		world.distance=2800.;surface.tick()
	world.distance=2800.;world.goal_distance=2800.;world.queue_tiles()
	for surface in world.eastern_surfaces:surface.tick()
	for i in 120:await process_frame
	for surface in world.eastern_surfaces:assert(surface.node.visible and surface.resident.is_empty() and surface.pending.is_empty())
	var factions=world.political_map.factions;var owners=factions.regions.export_state()
	for t in factions.data.territories:assert(factions.control[t.id]==t.initialController)
	assert(factions.data.factions.size()==131 and factions.data.territories.size()==128)
	assert(not factions.restore_region_state({"version":1,"owners":{}}))
	assert(factions.regions.export_state()==owners)
	FileAccess.open("res://evidence/world-completion/native.json",FileAccess.WRITE).store_string(JSON.stringify({"passed":true,"regions":rows,"alpineLegacyOverlayDisabled":true,"backdropsAt2800Km":true,"closeTilesReleased":true,"stableFactions":131,"stableTerritories":128,"unchangedInitialControllers":true,"atomicInvalidOwnerStateRejection":true,"scope":"Terrain adapter readiness and source contacts; does not measure scenery/settlement generation readiness."},"  "))
	print("WORLD_COMPLETION_NATIVE_OK ",JSON.stringify(rows));world.queue_free()
	for i in 10:await process_frame
	quit()
