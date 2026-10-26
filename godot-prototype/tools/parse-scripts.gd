extends SceneTree
func _initialize():
	var count=0
	for folder in ["res://","res://tools/"]:
		for file in DirAccess.get_files_at(folder):
			if not file.ends_with(".gd"):continue
			var script=load(folder+file)
			if script==null or not script.can_instantiate():
				push_error("Script compilation failed: "+folder+file);quit(1);return
			count+=1
	print("GDSCRIPT_PARSE_OK scripts=",count)
	quit()
