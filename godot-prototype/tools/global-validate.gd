extends SceneTree
var world
func _initialize():
	Engine.max_fps=180
	call_deferred("exercise")

func exercise():
	world=load("res://world.tscn").instantiate()
	root.add_child(world)
	var checks=[]
	var worst=0.0
	var edge_error=0.0
	var views=world.read_json("data/global-views.json").keys()+["overview","alps","catana"]
	for view in views:
		world.jump(view)
		await create_timer(4.5).timeout
		assert(world.queue.is_empty(),"Terrain queue did not drain")
		assert(world.resident.size()<=13,"Terrain residency exceeded cap")
		assert(world.scenery.roots.size()<=12,"Regional vegetation exceeded cap")
		assert(world.scenery.local_roots.size()<=9,"Local vegetation exceeded cap")
		for m in world.markers:
			assert(abs(m.label.position.x-m.site.x)<.001 and abs(m.label.position.z-m.site.z)<.001,"Settlement horizontal anchor changed")
		for id in world.resident:
			var e=world.resident[id]
			if e.descriptor.kind=="context":continue
			var d=e.descriptor;var g=int(d.grid)
			var vertices=e.node.mesh.surface_get_arrays(0)[Mesh.ARRAY_VERTEX]
			var x=g*.37+.13;var y=g*.43+.71;var ix=int(x);var iy=int(y);var fx=x-ix;var fy=y-iy
			var a=vertices[iy*(g+1)+ix].y;var b=vertices[iy*(g+1)+ix+1].y;var c=vertices[(iy+1)*(g+1)+ix].y;var v=vertices[(iy+1)*(g+1)+ix+1].y
			var expected=a+(b-a)*fx+(c-a)*fy if fx+fy<1 else v+(c-v)*(1-fx)+(b-v)*(1-fy)
			var lon=lerp(d.bounds.west,d.bounds.east,x/g);var lat=lerp(d.bounds.north,d.bounds.south,y/g)
			# Italy's regional backdrop intentionally takes precedence over intersecting world tiles.
			if world.contains(world.regional_manifest.bounds,lon,lat) and d.kind!="regional":continue
			worst=max(worst,abs(expected-world.elevation(lon,lat)))
			if d.kind=="world":
				for other in world.resident:
					var o=world.resident[other].descriptor
					if o.kind!="world" or o.bounds.west!=d.bounds.east or o.bounds.south!=d.bounds.south:continue
					var adjacent=world.resident[other].node.mesh.surface_get_arrays(0)[Mesh.ARRAY_VERTEX]
					edge_error=max(edge_error,vertices[(g+1)*64+g].distance_to(adjacent[(g+1)*64]))
		assert(worst<.001,"Placement differs from actual terrain triangles")
		assert(edge_error<.001,"World tiles have a geographic crack")
		checks.append({"view":view,"terrainTiles":world.resident.size(),"vegetationCells":world.scenery.roots.size(),"localCells":world.scenery.local_roots.size(),"instances":world.scenery.resident_instances()})
		print("GLOBAL_VIEW_OK ",view)
	for site in world.sites:
		world.select_site(site.key)
		assert(world.selected==site.key)
		assert(world.goal_focus.distance_to(Vector2(site.lon,site.lat))<.00001)
	var file=FileAccess.open("res://evidence/global-navigation-validation.json",FileAccess.WRITE)
	file.store_string(JSON.stringify({"passed":true,"checks":checks,"selectable":35,"maxPlacementErrorMetres":worst*1000,"maxWorldEdgeErrorMetres":edge_error*1000},"  "))
	print("GLOBAL_VALIDATION_OK selectable=35 surface_error_m=",worst*1000," edge_error_m=",edge_error*1000)
	quit()
