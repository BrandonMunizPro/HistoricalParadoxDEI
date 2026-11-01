extends SceneTree
func _initialize():call_deferred("run")
func run():
	var world=load("res://world.tscn").instantiate();root.add_child(world)
	var anchor=world.project(12.491258174554883,41.8899769864849)
	world.focus=world.unproject(anchor+Vector3(-.04,0,-.04));world.goal_focus=world.focus
	world.distance=.22;world.goal_distance=.22;world.pitch=32.;world.yaw=20.;world.queue_tiles()
