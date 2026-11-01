extends SceneTree
func _initialize():call_deferred("run")
func run():
	DirAccess.make_dir_recursive_absolute(ProjectSettings.globalize_path("res://assets/settlement-development"))
	var kit=load("res://settlement_development_kit.gd").new();kit.load_materials();var report=[]
	for far in [false,true]:
		for level in range(1,4):
			kit.begin(700+level,far);kit.civic_stage(level);report.append(kit.save_mesh("forum-"+str(level)+("-far" if far else "")));await process_frame
			kit.begin(800+level,far);kit.grain_stage(level);report.append(kit.save_mesh("granary-"+str(level)+("-far" if far else "")));await process_frame
	var f=FileAccess.open("res://assets/settlement-development/geometry-manifest.json",FileAccess.WRITE);f.store_string(JSON.stringify(report,"  "));f.close()
	print("DEVELOPMENT_BAKED ",report.size());quit()
