extends "res://tools/neapolis-free-validate.gd"
func run():
	var world=load("res://world.tscn").instantiate();root.add_child(world);world.capture_done=true
	world.focus=Vector2(14.25287,40.839995);world.goal_focus=world.focus;world.distance=1.5;world.goal_distance=1.5;world.queue_tiles();await settle(world)
	var adapter=world.settlements.neapolis_assets
	var points=[]
	for x in [-.05,-.012,0.,.012,.05]:
		for z in [-.05,-.012,0.,.012,.05]:points.append({"x":x,"z":z,"sample":adapter.sample_ground(Vector2(x,z))})
	print("TERRAIN_PROBE ",JSON.stringify(points))
	print("CONTACT_PROBE ",JSON.stringify(load("res://settlement_composition.gd").contact({"position":Vector2.ZERO,"footprint":Vector2(.024,.024),"angle":0.},Callable(adapter,"sample_ground"),adapter.catalog.placement)))
	world.queue_free();for i in 10:await process_frame
	quit()
