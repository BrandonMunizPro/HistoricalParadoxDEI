extends RefCounted
## Opt-in rendering experiment. Does not write campaign, settlement or geography data.
var world
var textures={}
var rect:Vector4
var banks=PackedVector4Array()
var bank_count=0
var river:ShaderMaterial
func _init(owner):
	world=owner
	var a=world.project(12.27,42.04);var b=world.project(12.86,41.60)
	rect=Vector4(a.x,a.z,b.x,b.z)
	for kind in ["grass","soil","rock"]:
		for channel in ["color","normal","roughness"]:
			var path="assets/landscape-quality/"+kind+"-"+channel+".res"
			textures["landscape_"+kind+"_"+channel]=load("res://"+path)
	var feature=world.hydrology.rivers[629]
	assert(feature.geometry.type=="LineString")
	var line=feature.geometry.coordinates
	for i in range(1,line.size()):
		var p=line[i-1];var q=line[i]
		if max(p[0],q[0])<12.27 or min(p[0],q[0])>12.86 or max(p[1],q[1])<41.60 or min(p[1],q[1])>42.04:continue
		var pa=world.project(p[0],p[1]);var pb=world.project(q[0],q[1])
		if banks.size()<64:banks.append(Vector4(pa.x,pa.z,pb.x,pb.z))
	bank_count=banks.size()
	while banks.size()<64:banks.append(Vector4.ZERO)
	textures["landscape_control"]=load("res://assets/landscape-quality/control.res")
	textures["landscape_meso"]=load("res://assets/landscape-quality/meso.res")
	bind(world.base_material)
	for e in world.resident.values():bind(e.node.material_override)
	bind(world.regional_node.material_override)
	for material in [world.scenery.meshes[0].surface_get_material(0),world.scenery.meshes[0].surface_get_material(1)]:
		material.set_shader_parameter("landscape_enabled",true);material.set_shader_parameter("landscape_rect",rect)
	river=ShaderMaterial.new();river.shader=load("res://landscape_river.gdshader")
	river.set_shader_parameter("ripple_normal",load("res://assets/landscape-quality/ripple.res"))
	world.get_tree().node_added.connect(on_node_added)
	for node in world.find_children("*","MeshInstance3D",true,false):bind_node(node)
	print("LANDSCAPE_QUALITY_READY PBR_sets=3 bank_segments=",bank_count)
func bind(mat):
	if not mat is ShaderMaterial:return
	for key in textures:mat.set_shader_parameter(key,textures[key])
	mat.set_shader_parameter("landscape_enabled",true);mat.set_shader_parameter("landscape_rect",rect)
	mat.set_shader_parameter("landscape_banks",banks);mat.set_shader_parameter("landscape_bank_count",bank_count)
func on_node_added(node):
	if node is MeshInstance3D:bind_node.call_deferred(node)
func bind_node(node):
	if not is_instance_valid(node) or not node is MeshInstance3D:return
	var mat=node.material_override
	if mat is ShaderMaterial and mat.shader!=null and mat.shader.resource_path in ["res://roma_showcase_ground.gdshader","res://roma_showcase_edge.gdshader"]:bind(mat)
func freeze_water(time):river.set_shader_parameter("water_time",time)
