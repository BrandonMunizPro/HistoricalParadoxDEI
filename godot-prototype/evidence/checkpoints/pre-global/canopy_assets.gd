extends RefCounted
## Original branching canopy assets, in kilometres. No geographic elevations are modified.
var vertices=PackedVector3Array()
var normals=PackedVector3Array()
var colours=PackedColorArray()
var indices=PackedInt32Array()
var coarse=PackedInt32Array()
var branches=PackedInt32Array()
var coarse_branches=PackedInt32Array()
var uvs=PackedVector2Array()
var leaf_material: StandardMaterial3D
var bark_material: StandardMaterial3D
var rng=RandomNumberGenerator.new()

func build(species,variant):
	vertices.clear();normals.clear();colours.clear();indices.clear();coarse.clear();branches.clear();coarse_branches.clear();uvs.clear()
	if leaf_material==null:
		var image=Image.load_from_file("res://assets/quality/leaves.png")
		image.generate_mipmaps()
		leaf_material=StandardMaterial3D.new()
		leaf_material.albedo_texture=ImageTexture.create_from_image(image)
		leaf_material.vertex_color_use_as_albedo=true
		leaf_material.vertex_color_is_srgb=true
		leaf_material.transparency=BaseMaterial3D.TRANSPARENCY_ALPHA_SCISSOR
		leaf_material.alpha_scissor_threshold=.4
		leaf_material.cull_mode=BaseMaterial3D.CULL_DISABLED
		leaf_material.roughness=.96
		leaf_material.metallic_specular=.04
		leaf_material.texture_filter=BaseMaterial3D.TEXTURE_FILTER_LINEAR_WITH_MIPMAPS_ANISOTROPIC
		bark_material=StandardMaterial3D.new()
		bark_material.vertex_color_use_as_albedo=true
		bark_material.vertex_color_is_srgb=true
		bark_material.roughness=1
		bark_material.metallic_specular=0
	rng.seed=78213+species*107+variant*7919
	var bark=Color("6d6353")
	var trunk=Vector3(rng.randf_range(-.001,.001),.011,rng.randf_range(-.001,.001))
	if species==0 and variant%2==1:trunk.y=.013
	if species==2:trunk.y=.014
	branch(Vector3.ZERO,trunk,.0012,.0006,bark)
	if species==0:
		var umbrella=variant%2==1
		var count=7 if umbrella else 9
		for i in count:
			var angle=TAU*i/count+rng.randf_range(-.4,.4)
			var radius=rng.randf_range(.002,.009)
			var center=trunk+Vector3(cos(angle)*radius,rng.randf_range(.002,.006),sin(angle)*radius)
			branch(trunk*.65,center,.0006,.00016,bark)
			var size=Vector3(rng.randf_range(.0045,.0075),rng.randf_range(.003,.0048),rng.randf_range(.0045,.0075))
			if umbrella:size*=Vector3(1.15,.62,1.15)
			crown(center,size,Color("526744") if umbrella else Color("4c6240"),i)
		crown(trunk+Vector3(0,.006,0),Vector3(.006,.004,.006),Color("5c704b"),count)
	elif species==1:
		branch(trunk,trunk+Vector3(0,.017,0),.00065,.0001,bark)
		for i in 10:
			var angle=i*2.399+variant*.8
			var t=float(i)/10
			var radius=lerp(.009,.002,t)
			var base=Vector3(0,.009+t*.018,0)
			var tip=base+Vector3(cos(angle)*radius,.001,sin(angle)*radius)
			branch(base,tip,.00035,.00008,bark)
			crown(tip,Vector3(radius*.70,.0035,radius*.70),Color("36594a"),i)
		crown(Vector3(0,.030,0),Vector3(.002,.004,.002),Color("476958"),11)
	else:
		branch(trunk,trunk+Vector3(0,.014,0),.0006,.0001,bark)
		for i in 6:
			var t=float(i)/6
			var r=lerp(.0045,.0015,t)
			crown(Vector3(rng.randf_range(-.001,.001),.009+t*.024,rng.randf_range(-.001,.001)),Vector3(r,.006,r),Color("405740"),i)
	var arrays=[]
	arrays.resize(Mesh.ARRAY_MAX)
	arrays[Mesh.ARRAY_VERTEX]=vertices
	arrays[Mesh.ARRAY_NORMAL]=normals
	arrays[Mesh.ARRAY_COLOR]=colours
	arrays[Mesh.ARRAY_TEX_UV]=uvs
	arrays[Mesh.ARRAY_INDEX]=indices
	var mesh=ArrayMesh.new()
	mesh.add_surface_from_arrays(Mesh.PRIMITIVE_TRIANGLES,arrays,[],{.0012:coarse})
	mesh.surface_set_material(0,leaf_material)
	arrays[Mesh.ARRAY_INDEX]=branches
	mesh.add_surface_from_arrays(Mesh.PRIMITIVE_TRIANGLES,arrays,[],{.0012:coarse_branches})
	mesh.surface_set_material(1,bark_material)
	return mesh

func crown(center,size,colour,seed_index):
	for card in 4:
		var angle=card*TAU/3+seed_index*1.37
		var n=Vector3(sin(angle)*.78,.62,cos(angle)*.78).normalized() if card<3 else Vector3.UP
		var right=Vector3(cos(angle),0,-sin(angle))
		var up=n.cross(right).normalized()
		var start=vertices.size()
		var corners=[Vector2(-1,-1),Vector2(1,-1),Vector2(-1,1),Vector2(1,1)]
		for q in corners:
			vertices.append(center+right*q.x*max(size.x,size.z)+up*q.y*max(size.y,size.z)*1.1)
			normals.append((n+right*q.x*.22+up*q.y*.22).normalized())
			var shade=.78+.14*sin(seed_index*2.3+card)
			colours.append(Color(shade,shade,shade*.97,1))
			uvs.append(Vector2((q.x+1)*.5,(q.y+1)*.5))
		var tri=PackedInt32Array([start,start+2,start+1,start+1,start+2,start+3])
		indices.append_array(tri)
		if card==3 or card==0:coarse.append_array(tri)

func branch(a,b,r0,r1,colour):
	var start=vertices.size()
	var axis=(b-a).normalized()
	var right=axis.cross(Vector3.FORWARD).normalized()
	if right.length()<.1:right=axis.cross(Vector3.RIGHT).normalized()
	var forward=right.cross(axis).normalized()
	for end in 2:
		for i in 7:
			var n=right*cos(TAU*i/6)+forward*sin(TAU*i/6)
			vertices.append((a if end==0 else b)+n*(r0 if end==0 else r1))
			normals.append(n)
			colours.append(colour)
			uvs.append(Vector2.ZERO)
	for i in 6:
		var k=start+i
		var tri=PackedInt32Array([k,k+7,k+1,k+1,k+7,k+8])
		branches.append_array(tri)
		if start==0:coarse_branches.append_array(tri)
