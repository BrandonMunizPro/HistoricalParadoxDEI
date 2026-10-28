extends SceneTree
## Identical cameras before/after; independent of production preset changes.
func _initialize():
	call_deferred("run")

func run():
	var world=load("res://world.tscn").instantiate()
	root.add_child(world)
	var args=OS.get_cmdline_user_args()
	if args.has("--no-terrain-shadows"):world.terrain_shadow_enabled=false
	if args.has("--no-overlap"):
		world.base_material.set_shader_parameter("coverage_overlap_km",0.0)
		world.regional_node.material_override.set_shader_parameter("coverage_overlap_km",0.0)
		for entry in world.resident.values():entry.node.material_override.set_shader_parameter("coverage_overlap_km",0.0)
	if args.has("--reference-shaders"):
		var terrain=Shader.new();terrain.code=FileAccess.get_file_as_string("res://evidence/repair-20261026/reference/terrain.gdshader")
		var water=Shader.new();water.code=FileAccess.get_file_as_string("res://evidence/repair-20261026/reference/water.gdshader")
		world.base_material=reference_material(world.base_material,terrain)
		for entry in world.resident.values():entry.node.material_override=reference_material(entry.node.material_override,terrain)
		world.regional_node.material_override=reference_material(world.regional_node.material_override,terrain)
		world.water_material.shader=water
		world.sun.light_specular=.22
		world.visual_settings.camera.distant_material_weight=0.0
		world.visual_settings.camera.detail_far_km=1800.0
	if args.has("--production"):
		# --view has already gone through the same registry as the UI and run.ps1.
		assert(world.camera_path=="production")
		return
	world.camera_path="capture-profile"
	world.resolved_view=""
	var name="alps"
	var scale_name="strategic"
	var profile_file="data/visual-views.json"
	for arg in args:
		if arg.begins_with("--region="):name=arg.trim_prefix("--region=")
		if arg.begins_with("--scale="):scale_name=arg.trim_prefix("--scale=")
		if arg.begins_with("--profile-file="):profile_file=arg.trim_prefix("--profile-file=")
	var view=world.read_json(profile_file)[name]
	var factor={"overview":3.2,"strategic":1.0,"close":.16,"regional":.35,"inspection":.04}[scale_name]
	world.focus=Vector2(view[0],view[1])
	world.goal_focus=world.focus
	world.distance=view[2]*factor
	world.goal_distance=world.distance
	world.pitch=view[3]
	world.yaw=view[4]
	world.queue_tiles()

func reference_material(current,shader):
	var material=ShaderMaterial.new();material.shader=shader
	for parameter in shader.get_shader_uniform_list():
		material.set_shader_parameter(parameter.name,current.get_shader_parameter(parameter.name))
	return material
