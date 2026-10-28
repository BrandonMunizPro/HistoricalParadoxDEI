extends SceneTree
## Exercise actual GPU canopy transitions, including the shadow-casting bark
## material, rather than merely comparing a copy of the interpolation formula.
func _initialize():call_deferred("run")
func visible_pixels(viewport):
	for frame in 5:await process_frame
	RenderingServer.force_draw()
	var image=viewport.get_texture().get_image();var count=0
	for y in image.get_height():
		for x in image.get_width():
			var c=image.get_pixel(x,y)
			if max(c.r,max(c.g,c.b))>.015:count+=1
	return count
func run():
	var factory=load("res://canopy_assets.gd").new()
	for grove in [false,true]:
		for species in 6:
			for variant in 4:
				var mesh=factory.build(species,variant,grove)
				assert(mesh.get_surface_count()==2)
				for surface in 2:
					var arrays=mesh.surface_get_arrays(surface)
					for p in arrays[Mesh.ARRAY_VERTEX]:assert(p.is_finite())
					for index in arrays[Mesh.ARRAY_INDEX]:assert(index>=0 and index<arrays[Mesh.ARRAY_VERTEX].size())
	var viewport=SubViewport.new();viewport.size=Vector2i(160,160)
	viewport.own_world_3d=true;viewport.render_target_update_mode=SubViewport.UPDATE_ALWAYS
	root.add_child(viewport)
	var environment=WorldEnvironment.new();environment.environment=Environment.new()
	environment.environment.background_mode=Environment.BG_COLOR
	environment.environment.background_color=Color.BLACK
	environment.environment.ambient_light_source=Environment.AMBIENT_SOURCE_COLOR
	environment.environment.ambient_light_color=Color.WHITE;environment.environment.ambient_light_energy=1.0
	viewport.add_child(environment)
	var camera=Camera3D.new();camera.projection=Camera3D.PROJECTION_ORTHOGONAL;camera.size=.15
	viewport.add_child(camera);camera.position=Vector3(0,.1,.16);camera.look_at(Vector3(0,.015,0));camera.current=true
	var mm=MultiMesh.new();mm.transform_format=MultiMesh.TRANSFORM_3D;mm.use_custom_data=true
	mm.mesh=factory.build(0,0,true);mm.instance_count=1;mm.set_instance_transform(0,Transform3D.IDENTITY)
	var node=MultiMeshInstance3D.new();node.multimesh=mm;viewport.add_child(node)
	var materials=[mm.mesh.surface_get_material(0),mm.mesh.surface_get_material(1)]
	mm.set_instance_custom_data(0,Color(1,0,0,0))
	for material in materials:material.set_shader_parameter("camera_distance",8.0)
	var hidden_proxy=await visible_pixels(viewport)
	for material in materials:material.set_shader_parameter("camera_distance",35.0)
	var visible_proxy=await visible_pixels(viewport)
	assert(hidden_proxy==0 and visible_proxy>100,"Coarse canopy GPU transition failed")
	mm.mesh=factory.build(0,0);mm.set_instance_custom_data(0,Color(0,1,0,0))
	for material in materials:material.set_shader_parameter("camera_distance",8.0)
	var visible_local=await visible_pixels(viewport)
	for material in materials:material.set_shader_parameter("camera_distance",35.0)
	var hidden_local=await visible_pixels(viewport)
	assert(visible_local>20 and hidden_local==0,"Local canopy GPU transition failed")
	# Moving a stand's tangent shear must not move its sampled root transform.
	mm.set_instance_custom_data(0,Color(0,1,.2,-.3))
	assert(mm.get_instance_transform(0)==Transform3D.IDENTITY)
	print("ART_GPU_VALIDATION_OK variants=48 proxy_pixels=",visible_proxy," local_pixels=",visible_local," hidden=",hidden_proxy+hidden_local)
	quit()
