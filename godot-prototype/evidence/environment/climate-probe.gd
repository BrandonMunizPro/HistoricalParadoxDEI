extends SceneTree
func _initialize():call_deferred("run")
func run():
	var world=load("res://world.tscn").instantiate();root.add_child(world)
	var views=world.read_json("data/environment-views.json")
	for key in views:
		var v=views[key];var c=world.presentation.climate(v[0],v[1])
		print("CLIMATE ",key," ",c," weights=",world.presentation.weights(v[1],c))
	quit()
