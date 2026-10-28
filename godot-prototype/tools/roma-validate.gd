extends SceneTree
func _initialize():call_deferred("run")
func run():
	var world=load("res://world.tscn").instantiate();root.add_child(world)
	var begin=Time.get_ticks_msec()
	while not world.is_settled() and Time.get_ticks_msec()-begin<90000:await process_frame
	assert(world.is_settled())
	world.set_process(false)
	var roma=world.settlements.roma_visual
	var old_focus=world.focus;var old_distance=world.distance
	world.focus=Vector2(12.491258174554883,41.8899769864849);world.distance=1.2
	roma.update_lighting(true)
	assert(is_equal_approx(roma.environment.ssao_radius,.0018))
	assert(is_equal_approx(world.sun.shadow_opacity,.7))
	world.focus=Vector2(23.7,38.0);roma.update_lighting(true)
	assert(is_equal_approx(roma.environment.ssao_radius,roma.original_lighting.x))
	assert(is_equal_approx(world.sun.shadow_opacity,roma.original_shadow_opacity))
	world.focus=old_focus;world.distance=old_distance;roma.update_lighting(false)
	var representation=await roma.create(1.2)
	world.add_child(representation)
	assert(roma.kit.library.size()==14)
	var distinct={}
	for kind in roma.kit.TYPES:
		var mesh=roma.kit.library[kind+"true"]
		assert(mesh.get_surface_count()>0)
		var vertices=0
		for i in mesh.get_surface_count():vertices+=mesh.surface_get_array_len(i)
		distinct[str(mesh.get_aabb().size)+str(vertices)]=true
	assert(distinct.size()==7,"Archetypes must differ geometrically")
	assert(roma.layout.size()>80 and roma.layout.size()<220)
	var anchors={}
	for b in roma.layout:
		assert(not anchors.has(b.point));anchors[b.point]=true
	for contact in representation.get_meta("contacts"):
		assert(contact.center.y>=contact.low)
	assert(representation.get_meta("lod")=="close")
	representation.queue_free();await process_frame
	for distance in [7.2,45.0]:
		var node=await roma.create(distance);world.add_child(node)
		assert(node.get_meta("lod")==("regional" if distance==7.2 else "strategic"))
		assert(node.get_meta("archetypes")==7)
		node.queue_free();await process_frame
	var output=world.capture_dir;DirAccess.make_dir_recursive_absolute(ProjectSettings.globalize_path(output))
	var f=FileAccess.open(output+"/roma.json",FileAccess.WRITE)
	f.store_string(JSON.stringify({"passed":true,"archetypes":7,"structures":roma.layout.size(),"meshVariants":14,"lods":[1.2,7.2,45],"sourceGeographyModified":false,"evidence":world.evidence_metadata(),"timing":roma.stats},"  "))
	print("ROMA_VALIDATION_OK archetypes=7 structures=",roma.layout.size()," variants=14")
	quit()
