extends SceneTree
func _initialize():
	for name in ClassDB.class_get_integer_constant_list("RenderingDevice"):
		if name.begins_with("TEXTURE_SLICE"):print(name,"=",ClassDB.class_get_integer_constant("RenderingDevice",name))
	quit()
