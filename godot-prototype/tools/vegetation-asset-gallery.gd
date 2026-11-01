extends SceneTree
func _initialize():call_deferred("run")
func run():
	var output="res://evidence/vegetation-quality-20261030"
	var scene=Node3D.new();root.add_child(scene)
	var env=Environment.new();env.background_mode=Environment.BG_COLOR;env.background_color=Color(.26,.36,.43);env.ambient_light_source=Environment.AMBIENT_SOURCE_COLOR;env.ambient_light_color=Color(.85,.92,1.);env.ambient_light_energy=.65;env.tonemap_mode=Environment.TONE_MAPPER_FILMIC
	var environment=WorldEnvironment.new();environment.environment=env;scene.add_child(environment)
	var sun=DirectionalLight3D.new();sun.rotation_degrees=Vector3(-45,-30,0);sun.light_energy=1.2;sun.shadow_enabled=true;sun.shadow_bias=.003;sun.shadow_normal_bias=.02;sun.directional_shadow_max_distance=.4;scene.add_child(sun)
	var ground=MeshInstance3D.new();var plane=PlaneMesh.new();plane.size=Vector2(.28,.12);ground.mesh=plane
	var material=StandardMaterial3D.new();material.albedo_color=Color(.18,.22,.12);material.roughness=1.;ground.material_override=material;scene.add_child(ground)
	var camera=Camera3D.new();camera.position=Vector3(.045,.047,.145);camera.near=.0001;camera.far=2.;camera.fov=42.;scene.add_child(camera);camera.look_at(Vector3(0,.012,0))
	var quality=load("res://vegetation_quality.gd").new();var factory=load("res://canopy_assets.gd").new();var nodes=[]
	for species in 5:
		var node=MeshInstance3D.new();node.position.x=(species-2)*.042;scene.add_child(node);nodes.append(node)
	for stage in ["before","after"]:
		for i in 5:
			nodes[i].mesh=factory.build(i,0) if stage=="before" else quality.detail_mesh_for(i*4)
			nodes[i].lod_bias=1000.
		for i in 60:await process_frame
		RenderingServer.force_draw(true)
		assert(root.get_texture().get_image().save_png(output+"/asset-gallery-"+stage+".png")==OK)
		print("VEGETATION_GALLERY ",stage)
	scene.queue_free()
	for i in 10:await process_frame
	quit()
