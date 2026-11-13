extends RefCounted
## Modern sourced physical terrain, separate from all political and settlement data.
var world
var node:MeshInstance3D
var material:ShaderMaterial
var near_mesh:Mesh
var far_mesh:Mesh
var heights:PackedFloat32Array
var height_texture:ImageTexture
var normal_texture:ImageTexture
var manifest
var regional_replacement=false
static func decorate_shader(code:String)->String:
	code=code.replace("float hash(vec2",FileAccess.get_file_as_string("res://alpine_surface.gdshaderinc")+"\nfloat hash(vec2")
	code=code.replace("if(land<.5)discard;","if(alpine_detail_enabled&&camera_distance<3300.){float aw=alpine_scope(coast_geo);if(alpine_overlay_mesh){if(aw<.0005)discard;}else{if(aw>.001)discard;}}else if(alpine_overlay_mesh){discard;}\n if(land<.5)discard;")
	code=code.replace("float africa=na_scope(geo);","if(alpine_detail_enabled){float aw=alpine_scope(geo);lighting_normal=normalize(mix(lighting_normal,alpine_normal(geo),aw*.8));NORMAL=normalize(mat3(VIEW_MATRIX)*lighting_normal);slope=1.-clamp(lighting_normal.y,0.,1.);h=mix(h,texture(alpine_source_metres,alpine_uv(geo)).r*.001,aw);}\n float africa=na_scope(geo);")
	code=code.replace("if(northern_political_blend>0.){","ALBEDO=alpine_surface_color(ALBEDO,geo);\n if(northern_political_blend>0.){")
	code=code.replace("bool in_region=","northern_political_blend*=1.-alpine_snow(geo)*.85;\n bool in_region=")
	return code
func _init(owner):
	world=owner;manifest=world.read_json("data/alpine/manifest.json")
	var bytes=FileAccess.get_file_as_bytes("res://data/alpine/source-metres.bin");heights=bytes.to_float32_array()
	height_texture=ImageTexture.create_from_image(Image.create_from_data(manifest.width,manifest.height,false,Image.FORMAT_RF,bytes))
	var normals=Image.load_from_file("res://data/alpine/normals.png");normals.generate_mipmaps();normal_texture=ImageTexture.create_from_image(normals)
	near_mesh=world.mesh_from_file("data/alpine/near.bin");far_mesh=world.mesh_from_file("data/alpine/far.bin")
	bind(world.base_material)
	for terrain in [world.context_node,world.regional_node]:bind(terrain.material_override)
	for id in world.resident:bind(world.resident[id].node.material_override)
	material=world.base_material.duplicate();material.set_shader_parameter("alpine_overlay_mesh",true);material.set_shader_parameter("clip_region",false);material.set_shader_parameter("child_count",0)
	node=MeshInstance3D.new();node.name="SourcedAlpineTerrain";node.material_override=material;node.cast_shadow=GeometryInstance3D.SHADOW_CASTING_SETTING_OFF;world.add_child(node)
	tick()
func bind(mat):
	mat.set_shader_parameter("alpine_detail_enabled",true);mat.set_shader_parameter("alpine_source_metres",height_texture);mat.set_shader_parameter("alpine_source_normals",normal_texture)
func tick():
	node.visible=not regional_replacement and world.distance<3300.
	node.mesh=near_mesh if world.distance<250. else far_mesh
	material.set_shader_parameter("camera_distance",world.distance)
	material.set_shader_parameter("detail_strength",world.regional_node.material_override.get_shader_parameter("detail_strength"))
func weight(geo:Vector2):
	return smoothstep(0.,.15,min(min(geo.x-6.,16.-geo.x),min(geo.y-44.,48.-geo.y)))
func elevation(geo:Vector2,parent_height):
	if regional_replacement:return parent_height
	var blend=weight(geo)
	if blend<=0.:return parent_height
	var x=clamp((geo.x-6.)*128.,0.,float(manifest.width-1)-.0001);var y=clamp((48.-geo.y)*128.,0.,float(manifest.height-1)-.0001)
	var i=int(x);var j=int(y);var u=x-i;var v=y-j;var w=int(manifest.width)
	var a=heights[j*w+i];var b=heights[j*w+i+1];var c=heights[(j+1)*w+i];var d=heights[(j+1)*w+i+1]
	var h=a+(b-a)*u+(c-a)*v if u+v<1. else d+(c-d)*(1.-u)+(b-d)*(1.-v)
	return lerp(parent_height,max(.001,h*.0015),blend)
