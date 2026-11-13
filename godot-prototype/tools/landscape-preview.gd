extends SceneTree
var world
func _initialize():call_deferred("run")
func run():
	world=load("res://world.tscn").instantiate();world.startup_preparation_requested=true;root.add_child(world);world.capture_done=true
	world.ui_panel.visible=false
	Engine.max_fps=0
	DisplayServer.window_set_vsync_mode(DisplayServer.VSYNC_DISABLED)
	world.focus=Vector2(12.49,41.895);world.goal_focus=world.focus
	world.distance=4.5;world.goal_distance=world.distance;world.pitch=45.;world.yaw=25.
	world.queue_tiles()
