extends SceneTree
## Compare native placement-cache payloads from the actual paired runs.
func _initialize():call_deferred("run")
func run():
	var folders=DirAccess.get_directories_at("user://scenery-cache")
	var before=[];var after=[];var errors=[];var checks=0
	var target="optimized"
	for arg in OS.get_cmdline_user_args():
		if arg.begins_with("--after="):target=arg.trim_prefix("--after=")
	for name in folders:
		if "-close-profile-before-" in name:before.append(name)
		if "-close-profile-"+target+"-" in name:after.append(name)
	if before.size()!=1 or after.size()!=1:
		push_error("Expected one isolated before/after-final cache namespace; found "+str(before)+" / "+str(after));quit(1);return
	var cells=[]
	for file in DirAccess.get_files_at("user://scenery-cache/"+before[0]):
		if not file.begins_with("local_") or not file.ends_with(".bin"):continue
		var old=FileAccess.open("user://scenery-cache/"+before[0]+"/"+file,FileAccess.READ).get_var(false)
		var path="user://scenery-cache/"+after[0]+"/"+file
		if not FileAccess.file_exists(path):errors.append("Missing cell "+file);continue
		var current=FileAccess.open(path,FileAccess.READ).get_var(false)
		for key in ["batches","colours","customs","plants","rocks"]:
			checks+=1
			if old[key]!=current[key]:errors.append("Placement changed: "+file+" / "+key)
		cells.append({"id":file,"plants":current.plants,"rocks":current.rocks})
	if cells.size()!=27:errors.append("Expected 27 local cells from the three routes")
	var result={"passed":errors.is_empty(),"checks":checks,"cells":cells,"errors":errors,"method":"Exact native Transform3D, tint, LOD/slope data and count comparisons. Scheduling and cache signatures are excluded; density and placements must match."}
	FileAccess.open("res://evidence/close-vegetation/placement-validation-"+target+".json",FileAccess.WRITE).store_string(JSON.stringify(result,"  "))
	print("DETAIL_PLACEMENT_VALIDATION ",JSON.stringify(result));quit(0 if errors.is_empty() else 1)
