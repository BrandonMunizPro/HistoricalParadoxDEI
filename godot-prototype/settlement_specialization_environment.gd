extends Node3D
## Terrain-following environments are selected with their parent visual stage.
var city_ref:WeakRef
var statistics={"fieldAreaM2":0.,"cultivatedFields":0,"orchardTrees":0,"cropTufts":0}
func setup(city,slot,asset,distance):
	city_ref=weakref(city)
	if not asset.has("environment") or distance>=15:return
	var env=asset.environment;var center=Vector3(slot.anchorM[0]*.001,0,slot.anchorM[1]*.001);var rotation=deg_to_rad(slot.yawDegrees)
	var material=ShaderMaterial.new();material.shader=load("res://settlement_identity_ground.gdshader")
	for name in ["soil_color","soil_normal","soil_roughness"]:material.set_shader_parameter(name,load("res://assets/settlement-identities/"+name.replace("_","-")+".jpg"))
	# Working yard grows with the primary footprint. Fields follow source relief,
	# while the inner yard uses the same local constructed grade as the building.
	var yard={"centerM":[0,0],"sizeM":[asset.footprintM[0]+5,asset.footprintM[1]+5],"rotationDegrees":0.,"crop":"fallow"}
	add_surface(city,center,rotation,yard,material,false)
	for field in env.fields:
		var field_material=material.duplicate();field_material.set_shader_parameter("cultivated",true);field_material.set_shader_parameter("fallow",field.crop=="fallow")
		add_surface(city,center,rotation,field,field_material,true)
		statistics.fieldAreaM2+=field.sizeM[0]*field.sizeM[1];statistics.cultivatedFields+=1
		if distance<3 and field.crop!="fallow":add_crops(city,center,rotation,field)
	var trees={}
	for i in env.treePointsM.size():
		var p=env.treePointsM[i];var local=center+Vector3(p[0]*.001,0,p[1]*.001).rotated(Vector3.UP,rotation)
		var origin=city.center+local;origin.y=city.showcase.surface(local)
		var kind="tree-"+str(i%4)
		if not trees.has(kind):trees[kind]=[]
		trees[kind].append(Transform3D(Basis(Vector3.UP,float(i)*2.399).scaled(Vector3.ONE*.75),origin));statistics.orchardTrees+=1
	for kind in trees:instances(load("res://assets/roma-showcase/"+kind+".res"),trees[kind],true)
	set_meta("specialization",statistics)
func add_surface(city,center,rotation,definition,material,field):
	var st=SurfaceTool.new();st.begin(Mesh.PRIMITIVE_TRIANGLES)
	var half=Vector2(definition.sizeM[0],definition.sizeM[1])*.5;var nx=ceili(half.x/2.);var nz=ceili(half.y/2.)
	material=material.duplicate();material.set_shader_parameter("half_size",half)
	var angle=deg_to_rad(definition.rotationDegrees)+rotation
	var offset=Vector3(definition.centerM[0]*.001,0,definition.centerM[1]*.001).rotated(Vector3.UP,rotation)
	for iz in nz:
		for ix in nx:
			var points=[]
			for q in [Vector2(ix,iz),Vector2(ix+1,iz),Vector2(ix,iz+1),Vector2(ix+1,iz+1)]:
				var uv=Vector2(-half.x+q.x*half.x*2/nx,-half.y+q.y*half.y*2/nz)
				var p=center+offset+Vector3(uv.x*.001,0,uv.y*.001).rotated(Vector3.UP,angle)
				p.y=city.showcase.rendered_surface(p)+.00018
				points.append({"p":city.center+p,"uv":uv})
			for j in [0,1,2,1,3,2]:st.set_normal(Vector3.UP);st.set_uv(points[j].uv);st.add_vertex(points[j].p)
	st.generate_normals();st.generate_tangents();st.index()
	var node=MeshInstance3D.new();node.mesh=st.commit();node.material_override=material;node.cast_shadow=GeometryInstance3D.SHADOW_CASTING_SETTING_OFF;add_child(node)
func add_crops(city,center,rotation,field):
	var transforms=[];var angle=deg_to_rad(field.rotationDegrees)+rotation
	var offset=Vector3(field.centerM[0]*.001,0,field.centerM[1]*.001).rotated(Vector3.UP,rotation)
	var nx=int(field.sizeM[0]/1.1);var nz=int(field.sizeM[1]/1.1)
	for iz in nz:
		for ix in nx:
			if (ix*17+iz*31)%13==0:continue
			var jitter_x=float((ix*13+iz*7)%11-5)*.025;var jitter_z=float((ix*3+iz*19)%9-4)*.024
			var q=Vector3((-field.sizeM[0]*.5+(ix+.5)*1.1+jitter_x)*.001,0,(-field.sizeM[1]*.5+(iz+.5)*1.1+jitter_z)*.001)
			var p=center+offset+q.rotated(Vector3.UP,angle);p.y=city.ground(p)+.0009
			var scale_value=.8+float((ix*13+iz*7)%9)*.04
			transforms.append(Transform3D(Basis(Vector3.UP,float((ix+iz)%7)).scaled(Vector3.ONE*scale_value),city.center+p))
	instances(load("res://assets/settlement-identities/crop-tuft.res"),transforms,false);statistics.cropTufts+=transforms.size()
func instances(mesh,transforms,shadows):
	var mm=MultiMesh.new();mm.transform_format=MultiMesh.TRANSFORM_3D;mm.mesh=mesh;mm.instance_count=transforms.size()
	for i in transforms.size():mm.set_instance_transform(i,transforms[i])
	var node=MultiMeshInstance3D.new();node.multimesh=mm;node.cast_shadow=GeometryInstance3D.SHADOW_CASTING_SETTING_ON if shadows else GeometryInstance3D.SHADOW_CASTING_SETTING_OFF;add_child(node)
