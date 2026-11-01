extends SceneTree
class FlatSource extends RefCounted:
	var center=Vector3.ZERO
	var showcase:
		get:return self
	func ground(_p):return 0.
	func surface(_p):return 0.
func _initialize():call_deferred("run")
func run():
	var scene=Node3D.new();root.add_child(scene)
	var sun=DirectionalLight3D.new();sun.rotation_degrees=Vector3(-45,-30,0);sun.light_energy=1.2;scene.add_child(sun)
	var env=WorldEnvironment.new();env.environment=Environment.new();env.environment.background_mode=Environment.BG_COLOR;env.environment.background_color=Color(.15,.2,.25);env.environment.ambient_light_source=Environment.AMBIENT_SOURCE_COLOR;env.environment.ambient_light_color=Color.WHITE;env.environment.ambient_light_energy=.4;scene.add_child(env)
	var camera=Camera3D.new();camera.near=.001;camera.position=Vector3(.035,.08,.10);scene.add_child(camera);camera.look_at(Vector3(-.015,0,.025))
	var data=JSON.parse_string(FileAccess.get_file_as_string("res://data/settlement-identity-overlay.json"));var asset
	for v in data.visuals:
		if v.visualKey=="farm.2":asset=v
	var source=FlatSource.new();var environment=load("res://settlement_specialization_environment.gd").new();scene.add_child(environment);environment.setup(source,{"anchorM":[0,0],"yawDegrees":0},asset,.1)
	for child in environment.get_children():
		if child is MeshInstance3D:print("PROBE ",child.material_override.shader.resource_path," color=",child.material_override.get_shader_parameter("soil_color")," arrays=",child.mesh.surface_get_arrays(0)[Mesh.ARRAY_TEX_UV].slice(0,3))
	for i in 60:await process_frame;RenderingServer.force_draw(false)
	assert(root.get_texture().get_image().save_png("res://evidence/settlement-identities-20261028/material-probe.png")==OK);quit()
