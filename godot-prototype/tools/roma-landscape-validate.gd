extends SceneTree
func _initialize():call_deferred("run")
func run():
	var world=load("res://world.tscn").instantiate();root.add_child(world)
	world.focus=Vector2(12.491258174554883,41.8899769864849);world.goal_focus=world.focus
	world.distance=1.2;world.goal_distance=1.2;world.queue_tiles()
	var begin=Time.get_ticks_msec()
	while (not world.is_settled() or not world.resident.has("roma-local")) and Time.get_ticks_msec()-begin<90000:await process_frame
	assert(world.is_settled() and world.resident.has("roma-local"))
	var roma=world.settlements.roma_visual;var landscape=roma.landscape
	var exported=world.read_json("data/roma-landscape-layout.json")
	assert(roma.layout.size()==121 and exported.houses.size()==121)
	for i in 121:
		var current=roma.layout[i];var original=exported.houses[i]
		assert(abs(current.point.x-original.x)<1e-8 and abs(current.point.z-original.z)<1e-8)
		assert(abs(current.angle-original.angle)<1e-12 and current.kind==original.kind and abs(current.size-original.size)<1e-12)
	for i in landscape.routes.size():
		var endpoint=landscape.routes[i][0];var connected=false
		for lane in roma.lanes:
			if endpoint==lane.points[0] or endpoint==lane.points[-1]:connected=true
		assert(connected,"Approach must join an existing endpoint")
	assert(landscape.stats.trees>0 and landscape.stats.trees<=1800)
	assert(landscape.stats.approaches==4 and landscape.stats.cultivatedPlots==10)
	var child=world.resident["roma-local"];var parent=world.resident.N41E12
	var maximum=0.0
	for i in range(0,129,8):
		for coordinate in [Vector2i(0,i),Vector2i(128,i),Vector2i(i,0),Vector2i(i,128)]:
			var b=child.descriptor.bounds
			var lon=lerp(b.west,b.east,float(coordinate.x)/128);var lat=lerp(b.north,b.south,float(coordinate.y)/128)
			maximum=max(maximum,abs(world.mesh_vertex_height(child,coordinate.x,coordinate.y)-world.sample_entry(parent,lon,lat)))
	assert(maximum<.00001,"Fine terrain must meet parent edges")
	assert(world.regional_river!=null)
	var river_checked=0
	for p in world.regional_river.mesh.get_faces():
		var geo=world.unproject(p)
		if world.contains(child.descriptor.bounds,geo.x,geo.y):
			assert(p.y>=world.elevation(geo.x,geo.y)-.0001,"River edge must clear finer terrain")
			river_checked+=1
	assert(river_checked>0,"Tiber sampling must actually be exercised")
	assert(world.resident.size()<=13)
	var output=world.capture_dir;DirAccess.make_dir_recursive_absolute(ProjectSettings.globalize_path(output))
	var f=FileAccess.open(output+"/landscape.json",FileAccess.WRITE)
	f.store_string(JSON.stringify({"passed":true,"layoutUnchanged":true,"structures":121,"connectedApproaches":4,"fields":10,"parentEdgeMaxKm":maximum,"riverVerticesChecked":river_checked,"nativeTiles":world.resident.size(),"landscape":landscape.stats,"evidence":world.evidence_metadata()},"  "))
	print("ROMA_LANDSCAPE_OK unchanged_layout=121 roads=4 fields=10 boundary_max_km=",maximum)
	quit()
