extends "res://roma_architecture.gd"
## Reuse the project's masonry, roof and column builders. All new forms are
## modest interpretive Greek/Italic buildings, authored in metres.
func setup():
	materials=[load("res://assets/neapolis-free/material-0.tres").duplicate(),load("res://assets/neapolis-free/material-1.tres").duplicate()]
	# A restrained roof removes photographic moire at campaign distance.
	materials[1].albedo_texture=null;materials[1].albedo_color=Color("a96f50")
	for color_value in ["a99b80","594b38","d9cbb0","b8a57d"]:
		var m=StandardMaterial3D.new();m.albedo_color=Color(color_value);m.roughness=.95;m.vertex_color_use_as_albedo=true;m.vertex_color_is_srgb=true;materials.append(m)
func build(kind,far):
	detail=not far;start()
	match kind:
		"street-house":
			wing(Vector3(0,0,-2),Vector3(12,4.2,17));porch(Vector3(0,0,9),13,4)
		"stoa":
			box(Vector3(0,2.8,-5),Vector3(54,5.6,.7),0)
			for side in [-1.,1.]:box(Vector3(side*27,2.8,0),Vector3(.7,5.6,10),0)
			for x in [-24.,-18.,-12.,-6.,0.,6.,12.,18.,24.]:
				column(Vector3(x,0,4),.35,5.6,2);box(Vector3(x,5.5,4),Vector3(1,.5,1),4)
			box(Vector3(0,5.7,0),Vector3(55,.5,12),3);roof(Vector3(0,6,0),56,14,3)
		"meeting-hall":
			wing(Vector3(0,0,-3),Vector3(25,6,20))
			for x in [-10.,-5.,0.,5.,10.]:column(Vector3(x,0,11),.36,5.8,2)
			roof(Vector3(0,5.9,9),28,10,2)
		"sanctuary":sanctuary()
		"market":
			for x in [-7.,0.,7.]:
				for side in [-1.,1.]:
					for z in [-4.,3.]:column(Vector3(x+side*2.8,0,z),.12,3.4,3)
				box(Vector3(x,3.4,-.5),Vector3(6.4,.18,8),5,Color(1.04,.88,.68) if x==0 else Color.WHITE)
				box(Vector3(x,3.2,3.5),Vector3(6.4,.45,.12),5)
				box(Vector3(x,.8,1),Vector3(5,1.6,1.2),3)
				if detail:
					for j in 4:column(Vector3(x-1.8+j*1.2,1.6,1),.38,.65,1)
		"workshop":
			wing(Vector3(-5,0,-2),Vector3(12,4,20));porch(Vector3(6,0,4),9,9)
			column(Vector3(7,0,-7),3,2.4,2);cone(Vector3(7,2.4,-7),3,.6,2.3,1)
			box(Vector3(7,1.0,7),Vector3(7,2,1.3),3)
		"store":
			wing(Vector3.ZERO,Vector3(13,5.5,23))
			for x in [-3.,0.,3.]:box(Vector3(x,.35,12.7),Vector3(2,.7,1.5),3)
		"guard":
			wing(Vector3(-2,0,-2),Vector3(13,4.5,14));porch(Vector3(2,0,8),12,5)
			box(Vector3(7,1.1,-1),Vector3(.5,2.2,14),2)
	return finish()
func sanctuary():
	# Low stepped crepis and surrounding columns, not Roma's high frontal podium.
	for i in 3:box(Vector3(0,.16+i*.28,-2),Vector3(24-i*.8,.32,32-i*.8),2)
	box(Vector3(0,4.2,-4),Vector3(11,6.4,19),0)
	box(Vector3(0,3,5.55),Vector3(2.5,4.4,.18),3)
	for x in [-9.,9.]:
		for z in [-15.,-9.,-3.,3.,9.,12.]:doric(Vector3(x,.9,z))
	for z in [-15.,12.]:
		for x in [-3.,3.]:doric(Vector3(x,.9,z))
	box(Vector3(0,7.6,-1.5),Vector3(21,.7,30),4)
	roof(Vector3(0,8,-1.5),22,33,4)
	# Front triangular tympanum reads as a sanctuary at the campaign camera.
	part(PrismMesh.new(),Vector3(0,10,15),Vector3(21,4,.5),0)
	box(Vector3(0,.7,18.5),Vector3(4,1.4,2),2)
func doric(p):
	column(p,.45,6.3,2);cone(p+Vector3(0,6.1,0),.48,.7,.4,4)
	box(p+Vector3(0,6.55,0),Vector3(1.5,.35,1.5),4)
