extends RefCounted
## Bounded central-Italy asset trial. No scattering/coordinates/elevation changes.
const ROOT="res://assets/vegetation-quality/"
var cache={}
var materials=[]
var enabled=true
var kits=["oak","pine","cypress","ash","scrub"]
var textures={}
var impostors=[]
var sprite_cache={}
func _init():
	enabled=not OS.get_cmdline_user_args().has("--vegetation-baseline")
	if not enabled:return
	if FileAccess.file_exists(ROOT+"impostors.json"):impostors=JSON.parse_string(FileAccess.get_file_as_string(ROOT+"impostors.json"))
	for key in ["oak","ash","pine","bark-Color","bark-NormalGL","bark-Roughness"]:
		textures[key]=load(ROOT+key+".res")
	for kit in kits:
		var leaf=ShaderMaterial.new();leaf.shader=load("res://vegetation_quality.gdshader")
		var texture_key="pine" if kit in ["pine","cypress"] else ("ash" if kit=="ash" else "oak")
		leaf.set_shader_parameter("leaf_color",textures[texture_key])
		var bark=ShaderMaterial.new();bark.shader=leaf.shader;bark.set_shader_parameter("woody",true)
		for pair in [["bark_color","bark-Color"],["bark_normal","bark-NormalGL"],["bark_roughness","bark-Roughness"]]:bark.set_shader_parameter(pair[0],textures[pair[1]])
		materials.append([bark,leaf])
func contains(lon,lat):return enabled and lon>=11.5 and lon<13.5 and lat>=40.5 and lat<43.5
func mesh_for(index,coarse=false):
	if not enabled or index>=20:return null
	if impostors.is_empty():return null
	var key=str(index)+("-stand" if coarse else "-sprite")
	if sprite_cache.has(key):return sprite_cache[key]
	var entry=impostors[index];var texture_key=entry.name+"-atlas"
	if not FileAccess.file_exists(ROOT+texture_key+".res"):return null
	if not textures.has(texture_key):
		textures[texture_key]=load(ROOT+texture_key+".res")
	var material=ShaderMaterial.new();material.shader=load("res://vegetation_impostor.gdshader");material.set_shader_parameter("atlas",textures[texture_key]);material.set_shader_parameter("asset_center",Vector3(entry.center[0],entry.center[1],entry.center[2]));material.set_shader_parameter("stand",coarse);material.set_shader_parameter("asset_width",entry.widthKm)
	var vertices=PackedVector3Array();var uvs=PackedVector2Array();var centers=PackedVector2Array();var indices=PackedInt32Array()
	for i in (12 if coarse else 1):
		var angle=i*2.399963+(index%4)*.6;var radius=sqrt((i+.5)/12.)*.044 if coarse else 0.
		var offset=Vector2(cos(angle)*radius,sin(angle)*radius);var width=entry.widthKm*(.55 if coarse else 1.)*.5;var start=vertices.size()
		for p in [Vector2(-width,-width),Vector2(width,-width),Vector2(-width,width),Vector2(width,width)]:vertices.append(Vector3(p.x,p.y,0));centers.append(offset)
		uvs.append_array(PackedVector2Array([Vector2(0,1),Vector2(1,1),Vector2(0,0),Vector2(1,0)]));indices.append_array(PackedInt32Array([start,start+2,start+1,start+1,start+2,start+3]))
	var arrays=[];arrays.resize(Mesh.ARRAY_MAX);arrays[Mesh.ARRAY_VERTEX]=vertices;arrays[Mesh.ARRAY_TEX_UV]=uvs;arrays[Mesh.ARRAY_TEX_UV2]=centers;arrays[Mesh.ARRAY_INDEX]=indices
	var mesh=ArrayMesh.new();mesh.add_surface_from_arrays(Mesh.PRIMITIVE_TRIANGLES,arrays);mesh.surface_set_material(0,material);mesh.custom_aabb=AABB(Vector3(-.12,0,-.12),Vector3(.24,.12,.24))
	sprite_cache[key]=mesh;materials.append([material]);return mesh
func detail_mesh_for(index):
	if not enabled or index>=20:return null
	var key=str(index)
	if cache.has(key):return cache[key]
	var species=index/4;var variant=index%4
	var file=ROOT+kits[species]+"-"+str(variant)+".bin"
	var f=FileAccess.open(file,FileAccess.READ)
	assert(f!=null and f.get_32()==0x31544756)
	var surfaces=f.get_32();var levels=f.get_32();var mesh=ArrayMesh.new()
	for surface in surfaces:
		var arrays=[];arrays.resize(Mesh.ARRAY_MAX);var count=f.get_32()
		arrays[Mesh.ARRAY_VERTEX]=f.get_buffer(count*12).to_vector3_array()
		arrays[Mesh.ARRAY_NORMAL]=f.get_buffer(count*12).to_vector3_array()
		arrays[Mesh.ARRAY_TEX_UV]=f.get_buffer(count*8).to_vector2_array()
		var lods={}
		for level in levels:
			var indices=f.get_buffer(f.get_32()*4).to_int32_array()
			if level==0:arrays[Mesh.ARRAY_INDEX]=indices
			else:lods[[.0008,.003][level-1]]=indices
		mesh.add_surface_from_arrays(Mesh.PRIMITIVE_TRIANGLES,arrays,[],lods)
		mesh.surface_set_material(surface,materials[species][surface])
	cache[key]=mesh
	return mesh
func update(distance,time):
	for pair in materials:
		for material in pair:
			material.set_shader_parameter("camera_distance",distance)
			material.set_shader_parameter("foliage_time",time)
