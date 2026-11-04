extends SceneTree
## Resource inspection only; this scene is never used by the campaign renderer.
func _initialize():call_deferred("run")
func run():
	Engine.max_fps=30
	var scene=Node3D.new();root.add_child(scene)
	var env=WorldEnvironment.new();var settings=Environment.new()
	settings.background_mode=Environment.BG_COLOR;settings.background_color=Color("263039")
	settings.ambient_light_source=Environment.AMBIENT_SOURCE_COLOR;settings.ambient_light_color=Color("c9d2df");settings.ambient_light_energy=.65
	env.environment=settings;scene.add_child(env)
	var sun=DirectionalLight3D.new();sun.rotation_degrees=Vector3(-48,-35,0);sun.light_energy=1.2;sun.shadow_enabled=true;sun.directional_shadow_max_distance=.25;scene.add_child(sun)
	var floor_node=MeshInstance3D.new();var plane=PlaneMesh.new();plane.size=Vector2(.125,.065);floor_node.mesh=plane;floor_node.position=Vector3(.035,-.0012,0)
	var mat=StandardMaterial3D.new();mat.albedo_color=Color("79765c");mat.roughness=1.;floor_node.material_override=mat;scene.add_child(floor_node)
	for i in 3:
		var instance=MeshInstance3D.new();instance.mesh=load("res://assets/neapolis-free/house-%d.res"%i);instance.position.x=i*.035;scene.add_child(instance)
	var camera=Camera3D.new();camera.near=.0001;camera.far=1.;camera.projection=Camera3D.PROJECTION_ORTHOGONAL;camera.size=.11;scene.add_child(camera)
	camera.position=Vector3(.07,.043,.065);camera.look_at(Vector3(.035,0,0))
	for i in 60:await process_frame
	RenderingServer.force_draw();root.get_texture().get_image().save_png("res://evidence/neapolis-free/assemblies.png")
	print("NEAPOLIS_ASSEMBLY_INSPECTION_OK")
	quit()
