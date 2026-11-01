extends SceneTree
## Quarantined import inspection; does not alter the campaign scene or assets.
const DIR="res://evidence/visual-reset-20261028/source-evaluation/"
func _initialize():call_deferred("run")
func texture(file):
	var image=Image.load_from_file(DIR+file);image.generate_mipmaps();return ImageTexture.create_from_image(image)
func run():
	var scene=Node3D.new();root.add_child(scene)
	var env=Environment.new();env.background_mode=Environment.BG_COLOR;env.background_color=Color("9eafb6");env.ambient_light_source=Environment.AMBIENT_SOURCE_COLOR;env.ambient_light_color=Color("b9cddd");env.ambient_light_energy=.5;env.tonemap_mode=Environment.TONE_MAPPER_FILMIC;env.ssao_enabled=true;env.ssao_radius=.6;env.ssao_intensity=1
	var e=WorldEnvironment.new();e.environment=env;scene.add_child(e)
	var sun=DirectionalLight3D.new();sun.rotation_degrees=Vector3(-35,-35,0);sun.light_energy=1.6;sun.light_color=Color("fff1db");sun.shadow_enabled=true;sun.directional_shadow_max_distance=150;scene.add_child(sun)
	var ground=MeshInstance3D.new();var plane=PlaneMesh.new();plane.size=Vector2(150,150);ground.mesh=plane
	var gm=StandardMaterial3D.new();gm.albedo_color=Color("746e53");gm.roughness=1;ground.material_override=gm;scene.add_child(ground)
	for i in 4:
		var variant=["a","b","c","d"][i];var model=JSON.parse_string(FileAccess.get_file_as_string(DIR+"house-"+variant+".json"))
		var arrays=[];arrays.resize(Mesh.ARRAY_MAX)
		var v=PackedVector3Array();var n=PackedVector3Array();var u=PackedVector2Array();var u2=PackedVector2Array()
		for j in model.positions.size()/3:v.append(Vector3(model.positions[j*3],model.positions[j*3+1],model.positions[j*3+2]));n.append(Vector3(model.normals[j*3],model.normals[j*3+1],model.normals[j*3+2]))
		for j in model.uv.size()/2:u.append(Vector2(model.uv[j*2],model.uv[j*2+1]))
		for j in model.uv2.size()/2:u2.append(Vector2(model.uv2[j*2],model.uv2[j*2+1]))
		arrays[Mesh.ARRAY_VERTEX]=v;arrays[Mesh.ARRAY_NORMAL]=n;arrays[Mesh.ARRAY_TEX_UV]=u
		if u2.size()==u.size():arrays[Mesh.ARRAY_TEX_UV2]=u2
		var mesh=ArrayMesh.new();mesh.add_surface_from_arrays(Mesh.PRIMITIVE_TRIANGLES,arrays)
		var mat=StandardMaterial3D.new();mat.albedo_texture=texture("rome_struct_2.png");mat.normal_enabled=true;mat.normal_texture=texture("rome_struct_2_norm.png");mat.normal_scale=.5;mat.roughness=.85;mat.cull_mode=BaseMaterial3D.CULL_DISABLED
		mat.ao_enabled=true;mat.ao_texture=texture("rome_house_"+variant+".png");mat.ao_on_uv2=true;mat.ao_light_affect=.6
		var node=MeshInstance3D.new();node.mesh=mesh;node.material_override=mat;node.position=Vector3((i%2)*25-12.5,-model.bounds[1][0],floori(i/2.0)*30-15);scene.add_child(node)
	var camera=Camera3D.new();camera.position=Vector3(45,43,62);scene.add_child(camera);camera.look_at(Vector3(0,3,0));camera.fov=45;camera.current=true
	for i in 120:await process_frame
	RenderingServer.force_draw();assert(root.get_texture().get_image().save_png(DIR+"godot-house-evaluation.png")==OK)
	print("ASSET_EVALUATION_RENDERED four CC-BY-SA meshes; campaign unchanged")
	quit()
