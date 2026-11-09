extends RefCounted
## Reuses campaign materials, bounded tile streaming and source geography.
var world
var region
var manifest
var settings
var heights:PackedFloat32Array
var far_heights:PackedFloat32Array
var land_image:Image
var textures={}
var material:ShaderMaterial
var detail_material:ShaderMaterial
var overview_material:ShaderMaterial
var node:MeshInstance3D
var resident={}
var pending=[]
var selection_key=Vector3(INF,INF,INF)
var selection_cache={}
var oases_image:Image
static func region_settings():
	var cfg=JSON.parse_string(FileAccess.get_file_as_string("res://data/eastern-regions.json"))
	if FileAccess.file_exists("res://data/africa-regions.json"):
		var extension=JSON.parse_string(FileAccess.get_file_as_string("res://data/africa-regions.json"))
		cfg.regions.merge(extension.regions);cfg["extensions"]=extension.order
	if FileAccess.file_exists("res://data/hispania-region.json") and not OS.get_cmdline_user_args().has("--hispania-baseline"):
		var h=preload("res://hispania_regions.gd").settings()
		cfg.regions["hispania"]={"kind":"hispania","bounds":h.bounds}
		cfg["extensions"]=cfg.get("extensions",[])+["hispania"]
	return cfg
static func helpers()->String:
	var code=""
	var settings=region_settings()
	if settings.has("extensions"):code+=preload("res://africa_regions.gd").shader_helpers()
	if settings.regions.has("hispania"):code+=preload("res://hispania_regions.gd").shader_helpers()
	for r in settings.regions:
		code+="uniform bool %s_enabled=false;\nuniform sampler2D %s_land:filter_linear,repeat_disable;\nuniform sampler2D %s_ocean:filter_linear,repeat_disable;\nuniform sampler2D %s_shore:filter_linear,repeat_disable;\n"%[r,r,r,r]
		var bounds=settings.regions[r].bounds
		var b=Vector4(bounds.west,bounds.south,bounds.east-bounds.west,bounds.north-bounds.south)
		code+="vec2 %s_uv(vec2 g){vec2 q=vec2((g.x-(%.1f))/%.1f,(%.1f-g.y)/%.1f);return q;}\n"%[r,b.x,b.z,b.y+b.w,b.w]
		if r=="hispania":continue # Its physical scope is supplied above.
		if settings.regions[r].get("kind","")=="africa":
			code+="float %s_scope(vec2 g){float s=%s_raw_scope(g);if(s<=0.)return 0.;s*=1.-smoothstep(.001,.01,egypt_scope(g));if(s<=0.)return 0.;"%[r,r]
			for earlier in settings.extensions:
				if earlier==r:break
				code+="s*=1.-smoothstep(.001,.01,%s_raw_scope(g));if(s<=0.)return 0.;"%earlier
			code+="return s;}\n";continue
		code+="float %s_scope(vec2 g){vec2 q=%s_uv(g);float s=smoothstep(0.,.25,g.x-%.1f)*(1.-smoothstep(%.1f-.25,%.1f,g.x))*smoothstep(0.,.25,g.y-%.1f)*(1.-smoothstep(%.1f-.25,%.1f,g.y));"%[r,r,b.x,b.x+b.z,b.x+b.z,b.y,b.y+b.w,b.y+b.w]
		if settings.regions[r].has("westFeatherDegrees"):code=code.replace("s=smoothstep(0.,.25,g.x-%.1f)"%b.x,"s=smoothstep(0.,%.4f,g.x-%.1f)"%[settings.regions[r].westFeatherDegrees,b.x])
		if r=="levant":code+="s*=(1.-smoothstep(.001,.01,anatolia_scope(g)))*smoothstep(34.+.6*smoothstep(32.,33.,g.y),34.25+.6*smoothstep(32.,33.,g.y),g.x);"
		else:code+="s*=1.-smoothstep(.001,.01,levant_scope(g));"
		code+="return s;}\n"
	code+="vec2 eastern_texel(vec2 q,ivec2 sz){return (q*(vec2(sz)-1.)+.5)/vec2(sz);}\n"
	return code
static func decorate_shader(code:String)->String:
	code=code.replace("float hash(vec2",helpers()+"\nfloat hash(vec2")
	for r in region_settings().regions:
		code=code.replace("if(land<.5)discard;","if(%s_enabled&&%s_scope(coast_geo)>.001)discard;\n if(land<.5)discard;"%[r,r])
	return code
func _init(owner,region_name):
	world=owner;region=region_name;manifest=world.read_json("data/"+region+"/manifest.json")
	settings=region_settings()
	heights=FileAccess.get_file_as_bytes("res://data/"+region+"/source-metres.bin").to_float32_array()
	far_heights=FileAccess.get_file_as_bytes("res://data/"+region+"/far-heights.bin").to_float32_array()
	for key in ["land","ocean","shore","normals"]:
		var img=Image.load_from_file("res://data/"+region+"/"+key+".png")
		if key=="normals":img.generate_mipmaps()
		else:img.convert(Image.FORMAT_L8)
		if key=="land":land_image=img
		textures[key]=ImageTexture.create_from_image(img)
	material=world.base_material.duplicate()
	var code=material.shader.code
	var scope_expression=region+"_scope(geo)"
	var africa=settings.regions[region].get("kind","") in ["africa","hispania"]
	if africa and region!="hispania":scope_expression="africa_raw_union(geo)"
	if region=="egypt" and FileAccess.file_exists("res://data/africa_cyrenaica/manifest.json") and not OS.get_cmdline_user_args().has("--africa-baseline"):scope_expression="max(egypt_scope(geo),africa_raw_union(geo))"
	code=code.replace("float northern_weight=reference_rollout_scope(geo);","float northern_weight=max(reference_rollout_scope(geo),%s);"%scope_expression)
	if africa:
		oases_image=Image.load_from_file("res://data/"+region+"/oases.png");oases_image.convert(Image.FORMAT_R8)
		code=code.replace("ALBEDO=mix(macro*.57,mix(regional,macro*.57,.55*northern_weight),region_weight);","ALBEDO=regional;")
		code=code.replace("uniform float detail_strength=1.0;","uniform float detail_strength=1.0;\nuniform sampler2D africa_oases:filter_linear,repeat_disable;")
		var rules=preload("res://hispania_regions.gd").settings() if region=="hispania" else preload("res://africa_regions.gd").settings()
		code=code.replace("vec3 eco=global_eco.rgb;","global_eco.g*=1.-smoothstep(%.6f,%.6f,global_eco.b);float oasis=texture(africa_oases,eastern_texel(%s_uv(geo),textureSize(africa_oases,0))).r;global_eco.g=mix(global_eco.g,.78,oasis);global_eco.b=mix(global_eco.b,.30,oasis);global_eco.a=max(global_eco.a,oasis*.35);\n vec3 eco=global_eco.rgb;"%[rules.dryFertilityRules[0],rules.dryFertilityRules[1],region])
		code=code.replace("float volcanic=0.0;","snow*=smoothstep(%.6f,%.6f,geo.y);\n float volcanic=0.0;"%[rules.snowLatitudeRules[0],rules.snowLatitudeRules[1]])
		code=code.replace("float foundation_detail=","ALBEDO=mix(ALBEDO,ALBEDO*vec3(.40,.36,.34),africa_basalt(geo,h));\n float foundation_detail=")
	if region=="hispania":code=code.replace("vec3 eco=global_eco.rgb;","global_eco=hispania_climate(global_eco,geo);vec3 eco=global_eco.rgb;")
	if region=="egypt":
		code=code.replace("ALBEDO=mix(macro*.57,mix(regional,macro*.57,.55*northern_weight),region_weight);","ALBEDO=regional;")
		code=code.replace("uniform float detail_strength=1.0;","uniform float detail_strength=1.0;\nuniform sampler2D eastern_alluvium:filter_linear,repeat_disable;")
		code=code.replace("vec3 eco=global_eco.rgb;","float floodplain=texture(eastern_alluvium,eastern_texel(egypt_uv(geo),textureSize(eastern_alluvium,0))).r;\n global_eco.g=mix(.08,.78,floodplain);global_eco.b=mix(.92,.28,floodplain);global_eco.a=max(global_eco.a*floodplain,floodplain*.45);\n vec3 eco=global_eco.rgb;")
	# Regional copies replace the parent's clip test, retaining all biome/political code.
	for r in settings.regions:code=code.replace("if(%s_enabled&&%s_scope(coast_geo)>.001)discard;"%[r,r],"")
	code=code.replace("uniform float detail_strength=1.0;","uniform float detail_strength=1.0;\nuniform bool eastern_near=false;\ninstance uniform float eastern_reveal=1.;\nuniform vec4 eastern_bounds[24];\nuniform int eastern_count=0;\nuniform sampler2D eastern_normals:filter_linear_mipmap,repeat_disable;")
	code=code.replace("float blend=clamp(edge,0.0,1.0)*reveal;","float blend=eastern_near?(1.-smoothstep(230.,320.,camera_distance))*eastern_reveal:1.;")
	code=code.replace("if(land<.5)discard;","if(%s_scope(coast_geo)<.001)discard;\n land=coast_coverage(%s_land,eastern_texel(%s_uv(coast_geo),textureSize(%s_land,0)));\n if(!eastern_near){for(int i=0;i<24;i++){if(i>=eastern_count)break;vec4 b=eastern_bounds[i];if(geo.x>b.x+.002&&geo.x<b.z-.002&&geo.y>b.y+.002&&geo.y<b.w-.002)discard;}}\n if(land<.5)discard;"%[region,region,region,region])
	code=code.replace("if(clip_region&&", "if(false&&")
	code=code.replace("if(UV.x>b.x+cover_inset.x", "if(false&&UV.x>b.x+cover_inset.x")
	code=code.replace("vec3 lighting_normal=normalize(mix(ground_normal,relief_normal,strategic*relief_strength));","vec3 lighting_normal=normalize(texture(eastern_normals,eastern_texel(%s_uv(geo),textureSize(eastern_normals,0))).rgb*2.-1.);\n relief_normal=lighting_normal;"%region)
	if region=="egypt":code=code.replace("vec3 lighting_normal=normalize(texture(eastern_normals,eastern_texel(egypt_uv(geo),textureSize(eastern_normals,0))).rgb*2.-1.);","vec3 lighting_normal=normalize(mix(relief_normal,texture(eastern_normals,eastern_texel(egypt_uv(geo),textureSize(eastern_normals,0))).rgb*2.-1.,egypt_scope(geo)));")
	var shader=Shader.new();shader.code=code;material.shader=shader
	if africa:material.set_shader_parameter("africa_oases",ImageTexture.create_from_image(oases_image))
	if region=="egypt":material.set_shader_parameter("eastern_alluvium",ImageTexture.create_from_image(Image.load_from_file("res://data/egypt/alluvium.png")))
	material.set_shader_parameter("eastern_normals",textures.normals);material.set_shader_parameter("child_count",0)
	material.set_shader_parameter("clip_region",false);material.set_shader_parameter(region+"_enabled",true)
	for key in ["land","ocean","shore"]:material.set_shader_parameter(region+"_"+key,textures[key])
	if africa:
		var overview_helpers=FileAccess.get_file_as_string("res://africa_overview.gdshaderinc").replace("AFRICA_OVERVIEW_UV",region+"_uv")
		if region=="hispania":overview_helpers=overview_helpers.replace("africa_raw_union(geo)","hispania_scope(geo)").replace("float h=position.y/1.5", "c=hispania_climate(c,geo);float h=position.y/1.5")
		code=code.replace("void fragment(){",overview_helpers+"\nvoid fragment(){")
		var fragment=code.find("void fragment(){")
		var overview_code=code.substr(0,fragment)+"void fragment(){vec2 geo=vec2(UV.x*87.-12.,62.-UV.y*50.),cg=coast_geographic(world_pos.xz);if(%s_scope(cg)<.001)discard;float land=coast_coverage(%s_land,eastern_texel(%s_uv(cg),textureSize(%s_land,0)));if(land<.5)discard;vec3 n=normalize(texture(eastern_normals,eastern_texel(%s_uv(geo),textureSize(eastern_normals,0))).rgb*2.-1.);vec3 c,nn;africa_overview_surface(geo,cg,world_pos,n,land,c,nn);ALBEDO=c;NORMAL=normalize(mat3(VIEW_MATRIX)*nn);ROUGHNESS=.95;SPECULAR=.12;}"%[region,region,region,region,region]
		# Crossfade the same surface response before selecting its cheaper far path.
		var end=code.rfind("}")
		code=code.substr(0,end)+"if(camera_distance>700.){vec2 ag=vec2(UV.x*87.-12.,62.-UV.y*50.),cg=coast_geographic(world_pos.xz);vec3 n=normalize(texture(eastern_normals,eastern_texel(%s_uv(ag),textureSize(eastern_normals,0))).rgb*2.-1.);float land=coast_coverage(%s_land,eastern_texel(%s_uv(cg),textureSize(%s_land,0)));vec3 c,nn;africa_overview_surface(ag,cg,world_pos,n,land,c,nn);float blend=smoothstep(700.,1200.,camera_distance);ALBEDO=mix(ALBEDO,c,blend);NORMAL=normalize(mix(NORMAL,mat3(VIEW_MATRIX)*nn,blend));}\n}"%[region,region,region,region]
		var full_shader=Shader.new();full_shader.code=code;material.shader=full_shader
		var rules=preload("res://hispania_regions.gd").settings() if region=="hispania" else preload("res://africa_regions.gd").settings()
		material.set_shader_parameter("africa_dry_rules",Vector2(rules.dryFertilityRules[0],rules.dryFertilityRules[1]));material.set_shader_parameter("africa_snow_latitudes",Vector2(rules.snowLatitudeRules[0],rules.snowLatitudeRules[1]))
		overview_material=material.duplicate();var overview_shader=Shader.new();overview_shader.code=overview_code;overview_material.shader=overview_shader
	detail_material=material.duplicate();detail_material.set_shader_parameter("eastern_near",true)
	node=MeshInstance3D.new();node.name=region+"SourceTerrain";node.mesh=world.mesh_from_file("data/"+region+"/far.bin");node.material_override=material;node.cast_shadow=GeometryInstance3D.SHADOW_CASTING_SETTING_OFF;world.add_child(node)
	for mat in [world.base_material,world.context_node.material_override,world.regional_node.material_override]:bind(mat)
	for id in world.resident:bind(world.resident[id].node.material_override)
	# Same source land/ocean masks drive terrain and water; lakes stay ocean exclusions.
	var water_code=world.water_material.shader.code
	if not water_code.contains("float levant_scope"):
		water_code=water_code.replace("uniform sampler2D strategic_land",helpers()+"\nuniform sampler2D strategic_land")
		for r in settings.regions:
			var prefix="if(%s_enabled&&%s_scope(geo)>.001)"%[r,r]
			# Run after the legacy far-water blend, retaining the regional shore and
			# below-sea-level inland exclusions even at the full world overview.
			water_code=water_code.replace("if(land>.5&&source_ground<.5)discard;",prefix+"{land=texture(%s_ocean,eastern_texel(%s_uv(geo),textureSize(%s_ocean,0))).r;ground=coast_coverage(%s_land,eastern_texel(%s_uv(geo),textureSize(%s_land,0)));source_ground=land;if(land>.5)discard;}\n if(land>.5&&source_ground<.5)discard;"%[r,r,r,r,r,r])
			water_code=water_code.replace("float envelope=",prefix+"{land=textureLod(%s_land,eastern_texel(%s_uv(geo),textureSize(%s_land,0)),0.).r;shore=textureLod(%s_shore,eastern_texel(%s_uv(geo),textureSize(%s_shore,0)),0.).r*63.75;}\n float envelope="%[r,r,r,r,r,r])
			water_code=water_code.replace("if(camera_distance>2800.0)land=",prefix+"land=texture(%s_ocean,eastern_texel(%s_uv(geo),textureSize(%s_ocean,0))).r;\n if(camera_distance>2800.0)land="%[r,r,r])
			water_code=water_code.replace("if(camera_distance>2800.0){",prefix+"{ground=coast_coverage(%s_land,eastern_texel(%s_uv(geo),textureSize(%s_land,0)));source_ground=texture(%s_ocean,eastern_texel(%s_uv(geo),textureSize(%s_ocean,0))).r;}\n if(camera_distance>2800.0){"%[r,r,r,r,r,r])
		var shader_water=Shader.new();shader_water.code=water_code
		for mat in [world.water_material] if world.ocean_renderer==null else world.ocean_renderer.materials:mat.shader=shader_water
	for mat in [world.water_material] if world.ocean_renderer==null else world.ocean_renderer.materials:
		mat.set_shader_parameter(region+"_enabled",true)
		for key in ["land","ocean","shore"]:mat.set_shader_parameter(region+"_"+key,textures[key])
	if region=="africa_nubia" and FileAccess.file_exists("res://data/africa_nubia/historical-water.json"):
		var water_history=world.read_json("data/africa_nubia/historical-water.json");var b=water_history.bounds
		var inland=world.inland_water_material;var inland_code=inland.shader.code
		inland_code=inland_code.replace('#include "res://political_map.gdshaderinc"','#include "res://political_map.gdshaderinc"\n#include "res://shoreline.gdshaderinc"\nuniform sampler2D africa_reservoir_mask:filter_nearest,repeat_disable;\nuniform vec4 africa_reservoir_rect;')
		inland_code=inland_code.replace("void fragment(){","void fragment(){vec2 ag=coast_geographic(world_pos.xz);vec2 aq=vec2((ag.x-africa_reservoir_rect.x)/africa_reservoir_rect.z,(africa_reservoir_rect.y+africa_reservoir_rect.w-ag.y)/africa_reservoir_rect.w);if(all(greaterThanEqual(aq,vec2(0.)))&&all(lessThanEqual(aq,vec2(1.)))){vec2 sz=vec2(textureSize(africa_reservoir_mask,0));if(texture(africa_reservoir_mask,(aq*(sz-1.)+.5)/sz).r>.5)discard;}")
		var inland_shader=Shader.new();inland_shader.code=inland_code;inland.shader=inland_shader
		inland.set_shader_parameter("africa_reservoir_mask",ImageTexture.create_from_image(Image.load_from_file("res://data/africa_nubia/reservoir-mask.png")))
		inland.set_shader_parameter("africa_reservoir_rect",Vector4(b.west,b.south,b.east-b.west,b.north-b.south))
	if region=="hispania" and FileAccess.file_exists("res://data/hispania/historical-water.json"):
		var inland=world.inland_water_material;var hispania_water_code=inland.shader.code
		if not hispania_water_code.contains('#include "res://shoreline.gdshaderinc"'):hispania_water_code=hispania_water_code.replace('#include "res://political_map.gdshaderinc"','#include "res://political_map.gdshaderinc"\n#include "res://shoreline.gdshaderinc"')
		hispania_water_code=hispania_water_code.replace("void fragment(){","uniform sampler2D hispania_reservoir_mask:filter_nearest,repeat_disable;\nvoid fragment(){vec2 hg=coast_geographic(world_pos.xz);vec2 hq=hispania_water_uv(hg);if(all(greaterThanEqual(hq,vec2(0.)))&&all(lessThanEqual(hq,vec2(1.)))){vec2 hs=vec2(textureSize(hispania_reservoir_mask,0));if(texture(hispania_reservoir_mask,(hq*(hs-1.)+.5)/hs).r>.5)discard;}")
		var b=manifest.bounds
		var helper="vec2 hispania_water_uv(vec2 g){return vec2((g.x-(%.6f))/%.6f,(%.6f-g.y)/%.6f);}\n"%[b.west,b.east-b.west,b.north,b.north-b.south]
		hispania_water_code=hispania_water_code.replace("void fragment(){",helper+"void fragment(){")
		var water_shader=Shader.new();water_shader.code=hispania_water_code;inland.shader=water_shader
		inland.set_shader_parameter("hispania_reservoir_mask",ImageTexture.create_from_image(Image.load_from_file("res://data/hispania/reservoir-mask.png")))
	tick()
	# The host already supports a dynamic regional-surface list. Register the
	# data-defined African sections here without modifying WS2's world scripts.
	if region=="egypt" and settings.has("extensions") and not OS.get_cmdline_user_args().has("--africa-baseline"):
		var source_signature=[world.scenery.cache_signature,FileAccess.get_sha256("res://data/africa-regions.json"),FileAccess.get_sha256("res://africa_regions.gd")]
		for extension in settings.extensions:
			if not FileAccess.file_exists("res://data/"+extension+"/manifest.json"):break
			world.eastern_surfaces.append(load("res://eastern_surface.gd").new(world,extension))
			for file in ["source-metres.bin","land.png","oases.png"]:source_signature.append(FileAccess.get_sha256("res://data/"+extension+"/"+file))
		if settings.regions.has("hispania"):
			for file in ["data/hispania-region.json","hispania_regions.gd"]:source_signature.append(FileAccess.get_sha256("res://"+file))
		# Supply geographic input identity to the existing cache before generation
		# begins. No cache scheduling or visibility policy is changed here.
		world.scenery.cache_signature="|".join(source_signature).sha256_text().substr(0,20)
func bind(mat):mat.set_shader_parameter(region+"_enabled",true)
func climate_override(c,geo):
	if oases_image==null:return c
	var w=weight(geo)
	if w<=.001:return c
	var rules=preload("res://hispania_regions.gd").settings() if region=="hispania" else preload("res://africa_regions.gd").settings();var b=manifest.bounds
	var oasis=preload("res://environment_rules.gd").sample_image(oases_image,Vector2((geo.x-b.west)/(b.east-b.west),(b.north-geo.y)/(b.north-b.south))).r
	var g=c.g*(1.-smoothstep(rules.dryFertilityRules[0],rules.dryFertilityRules[1],c.b))
	var result=Color(c.r,lerp(g,.78,oasis),lerp(c.b,.30,oasis),max(c.a,oasis*.35))
	if region=="hispania":result=preload("res://hispania_regions.gd").climate(result,geo)
	return c.lerp(result,w)
func weight(geo):
	if region=="hispania":return preload("res://hispania_regions.gd").weight(geo)
	var b=manifest.bounds
	if settings.regions[region].get("kind","")=="africa":
		var rules=preload("res://africa_regions.gd");var w=rules.raw_weight(region,geo)
		if w<=.001:return 0.
		w*=1.-smoothstep(.001,.01,rules.egypt_weight(geo))
		for earlier in settings.extensions:
			if earlier==region:break
			w*=1.-smoothstep(.001,.01,rules.raw_weight(earlier,geo))
		return w
	var w=smoothstep(b.west,b.west+.25,geo.x)*(1.-smoothstep(b.east-.25,b.east,geo.x))*smoothstep(b.south,b.south+.25,geo.y)*(1.-smoothstep(b.north-.25,b.north,geo.y))
	if region=="levant":w*=(1.-smoothstep(.001,.01,world.cartographic_rollout.anatolia_weight(geo)))*smoothstep(34.+.6*smoothstep(32.,33.,geo.y),34.25+.6*smoothstep(32.,33.,geo.y),geo.x)
	else:
		w=smoothstep(b.west,b.west+settings.regions[region].westFeatherDegrees,geo.x)*(1.-smoothstep(b.east-.25,b.east,geo.x))*smoothstep(b.south,b.south+.25,geo.y)*(1.-smoothstep(b.north-.25,b.north,geo.y))
		for surface in world.eastern_surfaces:
			if surface.region=="levant":w*=1.-smoothstep(.001,.01,surface.weight(geo));break
	return w
func land_at(geo):
	var b=manifest.bounds;var x=clampi(roundi((geo.x-b.west)/(b.east-b.west)*(land_image.get_width()-1)),0,land_image.get_width()-1);var y=clampi(roundi((b.north-geo.y)/(b.north-b.south)*(land_image.get_height()-1)),0,land_image.get_height()-1)
	return land_image.get_pixel(x,y).r>.5
func sample_height(geo,near=false):
	var b=manifest.bounds;var rate=128. if near else 32.;var w=int((b.east-b.west)*rate)+1;var hh=int((b.north-b.south)*rate)+1
	var xx=clamp((geo.x-b.west)*rate,0.,w-1.00001);var yy=clamp((b.north-geo.y)*rate,0.,hh-1.00001);var x=int(xx);var y=int(yy);var u=xx-x;var v=yy-y
	var grid=heights if near else far_heights;var a=grid[y*w+x];var bb=grid[y*w+x+1];var c=grid[(y+1)*w+x];var d=grid[(y+1)*w+x+1]
	return (a+(bb-a)*u+(c-a)*v if u+v<1. else d+(c-d)*(1.-u)+(bb-d)*(1.-v))*(.0015 if near else 1.)
func elevation(geo,original,placement=false):
	var w=weight(geo)
	if w<=.001:return original
	var base=sample_height(geo);var reveal=0.
	for id in resident:
		var b=resident[id].descriptor.bounds
		if geo.x>=b.west and geo.x<=b.east and geo.y>=b.south and geo.y<=b.north:reveal=resident[id].reveal;break
	var edge=smoothstep(0.,.08,min(min(fposmod(geo.x,1.),1.-fposmod(geo.x,1.)),min(fposmod(geo.y,1.),1.-fposmod(geo.y,1.))))
	return lerp(base,sample_height(geo,true),edge*w*(1. if placement else (1.-smoothstep(230.,320.,world.distance))*reveal))
func wanted_tiles():
	var key=Vector3(world.focus.x,world.focus.y,world.distance)
	if key==selection_key:return selection_cache
	selection_key=key
	var wanted={}
	if world.distance<380. and weight(world.focus)>.001:
		var centre=world.project(world.focus.x,world.focus.y);var candidates=[]
		for d in manifest.details:
			var b=d.bounds;var p=world.project((b.west+b.east)*.5,(b.south+b.north)*.5);var distance=Vector2(p.x-centre.x,p.z-centre.z).length()
			if distance<world.distance*1.15+100.:candidates.append({"d":d,"distance":distance})
		candidates.sort_custom(func(a,b):return a.distance<b.distance)
		for c in candidates.slice(0,24):wanted[c.d.id]=c.d
	selection_cache=wanted
	return wanted
func tick():
	# Only the continuous backdrop persists at distant zoom; near tiles still
	# release above the existing 380 km prefetch threshold.
	node.visible=true
	for mat in [material,detail_material]:mat.set_shader_parameter("camera_distance",world.distance)
	if overview_material!=null:
		overview_material.set_shader_parameter("camera_distance",world.distance)
		node.material_override=overview_material if world.distance>=1200. else material
	var wanted=wanted_tiles()
	for id in resident.keys():
		if not wanted.has(id):resident[id].node.queue_free();resident.erase(id)
	pending=[]
	for id in wanted:
		if not resident.has(id):pending.append(wanted[id])
	if not pending.is_empty():
		var d=pending.pop_front();var detail=MeshInstance3D.new();detail.mesh=world.mesh_from_file(d.mesh);detail.material_override=detail_material;detail.cast_shadow=GeometryInstance3D.SHADOW_CASTING_SETTING_OFF;world.add_child(detail);resident[d.id]={"node":detail,"descriptor":d,"born":Time.get_ticks_msec(),"reveal":0.}
	var rects=PackedVector4Array()
	for id in resident:
		resident[id].reveal=clamp(float(Time.get_ticks_msec()-resident[id].born)/450.,0.,1.);resident[id].node.set_instance_shader_parameter("eastern_reveal",resident[id].reveal)
		var b=resident[id].descriptor.bounds;rects.append(Vector4(b.west,b.south,b.east,b.north))
	material.set_shader_parameter("eastern_count",rects.size())
	while rects.size()<24:rects.append(Vector4.ZERO)
	material.set_shader_parameter("eastern_bounds",rects)
func is_ready():
	if not pending.is_empty():return false
	for entry in resident.values():
		if entry.reveal<1.:return false
	return true
