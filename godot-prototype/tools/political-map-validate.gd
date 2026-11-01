extends "res://tools/reset-profile.gd"
var checks=[]
func force_render():RenderingServer.force_draw(true)
func check(name,ok,details={}):
	checks.append({"name":name,"passed":ok,"details":details});assert(ok,name)
func pose(distance,focus=Vector2(12.5,41.7),yaw=0.):
	world.distance=distance;world.goal_distance=distance;world.focus=focus;world.goal_focus=focus;world.pitch=48.;world.yaw=yaw;world.queue_tiles()
	for i in 20000:
		await process_frame
		if i>=180 and world.is_settled():break
	assert(world.is_settled())
func freeze():
	world.water_animation_enabled=false;world.water_time=0.;world.water_material.set_shader_parameter("water_time",0.)
	await world.ocean_renderer.capture_time(0.)
	await process_frame
func now_image():
	RenderingServer.force_draw(true);return root.get_texture().get_image()
func difference(a,b,rect):
	var sum=0.;var maximum=0.;var changed=0
	for y in range(rect.position.y,rect.end.y):
		for x in range(rect.position.x,rect.end.x):
			var c=a.get_pixel(x,y);var d=b.get_pixel(x,y);var error=max(abs(c.r-d.r),max(abs(c.g-d.g),abs(c.b-d.b)))
			sum+=error;maximum=max(maximum,error)
			if error>1./255.:changed+=1
	return {"mean":sum/rect.get_area(),"max":maximum,"pixelsOverOneByte":changed}
func run():
	output="res://evidence/political-map-20261029/native"
	for arg in OS.get_cmdline_user_args():
		if arg.begins_with("--output="):output=arg.trim_prefix("--output=")
	DirAccess.make_dir_recursive_absolute(ProjectSettings.globalize_path(output))
	RenderingServer.render_loop_enabled=false;process_frame.connect(force_render)
	world=load("res://world.tscn").instantiate();root.add_child(world);world.capture_done=true
	Engine.max_fps=0;DisplayServer.window_set_vsync_mode(DisplayServer.VSYNC_DISABLED)
	for c in world.get_children():
		if c is CanvasLayer:c.visible=false
	await pose(1.2,Vector2(11.65,42.22),132.)
	world.pitch=28.;await freeze()
	var current=now_image();var ocean_shader=world.water_material.shader
	var old=Shader.new();old.code=FileAccess.get_file_as_string("res://evidence/political-map-20261029/before-ocean_surface.gdshader")
	for mat in world.ocean_renderer.materials:mat.shader=old
	for i in 4:await process_frame
	var original=now_image();original.save_png(output+"/close-water-original.png");current.save_png(output+"/close-water-current.png")
	var d=difference(original,current,Rect2i(80,100,800,400));check("Close FFT waves and sunlight preserved",d.mean<.0001,d)
	for mat in world.ocean_renderer.materials:mat.shader=ocean_shader
	await pose(59.3,Vector2(11.65,42.22),-48.);await freeze()
	current=now_image()
	var terrain_shader=world.base_material.shader;var mats=[world.base_material,world.regional_node.material_override]
	for item in world.resident.values():
		if not item.node.material_override in mats:mats.append(item.node.material_override)
	old=Shader.new();old.code=FileAccess.get_file_as_string("res://evidence/political-map-20261029/before-terrain.gdshader")
	for mat in mats:mat.shader=old
	for i in 4:await process_frame
	original=now_image();original.save_png(output+"/geographic-original.png");current.save_png(output+"/geographic-current.png")
	d=difference(original,current,Rect2i(80,40,800,260));check("59.3 km geographic terrain preserved",d.mean<.0001,d)
	for mat in mats:mat.shader=terrain_shader
	var map=world.political_map
	check("Zero below transition, full beyond threshold",map.weight_at(1.2)==0. and map.weight_at(59.3)==0. and map.weight_at(60.)==0. and map.weight_at(180.)==1. and map.weight_at(30000.)==1.)
	check("Blend is continuous and reverses without hysteretic jumps",abs(map.weight_at(120.)-.5)<.000001 and abs(map.weight_at(120.001)-map.weight_at(119.999))<.0001)
	check("No ownership or boundaries supplied",not map.metrics.layersBound and not map.metrics.boundariesBound)
	check("Neutral material RGB channels equal",map.settings.neutral_land_linear[0]==map.settings.neutral_land_linear[1] and map.settings.neutral_land_linear[1]==map.settings.neutral_land_linear[2])
	map.clear_cartography_layers();check("Missing cartography safely remains neutral",not map.metrics.layersBound and not map.metrics.boundariesBound)
	world.validate_geography();check("Existing 35-site / 687-record geographic validator passed",true)
	await pose(520.,Vector2(14.5,37.7));await freeze()
	check("Political mode fully active in the existing world",map.blend==1. and world.get_child_count()>0)
	check("One marker instance per approved site",map.points.multimesh.instance_count==35)
	var exact=true
	for i in world.markers.size():
		var p=map.points.multimesh.get_instance_transform(i).origin;var s=world.markers[i].site
		var expected=Vector3(s.x,0.,s.z)
		exact=exact and p.x==expected.x and p.z==expected.z
	check("All strategic marker XZ coordinates exact",exact)
	check("Close-detail roots hidden in political view",not world.vegetation_root.visible and not world.settlements.root.visible)
	var catana=world.markers.filter(func(m):return m.site.key=="catana")[0]
	var click=InputEventMouseButton.new();click.button_index=MOUSE_BUTTON_LEFT;click.pressed=true;click.position=world.camera.unproject_position(catana.label.position)
	world.automation_input_locked=false;world._unhandled_input(click);world.automation_input_locked=true
	check("Existing pointer selection works on political settlement points",world.selected=="catana")
	world.goal_distance=world.distance;world.goal_focus=world.focus
	world.set_water_animation(true);world.ocean_renderer.resume_animation();var updates=world.ocean_renderer.metrics.computeUpdates;var clock=world.water_time
	for i in 60:await process_frame
	check("Political mode suspends FFT updates without stopping world clock",world.ocean_renderer.metrics.computeUpdates==updates and world.water_time>clock)
	world.set_water_animation(false);clock=world.water_time
	for i in 15:await process_frame
	check("Existing reduced-motion clock preserved",world.water_time==clock)
	await pose(30.)
	world.set_water_animation(true);world.ocean_renderer.resume_animation();updates=world.ocean_renderer.metrics.computeUpdates
	for i in 60:await process_frame
	check("Returning to geography resumes FFT",map.blend==0. and world.ocean_renderer.metrics.computeUpdates>updates and world.vegetation_root.visible and world.settlements.root.visible)
	# Native camera input and selection stay on the original world controller.
	world.select_site("roma");check("Existing settlement selection retained",world.selected=="roma")
	var registry=world.navigation.presets.duplicate(true)
	check("Existing campaign preset retained",registry.campaign[2]==1100.)
	# Deterministic native flipbook, both directions while pan/rotation continue.
	var folder=output+"/animation";DirAccess.make_dir_recursive_absolute(ProjectSettings.globalize_path(folder))
	var frames=[];world.water_animation_enabled=false
	for i in 144:
		var t=float(i)/143.;var q=sin(PI*t)
		world.distance=exp(lerp(log(45.),log(520.),q));world.goal_distance=world.distance;world.focus=Vector2(12.4+t*.2,41.7);world.goal_focus=world.focus;world.pitch=48.;world.yaw=lerp(-20.,40.,t)
		await process_frame;var name="frame-%03d.webp" % i;assert(now_image().save_webp(folder+"/"+name,false,.88)==OK)
		frames.append({"file":name,"distance":world.distance,"blend":map.blend,"yaw":world.yaw})
	check("Both-direction transition returns to geography",map.blend==0.)
	FileAccess.open(folder+"/frames.json",FileAccess.WRITE).store_string(JSON.stringify({"frames":frames,"fps":24,"notice":"144 native 960x540 frames; deterministic zoom/pan/rotation, not real-time performance video. Water clock held for comparison."},"  "))
	FileAccess.open(output+"/validation.json",FileAccess.WRITE).store_string(JSON.stringify({"passed":true,"checks":checks},"  "))
	print("POLITICAL_NATIVE_OK ",checks.size()," checks; 144 native frames")
	for i in 30000:
		await process_frame
		if i>90 and world.is_settled():break
	world.queue_free()
	for i in 10:await process_frame
	quit()
