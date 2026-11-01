extends "res://tools/reset-profile.gd"
var checks=[]
var directory="res://evidence/map-repair-20261029/native"
func draw():RenderingServer.force_draw(true)
func image_now():draw();return root.get_texture().get_image()
func check(name,ok,details={}):
	checks.append({"test":name,"passed":ok,"details":details})
	FileAccess.open(directory+"/validation.json",FileAccess.WRITE).store_string(JSON.stringify({"passed":checks.all(func(c):return c.passed),"checks":checks},"  "))
	assert(ok,name)
func pose(distance,focus,yaw=0.,pitch=65.):
	world.comparison_camera={}
	world.focus=focus;world.goal_focus=focus;world.distance=distance;world.goal_distance=distance;world.pitch=pitch;world.yaw=yaw;world.queue_tiles()
	if distance==3300. and yaw==0.:
		for view in JSON.parse_string(FileAccess.get_file_as_string("res://evidence/map-repair-20261029/before/views.json")).views:
			if view.name=="caspian-3300":world.comparison_camera={"position":view.camera.position,"distance":distance,"pitch":pitch,"yaw":yaw}
	for i in 20000:
		await process_frame
		if i>=120 and world.is_settled():break
	assert(world.is_settled())
	world.water_animation_enabled=false;world.water_time=0.;world.water_material.set_shader_parameter("water_time",0.)
	await world.ocean_renderer.capture_time(0.);await process_frame
func difference(a,b,rect):
	var sum=0.;var maximum=0.
	for y in range(rect.position.y,rect.end.y):
		for x in range(rect.position.x,rect.end.x):
			var c=a.get_pixel(x,y);var d=b.get_pixel(x,y);var v=max(abs(c.r-d.r),max(abs(c.g-d.g),abs(c.b-d.b)));sum+=v;maximum=max(maximum,v)
	return {"mean":sum/rect.get_area(),"max":maximum}
func mask_value(image,lon,lat):
	return image.get_pixel(roundi((lon+12.)/87.*(image.get_width()-1)),roundi((62.-lat)/50.*(image.get_height()-1))).r
func land_samples(image,coast):
	var total=0;var blue=0
	for y in 60:
		for x in 80:
			var lon=46.+x*.085;var lat=43.6+y*.085
			if mask_value(coast,lon,lat)<.999 or mask_value(world.global_land,lon,lat)<.999:continue
			if mask_value(world.global_land,lon-.06,lat)<.999 or mask_value(world.global_land,lon+.06,lat)<.999 or mask_value(world.global_land,lon,lat-.06)<.999 or mask_value(world.global_land,lon,lat+.06)<.999:continue
			var elevation=world.elevation(lon,lat)
			if elevation>.002:continue
			var p=world.project(lon,lat);p.y=elevation
			if world.camera.is_position_behind(p):continue
			var pixel=world.camera.unproject_position(p)
			if not Rect2(Vector2(64,64),root.size-Vector2i(128,128)).has_point(pixel):continue
			var color=image.get_pixel(int(pixel.x),int(pixel.y));total+=1
			if color.b-color.r>.07 and color.g-color.r>.04:blue+=1
	return {"sourceLandProbes":total,"waterColoredLandProbes":blue}
func lake_alias(image):
	var total=0.;var count=0
	for y in 35:
		for x in 40:
			var lon=49.+x*.06;var lat=41.2+y*.065
			if mask_value(world.global_land,lon,lat)>.01:continue
			if mask_value(world.global_land,lon-.06,lat)>.01 or mask_value(world.global_land,lon+.06,lat)>.01 or mask_value(world.global_land,lon,lat-.06)>.01 or mask_value(world.global_land,lon,lat+.06)>.01:continue
			var p=world.project(lon,lat);p.y=-.04
			var pixel=world.camera.unproject_position(p);var px=int(pixel.x);var py=int(pixel.y)
			if px<10 or py<10 or px>=image.get_width()-10 or py>=image.get_height()-10:continue
			var a=image.get_pixel(px-1,py);var b=image.get_pixel(px,py);var c=image.get_pixel(px+1,py)
			total+=abs(a.r-2.*b.r+c.r)+abs(a.g-2.*b.g+c.g)+abs(a.b-2.*b.b+c.b);count+=1
	return {"samples":count,"pixelSecondDifference":total/max(1,count)}
func run():
	for arg in OS.get_cmdline_user_args():
		if arg.begins_with("--output="):directory=arg.trim_prefix("--output=")
	DirAccess.make_dir_recursive_absolute(ProjectSettings.globalize_path(directory))
	RenderingServer.render_loop_enabled=false;process_frame.connect(draw)
	world=load("res://world.tscn").instantiate();root.add_child(world);world.capture_done=true
	# Projection probes below use native image pixels. Keep physical and logical
	# viewport sizes identical, as in the matched baseline that reproduces the bug.
	assert(root.size==Vector2i(1920,1080))
	Engine.max_fps=0;DisplayServer.window_set_vsync_mode(DisplayServer.VSYNC_DISABLED)
	for child in world.get_children():
		if child is CanvasLayer:child.visible=false
	var new_ocean=world.water_material.shader
	var old_ocean=Shader.new();old_ocean.code=FileAccess.get_file_as_string("res://evidence/map-repair-20261029/before-ocean_surface.gdshader")
	await pose(1.2,Vector2(11.65,42.22),132.,28.)
	var after=image_now()
	for mat in world.ocean_renderer.materials:mat.shader=old_ocean
	for i in 4:await process_frame
	var before=image_now();before.save_png(directory+"/close-before.png");after.save_png(directory+"/close-after.png")
	var delta=difference(before,after,Rect2i(200,200,800,400));check("Close ocean appearance unchanged",delta.mean<.0001,delta)
	for mat in world.ocean_renderer.materials:mat.shader=new_ocean
	await pose(3300.,Vector2(50.,44.))
	var coast=Image.load_from_file("res://data/tiles/context-coast.png")
	after=image_now();after.save_png(directory+"/caspian-after.png");var corrected=land_samples(after,coast)
	for mat in world.ocean_renderer.materials:mat.shader=old_ocean
	for i in 4:await process_frame
	before=image_now();before.save_png(directory+"/caspian-before.png");var broken=land_samples(before,coast)
	check("Reproduce source-land depth conflict",broken.sourceLandProbes>100 and broken.waterColoredLandProbes>20,broken)
	check("Ocean no longer wins depth on low source land",corrected.sourceLandProbes==broken.sourceLandProbes and corrected.waterColoredLandProbes<broken.waterColoredLandProbes*.05,{"before":broken,"after":corrected})
	for mat in world.ocean_renderer.materials:mat.shader=new_ocean
	var new_inland=world.inland_water_material.shader
	var old_inland=Shader.new();old_inland.code=FileAccess.get_file_as_string("res://evidence/map-repair-20261029/before-nile_water.gdshader")
	world.inland_water_material.shader=old_inland
	for i in 4:await process_frame
	before=image_now();before.save_png(directory+"/lake-before.png");var old_alias=lake_alias(before)
	world.inland_water_material.shader=new_inland
	for i in 4:await process_frame
	after=image_now();after.save_png(directory+"/lake-after.png");var new_alias=lake_alias(after)
	check("Distant lake ripple aliasing reduced",old_alias.samples>100 and new_alias.pixelSecondDifference<old_alias.pixelSecondDifference*.5,{"before":old_alias,"after":new_alias})
	await pose(1.2,Vector2(10.65,45.6),0.,48.)
	after=image_now();world.inland_water_material.shader=old_inland
	for i in 4:await process_frame
	before=image_now();delta=difference(before,after,Rect2i(200,260,800,300));check("Resolved close inland-water rendering preserved",delta.mean<.0001,delta)
	world.inland_water_material.shader=new_inland
	for v in [[1800.,-20.],[2800.,0.],[4000.,20.],[8500.,0.],[3300.,0.]]:
		await pose(v[0],Vector2(50.,44.),v[1])
		var probes=land_samples(image_now(),coast)
		# Exclude a strict-zero claim at rasterized coastlines: a few projected
		# mask probes hit the adjacent water pixel at continental pixel footprints.
		probes["maximumCoastPixelFraction"]=.02
		check("No broad lowland speckling at %s km yaw %s" % [v[0],v[1]],probes.sourceLandProbes>100 and probes.waterColoredLandProbes<float(probes.sourceLandProbes)*.02,probes)
	world.validate_geography();check("Existing geography validator passes",world.sites.size()==35 and world.research.size()==687)
	check("Approved political transition configuration unchanged",world.political_map.settings.transition_begin_km==60. and world.political_map.settings.transition_full_km==180. and world.political_map.blend==1.)
	var success=checks.all(func(c):return c.passed)
	print("MAP_REPAIR_NATIVE_OK " if success else "MAP_REPAIR_NATIVE_FAILED ",checks.size()," checks")
	for i in 20000:
		await process_frame
		if i>90 and world.is_settled():break
	world.queue_free()
	for i in 10:await process_frame
	quit(0 if success else 1)
