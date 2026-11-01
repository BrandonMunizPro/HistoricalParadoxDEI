extends SceneTree
func read(path):return JSON.parse_string(FileAccess.get_file_as_string("res://"+path))
func _initialize():call_deferred("run")
func run():
	var catalog=load("res://settlement_identity_catalog.gd").merge_catalog(read("data/settlement-development-catalog.json"),read("data/settlement-identity-overlay.json"))
	var starts=read("data/settlement-identity-starts.json").settlements;var known=read("data/sites.json").map(func(s):return s.id)
	assert(catalog.cultures.size()==10 and starts.size()==2)
	var assets=[]
	for start in starts:
		var model=load("res://settlement_development.gd").new(catalog,start);assert(model.validate(known).is_empty())
		for slot in start.slots:
			if slot.building==null:continue
			for level in range(1,4):
				var asset=model.resolve_visual(slot.building.chain,level);assert(not asset.is_empty())
				var mesh=load(asset.near);var far=load(asset.far);assert(mesh is ArrayMesh and far is ArrayMesh)
				var bounds=mesh.get_aabb();assert(bounds.size.x*1000<=asset.footprintM[0]+1.5 and bounds.size.z*1000<=asset.footprintM[1]+1.5,"Footprint too small: "+asset.id)
				assert(model.set_level(slot.id,level));assert(model.levels[slot.id]==level)
				assets.append({"id":asset.id,"sizeM":[bounds.size.x*1000,bounds.size.y*1000,bounds.size.z*1000]})
		model.reset();assert(model.levels[start.slots[0].id]==start.slots[0].building.startingLevel)
	var report={"passed":true,"settlements":2,"culturalFamilies":10,"occupiedStageChecks":assets,"noInventedDeposits":starts.all(func(s):return s.deposits.is_empty()),"startingForumIII":starts[0].slots[0].building.startingLevel==3}
	var f=FileAccess.open("res://evidence/settlement-identities-20261028/native-validation.json",FileAccess.WRITE);f.store_string(JSON.stringify(report,"  "));f.close();print("IDENTITY_VALIDATION_OK");quit()
