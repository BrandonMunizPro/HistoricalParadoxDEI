extends SceneTree
var failures=[]
var checks=0
func _initialize():call_deferred("run")
func check(value,message):
	checks+=1
	if not value:failures.append(message);push_error(message)
func run():
	var world=load("res://world.tscn").instantiate();root.add_child(world);world.capture_done=true;world.automation_input_locked=true
	world.scenery.prebaking=true
	var quality=world.scenery.quality
	check(quality.variant_count==36,"36 textured asset variants are available")
	for index in quality.variant_count:
		for coarse in [false,true]:
			var mesh=quality.mesh_for(index,coarse)
			check(mesh!=null and mesh.surface_get_arrays(0)[Mesh.ARRAY_INDEX].size()==(144 if coarse else 6),"Instanced atlas geometry and original 24-tree grove population "+str(index)+" / "+str(coarse))
	for point in [Vector2(13,42),Vector2(2,47),Vector2(-8,54),Vector2(25,58),Vector2(31,30),Vector2(70,25)]:
		check(quality.contains(point.x,point.y),"Textured vegetation not restricted to Italy "+str(point))
		for rock in range(24,28):check(quality.regional_index(rock,point.x,point.y)==-1,"Rock never converted to a tree "+str(point))
	check(quality.regional_index(0,13,42)==20,"Mediterranean olive")
	check(quality.regional_index(1,13,42)==28,"Mediterranean umbrella pine")
	check(quality.regional_index(4,20,59)==24,"Northern Scots pine")
	check(quality.regional_index(8,-6,54)==24,"Northern columnar proxy uses regional conifers")
	check(quality.regional_index(20,31,30)==32,"Nile/West Asian palm")
	check(quality.regional_index(20,80,15)==-1,"Date palm not substituted in southern India")
	check(quality.mesh_for(-1)==null and quality.mesh_for(1000)==null,"Unsupported family fallback is explicit")
	# Compare the original scope function against the optimized early rejection.
	var text=FileAccess.get_file_as_string("res://evidence/close-vegetation/before/eastern_surface.gd.txt")
	text=text.substr(text.find("func weight(geo):"));text=text.substr(0,text.find("func land_at"))
	var original=GDScript.new();original.source_code="extends RefCounted\nvar world\nvar region\nvar manifest\nvar settings\n"+text
	check(original.reload()==OK,"Original weight function compiles independently")
	var baseline=original.new();baseline.world=world
	var rng=RandomNumberGenerator.new();rng.seed=278
	for surface in world.eastern_surfaces:
		baseline.region=surface.region;baseline.manifest=surface.manifest;baseline.settings=surface.settings
		var b=surface.manifest.bounds
		var points=[Vector2(b.west,b.south),Vector2(b.east,b.north),Vector2(b.west-.001,b.north+.001),Vector2(b.east+.001,b.south-.001)]
		for i in 20:points.append(Vector2(rng.randf_range(b.west-1,b.east+1),rng.randf_range(b.south-1,b.north+1)))
		for point in points:
			check(is_equal_approx(baseline.weight(point),surface.weight(point)),"Scope unchanged "+surface.region+" / "+str(point))
			var cell={"west":floor(point.x/.05)*.05,"east":floor(point.x/.05)*.05+.05,"south":floor(point.y/.05)*.05,"north":floor(point.y/.05)*.05+.05}
			var subset=world.scenery.regions_for(cell)
			check(world.is_land(point.x,point.y)==world.is_land(point.x,point.y,subset),"Land sampler unchanged "+str(point))
			check(world.presentation.climate(point.x,point.y).is_equal_approx(world.presentation.climate(point.x,point.y,subset)),"Climate sampler unchanged "+str(point))
			check(is_equal_approx(world.scenery_elevation(point.x,point.y),world.scenery_elevation(point.x,point.y,subset)),"Placement elevation unchanged "+str(point))
	check(world.sites.size()==35 and world.research.size()==687,"Geographic record counts preserved")
	var report={"passed":failures.is_empty(),"checks":checks,"failures":failures}
	FileAccess.open("res://evidence/close-vegetation/regional-validation.json",FileAccess.WRITE).store_string(JSON.stringify(report,"  "))
	print("REGIONAL_VEGETATION_VALIDATION ",JSON.stringify(report));world.queue_free();for i in 5:await process_frame
	quit(0 if failures.is_empty() else 1)
