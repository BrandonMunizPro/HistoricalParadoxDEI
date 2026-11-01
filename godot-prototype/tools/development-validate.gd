extends SceneTree
func _initialize():call_deferred("run")
func read(path):return JSON.parse_string(FileAccess.get_file_as_string("res://"+path))
func run():
	var c=read("data/settlement-development-catalog.json");var start=read("data/settlement-development-starts.json").settlements[0]
	var model=load("res://settlement_development.gd").new(c,start);var ids=read("data/sites.json").map(func(s):return s.id)
	assert(model.validate(ids).is_empty());assert(model.levels["roma-slot-1"]==3);assert(model.levels["roma-slot-2"]==2)
	assert(model.effect_references("roma-slot-1").landmarkModifiers==["forum.historical-significance"])
	var resources=[]
	for id in ["civic-forum","grain-storage"]:
		var signatures=[]
		for level in range(1,4):
			var a=model.resolve_visual(id,level);assert(not a.is_empty());var mesh=load(a.near);var far=load(a.far)
			assert(mesh is ArrayMesh and far is ArrayMesh);assert(mesh.get_aabb().size.x>0 and mesh.get_aabb().size.y>0)
			var size_value=mesh.get_aabb().size*1000
			assert(size_value.x<=a.footprintM[0]+1.5 and size_value.z<=a.footprintM[1]+1.5,"Declared placement envelope too small: "+a.id)
			signatures.append(mesh.get_aabb());resources.append({"id":a.id,"sizeM":[size_value.x,size_value.y,size_value.z]})
		assert(signatures[0]!=signatures[1] and signatures[1]!=signatures[2])
	for level in range(1,4):
		assert(model.set_level("roma-slot-1",level));assert(model.levels["roma-slot-1"]==level)
		assert(model.effect_references("roma-slot-1").landmarkModifiers.is_empty()==(level<3))
	assert(not model.set_level("roma-slot-3",2));assert(not model.set_level("roma-slot-1",4));model.reset();assert(model.levels["roma-slot-1"]==3)
	var bad=start.duplicate(true);bad.settlementId=ids[1];assert(not load("res://settlement_development.gd").new(c,bad).validate(ids).is_empty())
	bad=start.duplicate(true);bad.architectureCulture="punic";bad.regionalStyle="carthage";assert(load("res://settlement_development.gd").new(c,bad).resolve_visual("grain-storage",2).is_empty())
	assert(not model.eligibility("aqueduct-conduit").is_empty());assert(not model.eligibility("iron-extraction").is_empty())
	var f=FileAccess.open("res://evidence/settlement-development-20261028/native-validation.json",FileAccess.WRITE);f.store_string(JSON.stringify({"passed":true,"startingLevels":[3,2],"emptySlots":4,"realAssets":resources,"previewRestoresStartingData":true,"missingCultureArtReportsGap":true},"  "));f.close()
	print("DEVELOPMENT_VALIDATION_OK");quit()
