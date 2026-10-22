extends RefCounted
## Original interpretive regional vegetation. Suitability is not ancient land-cover evidence.
var world
var ecology: Image
var roots={}
var meshes=[]
var busy=false
var tree_count=0

func _init(owner):
	world=owner
	ecology=Image.load_from_file("res://data/regional/ecology.png")
	for species in 3:meshes.append(tree_mesh(species))

func tree_mesh(species):
	var surface=SurfaceTool.new()
	surface.begin(Mesh.PRIMITIVE_TRIANGLES)
	var bark=Color("655642")
	cone(surface,Vector3(0,.009,0),.0018,.018,bark,6,.0012)
	if species==0:
		for item in [[Vector3(0,.024,0),.012,.018],[Vector3(-.007,.020,.003),.009,.013],[Vector3(.006,.021,-.004),.010,.015]]:
			cone(surface,item[0],item[1],item[2],Color("425d35"),7,item[1]*.37)
	elif species==1:
		for j in 3:cone(surface,Vector3(0,.017+j*.009,0),.013-j*.003,.020,Color("284b3c"),7,0.0)
	else:
		cone(surface,Vector3(0,.026,0),.0055,.038,Color("3b5031"),7,.001)
	surface.generate_normals()
	var material=StandardMaterial3D.new()
	material.vertex_color_use_as_albedo=true
	material.roughness=1
	surface.set_material(material)
	return surface.commit()

func cone(surface,center,radius,height,color,sides,top):
	for i in sides:
		var a=TAU*i/sides;var b=TAU*(i+1)/sides
		var p=center+Vector3(cos(a)*radius,-height*.5,sin(a)*radius)
		var q=center+Vector3(cos(b)*radius,-height*.5,sin(b)*radius)
		var r=center+Vector3(cos(a)*top,height*.5,sin(a)*top)
		var s=center+Vector3(cos(b)*top,height*.5,sin(b)*top)
		surface.set_color(color.lightened(.035*cos(a)))
		for v in [p,r,q,q,r,s]:surface.add_vertex(v)

func tick():
	for id in roots.keys():
		if not world.resident.has(id):
			roots[id].queue_free()
			roots.erase(id)
	for id in roots:roots[id].visible=world.distance<180
	if busy or world.distance>200 or not world.queue.is_empty():return
	for id in world.resident:
		if world.resident[id].descriptor.kind!="regional" or roots.has(id):continue
		if world.resident[id].reveal<1:return
		build(id)
		return

func build(id):
	busy=true
	var root=Node3D.new()
	world.vegetation_root.add_child(root)
	roots[id]=root
	var b=world.tiles[id].bounds
	var rng=RandomNumberGenerator.new()
	rng.seed=abs(id.hash())+278
	var batches=[[],[],[]]
	for i in 12000:
		if i%500==0:await world.get_tree().process_frame
		if not world.resident.has(id):busy=false;return
		var lon=rng.randf_range(b.west,b.east);var lat=rng.randf_range(b.south,b.north)
		var x=clampi(roundi((lon-6)*32),0,448);var y=clampi(roundi((49-lat)*32),0,448)
		var density=ecology.get_pixel(x,y).r
		if rng.randf()>density*.85 or not world.is_land(lon,lat):continue
		var h=world.elevation(lon,lat)
		if h<.07 or h>3.6:continue
		var species=1 if h>1.6 or lat>45.5 else (2 if rng.randf()<.16 else 0)
		var p=world.project(lon,lat);p.y=h
		var size=rng.randf_range(.65,1.65)
		var basis=Basis(Vector3.UP,rng.randf()*TAU).scaled(Vector3(size,size*rng.randf_range(.85,1.2),size))
		batches[species].append(Transform3D(basis,p))
	for species in 3:
		if batches[species].is_empty():continue
		var mm=MultiMesh.new()
		mm.transform_format=MultiMesh.TRANSFORM_3D
		mm.mesh=meshes[species]
		mm.instance_count=batches[species].size()
		for i in mm.instance_count:mm.set_instance_transform(i,batches[species][i])
		var node=MultiMeshInstance3D.new()
		node.multimesh=mm
		node.visibility_range_end=190
		node.cast_shadow=GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
		root.add_child(node)
		tree_count+=mm.instance_count
	busy=false
	print("REGIONAL_SCENERY_READY ",id," instances=",batches[0].size()+batches[1].size()+batches[2].size())
