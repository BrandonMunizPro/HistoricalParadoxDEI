extends "res://roma_showcase_kit.gd"
## Original Republican civic/provisioning meshes; no imperial basilica or thermae.
const OUTPUT="res://assets/settlement-development/"
func load_materials():
	for name in ["plaster","clay","tuff","timber","red-ochre","interior","linen","water","leaf","charcoal"]:mats.append(load(FOLDER+name+".tres"))
	mats[9]=mats[9].duplicate();mats[9].albedo_color=Color("b2a077");mats[9].albedo_texture=load(FOLDER+"path-color.jpg");mats[9].roughness=.95
func save_mesh(name):
	var mesh=ArrayMesh.new()
	for s in tools:
		var a=s.commit_to_arrays()
		if a[Mesh.ARRAY_VERTEX]!=null and a[Mesh.ARRAY_VERTEX].size()>0:s.generate_tangents();s.index();s.commit(mesh)
	assert(ResourceSaver.save(mesh,OUTPUT+name+".res")==OK)
	var bounds=mesh.get_aabb()
	return {"name":name,"triangles":faces,"surfaces":mesh.get_surface_count(),"boundsM":[bounds.position.x*1000,bounds.position.z*1000,bounds.size.x*1000,bounds.size.z*1000]}
func court(w,l):
	# Irregular tuff edging around a beaten-earth civic space, not Imperial marble.
	for side in [-1.,1.]:
		for j in int(l/1.8):box(Vector3(side*w*.5,.08,-l*.5+j*1.8),Vector3(.7,.16,1.72),2)
		for j in int(w/1.8):box(Vector3(-w*.5+j*1.8,.08,side*l*.5),Vector3(1.72,.16,.7),2)
func council(p,w,l,h):
	wing(p,w,l,h,1,false,false)
	# Broad central doorway, steps and projecting Tuscan timber entrance.
	box(p+Vector3(0,2.2,l*.5+.04),Vector3(2.6,4.4,.12),5)
	for side in [-1.,1.]:column(p+Vector3(side*3,0,l*.5+2.4),4.8,.28,3)
	box(p+Vector3(0,4.9,l*.5+1.2),Vector3(8,.35,4),3)
	for i in 4:box(p+Vector3(0,.07+i*.16,l*.5+4-i*.45),Vector3(8,.18,.55),2)
func civic_stage(level):
	var w=[22.,34.,49.][level-1];var length_value=[21.,31.,43.][level-1]
	court(w,length_value)
	if level==1:
		box(Vector3(0,.45,-6),Vector3(7,.9,4),3)
		for side in [-1.,1.]:
			for j in 4:box(Vector3(side*8,.6,-4+j*3),Vector3(1.3,1.2,2.2),3)
		for i in 2:pot(Vector3(-4+i*8,0,-8),.9)
		return
	council(Vector3(0,0,-length_value*.5+6),14 if level==2 else 18,10,6.3 if level==2 else 8.2)
	if level==2:
		wing(Vector3(-13,0,4),6,18,3.6,1,true)
		box(Vector3(6,.6,3),Vector3(7,1.2,3),2)
		for j in 4:box(Vector3(5,.45,8+j*2.2),Vector3(10,.9,.7),3)
		return
	# Tabernae frame the civic void; no later monumental basilica frontage.
	for side in [-1.,1.]:
		wing(Vector3(side*21,0,3),6.2,30,4.4,1,true)
		for j in 7:column(Vector3(side*16.9,0,-9+j*4),3.7,.21,3)
		box(Vector3(side*16.9,3.9,3),Vector3(.4,.35,28),3)
		for j in 5:pot(Vector3(side*16,0,-6+j*5),.8)
	# Partial stepped assembly space. Its geometry is interpretive, not surveyed.
	for row in 3:
		var radius=5.5+row*.85
		for j in 20:
			var a=PI*.1+PI*1.25*j/20;var b=a+PI*1.25/20
			var va=Vector3(cos(a)*radius,.14+row*.22,sin(a)*radius+4)
			var vb=Vector3(cos(b)*radius,.14+row*.22,sin(b)*radius+4)
			beam(va,vb,.62,2)
	box(Vector3(1,.8,13),Vector3(9,1.6,3.8),2)
	for i in 4:box(Vector3(1,.12+i*.18,16-i*.4),Vector3(8,.2,.5),2)
	# Timber rail and schematic bronze-colored rostra fittings, not statuary replicas.
	for j in 6:
		var x=-2.7+j*1.4
		beam(Vector3(x,.8,15),Vector3(x,.9,15.8),.16,3)
		beam(Vector3(x,.9,15.8),Vector3(x,1.3,16.2),.12,3)
	for side in [-1.,1.]:
		for j in 3:box(Vector3(side*9,.48,16+j*1.5),Vector3(4,.95,.65),2)
func grain_house(p,w,l,h):
	# Ventilated raised floor, retaining plinth and visibly slatted loading facade.
	for x in [-w*.4,w*.4]:
		for j in 5:box(p+Vector3(x,.6,-l*.4+j*l*.2),Vector3(.7,1.2,.8),2)
	wing(p+Vector3.UP*.9,w,l,h,1,false,false)
	for side in [-1.,1.]:
		for j in 7:box(p+Vector3(side*(w*.5+.03),1.7,-l*.4+j*l*.13),Vector3(.10,.65,.55),5)
	beam(p+Vector3(0,.15,l*.5+5),p+Vector3(0,1.1,l*.5),1.8,3)
	for i in 5:pot(p+Vector3(-w*.35+i*w*.17,1,l*.5+1),.65)
func grain_stage(level):
	if level==1:
		grain_house(Vector3(0,0,-2),8,10,3)
		for j in 6:pot(Vector3(-4+j*1.3,0,7),1.0)
		return
	if level==2:
		grain_house(Vector3(-4,0,-4),11,20,4.6)
		threshing(Vector3(7,0,7),5)
		for j in 6:stook(Vector3(7+(j%2)*1.6,0,-9+floori(j/2.)*2))
		return
	for side in [-1.,1.]:grain_house(Vector3(side*13,0,-4),10,25,5.3)
	wing(Vector3(0,0,-16),15,6,3.6,1,true)
	threshing(Vector3(0,0,7),6.0)
	for j in 10:stook(Vector3(-6+(j%5)*2.6,0,15+floori(j/5.)*1.7))
	for side in [-1.,1.]:
		for j in 6:pot(Vector3(side*7,0,-11+j*2.6),.85)
func threshing(p,r):
	# Earth-toned circular working floor, stone edging and a drag sledge.
	for j in 32:
		var a=TAU*j/32;var b=TAU*(j+1)/32
		tri(p+Vector3.UP*.06,p+Vector3(cos(b)*r,.06,sin(b)*r),p+Vector3(cos(a)*r,.06,sin(a)*r),9)
		box(p+Vector3(cos(a)*r,.12,sin(a)*r),Vector3(.4,.24,.4),2)
	for j in 4:beam(p+Vector3(-1+j*.5,.2,-1),p+Vector3(-1+j*.5,.2,1),.3,3)
func stook(p):
	for j in 8:
		var a=TAU*j/8
		beam(p+Vector3(cos(a)*.5,0,sin(a)*.5),p+Vector3(0,1.6,0),.16,6)
