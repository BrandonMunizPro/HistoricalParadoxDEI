extends SceneTree
func _initialize():call_deferred("run")
func run():
	var world=load("res://world.tscn").instantiate();root.add_child(world)
	var roma=world.settlements.roma_visual;var roads=[];var houses=[]
	for lane in roma.lanes:
		var points=[]
		for p in lane.points:points.append([p.x,p.z])
		roads.append({"points":points,"width":lane.width})
	for b in roma.layout:houses.append({"x":b.point.x,"z":b.point.z,"angle":b.angle,"kind":b.kind,"size":b.size})
	var f=FileAccess.open("res://data/roma-landscape-layout.json",FileAccess.WRITE)
	f.store_string(JSON.stringify({"roads":roads,"houses":houses,"notice":"Derived from the unchanged illustrative Roma layout, not canonical research."},"  "))
	await process_frame;quit()
