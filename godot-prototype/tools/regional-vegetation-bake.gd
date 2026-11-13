extends SceneTree
## Offline native rendering of licensed 3D sources. No network at runtime.
const OUT="res://assets/regional-vegetation/"
var viewport
func _initialize():call_deferred("run")
func bounds(node):
	var box=AABB();var first=true
	for child in node.find_children("*","MeshInstance3D",true,false):
		var b=child.global_transform*child.mesh.get_aabb()
		box=b if first else box.merge(b);first=false
	return box
func imported(name):
	var document=GLTFDocument.new();var state=GLTFState.new()
	assert(document.append_from_file(OUT+name+".glb",state)==OK)
	return document.generate_scene(state)
func palm(variant):
	var root_node=Node3D.new()
	var trunk=MeshInstance3D.new();var cylinder=CylinderMesh.new()
	cylinder.height=.014;cylinder.bottom_radius=.00052;cylinder.top_radius=.00032;cylinder.radial_segments=16;cylinder.rings=12
	trunk.mesh=cylinder;trunk.position.y=.007
	var bark=StandardMaterial3D.new();bark.albedo_texture=load("res://assets/vegetation-quality/bark-Color.res");bark.normal_enabled=true;bark.normal_texture=load("res://assets/vegetation-quality/bark-NormalGL.res");bark.uv1_scale=Vector3(2,4,1);bark.roughness=1.;trunk.material_override=bark;root_node.add_child(trunk)
	var surface=SurfaceTool.new();surface.begin(Mesh.PRIMITIVE_TRIANGLES)
	# Arched pinnate fronds: individual narrow leaflets, open silhouettes.
	for frond in 26:
		var angle=frond*2.399963+variant*.37;var direction=Vector3(cos(angle),0,sin(angle));var side=Vector3(-sin(angle),0,cos(angle));var length=.0048+sin(frond*7.+variant)*.0007
		for segment in range(1,21):
			var t=segment/21.;var centre=direction*length*t+Vector3(0,.014+sin(t*PI)*.0017-t*t*.002,0)
			for sign_value in [-1.,1.]:
				var tip=centre+side*sign_value*sin(t*PI)*.00145+direction*.00065-Vector3(0,.00022,0)
				var color=Color(.22,.29,.105).lightened(.11*t+float(frond%3)*.025)
				surface.set_color(color);surface.set_uv(Vector2.ZERO)
				for vertex in [centre-direction*.00007,centre+direction*.00007,tip]:surface.add_vertex(vertex)
	surface.generate_normals();var leaves=MeshInstance3D.new();leaves.mesh=surface.commit()
	var material=StandardMaterial3D.new();material.vertex_color_use_as_albedo=true;material.vertex_color_is_srgb=true;material.cull_mode=BaseMaterial3D.CULL_DISABLED;material.roughness=.9;material.backlight_enabled=true;material.backlight=Color(.08,.10,.035);leaves.material_override=material;root_node.add_child(leaves)
	return root_node
func run():
	RenderingServer.render_loop_enabled=false
	process_frame.connect(func():RenderingServer.force_draw(true))
	viewport=SubViewport.new();viewport.size=Vector2i(384,384);viewport.transparent_bg=true;viewport.own_world_3d=true;viewport.msaa_3d=Viewport.MSAA_4X;viewport.render_target_update_mode=SubViewport.UPDATE_ALWAYS;root.add_child(viewport)
	var environment=WorldEnvironment.new();var env=Environment.new();env.background_mode=Environment.BG_COLOR;env.background_color=Color(0,0,0,0);env.ambient_light_source=Environment.AMBIENT_SOURCE_COLOR;env.ambient_light_color=Color(.87,.92,1.);env.ambient_light_energy=.65;env.tonemap_mode=Environment.TONE_MAPPER_FILMIC;environment.environment=env;viewport.add_child(environment)
	var sun=DirectionalLight3D.new();sun.rotation_degrees=Vector3(-55,-30,0);sun.light_energy=1.2;viewport.add_child(sun)
	var camera=Camera3D.new();camera.projection=Camera3D.PROJECTION_ORTHOGONAL;camera.near=.0001;camera.far=5.;viewport.add_child(camera)
	var quality=load("res://vegetation_quality.gd").new();var records=[];var only=""
	for arg in OS.get_cmdline_user_args():
		if arg.begins_with("--only="):only=arg.trim_prefix("--only=")
	if only!="":records=JSON.parse_string(FileAccess.get_file_as_string(OUT+"impostors.json")).filter(func(entry):return not entry.name.begins_with(only+"-"))
	for kit in ["olive","scots-pine","stone-pine","date-palm"]:
		if only!="" and only!=kit:continue
		for variant in 4:
			var model
			if kit in ["olive","scots-pine"]:model=imported(kit)
			elif kit=="date-palm":model=palm(variant)
			else:
				model=Node3D.new();var node=MeshInstance3D.new();node.mesh=quality.detail_mesh_for(4+variant);model.add_child(node)
			viewport.add_child(model)
			if kit in ["olive","scots-pine"]:
				var b=bounds(model);var target=.014 if kit=="olive" else .030;var scale_value=target/b.size.y;model.scale=Vector3.ONE*scale_value;model.position.y=-b.position.y*scale_value
			elif kit=="stone-pine":
				# Artistic umbrella pine silhouette; source and adaptation documented.
				var original=model.get_child(0).mesh;var mesh=ArrayMesh.new()
				for surface in original.get_surface_count():
					var arrays=original.surface_get_arrays(surface);var points=arrays[Mesh.ARRAY_VERTEX]
					for i in points.size():
						var p=points[i];var crown=smoothstep(.007,.014,p.y);p.x*=lerp(.48,1.35,crown);p.z*=lerp(.48,1.35,crown)
						# Lift the complete needle cards into an elevated umbrella;
						# compressing just their anchors leaves an unnatural skirt.
						p.y=.017+(p.y-.016)*.32 if surface==1 else lerp(p.y*1.5,.0165+(p.y-.011)*.30,crown)
						points[i]=p
					arrays[Mesh.ARRAY_VERTEX]=points;mesh.add_surface_from_arrays(Mesh.PRIMITIVE_TRIANGLES,arrays);mesh.surface_set_material(surface,original.surface_get_material(surface))
				model.get_child(0).mesh=mesh
				# Explicit exposed stem keeps the raised umbrella visibly grounded
				# after needle-card minification at campaign scale.
				var stem=MeshInstance3D.new();var cylinder=CylinderMesh.new();cylinder.height=.018;cylinder.bottom_radius=.0009;cylinder.top_radius=.00045;cylinder.radial_segments=14;stem.mesh=cylinder;stem.position.y=.009
				var bark=StandardMaterial3D.new();bark.albedo_color=Color(.46,.34,.22);bark.albedo_texture=quality.textures["bark-Color"];bark.roughness=1.;stem.material_override=bark;model.add_child(stem)
			if kit=="date-palm":model.scale=Vector3(3.4,2.1,3.4) # Match the existing campaign-diorama palm crown footprint.
			model.rotation.y=variant*.63
			var box=bounds(model);var centre=box.get_center();var width=max(box.size.y,max(box.size.x,box.size.z))*1.12;camera.size=width
			var atlas=Image.create(3072,1152,false,Image.FORMAT_RGBA8)
			for row in 3:
				var elevation=deg_to_rad(15.+row*35.)
				for column in 8:
					var azimuth=TAU*column/8.;camera.position=centre+Vector3(sin(azimuth)*cos(elevation),sin(elevation),cos(azimuth)*cos(elevation))*.5;camera.look_at(centre)
					for frame in 2:await process_frame
					RenderingServer.force_draw(true);atlas.blit_rect(viewport.get_texture().get_image(),Rect2i(0,0,384,384),Vector2i(column*384,row*384))
			var name=kit+"-"+str(variant);assert(atlas.save_png(OUT+name+"-atlas.png")==OK);atlas.fix_alpha_edges();atlas.generate_mipmaps();assert(ResourceSaver.save(ImageTexture.create_from_image(atlas),OUT+name+"-atlas.res",ResourceSaver.FLAG_COMPRESS)==OK)
			records.append({"index":20+["olive","scots-pine","stone-pine","date-palm"].find(kit)*4+variant,"name":name,"widthKm":width,"center":[centre.x,centre.y,centre.z],"root":OUT})
			model.queue_free();await process_frame;print("REGIONAL_ASSET_BAKED ",name)
	records.sort_custom(func(a,b):return a.index<b.index)
	FileAccess.open(OUT+"impostors.json",FileAccess.WRITE).store_string(JSON.stringify(records,"  "))
	viewport.queue_free();for frame in 5:await process_frame
	quit()
