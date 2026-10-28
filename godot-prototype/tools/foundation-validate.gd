extends SceneTree
func _initialize():call_deferred("run")
func run():
	var geometry=load("res://river_geometry.gd")
	for next in [Vector3(2,0,0),Vector3(1,0,1),Vector3(.5,0,.1)]:
		var offset=geometry.bank_offset(Vector3.ZERO,Vector3(1,0,0),next,.075)
		assert(offset.is_finite() and offset.length()<=.112501 and abs(offset.y)<.000001)
		for i in 21:
			var t=float(i)/20
			var linear=Vector3(1,0,0).lerp(next,t)
			assert(geometry.surface_point(Vector3.ZERO,Vector3(1,0,0),next,next,t,.075).distance_to(linear)<.04501)
	var world=load("res://world.tscn").instantiate();root.add_child(world)
	assert(Engine.max_fps==int(world.read_json("data/foundation-settings.json").rendering.frame_cap))
	var begin=Time.get_ticks_msec()
	while not world.is_settled() and Time.get_ticks_msec()-begin<90000:await process_frame
	assert(world.is_settled(),"Initial settlement validation timed out")
	world.set_process(false)
	world.camera.near=.01
	var all_records=world.settlements.records.duplicate(true);var validated=[];var houses=0
	for r in all_records:
		if r.get("key","")=="catana":
			if world.city_root.get_child_count()==0:world.build_catana()
			assert(world.city_root.get_child_count()>0)
			validated.append({"id":r.id,"lon":r.lon,"lat":r.lat,"approved":true,"existingAsset":"Catana","houses":0});continue
		world.settlements.records=[r];world.distance=5.0
		world.target=world.project(r.lon,r.lat);world.target.y=world.elevation(r.lon,r.lat)
		world.camera.position=world.target+Vector3(0,4,4);world.camera.look_at(world.target)
		await process_frame
		await world.settlements.build("audit-"+r.id)
		assert(world.settlements.nodes.has(r.id),"Eligible location failed instantiation: "+r.id)
		var node=world.settlements.nodes[r.id]
		assert(node.get_meta("anchor")==Vector2(r.lon,r.lat))
		var nonzero=0
		for i in node.multimesh.instance_count:
			var transform=node.multimesh.get_instance_transform(i)
			if transform.basis.determinant()==0:continue
			var geo=world.unproject(transform.origin)
			assert(abs(world.elevation(geo.x,geo.y)-transform.origin.y)<.00001,"Building must follow rendered terrain")
			nonzero+=1
		assert(nonzero>0,"No land-supported building footprint: "+r.id)
		validated.append({"id":r.id,"lon":r.lon,"lat":r.lat,"approved":r.approved,"houses":nonzero})
		houses+=nonzero
		await process_frame
	assert(validated.size()==all_records.size())
	# A zoom that retains the same proxy topology must still refresh its scale.
	var last=world.settlements.records[0]
	world.distance=80.0;await world.settlements.build("zoom-80")
	assert(world.settlements.nodes[last.id].cast_shadow==GeometryInstance3D.SHADOW_CASTING_SETTING_OFF)
	var large=world.settlements.nodes[last.id].get_meta("footprint")
	world.distance=40.0;await world.settlements.build("zoom-40")
	assert(world.settlements.nodes[last.id].get_meta("footprint")<large)
	var output=world.capture_dir;DirAccess.make_dir_recursive_absolute(ProjectSettings.globalize_path(output))
	var file=FileAccess.open(output+"/settlements.json",FileAccess.WRITE)
	file.store_string(JSON.stringify({"passed":true,"records":validated,"validated":validated.size(),"houses":houses,"populationStats":world.settlements.stats,"method":"Serial actual MultiMesh instantiation at each accepted anchor on current rendered terrain; never all detailed towns resident simultaneously","evidence":world.evidence_metadata()},"  "))
	print("FOUNDATION_SETTLEMENTS_OK placed=",validated.size()," buildings=",houses," exact_anchors=true")
	quit()
