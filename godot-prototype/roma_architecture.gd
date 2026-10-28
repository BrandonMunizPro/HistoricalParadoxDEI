extends RefCounted
## Original early Republican presentation kit. Not a surveyed city reconstruction.
## Coordinates are kilometres; architecture is authored in metres, then converted.
var materials=[]
var library={}
var surfaces=[]
var detail=true
var prepared=false
var max_prepare_ms=0.0
var texture_prepare_ms=0.0
const TYPES=["courtyard","longhouse","shops","workshop","storehouse","roundhouse","temple"]

func texture(file):
	var image=Image.load_from_file("res://assets/roma/"+file)
	image.generate_mipmaps()
	return ImageTexture.create_from_image(image)

func prepare(world):
	if prepared:return
	var texture_begin=Time.get_ticks_usec()
	var plaster=StandardMaterial3D.new()
	plaster.albedo_texture=texture("plaster-color.jpg")
	await world.get_tree().process_frame
	plaster.normal_enabled=true;plaster.normal_texture=texture("plaster-normal.jpg");plaster.normal_scale=.45
	await world.get_tree().process_frame
	plaster.roughness_texture=texture("plaster-roughness.jpg");plaster.roughness_texture_channel=BaseMaterial3D.TEXTURE_CHANNEL_RED
	await world.get_tree().process_frame
	plaster.uv1_triplanar=true;plaster.uv1_scale=Vector3.ONE*400
	plaster.vertex_color_use_as_albedo=true;plaster.vertex_color_is_srgb=true
	materials.append(plaster)
	for color in ["a7613e","82765b","473b2c","d5bd8e","6f7051"]:
		var m=StandardMaterial3D.new();m.albedo_color=Color(color);m.roughness=.92
		m.vertex_color_use_as_albedo=true;m.vertex_color_is_srgb=true
		materials.append(m)
	var roof_material=ShaderMaterial.new();roof_material.shader=load("res://roma_roof.gdshader")
	roof_material.set_shader_parameter("roof_color",texture("roof-color.jpg"))
	await world.get_tree().process_frame
	roof_material.set_shader_parameter("roof_normal",texture("roof-normal.jpg"))
	await world.get_tree().process_frame
	roof_material.set_shader_parameter("roof_roughness",texture("roof-roughness.jpg"))
	await world.get_tree().process_frame
	materials[1]=roof_material
	texture_prepare_ms=(Time.get_ticks_usec()-texture_begin)/1000.0
	for detailed in [false,true]:
		for kind in TYPES:
			var begin=Time.get_ticks_usec()
			detail=detailed;start()
			match kind:
				"courtyard":
					wing(Vector3(-9,0,0),Vector3(7,5.5,25));wing(Vector3(9,0,0),Vector3(7,5.5,25))
					wing(Vector3(0,0,-9),Vector3(12,5,7));wing(Vector3(0,0,10),Vector3(12,4.5,6))
					box(Vector3(0,.1,0),Vector3(11,.2,13),4)
					for x in [-5.0,5.0]:
						for z in [-5.0,0.0,5.0]:column(Vector3(x,0,z),.3,3.8,3)
				"longhouse":
					wing(Vector3.ZERO,Vector3(11,5,24));porch(Vector3(0,0,14),13,4)
				"shops":
					for x in [-9.0,0.0,9.0]:
						wing(Vector3(x,0,0),Vector3(8,4.3,13));porch(Vector3(x,0,9),8,4)
				"workshop":
					wing(Vector3(-7,0,0),Vector3(10,4.2,23));wing(Vector3(4,0,-7),Vector3(13,3.6,8))
					column(Vector3(6,0,5),3.2,2.7,2);column(Vector3(6,2.7,5),1.5,2,1)
					box(Vector3(5,.25,12),Vector3(11,.5,2),3)
				"storehouse":
					for x in [-5.0,5.0]:
						for z in [-10.0,-3.0,4.0,10.0]:column(Vector3(x,0,z),.65,2,2)
					wing(Vector3(0,1.7,0),Vector3(13,5,26));porch(Vector3(0,0,16),8,5)
				"roundhouse":
					column(Vector3.ZERO,7,3.6,0)
					cone(Vector3(0,3.6,0),8,0.5,5,5)
					box(Vector3(0,1.4,6.8),Vector3(2.1,2.8,.5),3)
				"temple":temple()
			library[kind+str(detailed)]=finish()
			max_prepare_ms=max(max_prepare_ms,(Time.get_ticks_usec()-begin)/1000.0)
			await world.get_tree().process_frame
	prepared=true

func start():
	surfaces=[]
	for m in materials:
		var st=SurfaceTool.new();st.begin(Mesh.PRIMITIVE_TRIANGLES);st.set_material(m);surfaces.append(st)

func finish():
	var mesh=ArrayMesh.new()
	for st in surfaces:
		# Every archetype need not use all material slots.
		var arrays=st.commit_to_arrays()
		if arrays[Mesh.ARRAY_VERTEX]!=null and arrays[Mesh.ARRAY_VERTEX].size()>0:
			st.generate_tangents();st.commit(mesh)
	return mesh

func part(mesh,position,scale_value,material_index,color=Color.WHITE):
	var a=mesh.get_mesh_arrays();var v=a[Mesh.ARRAY_VERTEX];var n=a[Mesh.ARRAY_NORMAL];var uv=a[Mesh.ARRAY_TEX_UV];var indices=a[Mesh.ARRAY_INDEX]
	for i in indices:
		var st=surfaces[material_index]
		st.set_color(color);st.set_normal((n[i]/scale_value).normalized());st.set_uv(uv[i])
		st.add_vertex((v[i]*scale_value+position)*.001)

func box(position,size,index,color=Color.WHITE):part(BoxMesh.new(),position,size,index,color)

func column(position,radius,height,index):cone(position,radius,radius*.91,height,index)

func cone(position,bottom,top,height,index):
	var cylinder=CylinderMesh.new();cylinder.bottom_radius=bottom;cylinder.top_radius=top;cylinder.height=height
	cylinder.radial_segments=12 if detail else 6;cylinder.rings=1
	part(cylinder,position+Vector3(0,height*.5,0),Vector3.ONE,index)

func roof(position,width,length,height):
	# Individually modelled eaves, ridge caps and raised imbrices; no painted roof cubes.
	part(PrismMesh.new(),position+Vector3(0,height*.5,0),Vector3(width,height,length),1)
	box(position+Vector3(0,.05,0),Vector3(width+.25,.24,length+.3),3)
	if not detail:return
	for x in range(-int(width*.5),int(width*.5)+1,2):
		var y=height*(1.0-abs(float(x))/(width*.5))
		box(position+Vector3(x,y+.1,0),Vector3(.22,.20,length+.15),1,Color(.8,.82,.85))
	for z in range(-int(length*.5),int(length*.5),2):
		box(position+Vector3(0,height+.12,z),Vector3(.48,.25,1.8),1,Color(1.08,1.02,.92))

func wing(p,size):
	var width=size.x;var height=size.y;var length=size.z
	# Front facade surrounds a real door opening; recessed dark timber and lintel.
	box(p+Vector3(0,.45,0),Vector3(width+.5,.9,length+.5),2)
	box(p+Vector3(0,height*.5,-length*.5+.3),Vector3(width,height,.6),0)
	for x in [-width*.5+.3,width*.5-.3]:box(p+Vector3(x,height*.5,0),Vector3(.6,height,length),0)
	for side in [-1.0,1.0]:box(p+Vector3(side*(width*.25+.6),height*.5,length*.5-.3),Vector3(width*.5-1.2,height,.6),0)
	box(p+Vector3(0,(height+2.5)*.5,length*.5-.3),Vector3(2.4,height-2.5,.6),0)
	box(p+Vector3(0,1.2,length*.5-.7),Vector3(1.8,2.4,.15),3)
	if detail:
		for x in [-width*.3,width*.3]:
			box(p+Vector3(x,height*.68,length*.5+.02),Vector3(1.1,.95,.12),3)
			box(p+Vector3(x,height*.68-.55,length*.5+.12),Vector3(1.35,.18,.4),2)
		box(p+Vector3(0,2.6,length*.5),Vector3(2.7,.28,.8),3)
	roof(p+Vector3(0,height,0),width+1.5,length+1.5,width*.23)

func porch(p,width,depth):
	for x in [-width*.43,width*.43]:column(p+Vector3(x,0,depth*.35),.22,3,3)
	box(p+Vector3(0,2.95,0),Vector3(width,.3,depth),3)
	if detail:
		for x in range(-int(width*.5),int(width*.5),2):box(p+Vector3(x,3.15,0),Vector3(.16,.15,depth),3)

func temple():
	box(Vector3(0,1.5,0),Vector3(53,3,63),2)
	for i in 15:box(Vector3(0,float(i)*.2+.1,37-i*.4),Vector3(25,.2,.45),2)
	for x in [-16.0,0.0,16.0]:box(Vector3(x,9,-12),Vector3(14,12,30),0)
	for z in [4.0,16.0,27.0]:
		for x in [-22.0,-13.2,-4.4,4.4,13.2,22.0]:
			column(Vector3(x,3,z),.85,12,3)
			box(Vector3(x,15,z),Vector3(2.4,.7,2.4),4)
	box(Vector3(0,15.5,0),Vector3(56,1.4,66),3)
	roof(Vector3(0,16.2,0),59,70,11)
	# Terracotta antefix rhythm, deliberately no Imperial domes or marble orders.
	if detail:
		for z in range(-32,34,4):
			for x in [-29.0,29.0]:column(Vector3(x,16.5,z),.45,1.3,1)
