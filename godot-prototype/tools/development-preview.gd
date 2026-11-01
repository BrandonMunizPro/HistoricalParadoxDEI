extends SceneTree
func _initialize():call_deferred("run")
func run():
	var world=load("res://world.tscn").instantiate();root.add_child(world);world.capture_done=true
	var anchor=world.project(12.491258174554883,41.8899769864849)
	world.focus=world.unproject(anchor+Vector3(.045,0,-.015));world.goal_focus=world.focus
	world.distance=.28;world.goal_distance=.28;world.pitch=42.;world.yaw=15.;world.queue_tiles()
	# Existing geographic controls remain available outside this development panel.
	world.ui_panel.visible=false
