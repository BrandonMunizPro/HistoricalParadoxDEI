extends SceneTree
func _initialize():call_deferred("run")
func run():
	var assets=load("res://vegetation_quality.gd").new()
	var viewport=SubViewport.new();viewport.size=Vector2i(256,256);viewport.transparent_bg=true;viewport.own_world_3d=true;viewport.msaa_3d=Viewport.MSAA_4X;viewport.render_target_update_mode=SubViewport.UPDATE_ALWAYS
	root.add_child(viewport)
	var environment=WorldEnvironment.new();var env=Environment.new();env.background_mode=Environment.BG_COLOR;env.background_color=Color(0,0,0,0);env.ambient_light_source=Environment.AMBIENT_SOURCE_COLOR;env.ambient_light_color=Color(.82,.90,1.);env.ambient_light_energy=.8;env.tonemap_mode=Environment.TONE_MAPPER_FILMIC
	environment.environment=env;viewport.add_child(environment)
	var sun=DirectionalLight3D.new();sun.rotation_degrees=Vector3(-55,-30,0);sun.light_energy=1.1;viewport.add_child(sun)
	var camera=Camera3D.new();camera.projection=Camera3D.PROJECTION_ORTHOGONAL;camera.near=.001;camera.far=5.;viewport.add_child(camera)
	var node=MeshInstance3D.new();viewport.add_child(node)
	var records=[]
	for index in 20:
		var mesh=assets.detail_mesh_for(index);node.mesh=mesh
		var box=mesh.get_aabb();var center=box.get_center();var width=max(box.size.y,max(box.size.x,box.size.z))*1.15
		camera.size=width
		var atlas=Image.create(2048,768,false,Image.FORMAT_RGBA8)
		for row in 3:
			var elevation=deg_to_rad(15.+row*35.)
			for column in 8:
				var azimuth=TAU*column/8.
				camera.position=center+Vector3(sin(azimuth)*cos(elevation),sin(elevation),cos(azimuth)*cos(elevation))*.5
				camera.look_at(center)
				for i in 2:await process_frame
				RenderingServer.force_draw(true)
				atlas.blit_rect(viewport.get_texture().get_image(),Rect2i(0,0,256,256),Vector2i(column*256,row*256))
		var name=assets.kits[index/4]+"-"+str(index%4)
		assert(atlas.save_png(assets.ROOT+name+"-atlas.png")==OK)
		records.append({"index":index,"name":name,"widthKm":width,"center":[center.x,center.y,center.z]})
		print("VEGETATION_IMPOSTOR_BAKED ",name)
	FileAccess.open(assets.ROOT+"impostors.json",FileAccess.WRITE).store_string(JSON.stringify(records,"  "))
	viewport.queue_free()
	for i in 10:await process_frame
	quit()
