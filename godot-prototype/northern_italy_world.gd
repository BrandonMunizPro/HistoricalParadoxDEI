extends "res://world.gd"
## Regular campaign integration of the reviewed northern Italy corrections.
## Research coordinates and the rest of the campaign geography remain intact.
var cartographic_rollout=preload("res://cartography_rollout.gd").new()
var alpine_surface
var balkans_surface
var anatolia_surface
var anatolia_identities
var eastern_surfaces=[]
var reference_labels
var regional_cpu_ms={}
var reference_faction_ids=["boii","insubres","cenomani","veneti-italy","ligurian-polities","etruscan-polities","rome","samnites","lucanians","bruttians","messapians","daunians","tarentum","rhegion","croton","syracuse"]
func uses_northern_labels():
	return cartographic_rollout.contains(focus) and distance>=30. and distance<=1400. and political_map.enabled and political_map.factions!=null and political_map.factions.enabled and political_map.blend>.01
func read_json(path):
	if path=="data/hydrology.json" and FileAccess.file_exists("res://data/levant/hydrology-supplement.json") and not OS.get_cmdline_user_args().has("--eastern-baseline"):
		var data=super.read_json(path);var extra=super.read_json("data/levant/hydrology-supplement.json")
		data.rivers.append_array(extra.rivers);data.lakes.append_array(extra.lakes);return data
	if path=="data/factions/scenario-278.json":return super.read_json("data/northern-italy-reference/scenario-278.json")
	if path=="data/lakes.json":
		var lakes=super.read_json(path)
		if FileAccess.file_exists("res://data/levant/hydrology-supplement.json") and not OS.get_cmdline_user_args().has("--eastern-baseline"):lakes.append_array(super.read_json("data/levant/hydrology-supplement.json").renderLakes)
		for source in super.read_json("data/northern-italy-reference/lake-rings.json"):
			if source.rings.size()!=1:continue # Preserve island holes in original mesh.
			var ring=source.rings[0];var points=PackedVector2Array();var vertices=[]
			for i in ring.size()-1:
				var p=project(ring[i][0],ring[i][1]);points.append(Vector2(p.x,p.z));vertices.append([p.x,0.,p.z])
			var indices=Geometry2D.triangulate_polygon(points)
			assert(indices.size()>0,"Lake triangulation failed")
			for lake in lakes:
				if lake.id!=source.id:continue
				for v in vertices:v[1]=lake.vertices[0][1]
				lake.vertices=vertices;lake.indices=Array(indices)
		return lakes
	return super.read_json(path)

func _ready():
	super._ready()
	var shader=base_material.shader
	var code=shader.code
	# Geographic scope, independent of camera: preserve other regions' appearance.
	code=code.replace("political_blend","northern_political_blend")
	var scope="float northern_weight=reference_rollout_scope(geo);\n float northern_political_blend=political_blend*mix(1.,%.6f,northern_weight);\n bool in_region="%cartographic_rollout.settings.politicalReplacement
	code=code.replace("bool in_region=",scope)
	var political_code=FileAccess.get_file_as_string("res://political_map.gdshaderinc")
	political_code=cartographic_rollout.shader_scope()+cartographic_rollout.shader_scope("reference_balkans_scope",true)+political_code
	political_code="uniform sampler2D reference_local_ids : filter_nearest,repeat_disable;\nuniform sampler2D reference_sicily_ids : filter_nearest,repeat_disable;\n"+political_code
	political_code=political_code.replace("vec3 political_land_color",FileAccess.get_file_as_string("res://reference_borders.gdshaderinc")+"\nvec3 political_land_color")
	political_code=political_code.replace("vec3 political_land_color", "vec4 reference_owner(vec2 q,bool local,bool sicily){vec2 encoded=sicily?texture(reference_sicily_ids,q).rg:(local?texture(reference_local_ids,q).rg:texture(political_boundary_layer,q).rg);float id=round(encoded.r*255.)+256.*round(encoded.g*255.);return texture(political_palette,vec2((id+.5)/float(textureSize(political_palette,0).x),.5));}\nvec3 political_land_color")
	political_code=political_code.replace("q.y=1.-q.y;", "q.y=1.-q.y;\n bool local=geo.x>=6.&&geo.x<=14.&&geo.y>=43.&&geo.y<=47.;\n bool sicily=!local&&reference_rollout_scope(geo)>.001;\n if(sicily)q=vec2((geo.x-6.)/14.,(49.-geo.y)/14.);\n if(local)q=vec2((geo.x-6.)/8.,(47.-geo.y)/4.);")
	political_code=political_code.replace("vec3 encoded=texture(political_boundary_layer,q).rgb;","vec3 encoded=sicily?texture(reference_sicily_ids,q).rgb:(local?texture(reference_local_ids,q).rgb:texture(political_boundary_layer,q).rgb);")
	for expression in ["q","q+dx","q-dx","q+dy","q-dy","q+hx","q-hx","q+hy","q-hy"]:
		political_code=political_code.replace("political_owner_color("+expression+")","reference_owner("+expression+",local,sicily)")
	# Reference regions use one edge path; do not also evaluate the legacy rim.
	political_code=political_code.replace("if(political_ids_mode){\n    // Continuous","if(political_ids_mode){\n    if(reference_rollout_scope(geo)>.5){boundary=reference_antialiased_edge(q,local,sicily);strength=.62;}else{\n    // Continuous")
	political_code=political_code.replace("strength=.80;","strength=.80;\n    }")
	# A separate bounded raster prevents the Italian detail UVs clamping in Greece.
	political_code=political_code.replace("bool sicily)","bool sicily,bool eastern)").replace("local,sicily)","local,sicily,eastern)")
	political_code=political_code.replace("texture(reference_sicily_ids,q)","reference_detail(q,eastern)")
	political_code=political_code.replace("bool local=geo.x", "bool eastern=reference_balkans_scope(geo)>.001;\n bool local=geo.x")
	political_code=political_code.replace("if(local)q=vec2((geo.x-6.)/8.,(47.-geo.y)/4.);", "if(local)q=vec2((geo.x-6.)/8.,(47.-geo.y)/4.);\n if(eastern)q=vec2((geo.x-14.)/11.,(46.-geo.y)/10.);")
	political_code="uniform sampler2D reference_balkans_ids : filter_nearest,repeat_disable;\nvec4 reference_detail(vec2 q,bool eastern){return eastern?texture(reference_balkans_ids,q):texture(reference_sicily_ids,q);}\n"+political_code
	# Declare the Italy sampler before the shared selector function.
	political_code=political_code.replace("vec4 reference_detail", "uniform sampler2D reference_sicily_ids : filter_nearest,repeat_disable;\nvec4 reference_detail").replace("uniform sampler2D reference_local_ids : filter_nearest,repeat_disable;\nuniform sampler2D reference_sicily_ids : filter_nearest,repeat_disable;", "uniform sampler2D reference_local_ids : filter_nearest,repeat_disable;")
	code=code.replace('#include "res://political_map.gdshaderinc"',political_code)
	code=code.replace("uniform float detail_strength=1.0;","uniform float detail_strength=1.0;\nuniform sampler2D reference_lake_bed : filter_nearest,repeat_disable;\nvec2 reference_uv(vec2 geo){return vec2((geo.x-6.)/8.,(47.-geo.y)/4.);}")
	code=code.replace("world_pos=VERTEX;ground_normal=NORMAL;","vec2 lakeq=reference_uv(geo);\n if(all(greaterThanEqual(lakeq,vec2(0.)))&&all(lessThanEqual(lakeq,vec2(1.)))){vec4 bed=texture(reference_lake_bed,lakeq);if(bed.r>.5)VERTEX.y=min(VERTEX.y,bed.g*4.-.025);}\n world_pos=VERTEX;ground_normal=NORMAL;")
	code=code.replace("if(land<.5)discard;","vec2 lakeq=reference_uv(coast_geo);\n if(all(greaterThanEqual(lakeq,vec2(0.)))&&all(lessThanEqual(lakeq,vec2(1.)))){if(texture(reference_lake_bed,lakeq).r>.5)discard;}\n if(land<.5)discard;")
	# Preserve source-derived normals; damp only high-frequency surface variation.
	code=code.replace("float wide=noise(p*.035),middle=noise(p*.24);","float wide=.5+(noise(p*.035)-.5)*mix(1.,.25,northern_weight),middle=.5+(noise(p*.24)-.5)*mix(1.,.2,northern_weight);")
	code=code.replace("landscape*=.65+habitat_noise(p*.8)*.50+middle*.15;","landscape*=mix(.65+habitat_noise(p*.8)*.50+middle*.15,.94+habitat_noise(p*.8)*.07+middle*.04,northern_weight);")
	code=code.replace("ALBEDO=mix(macro*.57,regional,region_weight);","ALBEDO=mix(macro*.57,mix(regional,macro*.57,.55*northern_weight),region_weight);")
	code=preload("res://balkans_surface.gd").decorate_shader(code)
	code=preload("res://alpine_surface.gd").decorate_shader(code)
	code=preload("res://anatolia_surface.gd").decorate_shader(code)
	code=preload("res://eastern_surface.gd").decorate_shader(code)
	shader.code=code
	var bed=ImageTexture.create_from_image(Image.load_from_file("res://data/northern-italy-reference/lake-bed.png"))
	base_material.set_shader_parameter("reference_lake_bed",bed)
	var local_ids=ImageTexture.create_from_image(Image.load_from_file("res://data/northern-italy-reference/territory-ids.png"))
	base_material.set_shader_parameter("reference_local_ids",local_ids)
	var detail_ids=Image.load_from_file("res://data/geographic-regions/italy-ids.png")
	detail_ids.convert(Image.FORMAT_RG8) # Two identity bytes; confidence stays in source data.
	base_material.set_shader_parameter("reference_sicily_ids",ImageTexture.create_from_image(detail_ids))
	base_material.set_shader_parameter("reference_controller_ids",political_map.factions.owner_texture)
	for node in [context_node,regional_node]:
		node.material_override.set_shader_parameter("reference_lake_bed",bed)
		node.material_override.set_shader_parameter("reference_local_ids",local_ids)
		node.material_override.set_shader_parameter("reference_sicily_ids",base_material.get_shader_parameter("reference_sicily_ids"))
		node.material_override.set_shader_parameter("reference_controller_ids",political_map.factions.owner_texture)
	var factions=political_map.factions
	reference_labels=load("res://northern_italy_labels.gd").new();reference_labels.world=self;factions.layer.add_child(reference_labels)
	if FileAccess.file_exists("res://data/alpine/manifest.json") and not OS.get_cmdline_user_args().has("--alpine-baseline"):
		alpine_surface=load("res://alpine_surface.gd").new(self)
	if FileAccess.file_exists("res://data/balkans/manifest.json"):
		balkans_surface=load("res://balkans_surface.gd").new(self)
		for id in political_map.factions.by_id:
			var f=political_map.factions.by_id[id]
			if cartographic_rollout.contains(Vector2(f.label[0],f.label[1])) and not id in reference_faction_ids:reference_faction_ids.append(id)
	if cartographic_rollout.settings.get("anatoliaActive",false) and FileAccess.file_exists("res://data/anatolia/manifest.json"):
		anatolia_surface=load("res://anatolia_surface.gd").new(self)
		anatolia_identities=load("res://political_identities.gd").new(self)
		political_map.factions.local_identities=anatolia_identities;political_map.factions.populate_list("")
		for id in political_map.factions.by_id:
			var geo=political_map.factions.label_for(id)
			if geo!=null and cartographic_rollout.contains_anatolia(geo) and not id in reference_faction_ids:reference_faction_ids.append(id)
	for region in ["levant","egypt"]:
		if FileAccess.file_exists("res://data/"+region+"/manifest.json") and not OS.get_cmdline_user_args().has("--eastern-baseline"):
			eastern_surfaces.append(load("res://eastern_surface.gd").new(self,region))
	# Strategic river vertices are sampled once; refresh after source surfaces load.
	if not eastern_surfaces.is_empty():
		strategic_world_rivers.queue_free();strategic_regional_rivers.queue_free();make_rivers()

func _process(delta):
	var profile_start=Time.get_ticks_usec()
	super._process(delta)
	var base_end=Time.get_ticks_usec()
	if alpine_surface!=null:alpine_surface.tick()
	if balkans_surface!=null:balkans_surface.tick()
	var old_end=Time.get_ticks_usec()
	if anatolia_surface!=null:anatolia_surface.tick()
	for surface in eastern_surfaces:surface.tick()
	regional_cpu_ms={"base":(base_end-profile_start)/1000.,"previousRegions":(old_end-base_end)/1000.,"anatolia":(Time.get_ticks_usec()-old_end)/1000.}

func is_settled():
	for surface in eastern_surfaces:
		if not surface.is_ready():return false
	return super.is_settled() and (anatolia_surface==null or anatolia_surface.is_ready())

func river_view_signature():
	var signature=super.river_view_signature()
	for surface in eastern_surfaces:signature+=str(surface.resident.keys())+str(surface.is_ready())
	return signature

func elevation(lon,lat):
	var original=super.elevation(lon,lat)
	if distance<3300.:
		if alpine_surface!=null:original=alpine_surface.elevation(Vector2(lon,lat),original)
		if balkans_surface!=null:original=balkans_surface.elevation(Vector2(lon,lat),original)
		if anatolia_surface!=null:original=anatolia_surface.elevation(Vector2(lon,lat),original)
		for surface in eastern_surfaces:original=surface.elevation(Vector2(lon,lat),original)
	return original

func scenery_elevation(lon,lat):
	var geo=Vector2(lon,lat)
	for surface in eastern_surfaces:
		if surface.weight(geo)>.001:return surface.elevation(geo,super.elevation(lon,lat),true)
	if anatolia_surface!=null and cartographic_rollout.anatolia_weight(geo)>.001:return anatolia_surface.placement_height(geo)
	if balkans_surface!=null:
		var base=super.elevation(lon,lat)
		if alpine_surface!=null:base=alpine_surface.elevation(geo,base)
		return balkans_surface.elevation(geo,base,true)
	return elevation(lon,lat)

func is_land(lon,lat):
	for surface in eastern_surfaces:
		if surface.weight(Vector2(lon,lat))>.001:return surface.land_at(Vector2(lon,lat))
	if anatolia_surface!=null and cartographic_rollout.anatolia_weight(Vector2(lon,lat))>.001:return anatolia_surface.land_at(Vector2(lon,lat))
	return super.is_land(lon,lat)

func load_tile(id):
	var result=super.load_tile(id)
	if resident.has(id):
		for parameter in ["reference_lake_bed","reference_local_ids","reference_controller_ids","reference_sicily_ids"]:resident[id].node.material_override.set_shader_parameter(parameter,base_material.get_shader_parameter(parameter))
		if alpine_surface!=null:alpine_surface.bind(resident[id].node.material_override)
		if balkans_surface!=null:balkans_surface.bind(resident[id].node.material_override)
		if anatolia_surface!=null:anatolia_surface.bind(resident[id].node.material_override)
		for surface in eastern_surfaces:surface.bind(resident[id].node.material_override)
	return result

