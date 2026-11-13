extends SceneTree
func _initialize():call_deferred("run")
func run():
	var name="pellaro"
	for arg in OS.get_cmdline_user_args():
		if arg.begins_with("--coast-view="):name=arg.trim_prefix("--coast-view=")
	var views=JSON.parse_string(FileAccess.get_file_as_string("res://data/world-coast-views.json"))
	if not views.has(name):push_error("Unknown coast preview: "+name);quit(1);return
	var world=load("res://world.tscn").instantiate();world.startup_preparation_requested=true;root.add_child(world);world.capture_done=true
	var view=views[name];world.focus=Vector2(view[0],view[1]);world.goal_focus=world.focus;world.distance=view[2];world.goal_distance=view[2];world.pitch=view[3];world.yaw=view[4];world.queue_tiles()
