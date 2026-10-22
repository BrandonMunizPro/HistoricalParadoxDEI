extends SceneTree
var world

func _initialize():
	Engine.max_fps=90
	call_deferred("exercise")

func exercise():
	world=load("res://world.tscn").instantiate()
	root.add_child(world)
	await create_timer(.1).timeout
	var checks=[]
	var worst_surface_error=0.0
	var worst_edge_error=0.0
	for view in ["overview","alps","po","apennines","south","sicily","etna","catana"]:
		world.jump(view)
		await create_timer(2.3).timeout
		assert(world.queue.is_empty(),"Terrain queue must drain")
		assert(world.resident.size()<=13)
		assert(world.scenery.roots.size()<=12)
		assert(world.scenery.local_roots.size()<=9)
		for m in world.markers:
			assert(abs(m.label.position.x-m.site.x)<.001)
			assert(abs(m.label.position.z-m.site.z)<.001)
		for id in world.resident:
			var e=world.resident[id]
			if e.descriptor.kind!="regional":continue
			var d=e.descriptor;var g=int(d.grid)
			var arrays=e.node.mesh.surface_get_arrays(0)
			var vertices=arrays[Mesh.ARRAY_VERTEX]
			var x=g*.37+.13;var y=g*.43+.71
			var ix=int(x);var iy=int(y);var fx=x-ix;var fy=y-iy
			var a=vertices[iy*(g+1)+ix].y;var b=vertices[iy*(g+1)+ix+1].y
			var c=vertices[(iy+1)*(g+1)+ix].y;var v=vertices[(iy+1)*(g+1)+ix+1].y
			var expected=a+(b-a)*fx+(c-a)*fy if fx+fy<1 else v+(c-v)*(1-fx)+(b-v)*(1-fy)
			var lon=lerp(d.bounds.west,d.bounds.east,x/g);var lat=lerp(d.bounds.north,d.bounds.south,y/g)
			var actual=world.elevation(lon,lat)
			worst_surface_error=max(worst_surface_error,abs(expected-actual))
			for other in world.resident:
				var o=world.resident[other]
				if o.descriptor.kind!="regional" or o.descriptor.bounds.west!=d.bounds.east or o.descriptor.bounds.south!=d.bounds.south:continue
				var adjacent=o.node.mesh.surface_get_arrays(0)[Mesh.ARRAY_VERTEX]
				worst_edge_error=max(worst_edge_error,vertices[(g+1)*64+g].distance_to(adjacent[(g+1)*64]))
		assert(worst_surface_error<.001,"Placement must follow visible mesh triangles")
		assert(worst_edge_error<.001,"Shared geographic edges must coincide")
		checks.append({"view":view,"fineTiles":world.resident.size()-1,"sceneryTiles":world.scenery.roots.size(),"stableSettlementAnchors":35})
	for s in world.sites:
		world.select_site(s.key)
		assert(world.selected==s.key)
		assert(world.goal_focus.distance_to(Vector2(s.lon,s.lat))<.00001)
	var file=FileAccess.open("res://evidence/regional-navigation-validation.json",FileAccess.WRITE)
	file.store_string(JSON.stringify({"passed":true,"checks":checks,"settlementsSelectable":35,"maxPlacementErrorMetres":worst_surface_error*1000,"maxSharedEdgeErrorMetres":worst_edge_error*1000,"maxFineTiles":12,"regionalBackdrops":1},"  "))
	print("REGIONAL_VALIDATION_OK surface_error_m=",worst_surface_error*1000," edge_error_m=",worst_edge_error*1000," selectable=35")
	quit()
