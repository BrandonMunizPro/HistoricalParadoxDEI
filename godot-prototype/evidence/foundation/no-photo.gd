extends "res://tools/visual-capture.gd"
func run():
	super.run()
	var world=root.get_child(0)
	var materials=[world.base_material,world.regional_node.material_override,world.context_node.material_override]
	for id in world.resident:materials.append(world.resident[id].node.material_override)
	for material in materials:
		if material==null:continue
		material.set_shader_parameter("foundation_detail_near_km",-1.0)
		material.set_shader_parameter("foundation_detail_far_km",0.0)
	DirAccess.make_dir_recursive_absolute(ProjectSettings.globalize_path(world.capture_dir))
	var file=FileAccess.open(world.capture_dir+"/configuration.json",FileAccess.WRITE)
	file.store_string(JSON.stringify({"diagnosticOnly":true,"photoSamplingDisabled":true,"nearKm":-1,"farKm":0,"evidence":world.evidence_metadata()},"  "))
