extends SceneTree
func _initialize():call_deferred("run")
func run():
	var world=load("res://world.tscn").instantiate();root.add_child(world);world.capture_done=true
	var scenery=world.scenery;scenery.prebaking=true
	var jobs=[]
	for d in world.anatolia_surface.manifest.details:
		jobs.append({"id":"global|%d|%d"%[d.bounds.west,d.bounds.south],"bounds":d.bounds,"local":false})
	var seen={}
	for point in [Vector2(32.3,37.1),Vector2(31.39,36.77),Vector2(28.04,38.49),Vector2(35.49,38.73),Vector2(35.83,40.65),Vector2(28.22,36.44),Vector2(27.7,38.4),Vector2(38.5,40.7)]:
		var c=Vector2i(floori(point.x/.05),floori(point.y/.05))
		for yy in [-1,0,1]:
			for xx in [-1,0,1]:
				var x=c.x+xx;var y=c.y+yy;var id="local|%d|%d"%[x,y]
				if seen.has(id):continue
				seen[id]=true;jobs.append({"id":id,"bounds":{"west":x*.05,"east":(x+1)*.05,"south":y*.05,"north":(y+1)*.05},"local":true})
	var start=Time.get_ticks_msec();var count=0;var plants=0;var rocks=0
	for job in jobs:
		await scenery.build(job.id,job.bounds,job.local)
		var group=scenery.local_roots if job.local else scenery.roots
		assert(group.has(job.id) and group[job.id].get_meta("ready",false))
		plants+=int(group[job.id].get_meta("plants",0));rocks+=int(group[job.id].get_meta("rocks",0))
		group[job.id].queue_free();group.erase(job.id);count+=1
		print("SCENERY_PREBAKE ",count,"/",jobs.size()," ",job.id)
		await process_frame
	var report={"signature":scenery.cache_signature,"coarseCells":world.anatolia_surface.manifest.details.size(),"referenceLocalCells":seen.size(),"cacheFiles":count,"plants":plants,"rocks":rocks,"elapsedSeconds":(Time.get_ticks_msec()-start)/1000.,"notice":"All Anatolian coarse cells; close cells only around listed reference points. Other close cells prefetch and cache on demand. Meshes and textures unchanged."}
	FileAccess.open("res://data/scenery-cache/"+scenery.cache_signature+"/manifest.json",FileAccess.WRITE).store_string(JSON.stringify(report,"  "))
	FileAccess.open("res://evidence/anatolia-refinement/prebake.json",FileAccess.WRITE).store_string(JSON.stringify(report,"  "))
	print("SCENERY_PREBAKE_OK ",count," cells ",scenery.cache_signature)
	world.queue_free()
	for i in 10:await process_frame
	quit()
