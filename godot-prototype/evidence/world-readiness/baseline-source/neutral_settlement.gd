extends RefCounted
## Original neutral architecture. Silhouette only, not an archaeological plan.
static func house():
	var surface=SurfaceTool.new();surface.begin(Mesh.PRIMITIVE_TRIANGLES)
	part(surface,BoxMesh.new(),Vector3(0,.45,0),Vector3(1,.9,1),Color("b7a384"))
	part(surface,PrismMesh.new(),Vector3(0,1.04,0),Vector3(1.12,.38,1.14),Color("905b41"))
	part(surface,BoxMesh.new(),Vector3(0,.24,-.506),Vector3(.21,.48,.025),Color("39382e"))
	for x in [-.31,.31]:
		part(surface,BoxMesh.new(),Vector3(x,.62,-.507),Vector3(.13,.19,.025),Color("4c493a"))
	# Raised eaves and a darker foundation make a physical building silhouette.
	part(surface,BoxMesh.new(),Vector3(0,.065,0),Vector3(1.05,.13,1.05),Color("82765f"))
	var mesh=surface.commit()
	var material=StandardMaterial3D.new();material.vertex_color_use_as_albedo=true
	material.vertex_color_is_srgb=true
	material.roughness=.91;mesh.surface_set_material(0,material)
	return mesh

static func part(surface,mesh,position,scale_value,color):
	var arrays=mesh.get_mesh_arrays();var vertices=arrays[Mesh.ARRAY_VERTEX];var normals=arrays[Mesh.ARRAY_NORMAL]
	var indices=arrays[Mesh.ARRAY_INDEX]
	for index in indices:
		surface.set_color(color);surface.set_normal(normals[index])
		surface.add_vertex(vertices[index]*scale_value+position)

static func layout(seed_value,count):
	var rng=RandomNumberGenerator.new();rng.seed=abs(seed_value)
	var orientation=rng.randf()*TAU
	var result=[{"offset":Vector3.ZERO,"scale":Vector3(.075,.045,.065),"angle":orientation,"tint":Color(.95,.97,.94)}]
	# Irregular courtyard blocks with a clear central lane, rather than scatter.
	for i in count:
		var row=[2,3,1,4,0,5][i/8];var column=[3,4,2,5,1,6,0,7][i%8]
		var x=(column-3.5)*.072+(.025 if column>=4 else -.025)
		var z=(row-2.5)*.085
		if i%13==0:continue
		result.append({"offset":Vector3(x+rng.randf_range(-.009,.009),0,z+rng.randf_range(-.012,.012)).rotated(Vector3.UP,orientation),"scale":Vector3(rng.randf_range(.032,.055),rng.randf_range(.024,.045),rng.randf_range(.037,.060)),"angle":orientation+rng.randf_range(-.13,.13),"tint":Color(rng.randf_range(.88,1.12),rng.randf_range(.90,1.08),rng.randf_range(.90,1.08))})
	return result
