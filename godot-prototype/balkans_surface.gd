extends RefCounted
## Scoped physical detail and shared land/water masks for the regular campaign.
var world
var node:MeshInstance3D
var material:ShaderMaterial
var near_nodes=[]
var far_mesh:Mesh
var heights:PackedFloat32Array
var textures={}
var manifest
static func decorate_shader(code:String)->String:
	var edge_code="float balkans_political_edge(vec2 q){float c=reference_controller(q,false,true,true);vec2 dx=dFdx(q)*.85,dy=dFdy(q)*.85;return .25*(step(.5,abs(c-reference_controller(q+dx+dy,false,true,true)))+step(.5,abs(c-reference_controller(q+dx-dy,false,true,true)))+step(.5,abs(c-reference_controller(q-dx+dy,false,true,true)))+step(.5,abs(c-reference_controller(q-dx-dy,false,true,true))));}\n"
	code=code.replace("float hash(vec2",FileAccess.get_file_as_string("res://balkans_surface.gdshaderinc")+"\n"+edge_code+"float hash(vec2")
	code=code.replace("if(camera_distance>2800.0)land=", "if(balkans_detail_enabled&&reference_balkans_scope(coast_geo)>.001)land=balkans_coverage(coast_geo);\n if(camera_distance>2800.0)land=")
	code=code.replace("if(land<.5)discard;", "if(balkans_detail_enabled&&camera_distance<3300.){float bw=reference_balkans_scope(coast_geo);if(balkans_overlay_mesh){if(bw<.0005)discard;}else{if(bw>.001)discard;}}else if(balkans_overlay_mesh){discard;}\n if(land<.5)discard;")
	code=code.replace("float africa=na_scope(geo);", "if(balkans_detail_enabled){float bw=reference_balkans_scope(geo);vec2 bq=balkans_texel(balkans_uv(geo),textureSize(balkans_source_normals,0));vec3 bn=normalize(texture(balkans_source_normals,bq).rgb*2.-1.);lighting_normal=normalize(mix(lighting_normal,bn,bw*.85));NORMAL=normalize(mat3(VIEW_MATRIX)*lighting_normal);slope=1.-clamp(lighting_normal.y,0.,1.);}\n float africa=na_scope(geo);")
	# Border contrast is independent of political fill opacity within this wave.
	code=code.replace("strength=.62;", "strength=eastern?0.:.62;")
	code=code.replace("boundary=reference_antialiased_edge(q,local,sicily,eastern);", "boundary=eastern?0.:reference_antialiased_edge(q,local,sicily,eastern);")
	code=code.replace("else{NORMAL_MAP_DEPTH*=1.-northern_political_blend;}", "else{NORMAL_MAP_DEPTH*=1.-northern_political_blend;}\n if(balkans_detail_enabled&&political_boundaries_enabled&&reference_balkans_scope(coast_geo)>.5){float edge=balkans_political_edge(balkans_uv(coast_geo));ALBEDO=mix(ALBEDO,vec3(.065,.085,.075),edge*.55*political_blend);}")
	return code
func _init(owner):
	world=owner;manifest=world.read_json("data/balkans/manifest.json")
	var bytes=FileAccess.get_file_as_bytes("res://data/balkans/source-metres.bin");heights=bytes.to_float32_array()
	textures.balkans_source_metres=ImageTexture.create_from_image(Image.create_from_data(manifest.width,manifest.height,false,Image.FORMAT_RF,bytes))
	for pair in [["balkans_source_normals","normals"],["balkans_land","land"],["balkans_ocean","ocean"],["balkans_shore","shore"],["reference_balkans_ids","territory-ids"]]:
		var image=Image.load_from_file("res://data/balkans/"+pair[1]+".png")
		if pair[1]=="territory-ids":image.convert(Image.FORMAT_RG8)
		elif pair[1]!="normals":image.convert(Image.FORMAT_L8)
		else:image.generate_mipmaps()
		textures[pair[0]]=ImageTexture.create_from_image(image)
	far_mesh=world.mesh_from_file("data/balkans/far.bin")
	bind(world.base_material)
	for terrain in [world.context_node,world.regional_node]:bind(terrain.material_override)
	for id in world.resident:bind(world.resident[id].node.material_override)
	# Match the terrain mask in the existing water shader; preserve its lighting/waves.
	var water_shader=Shader.new();var code=world.water_material.shader.code
	var helpers=world.cartographic_rollout.shader_scope("reference_balkans_scope",true)+FileAccess.get_file_as_string("res://balkans_surface.gdshaderinc")
	code=code.replace("uniform sampler2D strategic_land",helpers+"\nuniform sampler2D strategic_land")
	code=code.replace("float envelope=", "if(balkans_detail_enabled&&reference_balkans_scope(geo)>.001){land=textureLod(balkans_land,balkans_texel(balkans_uv(geo),textureSize(balkans_land,0)),0.).r;shore=textureLod(balkans_shore,balkans_texel(balkans_uv(geo),textureSize(balkans_shore,0)),0.).r*63.75;}\n  float envelope=")
	code=code.replace("if(camera_distance>2800.0)land=", "if(balkans_detail_enabled&&reference_balkans_scope(geo)>.001)land=texture(balkans_ocean,balkans_texel(balkans_uv(geo),textureSize(balkans_ocean,0))).r;\n if(camera_distance>2800.0)land=")
	code=code.replace("if(camera_distance>2800.0){", "if(balkans_detail_enabled&&reference_balkans_scope(geo)>.001){ground=balkans_coverage(geo);source_ground=texture(balkans_land,balkans_texel(balkans_uv(geo),textureSize(balkans_land,0))).r;}\n if(camera_distance>2800.0){")
	code=code.replace("float shallow=exp", "if(balkans_detail_enabled&&reference_balkans_scope(geo)>.001)d=texture(balkans_shore,balkans_texel(balkans_uv(geo),textureSize(balkans_shore,0))).r*63.75;\n float shallow=exp")
	water_shader.code=code
	var ocean_materials=[world.water_material] if world.ocean_renderer==null else world.ocean_renderer.materials
	for ocean_material in ocean_materials:
		ocean_material.shader=water_shader;bind(ocean_material)
	material=world.base_material.duplicate();material.set_shader_parameter("balkans_overlay_mesh",true);material.set_shader_parameter("clip_region",false);material.set_shader_parameter("child_count",0)
	node=MeshInstance3D.new();node.name="SourcedIllyriaGreeceTerrain";node.mesh=far_mesh;node.material_override=material;node.cast_shadow=GeometryInstance3D.SHADOW_CASTING_SETTING_OFF;world.add_child(node)
	for part in ["north","south"]:
		var detail=MeshInstance3D.new();detail.name="IllyriaGreeceDetail_"+part;detail.mesh=world.mesh_from_file("data/balkans/near-"+part+".bin");detail.material_override=material;detail.cast_shadow=GeometryInstance3D.SHADOW_CASTING_SETTING_OFF;world.add_child(detail);near_nodes.append(detail)
	tick()
func bind(mat):
	mat.set_shader_parameter("balkans_detail_enabled",true)
	for key in textures:mat.set_shader_parameter(key,textures[key])
func tick():
	node.visible=world.distance>=250. and world.distance<3300.
	for detail in near_nodes:detail.visible=world.distance<250.
	material.set_shader_parameter("camera_distance",world.distance)
	material.set_shader_parameter("detail_strength",world.regional_node.material_override.get_shader_parameter("detail_strength"))
func weight(geo:Vector2):
	var result=0.
	for r in world.cartographic_rollout.settings.extensionRects:
		result=max(result,smoothstep(r[0]-.2,r[0]+.2,geo.x)*(1.-smoothstep(r[2]-.2,r[2]+.2,geo.x))*smoothstep(r[1]-.2,r[1]+.2,geo.y)*(1.-smoothstep(r[3]-.2,r[3]+.2,geo.y)))
	for c in world.cartographic_rollout.settings.extensionCorridors:
		var a=Vector2(c[0]*.75,c[1]);var b=Vector2(c[2]*.75,c[3]);var d=b-a;var p=geo*Vector2(.75,1.);var t=clamp((p-a).dot(d)/d.length_squared(),0.,1.)
		result=max(result,1.-smoothstep(c[4]-.15,c[4]+.15,p.distance_to(a+d*t)))
	return result
func elevation(geo:Vector2,parent_height,force_near=false):
	var blend=weight(geo)
	if blend<=0.:return parent_height
	var step=1. if force_near or world.distance<250. else 4.
	var x=clamp((geo.x-14.)*128./step,0.,float(manifest.width-1)/step-.0001);var y=clamp((46.-geo.y)*128./step,0.,float(manifest.height-1)/step-.0001)
	var i=int(x)*int(step);var j=int(y)*int(step);var u=x-floor(x);var v=y-floor(y);var w=int(manifest.width);var s=int(step)
	var a=heights[j*w+i];var b=heights[j*w+i+s];var c=heights[(j+s)*w+i];var d=heights[(j+s)*w+i+s]
	var h=a+(b-a)*u+(c-a)*v if u+v<1. else d+(c-d)*(1.-u)+(b-d)*(1.-v)
	return lerp(parent_height,max(.001,h*.0015),blend)
