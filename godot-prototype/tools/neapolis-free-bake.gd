extends SceneTree
## Offline assembly from selected CC0 Kenney modules. No campaign geography.
const OUT="res://assets/neapolis-free/"
var pieces={}
var tools=[]
var mats=[]
var counts=[]
var simple=false
var removed_degenerate=0
func _initialize():call_deferred("run")
func material(stem,tint):
	var m=StandardMaterial3D.new();m.albedo_color=Color(tint);m.roughness=.92
	# The photographic plaster color exposes too much dark masonry at campaign
	# scale. Keep a restrained plaster color, retaining its subtle surface maps.
	if stem=="roof":m.albedo_texture=load("res://assets/roma/"+stem+"-color.jpg")
	m.normal_enabled=true;m.normal_texture=load("res://assets/roma/"+stem+"-normal.jpg");m.normal_scale=.08 if stem=="plaster" else .18
	m.roughness_texture=load("res://assets/roma/"+stem+"-roughness.jpg")
	m.uv1_triplanar=true;m.uv1_scale=Vector3.ONE*350.;m.vertex_color_use_as_albedo=true;m.vertex_color_is_srgb=true
	return m
func run():
	for name in ["wall","wall-doorway-square","wall-window-small","roof-gable","pillar-wood"]:
		var scene=load(OUT+"source/"+name+".glb").instantiate()
		pieces[name]=find_mesh(scene);assert(pieces[name]!=null);scene.free()
	mats=[material("plaster","dbcbb0"),material("roof","c5ab92"),StandardMaterial3D.new()]
	mats[2].albedo_color=Color("716148");mats[2].roughness=.96;mats[2].vertex_color_use_as_albedo=true;mats[2].vertex_color_is_srgb=true
	for i in mats.size():assert(ResourceSaver.save(mats[i],OUT+"material-%d.tres"%i)==OK)
	var records=[]
	for variant in 3:
		for far in [false,true]:
			simple=far;tools=[];counts=[0,0,0];removed_degenerate=0
			for i in 3:
				var st=SurfaceTool.new();st.begin(Mesh.PRIMITIVE_TRIANGLES);st.set_material(mats[i]);tools.append(st)
			assemble(variant)
			var mesh=ArrayMesh.new()
			for i in 3:
				if counts[i]==0:continue
				tools[i].index();tools[i].generate_tangents();tools[i].commit(mesh)
			var filename="house-%d%s.res"%[variant,"-far" if far else ""]
			assert(ResourceSaver.save(mesh,OUT+filename)==OK)
			var b=mesh.get_aabb()
			records.append({"variant":variant,"far":far,"path":OUT+filename,"triangles":counts.reduce(func(a,b):return a+b,0),"surfaces":mesh.get_surface_count(),"removedDegenerateFaces":removed_degenerate,"boundsKm":{"position":[b.position.x,b.position.y,b.position.z],"size":[b.size.x,b.size.y,b.size.z]},"notice":"Interpretive reusable assembly; not a surveyed Neapolis building."})
	FileAccess.open(OUT+"assemblies.json",FileAccess.WRITE).store_string(JSON.stringify({"version":1,"referenceFootprintKm":[.022,.0224],"assemblies":records},"  "))
	print("NEAPOLIS_FREE_BAKE_OK ",JSON.stringify(records))
	quit()
func find_mesh(node):
	if node is MeshInstance3D:return node.mesh
	for child in node.get_children():
		var found=find_mesh(child)
		if found!=null:return found
	return null
func add_piece(name,position,basis,bucket,origin=Vector3.ZERO):
	var mesh=pieces[name];var st=tools[bucket];var normal_basis=basis.inverse().transposed()
	for surface in mesh.get_surface_count():
		var a=mesh.surface_get_arrays(surface);var vertices=a[Mesh.ARRAY_VERTEX];var normals=a[Mesh.ARRAY_NORMAL];var indices=a[Mesh.ARRAY_INDEX]
		if indices==null or indices.is_empty():indices=range(vertices.size())
		for triangle in range(0,indices.size(),3):
			var transformed=[]
			for corner in 3:transformed.append((basis*(vertices[indices[triangle+corner]]-origin)+position)*.001)
			if (transformed[1]-transformed[0]).cross(transformed[2]-transformed[0]).length_squared()<1e-22:
				removed_degenerate+=1;continue
			for corner in 3:
				var index=indices[triangle+corner];var p=transformed[corner];var n=(normal_basis*normals[index]).normalized()
				st.set_normal(n);st.set_color(Color.WHITE)
				st.set_uv(Vector2(p.x,p.z) if abs(n.y)>.5 else (Vector2(p.x,p.y) if abs(n.z)>.5 else Vector2(p.z,p.y)))
				st.add_vertex(p)
			counts[bucket]+=1
func wall(a:Vector2,b:Vector2,height=3.3,opening="",base=0.):
	if opening!="" and not simple and a.distance_to(b)>4.:
		var segments=ceili(a.distance_to(b)/3.)
		for i in segments:
			wall(a.lerp(b,float(i)/segments),a.lerp(b,float(i+1)/segments),height,opening if i==segments/2 else "",base)
		return
	var delta=b-a;var angle=atan2(delta.x,delta.y);var center=(a+b)*.5
	var name="wall" if simple or opening=="" else opening
	add_piece(name,Vector3(center.x,base,center.y),Basis(Vector3.UP,angle)*Basis.from_scale(Vector3(3.5,height,delta.length())),0,Vector3(.45,0,0))
func room(x,z,w,d,height=3.3,door=true):
	var left=x-w*.5;var right=x+w*.5;var back=z-d*.5;var front=z+d*.5
	wall(Vector2(left,back),Vector2(right,back),height)
	wall(Vector2(right,back),Vector2(right,front),height,"wall-window-small")
	wall(Vector2(right,front),Vector2(left,front),height,"wall-doorway-square" if door else "wall-window-small")
	wall(Vector2(left,front),Vector2(left,back),height)
	# Foundation skirts fill small contacts without displacing geographic terrain.
	for segment in [[Vector2(left,back),Vector2(right,back)],[Vector2(right,back),Vector2(right,front)],[Vector2(right,front),Vector2(left,front)],[Vector2(left,front),Vector2(left,back)]]:wall(segment[0],segment[1],1.2,"",-1.1)
	add_piece("roof-gable",Vector3(x,height,z),Basis.IDENTITY.scaled(Vector3(w,2.0/.57,d)),1)
func assemble(variant):
	# All compounds share an approximately 22 x 22.4 m envelope and open courts.
	room(0,-8,20,6,3.6)
	if variant==0:
		room(-7,0,6,10);room(7,1,6,12)
	elif variant==1:
		room(-7,1,6,12);room(6,6,7,7,3.1)
		for x in [-4.,0.,4.,8.]:add_piece("pillar-wood",Vector3(x,0,-2.4),Basis.IDENTITY.scaled(Vector3(3.,3.2,3.)),2)
		add_piece("roof-gable",Vector3(2,3.25,-3.5),Basis.IDENTITY.scaled(Vector3(15.,1.0/.57,3.3)),1)
	else:
		room(-7,0,6,10,3.4);room(7,5,6,8,3.4)
		room(0,8,7,5,3.1)
	wall(Vector2(-10,11),Vector2(-2,11),2.6)
	wall(Vector2(-2,11),Vector2(2,11),2.6,"wall-doorway-square")
	wall(Vector2(2,11),Vector2(10,11),2.6)
	wall(Vector2(-10,-5),Vector2(-10,11),2.6)
	wall(Vector2(10,11),Vector2(10,-5),2.6)
