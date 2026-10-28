extends SceneTree
func _initialize():call_deferred("run")
func run():
	var world=load("res://world.tscn").instantiate();root.add_child(world)
	world.sun.shadow_enabled=false
	world.focus=Vector2(12.491258174554883,41.8899769864849);world.goal_focus=world.focus
	world.distance=.42;world.goal_distance=.42;world.pitch=38;world.yaw=65;world.queue_tiles()
