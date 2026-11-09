extends RefCounted
## One regional surface with streamed close tiles. Geographic IDs stay in the existing model.
var world
var manifest
var heights:PackedFloat32Array
var far_heights:PackedFloat32Array
var material:ShaderMaterial
var detail_material:ShaderMaterial
var node:MeshInstance3D
var resident={}
var pending=[]
var textures={}
var id_image:Image
var land_image:Image
static func decorate_shader(code:String)->String:
	code=code.replace("float hash(vec2",FileAccess.get_file_as_string("res://anatolia_scope.gdshaderinc")+"\nfloat hash(vec2")
	code=code.replace("if(land<.5)discard;","if(anatolia_detail_enabled&&camera_distance<3300.&&anatolia_scope(coast_geo)>.001)discard;\n if(land<.5)discard;")
	return code
func _init(owner):
	world=owner;manifest=world.read_json("data/anatolia/manifest.json")
	var bytes=FileAccess.get_file_as_bytes("res://data/anatolia/source-metres.bin");heights=bytes.to_float32_array()
	far_heights=FileAccess.get_file_as_bytes("res://data/anatolia/far-heights.bin").to_float32_array()
	textures.source_metres=ImageTexture.create_from_image(Image.create_from_data(manifest.width,manifest.height,false,Image.FORMAT_RF,bytes))
	for pair in [["source_normals","normals"],["anatolia_land","land"],["anatolia_ocean","ocean"],["anatolia_shore","shore"],["region_ids","territory-ids"]]:
		var img=Image.load_from_file("res://data/anatolia/"+pair[1]+".png")
		if pair[1]=="territory-ids":img.convert(Image.FORMAT_RG8)
		elif pair[1]=="normals":img.generate_mipmaps()
		else:img.convert(Image.FORMAT_L8)
		textures[pair[0]]=ImageTexture.create_from_image(img)
		if pair[1]=="territory-ids":id_image=img
		if pair[1]=="land":land_image=img
	material=ShaderMaterial.new();material.shader=load("res://anatolia_surface.gdshader")
	var relief=Image.load_from_file("res://data/anatolia/relief-visibility.png");relief.generate_mipmaps();material.set_shader_parameter("relief_visibility",ImageTexture.create_from_image(relief))
	material.set_shader_parameter("rock_color",world.base_material.get_shader_parameter("quality_rock"))
	for key in textures:material.set_shader_parameter(key,textures[key])
	material.set_shader_parameter("macro_color",world.base_material.get_shader_parameter("macro_color"));material.set_shader_parameter("ground_color",world.base_material.get_shader_parameter("quality_ground"));material.set_shader_parameter("controller_ids",world.political_map.factions.owner_texture);material.set_shader_parameter("anatolia_detail_enabled",true)
	detail_material=material.duplicate();detail_material.set_shader_parameter("detail_mesh",true)
	node=MeshInstance3D.new();node.name="AnatoliaContinuousTerrain";node.mesh=world.mesh_from_file("data/anatolia/far.bin");node.material_override=material;node.cast_shadow=GeometryInstance3D.SHADOW_CASTING_SETTING_OFF;world.add_child(node)
	bind(world.base_material)
	for t in [world.context_node,world.regional_node]:bind(t.material_override)
	for id in world.resident:bind(world.resident[id].node.material_override)
	var water_shader=Shader.new();var code=world.water_material.shader.code
	var helpers=FileAccess.get_file_as_string("res://anatolia_scope.gdshaderinc")+FileAccess.get_file_as_string("res://anatolia_water.gdshaderinc")
	code=code.replace("uniform sampler2D strategic_land",helpers+"\nuniform sampler2D strategic_land")
	code=code.replace("float envelope=","if(anatolia_detail_enabled&&anatolia_scope(geo)>.001){land=textureLod(anatolia_land,anatolia_texel(anatolia_uv(geo),textureSize(anatolia_land,0)),0.).r;shore=textureLod(anatolia_shore,anatolia_texel(anatolia_uv(geo),textureSize(anatolia_shore,0)),0.).r*63.75;}\n float envelope=")
	code=code.replace("if(camera_distance>2800.0)land=","if(anatolia_detail_enabled&&anatolia_scope(geo)>.001)land=texture(anatolia_ocean,anatolia_texel(anatolia_uv(geo),textureSize(anatolia_ocean,0))).r;\n if(camera_distance>2800.0)land=")
	code=code.replace("if(camera_distance>2800.0){","if(anatolia_detail_enabled&&anatolia_scope(geo)>.001){ground=anatolia_coverage(geo);source_ground=texture(anatolia_land,anatolia_texel(anatolia_uv(geo),textureSize(anatolia_land,0))).r;}\n if(camera_distance>2800.0){")
	code=code.replace("float shallow=exp","if(anatolia_detail_enabled&&anatolia_scope(geo)>.001)d=texture(anatolia_shore,anatolia_texel(anatolia_uv(geo),textureSize(anatolia_shore,0))).r*63.75;\n float shallow=exp")
	water_shader.code=code
	for m in [world.water_material] if world.ocean_renderer==null else world.ocean_renderer.materials:
		m.shader=water_shader;m.set_shader_parameter("anatolia_detail_enabled",true)
		for key in ["anatolia_land","anatolia_ocean","anatolia_shore"]:m.set_shader_parameter(key,textures[key])
	tick()
func bind(mat):mat.set_shader_parameter("anatolia_detail_enabled",true)
func land_at(geo:Vector2)->bool:
	var x=clampi(roundi((geo.x-25.)/18.*(land_image.get_width()-1)),0,land_image.get_width()-1);var y=clampi(roundi((43.-geo.y)/8.*(land_image.get_height()-1)),0,land_image.get_height()-1)
	return land_image.get_pixel(x,y).r>.5
func placement_height(geo:Vector2):
	var blend=world.cartographic_rollout.anatolia_weight(geo);var base=sample_height(geo,4.)
	var edge=smoothstep(0.,.08,min(min(fposmod(geo.x,1.),1.-fposmod(geo.x,1.)),min(fposmod(geo.y,1.),1.-fposmod(geo.y,1.))))
	return lerp(base,sample_height(geo,1.),edge*blend)
func owner_at(geo:Vector2)->String:
	var x=clampi(int((geo.x-25.)/18.*id_image.get_width()),0,id_image.get_width()-1);var y=clampi(int((43.-geo.y)/8.*id_image.get_height()),0,id_image.get_height()-1);var c=id_image.get_pixel(x,y);var id=int(round(c.r*255.))+256*int(round(c.g*255.))
	if id<2 or id-2>=world.political_map.factions.data.territories.size():return ""
	return world.political_map.factions.control.get(world.political_map.factions.data.territories[id-2].id,"")
func tick():
	node.visible=world.distance<3300.
	material.set_shader_parameter("camera_distance",world.distance);detail_material.set_shader_parameter("camera_distance",world.distance)
	var wanted={}
	if world.distance<380. and world.cartographic_rollout.contains_anatolia(world.focus):
		var centre=world.project(world.focus.x,world.focus.y);var candidates=[]
		for d in manifest.details:
			var b=d.bounds;var p=world.project((b.west+b.east)*.5,(b.south+b.north)*.5);var distance=Vector2(p.x-centre.x,p.z-centre.z).length()
			if distance<world.distance*1.15+100.:candidates.append({"d":d,"distance":distance})
		candidates.sort_custom(func(a,b):return a.distance<b.distance)
		for c in candidates.slice(0,24):wanted[c.d.id]=c.d
	for id in resident.keys():
		if not wanted.has(id):resident[id].node.queue_free();resident.erase(id)
	pending=[]
	for id in wanted:
		if not resident.has(id):pending.append(wanted[id])
	if not pending.is_empty():
		var d=pending.pop_front();var detail=MeshInstance3D.new();detail.name="AnatoliaDetail_"+d.id;detail.mesh=world.mesh_from_file(d.mesh);detail.material_override=detail_material;detail.cast_shadow=GeometryInstance3D.SHADOW_CASTING_SETTING_OFF;world.add_child(detail);resident[d.id]={"node":detail,"descriptor":d,"born":Time.get_ticks_msec(),"reveal":0.}
	var rects=PackedVector4Array()
	for id in resident:
		resident[id].reveal=clamp(float(Time.get_ticks_msec()-resident[id].born)/450.,0.,1.);resident[id].node.set_instance_shader_parameter("terrain_reveal",resident[id].reveal)
		var b=resident[id].descriptor.bounds;rects.append(Vector4(b.west,b.south,b.east,b.north))
	material.set_shader_parameter("detail_count",rects.size())
	while rects.size()<32:rects.append(Vector4.ZERO)
	material.set_shader_parameter("detail_bounds",rects)
func is_ready():
	if not pending.is_empty():return false
	for entry in resident.values():
		if entry.reveal<1.:return false
	return true
func elevation(geo:Vector2,parent_height):
	var blend=world.cartographic_rollout.anatolia_weight(geo)
	if blend<.001:return parent_height
	var step=4.;var edge=0.
	for id in resident:
		var b=resident[id].descriptor.bounds
		if geo.x>=b.west and geo.x<=b.east and geo.y>=b.south and geo.y<=b.north:step=1.;edge=smoothstep(0.,.08,min(min(geo.x-b.west,b.east-geo.x),min(geo.y-b.south,b.north-geo.y)))*(1.-smoothstep(230.,320.,world.distance))*resident[id].reveal;break
	var coarse=sample_height(geo,4.)
	return lerp(coarse,sample_height(geo,1.),edge*blend) if step==1. else coarse
func sample_height(geo:Vector2,step):
	if step==4.:
		var xx=clamp((geo.x-25.)*32.,0.,575.9999);var yy=clamp((43.-geo.y)*32.,0.,255.9999);var col=int(xx);var row=int(yy);var uu=xx-col;var vv=yy-row
		var aa=far_heights[row*577+col];var bb=far_heights[row*577+col+1];var cc=far_heights[(row+1)*577+col];var dd=far_heights[(row+1)*577+col+1]
		return aa+(bb-aa)*uu+(cc-aa)*vv if uu+vv<1. else dd+(cc-dd)*(1.-uu)+(bb-dd)*(1.-vv)
	var x=clamp((geo.x-25.)*128./step,0.,float(manifest.width-1)/step-.0001);var y=clamp((43.-geo.y)*128./step,0.,float(manifest.height-1)/step-.0001);var i=int(x)*int(step);var j=int(y)*int(step);var u=x-floor(x);var v=y-floor(y);var w=int(manifest.width);var s=int(step)
	var a=heights[j*w+i];var b=heights[j*w+i+s];var c=heights[(j+s)*w+i];var d=heights[(j+s)*w+i+s]
	return max(.001,(a+(b-a)*u+(c-a)*v if u+v<1. else d+(c-d)*(1.-u)+(b-d)*(1.-v))*.0015)
