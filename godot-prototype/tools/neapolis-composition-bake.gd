extends SceneTree
func _initialize():call_deferred("run")
func run():
	var kit=load("res://neapolis_composition_kit.gd").new();kit.setup()
	var folder="res://assets/neapolis-composition/"
	DirAccess.make_dir_recursive_absolute(ProjectSettings.globalize_path(folder))
	var records=[]
	for kind in ["street-house","stoa","meeting-hall","sanctuary","market","workshop","store","guard"]:
		for far in [false,true]:
			var mesh=kit.build(kind,far);var path=folder+kind+("-far" if far else "")+".res"
			assert(ResourceSaver.save(mesh,path)==OK)
			var triangles=0
			for i in mesh.get_surface_count():triangles+=mesh.surface_get_array_index_len(i)/3
			var a=mesh.get_aabb()
			records.append({"path":path,"triangles":triangles,"surfaces":mesh.get_surface_count(),"boundsM":{"min":[a.position.x*1000,a.position.y*1000,a.position.z*1000],"size":[a.size.x*1000,a.size.y*1000,a.size.z*1000]}})
			await process_frame
	FileAccess.open(folder+"manifest.json",FileAccess.WRITE).store_string(JSON.stringify(records,"  "))
	print("NEAPOLIS_COMPOSITION_BAKE_OK ",records.size());quit()
