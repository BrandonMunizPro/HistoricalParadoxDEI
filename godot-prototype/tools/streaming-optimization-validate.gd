extends SceneTree
var checks=0
var failures=0
func check(value,message):
	checks+=1
	if not value:failures+=1;push_error(message)
func _initialize():call_deferred("run")
func run():
	var batches=[[]];var colours=[[]];var customs=[[]]
	var rng=RandomNumberGenerator.new();rng.seed=278
	var original=MultiMesh.new();original.transform_format=MultiMesh.TRANSFORM_3D
	original.use_colors=true;original.use_custom_data=true;original.mesh=BoxMesh.new();original.instance_count=1800
	for i in 1800:
		var t=Transform3D(Basis(Vector3.UP,rng.randf()*TAU).scaled(Vector3(rng.randf(),rng.randf(),rng.randf())),Vector3(rng.randf()*200, rng.randf(),rng.randf()*200))
		var c=Color(rng.randf(),rng.randf(),rng.randf(),rng.randf())
		var d=Color(rng.randf(),rng.randf(),rng.randf(),rng.randf())
		batches[0].append(t);colours[0].append(c);customs[0].append(d)
		original.set_instance_transform(i,t);original.set_instance_color(i,c);original.set_instance_custom_data(i,d)
	var worker=Thread.new();check(worker.start(preload("res://scenery_buffers.gd").pack.bind(batches,colours,customs))==OK,"worker starts")
	while worker.is_alive():await process_frame
	var buffers=worker.wait_to_finish()
	check(original.buffer==buffers[0],"bulk buffer is byte-identical to 5400 individual setters")
	var uploaded=MultiMesh.new();uploaded.transform_format=MultiMesh.TRANSFORM_3D
	uploaded.use_colors=true;uploaded.use_custom_data=true;uploaded.mesh=original.mesh;uploaded.instance_count=1800;uploaded.buffer=buffers[0]
	for i in 1800:
		check(uploaded.get_instance_transform(i)==original.get_instance_transform(i),"same transform")
		check(uploaded.get_instance_color(i)==original.get_instance_color(i),"same tint")
		check(uploaded.get_instance_custom_data(i)==original.get_instance_custom_data(i),"same LOD and slope data")
	check(preload("res://scenery_buffers.gd").pack([[]],[[]],[[]])[0].is_empty(),"empty species supported")
	print("STREAMING_VALIDATION checks=",checks," failures=",failures)
	quit(1 if failures else 0)
