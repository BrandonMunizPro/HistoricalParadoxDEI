extends SceneTree
## Same loaded world/camera, alternating shader pairs after compilation warmup.
var world
func _initialize():call_deferred("run")
func run():
	world=load("res://world.tscn").instantiate();root.add_child(world)
	world.camera_path="coast-performance-diagnostic"
	var view=world.read_json("data/coast-views.json").italy
	world.focus=Vector2(view[0],view[1]);world.goal_focus=world.focus
	world.distance=view[2]*3.2;world.goal_distance=world.distance
	world.pitch=view[3];world.yaw=view[4];world.queue_tiles()
	var start=Time.get_ticks_msec()
	while not world.is_settled():
		await process_frame
		if Time.get_ticks_msec()-start>90000:push_error("Performance scenery timeout");quit(1);return
	var materials=[world.base_material,world.regional_node.material_override]
	for entry in world.resident.values():
		if not materials.has(entry.node.material_override):materials.append(entry.node.material_override)
	var old_settings=world.read_json("evidence/coast-v2/before-settings.json")
	var results=[]
	for stage in ["before","final","before","final"]:
		var old=stage=="before"
		var terrain=load("res://evidence/coast-v2/before-terrain.gdshader" if old else "res://terrain.gdshader")
		for material in materials:material.shader=terrain
		world.water_material.shader=load("res://evidence/coast-v2/before-water.gdshader" if old else "res://water.gdshader")
		var settings=old_settings if old else world.visual_settings
		for key in settings.water:
			var value=settings.water[key]
			if key in ["deep_color","coastal_color"]:value=Vector3(value[0],value[1],value[2])
			world.water_material.set_shader_parameter(key,value)
		# Exclude compilation and allow clocks/driver queues to settle.
		for frame in 180:await process_frame
		var gpu=0.0
		var began=Time.get_ticks_usec()
		for frame in 300:
			await process_frame
			gpu+=RenderingServer.viewport_get_measured_render_time_gpu(root.get_viewport_rid())
		var elapsed=(Time.get_ticks_usec()-began)*.001
		results.append({"stage":stage,"frames":300,"meanGpuMs":gpu/300.0,"fps":300000.0/elapsed,"tiles":world.resident.size()})
		print("COAST_PERFORMANCE ",results[-1])
	var file=FileAccess.open("res://evidence/coast-v2/performance.json",FileAccess.WRITE)
	file.store_string(JSON.stringify({"evidence":world.evidence_metadata(),"cameraDistanceKm":world.distance,"cameraPath":world.camera_path,"samples":results},"  "))
	quit()
