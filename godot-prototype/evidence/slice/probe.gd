extends SceneTree
func _initialize():call_deferred("run")
func run():
	var world=load("res://world.tscn").instantiate();root.add_child(world)
	var clock=Time.get_ticks_msec()
	for frame in 1400:
		await process_frame
		if frame%100==0:print("SLICE_PROBE frame=",frame," ms=",Time.get_ticks_msec()-clock," gpu=",RenderingServer.viewport_get_measured_render_time_gpu(root.get_viewport_rid())," cpu=",RenderingServer.viewport_get_measured_render_time_cpu(root.get_viewport_rid())," props=",world.scenery.resident_instances())
	quit()
