extends SceneTree
var world
var checks=[]
var worst_surface=0.0
var worst_edge=0.0
var timeout_seconds=90.0

func suite_name():return ""

func _initialize():
	Engine.max_fps=120
	for arg in OS.get_cmdline_user_args():
		if arg.begins_with("--timeout-seconds="):timeout_seconds=float(arg.trim_prefix("--timeout-seconds="))
	call_deferred("exercise")

func finish(passed,message):
	var result={"passed":passed,"failure":message,"checks":checks,"selectable":world.sites.size(),"maxPlacementErrorMetres":worst_surface*1000,"maxSharedEdgeErrorMetres":worst_edge*1000,"cameraToleranceKm":.0001,"timeoutSeconds":timeout_seconds,"evidence":world.evidence_metadata()}
	var file=FileAccess.open(world.capture_dir+"/"+suite_name()+"-navigation.json",FileAccess.WRITE)
	file.store_string(JSON.stringify(result,"  "))
	print(suite_name().to_upper()+"_VALIDATION_"+("OK" if passed else "FAIL")+" "+message)
	quit(0 if passed else 1)

func wait_ready():
	var begin=Time.get_ticks_msec()
	var stable=0
	while Time.get_ticks_msec()-begin<timeout_seconds*1000:
		await process_frame
		var camera_ready=abs(world.distance-world.goal_distance)<.0001 and world.focus.distance_to(world.goal_focus)<.000001
		if camera_ready and world.is_settled():stable+=1
		else:stable=0
		if stable>=6:return true
	return false

func exercise():
	world=load("res://world.tscn").instantiate()
	root.add_child(world)
	DirAccess.make_dir_recursive_absolute(ProjectSettings.globalize_path(world.capture_dir))
	var cases=world.read_json("data/navigation-expectations.json")[suite_name()]
	for view in cases:
		if not world.jump(view):finish(false,"Unknown production preset: "+view);return
		var expected=cases[view]
		if world.goal_distance!=expected[0] or world.navigation.resolve(view)[2]!=expected[0]:
			finish(false,"Wrong resolved production distance: "+view);return
		if not await wait_ready():
			checks.append({"view":view,"sceneryReady":world.scenery.is_ready(),"busy":world.scenery.busy,"pendingScenery":world.scenery.pending_cells(),"pendingTerrain":world.queue,"distance":world.distance,"goalDistance":world.goal_distance,"focusErrorDegrees":world.focus.distance_to(world.goal_focus)})
			finish(false,"Timed out waiting for camera, terrain and scenery: "+view);return
		var instances=world.scenery.resident_vegetation()
		var row={"view":view,"expectedDistance":expected[0],"resolvedDistance":world.goal_distance,"actualDistance":world.distance,"cameraPath":world.camera_path,"vegetationExpected":expected[1],"sceneryReady":world.scenery.is_ready(),"pendingScenery":world.scenery.pending_cells(),"vegetationInstances":instances,"terrainTiles":world.resident.size(),"vegetationCells":world.scenery.roots.size(),"localCells":world.scenery.local_roots.size()}
		checks.append(row)
		if world.camera_path!="production" or world.resolved_view!=view:finish(false,"Used a capture-only camera: "+view);return
		if expected[1] and instances<=0:finish(false,"Expected vegetation is missing: "+view);return
		if world.resident.size()>13 or world.scenery.roots.size()>12 or world.scenery.local_roots.size()>9:finish(false,"Residency exceeded: "+view);return
		for marker in world.markers:
			if abs(marker.label.position.x-marker.site.x)>.001 or abs(marker.label.position.z-marker.site.z)>.001:finish(false,"Settlement anchor moved");return
		for id in world.resident:
			var e=world.resident[id];var d=e.descriptor
			if d.kind=="context":continue
			var g=int(d.grid);var vertices=e.node.mesh.surface_get_arrays(0)[Mesh.ARRAY_VERTEX]
			var x=g*.37+.13;var y=g*.43+.71;var ix=int(x);var iy=int(y);var fx=x-ix;var fy=y-iy
			var a=vertices[iy*(g+1)+ix].y;var b=vertices[iy*(g+1)+ix+1].y;var c=vertices[(iy+1)*(g+1)+ix].y;var v=vertices[(iy+1)*(g+1)+ix+1].y
			var expected_height=a+(b-a)*fx+(c-a)*fy if fx+fy<1 else v+(c-v)*(1-fx)+(b-v)*(1-fy)
			var lon=lerp(d.bounds.west,d.bounds.east,x/g);var lat=lerp(d.bounds.north,d.bounds.south,y/g)
			if not (world.regional_active and world.contains(world.regional_manifest.bounds,lon,lat) and d.kind!="regional"):
				worst_surface=max(worst_surface,abs(expected_height-world.elevation(lon,lat)))
			for other in world.resident:
				var o=world.resident[other].descriptor
				if o.kind!=d.kind or o.bounds.west!=d.bounds.east or o.bounds.south!=d.bounds.south:continue
				var adjacent=world.resident[other].node.mesh.surface_get_arrays(0)[Mesh.ARRAY_VERTEX]
				var middle=int(g/2)
				worst_edge=max(worst_edge,vertices[(g+1)*middle+g].distance_to(adjacent[(g+1)*middle]))
		if worst_surface>.001 or worst_edge>.001:finish(false,"Terrain placement/edge mismatch: "+view);return
		print(suite_name().to_upper()+"_VIEW_OK "+view+" distance="+str(expected[0])+" vegetation="+str(instances))
	for site in world.sites:
		world.select_site(site.key)
		if world.selected!=site.key or world.goal_focus.distance_to(Vector2(site.lon,site.lat))>.00001:finish(false,"Settlement selection failed: "+site.key);return
	finish(true,"Production distances, complete scenery, positive vegetation and 35 selections")
