extends "res://world.gd"
## Regional review subclass only. Production world and source records stay intact.
func read_json(path):
	if path=="data/factions/scenario-278.json":return super.read_json("data/northern-italy-reference/scenario-278.json")
	if path=="data/lakes.json":
		var lakes=super.read_json(path)
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
	var political_code=FileAccess.get_file_as_string("res://political_map.gdshaderinc")
	political_code="uniform sampler2D reference_local_ids : filter_nearest,repeat_disable;\n"+political_code
	political_code=political_code.replace("vec3 political_land_color", "vec4 reference_owner(vec2 q,bool local){vec2 encoded=local?texture(reference_local_ids,q).rg:texture(political_boundary_layer,q).rg;float id=round(encoded.r*255.)+256.*round(encoded.g*255.);return texture(political_palette,vec2((id+.5)/float(textureSize(political_palette,0).x),.5));}\nvec3 political_land_color")
	political_code=political_code.replace("q.y=1.-q.y;", "q.y=1.-q.y;\n bool local=geo.x>=6.&&geo.x<=14.&&geo.y>=43.&&geo.y<=47.;\n if(local)q=vec2((geo.x-6.)/8.,(47.-geo.y)/4.);")
	political_code=political_code.replace("vec3 encoded=texture(political_boundary_layer,q).rgb;","vec3 encoded=local?texture(reference_local_ids,q).rgb:texture(political_boundary_layer,q).rgb;")
	for expression in ["q","q+dx","q-dx","q+dy","q-dy","q+hx","q-hx","q+hy","q-hy"]:
		political_code=political_code.replace("political_owner_color("+expression+")","reference_owner("+expression+",local)")
	code=code.replace('#include "res://political_map.gdshaderinc"',political_code)
	code=code.replace("uniform float detail_strength=1.0;","uniform float detail_strength=1.0;\nuniform sampler2D reference_lake_bed : filter_nearest,repeat_disable;\nvec2 reference_uv(vec2 geo){return vec2((geo.x-6.)/8.,(47.-geo.y)/4.);}")
	code=code.replace("world_pos=VERTEX;ground_normal=NORMAL;","vec2 lakeq=reference_uv(geo);\n if(all(greaterThanEqual(lakeq,vec2(0.)))&&all(lessThanEqual(lakeq,vec2(1.)))){vec4 bed=texture(reference_lake_bed,lakeq);if(bed.r>.5)VERTEX.y=min(VERTEX.y,bed.g*4.-.025);}\n world_pos=VERTEX;ground_normal=NORMAL;")
	code=code.replace("if(land<.5)discard;","vec2 lakeq=reference_uv(coast_geo);\n if(all(greaterThanEqual(lakeq,vec2(0.)))&&all(lessThanEqual(lakeq,vec2(1.)))){if(texture(reference_lake_bed,lakeq).r>.5)discard;}\n if(land<.5)discard;")
	# Preserve source-derived normals; damp only high-frequency surface variation.
	code=code.replace("float wide=noise(p*.035),middle=noise(p*.24);","float wide=.5+(noise(p*.035)-.5)*.25,middle=.5+(noise(p*.24)-.5)*.2;")
	code=code.replace("landscape*=.65+habitat_noise(p*.8)*.50+middle*.15;","landscape*=.94+habitat_noise(p*.8)*.07+middle*.04;")
	code=code.replace("ALBEDO=mix(macro*.57,regional,region_weight);","ALBEDO=mix(macro*.57,mix(regional,macro*.57,.55),region_weight);")
	shader.code=code
	var bed=ImageTexture.create_from_image(Image.load_from_file("res://data/northern-italy-reference/lake-bed.png"))
	base_material.set_shader_parameter("reference_lake_bed",bed)
	var local_ids=ImageTexture.create_from_image(Image.load_from_file("res://data/northern-italy-reference/territory-ids.png"))
	base_material.set_shader_parameter("reference_local_ids",local_ids)
	for node in [context_node,regional_node]:
		node.material_override.set_shader_parameter("reference_lake_bed",bed)
		node.material_override.set_shader_parameter("reference_local_ids",local_ids)
	var factions=political_map.factions
	factions.overlay.visible=false
	var labels=load("res://tools/northern-italy-labels.gd").new();labels.world=self;factions.layer.add_child(labels)

func load_tile(id):
	var result=super.load_tile(id)
	if resident.has(id):
		for parameter in ["reference_lake_bed","reference_local_ids"]:resident[id].node.material_override.set_shader_parameter(parameter,base_material.get_shader_parameter(parameter))
	return result
