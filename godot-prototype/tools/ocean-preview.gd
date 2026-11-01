extends SceneTree
func _initialize():call_deferred("run")
func run():
	var world=load("res://world.tscn").instantiate();root.add_child(world);world.capture_done=true
	Engine.max_fps=0;DisplayServer.window_set_vsync_mode(DisplayServer.VSYNC_DISABLED)
	world.focus=Vector2(11.65,42.22);world.goal_focus=world.focus;world.distance=.8;world.goal_distance=.8;world.pitch=15.;world.yaw=-70.;world.queue_tiles()
