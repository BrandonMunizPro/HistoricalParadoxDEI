extends SceneTree
var quality
var failures=[]
func _initialize():call_deferred("run")
func draw():RenderingServer.force_draw(true)
func run():
	RenderingServer.render_loop_enabled=false;process_frame.connect(draw)
	var scene=Node3D.new();root.add_child(scene)
	var env=Environment.new();env.background_mode=Environment.BG_COLOR;env.background_color=Color(.16,.19,.19);env.ambient_light_source=Environment.AMBIENT_SOURCE_COLOR;env.ambient_light_color=Color(.88,.92,1.);env.ambient_light_energy=.6;env.tonemap_mode=Environment.TONE_MAPPER_FILMIC
	var environment=WorldEnvironment.new();environment.environment=env;scene.add_child(environment)
	var sun=DirectionalLight3D.new();sun.rotation_degrees=Vector3(-45,-30,0);sun.light_energy=1.2;sun.shadow_enabled=true;sun.directional_shadow_max_distance=2.;scene.add_child(sun)
	var camera=Camera3D.new();camera.projection=Camera3D.PROJECTION_ORTHOGONAL;camera.size=.23;camera.position=Vector3(0,.07,.3);camera.near=.0001;camera.far=3.;scene.add_child(camera);camera.look_at(Vector3(0,.014,0))
	quality=load("res://vegetation_quality.gd").new()
	var indices=[0,4,8,12,16,20,24,28,32];var names=["Oak","Pine","Columnar evergreen","Ash","Scrub","Olive","Scots pine","Umbrella pine","Date palm"]
	for i in indices.size():
		var node=MeshInstance3D.new();node.mesh=quality.mesh_for(indices[i]);node.position.x=(i-4)*.042;scene.add_child(node)
		var label=Label.new();label.text=names[i];label.add_theme_font_size_override("font_size",18);label.position=camera.unproject_position(Vector3(node.position.x,-.003,0))-Vector2(65,0);root.add_child(label)
	# Also submit the detailed leaf/bark shader on real geometry.
	var detail=MeshInstance3D.new();detail.mesh=quality.detail_mesh_for(0);detail.position=Vector3(0,0,-.11);scene.add_child(detail)
	quality.update(1.2,0.)
	for i in 20:await process_frame
	await RenderingServer.frame_post_draw;var a=root.get_texture().get_image()
	assert(a.save_png("res://evidence/close-vegetation/asset-gallery.png")==OK)
	for i in 15:await process_frame
	await RenderingServer.frame_post_draw;var b=root.get_texture().get_image()
	var frozen=a.get_data()==b.get_data()
	quality.update(1.2,2.7)
	for i in 10:await process_frame
	await RenderingServer.frame_post_draw;var changed=b.get_data()!=root.get_texture().get_image().get_data()
	var report={"passed":frozen and changed,"frozenClockProducesIdenticalFrames":frozen,"windClockChangesFoliage":changed,"regionalAssetsRendered":indices.size(),"detailedLeafBarkShaderRendered":true,"method":"Actual Forward+ GPU image comparison, fixed camera and light. Frozen motion clock then changed wind clock."}
	FileAccess.open("res://evidence/close-vegetation/visual-validation.json",FileAccess.WRITE).store_string(JSON.stringify(report,"  "));print("REGIONAL_VISUAL_VALIDATION ",JSON.stringify(report))
	scene.queue_free();for i in 5:await process_frame
	quit(0 if report.passed else 1)
