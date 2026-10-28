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
var leaf_material: Material
var bark_material: ShaderMaterial
var rng=RandomNumberGenerator.new()

func build(species,variant,grove=false):
	vertices.clear();normals.clear();colours.clear();indices.clear();coarse.clear();branches.clear();coarse_branches.clear();uvs.clear()
	if leaf_material==null:
		leaf_material=ShaderMaterial.new()
		leaf_material.shader=load("res://foliage.gdshader")
		bark_material=ShaderMaterial.new()
		bark_material.shader=leaf_material.shader
		bark_material.set_shader_parameter("woody",true)
	rng.seed=78213+species*107+variant*7919
	var bark=Color("6d6353")
	if grove:
		# A cheap crown stand represents woodland at campaign scale. It is an
		# interpretive LOD asset, not a giant tree or altered geographic landform.
		for i in 24:
			var angle=rng.randf()*TAU;var radius=sqrt(rng.randf())*.045
			var base=Vector3(cos(angle)*radius,0,sin(angle)*radius)
			var height=rng.randf_range(.009,.016)
			if species==4:height*=.35
			var colour=[Color("476039"),Color("304d35"),Color("3c5639"),Color("476b3d"),Color("777948"),Color("3c6036")][species]
			branch(base,base+Vector3(0,height,0),.0005,.00015,bark)
			var size=Vector3(.007,height*.6,.007)*rng.randf_range(.8,1.2)
			if species==1 or species==2:size*=Vector3(.65,1.3,.65)
			crown(base+Vector3(0,height,0),size,colour,i,true)
		return finish_mesh()
	var trunk=Vector3(rng.randf_range(-.001,.001),.011,rng.randf_range(-.001,.001))
	if species==0 and variant%2==1:trunk.y=.013
	if species==2:trunk.y=.014
	if species==3:trunk.y=.016
	if species==4:trunk.y=.004
	if species==5:trunk.y=.025
	branch(Vector3.ZERO,trunk,.0012,.0006,bark)
	if species==0 or species==3:
		var umbrella=species==0 and variant%2==1
		var count=7 if umbrella else 9
		for i in count:
			var angle=TAU*i/count+rng.randf_range(-.4,.4)
			var radius=rng.randf_range(.002,.009)
			var center=trunk+Vector3(cos(angle)*radius,rng.randf_range(.002,.006),sin(angle)*radius)
			branch(trunk*.65,center,.0006,.00016,bark)
			var size=Vector3(rng.randf_range(.0045,.0075),rng.randf_range(.003,.0048),rng.randf_range(.0045,.0075))
			if umbrella:size*=Vector3(1.15,.62,1.15)
			crown(center,size,Color("52734c") if species==3 else (Color("526744") if umbrella else Color("4c6240")),i)
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
	elif species==2:
		branch(trunk,trunk+Vector3(0,.014,0),.0006,.0001,bark)
		for i in 6:
			var t=float(i)/6
			var r=lerp(.0045,.0015,t)
			crown(Vector3(rng.randf_range(-.001,.001),.009+t*.024,rng.randf_range(-.001,.001)),Vector3(r,.006,r),Color("405740"),i)
	elif species==4:
		for i in 5:
			var angle=i*2.399+variant
			var center=Vector3(cos(angle)*.004,.004+float(i%2)*.002,sin(angle)*.004)
			crown(center,Vector3(.005,.004,.0055),Color("777948"),i)
	else:
		for i in 9:frond(trunk,TAU*i/9+variant*.63,Color("304e2b"))
	return finish_mesh()

func finish_mesh():
	var arrays=[]
	arrays.resize(Mesh.ARRAY_MAX)
	arrays[Mesh.ARRAY_VERTEX]=vertices
	arrays[Mesh.ARRAY_NORMAL]=normals
	arrays[Mesh.ARRAY_COLOR]=colours
	arrays[Mesh.ARRAY_TEX_UV]=uvs
	arrays[Mesh.ARRAY_INDEX]=indices
	var mesh=ArrayMesh.new()
	var leaf_lods={}
	if coarse.size()<indices.size():leaf_lods[.0012]=coarse
	mesh.add_surface_from_arrays(Mesh.PRIMITIVE_TRIANGLES,arrays,[],leaf_lods)
	mesh.surface_set_material(0,leaf_material)
	arrays[Mesh.ARRAY_INDEX]=branches
	var branch_lods={}
	if coarse_branches.size()<branches.size():branch_lods[.0012]=coarse_branches
	mesh.add_surface_from_arrays(Mesh.PRIMITIVE_TRIANGLES,arrays,[],branch_lods)
	mesh.surface_set_material(1,bark_material)
	return mesh

func frond(center,angle,colour):
	var start=vertices.size()
	var direction=Vector3(cos(angle),0,sin(angle));var side=Vector3(-sin(angle),0,cos(angle))
	for row in 7:
		var t=float(row)/6
		var p=center+direction*t*.019+Vector3(0,sin(t*PI)*.006-t*.004,0)
		for sign_value in [-1,1]:
			vertices.append(p+side*sign_value*(.0001+sin(t*PI)*.0011))
			normals.append(Vector3.UP);colours.append(colour);uvs.append(Vector2(t,(sign_value+1)*.5))
	for row in 6:
		var a=start+row*2
		indices.append_array(PackedInt32Array([a,a+2,a+1,a+1,a+2,a+3]))
	for row in [0,2,4]:
		var a=start+row*2
		coarse.append_array(PackedInt32Array([a,a+4,a+1,a+1,a+4,a+5]))
	# Separate pinnae break the solid star silhouette at close inspection.
	for row in range(1,6):
		var t=float(row)/6
		var base=center+direction*t*.019+Vector3(0,sin(t*PI)*.006-t*.004,0)
		for sign_value in [-1,1]:
			var tip=base+side*sign_value*sin(t*PI)*.003-direction*.0015+Vector3(0,-.0007,0)
			var k=vertices.size()
			for point in [base-direction*.00045,tip,base+direction*.001]:
				vertices.append(point);normals.append(Vector3.UP);colours.append(colour);uvs.append(Vector2.ZERO)
			indices.append_array(PackedInt32Array([k,k+1,k+2]))

func crown(center,size,colour,seed_index,proxy=false):
	# Opaque irregular crown volumes retain depth from every camera direction;
	# no repeated cutout rectangles or alpha overdraw through a woodland stand.
	var start=vertices.size()
	var rows=5
	var columns=8
	for row in rows:
		var latitude=PI*float(row)/(rows-1)
		for column in columns:
			var angle=TAU*column/columns
			var n=Vector3(sin(latitude)*cos(angle),cos(latitude),sin(latitude)*sin(angle))
			var irregular=1.0+.10*sin(column*2.7+seed_index*3.1+row)
			vertices.append(center+n*size*irregular)
			normals.append((n/size).normalized())
			var shade=.84+.16*sin(column*1.8+seed_index*2.3+row*.7)
			colours.append(Color(colour.r*shade,colour.g*shade,colour.b*shade,1))
			uvs.append(Vector2(float(column)/columns,float(row)/(rows-1)))
	for row in rows-1:
		for column in columns:
			var a=start+row*columns+column;var b=start+row*columns+(column+1)%columns
			var tri=PackedInt32Array([a,b,a+columns,b,b+columns,a+columns])
			indices.append_array(tri)
	# Keep every latitude ring. Dropping rings turned round crowns into pointed
	# diamonds at ordinary campaign distance. Reduce angular segments instead.
	for row in rows-1:
		for column in range(0,columns,2):
			var a=start+row*columns+column;var b=start+row*columns+(column+2)%columns
			coarse.append_array(PackedInt32Array([a,b,a+columns,b,b+columns,a+columns]))

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
