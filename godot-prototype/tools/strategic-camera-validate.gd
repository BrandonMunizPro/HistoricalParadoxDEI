extends SceneTree
func _initialize():call_deferred("run")
func run():
	var world=load("res://world.tscn").instantiate();root.add_child(world);world.capture_done=true
	var policy=world.strategic_camera;var records=[]
	for name in world.navigation.presets:
		assert(world.jump(name));var view=world.navigation.resolve(name)
		assert(world.goal_distance>=1.2 and world.goal_distance<=2800.)
		var cap=policy.maximum_at(world,world.goal_focus,world.pitch,world.yaw,16./9.)
		assert(cap>=1.2 and cap<=2800.)
		records.append({"preset":name,"requestedKm":view[2],"supportedMaximumKm":cap,"resolvedKm":min(view[2],cap),"pitch":policy.pitch_for(world.pitch,min(view[2],cap))})
	assert(not world.jump("unknown"))
	var frames=[]
	for focus in [Vector2(20,38),Vector2(-3,40),Vector2(69,35.5),Vector2(31,28.8)]:
		for yaw in [0.,90.,180.,270.]:
			var cap=policy.maximum_at(world,focus,57.,yaw,16./9.)
			assert(cap==2800.,"Panning or orbiting must not reduce the zoom limit")
			frames.append({"focus":[focus.x,focus.y],"yaw":yaw,"maximumKm":cap})
	# Traverse the production controller at several scales and screen shapes.
	# Edge proximity must never overwrite the requested zoom distance.
	for aspect in [4./3.,16./9.,21./9.]:
		root.size=Vector2i(int(720*aspect),720)
		for requested in [520.,1700.,2800.]:
			world.goal_distance=requested;world.distance=requested
			for location in [Vector2(29,37),Vector2(-9,40),Vector2(73,35.5),Vector2(29,37)]:
				world.goal_focus=location
				for heading in [0.,90.,180.,270.]:
					world.yaw=heading
					await process_frame
					assert(is_equal_approx(world.goal_distance,requested),"Traversal changed requested zoom")
					assert(is_equal_approx(world.distance,requested),"Traversal changed camera scale")
	# Exercise the production controller rather than a separate camera rig.
	world.jump("overview");world.focus=world.goal_focus;world.distance=2800.;world.goal_distance=2800.
	world.pitch=89.
	for i in 180:await process_frame
	assert(world.view_pitch<=62.001 and world.camera.near<world.camera.far)
	assert(world.camera.global_basis.z.y>.6)
	world.distance=520.;world.goal_distance=2800.;world.pitch=8.;world.view_pitch=32.;world.view_yaw=0.;world.yaw=0.
	var previous_distance=world.distance;var previous_pitch=world.view_pitch;var maximum_fraction=0.;var maximum_pitch_step=0.
	for i in 240:
		await process_frame
		var fraction=abs(world.distance-previous_distance)/previous_distance
		maximum_fraction=max(maximum_fraction,fraction);maximum_pitch_step=max(maximum_pitch_step,abs(world.view_pitch-previous_pitch))
		assert(fraction<=world.visual_settings.camera.max_zoom_step_fraction+.0001)
		assert(world.camera.project_ray_normal(Vector2(root.get_visible_rect().size.x*.5,0)).y<0.,"Strategic sky exposed")
		previous_distance=world.distance;previous_pitch=world.view_pitch
	world.zoom_at(root.get_visible_rect().size*.5,100.)
	assert(world.goal_distance<=2800.)
	world.zoom_at(root.get_visible_rect().size*.5,.00001)
	assert(world.goal_distance>=1.2)
	
	var motion=InputEventMouseMotion.new();motion.relative=Vector2(20,20);motion.button_mask=MOUSE_BUTTON_MASK_RIGHT
	var before=world.yaw;world._unhandled_input(motion);assert(world.yaw!=before)
	
	motion.button_mask=MOUSE_BUTTON_MASK_MIDDLE;var old_focus=world.goal_focus;world._unhandled_input(motion);assert(world.goal_focus!=old_focus)
	for site in world.sites:
		world.select_site(site.key);assert(world.selected==site.key and world.goal_focus.distance_to(Vector2(site.lon,site.lat))<.00001)
	var result={"passed":true,"presets":records,"supportedFrames":frames,"selectionChecks":world.sites.size(),"wheelAndOrbit":true,"maximumKm":2800.,"trajectoryFrames":240,"maximumZoomStepFraction":maximum_fraction,"maximumPitchStepDegrees":maximum_pitch_step}
	result["traversalChecks"]=144
	FileAccess.open("res://evidence/strategic-camera-navigation.json",FileAccess.WRITE).store_string(JSON.stringify(result,"  "))
	print("STRATEGIC_CAMERA_OK presets=",records.size()," edge_rotations=",frames.size()," sites=",world.sites.size());world.queue_free()
	for i in 10:await process_frame
	quit()
